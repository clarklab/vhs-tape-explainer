// Shared paths and helpers for the build tools.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..');
export const BUILD = path.join(ROOT, 'build');
export const p = (...a) => path.join(ROOT, ...a);

const require = createRequire(import.meta.url);

/** The script, the timeline builder and (if generated) the narration timings. */
export function loadProject() {
  delete globalThis.VHS_NARRATION;
  require(p('js/script.js'));
  require(p('js/timeline.js'));
  const nFile = p('build/narration.js');
  if (existsSync(nFile)) {
    delete require.cache[nFile];
    require(nFile);
  }
  const script = globalThis.VHS_SCRIPT;
  const TL = globalThis.VHS_TIMELINE;
  const timeline = TL.build(script, globalThis.VHS_NARRATION);
  return { script, TL, timeline, narration: globalThis.VHS_NARRATION };
}

export function apiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  const env = p('.env');
  if (existsSync(env)) {
    const m = readFileSync(env, 'utf8').match(/^ELEVENLABS_API_KEY=(.+)$/m);
    if (m) return m[1].trim();
  }
  throw new Error('Set ELEVENLABS_API_KEY (or put ELEVENLABS_API_KEY=... in video/.env)');
}

export function duration(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
  return parseFloat(String(out));
}

export const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(2).padStart(5, '0')}`;
};

export async function eleven(route, body, { query = '' } = {}) {
  const url = `https://api.elevenlabs.io${route}${query ? '?' + query : ''}`;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return res;
    const msg = await res.text();
    if (attempt < 4 && (res.status === 429 || res.status >= 500)) {
      console.warn(`  ${res.status}, retrying…`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      continue;
    }
    throw new Error(`ElevenLabs ${route} → ${res.status}: ${msg.slice(0, 400)}`);
  }
}
