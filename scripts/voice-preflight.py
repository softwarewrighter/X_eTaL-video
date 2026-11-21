"""Find a lesson's problem words before any sentence is narrated.

  .venv/bin/python scripts/voice-preflight.py SLUG     (just voice-preflight SLUG)

Reads lessons/SLUG/lesson.json, never the voice server. Every narrated
sentence is scanned for words the voice (VoxCPM) is likely to say
wrong, and each is reported as handled or not; the unhandled ones get
a suggested scripts/voice.sh SLUG --word command. Exits 1 if any word
is unhandled.

A word is risky when it is (the heuristic, kept simple on purpose):
- marked, {written|spoken}, unless the mark is a heteronym decision
  ({read|red}: the written word, or its stem without -s, -es, -ed or
  -ing, is in voice.HETERONYMS, or spoken equals written). Every other
  mark respells a hard word: an acronym, the language name, a model
  number, a brand.
- unmarked: capitals (APL) or mixed case (LaTeX), the language name
  (X_eTaL), a single letter (J; not I, a, or A starting a sentence), a
  run of two or more letter names (ay pee el), digits, a possessive
  (Iverson's), a hyphenated word, or a word not in the common-word
  allowlist. The allowlist is derived from the narration of the other
  lessons (lessons/*/lesson.json, the one checked aside): the words
  that appear, lowercase or first in a sentence, in at least
  ALLOW_LESSONS of them. A word capitalized mid-sentence is a name,
  never common.

A risky word is handled when:
- it is a clip, @NAME, and work/voice-words/NAME.wav exists;
- it is a mark whose spoken form is a known-good use of that word in
  docs/voice-words.json (case, commas and spaces aside), and not a
  notLast use at the end of a sentence;
- it is hyphenated or a contraction and every part is common (bare()
  sends the parts as words, contractions written out);
- it is unmarked and a sentence containing it, as spoken, was heard
  right by whisper (not UNVERIFIED) in some lesson's voice.json, or it
  won a --spell run (work/voice-spell.json), or docs/voice-words.json
  lists it as said as itself.
Digits, possessives, unmarked capitals and the unmarked language name
are never handled: voice.py refuses them; reword or mark them.
"""

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import voice  # noqa: E402

ROOT = voice.ROOT
TABLE = ROOT / "docs" / "voice-words.json"
ALLOW_LESSONS = 1
TOKEN = re.compile(r"@[a-z][a-z0-9-]*|[A-Za-z0-9_\\]+(?:[-'\u2019][A-Za-z0-9]+)*")


def norm(text: str) -> str:
    """A spoken form compared: lowercase words, commas and case aside."""
    return " ".join(re.findall(r"@[a-z0-9-]+|[a-z0-9]+", text.lower()))


def key(word: str) -> str:
    """A written word compared: letters and digits only (X_eTaL, xetal)."""
    return re.sub(r"[^a-z0-9]", "", word.lower())


def load_table(path: Path = TABLE) -> list[dict]:
    return json.loads(path.read_text())["words"]


def narrations(root: Path = ROOT) -> dict[str, str]:
    """Every lesson's narration, joined: slug -> text as written."""
    out = {}
    for f in sorted((root / "lessons").glob("*/lesson.json")):
        scenes = json.loads(f.read_text()).get("scenes") or []
        out[f.parent.name] = " ".join(s["narration"] for s in scenes if s.get("narration"))
    return out


def allowlist(texts: dict[str, str], least: int = ALLOW_LESSONS, but: str = "") -> set[str]:
    """The words in at least `least` lessons' narration (the lesson `but`
    aside: its own words are what is checked), lowercase: a word
    written in lowercase, or first in its sentence (a capital elsewhere
    is a name)."""
    seen: dict[str, set[str]] = {}
    for slug, text in texts.items():
        if slug == but:
            continue
        for s in voice.sentences(voice.written(text)):
            # As sent: contractions written out, hyphens as spaces.
            for i, w in enumerate(re.findall(r"[A-Za-z]+", voice.bare(s))):
                if w.islower() or (i == 0 and w[1:].islower() or len(w) == 1 and i == 0):
                    seen.setdefault(w.lower(), set()).add(slug)
    return {w for w, s in seen.items() if len(s) >= least}


def evidence(root: Path = ROOT) -> dict[str, str]:
    """Words the voice said right: every word, lowercase, of a sentence
    whisper heard right (not unverified) in any lessons/*/voice.json, as
    spoken -> the lesson it was heard in."""
    out: dict[str, str] = {}
    for f in sorted((root / "lessons").glob("*/voice.json")):
        for scene in json.loads(f.read_text()).get("scenes", []):
            for s in scene.get("sentences", []):
                if s.get("unverified") or str(s.get("heard", "")).startswith(voice.UNVERIFIED):
                    continue
                said = voice.bare(re.sub(r"@[a-z][a-z0-9-]*", " ", s.get("spoken") or s.get("text", "")))
                for w in re.findall(r"[a-z]+", said.lower()):
                    out.setdefault(w, f.parent.name)
    # Words found by --spell (scripts/voice.py find_spelling): the winner
    # was heard right in a carrier sentence.
    spell = root / "work" / "voice-spell.json"
    if spell.is_file():
        for entry in json.loads(spell.read_text()).values():
            for w in re.findall(r"[a-z]+", voice.bare(entry.get("winner") or "").lower()):
                out.setdefault(w, "work/voice-spell.json")
    return out


