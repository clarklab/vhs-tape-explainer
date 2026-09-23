/* The film compositor: timeline → frame.
   Scenes draw in a 1280 × 720 space. VHS.film.frame(ctx, t, scale) paints
   the whole picture at video time t, including camera moves, transitions,
   on-screen facts ("supers"), grain and vignette. Everything is a function
   of t, so any frame can be rendered on its own, in any order. */
(function () {
  const V = window.VHS;
  const C = V.C;
  const TL = window.VHS_TIMELINE;
  const TAU = Math.PI * 2;
  const W = 1280, H = 720;
  const F = (V.film = V.film || {});
  F.W = W;
  F.H = H;
  F.scenes = F.scenes || {};
  F.art = F.art || {};

  /* ── helpers shared by the scenes ─────────────────── */

  /** Uppercase mono label, sized for TV. */
  // uppercase, but units stay in their proper case (µm, mm/s, km/h, MHz)
  F.caps = (str) =>
    V.upper(str)
      .replace(/µM\b/g, 'µm')
      .replace(/\bMM\/S\b/g, 'mm/s')
      .replace(/\bKM\/H\b/g, 'km/h')
      .replace(/(\d) M\/S\b/g, '$1 m/s')
      .replace(/(\d) M\b/g, '$1 m')
      .replace(/(\d) S\b/g, '$1 s')
      .replace(/MHZ\b/g, 'MHz')
      .replace(/KHZ\b/g, 'kHz');

  F.lab = (ctx, str, x, y, o = {}) =>
    V.text(ctx, F.caps(str), x, y, { size: 19, spacing: 1.4, color: C.mute, ...o });

  /** Width of a label, for laying things out next to each other. */
  F.labW = (ctx, str, o = {}) => {
    ctx.font = `${o.weight || 400} ${o.size || 19}px ${V.F[o.fam || 'mono']}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = (o.spacing == null ? 1.4 : o.spacing) + 'px';
    const w = ctx.measureText(F.caps(str)).width;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    return w;
  };

  /** A bright label followed by a quieter one on the same line. */
  F.labPair = (ctx, a, b, x, y, o = {}) => {
    F.lab(ctx, a, x, y, { color: C.ink, ...o });
    F.lab(ctx, b, x + F.labW(ctx, a, o) + 18, y, o);
  };

  /** Display type that shrinks to fit maxW. */
  F.display = (ctx, str, x, y, o = {}) => {
    let size = o.size || 48;
    const set = () => {
      ctx.font = `${o.italic ? 'italic ' : ''}${o.weight || 800} ${size}px ${V.F.display}`;
      if ('fontStretch' in ctx) ctx.fontStretch = o.stretch || 'expanded';
    };
    set();
    if (o.maxW) {
      const w = ctx.measureText(str).width;
      if (w > o.maxW) { size *= o.maxW / w; set(); }
    }
    V.text(ctx, str, x, y, { fam: 'display', size, weight: o.weight || 800, stretch: o.stretch || 'expanded', color: o.color || C.ink, align: o.align, italic: o.italic });
    return size;
  };

  /**
   * Animated callout: the dot lands, the leader line draws out, then the
   * label fades up. p runs 0 → 1 (use s.ramp(cue, delay, 0.9)).
   */
  F.co = (ctx, o) => {
    const p = o.p == null ? 1 : o.p;
    if (p <= 0) return;
    const [x1, y1] = o.from;
    const [x2, y2] = o.to;
    const right = o.align === 'right';
    const col = o.color || C.ink;
    const ex = x2 + (right ? -16 : 16);
    ctx.save();
    // dot + one-off ring
    const dp = V.easeOut(V.clamp(p * 3));
    V.alpha(ctx, 1);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x1, y1, 4.5 * dp, 0, TAU);
    ctx.fill();
    if (p < 0.8) {
      V.alpha(ctx, (1 - p / 0.8) * 0.7);
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x1, y1, 5 + p * 30, 0, TAU);
      ctx.stroke();
    }
    // leader line, drawn along its length
    const l1 = Math.hypot(x2 - x1, y2 - y1), l2 = Math.abs(ex - x2);
    const drawn = V.clamp((p - 0.1) / 0.55) * (l1 + l2);
    V.alpha(ctx, 1);
    ctx.strokeStyle = o.lineColor || 'rgba(239,232,221,.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    if (drawn <= l1) ctx.lineTo(x1 + ((x2 - x1) * drawn) / l1, y1 + ((y2 - y1) * drawn) / l1);
    else {
      ctx.lineTo(x2, y2);
      ctx.lineTo(x2 + (ex - x2) * ((drawn - l1) / l2), y2);
    }
    ctx.stroke();
    // label
    const ta = V.clamp((p - 0.45) / 0.45);
    if (ta > 0) {
      const tx = ex + (right ? -8 : 8) + (right ? 1 : -1) * (1 - ta) * 10;
      V.alpha(ctx, ta);
      V.text(ctx, F.caps(o.text), tx, y2 + 7, {
        size: o.size || 21, weight: 500, spacing: 1.2, color: col, align: right ? 'right' : 'left',
      });
      if (o.sub) {
        V.text(ctx, o.sub, tx, y2 + 33, { size: o.subSize || 18, color: C.mute, align: right ? 'right' : 'left', fam: 'body' });
      }
    }
    ctx.restore();
  };

  /** Backdrop of faint diagonal head tracks, used by the title cards. */
  F.art.tracks = (ctx, t, a, o = {}) => {
    const ang = (18 * Math.PI) / 180;
    const p = o.pitch || 64;
    const L = H / Math.tan(ang);
    const s = t * (o.speed || 22);
    V.alpha(ctx, a);
    for (let i = Math.floor((-L - p + s) / p) - 1; i <= Math.ceil((W + s) / p); i++) {
      const x = i * p - s;
      ctx.fillStyle = i % 2 ? C.b : C.a;
      V.alpha(ctx, a * (o.alpha || 0.07));
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.lineTo(x + p * 0.92, H);
      ctx.lineTo(x + p * 0.92 + L, 0);
      ctx.lineTo(x + L, 0);
      ctx.closePath();
      ctx.fill();
    }
    const g = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 720);
    g.addColorStop(0, 'rgba(11,10,12,0.15)');
    g.addColorStop(1, 'rgba(11,10,12,1)');
    V.alpha(ctx, a);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };

  /** VCR on-screen display text, with the drop shadow VCRs used. */
  F.osd = (ctx, s, x, y, o = {}) => {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.85)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    V.text(ctx, s, x, y, { fam: 'osd', size: o.size || 34, color: o.color || C.osd, align: o.align || 'left' });
    ctx.restore();
  };

  F.timecode = (t) => {
    const s = Math.max(0, Math.floor(t));
    return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  /* ── timeline ─────────────────────────────────────── */
  F.build = () => {
    F.timeline = TL.build(window.VHS_SCRIPT, window.VHS_NARRATION);
    F.duration = F.timeline.duration;
    return F.timeline;
  };

  function state(shot, t) {
    const lt = t - shot.start;
    const at = (c) => TL.cueTime(shot, c);
    return {
      t, lt, shot, dur: shot.dur,
      at,
      since: (c, d = 0) => lt - at(c) - d,
      ramp: (c, d = 0, len = 0.7) => V.ramp(lt - at(c) - d, 0, len),
      co: (c, d = 0) => V.clamp((lt - at(c) - d) / 1.1),
    };
  }

  function camera(shot, lt) {
    let x = W / 2, y = H / 2, z = 1;
    const keys = (shot.camera || [])
      .map((k) => ({ ...k, t0: TL.cueTime(shot, k.at) + (k.delay || 0) }))
      .sort((a, b) => a.t0 - b.t0);
    for (const k of keys) {
      if (lt < k.t0) break;
      const e = V.ease(V.clamp((lt - k.t0) / (k.len || 1.5)));
      if (k.x != null) x = V.lerp(x, k.x, e);
      if (k.y != null) y = V.lerp(y, k.y, e);
      if (k.z != null) z = V.lerp(z, k.z, e);
    }
    // slow push-in across every shot, like a rostrum camera
    z *= 1 + (shot.drift == null ? 0.03 : shot.drift) * V.clamp(lt / shot.dur);
    if (z >= 1) {
      x = V.clamp(x, W / 2 / z, W - W / 2 / z);
      y = V.clamp(y, H / 2 / z, H - H / 2 / z);
    }
    return { x, y, z };
  }

  /* ── supers: on-screen facts and terms ────────────── */
  function drawSuper(ctx, sp, u) {
    const hold = sp.hold || 4;
    const aIn = V.clamp(u / 0.55);
    const aOut = 1 - V.ease(V.clamp((u - hold) / 0.45));
    if (aOut <= 0) return;
    const term = sp.kind === 'term';
    const right = sp.pos === 'br' || sp.pos === 'tr';
    const top = sp.pos === 'tl' || sp.pos === 'tr';
    const x = right ? W - 64 : 64;
    const yBig = top ? 104 : term ? 632 : 636;
    const bigSize = term ? 44 : 52;

    ctx.save();
    // measure
    ctx.font = `800 ${bigSize}px ${V.F.display}`;
    if ('fontStretch' in ctx) ctx.fontStretch = 'expanded';
    const bw = ctx.measureText(sp.big).width;
    const sw = F.labW(ctx, sp.small || '', { size: 18 });
    const w = Math.max(bw, sw) + 40;
    // scrim
    const sx = right ? x - w - 30 : x - 34;
    const g = ctx.createLinearGradient(right ? sx + w + 60 : sx, 0, right ? sx : sx + w + 60, 0);
    g.addColorStop(0, 'rgba(11,10,12,.9)');
    g.addColorStop(0.72, 'rgba(11,10,12,.78)');
    g.addColorStop(1, 'rgba(11,10,12,0)');
    V.alpha(ctx, aOut * V.easeOut(aIn));
    ctx.fillStyle = g;
    ctx.fillRect(sx, yBig - bigSize - (term ? 42 : 18), w + 60, bigSize + (term ? 86 : 66));

    // amber rule grows first
    const ruleH = V.easeOut(V.clamp(aIn * 2)) * (bigSize + (term ? 58 : 34));
    const rx = right ? x + 16 : x - 18;
    V.alpha(ctx, aOut);
    ctx.fillStyle = C.a;
    ctx.fillRect(rx - 2, yBig - bigSize + 4 - (term ? 28 : 0), 4, ruleH);

    // text wipes on
    const wipe = V.ease(V.clamp((aIn - 0.2) / 0.8));
    ctx.beginPath();
    if (right) ctx.rect(x - (w + 20) * wipe, yBig - bigSize - 50, w + 40, bigSize + 100);
    else ctx.rect(x - 4, yBig - bigSize - 50, (w + 20) * wipe, bigSize + 100);
    ctx.clip();
    if (term) V.text(ctx, "IT'S CALLED", x, yBig - bigSize - 8, { size: 17, spacing: 3, color: C.a, align: right ? 'right' : 'left' });
    V.text(ctx, sp.big, x, yBig, { fam: 'display', size: bigSize, weight: 800, stretch: 'expanded', color: C.ink, align: right ? 'right' : 'left' });
    if (sp.small) F.lab(ctx, sp.small, x, yBig + 34, { size: 18, color: 'rgba(239,232,221,.78)', align: right ? 'right' : 'left' });
    ctx.restore();
  }

  function supers(ctx, shot, lt) {
    for (const sp of shot.supers || []) {
      const u = lt - (TL.cueTime(shot, sp.at) + (sp.offset || 0));
      if (u < 0 || u > (sp.hold || 4) + 0.5) continue;
      drawSuper(ctx, sp, u);
    }
  }

  /* ── one shot, with its camera ────────────────────── */
  function drawShot(ctx, shot, t, alpha, zoomK) {
    if (alpha <= 0.001) return;
    const scene = F.scenes[shot.scene];
    const s = state(shot, t);
    const cam = camera(shot, s.lt);
    const z = cam.z * (zoomK || 1);
    ctx.save();
    ctx._base = alpha;
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-cam.x, -cam.y);
    if (scene) scene(ctx, s);
    else V.text(ctx, `missing scene: ${shot.scene}`, cam.x, cam.y, { color: '#f55', align: 'center', size: 30 });
    ctx.restore();
    ctx.save();
    ctx._base = alpha;
    supers(ctx, shot, s.lt);
    ctx.restore();
    ctx._base = 1;
  }

  /* ── film grain + vignette ────────────────────────── */
  const grains = [];
  for (let k = 0; k < 6; k++) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const im = g.createImageData(256, 256);
    const r = V.rng(100 + k);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = r() * 255;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
      im.data[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    grains.push(c);
  }
  let vignette = null;

  function finish(ctx, t, frameNo) {
    const g = grains[frameNo % grains.length];
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.07;
    const r = V.rng(frameNo * 7 + 3);
    const ox = -r() * 256, oy = -r() * 256;
    for (let y = oy; y < H; y += 256) for (let x = ox; x < W; x += 256) ctx.drawImage(g, x, y);
    ctx.restore();
    if (!vignette) {
      vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,.42)');
    }
    ctx.save();
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  /* ── VHS glitch, applied to the finished picture ──── */
  let scratch = null;
  function glitch(ctx, amount, seed) {
    const cv = ctx.canvas;
    if (!scratch || scratch.width !== cv.width) {
      scratch = document.createElement('canvas');
      scratch.width = cv.width;
      scratch.height = cv.height;
    }
    const sc = scratch.getContext('2d');
    sc.setTransform(1, 0, 0, 1, 0, 0);
    sc.clearRect(0, 0, cv.width, cv.height);
    sc.drawImage(cv, 0, 0);
    const k = cv.width / W;
    const r = V.rng(seed);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // colour ghosting
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.28 * amount;
    ctx.drawImage(scratch, 14 * k * amount, 0);
    ctx.globalAlpha = 0.18 * amount;
    ctx.drawImage(scratch, -10 * k * amount, 2 * k);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    // torn horizontal bands
    const bands = 5 + Math.floor(amount * 10);
    for (let i = 0; i < bands; i++) {
      const y = r() * cv.height;
      const h = (4 + r() * 60 * amount) * k;
      const dx = (r() - 0.5) * 160 * k * amount;
      ctx.drawImage(scratch, 0, y, cv.width, h, dx, y, cv.width, h);
    }
    // snow bands
    const snowY = r() * cv.height;
    ctx.globalAlpha = 0.55 * amount;
    V.crt.snow(ctx, 0, snowY, cv.width, (30 + r() * 120) * k * amount);
    ctx.globalAlpha = 0.25 * amount * amount;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.restore();
  }

  /* ── the frame ────────────────────────────────────── */
  const FADE = 0.6, ZOOM = 0.9, GLITCH = 0.28;

  F.shotAt = (t) => {
    const sh = F.timeline.shots;
    let i = 0;
    while (i < sh.length - 1 && t >= sh[i + 1].start) i++;
    return i;
  };

  /**
   * Paint video time t into ctx. `scale` maps 1280×720 to the canvas.
   */
  F.frame = (ctx, t, scale, frameNo = Math.round(t * 30)) => {
    const shots = F.timeline.shots;
    const i = F.shotAt(t);
    const sh = shots[i];
    const lt = t - sh.start;
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = C.stage;
    ctx.fillRect(0, 0, W, H);

    const tr = sh.transition || 'fade';
    const prev = shots[i - 1];
    if (prev && tr === 'fade' && lt < FADE) {
      const k = V.ease(lt / FADE);
      drawShot(ctx, prev, t, 1 - k);
      drawShot(ctx, sh, t, k);
    } else if (prev && tr === 'zoom' && lt < ZOOM) {
      const k = lt / ZOOM;
      drawShot(ctx, prev, t, 1 - V.ease(V.clamp(k * 1.4)), 1 + 2.2 * k * k);
      drawShot(ctx, sh, t, V.ease(V.clamp((k - 0.25) / 0.75)), 0.82 + 0.18 * V.easeOut(k));
    } else {
      drawShot(ctx, sh, t, 1);
    }

    finish(ctx, t, frameNo);

    // global fade out at the very end
    const tail = F.duration - t;
    if (tail < 1.4) {
      ctx.globalAlpha = V.ease(V.clamp(1 - tail / 1.4));
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // glitch cut: straddles the start of a shot that arrives with 'glitch'
    const next = shots[i + 1];
    let g = 0;
    if (tr === 'glitch' && prev && lt < GLITCH) g = 1 - lt / GLITCH;
    if (next && (next.transition || 'fade') === 'glitch' && next.start - t < GLITCH) g = Math.max(g, 1 - (next.start - t) / GLITCH);
    if (g > 0) glitch(ctx, V.clamp(g), frameNo * 13 + 1);
  };
})();
