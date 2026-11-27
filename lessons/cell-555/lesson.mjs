// lessons/cell-555/lesson.json from this file: node lessons/cell-555/lesson.mjs (from the repository root).
// The assembly cell (X_eTaL-extensions, extensions/cell) building the whole 555 LED blinker
// (programs/blinker.cell, 366 commands, 1080 simulated seconds), recorded from the live page with
// the whole UI showing. One scene a join (joins.json: each join's first step and its simulated
// span, read from the page's step list), narrated with the actions it shows. The draft shows a
// recording (scripts/cell-record.mjs, frame by frame: each join's span over its scene, about
// four times real speed; a scene's capture is that recording, never scripts/capture.mjs). Facts: extensions/cell/docs/README.md (The 555
// blinker), circuits/blinker.toml, the step list itself.
import { readFileSync, writeFileSync } from "node:fs";
const l = JSON.parse(readFileSync("lessons/al-02-loops/lesson.json", "utf8"));
const S = (id) => l.scenes.find((s) => s.id === id);
const J = JSON.parse(readFileSync("lessons/cell-555/joins.json", "utf8"));
const span = (id) => { const j = J.joins.find((x) => x.id === id); return (j.to - j.from) / 4; };
const img = (id) => [`work/cell-555/stills/${id}.png`];
// each join a scene of the recording, at least its span at four times speed
const join = (id, heading, narration) => ({ id, seconds: Math.max(4, +span(id).toFixed(1)), atLeast: +span(id).toFixed(1), heading, narration, lines: [], cell: { join: id }, capture: { recorder: "scripts/cell-record.mjs" } });
const scenes = [
  { id: "title", seconds: 6, heading: "A robot cell builds a 555 blinker", lines: ["Simulated in the browser, at four times speed"] },
  { id: "intro", seconds: 12, heading: "The assembly cell", narration: "This is a simulated robot assembly bench. It has one arm, a turntable with a vise and pincers, an iron that feeds its own {solder|sodder}, a tool rack, and a tray of parts. The arm brings a {lead|leed} to a {lead|leed}. A pincer holds it, and the turntable brings the joint to the iron. Watch it build a whole blinker circuit, at four times speed.", lines: [], cell: { hold: 0 }, capture: { recorder: "scripts/cell-record.mjs" } },
  join("chip", "The chip into the vise", "The arm takes its tweezers. It picks the chip, and sets it in the vise, legs up."),
  join("jumper-8-4", "Jumper: pin 8 to pin 4", "First, a jumper from pin eight to pin four. An enameled wire is fed and cut. The arm lays it across the legs, and a pincer holds it. The turntable brings each end to the iron. Touch, feed {solder|sodder}, and cool."),
  join("jumper-6-2", "Jumper: pin 6 to pin 2", "The second jumper joins pin six to pin two, laid over the first. It is pinched, and {soldered|soddered} at both ends. Each joint is inspected as it cools."),
  join("r1", "The first resistor, on pin 8", "Now the parts. The arm picks the first resistor, and puts it in the rig. The rig bends its {lead|leed} at a right angle, and the shear cuts it short. The {lead|leed} is laid along pin eight, pinched, and {soldered|soddered}. Then the cutter trims the other {lead|leed}."),
  join("r1-pin7", "Jumper: the first resistor to pin 7", "Next, a jumper with lapped ends runs from the first resistor to pin seven, the discharge pin. It is brought in from the side, so the tweezers clear the {leads|leeds} around it."),
  join("r2", "The second resistor, on pin 6", "The second resistor follows the same steps. Into the rig, bend, and shear. Lay its {lead|leed} along pin six. Pinch it, {solder|sodder} it, and let it cool. Then trim the free {lead|leed} at the cutter."),
  join("r2-pin7", "Jumper: the second resistor to pin 7", "Then a jumper joins the second resistor to pin seven. Each end is laid along its {lead|leed}, and pinched. The turntable brings it to the iron, and it is {soldered|soddered}. The joint cools before the pincer lets go."),
  join("r3", "The third resistor, on pin 3", "The third resistor goes on pin three, the output. After the trim, a pincer bends its free end straight up, ready for the light."),
  join("c2", "The disc capacitor, on pin 5", "The small disc capacitor needs no bending. Its {lead|leed} is lowered from above onto pin five, and {soldered|soddered}."),
  join("ground-c2", "Ground: the disc capacitor to pin 1", "A ground jumper runs from the disc capacitor, over the chip, to pin one. It goes in before the next capacitor stands over pin two."),
  join("c1", "The electrolytic capacitor, on pin 2", "The electrolytic capacitor is lowered onto pin two. Its {lead|leed} is pinched against the leg, and {soldered|soddered}."),
  join("ground-c1", "Ground: the capacitor to pin 1", "Ground again. A jumper runs from the electrolytic capacitor, down to pin one."),
  join("led", "The light, onto the third resistor", "The light goes on next. Its anode is laid along the upturned end of the third resistor, and {soldered|soddered}."),
  join("led-ground", "Ground: the light to pin 1", "A last ground jumper joins the cathode of the light to pin one."),
  join("battery", "The battery snap, and pin 8", "Last, the battery snap. The arm sets it flat on the turntable, beside the vise. A jumper rises from its first {lead|leed}, past the jaw, to pin eight, the supply."),
  join("battery-ground", "The battery to pin 1", "The other {lead|leed} gets a jumper to pin one, the ground. Each end is pinched, {soldered|soddered}, cooled, and inspected."),
  { id: "check", seconds: 10, heading: "Checked against the netlist", narration: "Finally, the cell inspects for shorts, and checks the work against the netlist. Seven of seven nets are made. Nothing is damaged.", lines: [], cell: { hold: J.duration }, capture: { recorder: "scripts/cell-record.mjs" } },
  S("cta"), S("close"),
];
const { scenes: _, youtube, poster, ...h } = l;
h.music = { file: "/Users/mike/github/softwarewrighter/music-pipe-rs/work/video-beds/soldiers-reel.wav", intro: { seconds: 5, fadeOut: 0.5 }, outro: { seconds: 5, fadeIn: 0.5 }, slides: { volume: 0.3, fade: 0.4, starts: [5, 10, 15] } };
const lesson = { ...h, slug: "cell-555", title: "A robot cell builds a 555 blinker", summary: "The X_eTaL assembly cell, simulated in the browser, builds a whole 555 LED blinker: the chip in the vise, jumpers between its legs, each resistor and capacitor bent, laid along its pin, soldered and trimmed, the light, the battery snap, and a check against the netlist. At about four times speed, the whole UI showing.", order: 200, brand: "X_eTaL extensions: the assembly cell", scenes };
writeFileSync("lessons/cell-555/lesson.json", JSON.stringify(lesson, null, 2) + "\n");
