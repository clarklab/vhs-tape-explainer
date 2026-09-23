/* Deck controller: slides, beats (builds within a slide), keyboard/touch,
   auto-advance, and the render loop that drives each slide's canvas scene. */
(function () {
  const VHS = window.VHS;
  const slides = [...document.querySelectorAll('.slide')];
  const tabs = [...document.querySelectorAll('.tab[data-go]')];
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const autoBtn = document.getElementById('auto');
  const progress = document.getElementById('progress');
  const counter = document.getElementById('counter');
  const BEAT_SECONDS = 12;
  const FADE_MS = VHS.reduced ? 0 : 420;
  const SPEED = VHS.reduced ? 0.35 : 1;

  const deck = slides.map((el) => {
    const canvas = el.querySelector('canvas');
    const d = {
      el,
      id: el.id,
      scene: VHS.scenes[el.dataset.scene],
      beats: [...el.querySelectorAll('.beat')],
      note: el.querySelector('.stage-note'),
      canvas,
      ctx: canvas.getContext('2d'),
      w: 0, h: 0, dpr: 1,
    };
    new ResizeObserver(() => sizeCanvas(d)).observe(el.querySelector('.stage'));
    return d;
  });

  function sizeCanvas(d) {
    const r = d.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    d.w = r.width; d.h = r.height; d.dpr = dpr;
    d.canvas.width = Math.max(1, Math.round(r.width * dpr));
    d.canvas.height = Math.max(1, Math.round(r.height * dpr));
  }

  // progress bar: one group per slide, one segment per beat
  deck.forEach((d, i) => {
    const g = document.createElement('div');
    g.className = 'grp';
    g.style.setProperty('--n', d.beats.length);
    d.beats.forEach(() => {
      const s = document.createElement('span');
      s.className = 'seg';
      g.appendChild(s);
    });
    progress.appendChild(g);
    d.segs = [...g.children];
  });

  let cur = -1;
  let step = 0;
  let stepStart = performance.now();
  let fade = null; // { step, start, until } crossfade from the previous beat
  let auto = false;

  function go(i, s = 0) {
    i = VHS.clamp(i, 0, deck.length - 1);
    s = VHS.clamp(s, 0, deck[i].beats.length - 1);
    if (i === cur && s === step) return;
    const now = performance.now();
    if (i === cur && FADE_MS) fade = { step, start: stepStart, until: now + FADE_MS };
    else fade = null;
    const changedSlide = i !== cur;
    cur = i;
    step = s;
    stepStart = now;

    deck.forEach((d, k) => {
      d.el.classList.toggle('is-current', k === cur);
      d.el.classList.toggle('is-before', k < cur);
      d.el.setAttribute('aria-hidden', k === cur ? 'false' : 'true');
      d.el.inert = k !== cur;
    });
    tabs.forEach((t) => t.setAttribute('aria-current', String(+t.dataset.go === cur)));

    const d = deck[cur];
    d.el.dataset.step = String(step);
    d.beats.forEach((b, k) => {
      b.classList.toggle('is-active', k === step);
      b.classList.toggle('is-past', k < step);
      b.querySelector('button').setAttribute('aria-current', k === step ? 'step' : 'false');
    });
    d.note.textContent = d.beats[step].dataset.note || '';
    if (changedSlide && !d.w) sizeCanvas(d);
    if (d.scene && d.scene.onStep) d.scene.onStep(step, d.el);

    deck.forEach((dd, k) =>
      dd.segs.forEach((seg, j) => {
        const done = k < cur || (k === cur && j < step);
        seg.classList.toggle('done', done);
        seg.classList.toggle('now', k === cur && j === step);
      })
    );
    counter.textContent = `SLIDE ${cur + 1}/${deck.length} · STEP ${step + 1}/${d.beats.length}`;
    prevBtn.disabled = cur === 0 && step === 0;
    nextBtn.disabled = isLast();

    try { history.replaceState(null, '', '#' + d.id); } catch (e) {}
    // keep the active beat in view inside the copy column (desktop layout only;
    // on phones the stage sits above the copy and should stay on screen)
    const copy = d.el.querySelector('.copy');
    if (window.innerWidth > 880) {
      if (changedSlide) copy.scrollTop = 0;
      else {
        const b = d.beats[step];
        const top = b.offsetTop - copy.offsetTop;
        if (top < copy.scrollTop || top + b.offsetHeight > copy.scrollTop + copy.clientHeight) {
          copy.scrollTo({ top: Math.max(0, top - 60), behavior: VHS.reduced ? 'auto' : 'smooth' });
        }
      }
    }
  }

  const isLast = () => cur === deck.length - 1 && step === deck[cur].beats.length - 1;
  function next() {
    if (step < deck[cur].beats.length - 1) go(cur, step + 1);
    else if (cur < deck.length - 1) go(cur + 1, 0);
    else setAuto(false);
  }
  function prev() {
    if (step > 0) go(cur, step - 1);
    else if (cur > 0) go(cur - 1, deck[cur - 1].beats.length - 1);
  }
  function setAuto(on) {
    auto = on;
    if (on) stepStart = performance.now();
    autoBtn.setAttribute('aria-pressed', String(on));
    autoBtn.querySelector('.tbtn-i').textContent = on ? '❚❚' : '▶';
    autoBtn.querySelector('.tbtn-l').textContent = on ? 'PAUSE' : 'PLAY';
    if (on && isLast()) go(0, 0);
  }

  // ── wiring ───────────────────────────────────────────
  prevBtn.addEventListener('click', () => { setAuto(false); prev(); });
  nextBtn.addEventListener('click', () => { setAuto(false); next(); });
  autoBtn.addEventListener('click', () => setAuto(!auto));
  document.querySelectorAll('[data-go]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.preventDefault();
      setAuto(false);
      go(+el.dataset.go, 0);
    })
  );
  deck.forEach((d, i) =>
    d.beats.forEach((b, j) =>
      b.querySelector('button').addEventListener('click', () => { setAuto(false); go(i, j); })
    )
  );

  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); setAuto(false); next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); setAuto(false); prev(); }
    else if (k === 'Home') { setAuto(false); go(0, 0); }
    else if (k === 'End') { setAuto(false); go(deck.length - 1, deck[deck.length - 1].beats.length - 1); }
    else if (k >= '1' && k <= String(deck.length)) { setAuto(false); go(+k - 1, 0); }
    else if (k === 'p' || k === 'P') setAuto(!auto);
  });

  let touch = null;
  const slidesEl = document.getElementById('slides');
  slidesEl.addEventListener('touchstart', (e) => {
    if (e.target.closest('input')) return;
    const p = e.changedTouches[0];
    touch = { x: p.clientX, y: p.clientY };
  }, { passive: true });
  slidesEl.addEventListener('touchend', (e) => {
    if (!touch) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - touch.x;
    const dy = p.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) {
      setAuto(false);
      dx < 0 ? next() : prev();
    }
  }, { passive: true });

  // ── render loop ──────────────────────────────────────
  function frame(now) {
    const d = deck[cur];
    if (d && d.scene && d.w) {
      const { ctx, dpr } = d;
      const s = Math.min(d.w / VHS.W, d.h / VHS.H);
      const ox = (d.w - VHS.W * s) / 2;
      const oy = (d.h - VHS.H * s) / 2;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = VHS.C.stage;
      ctx.fillRect(0, 0, d.w, d.h);
      ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
      const t = (now / 1000) * SPEED;
      const st = ((now - stepStart) / 1000) * SPEED;
      if (fade && now < fade.until) {
        const k = VHS.ease((now - (fade.until - FADE_MS)) / FADE_MS);
        ctx._base = 1 - k;
        ctx.save();
        d.scene.draw(ctx, { t, step: fade.step, st: ((now - fade.start) / 1000) * SPEED });
        ctx.restore();
        ctx._base = k;
      } else {
        fade = null;
        ctx._base = 1;
      }
      ctx.save();
      d.scene.draw(ctx, { t, step, st });
      ctx.restore();
      ctx._base = 1;
    }
    if (auto) {
      const p = VHS.clamp((now - stepStart) / (BEAT_SECONDS * 1000));
      const seg = deck[cur].segs[step];
      if (seg) seg.style.setProperty('--p', p.toFixed(4));
      if (p >= 1) next();
    } else {
      const seg = deck[cur] && deck[cur].segs[step];
      if (seg) seg.style.setProperty('--p', '1');
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('hashchange', () => {
    const i = deck.findIndex((d) => '#' + d.id === location.hash);
    if (i >= 0 && i !== cur) { setAuto(false); go(i, 0); }
  });

  const fromHash = deck.findIndex((d) => '#' + d.id === location.hash);
  go(fromHash < 0 ? 0 : fromHash, 0);
  deck.forEach(sizeCanvas);
  requestAnimationFrame(frame);
})();
