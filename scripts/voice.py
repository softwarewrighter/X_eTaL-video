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
import threading
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


WORDS = ROOT / "work" / "voice-words"


def pieces(sentence: str) -> list[str]:
    """A sentence split for splicing: its text pieces (each sent to
    VoxCPM on its own) and its @words (clips from the word library,
    work/voice-words/NAME.wav, made by --word: a word the voice gets
    wrong in a sentence, made once until whisper hears it right).
    A / (written {,|/}) is a phrase break: the phrases either side are
    sent on their own, then joined (the author, 2026-11-22: a flagged
    sentence is said phrase by phrase)."""
    out = []
    for part in re.split(r"(@[a-z][a-z0-9-]*|/)", sentence):
        if part == "/":
            continue
        part = part.strip()
        if part.startswith("@"):
            out.append(part)
        else:
            part = part.strip(" ,")
            if re.sub(r"[ ,.?!]", "", part):
                out.append(part)
    return out


def word_file(piece: str) -> Path:
    return WORDS / f"{piece[1:]}.wav"


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
    if re.search(r"[?!:;()\"%&/*+=<>\[\]{}_#0-9]", re.sub(r"@[a-z][a-z0-9-]*|/", "", text)) or re.search(r"@(?![a-z])", text):
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
    # Every other contraction as bare() writes it out (whisper writes
    # "we will" for the voice's "we will").
    text = re.sub(r"\b(\w+)n't\b", lambda m: {"won": "will", "can": "can", "shan": "shall"}.get(m.group(1), m.group(1)) + " not", text)
    for end, full in (("'ll", " will"), ("'ve", " have"), ("'re", " are"), ("'m", " am"), ("'d", " would")):
        text = re.sub(rf"(\w){end}\b", rf"\1{full}", text)
    # A run of letter names spelled for the voice ("ecks, tee, elle";
    # "bee, queue, en") is heard as the letters ("XTL", "BQN").
    names = "|".join(LETTER_NAMES)
    text = re.sub(rf"\b(?:{names})(?:,? (?:{names}))+\b,?", lambda m: "".join(LETTER_NAMES[w] for w in re.findall(rf"\b(?:{names})\b", m.group())), text)
    # A lone spelled letter ("Uno queue", "jay") is heard as the letter.
    text = re.sub(r"\b(queue|jay|kay|ecks|elle)\b", lambda m: LETTER_NAMES[m.group(1)], text)
    # "a hundred" and "a thousand" are heard as 100 and 1000.
    text = re.sub(r"\ba (hundred|thousand)\b", r"one \1", text)
    return re.sub(r"[^a-z' ]", " ", text.replace("-", " ")).split()


def letters(spoken_part: str) -> str:
    """A mark's spoken part that is only letter names ("ex, tee, el,"),
    as the letters whisper writes (XTL), its trailing comma kept; else as
    it is."""
    names = re.findall(r"[a-z]+", spoken_part.lower())
    if len(names) >= 2 and all(n in LETTER_NAMES for n in names):
        return "".join(LETTER_NAMES[n] for n in names).upper() + ("," if spoken_part.rstrip().endswith(",") else "")
    return spoken_part


def heard_right(got: str, raw: str) -> bool:
    """Whether whisper heard a marked sentence right: each {written|spoken}
    mark may be heard either way, independently ("In XTL, you type an
    asterisk, as in J or K" is the spoken name with the written letters)."""
    marks = re.findall(r"\{([^|{}]*)\|([^{}]*)\}", raw)
    if len(marks) > 6:
        return same(got, spoken(raw), written(raw))
    for pick in range(2 ** len(marks)):
        it = iter(range(len(marks)))
        text = re.sub(r"\{([^|{}]*)\|([^{}]*)\}", lambda m: letters(m.group(2)) if pick >> next(it) & 1 else m.group(1), raw)
        if same(got, text):
            return True
    return False


def same(got: str, *meant: str) -> bool:
    """Whether whisper heard what was meant: the same letters in the same
    order, word breaks aside (A P L is heard as APL, T R S eighty as
    TRS-80), its numbers read either way (words)."""
    return any("".join(words(got, p)) in ["".join(words(m, p)) for m in meant] for p in (False, True))


