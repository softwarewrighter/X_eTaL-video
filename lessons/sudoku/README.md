# sudoku

Sudoku without a loop: a short about X_eTaL-games'
[sudoku](https://softwarewrighter.github.io/X_eTaL-games/sudoku/),
made in portrait, narrated in the author's cloned voice; each scene
is as long as its narration. The one idea: constraints as arrays, a
move as a mask.

Five scenes are drawn from arrays X_eTaL printed; one is the
published page itself, recorded as it scrolls to the solver's
notebook.

| File | What |
| ---- | ---- |
| `lesson.json` | seven scenes: the puzzle solving itself; the units as a table; every cell's candidates; the singles as a move; the rounds repeated; the live page; the link |
| `data.xtl` | the game's own functions (its units, one-hot grid, counts per unit, candidates, singles, round) on its first puzzle, printing the puzzle, the 27 units and the digits each holds, the candidates per cell and one cell's, the first round's move and the grid after it, and six rounds |
| `timing.json` | the schedule X_eTaL computes from the lesson; checked by the gate |
| `title.txt`, `description.txt` | the YouTube title and description (`just youtube sudoku` gathers them with the video and captions) |
| `voice.json` | the narration as spoken (`just voice sudoku`): each sentence, what whisper heard, each scene's seconds, the voice sample |

```bash
just voice sudoku              # narrate (VoxCPM on queenbee), scene lengths from the audio
just capture sudoku portrait   # record the page (network)
just render sudoku portrait    # out/sudoku-portrait-remotion.mp4
just youtube sudoku            # out/sudoku-youtube/: video, title, description, captions
```

The puzzle is the game's first, Wikipedia's example (30 givens); its
rounds of singles solve it in five, so the stepping board (`"rounds"`,
`stepFrames` 24) holds the solved grid from its sixth step on. The
X_eTaL lines on screen are the game's own, with its library's `l:`
names.

The game's code differs from this lesson's in one way only.
X_eTaL-games pins another X_eTaL commit (0b3b3be) than this
repository (`XETAL_COMMIT`); its functions run unchanged under this
pin, but they are copied into `data.xtl` (their `l:` names made
`u:`) instead of used from its `SudokuGrid.xtl`, which reads its
puzzles from a TOML file through the games' `Text` library, neither
of which is here. The puzzle is written out as 81 digits.
