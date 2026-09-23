// Mixes the soundtrack: narration on its cues, sound effects on theirs, and
// the music bed ducked under the voice. Loudness-normalised to −16 LUFS.
//   build/soundtrack.wav   (48 kHz stereo, used by render.mjs)
//   build/soundtrack.m4a   (for the in-browser player)
//   node video/tools/mix.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { duration, loadProject, p } from './common.mjs';

const { timeline, TL } = loadProject();
const STEMS = process.argv.includes('--stems'); // also write voice / fx / music stems for checking levels
const T = timeline.duration;
const inputs = [];
const chains = [];
const addInput = (file, extra = []) => {
  inputs.push(...extra, '-i', file);
  return inputs.filter((x) => x === '-i').length - 1;
};
const ms = (s) => Math.max(0, Math.round(s * 1000));

// ── narration ─────────────────────────────────────────
const narr = [];
for (const s of timeline.shots) {
  if (!s.audio) continue;
  const i = addInput(p(s.audio));
  chains.push(`[${i}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=delays=${ms(s.narrAt)}:all=1[n${i}]`);
  narr.push(`[n${i}]`);
}
if (!narr.length) throw new Error('No narration found: run tools/narrate.mjs first');
chains.push(`${narr.join('')}amix=inputs=${narr.length}:normalize=0:duration=longest,apad,atrim=0:${T.toFixed(3)},asplit=${STEMS ? 3 : 2}[voice][key]${STEMS ? '[voiceS]' : ''}`);

// ── sound effects ────────────────────────────────────
const levels = {};
/** Mean and peak level of a file in dB (ffmpeg volumedetect). */
function level(file) {
  if (!levels[file]) {
    const txt = String(execFileSync('sh', ['-c', `ffmpeg -hide_banner -i "${file}" -af volumedetect -f null - 2>&1 | grep -E "mean_volume|max_volume"`]));
    const mean = txt.match(/mean_volume: (-?[\d.]+) dB/), max = txt.match(/max_volume: (-?[\d.]+) dB/);
    levels[file] = { mean: mean ? +mean[1] : -20, max: max ? +max[1] : -1 };
  }
  return levels[file];
}
const meanVolume = (file) => level(file).mean;
// Effects are levelled by whichever is stricter: peak at −12 dB or average
// at −30 dB, so short clicks can't spike and steady noise can't swamp. The
// script's per-cue gain then sets each one below the voice (voice peaks ≈ −6).
function fxNorm(file) {
  const l = level(file);
  return Math.min(-12 - l.max, -30 - l.mean);
}

const fx = [];
for (const s of timeline.shots) {
  for (const e of s.sfx || []) {
    const file = p(`build/sfx/${e.name}.mp3`);
    if (!existsSync(file)) { console.warn(`! missing sfx ${e.name}`); continue; }
    const at = s.start + TL.cueTime(s, e.at) + (e.offset || 0);
    const src = duration(file);
    let dur = e.dur || src;
    if (e.until) dur = s.start + TL.cueTime(s, e.until) + (e.untilOffset || 0) - at;
    const norm = fxNorm(file);
    const gain = norm + (e.gain || 0);
    const i = addInput(file);
    const f = [`[${i}:a]aresample=48000,aformat=channel_layouts=stereo`];
    if (dur > src - 0.02) f.push(`aloop=loop=-1:size=${Math.floor(src * 48000)}`);
    f.push(`atrim=0:${dur.toFixed(3)}`, 'asetpts=PTS-STARTPTS');
    if (e.fadeIn) f.push(`afade=t=in:d=${e.fadeIn}`);
    if (e.fadeOut) f.push(`afade=t=out:st=${Math.max(0, dur - e.fadeOut).toFixed(3)}:d=${e.fadeOut}`);
    f.push(`volume=${gain.toFixed(2)}dB`, `adelay=delays=${ms(at)}:all=1`);
    chains.push(`${f.join(',')}[f${i}]`);
    fx.push(`[f${i}]`);
  }
}
if (fx.length) chains.push(`${fx.join('')}amix=inputs=${fx.length}:normalize=0:duration=longest,apad,atrim=0:${T.toFixed(3)}${STEMS ? ',asplit=2[fx][fxS]' : '[fx]'}`);

