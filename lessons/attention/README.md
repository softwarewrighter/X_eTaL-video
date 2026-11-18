# attention

Attention as arrays: a 60 second short about X_eTaL-ML's
[attention](https://softwarewrighter.github.io/X_eTaL-ML/attention/)
demo, made portrait, narrated in the author's cloned voice; each
scene is as long as its narration.

Five scenes are drawn from arrays X_eTaL printed; one is the
published page itself, recorded as it switches to the "wide"
sentence.

| File | What |
| ---- | ---- |
| `lesson.json` | seven scenes: the weights as heat; the queries and keys; the scores, rows meeting columns; the softmax by row; the weighted mix; the live page; the link |
| `data.xtl` | the demo's own program (its hand-set head, its scores, its masked softmax, its weighted mix) on its sentence "the animal did not cross the street because it was tired", printing the queries, the keys, the scores, the weights and the outputs |
| `timing.json` | the schedule X_eTaL computes from the lesson; checked by the gate |
| `title.txt`, `description.txt` | the YouTube title and description (`just youtube attention` gathers them with the video and captions) |
| `voice.json` | the narration as spoken (`just voice attention`): each sentence, what whisper heard, each scene's seconds, the voice sample |

```bash
just voice attention             # narrate (VoxCPM on queenbee), scene lengths from the audio
just capture attention portrait  # record the page (network)
just render attention portrait   # out/attention-portrait-remotion.mp4
just youtube attention           # out/attention-youtube/: video, title, description, captions
```

The boards are the sentence's 11 words in order, a row a word (and,
in the scores and weights, a column a word): row 9 is "it", row 11
"tired", column 2 "animal". The queries and keys have two columns:
the animate, a place.

One thing differs from the demo: it reads its vocabulary and head
from `data/` and uses X_eTaL-ML's Attention and NN libraries, which
are not on this repository's path, so `data.xtl` writes the features
and weights out and copies the libraries' lines (softmax by row, the
scores, the masked weights) as they are. Its outputs match the demo's
baseline. The numbers on screen are rounded to two places.
