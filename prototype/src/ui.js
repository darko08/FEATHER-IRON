/* Feather & Iron prototype: interface */
(function () {
  'use strict';
  const G = window.GAME, I = (n) => ICO(n);
  const { fmt, dur, B, R, U, D, PLOT, ZONE, HOODS, STREETS, addrStr } = G;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const app = $('#app');
  const RES = [['g', 'Grain', 'zrno'], ['r', 'Grit', 'krec'], ['o', 'Oil', 'ulje']];
  const SPEEDS = [1, 10, 60, 300];
  const NAV = [['overview', 'Overview', 'pregled'], ['buildings', 'Buildings', 'zgrade'], ['research', 'Research', 'istrazivanja'], ['hatchery', 'Hatchery', 'inkubator'], ['defense', 'Defense', 'odbrana'], ['neighborhood', 'Neighborhood', 'komsiluk'], ['flocks', 'Flocks', 'odred'], ['messages', 'Messages', 'poruke'], ['wallet', 'Wallet', 'novcanik'], ['ranks', 'Pecking Order', 'rang']];
  const ui = { screen: 'overview', tab: 'army', nbN: 2, nbS: 117, sel: 6, open: null, fm: 'raid', fto: { n: 2, s: 117, p: 5 }, fpct: 1, crackInto: 'g' };
  let dirty = false, dirtySide = false, lastRender = 0, toastTimer = null;
  const img = (f, alt, cls) => `<img src="img/${f}.webp" alt="${alt || ''}"${cls ? ` class="${cls}"` : ''} loading="lazy" decoding="async">`;
  const S = () => G.S;

  /* ---------- persistence ---------- */
  const LSK = 'feather-iron-proto-v1';
  const store = { ref: null, busy: false, again: false, timer: null, last: 0 };
  function snapshot() { const s = S(); s.savedAt = Date.now(); return JSON.stringify(s); }
  function saveLocal() { if (!S()) return; try { localStorage.setItem(LSK, snapshot()); } catch (e) { /* storage unavailable */ } }
  function saveRemoteSoon() { if (store.timer) return; const wait = Math.max(2500, 8000 - (Date.now() - store.last)); store.timer = setTimeout(() => { store.timer = null; saveRemote(); }, wait); }
  async function saveRemote() {
    if (!store.ref || !S()) return;
    if (store.busy) { store.again = true; return; }
    store.busy = true; store.last = Date.now();
    try { await store.ref.set({ json: snapshot(), savedAt: Date.now() }); } catch (e) { const code = e && e.code; if (code === 'resource_exhausted') store.last = Date.now() + 30000; else if (code !== 'unavailable') store.ref = null; }
    store.busy = false;
    if (store.again) { store.again = false; saveRemote(); }
  }
  function changed() { saveLocal(); saveRemoteSoon(); }
  function catchUp(s) {
    const away = Math.max(0, (Date.now() - (s.savedAt || Date.now())) / 1000);
    const gameSecs = Math.min(away * s.speed, 12 * 3600);
    if (gameSecs > 1) G.advance(gameSecs);
  }
  function loadLocal() { try { const v = localStorage.getItem(LSK); if (v) return JSON.parse(v); } catch (e) { /* storage unavailable */ } return null; }
  async function initStore() {
    try {
      const c = window.claude; if (!c || typeof c.use !== 'function') return;
      const [db, user] = await Promise.all([c.use('db'), c.use('user')]);
      if (!db || !user) return;
      const uid = await user.id(); if (!uid) return;
      store.ref = db.collection('data/users/' + uid).doc('game');
      const snap = await Promise.race([store.ref.get(), new Promise(r => setTimeout(() => r(null), 10000))]);
      if (snap && snap.exists) {
        const d = snap.data(); const remote = JSON.parse(d.json || 'null');
        if (remote && (!S() || (remote.savedAt || 0) > (S().savedAt || 0))) { G.S = remote; catchUp(remote); toast('Your saved coop is loaded.'); renderAll(); }
      } else if (S()) saveRemote();
    } catch (e) { store.ref = null; }
  }

  /* ---------- toasts ---------- */
  function toast(msg) {
    let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3800);
  }
  function act(err, ok) { if (err) toast(err); else { if (ok) toast(ok); changed(); renderMain(); renderSide(); paint(); } }

  /* ---------- small renderers ---------- */
  function costHtml(cost, c) {
    return `<div class="cost">${RES.map(([k, l, ic]) => cost[k] ? `<span class="${c && c.res[k] < cost[k] ? 'lack' : ''}" data-need-${k}="${cost[k]}">${I(ic)}${fmt(cost[k])}</span>` : '').join('')}</div>`;
  }
  const reqHtml = (miss) => miss.length ? `<div class="req">Needs ${miss.map(m => `${m.name} ${m.need}`).join(', ')}</div>` : '';
  const progress = (start, end, cls) => `<i class="bar ${cls || ''}"><u data-ps="${start}" data-pe="${end}" style="width:0%"></u></i>`;
  const timer = (end) => `<span class="t" data-end="${end}">${dur(end - S().t)}</span>`;
  function clock() { const t = S().t, d = Math.floor(t / 86400) + 1, h = Math.floor(t % 86400 / 3600), m = Math.floor(t % 3600 / 60); return `Day ${d} · ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; }

  /* ---------- shell ---------- */
  function renderAll() {
    if (!S()) return renderIntro();
    const s = S();
    app.innerHTML = `<header class="hdr"><div class="hdr-in">
      <div class="logo"><b>FEATHER &amp; IRON</b><small>World 1 · prototype</small></div>
      <div class="plates" id="plates"></div>
      <div class="clock"><b id="clock">${clock()}</b><div class="speed" role="group" aria-label="Game speed">${SPEEDS.map(x => `<button type="button" data-act="speed" data-v="${x}" aria-pressed="${s.speed === x}">${x}×</button>`).join('')}</div></div>
    </div><div class="coopbar" id="coopbar"></div></header>
    <div class="frame"><nav class="nav" id="nav" aria-label="Game menu"></nav><main class="main" id="main"></main><aside class="side" id="side"></aside></div>
    <div class="foot"><span>Prototype with example neighbors. Game time runs at the speed you pick; 60× means one real minute is one game hour.</span><span><button type="button" data-act="reset" id="resetBtn">Start over</button></span></div>`;
    renderPlates(); renderCoopbar(); renderNav(); renderMain(); renderSide(); paint(); watchHdr();
  }
  let hdrRO = null;
  function watchHdr() {
    const h = $('.hdr'); if (!h) return;
    const set = () => document.documentElement.style.setProperty('--hdr-h', h.offsetHeight + 'px');
    set();
    if (hdrRO) hdrRO.disconnect();
    if (window.ResizeObserver) { hdrRO = new ResizeObserver(set); hdrRO.observe(h); }
  }
  function renderPlates() {
    const c = G.cur(), p = G.prod(c);
    $('#plates').innerHTML = RES.map(([k, l, ic]) => `<div class="plate" data-plate="${k}">${I(ic)}<div><b data-res="${k}">${fmt(c.res[k])}</b><small><span>${l}</span><span class="rt"><span data-rate="${k}">${p[k] >= 0 ? '+' : ''}${fmt(p[k])}</span>/h</span></small></div><i class="fill" data-fill="${k}"></i></div>`).join('') +
      `<div class="plate" data-plate="p">${I('snaga')}<div><b data-power>${fmt(p.pMake - p.pUse)}</b><small><span>Power</span><span class="rt" data-pw>${fmt(p.pMake)} / ${fmt(p.pUse)}</span></small></div></div>` +
      `<div class="plate eggs">${I('jaja')}<div><b data-eggs>${fmt(S().eggs)}</b><small><span>Eggs</span><span class="rt">wallet</span></small></div></div>`;
  }
  function renderCoopbar() {
    const s = S(), c = G.cur();
    $('#coopbar').innerHTML = `<label for="coopSel">Coop</label><select id="coopSel" data-act="coop">${s.coops.map((x, i) => `<option value="${i}"${i === s.cur ? ' selected' : ''}>${x.name} · ${addrStr(x.addr)}</option>`).join('')}</select>
      <span class="cinfo">${c.zone} · ${G.fieldsUsed(c)}/${G.fieldsTotal(c)} fields · ${c.temp} °C</span>
      <span class="chip ${s.t < s.shieldUntil ? 'ok' : 'warn'}" id="shieldChip">${shieldHtml()}</span>`;
  }
  function renderNav() {
    const unread = S().msgs.filter(m => !m.read).length;
    $('#nav').innerHTML = NAV.map(([id, l, ic]) => `<button type="button" data-act="go" data-v="${id}"${ui.screen === id ? ' aria-current="page"' : ''}>${I(ic)}<span>${l}</span>${id === 'messages' && unread ? `<em>${unread}</em>` : ''}</button>`).join('');
  }
  function renderSide() {
    const s = S(), side = $('#side'); if (!side) return;
    const ev = [];
    s.threats.filter(G.threatSeen).forEach(h => ev.push(`<div class="ev bad"><b>⚠ Hostile flock</b>${timer(h.arrive)}<span>${h.name} [${h.tag}] → ${s.coops[h.target] ? s.coops[h.target].name : ''}</span><span>${fmt(Object.values(h.units).reduce((a, b) => a + b, 0))} units</span></div>`));
    s.flocks.forEach(f => {
      const back = f.state === 'back', end = back ? f.back : f.arrive, start = back ? (f.recalled ? s.t : f.arrive) : f.depart;
      ev.push(`<div class="ev ${back ? 'back' : ''}"><b>${missionName(f.mission)}${back ? ' · returning' : ''}</b>${timer(end)}<span>${back ? addrStr(f.to) + ' → ' + (s.coops[f.from] ? s.coops[f.from].name : '') : addrStr(f.fromAddr) + ' → ' + addrStr(f.to)}</span>${progress(back ? f.arrive : f.depart, end)}${!back && f.state === 'out' ? `<button type="button" class="btn sm rc" data-act="recall" data-v="${f.id}">Recall</button>` : ''}</div>`);
    });
    side.innerHTML = `<section class="pnl tele"><h3>Telegraph · flocks</h3>${ev.join('') || '<p class="empty">No flocks on the move. Send one from Flocks or the Neighborhood.</p>'}<p class="small muted" style="margin-top:6px">Flock slots: ${s.flocks.length} / ${G.maxFlocks()}</p></section>
      <section class="pnl"><h3>Coops ${s.coops.length} / ${G.maxCoops()}</h3>${s.coops.map((c, i) => `<button type="button" class="btn sm ${i === s.cur ? 'pri' : ''}" style="width:100%;justify-content:space-between;margin-bottom:5px" data-act="coopbtn" data-v="${i}"><span>${c.name}</span><span>${addrStr(c.addr)}</span></button>`).join('')}</section>
      <section class="pnl"><h3>Eggs in wallet</h3><p style="font-family:var(--f-stencil);font-size:34px;line-height:1" data-eggs>${fmt(s.eggs)}</p><p class="small muted">Ticket Chikn ${s.ticket}. Hatchery here handles ${G.capEggs(G.cur().b.hatchery)} eggs an hour.</p><div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-act="go" data-v="hatchery">Open Hatchery</button><button type="button" class="btn sm" data-act="go" data-v="wallet">Ledger</button></div></section>`;
  }
  function shieldHtml() { const s = S(); return s.t < s.shieldUntil ? `<span class="lg">Fledgling shield · </span><span class="sh">Shield </span>${dur(s.shieldUntil - s.t)}` : 'Shield down'; }
  function missionName(m) { return { raid: 'Raid', scout: 'Scout', transport: 'Transport', station: 'Station', settle: 'Settle', glean: 'Glean', expedition: 'Expedition' }[m] || m; }

  /* ---------- screens ---------- */
  function renderMain() {
    const main = $('#main'); if (!main) return;
    const keep = {}; $$('input,select', main).forEach(el => { if (el.id) keep[el.id] = el.value; });
    const sy = window.scrollY, sw0 = $('.strip-wrap', main), sx = sw0 ? sw0.scrollLeft : null;
    main.innerHTML = (SCREENS[ui.screen] || SCREENS.overview)();
    for (const id in keep) { const el = document.getElementById(id); if (el && el.dataset.keep !== 'no') el.value = keep[id]; }
    window.scrollTo(0, sy);
    const sw = $('.strip-wrap', main);
    if (sw) { const t = $(`.plot[data-v="${ui.sel}"]`, sw); if ((ui.center || sx == null) && t) sw.scrollLeft = t.offsetLeft - (sw.clientWidth - t.offsetWidth) / 2; else if (sx != null) sw.scrollLeft = sx; ui.center = false; }
    lastRender = performance.now(); dirty = false;
    if (ui.screen === 'flocks') updatePlan();
  }
  const SCREENS = {
    overview() {
      const s = S(), c = G.cur(), p = G.prod(c), heat = Math.round((G.oilHeat(c.temp) - 1) * 100);
      const q = [];
      if (c.bq) q.push(`<div class="q">${I('zgrade')}<span><b>${B[c.bq.id].name}</b> → level ${c.bq.lvl}</span>${timer(c.bq.end)}${progress(c.bq.start, c.bq.end)}<span></span><button type="button" class="btn egg sm" data-act="speedup" data-v="build" style="grid-column:3">Finish · <span data-speed="${c.bq.end}">${G.speedCost(c.bq.end - s.t)}</span> eggs</button></div>`);
      if (s.rq) q.push(`<div class="q">${I('istrazivanja')}<span><b>${R[s.rq.id].name}</b> → level ${s.rq.lvl}</span>${timer(s.rq.end)}${progress(s.rq.start, s.rq.end)}<span></span><button type="button" class="btn egg sm" data-act="speedup" data-v="research" style="grid-column:3">Finish · <span data-speed="${s.rq.end}">${G.speedCost(s.rq.end - s.t)}</span> eggs</button></div>`);
      c.hq.forEach((o, i) => { const st = o.start != null ? o.start : s.t, en = st + o.dur; q.push(`<div class="q">${I('inkubator')}<span><b>${o.kind === 'crack' ? 'Cracking eggs' : (o.kind === 'u' ? U : D)[o.id].name + ' ×' + fmt(o.n)}</b> ${o.src === 'egg' ? '· from eggs' : ''}</span>${i === 0 ? timer(en) : '<span class="t">waiting</span>'}${i === 0 ? progress(st, en) : ''}</div>`); });
      const steps = [
        ['Build a Windmill to level 2', c.b.windmill >= 2 || s.coops.some(x => x.b.windmill >= 2)], ['Raise the Grain Field to level 3', s.coops.some(x => x.b.field >= 3)], ['Dig a Grit Pit to level 2', s.coops.some(x => x.b.pit >= 2)],
        ['Hatch 40 Peckers with eggs', ((s.stats || {}).egg_pecker || 0) >= 40], ['Build the Academy to level 3 and research Scouting', s.research.scouting >= 1], ['Raid an inactive (i) neighbor', ((s.stats || {}).raids || 0) > 0]
      ];
      return `<section class="ov">
        <div class="pnl photo"><img src="img/yard.webp" alt="${c.name}" decoding="async"><div class="cap"><b>${addrStr(c.addr).toUpperCase()}</b> · ${c.name}</div><div class="stamp">${c.zone.toUpperCase()}<small>PLOT ${c.addr.p}</small></div></div>
        <div class="pnl"><h3>First steps</h3><ol class="steps">${steps.map(x => `<li class="${x[1] ? 'done' : ''}">${x[0]}</li>`).join('')}</ol><p class="small muted" style="margin-top:8px">Tip: switch the clock to 60× or 300× in the header to watch things grow.</p></div>
      </section>
      <section class="facts">
        <div class="fact"><small>Fields</small><b>${G.fieldsUsed(c)} / ${G.fieldsTotal(c)}</b><i class="bar"><u style="width:${Math.min(100, G.fieldsUsed(c) / G.fieldsTotal(c) * 100)}%"></u></i></div>
        <div class="fact"><small>Climate</small><b>${c.temp} °C</b><span>${c.zone} · Oil ${heat >= 0 ? '+' : ''}${heat}%</span></div>
        <div class="fact"><small>Power</small><b>${Math.round(p.pf * 100)}%</b><span>${fmt(p.pMake)} made · ${fmt(p.pUse)} used</span></div>
        <div class="fact"><small>Defense</small><b>${fmt(Object.values(c.defs).reduce((a, b) => a + b, 0))}</b><span>${fmt(Object.values(c.units).reduce((a, b) => a + (b || 0), 0))} units at home</span></div>
      </section>
      <section class="pnl"><h3>In progress</h3>${q.join('') || '<p class="empty">Nothing is being built, researched or hatched. Start in Buildings.</p>'}</section>
      <section class="pnl"><h3>Production per hour</h3><div class="tblwrap"><table class="tbl"><thead><tr><th>Resource</th><th>Per hour</th><th>Stored</th><th>Storage</th></tr></thead><tbody>${RES.map(([k, l]) => `<tr><td>${l}</td><td class="n">${p[k] >= 0 ? '+' : ''}${fmt(p[k])}</td><td class="n" data-res="${k}">${fmt(c.res[k])}</td><td class="n">${fmt(G.caps(c)[k])}</td></tr>`).join('')}</tbody></table></div>
        ${p.pf < 1 ? '<p class="req" style="margin-top:8px">Power is short, so the producers run slower. Build a Windmill.</p>' : ''}</section>`;
    },
    buildings() {
      const c = G.cur(), groups = ['Production', 'Storage', 'Facilities'];
      return `<section class="pnl"><div class="head"><div><h2>Buildings</h2><p class="lead">One construction at a time per coop. Each level takes one build field. Henhouse levels speed up construction.</p></div><span class="chip">${G.fieldsUsed(c)} / ${G.fieldsTotal(c)} fields</span></div></section>` +
        groups.map(g => `<section class="pnl"><h3>${g}</h3><div class="cards">${Object.keys(B).filter(id => B[id].grp === g).map(id => bCard(id, c)).join('')}</div></section>`).join('');
    },
    research() {
      const s = S(), c = G.cur();
      return `<section class="pnl"><div class="head"><div><h2>Research</h2><p class="lead">One study at a time for the whole account. It uses this coop's resources and Academy level ${c.b.academy}.</p></div>${s.rq ? `<span class="chip warn">Researching ${R[s.rq.id].name}</span>` : ''}</div></section>
        <section class="pnl"><div class="cards">${Object.keys(R).map(id => rCard(id, c)).join('')}</div></section>`;
    },
    hatchery() { return hatcheryScreen(ui.tab === 'defense' ? 'army' : ui.tab); },
    defense() { return hatcheryScreen('defense'); },
    neighborhood: nbScreen,
    flocks: flocksScreen,
    messages() {
      const s = S();
      return `<section class="pnl"><div class="head"><div><h2>Messages</h2><p class="lead">Battle, scout and expedition reports.</p></div>${s.msgs.some(m => !m.read) ? '<button type="button" class="btn sm" data-act="readall">Mark all read</button>' : ''}</div>
        <div class="msgs">${s.msgs.map(m => `<div class="msg ${m.read ? '' : 'unread'}"><button type="button" data-act="openmsg" data-v="${m.id}" aria-expanded="${ui.open === m.id}">${I({ battle: 'napad', scout: 'uhodi', expedition: 'komsiluk', info: 'poruke' }[m.type] || 'poruke')}<b>${m.title}</b><span class="small muted">Day ${Math.floor(m.t / 86400) + 1}</span></button>${ui.open === m.id ? `<div class="body">${m.html}</div>` : ''}</div>`).join('') || '<p class="empty">No messages yet.</p>'}</div></section>`;
    },
    wallet() {
      const s = S();
      return `<section class="pnl"><h2>Chikn wallet</h2><p class="lead">Demo wallet 0x7a3…e91c. In the real game this is your connected crypto wallet.</p>
        <div class="ticket"><span class="egg">${I('jaja')}</span><div><b>Chikn ${s.ticket}</b><p class="small">Seat in World 1 · this NFT carries the account. Started with 1,000 eggs.</p></div></div>
        <div class="facts" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="fact"><small>Eggs now</small><b data-eggs>${fmt(s.eggs)}</b></div><div class="fact"><small>Eggs used</small><b>${fmt(1000 - s.eggs)}</b></div><div class="fact"><small>Hatchery speed</small><b>${G.capEggs(G.cur().b.hatchery)}/h</b></div></div></section>
        <section class="pnl"><h3>Egg ledger</h3><div class="tblwrap"><table class="tbl ledger"><thead><tr><th>Day</th><th>What</th><th>Eggs</th></tr></thead><tbody>${s.ledger.map(l => `<tr><td>${Math.floor(l.t / 86400) + 1}</td><td>${l.txt}</td><td>${l.d > 0 ? '+' : '−'}${fmt(Math.abs(l.d))}</td></tr>`).join('')}</tbody></table></div><p class="small muted" style="margin-top:8px">Used eggs are burned. Raids never touch eggs.</p></section>`;
    },
    ranks() {
      const s = S(), mine = G.points(), r = G.rng(G.hash('ranks'));
      const top = Array.from({ length: 14 }, (_, i) => ({ name: ['Gravel Queen', 'Iron Spur', 'Black Rooster', 'Captain Crest', 'Copper Plume', 'Old Speckle', 'Proud Wattle', 'Barley Bess', 'Rusty Comb', 'Sergeant Brood', 'Lucky Biddy', 'Mossy Feather', 'Grey Scratch', 'Clover Hen'][i], tag: ['FENCE', 'SPUR', '', 'BEAK', 'YOLK', 'RUST', 'COMB', 'GRAIN', 'RUST', 'SPUR', '', 'MOSS', 'FENCE', 'GRAIN'][i], pts: Math.round(48000 * Math.pow(0.78, i) * (0.9 + r() * 0.2)) }));
      const rank = Math.max(1, Math.round(28410 * Math.exp(-mine / 900)));
      const rows = top.map((p, i) => `<tr><td class="n">${i + 1}</td><td>${p.name}</td><td>${p.tag ? '[' + p.tag + ']' : '—'}</td><td class="n">${fmt(p.pts)}</td></tr>`).join('');
      return `<section class="pnl"><h2>Pecking Order</h2><p class="lead">Points come from everything you spend: 1 point per 1,000 resources, and eggs count at their value.</p>
        <div class="facts" style="grid-template-columns:repeat(2,minmax(0,1fr));margin:10px 0 14px"><div class="fact"><small>Your points</small><b>${fmt(mine)}</b></div><div class="fact"><small>Your place</small><b>${fmt(rank)} of 28,410</b></div></div>
        <div class="tblwrap"><table class="tbl"><thead><tr><th>#</th><th>Player</th><th>Alliance</th><th>Points</th></tr></thead><tbody>${rows}<tr style="background:rgba(214,172,78,.25)"><td class="n">${fmt(rank)}</td><td><b>You</b> · Chikn ${s.ticket}</td><td>—</td><td class="n">${fmt(mine)}</td></tr></tbody></table></div></section>`;
    }
  };

  function bEffect(id, c) {
    const L = c.b[id], n = L + 1, pr = (lvl) => { const b = Object.assign({}, c.b, { [id]: lvl }); return G.prod(Object.assign({}, c, { b })); };
    if (id === 'field' || id === 'pit' || id === 'press') { const k = { field: 'g', pit: 'r', press: 'o' }[id], a = pr(L), b = pr(n); return `${{ g: 'Grain', r: 'Grit', o: 'Oil' }[k]} ${fmt(a[k])} → <b>${fmt(b[k])}</b>/h · Power use ${fmt(a.pUse)} → ${fmt(b.pUse)}`; }
    if (id === 'windmill' || id === 'furnace') { const a = pr(L), b = pr(n); return `Power ${fmt(a.pMake)} → <b>${fmt(b.pMake)}</b>${id === 'furnace' ? ' · burns Oil' : ''}`; }
    if (id === 'granary' || id === 'bin' || id === 'tank') return `Holds ${fmt(G.storeCap(L))} → <b>${fmt(G.storeCap(n))}</b>`;
    if (id === 'henhouse') return `Construction speed ×${L + 1} → <b>×${n + 1}</b>`;
    if (id === 'workshop') return `Hatching speed ×${L + 1} → <b>×${n + 1}</b>`;
    if (id === 'hatchery') return `Handles ${G.capEggs(L)} → <b>${G.capEggs(n)}</b> eggs an hour`;
    if (id === 'academy') return `Research speed ×${L + 1} → <b>×${n + 1}</b>`;
    if (id === 'fence') return `Fields ${G.fieldsTotal(c)} → <b>${G.fieldsTotal(c) + 4}</b>`;
    if (id === 'tower') return `Warning ${30 + 30 * L} → <b>${30 + 30 * n}</b> minutes before a raid lands`;
    return 'Alliance feature, idle in this prototype';
  }
  function bCard(id, c) {
    const d = B[id], L = c.b[id], cost = G.bCost(id, L + 1), miss = G.reqMet(d.req, c), s = S();
    const busy = c.bq && c.bq.id === id;
    const secs = Math.max(5, (cost.g + cost.r) / (1800 * (1 + c.b.henhouse)) * 3600);
    let action;
    if (busy) action = `${timer(c.bq.end)} ${progress(c.bq.start, c.bq.end)}<button type="button" class="btn egg sm" data-act="speedup" data-v="build">Finish · <span data-speed="${c.bq.end}">${G.speedCost(c.bq.end - s.t)}</span> eggs</button>`;
    else action = `<button type="button" class="btn pri sm" data-act="build" data-v="${id}" data-cost="${cost.g},${cost.r},${cost.o}"${miss.length || c.bq ? ' disabled' : ''}>${L ? 'Upgrade to ' + (L + 1) : 'Build'}</button><span class="small muted">${dur(secs)}</span>${c.bq && !busy ? '<span class="small muted">Builders busy</span>' : ''}`;
    return `<article class="card ${busy ? 'busy' : ''}">${img(d.img, d.name)}<div><div class="t"><b>${d.name}</b><span class="lvl">${L ? 'Lv ' + L : '—'}</span></div><p>${d.desc}</p><div class="eff">${bEffect(id, c)}</div>${costHtml(cost, c)}${reqHtml(miss)}<div class="acts">${action}</div></div></article>`;
  }
  function rCard(id, c) {
    const d = R[id], s = S(), L = s.research[id], cost = G.rCost(id, L + 1), miss = G.reqMet(d.req, c), busy = s.rq && s.rq.id === id, top = d.max && L >= d.max;
    const secs = Math.max(5, (cost.g + cost.r) / (1000 * (1 + c.b.academy)) * 3600);
    const action = busy ? `${timer(s.rq.end)} ${progress(s.rq.start, s.rq.end)}<button type="button" class="btn egg sm" data-act="speedup" data-v="research">Finish · <span data-speed="${s.rq.end}">${G.speedCost(s.rq.end - s.t)}</span> eggs</button>`
      : top ? '<span class="chip ok">Top level</span>' : `<button type="button" class="btn pri sm" data-act="research" data-v="${id}" data-cost="${cost.g},${cost.r},${cost.o}"${miss.length || s.rq ? ' disabled' : ''}>Research ${L + 1}</button><span class="small muted">${dur(secs)}</span>`;
    return `<article class="card ${busy ? 'busy' : ''}" style="grid-template-columns:64px minmax(0,1fr)"><span style="width:64px;height:64px;display:grid;place-items:center;border:2px solid var(--ink);background:var(--paper2)">${ICO(d.icon).replace('class="ico"', 'class="ico" style="width:34px;height:34px"')}</span><div><div class="t"><b>${d.name}</b><span class="lvl">${L ? 'Lv ' + L : '—'}</span></div><div class="eff">${d.eff}</div>${top ? '' : costHtml(cost, c)}${reqHtml(miss)}<div class="acts">${action}</div></div></article>`;
  }

  /* ---------- hatchery ---------- */
  const TABS = { army: ['pecker', 'scout', 'spurguard', 'vanguard', 'ironhen', 'mortar', 'breacher', 'brahma'], transport: ['packhen', 'packbrahma', 'settler', 'gleaner'], defense: Object.keys(D) };
  function hatcheryScreen(tab) {
    const s = S(), c = G.cur(), L = c.b.hatchery;
    const head = `<section class="pnl"><div class="head"><div><h2>${tab === 'defense' ? 'Defense' : 'Hatchery'}</h2><p class="lead">Hatch with resources, or with eggs at their value. Every egg passes through the Hatchery: level ${L} handles <b>${G.capEggs(L)}</b> eggs an hour. Workshop level ${c.b.workshop} speeds up hatching with resources.</p></div><span class="chip gold">${fmt(s.eggs)} eggs</span></div>
      <div class="tabs" role="group">${[['army', 'Army'], ['transport', 'Transport'], ['defense', 'Defense'], ['eggs', 'Eggs']].map(([k, l]) => `<button type="button" data-act="tab" data-v="${k}" aria-pressed="${tab === k}">${l}</button>`).join('')}</div></section>`;
    const queue = c.hq.length ? `<section class="pnl"><h3>Hatch queue</h3>${c.hq.map((o, i) => { const st = o.start != null ? o.start : s.t, en = st + o.dur; return `<div class="q">${I('inkubator')}<span><b>${o.kind === 'crack' ? 'Cracking eggs into ' + { g: 'Grain', r: 'Grit', o: 'Oil' }[o.id] : (o.kind === 'u' ? U : D)[o.id].name + ' ×' + fmt(o.n)}</b> <span class="small muted">${o.kind !== 'crack' && i === 0 ? fmt(o.done) + ' done' : ''}</span></span>${i === 0 ? timer(en) : '<span class="t">waiting</span>'}${i === 0 ? progress(st, en) + `<span></span><button type="button" class="btn egg sm" data-act="speedup" data-v="hatch" style="grid-column:3">Finish · <span data-speed="${en}">${G.speedCost(en - s.t)}</span> eggs</button>` : ''}</div>`; }).join('')}</section>` : '';
    if (tab === 'eggs') {
      return head + `<section class="pnl"><h3>Crack eggs into resources</h3><p class="lead">1 egg = 200 Grain, 100 Grit or 50 Oil. The resources arrive when the Hatchery has worked through the eggs.</p>
        <div class="row" style="margin-top:10px"><label for="crackN">Eggs</label><input id="crackN" class="qty" type="number" min="1" step="1" value="50" style="width:100px;padding:6px;border:1.5px solid var(--ink);background:#f3ecd6;font:inherit;font-weight:700">
        <label for="crackInto">into</label><select id="crackInto" style="padding:6px;border:1.5px solid var(--ink);background:#f3ecd6;font:inherit">${RES.map(([k, l]) => `<option value="${k}"${ui.crackInto === k ? ' selected' : ''}>${l}</option>`).join('')}</select>
        <button type="button" class="btn pri" data-act="crack">Crack eggs</button></div>
        <p class="small muted" style="margin-top:10px">Speed-ups: 1 egg finishes 10 minutes of construction, research or hatching. Use the Finish buttons on any queue.</p></section>` + queue;
    }
    const list = TABS[tab].map(id => tab === 'defense' ? hCard('d', id, c) : hCard('u', id, c)).join('');
    return head + `<section class="pnl"><div class="cards">${list}</div></section>` + queue;
  }
  function hCard(kind, id, c) {
    const d = kind === 'u' ? U[id] : D[id], miss = G.reqMet(d.req, c), have = (kind === 'u' ? c.units[id] : c.defs[id]) || 0, eggs = G.eggsOf(d);
    const stats = kind === 'u' ? `<b>${fmt(d.atk)}</b> atk · <b>${d.arm}%</b> armor · <b>${fmt(d.hp)}</b> hp · <b>${d.spd}</b> speed · <b>${fmt(d.cargo)}</b> cargo` : d.soak ? `Soaks <b>${fmt(d.soak)}</b> a round · <b>${fmt(d.hp)}</b> hp · one per coop` : `<b>${fmt(d.atk)}</b> atk · <b>${d.arm}%</b> armor · <b>${fmt(d.hp)}</b> hp`;
    const qid = `q-${kind}-${id}`;
    return `<article class="card sq">${img(d.img, d.name)}<div><div class="t"><b>${d.name}</b><span class="lvl">${fmt(have)}</span></div><p>${kind === 'u' ? d.role : d.note}</p><div class="stats">${stats}</div>${costHtml({ g: d.g, r: d.r, o: d.o }, c)}<div class="small">or <b>${fmt(eggs)}</b> egg${eggs === 1 ? '' : 's'} each</div>${reqHtml(miss)}
      <div class="acts"><label class="small" for="${qid}">Qty</label><input class="qty" id="${qid}" type="number" min="1" step="1" value="${d.max ? 1 : 10}"${miss.length ? ' disabled' : ''}>
      <button type="button" class="btn pri sm" data-act="hatch" data-k="${kind}" data-v="${id}" data-src="res"${miss.length ? ' disabled' : ''}>With resources</button>
      <button type="button" class="btn egg sm" data-act="hatch" data-k="${kind}" data-v="${id}" data-src="egg"${miss.length ? ' disabled' : ''}>With eggs</button></div></div></article>`;
  }

  /* ---------- neighborhood ---------- */
  function ringSvg() {
    const cx = 150, cy = 150, r0 = 52, r1 = 138, n = HOODS.length, s = S();
    const pt = (r, a) => `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    let o = '';
    HOODS.forEach((h, i) => {
      const a0 = -Math.PI / 2 + i * 2 * Math.PI / n + 0.012, a1 = -Math.PI / 2 + (i + 1) * 2 * Math.PI / n - 0.012, am = (a0 + a1) / 2;
      const d = `M${pt(r0, a0)} A${r0},${r0} 0 0,1 ${pt(r0, a1)} L${pt(r1, a1)} A${r1},${r1} 0 0,0 ${pt(r1, a0)} Z`;
      const lr = (r0 + r1) / 2 + 4, deg = am * 180 / Math.PI + 90, flip = deg > 90 && deg < 270;
      o += `<g class="seg${i === ui.nbN ? ' on' : ''}" data-act="hood" data-v="${i}" role="button" tabindex="0" aria-label="${h}"><path d="${d}"/><text x="${pt(lr, am).split(',')[0]}" y="${pt(lr, am).split(',')[1]}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${flip ? deg + 180 : deg} ${pt(lr, am).split(',')[0]} ${pt(lr, am).split(',')[1]})">${h}</text></g>`;
    });
    const a0 = -Math.PI / 2 + ui.nbN * 2 * Math.PI / n, a1 = a0 + 2 * Math.PI / n, rr = r0 + (r1 - r0) * (ui.nbS / STREETS);
    o += `<line class="tick" x1="${pt(rr, a0 + 0.03).split(',')[0]}" y1="${pt(rr, a0 + 0.03).split(',')[1]}" x2="${pt(rr, a1 - 0.03).split(',')[0]}" y2="${pt(rr, a1 - 0.03).split(',')[1]}"/>`;
    s.coops.forEach(c => { const a = -Math.PI / 2 + (c.addr.n + 0.5) * 2 * Math.PI / n, r = r0 + (r1 - r0) * (c.addr.s / STREETS); o += `<circle class="mine" cx="${pt(r, a).split(',')[0]}" cy="${pt(r, a).split(',')[1]}" r="5"/>`; });
    o += `<circle cx="${cx}" cy="${cy}" r="${r0 - 8}" fill="#cdbf98" stroke="#1f1c15" stroke-width="1.5"/><path class="house" d="M${cx - 16},${cy + 6} L${cx},${cy - 12} L${cx + 16},${cy + 6} Z M${cx - 11},${cy + 6} H${cx + 11} V${cy + 18} H${cx - 11} Z"/><text x="${cx}" y="${cy + 30}" text-anchor="middle" font-family="'Big Shoulders Display',sans-serif" font-size="8.5" letter-spacing=".08em" fill="#1f1c15">FARMHOUSE</text>`;
    return `<svg class="ring" viewBox="0 0 300 300" role="group" aria-label="The Estate: 12 neighborhoods around the farmhouse">${o}</svg>`;
  }
  function plotInfo(n, s, p) {
    const own = G.ownAt(n, s, p), npc = own < 0 ? G.npcAt(n, s, p) : null, key = `${n}-${s}-${p}`, fe = G.featherAt(key);
    return { own, npc, fe, z: PLOT[p].z, key };
  }
  const pctS = (v) => (v >= 0 ? '+' : '') + v + '%';
  function rowActs(x, p) {
    const s = S(); let a = '';
    if (x.own >= 0) {
      a = x.own === s.cur ? '<span class="chip gold">This coop</span>'
        : `<button type="button" class="btn pri sm" data-act="flockto" data-m="transport" data-p="${p}">Transport</button><button type="button" class="btn sm" data-act="flockto" data-m="station" data-p="${p}">Station</button><button type="button" class="btn sm" data-act="switchto" data-v="${x.own}">Open</button>`;
    } else if (x.npc) {
      const safe = x.npc.status === 'm' || x.npc.status === 'f';
      a = `<button type="button" class="btn sm" data-act="flockto" data-m="scout" data-p="${p}">Scout</button><button type="button" class="btn pri sm" data-act="flockto" data-m="raid" data-p="${p}"${safe ? ' disabled title="Protected"' : ''}>Raid</button>`;
    } else a = `<button type="button" class="btn pri sm" data-act="flockto" data-m="settle" data-p="${p}">Settle</button>`;
    if (x.fe) a += `<button type="button" class="btn sm egg" data-act="flockto" data-m="glean" data-p="${p}">Glean</button>`;
    return a;
  }
  function plotRows(n, st, heat, zrange) {
    const s = S(), out = ['<div class="plots-h" aria-hidden="true"><span>Plot</span><span></span><span>Coop</span><span>Player</span><span>Feathers</span><span>Actions</span></div>'];
    let lastZ = null;
    for (let p = 1; p <= 15; p++) {
      const x = plotInfo(n, st, p), P = PLOT[p];
      if (x.z !== lastZ) {
        lastZ = x.z;
        const ps = PLOT.map((q, i) => (q && q.z === x.z ? i : 0)).filter(Boolean), r = zrange(x.z);
        out.push(`<div class="zh z-${x.z}"><b>${x.z}</b><span>Plots ${ps[0]}–${ps[ps.length - 1]} · ${r[0]}–${r[1]} fields · ${r[2]} to ${r[3]} °C · Oil ${pctS(heat(r[2]))} to ${pctS(heat(r[3]))}</span></div>`);
      }
      let cls = `prow zl-${x.z}`, name, sub, who, whoSub, st2 = '';
      if (x.own >= 0) { const c = s.coops[x.own]; cls += ' mine'; name = c.name; sub = `${G.fieldsTotal(c)} fields · ${c.temp} °C`; who = 'You'; whoSub = `Chikn ${s.ticket}`; }
      else if (x.npc) { name = x.npc.coop; sub = `${x.npc.fields} fields · ${x.npc.temp} °C`; who = x.npc.name; whoSub = (x.npc.tag ? `[${x.npc.tag}] · ` : '') + `${fmt(x.npc.points)} points`; st2 = x.npc.status; if (st2 === 'i' || st2 === 'I') cls += ' inactive'; }
      else { cls += ' free'; name = 'Free plot'; sub = `${P.f[0]}–${P.f[1]} fields`; who = '—'; whoSub = 'Nobody lives here'; }
      if (ui.sel === p) cls += ' sel';
      const fe = x.fe ? `<span class="fe" title="${fmt(x.fe.g)} Grain · ${fmt(x.fe.r)} Grit">${I('perje')}<b>${fmt(x.fe.g + x.fe.r)}</b></span>` : '<span class="fe none"><span class="sr">No feather field</span><span aria-hidden="true">—</span></span>';
      out.push(`<div class="${cls}"><button type="button" class="pick" data-act="plot" data-v="${p}" aria-pressed="${ui.sel === p}"><span class="pn">${p}</span>${img(ZONE[x.z].img, x.z + ' plot ' + p)}<span class="co"><b>${name}</b><small>${sub}</small></span><span class="pl"><b>${who}${st2 ? ` <i class="st st-${st2}">(${st2})</i>` : ''}</b><small>${whoSub}</small></span></button>${fe}<span class="ac">${rowActs(x, p)}</span></div>`);
    }
    return `<div class="plots">${out.join('')}</div>`;
  }
  function nbScreen() {
    const s = S(), n = ui.nbN, st = ui.nbS;
    const tiles = [];
    for (let p = 1; p <= 15; p++) {
      const x = plotInfo(n, st, p), zimg = ZONE[x.z].img;
      let cls = 'plot', title, sub, tag = '';
      if (x.own >= 0) { const c = s.coops[x.own]; cls += ' mine'; title = c.name; sub = `You · ${G.fieldsTotal(c)} fields`; }
      else if (x.npc) { title = x.npc.coop; sub = `${x.npc.name}${x.npc.tag ? ' [' + x.npc.tag + ']' : ''}<br>${fmt(x.npc.points)} pts · ${x.npc.fields} fields`; if (x.npc.status) { tag = { i: '(i)', I: '(I)', m: '(m)', f: '(f)' }[x.npc.status]; } if (x.npc.status === 'i' || x.npc.status === 'I') cls += ' inactive'; }
      else { cls += ' free'; title = 'Free plot'; sub = `${PLOT[p].f[0]}–${PLOT[p].f[1]} fields`; }
      if (ui.sel === p) cls += ' sel';
      tiles.push(`<button type="button" class="${cls}" data-act="plot" data-v="${p}" aria-pressed="${ui.sel === p}">${img(zimg, x.z + ' plot')}<span class="pn">${p}</span>${x.fe ? `<span class="fe">${I('perje')}${fmt(x.fe.g + x.fe.r)}</span>` : ''}${tag ? `<span class="tg">${tag}</span>` : ''}<span class="pi"><b>${title}</b><span>${sub}</span></span></button>`);
    }
    const x = plotInfo(n, st, ui.sel), P = PLOT[ui.sel], heat = (t) => Math.round((G.oilHeat(t) - 1) * 100);
    let who = '', acts = '';
    const scouted = s.scoutLog[x.key];
    if (x.own >= 0) { const c = s.coops[x.own]; who = `<p><b>${c.name}</b> · your coop · ${G.fieldsTotal(c)} fields · ${c.temp} °C</p>`; acts = `<button type="button" class="btn pri sm" data-act="flockto" data-m="transport">Transport here</button><button type="button" class="btn sm" data-act="flockto" data-m="station">Station here</button><button type="button" class="btn sm" data-act="switchto" data-v="${x.own}">Open coop</button>`; }
    else if (x.npc) {
      const st2 = { i: 'Inactive for 7+ days', I: 'Inactive for 28+ days', m: 'Molting, can’t be attacked', f: 'Fledgling shield, can’t be attacked' }[x.npc.status] || 'Active player';
      who = `<p><b>${x.npc.coop}</b> · ${x.npc.name}${x.npc.tag ? ' [' + x.npc.tag + ']' : ''}</p><p class="small">${st2} · ${fmt(x.npc.points)} points · ${x.npc.fields} fields · ${x.npc.temp} °C</p>${scouted ? `<p class="small">Last scouted day ${Math.floor(scouted.t / 86400) + 1}: ${fmt(scouted.g)} Grain · ${fmt(scouted.r)} Grit · ${fmt(scouted.o)} Oil</p>` : '<p class="small muted">Not scouted yet.</p>'}`;
      acts = `<button type="button" class="btn sm" data-act="flockto" data-m="scout">Scout</button><button type="button" class="btn pri sm" data-act="flockto" data-m="raid"${x.npc.status === 'm' || x.npc.status === 'f' ? ' disabled' : ''}>Raid</button>`;
    } else { who = '<p><b>Free plot.</b> Nobody lives here yet.</p>'; acts = `<button type="button" class="btn pri sm" data-act="flockto" data-m="settle">Settle</button>`; }
    if (x.fe) { who += `<p class="small">Feather field: ${fmt(x.fe.g)} Grain · ${fmt(x.fe.r)} Grit worth.</p>`; acts += `<button type="button" class="btn sm" data-act="flockto" data-m="glean">Glean</button>`; }
    const zones = ['Roadside', 'Meadow', 'Gardens', 'Creek', 'Grove'];
    const zrange = (z) => { const ps = PLOT.filter(q => q && q.z === z); return [Math.min(...ps.map(q => q.f[0])), Math.max(...ps.map(q => q.f[1])), Math.min(...ps.map(q => q.t[0])), Math.max(...ps.map(q => q.t[1]))]; };
    return `<div class="nbwrap"><section class="pnl nb-side"><div class="nb-top"><div>${ringSvg()}<p class="small muted" style="text-align:center;margin-top:4px">Gold dots are your coops. Street 1 is next to the farmhouse, street 500 at the outer fence.</p></div>
        <div class="stack"><div><h2>${HOODS[n]} · Street ${st}</h2><p class="lead">Fifteen plots run from the road to the grove. The plot's place decides its size and climate, so each coop looks and works differently.</p></div>
        <div class="nav-street"><label for="nbN" class="small">Neighborhood</label><select id="nbN" data-act="nbN" data-keep="no">${HOODS.map((h, i) => `<option value="${i}"${i === n ? ' selected' : ''}>${h}</option>`).join('')}</select>
        <button type="button" class="btn sm" data-act="street" data-v="-1" aria-label="Previous street">◀</button><label for="nbS" class="small">Street</label><input id="nbS" type="number" min="1" max="${STREETS}" value="${st}" data-keep="no"><button type="button" class="btn sm" data-act="street" data-v="1" aria-label="Next street">▶</button><button type="button" class="btn sm" data-act="gostreet">Go</button><button type="button" class="btn sm" data-act="home">My coop</button></div>
        <div class="detail"><img src="img/${ZONE[x.z].img}.webp" alt="${x.z} plot ${ui.sel}"><div class="stack"><div><span class="chip">${x.z} · plot ${ui.sel}</span></div><p class="small">${P.f[0]}–${P.f[1]} fields · ${P.t[0]} to ${P.t[1]} °C · Oil ${heat(P.t[0]) >= 0 ? '+' : ''}${heat(P.t[0])}% to ${heat(P.t[1]) >= 0 ? '+' : ''}${heat(P.t[1])}%</p><p class="small muted">${ZONE[x.z].note}</p>${who}<div class="row">${acts}</div></div></div></div></div></section>
      <section class="pnl nb-street"><div class="head" style="margin-bottom:10px"><h3>Street view · ${HOODS[n]} ${st}</h3><div class="tabs" role="group" aria-label="Street layout">${[['rows', 'Rows'], ['cards', 'Cards']].map(([k, l]) => `<button type="button" data-act="sview" data-v="${k}" aria-pressed="${(ui.streetView || 'rows') === k}">${l}</button>`).join('')}</div></div>
        ${(ui.streetView || 'rows') === 'rows' ? plotRows(n, st, heat, zrange) : `<div class="strip-wrap"><div class="zones">${zones.map(z => `<div class="z-${z}">${z} · ${PLOT.filter(q => q && q.z === z).length} plots</div>`).join('')}</div><div class="strip">${tiles.join('')}</div></div>
        <div class="strip-lab"><span>← The road</span><span>(i) inactive · (m) molting · (f) fledgling shield · grey tile = free plot</span><span>The grove →</span></div>`}
        ${(ui.streetView || 'rows') === 'rows' ? '<p class="small muted" style="margin-top:8px">Plot 1 is by the road, plot 15 by the grove. (i) inactive 7+ days · (I) inactive 28+ days · (m) molting · (f) fledgling shield.</p>' : ''}</section></div>
      <section class="pnl"><h3>What the plots look like</h3><div class="guide">${zones.map(z => { const r = zrange(z); return `<figure>${img(ZONE[z].img, z)}<figcaption><b>${z}</b>${r[0]}–${r[1]} fields<br>${r[2]} to ${r[3]} °C · Oil ${heat(r[2]) >= 0 ? '+' : ''}${heat(r[2])}% to ${heat(r[3]) >= 0 ? '+' : ''}${heat(r[3])}%<br><span class="muted">${ZONE[z].note}</span></figcaption></figure>`; }).join('')}</div></section>`;
  }

  /* ---------- flocks ---------- */
  const MISSIONS = [['raid', 'Raid', 'napad'], ['scout', 'Scout', 'uhodi'], ['transport', 'Transport', 'transport'], ['station', 'Station', 'strelica'], ['settle', 'Settle', 'pregled'], ['glean', 'Glean', 'perje'], ['expedition', 'Expedition', 'komsiluk'], ['joint', 'Joint Raid', 'jato'], ['guard', 'Guard', 'odbrana']];
  function flocksScreen() {
    const s = S(), c = G.cur(), ids = Object.keys(U).filter(id => (c.units[id] || 0) > 0);
    const isExp = ui.fm === 'expedition';
    return `<section class="pnl"><div class="head"><div><h2>Send a flock</h2><p class="lead">From ${c.name}, ${addrStr(c.addr)}. The slowest unit sets the pace. Oil for the round trip is paid when the flock leaves.</p></div><span class="chip">${s.flocks.length} / ${G.maxFlocks()} slots</span></div></section>
      <section class="send"><div class="pnl"><h3>1 · Mission</h3><div class="missions">${MISSIONS.map(([k, l, ic]) => `<button type="button" data-act="mission" data-v="${k}" aria-pressed="${ui.fm === k}"${k === 'joint' || k === 'guard' ? ' disabled title="Needs an alliance. Not in this prototype."' : ''}>${I(ic)}${l}</button>`).join('')}</div>
        <h3 style="margin-top:14px">2 · Target</h3>${isExp ? '<p class="small">Expeditions go past the outer fence into the Wilds. 300 leagues from any coop.</p>' : `<div class="target"><select id="ftN" data-act="fplan">${HOODS.map((h, i) => `<option value="${i}"${i === +ui.fto.n ? ' selected' : ''}>${h}</option>`).join('')}</select><label class="small" for="ftS">street</label><input id="ftS" type="number" min="1" max="${STREETS}" value="${ui.fto.s}" data-act="fplan"><label class="small" for="ftP">plot</label><input id="ftP" type="number" min="1" max="15" value="${ui.fto.p}" data-act="fplan"></div><p class="small muted" id="ftWho" style="margin-top:6px"></p>`}
        <h3 style="margin-top:14px">3 · Units</h3><div class="ulist">${ids.length ? ids.map(id => `<div class="urow">${img(U[id].img, U[id].name)}<span><b>${U[id].name}</b><br><span class="small muted">${fmt(c.units[id])} here · speed ${Math.round(G.S ? U[id].spd : 0)}</span></span><input id="fu-${id}" type="number" min="0" max="${c.units[id]}" value="0" data-act="fplan" aria-label="${U[id].name} to send"><button type="button" class="btn sm" data-act="allunits" data-v="${id}">All</button></div>`).join('') : '<p class="empty">No units at this coop. Hatch some first.</p>'}</div>
        ${ui.fm === 'transport' || ui.fm === 'settle' ? `<h3 style="margin-top:14px">4 · Cargo</h3><div class="cargo">${RES.map(([k, l]) => `<label for="fc-${k}">${l}<input id="fc-${k}" type="number" min="0" value="0" data-act="fplan"></label>`).join('')}</div>` : ''}
      </div>
      <div class="pnl"><h3>Summary</h3><label class="small" for="fpct">Speed</label> <select id="fpct" data-act="fplan">${[1, .8, .6, .4, .2].map(v => `<option value="${v}"${+ui.fpct === v ? ' selected' : ''}>${v * 100}%</option>`).join('')}</select>
        <dl class="kv" id="fsum" style="margin-top:10px"></dl><p class="msg-err" id="ferr"></p><button type="button" class="btn pri" data-act="send" style="width:100%">${I('odred')} Send flock</button>
        <p class="small muted" style="margin-top:10px">Raids carry off up to 40% of each stored resource, limited by cargo. Raiding a player drops your own fledgling shield.</p></div></section>`;
  }
  function readFlock() {
    const c = G.cur(), units = {};
    Object.keys(U).forEach(id => { const el = document.getElementById('fu-' + id); if (el) units[id] = Math.max(0, Math.min(c.units[id] || 0, Math.floor(+el.value || 0))); });
    const to = ui.fm === 'expedition' ? { wilds: true } : { n: +($('#ftN') || {}).value || 0, s: +($('#ftS') || {}).value || 0, p: +($('#ftP') || {}).value || 0 };
    const cargo = {}; RES.forEach(([k]) => { const el = document.getElementById('fc-' + k); cargo[k] = el ? Math.max(0, Math.floor(+el.value || 0)) : 0; });
    const pct = +($('#fpct') || { value: 1 }).value || 1;
    return { units, to, cargo, pct };
  }
  function updatePlan() {
    const sum = $('#fsum'); if (!sum) return;
    const f = readFlock(), c = G.cur();
    if (!f.to.wilds) { ui.fto = { n: f.to.n, s: f.to.s, p: f.to.p }; const who = $('#ftWho'); if (who) { const x = (f.to.s >= 1 && f.to.s <= STREETS && f.to.p >= 1 && f.to.p <= 15) ? plotInfo(f.to.n, f.to.s, f.to.p) : null; who.textContent = !x ? 'Pick a street from 1 to 500 and a plot from 1 to 15.' : x.own >= 0 ? `Your coop: ${S().coops[x.own].name}` : x.npc ? `${x.npc.coop} · ${x.npc.name}${x.npc.status ? ' (' + x.npc.status + ')' : ''} · ${fmt(x.npc.points)} pts` : 'Free plot'; } }
    ui.fpct = f.pct;
    const plan = G.planFlock(c.addr, f.to, f.units, f.pct);
    if (!plan) { sum.innerHTML = '<dt>Units</dt><dd>none picked</dd>'; return; }
    sum.innerHTML = `<dt>Distance</dt><dd>${fmt(plan.dist)} leagues</dd><dt>One way</dt><dd>${dur(plan.secs)}</dd><dt>Arrives</dt><dd>${clockAt(S().t + plan.secs)}</dd><dt>Back home</dt><dd>${clockAt(S().t + plan.secs * 2)}</dd><dt>Oil, round trip</dt><dd>${fmt(plan.oil)}</dd><dt>Cargo space</dt><dd>${fmt(plan.cargo)}</dd><dt>Units</dt><dd>${fmt(plan.count)}</dd>`;
  }
  function clockAt(t) { const d = Math.floor(t / 86400) + 1, h = Math.floor(t % 86400 / 3600), m = Math.floor(t % 3600 / 60); return `Day ${d}, ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; }

  /* ---------- intro ---------- */
  function renderIntro() {
    app.innerHTML = `<section class="intro"><img src="img/hero.webp" alt="War hens march past a giant armored Brahma hen at dusk"><div class="pnl">
      <h2>Feather &amp; Iron</h2><p class="lead">Playable prototype · World 1 · Trench style</p>
      <div class="ticket"><span class="egg">${I('jaja')}</span><div><b>Chikn #04117</b><p class="small">Demo wallet 0x7a3…e91c is connected. This Chikn NFT is your ticket into the world and brings <b>1,000 eggs</b>.</p></div></div>
      <ul><li>Your home coop starts on <b>Sunflower 117/6</b>, a Meadow plot with 175 build fields.</li><li>Build mines, research, hatch chicken units with resources or eggs, then scout and raid the neighbors.</li><li>The neighbors are example players run by the prototype. A fledgling shield protects you for 7 game days.</li></ul>
      <div class="row" style="margin-top:14px"><button type="button" class="btn pri" data-act="start">Enter World 1</button><span class="small muted">Progress saves with this page.</span></div></div></section>`;
  }

  /* ---------- live paint ---------- */
  function paint() {
    const s = S(); if (!s || !$('#plates')) return;
    const c = G.cur(), p = G.prod(c), cp = G.caps(c);
    RES.forEach(([k]) => {
      $$(`[data-res="${k}"]`).forEach(el => { el.textContent = fmt(c.res[k]); });
      const r = $(`[data-rate="${k}"]`); if (r) r.textContent = (p[k] >= 0 ? '+' : '') + fmt(p[k]);
      const fill = $(`[data-fill="${k}"]`); if (fill) fill.style.width = Math.min(100, c.res[k] / cp[k] * 100) + '%';
      const pl = $(`[data-plate="${k}"]`); if (pl) pl.classList.toggle('full', c.res[k] >= cp[k] - 1);
    });
    const pw = $('[data-power]'); if (pw) pw.textContent = fmt(p.pMake - p.pUse);
    const pw2 = $('[data-pw]'); if (pw2) pw2.textContent = `${fmt(p.pMake)} / ${fmt(p.pUse)}`;
    $$('[data-eggs]').forEach(el => { el.textContent = fmt(s.eggs); });
    const ck = $('#clock'); if (ck) ck.textContent = clock();
    $$('[data-end]').forEach(el => { el.textContent = dur(+el.dataset.end - s.t); });
    $$('[data-pe]').forEach(el => { const a = +el.dataset.ps, b = +el.dataset.pe; el.style.width = (b > a ? Math.max(0, Math.min(100, (s.t - a) / (b - a) * 100)) : 100) + '%'; });
    $$('[data-speed]').forEach(el => { el.textContent = G.speedCost(+el.dataset.speed - s.t); });
    $$('[data-cost]').forEach(el => { if (el.dataset.static) return; const [g, r, o] = el.dataset.cost.split(',').map(Number); const ok = c.res.g >= g && c.res.r >= r && c.res.o >= o; el.classList.toggle('poor', !ok); });
    $$('[data-need-g],[data-need-r],[data-need-o]').forEach(el => { const k = el.hasAttribute('data-need-g') ? 'g' : el.hasAttribute('data-need-r') ? 'r' : 'o'; el.classList.toggle('lack', c.res[k] < +el.getAttribute('data-need-' + k)); });
    const sc = $('#shieldChip'); if (sc) { const on = s.t < s.shieldUntil; sc.className = 'chip ' + (on ? 'ok' : 'warn'); sc.innerHTML = shieldHtml(); }
  }

  /* ---------- events ---------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
    const a = el.dataset.act, v = el.dataset.v, s = S();
    if (a === 'start') { G.newGame('#04117'); changed(); renderAll(); return; }
    if (!s) return;
    if (a === 'go') { ui.screen = v; ui.center = true; if (v === 'defense') ui.tab = 'defense'; else if (v === 'hatchery' && ui.tab === 'defense') ui.tab = 'army'; renderNav(); renderMain(); paint(); window.scrollTo(0, 0); }
    else if (a === 'speed') { s.speed = +v; $$('.speed button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.v === s.speed))); changed(); }
    else if (a === 'coopbtn' || a === 'switchto') { s.cur = +v; changed(); renderAll(); }
    else if (a === 'build') act(G.build(v), `Construction started: ${B[v].name}`);
    else if (a === 'research') act(G.research(v), `Research started: ${R[v].name}`);
    else if (a === 'speedup') act(G.speedUp(v), 'Finished with eggs');
    else if (a === 'tab') { ui.tab = v; ui.screen = v === 'defense' ? 'defense' : 'hatchery'; renderNav(); renderMain(); paint(); }
    else if (a === 'hatch') { const q = document.getElementById(`q-${el.dataset.k}-${v}`); act(G.hatch(el.dataset.k, v, +(q && q.value) || 0, el.dataset.src), 'Added to the hatch queue'); }
    else if (a === 'crack') { ui.crackInto = $('#crackInto').value; act(G.crack(+$('#crackN').value || 0, ui.crackInto), 'Eggs added to the Hatchery'); }
    else if (a === 'hood') { ui.nbN = +v; ui.center = true; renderMain(); }
    else if (a === 'street') { ui.nbS = Math.max(1, Math.min(STREETS, ui.nbS + +v)); ui.center = true; renderMain(); }
    else if (a === 'gostreet') { ui.nbN = +$('#nbN').value; ui.nbS = Math.max(1, Math.min(STREETS, Math.floor(+$('#nbS').value || 1))); ui.center = true; renderMain(); }
    else if (a === 'home') { const c = G.cur(); ui.nbN = c.addr.n; ui.nbS = c.addr.s; ui.sel = c.addr.p; ui.center = true; renderMain(); }
    else if (a === 'plot') { ui.sel = +v; renderMain(); }
    else if (a === 'sview') { ui.streetView = v; ui.center = true; renderMain(); }
    else if (a === 'flockto') { if (el.dataset.p) ui.sel = +el.dataset.p; ui.fm = el.dataset.m; ui.fto = { n: ui.nbN, s: ui.nbS, p: ui.sel }; ui.screen = 'flocks'; renderNav(); renderMain(); window.scrollTo(0, 0); }
    else if (a === 'mission') { ui.fm = v; renderMain(); }
    else if (a === 'allunits') { const inp = document.getElementById('fu-' + v); if (inp) { inp.value = G.cur().units[v] || 0; updatePlan(); } }
    else if (a === 'send') { const f = readFlock(); const err = G.sendFlock({ mission: ui.fm, to: f.to, units: f.units, cargo: f.cargo, pct: f.pct }); const box = $('#ferr'); if (err) { if (box) box.textContent = err; } else { if (box) box.textContent = ''; act(null, `${missionName(ui.fm)} flock is on its way`); } }
    else if (a === 'recall') act(G.recall(v), 'Flock recalled');
    else if (a === 'openmsg') { const m = s.msgs.find(x => x.id === v); if (m) { m.read = true; ui.open = ui.open === v ? null : v; changed(); renderNav(); renderMain(); } }
    else if (a === 'readall') { s.msgs.forEach(m => m.read = true); changed(); renderNav(); renderMain(); }
    else if (a === 'reset') { if (el.dataset.armed) { G.S = null; try { localStorage.removeItem(LSK); } catch (err) { /* storage unavailable */ } if (store.ref) store.ref.delete().catch(() => {}); renderIntro(); } else { el.dataset.armed = '1'; el.textContent = 'Click again to wipe the coop'; setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.textContent = 'Start over'; } }, 4000); } }
  });
  document.addEventListener('change', (e) => {
    const el = e.target; if (!S()) return;
    if (el.id === 'coopSel') { S().cur = +el.value; changed(); renderAll(); }
    else if (el.id === 'nbN') { ui.nbN = +el.value; ui.center = true; renderMain(); }
    else if (el.dataset.act === 'fplan') updatePlan();
  });
  document.addEventListener('input', (e) => { if (e.target.dataset && e.target.dataset.act === 'fplan') updatePlan(); });
  document.addEventListener('keydown', (e) => {
    const el = e.target.closest && e.target.closest('g[data-act="hood"]');
    if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); ui.nbN = +el.dataset.v; ui.center = true; renderMain(); }
    if (e.target.id === 'nbS' && e.key === 'Enter') { ui.nbS = Math.max(1, Math.min(STREETS, Math.floor(+e.target.value || 1))); ui.center = true; renderMain(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && S()) { saveLocal(); saveRemote(); } });

  G.on((type) => { dirty = true; dirtySide = true; if (type === 'flock' || type === 'done') changed(); });

  /* ---------- loop ---------- */
  let last = performance.now();
  function loop() {
    const now = performance.now(); let dt = (now - last) / 1000; last = now;
    if (!S()) return;
    dt = Math.min(dt, 30);
    G.advance(dt * S().speed);
    if ((dirty || dirtySide) && performance.now() - lastRender > 700) {
      const focused = document.activeElement && document.activeElement.closest && document.activeElement.closest('#main input, #main select');
      if (dirty && !focused) { renderPlates(); renderCoopbar(); renderNav(); renderMain(); }
      if (dirtySide) { renderSide(); dirtySide = false; }
    }
    paint();
  }

  function start(hotData) {
    const prev = hotData && hotData.S ? hotData.S : loadLocal();
    if (prev && prev.v === 1) { G.S = prev; if (hotData && hotData.ui) Object.assign(ui, hotData.ui); else catchUp(prev); }
    renderAll();
    setInterval(loop, 250);
    initStore();
  }
  if (window.claude && window.claude.hot && typeof window.claude.hot.snapshot === 'function') window.claude.hot.snapshot(() => ({ S: G.S, ui }));
  const hot = window.claude && window.claude.hot;
  if (hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
})();
