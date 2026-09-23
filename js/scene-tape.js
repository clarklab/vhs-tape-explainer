/* Slide 1 · The tape: film vs tape, the cassette, the oxide coating,
   writing and reading stripes, and the developer-fluid reveal. */
(function () {
  const V = window.VHS;
  const C = V.C;
  const TAU = Math.PI * 2;
  const SCOPE_GREEN = '#7fe0a8';

  /* ── step 0 · film vs tape ─────────────────────────── */
  function filmFrame(ctx, x, y, w, h, k) {
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
  }

  function filmVsTape(ctx, t, st) {
    const off = t * 60;
    // film strip: 35 mm tall → 190 px; tape below drawn at the same scale
    const fy = 118, fh = 190;
    const a1 = V.ramp(st, 0, 0.7);
    V.alpha(ctx, a1);
    V.label(ctx, '35 mm film', 40, fy - 20, { color: C.ink });
    V.label(ctx, 'every frame is a real photograph', 190, fy - 20);
    ctx.save();
    ctx.beginPath();
    ctx.rect(40, fy, 920, fh);
    ctx.clip();
    ctx.fillStyle = '#131012';
    ctx.fillRect(40, fy, 920, fh);
    const pitch = 196;
    const k0 = Math.floor(off / pitch) - 1;
    for (let k = k0; k < k0 + 7; k++) {
      const x = 40 + k * pitch - off;
      filmFrame(ctx, x + 8, fy + 32, 180, 126, k);
    }
    ctx.fillStyle = 'rgba(230,220,205,.78)';
    for (let k = Math.floor(off / 28) - 1; k < Math.floor(off / 28) + 36; k++) {
      const x = 40 + k * 28 - off;
      V.rr(ctx, x, fy + 9, 15, 12, 3);
      ctx.fill();
      V.rr(ctx, x, fy + fh - 21, 15, 12, 3);
      ctx.fill();
    }
    ctx.restore();

    // tape strip: 12.65 mm → 69 px at the film's scale
    const ty = 410, th = 69;
    const a2 = V.ramp(st, 0.5, 0.7);
    V.alpha(ctx, a2);
    V.label(ctx, '½-inch VHS tape', 40, ty - 20, { color: C.ink });
    V.label(ctx, 'same scale · nothing to see', 232, ty - 20);
    const g = ctx.createLinearGradient(0, ty, 0, ty + th);
    g.addColorStop(0, '#83502d');
    g.addColorStop(0.45, '#6e4226');
    g.addColorStop(1, '#4e2e1a');
    ctx.fillStyle = g;
    ctx.fillRect(40, ty, 920, th);
    ctx.save();
    ctx.beginPath();
    ctx.rect(40, ty, 920, th);
    ctx.clip();
    ctx.translate(-V.mod(off * 0.55, 128), 0);
    ctx.fillStyle = V.grain(ctx);
    ctx.fillRect(40, ty, 1060, th);
    ctx.restore();

    // magnifier over the tape
    const a3 = V.ramp(st, 1.2, 0.7);
    if (a3 > 0) {
      const lx = 700 + Math.sin(t * 0.6) * 40;
      const ly = 446 + Math.sin(t * 0.9) * 6;
      const r = 74;
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
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, TAU);
      ctx.stroke();
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(lx + r * 0.72, ly + r * 0.72);
      ctx.lineTo(lx + r * 1.25, ly + r * 1.25);
      ctx.stroke();
      V.label(ctx, 'magnified: still brown', lx - r - 16, ly + r + 30, { align: 'right' });
    }

    const a4 = V.ramp(st, 1.9, 0.8);
    if (a4 > 0) {
      V.alpha(ctx, a4);
      const size = 40;
      ctx.font = `800 ${size}px ${V.F.display}`;
      if ('fontStretch' in ctx) ctx.fontStretch = 'expanded';
      const A = 'Film stores light.  ';
      const B = 'Tape stores magnetism.';
      const wA = ctx.measureText(A).width;
      const wB = ctx.measureText(B).width;
      const x0 = 500 - (wA + wB) / 2;
      const y = 660 - (1 - a4) * 10;
      V.text(ctx, A, x0, y, { fam: 'display', size, weight: 800, stretch: 'expanded', color: C.mute });
      V.text(ctx, B, x0 + wA, y, { fam: 'display', size, weight: 800, stretch: 'expanded', color: C.ink });
    }
  }

  /* ── step 1 · the cassette ─────────────────────────── */
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

  function cassette(ctx, t, st) {
    const X0 = 150, Y0 = 116, CW = 700, CH = 386;
    const S = [X0 + 175, Y0 + 168], SR = 140;
    const T = [X0 + 525, Y0 + 168], TR = 60;
    const v = 24;
    V.alpha(ctx, V.ramp(st, 0, 0.6));
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
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(S[0] - SR, S[1]);
    ctx.lineTo(X0 + 34, gy);
    ctx.lineTo(X0 + CW - 34, gy);
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
    ctx.fillStyle = V.chrome(ctx, X0, 0, X0 + CW, 0);
    for (const gx of [X0 + 34, X0 + CW - 34]) {
      ctx.beginPath();
      ctx.arc(gx, gy - 9, 9, 0, TAU);
      ctx.fill();
    }

    // dust flap swings open
    const fo = V.ramp(st, 0.9, 0.8);
    V.alpha(ctx, 1 - fo * 0.75);
    ctx.fillStyle = '#26232a';
    V.rr(ctx, X0 + 18, Y0 + CH - 12 + fo * 26, CW - 36, 16 - fo * 8, 4);
    ctx.fill();

    // record-protect tab on the back edge
    V.alpha(ctx, V.ramp(st, 0.3, 0.6));
    ctx.fillStyle = '#34303a';
    ctx.fillRect(X0 + 44, Y0 - 7, 34, 10);
    ctx.strokeStyle = C.faint;
    ctx.lineWidth = 1;
    ctx.strokeRect(X0 + 44, Y0 - 7, 34, 10);

    // brake lever between the reels
    ctx.strokeStyle = C.chromeMid;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(S[0] + SR - 6, Y0 + 70);
    ctx.lineTo(X0 + CW / 2, Y0 + 50);
    ctx.lineTo(T[0] - TR - 20, Y0 + 70);
    ctx.stroke();

    // end-of-tape lamp: light fans out to the front corners
    const L = [X0 + CW / 2, Y0 + CH - 72];
    const pulse = 0.55 + 0.45 * Math.sin(t * 3);
    const la = V.ramp(st, 1.4, 0.8);
    if (la > 0) {
      for (const cx of [X0 + 22, X0 + CW - 22]) {
        const g = ctx.createLinearGradient(L[0], L[1], cx, gy);
        g.addColorStop(0, `rgba(255,236,190,${0.55 * pulse})`);
        g.addColorStop(1, 'rgba(255,236,190,0)');
        V.alpha(ctx, la);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(L[0], L[1] - 5);
        ctx.lineTo(cx, gy - 16);
        ctx.lineTo(cx, gy + 10);
        ctx.lineTo(L[0], L[1] + 5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#fff2cc';
      ctx.beginPath();
      ctx.arc(L[0], L[1], 9, 0, TAU);
      ctx.fill();
    }

    const calls = [
      { from: [S[0] - 50, S[1] + 70], to: [96, 590], text: 'Supply reel', sub: '246 m of tape' },
      { from: [X0 + 61, Y0 - 3], to: [260, 56], text: 'Record tab', sub: 'snap it off: no recording' },
      { from: [X0 + CW / 2, Y0 + 50], to: [560, 56], text: 'Spring brakes', sub: 'lock the reels until loaded' },
      { from: L, to: [440, 640], text: 'End-of-tape lamp', sub: 'shines through the clear leader' },
      { from: [T[0] + 20, T[1] + 56], to: [904, 590], text: 'Take-up reel', sub: 'empty at the start', align: 'right' },
    ];
    calls.forEach((c, i) => V.callout(ctx, { ...c, a: V.ramp(st, 0.7 + i * 0.35, 0.5) }));
  }

  /* ── steps 2–4 · the coating up close ──────────────── */
  const PERIOD = 1100;
  const CT = 300, CB = 450;
  const GAP_X = 500;
  const parts = [];
  {
    const r = V.rng(42);
    for (let i = 0; i < 760; i++) {
      parts.push({
        u: r() * PERIOD, y: CT + 8 + r() * (CB - CT - 16),
        len: 11 + r() * 8, tilt: (r() - 0.5) * 0.26, dir: r() < 0.5 ? -1 : 1, ph: r() * TAU,
      });
    }
  }
  const phi = (U) => (TAU * U) / 72 + 1.6 * Math.sin(U / 150) + 0.8 * Math.sin(U / 37);
  const mag = (U) => Math.tanh(4 * Math.sin(phi(U)));

  function layers(ctx, a, s) {
    V.alpha(ctx, a);
    ctx.fillStyle = C.coat;
    ctx.fillRect(40, CT, 920, CB - CT);
    ctx.save();
    ctx.beginPath();
    ctx.rect(40, CT, 920, CB - CT);
    ctx.clip();
    ctx.translate(-V.mod(s, 128), 0);
    ctx.fillStyle = V.grain(ctx);
    ctx.fillRect(40, CT, 1060, CB - CT);
    ctx.restore();
    const g = ctx.createLinearGradient(0, CB, 0, 600);
    g.addColorStop(0, '#303b48');
    g.addColorStop(1, '#1e252e');
    ctx.fillStyle = g;
    ctx.fillRect(40, CB, 920, 150);
    ctx.fillStyle = C.stage;
    ctx.beginPath();
    ctx.moveTo(40, 516);
    for (let x = 40, k = 0; x <= 960; x += 20, k++) ctx.lineTo(x, 516 + (k % 2 ? 5 : -5));
    for (let x = 960, k = 0; x >= 40; x -= 20, k++) ctx.lineTo(x, 534 + (k % 2 ? 5 : -5));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#171518';
    ctx.fillRect(40, 600, 920, 16);
    for (const [x0, x1] of [[40, 110], [960, 890]]) {
      const f = ctx.createLinearGradient(x0, 0, x1, 0);
      f.addColorStop(0, C.stage);
      f.addColorStop(1, 'rgba(11,10,12,0)');
      ctx.fillStyle = f;
      ctx.fillRect(Math.min(x0, x1), CT - 2, 70, 320);
    }
    V.label(ctx, 'Magnetic coating · ≈3 µm', 48, CT - 14, { color: C.ink });
    V.label(ctx, 'Polyester base · ≈15 µm (shortened)', 120, 494, { color: 'rgba(239,232,221,.75)' });
    V.label(ctx, 'Back coat · carbon, anti-static', 120, 646);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(860, CT - 18);
    ctx.lineTo(910, CT - 18);
    ctx.moveTo(860, CT - 24);
    ctx.lineTo(860, CT - 12);
    ctx.moveTo(910, CT - 24);
    ctx.lineTo(910, CT - 12);
    ctx.stroke();
    V.label(ctx, '1 µm', 885, CT - 32, { align: 'center', color: C.ink });
  }

  function particles(ctx, a, s, mode, t) {
    const pn = new Path2D();
    const ps = new Path2D();
    const dots = new Path2D();
    for (const p of parts) {
      const x = V.mod(p.u - s, PERIOD) - 50;
      if (x < 44 || x > 956) continue;
      let dir = p.dir;
      if (mode === 'read' || (mode === 'write' && x < GAP_X)) dir = mag(x + s) >= 0 ? 1 : -1;
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
  }

  function boundaries(ctx, a, s) {
    V.alpha(ctx, a);
    ctx.strokeStyle = 'rgba(239,232,221,.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    let prev = Math.sin(phi(44 + s));
    for (let x = 45; x < 956; x++) {
      const cur = Math.sin(phi(x + s));
      if ((cur >= 0) !== (prev >= 0)) {
        ctx.moveTo(x, CT);
        ctx.lineTo(x, CB);
      }
      prev = cur;
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function head(ctx, a, mode, s, t) {
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
    ctx.lineTo(392, 104);
    ctx.lineTo(370, 104);
    ctx.moveTo(hx - R - 16, hy + 36);
    ctx.lineTo(384, 140);
    ctx.lineTo(370, 140);
    ctx.stroke();

    const cur = mag(GAP_X + s);
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
        ctx.arc(hx + Math.cos(an) * R, hy + Math.sin(an) * R, 3.2, 0, TAU);
        ctx.fill();
      }
    }
  }

  function scope(ctx, a, s, mode) {
    const x = 40, y = 40, w = 330, h = 120;
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
    for (let gx = x + 30; gx < x + w; gx += 30) { ctx.moveTo(gx, y + 32); ctx.lineTo(gx, y + h - 8); }
    ctx.moveTo(x + 10, y + h / 2 + 12);
    ctx.lineTo(x + w - 10, y + h / 2 + 12);
    ctx.stroke();
    V.label(ctx, mode === 'write' ? 'Write current → coil' : 'Playback voltage ← coil', x + 14, y + 24, { size: 15, color: SCOPE_GREEN });
    const Ug = GAP_X + s;
    const cy = y + h / 2 + 12;
    ctx.strokeStyle = SCOPE_GREEN;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const span = w - 24;
    for (let px = 0; px <= span; px++) {
      const U = Ug - (span - px);
      let val = mode === 'write' ? mag(U) : (mag(U + 1.5) - mag(U - 1.5)) * 1.0;
      val = V.clamp(val, -1.25, 1.25);
      const yy = cy - val * 32;
      px ? ctx.lineTo(x + 12 + px, yy) : ctx.moveTo(x + 12 + px, yy);
    }
    ctx.stroke();
  }

  function legend(ctx, a, mode) {
    V.alpha(ctx, a);
    const y = 690;
    ctx.lineCap = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = C.north;
    ctx.beginPath(); ctx.moveTo(566, y - 6); ctx.lineTo(590, y - 6); ctx.stroke();
    V.label(ctx, 'N → right', 602, y, { size: 15 });
    ctx.strokeStyle = C.south;
    ctx.beginPath(); ctx.moveTo(730, y - 6); ctx.lineTo(754, y - 6); ctx.stroke();
    V.label(ctx, 'N ← left', 766, y, { size: 15 });
    if (mode === 'idle') V.label(ctx, 'Blank tape: random', 48, y, { size: 15, color: C.ink });
    else V.label(ctx, mode === 'write' ? 'Tape moving ←' : 'Recorded stripes moving ←', 48, y, { size: 15, color: C.ink });
  }

  function section(ctx, t, st, mode) {
    const s = mode === 'idle' ? 0 : t * 38;
    const a = V.ramp(st, 0, 0.6);
    layers(ctx, a, s);
    particles(ctx, V.ramp(st, 0.15, 0.8), s, mode, t);
    if (mode === 'read') boundaries(ctx, V.ramp(st, 0.8, 0.8), s);
    legend(ctx, a, mode);
    if (mode === 'idle') {
      V.callout(ctx, { from: [640, 356], to: [690, 170], text: 'Iron-oxide needles', sub: '≈0.3 µm long, set in glue', a: V.ramp(st, 0.7, 0.5) });
      V.callout(ctx, { from: [300, 410], to: [250, 170], text: 'Each one: a bar magnet', sub: 'pointing any which way', a: V.ramp(st, 1.1, 0.5), align: 'right' });
      return;
    }
    head(ctx, V.ramp(st, 0, 0.6), mode, s, t);
    scope(ctx, V.ramp(st, 0.3, 0.6), s, mode);
    if (mode === 'write') {
      V.callout(ctx, { from: [405, 140], to: [250, 206], text: 'Coil', a: V.ramp(st, 0.8, 0.5), align: 'right' });
      V.callout(ctx, { from: [GAP_X - 2, 295], to: [392, 262], text: 'Gap ≈ 0.3 µm', a: V.ramp(st, 1.1, 0.5), align: 'right' });
      V.callout(ctx, { from: [548, 336], to: [690, 196], text: 'Fringe field', sub: 'flips every needle it passes', a: V.ramp(st, 1.4, 0.5) });
    } else {
      V.callout(ctx, { from: [548, 336], to: [690, 196], text: 'Boundary = voltage', sub: 'no change, no signal', a: V.ramp(st, 1.0, 0.5) });
    }
  }

  /* ── step 5 · developer fluid reveals the tracks ───── */
  function reveal(ctx, t, st) {
    const top = 190, bot = 500;
    const aTop = top + 24, cBot = bot - 18;
    const vh = cBot - aTop;
    const ang = (18 * Math.PI) / 180;
    const L = vh / Math.tan(ang);
    const p = 36;
    const s = t * 12;
    const a = V.ramp(st, 0, 0.6);
    V.alpha(ctx, a);
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, '#80502e');
    g.addColorStop(0.5, '#6e4226');
    g.addColorStop(1, '#4e2e1a');
    ctx.fillStyle = g;
    ctx.fillRect(40, top, 920, bot - top);

    const rx = 40 + V.ease(V.clamp((st - 0.4) / 3.2)) * 940;
    ctx.save();
    ctx.beginPath();
    ctx.rect(40, top, V.clamp(rx - 40, 0, 920), bot - top);
    ctx.clip();
    ctx.fillStyle = 'rgba(20,12,8,.35)';
    ctx.fillRect(40, top, 920, bot - top);
    const i0 = Math.floor((40 - L - p - 40 + s) / p);
    const i1 = Math.ceil((960 - 40 + s) / p);
    for (let i = i0; i <= i1; i++) {
      const x = 40 + i * p - s;
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
      for (let x = 40; x <= 960; x += 6) {
        const w = Math.sin((x + s) * 0.09 + k) * 1.2;
        x === 40 ? ctx.moveTo(x, yy + w) : ctx.lineTo(x, yy + w);
      }
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,228,196,.55)';
    for (let i = i0 - (i0 % 2); i <= i1; i += 2) ctx.fillRect(40 + i * p - s, cBot + 4, 3, 10);
    ctx.restore();

    if (rx < 980) {
      const wg = ctx.createLinearGradient(rx - 50, 0, rx + 6, 0);
      wg.addColorStop(0, 'rgba(160,200,220,0)');
      wg.addColorStop(1, 'rgba(160,200,220,.35)');
      V.alpha(ctx, a);
      ctx.fillStyle = wg;
      ctx.fillRect(rx - 50, top, 56, bot - top);
    }

    V.label(ctx, 'Recorded tape, top view · after developer fluid', 40, 56, { color: C.ink });
    const la = (k) => V.ramp(st, 3.2 + k * 0.35, 0.5);
    V.callout(ctx, { from: [180, top + 11], to: [230, 128], text: 'Linear audio track', sub: 'along the top edge', a: la(0) });
    V.callout(ctx, { from: [600, 340], to: [640, 128], text: 'Video tracks', sub: 'one diagonal stripe per field', a: la(1) });
    V.callout(ctx, { from: [300, bot - 8], to: [350, 570], text: 'Control track', sub: 'one pulse per frame', a: la(2) });
    const qa = V.ramp(st, 4.4, 0.8);
    if (qa > 0) {
      V.alpha(ctx, qa);
      V.text(ctx, 'Why diagonal?', 960, 660, { fam: 'display', size: 44, weight: 800, stretch: 'expanded', color: C.a, align: 'right' });
    }
  }

  V.scenes.tape = {
    draw(ctx, { t, step, st }) {
      if (step === 0) filmVsTape(ctx, t, st);
      else if (step === 1) cassette(ctx, t, st);
      else if (step === 2) section(ctx, t, st, 'idle');
      else if (step === 3) section(ctx, t, st, 'write');
      else if (step === 4) section(ctx, t, st, 'read');
      else reveal(ctx, t, st);
    },
  };
})();
