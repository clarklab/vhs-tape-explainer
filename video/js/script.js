/* The film's shot list and narration.
   Shared by the browser player and the Node build tools, so it only uses
   plain JS and hangs its data on globalThis.

   Narration cues: [[name]] marks the word an animation should land on.
   The narrate tool records the exact time the voice reaches that word, and
   scenes react with s.ramp('name'), s.since('name') and so on.

   Per shot:
     scene       drawing function (see js/scenes/*.js)
     text        narration (omit for silent shots, then give `dur`)
     pre / post  seconds of picture before / after the narration
     transition  how this shot arrives: 'fade' (default), 'cut' or 'glitch'
     camera      [{ at, x, y, z, len }] moves in 1280×720 scene space
     supers      on-screen facts: [{ at, hold, big, small, pos, kind }]
     sfx         [{ name, at, gain, dur, fadeIn, fadeOut }] for the mix
*/
(function (G) {
  const SHOTS = [
    /* ───────────── Cold open ───────────── */
    {
      id: 'open', scene: 'open', transition: 'cut', pre: 2.2, post: 0.9,
      text: 'For thirty years, this little box held our [[bday]]birthdays, [[wedding]]our weddings, [[movies]]and every movie we ever rented. [[film]]Most people assume there’s film inside. [[nope]]But there isn’t a single picture on it.',
      camera: [{ at: 'film', x: 660, y: 360, z: 1.16, len: 5 }],
      sfx: [
        { name: 'static', at: 0, gain: -6, dur: 2.3, fadeIn: 0.3, fadeOut: 0.25 },
        { name: 'insert', at: 0.35, gain: -3 },
        { name: 'glitch', at: 2.05, gain: -8 },
      ],
    },
    { id: 'title', scene: 'title', dur: 4.6, transition: 'glitch', sfx: [{ name: 'glitch', at: -0.25, gain: -5 }] },

    /* ───────────── Part 1 · The tape ───────────── */
    { id: 'part1', scene: 'card', part: 1, title: 'The tape', dur: 2.8, transition: 'glitch', sfx: [{ name: 'glitch', at: -0.25, gain: -6 }] },
    {
      id: 'film', scene: 'tape.film', transition: 'glitch', pre: 0.6,
      text: 'Every frame of film is a tiny photograph. [[tape]]But hold videotape up to the light, [[mag]]and all you see is rusty brown. [[light]]That’s because film stores light, while VHS tape stores magnetism.',
      camera: [
        { at: 'mag', x: 600, y: 430, z: 1.15, len: 2.2 },
        { at: 'light', x: 640, y: 380, z: 1.02, len: 1.6 },
      ],
    },
    {
      id: 'cassette', scene: 'tape.cassette',
      text: 'The cassette is a sealed little machine, [[reels]]with two hundred and forty-six metres of tape inside. [[sensor]]A little lever in the VCR feels for this [[tab]]tab. [[snap]]Snap it off, and the lever finds a hole, so the machine won’t record. [[wedding]]Nobody can tape over your wedding. [[lamp]]And a lamp in the VCR spots the clear leader at the end.',
      camera: [
        { at: 'sensor', x: 445, y: 180, z: 1.45, len: 1.6 },
        { at: 'lamp', x: 640, y: 420, z: 1.3, len: 2.2 },
      ],
      supers: [{ at: 'reels', hold: 3.0, big: '246 m', small: 'of tape in a two-hour T‑120', pos: 'bl' }],
      sfx: [{ name: 'snap', at: 'snap', offset: 0.25, gain: -7 }],
    },
    {
      id: 'coating', scene: 'tape.coating', transition: 'zoom', pre: 0.9,
      text: 'Zoom in ten thousand times. [[layers]]The tape is a plastic ribbon, thinner than paper, [[needles]]coated in billions of needles of iron oxide: rust. [[magnet]]Each one is a tiny bar magnet, pointing any which way. [[snow]]Play that back, and you get snow.',
      sfx: [
        { name: 'zoom', at: -0.2, gain: -9 },
        { name: 'static', at: 'snow', offset: 0.2, gain: -9, dur: 3.2, fadeIn: 0.4, fadeOut: 1 },
      ],
    },
    {
      id: 'write', scene: 'tape.write',
      text: 'To record, the VCR uses an electromagnet [[gap]]with a gap narrower than a wavelength of light. [[field]]Its field flips every needle passing underneath, [[stripes]]freezing the video signal into stripes: north, south, north, south.',
      camera: [
        { at: 'gap', x: 640, y: 292, z: 2.1, len: 1.6 },
        { at: 'field', x: 640, y: 330, z: 1.25, len: 1.6 },
        { at: 'stripes', x: 640, y: 380, z: 1.0, len: 1.8 },
      ],
      supers: [{ at: 'gap', hold: 4, big: '0.3 µm', small: 'head gap · light waves are 0.4–0.7 µm', pos: 'br' }],
    },
    {
      id: 'read', scene: 'tape.read',
      text: 'To play it back, the same head listens. [[boundary]]Every stripe boundary makes a tiny pulse of electricity. [[fm]]Tight stripes mean white; loose stripes, black. [[radio]]It’s the same trick as FM radio.',
      supers: [{ at: 'radio', hold: 3.2, big: 'Frequency modulation', small: 'brightness → stripe spacing', pos: 'bl', kind: 'term' }],
    },
    {
      id: 'reveal', scene: 'tape.reveal',
      text: 'You can actually see a recording. [[brush]]Brush on magnetic developer, and the hidden pattern appears. [[stripes]]Still no pictures: just stripes, hundreds of thousands of them, all diagonal. [[why]]Why diagonal? The answer is spinning inside the VCR.',
      post: 1.0,
    },

    /* ───────────── Part 2 · The drum ───────────── */
    { id: 'part2', scene: 'card', part: 2, title: 'The drum', dur: 2.8, transition: 'glitch', sfx: [{ name: 'glitch', at: -0.25, gain: -6 }] },
    {
      id: 'problem', scene: 'drum.problem', transition: 'glitch',
      text: 'Here’s the problem. [[ladder]]To record video, the head must sweep across the tape at nearly six metres a second. [[timer]]At that speed, a two-hour tape would last forty-two seconds. [[real]]Yet VHS tape crawls along at barely three centimetres a second.',
      sfx: [{ name: 'whoosh', at: 'timer', offset: 0.1, gain: -8 }],
    },
    {
      id: 'load', scene: 'drum.load',
      text: 'The trick? Move the heads instead. [[load]]Press play, and guide posts wrap the tape around a slanted drum. [[drum]]It spins eighteen hundred times a minute, carrying two heads [[speed]]that sweep across the tape at twenty-one kilometres an hour.',
      camera: [{ at: 0, x: 640, y: 420, z: 1.22, len: 0.01 }, { at: 'load', x: 640, y: 350, z: 1.0, len: 3 }],
      supers: [
        { at: 'drum', hold: 4, big: '1,800 rpm', small: 'drum speed', pos: 'bl' },
        { at: 'speed', hold: 4.5, big: '21 km/h', small: 'head speed on the tape', pos: 'bl' },
      ],
      sfx: [
        { name: 'button', at: 'load', gain: -10 },
        { name: 'load', at: 'load', offset: 0.25, gain: -3 },
        { name: 'hum', at: 'load', offset: 2.4, gain: -17, dur: 9, fadeIn: 1.5, fadeOut: 2 },
      ],
    },
    {
      id: 'tilt', scene: 'drum.tilt',
      text: 'That slant is the key. [[tilt]]The drum is tipped about six degrees, [[ledge]]so the tape spirals around it. [[path]]Every sweep of a head cuts a long diagonal line across the tape. [[helical]]It’s called helical scan.',
      camera: [
        { at: 'tilt', x: 600, y: 260, z: 1.14, len: 1.8 },
        { at: 'path', x: 640, y: 360, z: 1.0, len: 1.6 },
      ],
      supers: [{ at: 'helical', hold: 3.2, big: 'Helical scan', small: 'the heads write in a spiral', pos: 'bl', kind: 'term' }],
    },
    {
      id: 'tracks', scene: 'drum.tracks',
      text: 'Unroll the tape, and there’s the pattern. [[fieldA]]Each stripe is half a TV picture. [[fieldB]]Head A lays one, head B the next, sixty a second. [[km]]Over a two-hour movie, they cover forty-two kilometres, on two hundred and forty-six metres of tape.',
      supers: [{ at: 'km', hold: 5.5, big: '42 km', small: 'of head travel · on 246 m of tape', pos: 'bl' }],
    },
    {
      id: 'azimuth', scene: 'drum.azimuth',
      text: 'Notice there are no gaps between stripes. [[q]]So how does a head avoid its neighbour? [[tilted]]The two heads are angled in opposite directions. [[cross]]On the wrong stripe, the angles clash and the signal vanishes. [[azimuth]]It’s called azimuth recording.',
      post: 1.0,
      supers: [{ at: 'azimuth', hold: 3.4, big: 'Azimuth recording', small: 'each head only hears its own stripes', pos: 'bl', kind: 'term' }],
    },

    /* ───────────── Part 3 · Tracking ───────────── */
    { id: 'part3', scene: 'card', part: 3, title: 'Tracking', dur: 2.8, transition: 'glitch', sfx: [{ name: 'glitch', at: -0.25, gain: -6 }] },
    {
      id: 'servo', scene: 'tracking.servo', transition: 'glitch',
      text: 'Which brings us to tracking. [[holes]]Film has sprocket holes. [[pulses]]VHS has a control track: one magnetic pulse per frame. [[servo]]A servo lines those pulses up with the spinning drum, [[locked]]so each head lands right on its stripe.',
    },
    {
      id: 'drift', scene: 'tracking.drift',
      text: 'At least, on your own tapes. [[other]]A tape from another VCR has its stripes a few microns off. [[snow]]The heads stray onto their neighbours, and you get a band of snow. [[knob]]Nudge the tracking, [[clear]]and it rolls away.',
      post: 1.4,
      camera: [
        { at: 'snow', x: 330, y: 250, z: 1.3, len: 1.8 },
        { at: 'clear', x: 640, y: 360, z: 1.0, len: 2.2 },
      ],
      sfx: [
        { name: 'static', at: 'other', offset: 0.6, gain: -14, dur: 1.8, fadeIn: 1.2, fadeOut: 0.01 },
        { name: 'static', at: 'other', offset: 2.4, gain: -8, dur: 0.1, until: 'clear', untilOffset: 0.5, fadeIn: 0.01, fadeOut: 1.2 },
        { name: 'blip', at: 'knob', gain: -12 },
      ],
    },
    {
      id: 'headswitch', scene: 'tracking.headswitch',
      text: 'Even a perfect tape has one flaw. [[turns]]The heads take turns sixty times a second, [[bottom]]switching near the bottom of the picture. [[bezel]]Old TVs hid that. [[rip]]Digitize a tape, though, and there it is: a ragged, wobbling strip.',
      camera: [{ at: 'rip', x: 330, y: 330, z: 1.35, len: 1.8 }],
    },
    {
      id: 'colour', scene: 'tracking.colour',
      text: 'Colour got the cheap seats. [[under]]VHS squeezes it into a narrow band beneath the brightness, [[smear]]so reds bleed sideways, and edges go soft. [[look]]It’s the look we still call VHS.',
    },
    {
      id: 'hifi', scene: 'tracking.hifi',
      text: 'In 1984, VHS Hi‑Fi [[heads]]added two more heads, [[deep]]writing stereo sound deep into the magnetic coating. [[top]]The video heads then write the picture on top: [[layers]]sound and picture, one buried beneath the other.',
      post: 1.0,
    },

    /* ───────────── Outro ───────────── */
    {
      id: 'outro', scene: 'outro', transition: 'glitch', pre: 0.8, post: 8.0,
      text: 'The last VCRs were made in 2016. [[tapes]]But millions of tapes are still out there: birthdays, weddings, movie nights, written in rust, in diagonal stripes thinner than a hair. So be kind. [[rewind]]Rewind.',
      camera: [{ at: 'rewind', x: 640, y: 350, z: 1.1, len: 3 }],
      supers: [{ at: 0.5, hold: 4, big: '2016', small: 'Funai builds the last VCRs', pos: 'bl' }],
      sfx: [
        { name: 'glitch', at: -0.25, gain: -8 },
        { name: 'rewind', at: 'rewind', offset: 0.2, gain: -3 },
      ],
    },
  ];

  G.VHS_SCRIPT = {
    title: 'Inside the VHS Tape',
    fps: 30,
    voice: {
      id: 'u4HtmbcjVZVpiJLQ2GZn', // "A Top Narrator VO PRO": American documentary narrator
      model: 'eleven_multilingual_v2',
      settings: { stability: 0.55, similarity_boost: 0.85, style: 0.35, use_speaker_boost: true, speed: 1.0 },
    },
    shots: SHOTS,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
