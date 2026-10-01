/* RAVIVA | site institucional. Conceito: fogo é sol estocado.
   Regra de marca: o símbolo nunca gira, estica ou ganha sombra. Aqui ele só se desenha (traço) e pulsa. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(hover:none),(pointer:coarse)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const html = document.documentElement;

  // Preencha o número (DDI+DDD+número, só dígitos) para trocar o e-mail pelo WhatsApp nos botões de contato.
  const CONTACT = { whatsapp: '' };
  if (CONTACT.whatsapp) {
    $$('[data-contact]').forEach(a => {
      a.href = 'https://wa.me/' + CONTACT.whatsapp + '?text=' + encodeURIComponent('Olá! Vim pelo site da Raviva e quero acender o meu negócio.');
      a.target = '_blank'; a.rel = 'noopener';
    });
  }

  // ---------- sem GSAP (CDN bloqueada): tudo visível, sem animação ----------
  if (!window.gsap || !window.ScrollTrigger) { html.classList.remove('js'); const p = $('#pre'); if (p) p.remove(); return; }
  gsap.registerPlugin(ScrollTrigger);

  // ---------- tema noite/dia (os dois mundos da marca) ----------
  const tgl = $('#tgl');
  const setDia = on => { html.classList.toggle('dia', on); tgl.setAttribute('aria-pressed', String(on)); $('span', tgl).textContent = on ? 'Noite' : 'Dia'; try { localStorage.setItem('rv-tema', on ? 'dia' : 'noite'); } catch (_) { /* sem storage: ok */ } };
  try { if (localStorage.getItem('rv-tema') === 'dia') setDia(true); } catch (_) { /* ok */ }
  tgl.addEventListener('click', () => setDia(!html.classList.contains('dia')));

  // ---------- scroll suave ----------
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); const el = id.length > 1 ? $(id) : null; if (!el) return;
    e.preventDefault(); lenis ? lenis.scrollTo(el, { offset: 0 }) : el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  // ---------- utilitários de anel (corte de tronco) ----------
  const prng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const ringD = (r, seed, amp = 0.045) => {
    const rnd = prng(seed), h = [[2, rnd() * 6.28], [3, rnd() * 6.28], [5, rnd() * 6.28]], norm = 1 / 2 + 1 / 3 + 1 / 5; let d = '';
    for (let i = 0; i <= 200; i++) { const a = i / 200 * Math.PI * 2; let w = 0; h.forEach(([k, p]) => w += Math.sin(k * a + p) / k); const rr = r * (1 + amp * w / norm); d += (i ? 'L' : 'M') + (rr * Math.cos(a)).toFixed(1) + ' ' + (rr * Math.sin(a)).toFixed(1); }
    return d + 'Z';
  };
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (n, attrs) => { const e = document.createElementNS(NS, n); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  function buildTrunk(svg, rings, fire, base = 1) {
    const out = { rings: [], ticks: [] };
    for (let i = 0; i < rings; i++) {
      const r = 42 + i * (rings > 4 ? 46 : 52);
      const p = mk('path', { d: ringD(r, base * 7 + i * 3 + 1), class: 'rg', pathLength: '1' }); svg.appendChild(p); out.rings.push(p);
      if (i < rings - 1) svg.appendChild(mk('path', { d: ringD(r + 24, base * 11 + i * 5 + 2, 0.06), class: 'rg soft', pathLength: '1', 'stroke-dasharray': '1', 'stroke-dashoffset': '0' }));
    }
    svg.appendChild(mk('circle', { r: 9, class: 'core' }));
    if (fire) {
      const R = 42 + (rings - 1) * (rings > 4 ? 46 : 52) + 18;
      for (let a = -170; a <= -10; a += 12) { const rad = a * Math.PI / 180; const l = mk('line', { x1: (R * Math.cos(rad)).toFixed(1), y1: (R * Math.sin(rad)).toFixed(1), x2: ((R + 34) * Math.cos(rad)).toFixed(1), y2: ((R + 34) * Math.sin(rad)).toFixed(1), class: 'spark', pathLength: '1' }); svg.appendChild(l); out.ticks.push(l); }
    }
    return out;
  }

  // ---------- hero: madeira em chamas liberando o sol ----------
  function initHeroFx() {
    if (reduce) return;
    gsap.to('.hero-bg', { yPercent: 9, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to(['.hero-sun', '.hero-rays', '.hero-flick'], { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '45% top', end: 'bottom top', scrub: true } });
  }

  // ---------- faíscas: cursor + brasas subindo ----------
  function initSparks() {
    const cv = $('#sparks'), ctx = cv.getContext('2d'); let W = 0, H = 0, dpr = 1;
    const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; };
    size(); addEventListener('resize', size);
    const P = [], COL = ['232,166,60', '201,73,31', '243,233,220', '232,166,60'];
    const emit = (x, y, n, spd, up) => { for (let i = 0; i < n && P.length < 260; i++) { const a = Math.random() * Math.PI * 2, s = (0.3 + Math.random()) * spd; P.push({ x: x * dpr, y: y * dpr, vx: Math.cos(a) * s * dpr, vy: (Math.sin(a) * s - up) * dpr, l: 1, d: 0.012 + Math.random() * 0.02, r: (0.8 + Math.random() * 2.2) * dpr, c: COL[(Math.random() * COL.length) | 0] }); } };
    let lx = 0, ly = 0, hot = false; const cur = $('#cursor');
    if (!coarse) {
      addEventListener('pointermove', e => { cur.classList.add('on'); cur.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; const dx = e.clientX - lx, dy = e.clientY - ly; if (dx * dx + dy * dy > 90 && !reduce) { emit(e.clientX, e.clientY, 2, 1.1, 0.5); lx = e.clientX; ly = e.clientY; } });
      addEventListener('pointerover', e => { const t = e.target.closest('a,button,.phone'); cur.classList.toggle('big', !!t); });
      addEventListener('pointerleave', () => cur.classList.remove('on'));
    }
    addEventListener('pointerdown', e => { if (!reduce) emit(e.clientX, e.clientY, 26, 3.4, 0.4); });
    let acc = 0;
    const step = () => {
      ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
      if (!reduce && scrollY < innerHeight * 0.9 && ++acc % 5 === 0) emit(Math.random() * innerWidth, innerHeight + 10, 1, 0.25, 1.5 + Math.random() * 1.6);
      for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.x += p.vx; p.y += p.vy; p.vy -= 0.012 * dpr; p.vx *= 0.985; p.vy *= 0.985; p.l -= p.d; if (p.l <= 0) { P.splice(i, 1); continue; }
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4); g.addColorStop(0, `rgba(${p.c},${p.l})`); g.addColorStop(1, `rgba(${p.c},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.283); ctx.fill(); }
      requestAnimationFrame(step);
    };
    if (!reduce) step();
  }

  // ---------- manifesto: palavra por palavra ----------
  function initManifesto() {
    const el = $('#manifT'); const HOT = /^(sol|fogo|acendemos|guardando|internet|incríveis)/i;
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w${HOT.test(w) ? ' hot' : ''}">${w}</span>`).join(' ');
    if (reduce) { $$('.w', el).forEach(w => w.style.opacity = 1); return; }
    gsap.to($$('.w', el), { opacity: 1, stagger: 0.12, ease: 'none', scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 48%', scrub: true } });
  }

  // ---------- conceito: o tronco ganha um anel por passo ----------
  function initTrunk() {
    const svg = $('#trunk'); const t = buildTrunk(svg, 4, true, 3); const steps = $$('.cs');
    t.rings.forEach(r => { r.style.strokeDasharray = 1; r.style.strokeDashoffset = reduce ? 0 : 1; }); t.ticks.forEach(r => { r.style.strokeDasharray = 1; r.style.strokeDashoffset = reduce ? 0 : 1; });
    const core = $('.core', svg); gsap.set(core, { scale: reduce ? 1 : 0, transformOrigin: '50% 50%' });
    const cap = $('#trunkCap'); const caps = ['Anel 1 · os primeiros clientes', 'Anel 2 · os que voltam', 'Anel 3 · as avaliações', 'Anel 4 · a indicação', 'Fogo · o sol guardado vira luz'];
    steps.forEach((s, i) => {
      const draw = on => { if (reduce) return; if (i < 4) gsap.to(t.rings[i], { strokeDashoffset: on ? 0 : 1, duration: 1.4, ease: 'power2.inOut' }); else gsap.to(t.ticks, { strokeDashoffset: on ? 0 : 1, duration: 0.9, stagger: { each: 0.04, from: 'center' }, ease: 'power2.out' });
        if (i === 0) gsap.to(core, { scale: on ? 1 : 0, duration: 0.7, ease: 'back.out(2)' }); };
      ScrollTrigger.create({ trigger: s, start: 'top 62%', end: 'bottom 38%', onEnter: () => { s.classList.add('on'); draw(true); cap.textContent = caps[i]; }, onEnterBack: () => { s.classList.add('on'); cap.textContent = caps[i]; }, onLeaveBack: () => { s.classList.remove('on'); draw(false); cap.textContent = i ? caps[i - 1] : 'Corte transversal de um negócio'; } });
    });
  }

  // ---------- método: scroll horizontal fixado ----------
  function initMetodo() {
    $$('.mp-r').forEach(svg => { const n = +svg.dataset.n; const fire = n === 4; const o = buildTrunk(svg, n + (fire ? 1 : 0), fire, 20 + n); o.rings.forEach(r => r.style.strokeDasharray = 'none'); o.ticks.forEach(r => r.style.strokeDasharray = 'none'); });
    const track = $('#metTrack');
    if (innerWidth < 760 && reduce) return;
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.met-pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 } });
  }

  // ---------- cases: o dedo rola a tela do celular ----------
  // Cada celular roda o site de demonstração de verdade (iframe 390x844 escalado). Um "dedo" invisível rola a página
  // como uma pessoa faria: puxa, solta, lê, puxa de novo; no fim volta ao topo. Só anima o que está na tela.
  function initPhones() {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    $$('.phone').forEach((ph, i) => {
      const fr = $('iframe', ph), scr = $('.ph-screen', ph), touch = $('.touch', ph);
      const fit = () => { const s = scr.clientWidth / 390; fr.style.transform = 'scale(' + s + ')'; fr.style.height = ((scr.clientHeight - scr.clientWidth * 0.125) / s) + 'px'; };
      fit(); addEventListener('resize', fit);
      if (reduce) return;
      let vis = false, hover = false, running = false;
      ph.addEventListener('pointerenter', () => { hover = true; }); ph.addEventListener('pointerleave', () => { hover = false; });
      const win = () => { try { const w = fr.contentWindow; return w && w.document && w.document.body ? w : null; } catch (_) { return null; } /* iframe de outra origem: sem rolagem */ };
      const swipe = (dy, dur) => {
        gsap.timeline()
          .fromTo(touch, { opacity: 0, scale: 0.6, y: 0 }, { opacity: 1, scale: 1, duration: 0.16 })
          .to(touch, { y: -Math.min(dy * 0.16, 70) * scr.clientWidth / 100, duration: dur * 0.45, ease: 'power2.out' })
          .to(touch, { opacity: 0, scale: 0.8, duration: 0.18 });
      };
      const glide = (w, to, dur, ease) => { const o = { v: w.scrollY }; return gsap.to(o, { v: to, duration: dur, ease, onUpdate: () => w.scrollTo(0, o.v) }); };
      async function loop() {
        running = true; await wait(600 + i * 420);
        while (vis) {
          const w = win(); if (!w || hover) { await wait(400); continue; }
          const max = w.document.documentElement.scrollHeight - w.innerHeight, y = w.scrollY;
          if (y >= max - 4) { await wait(1400); swipe(-300, 1); await glide(w, 0, 2.4, 'power3.inOut'); await wait(1800); continue; }
          const back = y > 600 && Math.random() < 0.12;
          const dy = back ? -(120 + Math.random() * 140) : Math.min(max - y, 280 + Math.random() * 360);
          swipe(Math.abs(dy), 1.25); await glide(w, y + dy, 1.25, 'power3.out');
          await wait(back ? 700 : 900 + Math.random() * 1400);
        }
        running = false;
      }
      new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis && !running) loop(); }, { threshold: 0.35 }).observe(ph);
      // inclinação 3D leve seguindo o ponteiro
      if (!coarse) {
        const link = $('.ph-link', ph);
        ph.addEventListener('pointermove', e => { const r = ph.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; link.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 10}deg) translateZ(20px)`; });
        ph.addEventListener('pointerleave', () => { link.style.transform = ''; });
      }
    });
    if (!reduce) gsap.from('.phone', { y: 120, opacity: 0, duration: 1.3, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '#phones', start: 'top 85%' } });
  }

  // ---------- números ----------
  function initCounters() {
    $$('[data-count]').forEach(el => {
      const to = +el.dataset.count; const fmt = v => Math.round(v).toLocaleString('pt-BR');
      if (reduce) { el.textContent = fmt(to); return; }
      const o = { v: 0 }; ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => gsap.to(o, { v: to, duration: 2.2, ease: 'power3.out', onUpdate: () => { el.textContent = fmt(o.v); } }) });
    });
  }

  // ---------- bento: brilho que segue o ponteiro ----------
  function initBento() { $$('.bc').forEach(c => c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); })); }

  // ---------- hero: entrada e saída ----------
  function heroIn() {
    const sym = $('.hero-sym'); gsap.set(sym, { xPercent: -50, yPercent: -50 });
    if (!reduce) gsap.from(['.hero-sun', '.hero-rays'], { opacity: 0, scale: 0.35, duration: 3, ease: 'power2.out' });
    if (reduce) { gsap.set('.reveal-up', { opacity: 1, y: 0 }); return; }
    const sv = $('.sym', sym); const outer = $('.ring-outer', sv), inner = $('.ring-inner', sv), ticks = $$('.tick', sv), flames = $$('.flame', sv), dot = $('.dot', sv);
    [outer, inner, ...ticks].forEach(p => { p.style.strokeDasharray = 1; p.style.strokeDashoffset = 1; });
    gsap.set(flames, { opacity: 0 }); gsap.set(dot, { opacity: 0, transformBox: 'fill-box', transformOrigin: 'center', scale: 0 });
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to(outer, { strokeDashoffset: 0, duration: 2.1, ease: 'power2.inOut' }, 0)
      .to(inner, { strokeDashoffset: 0, duration: 2.1, ease: 'power2.inOut' }, 0.25)
      .to(ticks, { strokeDashoffset: 0, duration: 0.9, stagger: 0.06 }, 0.9)
      .to(flames, { opacity: 1, duration: 0.5, stagger: 0.07 }, 1.5)
      .to(dot, { opacity: 1, scale: 1, duration: 0.9, ease: 'back.out(3)' }, 2)
      .from('.mega .ln > span', { yPercent: 115, duration: 1.4, stagger: 0.14, ease: 'expo.out' }, 0.7)
      .to('.reveal-up', { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 1.2);
    gsap.to(flames, { opacity: 0.55, duration: 1.1, stagger: { each: 0.13, repeat: -1, yoyo: true }, ease: 'sine.inOut', delay: 3 });
    gsap.from(sym, { y: 220, duration: 2.6, ease: 'power3.out' });
    gsap.to(sym, { y: -140, scale: 0.78, opacity: 0.1, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  // ---------- nav + reveals gerais ----------
  function initGeneral() {
    const nav = $('#nav'); ScrollTrigger.create({ start: 80, onUpdate: s => nav.classList.toggle('sc', s.scroll() > 80) });
    if (reduce) return;
    gsap.utils.toArray('.h2, .conc-end, .lede.sm, .price .lede, .fin .lede, .mega2, .mega3 span').forEach(el => gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
    gsap.utils.toArray('.bc').forEach((el, i) => gsap.from(el, { y: 50, opacity: 0, duration: 0.9, delay: (i % 2) * 0.08, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } }));
  }

  // ---------- partida ----------
  const guard = fn => { try { fn(); } catch (e) { console.error('[raviva]', fn.name, e); } };
  [initHeroFx, initSparks, initManifesto, initTrunk, initMetodo, initPhones, initCounters, initBento, initGeneral].forEach(guard);
  const pre = $('#pre'); const minWait = new Promise(r => setTimeout(r, reduce ? 200 : 1700)); const loaded = new Promise(r => (document.readyState === 'complete' ? r() : addEventListener('load', r)));
  Promise.race([Promise.all([minWait, loaded]), new Promise(r => setTimeout(r, 5000))]).then(() => { pre.classList.add('out'); guard(heroIn); setTimeout(() => ScrollTrigger.refresh(), 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
