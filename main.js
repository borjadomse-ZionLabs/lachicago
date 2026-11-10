/* LA CHICAGO — interacción y animación */
(() => {
  const S = window.SITE;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const isMobile = () => innerWidth <= 900;

  /* ---------- text splitting ---------- */
  function splitChars(el) {
    const txt = el.textContent; el.textContent = '';
    el.setAttribute('aria-label', txt);
    [...txt].forEach(c => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c === ' ' ? ' ' : c; s.setAttribute('aria-hidden', 'true'); el.appendChild(s); });
  }
  function splitLines(el) {
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(p => `<span class="ln"><span>${p.trim()}</span></span>`).join('');
  }
  function splitWords(el) {
    const walk = (node, into) => {
      node.childNodes.forEach(n => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(t => {
            if (!t) return;
            if (/^\s+$/.test(t)) { into.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w'; w.textContent = t; into.appendChild(w);
          });
        } else if (n.nodeType === 1) {
          const c = n.cloneNode(false); into.appendChild(c); walk(n, c);
        }
      });
    };
    const frag = document.createElement('div'); walk(el, frag); el.innerHTML = frag.innerHTML;
  }
  $$('.split-chars').forEach(splitChars);
  $$('.split-lines').forEach(splitLines);
  $$('.reveal-words').forEach(splitWords);

  /* ---------- basics ---------- */
  $('#year').textContent = new Date().getFullYear();

  // abierto / cerrado ahora (hora de Madrid)
  (function status() {
    const el = $('#status'), tx = $('#statusTxt'); if (!el) return;
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
    const h = S.sedes.vilanova.horario[now.getDay()] || [];
    const mins = now.getHours() * 60 + now.getMinutes();
    const toM = s => { const [a, b] = s.split(':').map(Number); return a * 60 + b; };
    const open = h.find(([a, b]) => mins >= toM(a) && mins < toM(b));
    if (open) { el.classList.add('is-open'); tx.textContent = `Abierto · hasta las ${open[1]}`; }
    else {
      let d = new Date(now), txt = '';
      for (let i = 0; i < 8; i++) {
        const hh = S.sedes.vilanova.horario[d.getDay()] || [];
        const nxt = hh.find(([a]) => i > 0 || toM(a) > mins);
        if (nxt) { txt = i === 0 ? `hoy a las ${nxt[0]}` : i === 1 ? `mañana a las ${nxt[0]}` : `el ${d.toLocaleDateString('es-ES', { weekday: 'long' })} a las ${nxt[0]}`; break; }
        d.setDate(d.getDate() + 1);
      }
      tx.textContent = `Cerrado · abre ${txt}`;
    }
  })();

  // eventos del universo (fecha futura)
  (function eventos() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    (S.eventos || []).forEach(ev => {
      const d = new Date(ev.fecha + 'T00:00:00'); if (d < today) return;
      const el = $(`[data-event="${ev.marca}"]`); if (!el) return;
      const diff = Math.round((d - today) / 864e5);
      const tag = diff === 0 ? 'Hoy' : diff === 1 ? 'Mañana' : 'Próximo';
      el.innerHTML = `<b>${tag}</b>${ev.texto}`;
    });
  })();

  /* ---------- servicios ---------- */
  (function servicios() {
    const tabs = $('#svcTabs'), list = $('#svcList'), hover = $('#svcHover'), himg = $('img', hover);
    let cat = S.categorias[0].id;
    const fmt = s => s.precio == null ? '<span class="svc__price is-ask">Consultar</span>' : `<span class="svc__price">${s.desde ? '<small>desde</small>' : ''}${s.precio}€</span>`;
    const sedesTxt = s => s.sedes.length === 2 ? 'Vilanova · Sitges' : (s.sedes[0] === 'sitges' ? 'Solo Sitges' : 'Solo Vilanova');
    function render() {
      tabs.innerHTML = S.categorias.map(c => `<button class="tab" role="tab" aria-selected="${c.id === cat}" data-cat="${c.id}">${c.nombre}</button>`).join('');
      const items = S.servicios.filter(s => s.cat === cat);
      list.innerHTML = items.map((s, i) => `
        <li class="svc" data-svc="${s.id}" data-img="img/${s.img}.webp" tabindex="0" role="button" aria-label="Reservar ${s.nombre}">
          <span class="svc__i">${String(i + 1).padStart(2, '0')}</span>
          <span class="svc__name">${s.nombre}${s.top ? '<span class="svc__top">Top</span>' : ''}</span>
          <p class="svc__desc">${s.desc}</p>
          <span class="svc__meta"><span>${s.min >= 60 ? (s.min / 60).toFixed(s.min % 60 ? 1 : 0).replace('.', ',') + ' h' : s.min + ' min'}</span><span>${sedesTxt(s)}</span></span>
          ${fmt(s)}
          <span class="svc__go"><svg><use href="#arrow"/></svg></span>
        </li>`).join('');
      if (hasGsap && !reduce) gsap.from($$('.svc', list), { y: 30, opacity: 0, duration: .8, stagger: .05, ease: 'expo.out' });
      // precargar imágenes de hover
      items.forEach(s => { const im = new Image(); im.src = `img/${s.img}.webp`; });
    }
    tabs.addEventListener('click', e => { const b = e.target.closest('.tab'); if (!b) return; cat = b.dataset.cat; render(); });
    list.addEventListener('click', e => { const r = e.target.closest('.svc'); if (r) window.ChicagoBook?.open({ servicio: r.dataset.svc }); });
    list.addEventListener('keydown', e => { if (e.key === 'Enter') { const r = e.target.closest('.svc'); if (r) window.ChicagoBook?.open({ servicio: r.dataset.svc }); } });
    if (fine) {
      let x = 0, y = 0, cx = 0, cy = 0, raf;
      const loop = () => { cx += (x - cx) * .14; cy += (y - cy) * .14; hover.style.left = cx + 'px'; hover.style.top = cy + 'px'; raf = requestAnimationFrame(loop); };
      list.addEventListener('mouseover', e => { const r = e.target.closest('.svc'); if (!r) return; if (himg.getAttribute('src') !== r.dataset.img) himg.src = r.dataset.img; hover.classList.add('is-on'); });
      list.addEventListener('mouseleave', () => hover.classList.remove('is-on'));
      list.addEventListener('mousemove', e => { x = e.clientX + 180; y = e.clientY; if (!raf) { cx = x; cy = y; loop(); } });
    }
    render();
  })();

  /* ---------- vídeos: reproducir solo en pantalla ---------- */
  const vio = new IntersectionObserver(es => es.forEach(en => {
    const v = en.target;
    if (en.isIntersecting) {
      if (!v.src && v.dataset.src) v.src = v.dataset.src;
      if (v.closest('.casa') && fine) return; // casas: reproducen en hover (desktop)
      v.play().catch(() => {});
    } else v.pause();
  }), { rootMargin: '200px 0px' });
  $$('video[data-src], #heroVideo').forEach(v => vio.observe(v));

  /* ---------- casas: expandir + vídeo en hover ---------- */
  (function casas() {
    const wrap = $('.casas__panels');
    $$('.casa').forEach(c => {
      const v = $('video', c);
      const on = () => {
        if (isMobile()) return;
        wrap.classList.add('has-active'); $$('.casa').forEach(o => o.classList.toggle('is-active', o === c));
        if (!v.src) v.src = v.dataset.src;
        v.play().then(() => c.classList.add('is-playing')).catch(() => {});
      };
      const off = () => { if (isMobile()) return; v.pause(); c.classList.remove('is-playing'); };
      c.addEventListener('mouseenter', on); c.addEventListener('mouseleave', off);
    });
    wrap.addEventListener('mouseleave', () => { wrap.classList.remove('has-active'); $$('.casa').forEach(o => o.classList.remove('is-active')); });
    // móvil: vídeo en autoplay al entrar
    if (!fine) $$('.casa video').forEach(v => { v.addEventListener('playing', () => v.closest('.casa').classList.add('is-playing')); });
  })();

  /* ---------- menú ---------- */
  const burger = $('#burger'), menu = $('#menu');
  const toggleMenu = (open) => {
    const o = open ?? !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', o); burger.setAttribute('aria-expanded', o); menu.setAttribute('aria-hidden', !o);
    if (window.__lenis) o ? window.__lenis.stop() : window.__lenis.start();
  };
  burger.addEventListener('click', () => toggleMenu());
  $$('a', menu).forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  /* ---------- anchors (con Lenis) ---------- */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return; const t = $(id); if (!t) return;
    e.preventDefault();
    if (window.__lenis) window.__lenis.scrollTo(t, { offset: id === '#top' ? 0 : -10, duration: 1.6 }); else t.scrollIntoView({ behavior: 'smooth' });
  }));

  /* ---------- nav: sólido + esconder al bajar ---------- */
  const nav = $('#nav'), mbook = $('.mbook'); let lastY = 0;
  const onScroll = (y) => {
    nav.classList.toggle('is-solid', y > 40);
    nav.classList.toggle('is-hidden', y > lastY && y > 600 && !menu.classList.contains('is-open'));
    const nearEnd = y + innerHeight > document.documentElement.scrollHeight - 300;
    mbook.classList.toggle('is-on', y > innerHeight * .7 && !nearEnd);
    lastY = y;
  };
  addEventListener('scroll', () => onScroll(scrollY), { passive: true });

  /* ---------- cursor + magnetic ---------- */
  if (fine && !reduce) {
    const cur = $('#cursor'), lab = $('#cursorLabel'); let mx = -100, my = -100, x = -100, y = -100;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; cur.classList.add('is-on'); });
    (function loop() { x += (mx - x) * .2; y += (my - y) * .2; cur.style.transform = `translate(${x}px,${y}px)`; requestAnimationFrame(loop); })();
    document.addEventListener('mouseover', e => {
      const t = e.target.closest('[data-cursor]');
      if (t) { lab.textContent = t.dataset.cursor; cur.classList.add('is-label'); } else cur.classList.remove('is-label');
    });
    document.addEventListener('mouseleave', () => cur.classList.remove('is-on'));
    $$('.magnetic').forEach(b => {
      b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); const dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2; b.style.transform = `translate(${dx * .25}px,${dy * .35}px)`; });
      b.addEventListener('mouseleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- contadores ---------- */
  function countUp(el) {
    const end = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0;
    if (!hasGsap || reduce) return;
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => { el.textContent = o.v.toFixed(dec).replace('.', ','); } });
  }

  /* ---------- loader ---------- */
  const loader = $('#loader');
  function hideLoaderNoAnim() { loader.style.display = 'none'; }

  if (!hasGsap || reduce) {
    hideLoaderNoAnim();
    $$('[data-count]').forEach(el => el.textContent = el.dataset.count.replace('.', ','));
    onScroll(scrollY);
    return;
  }

  /* ==================== GSAP ==================== */
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('anim');

  // Lenis smooth scroll
  if (window.Lenis && fine) {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', e => { ScrollTrigger.update(); onScroll(e.scroll); });
    gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
  }

  // estado inicial
  gsap.set('.hero__title .ch', { yPercent: 110 });
  gsap.set(['.hero__top', '.hero__bottom > *', '.nav'], { opacity: 0, y: 20 });
  gsap.set('.hero__video', { scale: 1.3 });

  // Loader
  const lt = gsap.timeline();
  const cnt = { v: 0 }, cEl = $('#loaderCount');
  lt.from('.loader__mark', { scale: .4, opacity: 0, duration: .8, ease: 'expo.out' })
    .from('.loader__word span', { yPercent: 120, duration: .9, stagger: .045, ease: 'expo.out' }, '<.1')
    .to(cnt, { v: 100, duration: 1.4, ease: 'power2.inOut', onUpdate: () => cEl.textContent = String(Math.round(cnt.v)).padStart(3, '0') }, '<')
    .to('.loader__word span', { yPercent: -120, duration: .6, stagger: .03, ease: 'expo.in' }, '+=.1')
    .to(['.loader__mark', '.loader__meta'], { opacity: 0, duration: .3 }, '<')
    .to('.loader__curtain', { scaleY: 1, duration: .55, ease: 'expo.inOut' }, '-=.35')
    .set('.loader__inner', { opacity: 0 })
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'expo.inOut' })
    .set('.loader', { display: 'none' })
    .to('.hero__video', { scale: 1.08, duration: 2.2, ease: 'expo.out' }, '-=.9')
    .to('.hero__title .ch', { yPercent: 0, duration: 1.3, stagger: .05, ease: 'expo.out' }, '-=2')
    .to(['.nav', '.hero__top', '.hero__bottom > *'], { opacity: 1, y: 0, duration: 1, stagger: .08, ease: 'expo.out' }, '-=1.1');
  const hv = $('#heroVideo'); hv.play().catch(() => {});

  // Hero parallax al salir
  gsap.to('.hero__title', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__media', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // split-lines
  $$('.split-lines').forEach(el => {
    gsap.from($$('.ln > span', el), { yPercent: 110, duration: 1.2, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  // split-chars (no hero)
  $$('.split-chars').forEach(el => {
    if (el.closest('.hero')) return;
    gsap.from($$('.ch', el), { yPercent: 100, opacity: 0, duration: 1.1, stagger: .035, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  // palabras por scroll
  $$('.reveal-words').forEach(el => {
    gsap.fromTo($$('.w', el), { opacity: .12 }, { opacity: 1, stagger: .08, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
  });
  // fade-up
  $$('.fade-up').forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
  // contadores
  $$('[data-count]').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => countUp(el) }));

  // casas: entrada
  gsap.from('.casa', { y: 120, opacity: 0, duration: 1.4, stagger: .15, ease: 'expo.out', scrollTrigger: { trigger: '.casas__panels', start: 'top 85%' } });

  // parallax genérico
  $$('[data-speed]').forEach(el => {
    const sp = parseFloat(el.dataset.speed);
    gsap.fromTo(el, { yPercent: -sp * 100 }, { yPercent: sp * 100, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // galería: aparición con clip
  $$('.g').forEach((g, i) => gsap.from(g, { clipPath: 'inset(100% 0 0 0)', duration: 1.4, ease: 'expo.out', delay: (i % 3) * .08, scrollTrigger: { trigger: g, start: 'top 92%' } }));

  // ARTISTAS: scroll horizontal fijado (desktop)
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const track = $('#artTrack');
    const dist = () => track.scrollWidth - innerWidth + 0;
    const tl = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.artistas', start: 'top top', end: () => '+=' + dist(), pin: '.artistas__pin', scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
    gsap.from('.art', { y: 80, opacity: 0, duration: 1.2, stagger: .06, ease: 'expo.out', scrollTrigger: { trigger: '.artistas', start: 'top 60%' } });
    return () => tl.kill();
  });

  // fundador: tira de fotos con scroll
  gsap.fromTo('#filmTrack', { x: 0 }, { x: () => -($('#filmTrack').scrollWidth - innerWidth) * .6, ease: 'none', scrollTrigger: { trigger: '.film', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  gsap.from('.fundador__img', { clipPath: 'inset(0 0 100% 0)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.fundador__img', start: 'top 85%' } });

  // CTA: zoom de fondo
  gsap.fromTo('.cta__bg img', { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });

  // universo
  gsap.from('.uni__card', { y: 100, opacity: 0, duration: 1.3, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: '.uni', start: 'top 85%' } });

  addEventListener('load', () => ScrollTrigger.refresh());
  onScroll(scrollY);
})();