def near(got: str, *meant: str) -> bool:
    """Whether whisper heard a sentence of six words or more within one
    word of what was meant (one word missing, added or different)."""
    g = words(got)
    names = "|".join(LETTER_NAMES)
    for m in meant:
        w = words(m)
        if len(w) < 6:
            continue
        # A spelled acronym (the name, "ecks, tee, elle") must be heard
        # exactly: XDL for XTL is the voice's error, not whisper's.
        spelled = ["".join(LETTER_NAMES[x] for x in re.findall(rf"\b(?:{names})\b", r))
                   for r in re.findall(rf"\b(?:{names})(?:,? (?:{names}))+\b", m.lower())]
        if any(a not in g for a in spelled):
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


VOXQ_ROOT = ROOT / "work" / "voxq"
VOXQ_BIN = ROOT / "target" / "release" / "voxq"


def voxq_running() -> bool:
    """Whether voxq is serving: its heartbeat (status.json) rewritten in
    the last 10 seconds."""
    st = VOXQ_ROOT / "status.json"
    if not st.exists() or time.time() - st.stat().st_mtime >= 10:
        return False
    # A fresh heartbeat from a process that has since stopped is not
    # serving: its pid must be alive.
    try:
        os.kill(json.loads(st.read_text())["pid"], 0)
        return True
    except (ProcessLookupError, KeyError, ValueError, json.JSONDecodeError):
        return False
    except PermissionError:
        return True


def ensure_voxq() -> None:
    """Start voxq (tools/voxq: the one client of the voice server) if it
    is not serving; a second voxq exits at once (its lock), so callers
    may race."""
    if voxq_running():
        return
    if not VOXQ_BIN.exists():
        subprocess.run(["cargo", "build", "--release", "-p", "voxq"], cwd=ROOT, check=True)
    VOXQ_ROOT.mkdir(parents=True, exist_ok=True)
    log = open(VOXQ_ROOT / "serve.out", "a")
    subprocess.Popen([str(VOXQ_BIN), "serve", "--root", str(VOXQ_ROOT)], cwd=ROOT, stdout=log, stderr=log, start_new_session=True)
    for _ in range(50):
        if voxq_running():
            return
        time.sleep(0.2)
    fail("voxq did not start (work/voxq/serve.out)")


def voxq_call(text: str, reference: Path, prompt: str, cfg: float, steps: int, label: str, timeout: float = 600) -> Path:
    """One voice request through voxq: a request file into its queue, then
    wait for the result it writes (ID.wav, then ID.json). Raises when the
    request failed, when voxq stops beating (a stall), or after timeout."""
    ensure_voxq()
    out = VOXQ_ROOT / "out" / str(os.getpid())
    out.mkdir(parents=True, exist_ok=True)
    rid = f"{time.time_ns():020d}-{os.getpid()}-{threading.get_ident() % 100000}"
    req = {"id": rid, "text": text, "reference": str(Path(reference).resolve()), "prompt_text": prompt,
           "cfg": cfg, "steps": steps, "out_dir": str(out.resolve()), "label": label}
    tmp = VOXQ_ROOT / "incoming" / f".{rid}.json"
    tmp.write_text(json.dumps(req))
    tmp.rename(VOXQ_ROOT / "incoming" / f"{rid}.json")
    done, t0 = out / f"{rid}.json", time.time()
    while not done.exists():
        if not voxq_running():
            ensure_voxq()
            if not voxq_running():
                raise RuntimeError(f"voxq stopped while {label!r} was queued")
        if time.time() - t0 > timeout:
            raise RuntimeError(f"{label!r}: no result from voxq in {timeout:.0f} s")
        time.sleep(0.2)
    result = json.loads(done.read_text())
    if result.get("status") != "ok":
        raise RuntimeError(f"{label!r}: {result.get('error')}")
    return out / f"{rid}.wav"


def tts(client, a, prompt, handle_file, Client, text: str, out: Path, what: str):
    """One voice request, through voxq (the one client of the voice
    server: queued, one at a time, ~6 s a request where the Python Gradio
    client took ~90 s), the silence at either end trimmed, into out.
    client, handle_file and Client are unused, kept for the callers."""
    raw = voxq_call(text, a.reference, prompt, a.cfg, a.steps, what)
    sox(str(raw), "-r", "44100", "-c", "1", str(out),
        "silence", "1", "0.05", "0.3%", "reverse", "silence", "1", "0.05", "0.3%", "reverse")
    raw.unlink(missing_ok=True)
    return client


