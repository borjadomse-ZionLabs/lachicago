/* LA CHICAGO — sistema de reservas
   - Con reservasEndpoint (Google Apps Script) consulta huecos y crea la cita en Google Calendar.
   - Sin endpoint: modo demo (agenda simulada + la reserva se guarda en este navegador y aparece en panel.html). */
(() => {
  const S = window.SITE;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const TZ = 'Europe/Madrid';
  const KEY = 'chicago_reservas';
  const root = $('#book'), body = $('#bookBody'), title = $('#bookTitle'), kicker = $('#bookKicker');
  const steps = $('#bookSteps'), next = $('#bookNext'), back = $('#bookBack'), sum = $('#bookSum'), foot = $('#bookFoot');

  const B = { sede: null, svc: null, pro: null, date: null, time: null, datos: { nombre: '', tel: '', email: '', nota: '' } };
  let step = 0, lastFocus = null;

  const sede = () => S.sedes[B.sede];
  const svc = () => S.servicios.find(s => s.id === B.svc);
  const hasPros = () => B.sede && (sede().barberos || []).length > 0;
  const flow = () => ['sede', 'servicio', ...(hasPros() ? ['pro'] : []), 'fecha', 'datos'];
  const titles = { sede: 'Elige tu casa', servicio: 'Elige servicio', pro: 'Tu profesional', fecha: 'Día y hora', datos: 'Tus datos' };

  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const toM = s => { const [a, b] = s.split(':').map(Number); return a * 60 + b; };
  const toHHMM = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const nowMadrid = () => new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
  const price = s => s.precio == null ? 'Consultar' : `${s.desde ? 'desde ' : ''}${s.precio} €`;
  const dur = m => m >= 60 ? `${(m / 60).toFixed(m % 60 ? 1 : 0).replace('.', ',')} h` : `${m} min`;
  const fechaLarga = d => new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- abrir / cerrar ---------- */
  function open(opts = {}) {
    lastFocus = document.activeElement;
    Object.assign(B, { sede: null, svc: null, pro: null, date: null, time: null });
    if (opts.sede && S.sedes[opts.sede]) B.sede = opts.sede;
    if (opts.servicio) {
      B.svc = opts.servicio;
      const s = svc(); if (s && s.sedes.length === 1) B.sede = s.sedes[0];
    }
    step = 0;
    if (B.sede) step = 1;
    if (B.sede && B.svc) step = flow().indexOf(hasPros() ? 'pro' : 'fecha');
    root.classList.add('is-open'); root.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    window.__lenis?.stop();
    render();
    setTimeout(() => $('.book__close', root).focus(), 300);
  }
  function close() {
    root.classList.remove('is-open'); root.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    window.__lenis?.start();
    lastFocus?.focus?.();
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-book]'); if (b) { e.preventDefault(); open({ sede: b.dataset.book || null }); }
    if (e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('is-open')) close(); });
  window.ChicagoBook = { open, close };

  /* ---------- navegación ---------- */
  next.addEventListener('click', () => {
    const f = flow();
    if (f[step] === 'datos') return submit();
    if (canNext()) { step++; render(); }
  });
  back.addEventListener('click', () => { if (step > 0) { step--; render(); } });

  function canNext() {
    const k = flow()[step];
    if (k === 'sede') return !!B.sede;
    if (k === 'servicio') return !!B.svc;
    if (k === 'pro') return !!B.pro;
    if (k === 'fecha') return !!(B.date && B.time);
    if (k === 'datos') return true;
  }
  function updateFoot() {
    const f = flow(), k = f[step];
    next.disabled = !canNext();
    next.textContent = k === 'datos' ? 'Confirmar reserva' : 'Continuar';
    back.style.visibility = step > 0 ? 'visible' : 'hidden';
    const parts = [];
    if (B.sede) parts.push(`<b>${sede().corto}</b>`);
    if (B.svc && svc()) parts.push(`${svc().nombre} · ${price(svc())}`);
    if (B.date && B.time) parts.push(`${fechaLarga(B.date)}, ${B.time}`);
    sum.innerHTML = parts.join('<br>');
  }
  function render() {
    const f = flow(), k = f[step];
    title.textContent = titles[k];
    kicker.textContent = `Paso ${step + 1} de ${f.length}` + (B.sede ? ` · ${sede().nombre}` : '');
    steps.innerHTML = f.map((_, i) => `<li class="${i <= step ? 'is-done' : ''}"></li>`).join('');
    foot.classList.remove('is-hidden');
    body.innerHTML = '';
    const wrap = document.createElement('div'); wrap.className = 'bk-anim'; body.appendChild(wrap);
    ({ sede: rSede, servicio: rSvc, pro: rPro, fecha: rFecha, datos: rDatos })[k](wrap);
    body.scrollTop = 0;
    updateFoot();
  }

  /* ---------- pasos ---------- */
  function rSede(w) {
    const img = { vilanova: 'vng-facade', sitges: 'stg-facade' };
    w.innerHTML = `<div class="bk-sedes">${Object.values(S.sedes).map(s => `
      <button class="bk-sede ${B.sede === s.id ? 'is-sel' : ''}" data-id="${s.id}">
        <img src="img/${img[s.id]}.webp" alt="">
        <span class="bk-check">✓</span>
        <span class="bk-sede__b"><strong>${s.corto}</strong><span>${s.nombre} · ${s.direccion}</span></span>
      </button>`).join('')}</div>`;
    w.addEventListener('click', e => {
      const b = e.target.closest('.bk-sede'); if (!b) return;
      B.sede = b.dataset.id; B.pro = null; B.date = null; B.time = null;
      if (B.svc && !svc().sedes.includes(B.sede)) B.svc = null;
      step++; render();
    });
  }
  function rSvc(w) {
    const list = S.servicios.filter(s => s.sedes.includes(B.sede));
    w.innerHTML = S.categorias.map(c => {
      const items = list.filter(s => s.cat === c.id); if (!items.length) return '';
      return `<p class="bk-cat">${c.nombre}</p><div class="bk-svcs">${items.map(s => `
        <button class="bk-svc ${B.svc === s.id ? 'is-sel' : ''}" data-id="${s.id}">
          <b>${s.nombre}</b><span class="p ${s.precio == null ? 'ask' : ''}">${s.precio == null ? 'Consultar' : (s.desde ? '<small style="font-family:var(--f-mono);font-size:10px;color:var(--muted)">desde </small>' : '') + s.precio + '€'}</span>
          <small>${s.desc}</small><span class="d">${dur(s.min)}</span>
        </button>`).join('')}</div>`;
    }).join('');
    w.addEventListener('click', e => {
      const b = e.target.closest('.bk-svc'); if (!b) return;
      B.svc = b.dataset.id; B.time = null;
      $$('.bk-svc', w).forEach(x => x.classList.toggle('is-sel', x === b));
      setTimeout(() => { step++; render(); }, 220);
    });
  }
  function rPro(w) {
    const pros = [{ id: 'any', n: 'Primer disponible', s: 'Más huecos libres' }, ...sede().barberos.map(n => ({ id: n, n, s: 'Profesional' }))];
    w.innerHTML = `<div class="bk-pros">${pros.map(p => `
      <button class="bk-pro ${B.pro === p.id ? 'is-sel' : ''}" data-id="${esc(p.id)}"><i>${p.id === 'any' ? '✦' : esc(p.n[0])}</i><b>${esc(p.n)}</b><small>${p.s}</small></button>`).join('')}</div>`;
    w.addEventListener('click', e => {
      const b = e.target.closest('.bk-pro'); if (!b) return;
      B.pro = b.dataset.id; B.time = null;
      $$('.bk-pro', w).forEach(x => x.classList.toggle('is-sel', x === b));
      setTimeout(() => { step++; render(); }, 220);
    });
  }

  // huecos ocupados
  function seeded(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; }; }
  function demoBusy(date) {
    const r = seeded(B.sede + date), busy = [];
    const hh = sede().horario[new Date(date + 'T12:00:00').getDay()] || [];
    hh.forEach(([a, b]) => { for (let m = toM(a); m < toM(b); m += 30) if (r() < .42) busy.push({ s: toHHMM(m), e: toHHMM(m + 30) }); });
    return busy;
  }
  function localBusy(date) {
    return getStore().filter(x => x.sede === B.sede && x.fecha === date).map(x => ({ s: x.hora, e: toHHMM(toM(x.hora) + (x.duracion || 30)) }));
  }
  async function busyFor(date) {
    const ep = sede().reservasEndpoint;
    if (ep) {
      try { const r = await fetch(`${ep}?action=busy&date=${date}`); const j = await r.json(); return (j.events || []).filter(x => !x.b || B.pro === 'any' || !B.pro || x.b === B.pro); }
      catch { return []; }
    }
    return [...(S.demoOcupados ? demoBusy(date) : []), ...localBusy(date)];
  }

  function rFecha(w) {
    const days = [], now = nowMadrid();
    for (let i = 0; i < S.diasVista; i++) { const d = new Date(now); d.setDate(d.getDate() + i); days.push(d); }
    const isOpen = d => (sede().horario[d.getDay()] || []).length && !S.cerrado.includes(ymd(d)) && slotsBase(ymd(d)).length;
    if (!B.date) { const f = days.find(isOpen); B.date = f ? ymd(f) : null; }
    const dows = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const month = d => d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    w.innerHTML = `<p class="bk-month" id="bkMonth">${B.date ? month(new Date(B.date + 'T12:00:00')) : ''}</p>
      <div class="bk-days">${days.map(d => `<button class="bk-day ${ymd(d) === B.date ? 'is-sel' : ''}" data-d="${ymd(d)}" ${isOpen(d) ? '' : 'disabled'}><small>${dows[d.getDay()]}</small><b>${d.getDate()}</b></button>`).join('')}</div>
      <div id="bkSlots" style="margin-top:20px"></div>
      <p class="bk-legend"><span>${dur(svc().min)} · ${svc().nombre}</span></p>`;
    w.querySelector('.bk-days').addEventListener('click', e => {
      const b = e.target.closest('.bk-day'); if (!b || b.disabled) return;
      B.date = b.dataset.d; B.time = null;
      $$('.bk-day', w).forEach(x => x.classList.toggle('is-sel', x === b));
      $('#bkMonth').textContent = month(new Date(B.date + 'T12:00:00'));
      drawSlots(); updateFoot();
    });
    setTimeout(() => $('.bk-day.is-sel', w)?.scrollIntoView({ inline: 'center', block: 'nearest' }), 50);
    drawSlots();
  }
  function slotsBase(date) {
    const d = new Date(date + 'T12:00:00'), hh = sede().horario[d.getDay()] || [], len = svc().min, out = [];
    const now = nowMadrid(), today = ymd(now) === date, minNow = now.getHours() * 60 + now.getMinutes() + S.antelacionMin;
    hh.forEach(([a, b]) => { for (let m = toM(a); m + Math.min(len, 60) <= toM(b); m += S.intervaloMin) if (!today || m >= minNow) out.push(m); });
    return out;
  }
  async function drawSlots() {
    const box = $('#bkSlots'); if (!box) return;
    if (!B.date) { box.innerHTML = '<div class="bk-empty">No hay días disponibles.</div>'; return; }
    box.innerHTML = '<p class="bk-loading">Buscando huecos…</p>';
    const date = B.date, busy = await busyFor(date); if (date !== B.date) return;
    const len = Math.min(svc().min, 60);
    const free = m => !busy.some(x => m < toM(x.e) && m + len > toM(x.s));
    const base = slotsBase(date);
    const am = base.filter(m => m < 14 * 60), pm = base.filter(m => m >= 14 * 60);
    const btns = arr => arr.map(m => `<button class="bk-slot ${B.time === toHHMM(m) ? 'is-sel' : ''}" data-t="${toHHMM(m)}" ${free(m) ? '' : 'disabled'}>${toHHMM(m)}</button>`).join('');
    box.innerHTML = (base.some(free) ? '' : '<div class="bk-empty">Día completo. Prueba otro día.</div>') +
      (am.length ? `<p class="bk-cat">Mañana</p><div class="bk-slots">${btns(am)}</div>` : '') +
      (pm.length ? `<p class="bk-cat">Tarde</p><div class="bk-slots">${btns(pm)}</div>` : '');
    box.onclick = e => {
      const b = e.target.closest('.bk-slot'); if (!b || b.disabled) return;
      B.time = b.dataset.t; $$('.bk-slot', box).forEach(x => x.classList.toggle('is-sel', x === b)); updateFoot();
    };
  }

  function rDatos(w) {
    const s = svc(), d = B.datos;
    w.innerHTML = `
      <div class="bk-review"><img src="img/${s.img}.webp" alt=""><div><b>${s.nombre} · ${price(s)}</b><span>${sede().nombre} · ${fechaLarga(B.date)} · ${B.time}${B.pro && B.pro !== 'any' ? ' · con ' + esc(B.pro) : ''}</span></div></div>
      <form class="bk-form" id="bkForm" novalidate>
        <div class="bk-field"><label for="bkN">Nombre</label><input id="bkN" name="nombre" autocomplete="name" value="${esc(d.nombre)}" required><span class="err">Escribe tu nombre</span></div>
        <div class="bk-field"><label for="bkT">Teléfono</label><input id="bkT" name="tel" type="tel" inputmode="tel" autocomplete="tel" value="${esc(d.tel)}" required><span class="err">Teléfono no válido</span></div>
        <div class="bk-field"><label for="bkE">Email (opcional)</label><input id="bkE" name="email" type="email" autocomplete="email" value="${esc(d.email)}"></div>
        <div class="bk-field"><label for="bkO">Nota (opcional)</label><textarea id="bkO" name="nota" placeholder="Ej: degradado bajo, traigo foto de referencia">${esc(d.nota)}</textarea></div>
        <p class="bk-legal">Usamos tus datos solo para gestionar la cita. Recibirás la confirmación al momento.</p>
      </form>`;
    $('#bkForm').addEventListener('input', e => { const t = e.target; if (t.name) B.datos[t.name] = t.value; t.closest('.bk-field').classList.remove('has-err'); });
    $('#bkForm').addEventListener('submit', e => { e.preventDefault(); submit(); });
  }

  /* ---------- confirmar ---------- */
  function getStore() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
  function setStore(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch {} }

  async function submit() {
    const d = B.datos; let ok = true;
    const fN = $('#bkN')?.closest('.bk-field'), fT = $('#bkT')?.closest('.bk-field');
    if (!d.nombre.trim()) { fN.classList.add('has-err'); ok = false; }
    if (d.tel.replace(/\D/g, '').length < 9) { fT.classList.add('has-err'); ok = false; }
    if (!ok) return;
    next.disabled = true; next.textContent = 'Confirmando…';
    const s = svc();
    const rec = { id: 'LC-' + Math.random().toString(36).slice(2, 7).toUpperCase(), sede: B.sede, servicio: s.nombre, servicioId: s.id, precio: s.precio, duracion: s.min, barbero: B.pro || 'any', fecha: B.date, hora: B.time, nombre: d.nombre.trim(), telefono: d.tel.trim(), email: d.email.trim(), nota: d.nota.trim(), creada: new Date().toISOString() };
    const ep = sede().reservasEndpoint;
    if (ep) {
      try {
        const r = await fetch(ep, { method: 'POST', body: JSON.stringify({ action: 'book', ...rec }) }); const j = await r.json();
        if (!j.ok) { alert(j.error === 'ocupado' ? 'Ese hueco se acaba de ocupar. Elige otra hora.' : 'No se pudo completar la reserva. Inténtalo de nuevo.'); step = flow().indexOf('fecha'); B.time = null; render(); return; }
      } catch { alert('Sin conexión. Inténtalo de nuevo.'); updateFoot(); return; }
    } else {
      await new Promise(r => setTimeout(r, 900));
    }
    const st = getStore(); st.push(rec); setStore(st);
    done(rec);
  }

  function done(r) {
    const s = svc(), sd = sede();
    title.textContent = '¡Reservado!';
    kicker.textContent = sd.nombre + ' · ' + sd.ciudad;
    steps.innerHTML = flow().map(() => '<li class="is-done"></li>').join('');
    foot.classList.add('is-hidden');
    const [y, mo, da] = r.fecha.split('-'), [h, mi] = r.hora.split(':');
    const start = `${y}${mo}${da}T${h}${mi}00`;
    const endD = new Date(+y, +mo - 1, +da, +h, +mi + s.min);
    const end = `${endD.getFullYear()}${pad(endD.getMonth() + 1)}${pad(endD.getDate())}T${pad(endD.getHours())}${pad(endD.getMinutes())}00`;
    const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('💈 ' + s.nombre + ' · ' + sd.nombre)}&dates=${start}/${end}&ctz=${TZ}&location=${encodeURIComponent(sd.direccion + ', ' + sd.cp)}&details=${encodeURIComponent('Reserva ' + r.id)}`;
    body.innerHTML = `<div class="bk-done bk-anim">
      <div class="bk-done__check"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
      <h3>Te esperamos,<br>${esc(r.nombre.split(' ')[0])}</h3>
      <p>Tu cita está confirmada. Llega con estilo — sal con respeto.</p>
      <div class="bk-ticket">
        <div class="bk-ticket__head"><strong>${sd.nombre}</strong><code>${r.id}</code></div>
        <div class="bk-ticket__row"><span>Servicio</span><b>${s.nombre}</b></div>
        <div class="bk-ticket__row"><span>Día</span><b>${cap(fechaLarga(r.fecha))}</b></div>
        <div class="bk-ticket__row"><span>Hora</span><b>${r.hora} · ${dur(s.min)}</b></div>
        ${r.barbero !== 'any' ? `<div class="bk-ticket__row"><span>Profesional</span><b>${esc(r.barbero)}</b></div>` : ''}
        <div class="bk-ticket__row"><span>Precio</span><b>${price(s)}</b></div>
        <div class="bk-ticket__row"><span>Dirección</span><b>${sd.direccion}</b></div>
      </div>
      <div class="bk-done__btns">
        <a class="btn btn--blue" href="${gcal}" target="_blank" rel="noopener">Añadir a mi calendario</a>
        <a class="btn btn--line" href="${sd.mapsUrl}" target="_blank" rel="noopener">Cómo llegar</a>
        <button class="btn btn--line" data-close>Cerrar</button>
      </div>
    </div>`;
  }
})();
