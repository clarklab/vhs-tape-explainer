/* Shared helpers for the canvas scenes.
   Every scene draws in a fixed 1000 × 720 virtual space; deck.js fits that
   space into whatever size the stage happens to be. */
(function () {
  const VHS = (window.VHS = window.VHS || {});
  VHS.scenes = VHS.scenes || {};
  VHS.W = 1000;
  VHS.H = 720;

  VHS.C = {
    stage: '#0b0a0c',
    panel: '#18161a',
    line: '#2e2a31',
    ink: '#efe8dd',
    mute: '#a69d93',
    faint: '#6c646c',
    oxide: '#6e4226',
    oxideHi: '#a3683c',
    oxideLo: '#3b2314',
    coat: '#3a2213',
    chrome: '#d3d6dc',
    chromeMid: '#8e929b',
    chromeLo: '#45484f',
    a: '#ffb13b',
    b: '#46c9e8',
    copper: '#c9793e',
    base: '#27303b',
    north: '#f3b870',
    south: '#8ea2bb',
    osd: '#eaf6e6',
  };

  VHS.F = {
    display: '"Archivo", "Arial Black", sans-serif',
    body: '"IBM Plex Sans", system-ui, sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
    osd: '"VT323", "IBM Plex Mono", monospace',
  };

  let reduced = false;
  try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  VHS.reduced = reduced;

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  VHS.clamp = clamp;
  VHS.lerp = lerp;
  VHS.ease = ease;
  VHS.easeOut = easeOut;
  /** 0→1 eased ramp that starts at `start` seconds and lasts `dur`. */
  VHS.ramp = (t, start = 0, dur = 0.6) => easeOut(clamp((t - start) / dur));
  VHS.smooth = (a, b, x) => {
    const t = clamp((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };

  /** Deterministic PRNG (mulberry32) so scenes look the same every visit. */
  VHS.rng = (seed) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /** Alpha relative to the crossfade level deck.js sets on the context. */
  VHS.alpha = (ctx, a) => {
    ctx.globalAlpha = (ctx._base == null ? 1 : ctx._base) * clamp(a);
  };

  VHS.rr = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  };

  VHS.text = (ctx, str, x, y, o = {}) => {
    const size = o.size || 18;
    const fam = VHS.F[o.fam || 'mono'];
    ctx.font = `${o.italic ? 'italic ' : ''}${o.weight || 400} ${size}px ${fam}`;
    if ('fontStretch' in ctx) ctx.fontStretch = o.stretch || 'normal';
    if ('letterSpacing' in ctx) ctx.letterSpacing = (o.spacing || 0) + 'px';
    ctx.fillStyle = o.color || VHS.C.ink;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.baseline || 'alphabetic';
    ctx.fillText(str, x, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  };

  /** Uppercase, but keep µ (toUpperCase turns it into Greek capital Mu). */
  VHS.upper = (s) => s.toUpperCase().replace(/\u039C/g, '\u00B5');

  /** Uppercase mono label. */
  VHS.label = (ctx, str, x, y, o = {}) =>
    VHS.text(ctx, VHS.upper(str), x, y, { size: 17, spacing: 1.2, color: VHS.C.mute, ...o });

  /**
   * Callout: a dot on the thing, a leader line, and a label.
   * from = [x, y] on the object, to = [x, y] where the label sits.
   */
  VHS.callout = (ctx, o) => {
    const [x1, y1] = o.from;
    const [x2, y2] = o.to;
    const a = o.a == null ? 1 : o.a;
    if (a <= 0) return;
    const right = o.align === 'right';
    const col = o.color || VHS.C.ink;
    ctx.save();
    VHS.alpha(ctx, a);
    ctx.strokeStyle = o.lineColor || 'rgba(239,232,221,.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2 + (right ? -14 : 14), y2);
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x1, y1, 3.5, 0, Math.PI * 2);
    ctx.fill();
    const tx = x2 + (right ? -20 : 20);
    VHS.text(ctx, VHS.upper(o.text), tx, y2 + 6, {
      size: o.size || 18, weight: 500, spacing: 1, color: col, align: right ? 'right' : 'left',
    });
    if (o.sub) {
      VHS.text(ctx, o.sub, tx, y2 + 29, {
        size: o.subSize || 16, color: VHS.C.mute, align: right ? 'right' : 'left', fam: 'body',
      });
    }
    ctx.restore();
  };

  /** Arrow head at (x, y) pointing along angle `ang`. */
  VHS.arrowHead = (ctx, x, y, ang, s = 8) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - s * Math.cos(ang - 0.45), y - s * Math.sin(ang - 0.45));
    ctx.lineTo(x - s * Math.cos(ang + 0.45), y - s * Math.sin(ang + 0.45));
    ctx.closePath();
    ctx.fill();
  };

  /** Brushed-chrome linear gradient across a box. */
  VHS.chrome = (ctx, x0, y0, x1, y1) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, '#5a5d65');
    g.addColorStop(0.18, '#c9ccd3');
    g.addColorStop(0.32, '#f1f2f4');
    g.addColorStop(0.55, '#9a9ea7');
    g.addColorStop(0.8, '#d0d3d9');
    g.addColorStop(1, '#4d5057');
    return g;
  };

  /** Pre-rendered speckle texture for oxide surfaces (tileable). */
  VHS.grain = (() => {
    let pat = null;
    return (ctx) => {
      if (pat) return pat;
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      const r = VHS.rng(11);
      for (let i = 0; i < 1400; i++) {
        const v = r();
        g.fillStyle = v > 0.5 ? `rgba(255,210,160,${0.05 + r() * 0.08})` : `rgba(0,0,0,${0.08 + r() * 0.12})`;
        g.fillRect(r() * 128, r() * 128, 1 + r() * 1.5, 1 + r() * 1.5);
      }
      pat = ctx.createPattern(c, 'repeat');
      return pat;
    };
  })();

  /** Positive modulo. */
  VHS.mod = (a, n) => ((a % n) + n) % n;

  /** Format with thousands separators. */
  VHS.fmt = (n) => Math.floor(n).toLocaleString('en-US');
})();
