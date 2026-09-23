// Generates sound effects and the music bed with ElevenLabs.
//   build/sfx/<name>.mp3    one file per effect below
//   build/music.mp3         instrumental underscore, as long as the film
// Existing files are kept; pass --force [name…] to regenerate.
//   node video/tools/sounds.mjs [--force] [name…]
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { duration, eleven, loadProject, p } from './common.mjs';

export const SFX = {
  insert: [2.6, 'A VHS cassette pushed into a VCR front loader: a plastic clack, then the mechanism draws it in with a mechanical clunk and a short motor whirr'],
  static: [5, 'Analog television static: steady white noise hiss from an old CRT TV with no signal'],
  glitch: [0.9, 'Short analog VHS video glitch: tape warble, electrical crackle and a quick burst of static'],
  snap: [0.7, 'A small plastic tab snapping off a video cassette, crisp plastic crack'],
  zoom: [1.3, 'Soft cinematic zoom-in whoosh, airy and subtle'],
  whoosh: [1.4, 'Fast whirring whoosh of tape flying past at high speed'],
  button: [0.5, 'Chunky VCR play button press, mechanical click'],
  load: [3, 'VCR tape threading mechanism: small motors and gears whirr as guide posts pull the tape around the head drum, ending in a soft mechanical clunk'],
  hum: [6, 'Steady soft whine of a spinning VCR video head drum motor, smooth mechanical hum'],
  blip: [0.5, 'Retro VCR on-screen display beep, short soft electronic blip'],
  rewind: [4.2, 'A VCR fast-rewinding a VHS tape: a rising high-pitched whirring motor for three seconds, then a mechanical clunk as it stops'],
};

const MUSIC_PROMPT =
  'Instrumental underscore for a TV science documentary about how VHS videotape works. ' +
  'Curious, warm and wonder-filled. Mellow analog 1980s synthesizers: a soft pulsing arpeggio, ' +
  'warm pads, a gentle round bass and light electronic percussion. Steady medium tempo around 96 BPM ' +
  'with consistent, understated energy that sits under a narrator; no big drops, no vocals. ' +
  'A short gentle intro and a warm resolving ending.';

const args = process.argv.slice(2);
const force = args.includes('--force');
const names = args.filter((a) => !a.startsWith('--'));
const want = (n) => !names.length || names.includes(n);

mkdirSync(p('build/sfx'), { recursive: true });
for (const [name, [dur, text]] of Object.entries(SFX)) {
  const file = p(`build/sfx/${name}.mp3`);
  if (!want(name) || (existsSync(file) && !force)) continue;
  process.stdout.write(`sfx ${name}… `);
  const res = await eleven('/v1/sound-generation', { text, duration_seconds: dur, prompt_influence: 0.5 }, { query: 'output_format=mp3_44100_192' });
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log(`${duration(file).toFixed(2)}s`);
}

const music = p('build/music.mp3');
if (want('music') && (!existsSync(music) || force)) {
  const { timeline } = loadProject();
  const ms = Math.min(300000, Math.ceil((timeline.duration + 4) * 1000));
  process.stdout.write(`music (${(ms / 1000).toFixed(0)} s)… `);
  const res = await eleven('/v1/music', { prompt: MUSIC_PROMPT, music_length_ms: ms, force_instrumental: true }, { query: 'output_format=mp3_44100_192' });
  writeFileSync(music, Buffer.from(await res.arrayBuffer()));
  console.log(`${duration(music).toFixed(2)}s`);
}