def find_spelling(a) -> None:
    """--spell WORD EXPECT CANDIDATE...: one word at a time, each candidate
    spelling said in a carrier sentence ("The next word is CANDIDATE.")
    until whisper hears EXPECT as its last words (letters and case
    ignored). A word said alone comes out garbled ("ex, tee, Elle." was
    heard as "A little pencil, huh?"), so the carrier gives it a
    sentence. Every try and the winner go to work/voice-spell.json."""
    from gradio_client import Client, handle_file  # the venv's (scripts/voice.sh)
    word, expect, candidates = a.spell[0], a.spell[1], a.spell[2:]
    prompt = " ".join(a.prompt_text.read_text().split())
    want = re.sub(r"[^a-z]", "", expect.lower())
    log = ROOT / "work" / "voice-spell.json"
    record = json.loads(log.read_text()) if log.exists() else {}
    entry = record.setdefault(word, {"expect": expect, "tries": [], "winner": None})
    client = None
    takes = ROOT / "work" / "voice-spell"
    takes.mkdir(parents=True, exist_ok=True)
    for c in candidates:
        # Sent exactly as written: the search is to find what the voice
        # says best, capitals and hyphens included (the author's own
        # candidates: XTL, X-T-L, eks-tee-elle).
        text = f"The next word is {c}."
        take = takes / f"{re.sub(r'[^a-z0-9]+', '-', word.lower())}-{len(entry['tries'])}.wav"
        client = tts(client, a, prompt, handle_file, Client, text, take, f"spell {word}")
        got = heard(take, a.whisper_model)
        tail = re.sub(r"[^a-z]", "", re.sub(r"(?i)^.*?\bis\b", "", got).lower())
        ok = tail == want
        entry["tries"].append({"say": c, "heard": got, "ok": ok, "take": str(take)})
        log.write_text(json.dumps(record, indent=2) + "\n")
        print(f"voice: spell {word}: {c!r} heard {got!r} {'OK' if ok else 'no'}", flush=True)
        if ok:
            entry["winner"] = c
            log.write_text(json.dumps(record, indent=2) + "\n")
            print(f"voice: spell {word}: use {c!r}", flush=True)
            return
    print(f"voice: spell {word}: no candidate heard as {expect!r}; try others", flush=True)


def make_word(a) -> None:
    """--word NAME --expect TEXT --say CANDIDATE [--say ...]: a word clip
    for splicing (work/voice-words/NAME.wav), for a word the voice says
    wrong inside a sentence however it is spelled. Verifiable at each
    step: each candidate is said in a carrier sentence with a pause before
    it ("The next word is, CANDIDATE."), the word is cut at that pause
    (found from the audio level, not whisper's rough timings), and the cut
    is checked by playing it after the carrier's own "The next word is":
    whisper must hear EXPECT as the last word (letters only, case
    ignored). Up to 3 takes a candidate; the first that passes is kept,
    with WORD.txt saying what was sent and heard."""
    from gradio_client import Client, handle_file  # the venv's (scripts/voice.sh)
    prompt = " ".join(a.prompt_text.read_text().split())
    WORDS.mkdir(parents=True, exist_ok=True)
    want = re.sub(r"[^a-z]", "", a.expect.lower())
    work_ = WORDS / f"{a.word}.work"
    work_.mkdir(exist_ok=True)
    client = None
    n = 0
    for say in a.say:
        for attempt in range(1, 4):
            n += 1
            carrier = work_ / f"carrier-{n}.wav"
            text = f"The next word is, {say}."
            client = tts(client, a, prompt, handle_file, Client, text, carrier, f"word {a.word}")
            gaps = pauses(carrier)
            inner = [g for g in gaps if g[0] > 0.3 and g[1] < seconds(carrier) - 0.15]
            if not inner:
                print(f"voice: word {a.word}: {say!r} take {attempt}: no pause before the word", flush=True)
                continue
            # The pause after "The next word is", the comma: the first one
            # past 0.6 s (the longest can fall between spelled letters).
            later = [g for g in inner if g[0] > 0.6]
            g0, g1 = (later or inner)[0]
            word = work_ / f"word-{n}.wav"
            sox(str(carrier), str(word), "trim", f"{max(0.0, g1 - 0.03):.3f}")
            if a.tighten:
                # Spelled letters ("I, B, M") come out with pauses between
                # them: every pause inside the word shortened to 50 ms, so
                # the letters run evenly (the author: IBM sounded "I... B... M").
                tight = work_ / f"tight-{n}.wav"
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(word), "-af",
                                "silenceremove=stop_periods=-1:stop_duration=0.05:stop_threshold=-35dB", str(tight)], check=True)
                tight.replace(word)
            length = seconds(word)
            if a.max_seconds and a.fit and length > a.max_seconds and length / a.max_seconds <= 1.5:
                # Too slow: faster to fit, pitch kept (sox tempo), as IBM was.
                fast = work_ / f"fast-{n}.wav"
                sox(str(word), str(fast), "tempo", "-s", f"{length / (a.max_seconds - 0.1):.3f}")
                fast.replace(word)
                length = seconds(word)
            check = work_ / f"check-{n}.wav"
            prefix = work_ / f"prefix-{n}.wav"
            # Checked after one fixed, verified "The next word is" (never
            # this take's own, which could hide a letter the cut lost).
            ref = WORDS / "_prefix.wav"
            if not ref.exists():
                sox(str(carrier), str(ref), "trim", "0", f"{g0:.3f}")
            sox(str(ref), str(prefix), "pad", "0", "0.25")
            sox(str(prefix), str(word), str(check))
            got = heard(check, a.whisper_model)
            tail = re.sub(r"[^a-z]", "", re.sub(r"(?i)^.*?\bis\b", "", got).lower())
            ok = tail == want and 0.2 < length < (a.max_seconds or 2.5)
            print(f"voice: word {a.word}: {say!r} take {attempt}: cut {length:.2f} s, heard {got!r} {'OK' if ok else 'no'}", flush=True)
            if ok:
                sox(str(word), str(WORDS / f"{a.word}.wav"))
                (WORDS / f"{a.word}.txt").write_text(f"sent: {text}\nheard (the cut after the carrier): {got}\n")
                print(f"voice: word {a.word}: kept {WORDS / (a.word + '.wav')} ({say!r})", flush=True)
                return
    fail(f"word {a.word}: no take of {a.say} was heard as {a.expect!r}; try other --say spellings")


