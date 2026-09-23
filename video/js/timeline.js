/* Turns the shot list plus narration timings into an absolute timeline.
   Works with or without generated narration: without it, speech timing is
   estimated from word count so the picture can be previewed on its own. */
(function (G) {
  const WPM = 155;
  const CUE = /\[\[(\w+)\]\]/g;

  /** Strip [[cue]] markers; return clean text and each cue's character index. */
  function parse(text) {
    text = text.replace(/\s+/g, ' ').trim();
    let clean = '';
    const cues = [];
    let last = 0;
    text.replace(CUE, (m, name, at) => {
      clean += text.slice(last, at);
      last = at + m.length;
      cues.push({ name, index: clean.length });
      return m;
    });
    clean += text.slice(last);
    // a cue sits on the next non-space character
    for (const c of cues) while (clean[c.index] === ' ') c.index++;
    return { clean, cues };
  }

  function estimate(clean, cues) {
    const words = clean.split(' ');
    const speech = (words.length / WPM) * 60;
    const out = {};
    for (const c of cues) out[c.name] = (c.index / clean.length) * speech;
    let pos = 0;
    const w = words.map((word) => {
      const s = (pos / clean.length) * speech;
      pos += word.length + 1;
      return { w: word, s, e: (pos / clean.length) * speech - 0.05 };
    });
    return { speech, cues: out, words: w, estimated: true };
  }

  function build(script, narration) {
    const shots = [];
    let t = 0;
    let estimated = false;
    for (const src of script.shots) {
      const s = Object.assign({}, src);
      s.start = t;
      s.cueT = { start: 0 };
      if (src.text) {
        const p = parse(src.text);
        s.clean = p.clean;
        const n = (narration && narration[src.id]) || estimate(p.clean, p.cues);
        if (n.estimated) estimated = true;
        s.pre = src.pre == null ? 0.45 : src.pre;
        s.post = src.post == null ? 0.65 : src.post;
        s.speech = n.speech;
        s.words = n.words;
        s.audio = n.estimated ? null : n.file;
        s.narrAt = s.start + s.pre;
        s.dur = s.pre + n.speech + s.post;
        s.cueT.narr = s.pre;
        s.cueT.end = s.pre + n.speech;
        for (const c of p.cues) {
          const v = n.cues[c.name];
          s.cueT[c.name] = s.pre + (v == null ? 0 : v);
        }
      } else {
        s.dur = src.dur;
        s.cueT.end = src.dur;
      }
      s.end = s.start + s.dur;
      t = s.end;
      shots.push(s);
    }
    return { shots, duration: t, fps: script.fps || 30, estimated };
  }

  /** Local time of a cue (a name or a number of seconds) in a shot. */
  function cueTime(shot, at) {
    if (typeof at === 'number') return at;
    const v = shot.cueT[at];
    if (v == null) throw new Error(`Shot "${shot.id}" has no cue "${at}"`);
    return v;
  }

  /** Subtitle lines from the spoken words: [{ a, b, text }] in video time.
      Each sentence is split into evenly sized lines of ≤ ~42 characters,
      breaking at commas where possible. */
  function captions(timeline) {
    const out = [];
    const len = (ws) => ws.map((w) => w.w).join(' ').length;
    for (const s of timeline.shots) {
      if (!s.words) continue;
      const sentences = [];
      let cur = [];
      s.words.forEach((w) => {
        cur.push(w);
        if (/[.?!]$/.test(w.w)) { sentences.push(cur); cur = []; }
      });
      if (cur.length) sentences.push(cur);
      const lines = [];
      for (const sen of sentences) {
        const total = len(sen);
        const k = Math.ceil(total / 42);
        const target = total / k;
        let line = [];
        sen.forEach((w, i) => {
          line.push(w);
          const l = len(line);
          const next = sen[i + 1];
          if (!next || lines.length + 1 >= 999) return;
          const left = len(sen.slice(i + 1));
          if (left < 14) return; // keep short endings attached
          if ((/[,:;]$/.test(w.w) && l >= target * 0.55) || l + next.w.length + 1 > target + 6) {
            lines.push(line);
            line = [];
          }
        });
        if (line.length) lines.push(line);
      }
      lines.forEach((line, i) => {
        const next = lines[i + 1];
        const a = s.narrAt + line[0].s;
        let b = s.narrAt + line[line.length - 1].e + 0.35;
        if (next) b = Math.min(b, s.narrAt + next[0].s - 0.02);
        out.push({ a, b, text: line.map((w) => w.w).join(' ') });
      });
    }
    return out;
  }

  G.VHS_TIMELINE = { parse, build, cueTime, captions, WPM };
})(typeof globalThis !== 'undefined' ? globalThis : window);