// ── music, ducked under the voice ────────────────────
const music = p('build/music.mp3');
let bed = null;
if (existsSync(music)) {
  const i = addInput(music);
  const mNorm = -32 - meanVolume(music);
  // if the film has grown past the track, slow it a touch (pitch-preserving)
  // so its intro and ending still line up with the picture
  const mDur = duration(music);
  const tempo = mDur < T + 0.5 ? Math.max(0.9, mDur / (T + 0.5)) : 1;
  if (tempo < 1) console.log(`music stretched to fit: tempo ${tempo.toFixed(4)}`);
  // let the music swell where nobody is talking: title, chapter cards, end card
  const bumps = [];
  const bump = (a, b, db) => bumps.push(`${(Math.pow(10, db / 20) - 1).toFixed(3)}*clip((t-${a.toFixed(2)})/0.6,0,1)*clip((${b.toFixed(2)}-t)/0.6,0,1)`);
  for (const s of timeline.shots) if (!s.text) bump(s.start - 0.4, s.end + 0.3, s.scene === 'title' ? 6.5 : 4.5);
  const last = timeline.shots[timeline.shots.length - 1];
  if (last.text) bump(last.start + last.cueT.end + 0.2, T + 1, 6);
  const swell = bumps.length ? `volume='1+${bumps.join('+')}':eval=frame,` : '';
  chains.push(
    `[${i}:a]aresample=48000,aformat=channel_layouts=stereo,${tempo < 1 ? `atempo=${tempo.toFixed(5)},` : ''}atrim=0:${T.toFixed(3)},apad,atrim=0:${T.toFixed(3)},` +
    `volume=${mNorm.toFixed(2)}dB,${swell}afade=t=in:d=2.5,afade=t=out:st=${(T - 3.5).toFixed(3)}:d=3.5[mraw]`,
    `[mraw][key]sidechaincompress=threshold=0.015:ratio=6:attack=40:release=700:knee=4${STEMS ? ',asplit=2[bed][bedS]' : '[bed]'}`
  );
  bed = '[bed]';
} else console.warn('! no music (run tools/sounds.mjs)');

const buses = ['[voice]', fx.length ? '[fx]' : null, bed].filter(Boolean);
chains.push(`${buses.join('')}amix=inputs=${buses.length}:normalize=0:duration=first,alimiter=limit=0.95:level=false[mix]`);

const pre = p('build/premix.wav');
console.log(`Mixing ${narr.length} narration clips, ${fx.length} effects${bed ? ', music' : ''}…`);
const outs = ['-map', '[mix]', '-c:a', 'pcm_s24le', '-ar', '48000', pre];
const stemMap = { voiceS: 'voice', fxS: 'fx', bedS: 'music' };
for (const [label, name] of Object.entries(stemMap)) {
  if (!chains.some((c) => c.includes(`[${label}]`))) continue;
  if (STEMS) outs.push('-map', `[${label}]`, '-c:a', 'pcm_s16le', '-ar', '48000', p(`build/stem-${name}.wav`));
}
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', chains.join(';'), ...outs], { stdio: 'inherit' });

// two-pass loudness normalisation
const meas = String(execFileSync('sh', ['-c', `ffmpeg -hide_banner -i "${pre}" -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1`]));
const j = JSON.parse(meas.slice(meas.lastIndexOf('{'), meas.lastIndexOf('}') + 1));
const ln = `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
const wav = p('build/soundtrack.wav');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', pre, '-af', ln, '-ar', '48000', '-c:a', 'pcm_s16le', wav]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-c:a', 'aac', '-b:a', '192k', p('build/soundtrack.m4a')]);
rmSync(pre, { force: true });
console.log(`input ${j.input_i} LUFS → −16 LUFS · ${T.toFixed(2)} s → build/soundtrack.wav, build/soundtrack.m4a`);
