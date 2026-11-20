"""Narrate a lesson in the author's cloned voice (scripts/voice.sh runs it).

Each scene's `narration` is split into sentences; each sentence goes
on its own call (one at a time, never in parallel: every narration on
this machine queues on one lock, --lock) to VoxCPM's Gradio
API with the author's voice sample and its exact transcript, the sample
and transcript this year's narrated shorts used. Every clip is checked
by a local whisper (whisper-cli, ggml-medium.en): one whose words are
not the sentence's is made again, up to --tries times. Clips are kept
in work/voice-cache/ by a hash of everything that made them, so only a
changed sentence is made again.

A scene's audio (work/SLUG/voice/ID.wav) is a short lead, its
sentences with a pause between, and a tail. The scene's `seconds` in
lesson.json becomes that audio's length (scene lengths follow the
narration), and lessons/SLUG/voice.json records what was spoken, what
whisper heard, and the sample used.
"""

import argparse
import contextlib
import fcntl
import os
import hashlib
import json
import math
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEAD, GAP, TAIL = 0.4, 0.35, 0.7  # seconds of silence around and between sentences
END = 1.8  # the last scene's tail: time to read it before the video ends
MAX_SENTENCE = 140  # characters: longer sentences come out garbled


# A cached take whisper never matched: its note starts with this.
UNVERIFIED = "UNVERIFIED: "


def fail(msg: str) -> None:
    print(f"voice: {msg}", file=sys.stderr)
    sys.exit(1)


# Words spelled one way and said two (read: reed or red; live: liv or
# lyve). Whisper cannot tell which was said, so whoever writes or
# reviews a script decides each one (the author, 2026-11-18, after "code
# is read" came out as reed): mark it {read|red} to have VoxCPM say a
# respelling while captions show the word, {live|live} when the usual
# reading is right, or reword it away. Words whose two readings are
# rare in a lesson (row, use, does) are not listed.
HETERONYMS = set("""
read reads lead leads live lives close closes closed wind winds tear tears wound
record records present presents object objects minute content desert produce
project projects bass bow bows refuse subject permit invalid polish separate
estimate estimates attribute attributes conduct contract convert converts increase
increases decrease decreases export exports import imports progress address
alternate console digest entrance excuse intimate moderate perfect rebel recall
resume sow dove graduate insert inserts compound conflict contest contrast convict
discount extract incline insult invite protest research survey suspect torment
transfer update updates upset axes tears wind content
""".split())
MARK = re.compile(r"\{([^{}|]+)\|([^{}|]*)\}")


def written(text: str) -> str:
    """The narration as shown: {read|red} is read (captions, voice.json)."""
    return MARK.sub(lambda m: m.group(1), text)


def bare(sentence: str) -> str:
    """What VoxCPM is given: the sentence with no unusual punctuation (the
    author, 2026-11-20: only commas and periods, a rare ? or !; hyphens,
    apostrophes, parentheses and the like are said unreliably).
    Contractions are written out first, so dropping an apostrophe cannot
    make "we'll" into "well"; hyphens and the rest become spaces. The
    cache key stays the spoken sentence, so takes already made and
    listened to are kept."""
    t = sentence.replace("\u2019", "'")
    for k, v in CONTRACTIONS.items():
        t = re.sub(rf"\b{re.escape(k)}\b", v, t, flags=re.I)
    t = re.sub(r"\b(\w+)n't\b", lambda m: {"won": "will", "can": "can", "shan": "shall"}.get(m.group(1).lower(), m.group(1)) + " not", t)
    t = re.sub(r"'ll\b", " will", t)
    t = re.sub(r"'ve\b", " have", t)
    t = re.sub(r"'re\b", " are", t)
    t = re.sub(r"'m\b", " am", t)
    t = re.sub(r"'d\b", " would", t)
    t = re.sub(r"[^A-Za-z0-9 ,.?!]+", " ", t)
    t = re.sub(r"\s+([,.?!])", r"\1", t)
    return " ".join(t.split())


