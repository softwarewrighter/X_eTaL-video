# Postmortem: episode 01 (al-01-why)

Episode 01 of the array languages series, "Why another programming
language?", about 9 minutes of narrated video. Planned on 2026-11-19
at 16:30; the script was approved that evening; the video was still
being corrected on 2026-11-20 at 16:50. About 24 working hours for 9
minutes of narration. The goal for later episodes is more than one
video a day. This is blameless: it is about the process and the tools.

## What the time went to

| Cause | Cost | Root cause |
| ----- | ---- | ---------- |
| Every voice request took about 90 s, however short | the floor under everything below | Fixed per-request cost on the voice server (VoxCPM, Gradio on queenbee). Not the 63 s voice sample: a 17 s excerpt took 90.8 s too. Still unexplained |
| One sentence at a time, at first | about 100 requests, 2.5 hours, for a first pass | No batching; 11 sentences in one request also take about 90 s (found on day 2) |
| Problem words found sentence by sentence | most of day 2 | No word list before narration: the name, APL, IBM, BQN, GPU, Adreno, arrays, lints each found by a failed take, retried, respelled, retried |
| Spellings that seemed to work, then did not | several rounds | A spelling heard right in one sentence failed in another (X_eTaL "ecks, tee, elle": XTL in one, XDL in another). Only a word clip, made once and spliced, was reliable |
| Narration halted on one sentence | 2 halts, about 30 min | A take whisper could not confirm stopped the whole run; the comparison could not spell thousands, "a hundred", contractions, mixed marks |
| Stalls nobody saw | about 1 hour in all | A run halted and its watcher did not report it; a run waited 34 minutes on a process it mistook for a narration; a starved worker waited 20 minutes for its turn |
| Facts and claims corrected after narration | about 10 remakes | APL\360 called the first APL you could type at (it was APL\1130, the author); "the same program" when it was similar; an empty scene; wording that could be misread ("it reads as a times sign") |
| Tools fixed while in use | many small delays | Supervisor bugs (a stop signal deferred during sleep, killing the next run's workers; a stall clock starting at old audio); a review page showing wrong clips; a clip check fooled by its own take |
| Estimates that did not hold | the author's time, and trust | ETAs from a nominal 90 s a sentence, without retries, waits or halts |

## What worked

- **The review page**: each scene with its script, what was sent to the
  voice, the audio, what whisper heard, and a clip as it plays; the
  author reviewed scenes while others were still being made.
- **Word clips**: a hard word said once in a carrier sentence, cut at
  its pause, checked by whisper after a fixed "The next word is", and
  spliced in. Once made (xtl, apl, ibm, arrays, lints, ray-tracer),
  never wrong again.
- **Batching**: 3 or 4 sentences in one 91 s request, cut apart by
  whisper's word times, each checked; on the last day every new
  sentence came out right the first time this way.
- **Parallel agents** on separate problems (sentence openings, scene
  pictures, the preflight, batching), every voice request through one
  first-come-first-served queue.
- **Text checks before any request**: only commas and periods, no
  possessives, acronyms spelled out, a picture for every narrated scene.
- **Testing a spelling on one sentence** before remaking many.

## What did not work

- Spelling acronyms phonetically as a cure: the voice says the same
  spelling differently in different sentences, and some ("eh" for A,
  "A," at a sentence start) are misread outright.
- One-word text pieces around a splice ("And a", "When", "The"): spoken
  alone, they come out wrong. The name goes first, or a phrase.
- Whisper as the only judge: it cannot hear pace (IBM said I... B... M)
  or a run-together join ("as eh-PL"); the author's ear caught both.
- Reporting progress from estimates instead of from what the logs
  showed.
- Editing a running script, piping away an exit code, and watchers that
  reported only success.

## What changes (done)

1. `just voice-preflight SLUG` before any narration: every risky word,
   handled by a clip or a tested spelling (`docs/voice-words.json`), or
   the command to make one.
2. Word clips for hard words, checked against a fixed prefix
   (`--word`, `--tighten`, `--fit`, `--max-seconds`).
3. Batched narration in `just produce`: batches of up to 12 sentences a
   request, cut by pauses or whisper's word times, each checked, misses
   in the next batch.
4. Text checks before every request and in `just voice --check`; the
   gate runs their tests.
5. Narration never halts on a sentence; it flags it for a listen.
6. A fair queue for the voice server; workers take sentences in order.
7. The supervisor: stall restarts from its own start, its own workers
   only, a wait of at most 5 minutes, the review follower after assembly.
8. The review page: four parts a scene, problem words at the top, clips
   checked (not silent, not black), each scene's whisper.

## What changes (to do)

1. Find where the voice server's 90 s per request goes (the author's
   agent on queenbee): with the GPU mostly idle, a fixed cost is the
   largest remaining factor in a day's output.
2. Batch only full sentences of similar length: short ones run together
   like a list when batched; a listen decides.
3. Splice joins: a pause long enough before a clip (scene 13's APL
   joins, 0.12 s, ran "as" into the A; the author picks the length).
4. The preflight's common-word list is noisy (built from 13 lessons);
   uncommon plain words should warn, not fail.

## The workflow for the next episode

In `docs/production-lessons.md`, and as rules in CLAUDE.md. In short:
facts checked with the author first; every scene with a picture;
preflight; word clips for hard words, made in one batch; narration in
batches; parallel agents on separate problems; the review page from the
first draft; estimates from measured request times; every event watched.
