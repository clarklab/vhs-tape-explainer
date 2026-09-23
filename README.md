# Inside the VHS Tape

An animated, three-slide explainer of how VHS actually works. Most people assume
there's film inside a videotape; there isn't a single picture on it.

1. **The tape**: film vs. tape, the cassette's insides, the iron-oxide coating,
   how a head writes and reads magnetic stripes, and developer fluid revealing
   the diagonal tracks.
2. **The drum**: why a fixed head would need 5.8 m/s, the spinning two-head
   drum, the ~6° tilt (helical scan), the track map, and azimuth recording.
3. **Tracking**: the control track and servo, mistracking snow bars (with a
   live TRACKING slider), the head-switching glitch, colour-under, and Hi-Fi
   audio buried beneath the picture.

Each slide builds in steps, and every step has its own canvas animation.

## View it

Open `index.html` in a browser. It's static: no build step and no dependencies
(fonts load from Google Fonts). If you prefer serving it:

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

**Controls:** `→` / `Space` next step · `←` previous · `1`–`3` jump to a slide ·
`P` or the PLAY button auto-advances · swipe on touch screens. Link straight to
a slide with `#tape`, `#drum` or `#tracking`.

## Files

| File | What it does |
| --- | --- |
| `index.html` | Slide copy, facts and controls |
| `styles.css` | Layout and type (stacks to one column on phones) |
| `js/deck.js` | Navigation, auto-advance, render loop |
| `js/lib.js` | Shared canvas helpers and palette |
| `js/scene-tape.js` | Slide 1 animations |
| `js/scene-drum.js` | Slide 2 animations |
| `js/tv.js` | Software CRT: colour bars, colour smear, snow, head-switch jitter |
| `js/scene-tracking.js` | Slide 3 animations and the tracking model |

Figures are NTSC VHS unless noted (PAL values appear where they differ). A few
diagrams exaggerate angles for legibility, and each one says so on screen.

## The film

`video/` turns the deck into a narrated, fully animated 16:9 film (about 4½
minutes, 1080p30), in the style of a TV science explainer. It reuses the
deck's canvas drawings, re-laid out for widescreen, and times every label,
callout and camera move to the word the narrator is saying.

- **Watch it:** render it (below) to `video/build/inside-the-vhs-tape.mp4`,
  which has English subtitles as a soft track. To preview in the browser
  with sound, serve the repo (`python3 -m http.server 8000`) and open
  `http://localhost:8000/video/`. Space plays, arrow keys seek and CC
  toggles captions.
- **Voice, music and sound effects** come from ElevenLabs. The narrator is
  the "A Top Narrator VO PRO" voice on `eleven_multilingual_v2`.

### Rebuilding

Node 22+, ffmpeg and Google Chrome are the only requirements; there is no
`npm install`. The generated audio is cached, so only changed lines are
re-voiced.

```sh
export ELEVENLABS_API_KEY=...          # or put ELEVENLABS_API_KEY=... in video/.env
node video/tools/narrate.mjs           # voice + word timings → build/narration.js, captions.srt
node video/tools/sounds.mjs            # sound effects + music bed
node video/tools/mix.mjs               # soundtrack, ducked and normalised to −16 LUFS
node video/tools/render.mjs            # frames in headless Chrome → MP4
```

`render.mjs --stills load:load+2,tilt@4` writes JPEG stills for checking a
moment without rendering everything. A still is given as a shot and a cue
word, a shot and local seconds, or absolute seconds.

| File | What it does |
| --- | --- |
| `video/js/script.js` | Shot list, narration with `[[cue]]` markers, camera moves, on-screen facts, sound cues |
| `video/js/timeline.js` | Turns the script plus narration timings into shot and cue times |
| `video/js/film.js` | Compositor: camera, transitions, VHS glitch cuts, fact cards, grain |
| `video/js/scenes/*.js` | The scenes: cold open and bookends, then the tape, the drum and tracking |
| `video/js/crt.js` | The deck's software CRT, with graded colour smear and full-screen static |
| `video/index.html` | Browser player, and the frame hook the renderer drives |
| `video/tools/*.mjs` | Narration, sounds, mix and render (headless Chrome over the DevTools protocol) |
