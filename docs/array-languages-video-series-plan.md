# Array languages: a video series plan

The author (2026-11-19): read `docs/research2.txt` and plan the first
video it suggests, made with the pattern of the Throwback Thursday
video (`lessons/tbt-2741`): a 5 second title with music, Remotion
explainer slides with music between sections in place of narration,
and the standard closing (the reused call to action, then a close
with 7 seconds of outro music faded in). The author provides the
longer music clips.

`docs/research2.txt` is an archival proposal (a 76 episode course,
scripts for the first episodes, a production design), not normative:
its claims about X_eTaL are checked against the pinned X_eTaL before
any of them is said or shown, and its narration is rewritten where it
speaks for the author (see "Rules for every episode").

## How this relates to the existing plan

`docs/curriculum.md` already plans five series (the language
tutorials, macros, comparisons, what people build, beyond the CPU).
This series comes before them: research2's point is that people
should learn to think in arrays before they learn X_eTaL's syntax, so
its first seven episodes are mostly language-neutral. Where they meet:

| This series | `docs/curriculum.md` |
| ----------- | -------------------- |
| 01 Why another programming language? | `why-xetal` (Series 3) |
| 03 Shape, rank, axes | `t-arrays` (Series 1, #3) |
| 07 APL, J, K, BQN and X_eTaL | `vs-apl` (Series 3) |
| 08 Reading and writing X_eTaL | `intro-xetal`, `t-reading`, `t-names` (made or being made) |
| 10, 11 Functions, pipelines | `t-functions`, `t-operators`, `t-trains` |

This series replaces the older plan (the author, 2026-11-19): its
order governs; the videos already made (`intro-xetal`, `t-names`,
the shorts) stay as they are.

## The episodes (from research2, the first module first)

| # | Title | Target | Status |
| - | ----- | ------ | ------ |
| 01 | Why another programming language? | 8 min | being made: saga 10 |
| 02 | From scalar loops to array operations | 10 min | later |
| 03 | Shape, rank, axes and dimensions | 10 min | later |
| 04 | Mapping, filtering and reducing | 11 min | later |
| 05 | Broadcasting and array semantics | 10 min | later |
| 06 | Array idioms: thinking without loops | 12 min | later |
| 07 | APL, J, K, BQN and X_eTaL | 10 min | later |
| 08 | Reading and writing X_eTaL | 12 min | later |
| 09 | Bindings, values and immutability | 9 min | later |
| 10 | Functions as values | 11 min | later |
| 11 | Pipelines and function composition | 11 min | later |
| 12 | Your first complete X_eTaL program | 14 min | later |

research2's later modules (types and functional programming; idioms,
macros and language design; libraries and extensions; demos and
games; GPU and FPGA; machine learning; fine-tuning and research) are
planned when the first twelve are, as research2 itself recommends
(a pilot first, then the rest only once its pacing, look, voice and
accuracy are accepted). FPGA goes to the hardwarewrighter channel.

Each episode runs 5 to 15 minutes (the author, 2026-11-19; 8 is good
for episode 01).

## X_eTaL changes coming (the author, 2026-11-19)

X_eTaL is pinned at 1df48523 (moved to the latest at this saga's
start). Coming soon, and worth planning around:

| Step | Change | Matters to |
| ---- | ------ | ---------- |
| 150 | numbers on a grid (`[]N_GRID`); almost done | arrays drawn with their values: episodes 03 to 06 |
| 171 | a macro naming its own library by the importer's alias | the macro episodes |
| 196 | data paths relative to the program file (breaking) | episode 12 and any example that reads a file |
| 197 | a comparison's result defaulting to Int (breaking) | filtering, masks, counting: episodes 02, 04, 06 |
| 198 | `c_heck<` and the stopping `a_ssert<` (breaking) | episode 15, errors and assertions |
| 199 | the Never type | episode 15 |

An episode that shows one of these waits for it, or is pinned and
noted; the breaking ones are checked again when the pin moves.

## The shape of every episode

As `lessons/tbt-2741` (a story lesson, `kind: "story"`):

