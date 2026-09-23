// Renders the film to MP4, frame by frame, in headless Chrome.
//   node video/tools/render.mjs                 full film → build/inside-the-vhs-tape.mp4
//   node video/tools/render.mjs --workers 8     parallel Chrome processes (default: cores/2)
//   node video/tools/render.mjs --from 60 --to 75 --out build/clip.mp4
//   node video/tools/render.mjs --stills 12.5,load:load+3,tilt@4
//       JPEG stills for checking: absolute seconds, shot@local-seconds,
//       or shot:cue+offset. Written to build/stills/.
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { openPage } from './chrome.mjs';
import { loadProject, p } from './common.mjs';

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : def;
};
const pageUrl = pathToFileURL(p('index.html')).href + '?render';
const { timeline, TL } = loadProject();
const fps = timeline.fps;

/* ── stills ─────────────────────────────────────────── */
function resolveTime(spec) {
  if (/^[\d.]+$/.test(spec)) return +spec;
  let m = spec.match(/^(\w+)@([\d.]+)$/);
  if (m) return shot(m[1]).start + +m[2];
  m = spec.match(/^(\w+):(\w+)([+-][\d.]+)?$/);
  if (m) {
    const sh = shot(m[1]);
    return sh.start + TL.cueTime(sh, m[2]) + (m[3] ? +m[3] : 0);
  }
  throw new Error(`Bad still spec: ${spec}`);
}
function shot(id) {
  const s = timeline.shots.find((x) => x.id === id);
  if (!s) throw new Error(`No shot "${id}"`);
  return s;
}

if (opt('stills')) {
  const dir = p('build/stills');
  mkdirSync(dir, { recursive: true });
  const page = await openPage(pageUrl);
  await page.evaluate('window.__vhs.ready');
  for (const spec of opt('stills').split(',')) {
    const t = resolveTime(spec);
    const url = await page.evaluate(`window.__vhs.frame(${t}, ${Math.round(t * fps)}, 'image/jpeg', 0.9)`);
    const file = `${dir}/${spec.replace(/[^\w.+-]/g, '_')}.jpg`;
    writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    console.log(`${t.toFixed(2).padStart(7)}s → ${file}`);
  }
  await page.close();
  process.exit(0);
}

/* ── video ──────────────────────────────────────────── */
const from = +opt('from', 0);
const to = Math.min(+opt('to', timeline.duration), timeline.duration);
const out = p(opt('out', 'build/inside-the-vhs-tape.mp4'));
const workers = +opt('workers', Math.max(2, Math.floor(os.cpus().length / 2)));
const f0 = Math.round(from * fps), f1 = Math.ceil(to * fps);
const total = f1 - f0;
const chunkDir = p('build/chunks');
rmSync(chunkDir, { recursive: true, force: true });
mkdirSync(chunkDir, { recursive: true });

console.log(`Rendering ${total} frames (${(total / fps).toFixed(1)} s at ${fps} fps) with ${workers} workers…`);
const started = Date.now();
let done = 0;
const progress = setInterval(() => {
  const el = (Date.now() - started) / 1000;
  const rate = done / el;
  process.stdout.write(`\r  ${done}/${total} frames · ${rate.toFixed(1)} fps · ~${Math.round((total - done) / Math.max(rate, 0.1))} s left   `);
}, 2000);

async function renderChunk(k, a, b) {
  const file = `${chunkDir}/chunk_${String(k).padStart(2, '0')}.mp4`;
  const ff = spawn('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-vf', 'scale=in_range=pc:in_color_matrix=bt601:out_range=tv:out_color_matrix=bt709,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    file,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffDone = new Promise((r, j) => ff.on('exit', (c) => (c ? j(new Error(`ffmpeg ${c}`)) : r())));
  const page = await openPage(pageUrl);
  await page.evaluate('window.__vhs.ready');
  for (let n = a; n < b; n++) {
    const url = await page.evaluate(`window.__vhs.frame(${n / fps}, ${n})`);
    const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    done++;
  }
  ff.stdin.end();
  await ffDone;
  await page.close();
  return file;
}

const per = Math.ceil(total / workers);
const jobs = [];
for (let k = 0; k < workers; k++) {
  const a = f0 + k * per, b = Math.min(f1, a + per);
  if (a < b) jobs.push(renderChunk(k, a, b));
}
const files = await Promise.all(jobs);
clearInterval(progress);
console.log(`\n  frames done in ${((Date.now() - started) / 1000).toFixed(0)} s`);

const list = `${chunkDir}/list.txt`;
writeFileSync(list, files.map((f) => `file '${f}'`).join('\n'));
const silent = `${chunkDir}/video.mp4`;
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', silent]);

const sound = p('build/soundtrack.wav');
const subs = p('build/captions.srt');
const args = ['-y', '-loglevel', 'error', '-i', silent];
if (existsSync(sound)) args.push('-ss', String(from), '-t', String(to - from), '-i', sound);
const whole = from === 0 && Math.abs(to - timeline.duration) < 0.01;
if (whole && existsSync(subs)) args.push('-i', subs);
args.push('-map', '0:v');
if (existsSync(sound)) args.push('-map', '1:a', '-c:a', 'aac', '-b:a', '256k');
if (whole && existsSync(subs)) args.push('-map', `${existsSync(sound) ? 2 : 1}:s`, '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng');
args.push('-c:v', 'copy', '-t', (to - from).toFixed(3), '-metadata', 'title=Inside the VHS Tape', '-movflags', '+faststart', out);
execFileSync('ffmpeg', args);
rmSync(chunkDir, { recursive: true, force: true });
console.log(`→ ${out}`);
