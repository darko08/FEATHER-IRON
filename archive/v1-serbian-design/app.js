/* Perje i gvožđe — page logic */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const DIR = { A: 'Rovovski', B: 'Heraldički', C: 'Agro-tech' };
  const KEYS = [['jedinice', 'Jedinice'], ['zgrade', 'Zgrade'], ['glavni', 'Glavni ekran'], ['ekrani', 'Ostali ekrani']];

  document.body.insertAdjacentHTML('afterbegin', ART.DEFS);
  $('#heroArt').innerHTML = ART.hero();

  /* ---------- world: plots chart ---------- */
  const ZONES = {
    'Uz drum': { fx: 'Sunčano i suvo. +25% ulje i +15% snaga vetrenjača. Odredi kreću 10% brže, ali kokošinjac je lako uhoditi.', who: 'Za brze napadače i trgovce.' },
    'Livada': { fx: 'Umerena klima i najviše polja. +10% zrno. Najtraženiji placevi u svakom sokaku.', who: 'Za matični kokošinjac i dugu igru.' },
    'Bašte': { fx: 'Zaklon od vetra. +10% zrno, −10% snaga vetrenjača.', who: 'Za proizvodnju zrna.' },
    'Potok': { fx: 'Vlažno i sveže. +25% kreč iz rečnog krečnjaka, −15% ulje.', who: 'Za kreč, oklop i odbranu.' },
    'Šumarak': { fx: 'Hladovina uz šumu. −20% ulje i snaga. Uhođenje protiv tebe je 25% slabije, a Pohodi u Divljinu 30% kraći. Lisice dolaze češće.', who: 'Za pohode i skrivene ispostave.' }
  };
  const PLAC = [
    [1, 'Uz drum', 44, 72, '28 do 34 °C'], [2, 'Uz drum', 52, 84, '26 do 32 °C'], [3, 'Uz drum', 70, 110, '24 do 30 °C'],
    [4, 'Livada', 150, 210, '18 do 24 °C'], [5, 'Livada', 172, 238, '16 do 22 °C'], [6, 'Livada', 165, 226, '16 do 22 °C'],
    [7, 'Bašte', 148, 204, '14 do 20 °C'], [8, 'Bašte', 140, 196, '12 do 18 °C'], [9, 'Bašte', 132, 186, '12 do 18 °C'],
    [10, 'Potok', 118, 166, '8 do 14 °C'], [11, 'Potok', 110, 156, '6 do 12 °C'], [12, 'Potok', 102, 148, '6 do 12 °C'],
    [13, 'Šumarak', 90, 132, '2 do 8 °C'], [14, 'Šumarak', 80, 120, '0 do 6 °C'], [15, 'Šumarak', 70, 110, '−2 do 4 °C']
  ];
  let selPlac = 4;
  const C = { L: 46, R: 628, T: 28, B: 214, W: 640, H: 270 };
  const yv = (v) => C.B - (v / 250) * (C.B - C.T);
  const slot = (C.R - C.L) / 15;

  function drawChart() {
    let g = '';
    for (const t of [0, 50, 100, 150, 200, 250]) g += `<line class="g" x1="${C.L}" x2="${C.R}" y1="${yv(t)}" y2="${yv(t)}"/><text x="${C.L - 8}" y="${yv(t) + 4}" text-anchor="end">${t}</text>`;
    let bars = '';
    PLAC.forEach((p, i) => {
      const cx = C.L + slot * i + slot / 2, y1 = yv(p[3]), y0 = yv(p[2]);
      bars += `<g class="bar${i === selPlac ? ' sel' : ''}" data-i="${i}" role="button" tabindex="0" aria-label="Plac ${p[0]}, ${p[1]}, od ${p[2]} do ${p[3]} polja" aria-pressed="${i === selPlac}">` +
        `<rect class="hit" x="${(C.L + slot * i).toFixed(1)}" y="${C.T}" width="${slot.toFixed(1)}" height="${C.B - C.T}"/>` +
        `<rect class="mk" x="${(cx - 10).toFixed(1)}" y="${y1.toFixed(1)}" width="20" height="${(y0 - y1).toFixed(1)}" rx="4"/>` +
        `<text x="${cx.toFixed(1)}" y="${C.B + 16}" text-anchor="middle">${p[0]}</text></g>`;
    });
    const sp = PLAC[selPlac], scx = C.L + slot * selPlac + slot / 2;
    const vl = `<text class="vl" x="${scx.toFixed(1)}" y="${(yv(sp[3]) - 8).toFixed(1)}" text-anchor="middle">${sp[2]}–${sp[3]}</text>`;
    let zl = '';
    ['Uz drum', 'Livada', 'Bašte', 'Potok', 'Šumarak'].forEach((z, j) => {
      const x0 = C.L + slot * j * 3 + 4, x1 = C.L + slot * (j * 3 + 3) - 4;
      zl += `<line class="zb" x1="${x0.toFixed(1)}" x2="${x1.toFixed(1)}" y1="${C.B + 26}" y2="${C.B + 26}"/><text class="zl" x="${((x0 + x1) / 2).toFixed(1)}" y="${C.B + 44}" text-anchor="middle">${z.toUpperCase()}</text>`;
    });
    $('#chart').innerHTML = `<svg viewBox="0 0 ${C.W} ${C.H}" role="group" aria-label="Raspon polja po placu, od 1 do 15">${g}${bars}${vl}${zl}</svg>`;
    drawPlot();
  }

  function drawPlot() {
    const p = PLAC[selPlac], z = ZONES[p[1]];
    $('#plot').innerHTML = `<p class="eyebrow">Plac ${p[0]} od 15</p><div class="z">${p[1]}</div><div class="r">${p[2]}–${p[3]} polja · ${p[4]}</div><p class="muted">${z.fx}</p>` +
      `<dl><dt>Primer</dt><dd>Suncokreti 117/${p[0]}</dd><dt>Za koga</dt><dd>${z.who}</dd><dt>Pravilo</dt><dd>Matični kokošinjac uvek dobija 175 polja. Proširenje ograde dodaje 4 polja po nivou.</dd></dl>`;
  }

  const chartEl = $('#chart'), tip = $('#tip'), box = $('.chartbox');
  chartEl.addEventListener('click', (e) => { const b = e.target.closest('.bar'); if (b) { selPlac = +b.dataset.i; drawChart(); focusBar(); } });
  chartEl.addEventListener('keydown', (e) => {
    const b = e.target.closest('.bar'); if (!b) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selPlac = +b.dataset.i; drawChart(); focusBar(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); selPlac = Math.max(0, Math.min(14, selPlac + (e.key === 'ArrowRight' ? 1 : -1))); drawChart(); focusBar(); }
  });
  function focusBar() { const b = $(`.bar[data-i="${selPlac}"]`, chartEl); if (b) b.focus({ preventScroll: true }); }
  function showTip(b) {
    const p = PLAC[+b.dataset.i], r = b.querySelector('.mk').getBoundingClientRect(), br = box.getBoundingClientRect();
    tip.innerHTML = `Plac ${p[0]} · ${p[1]}<br>${p[2]}–${p[3]} polja · ${p[4]}`;
    tip.style.left = (r.left + r.width / 2 - br.left) + 'px';
    tip.style.top = (r.top - br.top - 8) + 'px';
    tip.hidden = false;
  }
  chartEl.addEventListener('mouseover', (e) => { const b = e.target.closest('.bar'); if (b) showTip(b); });
  chartEl.addEventListener('mouseleave', () => { tip.hidden = true; });
  chartEl.addEventListener('focusin', (e) => { const b = e.target.closest('.bar'); if (b) showTip(b); });
  chartEl.addEventListener('focusout', () => { tip.hidden = true; });
  drawChart();

  const ZT = [['Uz drum', '1–3', '44–110', '24 do 34 °C'], ['Livada', '4–6', '150–238', '16 do 24 °C'], ['Bašte', '7–9', '132–204', '12 do 20 °C'], ['Potok', '10–12', '102–166', '6 do 14 °C'], ['Šumarak', '13–15', '70–132', '−2 do 8 °C']];
  $('#zoneTable tbody').innerHTML = ZT.map(z => `<tr><td><b>${z[0]}</b></td><td class="n">${z[1]}</td><td class="n">${z[2]}</td><td class="n">${z[3]}</td><td>${ZONES[z[0]].fx}</td></tr>`).join('');

  const HOODS = [['I', 'Stara Ekonomija', '+5% odbrana'], ['II', 'Kukuruzište', '+5% zrno'], ['III', 'Suncokreti', '+5% ulje'], ['IV', 'Vodenica', '+5% kreč'],
    ['V', 'Vinogradi', '+5% nosivost'], ['VI', 'Pašnjak', '+5% brzina odreda'], ['VII', 'Ciglana', '−5% cena zgrada'], ['VIII', 'Pčelinjak', '+5% brzina istraživanja']];
  $('#hoods').innerHTML = HOODS.map(h => `<div><i>Komšiluk ${h[0]}</i><b>${h[1]}</b><span>${h[2]}</span></div>`).join('');

  /* ---------- eggs calculator ---------- */
  const cE = $('#cE'), cL = $('#cL'), cG = $('#cG');
  function calc() {
    const E = +cE.value, L = +cL.value, Gn = +cG.value, bonus = 1 + Gn * .03, cap = Math.round(6 * Math.pow(L, 1.4));
    $('#oE').textContent = fmt(E); $('#oL').textContent = L; $('#oG').textContent = Gn + ' (+' + Gn * 3 + '%)';
    const u = (cost) => Math.floor(E / cost * bonus);
    const zr = E * 1000;
    const zrS = zr >= 1e6 ? (zr / 1e6).toFixed(2).replace('.', ',') + ' mil.' : fmt(zr);
    const minutes = E * 10, spd = minutes >= 120 ? fmt(minutes / 60) + ' h' : fmt(minutes) + ' min';
    const tiles = [
      [fmt(u(2)), 'Kljucača', 'laka pešadija · 2 jaja'], [fmt(u(10)), 'Jurišnika', 'elitni juriš · 10 jaja'], [fmt(u(6)), 'Zaprega', 'nosivost ' + fmt(u(6) * 25000)],
      [fmt(u(40)), 'Strašila', 'teška odbrana · 40 jaja'], [zrS, 'zrna', '1 jaje = 1.000 zrna'], [spd, 'ubrzanja', '1 jaje = 10 minuta']
    ];
    const hrs = cap ? E / cap : 0, h = Math.floor(hrs), m = Math.round((hrs - h) * 60);
    $('#outs').innerHTML = tiles.map(t => `<div class="out"><b>${t[0]}</b><span>${t[1]}</span><small>${t[2]}</small></div>`).join('') +
      `<div class="ptime"><span class="muted">Izleganje jedinica i odbrane traje</span><b>${h} h ${m} min</b><span class="small muted">Inkubator ${L} izleže ${fmt(cap)} jaja na sat. Resursi i ubrzanje stižu odmah.</span></div>`;
  }
  [cE, cL, cG].forEach(i => i.addEventListener('input', calc));
  calc();

  const BREEDS = [['Leghorn', 'Nosilja', 'Inkubator radi 15% brže'], ['Rodajlend', 'Ratnica', '+8% napad odreda iz tog kokošinjca'], ['Brahma', 'Bedem', '+12% odbrana'],
    ['Orpington', 'Domaćica', '+10% proizvodnja svih resursa'], ['Saseks', 'Izviđač', '+12% brzina odreda'], ['Svilenka', 'Senka', '+25% uspeh uhođenja'], ['Australorp', 'Gvozdeno perje', '+10% oklop jedinica'],
    ['Somborska kaporka', 'Kapa Reda', '+5% na sve i dupli glas u Savetu jata', 1], ['Banatski gološijan', 'Bez straha', '+15% napad u prvoj rundi', 1], ['Svrljiška kokoš', 'Planinka', '+30% nalaza u Divljini', 1]];
  $('#breeds tbody').innerHTML = BREEDS.map(b => `<tr><td><b>${b[0]}</b>${b[3] ? ' <span class="prar l">samo legendarna</span>' : ''}</td><td>${b[1]}</td><td>${b[2]}</td></tr>`).join('');

  /* ---------- rules ---------- */
  const RES = [['zrno', 'Zrno', 'Osnovni resurs za zgrade i jedinice. Daje ga Žitnica.'], ['krec', 'Kreč', 'Oklop, zidovi i istraživanja. Daje ga Krečana.'], ['ulje', 'Ulje', 'Gorivo za odrede i napredne zgrade. Daje ga Uljara.'],
    ['snaga', 'Snaga', 'Pokreće proizvodnju. Daju je Vetrenjača i Kompostna peć.'], ['jaja', 'Jaja', 'Dolaze iz NFT novčanika i postaju bilo šta.']];
  $('#res5').innerHTML = RES.map(r => `<div>${ART.icon(r[0])}<b>${r[1]}</b><p>${r[2]}</p></div>`).join('');
  const pips = (n) => `<span class="pips" aria-label="${n} od 10">${Array.from({ length: 10 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
  const UNITS = [['Uhoda', 'Uhođenje', '1 jaje', 0, 1, 10, 0], ['Kljucač', 'Laka pešadija', '2 jaja', 2, 2, 6, 1], ['Mamuzar', 'Teška pešadija', '5 jaja', 4, 4, 5, 1], ['Jurišnik', 'Elitni juriš', '10 jaja', 6, 5, 6, 1],
    ['Jajobacač', 'Artiljerija protiv odbrane', '18 jaja', 8, 3, 3, 0], ['Oklopnik', 'Brahma u oklopu', '30 jaja', 7, 9, 3, 2], ['Probijač', 'Opsada kupola i zidova', '45 jaja', 9, 7, 2, 0],
    ['Tvrđava na kokošjim nogama', 'Titan', '2.400 jaja', 10, 10, 1, 8], ['Tačka', 'Mali transport, 5.000', '2 jaja', 0, 1, 7, 3], ['Zaprega', 'Veliki transport, 25.000', '6 jaja', 0, 3, 5, 8],
    ['Seobna kola', 'Naseljavanje placa', '40 jaja', 0, 3, 3, 4], ['Skupljač perja', 'Sakuplja polja perja', '12 jaja', 0, 4, 3, 6]];
  $('#units tbody').innerHTML = UNITS.map(u => `<tr><td><b>${u[0]}</b></td><td>${u[1]}</td><td class="n">${u[2]}</td><td>${pips(u[3])}</td><td>${pips(u[4])}</td><td>${pips(u[5])}</td><td>${pips(u[6])}</td></tr>`).join('');

  /* ---------- design picker ---------- */
  const st = { jedinice: null, zgrade: null, glavni: null, ekrani: null, napomena: '' };
  let viewSkin = 'A';
  const U5 = [['tvrdjava', 'Tvrđava na kokošjim nogama', 'Titan · 2.400 jaja', 1], ['uhoda', 'Uhoda', 'Uhođenje · 1 jaje'], ['kljucac', 'Kljucač', 'Laka pešadija · 2 jaja'], ['jurisnik', 'Jurišnik', 'Elitni juriš · 10 jaja'], ['zaprega', 'Zaprega', 'Veliki transport · 6 jaja']];
  const B5 = [['kokosinjac', 'Kokošinjac', 'Glavna zgrada · brža gradnja', 1], ['vetrenjaca', 'Vetrenjača', 'Snaga'], ['zitnica', 'Žitnica', 'Zrno'], ['inkubator', 'Inkubator', 'Jedinice i pretvaranje jaja'], ['strasilo', 'Strašilo', 'Odbrana · 40 jaja']];

  function cols(key, list, fn) {
    return ['A', 'B', 'C'].map(s => `<div class="col s${s}" data-s="${s}"><div class="col-h"><b><i>${s}</i>${DIR[s]}</b><button class="pbtn sm" type="button" data-pick="${key}" data-v="${s}" aria-pressed="false">Izaberi ${s}</button></div>` +
      `<div class="sheet">${list.map(it => `<figure class="card${it[3] ? ' wide' : ''}">${fn(it[0], s)}<figcaption><b>${it[1]}</b><span>${it[2]}</span></figcaption></figure>`).join('')}</div></div>`).join('');
  }
  $('#colsJedinice').innerHTML = cols('jedinice', U5, (id, s) => ART.unit(id, s));
  $('#colsZgrade').innerHTML = cols('zgrade', B5, (id, s) => ART.building(id, s));
  $$('.seg').forEach(sg => {
    const key = sg.dataset.seg;
    sg.innerHTML = ['A', 'B', 'C'].map(s => `<button class="pbtn sm" type="button" data-show="${s}" aria-pressed="${s === 'A'}">${s} · ${DIR[s]}</button>`).join('');
    sg.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      $(key === 'jedinice' ? '#colsJedinice' : '#colsZgrade').dataset.show = b.dataset.show;
      $$('button', sg).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    });
  });

  const MAINS = [['A', 'Štab', 'Meni levo kao fascikle, resursi gore kao metalne pločice, dvorište u sredini kao fotografija sa terena, a desno telegraf sa kretanjem odreda.', SCREENS.mainA],
    ['B', 'Dvor', 'Grb i voštani pečati gore, meni od štitova, iluminirana slika imanja u centru, vesti kao svitak i kokošinjci kao zastavice.', SCREENS.mainB],
    ['C', 'Komandni HUD', 'Dvorište kao holografska projekcija preko celog ekrana, plutajući stakleni paneli, uski meni sa ikonama i mini-mapa sokaka.', SCREENS.mainC]];
  $('#mainMocks').innerHTML = MAINS.map(m => `<figure class="mfig" data-s="${m[0]}"><div class="mfig-h"><div><b><i>${m[0]}</i>${m[1]}</b><p>${m[2]}</p></div><div class="acts"><button class="pbtn sm" type="button" data-zoom="main${m[0]}">Uvećaj</button><button class="pbtn sm" type="button" data-pick="glavni" data-v="${m[0]}" aria-pressed="false">Izaberi ${m[0]}</button></div></div><div class="mock">${m[3]()}</div></figure>`).join('');

  function renderOther() {
    $('#otherMocks').innerHTML = SCREENS.OTHER.map(o => `<figure class="mfig"><div class="mfig-h"><div><b>${o.name}</b><p>${o.desc}</p></div><div class="acts"><button class="pbtn sm" type="button" data-zoom="o:${o.id}">Uvećaj</button></div></div><div class="mock tall">${o.fn(viewSkin)}</div></figure>`).join('');
    $('#skinBtns').innerHTML = ['A', 'B', 'C'].map(s => `<button class="pbtn sm" type="button" data-skin="${s}" aria-pressed="${s === viewSkin}">${s} · ${DIR[s]}</button>`).join('');
    observeMocks();
    renderState();
  }
  $('#skinBtns').addEventListener('click', (e) => { const b = e.target.closest('[data-skin]'); if (b && b.dataset.skin !== viewSkin) { viewSkin = b.dataset.skin; renderOther(); } });
  $('#pickSkin').addEventListener('click', () => pick('ekrani', viewSkin));

  /* mock scaling */
  const ro = 'ResizeObserver' in window ? new ResizeObserver(es => es.forEach(en => en.target.style.setProperty('--k', (en.contentRect.width / 1280).toFixed(4)))) : null;
  function observeMocks() {
    $$('.mock').forEach(m => {
      m.style.setProperty('--k', (m.clientWidth / 1280).toFixed(4));
      if (ro && !m.dataset.obs) { ro.observe(m); m.dataset.obs = '1'; }
    });
  }

  /* picks */
  function pick(key, v) {
    st[key] = v;
    renderState();
    save();
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]');
    if (b) pick(b.dataset.pick, b.dataset.v);
    const z = e.target.closest('[data-zoom]');
    if (z) openLb(z.dataset.zoom, z);
  });

  function renderState() {
    $$('[data-pick]').forEach(b => {
      const on = st[b.dataset.pick] === b.dataset.v;
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? 'Izabrano ✓' : 'Izaberi ' + b.dataset.v;
    });
    $$('.cols3').forEach(c => {
      const key = c.id === 'colsJedinice' ? 'jedinice' : 'zgrade';
      $$('.col', c).forEach(col => col.classList.toggle('sel', st[key] === col.dataset.s));
    });
    $$('#mainMocks .mfig').forEach(f => f.classList.toggle('sel', st.glavni === f.dataset.s));
    $$('#otherMocks .mfig').forEach(f => f.classList.toggle('sel', st.ekrani === viewSkin));
    const pb = $('#pickSkin');
    const on = st.ekrani === viewSkin;
    pb.textContent = on ? 'Izabrano ✓' : 'Izaberi stil ' + viewSkin;
    pb.setAttribute('aria-pressed', String(on));
    KEYS.forEach(([k]) => {
      const c = $(`[data-cur="${k}"]`);
      c.textContent = st[k] ? 'Izabrano: ' + st[k] + ' · ' + DIR[st[k]] : 'Nije izabrano';
      c.classList.toggle('on', !!st[k]);
      $(`#navpick b[data-k="${k}"]`).classList.toggle('on', !!st[k]);
    });
    $('#sumt').innerHTML = KEYS.map(([k, l]) => `<div><span>${l}</span><a href="#${k}" class="${st[k] ? 'on' : ''}">${st[k] ? st[k] + ' · ' + DIR[st[k]] : 'izaberi →'}</a></div>`).join('');
    const nt = $('#note');
    if (document.activeElement !== nt && nt.value !== st.napomena) nt.value = st.napomena;
  }

  /* ---------- persistence ---------- */
  const LSK = 'perje-gvozdje-izbor';
  let docRef = null, saving = false, again = false, mode = 'loading';
  const statusEl = $('#status');
  function setStatus(kind, extra) {
    const t = new Date().toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' });
    const M = {
      loading: ['', 'Učitavam sačuvan izbor…'],
      empty: ['', 'Još nema sačuvanog izbora. Klikni „Izaberi” kod pravca koji ti se dopada.'],
      loaded: ['ok', 'Sačuvan izbor je učitan.'],
      saving: ['', 'Čuvam…'],
      saved: ['ok', 'Sačuvano u ' + t + '. Claude može da pročita ovaj izbor.'],
      slow: ['warn', 'Sačuvan izbor se još ne učitava. Novi izbor će se sačuvati kada veza proradi.'],
      local: ['warn', 'Čuvanje uz stranicu nije dostupno u ovom prikazu. Izbor ostaje u ovom pregledaču, pa ga kopiraj kao tekst i pošalji u razgovor.'],
      readonly: ['warn', 'Ovaj prikaz ne može da menja sačuvan izbor. Kopiraj ga kao tekst i pošalji u razgovor.'],
      err: ['warn', 'Čuvanje nije uspelo. Pokušaj ponovo ili kopiraj izbor kao tekst.']
    };
    const m = M[kind] || M.err;
    statusEl.className = 'status ' + m[0];
    statusEl.textContent = m[1];
  }
  function valid(v) { return v === 'A' || v === 'B' || v === 'C' ? v : null; }
  function apply(d) {
    if (!d) return;
    KEYS.forEach(([k]) => { st[k] = valid(d[k]); });
    if (typeof d.napomena === 'string') st.napomena = d.napomena;
    renderState();
  }
  function saveLocal() { try { localStorage.setItem(LSK, JSON.stringify(st)); } catch (e) { /* storage unavailable */ } }
  function loadLocal() { try { const v = localStorage.getItem(LSK); if (v) apply(JSON.parse(v)); } catch (e) { /* storage unavailable */ } }

  async function save() {
    saveLocal();
    if (!docRef) { if (mode !== 'loading') setStatus(mode === 'readonly' ? 'readonly' : 'local'); return; }
    if (saving) { again = true; return; }
    saving = true; setStatus('saving');
    try {
      await docRef.set({ jedinice: st.jedinice, zgrade: st.zgrade, glavni: st.glavni, ekrani: st.ekrani, napomena: st.napomena.slice(0, 4000), azurirano: new Date().toISOString() });
      setStatus('saved');
    } catch (e) {
      if (e && e.code === 'invalid_argument') { docRef = null; mode = 'readonly'; setStatus('readonly'); }
      else setStatus('err');
    }
    saving = false;
    if (again) { again = false; save(); }
  }

  let noteTimer = null;
  $('#note').addEventListener('input', (e) => {
    st.napomena = e.target.value;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(save, 900);
  });
  $('#saveBtn').addEventListener('click', () => { clearTimeout(noteTimer); save(); });

  function asText() {
    return ['Perje i gvožđe · izbor dizajna'].concat(KEYS.map(([k, l]) => `${l}: ${st[k] ? st[k] + ' · ' + DIR[st[k]] : 'nije izabrano'}`))
      .concat(st.napomena ? ['Napomene: ' + st.napomena] : []).join('\n');
  }
  $('#copyBtn').addEventListener('click', () => {
    const txt = asText(), ta = $('#copyTxt');
    const fallback = () => { ta.hidden = false; ta.value = txt; ta.focus(); ta.select(); statusEl.className = 'status'; statusEl.textContent = 'Tekst je označen. Kopiraj ga i pošalji u razgovor.'; };
    try {
      navigator.clipboard.writeText(txt).then(() => { statusEl.className = 'status ok'; statusEl.textContent = 'Izbor je kopiran.'; }, fallback);
    } catch (e) { fallback(); }
  });

  async function initDb() {
    loadLocal();
    const c = window.claude;
    if (!c || typeof c.use !== 'function') { mode = 'local'; setStatus('local'); return; }
    let db = null;
    try { db = await c.use('db'); } catch (e) { db = null; }
    if (!db) { mode = 'local'; setStatus('local'); return; }
    try { docRef = db.doc('izbori/trenutni'); } catch (e) { docRef = null; mode = 'local'; setStatus('local'); return; }
    mode = 'db';
    let confirmed = false;
    const timer = setTimeout(() => { if (!confirmed) setStatus('slow'); }, 10000);
    docRef.onSnapshot((snap) => {
      if (!snap.metadata.fromCache && !confirmed) { confirmed = true; clearTimeout(timer); setStatus(snap.exists ? 'loaded' : 'empty'); }
      if (snap.exists && !snap.metadata.hasPendingWrites) apply(snap.data());
    }, () => { clearTimeout(timer); docRef = null; mode = 'local'; setStatus('err'); });
  }

  /* ---------- lightbox ---------- */
  const lb = $('#lb'), lbCanvas = $('#lbCanvas'), lbBody = $('#lbBody');
  let lbFull = false, lbH = 800, lastFocus = null;
  function lbScale() {
    const avail = lbBody.clientWidth - 32;
    let k = lbFull ? 1 : Math.min(1, avail / 1280);
    if (!lbFull && window.innerWidth < 700) k = Math.max(k, .55);
    lbCanvas.style.width = (1280 * k) + 'px';
    lbCanvas.style.height = (lbH * k) + 'px';
    const cv = lbCanvas.firstElementChild; if (cv) cv.style.transform = `scale(${k})`;
    $('#lbZoom').textContent = lbFull ? 'Uklopi' : '100%';
  }
  function openLb(id, from) {
    lastFocus = from;
    let html = '', title = '';
    if (id.startsWith('main')) { const s = id.slice(4); const m = MAINS.find(x => x[0] === s); html = m[3](); title = 'Glavni ekran ' + s + ' · ' + m[1]; lbH = 800; }
    else { const o = SCREENS.OTHER.find(x => x.id === id.slice(2)); html = o.fn(viewSkin); title = o.name + ' · stil ' + viewSkin; lbH = 760; }
    lbCanvas.innerHTML = html;
    $('#lbTitle').textContent = title;
    lb.hidden = false; lbFull = false; lbScale();
    document.body.style.overflow = 'hidden';
    $('#lbClose').focus();
  }
  function closeLb() { lb.hidden = true; lbCanvas.innerHTML = ''; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbZoom').addEventListener('click', () => { lbFull = !lbFull; lbScale(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lb.hidden) closeLb(); });
  window.addEventListener('resize', () => { if (!lb.hidden) lbScale(); });

  renderOther();
  observeMocks();
  renderState();
  initDb();
})();
