"""Tests for scripts/voice-preflight.py (run by the gate): which words
are risky, which are handled (a clip present, a known-good spelling, a
word heard right before), and the suggested command. No voice server.
  .venv/bin/python scripts/test_preflight.py"""
import importlib.util
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
sys.path.insert(0, str(here))
spec = importlib.util.spec_from_file_location("voice_preflight", here / "voice-preflight.py")
pf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pf)

failed = 0


def check(name, got, want):
    global failed
    if got != want:
        failed += 1
        print(f"FAIL {name}: got {got!r}, want {want!r}")


TABLE = [
    {"word": "X_eTaL", "use": "@xtl", "heard": "XTL", "ok": True, "date": "2026-11-20"},
    {"word": "APL", "use": "eh, pee, elle", "heard": "APL", "ok": True, "notLast": True, "date": "2026-11-20"},
    {"word": "BQN", "use": "bee, queue, en", "heard": "BQN", "ok": True, "date": "2026-11-20"},
    {"word": "X_eTaL", "use": "ecks, tee, elle", "heard": "XDL", "ok": False, "date": "2026-11-20"},
]
COMMON = {"the", "language", "is", "in", "and", "new", "my", "a", "it", "four", "bit", "says", "so"}
HEARD = {"haskell": "al-01-why"}


def verdicts(narration, clips=frozenset({"xtl"})):
    found = pf.scan([{"id": "s", "narration": narration}], COMMON, HEARD, TABLE, set(clips))
    return {(f["word"], f["spoken"]): (f["category"], f["ok"]) for f in found}


# Marks: a clip present or missing, a known-good or failed spelling, a new one.
check("clip", verdicts("My new language is {X_eTaL|@xtl}."), {("X_eTaL", "@xtl"): ("clip", True)})
check("clip missing", verdicts("My new language is {X_eTaL|@xtl}.", clips=()), {("X_eTaL", "@xtl"): ("clip", False)})
check("known good", verdicts("It is {BQN|bee, queue, en,} and so it is."), {("BQN", "bee, queue, en"): ("mark", True)})
check("commas and case aside", verdicts("It is {BQN|Bee queue en} and so it is."), {("BQN", "Bee queue en"): ("mark", True)})
check("known to fail", verdicts("My new language is {X_eTaL|ecks, tee, elle}."), {("X_eTaL", "ecks, tee, elle"): ("mark", False)})
check("not last", verdicts("It is {APL|eh, pee, elle}."), {("APL", "eh, pee, elle"): ("mark", False)})
check("not last, mid-sentence", verdicts("It is {APL|eh, pee, elle} and so it is."), {("APL", "eh, pee, elle"): ("mark", True)})
check("new spelling", verdicts("It is {NVIDIA|en vidia}."), {("NVIDIA", "en vidia"): ("mark", False)})
check("heteronym decision", verdicts("It is {read|red}, and {live|live}."), {})

# Unmarked words.
check("common", verdicts("My new language is in the language."), {})
check("acronym", verdicts("It is APL."), {("APL", "APL"): ("acronym", False)})
check("mixed case", verdicts("It is LaTeX."), {("LaTeX", "LaTeX"): ("acronym", False)})
check("the name", verdicts("It is X_eTaL."), {("X_eTaL", "X_eTaL"): ("name", False)})
check("digits", verdicts("It is 1962."), {("1962", "1962"): ("number", False)})
check("possessive", verdicts("It is the language's."), {("language's", "language's"): ("possessive", False)})
check("contraction", verdicts("It's new."), {})
check("lone letter", verdicts("It is K."), {("K", "K"): ("letter", False)})
check("article", verdicts("A new language."), {})
check("letter names", verdicts("It is ay pee el."), {("ay pee el", "ay pee el"): ("letters", False)})
check("plain English letters", verdicts("So you see it."), {("you", "you"): ("uncommon", False), ("see", "see"): ("uncommon", False)})
check("hyphenated common", verdicts("A four-bit language."), {("four-bit", "four-bit"): ("hyphenated", True)})
check("hyphenated uncommon", verdicts("A low-rank language."), {("low-rank", "low-rank"): ("hyphenated", False)})
check("name heard before", verdicts("It is Haskell."), {("Haskell", "Haskell"): ("name", True)})
check("name never heard", verdicts("It is Iverson."), {("Iverson", "Iverson"): ("name", False)})
check("uncommon", verdicts("It is laziness."), {("laziness", "laziness"): ("uncommon", False)})

# The allowlist: the words of other lessons, lowercase or first in a
# sentence; a mid-sentence capital is a name.
texts = {"a": "Rust is fast. The array runs.", "b": "The array of Rust is fast.", "c": "Rust only here."}
check("allowlist", pf.allowlist(texts, least=2), {"rust", "is", "fast", "the", "array"})
check("allowlist, the lesson aside", pf.allowlist(texts, but="a"), {"the", "array", "of", "rust", "is", "fast", "only", "here"})

# Suggestions.
check("suggest clip", pf.suggest("x", {"category": "mark", "word": "X_eTaL", "spoken": "ecks, tee, elle"}, TABLE), "use the clip: {X_eTaL|@xtl}")
check("suggest word", pf.suggest("al-02", {"category": "mark", "word": "NVIDIA", "spoken": "en vidia"}, TABLE),
      'scripts/voice.sh al-02 --word nvidia --expect NVIDIA --say "en vidia" --say "nvidia"')
check("suggest letters", pf.suggest("al-02", {"category": "acronym", "word": "CPU", "spoken": "CPU"}, TABLE),
      'scripts/voice.sh al-02 --word cpu --expect CPU --say "cpu" --say "C, P, U"')
check("suggest known spelling", pf.suggest("x", {"category": "letter", "word": "BQN", "spoken": "BQN"}, TABLE), "use the known spelling: {BQN|bee, queue, en}")
check("suggest spell", pf.suggest("x", {"category": "name", "word": "Iverson", "spoken": "Iverson"}, TABLE), "scripts/voice.sh x --spell Iverson Iverson Iverson")
check("suggest reword", pf.suggest("x", {"category": "possessive", "word": "its's", "spoken": "its's"}, TABLE), "reword it")

# The tracked table parses and every entry has what the preflight reads.
for r in pf.load_table():
    check(f"table {r.get('word')} {r.get('use')}", sorted(k for k in ("word", "use", "heard", "ok", "date") if k in r),
          ["date", "heard", "ok", "use", "word"])

if failed:
    sys.exit(f"test_preflight: {failed} failed")
print("test_preflight: ok")