def heteronym(written: str, spoken: str) -> bool:
    w = written.strip(" ,.").lower()
    if norm(written) == norm(spoken):
        return True
    stems = {w, re.sub(r"(ing|es|ed|s)$", "", w)}
    return bool(stems & voice.HETERONYMS)


def at_end(sentence: str, end: int) -> bool:
    return not re.search(r"[A-Za-z0-9@]", sentence[end:])


def check_mark(written, spoken, last, table, clips):
    """(category, handled, why) for one {written|spoken} mark."""
    used = re.findall(r"@[a-z][a-z0-9-]*", spoken)
    if used:
        missing = [u for u in used if u[1:] not in clips]
        if missing:
            return "clip", False, f"no clip work/voice-words/{missing[0][1:]}.wav"
        return "clip", True, "clip " + ", ".join(used)
    rows = [r for r in table if key(r["word"]) == key(written) and norm(r["use"]) == norm(spoken)]
    bad = [r for r in rows if not r.get("ok")]
    if bad:
        return "mark", False, f"known to fail (heard {bad[0]['heard']})"
    good = [r for r in rows if r.get("ok")]
    if good and good[0].get("notLast") and last:
        return "mark", False, "known to fail at the end of a sentence"
    if good:
        return "mark", True, f"known good ({good[0]['date']})"
    return "mark", False, "spelling not in docs/voice-words.json"


def check_word(tok, i, common, heard, table, clips):
    """(category, handled, why) for one unmarked word, or None if not risky."""
    if tok.startswith("@"):
        return ("clip", True, "clip") if tok[1:] in clips else ("clip", False, f"no clip work/voice-words/{tok[1:]}.wav")
    t = tok.replace("\u2019", "'")
    low = t.lower()
    said_as_itself = any(key(r["word"]) == key(t) and norm(r["use"]) == norm(t) and r.get("ok") for r in table)
    if re.search(r"\d", t):
        return "number", False, "digits: spell the number"
    if "_" in t or key(t) == "xetal":
        return "name", False, "the language name: mark it with a clip, {X_eTaL|@xtl}"
    if re.search(r"'s$", low) and low not in voice.CONTRACTIONS:
        return "possessive", False, "a possessive: reword it"
    if re.fullmatch(r"[A-Z]{2,}", t) or re.search(r"[a-z][A-Z]", t):
        return "acronym", False, "capitals or mixed case: mark it with a spelling or a clip"
    if len(t) == 1 and t not in ("I", "a") and not (t == "A" and i == 0):
        if said_as_itself or low in heard:
            return "letter", True, "heard right before" + (f" ({heard[low]})" if low in heard else "")
        return "letter", False, "a single letter: mark it with its name, {J|jay}"
    if "-" in t or "'" in t:
        # Sent as separate words: bare() turns hyphens into spaces and
        # writes contractions out (it's, it is).
        parts = voice.bare(t).lower().split()
        if all(p in common for p in parts):
            return None if "-" not in t else ("hyphenated", True, "sent as separate common words")
        if all(p in common or p in heard for p in parts):
            return ("hyphenated" if "-" in t else "uncommon"), True, "parts heard right before"
        if "-" in t:
            return "hyphenated", False, "a part is uncommon and never heard right"
        return "uncommon", False, "written out, a part is uncommon and never heard right"
    name = t[0].isupper() and i > 0
    if not name and low in common:
        return None
    if said_as_itself:
        return ("name" if name else "uncommon"), True, "known good (docs/voice-words.json)"
    if low in heard:
        return ("name" if name else "uncommon"), True, f"heard right before ({heard[low]})"
    return ("name" if name else "uncommon"), False, "not common and never heard right"


def scan(scenes, common, heard, table, clips):
    """Every risky word of the narrated scenes: dicts with scene, word,
    spoken, category, ok, why."""
    out = []
    for scene in scenes:
        for raw in voice.sentences(scene.get("narration") or ""):
            # Letter-name runs left unmarked ("ay pee el").
            names = "|".join(voice.LETTER_NAMES)
            plain = voice.MARK.sub(" ", raw)
            in_run = set()
            for m in re.finditer(rf"\b(?:{names})(?:,? (?:{names}))+\b", plain.lower()):
                letters = "".join(voice.LETTER_NAMES[w] for w in re.findall(r"[a-z]+", m.group())).upper()
                if not set(re.findall(r"[a-z]+", m.group())) <= {"you", "see", "bee", "queue"}:  # plain English
                    in_run |= set(re.findall(r"[a-z]+", m.group()))
                    out.append(dict(scene=scene["id"], word=m.group(), spoken=m.group(), category="letters", ok=False,
                                    why=f"letter names left unmarked: mark them, {{{letters}|{m.group()}}}"))
            # Marks, then the words between them.
            pos, i = 0, 0
            for m in list(voice.MARK.finditer(raw)) + [None]:
                chunk = raw[pos:m.start() if m else len(raw)]
                for t in TOKEN.findall(chunk):
                    r = None if t.lower() in in_run else check_word(t, i, common, heard, table, clips)
                    i += 1
                    if r:
                        out.append(dict(scene=scene["id"], word=t, spoken=t, category=r[0], ok=r[1], why=r[2]))
                if not m:
                    break
                written, spoken = m.group(1), m.group(2)
                i += 1
                pos = m.end()
                if heteronym(written, spoken) and "@" not in spoken:
                    continue
                r = check_mark(written, spoken, at_end(raw, m.end()), table, clips)
                out.append(dict(scene=scene["id"], word=written.strip(" ,."), spoken=spoken.strip(" ,"), category=r[0], ok=r[1], why=r[2]))
    return out


