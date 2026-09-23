/* Part 2 · The drum. 16:9 versions of the deck's slide-2 animations
   (js/scene-drum.js), plus the tape-threading ("M-loading") sequence. */
(function () {
  const V = window.VHS;
  const C = V.C;
  const F = V.film;
  const TAU = Math.PI * 2;
  const W = F.W;
  const headCol = (k) => (V.mod(k, 2) ? C.b : C.a);

  /* ── a fixed head would need 5.8 m/s ──────────────── */
  F.scenes['drum.problem'] = (ctx, s) => {
    const t = s.t;
    const run = Math.max(0, s.since('timer'));
    const f = V.clamp(run / 42);
    const rs = V.lerp(92, 26, f);
    const rt = Math.sqrt(92 * 92 + 26 * 26 - rs * rs);
    const S = [200, 200], T = [1080, 200], ty = 96;
    V.alpha(ctx, V.ramp(s.lt, 0, 0.6));
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
    ctx.lineTo(310, ty);
    ctx.lineTo(970, ty);
    ctx.lineTo(T[0], T[1] - rt);
    ctx.stroke();
    ctx.setLineDash([26, 40]);
    ctx.lineDashOffset = -(t * 30 + run * 1570);
    ctx.strokeStyle = 'rgba(255,215,170,.55)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = V.chrome(ctx, 610, 0, 670, 0);
    V.rr(ctx, 612, ty + 5, 56, 52, 6);
    ctx.fill();
    ctx.fillStyle = C.stage;
    ctx.fillRect(639, ty + 5, 2, 18);
    F.lab(ctx, 'fixed head', 640, ty + 84, { align: 'center' });

    const a2 = s.ramp('timer', 0, 0.5);
    if (a2 > 0) {
      V.alpha(ctx, a2);
      F.lab(ctx, 'Two-hour tape at 5.8 m/s · time left', 640, 226, { align: 'center', color: C.ink });
      const left = Math.max(0, Math.ceil(42 * (1 - f)));
      V.text(ctx, `0:${String(left).padStart(2, '0')}`, 640, 308, { fam: 'osd', size: 92, color: C.a, align: 'center' });
    }

    // speed ladder on a log axis (mm/s)
    const x0 = 150, x1 = 1130;
    const xOf = (v) => x0 + ((Math.log10(v) - 1) / 3) * (x1 - x0);
    const rows = [
      { v: 11.12, name: 'VHS tape, EP (6-hour) mode', val: '11 mm/s', cue: 'real', d: 0.9 },
      { v: 33.35, name: 'VHS tape, SP mode', val: '33 mm/s', cue: 'real', d: 0, star: true },
      { v: 47.6, name: 'Audio cassette', val: '48 mm/s', cue: 'real', d: 1.4 },
      { v: 5800, name: 'What video needs', val: '5,800 mm/s', hot: true, cue: 'ladder', d: 0.2 },
    ];
    const a3 = s.ramp('ladder', 0, 0.6);
    if (a3 <= 0) return;
    V.alpha(ctx, a3);
    F.lab(ctx, 'Speed past the head · mm/s, log scale', x0, 376, { color: C.ink });
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const v of [10, 100, 1000, 10000]) {
      ctx.moveTo(xOf(v), 394);
      ctx.lineTo(xOf(v), 628);
    }
    ctx.stroke();
    ctx.strokeStyle = C.faint;
    ctx.beginPath();
    ctx.moveTo(x0, 628);
    ctx.lineTo(x1, 628);
    ctx.stroke();
    [[10, '10'], [100, '100'], [1000, '1,000'], [10000, '10,000']].forEach(([v, lbl]) =>
      V.text(ctx, lbl, xOf(v), 656, { size: 18, color: C.mute, align: 'center' })
    );
    rows.forEach((r, i) => {
      const y = 436 + i * 52;
      const u = s.since(r.cue, r.d);
      const g = V.easeOut(V.clamp(u / 0.9));
      if (u < 0) return;
      const xe = V.lerp(x0, xOf(r.v), g);
      V.alpha(ctx, a3 * V.clamp(u / 0.3));
      const col = r.hot ? C.a : r.star ? C.ink : C.oxideHi;
      ctx.strokeStyle = col;
      ctx.lineWidth = r.star ? 4 : 3;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(xe, y);
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(xe, y, r.star ? 8 : 7, 0, TAU);
      ctx.fill();
      V.text(ctx, r.name, x0, y - 14, { size: 19, color: r.hot || r.star ? C.ink : C.mute, fam: 'body', weight: r.hot || r.star ? 600 : 400 });
      V.text(ctx, r.val, xe + (r.hot ? -16 : 18), y + (r.hot ? -14 : 7), { size: 18, color: r.hot ? C.a : C.ink, align: r.hot ? 'right' : 'left' });
    });
  };

  /* ── the VCR from above: threading and the spinning drum ── */
  const D = [640, 245], R = 112, RW = R + 4;
  const SUP = [510, 612], SR = 92, TAK = [770, 612], TR = 54;
  const G1 = [378, 452], G2 = [902, 452];
  const TP0 = [412, 452], TP1 = [270, 300];
  const P20 = [582, 452], P2C = [430, 330], P21 = [528, 76];
  const P30 = [698, 452], P3C = [850, 330], P31 = [752, 76];
  const PR0 = [868, 452], PR1 = [1010, 300];
  const FE = [(TP1[0] + P21[0]) / 2, (TP1[1] + P21[1]) / 2];
  const AC = [(P31[0] + PR1[0]) / 2, (P31[1] + PR1[1]) / 2];
  const lerp2 = (a, b, k) => [V.lerp(a[0], b[0], k), V.lerp(a[1], b[1], k)];
  const quad = (a, c, b, k) => [
    (1 - k) * (1 - k) * a[0] + 2 * (1 - k) * k * c[0] + k * k * b[0],
    (1 - k) * (1 - k) * a[1] + 2 * (1 - k) * k * c[1] + k * k * b[1],
  ];
  const tangentAngle = (P, sgn) => {
    const dx = P[0] - D[0], dy = P[1] - D[1];
    return Math.atan2(dy, dx) + sgn * Math.acos(Math.min(1, RW / Math.hypot(dx, dy)));
  };

  /** Tape from A to B: straight, or hugging the cassette-facing side of the drum. */
  function wrapTo(ctx, A, B) {
    const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy);
    const nx = -dy / L, ny = dx / L;
    const d = (A[0] - D[0]) * nx + (A[1] - D[1]) * ny;
    if (d >= RW) { ctx.lineTo(B[0], B[1]); return null; }
    const ta = tangentAngle(A, -1), tb = tangentAngle(B, 1);
    ctx.lineTo(D[0] + RW * Math.cos(ta), D[1] + RW * Math.sin(ta));
    ctx.arc(D[0], D[1], RW, ta, tb, true);
    ctx.lineTo(B[0], B[1]);
    return [ta, tb];
  }

  function drumTop(ctx, t, a, contact) {
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
    // heads travel with the tape along the front of the drum
    const th = -t * TAU * 0.5;
    for (let k = 0; k < 2; k++) {
      const an = th + k * Math.PI;
      if (contact > 0 && Math.sin(an) > 0) {
        ctx.strokeStyle = headCol(k);
        ctx.lineWidth = 6;
        V.alpha(ctx, a * 0.6 * contact);
        ctx.beginPath();
        ctx.arc(D[0], D[1], R + 1, an, an + 0.8);
        ctx.stroke();
      }
      V.alpha(ctx, a);
      ctx.save();
      ctx.translate(D[0], D[1]);
      ctx.rotate(an);
      ctx.fillStyle = headCol(k);
      ctx.fillRect(R - 13, -7, 17, 14);
      ctx.restore();
    }
  }

  function pole(ctx, p, r = 9) {
    ctx.fillStyle = V.chrome(ctx, p[0] - r, 0, p[0] + r, 0);
    ctx.beginPath();
    ctx.arc(p[0], p[1], r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function fixedHead(ctx, p, ang, label) {
    ctx.save();
    ctx.translate(p[0], p[1]);
    ctx.rotate(ang);
    ctx.fillStyle = '#6d7079';
    ctx.fillRect(-17, -22, 34, 16);
    ctx.fillStyle = '#4b4e56';
    ctx.fillRect(-17, -8, 34, 3);
    ctx.restore();
  }

  F.scenes['drum.load'] = (ctx, s) => {
    const t = s.t;
    const a = V.ramp(s.lt, 0, 0.6);
    const u = s.since('load');
    const kT = V.ease(V.clamp((u - 0.15) / 1.3));
    const kP = V.ease(V.clamp((u - 0.35) / 2.3));
    const loaded = V.clamp((u - 2.6) / 0.5);
    const TP = lerp2(TP0, TP1, kT), PR = lerp2(PR0, PR1, kT);
    const P2 = quad(P20, P2C, P21, kP), P3 = quad(P30, P3C, P31, kP);

    // cassette outline and reels
    V.alpha(ctx, a);
    ctx.strokeStyle = C.faint;
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.5;
    V.rr(ctx, 360, 440, 560, 360, 16);
    ctx.stroke();
    ctx.setLineDash([]);
    F.lab(ctx, 'cassette', 640, 700, { align: 'center', size: 17 });
    for (const [c, r] of [[SUP, SR], [TAK, TR]]) {
      ctx.fillStyle = C.oxide;
      ctx.beginPath();
      ctx.arc(c[0], c[1], r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ddd7ce';
      ctx.beginPath();
      ctx.arc(c[0], c[1], 24, 0, TAU);
      ctx.fill();
    }

    // fixed parts of the deck
    const angFE = Math.atan2(P21[1] - TP1[1], P21[0] - TP1[0]);
    const angAC = Math.atan2(PR1[1] - P31[1], PR1[0] - P31[0]);
    fixedHead(ctx, FE, angFE);
    fixedHead(ctx, AC, angAC);
    ctx.fillStyle = V.chrome(ctx, PR1[0] - 8, 0, PR1[0] + 8, 0);
    ctx.beginPath();
    ctx.arc(PR1[0], PR1[1], 8, 0, TAU);
    ctx.fill();
    // guide-post slots
    ctx.strokeStyle = 'rgba(166,157,147,.12)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    for (const [A0, Cc, B0] of [[P20, P2C, P21], [P30, P3C, P31]]) {
      ctx.beginPath();
      ctx.moveTo(A0[0], A0[1]);
      ctx.quadraticCurveTo(Cc[0], Cc[1], B0[0], B0[1]);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';

    drumTop(ctx, t, a, loaded);

    // the tape
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(SUP[0] - SR, SUP[1]);
      ctx.lineTo(G1[0], G1[1]);
      ctx.lineTo(TP[0], TP[1]);
      ctx.lineTo(P2[0], P2[1]);
      wrapTo(ctx, P2, P3);
      ctx.lineTo(PR[0], PR[1]);
      ctx.lineTo(G2[0], G2[1]);
      ctx.lineTo(TAK[0] + TR, TAK[1]);
    };
    V.alpha(ctx, a);
    ctx.lineJoin = 'round';
    path();
    ctx.strokeStyle = C.oxide;
    ctx.lineWidth = 7;
    ctx.stroke();
    if (loaded > 0) {
      V.alpha(ctx, a * loaded);
      path();
      ctx.setLineDash([3, 14]);
      ctx.lineDashOffset = -t * 14;
      ctx.strokeStyle = 'rgba(255,215,170,.45)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    V.alpha(ctx, a);
    for (const p of [G1, G2, TP, P2, P3]) pole(ctx, p);
    // pinch roller swings in against the capstan
    const roll = [PR[0] + 20, PR[1] + 14];
    ctx.fillStyle = '#1b1a1d';
    ctx.beginPath();
    ctx.arc(roll[0], roll[1], 17, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = C.chromeMid;
    ctx.lineWidth = 2;
    ctx.stroke();

    // motion hint while the posts travel
    if (kP > 0.02 && kP < 0.98) {
      V.alpha(ctx, a * Math.sin(kP * Math.PI) * 0.8);
      ctx.fillStyle = C.a;
      for (const p of [P2, P3]) {
        ctx.beginPath();
        ctx.arc(p[0], p[1], 15, 0, TAU);
        ctx.globalAlpha *= 0.35;
        ctx.fill();
        ctx.globalAlpha /= 0.35;
      }
    }

    // labels
    V.alpha(ctx, a * loaded);
    F.lab(ctx, 'tape wraps ≈180°', D[0], D[1] + R + 40, { align: 'center', size: 17 });
    V.alpha(ctx, s.ramp('drum', 0, 0.6));
    ctx.fillStyle = C.a;
    ctx.fillRect(64, 48, 16, 12);
    F.lab(ctx, 'Head A', 88, 60, { size: 17, color: C.ink });
    ctx.fillStyle = C.b;
    ctx.fillRect(184, 48, 16, 12);
    F.lab(ctx, 'Head B', 208, 60, { size: 17, color: C.ink });
    F.co(ctx, { from: [P2[0], P2[1]], to: [300, 120], text: 'Guide posts', sub: 'pull the tape out', align: 'right', p: V.clamp((u - 0.8) / 1.1) * (1 - V.clamp((u - 6) / 0.6)) });
    F.co(ctx, { from: [D[0] + 70, D[1] - 58], to: [860, 70], text: 'Upper drum', sub: 'spins, carries 2 heads', p: s.co('drum', 0.2) });
    F.co(ctx, { from: FE, to: [250, 250], text: 'Erase head', align: 'right', p: V.clamp((u - 6.2) / 1.1) });
    F.co(ctx, { from: AC, to: [1010, 150], text: 'A/C head', sub: 'audio + control tracks', p: V.clamp((u - 6.6) / 1.1) });
    F.co(ctx, { from: PR1, to: [1060, 380], text: 'Capstan', sub: 'sets tape speed', p: V.clamp((u - 7.0) / 1.1) });
  };

  /* ── side view: the tilt ──────────────────────────── */
  F.scenes['drum.tilt'] = (ctx, s) => {
    const t = s.t;
    const cx = 640, cy = 340, RWd = 180, ry = 22;
    const tau = (9 * Math.PI) / 180; // drawn 1.5× the real ≈6°
    const tTop = 304, tBot = 377;
    const a = V.ramp(s.lt, 0, 0.6);

    V.alpha(ctx, a);
    const g = ctx.createLinearGradient(0, tTop, 0, tBot);
    g.addColorStop(0, '#80502e');
    g.addColorStop(1, '#55321c');
    ctx.fillStyle = g;
    ctx.fillRect(0, tTop, W, tBot - tTop);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, tTop, W, tBot - tTop);
    ctx.clip();
    ctx.translate(V.mod(t * 14, 128), 0);
    ctx.fillStyle = V.grain(ctx);
    ctx.fillRect(-128, tTop, W + 256, tBot - tTop);
    ctx.restore();
    V.alpha(ctx, a);
    F.lab(ctx, 'tape →', 64, tTop - 14, { color: C.ink });

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
    const body = V.chrome(ctx, -RWd, 0, RWd, 0);
    V.alpha(ctx, a * 0.9);
    ctx.fillStyle = body;
    ctx.fillRect(-RWd, -118, RWd * 2, 114);
    ctx.fillRect(-RWd, 6, RWd * 2, 112);
    ctx.fillStyle = '#2a2a2e';
    ctx.fillRect(-RWd, -4, RWd * 2, 10);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 118, RWd, ry, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#e9eaee';
    ctx.beginPath();
    ctx.ellipse(0, -118, RWd, ry, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#8e929b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(30,30,34,.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-RWd, 0);
    ctx.lineTo(RWd, 0);
    ctx.stroke();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -118, RWd * 0.5, ry * 0.5, 0, 0.3, 2.6);
    ctx.stroke();
    ctx.fillStyle = C.ink;
    V.arrowHead(ctx, -RWd * 0.5 * Math.cos(0.54), -118 + ry * 0.5 * Math.sin(2.6) + 2, Math.PI * 0.95, 9);
    ctx.restore();

    V.alpha(ctx, a * 0.35);
    ctx.fillStyle = '#6e4226';
    ctx.fillRect(cx - RWd - 2, tTop, RWd * 2 + 4, tBot - tTop);

    const emph = s.ramp('path', 0, 0.6);
    const trace = (upto, col, alpha, wdt) => {
      V.alpha(ctx, alpha);
      ctx.strokeStyle = col;
      ctx.lineWidth = wdt;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const n = 40;
      for (let i = 0; i <= n * upto; i++) {
        const ph = Math.PI - (i / n) * Math.PI;
        const [x, y] = toWorld(RWd * Math.cos(ph), -ry * Math.sin(ph));
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.lineCap = 'butt';
    };
    trace(1, headCol(k + 1), a * 0.35 * (1 - prog), 5 + emph * 2);
    trace(prog, headCol(k), a, 5 + emph * 2);
    for (let j = 0; j < 2; j++) {
      const ph = Math.PI - prog * Math.PI - j * Math.PI;
      const back = Math.sin(ph) > 0;
      const [x, y] = toWorld(RWd * Math.cos(ph), -ry * Math.sin(ph));
      V.alpha(ctx, a * (back ? 1 : 0.55));
      ctx.fillStyle = headCol(k + j);
      ctx.beginPath();
      ctx.arc(x, y, back ? 8 : 6, 0, TAU);
      ctx.fill();
    }

    // ledge on the lower drum that the tape edge rides on
    V.alpha(ctx, a * s.ramp('ledge', 0, 0.6));
    ctx.strokeStyle = '#fff4d6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - RWd + 6, tBot + 1);
    ctx.lineTo(cx + RWd - 6, tBot + 1);
    ctx.stroke();

    // angle annotation: drum axis vs vertical
    const aa = s.ramp('tilt', 0, 0.8);
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
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 214, -Math.PI / 2 - tau * aa, -Math.PI / 2);
    ctx.stroke();
    V.text(ctx, '≈6°', cx - 34, 116, { fam: 'display', size: 34, weight: 800, stretch: 'expanded', color: C.a, align: 'right' });
    V.alpha(ctx, a * aa);
    F.lab(ctx, 'drawn 1.5× steeper', cx + 20, 116, { size: 15 });

    F.co(ctx, { from: [cx + 90, 250], to: [900, 176], text: 'Upper drum', sub: 'spins, carries the heads', p: V.clamp((s.lt - 0.6) / 1.1) });
    const bow = 1 - s.ramp('helical', -0.3, 0.4);
    F.co(ctx, { from: [cx + 60, tBot + 1], to: [780, 566], text: 'Ledge', sub: 'steers the tape into a spiral', p: s.co('ledge', 0.2) });
    F.co(ctx, { from: toWorld(-60, -18), to: [440, 566], text: 'Head path', sub: 'crosses the tape diagonally', align: 'right', p: s.co('path', 0.2) * bow });
  };

  /* ── the track map ────────────────────────────────── */
  F.scenes['drum.tracks'] = (ctx, s) => {
    const t = s.t;
    const top = 190, bot = 520, aB = top + 26, cT = bot - 20;
    const vh = cT - aB;
    const ang = (18 * Math.PI) / 180;
    const L = vh / Math.tan(ang);
    const p = 44, X0 = 60, TF = 0.9;
    const n = t / TF;
    const i = Math.floor(n);
    const f = n - i;
    const sh = n * p;
    const a = V.ramp(s.lt, 0, 0.6);
    V.alpha(ctx, a);
    ctx.fillStyle = '#5e381f';
    ctx.fillRect(0, top, W, bot - top);
    ctx.fillStyle = '#4e2e1a';
    ctx.fillRect(0, top, W, aB - top);
    ctx.fillRect(0, cT, W, bot - cT);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, aB, W, vh);
    ctx.clip();
    for (let j = i - 40; j <= i; j++) {
      const x = X0 + j * p - sh;
      if (x + L + p < 0 || x > W) continue;
      const fr = j === i ? f : 1;
      V.alpha(ctx, a * (j === i ? 0.8 : 0.32));
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
    for (let x = 0; x <= W; x += 4) {
      const y = (aB + top) / 2 + Math.sin((x + sh) * 0.045) * 6 * Math.sin((x + sh) * 0.007);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,228,196,.7)';
    for (let j = i - 40; j <= i; j++) {
      if (V.mod(j, 2)) continue;
      const x = X0 + j * p - sh;
      if (x > 0 && x < W) ctx.fillRect(x, cT + 5, 4, 10);
    }

    const hx = X0 + i * p - sh + f * L + p / 2;
    const hy = cT - f * vh;
    const hc = headCol(i);
    const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, 36);
    glow.addColorStop(0, hc);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(hx, hy, 36, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(hx, hy, 5, 0, TAU);
    ctx.fill();
    const hl = s.ramp('fieldB', 0, 0.5);
    V.text(ctx, `HEAD ${V.mod(i, 2) ? 'B' : 'A'}`, V.clamp(hx, 150, W - 150), hy - 30 < aB + 10 ? hy + 46 : hy - 30, {
      size: 19 + hl * 3, weight: 500, color: hc, align: 'center', spacing: 1,
    });

    // "one stripe = one field": a little screen woven from both heads' lines
    const fa = s.ramp('fieldA', 0, 0.7);
    if (fa > 0) {
      const bx = 64, by = 40, bw = 176, bh = 118;
      V.alpha(ctx, fa);
      ctx.fillStyle = '#0f0e11';
      V.rr(ctx, bx - 8, by - 8, bw + 16, bh + 16, 10);
      ctx.fill();
      const lines = 14;
      const cur = V.mod(i, 2);
      for (let l = 0; l < lines; l++) {
        const which = l % 2;
        const on = which === cur ? V.clamp(f * 1.3) : 1;
        const shown = which === 0 || hl > 0 ? on : 0;
        V.alpha(ctx, fa * (0.25 + 0.75 * shown));
        ctx.fillStyle = which ? C.b : C.a;
        ctx.fillRect(bx, by + l * (bh / lines) + 1, bw * (which === cur ? on : 1), bh / lines - 3);
      }
      V.alpha(ctx, fa);
      F.lab(ctx, hl > 0 ? 'A + B = one frame' : 'One stripe = half a picture', bx + bw + 24, by + 44, { size: 18, color: C.ink });
      F.lab(ctx, hl > 0 ? 'fields interlace, 1/60 s each' : 'every other line', bx + bw + 24, by + 72, { size: 16 });
    }

    V.alpha(ctx, a);
    ctx.strokeStyle = C.mute;
    ctx.lineWidth = 1.2;
    F.co(ctx, { from: [940, (top + aB) / 2], to: [980, 124], text: 'Audio track', p: V.clamp((s.lt - 1.2) / 1.1) });
    F.co(ctx, { from: [700, (cT + bot) / 2], to: [740, 588], text: 'Control track', p: V.clamp((s.lt - 1.6) / 1.1) });
    const ca = V.ramp(s.lt, 0.4, 0.6);
    V.alpha(ctx, ca);
    F.lab(ctx, 'Stripes written', W - 64, 610, { align: 'right', size: 16 });
    V.text(ctx, V.fmt(s.lt * 59.94).padStart(6, '0'), W - 64, 660, { fam: 'osd', size: 52, color: C.ink, align: 'right' });
    F.lab(ctx, 'real speed: 59.94 a second', W - 64, 690, { align: 'right', size: 15 });
  };

  /* ── azimuth ──────────────────────────────────────── */
  F.scenes['drum.azimuth'] = (ctx, s) => {
    const t = s.t;
    const x0 = 250, tw = 165, top = 150, bot = 560;
    const az = (12 * Math.PI) / 180; // drawn 2× the real ±6°
    const a = V.ramp(s.lt, 0, 0.6);
    const scroll = t * 40;
    const lab = s.ramp('tilted', 0, 0.5);
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
      V.alpha(ctx, a);
      V.text(ctx, k % 2 ? 'B  −6°' : 'A  +6°', x + tw / 2, top - 18, {
        size: 21 + lab * 5 * Math.max(0, 1 - s.since('tilted') / 2.5), weight: 500, color: headCol(k), align: 'center', spacing: 1,
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

    // head A strays onto the neighbouring stripe on "cross", then returns
    const c = s.since('cross');
    const m = c < 0.1 ? 0 : c < 1.1 ? V.ease(c - 0.1) : c < 3.4 ? 1 : 1 - V.ease(V.clamp(c - 3.4));
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
    V.text(ctx, 'HEAD A', hx + tw / 2, hy + 54, { size: 18, weight: 500, color: C.ink, align: 'center', spacing: 1 });

    const sig = (1 - m) + m * 0.06;
    const mx = 1030, mt = 180, mb = 520;
    F.lab(ctx, 'Signal', mx + 22, mt - 18, { align: 'center', color: C.ink, size: 17 });
    ctx.fillStyle = C.panel;
    ctx.fillRect(mx, mt, 44, mb - mt);
    const lvl = sig * (mb - mt) * (0.94 + 0.06 * Math.sin(t * 20));
    ctx.fillStyle = sig > 0.5 ? '#7fe0a8' : '#e06a52';
    ctx.fillRect(mx, mb - lvl, 44, lvl);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, mt, 44, mb - mt);

    const dimA = 1 - s.ramp('azimuth', -0.2, 0.4);
    V.alpha(ctx, a * dimA);
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
    F.lab(ctx, '58 µm', x0 + tw / 2, bot + 54, { align: 'center', color: C.ink, size: 18 });
    V.alpha(ctx, a);
    F.co(ctx, { from: [x0 + 2 * tw, 470], to: [x0 + 2 * tw + 60, 616], text: 'No gap between stripes', p: s.co('narr', 0.6) });
    const msg = c < 0.6 || m < 0.5 ? 'Angles match → strong signal' : 'Angles clash → the signal cancels';
    V.alpha(ctx, a * V.ramp(s.lt, 0.4, 0.6));
    V.text(ctx, msg, W / 2, 92, { fam: 'body', size: 28, weight: 600, color: m >= 0.5 && c >= 0.6 ? '#f08a74' : C.ink, align: 'center' });
    V.alpha(ctx, a);
    F.lab(ctx, 'angles drawn 2× for clarity', W - 64, 690, { align: 'right', size: 15 });
  };
})();
