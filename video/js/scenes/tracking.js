/* Part 3 · Tracking. 16:9 versions of the deck's slide-3 animations
   (js/scene-tracking.js). The deck's live TRACKING slider becomes a scripted
   knob here, turned in time with the narration. */
(function () {
  const V = window.VHS;
  const C = V.C;
  const F = V.film;
  const TAU = Math.PI * 2;
  const W = F.W;
  const GREEN = '#7fe0a8';
  const RED = '#e06a52';
  const SCR = { x: 92, y: 70, w: 456, h: 342 };
  const PX = 668; // right-hand panel

  // ── tracking model ─────────────────────────────────
  // e(y): how far the head sits from the centre of its own track, in track
  // pitches, at fraction y down the picture. Another deck's tape starts
  // offset (E_BAD) and at a slightly different angle (SLOPE).
  const E_BAD = 0.5, SLOPE = 0.5;
  const offsetAt = (m, y) => m.e0 + m.k * (y - 0.5);
  const wrapD = (e) => V.mod(e + 1, 2) - 1;
  const noiseAt = (m, y) => V.smooth(0.35, 0.6, Math.abs(wrapD(offsetAt(m, y))));

  function model(s) {
    const id = s.shot.scene;
    if (id === 'tracking.servo') return { e0: 0, k: 0, knob: 0, osd: 0 };
    if (id === 'tracking.drift') {
      const bad = E_BAD * V.smooth(0, 2.2, s.since('other', 0.4));
      const knob = E_BAD * V.smooth(0, 2.6, s.since('knob', 0.1));
      const k = SLOPE * V.smooth(0, 1.5, s.since('other', 0.4));
      const osd = s.since('knob', -0.1) > 0 && s.since('knob') < 3.6 ? 1 : 0;
      return { e0: bad + 0.08 * Math.sin(s.t * 1.3) * V.clamp(s.since('other')) - knob, k, knob, osd };
    }
    return { e0: 0.03 * Math.sin(s.t * 0.7), k: SLOPE, knob: E_BAD, osd: 0 };
  }

  // ── the TV set ─────────────────────────────────────
  function tvSet(ctx, s, m, o) {
    const t = s.t;
    V.alpha(ctx, 1);
    const g = ctx.createLinearGradient(0, 40, 0, 470);
    g.addColorStop(0, '#2a272c');
    g.addColorStop(1, '#171518');
    ctx.fillStyle = g;
    V.rr(ctx, SCR.x - 32, SCR.y - 30, SCR.w + 64, SCR.h + 88, 30);
    ctx.fill();
    ctx.strokeStyle = '#3a363d';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#050505';
    V.rr(ctx, SCR.x - 8, SCR.y - 8, SCR.w + 16, SCR.h + 16, 32);
    ctx.fill();
    V.crt.draw(ctx, SCR.x, SCR.y, SCR.w, SCR.h, {
      t,
      noise: (y) => noiseAt(m, y),
      hs: o.hs,
      smear: o.smear,
    });
    // an old TV's bezel hides the edges of the picture (overscan)
    if (o.overscan > 0) {
      const k = o.overscan;
      ctx.save();
      V.alpha(ctx, 1);
      ctx.beginPath();
      V.rr(ctx, SCR.x - 2, SCR.y - 2, SCR.w + 4, SCR.h + 4, 26);
      ctx.moveTo(0, 0);
      const ix = SCR.x + 22 * k, iy = SCR.y + 18 * k, iw = SCR.w - 44 * k, ih = SCR.h - 40 * k;
      ctx.roundRect ? ctx.roundRect(ix, iy, iw, ih, 30) : ctx.rect(ix, iy, iw, ih);
      ctx.fillStyle = '#0a090b';
      ctx.fill('evenodd');
      ctx.restore();
    }
    V.alpha(ctx, 1);
    ctx.fillStyle = '#3a363d';
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      ctx.arc(SCR.x + 22 + i * 12, SCR.y + SCR.h + 34, 2.5, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#e04a3a';
    ctx.beginPath();
    ctx.arc(SCR.x + SCR.w - 8, SCR.y + SCR.h + 34, 4, 0, TAU);
    ctx.fill();
    V.text(ctx, 'CH 3', SCR.x + SCR.w - 28, SCR.y + SCR.h + 41, { fam: 'osd', size: 22, color: C.mute, align: 'right' });

    // on-screen display, VCR style
    const inset = o.overscan ? 22 * o.overscan : 0;
    F.osd(ctx, 'PLAY ▶', SCR.x + 26 + inset, SCR.y + 44 + inset, { size: 32 });
    F.osd(ctx, o.hifi ? 'SP  HI-FI' : 'SP', SCR.x + SCR.w - 26 - inset, SCR.y + 44 + inset, { size: 32, align: 'right' });
    if (m.osd) {
      const blocks = 13;
      const pos = Math.round(((m.knob / E_BAD) * 0.5 + 0.5) * (blocks - 1));
      let bar = '';
      for (let i = 0; i < blocks; i++) bar += i === pos ? '█' : '▬';
      F.osd(ctx, 'TRACKING', SCR.x + SCR.w / 2, SCR.y + SCR.h - 62, { size: 32, align: 'center' });
      F.osd(ctx, bar, SCR.x + SCR.w / 2, SCR.y + SCR.h - 30, { size: 32, align: 'center' });
    } else if (!o.noClock) {
      F.osd(ctx, F.timecode(t + 1234), SCR.x + SCR.w - 26 - inset, SCR.y + SCR.h - 26 - inset, { size: 32, align: 'right' });
    }
  }

  // ── bottom: the tape and the head's actual path ────
  function tapeMap(ctx, s, m, o = {}) {
    const t = s.t;
    const top = 530, bot = 660, aB = 540, cT = 650, vh = cT - aB;
    const ang = (14 * Math.PI) / 180;
    const L = vh / Math.tan(ang);
    const p = 30, X0 = 40;
    V.alpha(ctx, 1);
    F.lab(ctx, 'The tape, unrolled · white = where the head runs', 64, top - 14, { size: 16, color: C.ink });
    ctx.fillStyle = '#5e381f';
    ctx.fillRect(0, top, W, bot - top);
    ctx.fillStyle = '#4e2e1a';
    ctx.fillRect(0, top, W, aB - top);
    ctx.fillRect(0, cT, W, bot - cT);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, aB, W, vh);
    ctx.clip();
    for (let j = -18; j < 44; j++) {
      const x = X0 + j * p;
      V.alpha(ctx, 0.3);
      ctx.fillStyle = V.mod(j, 2) ? C.b : C.a;
      ctx.beginPath();
      ctx.moveTo(x, cT);
      ctx.lineTo(x + p, cT);
      ctx.lineTo(x + p + L, aB);
      ctx.lineTo(x + L, aB);
      ctx.closePath();
      ctx.fill();
    }
    const j0 = 8;
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const f = i / 40;
      const cx = X0 + (j0 + 0.5 + offsetAt(m, f)) * p + f * L;
      pts.push([cx, cT - f * vh, noiseAt(m, f)]);
    }
    V.alpha(ctx, 0.5);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x - p / 2, y) : ctx.moveTo(x - p / 2, y)));
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0] + p / 2, pts[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 3;
    for (let i = 1; i < pts.length; i++) {
      V.alpha(ctx, 1);
      ctx.strokeStyle = pts[i][2] > 0.5 ? RED : GREEN;
      ctx.beginPath();
      ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
      ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }
    ctx.restore();
    const f = V.mod(t / 1.4, 1);
    const hx = X0 + (j0 + 0.5 + offsetAt(m, f)) * p + f * L;
    V.alpha(ctx, 1);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(hx, cT - f * vh, 6, 0, TAU);
    ctx.fill();
    // control pulses along the bottom edge (glow when they're the subject)
    const glow = o.pulseGlow || 0;
    for (let j = -18; j < 44; j += 2) {
      const x = X0 + j * p;
      if (x < 0 || x > W) continue;
      if (glow > 0) {
        V.alpha(ctx, glow * (0.6 + 0.4 * Math.sin(t * 6 - j * 0.3)));
        const gg = ctx.createRadialGradient(x + 2, cT + 6, 0, x + 2, cT + 6, 16);
        gg.addColorStop(0, 'rgba(255,220,160,.9)');
        gg.addColorStop(1, 'rgba(255,220,160,0)');
        ctx.fillStyle = gg;
        ctx.fillRect(x - 14, cT - 10, 32, 32);
      }
      V.alpha(ctx, 1);
      ctx.fillStyle = 'rgba(255,228,196,.8)';
      ctx.fillRect(x, cT + 2, 4, 8);
    }
    V.alpha(ctx, 1);
    F.lab(ctx, 'Control pulses along the bottom edge', 64, bot + 26, { size: 15, color: glow > 0.5 ? C.ink : C.mute });
    // matching scan position on the TV
    V.alpha(ctx, 0.5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(SCR.x, SCR.y + f * SCR.h, SCR.w, 1.5);
  }

  // ── right panels ───────────────────────────────────
  function filmStrip(ctx, s, a) {
    if (a <= 0) return;
    const x = PX, y = 76, w = W - 64 - PX, h = 92;
    const off = s.t * 55;
    V.alpha(ctx, a);
    F.lab(ctx, 'Film: sprocket holes', x, y - 16, { size: 17, color: C.ink });
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.fillStyle = '#131012';
    ctx.fillRect(x, y, w, h);
    for (let k = -1; k < 8; k++) F.art.filmFrame(ctx, x + k * 110 - V.mod(off, 110) + 6, y + 18, 98, 56, k + Math.floor(off / 110));
    ctx.fillStyle = 'rgba(230,220,205,.8)';
    for (let k = -1; k < 40; k++) {
      const xx = x + k * 22 - V.mod(off, 22);
      V.rr(ctx, xx, y + 5, 11, 8, 2);
      ctx.fill();
      V.rr(ctx, xx, y + h - 13, 11, 8, 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function servoPanel(ctx, s) {
    const hole = s.ramp('holes', 0, 0.6);
    const pul = s.ramp('pulses', 0, 0.6);
    filmStrip(ctx, s, hole * (1 - 0.7 * pul));
    const a = s.ramp('servo', 0, 0.6);
    if (pul > 0) {
      V.alpha(ctx, pul);
      F.lab(ctx, 'VHS: a control track', PX, 206, { size: 17, color: C.ink });
      F.lab(ctx, 'one pulse per frame · 30 a second', PX, 232, { size: 16 });
    }
    if (a <= 0) return;
    V.alpha(ctx, a);
    const lanes = [
      { y: 330, name: 'Control pulses (from the tape)', col: C.oxideHi },
      { y: 412, name: 'Drum position (tachometer)', col: C.a },
    ];
    const per = 118;
    // before "locked" the drum lane drifts, then the servo pulls it into line
    const lock = V.ease(V.clamp(s.since('locked', -0.4) / 1.2));
    const drift = (1 - lock) * (26 + 14 * Math.sin(s.t * 1.7));
    const off = V.mod(s.t * 55, per);
    lanes.forEach((l, i) => {
      F.lab(ctx, l.name, PX, l.y - 40, { size: 16 });
      ctx.strokeStyle = l.col;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(PX, l.y);
      const o = off + (i ? drift : 0);
      for (let x = PX - V.mod(o, per); x < W - 64; x += per) {
        const x1 = Math.max(PX, x), x2 = Math.min(W - 64, x + 18);
        if (x2 <= PX) continue;
        ctx.lineTo(x1, l.y);
        ctx.lineTo(x1, l.y - 26);
        ctx.lineTo(x2, l.y - 26);
        ctx.lineTo(x2, l.y);
      }
      ctx.lineTo(W - 64, l.y);
      ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(239,232,221,.35)';
    ctx.setLineDash([3, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = PX - V.mod(off, per); x < W - 64; x += per) {
      if (x < PX) continue;
      ctx.moveTo(x, 330);
      ctx.lineTo(x, 386);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    const on = lock > 0.9 ? 0.6 + 0.4 * Math.sin(s.t * 4) : 0.4;
    ctx.fillStyle = lock > 0.9 ? GREEN : C.a;
    V.alpha(ctx, a * on);
    ctx.beginPath();
    ctx.arc(PX + 12, 470, 9, 0, TAU);
    ctx.fill();
    V.alpha(ctx, a);
    V.text(ctx, lock > 0.9 ? 'LOCKED' : 'ADJUSTING…', PX + 34, 480, { fam: 'osd', size: 36, color: lock > 0.9 ? GREEN : C.a });
  }

  function profile(ctx, s, m) {
    const a = V.ramp(s.lt, 0.3, 0.6);
    const x0 = PX + 20, x1 = W - 64, y0 = SCR.y, y1 = SCR.y + SCR.h;
    V.alpha(ctx, a);
    F.lab(ctx, 'Signal down the picture', PX, 50, { color: C.ink, size: 17 });
    ctx.fillStyle = C.panel;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    const rows = 48, rh = (y1 - y0) / rows;
    for (let i = 0; i < rows; i++) {
      const n = noiseAt(m, (i + 0.5) / rows);
      const w = (x1 - x0) * (1 - n);
      V.alpha(ctx, a * 0.85);
      ctx.fillStyle = GREEN;
      ctx.fillRect(x0, y0 + i * rh, w, rh - 1);
      ctx.fillStyle = RED;
      ctx.fillRect(x0 + w, y0 + i * rh, x1 - x0 - w, rh - 1);
    }
    V.alpha(ctx, a);
    V.text(ctx, '■ clean picture', x0, y1 + 26, { size: 16, color: GREEN });
    V.text(ctx, '■ snow', x1, y1 + 26, { size: 16, color: RED, align: 'right' });
    const off = m.e0;
    V.text(ctx, `HEAD OFFSET ${off >= 0 ? '+' : '−'}${Math.abs(off).toFixed(2)} TRACK`, PX, 474, { fam: 'osd', size: 30, color: C.ink });
    V.text(ctx, `≈ ${Math.round(Math.abs(off) * 58)} µm off centre, mid-picture`, PX, 500, { size: 16, color: C.mute });
  }

  function headSwitch(ctx, s) {
    const a = V.ramp(s.lt, 0.3, 0.6);
    const bx = PX, by = 72, bw = W - 64 - PX, bh = 150;
    const z = s.ramp('bottom', 0, 0.6);
    V.alpha(ctx, a * z);
    F.lab(ctx, 'Bottom of the frame, magnified', bx, by - 16, { color: C.ink, size: 17 });
    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, by, bw, bh);
    ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(V.crt.canvas, 0, V.crt.TH - 12, V.crt.TW, 12, bx, by, bw, bh);
    ctx.imageSmoothingEnabled = true;
    ctx.restore();
    ctx.strokeStyle = C.a;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
    const hide = s.ramp('bezel', 0.2, 0.8) * (1 - s.ramp('rip', 0, 0.8));
    V.alpha(ctx, a * z * (1 - hide));
    const sy = SCR.y + SCR.h * (1 - 12 / V.crt.TH);
    ctx.setLineDash([6, 5]);
    ctx.strokeRect(SCR.x + 4, sy, SCR.w - 8, SCR.h * (12 / V.crt.TH) - 4);
    ctx.setLineDash([]);

    const ta = s.ramp('turns', 0, 0.6);
    const ly = 300, lh = 32, fw = 96;
    const off = V.mod(s.t * 60, fw * 2);
    V.alpha(ctx, a * ta);
    F.lab(ctx, 'Which head is reading', bx, ly - 24, { size: 17, color: C.ink });
    for (let r = 0; r < 2; r++) {
      const y = ly + r * (lh + 14);
      V.text(ctx, r ? 'B' : 'A', bx, y + 24, { size: 20, weight: 500, color: r ? C.b : C.a });
      ctx.save();
      ctx.beginPath();
      ctx.rect(bx + 28, y, bw - 28, lh);
      ctx.clip();
      ctx.fillStyle = C.panel;
      ctx.fillRect(bx + 28, y, bw - 28, lh);
      ctx.fillStyle = r ? C.b : C.a;
      for (let x = bx + 28 - off + r * fw; x < bx + bw; x += fw * 2) ctx.fillRect(x, y + 4, fw - 3, lh - 8);
      ctx.restore();
    }
    V.text(ctx, 'Each block = one field, 1/60 s', bx, ly + 2 * (lh + 14) + 18, { fam: 'body', size: 18, color: C.mute });
    // who shows the glitch
    const ra = s.ramp('rip', 0.2, 0.6);
    const ba = hide;
    if (ba > 0.02) {
      V.alpha(ctx, ba);
      F.lab(ctx, 'Old TV: hidden under the bezel', SCR.x + SCR.w / 2, SCR.y + SCR.h + 74, { align: 'center', size: 16, color: C.ink });
    }
    if (ra > 0) {
      V.alpha(ctx, ra);
      F.lab(ctx, 'Digitized: the whole frame shows', SCR.x + SCR.w / 2, SCR.y + SCR.h + 74, { align: 'center', size: 16, color: C.a });
    }
  }

  function spectrum(ctx, s) {
    const a = V.ramp(s.lt, 0.3, 0.6);
    const x0 = PX + 24, x1 = W - 70, base = 400, topY = 150;
    const xOf = (mhz) => x0 + (mhz / 6) * (x1 - x0);
    V.alpha(ctx, a);
    F.lab(ctx, 'What goes on the tape (NTSC)', PX, 70, { color: C.ink, size: 17 });
    ctx.strokeStyle = C.faint;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, base);
    ctx.lineTo(x1, base);
    ctx.stroke();
    for (let f = 0; f <= 6; f++) V.text(ctx, String(f), xOf(f), base + 24, { size: 16, color: C.mute, align: 'center' });
    V.text(ctx, 'MHz', x1, base + 48, { size: 16, color: C.mute, align: 'right' });

    const grow = V.ramp(s.lt, 0.5, 1.2);
    const mv = V.ease(V.clamp(s.since('under', 0.3) / 1.8));
    const fc = V.lerp(3.58, 0.629, mv);
    const wdt = V.lerp(0.28, 0.17, mv);
    const luma = (f) => {
      if (f < 1.2) return 0;
      const core = f >= 3.4 && f <= 4.4 ? 1 : Math.exp(-Math.pow((f < 3.4 ? 3.4 - f : f - 4.4) / 0.9, 2));
      return core * 0.72;
    };
    const chroma = (f) => Math.exp(-Math.pow((f - fc) / wdt, 2)) * 0.6;
    const shape = (fn, fill) => {
      ctx.beginPath();
      ctx.moveTo(x0, base);
      for (let f = 0; f <= 6; f += 0.02) ctx.lineTo(xOf(f), base - fn(f) * (base - topY) * grow);
      ctx.lineTo(x1, base);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    };
    V.alpha(ctx, a * 0.85);
    shape(luma, 'rgba(239,232,221,.55)');
    const cg = ctx.createLinearGradient(xOf(fc - 0.45), 0, xOf(fc + 0.45), 0);
    cg.addColorStop(0, '#e05aa8');
    cg.addColorStop(0.5, '#46c9e8');
    cg.addColorStop(1, '#ffd23b');
    shape(chroma, cg);
    V.alpha(ctx, a);
    ctx.strokeStyle = C.a;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xOf(3.58), base);
    ctx.lineTo(xOf(3.58), topY - 8);
    ctx.stroke();
    ctx.setLineDash([]);
    V.text(ctx, 'broadcast colour 3.58', xOf(3.58) - 10, topY + 4, { size: 15, color: C.a, align: 'right' });
    V.alpha(ctx, a * V.clamp(1 - mv * 3));
    V.text(ctx, 'COLOUR', xOf(fc), base - 154, { size: 17, weight: 500, color: C.ink, align: 'center' });
    V.alpha(ctx, a * V.clamp((mv - 0.7) / 0.3));
    V.text(ctx, 'COLOUR · 629 kHz', xOf(0.63) + 18, base - 150, { size: 17, weight: 500, color: C.ink });
    V.text(ctx, 'squeezed underneath', xOf(0.63) + 18, base - 128, { size: 15, color: C.mute });
    V.alpha(ctx, a * grow);
    V.text(ctx, 'BRIGHTNESS (FM)', xOf(4.3), topY + 44, { size: 17, weight: 500, color: C.ink, align: 'center' });
    V.text(ctx, '3.4–4.4 MHz', xOf(4.3), topY + 66, { size: 15, color: C.mute, align: 'center' });
    V.alpha(ctx, a * s.ramp('smear', 0, 0.6));
    V.text(ctx, 'Colour gets ~½ MHz of room → smear', PX, 480, { fam: 'body', size: 20, color: C.ink });
  }

  function hifi(ctx, s) {
    const a = V.ramp(s.lt, 0.3, 0.6);
    const x0 = PX, x1 = W - 64, top = 176, mid = 236, bot = 356;
    const wDeep = V.ease(V.clamp(s.since('deep', 0.2) / 2.2));
    const wTop = V.ease(V.clamp(s.since('top', 0.2) / 2.2));
    V.alpha(ctx, a);
    F.lab(ctx, 'One strip of coating, cut open', x0, 70, { color: C.ink, size: 17 });
    ctx.fillStyle = C.coat;
    ctx.fillRect(x0, top, x1 - x0, bot - top);
    ctx.fillStyle = '#27303b';
    ctx.fillRect(x0, bot, x1 - x0, 44);
    V.text(ctx, 'base', x0 + 10, bot + 29, { size: 15, color: C.mute });
    const hatch = (y0, y1, angDeg, col, w) => {
      if (w <= 0) return;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y0, (x1 - x0) * w, y1 - y0);
      ctx.clip();
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      const dx = Math.tan((angDeg * Math.PI) / 180) * (y1 - y0);
      for (let x = x0 - 80; x < x1 + 80; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x + dx, y0);
        ctx.stroke();
      }
      ctx.restore();
    };
    hatch(top, bot, 30, 'rgba(142,162,187,.75)', wDeep);
    ctx.fillStyle = C.coat;
    ctx.fillRect(x0, top, (x1 - x0) * wTop, mid - top);
    hatch(top, mid, 6, 'rgba(243,184,112,.9)', wTop);
    const headAt = (x, lbl, col) => {
      ctx.fillStyle = V.chrome(ctx, x - 22, 0, x + 22, 0);
      V.rr(ctx, x - 22, top - 36, 44, 32, 5);
      ctx.fill();
      V.text(ctx, lbl, V.clamp(x, x0 + 90, x1 - 90), top - 48, { size: 16, color: col, align: 'center', weight: 500 });
    };
    if (wDeep > 0 && wDeep < 1) headAt(x0 + (x1 - x0) * wDeep, 'HI-FI HEAD ±30°', C.south);
    if (wTop > 0 && wTop < 1) headAt(x0 + (x1 - x0) * wTop, 'VIDEO HEAD ±6°', C.north);
    V.alpha(ctx, a * V.clamp(wTop));
    V.text(ctx, 'Picture · shallow', x0, 440, { size: 18, weight: 500, color: C.north });
    V.text(ctx, 'high-frequency FM stays near the surface', x0, 464, { fam: 'body', size: 17, color: C.mute });
    V.alpha(ctx, a * V.clamp(wDeep));
    V.text(ctx, 'Hi-Fi sound · deep', x0, 494, { size: 18, weight: 500, color: C.south });
    V.text(ctx, 'lower-frequency FM soaks in further', x0, 518, { fam: 'body', size: 17, color: C.mute });
    // both recordings in one strip, one beneath the other
    const la = s.ramp('layers', 0, 0.6);
    if (la > 0) {
      V.alpha(ctx, a * la);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1 + 12, top);
      ctx.lineTo(x1 + 20, top);
      ctx.lineTo(x1 + 20, bot);
      ctx.lineTo(x1 + 12, bot);
      ctx.stroke();
      F.lab(ctx, 'Same strip · two recordings', x1, 150, { size: 17, color: C.ink, align: 'right' });
    }
    // the drum gets two more heads
    const ha = s.ramp('heads', 0, 0.6) * (1 - s.ramp('deep', 1.0, 0.4));
    if (ha > 0) {
      const cx = W - 124, cy = 96, r = 40;
      V.alpha(ctx, a * ha);
      const g = ctx.createRadialGradient(cx - 14, cy - 16, 4, cx, cy, r);
      g.addColorStop(0, '#f2f3f5');
      g.addColorStop(1, '#6d7079');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.fill();
      const th = -s.t * 2;
      const heads = [[0, C.a, 1], [Math.PI, C.b, 1], [Math.PI / 2, '#b79cff', ha], [-Math.PI / 2, '#b79cff', ha]];
      for (const [o, col, al] of heads) {
        V.alpha(ctx, a * al);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(th + o);
        ctx.fillStyle = col;
        ctx.fillRect(r - 9, -5, 12, 10);
        ctx.restore();
      }
      V.alpha(ctx, a * ha);
      F.lab(ctx, '+2 Hi-Fi heads', cx - r - 16, cy + 6, { size: 16, align: 'right', color: '#cdb8ff' });
    }
  }

  const common = (ctx, s, o = {}) => {
    const m = model(s);
    tvSet(ctx, s, m, o);
    tapeMap(ctx, s, m, o);
    return m;
  };

  F.scenes['tracking.servo'] = (ctx, s) => {
    common(ctx, s, { hs: 0.35, smear: 0, pulseGlow: s.ramp('pulses', 0, 0.5) * (1 - s.ramp('servo', 1.5, 1)) });
    servoPanel(ctx, s);
  };
  F.scenes['tracking.drift'] = (ctx, s) => {
    const m = common(ctx, s, { hs: 0.35, smear: 0 });
    profile(ctx, s, m);
  };
  F.scenes['tracking.headswitch'] = (ctx, s) => {
    const over = s.ramp('bezel', 0.1, 0.8) * (1 - s.ramp('rip', 0, 0.8));
    common(ctx, s, { hs: 1, smear: 0, overscan: over, noClock: true });
    headSwitch(ctx, s);
  };
  F.scenes['tracking.colour'] = (ctx, s) => {
    common(ctx, s, { hs: 0.35, smear: s.ramp('smear', 0, 1.6) });
    spectrum(ctx, s);
  };
  F.scenes['tracking.hifi'] = (ctx, s) => {
    common(ctx, s, { hs: 0.35, smear: 1, hifi: true });
    hifi(ctx, s);
  };
})();
