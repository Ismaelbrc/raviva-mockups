/* Raviva v3 · movimento. Sem GSAP (CDN fora do ar), a página continua inteira e legível (classe no-gsap). */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var mob = window.matchMedia('(max-width:900px)').matches;
  var calmo = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---------- pontos do dado (295 pizzarias, 159 sem site): sorteio fixo para ficar igual em toda visita ---------- */
  var dots = $('#dots');
  if (dots) {
    var seed = 115, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var idx = []; for (var i = 0; i < 295; i++) idx.push(i);
    for (var j = idx.length - 1; j > 0; j--) { var k = Math.floor(rnd() * (j + 1)); var t = idx[j]; idx[j] = idx[k]; idx[k] = t; }
    var marcados = {}; for (var q = 0; q < 159; q++) marcados[q] = 1;   // ordenados: proporção legível
    var frag = document.createDocumentFragment();
    for (var d = 0; d < 295; d++) { var el = document.createElement('i'); if (marcados[d]) el.dataset.x = '1'; frag.appendChild(el); }
    dots.appendChild(frag);
  }

  if (!window.gsap || !window.ScrollTrigger) {
    document.documentElement.classList.add('no-gsap');
    $$('#dots i[data-x]').forEach(function (e) { e.classList.add('x'); });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- rolagem suave ---------- */
  var lenis = null;
  if (window.Lenis && !calmo) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var alvo = $(a.getAttribute('href')); if (!alvo) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(alvo, { offset: 0, duration: 1.4 }); else alvo.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- títulos: palavra por palavra ---------- */
  $$('.split').forEach(function (h) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/), f = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { f.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w'; var inn = document.createElement('span'); inn.textContent = p; w.appendChild(inn); f.appendChild(w);
          });
          n.parentNode.replaceChild(f, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(h);
  });
  var css = document.createElement('style');
  css.textContent = '.split .w{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em;margin-bottom:-.08em}.split .w>span{display:inline-block;will-change:transform}';
  document.head.appendChild(css);

  /* ---------- abertura ---------- */
  var intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro.from('.hero h1 .w>span', { yPercent: 115, duration: 1.3, stagger: 0.06 })
    .from('.hero .kicker', { opacity: 0, y: 12, duration: .8 }, 0.1)
    .from('.hero .lede, .hero .acts', { opacity: 0, y: 24, duration: 1, stagger: .1 }, 0.55)
    .from('.reel', { y: 80, opacity: 0, duration: 1.6 }, 0.25)
    .from('.gcard', { y: 120, rotate: 6, opacity: 0, duration: 1.5 }, 0.5)
    .from('.reel-cap', { opacity: 0, duration: 0.8 }, 1.2)
    .to('.circle path', { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 1.5)
    .from('.nav', { y: -30, opacity: 0, duration: 1 }, 0.2);

  /* ---------- vitrine viva: um site diferente a cada 2,8 s ---------- */
  var reel = $$('#reel img'), cap = $('#reelCap'), at = 0;
  if (reel.length > 1 && !calmo) setInterval(function () {
    if (document.hidden) return;
    var prev = reel[at]; at = (at + 1) % reel.length; var nx = reel[at];
    reel.forEach(function (im) { im.classList.remove('out'); });
    prev.classList.remove('on'); prev.classList.add('out'); setTimeout(function () { nx.classList.add('on'); }, 350);
    // a ficha do Google (o "antes") some durante a cortina e volta já com o negócio do novo site: nunca dois negócios na cena
    var g = $('#gcard');
    gsap.to(g, { y: 24, autoAlpha: 0, duration: 0.3 });
    setTimeout(function () {
      $('#gNome').textContent = nx.dataset.nome; $('#gSetor').textContent = nx.dataset.setor + ' · Goiânia';
      $('#gNota').textContent = nx.dataset.nota; $('#gN').textContent = '(' + nx.dataset.n + ')';
      cap.innerHTML = '<b>' + nx.dataset.nome + '</b> · ' + nx.dataset.setor;
      gsap.to(g, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out' });
    }, 1300);
  }, 6000);

  /* ---------- outros títulos ao entrar na tela ---------- */
  $$('.split').forEach(function (h) {
    if (h.closest('.hero')) return;
    gsap.from($$('.w>span', h), { yPercent: 115, duration: 1.1, stagger: 0.035, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%' } });
  });

  /* ---------- navegação ---------- */
  var nav = $('#nav'), last = 0;
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (s) {
    var y = s.scroll();
    nav.classList.toggle('solid', y > 40);
    nav.classList.toggle('hide', y > 500 && y > last + 2);
    if (y < last - 2) nav.classList.remove('hide');
    last = y;
  } });

  /* ---------- como funciona: a cena se monta com o scroll ---------- */
  var st = $('#stage');
  if (st) {
    var A = $('.s-reviews', st), B = $('.s-wire', st), C = $('.s-site', st), D = $('.s-wa', st);
    gsap.set([B, C, D], { autoAlpha: 0 });
    gsap.set($$('.rv mark', st), { backgroundSize: '0% 100%' });
    var steps = $$('.steps li'), bar = $('#bar');
    var tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      scrollTrigger: {
        trigger: '.como', start: 'top top', end: mob ? '+=260%' : '+=340%', pin: '.como-pin', scrub: 0.6,
        onUpdate: function (s) { bar.style.width = (s.progress * 100) + '%'; }
      }
    });
    tl.from($$('.rv', st), { y: 90, autoAlpha: 0, stagger: 0.25, duration: 0.6 })
      .to($$('.rv mark', st), { backgroundSize: '100% 100%', duration: 0.35, stagger: 0.12 }, '+=0.1')
      .addLabel('etapa1')
      .to($$('.rv', st), { scale: 0.7, x: function (i) { return [-60, 60, -30][i]; }, autoAlpha: 0, duration: 0.6, stagger: 0.06 }, '+=0.35')
      .to(B, { autoAlpha: 1, duration: 0.3 }, '<0.2')
      .from($('.win', B), { y: 80, scale: 0.92, duration: 0.7 }, '<')
      .from($('.w-h', B), { y: 40, autoAlpha: 0, duration: 0.5 }, '<0.25')
      .from($$('.w-btn,.w-q', B), { y: 24, autoAlpha: 0, stagger: 0.15, duration: 0.45 }, '<0.15')
      .addLabel('etapa2', '+=0.45')
      .to(B, { autoAlpha: 0, scale: 1.04, duration: 0.5 }, '+=0.9')
      .to(C, { autoAlpha: 1, duration: 0.3 }, '<0.15')
      .from($('.phone', C), { y: 160, rotate: 9, autoAlpha: 0, duration: 0.8 }, '<')
      .addLabel('etapa3', '+=0.15')
      .to($('.phone img', C), { yPercent: -62, duration: 1.4, ease: 'none' }, '+=0.35')
      .to(C, { autoAlpha: 0, y: -60, duration: 0.5 }, '+=0.1')
      .to(D, { autoAlpha: 1, duration: 0.3 }, '<0.15')
      .from($('.wa', D), { y: 90, scale: 0.94, duration: 0.7 }, '<')
      .from($$('.bub', D), { y: 30, scale: 0.9, autoAlpha: 0, stagger: 0.45, duration: 0.45, transformOrigin: 'left bottom' }, '<0.25')
      .addLabel('etapa4')
      .to({}, { duration: 0.5 });
    window.__como = tl;   // usado só pelo script de prints de revisão
    // passo ativo = cena visível; calculado a cada quadro da cena (a cena anda atrasada do scroll por causa do scrub)
    tl.eventCallback('onUpdate', function () {
      var L = tl.labels, t = tl.time();
      var c = [(L.etapa1 + L.etapa2) / 2, (L.etapa2 + L.etapa3) / 2, (L.etapa3 + L.etapa4) / 2];
      var n = t < c[0] ? 0 : t < c[1] ? 1 : t < c[2] ? 2 : 3;
      steps.forEach(function (li, i) { li.classList.toggle('on', i === n); });
    });
  }

  /* ---------- dado: os pontos acendem ---------- */
  var acesos = $$('#dots i[data-x]');
  ScrollTrigger.create({ trigger: '#dots', start: 'top 75%', once: true, onEnter: function () {
    var o = { n: 0 };
    gsap.to(o, { n: acesos.length, duration: calmo ? 0 : 2.4, ease: 'power2.out', onUpdate: function () {
      for (var i = 0; i < Math.floor(o.n); i++) if (!acesos[i].classList.contains('x')) acesos[i].classList.add('x');
    } });
  } });

  /* ---------- trabalhos: cada projeto cobre o anterior, que recua ---------- */
  var projs = $$('.proj');
  projs.forEach(function (p, i) {
    var prox = projs[i + 1]; if (!prox) return;
    gsap.to(p.querySelector('.proj-in'), { scale: 0.9, autoAlpha: 0.35, ease: 'none',
      scrollTrigger: { trigger: prox, start: 'top bottom', end: 'top top', scrub: true } });
  });
  projs.forEach(function (p) {
    gsap.from(p.querySelectorAll('h3, .dir, .dec, .bts'), { y: 40, autoAlpha: 0, stagger: 0.06, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 55%' } });
  });

  /* ---------- navegação clara sobre a seção clara ---------- */

  /* ---------- preço e chamada ---------- */
  gsap.from('.num', { yPercent: 30, autoAlpha: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.preco', start: 'top 95%' } });
  gsap.from('.inclui li', { x: 30, autoAlpha: 0, stagger: 0.07, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.inclui ul', start: 'top 98%' } });

  /* ---------- botões magnéticos (só com mouse) ---------- */
  if (window.matchMedia('(hover:hover)').matches) {
    $$('[data-mag]').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.4, ease: 'power3.out' });
      });
      b.addEventListener('mouseleave', function () { gsap.to(b, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,.4)' }); });
    });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
