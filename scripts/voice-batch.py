"""Narrate a lesson's unmade sentences in batches: many sentences in one
VoxCPM request, the take cut apart at the pauses between sentences.

A VoxCPM request costs about 90 s whatever its length (measured
2026-11-20: a two word piece took 91 s, eleven sentences, 45 s of
audio, 92 s), so this sends N sentences at once, joined with ". ",
and cuts the take at its sentence pauses (0.9 to 1.3 s; a comma's are
0.3 to 0.7 s). Each cut is checked by whisper as scripts/voice.py
checks a sentence and written into work/voice-cache/ under the name
voice.py would give it (KEY.wav and KEY.txt; a spliced sentence's text
pieces as KEY.J.wav and KEY.J.txt, which voice.py then splices without
asking VoxCPM again). Whatever fails goes into the next batch, up to
--tries takes in all, then is kept flagged UNVERIFIED as voice.py does;
a take that cannot be cut into the right number of sentences puts its
items back in the queue. What is left is made by voice.py as usual.
  scripts/voice-batch.py SLUG [--size N]       # batches of N (default 12)
  scripts/voice-batch.py SLUG --list           # what would be sent, no server
  scripts/voice-batch.py --cut WAV N [--text SENT] [--out DIR] [--heard]   # the cutter alone
"""

import argparse
import concurrent.futures
import fcntl
import hashlib
import json
import math
import os
import re
import subprocess
import sys
import tempfile
import time
from array import array
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import voice  # noqa: E402

ROOT = voice.ROOT
FRAME = 0.02  # seconds per level frame
RATE = 16000  # the rate levels are measured at
SENTENCE_PAUSE = 0.8  # seconds: a pause this long or longer ends a sentence
TUNE = (0.6, 1.2)  # the range searched when 0.8 s gives the wrong count
LOW, HIGH = 0.6, 1.6  # a sentence's pace (seconds a character) against the take's median


