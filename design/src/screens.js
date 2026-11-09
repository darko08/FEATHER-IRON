/* Feather & Iron: game screen mockups. Example data only. */
(function (global) {
  'use strict';
  const I = (n) => ICO(n);
  const IMG = (f, cls, alt) => `<img src="img/${f}.webp" alt="${alt || ''}" class="${cls || ''}" decoding="async">`;

  const RES = [
    { ic: 'zrno', l: 'Grain', v: '184,220', r: '+3,812/h' },
    { ic: 'krec', l: 'Grit', v: '92,415', r: '+1,406/h' },
    { ic: 'ulje', l: 'Oil', v: '31,870', r: '+514/h' },
    { ic: 'snaga', l: 'Power', v: '+142', r: '1,420 / 1,278' },
    { ic: 'jaja', l: 'Eggs', v: '2,412', r: 'in wallet' }
  ];
  const NAV = [
    { ic: 'pregled', l: 'Overview', b: 'Hall' }, { ic: 'zgrade', l: 'Buildings', b: 'Works' }, { ic: 'istrazivanja', l: 'Research', b: 'Lore' },
    { ic: 'inkubator', l: 'Hatchery', b: 'Hatchery' }, { ic: 'odbrana', l: 'Defense', b: 'Walls' }, { ic: 'odred', l: 'Flocks', b: 'Hosts' },
    { ic: 'komsiluk', l: 'Neighborhood', b: 'Neighbors' }, { ic: 'jato', l: 'Alliance', b: 'Alliance' }, { ic: 'poruke', l: 'Messages', b: 'Heralds', n: 3 }, { ic: 'rang', l: 'Pecking Order', b: 'Ranks' }
  ];
  const EVENTS = [
    { k: 'bad', t: '00:47:10', a: 'Hostile flock', b: 'Gravel Queen [FENCE] → Sunflower 117/6', c: 'about 340 units · seen by Watchtower 9' },
    { k: 'out', t: '00:12:41', a: 'Raid', b: 'Sunflower 117/6 → Brickworks 44/9', c: 'Vanguard 120 · Pecker 860 · Pack Brahma 24' },
    { k: 'in', t: '01:05:22', a: 'Transport', b: 'Sunflower 121/11 → Sunflower 117/6', c: 'Grain 60,000 · Grit 25,000' },
    { k: 'out', t: '03:40:00', a: 'Expedition', b: 'Pasture 203/14 → the Wilds', c: 'Pack Brahma 8 · Scout 4' }
  ];
  const QUEUE = [
    { ic: 'zgrade', n: 'Grit Pit', d: 'level 19 → 20', t: '01:24:05', e: 9 },
    { ic: 'inkubator', n: 'Pecker ×120', d: 'from 240 eggs · Hatchery 8', t: '02:11:00', e: 14 },
    { ic: 'istrazivanja', n: 'Egg Genetics', d: 'level 6 → 7', t: '05:12:44', e: 32 }
  ];
  const COOPS = [
    { n: 'Home Coop', a: 'Sunflower 117/6', p: '148/192', on: 1 },
    { n: 'Creek Outpost', a: 'Sunflower 121/11', p: '97/138' },
    { n: 'Roadside Outpost', a: 'Brickworks 44/2', p: '61/74' },
    { n: 'Grove Watch', a: 'Pasture 203/14', p: '88/112' }
  ];
  const crest = `<svg viewBox="0 0 62 74" aria-hidden="true"><path d="M3,3 H59 V34 C59,54 44,66 31,71 C18,66 3,54 3,34 Z" fill="#a51d27" stroke="#d4a338" stroke-width="3"/><ellipse cx="31" cy="33" rx="11" ry="14" fill="#f2d27a" stroke="#2a1a12" stroke-width="2"/><path d="M14,12 l4,6 4,-6 M40,12 l4,6 4,-6" stroke="#f2d27a" stroke-width="2.5" fill="none"/></svg>`;

  function mainA() {
    return `<div class="cv main mA skA">
  <header class="mA-top">
    <div class="mA-logo"><b>FEATHER &amp; IRON</b><small>WORLD 1 · DAY 64</small></div>
    <div class="mA-res">${RES.map(r => `<div class="plate">${I(r.ic)}<div><b>${r.v}</b><small>${r.l} · ${r.r}</small></div></div>`).join('')}</div>
    <div class="mA-user"><b>RED SPUR</b><small>[BEAK] Beak of Justice · #412</small></div>
  </header>
  <nav class="mA-nav">${NAV.map((n, i) => `<div class="tab${i === 0 ? ' on' : ''}">${I(n.ic)}<span>${n.l}</span>${n.n ? `<em>${n.n}</em>` : ''}</div>`).join('')}</nav>
  <main class="mA-center">
    <div class="mA-photo pnl"><div class="mA-ph">${IMG('sA_yard', 'yard', 'Home coop yard')}</div>
      <div class="mA-cap"><b>SUNFLOWER 117/6</b> · home coop, photographed 09.11.</div>
      <div class="mA-stamp">MEADOW<br><small>PLOT 6</small></div></div>
    <div class="mA-stats">
      <div class="pnl st"><small>FIELDS</small><b>148 / 192</b><i class="bar"><u style="width:77%"></u></i></div>
      <div class="pnl st"><small>CLIMATE</small><b>18 °C</b><span>temperate · Oil +5%</span></div>
      <div class="pnl st"><small>DEFENSE</small><b>312</b><span>6 Scarecrow Towers · dome</span></div>
      <div class="pnl st"><small>TICKET</small><b>#04117</b><span>Chikn NFT · World 1</span></div>
    </div>
    <div class="mA-queue pnl"><h3>Under construction</h3><table>${QUEUE.map(q => `<tr><td style="width:26px">${I(q.ic)}</td><td><b>${q.n}</b><span class="sub">${q.d}</span></td><td>${q.t}</td><td><span class="btn">Speed up · ${q.e} eggs</span></td></tr>`).join('')}</table></div>
  </main>
  <aside class="mA-right">
    <div class="pnl tele"><h3>Telegraph · flocks</h3>${EVENTS.slice(0, 3).map(e => `<div class="ev ${e.k}"><b>${e.k === 'bad' ? '⚠ ' : ''}${e.a.toUpperCase()}</b><span class="t">${e.t}</span><span>${e.b}</span></div>`).join('')}</div>
    <div class="pnl tags"><h3>Coops 4 / 6</h3>${COOPS.map(c => `<div class="tag${c.on ? ' on' : ''}"><b>${c.n}</b><i>${c.p}</i><span>${c.a}</span></div>`).join('')}</div>
    <div class="pnl wal"><h3>Eggs in wallet</h3><div class="big">2,412</div><p>3 Chikn tickets<br>1 seat in use</p><span class="btn pri">${I('inkubator')} Open Hatchery</span></div>
  </aside>
  <footer class="mA-foot"><span>SERVER TIME 21:32:07</span><span>FLEDGLING SHIELD: OFF</span><span>WORLD 1: 28,410 / 32,000 SEATS</span><span>1,937 COMMANDERS ONLINE</span></footer>
</div>`;
  }

  function mainB() {
    const seal = (r) => `<div class="seal"><i>${I(r.ic)}</i><div><b>${r.v}</b><small>${r.l}</small><small>${r.r}</small></div></div>`;
    return `<div class="cv main mB skB">
  <header class="mB-top">
    <div class="mB-res">${seal(RES[0])}${seal(RES[1])}</div>
    <div class="mB-crest">${crest}<div><h1>House of the Red Spur</h1><p>Alliance Beak of Justice · 412th in the Pecking Order</p></div></div>
    <div class="mB-res r">${seal(RES[2])}${seal(RES[4])}</div>
  </header>
  <nav class="mB-nav">${NAV.map((n, i) => `<div class="sh${i === 0 ? ' on' : ''}">${I(n.ic)}${n.b}${n.n ? ` (${n.n})` : ''}</div>`).join('')}</nav>
  <section class="mB-left pnl"><h3>The Estate</h3>
    <dl><dt>Address</dt><dd>Sunflower 117/6</dd><dt>Zone</dt><dd>Meadow</dd><dt>Fields</dt><dd>148 of 192</dd></dl>
    <i class="bar"><u style="width:77%"></u></i>
    <dl><dt>Power</dt><dd>+142 (1,420 / 1,278)</dd><dt>Climate</dt><dd>18 °C, temperate</dd><dt>Walls</dt><dd>312 defenders</dd><dt>Scarecrows</dt><dd>6 towers</dd><dt>Dome</dt><dd>small, intact</dd></dl>
    <div class="por"><span class="egg-badge">${I('jaja')}</span><div><b>Ticket · Chikn #04117</b><span>Seat in World 1. Two spare tickets in this wallet.</span></div></div>
  </section>
  <section class="mB-center">
    <div class="mB-map pnl"><div class="fr">${IMG('sB_yard', 'yard', 'Home estate')}</div><div class="mB-rib">Sunflower · Street 117 · Plot 6</div></div>
    <div class="mB-work pnl">${QUEUE.map(q => `<div class="row">${I(q.ic)}<span><b>${q.n}</b> <i>${q.d}</i></span><span class="t">${q.t}</span><span class="btn">Speed up · ${q.e} eggs</span></div>`).join('')}</div>
  </section>
  <section class="mB-right pnl"><h3>Tidings of the Estate</h3>
    ${EVENTS.map(e => `<div class="news ${e.k}"><span class="t">${e.t}</span><b>${e.a}</b>${e.b}<br><i>${e.c}</i></div>`).join('')}
    <span class="btn pri" style="margin-top:auto">${I('inkubator')} Open the Hatchery</span>
  </section>
  <footer class="mB-foot">${COOPS.map(c => `<div class="pen${c.on ? ' on' : ''}"><b>${c.n}</b><span>${c.a} · ${c.p}</span></div>`).join('')}</footer>
</div>`;
  }

  /* ---------- other screens ---------- */
  function head(ic, title, sub) {
    return `<div class="pnl scr-h"><div class="tt">${I(ic)}<div><h2>${title}</h2><p>${sub}</p></div></div><div class="mres">${RES.filter(r => r.ic !== 'snaga').map(r => `<span>${I(r.ic)}${r.v}</span>`).join('')}</div></div>`;
  }

  const PLOTS = [
    [1, null, 'Roadside'], [2, ['Dusty Corner', 'Dusty Hen', 'GRAIN', 61, '', 'i']], [3, ['Road Watch', 'Gravel Queen', 'FENCE', 88, '4,200']],
    [4, ['Meadow Hall', 'Featherfist', 'BEAK', 214, '']], [5, ['Golden Meadow', 'Clucky Ann', 'FENCE', 231, '']], [6, ['Home Coop', 'Red Spur', 'BEAK', 192, '', 'me']],
    [7, null, 'Gardens'], [8, ["Gardener's House", 'Shaggy', 'GRAIN', 176, '', 'm']], [9, ['Cherry Shade', 'Black Rooster', '', 163, '66,780']],
    [10, ['By the Creek', 'Little Clucker', '', 120, '', 'f']], [11, ['Creek Outpost', 'Red Spur', 'BEAK', 138, '', 'me']], [12, null, 'Creek'],
    [13, ['Grove House', 'Mossy Comb', 'MOSS', 94, '', 'i']], [14, null, 'Grove'], [15, ['Last Fence', 'Pecky Mila', 'FENCE', 101, '']]
  ];
  const STAT = { i: '<span class="st-n">(i)</span>', m: '<span class="st-m">(m)</span>', f: '<span class="st-s">(f)</span>', me: '' };

  function scrMap(s) {
    const zone = [['1–3', 'Roadside · 44–110 fields'], ['4–6', 'Meadow · 150–238 fields'], ['7–9', 'Gardens · 132–204 fields'], ['10–12', 'Creek · 102–166 fields'], ['13–15', 'Grove · 70–132 fields']];
    const mc = IMG('b' + s + '_henhouse', 'mini-c', '');
    return `<div class="cv scr ${'sk' + s}">${head('komsiluk', 'Neighborhood', 'Sunflower · street 117 of 500')}
<div class="scr-b" style="grid-template-columns:minmax(0,1fr) 270px">
  <div class="pnl cell-p"><div class="addr"><span class="btn">◀</span><b>Neighborhood III · Sunflower</b><span class="btn">▶</span><span style="width:24px"></span><span class="btn">◀</span><b>Street 117</b><span class="btn">▶</span><span style="flex:1"></span><span class="chip">Scouts: 80</span><span class="chip">Pack Brahmas: 30</span></div>
  <table class="tbl"><thead><tr><th>Plot</th><th></th><th>Coop</th><th>Owner</th><th>Alliance</th><th>Fields</th><th>Feathers</th><th>Actions</th></tr></thead><tbody>
  ${PLOTS.map(([n, d, z]) => d ? `<tr class="${d[5] === 'me' ? 'me' : ''}"><td class="num">${n}</td><td>${mc}</td><td>${d[0]}</td><td>${d[1]} ${STAT[d[5]] || ''}</td><td>${d[2] ? '[' + d[2] + ']' : '—'}</td><td class="num">${d[3]}</td><td class="num">${d[4] || '—'}</td><td><span class="acts">${d[5] === 'me' ? '' : I('uhodi') + I('napad') + I('transport') + I('poruka')}</span></td></tr>`
      : `<tr class="free"><td class="num">${n}</td><td></td><td>Free plot · ${z}</td><td>—</td><td>—</td><td>—</td><td>—</td><td><span class="chip">Settle</span></td></tr>`).join('')}
  </tbody></table></div>
  <div class="pnl cell-p" style="gap:14px"><h3>Street zones</h3>
    <div class="zone">${zone.map((z, i) => `<div class="${i === 1 ? 'me' : ''}"><i>${z[0]}</i><span>${z[1]}</span></div>`).join('')}</div>
    <p class="note">Plot 6 is Meadow: the most fields and a temperate climate.</p>
    <div class="legend"><span><span class="st-n">(i)</span> inactive 7+ days</span><span><span class="st-m">(m)</span> molting, can't be attacked</span><span><span class="st-s">(f)</span> fledgling shield</span><span>Feathers: feather field left by a battle</span></div>
  </div>
</div></div>`;
  }

  const HUNITS = [['scout', 'Scout', 2, '0 / 0% / 20'], ['pecker', 'Pecker', 2, '8 / 0% / 40'], ['spurguard', 'Spurguard', 4, '20 / 15% / 110'], ['vanguard', 'Vanguard', 14, '60 / 20% / 280'], ['mortar', 'Egg Mortar', 62, '240 / 10% / 480'], ['pack', 'Pack Brahma', 7, '1 / 5% / 180']];

  function scrInk(s) {
    return `<div class="cv scr ${'sk' + s}">${head('inkubator', 'Hatchery', 'Turn eggs into units, defense, resources or speed-ups · Sunflower 117/6 · level 8')}
<div class="scr-b" style="grid-template-columns:270px minmax(0,1fr) 300px">
  <div class="pnl cell-p" style="gap:8px"><h3>Wallet</h3><span class="chip ok">● connected · 0x7a3…e91c</span>
    <div class="bigegg">2,412</div><div class="note">eggs ready to use<br>3 Chikn tickets in this wallet</div>
    ${[['#04117', 'playing · World 1'], ['#20511', 'spare ticket'], ['#12890', 'spare ticket']].map(c => `<div class="mchikn"><span class="egg-badge">${I('jaja')}</span><span>Chikn ${c[0]}<small>${c[1]}</small></span><span class="chip">${c[1].startsWith('playing') ? 'seat' : 'free'}</span></div>`).join('')}
    <div class="note" style="margin-top:auto">Eggs in the wallet can't be raided. Raiders only take Grain, Grit and Oil.</div>
  </div>
  <div class="pnl cell-p"><div class="tabs"><span class="tb on">All</span><span class="tb">Army</span><span class="tb">Transport</span><span class="tb">Defense</span><span class="tb">Resources</span><span class="tb">Speed-ups</span></div>
    <div class="ugrid">${HUNITS.map((c, i) => `<div class="ucard${i === 1 ? ' sel' : ''}">${IMG('u' + s + '_' + c[0], 'uimg-card', c[1])}<b>${c[1]}</b><div class="cost"><span>Atk / Armor / HP</span></div><div class="cost"><span>${c[3]}</span><strong>${c[2]} eggs</strong></div><div class="step"><span>${I('minus')}</span>${i === 1 ? 120 : 0}<span>${I('plus')}</span></div></div>`).join('')}</div>
    <div class="tabs" style="margin:14px 0 6px"><span class="tb on">Resources</span></div>
    <table class="tbl"><tr><td>1 egg → 200 Grain</td><td>1 egg → 100 Grit</td><td>1 egg → 50 Oil</td><td>1 egg → 10 min speed-up</td></tr></table>
  </div>
  <div class="pnl cell-p" style="gap:10px"><h3>Order</h3>
    <dl class="kv"><dt>Pecker × 120</dt><dd>240 eggs</dd><dt>Egg Genetics 7</dt><dd>+21%</dd><dt>You get</dt><dd>145 Peckers</dd><dt>Hatchery capacity</dt><dd>110 eggs/h</dd><dt>Hatch time</dt><dd>2 h 11 min</dd><dt>Left in wallet</dt><dd>2,172 eggs</dd></dl>
    <span class="btn pri">${I('jaja')} Hatch 240 eggs</span>
    <p class="note">Used eggs are burned on-chain. You confirm with a wallet signature.</p>
    <h3 style="margin-top:6px">Hatch queue</h3>
    <div class="kv"><dt>Pecker ×145</dt><dd>34%</dd></div><i class="bar"><u style="width:34%"></u></i>
    <div class="kv"><dt>Pack Brahma ×12</dt><dd>waiting</dd></div><i class="bar"><u style="width:0%"></u></i>
  </div>
</div></div>`;
  }

  function scrSend(s) {
    const us = [['vanguard', 'Vanguard', '164', '120'], ['pecker', 'Pecker', '1,240', '860'], ['mortar', 'Egg Mortar', '52', '40'], ['pack', 'Pack Brahma', '30', '24'], ['scout', 'Scout', '80', '0'], ['titan', 'War Brahma', '1', '0']];
    const ms = [['napad', 'Raid', 1], ['jato', 'Joint Raid'], ['transport', 'Transport'], ['strelica', 'Station'], ['odbrana', 'Guard'], ['uhodi', 'Scout'], ['pregled', 'Settle'], ['perje', 'Glean'], ['komsiluk', 'Expedition']];
    return `<div class="cv scr ${'sk' + s}">${head('odred', 'Send Flock', 'From: Sunflower 117/6 · home coop')}
<div class="scr-b" style="grid-template-columns:minmax(0,1fr) 330px">
  <div style="display:grid;grid-template-rows:auto 1fr;gap:14px;min-height:0">
    <div class="pnl cell-p"><h3>1 · Units</h3><table class="tbl utbl"><thead><tr><th></th><th>Unit</th><th>Available</th><th>Sending</th><th></th></tr></thead><tbody>
    ${us.map(u => `<tr><td style="width:52px">${IMG('u' + s + '_' + u[0], 'uimg', u[1])}</td><td>${u[1]}</td><td class="num">${u[2]}</td><td><span class="inp">${u[3]}</span></td><td><span class="chip">all</span></td></tr>`).join('')}
    </tbody></table></div>
    <div class="pnl cell-p"><h3>2 · Target and mission</h3>
      <div class="addr"><span>Neighborhood</span><span class="inp" style="text-align:left">Brickworks</span><span>street</span><span class="inp">44</span><span>plot</span><span class="inp">9</span><span class="chip">Black Rooster · 163 fields</span></div>
      <div class="miss">${ms.map(m => `<div class="${m[2] ? 'on' : ''}">${I(m[0])}${m[1]}</div>`).join('')}</div>
    </div>
  </div>
  <div class="pnl cell-p" style="gap:10px"><h3>3 · Summary</h3>
    <dl class="kv"><dt>Distance</dt><dd>4 neighborhoods · 73 streets</dd><dt>Flock speed</dt><dd>100%</dd></dl>
    <div class="speed">${'<i></i>'.repeat(10)}</div>
    <dl class="kv"><dt>Duration</dt><dd>01:12:30</dd><dt>Arrival</dt><dd>09.11. 22:44:37</dd><dt>Return</dt><dd>10.11. 00:09:44</dd><dt>Oil used</dt><dd>3,120</dd><dt>Cargo</dt><dd>79,600</dd><dt>Attack per round</dt><dd>23,680</dd></dl>
    <p class="note">The slowest unit sets the flock's speed. Egg Mortars hit defenses three times.</p>
    <span class="btn pri" style="margin-top:auto">${I('odred')} Send flock</span>
  </div>
</div></div>`;
  }

  function scrRep(s) {
    const att = [['Vanguard', '120', '104', '16'], ['Pecker', '860', '702', '158'], ['Egg Mortar', '40', '40', '0'], ['Pack Brahma', '24', '24', '0']];
    const def = [['Pecker', '300', '0', '300'], ['Spurguard', '120', '0', '120'], ['Slinger Nest', '40', '0', '40'], ['Scarecrow Tower', '6', '1', '5'], ['Small Shell Dome', '1', '0', '1']];
    const t = (rows) => `<table class="tbl"><thead><tr><th>Unit</th><th>Before</th><th>After</th><th>Lost</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td class="l">−${r[3]}</td></tr>`).join('')}</tbody></table>`;
    const rd = [[96, 88], [91, 52], [87, 19], [86, 0]];
    return `<div class="cv scr ${'sk' + s}">${head('poruke', 'Battle Report', 'Brickworks 44/9 · 09.11. at 22:44:37')}
<div class="scr-b" style="grid-template-rows:auto auto auto auto;align-content:start">
  <div class="pnl rep-h"><div><b>Raid on Cherry Shade</b><p class="note" style="margin:2px 0 0">Attacker Red Spur [BEAK] · Defender Black Rooster</p></div><span class="res">Attacker wins in round 4</span></div>
  <div class="rep-g"><div class="pnl cell-p"><h3>Attacker · Red Spur</h3><div class="side-t">Beak Sharpening 9 · Shell Plating 8 · Down Padding 7</div>${t(att)}</div><div class="pnl cell-p"><h3>Defender · Black Rooster</h3><div class="side-t">Beak Sharpening 6 · Shell Plating 7 · Down Padding 5</div>${t(def)}</div></div>
  <div class="pnl cell-p"><h3>Strength after each round</h3><div class="rounds">${rd.map((r, i) => `<div class="rd"><b>Round ${i + 1}</b><span>Attacker ${r[0]}%</span><i class="bar"><u style="width:${r[0]}%"></u></i><span>Defender ${r[1]}%</span><i class="bar d"><u style="width:${r[1]}%"></u></i></div>`).join('')}</div></div>
  <div class="loot"><div class="pnl"><small>Loot · Grain</small><b>42,000</b></div><div class="pnl"><small>Loot · Grit</small><b>18,500</b></div><div class="pnl"><small>Loot · Oil</small><b>6,200</b></div><div class="pnl"><small>Feather field over 44/9</small><b>66,780</b></div></div>
</div></div>`;
  }

  function scrWallet(s) {
    const T = [['#04117', 'Playing', 'World 1 · account Red Spur', 'Seat in use since 01.11.'], ['#20511', 'Spare ticket', 'Can join another world or be sold', 'Brought 1,000 eggs'], ['#12890', 'Spare ticket', 'Can join another world or be sold', 'Brought 1,000 eggs']];
    const L = [['09.11.', 'Hatched Pecker ×120', '−240'], ['08.11.', 'Speed-up: Grit Pit 19', '−8'], ['07.11.', 'Cracked into 40,000 Grain', '−200'], ['05.11.', 'Hatched Pack Brahma ×20', '−140'], ['01.11.', '3 tickets connected (3 × 1,000)', '+3,000']];
    return `<div class="cv scr ${'sk' + s}">${head('novcanik', 'Chikn Wallet', '3 Chikn tickets · 2,412 eggs · 1 seat in use')}
<div class="scr-b" style="grid-template-columns:minmax(0,1.1fr) minmax(0,1fr)">
  <div class="pnl cell-p" style="gap:12px"><h3>Tickets</h3>
    ${T.map((t, i) => `<div class="ticket${i === 0 ? ' on' : ''}"><span class="egg-badge big">${I('jaja')}</span><div><span class="id">Chikn ${t[0]}</span><b>${t[1]}</b><div class="note">${t[2]}</div></div><span class="chip${i === 0 ? ' gold' : ''}">${t[3]}</span></div>`).join('')}
    <p class="note" style="margin-top:auto">One wallet plays one seat at a time. The account belongs to the NFT: transfer the NFT and the account goes with it.</p>
  </div>
  <div class="pnl cell-p" style="gap:10px"><h3>Egg ledger</h3>
    <div class="bigegg">2,412</div><div class="note">3,000 eggs brought by 3 tickets, 588 used</div>
    <table class="tbl"><thead><tr><th>Date</th><th>Action</th><th>Eggs</th></tr></thead><tbody>${L.map(l => `<tr><td class="num">${l[0]}</td><td>${l[1]}</td><td class="num">${l[2]}</td></tr>`).join('')}</tbody></table>
    <p class="note">Used eggs are burned. Eggs can be traded between wallets like any token.</p>
  </div>
</div></div>`;
  }

  const OTHER = [
    { id: 'neighborhood', name: 'Neighborhood', desc: 'A street of 15 plots: owners, alliances, fields, feather fields and quick actions.', fn: scrMap },
    { id: 'hatchery', name: 'Hatchery', desc: 'Turning wallet eggs into units, defense, resources or speed-ups.', fn: scrInk },
    { id: 'send', name: 'Send Flock', desc: 'Pick units, target and mission. See duration, Oil, cargo and attack.', fn: scrSend },
    { id: 'report', name: 'Battle Report', desc: 'Losses per unit, strength per round, loot and the feather field.', fn: scrRep },
    { id: 'wallet', name: 'Chikn Wallet', desc: 'Your NFT tickets, which one holds the seat, and every egg spent.', fn: scrWallet }
  ];

  global.SCREENS = { mainA, mainB, OTHER };
})(window);
