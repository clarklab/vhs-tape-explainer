/* A tiny software "CRT": colour bars rendered at low resolution, run
   through VHS-style colour smear, snow, and head-switching jitter. */
(function () {
  const V = window.VHS;
  const TW = 192, TH = 144;

  function bars() {
    const d = new Float32Array(TW * TH * 3);
    const top = [[191, 191, 191], [191, 191, 0], [0, 191, 191], [0, 191, 0], [191, 0, 191], [191, 0, 0], [0, 0, 191]];
    const mid = [[0, 0, 191], [19, 19, 19], [191, 0, 191], [19, 19, 19], [0, 191, 191], [19, 19, 19], [191, 191, 191]];
    const low = [[0, 33, 76], [255, 255, 255], [50, 0, 106], [19, 19, 19], [19, 19, 19], [9, 9, 9], [29, 29, 29]];
    for (let y = 0; y < TH; y++) {
      const set = y < TH * 0.67 ? top : y < TH * 0.75 ? mid : low;
      for (let x = 0; x < TW; x++) {
        let k = Math.floor((x / TW) * 7);
        if (set === low) k = x < TW * 0.18 ? 0 : x < TW * 0.36 ? 1 : x < TW * 0.54 ? 2 : x < TW * 0.71 ? 3 : x < TW * 0.76 ? 5 : x < TW * 0.81 ? 4 : x < TW * 0.86 ? 6 : 3;
        const c = set[k];
        const i = (y * TW + x) * 3;
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
      }
    }
    return d;
  }

  /** Keep brightness fairly sharp, blur + delay colour: VHS "colour-under". */
  function vhsify(src, chromaR, shift, lumaSoft) {
    const out = new Uint8ClampedArray(TW * TH * 4);
    const Y = new Float32Array(TW), I = new Float32Array(TW), Q = new Float32Array(TW);
    for (let y = 0; y < TH; y++) {
      for (let x = 0; x < TW; x++) {
        const i = (y * TW + x) * 3;
        const r = src[i], g = src[i + 1], b = src[i + 2];
        Y[x] = 0.299 * r + 0.587 * g + 0.114 * b;
        I[x] = 0.596 * r - 0.274 * g - 0.322 * b;
        Q[x] = 0.211 * r - 0.523 * g + 0.312 * b;
      }
      for (let x = 0; x < TW; x++) {
        let yy = 0, wsum = 0;
        for (let k = -lumaSoft; k <= lumaSoft; k++) {
          const w = lumaSoft + 1 - Math.abs(k);
          yy += Y[V.clamp(x + k, 0, TW - 1)] * w;
          wsum += w;
        }
        yy /= wsum;
        let ii = 0, qq = 0, n = 0;
        for (let k = -chromaR; k <= chromaR; k++) {
          const sx = V.clamp(x - shift + k, 0, TW - 1);
          ii += I[sx];
          qq += Q[sx];
          n++;
        }
        ii /= n; qq /= n;
        const o = (y * TW + x) * 4;
        out[o] = yy + 0.956 * ii + 0.621 * qq;
        out[o + 1] = yy - 0.272 * ii - 0.647 * qq;
        out[o + 2] = yy - 1.106 * ii + 1.703 * qq;
        out[o + 3] = 255;
      }
    }
    return out;
  }

  const raw = bars();
  const CLEAN = vhsify(raw, 3, 1, 1);
  const SMEAR = vhsify(raw, 10, 4, 2);

  const cv = document.createElement('canvas');
  cv.width = TW;
  cv.height = TH;
  const cx = cv.getContext('2d');
  const img = cx.createImageData(TW, TH);

  /**
   * o.noise(yFrac) → 0..1 snow per row, o.hs → head-switch strength,
   * o.smear → heavy colour-under, o.t → seconds.
   */
  function render(o) {
    const src = o.smear ? SMEAR : CLEAN;
    const d = img.data;
    const hsRows = 6;
    for (let y = 0; y < TH; y++) {
      const n = o.noise ? o.noise(y / TH) : 0;
      let shift = n > 0.08 ? Math.round((Math.random() - 0.5) * n * 10) : 0;
      const hsRow = y >= TH - hsRows;
      if (hsRow) shift += Math.round((o.hs || 0) * (7 + Math.sin(o.t * 23 + y * 1.7) * 4));
      let run = 0, runV = 0;
      const row = y * TW;
      for (let x = 0; x < TW; x++) {
        const sx = V.clamp(x - shift, 0, TW - 1);
        const si = (row + sx) * 4;
        const di = (row + x) * 4;
        let r = src[si], g = src[si + 1], b = src[si + 2];
        if (hsRow && o.hs && sx !== x - shift) { r = g = b = 12; }
        if (n > 0.02) {
          if (run > 0) run--;
          else if (Math.random() < n * 0.55) {
            run = 1 + Math.floor(Math.random() * (2 + n * 7));
            runV = Math.random() < 0.55 ? 225 + Math.random() * 30 : 20 + Math.random() * 60;
          } else runV = -1;
          if (run > 0 && runV >= 0) {
            const m = 0.45 + 0.55 * n;
            r = r * (1 - m) + runV * m;
            g = g * (1 - m) + runV * m;
            b = b * (1 - m) + runV * m;
          } else if (n > 0.5) {
            const k = 1 - (n - 0.5);
            r *= k; g *= k; b *= k;
          }
        }
        d[di] = r; d[di + 1] = g; d[di + 2] = b; d[di + 3] = 255;
      }
    }
    cx.putImageData(img, 0, 0);
    return cv;
  }

  V.tv = {
    TW, TH,
    canvas: cv,
    /** Draw the picture into (x, y, w, h), with scanlines and a glass vignette. */
    draw(ctx, x, y, w, h, o) {
      const c = render(o);
      ctx.save();
      V.rr(ctx, x, y, w, h, 26);
      ctx.clip();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(c, x, y, w, h);
      ctx.fillStyle = 'rgba(0,0,0,.2)';
      for (let yy = y; yy < y + h; yy += 3) ctx.fillRect(x, yy, w, 1.2);
      const g = ctx.createRadialGradient(x + w / 2, y + h / 2, h * 0.3, x + w / 2, y + h / 2, h * 0.9);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,.6)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      const gl = ctx.createLinearGradient(x, y, x + w * 0.6, y + h * 0.6);
      gl.addColorStop(0, 'rgba(255,255,255,.10)');
      gl.addColorStop(0.5, 'rgba(255,255,255,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    },
  };
})();
