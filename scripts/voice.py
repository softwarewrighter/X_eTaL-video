"""Narrate a lesson in the user's cloned voice (scripts/voice.sh runs it).

Each scene's `narration` is split into sentences; each sentence goes
on its own call (one at a time, never in parallel) to VoxCPM's Gradio
API with the user's voice sample and its exact transcript, the sample
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
import hashlib
import json
import math
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEAD, GAP, TAIL = 0.4, 0.35, 0.7  # seconds of silence around and between sentences
END = 1.8  # the last scene's tail: time to read it before the video ends
MAX_SENTENCE = 140  # characters: longer sentences come out garbled


def fail(msg: str) -> None:
    print(f"voice: {msg}", file=sys.stderr)
    sys.exit(1)


def lint(scene_id: str, text: str) -> list[str]:
    """What VoxCPM says badly: anything but words, commas and periods."""
    problems = []
    if re.search(r"[?!:;()\"%&/*+=<>\[\]{}_#@0-9]", text):
        problems.append("only words, commas, periods and apostrophes (no ? ! : ; symbols or digits)")
    if re.search(r"\b[A-Z]{2,}\b", text):
        problems.append("no all-caps words")
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
    return str(n)


def words(text: str) -> list[str]:
    text = re.sub(r"\d+", lambda m: spelled(int(m.group())), text.lower().replace(",", ""))
    return re.sub(r"[^a-z' ]", " ", text.replace("-", " ")).split()


def sox(*args: str) -> None:
    subprocess.run(["sox", *args], check=True)


def seconds(wav: Path) -> float:
    return float(subprocess.run(["soxi", "-D", str(wav)], check=True, capture_output=True, text=True).stdout)


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
    ap.add_argument("--tries", type=int, default=3)
    ap.add_argument("--check", action="store_true", help="only lint the narration")
    a = ap.parse_args()

    lesson_file = ROOT / "lessons" / a.slug / "lesson.json"
    lesson = json.loads(lesson_file.read_text())
    scenes = lesson["scenes"]
    problems = [p for s in scenes if s.get("narration") for p in lint(s["id"], s["narration"])]
    if problems:
        fail("the narration needs rewording:\n  " + "\n  ".join(problems))
    if a.check:
        print(f"voice: {a.slug}: the narration is fit to speak")
        return
    for f in (a.reference, a.prompt_text, a.whisper_model):
        if not f.is_file():
            fail(f"missing {f}")

    from gradio_client import Client, handle_file  # the venv's (scripts/voice.sh)

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

    for scene in scenes:
        text = scene.get("narration")
        if not text:
            continue
        clips, said = [], []
        for k, sentence in enumerate(sentences(text)):
            key = hashlib.sha256(json.dumps([sentence, sample, prompt, a.steps, a.cfg]).encode()).hexdigest()[:16]
            clip = cache / f"{key}.wav"
            note = cache / f"{key}.txt"
            if clip.exists() and note.exists():
                got = note.read_text().strip()
            else:
                got = None
                for attempt in range(1, a.tries + 1):
                    print(f"voice: {scene['id']} {k + 1}: {sentence!r} (try {attempt})", flush=True)
                    client = client or Client(a.server, verbose=False)
                    raw = client.predict(
                        text_input=sentence,
                        prompt_wav_path_input=handle_file(str(a.reference.resolve())),
                        prompt_text_input=prompt,
                        cfg_value_input=a.cfg,
                        inference_timesteps_input=a.steps,
                        do_normalize=False,
                        api_name="/generate",
                    )
                    # Trim the silence the model leaves at either end.
                    sox(raw, "-r", "44100", "-c", "1", str(clip),
                        "silence", "1", "0.05", "0.3%", "reverse", "silence", "1", "0.05", "0.3%", "reverse")
                    got = heard(clip, a.whisper_model)
                    if words(got) == words(sentence):
                        break
                    print(f"voice:   whisper heard {got!r}", flush=True)
                else:
                    clip.rename(cache / f"{key}.rejected.wav")
                    fail(f"scene {scene['id']}: {sentence!r} never came out right "
                         f"(last heard {got!r}); reword it")
                note.write_text(got + "\n")
            clips.append(clip)
            said.append({"text": sentence, "heard": got})

        # The scene's audio: lead, sentences with pauses, tail; peaks at -1 dB.
        wav = out / f"{scene['id']}.wav"
        parts = []
        for k, c in enumerate(clips):
            pad = cache / f"pad-{c.stem}-{'l' if k == 0 else 'g'}.wav"
            sox(str(c), str(pad), "pad", str(LEAD if k == 0 else GAP), "0")
            parts.append(str(pad))
        tail = END if scene is scenes[-1] else TAIL
        sox(*parts, str(wav), "pad", "0", str(tail), "norm", "-1")
        length = math.ceil(seconds(wav) * 10) / 10
        scene["seconds"] = length
        record["scenes"].append({"id": scene["id"], "narration": text, "seconds": length, "sentences": said})
        print(f"voice: {scene['id']}: {length} s", flush=True)

    # Each narrated scene's seconds, written in place (the file keeps its layout).
    src = lesson_file.read_text()
    found = list(re.finditer(r'"seconds":\s*[0-9.]+', src))
    if len(found) != len(scenes):
        fail("lesson.json: expected one \"seconds\" a scene")
    for m, scene in reversed(list(zip(found, scenes))):
        src = src[: m.start()] + f'"seconds": {scene["seconds"]:g}' + src[m.end():]
    lesson_file.write_text(src)
    (ROOT / "lessons" / a.slug / "voice.json").write_text(json.dumps(record, indent=2) + "\n")
    total = sum(s["seconds"] for s in scenes)
    print(f"voice: {a.slug}: narrated, {total:.1f} s in all; lesson.json and voice.json updated")


if __name__ == "__main__":
    main()