def tts_problems(t: str) -> list[str]:
    """What is wrong with text about to be sent to VoxCPM (the author,
    2026-11-20): only letters, spaces, commas and periods (a rare ? or !);
    no digits; acronyms spelled out phonetically, never as capitals
    ("APL") or single letters ("A P L", "A, pee")."""
    out = []
    bad = sorted(set(re.findall(r"[^A-Za-z ,.?!]", t)))
    if bad:
        out.append(f"unusual characters {''.join(bad)!r}")
    if re.search(r"[.?!].", t.rstrip()):
        out.append("a period, ? or ! before the end")
    if re.search(r"\b[A-Z]{2,}\b", t):
        out.append(f"an acronym in capitals ({', '.join(re.findall(r'\\b[A-Z]{2,}\\b', t))}): spell it phonetically")
    words_ = re.findall(r"[A-Za-z]+", t)
    for i, w in enumerate(words_):
        if len(w) == 1 and w not in ("I", "a") and not (w == "A" and i == 0 and i + 1 < len(words_) and len(words_[i + 1]) > 1 and not re.search(r"\bA,", t)):
            out.append(f"a single letter {w!r}: spell it phonetically (ay, bee, see)")
            break
    return out


def spoken(text: str) -> str:
    """The narration as sent to VoxCPM: {read|red} is red; {live|} is live."""
    return MARK.sub(lambda m: m.group(2) or m.group(1), text)


def lint(scene_id: str, raw: str) -> list[str]:
    """What VoxCPM says badly: anything but words, commas and periods; an
    unmarked heteronym."""
    problems = []
    unmarked = MARK.sub(" ", raw)
    for w in sorted({w for w in re.findall(r"[A-Za-z]+", unmarked) if w.lower() in HETERONYMS}):
        problems.append(f"{w!r} is said two ways: mark it {{{w}|respelling}} or {{{w}|{w}}} once you have decided, or reword")
    if re.search(r"[{}|]", unmarked):
        problems.append("a broken {written|spoken} mark")
    text = spoken(raw)
    if re.search(r"[?!:;()\"%&/*+=<>\[\]{}_#@0-9]", text):
        problems.append("only words, commas, periods and apostrophes (no ? ! : ; symbols or digits)")
    if re.search(r"\b[A-Z]{2,}\b", text):
        problems.append("no all-caps words")
    # VoxCPM says a possessive unreliably ("APL's symbols" came out as
    # "Not APL symbols"; the author, 2026-11-20): reword it ("the types of
    # Haskell"). Contractions (it's, that's) are fine.
    for m in re.finditer(r"\b([A-Za-z]+)'s\b", text):
        if m.group(0).lower() not in CONTRACTIONS:
            problems.append(f"a possessive, {m.group(0)!r}: reword it without the apostrophe")
    for s in sentences(text):
        if len(s) > MAX_SENTENCE:
            problems.append(f"a sentence over {MAX_SENTENCE} characters: {s!r}")
    return [f"scene {scene_id}: {p}" for p in problems]


def sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=\.)\s+", text.strip()) if s.strip()]


ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def spelled(n: int) -> str:
    """A number as it is spoken (whisper writes "fifty" as 50)."""
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])
    if n < 1000:
        return ONES[n // 100] + " hundred" + ("" if n % 100 == 0 else " " + spelled(n % 100))
    if n < 1000000:
        return spelled(n // 1000) + " thousand" + ("" if n % 1000 == 0 else " " + spelled(n % 1000))
    return str(n)


# Letters spelled for the voice, by name.
LETTER_NAMES = {"ay": "a", "bee": "b", "see": "c", "dee": "d", "ee": "e", "ecks": "x", "ex": "x", "gee": "g", "jay": "j",
                "kay": "k", "el": "l", "elle": "l", "elles": "ls", "em": "m", "en": "n", "pee": "p", "queue": "q", "tee": "t", "you": "u"}

CONTRACTIONS = {"here's": "here is", "it's": "it is", "that's": "that is", "there's": "there is",
                "what's": "what is", "let's": "let us", "you're": "you are", "we're": "we are",
                "they're": "they are", "isn't": "is not", "doesn't": "does not", "don't": "do not",
                "can't": "cannot", "won't": "will not", "i'll": "i will", "you'll": "you will"}


def paired(digits: str) -> str:
    """A number as a year or a model number is said: 1972 nineteen
    seventy-two, 2741 twenty-seven forty-one, 1802 eighteen oh two, 5100
    fifty-one hundred, 360 three sixty, 029 oh twenty-nine."""
    if digits.startswith("0") and len(digits) > 1:
        return "oh " + paired(digits[1:])
    n = int(digits)
    if len(digits) not in (3, 4) or n % 100 < 10 and n % 100:
        return spelled(n) if n % 100 >= 10 or len(digits) not in (3, 4) else spelled(n // 100) + " oh " + spelled(n % 100)
    return spelled(n // 100) + (" hundred" if n % 100 == 0 else " " + spelled(n % 100))


def words(text: str, pairs: bool = False) -> list[str]:
    """The words, as compared: whisper writes 50 for fifty and here's for
    here is; with pairs, 1972 as nineteen seventy-two (paired)."""
    text = re.sub(r"(?<![a-z0-9])-(?=\d)", "minus ", text.lower())
    # Decades: whisper writes 1960s and 70s for nineteen sixties and seventies.
    text = re.sub(r"\b(\d\d)?([1-9])0'?s\b", lambda m: (spelled(int(m.group(1))) + " " if m.group(1) else "") + TENS[int(m.group(2))][:-1] + "ies", text)
    text = re.sub(r"\d+", lambda m: paired(m.group()) if pairs else spelled(int(m.group())), text.replace(",", "").replace("\u2019", "'"))
    text = re.sub(r"[a-z]+'[a-z]+", lambda m: CONTRACTIONS.get(m.group(), m.group()), text)
    # A run of letter names spelled for the voice ("ecks, tee, elle";
    # "bee, queue, en") is heard as the letters ("XTL", "BQN").
    names = "|".join(LETTER_NAMES)
    text = re.sub(rf"\b(?:{names})(?:,? (?:{names}))+\b,?", lambda m: "".join(LETTER_NAMES[w] for w in re.findall(rf"\b(?:{names})\b", m.group())), text)
    # "a hundred" and "a thousand" are heard as 100 and 1000.
    text = re.sub(r"\ba (hundred|thousand)\b", r"one \1", text)
    return re.sub(r"[^a-z' ]", " ", text.replace("-", " ")).split()


def same(got: str, *meant: str) -> bool:
    """Whether whisper heard what was meant: the same letters in the same
    order, word breaks aside (A P L is heard as APL, T R S eighty as
    TRS-80), its numbers read either way (words)."""
    return any("".join(words(got, p)) in ["".join(words(m, p)) for m in meant] for p in (False, True))


def near(got: str, *meant: str) -> bool:
    """Whether whisper heard a sentence of six words or more within one
    word of what was meant (one word missing, added or different)."""
    g = words(got)
    for m in meant:
        w = words(m)
        if len(w) < 6:
            continue
        # Word-level edit distance, at most 1.
        prev = list(range(len(w) + 1))
        for i, a in enumerate(g, 1):
            cur = [i] + [0] * len(w)
            for j, b in enumerate(w, 1):
                cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a != b))
            prev = cur
        if prev[-1] <= 1:
            return True
    return False


def sox(*args: str) -> None:
    subprocess.run(["sox", *args], check=True)


def seconds(wav: Path) -> float:
    return float(subprocess.run(["soxi", "-D", str(wav)], check=True, capture_output=True, text=True).stdout)


@contextlib.contextmanager
def voxcpm_turn(lock: Path, what: str):
    """The one request at a time VoxCPM can take: an exclusive lock on a
    file every narration on this machine shares, held only for the
    request itself. Any number of narrations (terminals, agents) can run
    at once; their requests to the server queue here, and everything
    else (whisper, sox, rendering) runs in parallel."""
    # First come, first served: a lock alone hands the next turn to any
    # waiter, and one can starve (al-01-why, 2026-11-19). Each waiter
    # takes a ticket (its time and pid); the oldest live ticket goes next.
    lock.parent.mkdir(parents=True, exist_ok=True)
    queue = lock.parent / "voxcpm-queue"
    queue.mkdir(exist_ok=True)
    ticket = queue / f"{time.time_ns():020d}-{os.getpid()}"
    ticket.touch()

    def alive(t: Path) -> bool:
        try:
            os.kill(int(t.name.split("-")[1]), 0)
            return True
        except (ProcessLookupError, ValueError):
            t.unlink(missing_ok=True)
            return False
        except PermissionError:
            return True

    with open(lock, "a") as f:
        try:
            told = False
            while True:
                first = next((t for t in sorted(queue.iterdir()) if alive(t)), None)
                if first == ticket:
                    try:
                        fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
                        break
                    except BlockingIOError:
                        pass  # a narration without tickets has it
                if not told:
                    print(f"voice: {what}: waiting for VoxCPM (another narration is using it)", flush=True)
                    told = True
                time.sleep(0.3)
            yield
        finally:
            fcntl.flock(f, fcntl.LOCK_UN)
            ticket.unlink(missing_ok=True)


def heard(wav: Path, model: Path) -> str:
    out = subprocess.run(
        ["whisper-cli", "-m", str(model), "-f", str(wav), "--no-timestamps", "-np"],
        check=True, capture_output=True, text=True,
    ).stdout
    return " ".join(out.split())


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("slug")
    ap.add_argument("--server", required=True)
    ap.add_argument("--reference", required=True, type=Path)
    ap.add_argument("--prompt-text", required=True, type=Path)
    ap.add_argument("--whisper-model", required=True, type=Path)
    ap.add_argument("--steps", type=int, default=15)
    ap.add_argument("--cfg", type=float, default=2.0)
    ap.add_argument("--tries", type=int, default=2)
    ap.add_argument("--ready", action="store_true", help="make nothing: assemble only the scenes whose sentences are all "
                    "in the cache, and write their seconds and voice.json (a preview while shards work)")
    ap.add_argument("--shard", default=None, help="K/N: make only every Nth sentence (from K) into the cache, and nothing else; "
                    "several shards at once keep VoxCPM busy (its lock still sends one request at a time) while others "
                    "check or retry; a run without --shard then assembles from the cache")
    ap.add_argument("--lock", type=Path, default=Path(os.environ.get(
        "XETAL_TTS_LOCK", Path.home() / ".cache" / "voxcpm-tts.lock")),
        help="the lock every narration shares: one request to VoxCPM at a time")
    ap.add_argument("--check", action="store_true", help="only lint the narration")
    a = ap.parse_args()
    shard = tuple(int(x) for x in a.shard.split("/")) if a.shard else None
    nth = 0  # the sentence's number in the lesson, for --shard

    lesson_file = ROOT / "lessons" / a.slug / "lesson.json"
    lesson = json.loads(lesson_file.read_text())
    scenes = lesson["scenes"]
    problems = [p for s in scenes if s.get("narration") for p in lint(s["id"], s["narration"])]
    if problems:
        fail("the narration needs rewording:\n  " + "\n  ".join(problems))
    for f in (a.reference, a.prompt_text) if a.check else (a.reference, a.prompt_text, a.whisper_model):
        if not f.is_file():
            fail(f"missing {f}")

    prompt = " ".join(a.prompt_text.read_text().split())
    sample = hashlib.sha256(a.reference.read_bytes()).hexdigest()
    cache = ROOT / "work" / "voice-cache"
    cache.mkdir(parents=True, exist_ok=True)
    out = ROOT / "work" / a.slug / "voice"
    out.mkdir(parents=True, exist_ok=True)
    client = None
    record = {
        "sample": a.reference.name,
        "sampleSha256": sample,
        "server": "VoxCPM (Gradio /generate)",
        "steps": a.steps,
        "cfg": a.cfg,
        "scenes": [],
    }

    # The test before any VoxCPM call: every sentence still to be made,
    # as it would be sent. One that fails stops the run before any call.
    unmade = []
    for scene in scenes:
        for raw in sentences(scene.get("narration") or ""):
            sentence = spoken(raw)
            key = hashlib.sha256(json.dumps([sentence, sample, prompt, a.steps, a.cfg]).encode()).hexdigest()[:16]
            if not (cache / f"{key}.wav").exists():
                unmade += [f"{scene['id']}: {bare(sentence)!r}: {p}" for p in tts_problems(bare(sentence))]
    if unmade:
        fail("not fit to send to VoxCPM:\n  " + "\n  ".join(unmade))
    if a.check:
        print(f"voice: {a.slug}: the narration is fit to speak, and every sentence still to be made fit to send")
        return
    from gradio_client import Client, handle_file  # the venv's (scripts/voice.sh)

    unverified = []
    for scene in scenes:
        text = scene.get("narration")
        if not text:
            continue
        clips, said = [], []
        missing = False
        # Split the marked text, then read each sentence two ways: as said
        # (to VoxCPM, and the cache key) and as written (captions).
        for k, raw in enumerate(sentences(text)):
            nth += 1
            sentence, shown = spoken(raw), written(raw)
            key = hashlib.sha256(json.dumps([sentence, sample, prompt, a.steps, a.cfg]).encode()).hexdigest()[:16]
            clip = cache / f"{key}.wav"
            note = cache / f"{key}.txt"
            if a.ready and not (clip.exists() and note.exists()):
                missing = True
                break
            # One maker a sentence: lessons narrated at once that share a
            # sentence wait for the first to make it, then reuse it.
            guard = open(cache / f"{key}.lock", "a")
            if shard:
                # A worker takes the next sentence nobody is making, in the
                # lesson's order, so scenes are finished in turn.
                if clip.exists() and note.exists():
                    guard.close()
                    continue
                try:
                    fcntl.flock(guard, fcntl.LOCK_EX | fcntl.LOCK_NB)
                except BlockingIOError:
                    guard.close()
                    continue
            else:
                fcntl.flock(guard, fcntl.LOCK_EX)
            if clip.exists() and note.exists():
                got = note.read_text().strip()
            else:
                got = None
                for attempt in range(1, a.tries + 1):
                    print(f"voice: {scene['id']} {k + 1}: {sentence!r} (try {attempt})", flush=True)
                    # The server can fail or drop a request: wait and ask
                    # again (a new client), up to six times, before giving up.
                    assert not tts_problems(bare(sentence)), (sentence, tts_problems(bare(sentence)))
                    for call in range(6):
                        try:
                            client = client or Client(a.server, verbose=False)
                            with voxcpm_turn(a.lock, f"{a.slug} {scene['id']} {k + 1}"):
                                raw = client.predict(
                                    text_input=bare(sentence),
                                    prompt_wav_path_input=handle_file(str(a.reference.resolve())),
                                    prompt_text_input=prompt,
                                    cfg_value_input=a.cfg,
                                    inference_timesteps_input=a.steps,
                                    do_normalize=False,
                                    api_name="/generate",
                                )
                            break
                        except Exception as e:  # the server's or the network's
                            if call == 5:
                                raise
                            print(f"voice:   the server failed ({type(e).__name__}: {e}); asking again in {30 * (call + 1)} s", flush=True)
                            client = None
                            time.sleep(30 * (call + 1))
                    # Trim the silence the model leaves at either end.
                    sox(raw, "-r", "44100", "-c", "1", str(clip),
                        "silence", "1", "0.05", "0.3%", "reverse", "silence", "1", "0.05", "0.3%", "reverse")
                    got = heard(clip, a.whisper_model)
                    if same(got, sentence, shown):
                        break
                    if near(got, sentence, shown):
                        # One word off in a long sentence: usually whisper,
                        # not the voice. Kept without another turn, flagged
                        # for a listen.
                        got = UNVERIFIED + got
                        print(f"voice:   one word off, kept unverified, for a listen: {scene['id']} {k + 1}", flush=True)
                        break
                    print(f"voice:   whisper heard {got!r}", flush=True)
                else:
                    # Never stop the run on one sentence: keep the last take,
                    # flag it (here, in voice.json, on the review page) for a
                    # listen, and go on. Rewording it makes it again.
                    got = UNVERIFIED + got
                    print(f"voice:   kept unverified, for a listen: {scene['id']} {k + 1}", flush=True)
                note.write_text(got + "\n")
            guard.close()  # releases the sentence's lock
            clips.append(clip)
            flagged = got.startswith(UNVERIFIED)
            if flagged:
                got = got[len(UNVERIFIED):]
                unverified.append(f"{scene['id']} {k + 1}: {shown!r} (heard {got!r})")
            said.append({"text": shown, "heard": got, "sent": bare(sentence)} | ({"spoken": sentence} if sentence != shown else {}) | ({"unverified": True} if flagged else {}))

        if shard or missing:
            continue  # a shard only fills the cache; --ready skips a scene not all made
        # The scene's audio: lead, sentences with pauses, tail; peaks at -1 dB.
        wav = out / f"{scene['id']}.wav"
        # Each sentence's start and end within the scene (for captions).
        parts, at = [], 0.0
        for k, c in enumerate(clips):
            pad = out / f"pad-{c.stem}-{'l' if k == 0 else 'g'}.wav"  # this lesson's own
            sox(str(c), str(pad), "pad", str(LEAD if k == 0 else GAP), "0")
            parts.append(str(pad))
            at += LEAD if k == 0 else GAP
            said[k]["start"] = round(at, 3)
            at += seconds(c)
            said[k]["end"] = round(at, 3)
        tail = END if scene is scenes[-1] else TAIL
        sox(*parts, str(wav), "pad", "0", str(tail), "norm", "-1")
        length = math.ceil(seconds(wav) * 10) / 10
        scene["seconds"] = length
        record["scenes"].append({"id": scene["id"], "narration": text, "seconds": length, "sentences": said})
        print(f"voice: {scene['id']}: {length} s", flush=True)

    if a.ready:
        print(f"voice: {a.slug}: {len(record['scenes'])} scene(s) ready", flush=True)
        # Then as a full run: the ready scenes' seconds and voice.json
        # written (the others keep theirs until they are made).
    if shard:
        print(f"voice: {a.slug}: shard {a.shard} done", flush=True)
        if unverified:
            print("voice: kept unverified:\n  " + "\n  ".join(unverified))
        return
    # Each narrated scene's seconds, written in place (the file keeps its layout).
    src = lesson_file.read_text()
    # (only within "scenes": a story's music has seconds of its own)
    found = [m for m in re.finditer(r'"seconds":\s*[0-9.]+', src) if m.start() > src.index('"scenes"')]
    if len(found) != len(scenes):
        fail("lesson.json: expected one \"seconds\" a scene")
    for m, scene in reversed(list(zip(found, scenes))):
        src = src[: m.start()] + f'"seconds": {scene["seconds"]:g}' + src[m.end():]
    lesson_file.write_text(src)
    (ROOT / "lessons" / a.slug / "voice.json").write_text(json.dumps(record, indent=2) + "\n")
    total = sum(s["seconds"] for s in scenes)
    print(f"voice: {a.slug}: narrated, {total:.1f} s in all; lesson.json and voice.json updated")
    if unverified:
        print(f"voice: {len(unverified)} sentence(s) whisper never matched, kept for a listen (review page, orange):\n  " + "\n  ".join(unverified))
        sys.exit(3)


if __name__ == "__main__":
    main()
