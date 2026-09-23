/* Slide 3 · Tracking: control track and servo, mistracking noise bars
   (with a live TRACKING control), head switching, colour-under, Hi-Fi. */
(function () {
  const V = window.VHS;
  const C = V.C;
  const TAU = Math.PI * 2;
  const GREEN = '#7fe0a8';
  const RED = '#e06a52';
  const SCR = { x: 72, y: 70, w: 456, h: 342 };

  // ── tracking model ─────────────────────────────────
  // e(y): how far the head sits from the centre of its own track, in track
  // pitches, at fraction y down the picture. Another deck's tape starts
  // offset (E_BAD) and at a slightly different angle (SLOPE).
  const E_BAD = 0.5, SLOPE = 0.5;
  const knob = document.getElementById('tracking-knob');
  let touched = false;
  let lastChange = -1e9;
  let curStep = 0;
  knob.addEventListener('input', () => {
    touched = true;
    lastChange = performance.now();
  });
  const knobVal = () => +knob.value / 100;
  const setKnob = (v) => {
    const nv = String(Math.round(v * 100));
    if (knob.value !== nv) {
      knob.value = nv;
      lastChange = performance.now();
    }
  };

  function model(step, t, st) {
    if (step === 0) return { e0: 0, k: 0 };
    if (step === 1 && curStep === 1 && !touched) setKnob(E_BAD * V.smooth(3.5, 8, st));
    const wob = step === 1 ? 0.08 * Math.sin(t * 1.3) : 0.03 * Math.sin(t * 0.7);
    return { e0: E_BAD + wob - knobVal(), k: SLOPE };
  }
  const offsetAt = (m, y) => m.e0 + m.k * (y - 0.5);
  const wrapD = (e) => V.mod(e + 1, 2) - 1;
  const noiseAt = (m, y) => V.smooth(0.35, 0.6, Math.abs(wrapD(offsetAt(m, y))));

  // ── the TV set ─────────────────────────────────────
  function tvSet(ctx, t, step, m, a) {
    V.alpha(ctx, a);
    const g = ctx.createLinearGradient(0, 40, 0, 470);
    g.addColorStop(0, '#2a272c');
    g.addColorStop(1, '#171518');
    ctx.fillStyle = g;
    V.rr(ctx, 40, 40, 520, 430, 30);
    ctx.fill();
    ctx.strokeStyle = '#3a363d';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#050505';
    V.rr(ctx, SCR.x - 8, SCR.y - 8, SCR.w + 16, SCR.h + 16, 32);
    ctx.fill();
    V.tv.draw(ctx, SCR.x, SCR.y, SCR.w, SCR.h, {
      t,
      noise: (y) => noiseAt(m, y),
      hs: step === 2 ? 1 : 0.35,
      smear: step >= 3,
    });
    V.alpha(ctx, a);
    ctx.fillStyle = '#3a363d';
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      ctx.arc(94 + i * 12, 446, 2.5, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#e04a3a';
    ctx.beginPath();
    ctx.arc(520, 446, 4, 0, TAU);
    ctx.fill();
    V.text(ctx, 'CH 3', 500, 452, { fam: 'osd', size: 20, color: C.mute, align: 'right' });

    // on-screen display, VCR style
    const osd = (s, x, y, al = 'left') => {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.8)';
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      V.text(ctx, s, x, y, { fam: 'osd', size: 30, color: C.osd, align: al });
      ctx.restore();
    };
    V.alpha(ctx, a);
    osd('PLAY ▶', SCR.x + 26, SCR.y + 40);
    osd(step === 4 ? 'SP  HI-FI' : 'SP', SCR.x + SCR.w - 26, SCR.y + 40, 'right');
    const secs = Math.floor(t) % 3600;
    const clock = `0:${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
    if (performance.now() - lastChange < 2600 && step > 0) {
      const v = knobVal();
      const blocks = 13;
      const pos = Math.round(((v + 1) / 2) * (blocks - 1));
      let bar = '';
      for (let i = 0; i < blocks; i++) bar += i === pos ? '█' : '▬';
      osd('TRACKING', SCR.x + SCR.w / 2, SCR.y + SCR.h - 58, 'center');
      osd(bar, SCR.x + SCR.w / 2, SCR.y + SCR.h - 28, 'center');
    } else if (step !== 2) {
      osd(clock, SCR.x + SCR.w - 26, SCR.y + SCR.h - 26, 'right');
    }
  }

  // ── bottom: the tape and the head's actual path ────
  function tapeMap(ctx, t, m, a) {
    const top = 522, bot = 652, aB = 532, cT = 642, vh = cT - aB;
    const ang = (14 * Math.PI) / 180;
    const L = vh / Math.tan(ang);
    const p = 30, X0 = 60;
    V.alpha(ctx, a);
    V.label(ctx, 'The tape, unrolled · white = where the head actually runs', 40, top - 14, { size: 15, color: C.ink });
    ctx.fillStyle = '#5e381f';
    ctx.fillRect(40, top, 920, bot - top);
    ctx.fillStyle = '#4e2e1a';
    ctx.fillRect(40, top, 920, aB - top);
    ctx.fillRect(40, cT, 920, bot - cT);
    ctx.save();
    ctx.beginPath();
    ctx.rect(40, aB, 920, vh);
    ctx.clip();
    for (let j = -16; j < 30; j++) {
      const x = X0 + j * p;
      V.alpha(ctx, a * 0.3);
      ctx.fillStyle = j % 2 ? C.b : C.a;
      ctx.beginPath();
      ctx.moveTo(x, cT);
      ctx.lineTo(x + p, cT);
      ctx.lineTo(x + p + L, aB);
      ctx.lineTo(x + L, aB);
      ctx.closePath();
      ctx.fill();
    }
    // head path for the field on track 6, following e(y)
    const j0 = 6;
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const f = i / 40;
      const cx = X0 + (j0 + 0.5 + offsetAt(m, f)) * p + f * L;
      pts.push([cx, cT - f * vh, noiseAt(m, f)]);
    }
    V.alpha(ctx, a * 0.5);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x - p / 2, y) : ctx.moveTo(x - p / 2, y)));
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0] + p / 2, pts[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 3;
    for (let i = 1; i < pts.length; i++) {
      V.alpha(ctx, a);
      ctx.strokeStyle = pts[i][2] > 0.5 ? RED : GREEN;
      ctx.beginPath();
      ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
      ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }
    ctx.restore();
    const f = V.mod(t / 1.4, 1);
    const hx = X0 + (j0 + 0.5 + offsetAt(m, f)) * p + f * L;
    V.alpha(ctx, a);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(hx, cT - f * vh, 6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,228,196,.75)';
    for (let j = -16; j < 30; j += 2) {
      const x = X0 + j * p;
      if (x > 40 && x < 960) ctx.fillRect(x, cT + 3, 4, 7);
    }
    V.label(ctx, 'Control pulses along the bottom edge', 40, bot + 24, { size: 14 });
    // matching scan position on the TV
    V.alpha(ctx, a * 0.5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(SCR.x, SCR.y + f * SCR.h, SCR.w, 1.5);
  }

  // ── right panel, per step ──────────────────────────
  function servo(ctx, t, st) {
    const a = V.ramp(st, 0.3, 0.6);
    V.alpha(ctx, a);
    V.label(ctx, 'Servo: tape pulses vs drum', 600, 76, { color: C.ink });
    const lanes = [
      { y: 150, name: 'Control track (from tape)', col: C.oxideHi },
      { y: 260, name: 'Drum position (tachometer)', col: C.a },
    ];
    const per = 110, off = V.mod(t * 55, per);
    for (const l of lanes) {
      V.label(ctx, l.name, 600, l.y - 38, { size: 14 });
      ctx.strokeStyle = l.col;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(600, l.y);
      for (let x = 600 - off; x < 960; x += per) {
        const x1 = Math.max(600, x), x2 = Math.min(960, x + 18);
        if (x2 <= 600) continue;
        ctx.lineTo(x1, l.y);
        ctx.lineTo(x1, l.y - 26);
        ctx.lineTo(x2, l.y - 26);
        ctx.lineTo(x2, l.y);
      }
      ctx.lineTo(960, l.y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(239,232,221,.35)';
    ctx.setLineDash([3, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 600 - off; x < 960; x += per) {
      if (x < 600) continue;
      ctx.moveTo(x, 150);
      ctx.lineTo(x, 234);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    const on = 0.6 + 0.4 * Math.sin(t * 4);
    ctx.fillStyle = GREEN;
    V.alpha(ctx, a * on);
    ctx.beginPath();
    ctx.arc(612, 336, 8, 0, TAU);
    ctx.fill();
    V.alpha(ctx, a);
    V.text(ctx, 'LOCKED', 630, 344, { fam: 'osd', size: 30, color: GREEN });
    V.text(ctx, 'Edges line up → each head lands on its own stripe', 600, 392, { fam: 'body', size: 16, color: C.mute });
    V.text(ctx, '30 pulses a second, one per frame', 600, 416, { fam: 'body', size: 16, color: C.mute });
  }

  function profile(ctx, m, st) {
    const a = V.ramp(st, 0.3, 0.6);
    const x0 = 610, x1 = 950, y0 = SCR.y, y1 = SCR.y + SCR.h;
    V.alpha(ctx, a);
    V.label(ctx, 'Signal down the picture', 600, 52, { color: C.ink, size: 15 });
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
    V.text(ctx, '■ clean picture', x0, y1 + 22, { size: 14, color: GREEN });
    V.text(ctx, '■ snow', x1, y1 + 22, { size: 14, color: RED, align: 'right' });
    const off = m.e0;
    V.text(ctx, `HEAD OFFSET ${off >= 0 ? '+' : '−'}${Math.abs(off).toFixed(2)} TRACK`, 600, 466, { fam: 'osd', size: 26, color: C.ink });
    V.text(ctx, `≈ ${Math.round(Math.abs(off) * 58)} µm off centre at mid-picture`, 600, 492, { size: 14, color: C.mute });
  }

  function headSwitch(ctx, t, st) {
    const a = V.ramp(st, 0.3, 0.6);
    const bx = 600, by = 70, bw = 360, bh = 150;
    V.alpha(ctx, a);
    V.label(ctx, 'Bottom of the frame, magnified', bx, by - 14, { color: C.ink, size: 15 });
    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, by, bw, bh);
    ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(V.tv.canvas, 0, V.tv.TH - 12, V.tv.TW, 12, bx, by, bw, bh);
    ctx.restore();
    ctx.strokeStyle = C.a;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
    // outline the same strip on the TV
    const sy = SCR.y + SCR.h * (1 - 12 / V.tv.TH);
    ctx.setLineDash([6, 5]);
    ctx.strokeRect(SCR.x + 4, sy, SCR.w - 8, SCR.h * (12 / V.tv.TH) - 4);
    ctx.setLineDash([]);

    const ly = 290, lh = 30, fw = 90;
    const off = V.mod(t * 60, fw * 2);
    V.label(ctx, 'Which head is reading', bx, ly - 22, { size: 15, color: C.ink });
    for (let r = 0; r < 2; r++) {
      const y = ly + r * (lh + 14);
      V.text(ctx, r ? 'B' : 'A', bx, y + 22, { size: 18, weight: 500, color: r ? C.b : C.a });
      ctx.save();
      ctx.beginPath();
      ctx.rect(bx + 24, y, bw - 24, lh);
      ctx.clip();
      ctx.fillStyle = C.panel;
      ctx.fillRect(bx + 24, y, bw - 24, lh);
      ctx.fillStyle = r ? C.b : C.a;
      for (let x = bx + 24 - off + r * fw; x < bx + bw; x += fw * 2) ctx.fillRect(x, y + 4, fw - 3, lh - 8);
      ctx.restore();
    }
    V.text(ctx, 'Each block = one field, 1/60 s', bx, ly + 2 * (lh + 14) + 14, { fam: 'body', size: 16, color: C.mute });
    V.text(ctx, 'Every handoff lands at the bottom', bx, ly + 2 * (lh + 14) + 38, { fam: 'body', size: 16, color: C.mute });
  }

  function spectrum(ctx, st) {
    const a = V.ramp(st, 0.3, 0.6);
    const x0 = 612, x1 = 950, base = 400, topY = 150;
    const xOf = (mhz) => x0 + (mhz / 6) * (x1 - x0);
    V.alpha(ctx, a);
    V.label(ctx, 'What goes on the tape (NTSC)', 600, 70, { color: C.ink, size: 15 });
    ctx.strokeStyle = C.faint;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, base);
    ctx.lineTo(x1, base);
    ctx.stroke();
    for (let f = 0; f <= 6; f++) V.text(ctx, String(f), xOf(f), base + 22, { size: 14, color: C.mute, align: 'center' });
    V.text(ctx, 'MHz', x1, base + 44, { size: 14, color: C.mute, align: 'right' });

    const grow = V.ramp(st, 0.6, 1.2);
    const luma = (f) => {
      if (f < 1.2) return 0;
      const core = f >= 3.4 && f <= 4.4 ? 1 : Math.exp(-Math.pow((f < 3.4 ? 3.4 - f : f - 4.4) / 0.9, 2));
      return core * 0.72;
    };
    const chroma = (f) => Math.exp(-Math.pow((f - 0.629) / 0.17, 2)) * 0.6;
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
    const cg = ctx.createLinearGradient(xOf(0.2), 0, xOf(1.1), 0);
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
    V.text(ctx, 'broadcast colour: 3.58', xOf(3.58) - 8, topY + 70, { size: 13, color: C.a, align: 'right' });
    const la = V.ramp(st, 1.6, 0.5);
    V.alpha(ctx, a * la);
    V.text(ctx, 'COLOUR', xOf(0.63) + 16, base - 148, { size: 15, weight: 500, color: C.ink });
    V.text(ctx, '629 kHz', xOf(0.63) + 16, base - 128, { size: 14, color: C.mute });
    V.text(ctx, 'BRIGHTNESS (FM)', xOf(3.9), topY + 10, { size: 15, weight: 500, color: C.ink, align: 'center' });
    V.text(ctx, '3.4–4.4 MHz', xOf(3.9), topY + 30, { size: 14, color: C.mute, align: 'center' });
    V.text(ctx, 'Colour gets ~0.5 MHz of room → smear', 600, 470, { fam: 'body', size: 16, color: C.mute });
  }

  function hifi(ctx, t, st) {
    const a = V.ramp(st, 0.3, 0.6);
    const x0 = 600, x1 = 960, top = 140, mid = 200, bot = 330;
    const cyc = V.mod(st, 8);
    const wDeep = V.clamp(cyc / 2.4);
    const wTop = V.clamp((cyc - 3) / 2.4);
    V.alpha(ctx, a);
    V.label(ctx, 'One strip of coating, cut open', x0, 70, { color: C.ink, size: 15 });
    ctx.fillStyle = C.coat;
    ctx.fillRect(x0, top, x1 - x0, bot - top);
    ctx.fillStyle = '#27303b';
    ctx.fillRect(x0, bot, x1 - x0, 44);
    V.text(ctx, 'base', x0 + 10, bot + 28, { size: 14, color: C.mute });
    const hatch = (y0, y1, angDeg, col, w) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y0, (x1 - x0) * w, y1 - y0);
      ctx.clip();
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      const dx = Math.tan((angDeg * Math.PI) / 180) * (y1 - y0);
      for (let x = x0 - 60; x < x1 + 60; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x + dx, y0);
        ctx.stroke();
      }
      ctx.restore();
    };
    hatch(top, bot, 30, 'rgba(142,162,187,.7)', wDeep);
    ctx.fillStyle = C.coat;
    ctx.fillRect(x0, top, (x1 - x0) * wTop, mid - top);
    hatch(top, mid, 6, 'rgba(243,184,112,.85)', wTop);
    const headAt = (x, y, lbl, col) => {
      ctx.fillStyle = V.chrome(ctx, x - 20, 0, x + 20, 0);
      V.rr(ctx, x - 20, y - 34, 40, 30, 5);
      ctx.fill();
      V.text(ctx, lbl, x, y - 44, { size: 14, color: col, align: 'center', weight: 500 });
    };
    if (cyc < 2.6) headAt(x0 + (x1 - x0) * wDeep, top, 'HI-FI HEAD ±30°', C.south);
    else if (cyc > 2.8 && cyc < 5.6) headAt(x0 + (x1 - x0) * wTop, top, 'VIDEO HEAD ±6°', C.north);
    const la = V.ramp(st, 1.2, 0.5);
    V.alpha(ctx, a * la);
    V.text(ctx, 'Video · shallow', x0, 402, { size: 15, weight: 500, color: C.north });
    V.text(ctx, 'high-frequency FM stays near the surface', x0, 424, { fam: 'body', size: 15, color: C.mute });
    V.text(ctx, 'Hi-Fi audio · deep', x0, 452, { size: 15, weight: 500, color: C.south });
    V.text(ctx, '1.3 & 1.7 MHz FM soaks in further', x0, 474, { fam: 'body', size: 15, color: C.mute });
  }

  V.scenes.tracking = {
    onStep(step) {
      curStep = step;
      if (!touched) setKnob(step >= 2 ? E_BAD : 0);
    },
    draw(ctx, { t, step, st }) {
      const m = model(step, t, st);
      tvSet(ctx, t, step, m, 1);
      tapeMap(ctx, t, m, 1);
      if (step === 0) servo(ctx, t, st);
      else if (step === 1) profile(ctx, m, st);
      else if (step === 2) headSwitch(ctx, t, st);
      else if (step === 3) spectrum(ctx, st);
      else hifi(ctx, t, st);
    },
  };
})();