def pauses(wav: Path) -> list[tuple[float, float]]:
    """The pauses in a take (below -35 dB for 60 ms or more): (start, end)."""
    out = subprocess.run(["ffmpeg", "-v", "info", "-i", str(wav), "-af", "silencedetect=n=-35dB:d=0.06", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", out)]
    return list(zip(starts, ends))


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
    ap.add_argument("--spell", nargs="+", metavar="ARG", help="find a spelling the voice says right, one word at a time: "
                    "WORD EXPECT CANDIDATE... (each candidate sent in a carrier sentence until whisper hears EXPECT; "
                    "the result added to work/voice-spell.json)")
    ap.add_argument("--word", help="make a word clip for splicing (work/voice-words/WORD.wav), with --say and --expect")
    ap.add_argument("--say", action="append", help="a candidate spelling for --word, tried in order (repeat it)")
    ap.add_argument("--tighten", action="store_true", help="for --word: shorten every pause inside the cut word to 50 ms "
                    "(spelled letters said with gaps between them)")
    ap.add_argument("--fit", action="store_true", help="for --word with --max-seconds: a cut up to half again too long is sped up to fit (sox tempo, pitch kept)")
    ap.add_argument("--max-seconds", type=float, default=None, help="for --word: the longest the cut word may be "
                    "(whisper cannot hear pace: IBM said I... B... M passes it; a limit does not)")
    ap.add_argument("--expect", help="what whisper must hear for --word, letters only (XTL)")
    a = ap.parse_args()
    if a.word:
        make_word(a)
        return
    if a.spell:
        find_spelling(a)
        return
    shard = tuple(int(x) for x in a.shard.split("/")) if a.shard else None
    nth = 0  # the sentence's number in the lesson, for --shard

    lesson_file = ROOT / "lessons" / a.slug / "lesson.json"
    lesson = json.loads(lesson_file.read_text())
    scenes = lesson["scenes"]
    problems = [p for s in scenes if s.get("narration") for p in lint(s["id"], s["narration"])]
    # A narrated scene of a story has something to look at (episode 01's
    # history scene was only a heading): pictures, a panel, a slide, a
    # recording or a clip.
    if lesson.get("kind") == "story" and a.check:
        problems += [f"scene {s['id']}: narrated, with nothing to show (images, panel, slide, capture, clip or lines)"
                     for s in scenes if s.get("narration") and not any(s.get(k) for k in ("images", "panel", "slide", "capture", "clip", "lines"))]
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
            missing_words = [w for w in pieces(sentence) if w.startswith("@") and not word_file(w).exists()]
            if missing_words:
                unmade.append(f"{scene['id']}: no word clip for {', '.join(missing_words)} (voice.py --word)")
                continue
            used = [w for w in pieces(sentence) if w.startswith("@")]
            key = hashlib.sha256(json.dumps([sentence, sample, prompt, a.steps, a.cfg] + [hashlib.sha256(word_file(w).read_bytes()).hexdigest() for w in used]).encode()).hexdigest()[:16]
            if not (cache / f"{key}.wav").exists():
                unmade += [f"{scene['id']}: {bare(t)!r}: {p}" for t in pieces(sentence) if not t.startswith("@") for p in tts_problems(bare(t))]
    if unmade:
        fail("not fit to send to VoxCPM:\n  " + "\n  ".join(unmade))
    if a.check:
        print(f"voice: {a.slug}: the narration is fit to speak, and every sentence still to be made fit to send")
        return
    from gradio_client import Client, handle_file  # the venv's (scripts/voice.sh)

    unverified = []  # flagged takes made in this run
    older = 0  # flagged takes from earlier runs (cached): counted, not listed again
    for scene in scenes:
        text = scene.get("narration")
        if not text:
            continue
        clips, said = [], []
        missing = False
        # Split the marked text, then read each sentence two ways: as said
        # (to VoxCPM, and the cache key) and as written (captions).
        for k, raw in enumerate(sentences(text)):
            raw_sentence = raw
            nth += 1
            sentence, shown = spoken(raw), written(raw)
            used = [w for w in pieces(sentence) if w.startswith("@")]
            key = hashlib.sha256(json.dumps([sentence, sample, prompt, a.steps, a.cfg] + [hashlib.sha256(word_file(w).read_bytes()).hexdigest() for w in used]).encode()).hexdigest()[:16]
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
            fresh = not (clip.exists() and note.exists())
            if not fresh:
                got = note.read_text().strip()
            else:
                got = None
                for attempt in range(1, a.tries + 1):
                    print(f"voice: {scene['id']} {k + 1}: {sentence!r} (try {attempt})", flush=True)
                    # The server can fail or drop a request: wait and ask
                    # again (a new client), up to six times, before giving up.
                    split = bool(used) or "/" in sentence
                    parts = pieces(sentence) if split else [sentence]
                    made = []
                    for j, part in enumerate(parts):
                        if part.startswith("@"):
                            made.append(str(word_file(part)))
                            continue
                        assert not tts_problems(bare(part)), (part, tts_problems(bare(part)))
                        piece = clip.with_suffix(f".{j}.wav") if split else clip
                        if split:
                            # A piece scripts/voice-batch.py made and whisper
                            # checked (its KEY.J.txt) is used on the first try;
                            # a new take of it drops that note.
                            checked = clip.with_suffix(f".{j}.txt")
                            if attempt == 1 and piece.exists() and checked.exists():
                                made.append(str(piece))
                                continue
                            checked.unlink(missing_ok=True)
                        client = tts(client, a, prompt, handle_file, Client, bare(part), piece, f"{a.slug} {scene['id']} {k + 1}")
                        made.append(str(piece))
                    if split:
                        # The pieces and the words, a short pause between.
                        gap = str(clip.with_suffix(".gap.wav"))
                        sox("-n", "-r", "44100", "-c", "1", gap, "trim", "0", "0.12")
                        joined = [x for m in made for x in (m, gap)][:-1]
                        sox(*joined, str(clip))
                    got = heard(clip, a.whisper_model)
                    if same(got, sentence, shown) or heard_right(got, raw_sentence):
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
                if fresh:
                    unverified.append(f"{scene['id']} {k + 1}: {shown!r} (heard {got!r})")
                else:
                    older += 1
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
    if older:
        print(f"voice: {older} sentence(s) flagged in earlier runs, unchanged (review page, orange)")
    if unverified:
        print(f"voice: {len(unverified)} sentence(s) whisper never matched, kept for a listen (review page, orange):\n  " + "\n  ".join(unverified))
        sys.exit(3)


if __name__ == "__main__":
    main()