def suggest(slug: str, f: dict, table: list[dict]) -> str:
    """The next command for an unhandled word."""
    w = f["word"]
    clip = [r for r in table if key(r["word"]) == key(w) and r.get("ok") and r["use"].startswith("@")]
    if clip and f["category"] != "clip":
        return f"use the clip: {{{w}|{clip[0]['use']}}}"
    good = [r for r in table if key(r["word"]) == key(w) and r.get("ok") and not r.get("notLast")]
    if good and f["category"] != "clip":
        return f"use the known spelling: {{{w}|{good[0]['use']}}}"
    if f["category"] in ("number", "possessive"):
        return "reword it"
    if f["category"] in ("uncommon", "name") and re.fullmatch(r"[A-Za-z]+", w):
        # A plain word: one carrier sentence (--spell), its result kept in
        # work/voice-spell.json, which counts as heard right.
        return f"scripts/voice.sh {slug} --spell {w} {w} {w}"
    name = re.sub(r"[^a-z0-9]+", "-", key(w) if f["category"] in ("mark", "acronym", "name") else w.lower()).strip("-")
    if f["category"] == "clip":
        name = re.sub(r"[^a-z0-9-]", "", f["spoken"].lstrip("@"))
    expect = re.sub(r"[^A-Za-z0-9]", "", w)
    says = [f["spoken"]] if f["spoken"] != w and not f["spoken"].startswith("@") else []
    if re.fullmatch(r"[A-Za-z' -]+", w):  # the word as written, when the voice could read it
        says += [w.lower() if w.isupper() or not says else w]
    if re.fullmatch(r"[A-Z]{2,4}", expect):
        says.append(", ".join(expect))
    says = list(dict.fromkeys(s for s in says if s))
    return f"scripts/voice.sh {slug} --word {name} --expect {expect} " + " ".join(f'--say "{s}"' for s in says)


def main() -> None:
    if len(sys.argv) != 2 or sys.argv[1].startswith("-"):
        sys.exit("usage: voice-preflight.py SLUG")
    slug = sys.argv[1]
    lesson = ROOT / "lessons" / slug / "lesson.json"
    if not lesson.is_file():
        sys.exit(f"voice-preflight: no lesson {lesson}")
    scenes = json.loads(lesson.read_text())["scenes"]
    table = load_table()
    clips = {p.stem for p in voice.WORDS.glob("*.wav")} if voice.WORDS.is_dir() else set()
    found = scan(scenes, allowlist(narrations(), but=slug), evidence(), table, clips)
    # One line a word, its spoken form and verdict, with the scenes it is in.
    groups: dict[tuple, list[str]] = {}
    for f in found:
        groups.setdefault((f["ok"], f["category"], f["word"], f["spoken"], f["why"]), []).append(f["scene"])
    bad = [g for g in groups if not g[0]]
    print(f"voice-preflight {slug}: {len(groups)} risky word(s), {len(bad)} unhandled")
    # Plain words handled by evidence, one line: the list is long and
    # rarely interesting.
    plain = sorted({g[2] for g in groups if g[0] and g[1] in ("uncommon", "name", "letter", "hyphenated")}, key=str.lower)
    if plain:
        print(f"  ok    {len(plain)} uncommon word(s) or name(s), heard right before or common parts: " + ", ".join(plain))
    for g in sorted(groups, key=lambda g: (not g[0], g[1], g[2].lower())):
        ok, cat, word, spoken, why = g
        if ok and g[2] in plain and cat in ("uncommon", "name", "letter", "hyphenated"):
            continue
        said = f" -> {spoken!r}" if spoken != word else ""
        where = ", ".join(dict.fromkeys(groups[g]))
        print(f"  {'ok  ' if ok else 'NEED'}  {cat:<10} {word}{said}: {why} [{where}]")
    if bad:
        print("\nunhandled, and what to do (scripts/voice.sh --word and --spell ask the voice server: the author's go-ahead first):")
        for g in sorted(bad, key=lambda g: (g[1], g[2].lower())):
            f = dict(category=g[1], word=g[2], spoken=g[3])
            print(f"  {g[2]}{' -> ' + repr(g[3]) if g[3] != g[2] else ''}: {suggest(slug, f, table)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
