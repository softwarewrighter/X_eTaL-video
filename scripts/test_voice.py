"""Tests for what scripts/voice.py sends to VoxCPM (run by the gate):
bare() keeps only commas and periods (a rare ? or !), writes out
contractions and turns hyphens into spaces; tts_problems() refuses
unusual characters, digits, and acronyms not spelled phonetically.
  .venv/bin/python scripts/test_voice.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import voice  # noqa: E402

failed = 0


def check(name, got, want):
    global failed
    if got != want:
        failed += 1
        print(f"FAIL {name}: got {got!r}, want {want!r}")


# What is sent: no hyphens, apostrophes, parentheses; contractions written out.
check("hyphen", voice.bare("A four-bit calculator, low-rank."), "A four bit calculator, low rank.")
check("contractions", voice.bare("It's one; we'll see, don't you? I've started."), "it is one we will see, do not you? I have started.")
check("parentheses", voice.bare("The editor (in the browser) runs it."), "The editor in the browser runs it.")
check("marks", voice.bare(voice.spoken("My new {APL|ay, pee, elle,} inspired language is {X_eTaL|ecks, tee, elle}.")),
      "My new ay, pee, elle, inspired language is ecks, tee, elle.")

# The test before any call.
check("clean", voice.tts_problems("My new ay, pee, elle, inspired language is ecks, tee, elle."), [])
check("question", voice.tts_problems("Which parts only iterate?"), [])
check("article", voice.tts_problems("A four bit calculator runs."), [])
check("pronoun", voice.tts_problems("And I have started."), [])
check("capitals", bool(voice.tts_problems("APL inspired.")), True)
check("letters", bool(voice.tts_problems("A P L inspired.")), True)
check("letter A with a comma", bool(voice.tts_problems("A, pee, elle, inspired.")), True)
check("lone letter", bool(voice.tts_problems("As in J or K.")), True)
check("digits", bool(voice.tts_problems("In 1962.")), True)
check("hyphen left", bool(voice.tts_problems("four-bit.")), True)
check("apostrophe left", bool(voice.tts_problems("it's.")), True)
check("period inside", bool(voice.tts_problems("One. Two.")), True)

# Whisper writes letters for spelled letter names.
check("letter names", voice.same("XTL asks what APL would look like.", "ecks, tee, elle, asks what ay, pee, el would look like."), True)

if failed:
    sys.exit(f"test_voice: {failed} failed")
print("test_voice: ok")
