# k-means

k-means without a loop: a 62 second short about X_eTaL-ML's
[k-means](https://softwarewrighter.github.io/X_eTaL-ML/k-means/)
demo, made portrait, narrated in the author's cloned voice; each
scene is as long as its narration.

Five scenes are drawn from arrays X_eTaL printed; one is the
published page itself, recorded as it runs.

| File | What |
| ---- | ---- |
| `lesson.json` | seven scenes: the points finding their centers from a poor start; every point's distance to every center as a table; the nearest as one-hot rows; the new centers as means by group; ten steps from two starts side by side; the live page; the link |
| `data.xtl` | the demo's own program (its 300 points in five blobs, its two starts) and its Learn library's step (distances, nearest, means by group), printing the demo's inertia and centers, ten points' distances and nearest centers, the centers before and after a step, and ten steps of the points and centers from each start |
| `timing.json` | the schedule X_eTaL computes from the lesson; checked by the gate |
| `title.txt`, `description.txt` | the YouTube title and description (`just youtube k-means` gathers them with the video and captions) |
| `voice.json` | the narration as spoken (`just voice k-means`): each sentence, what whisper heard, each scene's seconds, the voice sample |

```bash
just voice k-means       # narrate (VoxCPM on queenbee), scene lengths from the audio
just capture k-means     # record the page (network), portrait
just render k-means      # out/k-means-portrait-remotion.mp4
just youtube k-means     # out/k-means-youtube/: video, title, description, captions
```

The tables use the farthest-first centers, one in each blob, and
ten points, two from each blob (points 16, 46, ... 286). A distance
of 0 is a point that is itself a center.

The points boards draw every third point (100 of 300) in the color
of its nearest center, a step every 25 frames. The renderer colors a
body by its place in the board (`"points"` boards were made for
N-body), so `data.xtl` writes each point as six bodies: the one in
its center's color sits on the point, the others sit unseen under
their own center or under the next point. A line from a center to a
point is that point changing center; the lines that follow a center
are its path.

One thing differs from the demo: it uses X_eTaL-ML's Learn and NN
libraries, which are not on this repository's path, so `data.xtl`
copies their lines (distance, argmax, one-hot, assign, step,
inertia, farthest-first) as they are. Its inertia from both starts
and the poor start's centers after ten steps match the demo's
baseline (`reg/cli-k-means.out`). The numbers on screen are rounded
to two places.
