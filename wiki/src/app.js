/* Feather & Iron wiki: pages, coalition diagram, business calculator, EGG simulation. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const NF = (d) => new Intl.NumberFormat('sr-Latn-RS', { minimumFractionDigits: d, maximumFractionDigits: d });
  const f0 = NF(0), f1 = NF(1), f2 = NF(2);
  const eth = (v) => (Math.abs(v) >= 100 ? f0 : Math.abs(v) >= 10 ? f1 : f2).format(v);
  const usd = (v) => f0.format(v) + ' $';
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------------------------------------------------------------- pages */
  const PAGES = ['start', 'kitovi', 'koalicije', 'sezona', 'biznis', 'egg', 'pravno'];
  function show() {
    const id = PAGES.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'start';
    $$('[data-page]').forEach((p) => { p.hidden = p.dataset.page !== id; });
    $$('.toc a').forEach((a) => { if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    window.scrollTo(0, 0);
    requestAnimationFrame(drawAll);
  }
  window.addEventListener('hashchange', show);

  /* ---------------------------------------------------------------- charts */
  function niceTicks(min, max, n) {
    const span = max - min || Math.abs(max) || 1, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0);
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, out = [];
    for (let v = lo; v <= hi + step / 2; v += step) out.push(+v.toPrecision(12));
    return out;
  }
  function el(tag, attrs, parent) { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }

  // Line chart, one y axis. series: [{name, color, values, dash}] over x = 1..n days.
  function lineChart(box, { title, series, fmt, unit, from0 }) {
    box.innerHTML = '';
    const head = document.createElement('div'); head.className = 'ttl'; head.textContent = title; box.appendChild(head);
    if (series.length > 1) {
      const lg = document.createElement('div'); lg.className = 'legend';
      lg.innerHTML = series.map((s) => `<span><i style="background:${css(s.color)}${s.dash ? ';height:0;border-top:2px dashed ' + css(s.color) : ''}"></i>${s.name}</span>`).join('');
      box.appendChild(lg);
    }
    const W = Math.max(280, box.clientWidth), H = 220, m = { l: 58, r: 14, t: 10, b: 26 };
    const n = series[0].values.length, all = series.flatMap((s) => s.values);
    let lo = Math.min(...all), hi = Math.max(...all);
    if (from0) lo = 0;
    const ticks = niceTicks(lo, hi, 4); lo = ticks[0]; hi = ticks[ticks.length - 1];
    const X = (i) => m.l + (i / (n - 1)) * (W - m.l - m.r), Y = (v) => m.t + (1 - (v - lo) / (hi - lo || 1)) * (H - m.t - m.b);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': title });
    ticks.forEach((t) => { el('line', { x1: m.l, x2: W - m.r, y1: Y(t), y2: Y(t), stroke: css('--grid'), 'stroke-width': 1 }, svg); const tx = el('text', { x: m.l - 6, y: Y(t) + 4, 'text-anchor': 'end' }, svg); tx.textContent = fmt(t); });
    [0, 15, 30, 45, 60, 75, 90].filter((d) => d <= n).forEach((d) => { const i = Math.max(0, d - 1); const tx = el('text', { x: X(i), y: H - 6, 'text-anchor': d === 0 ? 'start' : d === 90 ? 'end' : 'middle' }, svg); tx.textContent = d === 0 ? 'dan 1' : String(d); });
    series.forEach((s) => {
      const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join('');
      el('path', { d, fill: 'none', stroke: css(s.color), 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-dasharray': s.dash ? '5 4' : 'none' }, svg);
      if (!s.dash) el('circle', { cx: X(n - 1), cy: Y(s.values[n - 1]), r: 4, fill: css(s.color), stroke: css('--sheet'), 'stroke-width': 2 }, svg);
    });
    const cross = el('line', { y1: m.t, y2: H - m.b, stroke: css('--ink2'), 'stroke-width': 1, visibility: 'hidden' }, svg);
    const dots = series.map((s) => el('circle', { r: 4, fill: css(s.color), stroke: css('--sheet'), 'stroke-width': 2, visibility: 'hidden' }, svg));
    const hit = el('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'transparent' }, svg);
    box.appendChild(svg);
    const tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true; box.appendChild(tip);
    const move = (ev) => {
      const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) * (W / r.width);
      const i = Math.max(0, Math.min(n - 1, Math.round((x - m.l) / (W - m.l - m.r) * (n - 1))));
      cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i)); cross.setAttribute('visibility', 'visible');
      dots.forEach((dt, k) => { dt.setAttribute('cx', X(i)); dt.setAttribute('cy', Y(series[k].values[i])); dt.setAttribute('visibility', 'visible'); });
      tip.innerHTML = `Dan ${i + 1}<br>` + series.map((s) => `${s.name}: ${fmt(s.values[i])}${unit ? ' ' + unit : ''}`).join('<br>');
      tip.hidden = false;
      const px = X(i) / W * r.width, left = px > r.width * 0.6 ? px - tip.offsetWidth - 12 : px + 12;
      tip.style.left = left + 'px'; tip.style.top = (head.offsetHeight + 6) + 'px';
    };
    hit.addEventListener('pointermove', move); hit.addEventListener('pointerdown', move);
    hit.addEventListener('pointerleave', () => { tip.hidden = true; cross.setAttribute('visibility', 'hidden'); dots.forEach((d) => d.setAttribute('visibility', 'hidden')); });
  }

  // Horizontal bars, one series.
  function barChart(box, { title, rows, fmt }) {
    box.innerHTML = '';
    const head = document.createElement('div'); head.className = 'ttl'; head.textContent = title; box.appendChild(head);
    const W = Math.max(280, box.clientWidth), rowH = 30, m = { l: 150, r: 64, t: 4, b: 4 }, H = m.t + m.b + rows.length * rowH;
    const max = Math.max(...rows.map((r) => r.v), 1e-9), X = (v) => m.l + (v / max) * (W - m.l - m.r);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': title });
    rows.forEach((r, i) => {
      const y = m.t + i * rowH;
      const lb = el('text', { x: m.l - 8, y: y + rowH / 2 + 4, 'text-anchor': 'end' }, svg); lb.textContent = r.label;
      const w = Math.max(2, X(r.v) - m.l);
      el('path', { d: `M${m.l},${y + 6}h${w - 4}a4,4 0 0 1 4,4v${rowH - 20}a4,4 0 0 1 -4,4h${-(w - 4)}z`, fill: css('--s1') }, svg);
      const vl = el('text', { x: m.l + w + 6, y: y + rowH / 2 + 4 }, svg); vl.textContent = fmt(r.v);
    });
    box.appendChild(svg);
  }

  /* ---------------------------------------------------------------- coalition diagram */
  function drawCoalition() {
    const box = $('#coalitionDiagram'); if (!box || !box.clientWidth) return;
    const fleets = [['Shark · Vanguard udar', 2.2], ['Crab · Ironhen zid', 4.6], ['Shrimp · Pecker roj', 1.4], ['Shrimp · Pecker roj', 3.1], ['Octopus · Egg Mortar', 5.2], ['Crab · Pack Brahma (plen)', 3.8]];
    const W = Math.max(520, box.clientWidth), rowH = 28, m = { l: 190, r: 20, t: 8, b: 30 }, H = m.t + m.b + fleets.length * rowH;
    const span = 6, X = (h) => m.l + ((h + span) / span) * (W - m.l - m.r - 30);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, style: `min-width:${W}px` });
    el('rect', { x: X(0), y: m.t, width: X(10 / 60) - X(0) + 6, height: H - m.t - m.b, fill: css('--olive'), opacity: 0.25 }, svg);
    [-6, -5, -4, -3, -2, -1, 0].forEach((h) => { el('line', { x1: X(h), x2: X(h), y1: m.t, y2: H - m.b, stroke: css('--grid') }, svg); const t = el('text', { x: X(h), y: H - 10, 'text-anchor': 'middle' }, svg); t.textContent = h === 0 ? 'dolazak' : h + ' h'; });
    fleets.forEach(([name, hours], i) => {
      const y = m.t + i * rowH, arrive = (i % 3) * (3 / 60);
      const lb = el('text', { x: m.l - 8, y: y + rowH / 2 + 4, 'text-anchor': 'end' }, svg); lb.textContent = name;
      el('rect', { x: X(-hours), y: y + 8, width: X(arrive) - X(-hours), height: rowH - 16, rx: 3, fill: css(i % 2 ? '--s2' : '--s1') }, svg);
      el('circle', { cx: X(arrive), cy: y + rowH / 2, r: 4, fill: css('--ink') }, svg);
    });
    box.innerHTML = ''; box.appendChild(svg);
  }

  /* ---------------------------------------------------------------- prizes */
  const PRIZES = [['1. mesto', 0.275], ['2. mesto', 0.165], ['3. mesto', 0.11], ['Lovac na kitove (prva tri: 7 / 5 / 3%)', 0.15], ['Najbolja koalicija', 0.10], ['Nedeljne nagrade (12 nedelja)', 0.15], ['Rezerva za sledeću sezonu', 0.05]];
  function prizeTable(pool, ethUsd) {
    const tb = $('#prizeTable tbody'); if (!tb) return;
    tb.innerHTML = PRIZES.map(([n, s]) => `<tr><td>${n}</td><td class="n">${f1.format(s * 100)}%</td><td class="n">${eth(pool * s)}</td><td class="n">${usd(pool * s * ethUsd)}</td></tr>`).join('') +
      `<tr class="tot"><td>Ukupno</td><td class="n">100%</td><td class="n">${eth(pool)}</td><td class="n">${usd(pool * ethUsd)}</td></tr>`;
    $('#prizePoolEx').textContent = f1.format(pool);
  }

  /* ---------------------------------------------------------------- business calculator */
  const BIZ_FIELDS = [
    ['ethUsd', 'Cena ETH (USD)', 1, 'Pretpostavka; unesi današnju.'],
    ['nftSold', 'NFT prodato pred sezonu', 1, 'Od 28.000 koje Roostr vlasnici ne dobiju besplatno.'],
    ['nftPrice', 'Cena NFT-a (ETH)', 0.001, ''],
    ['secVolume', 'Preprodaja NFT-ova (ETH)', 1, 'Ukupan promet na tržištima za sezonu.'],
    ['royalty', 'Royalty (%)', 0.5, ''],
    ['players', 'Aktivni igrači', 100, ''],
    ['tradesDay', 'Trgovina po igraču dnevno', 0.1, ''],
    ['tradeFee', 'Naknada po trgovini (ETH)', 0.00005, ''],
    ['passPrice', 'Sezonska propusnica (ETH)', 0.001, 'Samo kozmetika.'],
    ['passShare', 'Kupuje propusnicu (%)', 1, ''],
    ['cosmetic', 'Kozmetika po igraču (ETH)', 0.0005, 'Prosek za sezonu.'],
    ['eggVolume', 'Promet EGG bazena (ETH)', 1, 'Iz simulacije: oko 31 ETH u osnovnom scenariju.'],
    ['prizePct', 'U nagradni fond (%)', 1, 'Od prihoda tokom sezone.'],
    ['costs', 'Troškovi sezone (USD)', 100, 'Serveri, RPC, marketing, podrška, pravnik.'],
  ];
  const BIZ = {
    small: { ethUsd: 3000, nftSold: 1500, nftPrice: 0.015, secVolume: 80, royalty: 5, players: 1500, tradesDay: 1, tradeFee: 0.0002, passPrice: 0.008, passShare: 15, cosmetic: 0.001, eggVolume: 8, prizePct: 30, costs: 9000 },
    base: { ethUsd: 3000, nftSold: 5000, nftPrice: 0.02, secVolume: 400, royalty: 5, players: 6000, tradesDay: 1.5, tradeFee: 0.0002, passPrice: 0.01, passShare: 20, cosmetic: 0.002, eggVolume: 31, prizePct: 30, costs: 22500 },
    big: { ethUsd: 3000, nftSold: 15000, nftPrice: 0.03, secVolume: 1500, royalty: 5, players: 20000, tradesDay: 2, tradeFee: 0.0002, passPrice: 0.012, passShare: 25, cosmetic: 0.003, eggVolume: 120, prizePct: 30, costs: 60000 },
  };
  let biz = Object.assign({}, BIZ.base);
  function bizBuild() {
    const box = $('#bizControls'); if (!box) return;
    box.innerHTML = BIZ_FIELDS.map(([k, l, step, hint]) => `<div class="ctl"><label for="biz-${k}">${l}</label><input type="number" id="biz-${k}" data-k="${k}" step="${step}" min="0" value="${biz[k]}">${hint ? `<small>${hint}</small>` : ''}</div>`).join('');
    box.addEventListener('input', (e) => { const k = e.target.dataset.k; if (!k) return; biz[k] = Math.max(0, +e.target.value || 0); $$('[data-biz]').forEach((b) => b.setAttribute('aria-pressed', 'false')); bizRender(); });
    $$('[data-biz]').forEach((b) => b.addEventListener('click', () => { biz = Object.assign({}, BIZ[b.dataset.biz]); $$('[data-biz]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); BIZ_FIELDS.forEach(([k]) => { $('#biz-' + k).value = biz[k]; }); bizRender(); }));
  }
  function bizCalc(b) {
    const between = [['Prodaja NFT-ova', b.nftSold * b.nftPrice], ['Royalty', b.secVolume * b.royalty / 100]];
    const season = [['Naknade za trgovinu', b.players * b.tradesDay * b.tradeFee * 90], ['Sezonska propusnica', b.players * b.passShare / 100 * b.passPrice], ['Kozmetika', b.players * b.cosmetic], ['EGG bazen 0,3%', b.eggVolume * 0.003]];
    const sum = (a) => a.reduce((s, x) => s + x[1], 0);
    const bt = sum(between), st = sum(season), prize = st * b.prizePct / 100, costEth = b.costs / (b.ethUsd || 1);
    return { between, season, bt, st, prize, costEth, net: bt + st - prize - costEth };
  }
  function bizRender() {
    if (!$('#bizKpis')) return;
    const r = bizCalc(biz), U = biz.ethUsd;
    $('#bizKpis').innerHTML = [
      ['Prihod ukupno', eth(r.bt + r.st) + ' ETH', usd((r.bt + r.st) * U)],
      ['Nagradni fond', eth(r.prize) + ' ETH', usd(r.prize * U)],
      ['1. mesto (27,5%)', eth(r.prize * 0.275) + ' ETH', usd(r.prize * 0.275 * U)],
      ['Timu posle troškova', eth(r.net) + ' ETH', usd(r.net * U)],
    ].map(([l, v, s]) => `<div class="kpi"><small>${l}</small><b>${v}</b><span>${s}</span></div>`).join('');
    const rows = [...r.between.map(([l, v]) => ({ label: l, v })), ...r.season.map(([l, v]) => ({ label: l, v }))];
    barChart($('#bizChart'), { title: 'Prihod po izvoru, ETH', rows, fmt: eth });
    const line = (l, v, cls) => `<tr${cls ? ` class="${cls}"` : ''}><td>${l}</td><td class="n">${eth(v)}</td><td class="n">${usd(v * U)}</td></tr>`;
    $('#bizTable tbody').innerHTML = r.between.map(([l, v]) => line(l, v)).join('') + line('Između sezona', r.bt, 'tot') +
      r.season.map(([l, v]) => line(l, v)).join('') + line('Tokom sezone', r.st, 'tot') +
      line(`Nagradni fond (${f0.format(biz.prizePct)}% od sezone)`, -r.prize) + line('Troškovi', -r.costEth) + line('Timu ostaje', r.net, 'tot');
    prizeTable(r.prize, U);
  }

  /* ---------------------------------------------------------------- EGG simulation */
  const SIM_FIELDS = [
    ['players', 'Aktivni igrači', 1000, 30000, 500, (v) => f0.format(v), 'Svaki ima jednu koku: 1 jaje dnevno.'],
    ['useShare', 'Troše odmah u igri', 0, 0.9, 0.01, (v) => f0.format(v * 100) + '%', 'Udeo snesenih jaja koja se odmah potroše.'],
    ['sellShare', 'Prodaju ostatak', 0, 0.95, 0.01, (v) => f0.format(v * 100) + '%', 'Od onoga što ne potroše.'],
    ['buyerShare', 'Kupuju EGG za ETH', 0, 0.1, 0.005, (v) => f1.format(v * 100) + '%', 'Igrači koji dokupljuju jaja zbog prednosti.'],
    ['utility', 'Vrednost jajeta u igri', 0.00002, 0.00012, 0.000005, (v) => f1.format(v * 1e6) + ' µETH', 'Cilj cene; otkup radi ispod nje.'],
    ['rush', 'Jačina finiša', 1, 5, 0.1, (v) => '×' + f1.format(v), 'Koliko potražnja raste na kraju sezone.'],
    ['tradeFee', 'Naknada po trgovini', 0.0001, 0.001, 0.00005, (v) => NF(4).format(v) + ' ETH', 'Fiksni ETH po trgovini na Market-u.'],
    ['buyback', 'Otkup i spaljivanje', 0, 0.5, 0.01, (v) => f0.format(v * 100) + '%', 'Udeo prihoda za otkup kad je cena ispod cilja.'],
    ['prize', 'Nagradni fond', 0.1, 0.5, 0.01, (v) => f0.format(v * 100) + '%', 'Udeo prihoda sezone za nagrade.'],
  ];
  let sim = Object.assign({}, EggSim.SCENARIOS.base), simKey = 'base', simResult = null;
  function simBuild() {
    const sc = $('#simScenarios'); if (!sc) return;
    sc.innerHTML = Object.entries(EggSim.SCENARIOS).map(([k, s]) => `<button type="button" class="btn" data-sc="${k}" aria-pressed="${k === simKey}">${s.label}</button>`).join('');
    sc.addEventListener('click', (e) => { const b = e.target.closest('[data-sc]'); if (!b) return; simKey = b.dataset.sc; sim = Object.assign({}, EggSim.SCENARIOS[simKey]); $$('[data-sc]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); simSync(); simRun(); });
    $('#simControls').innerHTML = SIM_FIELDS.map(([k, l, mn, mx, st, fm, hint]) => `<div class="ctl"><label for="sim-${k}">${l}<output id="out-${k}">${fm(sim[k])}</output></label><input type="range" id="sim-${k}" data-k="${k}" min="${mn}" max="${mx}" step="${st}" value="${sim[k]}"><small>${hint}</small></div>`).join('');
    $('#simControls').addEventListener('input', (e) => { const k = e.target.dataset.k; if (!k) return; sim[k] = +e.target.value; const fd = SIM_FIELDS.find((x) => x[0] === k); $('#out-' + k).textContent = fd[5](sim[k]); $$('[data-sc]').forEach((x) => x.setAttribute('aria-pressed', 'false')); simRun(); });
  }
  function simSync() { SIM_FIELDS.forEach(([k, , , , , fm]) => { $('#sim-' + k).value = sim[k]; $('#out-' + k).textContent = fm(sim[k]); }); }
  function simRun() { simResult = EggSim.simulate(sim); simDraw(); }
  function simDraw() {
    const r = simResult; if (!r || !$('#simKpis') || !$('#chPrice').clientWidth) return;
    const U = 3000, ch = r.change * 100;
    $('#simKpis').innerHTML = [
      ['Cena na kraju', f1.format(r.end * 1e6) + ' µETH', `${ch >= 0 ? '+' : ''}${f0.format(ch)}% · ${f2.format(r.end * U * 100)} centi`],
      ['Spaljeno / sneseno', f0.format(r.burned / 1000) + 'k / ' + f0.format(r.laid / 1000) + 'k', r.burned >= r.laid ? 'količina opada' : 'količina raste'],
      ['Nagradni fond', eth(r.prize) + ' ETH', usd(r.prize * U)],
      ['Trezor', eth(r.treasury) + ' ETH', 'posle otkupa'],
    ].map(([l, v, s]) => `<div class="kpi"><small>${l}</small><b>${v}</b><span>${s}</span></div>`).join('');
    const D = r.days;
    lineChart($('#chPrice'), { title: 'Cena EGG-a, µETH (milioniti deo ETH-a)', series: [{ name: 'Cena', color: '--s1', values: D.map((d) => d.price * 1e6) }, { name: 'Cilj (vrednost u igri)', color: '--ink2', dash: true, values: D.map(() => sim.utility * 1e6) }], fmt: (v) => f1.format(v) });
    lineChart($('#chSupply'), { title: 'Jaja, ukupno od početka sezone', series: [{ name: 'Snesena', color: '--s1', values: D.map((d) => d.laid / 1000) }, { name: 'Spaljena', color: '--s2', values: D.map((d) => d.burned / 1000) }, { name: 'Kod igrača', color: '--s3', values: D.map((d) => d.float / 1000) }], fmt: (v) => f0.format(v) + 'k', from0: true });
    lineChart($('#chMoney'), { title: 'Nagradni fond i trezor, ETH', series: [{ name: 'Nagradni fond', color: '--s1', values: D.map((d) => d.prize) }, { name: 'Trezor', color: '--s2', values: D.map((d) => d.treasury) }], fmt: (v) => f1.format(v), from0: true });
  }

  function drawAll() { drawCoalition(); bizRender(); simDraw(); }
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(drawAll, 150); });
  const mq = window.matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', drawAll);
  new MutationObserver(drawAll).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  bizBuild(); simBuild(); simResult = EggSim.simulate(sim);
  show();
})();
