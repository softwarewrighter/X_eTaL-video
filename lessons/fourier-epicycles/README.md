# fourier-epicycles

Circles that draw a heart: a short about X_eTaL-demos'
[Fourier epicycles](https://softwarewrighter.github.io/X_eTaL-demos/fourier-epicycles/),
portrait, narrated in the author's cloned voice; each scene is as
long as its narration.

Five scenes are drawn from arrays X_eTaL printed; one is the
published page itself, recorded as it switches from the heart to the
star and the flower.

| File | What |
| ---- | ---- |
| `lesson.json` | seven scenes: the heart rebuilt from more and more circles; the table of angles; the transform and the circles by size; the running sum along the chain; every reconstruction and its error; the live page; the link |
| `data.xtl` | the demo's own program (its angles, transform, circles, chain and error, line for line) on the page's heart of 128 points, printing the angle table's cosines, the eight biggest circles, the chain before and after its running sum, the heart rebuilt from 1, 2, 4 and 8 circles at every moment, and the mean error from 1 to 8 circles |
| `timing.json` | the schedule X_eTaL computes from the lesson; checked by the gate |
| `title.txt`, `description.txt` | the YouTube title and description (`just youtube fourier-epicycles` gathers them with the video and captions) |
| `voice.json` | the narration as spoken (`just voice fourier-epicycles`): each sentence, what whisper heard, each scene's seconds, the voice sample |

```bash
just voice fourier-epicycles      # narrate (VoxCPM on queenbee), scene lengths from the audio
just capture fourier-epicycles    # record the page (network)
just render fourier-epicycles     # out/fourier-epicycles-portrait-remotion.mp4
just youtube fourier-epicycles    # out/fourier-epicycles-youtube/: video, title, description, captions
```

The heart is the page's: x = 16 sin^3 t, y = 13 cos t - 5 cos 2t -
2 cos 3t - cos 4t, both over 17, at 128 moments. It has only eight
circles (speeds -4 to 4, no 0), so the eighth rebuilds it exactly.
The points board steps a moment a frame (`stepFrames` is 1), three
times round. The angle table is shown by its first 32 rows and
columns, the chain at six moments an eighth of a turn apart and its
first five circles; the numbers on screen are rounded to two places.
The demo's program runs unchanged under the pinned X_eTaL.
