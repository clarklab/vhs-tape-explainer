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
