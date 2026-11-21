# Production lessons (from episode 01)

Episode 01 (`lessons/al-01-why`) took about two days of narration
retries, stalls and corrections for an 8 minute video. Most of the
time went to the voice (VoxCPM) saying names, acronyms and punctuation
wrong, to tools that failed silently or waited on the wrong thing, and
to facts and claims corrected after they were narrated. This is what
each later episode does differently, in order of the work.

## 0. The workflow, in order

The postmortem (`docs/postmortem-al-01-why.md`) says why each step is
here. A voice request costs about 90 s whatever its length, so the work
is arranged to make few requests and to waste none.

1. **Script with facts checked** by the author, every claim and date;
   every narrated scene with a picture (`just voice SLUG --check`).
2. **Preflight**: `just voice-preflight SLUG` lists every risky word.
   Hard words (names, acronyms) get word clips (`@name`), made together;
   the rest a tested spelling from `docs/voice-words.json`.
3. **Review page before any voice** (`just review SLUG`): the author
   reads the script there, with what will be sent to the voice.
4. **Narration**: `just produce SLUG` (batches of up to 12 sentences a
   request, then three workers for what is left, the recording, the
   render, the review page). Watch every event: the start, waits,
   stalls, each scene, the end.
5. **Parallel agents** for separate problems found in review (a
   sentence each, a word each), every request through the shared queue.
6. **Estimates from the logs**: requests left times 90 s, plus a quarter
   for retries, plus about 6 minutes for the recording and render.
7. **The author listens**; orange sentences first. Fix by word or
   wording, then one batched run.

## 1. Before any voice: the script

- **Check every fact with the author before it is narrated.** A blog
  post can be wrong (episode 01 said APL\360 was the first APL you
  could type at; it was APL\1130). Claims that compare programs ("the
  same program") are checked line by line against what the code does.
- **Every narrated scene has a picture**: a panel, a slide, pictures, a
  recording. A scene with only a heading looked empty (the history
  scene). `just voice --check` refuses one.
- **Narration rules** (CLAUDE.md rule 4c, enforced by `just voice
  --check` and before every call): only commas and periods, a rare `?`
  or `!`; no possessive apostrophes; numbers spelled; no acronym as
  capitals or single letters.
- **Say the language's name; never talk around it.**

## 2. Before any voice: the words

The voice says some words wrong in a sentence however they are spelled
(the name, APL, IBM said too slowly, arrays, lints). Fix them once, at
the start, not sentence by sentence:

1. Run `just voice-preflight SLUG` (no voice server): it lists every
   risky word in the narration (acronyms, letters, the language name,
   numbers, possessives, hyphenated words, words no other lesson
   uses), says whether each is handled (a clip present, a spelling
   known to work, a word heard right before), and prints a command for
   each one that is not. It fails until every word is handled.
2. New words get a verified clip first: `scripts/voice.sh SLUG --word
   NAME --expect TEXT --say CANDIDATE ...` (said in a carrier sentence,
   cut at the pause, checked by whisper after the carrier's own words;
   for a word whose pace matters, `--max-seconds`). A plain word or a
   name can be tried in one carrier sentence instead, `--spell WORD
   WORD WORD`. Both ask the voice server: the author's go-ahead first.
3. In the narration, a hard word is a splice, `{IBM|@ibm}`: the text
   around it is made in pieces and the verified clip goes between.

The spellings and clips found so far, and the spellings that failed
(so they are not tried again), are kept in one place,
`docs/voice-words.json`: each word, the clip or spoken form used, what
whisper heard, whether it worked, and the date. Add a word there once
it is tested; the preflight reads it.

## 3. The narration run

- **Always `just produce SLUG`**, never `just voice` by hand: three
  workers, a fair queue for the voice server, stall restarts, and the
  recording, render and review page after.
- **Estimate honestly**: about 90 s a request on the voice server (the
  63 s voice sample is the likely cause; a shorter sample is the
  author's call), plus about a quarter more for retries, plus about 6
  minutes for the recording and render.
- **Watch every event**: the start, any wait, each scene, each stall,
  the end. A watcher that only reports success misses a run that never
  started (episode 01 sat 34 minutes waiting on a word-clip run it took
  for a narration).
- **Never hide an exit code behind a pipe** (`cmd | tail`): a failed
  gate was committed that way.
- **Never edit a running bash script** (bash reads it as it runs); stop
  it, edit, start again.

## 4. Review

- The review page from the first draft: a still and, for silent scenes,
  a clip with its music, before any voice.
- For every narrated scene, four parts: the script, what was sent to the
  voice, the audio, what whisper heard. Whisper is the first check, not
  the last: it cannot hear pace (IBM said "I... B... M" passes), so the
  author's listen still decides.
- An orange (unverified) sentence is fixed by its word, through the word
  library, not by more takes of the same sentence.

## 5. Splicing (added during episode 01)

- A word clip is cut at the first pause after the carrier's "The next
  word is", and checked after one fixed, verified "The next word is"
  (`work/voice-words/_prefix.wav`), never after its own take: a cut that
  lost a letter ("B, M") once passed when checked against its own audio.
- A spelled acronym said slowly ("I... B... M") is tightened (`--tighten`:
  pauses inside it shortened) and, if still too long, sped up to fit
  (`--fit`, pitch kept); whisper cannot hear pace, so the length limit
  (`--max-seconds`) is the check.
- The text pieces around a clip need enough words to carry the voice:
  "And a" before a clip came out as "under a". Reword so each piece is a
  phrase ("There is also a ...").
- Several agents can work at once (a sentence each, a word each); every
  request goes through the shared first-come-first-served queue, so the
  voice server stays busy and never gets two at a time.

## 6. Batched narration (added after episode 01)

- **A request costs about 90 s whatever its length** (measured: a two
  word piece took 91 s, eleven sentences with 45 s of audio 92 s). So
  `just produce` first runs `scripts/voice-batch.py SLUG` (`just
  voice-batch`): every unmade sentence (and every text piece of a
  spliced sentence) goes in requests of 12, joined with ". ", and the
  take is cut apart; the shards only make what is left.
- **Cutting**: pauses are found against the take's own noise floor,
  which rises through a long take (-55 dB to -38 dB in one of 45 s), so
  a fixed level misses them late in it. Pause length alone is used only
  when it gives the right count and lengths that fit the texts: commas
  can pause longer (up to 1.1 s) than a sentence end (as little as 0.3
  s between short sentences, which come out as a list: "Create a
  variable, enter a loop"). Otherwise whisper's word times place each
  sentence and the longest pause between neighbors is the cut.
- **Every cut is checked by whisper** as a single sentence is; a
  misheard one goes into the next request (three takes in all, then
  kept UNVERIFIED for a listen), and one the voice left out or that
  cannot be placed goes in a later request with other sentences (the
  voice once said twelve sentences for eleven alike).
- **Listen for pace**: short sentences made together are said quickly,
  as a list, not each as a sentence of its own.

## 7. voxq: the one client of the voice server (2026-11-21)

The ~90 s a request was the Python gradio_client, not the server: plain
HTTP takes about 6 s. tools/voxq (Rust) is now the only thing that calls
the server: requesters write a request file into work/voxq/incoming/
(voice.voxq_call does it), voxq serves them oldest first, one at a time,
and writes ID.wav then ID.json into each request's output directory. One
voxq per root (an OS lock), a heartbeat (work/voxq/status.json), a
timeout and retries a request. `target/release/voxq status --root
work/voxq` shows what it is doing. A 9 minute episode is about 100
requests, about 10 minutes of the server's time.