def levels(wav: Path) -> list[float]:
    """The take's level, in dB, every FRAME seconds."""
    raw = subprocess.run(["sox", str(wav), "-t", "raw", "-r", str(RATE), "-c", "1", "-b", "16", "-e", "signed", "-"],
                         check=True, capture_output=True).stdout
    a = array("h")
    a.frombytes(raw[: len(raw) // 2 * 2])
    n = int(RATE * FRAME)
    out = []
    for i in range(0, len(a) - n + 1, n):
        e = sum(x * x for x in a[i:i + n]) / n
        out.append(10 * math.log10(e / 32768 ** 2 + 1e-12))
    return out


def silent_frames(db: list[float]) -> list[bool]:
    """Which frames are pauses. The threshold follows the take: VoxCPM's
    noise floor rises through a long take (the batch.wav of 2026-11-20
    went from -55 dB to -38 dB while speech got louder), so a fixed level
    (voice.pauses(), -35 dB) finds no pause late in it. A frame is silent
    below the local floor (the quietest 100 ms within 3 s) plus a quarter
    of the way to the local peak, at least 6 dB."""
    k = 5
    smooth = [sum(db[max(0, i - k // 2):i + k // 2 + 1]) / len(db[max(0, i - k // 2):i + k // 2 + 1]) for i in range(len(db))]
    w = int(3 / FRAME)
    out = []
    for i, d in enumerate(db):
        win = smooth[max(0, i - w):i + w + 1]
        floor, peak = min(win), max(win)
        out.append(d < floor + max(6.0, 0.25 * (peak - floor)))
    return out


def inner_pauses(wav: Path) -> tuple[list[tuple[float, float]], float, float]:
    """The pauses inside a take, (start, end) in seconds, and where its
    speech starts and ends. A blip of 40 ms or less inside a pause (a
    click, a breath) does not split it."""
    db = levels(wav)
    quiet = silent_frames(db)
    spoken_ = [i for i, q in enumerate(quiet) if not q]
    if not spoken_:
        return [], 0.0, 0.0
    first, last = spoken_[0], spoken_[-1]
    runs, i = [], first
    while i <= last:
        if quiet[i]:
            j = i
            while j <= last and quiet[j]:
                j += 1
            runs.append([i, j])
            i = j
        else:
            i += 1
    merged = []
    for r in runs:
        if merged and r[0] - merged[-1][1] <= 2:
            merged[-1][1] = r[1]
        else:
            merged.append(r)
    return [(s * FRAME, e * FRAME) for s, e in merged], first * FRAME, (last + 1) * FRAME


def cut_points(gaps: list[tuple[float, float]], n: int) -> tuple[list[tuple[float, float]], float] | None:
    """The n - 1 pauses that end sentences, and the threshold that picks
    them: SENTENCE_PAUSE if it gives n sentences, else a threshold within
    TUNE that does (the middle of the range that works); None if none."""
    if n == 1:
        return [], SENTENCE_PAUSE
    lengths = sorted((e - s for s, e in gaps), reverse=True)
    if len(lengths) < n - 1:
        return None
    hi = lengths[n - 2]  # the shortest pause that must be a cut
    lo = lengths[n - 1] if len(lengths) >= n else 0.0  # the longest that must not
    if hi <= lo:
        return None
    if lo < SENTENCE_PAUSE <= hi:
        t = SENTENCE_PAUSE
    else:
        a, b = max(lo, TUNE[0]), min(hi, TUNE[1])
        if a >= b and not (a == b == hi):
            return None
        t = (a + b) / 2 if a < b else hi
    return [g for g in gaps if g[1] - g[0] >= t], t


def plausible(cuts: list[tuple[float, float]], start: float, end: float, texts: list[str]) -> bool:
    """Whether each sentence's length fits its text: seconds a character
    within LOW to HIGH times the take's median pace. Pause lengths
    alone can pick a comma for a sentence end (in the batch.wav of
    2026-11-20 commas took up to 1.1 s, sentence ends as little as 0.86 s);
    a sentence then holds two and its neighbor half of one."""
    edges = [start] + [x for s, e in cuts for x in (s, e)] + [end]
    secs = [edges[2 * i + 1] - edges[2 * i] for i in range(len(texts))]
    chars = [len(t) + 8 for t in texts]
    paces = sorted(s / c for s, c in zip(secs, chars))
    pace = paces[len(paces) // 2]  # the median: two sentences in one cut double theirs
    return all(LOW < s / (c * pace) < HIGH for s, c in zip(secs, chars))


def whisper_words(wav: Path, model: Path) -> list[tuple[float, float, str]]:
    """What whisper hears in a take, word by word: (start, end, word)."""
    out = subprocess.run(["whisper-cli", "-m", str(model), "-f", str(wav), "-np", "-ml", "1", "-sow"],
                         check=True, capture_output=True, text=True).stdout
    stamp = lambda h, m, s: int(h) * 3600 + int(m) * 60 + float(s)  # noqa: E731
    got = []
    for line in out.splitlines():
        m = re.match(r"\[(\d+):(\d+):([\d.]+) --> (\d+):(\d+):([\d.]+)\]\s*(.*)", line)
        if m and m.group(7).strip():
            got.append((stamp(*m.group(1, 2, 3)), stamp(*m.group(4, 5, 6)), m.group(7).strip()))
    return got


def aligned_spans(gaps: list[tuple[float, float]], texts: list[str], heard_words: list[tuple[float, float, str]],
                  start: float, end: float) -> list[tuple[float, float] | None]:
    """Each sentence's place in the take, found with whisper's word times:
    the words sent and the words heard lined up (difflib); between the last
    word heard of one sentence and the first of the next, the longest pause
    is the cut. A sentence the voice left out (half its words not heard)
    or with no pause to cut at is None; the others are still cut and
    checked. Short sentences sent together come out as a list ("Create a
    variable, enter a loop, take an element", 2026-11-20), 0.3 to 0.6 s
    apart, so pause length alone cannot find them."""
    import difflib
    sent, owner = [], []
    for i, t in enumerate(texts):
        w = voice.words(t)
        sent += w
        owner += [i] * len(w)
    heard_, times = [], []
    for s, e, w in heard_words:
        for x in voice.words(w):
            heard_.append(x)
            times.append((s, e))
    # Whisper's word times are rough (off by up to 0.7 s in a take of
    # 2026-11-20): a word's end runs on into the pause after it, and its
    # start can fall inside the pause before or after. So a cut is looked
    # for from half a second before the last matched word of one sentence
    # starts to where the second of the next starts.
    starts: dict[int, list[float]] = {}
    for blk in difflib.SequenceMatcher(None, sent, heard_, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            starts.setdefault(owner[blk.a + k], []).append(times[blk.b + k][0])
    found = [i for i in range(len(texts)) if len(starts.get(i, [])) * 2 >= max(1, len(voice.words(texts[i])))]
    last = {i: starts[i][-1] - 0.5 for i in found}
    late = {i: starts[i][1] if len(starts[i]) > 1 else starts[i][0] + 0.3 for i in found}

    def longest(lo: float, hi: float, least: float = 0.1):
        # In order: never a pause at or before the last cut.
        lo = max(lo, after[0])
        inside = [g for g in gaps if lo <= (g[0] + g[1]) / 2 <= hi and g[1] - g[0] >= least]
        return max(inside, key=lambda g: g[1] - g[0]) if inside else None

    spans: list[tuple[float, float] | None] = [None] * len(texts)
    after = [start]
    for n_, i in enumerate(found):
        if n_ == 0:
            g = None if i == 0 else longest(starts[i][0] - 1.0, late[i])
            a = g[1] if g else start
            after[0] = a
        else:
            j = found[n_ - 1]
            g = longest(last[j], late[i]) if last[j] < late[i] else None
            if g is None:
                spans[j] = None
                continue
            a = g[1]
            after[0] = a
        if n_ == len(found) - 1:
            g = None if i == len(texts) - 1 else longest(last[i], last[i] + 1.5)
            b = g[0] if g else end
        else:
            k = found[n_ + 1]
            g = longest(last[i], late[k]) if last[i] < late[k] else None
            if g is None:
                continue
            b = g[0]
        if b > a:
            spans[i] = (a, b)
    return spans


def cut(wav: Path, texts: list[str], out_dir: Path, model: Path | None = None, stem: str = "seg") -> tuple[list[Path | None], str] | None:
    """The take cut into one clip a text sent (out_dir/STEM-I.wav; None for
    a sentence that could not be placed), each trimmed as voice.tts() trims
    a take, and how the cuts were found. First by pause length
    (SENTENCE_PAUSE, else a threshold within TUNE) if the lengths that
    gives fit the texts (plausible); else, given a whisper model, by
    whisper's word times (aligned_spans); None if no sentence is placed."""
    n = len(texts)
    gaps, start, end = inner_pauses(wav)
    picked = cut_points(gaps, n)
    if picked is not None and plausible(picked[0], start, end, texts):
        edges = [start] + [x for g in picked[0] for x in g] + [end]
        spans = [(edges[2 * i], edges[2 * i + 1]) for i in range(n)]
        how = f"pauses of {picked[1]:.2f} s or more"
    elif model is not None:
        spans = aligned_spans(gaps, texts, whisper_words(wav, model), start, end)
        # A span far too long or short for its text holds more or less than
        # its sentence (a misplaced cut): not placed.
        placed = [(i, x) for i, x in enumerate(spans) if x]
        if placed:
            paces = sorted((x[1] - x[0]) / (len(texts[i]) + 8) for i, x in placed)
            pace = paces[len(paces) // 2]
            for i, x in placed:
                if not 0.33 < (x[1] - x[0]) / ((len(texts[i]) + 8) * pace) < 3.0:
                    spans[i] = None
        if not any(spans):
            return None
        how = f"whisper's word times ({sum(1 for x in spans if x)} of {n} placed)"
    else:
        return None
    total = voice.seconds(wav)
    out_dir.mkdir(parents=True, exist_ok=True)
    segs: list[Path | None] = []
    for i, span in enumerate(spans):
        if span is None:
            segs.append(None)
            continue
        # A little of the pause kept on each side: a soft last consonant
        # or first breath is not lost.
        s, e = max(0.0, span[0] - 0.05), min(span[1] + 0.1, total)
        seg = out_dir / f"{stem}-{i}.wav"
        voice.sox(str(wav), "-r", "44100", "-c", "1", str(seg), "trim", f"{s:.3f}", f"={e:.3f}",
                  "silence", "1", "0.05", "0.3%", "reverse", "silence", "1", "0.05", "0.3%", "reverse")
        segs.append(seg)
    return segs, how


def sent_text(items: list[dict]) -> str:
    """What one request sends: each item its own sentence."""
    out = []
    for it in items:
        t = it["send"].rstrip(" ,.")
        out.append(t if t.endswith(("?", "!")) else t + ".")
    return " ".join(out)


def request(a, client, prompt: str, text: str, out: Path, what: str):
    """One voice request through voxq (voice.voxq_call: queued, one at a
    time). Returns the client (unused, kept for the callers) and the
    seconds the request took, the queue included."""
    t0 = time.time()
    raw = voice.voxq_call(text, a.reference, prompt, a.cfg, a.steps, what)
    voice.sox(str(raw), "-r", "44100", "-c", "1", str(out))
    raw.unlink(missing_ok=True)
    return client, time.time() - t0

def unmade(a, sample: str, prompt: str) -> list[dict]:
    """Every sentence of the lesson not in the cache, as voice.py keys it;
    for a spliced sentence (@words), each text piece not yet made."""
    lesson = json.loads((ROOT / "lessons" / a.slug / "lesson.json").read_text())
    problems = [p for s in lesson["scenes"] if s.get("narration") for p in voice.lint(s["id"], s["narration"])]
    if problems:
        voice.fail("the narration needs rewording (just voice SLUG --check):\n  " + "\n  ".join(problems))
    cache = a.cache
    items = []
    for scene in lesson["scenes"]:
        for k, raw in enumerate(voice.sentences(scene.get("narration") or "")):
            sentence, shown = voice.spoken(raw), voice.written(raw)
            parts = voice.pieces(sentence)
            used = [w for w in parts if w.startswith("@")]
            if any(not voice.word_file(w).exists() for w in used):
                continue  # voice.py refuses it: no word clip
            key = hashlib.sha256(json.dumps([sentence, sample, prompt, a.steps, a.cfg] + [hashlib.sha256(voice.word_file(w).read_bytes()).hexdigest() for w in used]).encode()).hexdigest()[:16]
            clip = cache / f"{key}.wav"
            if clip.exists() and (cache / f"{key}.txt").exists():
                continue
            where = f"{scene['id']} {k + 1}"
            if not used:
                items.append({"kind": "sentence", "key": key, "where": where, "send": voice.bare(sentence),
                              "wav": clip, "txt": clip.with_suffix(".txt"),
                              "ok": lambda got, s=sentence, w=shown, r=raw: voice.same(got, s, w) or voice.heard_right(got, r),
                              "near": lambda got, s=sentence, w=shown: voice.near(got, s, w)})
                continue
            for j, part in enumerate(parts):
                if part.startswith("@"):
                    continue
                wav, txt = clip.with_suffix(f".{j}.wav"), clip.with_suffix(f".{j}.txt")
                if wav.exists() and txt.exists():
                    continue
                items.append({"kind": "piece", "key": key, "where": f"{where} piece {j}", "send": voice.bare(part),
                              "wav": wav, "txt": txt,
                              "ok": lambda got, p=part: voice.same(got, p, voice.bare(p)),
                              "near": lambda got, p=part: voice.near(got, p, voice.bare(p))})
    return items


def run(a) -> None:
    for f in (a.reference, a.prompt_text, a.whisper_model):
        if not f.is_file():
            voice.fail(f"missing {f}")
    prompt = " ".join(a.prompt_text.read_text().split())
    sample = hashlib.sha256(a.reference.read_bytes()).hexdigest()
    cache = a.cache
    cache.mkdir(parents=True, exist_ok=True)
    items = unmade(a, sample, prompt)
    bad = [f"{it['where']}: {it['send']!r}: {p}" for it in items for p in voice.tts_problems(it["send"])]
    if bad:
        # Left to voice.py, which refuses them with the same message.
        print("batch: not fit to send to VoxCPM, left out:\n  " + "\n  ".join(bad), flush=True)
        items = [it for it in items if not voice.tts_problems(it["send"])]
    if a.list:
        for it in items:
            print(f"batch: {it['where']}: {it['send']!r}")
        print(f"batch: {a.slug}: {len(items)} item(s) to make, {-(-len(items) // a.size)} request(s) of {a.size}")
        return
    # One maker a sentence (voice.py's KEY.lock): a sentence another
    # narration is making now is left to it.
    locks, queue = {}, []
    for it in items:
        if it["key"] not in locks:
            g = open(cache / f"{it['key']}.lock", "a")
            try:
                fcntl.flock(g, fcntl.LOCK_EX | fcntl.LOCK_NB)
                locks[it["key"]] = g
            except BlockingIOError:
                g.close()
                locks[it["key"]] = None
        if locks[it["key"]] and not (it["wav"].exists() and it["txt"].exists()):
            queue.append(it | {"tries": 0, "best": None})
    print(f"batch: {a.slug}: {len(queue)} item(s) to make, in requests of {a.size}", flush=True)
    work = ROOT / "work" / "voice-batch" / a.slug
    work.mkdir(parents=True, exist_ok=True)
    client, n, made, kept, left, spent = None, 0, 0, 0, 0, []
    while queue and (a.requests is None or n < a.requests):
        batch, queue = queue[:a.size], queue[a.size:]
        n += 1
        take = work / f"batch-{n}.wav"
        text = sent_text(batch)
        client, took = request(a, client, prompt, text, take, f"{a.slug} batch {n}")
        spent.append(took)
        got_cut = cut(take, [it["send"] for it in batch], work / f"batch-{n}", a.whisper_model)
        segs, how = got_cut or ([None] * len(batch), "nothing: no sentence could be placed")
        todo = [(it, seg) for it, seg in zip(batch, segs) if seg is not None]
        with concurrent.futures.ThreadPoolExecutor(4) as pool:
            heard = list(pool.map(lambda x: voice.heard(x[1], a.whisper_model), todo))
        heard_of = {id(it): got for (it, _), got in zip(todo, heard)}
        good, retry, unplaced = 0, [], []
        for it, seg in zip(batch, segs):
            it["tries"] += 1
            if seg is None:
                # Not found in the take (left out, or no pause to cut at).
                if it["tries"] < a.tries:
                    unplaced.append(it)
                    print(f"batch:   {it['where']}: not placed in the take (try {it['tries']})", flush=True)
                    continue
                if it["best"] is None:
                    left += 1
                    print(f"batch:   {it['where']}: left to voice.py (never placed in a take)", flush=True)
                    continue
            else:
                got = heard_of[id(it)]
                if it["ok"](got):
                    voice.sox(str(seg), str(it["wav"]))
                    it["txt"].write_text(got + "\n")
                    good += 1
                    made += 1
                    print(f"batch:   {it['where']}: made, heard {got!r}", flush=True)
                    continue
                close = it["near"](got)
                if it["best"] is None or (close and not it["best"][2]):
                    keep = work / f"best-{it['key']}-{it['where'].split()[-1]}.wav"
                    voice.sox(str(seg), str(keep))
                    it["best"] = (keep, got, close)
                if it["tries"] < a.tries:
                    retry.append(it)
                    print(f"batch:   {it['where']}: failed (try {it['tries']}), heard {got!r}", flush=True)
                    continue
            keep, got_, _ = it["best"]
            voice.sox(str(keep), str(it["wav"]))
            it["txt"].write_text(voice.UNVERIFIED + got_ + "\n")
            kept += 1
            print(f"batch:   {it['where']}: kept unverified, for a listen, heard {got_!r}", flush=True)
        print(f"batch {n}: {len(batch)} sent, {took:.0f} s, cut by {how}; {good} made, "
              f"{len(retry)} misheard and {len(unplaced)} not placed go again", flush=True)
        # Misheard ones first; ones not placed last, so they go with other
        # sentences (the voice once added a twelfth to eleven alike).
        queue = retry + queue + unplaced
    for g in locks.values():
        if g:
            g.close()
    left += len(queue)  # --requests reached
    each = f", {sum(spent) / len(spent):.0f} s a request" if spent else ""
    print(f"batch: {a.slug}: {n} request(s){each}; {made} made, {kept} kept unverified, {left} left to voice.py", flush=True)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("slug", nargs="?")
    ap.add_argument("--size", type=int, default=12, help="sentences a request (default 12)")
    ap.add_argument("--tries", type=int, default=3, help="takes an item gets in all before it is kept unverified (default 3)")
    ap.add_argument("--list", action="store_true", help="only list what would be sent")
    ap.add_argument("--requests", type=int, default=None, help="stop after this many requests (the rest is left to voice.py)")
    ap.add_argument("--cache", type=Path, default=ROOT / "work" / "voice-cache",
                    help="the cache to fill (default work/voice-cache; another, empty one to try batching on made sentences)")
    ap.add_argument("--cut", nargs=2, metavar=("WAV", "N"), help="only cut WAV into N sentences (no server)")
    ap.add_argument("--out", type=Path, help="for --cut: where the sentences go (default a temporary directory)")
    ap.add_argument("--heard", action="store_true", help="for --cut: what whisper hears in each")
    ap.add_argument("--text", help="for --cut: the text that was sent (its sentences; lets whisper place the cuts if the pauses cannot)")
    ap.add_argument("--server", default=os.environ.get("XETAL_TTS", "http://queenbee.local:7860"))
    ap.add_argument("--reference", type=Path, default=Path(os.environ.get(
        "XETAL_VOICE", ROOT.parent / "video-publishing" / "reference" / "voice" / "mike-medium-ref-1.wav")))
    ap.add_argument("--prompt-text", type=Path, default=None, help="default: prompt-text.txt beside the sample")
    ap.add_argument("--whisper-model", type=Path, default=Path(os.environ.get(
        "XETAL_WHISPER_MODEL", Path.home() / ".local" / "share" / "whisper-cpp" / "models" / "ggml-medium.en.bin")))
    ap.add_argument("--steps", type=int, default=15)
    ap.add_argument("--cfg", type=float, default=2.0)
    ap.add_argument("--lock", type=Path, default=Path(os.environ.get(
        "XETAL_TTS_LOCK", Path.home() / ".cache" / "voxcpm-tts.lock")))
    a = ap.parse_args()
    a.prompt_text = a.prompt_text or a.reference.parent / "prompt-text.txt"
    if a.cut:
        wav, n = Path(a.cut[0]), int(a.cut[1])
        gaps, start, end = inner_pauses(wav)
        print(f"cut: speech {start:.2f}-{end:.2f} s; pauses: {', '.join(f'{s:.2f}+{e - s:.2f}' for s, e in gaps)}")
        out = a.out or Path(tempfile.mkdtemp())
        texts = voice.sentences(a.text) if a.text else ["x" * 20] * n
        if len(texts) != n:
            voice.fail(f"cut: --text has {len(texts)} sentences, not {n}")
        got = cut(wav, texts, out, a.whisper_model if a.text else None)
        if got is None:
            voice.fail(f"cut: neither the pauses nor whisper place any of {n} sentences")
        segs, how = got
        print(f"cut: {sum(1 for x in segs if x)} of {n} sentences, by {how}, in {out}")
        for i, s in enumerate(segs):
            print(f"cut:   {i}: not placed" if s is None else
                  f"cut:   {s.name} {voice.seconds(s):.2f} s" + (f" {voice.heard(s, a.whisper_model)!r}" if a.heard else ""))
        return
    if not a.slug:
        ap.error("SLUG is needed (or --cut)")
    run(a)


if __name__ == "__main__":
    main()
