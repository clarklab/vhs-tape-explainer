/* Part 1 · The tape. 16:9 versions of the deck's slide-1 animations
   (js/scene-tape.js), re-laid out for 1280 × 720 and cued to the voice. */
(function () {
  const V = window.VHS;
  const C = V.C;
  const F = V.film;
  const TAU = Math.PI * 2;
  const W = F.W;
  const SCOPE_GREEN = '#7fe0a8';

  /* ── film frame art (also used by the cold open) ──── */
  F.art.filmFrame = (ctx, x, y, w, h, k) => {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#f6c77f');
    g.addColorStop(0.6, '#e2683c');
    g.addColorStop(0.61, '#3d2536');
    g.addColorStop(1, '#221624');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h * 0.61);
    ctx.clip();
    ctx.fillStyle = '#fff2cf';
    ctx.beginPath();
    ctx.arc(x + w * 0.62, y + h * 0.26 + V.mod(k, 12) * h * 0.035, h * 0.15, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#2a1b2b';
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.72);
    ctx.quadraticCurveTo(x + w * 0.3, y + h * 0.5, x + w * 0.55, y + h * 0.66);
    ctx.quadraticCurveTo(x + w * 0.8, y + h * 0.8, x + w, y + h * 0.6);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.fill();
    const bx = x + w * (0.12 + V.mod(k * 0.07, 0.76));
    const by = y + h * 0.2;
    const flap = V.mod(k, 2) * 5;
    ctx.strokeStyle = '#3b2233';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(bx - 9, by - 3 + flap);
    ctx.quadraticCurveTo(bx - 3, by - 6, bx, by);
    ctx.quadraticCurveTo(bx + 3, by - 6, bx + 9, by - 3 + flap);
    ctx.stroke();
  };

  /* ── film vs tape ─────────────────────────────────── */
  F.scenes['tape.film'] = (ctx, s) => {
    const t = s.t;
    const off = t * 60;
    const fy = 118, fh = 190;
    V.alpha(ctx, V.ramp(s.lt, 0, 0.8));
    F.labPair(ctx, '35 mm film', 'every frame is a real photograph', 64, fy - 22);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, fy, W, fh);
    ctx.clip();
    ctx.fillStyle = '#131012';
    ctx.fillRect(0, fy, W, fh);
    const pitch = 196;
    const k0 = Math.floor(off / pitch) - 1;
    for (let k = k0; k < k0 + 9; k++) F.art.filmFrame(ctx, k * pitch - off + 8, fy + 32, 180, 126, k);
    ctx.fillStyle = 'rgba(230,220,205,.78)';
    for (let k = Math.floor(off / 28) - 1; k < Math.floor(off / 28) + 48; k++) {
      const x = k * 28 - off;
      V.rr(ctx, x, fy + 9, 15, 12, 3);
      ctx.fill();
      V.rr(ctx, x, fy + fh - 21, 15, 12, 3);
      ctx.fill();
    }
    ctx.restore();

    // the tape, drawn at the film's scale (12.65 mm vs 35 mm)
    const ty = 410, th = 69;
    V.alpha(ctx, s.ramp('tape', 0, 0.8));
    F.labPair(ctx, '½-inch VHS tape', 'same scale · nothing to see', 64, ty - 22);
    const g = ctx.createLinearGradient(0, ty, 0, ty + th);
    g.addColorStop(0, '#83502d');
    g.addColorStop(0.45, '#6e4226');
    g.addColorStop(1, '#4e2e1a');
    ctx.fillStyle = g;
    ctx.fillRect(0, ty, W, th);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, ty, W, th);
    ctx.clip();
    ctx.translate(-V.mod(off * 0.55, 128), 0);
    ctx.fillStyle = V.grain(ctx);
    ctx.fillRect(0, ty, W + 256, th);
    ctx.restore();

    // magnifier
    const a3 = s.ramp('mag', 0, 0.8);
    if (a3 > 0) {
      const lx = 830 + Math.sin(t * 0.6) * 36;
      const ly = 446 + Math.sin(t * 0.9) * 5;
      const r = 80;
      V.alpha(ctx, a3);
      ctx.save();
      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, TAU);
      ctx.clip();
      ctx.fillStyle = '#5a351f';
      ctx.fillRect(lx - r, ly - r, r * 2, r * 2);
      ctx.translate(lx, ly);
      ctx.scale(3, 3);
      ctx.translate(-V.mod(off * 0.55, 128), 0);
      ctx.fillStyle = V.grain(ctx);
      ctx.fillRect(-r, -r, r * 2 + 128, r * 2);
      ctx.restore();
      V.alpha(ctx, a3);
      ctx.strokeStyle = V.chrome(ctx, lx - r, ly - r, lx + r, ly + r);
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, TAU);
      ctx.stroke();
      ctx.lineWidth = 15;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(lx + r * 0.72, ly + r * 0.72);
      ctx.lineTo(lx + r * 1.25, ly + r * 1.25);
      ctx.stroke();
      ctx.lineCap = 'butt';
      F.lab(ctx, 'magnified: still brown', lx - r - 18, ly + r + 30, { align: 'right', color: C.ink });
    }

    // the punchline, as one line
    const a4 = s.ramp('light', 0, 0.7);
    if (a4 > 0) {
      const size = 40;
      ctx.font = `800 ${size}px ${V.F.display}`;
      if ('fontStretch' in ctx) ctx.fontStretch = 'expanded';
      const A = 'Film stores light.  ', B = 'Tape stores magnetism.';
      const wA = ctx.measureText(A).width, wB = ctx.measureText(B).width;
      const x0 = W / 2 - (wA + wB) / 2;
      const y = 664 - (1 - a4) * 10;
      V.alpha(ctx, a4);
      V.text(ctx, A, x0, y, { fam: 'display', size, weight: 800, stretch: 'expanded', color: C.ink });
      V.text(ctx, B, x0 + wA, y, { fam: 'display', size, weight: 800, stretch: 'expanded', color: C.a });
    }
  };

  /* ── the cassette, cut open ───────────────────────── */
  function reel(ctx, cx, cy, r, rot) {
    const g = ctx.createRadialGradient(cx, cy, 30, cx, cy, r);
    g.addColorStop(0, '#5a341d');
    g.addColorStop(0.85, '#734528');
    g.addColorStop(1, '#4a2b18');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.18)';
    ctx.lineWidth = 1;
    for (let rr = 44; rr < r; rr += 7) {
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, TAU);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,215,170,.10)';
    ctx.lineWidth = 3;
    for (let k = 0; k < 3; k++) {
      const an = rot + (k * TAU) / 3;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(an) * 44, cy + Math.sin(an) * 44);
      ctx.lineTo(cx + Math.cos(an) * (r - 4), cy + Math.sin(an) * (r - 4));
      ctx.stroke();
    }
    ctx.fillStyle = '#ddd7ce';
    ctx.beginPath();
    ctx.arc(cx, cy, 36, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2a262c';
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ddd7ce';
    for (let k = 0; k < 6; k++) {
      const an = rot + (k * TAU) / 6;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(an) * 20, cy + Math.sin(an) * 20, 5, 0, TAU);
      ctx.fill();
    }
  }

  /**
   * Inside the VCR, a sprung lever presses on the cassette's record tab.
   * Tab there: lever held up, recording allowed. Tab gone: the lever drops
   * into the hole and the deck refuses to record.
   */
  function safetyLever(ctx, s, tx, ty) {
    const a = s.ramp('sensor', 0, 0.4) * (1 - s.ramp('lamp', -0.3, 0.45));
    if (a <= 0) return;
    const P = [tx + 89, ty - 76];
    const L = Math.hypot(tx - P[0], ty - 11 - P[1]);
    const rest = Math.atan2(ty - 11 - P[1], tx - P[0]);
    const raised = rest + 0.33;
    const drop = Math.asin((ty - P[1]) / L);
    const dropAng = Math.PI - drop;
    const down = V.ease(V.clamp(s.since('sensor', 0.3) / 0.7));
    const fall = V.easeOut(V.clamp(s.since('snap', 0.45) / 0.22));
    const ang = V.lerp(V.lerp(raised, rest, down), dropAng, fall);
    const tip = [P[0] + Math.cos(ang) * L, P[1] + Math.sin(ang) * L];
    V.alpha(ctx, a);
    // switch body
    ctx.fillStyle = '#2a272e';
    V.rr(ctx, P[0] - 16, P[1] - 17, 66, 34, 6);
    ctx.fill();
    ctx.strokeStyle = '#48434f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // arm + foot
    ctx.strokeStyle = V.chrome(ctx, tip[0], tip[1], P[0], P[1]);
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(P[0], P[1]);
    ctx.lineTo(tip[0], tip[1]);
    ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.fillStyle = '#d3d6dc';
    ctx.beginPath();
    ctx.arc(tip[0], tip[1], 5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1b191d';
    ctx.beginPath();
    ctx.arc(P[0], P[1], 6, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = C.chromeMid;
    ctx.lineWidth = 2;
    ctx.stroke();
    // status light + readout
    const locked = fall > 0.5;
    const on = down >= 1 || locked;
    const col = locked ? '#ff6b57' : '#7fe0a8';
    if (on) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(P[0] + 36, P[1], 5, 0, TAU);
      ctx.fill();
      F.osd(ctx, locked ? 'RECORD LOCKED' : 'RECORD OK', P[0] + 62, P[1] + 10, { size: 32, color: col });
    }
    F.lab(ctx, 'Safety lever, in the VCR', P[0] + 62, P[1] + 38, { size: 15 });
  }

  F.scenes['tape.cassette'] = (ctx, s) => {
    const t = s.t;
    const X0 = 290, Y0 = 116, CW = 700, CH = 386;
    const S = [X0 + 175, Y0 + 168], SR = 140;
    const T = [X0 + 525, Y0 + 168], TR = 60;
    const v = 24;
    V.alpha(ctx, V.ramp(s.lt, 0, 0.6));
    ctx.fillStyle = '#1b191d';
    V.rr(ctx, X0, Y0, CW, CH, 18);
    ctx.fill();
    ctx.strokeStyle = '#3d3942';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#121014';
    V.rr(ctx, X0 + 14, Y0 + 14, CW - 28, CH - 50, 12);
    ctx.fill();
    ctx.fillStyle = C.stage;
    ctx.fillRect(X0 + 28, Y0 + CH - 40, CW - 56, 40);
    ctx.fillStyle = '#2c2930';
    for (const [sx, sy] of [[X0 + 26, Y0 + 26], [X0 + CW - 26, Y0 + 26], [X0 + CW / 2, Y0 + 30]]) {
      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, TAU);
      ctx.fill();
    }

    reel(ctx, S[0], S[1], SR, -t * v / SR);
    reel(ctx, T[0], T[1], TR, -t * v / TR);

    // tape path: supply → left guide → across the front → right guide → take-up
    const gy = Y0 + CH - 22;
    const L0 = X0 + 34, L1 = X0 + CW - 34;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(S[0] - SR, S[1]);
    ctx.lineTo(L0, gy);
    ctx.lineTo(L1, gy);
    ctx.lineTo(T[0] + TR, T[1]);
    ctx.strokeStyle = C.oxide;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.setLineDash([3, 16]);
    ctx.lineDashOffset = -t * v;
    ctx.strokeStyle = 'rgba(255,205,160,.35)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.setLineDash([]);

    // clear leader arrives at the end of the tape (on "lamp")
    const lead = V.ease(V.clamp(s.since('lamp', 0.5) / 2.4));
    const leadX = V.lerp(L0, L1, lead);
    if (lead > 0) {
      ctx.fillStyle = C.stage;
      ctx.fillRect(L0, gy - 5, leadX - L0, 10);
      ctx.fillStyle = 'rgba(214,232,240,.55)';
      ctx.fillRect(L0, gy - 3, leadX - L0, 6);
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      ctx.fillRect(L0, gy - 3, leadX - L0, 1.5);
    }
    ctx.fillStyle = V.chrome(ctx, X0, 0, X0 + CW, 0);
    for (const gx of [L0, L1]) {
      ctx.beginPath();
      ctx.arc(gx, gy - 9, 9, 0, TAU);
      ctx.fill();
    }

    // dust flap swings open
    const fo = V.ramp(s.lt, 0.6, 0.8);
    V.alpha(ctx, 1 - fo * 0.75);
    ctx.fillStyle = '#26232a';
    V.rr(ctx, X0 + 18, Y0 + CH - 12 + fo * 26, CW - 36, 16 - fo * 8, 4);
    ctx.fill();

    // record-protect tab on the back edge: snaps off on "snap"
    const snap = V.clamp(s.since('snap', 0.25) / 0.75);
    V.alpha(ctx, 1);
    ctx.fillStyle = '#0b0a0c';
    ctx.fillRect(X0 + 44, Y0 - 1, 34, 6);
    if (snap < 1) {
      ctx.save();
      ctx.translate(X0 + 61 - snap * 40, Y0 - 2 - snap * 70 + snap * snap * 90);
      ctx.rotate(-snap * 2.4);
      V.alpha(ctx, 1 - snap);
      ctx.fillStyle = '#34303a';
      ctx.fillRect(-17, -5, 34, 10);
      ctx.strokeStyle = C.mute;
      ctx.lineWidth = 1;
      ctx.strokeRect(-17, -5, 34, 10);
      ctx.restore();
    }

    // the VCR's record-safety lever: rests on the tab, drops into the hole
    safetyLever(ctx, s, X0 + 61, Y0);

    // brake lever between the reels
    V.alpha(ctx, 1);
    ctx.strokeStyle = C.chromeMid;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(S[0] + SR - 6, Y0 + 70);
    ctx.lineTo(X0 + CW / 2, Y0 + 50);
    ctx.lineTo(T[0] - TR - 20, Y0 + 70);
    ctx.stroke();

    // end-of-tape lamp: light fans out to the front corners
    const Lp = [X0 + CW / 2, Y0 + CH - 72];
    const pulse = 0.55 + 0.45 * Math.sin(t * 3);
    const la = s.ramp('lamp', 0, 0.8);
    if (la > 0) {
      const hit = V.clamp((lead - 0.9) / 0.1);
      for (const [cx, side] of [[X0 + 22, 0], [X0 + CW - 22, 1]]) {
        const bright = side === 1 ? 0.55 + hit * 0.45 : 0.55;
        const g = ctx.createLinearGradient(Lp[0], Lp[1], cx, gy);
        g.addColorStop(0, `rgba(255,236,190,${bright * pulse})`);
        g.addColorStop(1, 'rgba(255,236,190,0)');
        V.alpha(ctx, la);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(Lp[0], Lp[1] - 5);
        ctx.lineTo(cx, gy - 16);
        ctx.lineTo(cx, gy + 10);
        ctx.lineTo(Lp[0], Lp[1] + 5);
        ctx.closePath();
        ctx.fill();
      }
      // the sensor on the far side lights when the leader passes
      if (hit > 0) {
        V.alpha(ctx, hit);
        const sg = ctx.createRadialGradient(X0 + CW - 10, gy, 0, X0 + CW - 10, gy, 40);
        sg.addColorStop(0, 'rgba(255,240,200,.95)');
        sg.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(X0 + CW - 10, gy, 40, 0, TAU);
        ctx.fill();
      }
      V.alpha(ctx, la);
      ctx.fillStyle = '#fff2cc';
      ctx.beginPath();
      ctx.arc(Lp[0], Lp[1], 9, 0, TAU);
      ctx.fill();
    }

    // earlier labels bow out before the camera pushes in
    const off1 = 1 - s.ramp('sensor', -0.5, 0.45);
    const off2 = 1 - s.ramp('lamp', -0.3, 0.45);
    F.co(ctx, { from: [S[0] - 70, S[1] + 76], to: [250, 440], text: 'Supply reel', sub: 'full at the start', align: 'right', p: s.co('reels', 0.2) * off1 });
    F.co(ctx, { from: [T[0] + 20, T[1] + 56], to: [1030, 440], text: 'Take-up reel', sub: 'empty at the start', p: s.co('reels', 0.6) * off1 });
    F.co(ctx, { from: [X0 + CW / 2, Y0 + 50], to: [800, 56], text: 'Spring brakes', sub: 'lock the reels on the shelf', p: s.co('reels', 2.2) * off1 });
    F.co(ctx, { from: [X0 + 61, Y0 - 3], to: [250, 70], text: 'Record tab', sub: 'snap off to protect', align: 'right', p: s.co('tab') * off2 });
    F.co(ctx, { from: Lp, to: [820, 640], text: 'End-of-tape lamp', sub: 'shines through the clear leader', p: s.co('lamp') });
  };

  /* ── the coating up close (coating / write / read) ── */
  const PERIOD = 1380;
  const CT = 300, CB = 450;
  const GAP_X = 640;
  const parts = [];
  {
    const r = V.rng(42);
    for (let i = 0; i < 950; i++) {
      parts.push({
        u: r() * PERIOD, y: CT + 8 + r() * (CB - CT - 16),
        len: 11 + r() * 8, tilt: (r() - 0.5) * 0.26, dir: r() < 0.5 ? -1 : 1, ph: r() * TAU,
      });
    }
  }
  const phi = (U) => (TAU * U) / 72 + 1.6 * Math.sin(U / 150) + 0.8 * Math.sin(U / 37);
  const mag = (U) => Math.tanh(4 * Math.sin(phi(U)));

  function layers(ctx, a, sh, la, bx = 1110) {
    V.alpha(ctx, a);
    ctx.fillStyle = C.coat;
    ctx.fillRect(0, CT, W, CB - CT);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, CT, W, CB - CT);
    ctx.clip();
    ctx.translate(-V.mod(sh, 128), 0);
    ctx.fillStyle = V.grain(ctx);
    ctx.fillRect(0, CT, W + 256, CB - CT);
    ctx.restore();
    const g = ctx.createLinearGradient(0, CB, 0, 600);
    g.addColorStop(0, '#303b48');
    g.addColorStop(1, '#1e252e');
    ctx.fillStyle = g;
    ctx.fillRect(0, CB, W, 150);
    ctx.fillStyle = C.stage;
    ctx.beginPath();
    ctx.moveTo(0, 516);
    for (let x = 0, k = 0; x <= W; x += 20, k++) ctx.lineTo(x, 516 + (k % 2 ? 5 : -5));
    for (let x = W, k = 0; x >= 0; x -= 20, k++) ctx.lineTo(x, 534 + (k % 2 ? 5 : -5));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#171518';
    ctx.fillRect(0, 600, W, 16);
    V.alpha(ctx, a * la);
    F.lab(ctx, 'Magnetic coating · ≈3 µm', 64, CT - 16, { color: C.ink });
    F.lab(ctx, 'Polyester base · ≈15 µm (shortened)', 64, 496, { color: 'rgba(239,232,221,.8)' });
    F.lab(ctx, 'Back coat · carbon', 64, 650);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx, CT - 20);
    ctx.lineTo(bx + 50, CT - 20);
    ctx.moveTo(bx, CT - 26);
    ctx.lineTo(bx, CT - 14);
    ctx.moveTo(bx + 50, CT - 26);
    ctx.lineTo(bx + 50, CT - 14);
    ctx.stroke();
    F.lab(ctx, '1 µm', bx + 25, CT - 34, { align: 'center', color: C.ink });
  }

  function particles(ctx, a, sh, mode, t) {
    const pn = new Path2D();
    const ps = new Path2D();
    const dots = new Path2D();
    for (const p of parts) {
      const x = V.mod(p.u - sh, PERIOD) - 50;
      if (x < -20 || x > W + 20) continue;
      let dir = p.dir;
      if (mode === 'read' || (mode === 'write' && x < GAP_X)) dir = mag(x + sh) >= 0 ? 1 : -1;
      const jig = mode === 'idle' ? Math.sin(t * 1.4 + p.ph) * 0.06 : 0;
      const ang = p.tilt + jig + (dir < 0 ? Math.PI : 0);
      const hx = (Math.cos(ang) * p.len) / 2;
      const hy = (Math.sin(ang) * p.len) / 2;
      const path = dir > 0 ? pn : ps;
      path.moveTo(x - hx, p.y - hy);
      path.lineTo(x + hx, p.y + hy);
      dots.moveTo(x + hx * 0.8 + 1.5, p.y + hy * 0.8);
      dots.arc(x + hx * 0.8, p.y + hy * 0.8, 1.5, 0, TAU);
    }
    V.alpha(ctx, a);
    ctx.lineCap = 'round';
    ctx.lineWidth = 4.2;
    ctx.strokeStyle = C.north;
    ctx.stroke(pn);
    ctx.strokeStyle = C.south;
    ctx.stroke(ps);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fill(dots);
    ctx.lineCap = 'butt';
  }

  function boundaries(ctx, a, sh) {
    if (a <= 0) return;
    V.alpha(ctx, a);
    ctx.strokeStyle = 'rgba(239,232,221,.7)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    let prev = Math.sin(phi(-1 + sh));
    for (let x = 0; x < W; x++) {
      const cur = Math.sin(phi(x + sh));
      if ((cur >= 0) !== (prev >= 0)) {
        ctx.moveTo(x, CT);
        ctx.lineTo(x, CB);
      }
      prev = cur;
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function head(ctx, a, mode, sh, t) {
    const hx = GAP_X, hy = 176, R = 76;
    V.alpha(ctx, a);
    ctx.lineCap = 'butt';
    ctx.lineWidth = 26;
    ctx.strokeStyle = V.chrome(ctx, hx - R - 13, 0, hx + R + 13, 0);
    ctx.beginPath();
    ctx.arc(hx, hy, R, Math.PI / 2 + 0.14, Math.PI / 2 - 0.14 + TAU);
    ctx.stroke();
    ctx.fillStyle = V.chrome(ctx, hx - 40, 0, hx + 40, 0);
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(hx + sgn * 36, hy + R - 10);
      ctx.lineTo(hx + sgn * 6, hy + R - 10);
      ctx.lineTo(hx + sgn * 6, 297);
      ctx.lineTo(hx + sgn * 20, 297);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = C.copper;
    ctx.lineWidth = 3.5;
    for (let i = 0; i < 8; i++) {
      const y = hy - 40 + i * 10;
      ctx.beginPath();
      ctx.moveTo(hx - R - 19, y);
      ctx.lineTo(hx - R + 19, y + 5);
      ctx.stroke();
    }
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx - R - 16, hy - 42);
    ctx.lineTo(hx - 108, 104);
    ctx.lineTo(hx - 130, 104);
    ctx.moveTo(hx - R - 16, hy + 36);
    ctx.lineTo(hx - 116, 140);
    ctx.lineTo(hx - 130, 140);
    ctx.stroke();

    const cur = mag(GAP_X + sh);
    if (mode === 'write') {
      const sign = cur >= 0 ? 1 : -1;
      ctx.lineWidth = 2;
      for (let k = 0; k < 5; k++) {
        const r = 12 + k * 14;
        V.alpha(ctx, a * (0.9 - k * 0.15) * (0.55 + 0.45 * Math.abs(cur)));
        ctx.strokeStyle = sign > 0 ? C.north : C.south;
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.ellipse(GAP_X, 297, r, r * 0.95, 0, 0, Math.PI);
        ctx.stroke();
        V.arrowHead(ctx, GAP_X + sign * 4, 297 + r * 0.95, sign > 0 ? 0 : Math.PI, 7);
      }
    } else {
      // flux circulating through the core, reversing at every stripe boundary
      V.alpha(ctx, a);
      ctx.fillStyle = SCOPE_GREEN;
      const dirn = cur >= 0 ? 1 : -1;
      const base = V.mod(t * 1.6 * dirn, TAU);
      for (let k = 0; k < 7; k++) {
        const an = Math.PI / 2 + 0.3 + V.mod(base + (k * (TAU - 0.6)) / 7, TAU - 0.6);
        ctx.beginPath();
        ctx.arc(hx + Math.cos(an) * R, hy + Math.sin(an) * R, 3.4, 0, TAU);
        ctx.fill();
      }
    }
  }

  function scope(ctx, a, sh, mode, pulse) {
    const x = 48, y = 40, w = 360, h = 130;
    V.alpha(ctx, a);
    ctx.fillStyle = '#0e1411';
    V.rr(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(127,224,168,.09)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = x + 30; gx < x + w; gx += 30) { ctx.moveTo(gx, y + 34); ctx.lineTo(gx, y + h - 8); }
    ctx.moveTo(x + 10, y + h / 2 + 14);
    ctx.lineTo(x + w - 10, y + h / 2 + 14);
    ctx.stroke();
    F.lab(ctx, mode === 'write' ? 'Signal → coil' : 'Coil → playback voltage', x + 16, y + 27, { size: 17, color: SCOPE_GREEN });
    const Ug = GAP_X + sh;
    const cy = y + h / 2 + 14;
    ctx.strokeStyle = SCOPE_GREEN;
    ctx.lineWidth = 2.2 + (pulse || 0) * 1.5;
    ctx.beginPath();
    const span = w - 24;
    for (let px = 0; px <= span; px++) {
      const U = Ug - (span - px);
      let val = mode === 'write' ? mag(U) : mag(U + 1.5) - mag(U - 1.5);
      val = V.clamp(val, -1.25, 1.25);
      const yy = cy - val * 34;
      px ? ctx.lineTo(x + 12 + px, yy) : ctx.moveTo(x + 12 + px, yy);
    }
    ctx.stroke();
  }

  function legend(ctx, a, mode) {
    if (a <= 0) return;
    V.alpha(ctx, a);
    const y = 690;
    const x0 = 820;
    ctx.lineCap = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = C.north;
    ctx.beginPath(); ctx.moveTo(x0, y - 7); ctx.lineTo(x0 + 26, y - 7); ctx.stroke();
    F.lab(ctx, 'N → right', x0 + 38, y, { size: 17 });
    ctx.strokeStyle = C.south;
    ctx.beginPath(); ctx.moveTo(x0 + 190, y - 7); ctx.lineTo(x0 + 216, y - 7); ctx.stroke();
    F.lab(ctx, 'N ← left', x0 + 228, y, { size: 17 });
    ctx.lineCap = 'butt';
    if (mode !== 'idle') F.lab(ctx, mode === 'write' ? 'Tape moving ←' : 'Recorded stripes moving ←', 64, y, { size: 17, color: C.ink });
  }

  function magnification(ctx, s) {
    const u = s.lt;
    if (u > 3.2) return;
    const k = V.easeOut(V.clamp(u / 1.3));
    const n = Math.round(Math.pow(10, 1 + 3 * k));
    V.alpha(ctx, 1 - V.ramp(u, 2.6, 0.5));
    F.osd(ctx, `×${V.fmt(n)}`, W - 64, 96, { size: 56, align: 'right', color: C.a });
  }

  function snowTV(ctx, s) {
    const a = s.ramp('snow', 0.1, 0.5);
    if (a <= 0) return;
    const x = 504, y = 30, w = 272, h = 204;
    V.alpha(ctx, a);
    ctx.fillStyle = '#1d1a1f';
    V.rr(ctx, x - 14, y - 14, w + 28, h + 28, 22);
    ctx.fill();
    ctx.save();
    V.rr(ctx, x, y, w, h, 16);
    ctx.clip();
    V.crt.snow(ctx, x, y, w, h);
    ctx.restore();
    F.lab(ctx, 'blank tape, played back', x + w + 30, y + h / 2 + 6, { size: 17, color: C.ink });
  }

  F.scenes['tape.coating'] = (ctx, s) => {
    const a = V.ramp(s.lt, 0, 0.5);
    layers(ctx, a, 0, s.ramp('layers', 0, 0.7), 470);
    particles(ctx, V.ramp(s.lt, 0.1, 0.8), 0, 'idle', s.t);
    legend(ctx, s.ramp('magnet', 0.4, 0.6), 'idle');
    const bow = 1 - s.ramp('snow', -0.2, 0.4);
    F.co(ctx, { from: [770, 356], to: [690, 196], text: 'Iron-oxide needles', sub: '≈0.3 µm long, set in glue', p: s.co('needles', 0.1) * bow });
    F.co(ctx, { from: [430, 410], to: [420, 196], text: 'Each one: a bar magnet', sub: 'pointing any which way', align: 'right', p: s.co('magnet') * bow });
    magnification(ctx, s);
    snowTV(ctx, s);
  };

  F.scenes['tape.write'] = (ctx, s) => {
    const sh = s.t * 38;
    const a = V.ramp(s.lt, 0, 0.6);
    layers(ctx, a, sh, 0.7);
    particles(ctx, V.ramp(s.lt, 0.15, 0.8), sh, 'write', s.t);
    head(ctx, a, 'write', sh, s.t);
    scope(ctx, V.ramp(s.lt, 0.3, 0.6), sh, 'write');
    legend(ctx, s.ramp('stripes', 0, 0.6), 'write');
    F.co(ctx, { from: [GAP_X - 95, 140], to: [GAP_X - 250, 214], text: 'Coil', align: 'right', p: V.clamp((s.lt - 0.9) / 1.1) * (1 - s.ramp('gap', -0.3, 0.4)) });
    F.co(ctx, { from: [GAP_X - 2, 295], to: [GAP_X - 104, 262], text: 'Gap', sub: '≈0.3 µm', align: 'right', p: s.co('gap', 0.3) * (1 - s.ramp('field', 0.4, 0.4)), size: 19, subSize: 16 });
    F.co(ctx, { from: [GAP_X + 48, 336], to: [GAP_X + 190, 204], text: 'Fringe field', sub: 'flips every needle it passes', p: s.co('field') });
    // N · S · N · S tags ride along with the new stripes
    const na = s.ramp('stripes', 0.3, 0.7);
    if (na > 0) {
      V.alpha(ctx, na);
      let prev = Math.sin(phi(sh));
      let start = 0;
      for (let x = 1; x < GAP_X - 10; x++) {
        const cur = Math.sin(phi(x + sh));
        if ((cur >= 0) !== (prev >= 0)) {
          if (x - start > 26) V.text(ctx, prev >= 0 ? 'N' : 'S', (x + start) / 2, CT - 46, { size: 20, weight: 500, color: prev >= 0 ? C.north : C.south, align: 'center' });
          start = x;
        }
        prev = cur;
      }
    }
  };

  function fmPanel(ctx, s) {
    const a = s.ramp('fm', 0, 0.7);
    if (a <= 0) return;
    const x = 880, y = 40, w = 352, rowH = 46;
    V.alpha(ctx, a);
    ctx.fillStyle = 'rgba(24,22,26,.92)';
    V.rr(ctx, x - 16, y - 8, w + 32, 190, 12);
    ctx.fill();
    F.lab(ctx, 'Brightness = stripe spacing', x, y + 20, { size: 17, color: C.ink });
    const rows = [
      { name: 'White', p: 11, y: y + 44 },
      { name: 'Black', p: 26, y: y + 44 + rowH + 22 },
    ];
    for (const r of rows) {
      const sx = x + 90;
      const sw = w - 90;
      ctx.save();
      ctx.beginPath();
      ctx.rect(sx, r.y, sw, rowH);
      ctx.clip();
      const scroll = V.mod(s.t * 38, r.p * 2);
      for (let k = -2; k * r.p < sw + r.p * 2; k++) {
        ctx.fillStyle = k % 2 ? C.north : C.south;
        ctx.fillRect(sx + k * r.p - scroll, r.y, r.p, rowH);
      }
      ctx.restore();
      V.text(ctx, V.upper(r.name), x, r.y + rowH / 2 + 7, { size: 19, weight: 500, color: r.name === 'White' ? '#fff' : C.mute });
    }
  }

  F.scenes['tape.read'] = (ctx, s) => {
    const sh = s.t * 38;
    const a = V.ramp(s.lt, 0, 0.6);
    layers(ctx, a, sh, 0.7);
    particles(ctx, V.ramp(s.lt, 0.15, 0.8), sh, 'read', s.t);
    boundaries(ctx, s.ramp('boundary', 0, 0.8), sh);
    head(ctx, a, 'read', sh, s.t);
    scope(ctx, V.ramp(s.lt, 0.3, 0.6), sh, 'read', s.ramp('boundary', 0, 0.5) * (1 - s.ramp('boundary', 2, 1)));
    legend(ctx, V.ramp(s.lt, 0.6, 0.6) * (1 - s.ramp('radio', 0, 0.4)), 'read');
    F.co(ctx, { from: [GAP_X + 48, 336], to: [GAP_X + 190, 214], text: 'Boundary = pulse', sub: 'no change, no signal', p: s.co('boundary', 0.2) * (1 - s.ramp('fm', -0.3, 0.35)) });
    fmPanel(ctx, s);
  };

  /* ── developer fluid reveals the tracks ───────────── */
  F.scenes['tape.reveal'] = (ctx, s) => {
    const top = 190, bot = 500;
    const aTop = top + 24, cBot = bot - 18;
    const vh = cBot - aTop;
    const ang = (18 * Math.PI) / 180;
    const L = vh / Math.tan(ang);
    const p = 36;
    const sh = s.t * 12;
    const a = V.ramp(s.lt, 0, 0.6);
    V.alpha(ctx, a);
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, '#80502e');
    g.addColorStop(0.5, '#6e4226');
    g.addColorStop(1, '#4e2e1a');
    ctx.fillStyle = g;
    ctx.fillRect(0, top, W, bot - top);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, top, W, bot - top);
    ctx.clip();
    ctx.fillStyle = V.grain(ctx);
    ctx.fillRect(0, top, W, bot - top);
    ctx.restore();

    const rx = V.ease(V.clamp(s.since('brush', 0.1) / 3.0)) * (W + 40);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, top, V.clamp(rx, 0, W), bot - top);
    ctx.clip();
    ctx.fillStyle = 'rgba(20,12,8,.35)';
    ctx.fillRect(0, top, W, bot - top);
    const i0 = Math.floor((-L - p + sh) / p) - 1;
    const i1 = Math.ceil((W + sh) / p);
    for (let i = i0; i <= i1; i++) {
      const x = i * p - sh;
      ctx.fillStyle = i % 2 ? 'rgba(0,0,0,.28)' : 'rgba(255,228,196,.22)';
      ctx.beginPath();
      ctx.moveTo(x, cBot);
      ctx.lineTo(x + p, cBot);
      ctx.lineTo(x + p + L, aTop);
      ctx.lineTo(x + L, aTop);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,228,196,.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const yy = top + 6 + k * 4;
      for (let x = 0; x <= W; x += 6) {
        const w = Math.sin((x + sh) * 0.09 + k) * 1.2;
        x === 0 ? ctx.moveTo(x, yy + w) : ctx.lineTo(x, yy + w);
      }
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,228,196,.55)';
    for (let i = i0 - V.mod(i0, 2); i <= i1; i += 2) ctx.fillRect(i * p - sh, cBot + 4, 3, 10);
    ctx.restore();

    if (rx > 0 && rx < W + 40) {
      const wg = ctx.createLinearGradient(rx - 60, 0, rx + 6, 0);
      wg.addColorStop(0, 'rgba(160,200,220,0)');
      wg.addColorStop(1, 'rgba(160,200,220,.4)');
      V.alpha(ctx, a);
      ctx.fillStyle = wg;
      ctx.fillRect(rx - 60, top, 66, bot - top);
    }

    V.alpha(ctx, a);
    F.lab(ctx, 'Recorded tape, top view', 64, 64, { color: C.ink });
    V.alpha(ctx, a * s.ramp('brush', 0, 0.6));
    F.lab(ctx, '+ magnetic developer fluid', 64, 94, { color: C.mute });
    F.co(ctx, { from: [230, top + 11], to: [290, 136], text: 'Audio track', sub: 'along the top edge', p: s.co('stripes', 0.9) });
    F.co(ctx, { from: [760, 340], to: [820, 136], text: 'Video tracks', sub: 'one diagonal stripe each', p: s.co('stripes', 0.2) });
    F.co(ctx, { from: [480, bot - 8], to: [540, 574], text: 'Control track', sub: 'along the bottom edge', p: s.co('stripes', 1.6) });
    const qa = s.ramp('why', 0, 0.7);
    if (qa > 0) {
      V.alpha(ctx, qa);
      V.text(ctx, 'Why diagonal?', W - 64, 668 - (1 - qa) * 12, { fam: 'display', size: 52, weight: 800, stretch: 'expanded', color: C.a, align: 'right' });
    }
  };
})();
