/* Bookends: the cold open, the title, the chapter cards and the outro. */
(function () {
  const V = window.VHS;
  const C = V.C;
  const F = V.film;
  const TAU = Math.PI * 2;
  const W = F.W, H = F.H;

  /* ── a closed VHS cassette, seen from above ───────── */
  // Modelled on a real T-120 shell: the dust door across the front edge
  // (with its embossed "insert this side" text), a moulded grid texture, and
  // a band holding two end windows with the label recess between them.

  // fine moulded grid, as a repeating tile
  const shellTex = (() => {
    let pat = null;
    return (ctx) => {
      if (pat) return pat;
      const c = document.createElement('canvas');
      c.width = c.height = 4;
      const g = c.getContext('2d');
      g.fillStyle = 'rgba(255,255,255,0.07)';
      g.fillRect(0, 0, 4, 1);
      g.fillRect(0, 0, 1, 4);
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.fillRect(1, 3, 3, 1);
      g.fillRect(3, 1, 1, 3);
      pat = ctx.createPattern(c, 'repeat');
      return pat;
    };
  })();

  /** Reel seen through a window: clear flange, tape pack, toothed hub. */
  function reelView(ctx, x, y, h, pack, spin) {
    const fl = ctx.createRadialGradient(x, y, h * 0.05, x, y, h * 0.46);
    fl.addColorStop(0, '#77797f');
    fl.addColorStop(1, '#46484d');
    ctx.fillStyle = fl;
    ctx.beginPath();
    ctx.arc(x, y, h * 0.46, 0, TAU);
    ctx.fill();
    // tape pack: dark and glossy, it's rust on plastic after all
    const rp = V.lerp(0.09, 0.45, V.clamp(pack)) * h;
    const tp = ctx.createRadialGradient(x - rp * 0.3, y - rp * 0.3, rp * 0.1, x, y, rp);
    tp.addColorStop(0, '#4a2e1b');
    tp.addColorStop(0.7, '#2f1d11');
    tp.addColorStop(1, '#22150c');
    ctx.fillStyle = tp;
    ctx.beginPath();
    ctx.arc(x, y, rp, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,180,.06)';
    ctx.lineWidth = 1;
    for (let r = h * 0.1; r < rp; r += h * 0.035) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.stroke();
    }
    // the flange's three moulded spokes, turning with the reel
    ctx.strokeStyle = 'rgba(255,255,255,.12)';
    ctx.lineWidth = h * 0.035;
    ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      const an = spin + (k * TAU) / 3;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(an) * h * 0.1, y + Math.sin(an) * h * 0.1);
      ctx.lineTo(x + Math.cos(an) * h * 0.42, y + Math.sin(an) * h * 0.42);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
    // hub with its drive teeth
    const hr = h * 0.075;
    ctx.fillStyle = '#dcd8d0';
    ctx.beginPath();
    ctx.arc(x, y, hr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#26232a';
    ctx.beginPath();
    ctx.arc(x, y, hr * 0.58, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#dcd8d0';
    for (let k = 0; k < 6; k++) {
      const an = spin + (k * TAU) / 6;
      ctx.beginPath();
      ctx.arc(x + Math.cos(an) * hr * 0.58, y + Math.sin(an) * hr * 0.58, hr * 0.15, 0, TAU);
      ctx.fill();
    }
  }

  /** Handwriting that fits its label: one line, or two if it has to. */
  function marker(ctx, text, cx, cy, maxW, maxH) {
    const font = (sz) => `400 ${sz}px "Permanent Marker", "Archivo", cursive`;
    let size = maxH * 0.62;
    ctx.font = font(size);
    let lines = [text];
    if (ctx.measureText(text).width > maxW) {
      const one = (maxW / ctx.measureText(text).width) * size;
      const words = text.split(' ');
      if (one < maxH * 0.42 && words.length > 1) {
        const mid = Math.ceil(words.length / 2);
        lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
        size = maxH * 0.4;
        ctx.font = font(size);
        const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
        if (widest > maxW) size *= maxW / widest;
      } else size = one;
      ctx.font = font(size);
    }
    ctx.fillStyle = '#1f2f7a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, cx, cy + (i - (lines.length - 1) / 2) * size * 1.02));
  }

  /**
   * o: { x, y, w, rot, label, write (0..1 of label written), spin (reel angle),
   *      packL (0..1 how full the left reel is), a }
   */
  F.art.cassette = (ctx, o) => {
    const w = o.w || 520, h = w * 0.55;
    const Lx = -w / 2, Rx = w / 2, Ty = -h / 2, By = h / 2;
    const ins = w * 0.012;           // the door section is a touch narrower
    const doorB = Ty + h * 0.26;
    const flapB = Ty + h * 0.105;
    const a = o.a == null ? 1 : o.a;
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.rot || 0);

    const shell = new Path2D();
    shell.moveTo(Lx + ins + 8, Ty);
    shell.lineTo(Rx - ins - 8, Ty);
    shell.quadraticCurveTo(Rx - ins, Ty, Rx - ins, Ty + 8);
    shell.lineTo(Rx - ins, doorB);
    shell.lineTo(Rx, doorB + 5);
    shell.lineTo(Rx, By - 9);
    shell.quadraticCurveTo(Rx, By, Rx - 9, By);
    shell.lineTo(Lx + 9, By);
    shell.quadraticCurveTo(Lx, By, Lx, By - 9);
    shell.lineTo(Lx, doorB + 5);
    shell.lineTo(Lx + ins, doorB);
    shell.lineTo(Lx + ins, Ty + 8);
    shell.quadraticCurveTo(Lx + ins, Ty, Lx + ins + 8, Ty);
    shell.closePath();

    // drop shadow
    ctx.save();
    ctx.translate(10, 16);
    V.alpha(ctx, a * 0.55);
    ctx.fillStyle = '#000';
    ctx.fill(shell);
    ctx.restore();

    // black shell with its moulded grid
    V.alpha(ctx, a);
    const g = ctx.createLinearGradient(0, Ty, 0, By);
    g.addColorStop(0, '#262429');
    g.addColorStop(1, '#161518');
    ctx.fillStyle = g;
    ctx.fill(shell);
    ctx.save();
    ctx.clip(shell);
    ctx.fillStyle = shellTex(ctx);
    ctx.fillRect(Lx, Ty, w, h);
    const sheen = ctx.createLinearGradient(Lx, Ty, Rx * 0.2, By);
    sheen.addColorStop(0, 'rgba(255,255,255,.06)');
    sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(Lx, Ty, w, h);
    ctx.restore();
    ctx.strokeStyle = '#3f3b45';
    ctx.lineWidth = 1.5;
    ctx.stroke(shell);

    // dust door: a smooth strip along the front edge
    ctx.fillStyle = '#1e1c21';
    V.rr(ctx, Lx + ins + 1, Ty + 1, w - 2 * ins - 2, flapB - Ty, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(Lx + ins, flapB, w - 2 * ins, 1.5);
    ctx.fillStyle = 'rgba(255,255,255,.07)';
    ctx.fillRect(Lx + ins, flapB + 1.5, w - 2 * ins, 1);
    // embossed moulding text
    const fs = w * 0.021;
    const ty = Ty + h * 0.07;
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    ctx.font = `500 ${fs}px ${V.F.body}`;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'right';
    ctx.fillText('Insert this side into recorder', -w * 0.032, ty);
    ctx.textAlign = 'left';
    ctx.fillText('Do not touch the tape inside', w * 0.032, ty);
    ctx.beginPath();
    ctx.moveTo(0, ty - fs * 1.05);
    ctx.lineTo(fs * 0.75, ty);
    ctx.lineTo(-fs * 0.75, ty);
    ctx.closePath();
    ctx.fill();
    // the little VHS mark moulded into the door
    const mx = Rx - ins - w * 0.1, my = Ty + h * 0.022, mw = w * 0.074, mh = h * 0.062;
    ctx.strokeStyle = 'rgba(255,255,255,.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, mw, mh);
    ctx.font = `italic 900 ${mh * 0.6}px ${V.F.display}`;
    if ('fontStretch' in ctx) ctx.fontStretch = 'expanded';
    ctx.textAlign = 'center';
    ctx.fillText('VHS', mx + mw / 2, my + mh * 0.76);

    // the window band: two end windows, label recess between
    const c = h * 0.055;
    const bh = h * 0.54;
    ctx.fillStyle = '#1a191d';
    V.rr(ctx, -w * 0.484, c - bh / 2, w * 0.968, bh, bh / 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.08)';
    ctx.stroke();
    const wr = h * 0.235;
    const inner = w * 0.244, outer = w * 0.472;
    const win = (sgn) => {
      const pth = new Path2D();
      pth.moveTo(sgn * inner, c - wr);
      pth.lineTo(sgn * (outer - wr), c - wr);
      pth.arc(sgn * (outer - wr), c, wr, -Math.PI / 2, Math.PI / 2, sgn < 0);
      pth.lineTo(sgn * inner, c + wr);
      pth.closePath();
      return pth;
    };
    const pl = o.packL == null ? 0.75 : o.packL;
    for (const sgn of [-1, 1]) {
      const pth = win(sgn);
      ctx.save();
      ctx.clip(pth);
      ctx.fillStyle = '#0c0b0e';
      ctx.fillRect(sgn < 0 ? -outer : inner, c - wr, outer - inner, wr * 2);
      reelView(ctx, sgn * w * 0.285, c, h, sgn < 0 ? pl : 1 - pl, (o.spin || 0) + (sgn > 0 ? 0.7 : 0));
      const gl = ctx.createLinearGradient(0, c - wr, 0, c + wr);
      gl.addColorStop(0, 'rgba(255,255,255,.16)');
      gl.addColorStop(0.35, 'rgba(255,255,255,.03)');
      gl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(-w / 2, c - wr, w, wr * 2);
      ctx.restore();
      ctx.strokeStyle = 'rgba(0,0,0,.7)';
      ctx.lineWidth = 2;
      ctx.stroke(pth);
    }

    // label recess, with the home-made label in it
    const lx0 = -w * 0.222, lw = w * 0.444, ly0 = c - wr, lh = wr * 2;
    ctx.fillStyle = '#131215';
    V.rr(ctx, lx0, ly0, lw, lh, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.6)';
    ctx.stroke();
    const px = lx0 + w * 0.01, py = ly0 + h * 0.018, pw = lw - w * 0.02, ph = lh - h * 0.036;
    ctx.fillStyle = '#eee5d1';
    V.rr(ctx, px, py, pw, ph, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(214,72,60,.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 6, py + ph * 0.24);
    ctx.lineTo(px + pw - 6, py + ph * 0.24);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(90,140,200,.35)';
    ctx.lineWidth = 1;
    for (const f of [0.5, 0.76]) {
      ctx.beginPath();
      ctx.moveTo(px + 6, py + ph * f);
      ctx.lineTo(px + pw - 6, py + ph * f);
      ctx.stroke();
    }
    if (o.label) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, pw * (o.write == null ? 1 : o.write), ph);
      ctx.clip();
      ctx.translate(px + pw / 2, py + ph * 0.6);
      ctx.rotate(-0.025);
      marker(ctx, o.label, 0, 0, pw * 0.9, ph * 0.72);
      ctx.restore();
    }
    ctx.restore();
  };

  // the pile of home tapes used by the cold open and the outro
  const PILE = [
    { x: 478, y: 482, rot: -0.06, label: 'BIRTHDAY ’89', cue: 'bday' },
    { x: 802, y: 360, rot: 0.05, label: 'OUR WEDDING', cue: 'wedding' },
    { x: 520, y: 226, rot: -0.03, label: 'MOVIE NIGHT', cue: 'movies' },
  ];
  const PILE_W = 430;

  /** A film strip that slides out from behind the pile (the misconception). */
  function ghostFilm(ctx, s, a) {
    if (a <= 0) return;
    const y = 150, h = 120;
    const off = s.t * 70;
    const x0 = 700;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, y - 4, W - x0, h + 8);
    ctx.clip();
    const slide = (1 - V.easeOut(V.clamp(s.since('film') / 1.4))) * 560;
    ctx.translate(slide, 0);
    V.alpha(ctx, a * 0.9);
    ctx.fillStyle = '#131012';
    ctx.fillRect(x0, y, W - x0 + 600, h);
    for (let k = -1; k < 8; k++) {
      const x = x0 + k * 128 - (off % 128);
      F.art.filmFrame(ctx, x + 6, y + 22, 116, 76, k + Math.floor(off / 128));
    }
    ctx.fillStyle = 'rgba(230,220,205,.78)';
    for (let k = -1; k < 40; k++) {
      const x = x0 + k * 22 - (off % 22);
      V.rr(ctx, x, y + 6, 11, 9, 2);
      ctx.fill();
      V.rr(ctx, x, y + h - 15, 11, 9, 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function pile(ctx, s, o) {
    const cueOf = (c) => (o.cues ? s.since(c) : 99);
    // drawn back to front: the last tape to land sits on top
    PILE.forEach((p, i) => {
      const u = o.cues ? cueOf(p.cue) + (i === 0 ? 1.2 : 0) : 99;
      if (u < -0.6 && !(i === 0 && o.cues)) return;
      const k = i === 0 && o.cues ? 1 : V.clamp((u + 0.55) / 0.55);
      const drop = V.easeOut(k);
      let x = p.x, y = p.y - (1 - drop) * 420, rot = p.rot + (1 - drop) * 0.25, w = PILE_W;
      if (i === 0 && o.cues) {
        // the first tape starts centre stage and bigger, then shuffles aside for the next
        const m = V.ease(V.clamp((cueOf('wedding') + 0.6) / 0.6));
        x = V.lerp(640, p.x, m);
        y = V.lerp(360, p.y, m);
        rot = V.lerp(-0.02, p.rot, m);
        w = V.lerp(660, PILE_W, m);
      }
      const write = i === 0 && o.cues ? V.clamp(cueOf(p.cue) / 0.7) : V.clamp(u / 0.7);
      F.art.cassette(ctx, {
        x, y, w, rot,
        label: p.label, write, spin: o.spin ? o.spin(i) : s.t * 0.4, packL: o.packL == null ? 0.72 - i * 0.2 : o.packL, a: V.clamp(k * 3),
      });
    });
  }

  /* ── cold open ────────────────────────────────────── */
  F.scenes.open = (ctx, s) => {
    const narr = s.at('narr');
    if (s.lt < narr) {
      // black → static → PLAY
      const a = V.ramp(s.lt, 0.25, 0.5);
      V.alpha(ctx, a);
      V.crt.snow(ctx, 0, 0, W, H);
      if (s.lt > 1.0 && Math.floor(s.lt * 2.2) % 2 === 0) F.osd(ctx, 'PLAY ▶', 70, 90, { size: 52 });
      F.osd(ctx, 'CH 3', W - 70, H - 60, { size: 40, align: 'right' });
      return;
    }
    V.alpha(ctx, 1);
    const film = V.ramp(s.since('film'), 0, 0.6) * (1 - V.ramp(s.since('nope'), 0.1, 0.5));
    ghostFilm(ctx, s, film);
    pile(ctx, s, { cues: true });
    // "there isn't a single picture": the film strip tears away
    const tear = s.since('nope');
    if (tear > 0 && tear < 0.7) {
      V.alpha(ctx, (1 - tear / 0.7) * 0.6);
      V.crt.snow(ctx, 700, 150, W - 700, 120);
    }
  };

  /* ── title ────────────────────────────────────────── */
  function rgbSplit(ctx, draw, amt) {
    if (amt > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const base = ctx._base == null ? 1 : ctx._base;
      ctx.globalAlpha = 0.6 * amt * base;
      ctx.translate(-9 * amt, 0);
      draw('#ff2a55');
      ctx.translate(18 * amt, 2 * amt);
      draw('#2ad4ff');
      ctx.restore();
    }
    draw(null);
  }

  F.scenes.title = (ctx, s) => {
    const out = 1 - V.ramp(s.lt, s.dur - 0.5, 0.5);
    F.art.tracks(ctx, s.t, out, { alpha: 0.09 });
    const a = V.ramp(s.lt, 0.05, 0.4) * out;
    const jit = Math.max(0, 1 - s.lt / 0.7);
    V.alpha(ctx, a);
    rgbSplit(ctx, (col) => {
      V.text(ctx, 'INSIDE THE', W / 2, 262, { fam: 'display', size: 50, weight: 800, stretch: 'expanded', color: col || C.ink, align: 'center' });
      V.text(ctx, 'VHS TAPE', W / 2 + 6, 420, { fam: 'display', size: 158, weight: 900, stretch: 'expanded', italic: true, color: col || C.ink, align: 'center' });
    }, jit);
    const u = V.ease(V.clamp((s.lt - 0.35) / 0.8));
    V.alpha(ctx, a);
    ctx.fillStyle = C.oxideHi;
    ctx.fillRect(W / 2 - 330 * u, 446, 660 * u, 7);
    V.alpha(ctx, V.ramp(s.lt, 0.9, 0.7) * out);
    V.text(ctx, 'How a ribbon of rust holds a movie', W / 2, 512, { fam: 'body', size: 30, italic: true, color: C.mute, align: 'center' });
  };

  /* ── chapter card ─────────────────────────────────── */
  const WORDS = ['', 'ONE', 'TWO', 'THREE'];
  F.scenes.card = (ctx, s) => {
    const out = 1 - V.ramp(s.lt, s.dur - 0.35, 0.35);
    F.art.tracks(ctx, s.t, out, { alpha: 0.06 });
    V.alpha(ctx, out);
    F.osd(ctx, 'PLAY ▶', 70, 84);
    F.osd(ctx, F.timecode(s.t), W - 70, 84, { align: 'right' });
    const a = V.ramp(s.lt, 0.05, 0.35) * out;
    const jit = Math.max(0, 1 - s.lt / 0.5);
    V.alpha(ctx, a);
    V.text(ctx, `PART ${WORDS[s.shot.part]}`, W / 2, 300, { fam: 'osd', size: 46, color: C.a, align: 'center' });
    rgbSplit(ctx, (col) => {
      V.text(ctx, V.upper(s.shot.title), W / 2 + 5, 425, { fam: 'display', size: 128, weight: 900, stretch: 'expanded', italic: true, color: col || C.ink, align: 'center' });
    }, jit);
    const u = V.ease(V.clamp((s.lt - 0.25) / 0.7));
    V.alpha(ctx, a);
    ctx.fillStyle = C.oxideHi;
    ctx.fillRect(W / 2 - 250 * u, 452, 500 * u, 6);
  };

  /* ── outro ────────────────────────────────────────── */
  // a wall of tapes stacked flat, spines out (a VHS spine is 187 × 25 mm)
  const SHELF = (() => {
    const r = V.rng(77);
    const out = [];
    const names = ['XMAS 91', 'SUPER BOWL', 'CARTOONS', 'GRADUATION', 'BEACH TRIP', 'DO NOT TAPE OVER', 'NEW YEAR', 'SOCCER FINAL', 'ROAD TRIP', 'MOM + DAD', 'THE PROM', 'BABY’S 1ST STEPS', 'TOP GUN (TV)', 'RECITAL 93', 'GRANDMA', 'WORKOUT'];
    const SW = 230, SH = 31;
    for (let col = -1; col * (SW + 18) < W + SW; col++) {
      const x0 = col * (SW + 18) + 6 + (col % 2 ? 10 : 0);
      for (let row = 0; row * (SH + 3) < 740; row++) {
        out.push({
          x: x0 + (r() - 0.5) * 12, y: 8 + row * (SH + 3), w: SW, h: SH,
          label: r() < 0.82 ? names[Math.floor(r() * names.length)] : null,
          shade: 0.8 + r() * 0.4, paper: r() < 0.5 ? '#ddd3bf' : '#e9e4d8',
        });
      }
    }
    return out;
  })();

  function shelf(ctx, a) {
    if (a <= 0) return;
    ctx.font = '400 15px "Permanent Marker", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const sp of SHELF) {
      V.alpha(ctx, a * 0.45);
      ctx.fillStyle = `rgb(${24 * sp.shade},${22 * sp.shade},${27 * sp.shade})`;
      V.rr(ctx, sp.x, sp.y, sp.w, sp.h, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.fillRect(sp.x + 6, sp.y + 4, 8, sp.h - 8); // record-tab notch end
      if (!sp.label) continue;
      V.alpha(ctx, a * 0.3);
      ctx.fillStyle = sp.paper;
      V.rr(ctx, sp.x + 22, sp.y + 5, sp.w - 32, sp.h - 10, 2);
      ctx.fill();
      ctx.fillStyle = '#1f2f7a';
      ctx.fillText(sp.label, sp.x + 6 + sp.w / 2, sp.y + sp.h / 2 + 1);
    }
  }

  F.scenes.outro = (ctx, s) => {
    const rw = s.since('rewind');
    const endAt = Math.max(s.at('end') + 0.7, s.at('rewind') + 3.6);
    const card = V.ease(V.clamp((s.lt - endAt) / 0.8));
    shelf(ctx, V.ramp(s.since('tapes'), 0, 1.4) * (1 - card));
    // reels rewind fast on "Rewind", then stop with a clunk
    const rewinding = rw > 0.2 && rw < 3.4;
    const spin = (i) => (rw > 0.2 ? -Math.pow(V.clamp((rw - 0.2) / 3.2), 0.8) * 60 : s.t * 0.4) - i;
    const pack = rw > 0.2 ? V.lerp(0.25, 1, V.ease(V.clamp((rw - 0.2) / 3.2))) : 0.25;
    V.alpha(ctx, 1 - card);
    // _base is our own crossfade level, not canvas state, so restore it by hand
    const base = ctx._base == null ? 1 : ctx._base;
    ctx._base = base * (1 - card);
    pile(ctx, s, { cues: false, spin, packL: pack });
    ctx._base = base;
    if (rewinding && card < 1) {
      V.alpha(ctx, 1 - card);
      if (Math.floor(rw * 2.4) % 2 === 0) F.osd(ctx, '◀◀ REW', 70, 90, { size: 48 });
      const left = Math.max(0, 7090 * (1 - V.ease(V.clamp((rw - 0.2) / 3.1))));
      F.osd(ctx, F.timecode(left), W - 70, H - 60, { size: 44, align: 'right' });
    } else if (rw >= 3.4 && card < 1) {
      V.alpha(ctx, 1 - card);
      F.osd(ctx, 'STOP ■', 70, 90, { size: 48 });
      F.osd(ctx, '0:00:00', W - 70, H - 60, { size: 44, align: 'right' });
    }
    if (card > 0) {
      V.alpha(ctx, card);
      F.art.tracks(ctx, s.t, card, { alpha: 0.06 });
      V.alpha(ctx, card);
      V.text(ctx, 'BE KIND.', W / 2, 330, { fam: 'display', size: 104, weight: 900, stretch: 'expanded', italic: true, color: C.ink, align: 'center' });
      V.text(ctx, 'REWIND.', W / 2, 452, { fam: 'display', size: 104, weight: 900, stretch: 'expanded', italic: true, color: C.a, align: 'center' });
      V.alpha(ctx, card * V.ramp(s.lt - endAt, 0.9, 0.8));
      F.lab(ctx, 'Inside the VHS Tape', W / 2, 560, { align: 'center', size: 20, spacing: 4, color: C.mute });
    }
  };
})();
