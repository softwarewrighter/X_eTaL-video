"""Tests for what scripts/voice.py sends to VoxCPM (run by the gate):
bare() keeps only commas and periods (a rare ? or !), writes out
contractions and turns hyphens into spaces; tts_problems() refuses
unusual characters, digits, and acronyms not spelled phonetically;
voice-batch.py cuts a take of several sentences at its sentence pauses.
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

# One word off is kept, but never a misheard spelled acronym.
check("near", voice.near("A program whose types do not fit is refused before it runs, with a line.", "A program whose types do not fit is refused before it runs, with the line."), True)
check("near acronym", voice.near("Here is the same program in XDL, the array language this series is about.", "Here is the same program in ecks, tee, elle, the array language this series is about."), False)

# Contractions compared as written out.
check("we'll", voice.same("Then we will learn to write programs in Xt, L use its libraries, and extend it.", "Then we'll learn to write programs in ex, tee, Elle, use its libraries, and extend it."), True)

# Each mark heard either way, independently.
check("mixed marks", voice.heard_right("In XTL, you type an asterisk, as in J or K.", "In {X_eTaL,|ex, tee, el,} you type an asterisk, as in {J|jay} or {K|kay}."), True)

# The batch cutter (scripts/voice-batch.py): a synthetic take, five
# "sentences" of two tones with a comma pause (0.4 to 0.7 s) between and a
# sentence pause (0.9 to 1.3 s) after, under a noise floor that rises from
# none to about -40 dB (as VoxCPM's does in a long take).
import importlib.util  # noqa: E402
import subprocess  # noqa: E402
import tempfile  # noqa: E402

spec = importlib.util.spec_from_file_location("voice_batch", Path(__file__).resolve().parent / "voice-batch.py")
vb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(vb)
with tempfile.TemporaryDirectory() as d:
    d = Path(d)
    parts = []

    def piece(name, *effect):
        f = d / f"{len(parts):02d}-{name}.wav"
        subprocess.run(["sox", "-n", "-r", "44100", "-c", "1", str(f), *effect], check=True)
        parts.append(str(f))

    commas, ends = [0.4, 0.7, 0.5, 0.65, 0.45], [1.0, 0.9, 1.3, 1.1]
    for i in range(5):
        piece("a", "synth", "0.7", "sine", str(220 + 40 * i), "vol", "0.3")
        piece("c", "trim", "0", str(commas[i]))
        piece("b", "synth", "0.5", "sine", str(330 + 40 * i), "vol", "0.3")
        if i < 4:
            piece("e", "trim", "0", str(ends[i]))
    clean = d / "clean.wav"
    subprocess.run(["sox", *parts, str(clean)], check=True)
    length = float(subprocess.run(["soxi", "-D", str(clean)], capture_output=True, text=True).stdout)
    noise = d / "noise.wav"
    subprocess.run(["sox", "-n", "-r", "44100", "-c", "1", str(noise), "synth", f"{length}", "whitenoise", "vol", "0.02",
                    "fade", "t", f"{length}", "0", "0"], check=True)
    take = d / "take.wav"
    subprocess.run(["sox", "-m", str(clean), str(noise), str(take)], check=True)
    texts = ["One two three, four five."] * 5
    got = vb.cut(take, texts, d / "cut")
    check("cut count", got and len(got[0]), 5)
    if got:
        lengths = [round(voice.seconds(s), 1) for s in got[0]]
        check("cut lengths", all(1.4 <= x <= 2.0 for x in lengths), True)
    # Asked for four, the pauses give no plausible cut; for six, none at all.
    check("cut four", vb.cut(take, texts[:4], d / "cut4"), None)
    check("cut six", vb.cut(take, texts + texts[:1], d / "cut6"), None)
# Pause lengths: 0.8 s when it gives the count, else a threshold in 0.6..1.2.
check("cut points 0.8", vb.cut_points([(0, 0.5), (1, 2.0), (3, 3.3)], 2), ([(1, 2.0)], 0.8))
check("cut points tuned", vb.cut_points([(0, 0.85), (1, 2.0), (3, 3.3)], 2)[1] > 0.85, True)
check("cut points none", vb.cut_points([(0, 0.5), (1, 1.5)], 3), None)
check("plausible", vb.plausible([(2.0, 3.0)], 0, 5.0, ["a b c d", "e f g h"]), True)
check("implausible", vb.plausible([(4.0, 4.5)], 0, 5.0, ["a b c d", "e f g h"]), False)

if failed:
    sys.exit(f"test_voice: {failed} failed")
print("test_voice: ok")