| Part | Length | Sound | Picture |
| ---- | ------ | ----- | ------- |
| Title | 5 s | the intro music (episode 01: `hammond-glide.wav`, the author): its first 5 s, a 0.5 s fade at the end | a Remotion title card: series, episode number, title |
| Sections | most of the video | the narration (VoxCPM, the author's voice) | Remotion panels (code, arrays, the typed and drawn source), recordings of the live pages, pictures |
| Section breaks | about 7 s each | music only: a 7 s piece from the middle of the track, faded in and out, each break at a different offset, at 30% | a silent Remotion explainer slide (points, a timeline, a flow) |
| Coming up | about 2 min | a silent slide, then narrated | what later episodes cover, each from its post or repository and its pictures (the author, 2026-11-19: teasers before the end) |
| Exercise | about 20 s | narrated | the question, on screen |
| Call to action | 12 s | its own narration | the reused `99b-epilog.mp4`, as it is |
| Close | 5 s | the outro music: the track's last 7 s, a 1 s fade in, starting 2 s before the close | the reused `99c` clip, muted, essentially blank (YouTube overlays the end cards) |

## Rules for every episode

1. **Nothing invented.** The narration says only what a source says:
   X_eTaL's README and docs at the pin, the Array Languages blog
   posts, the author's messages. The author's reasons and preferences
   are quoted from those sources or asked about, never written for
   them. A research2 sentence that speaks for the author ("X_eTaL
   builds on that tradition while exploring ...") is replaced by
   what the sources say.
2. **Every X_eTaL example runs** at the pinned commit, its output
   shown as the pinned `xetal` prints it, and is drawn as rendered
   (rule 4a). Other languages' code is shown as `code` lines, and is
   checked where a tool is at hand.
3. **The name is said** "ecks, tee, elle" (the author, 2026-11-20:
   `{X_eTaL|ecks, tee, elle}`), and shown as X_eTaL; the narration does
   not talk around it ("this language").
4. **Pronunciation is reviewed word by word** (rule 4c), with acronym
   marks (`{APL|A P L}`, `{BQN|B Q N}`).
5. **Dates and facts carry their source** in the lesson's README.
6. **A review page as we go** (`just review SLUG`): the scenes and
   their narration from the first draft, then stills, audio, whisper,
   and video per scene as each exists, at
   `http://127.0.0.1:8427/X_eTaL-video/review/SLUG/`.

## Episode 01: Why another programming language?

Slug `al-01-why`, landscape, about 8 minutes. research2's six scenes,
checked and adapted to the pattern above. The table is the first draft;
the scenes as made (27, with the author's why, the name, what it
borrows, a small core) are in `lessons/al-01-why/README.md`.

Learning objective: what an array language is, how it differs from
scalar, loop-at-a-time programming, and what X_eTaL is trying to do.

| # | Scene | Picture | Sources and checks |
| - | ----- | ------- | ------------------ |
| 0 | Title | title card, intro music | |
| 1 | A different way of thinking | a loop's steps, one at a time, then one array expression | research2 scene 1 |
| - | (break) What an array language is | silent slide: points | research2, the README's first lines |
| 2 | The scalar model | the Rust loop (`values`, `result.push(x * 2)`), its parts highlighted: storage, iteration, the one real operation | research2 scene 2 |
| 3 | Whole-array operations | four cells doubled together, then a hundred; the X_eTaL line `2 * values`, drawn, and its output `2 4 6 8` | checked: `2 * 1 2 3 4` gives `2 4 6 8` at the pin |
| - | (break) The family | silent slide: a timeline | dates from the blog: APL notation 1962, APL\360 1968, APL2 1984, J 1990, K (year to source), BQN 2020, X_eTaL 2026 (first commit 2026-09-27, `docs/history.md`) |
| 4 | Where array languages came from | the same sum in each: APL `+/`, J `+/`, K `+/`, BQN `+´`, X_eTaL `'+ r_/` | checked: `'+ r_/ r_ange 10` gives `55`; the others to check |
| 5 | Why X_eTaL | typed ASCII becoming the drawn form; the live editor (recorded) | README: "what would APL look like if it were designed today for composition, readability, tooling, and machine learning?"; "The goal isn't to replace existing languages"; the philosophy post (#17) |
| - | (break) What it is made of | silent slide: a flow, typed ASCII to drawn to run | README |
| 6 | What you will learn | a montage: arrays, types, macros, the demos (Life, Mandelbrot, n-body), GPU, ML | the published lessons' recordings; only what exists is shown as existing |
| 7 | Exercise | which parts of the loop compute, which only iterate | research2 |
| 8 | Call to action | `99b-epilog.mp4` | reused |
| 9 | Close | `99c`, muted, outro music | reused |

Corrections to research2 for this episode:

- "X_eTaL is short for eXperimental Extensible Typed Array Language"
  is said as the words only; the name is shown.
- research2's color claims (blue built-ins, green user functions,
  cyan library, violet macros, amber effects) are not used: the
  video shows X_eTaL's own rendering, whatever its colors are.
- "Why Not COBOL? | Andrew C. Young", "GitHub +1" and similar are
  citation debris from the chat research2 came from, not content.

What the renderer needs first (one shared step, before the voice):

1. **A code panel in a story scene**: lines of `code` (Rust, APL, J,
   K, BQN) and `xtl` (drawn by the pinned `xetal`), one panel or two
   side by side, a line's parts highlighted in turn.
2. **Array cells**: a row of values transformed one at a time (the
   loop) or all at once (the array), then the same for many values;
   every reveal from X_eTaL's schedule (rule 4).
3. **Typed and drawn**: the ASCII and the drawn line, one becoming
   the other.

## Saga 10: al-01-why

1. series-plan -- this document, `docs/research2.txt` tracked as
   archival, the saga.
2. al-01-script -- `lessons/al-01-why/`: the lesson (scenes,
   narration, slides), `data.xtl` with every example run at the pin,
   the other languages' lines checked, the README with each fact's
   source; `just review al-01-why` shows the script before any voice.
   The author reviews the script.
3. story-panels -- the renderer: code panels, array cells, typed and
   drawn, in story scenes (`remotion/src`, the schema).
4. al-01-voice -- the narration (VoxCPM, whisper-checked), the
   recordings of the live editor, the music from the author's track,
   rendered; the review page complete, per scene.
5. al-01-publish -- after the author's review: `out/al-01-why-youtube/`
   (title, description with chapters, captions, the video).

## Answered (the author, 2026-11-19)

1. This series replaces the older plan (`docs/curriculum.md`).
2. On screen: "Array Languages: episode 1".
3. Music for episode 01: `/Users/mike/Downloads/hammond-glide.wav`
   (14.8 s): its first 5 s for the title, its middle for the breaks,
   its last 7 s for the close.
4. The why, in the author's words: "This may be the dawn of Personal
   Programming Languages, and this is not the first one I've started
   creating."
5. Length: 5 to 15 minutes an episode; 8 is good.
6. The pin: moved to the latest (1df48523); the coming changes are
   listed above.
7. Episode 01's script: "looks okay for now".
