# intro-xetal

Syntax you can see: a long-form landscape video (3 minutes 20 seconds)
introducing how to read X_eTaL, after its syntax poster
([poster](https://softwarewrighter.github.io/X_eTaL/poster/)),
narrated in the author's cloned voice (`just voice intro-xetal`);
each scene is as long as its narration.

One scene a panel of the poster, each with real X_eTaL lines as the
pinned `xetal` draws them and, where it helps, the arrays they give;
then the published poster itself, recorded, and the links.

| File | What |
| ---- | ---- |
| `lesson.json` | sixteen scenes: the idea; function or value; where a name came from; importing a library; definitions; apply or pass; axes; rotate and transpose; power; lambdas; system names; the question mark; typed as ASCII; trains; the poster page; the links |
| `data.xtl` | the poster's samples run: a reverse, a comparison, a function passed to each and to reduce, a table summed, rotated and transposed along its axes, a glider and Life to the fourth power of it, a lambda, factorials through a guard, two trains |
| `timing.json` | the schedule X_eTaL computes from the lesson; checked by the gate |
| `title.txt`, `description.txt` | the YouTube title and description, with chapters (`just youtube intro-xetal` gathers them with the video and captions) |
| `voice.json` | the narration as spoken: each sentence, what whisper heard, each scene's seconds, the voice sample |

```bash
just voice intro-xetal              # narrate (VoxCPM on queenbee), scene lengths from the audio
just capture intro-xetal landscape  # record the poster page (network)
just render intro-xetal             # out/intro-xetal-landscape-remotion.mp4
just youtube intro-xetal            # out/intro-xetal-youtube/: video, title, description, captions
```

It is landscape only: longer than two and a half minutes, it is not
a short. The recorded page is the poster at
`softwarewrighter.github.io/X_eTaL/poster/` (the lesson's `demo`),
scrolled to its fourth, eighth and eleventh panels.
