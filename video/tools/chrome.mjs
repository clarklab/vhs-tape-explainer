// A minimal headless-Chrome driver over the DevTools protocol (no npm deps:
// Node 22's built-in WebSocket is enough). One Chrome process per page, so
// several can render in parallel on separate cores.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

export const chromePath = () => {
  const p = CANDIDATES.find((c) => existsSync(c));
  if (!p) throw new Error('Chrome not found; set CHROME_PATH');
  return p;
};

export async function openPage(url, { width = 1920, height = 1080 } = {}) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'vhs-chrome-'));
  const proc = spawn(chromePath(), [
    '--headless=new', `--user-data-dir=${dir}`, '--remote-debugging-port=0',
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--hide-scrollbars', '--mute-audio', '--allow-file-access-from-files',
    `--window-size=${width},${height}`, '--force-device-scale-factor=1',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    proc.stderr.on('data', (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) resolve(m[1]);
    });
    proc.on('exit', (code) => reject(new Error(`Chrome exited (${code}): ${buf.slice(-500)}`)));
  });

  const ws = new WebSocket(wsUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    }
  };
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
    });

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const call = (m, p) => send(m, p, sessionId);
  await call('Page.enable');
  await call('Runtime.enable');
  await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url });

  const evaluate = async (expression) => {
    const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error(`Page error: ${d.exception ? d.exception.description : d.text}`);
    }
    return r.result.value;
  };

  // wait for the page to expose its hook
  for (let i = 0; ; i++) {
    const ok = await evaluate('document.readyState === "complete" && typeof window.__vhs === "object"').catch(() => false);
    if (ok) break;
    if (i > 300) throw new Error('Page never became ready');
    await new Promise((r) => setTimeout(r, 100));
  }

  const close = async () => {
    try { ws.close(); } catch {}
    proc.kill('SIGKILL');
    await new Promise((r) => setTimeout(r, 100));
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
  };
  return { evaluate, close };
}
