# lights-out

Lights out without a loop: a short about X_eTaL-games'
[lights-out](https://softwarewrighter.github.io/X_eTaL-games/lights-out/),
made in portrait, narrated in the author's cloned voice; each scene
is as long as its narration. The one idea: a press is a plus-shaped
mask, and a move is the board plus that mask, mod 2, for every light
at once; the solver is the table of all presses reduced mod 2.

Four scenes are drawn from arrays X_eTaL printed; one is the
published page itself, recorded as it opens the board, presses two
lights and asks for a hint.

| File | What |
| ---- | ---- |
| `lesson.json` | six scenes: the puzzle pressed to dark; a press as a mask and the table of all 25; a move as a toggle; the solver; the live page; the link |
| `data.xtl` | the game's own functions (its press matrix, its move, its solver by elimination mod 2) on one puzzle, printing the middle square's press, the 25 by 25 press matrix, the puzzle, one press and the board after it, the solution, and the puzzle pressed to dark one press at a time |
| `timing.json` | the schedule X_eTaL computes from the lesson; checked by the gate |
| `title.txt`, `description.txt` | the YouTube title and description (`just youtube lights-out` gathers them with the video and captions) |
| `voice.json` | the narration as spoken (`just voice lights-out`): each sentence, what whisper heard, each scene's seconds, the voice sample |

```bash
just voice lights-out      # narrate (VoxCPM on queenbee), scene lengths from the audio
just capture lights-out    # record the page (network)
just render lights-out     # out/lights-out-portrait-remotion.mp4
just youtube lights-out    # out/lights-out-youtube/: video, title, description, captions
```

The puzzle is made as the game makes one, squares pressed on a board
all off, but with five chosen squares (3, 7, 13, 19 and 22) instead
of random ones, so that the solver's answer is those same five
presses (the free presses it leaves 0 are not among them). The
stepping boards (`stepFrames` 30) show the puzzle pressed to dark one
press at a time: in the first scene from its start, in the solve
scene after the puzzle is held for seven steps (`"solving"`), so the
presses fall on the sentence that names them. The page's own puzzle
is random (seeded by the clock), so the recorded clicks press fixed
squares (the 13th and the 7th) and then Hint, not a solution. The
X_eTaL lines on screen are the game's own, with its library's `l:`
and `h:` names.

The game's code differs from this lesson's in one way only.
X_eTaL-games pins another X_eTaL commit (0b3b3be) than this
repository (`XETAL_COMMIT`); its functions run unchanged under this
pin, but they are copied into `data.xtl` (their `l:` names made
`u:`) instead of used from its `Lamps.xtl`, which also draws the
board with the games' `Svg` library, not here, and makes its puzzles
at random.
