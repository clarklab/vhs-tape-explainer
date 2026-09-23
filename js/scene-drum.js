/* Slide 2 · The drum: why the heads spin, the VCR's tape path, the tilt,
   the diagonal track map, and azimuth recording. */
(function () {
  const V = window.VHS;
  const C = V.C;
  const TAU = Math.PI * 2;
  const headCol = (k) => (k % 2 ? C.b : C.a);

  /* ── step 0 · a fixed head would need 5.8 m/s ──────── */
  function problem(ctx, t, st) {
    const f = V.mod(st, 42) / 42;
    const rs = V.lerp(92, 26, f);
    const rt = Math.sqrt(92 * 92 + 26 * 26 - rs * rs);
    const S = [150, 200], T = [850, 200], ty = 96;
    V.alpha(ctx, V.ramp(st, 0, 0.6));
    for (const [c, r] of [[S, rs], [T, rt]]) {
      ctx.fillStyle = C.oxide;
      ctx.beginPath();
      ctx.arc(c[0], c[1], r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ddd7ce';
      ctx.beginPath();
      ctx.arc(c[0], c[1], 22, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = C.oxide;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(S[0], S[1] - rs);
    ctx.lineTo(250, ty);
    ctx.lineTo(750, ty);
    ctx.lineTo(T[0], T[1] - rt);
    ctx.stroke();
    ctx.setLineDash([26, 40]);
    ctx.lineDashOffset = -t * 1600;
    ctx.strokeStyle = 'rgba(255,215,170,.55)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = V.chrome(ctx, 470, 0, 530, 0);
    V.rr(ctx, 472, ty + 5, 56, 52, 6);
    ctx.fill();
    ctx.fillStyle = C.stage;
    ctx.fillRect(499, ty + 5, 2, 18);
    V.label(ctx, 'fixed head', 500, ty + 82, { align: 'center' });

    const a2 = V.ramp(st, 0.5, 0.6);
    V.alpha(ctx, a2);
    V.label(ctx, 'T-120 at 5.8 m/s · time left', 500, 222, { align: 'center', color: C.ink });
    const left = Math.max(0, Math.ceil(42 * (1 - f)));
    V.text(ctx, `0:${String(left).padStart(2, '0')}`, 500, 300, { fam: 'osd', size: 84, color: C.a, align: 'center' });

    // speed ladder on a log axis (mm/s)
    const x0 = 110, x1 = 910;
    const xOf = (v) => x0 + ((Math.log10(v) - 1) / 3) * (x1 - x0);
    const rows = [
      { v: 11.12, name: 'VHS tape, EP mode', val: '11 mm/s' },
      { v: 33.35, name: 'VHS tape, SP mode', val: '33 mm/s' },
      { v: 47.6, name: 'Audio cassette', val: '48 mm/s' },
      { v: 5800, name: 'What video needs', val: '5,800 mm/s', hot: true },
    ];
    const a3 = V.ramp(st, 0.9, 0.6);
    V.alpha(ctx, a3);
    V.label(ctx, 'Speed past the head · mm/s, log scale', x0, 372, { color: C.ink });
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const v of [10, 100, 1000, 10000]) {
      ctx.moveTo(xOf(v), 390);
      ctx.lineTo(xOf(v), 628);
    }
    ctx.stroke();
    ctx.strokeStyle = C.faint;
    ctx.beginPath();
    ctx.moveTo(x0, 628);
    ctx.lineTo(x1, 628);
    ctx.stroke();
    [[10, '10'], [100, '100'], [1000, '1,000'], [10000, '10,000']].forEach(([v, s]) =>
      V.text(ctx, s, xOf(v), 654, { size: 16, color: C.mute, align: 'center' })
    );
    rows.forEach((r, i) => {
      const y = 432 + i * 52;
      const g = V.ramp(st, 1.1 + i * 0.3, 0.9);
      const xe = V.lerp(x0, xOf(r.v), g);
      V.alpha(ctx, a3 * V.ramp(st, 1.1 + i * 0.3, 0.3));
      ctx.strokeStyle = r.hot ? C.a : C.oxideHi;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(xe, y);
      ctx.stroke();
      ctx.fillStyle = r.hot ? C.a : C.oxideHi;
      ctx.beginPath();
      ctx.arc(xe, y, 7, 0, TAU);
      ctx.fill();
      V.text(ctx, r.name, x0, y - 13, { size: 17, color: r.hot ? C.ink : C.mute, fam: 'body', weight: r.hot ? 600 : 400 });
      V.text(ctx, r.val, xe + (r.hot ? -14 : 16), y + (r.hot ? -13 : 6), { size: 16, color: r.hot ? C.a : C.ink, align: r.hot ? 'right' : 'left' });
    });
  }

  /* ── step 1 · the VCR from above ───────────────────── */
  const D = [500, 250], R = 118;
  function drumTop(ctx, t, a) {
    V.alpha(ctx, a);
    const g = ctx.createRadialGradient(D[0] - 40, D[1] - 50, 10, D[0], D[1], R);
    g.addColorStop(0, '#f2f3f5');
    g.addColorStop(0.55, '#b9bcc4');
    g.addColorStop(1, '#6d7079');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(D[0], D[1], R, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,42,48,.25)';
    ctx.lineWidth = 1;
    for (let rr = 24; rr < R; rr += 14) {
      ctx.beginPath();
      ctx.arc(D[0], D[1], rr, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = '#5b5e66';
    ctx.beginPath();
    ctx.arc(D[0], D[1], 16, 0, TAU);
    ctx.fill();
    const th = t * TAU * 0.5;
    for (let k = 0; k < 2; k++) {
      const an = th + k * Math.PI;
      const contact = Math.sin(an) < 0;
      if (contact) {
        ctx.strokeStyle = headCol(k);
        ctx.lineWidth = 5;
        V.alpha(ctx, a * 0.5);
        ctx.beginPath();
        ctx.arc(D[0], D[1], R + 1, an - 0.7, an);
        ctx.stroke();
      }
      V.alpha(ctx, a);
      ctx.save();
      ctx.translate(D[0], D[1]);
      ctx.rotate(an);
      ctx.fillStyle = headCol(k);
      ctx.fillRect(R - 12, -6, 16, 12);
      ctx.restore();
    }
  }

  function vcrTop(ctx, t, st) {
    const S = [325, 610], SR = 105, T = [675, 610], TR = 58;
    const a = V.ramp(st, 0, 0.6);
    V.alpha(ctx, a);
    ctx.strokeStyle = C.faint;
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.5;
    V.rr(ctx, 138, 470, 724, 400, 16);
    ctx.stroke();
    ctx.setLineDash([]);
    V.label(ctx, 'cassette', 500, 700, { align: 'center', size: 15 });
    for (const [c, r] of [[S, SR], [T, TR]]) {
      ctx.fillStyle = C.oxide;
      ctx.beginPath();
      ctx.arc(c[0], c[1], r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ddd7ce';
      ctx.beginPath();
      ctx.arc(c[0], c[1], 26, 0, TAU);
      ctx.fill();
    }
    const G1 = [170, 480], TP = [132, 372], FE = [232, 322], P2 = [372, 372];
    const P3 = [628, 372], AC = [768, 322], CAP = [868, 372], G2 = [830, 480];
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(S[0] - SR, S[1]);
    for (const p of [G1, TP, FE, P2]) ctx.lineTo(p[0], p[1]);
    ctx.arc(D[0], D[1], R + 4, Math.PI, TAU);
    for (const p of [P3, AC, CAP, G2]) ctx.lineTo(p[0], p[1]);
    ctx.lineTo(T[0] + TR, T[1]);
    ctx.strokeStyle = C.oxide;
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.setLineDash([3, 14]);
    ctx.lineDashOffset = -t * 14;
    ctx.strokeStyle = 'rgba(255,215,170,.4)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = V.chrome(ctx, 100, 0, 900, 0);
    for (const p of [G1, TP, P2, P3, G2, CAP]) {
      ctx.beginPath();
      ctx.arc(p[0], p[1], 8, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#1b1a1d';
    ctx.beginPath();
    ctx.arc(CAP[0] + 22, CAP[1] - 16, 17, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = C.chromeMid;
    ctx.lineWidth = 2;
    ctx.stroke();
    for (const [p, ang] of [[FE, -0.46], [AC, 0.46]]) {
      ctx.save();
      ctx.translate(p[0], p[1]);
      ctx.rotate(ang);
      ctx.fillStyle = '#6d7079';
      ctx.fillRect(-14, -20, 28, 14);
      ctx.restore();
    }

    drumTop(ctx, t, a);
    V.alpha(ctx, a);
    V.label(ctx, 'tape wraps ≈180°', D[0], D[1] - R - 22, { align: 'center', size: 15 });
    ctx.fillStyle = C.a;
    ctx.fillRect(40, 44, 14, 10);
    V.label(ctx, 'Head A', 62, 55, { size: 15, color: C.ink });
    ctx.fillStyle = C.b;
    ctx.fillRect(140, 44, 14, 10);
    V.label(ctx, 'Head B', 162, 55, { size: 15, color: C.ink });

    const calls = [
      { from: [D[0] - 46, D[1] - 36], to: [330, 100], text: 'Upper drum', sub: 'spins 1,800 rpm', align: 'right' },
      { from: FE, to: [210, 196], text: 'Full-erase head', sub: 'wipes before recording', align: 'right' },
      { from: CAP, to: [960, 100], text: 'Capstan + pinch roller', sub: 'set tape speed: 33.35 mm/s', align: 'right' },
      { from: AC, to: [720, 430], text: 'Audio/control head', align: 'right' },
    ];
    calls.forEach((c, i) => V.callout(ctx, { ...c, a: V.ramp(st, 0.8 + i * 0.4, 0.5) }));
  }

  /* ── step 2 · side view: the tilt ──────────────────── */
  function tilt(ctx, t, st) {
    const cx = 500, cy = 340, RW = 180, ry = 22;
    const tau = (9 * Math.PI) / 180; // drawn 1.5× the real ≈6°
    const tTop = 304, tBot = 377;
    const a = V.ramp(st, 0, 0.6);

    V.alpha(ctx, a);
    const g = ctx.createLinearGradient(0, tTop, 0, tBot);
    g.addColorStop(0, '#80502e');
    g.addColorStop(1, '#55321c');
    ctx.fillStyle = g;
    ctx.fillRect(40, tTop, 920, tBot - tTop);
    ctx.save();
    ctx.beginPath();
    ctx.rect(40, tTop, 920, tBot - tTop);
    ctx.clip();
    ctx.translate(V.mod(t * 14, 128), 0);
    ctx.fillStyle = V.grain(ctx);
    ctx.fillRect(-88, tTop, 1060, tBot - tTop);
    ctx.restore();
    V.alpha(ctx, a);
    V.label(ctx, 'tape →', 60, tTop - 12, { color: C.ink });

    // the head's path around the back of the drum, projected
    const toWorld = (lx, ly) => [
      cx + lx * Math.cos(-tau) - ly * Math.sin(-tau),
      cy + lx * Math.sin(-tau) + ly * Math.cos(-tau),
    ];
    const period = 2.2;
    const k = Math.floor(V.mod(t / period, 2));
    const prog = V.mod(t / period, 1);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-tau);
    const body = V.chrome(ctx, -RW, 0, RW, 0);
    V.alpha(ctx, a * 0.9);
    ctx.fillStyle = body;
    ctx.fillRect(-RW, -118, RW * 2, 114);
    ctx.fillRect(-RW, 6, RW * 2, 112);
    ctx.fillStyle = '#2a2a2e';
    ctx.fillRect(-RW, -4, RW * 2, 10);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 118, RW, ry, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#e9eaee';
    ctx.beginPath();
    ctx.ellipse(0, -118, RW, ry, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#8e929b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(30,30,34,.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-RW, 0);
    ctx.lineTo(RW, 0);
    ctx.stroke();
    // rotation arrow on the lid
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -118, RW * 0.5, ry * 0.5, 0, 0.3, 2.6);
    ctx.stroke();
    ctx.fillStyle = C.ink;
    V.arrowHead(ctx, -RW * 0.5 * Math.cos(0.54), -118 + ry * 0.5 * Math.sin(2.6) + 2, Math.PI * 0.95, 9);
    ctx.restore();

    // tape seen through the drum (wrapped behind it)
    V.alpha(ctx, a * 0.35);
    ctx.fillStyle = '#6e4226';
    ctx.fillRect(cx - RW - 2, tTop, RW * 2 + 4, tBot - tTop);

    // trace: current head's path across the tape, back half of the orbit
    const trace = (upto, col, alpha) => {
      V.alpha(ctx, alpha);
      ctx.strokeStyle = col;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const n = 40;
      for (let i = 0; i <= n * upto; i++) {
        const ph = Math.PI - (i / n) * Math.PI;
        const [x, y] = toWorld(RW * Math.cos(ph), -ry * Math.sin(ph));
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    };
    trace(1, headCol(k + 1), a * 0.35 * (1 - prog));
    trace(prog, headCol(k), a);
    for (let j = 0; j < 2; j++) {
      const ph = Math.PI - prog * Math.PI - j * Math.PI;
      const back = Math.sin(ph) > 0;
      const [x, y] = toWorld(RW * Math.cos(ph), -ry * Math.sin(ph));
      V.alpha(ctx, a * (back ? 1 : 0.55));
      ctx.fillStyle = headCol(k + j);
      ctx.beginPath();
      ctx.arc(x, y, back ? 8 : 6, 0, TAU);
      ctx.fill();
    }

    // ledge on the lower drum that the tape edge rides on
    V.alpha(ctx, a * V.ramp(st, 1.6, 0.6));
    ctx.strokeStyle = '#fff4d6';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - RW + 6, tBot + 1);
    ctx.lineTo(cx + RW - 6, tBot + 1);
    ctx.stroke();

    // angle annotation: drum axis vs vertical
    const aa = V.ramp(st, 0.8, 0.6);
    V.alpha(ctx, a * aa);
    ctx.strokeStyle = C.mute;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 6]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, 110);
    const [axX, axY] = toWorld(0, -230);
    ctx.moveTo(cx, cy);
    ctx.lineTo(axX, axY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = C.a;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 214, -Math.PI / 2 - tau, -Math.PI / 2);
    ctx.stroke();
    V.text(ctx, '≈6°', cx - 30, 118, { fam: 'display', size: 30, weight: 800, stretch: 'expanded', color: C.a, align: 'right' });

    V.callout(ctx, { from: [cx + 90, 250], to: [760, 170], text: 'Upper drum', sub: 'spins, carries the heads', a: V.ramp(st, 1.2, 0.5) });
    V.callout(ctx, { from: [cx + 60, tBot + 1], to: [640, 560], text: 'Ledge on the lower drum', sub: 'steers the tape into a spiral', a: V.ramp(st, 1.6, 0.5) });
    V.callout(ctx, { from: toWorld(-60, -18), to: [300, 560], text: 'Head path', sub: 'crosses the tape diagonally', a: V.ramp(st, 2.0, 0.5), align: 'right' });
  }

  /* ── step 3 · the track map ────────────────────────── */
  function trackMap(ctx, t, st) {
    const top = 190, bot = 520, aB = top + 26, cT = bot - 20;
    const vh = cT - aB;
    const ang = (18 * Math.PI) / 180;
    const L = vh / Math.tan(ang);
    const p = 44, X0 = 60, TF = 0.9;
    const n = t / TF;
    const i = Math.floor(n);
    const f = n - i;
    const s = n * p;
    const a = V.ramp(st, 0, 0.6);
    V.alpha(ctx, a);
    ctx.fillStyle = '#5e381f';
    ctx.fillRect(40, top, 920, bot - top);
    ctx.fillStyle = '#4e2e1a';
    ctx.fillRect(40, top, 920, aB - top);
    ctx.fillRect(40, cT, 920, bot - cT);

    ctx.save();
    ctx.beginPath();
    ctx.rect(40, aB, 920, vh);
    ctx.clip();
    for (let j = i - 32; j <= i; j++) {
      const x = X0 + j * p - s;
      if (x + L + p < 40 || x > 960) continue;
      const fr = j === i ? f : 1;
      V.alpha(ctx, a * (j === i ? 0.75 : 0.3));
      ctx.fillStyle = headCol(j);
      ctx.beginPath();
      ctx.moveTo(x, cT);
      ctx.lineTo(x + p, cT);
      ctx.lineTo(x + p + fr * L, cT - fr * vh);
      ctx.lineTo(x + fr * L, cT - fr * vh);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    V.alpha(ctx, a);
    ctx.strokeStyle = 'rgba(255,228,196,.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 40; x <= 960; x += 4) {
      const y = (aB + top) / 2 + Math.sin((x + s) * 0.045) * 6 * Math.sin((x + s) * 0.007);
      x === 40 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,228,196,.7)';
    for (let j = i - 32; j <= i; j++) {
      if (V.mod(j, 2)) continue;
      const x = X0 + j * p - s;
      if (x > 40 && x < 960) ctx.fillRect(x, cT + 5, 4, 10);
    }

    const hx = X0 + i * p - s + f * L + p / 2;
    const hy = cT - f * vh;
    const hc = headCol(i);
    const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, 34);
    glow.addColorStop(0, hc);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(hx, hy, 34, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(hx, hy, 5, 0, TAU);
    ctx.fill();
    const field = V.mod(i, 2) + 1;
    V.text(ctx, `HEAD ${field === 1 ? 'A' : 'B'} · FIELD ${field}`, V.clamp(hx, 150, 850), hy - 28 < aB + 10 ? hy + 44 : hy - 28, {
      size: 16, weight: 500, color: hc, align: 'center', spacing: 1,
    });

    V.alpha(ctx, a);
    ctx.strokeStyle = C.mute;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(975, top);
    ctx.lineTo(975, bot);
    ctx.moveTo(969, top);
    ctx.lineTo(981, top);
    ctx.moveTo(969, bot);
    ctx.lineTo(981, bot);
    ctx.stroke();

    V.callout(ctx, { from: [120, (top + aB) / 2], to: [150, 120], text: 'Audio track', sub: 'fixed head, along the edge', a: V.ramp(st, 0.6, 0.5) });
    V.callout(ctx, { from: [150, (cT + bot) / 2], to: [180, 590], text: 'Control track', sub: 'one pulse per frame', a: V.ramp(st, 0.9, 0.5) });
    const ca = V.ramp(st, 0.4, 0.6);
    V.alpha(ctx, ca);
    V.label(ctx, 'Tracks written since this step began', 940, 98, { align: 'right', size: 15 });
    V.text(ctx, V.fmt(st * 59.94).padStart(7, '0'), 940, 140, { fam: 'osd', size: 46, color: C.ink, align: 'right' });
    V.label(ctx, 'at real speed · 12.65 mm tape · each track ≈97 mm', 940, 600, { align: 'right', size: 15 });
    V.label(ctx, 'A 2-hour movie: 431,568 tracks', 940, 626, { align: 'right', size: 15, color: C.ink });
  }

  /* ── step 4 · azimuth ──────────────────────────────── */
  function azimuth(ctx, t, st) {
    const x0 = 170, tw = 165, top = 150, bot = 560;
    const az = (12 * Math.PI) / 180; // drawn 2× the real ±6°
    const a = V.ramp(st, 0, 0.6);
    const scroll = t * 40;
    for (let k = 0; k < 4; k++) {
      const x = x0 + k * tw;
      const sg = k % 2 ? -1 : 1;
      V.alpha(ctx, a);
      ctx.fillStyle = k % 2 ? '#123039' : '#3a2810';
      ctx.fillRect(x, top, tw, bot - top);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, top, tw, bot - top);
      ctx.clip();
      ctx.strokeStyle = k % 2 ? 'rgba(70,201,232,.55)' : 'rgba(255,177,59,.55)';
      ctx.lineWidth = 10;
      const dy = Math.tan(az) * tw * sg;
      for (let y = top - 60 + V.mod(scroll, 24); y < bot + 60; y += 24) {
        ctx.beginPath();
        ctx.moveTo(x, y + dy / 2);
        ctx.lineTo(x + tw, y - dy / 2);
        ctx.stroke();
      }
      ctx.restore();
      V.text(ctx, k % 2 ? 'B  −6°' : 'A  +6°', x + tw / 2, top - 16, {
        size: 18, weight: 500, color: headCol(k), align: 'center', spacing: 1,
      });
    }
    V.alpha(ctx, a);
    ctx.strokeStyle = 'rgba(239,232,221,.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 1; k < 4; k++) {
      ctx.moveTo(x0 + k * tw, top);
      ctx.lineTo(x0 + k * tw, bot);
    }
    ctx.stroke();

    // head A slides between its own track and the neighbour
    const cyc = V.mod(st, 6);
    const m = cyc < 1.5 ? 0 : cyc < 2.5 ? V.ease(cyc - 1.5) : cyc < 4.5 ? 1 : 1 - V.ease(cyc - 4.5);
    const hx = x0 + m * tw;
    const hy = 330;
    V.alpha(ctx, a);
    ctx.fillStyle = 'rgba(11,10,12,.55)';
    ctx.fillRect(hx - 4, hy - 34, tw + 8, 68);
    ctx.fillStyle = V.chrome(ctx, hx, 0, hx + tw, 0);
    V.rr(ctx, hx, hy - 28, tw, 56, 6);
    ctx.fill();
    ctx.strokeStyle = C.a;
    ctx.lineWidth = 4;
    const gdy = Math.tan(az) * (tw - 16);
    ctx.beginPath();
    ctx.moveTo(hx + 8, hy + gdy / 2);
    ctx.lineTo(hx + tw - 8, hy - gdy / 2);
    ctx.stroke();
    V.text(ctx, 'HEAD A', hx + tw / 2, hy + 52, { size: 16, weight: 500, color: C.ink, align: 'center', spacing: 1 });

    const sig = (1 - m) + m * 0.06;
    const mx = 890, mt = 180, mb = 520;
    V.label(ctx, 'Signal', mx + 20, mt - 16, { align: 'center', color: C.ink, size: 15 });
    ctx.fillStyle = C.panel;
    ctx.fillRect(mx, mt, 40, mb - mt);
    const lvl = sig * (mb - mt) * (0.94 + 0.06 * Math.sin(t * 20));
    ctx.fillStyle = sig > 0.5 ? '#7fe0a8' : '#e06a52';
    ctx.fillRect(mx, mb - lvl, 40, lvl);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, mt, 40, mb - mt);

    ctx.strokeStyle = C.mute;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x0, bot + 22);
    ctx.lineTo(x0 + tw, bot + 22);
    ctx.moveTo(x0, bot + 14);
    ctx.lineTo(x0, bot + 30);
    ctx.moveTo(x0 + tw, bot + 14);
    ctx.lineTo(x0 + tw, bot + 30);
    ctx.stroke();
    V.label(ctx, '58 µm in SP', x0 + tw / 2, bot + 52, { align: 'center', color: C.ink, size: 15 });
    V.callout(ctx, { from: [x0 + 2 * tw, 470], to: [x0 + 2 * tw + 60, 612], text: 'No gap between tracks', a: V.ramp(st, 0.8, 0.5) });
    const msg = m < 0.5 ? 'Gap matches the stripes → strong signal' : 'Gap crosses the stripes → they cancel out';
    V.text(ctx, msg, 500, 92, { fam: 'body', size: 22, weight: 600, color: C.ink, align: 'center' });
  }

  V.scenes.drum = {
    draw(ctx, { t, step, st }) {
      if (step === 0) problem(ctx, t, st);
      else if (step === 1) vcrTop(ctx, t, st);
      else if (step === 2) tilt(ctx, t, st);
      else if (step === 3) trackMap(ctx, t, st);
      else azimuth(ctx, t, st);
    },
  };
})();
