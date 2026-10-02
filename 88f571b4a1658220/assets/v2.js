/* RAVIVA v2 · o papel (sol guardado) pega fogo com a rolagem e revela o escuro aceso.
   Sem bibliotecas. Reduced-motion: sem queima, as duas telas ficam empilhadas (CSS). */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => 1 - Math.pow(1 - t, 2.2);

  const stage = $('#stage'), fire = $('#fire'), cv = $('#edge'), top = $('#top'), fab = $('#fab');
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener('resize', size);

  // borda irregular por ruído de valor (fbm), não por senoides regulares: parece papel, não onda
  const perm = Array.from({ length: 512 }, (_, i) => { const r = Math.sin(i * 127.1 + 311.7) * 43758.5453; return r - Math.floor(r); });
  const vn = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return perm[i & 511] * (1 - u) + perm[(i + 1) & 511] * u; };
  const fbm = x => { let s = 0, a = .5, fr = 1; for (let o = 0; o < 5; o++) { s += a * vn(x * fr); a *= .5; fr *= 2.07; } return s - .48; };
  const edgePts = (R, t, cx, cy) => {
    const pts = [], N = 260;
    for (let i = 0; i <= N; i++) {
      const u = i / N, ang = Math.PI + u * Math.PI;
      const n = fbm(u * 9 + t * .18) * .28 + fbm(u * 37 + 40 + t * .5) * .06;
      const r = R * (1 + n);
      pts.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]);
    }
    return pts;
  };
  const sparks = [];
  let q = 0, t0 = performance.now();
  const fireIn = $('.fire-in'), lines = $$('.fire-in .w');

  function frame(now) {
    const t = (now - t0) / 1000;
    const r = stage.getBoundingClientRect(), span = r.height - innerHeight;
    const p = clamp(-r.top / span, 0, 1);
    q = clamp((p - .1) / .62, 0, 1);
    const cx = W * .5, cy = H * 1.1, Rmax = Math.hypot(W * .62, H * 1.2) * 1.25, R = ease(q) * Rmax;
    ctx.clearRect(0, 0, W, H);
    // a frase só aparece depois que o buraco passa da metade; a 2ª linha acende palavra por palavra
    fireIn.style.opacity = clamp((q - .22) / .25, 0, 1).toFixed(3);
    const lit = 1 + clamp((p - .42) / .4, 0, 1) * (lines.length - 1);
    lines.forEach((w, i) => w.classList.toggle('on', i < lit));
    if (q <= 0) { fire.style.clipPath = 'circle(0 at 50% 110%)'; }
    else if (q >= 1) { fire.style.clipPath = 'none'; }
    else {
      const pts = edgePts(R, t, cx, cy);
      fire.style.clipPath = 'polygon(' + pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',') + `,${W}px ${H + 40}px,0px ${H + 40}px)`;
      const path = (d, sd) => { ctx.beginPath(); pts.forEach(([x, y], i) => { const vx = x - cx, vy = y - cy, m = Math.hypot(vx, vy) || 1, dd = d * (.35 + 1.3 * Math.max(0, fbm(i * .045 + sd) + .5)), X = x + vx / m * dd, Y = y + vy / m * dd; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); };
      ctx.lineJoin = 'round';
      // papel tostando antes de abrir: faixas de carvão por fora da borda, cada vez mais escuras
      [[64, 'rgba(110,72,36,.09)', 3.1], [40, 'rgba(84,50,22,.16)', 7.7], [24, 'rgba(48,26,12,.42)', 13.3], [10, 'rgba(20,11,6,.85)', 21.9]].forEach(([d, c, sd]) => { path(d * .5, sd); ctx.strokeStyle = c; ctx.lineWidth = d; ctx.stroke(); });
      // grão de carvão: pontinhos escuros espalhados logo acima da borda
      ctx.fillStyle = 'rgba(30,16,8,.35)'; for (let s = 0; s < 140; s++) { const P = pts[(s * 97) % pts.length], k = fbm(s * .7 + t * .02) + .5; const vx = P[0] - cx, vy = P[1] - cy, m = Math.hypot(vx, vy) || 1, d = 6 + 34 * k; ctx.fillRect(P[0] + vx / m * d, P[1] + vy / m * d, 1.4, 1.4); }
      // brasa fina e de espessura variável
      ctx.save(); ctx.shadowColor = 'rgba(255,110,20,.9)'; ctx.shadowBlur = 8;
      for (let s = 0; s < pts.length - 1; s++) {
        const A = pts[s], B = pts[s + 1], g = clamp(.5 + .5 * Math.sin(s * .9 + t * 7) + fbm(s * .13 + t), 0, 1);
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]);
        ctx.strokeStyle = `rgba(255,${(120 + 90 * g) | 0},40,${(.45 + .55 * g).toFixed(2)})`; ctx.lineWidth = .7 + 2.4 * g; ctx.stroke();
      }
      ctx.restore();
      if (!reduce && Math.random() < .5 && sparks.length < 60) { const [x, y] = pts[(Math.random() * pts.length) | 0]; if (y > 0 && y < H) sparks.push({ x, y, vx: (Math.random() - .5) * .6, vy: -(.5 + Math.random() * 1.3), l: 1, r: .6 + Math.random() * .9, ash: Math.random() < .35 }); }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i], px = s.x, py = s.y; s.x += s.vx + Math.sin(t * 4 + i) * .25; s.y += s.vy; s.l -= .016;
      if (s.l <= 0) { sparks.splice(i, 1); continue; }
      ctx.strokeStyle = s.ash ? `rgba(150,140,130,${(s.l * .6).toFixed(2)})` : `rgba(255,${(150 + 70 * s.l) | 0},60,${s.l.toFixed(2)})`; ctx.lineWidth = s.r; ctx.beginPath(); ctx.moveTo(px, py + 3); ctx.lineTo(s.x, s.y); ctx.stroke();
    }
    top.classList.toggle('dark', q > .55 || r.bottom < innerHeight * .5);
    requestAnimationFrame(frame);
  }
  if (!reduce) requestAnimationFrame(frame); else { top.classList.add('dark'); $('.fire-in').style.opacity = 1; $$('.fire-in .w').forEach(w => w.classList.add('on')); }

  // ---------- botão flutuante: depois do fogo, e some quando outro CTA de WhatsApp está na tela ----------
  const ctas = [...$$('[data-cta]'), $('#phone')]; const vis = new Set();
  const io = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? vis.add(e.target) : vis.delete(e.target)); upd(); }, { threshold: .2 });
  ctas.forEach(c => io.observe(c));
  function upd() { const after = stage.getBoundingClientRect().bottom < innerHeight * .4; fab.classList.toggle('on', after && vis.size === 0); }
  addEventListener('scroll', upd, { passive: true }); upd();

  // ---------- celular: site de demonstração rodando ao vivo ----------
  const fr = $('#phoneFrame'), scr = $('.ph-screen'), touch = $('.touch'), phone = $('#phone');
  const fit = () => { const s = scr.clientWidth / 390; fr.style.transform = `scale(${s})`; fr.style.height = (scr.clientHeight / s) + 'px'; };
  fit(); addEventListener('resize', fit);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const win = () => { try { const w = fr.contentWindow; return w && w.document && w.document.body ? w : null; } catch (_) { return null; } /* outra origem: sem rolagem */ };
  const glide = (w, to, dur) => new Promise(res => { const from = w.scrollY, t1 = performance.now(); (function st(n) { const k = Math.min(1, (n - t1) / dur), e = 1 - Math.pow(1 - k, 3); w.scrollTo(0, from + (to - from) * e); k < 1 ? requestAnimationFrame(st) : res(); })(t1); });
  const tap = () => { if (!touch.animate) return; touch.animate([{ opacity: 0, transform: 'translateY(0) scale(.6)' }, { opacity: 1, transform: 'translateY(0) scale(1)', offset: .15 }, { opacity: .9, transform: 'translateY(-60px) scale(1)', offset: .75 }, { opacity: 0, transform: 'translateY(-70px) scale(.8)' }], { duration: 1100, easing: 'ease-out' }); };
  let visP = false, busy = false, gen = 0;
  new IntersectionObserver(es => { visP = es[0].isIntersecting; if (visP && !busy && !reduce) loop(); }, { threshold: .3 }).observe(phone);
  async function loop() {
    busy = true; const my = gen; await wait(700);
    while (visP && my === gen) {
      const w = win(); if (!w) { await wait(400); continue; }
      const max = w.document.documentElement.scrollHeight - w.innerHeight, y = w.scrollY;
      if (y >= max - 4) { await wait(1400); tap(); await glide(w, 0, 2200); await wait(1600); continue; }
      const dy = Math.min(max - y, 300 + Math.random() * 340); tap(); await glide(w, y + dy, 1150); await wait(900 + Math.random() * 1300);
    }
    busy = false;
  }
  $$('.tabs button').forEach(b => b.addEventListener('click', () => {
    $$('.tabs button').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    gen++; fr.src = b.dataset.src; phone.href = b.dataset.href; busy = false;
    fr.addEventListener('load', () => { if (visP && !reduce && !busy) loop(); }, { once: true });
  }));
})();
