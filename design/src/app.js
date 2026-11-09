/* Feather & Iron: page logic */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const DIR = { A: 'Trench', B: 'Heraldic' };
  const STYLES = ['A', 'B'];
  const KEYS = [['eggs', 'Starting eggs'], ['units', 'Units'], ['buildings', 'Buildings'], ['main', 'Main screen'], ['screens', 'Other screens']];
  const label = (k, v) => !v ? '' : k === 'eggs' ? fmt(+v) + ' eggs' : v + ' · ' + DIR[v];

  $$('[data-ic]').forEach(el => { el.outerHTML = ICO(el.dataset.ic); });

  /* ---------- world: plots chart ---------- */
  const ZONES = {
    Roadside: { who: 'Small plots, but the hottest, so the Oil Press runs best here.' },
    Meadow: { who: 'The most fields on the street. Best for a home coop and a long game.' },
    Gardens: { who: 'Large plots with a mild climate.' },
    Creek: { who: 'Medium plots, cool and damp. Oil runs a little slower.' },
    Grove: { who: 'Small, cold plots along the trees. The Oil Press struggles.' }
  };
  const PLOT = [
    [1, 'Roadside', 44, 72, 28, 34], [2, 'Roadside', 52, 84, 26, 32], [3, 'Roadside', 70, 110, 24, 30],
    [4, 'Meadow', 150, 210, 18, 24], [5, 'Meadow', 172, 238, 16, 22], [6, 'Meadow', 165, 226, 16, 22],
    [7, 'Gardens', 148, 204, 14, 20], [8, 'Gardens', 140, 196, 12, 18], [9, 'Gardens', 132, 186, 12, 18],
    [10, 'Creek', 118, 166, 8, 14], [11, 'Creek', 110, 156, 6, 12], [12, 'Creek', 102, 148, 6, 12],
    [13, 'Grove', 90, 132, 2, 8], [14, 'Grove', 80, 120, 0, 6], [15, 'Grove', 70, 110, -2, 4]
  ];
  const oilPct = (t) => Math.round((t - 15) * 1.5);
  const sgn = (n) => (n > 0 ? '+' : n < 0 ? '−' : '±') + Math.abs(n) + '%';
  const deg = (t) => (t < 0 ? '−' + Math.abs(t) : t);
  let selPlot = 4;
  const C = { L: 46, R: 628, T: 28, B: 214, W: 640, H: 270 };
  const yv = (v) => C.B - (v / 250) * (C.B - C.T);
  const slot = (C.R - C.L) / 15;

  function drawChart() {
    let g = '';
    for (const t of [0, 50, 100, 150, 200, 250]) g += `<line class="g" x1="${C.L}" x2="${C.R}" y1="${yv(t)}" y2="${yv(t)}"/><text x="${C.L - 8}" y="${yv(t) + 4}" text-anchor="end">${t}</text>`;
    let bars = '';
    PLOT.forEach((p, i) => {
      const cx = C.L + slot * i + slot / 2, y1 = yv(p[3]), y0 = yv(p[2]);
      bars += `<g class="bar${i === selPlot ? ' sel' : ''}" data-i="${i}" role="button" tabindex="0" aria-label="Plot ${p[0]}, ${p[1]}, ${p[2]} to ${p[3]} fields" aria-pressed="${i === selPlot}">` +
        `<rect class="hit" x="${(C.L + slot * i).toFixed(1)}" y="${C.T}" width="${slot.toFixed(1)}" height="${C.B - C.T}"/>` +
        `<rect class="mk" x="${(cx - 10).toFixed(1)}" y="${y1.toFixed(1)}" width="20" height="${(y0 - y1).toFixed(1)}" rx="4"/>` +
        `<text x="${cx.toFixed(1)}" y="${C.B + 16}" text-anchor="middle">${p[0]}</text></g>`;
    });
    const sp = PLOT[selPlot], scx = C.L + slot * selPlot + slot / 2;
    const vl = `<text class="vl" x="${scx.toFixed(1)}" y="${(yv(sp[3]) - 8).toFixed(1)}" text-anchor="middle">${sp[2]}–${sp[3]}</text>`;
    let zl = '';
    Object.keys(ZONES).forEach((z, j) => {
      const x0 = C.L + slot * j * 3 + 4, x1 = C.L + slot * (j * 3 + 3) - 4;
      zl += `<line class="zb" x1="${x0.toFixed(1)}" x2="${x1.toFixed(1)}" y1="${C.B + 26}" y2="${C.B + 26}"/><text class="zl" x="${((x0 + x1) / 2).toFixed(1)}" y="${C.B + 44}" text-anchor="middle">${z.toUpperCase()}</text>`;
    });
    $('#chart').innerHTML = `<svg viewBox="0 0 ${C.W} ${C.H}" role="group" aria-label="Build fields by plot, 1 to 15">${g}${bars}${vl}${zl}</svg>`;
    drawPlot();
  }
  function drawPlot() {
    const p = PLOT[selPlot];
    $('#plot').innerHTML = `<p class="eyebrow">Plot ${p[0]} of 15</p><div class="z">${p[1]}</div><div class="r">${p[2]}–${p[3]} fields · ${deg(p[4])} to ${p[5]} °C</div><p class="muted">${ZONES[p[1]].who}</p>` +
      `<dl><dt>Oil output</dt><dd>${sgn(oilPct(p[4]))} to ${sgn(oilPct(p[5]))}</dd><dt>Example</dt><dd>Sunflower 117/${p[0]}</dd><dt>Rule</dt><dd>Home coops always get 175 fields. Fence Extension adds 4 fields per level.</dd></dl>`;
  }
  const chartEl = $('#chart'), tip = $('#tip'), box = $('.chartbox');
  const focusBar = () => { const b = $(`.bar[data-i="${selPlot}"]`, chartEl); if (b) b.focus({ preventScroll: true }); };
  chartEl.addEventListener('click', (e) => { const b = e.target.closest('.bar'); if (b) { selPlot = +b.dataset.i; drawChart(); focusBar(); } });
  chartEl.addEventListener('keydown', (e) => {
    const b = e.target.closest('.bar'); if (!b) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selPlot = +b.dataset.i; drawChart(); focusBar(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); selPlot = Math.max(0, Math.min(14, selPlot + (e.key === 'ArrowRight' ? 1 : -1))); drawChart(); focusBar(); }
  });
  function showTip(b) {
    const p = PLOT[+b.dataset.i], r = b.querySelector('.mk').getBoundingClientRect(), br = box.getBoundingClientRect();
    tip.innerHTML = `Plot ${p[0]} · ${p[1]}<br>${p[2]}–${p[3]} fields · ${deg(p[4])} to ${p[5]} °C`;
    tip.style.left = (r.left + r.width / 2 - br.left) + 'px';
    tip.style.top = (r.top - br.top - 8) + 'px';
    tip.hidden = false;
  }
  chartEl.addEventListener('mouseover', (e) => { const b = e.target.closest('.bar'); if (b) showTip(b); });
  chartEl.addEventListener('mouseleave', () => { tip.hidden = true; });
  chartEl.addEventListener('focusin', (e) => { const b = e.target.closest('.bar'); if (b) showTip(b); });
  chartEl.addEventListener('focusout', () => { tip.hidden = true; });
  drawChart();

  $('#zoneTable tbody').innerHTML = Object.keys(ZONES).map((z, j) => {
    const ps = PLOT.slice(j * 3, j * 3 + 3), lo = Math.min(...ps.map(p => p[2])), hi = Math.max(...ps.map(p => p[3]));
    const t0 = Math.min(...ps.map(p => p[4])), t1 = Math.max(...ps.map(p => p[5]));
    return `<tr><td><b>${z}</b></td><td class="n">${ps[0][0]}–${ps[2][0]}</td><td class="n">${lo}–${hi}</td><td class="n">${deg(t0)} to ${t1} °C</td><td class="n">${sgn(oilPct(t0))} to ${sgn(oilPct(t1))}</td></tr>`;
  }).join('');
  $('#hoods').innerHTML = ['Old Estate', 'Cornfield', 'Sunflower', 'Watermill', 'Vineyard', 'Pasture', 'Brickworks', 'Apiary', 'Orchard', 'Haybarn', 'Millpond', 'Clover Hill']
    .map((n, i) => `<div><i>Neighborhood ${i + 1}</i><b>${n}</b></div>`).join('');

  /* ---------- resources: production table ---------- */
  const PROD = [
    ['Grain Field', 'Grain', L => 20 + 15 * L * Math.pow(1.14, L)],
    ['Grit Pit', 'Grit', L => 10 + 9 * L * Math.pow(1.14, L)],
    ['Oil Press', 'Oil', L => 5 * L * Math.pow(1.14, L) * (1 + 0.015 * 3)],
    ['Windmill', 'Power', L => 14 * L * Math.pow(1.12, L)]
  ];
  $('#prod tbody').innerHTML = PROD.map(p => `<tr><td><b>${p[0]}</b> <span class="muted small">${p[1]}</span></td>${[1, 5, 10, 15, 20].map(L => `<td class="n">${fmt(p[2](L))}</td>`).join('')}</tr>`).join('');

  /* ---------- rules: units and defenses ---------- */
  const eggsOf = (g, r, o) => Math.ceil((g + 2 * r + 4 * o) / 200);
  const UNITS = [
    ['Scout', 'Fast spy, light silkie', 0, 100, 10, 0, 0, 20, 120, 5],
    ['Pecker', 'Line hen, cheap and many', 150, 50, 0, 8, 0, 40, 30, 20],
    ['Spurguard', 'Heavy hen in mail and spurs', 400, 200, 0, 20, 15, 110, 26, 30],
    ['Vanguard', 'Rooster shock trooper', 1200, 500, 150, 60, 20, 280, 40, 120],
    ['Ironhen', 'Brahma in full plate', 3000, 1400, 0, 110, 35, 720, 22, 200],
    ['Egg Mortar', 'Artillery hen, breaks defenses', 3600, 2000, 1200, 240, 10, 480, 14, 40],
    ['Breacher', 'Ram rooster, breaks domes', 5000, 4000, 1500, 400, 30, 1100, 12, 150],
    ['War Brahma', 'Giant hen with a war tower', 300000, 250000, 80000, 9000, 55, 60000, 3, 50000],
    ['Pack Hen', 'Small transport', 150, 120, 0, 1, 0, 60, 24, 400],
    ['Pack Brahma', 'Large transport', 450, 400, 0, 1, 5, 180, 20, 2000],
    ['Settler Hen', 'Claims a free plot', 800, 1500, 800, 2, 0, 400, 10, 500],
    ['Gleaner', 'Gathers feather fields', 800, 500, 200, 1, 0, 300, 9, 1600]
  ];
  $('#units tbody').innerHTML = UNITS.map(u => `<tr><td><b>${u[0]}</b></td><td>${u[1]}</td><td class="n">${fmt(u[2])} / ${fmt(u[3])} / ${fmt(u[4])}</td><td class="n">${fmt(eggsOf(u[2], u[3], u[4]))}</td><td class="n">${fmt(u[5])}</td><td class="n">${u[6]}%</td><td class="n">${fmt(u[7])}</td><td class="n">${u[8]}</td><td class="n">${fmt(u[9])}</td></tr>`).join('');
  const DEFS = [
    ['Wattle Fence', 100, 0, 0, 2, 20, 100, 'Cheap wall that soaks hits'],
    ['Barbed Wire', 160, 40, 0, 6, 0, 90, 'Hurts light units'],
    ['Slinger Nest', 250, 80, 0, 14, 10, 120, 'The basic shooter'],
    ['Corn Cannon', 900, 400, 100, 70, 20, 450, 'Strong against heavy hens'],
    ['Scarecrow Tower', 4000, 2500, 600, 300, 30, 2200, 'The heavy tower'],
    ['Small Shell Dome', 2000, 2000, 0, 0, 0, 0, 'Soaks 4,000 damage a round. One per coop'],
    ['Large Shell Dome', 10000, 10000, 0, 0, 0, 0, 'Soaks 20,000 damage a round. One per coop']
  ];
  $('#defs tbody').innerHTML = DEFS.map(d => `<tr><td><b>${d[0]}</b></td><td class="n">${fmt(d[1])} / ${fmt(d[2])} / ${fmt(d[3])}</td><td class="n">${fmt(eggsOf(d[1], d[2], d[3]))}</td><td class="n">${d[4] ? fmt(d[4]) : '—'}</td><td class="n">${d[6] ? d[5] + '%' : '—'}</td><td class="n">${d[6] ? fmt(d[6]) : '—'}</td><td>${d[7]}</td></tr>`).join('');

  /* ---------- eggs calculator ---------- */
  const cE = $('#cE'), cL = $('#cL'), cG = $('#cG');
  const cap = (L) => Math.round(6 * Math.pow(L, 1.4));
  function calc() {
    const E = +cE.value, L = +cL.value, Gn = +cG.value, bonus = 1 + Gn * .03, c = cap(L);
    $('#oE').textContent = fmt(E); $('#oL').textContent = L; $('#oG').textContent = Gn ? Gn + ' (+' + Gn * 3 + '%)' : '0';
    const u = (eggs) => Math.floor(E / eggs * bonus);
    const mins = E * 10, spd = mins >= 120 ? fmt(mins / 60) + ' h' : fmt(mins) + ' min';
    const tiles = [
      [fmt(u(2)), 'Peckers', 'line hens · 2 eggs each'], [fmt(u(14)), 'Vanguards', 'rooster shock troops · 14 eggs'], [fmt(u(7)), 'Pack Brahmas', 'cargo ' + fmt(u(7) * 2000)],
      [fmt(u(57)), 'Scarecrow Towers', 'heavy defense · 57 eggs'], [fmt(E * 200), 'Grain', '1 egg = 200 Grain'], [spd, 'of speed-ups', '1 egg = 10 minutes']
    ];
    const hrs = c ? E / c : 0, h = Math.floor(hrs), m = Math.round((hrs - h) * 60);
    $('#outs').innerHTML = tiles.map(t => `<div class="out"><b>${t[0]}</b><span>${t[1]}</span><small>${t[2]}</small></div>`).join('') +
      `<div class="ptime"><span class="muted">Every egg passes through the Hatchery. All of them take</span><b>${h} h ${m} min</b><span class="small muted">A level ${L} Hatchery handles ${fmt(c)} eggs an hour.</span></div>`;
  }
  [cE, cL, cG].forEach(i => i.addEventListener('input', calc));
  calc();

  /* ---------- design picker ---------- */
  const st = { eggs: null, units: null, buildings: null, main: null, screens: null, notes: '' };
  let viewSkin = 'A';
  const UL = [['titan', 'War Brahma', 'Titan · giant hen with a war tower', '5,600 eggs · Attack 9,000 · Health 60,000 · Cargo 50,000'], ['scout', 'Scout', 'Spy · 2 eggs'], ['pecker', 'Pecker', 'Line hen · 2 eggs'], ['spurguard', 'Spurguard', 'Heavy hen · 4 eggs'], ['vanguard', 'Vanguard', 'Rooster shock trooper · 14 eggs'], ['mortar', 'Egg Mortar', 'Artillery · 62 eggs'], ['pack', 'Pack Brahma', 'Large transport · 7 eggs']];
  const BL = [['henhouse', 'Henhouse', 'Main building', 'Speeds up construction. Its level gates the other buildings.'], ['windmill', 'Windmill', 'Power'], ['grain', 'Grain Field', 'Grain'], ['hatchery', 'Hatchery', 'Units and egg use'], ['scarecrow', 'Scarecrow Tower', 'Heavy defense · 57 eggs']];
  function cols(key, list, prefix) {
    return STYLES.map(s => `<div class="col s${s}" data-s="${s}"><div class="col-h"><b><i>${s}</i>${DIR[s]}</b><button class="pbtn sm" type="button" data-pick="${key}" data-v="${s}" aria-pressed="false">Pick ${s}</button></div>` +
      `<div class="sheet">${list.map((it, i) => i === 0
        ? `<figure class="card wide"><img src="img/${prefix}${s}_${it[0]}.webp" alt="${it[1]}, style ${DIR[s]}" decoding="async"><figcaption><b>${it[1]}</b><span>${it[2]}</span><em>${it[3]}</em></figcaption></figure>`
        : `<figure class="card${prefix === 'b' ? ' bld' : ''}"><img src="img/${prefix}${s}_${it[0]}.webp" alt="${it[1]}, style ${DIR[s]}" loading="lazy" decoding="async"><figcaption><b>${it[1]}</b><span>${it[2]}</span></figcaption></figure>`).join('')}</div></div>`).join('');
  }
  $('#colsUnits').innerHTML = cols('units', UL, 'u');
  $('#colsBuildings').innerHTML = cols('buildings', BL, 'b');
  $$('.seg').forEach(sg => {
    const key = sg.dataset.seg;
    sg.innerHTML = STYLES.map(s => `<button class="pbtn sm" type="button" data-show="${s}" aria-pressed="${s === 'A'}">${s} · ${DIR[s]}</button>`).join('');
    sg.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      $(key === 'units' ? '#colsUnits' : '#colsBuildings').dataset.show = b.dataset.show;
      $$('button', sg).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    });
  });

  const MAINS = [['A', 'Command Post', 'Menu on the left as file tabs, resources as riveted plates, the yard as a field photograph, and a telegraph of flock movements on the right.', SCREENS.mainA],
    ['B', 'Great Hall', 'Crest and wax seals on top, a row of shield buttons, an illuminated picture of the estate, news as a scroll, and coops as pennants.', SCREENS.mainB]];
  $('#mainMocks').innerHTML = MAINS.map(m => `<figure class="mfig" data-s="${m[0]}"><div class="mfig-h"><div><b><i>${m[0]}</i>${m[1]}</b><p>${m[2]}</p></div><div class="acts"><button class="pbtn sm" type="button" data-zoom="main${m[0]}">Enlarge</button><button class="pbtn sm" type="button" data-pick="main" data-v="${m[0]}" aria-pressed="false">Pick ${m[0]}</button></div></div><div class="mock">${m[3]()}</div></figure>`).join('');

  function renderOther() {
    $('#otherMocks').innerHTML = SCREENS.OTHER.map(o => `<figure class="mfig"><div class="mfig-h"><div><b>${o.name}</b><p>${o.desc}</p></div><div class="acts"><button class="pbtn sm" type="button" data-zoom="o:${o.id}">Enlarge</button></div></div><div class="mock tall">${o.fn(viewSkin)}</div></figure>`).join('');
    $('#skinBtns').innerHTML = STYLES.map(s => `<button class="pbtn sm" type="button" data-skin="${s}" aria-pressed="${s === viewSkin}">${s} · ${DIR[s]}</button>`).join('');
    observeMocks();
    renderState();
  }
  $('#skinBtns').addEventListener('click', (e) => { const b = e.target.closest('[data-skin]'); if (b && b.dataset.skin !== viewSkin) { viewSkin = b.dataset.skin; renderOther(); } });
  $('#pickSkin').addEventListener('click', () => pick('screens', viewSkin));

  const ro = 'ResizeObserver' in window ? new ResizeObserver(es => es.forEach(en => en.target.style.setProperty('--k', (en.contentRect.width / 1280).toFixed(4)))) : null;
  function observeMocks() {
    $$('.mock').forEach(m => {
      m.style.setProperty('--k', (m.clientWidth / 1280).toFixed(4));
      if (ro && !m.dataset.obs) { ro.observe(m); m.dataset.obs = '1'; }
    });
  }

  function pick(key, v) {
    st[key] = v;
    if (key === 'eggs') { cE.value = v; calc(); }
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
      if (b.classList.contains('opt')) { $('.ob', b).textContent = on ? 'Picked ✓' : 'Pick ' + fmt(+b.dataset.v); }
      else b.textContent = on ? 'Picked ✓' : 'Pick ' + b.dataset.v;
    });
    $$('.cols3').forEach(c => {
      const key = c.id === 'colsUnits' ? 'units' : 'buildings';
      $$('.col', c).forEach(col => col.classList.toggle('sel', st[key] === col.dataset.s));
    });
    $$('#mainMocks .mfig').forEach(f => f.classList.toggle('sel', st.main === f.dataset.s));
    $$('#otherMocks .mfig').forEach(f => f.classList.toggle('sel', st.screens === viewSkin));
    const pb = $('#pickSkin'), on = st.screens === viewSkin;
    pb.textContent = on ? 'Picked ✓' : 'Pick style ' + viewSkin;
    pb.setAttribute('aria-pressed', String(on));
    KEYS.forEach(([k]) => {
      const c = $(`[data-cur="${k}"]`);
      c.textContent = st[k] ? 'Picked: ' + label(k, st[k]) : 'Not picked';
      c.classList.toggle('on', !!st[k]);
      $(`#navpick b[data-k="${k}"]`).classList.toggle('on', !!st[k]);
    });
    const anchors = { eggs: 'eggs', units: 'units-pick', buildings: 'buildings-pick', main: 'main-pick', screens: 'screens-pick' };
    $('#sumt').innerHTML = KEYS.map(([k, l]) => `<div><span>${l}</span><a href="#${anchors[k]}" class="${st[k] ? 'on' : ''}">${st[k] ? label(k, st[k]) : 'pick →'}</a></div>`).join('');
    const nt = $('#note');
    if (document.activeElement !== nt && nt.value !== st.notes) nt.value = st.notes;
  }

  /* ---------- persistence ---------- */
  const LSK = 'feather-iron-picks';
  let docRef = null, saving = false, again = false, mode = 'loading';
  const statusEl = $('#status');
  function setStatus(kind) {
    const t = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const M = {
      empty: ['', 'Nothing saved yet. Every pick saves as soon as you click it.'],
      loaded: ['ok', 'Your saved picks are loaded.'],
      saving: ['', 'Saving…'],
      saved: ['ok', 'Saved at ' + t + '. Claude can read these picks.'],
      slow: ['warn', 'Saved picks are not loading yet. New picks will save once the connection is back.'],
      local: ['warn', 'Saving with the page is not available in this view. Picks stay in this browser, so copy them as text and paste them into the chat.'],
      readonly: ['warn', 'This view can\'t change the saved picks. Copy them as text and paste them into the chat.'],
      err: ['warn', 'Saving failed. Try again, or copy the picks as text.']
    };
    const m = M[kind] || M.err;
    statusEl.className = 'status ' + m[0];
    statusEl.textContent = m[1];
  }
  const valid = (k, v) => k === 'eggs' ? (['500', '1000', '2000'].includes(v) ? v : null) : (STYLES.includes(v) ? v : null);
  function apply(d) {
    if (!d) return;
    KEYS.forEach(([k]) => { st[k] = valid(k, d[k]); });
    if (typeof d.notes === 'string') st.notes = d.notes;
    if (st.eggs) { cE.value = st.eggs; calc(); }
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
      await docRef.set({ eggs: st.eggs, units: st.units, buildings: st.buildings, main: st.main, screens: st.screens, notes: st.notes.slice(0, 4000), updatedAt: new Date().toISOString() });
      setStatus('saved');
    } catch (e) {
      if (e && e.code === 'invalid_argument') { docRef = null; mode = 'readonly'; setStatus('readonly'); }
      else setStatus('err');
    }
    saving = false;
    if (again) { again = false; save(); }
  }
  let noteTimer = null;
  $('#note').addEventListener('input', (e) => { st.notes = e.target.value; clearTimeout(noteTimer); noteTimer = setTimeout(save, 900); });
  $('#saveBtn').addEventListener('click', () => { clearTimeout(noteTimer); save(); });
  const asText = () => ['Feather & Iron · design picks'].concat(KEYS.map(([k, l]) => `${l}: ${st[k] ? label(k, st[k]) : 'not picked'}`)).concat(st.notes ? ['Notes: ' + st.notes] : []).join('\n');
  $('#copyBtn').addEventListener('click', () => {
    const txt = asText(), ta = $('#copyTxt');
    const fallback = () => { ta.hidden = false; ta.value = txt; ta.focus(); ta.select(); statusEl.className = 'status'; statusEl.textContent = 'The text is selected. Copy it and paste it into the chat.'; };
    try { navigator.clipboard.writeText(txt).then(() => { statusEl.className = 'status ok'; statusEl.textContent = 'Picks copied.'; }, fallback); } catch (e) { fallback(); }
  });
  async function initDb() {
    loadLocal();
    const c = window.claude;
    if (!c || typeof c.use !== 'function') { mode = 'local'; setStatus('local'); return; }
    let db = null;
    try { db = await c.use('db'); } catch (e) { db = null; }
    if (!db) { mode = 'local'; setStatus('local'); return; }
    try { docRef = db.doc('choices/current'); } catch (e) { docRef = null; mode = 'local'; setStatus('local'); return; }
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
    $('#lbZoom').textContent = lbFull ? 'Fit' : '100%';
  }
  function openLb(id, from) {
    lastFocus = from;
    let html = '', title = '';
    if (id.startsWith('main')) { const s = id.slice(4); const m = MAINS.find(x => x[0] === s); html = m[3](); title = 'Main screen ' + s + ' · ' + m[1]; lbH = 800; }
    else { const o = SCREENS.OTHER.find(x => x.id === id.slice(2)); html = o.fn(viewSkin); title = o.name + ' · style ' + viewSkin; lbH = 760; }
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
