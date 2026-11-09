/* Perje i Gvožđe — game screen mockups. Example data only. */
(function (global) {
  'use strict';
  const I = (n) => ART.icon(n);

  const RES = [
    { ic: 'zrno', l: 'Zrno', v: '184.220', r: '+4.812/h', fill: 76, cap: '242.000' },
    { ic: 'krec', l: 'Kreč', v: '92.415', r: '+2.106/h', fill: 58, cap: '160.000' },
    { ic: 'ulje', l: 'Ulje', v: '31.870', r: '+894/h', fill: 40, cap: '80.000' },
    { ic: 'snaga', l: 'Snaga', v: '+142', r: '1.420 / 1.278', fill: 90 },
    { ic: 'jaja', l: 'Jaja', v: '1.284', r: '+14/dan' }
  ];
  const NAV = [
    { ic: 'pregled', l: 'Pregled', b2: 'Dvor' }, { ic: 'zgrade', l: 'Zgrade', b2: 'Gradnja' }, { ic: 'istrazivanja', l: 'Istraživanja', b2: 'Znanje' },
    { ic: 'inkubator', l: 'Inkubator', b2: 'Inkubator' }, { ic: 'odbrana', l: 'Odbrana', b2: 'Bedemi' }, { ic: 'odred', l: 'Odredi', b2: 'Odredi' },
    { ic: 'komsiluk', l: 'Komšiluk', b2: 'Komšiluk' }, { ic: 'jato', l: 'Jato', b2: 'Jato' }, { ic: 'poruke', l: 'Poruke', b2: 'Glasnici', n: 3 }, { ic: 'rang', l: 'Rang lista', b2: 'Lestvica' }
  ];
  const EVENTS = [
    { k: 'bad', t: '00:47:10', a: 'Neprijateljski odred', b: 'Žuta Kuna [OGRD] → Suncokreti 117/6', c: 'oko 340 jedinica · Osmatračnica 9', p: 64 },
    { k: 'out', t: '00:12:41', a: 'Prepad', b: 'Suncokreti 117/6 → Ciglana 44/9', c: 'Jurišnik 120 · Kljucač 860 · Zaprega 24', p: 83 },
    { k: 'in', t: '01:05:22', a: 'Transport', b: 'Suncokreti 121/11 → Suncokreti 117/6', c: 'Zrno 60.000 · Kreč 25.000', p: 41 },
    { k: 'out', t: '03:40:00', a: 'Pohod u Divljinu', b: 'Pašnjak 203/14 → Šumarak', c: 'Zaprega 8 · Uhoda 4', p: 12 }
  ];
  const QUEUE = [
    { ic: 'zgrade', n: 'Krečana', d: 'nivo 19 → 20', t: '01:24:05', p: 62, e: 9 },
    { ic: 'inkubator', n: 'Kljucač ×120', d: 'iz 240 jaja · Inkubator 8', t: '02:11:00', p: 34, e: 14 },
    { ic: 'istrazivanja', n: 'Genetika jajeta', d: 'nivo 6 → 7', t: '05:12:44', p: 18, e: 32 }
  ];
  const COOPS = [
    { n: 'Matični kokošinjac', a: 'Suncokreti 117/6', p: '148/192', on: 1 },
    { n: 'Ispostava Potok', a: 'Suncokreti 121/11', p: '97/138' },
    { n: 'Drumska ispostava', a: 'Ciglana 44/2', p: '61/74' },
    { n: 'Šumska straža', a: 'Pašnjak 203/14', p: '88/112' }
  ];

  const crest = `<svg viewBox="0 0 62 74" aria-hidden="true"><path d="M3,3 H59 V34 C59,54 44,66 31,71 C18,66 3,54 3,34 Z" fill="#a51d27" stroke="#d4a338" stroke-width="3"/><path d="M3,3 L59,52 M59,3 L3,52" stroke="#d4a338" stroke-width="0" /><ellipse cx="31" cy="33" rx="11" ry="14" fill="#f2d27a" stroke="#2a1a12" stroke-width="2"/><path d="M14,12 l4,6 4,-6 M40,12 l4,6 4,-6" stroke="#f2d27a" stroke-width="2.5" fill="none"/></svg>`;

  function mainA() {
    return `<div class="cv main mA skA">
  <header class="mA-top">
    <div class="mA-logo"><b>PERJE I GVOŽĐE</b><small>SEZONA III · DAN 64/90</small></div>
    <div class="mA-res">${RES.map(r => `<div class="plate">${I(r.ic)}<div><b>${r.v}</b><small>${r.l} · ${r.r}</small></div></div>`).join('')}</div>
    <div class="mA-user"><b>CRVENA MAMUZA</b><small>[KLJN] Kljun Pravde · 412. u Redu</small></div>
  </header>
  <nav class="mA-nav">${NAV.map((n, i) => `<div class="tab${i === 0 ? ' on' : ''}">${I(n.ic)}<span>${n.l}</span>${n.n ? `<em>${n.n}</em>` : ''}</div>`).join('')}</nav>
  <main class="mA-center">
    <div class="mA-photo pnl"><div class="mA-ph">${ART.scene('A')}</div>
      <div class="mA-cap"><b>SUNCOKRETI 117/6</b> · matični kokošinjac, snimljeno 09.11.</div>
      <div class="mA-stamp">LIVADA<br><small>PLAC 6</small></div></div>
    <div class="mA-stats">
      <div class="pnl st"><small>POLJA</small><b>148 / 192</b><i class="bar"><u style="width:77%"></u></i></div>
      <div class="pnl st"><small>KLIMA</small><b>18 °C</b><span>umereno · +10% zrno</span></div>
      <div class="pnl st"><small>ODBRANA</small><b>312</b><span>6 Strašila · mala kupola</span></div>
      <div class="pnl st"><small>STAREŠINA</small><b>#04117</b><span>Somborska kaporka</span></div>
    </div>
    <div class="mA-queue pnl"><h3>Gradnja u toku</h3><table>${QUEUE.map(q => `<tr><td style="width:26px">${I(q.ic)}</td><td><b>${q.n}</b><span class="sub">${q.d}</span></td><td>${q.t}</td><td><span class="btn">Ubrzaj · ${q.e} jaja</span></td></tr>`).join('')}</table></div>
  </main>
  <aside class="mA-right">
    <div class="pnl tele"><h3>Telegraf · odredi</h3>${EVENTS.slice(0, 3).map(e => `<div class="ev ${e.k}"><b>${e.k === 'bad' ? '⚠ ' : ''}${e.a.toUpperCase()}</b><span class="t">${e.t}</span><span>${e.b}</span></div>`).join('')}</div>
    <div class="pnl tags"><h3>Kokošinjci 4 / 6</h3>${COOPS.map(c => `<div class="tag${c.on ? ' on' : ''}"><b>${c.n}</b><i>${c.p}</i><span>${c.a}</span></div>`).join('')}</div>
    <div class="pnl wal"><h3>Jaja u novčaniku</h3><div class="big">1.284</div><p>7 Chikn u novčaniku<br>+14 jaja dnevno</p><span class="btn pri">${I('inkubator')} Pretvori u Inkubatoru</span></div>
  </aside>
  <footer class="mA-foot"><span>VREME SERVERA 21:32:07</span><span>ŽETVA ZA 26 DANA</span><span>LISIČJA NOĆ ZA 2 D 04 H</span><span>1.937 KOMANDANATA NA VEZI</span></footer>
</div>`;
  }

  function mainB() {
    const seal = (r) => `<div class="seal"><i>${I(r.ic)}</i><div><b>${r.v}</b><small>${r.l}</small><small>${r.r}</small></div></div>`;
    return `<div class="cv main mB skB">
  <header class="mB-top">
    <div class="mB-res">${seal(RES[0])}${seal(RES[1])}</div>
    <div class="mB-crest">${crest}<div><h1>Kuća Crvene Mamuze</h1><p>Jato Kljun Pravde · 412. mesto u Redu kljucanja</p></div></div>
    <div class="mB-res r">${seal(RES[2])}${seal(RES[4])}</div>
  </header>
  <nav class="mB-nav">${NAV.map((n, i) => `<div class="sh${i === 0 ? ' on' : ''}">${I(n.ic)}${n.b2}${n.n ? ` (${n.n})` : ''}</div>`).join('')}</nav>
  <section class="mB-left pnl"><h3>Imanje</h3>
    <dl><dt>Adresa</dt><dd>Suncokreti 117/6</dd><dt>Predeo</dt><dd>Livada</dd><dt>Polja</dt><dd>148 od 192</dd></dl>
    <i class="bar"><u style="width:77%"></u></i>
    <dl><dt>Snaga</dt><dd>+142 (1.420 / 1.278)</dd><dt>Klima</dt><dd>18 °C, umereno</dd><dt>Bedemi</dt><dd>312 branilaca</dd><dt>Strašila</dt><dd>6</dd><dt>Kupola</dt><dd>mala, cela</dd></dl>
    <div class="por">${ART.portrait('kaporka', 'B')}<div><b>Starešina #04117</b><span>Somborska kaporka, legendarna. Kapa Reda: +5% na sve.</span></div></div>
  </section>
  <section class="mB-center">
    <div class="mB-map pnl"><div class="fr">${ART.scene('B')}</div><div class="mB-rib">Suncokreti · sokak 117 · plac 6</div></div>
    <div class="mB-work pnl">${QUEUE.map(q => `<div class="row">${I(q.ic)}<span><b>${q.n}</b> <i>${q.d}</i></span><span class="t">${q.t}</span><span class="btn">Ubrzaj · ${q.e} jaja</span></div>`).join('')}</div>
  </section>
  <section class="mB-right pnl"><h3>Vesti s Imanja</h3>
    ${EVENTS.map(e => `<div class="news ${e.k}"><span class="t">${e.t}</span><b>${e.a}</b>${e.b}<br><i>${e.c}</i></div>`).join('')}
    <span class="btn pri" style="margin-top:auto">${I('inkubator')} Pretvori 1.284 jaja</span>
  </section>
  <footer class="mB-foot">${COOPS.map(c => `<div class="pen${c.on ? ' on' : ''}"><b>${c.n}</b><span>${c.a} · ${c.p}</span></div>`).join('')}</footer>
</div>`;
  }

  function ring(p) {
    const r = 22, c = 2 * Math.PI * r;
    return `<svg class="ring" viewBox="0 0 54 54" aria-hidden="true"><circle cx="27" cy="27" r="${r}" fill="none" stroke="rgba(95,240,255,.16)" stroke-width="4"/><circle cx="27" cy="27" r="${r}" fill="none" stroke="#5ff0ff" stroke-width="4" stroke-dasharray="${(c * p / 100).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 27 27)" style="filter:drop-shadow(0 0 4px #5ff0ff)"/><text x="27" y="31" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="11" fill="#d9fbff">${p}%</text></svg>`;
  }

  function mainC() {
    const mini = ['o', 'o', 'en', 'al', 'o', 'me', '', 'o', 'o', 'o', 'me', '', 'o', '', 'o'];
    return `<div class="cv main mC skC">
  <div class="mC-scene">${ART.scene('C', { fit: 'meet' })}</div>
  <div class="mC-coord">SUNCOKRETI 117/6 · LIVADA · 148/192 POLJA · 18 °C</div>
  <header class="gl mC-top">
    <div class="mC-logo"><i><span>P&amp;G</span></i><b>PERJE I GVOŽĐE</b></div>
    <div class="mC-res">${RES.slice(0, 4).map(r => `<div class="rs">${I(r.ic)}<b>${r.v}</b><small><span>${r.l.toUpperCase()}</span><span>${r.r}</span></small><i class="bar"><u style="width:${r.fill}%"></u></i></div>`).join('')}</div>
    <div class="mC-wal">${I('novcanik')}<div><b>1.284</b><small>JAJA · 7 CHIKN · +14/24H</small></div><i class="dot"></i></div>
  </header>
  <nav class="gl mC-rail">${NAV.map((n, i) => `<div class="it${i === 0 ? ' on' : ''}">${I(n.ic)}<span>${n.l}</span>${n.n ? `<em>${n.n}</em>` : ''}</div>`).join('')}</nav>
  <aside class="gl mC-time"><h3>Kretanje odreda</h3>
    ${EVENTS.map(e => `<div class="tl ${e.k}"><div class="h"><b>${e.a}</b><span class="t">${e.t}</span></div><p>${e.b}<br>${e.c}</p><i class="bar"><u style="width:${e.p}%"></u></i></div>`).join('')}
  </aside>
  <section class="gl mC-queue">${QUEUE.map(q => `<div class="qi">${ring(q.p)}<b>${q.n}</b><span>${q.t}</span></div>`).join('')}</section>
  <section class="mC-dock">${COOPS.map(c => `<div class="dk${c.on ? ' on' : ''}">${ART.building('kokosinjac', 'C', { bare: true })}<i>${c.p}</i><b>${c.n}</b><span>${c.a}</span></div>`).join('')}</section>
  <section class="gl mC-mini"><h3>Sokak 117 · Suncokreti</h3><div class="mini">${mini.map(m => `<i class="${m}"></i>`).join('')}</div><div class="mini-z"><span>DRUM</span><span>LIVADA</span><span>BAŠTE</span><span>POTOK</span><span>ŠUMARAK</span></div></section>
</div>`;
  }

  /* ---------- other screens ---------- */
  function head(s, ic, title, sub) {
    return `<div class="pnl scr-h"><div class="tt">${I(ic)}<div><h2>${title}</h2><p>${sub}</p></div></div><div class="mres">${RES.filter(r => r.ic !== 'snaga').map(r => `<span>${I(r.ic)}${r.v}</span>`).join('')}</div></div>`;
  }

  const PLOTS = [
    [1, null, 'Uz drum'], [2, ['Prašnjavi ćošak', 'Kvočka Bosa', 'ZRNO', 61, '', 'n']], [3, ['Drumska straža', 'Žuta Kuna', 'OGRD', 88, '4.200']],
    [4, ['Livadski dvor', 'Perjanik', 'KLJN', 214, '']], [5, ['Zlatna livada', 'Grebatorka', 'OGRD', 231, '']], [6, ['Matični kokošinjac', 'Crvena Mamuza', 'KLJN', 192, '', 'me']],
    [7, null, 'Bašte'], [8, ['Baštovanova kuća', 'Čupava', 'ZRNO', 176, '', 'm']], [9, ['Trešnjin hlad', 'Crni Petao', '', 163, '31.200']],
    [10, ['Kod potoka', 'Mala Kokoška', '', 120, '', 's']], [11, ['Ispostava Potok', 'Crvena Mamuza', 'KLJN', 138, '', 'me']], [12, null, 'Potok'],
    [13, ['Šumska kuća', 'Lisičji Trag', 'LSC', 94, '', 'n']], [14, null, 'Šumarak'], [15, ['Poslednja ograda', 'Pernata Milica', 'OGRD', 101, '']]
  ];
  const STAT = { n: '<span class="st-n">(n)</span>', m: '<span class="st-m">(m)</span>', s: '<span class="st-s">(z)</span>', me: '' };

  function scrMap(s) {
    const zone = [['1–3', 'Uz drum · 44–110 polja'], ['4–6', 'Livada · 150–238 polja'], ['7–9', 'Bašte · 132–204 polja'], ['10–12', 'Potok · 102–166 polja'], ['13–15', 'Šumarak · 70–132 polja']];
    const mc = ART.building('kokosinjac', s, { bare: true, cls: 'mini-c' });
    return `<div class="cv scr ${'sk' + s}">${head(s, 'komsiluk', 'Komšiluk', 'Suncokreti · sokak 117 od 300')}
<div class="scr-b" style="grid-template-columns:minmax(0,1fr) 270px">
  <div class="pnl cell-p"><div class="addr"><span class="btn">◀</span><b>Komšiluk III · Suncokreti</b><span class="btn">▶</span><span style="width:24px"></span><span class="btn">◀</span><b>Sokak 117</b><span class="btn">▶</span><span style="flex:1"></span><span class="chip">Uhode: 80</span><span class="chip">Zaprege: 30</span></div>
  <table class="tbl"><thead><tr><th>Plac</th><th></th><th>Kokošinjac</th><th>Vlasnik</th><th>Jato</th><th>Polja</th><th>Perje</th><th>Akcije</th></tr></thead><tbody>
  ${PLOTS.map(([n, d, z]) => d ? `<tr class="${d[5] === 'me' ? 'me' : ''}"><td class="num">${n}</td><td>${mc}</td><td>${d[0]}</td><td>${d[1]} ${STAT[d[5]] || ''}</td><td>${d[2] ? '[' + d[2] + ']' : '—'}</td><td class="num">${d[3]}</td><td class="num">${d[4] || '—'}</td><td><span class="acts">${d[5] === 'me' ? '' : I('uhodi') + I('napad') + I('transport') + I('poruka')}</span></td></tr>`
      : `<tr class="free"><td class="num">${n}</td><td></td><td>Slobodan plac · ${z}</td><td>—</td><td>—</td><td>—</td><td>—</td><td><span class="chip">Naseli</span></td></tr>`).join('')}
  </tbody></table></div>
  <div class="pnl cell-p" style="gap:14px"><h3>Pojas sokaka</h3>
    <div class="zone">${zone.map((z, i) => `<div class="${i === 1 ? 'me' : ''}"><i>${z[0]}</i><span>${z[1]}</span></div>`).join('')}</div>
    <p class="note">Plac 6 je u Livadi: najviše polja, umerena klima, +10% zrna.</p>
    <div class="legend"><span><span class="st-n">(n)</span> neaktivan 7+ dana</span><span><span class="st-m">(m)</span> u mitarenju, ne može se napasti</span><span><span class="st-s">(z)</span> zaštita pilića</span><span>Perje: polje perja posle bitke</span></div>
  </div>
</div></div>`;
  }

  function scrInk(s) {
    const cards = [['uhoda', 'Uhoda', 1, '0 / 1 / 10'], ['kljucac', 'Kljucač', 2, '2 / 2 / 6'], ['jurisnik', 'Jurišnik', 10, '6 / 5 / 6'], ['zaprega', 'Zaprega', 6, '0 / 3 / 5'], ['tvrdjava', 'Tvrđava', 2400, '10 / 10 / 1']];
    return `<div class="cv scr ${'sk' + s}">${head(s, 'inkubator', 'Inkubator', 'Pretvaranje jaja · Suncokreti 117/6 · nivo 8')}
<div class="scr-b" style="grid-template-columns:270px minmax(0,1fr) 300px">
  <div class="pnl cell-p" style="gap:8px"><h3>Novčanik</h3><span class="chip ok">● povezan · 0x7a3…e91c</span>
    <div class="bigegg">1.284</div><div class="note">jaja spremnih za pretvaranje<br>7 Chikn nosi +14 jaja dnevno</div>
    ${[['kaporka', '#04117 · Somborska kaporka', '5 jaja/dan'], ['brahma', '#20511 · Brahma', '3 jaja/dan'], ['leghorn', '#12890 · Leghorn', '2 jaja/dan']].map(c => `<div class="mchikn">${ART.portrait(c[0], s)}<span>${c[1]}<small>${c[2]}</small></span><span class="chip">+</span></div>`).join('')}
    <div class="note" style="margin-top:auto">Jaja u novčaniku se ne mogu opljačkati. Napadač odnosi samo zrno, kreč i ulje.</div>
  </div>
  <div class="pnl cell-p"><div class="tabs"><span class="tb on">Sve</span><span class="tb">Vojska</span><span class="tb">Transport</span><span class="tb">Odbrana</span><span class="tb">Resursi</span><span class="tb">Ubrzanje</span></div>
    <div class="ugrid">${cards.map((c, i) => `<div class="ucard${i === 1 ? ' sel' : ''}">${ART.unit(c[0], s)}<b>${c[1]}</b><div class="cost"><span>Napad / oklop / brzina</span></div><div class="cost"><span>${c[3]}</span><strong>${c[2].toLocaleString('sr-RS')} ${c[2] === 1 ? 'jaje' : 'jaja'}</strong></div><div class="step"><span>${I('minus')}</span>${i === 1 ? 120 : 0}<span>${I('plus')}</span></div></div>`).join('')}</div>
    <div class="tabs" style="margin:14px 0 6px"><span class="tb on">Resursi</span></div>
    <table class="tbl"><tr><td>1 jaje → 1.000 zrna</td><td>1 jaje → 500 kreča</td><td>1 jaje → 250 ulja</td><td>1 jaje → 10 min ubrzanja</td></tr></table>
  </div>
  <div class="pnl cell-p" style="gap:10px"><h3>Nalog</h3>
    <dl class="kv"><dt>Kljucač × 120</dt><dd>240 jaja</dd><dt>Genetika jajeta 7</dt><dd>+21%</dd><dt>Dobijaš</dt><dd>145 Kljucača</dd><dt>Kapacitet Inkubatora</dt><dd>110 jaja/h</dd><dt>Vreme izleganja</dt><dd>2 h 11 min</dd><dt>Ostaje u novčaniku</dt><dd>1.044 jaja</dd></dl>
    <span class="btn pri">${I('jaja')} Pretvori 240 jaja</span>
    <p class="note">Pretvorena jaja se trajno troše (spaljuju) na lancu. Potvrđuješ potpisom u novčaniku.</p>
    <h3 style="margin-top:6px">Red izleganja</h3>
    <div class="kv"><dt>Kljucač ×145</dt><dd>34%</dd></div><i class="bar"><u style="width:34%"></u></i>
    <div class="kv"><dt>Zaprega ×12</dt><dd>čeka</dd></div><i class="bar"><u style="width:0%"></u></i>
  </div>
</div></div>`;
  }

  function scrSend(s) {
    const us = [['jurisnik', 'Jurišnik', '164', '120'], ['kljucac', 'Kljucač', '1.240', '860'], ['zaprega', 'Zaprega', '30', '24'], ['uhoda', 'Uhoda', '80', '0'], ['tvrdjava', 'Tvrđava na kokošjim nogama', '1', '0']];
    const ms = [['napad', 'Prepad', 1], ['jato', 'Udruženi juriš'], ['transport', 'Transport'], ['strelica', 'Premeštanje'], ['odbrana', 'Čuvanje'], ['uhodi', 'Uhođenje'], ['pregled', 'Naseljavanje'], ['perje', 'Sakupljanje perja'], ['komsiluk', 'Pohod u Divljinu']];
    return `<div class="cv scr ${'sk' + s}">${head(s, 'odred', 'Slanje odreda', 'Iz: Suncokreti 117/6 · matični kokošinjac')}
<div class="scr-b" style="grid-template-columns:minmax(0,1fr) 330px">
  <div style="display:grid;grid-template-rows:auto 1fr;gap:14px;min-height:0">
    <div class="pnl cell-p"><h3>1 · Jedinice</h3><table class="tbl utbl"><thead><tr><th></th><th>Jedinica</th><th>Dostupno</th><th>Šalješ</th><th></th></tr></thead><tbody>
    ${us.map(u => `<tr><td style="width:66px">${ART.unit(u[0], s, { bare: true, cls: 'uimg' })}</td><td>${u[1]}</td><td class="num">${u[2]}</td><td><span class="inp">${u[3]}</span></td><td><span class="chip">sve</span></td></tr>`).join('')}
    </tbody></table></div>
    <div class="pnl cell-p"><h3>2 · Cilj i misija</h3>
      <div class="addr"><span>Komšiluk</span><span class="inp" style="text-align:left">Ciglana</span><span>sokak</span><span class="inp">44</span><span>plac</span><span class="inp">9</span><span class="chip">Crni Petao · 163 polja</span></div>
      <div class="miss">${ms.map(m => `<div class="${m[2] ? 'on' : ''}">${I(m[0])}${m[1]}</div>`).join('')}</div>
    </div>
  </div>
  <div class="pnl cell-p" style="gap:10px"><h3>3 · Pregled</h3>
    <dl class="kv"><dt>Udaljenost</dt><dd>4 komšiluka · 73 sokaka</dd><dt>Brzina odreda</dt><dd>100%</dd></dl>
    <div class="speed">${'<i></i>'.repeat(10)}</div>
    <dl class="kv"><dt>Trajanje</dt><dd>01:12:30</dd><dt>Dolazak</dt><dd>09.11. 22:44:37</dd><dt>Povratak</dt><dd>10.11. 00:09:44</dd><dt>Potrošnja ulja</dt><dd>3.120</dd><dt>Nosivost</dt><dd>600.000</dd><dt>Snaga napada</dt><dd>18.420</dd></dl>
    <p class="note">Kiša u Ciglani usporava odred za 15% još 2 h 10 min (Meteorologija 3).</p>
    <span class="btn pri" style="margin-top:auto">${I('odred')} Pošalji odred</span>
  </div>
</div></div>`;
  }

  function scrRep(s) {
    const att = [['Jurišnik', '120', '104', '16'], ['Kljucač', '860', '702', '158'], ['Jajobacač', '40', '40', '0'], ['Zaprega', '24', '24', '0']];
    const def = [['Kljucač', '300', '0', '300'], ['Mamuzar', '120', '0', '120'], ['Praćkaš', '40', '0', '40'], ['Strašilo', '6', '1', '5'], ['Ljuskasta kupola (mala)', '1', '0', '1']];
    const t = (rows) => `<table class="tbl"><thead><tr><th>Jedinica</th><th>Pre</th><th>Posle</th><th>Gubitak</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td class="l">−${r[3]}</td></tr>`).join('')}</tbody></table>`;
    const rd = [[96, 88], [91, 52], [87, 19], [86, 0]];
    return `<div class="cv scr ${'sk' + s}">${head(s, 'poruke', 'Izveštaj o borbi', 'Ciglana 44/9 · 09.11. u 22:44:37')}
<div class="scr-b" style="grid-template-rows:auto auto auto auto;align-content:start">
  <div class="pnl rep-h"><div><b>Prepad na Trešnjin hlad</b><p class="note" style="margin:2px 0 0">Napadač Crvena Mamuza [KLJN] · Branilac Crni Petao</p></div><span class="res">Pobeda napadača u 4. rundi</span></div>
  <div class="rep-g"><div class="pnl cell-p"><h3>Napadač · Crvena Mamuza</h3><div class="side-t">Oštrenje kljuna 9 · Ljuskasti oklop 8 · Paperje 7</div>${t(att)}</div><div class="pnl cell-p"><h3>Branilac · Crni Petao</h3><div class="side-t">Oštrenje kljuna 6 · Ljuskasti oklop 7 · Paperje 5</div>${t(def)}</div></div>
  <div class="pnl cell-p"><h3>Snaga posle svake runde</h3><div class="rounds">${rd.map((r, i) => `<div class="rd"><b>Runda ${i + 1}</b><span>Napadač ${r[0]}%</span><i class="bar"><u style="width:${r[0]}%"></u></i><span>Branilac ${r[1]}%</span><i class="bar d"><u style="width:${r[1]}%"></u></i></div>`).join('')}</div></div>
  <div class="loot"><div class="pnl"><small>Plen · zrno</small><b>42.000</b></div><div class="pnl"><small>Plen · kreč</small><b>18.500</b></div><div class="pnl"><small>Plen · ulje</small><b>6.200</b></div><div class="pnl"><small>Polje perja iznad 44/9</small><b>31.200</b></div></div>
</div></div>`;
  }

  const CHIKN = [
    ['kaporka', '#04117', 'Somborska kaporka', 'l', 'Legendarna', 5, 'Kapa Reda: +5% na sve, dupli glas u Savetu jata', 'Suncokreti 117/6'],
    ['brahma', '#20511', 'Brahma', 'e', 'Epska', 3, 'Bedem: +12% odbrana kokošinjca', 'Ciglana 44/2'],
    ['leghorn', '#12890', 'Leghorn', 'r', 'Retka', 2, 'Nosilja: Inkubator radi 15% brže', 'Suncokreti 121/11'],
    ['rodajlend', '#00873', 'Rodajlend', 'o', 'Obična', 1, 'Ratnica: +8% napad odreda', 'Pašnjak 203/14'],
    ['svilenka', '#17702', 'Svilenka', 'o', 'Obična', 1, 'Senka: +25% uspeh uhođenja', ''],
    ['orpington', '#28344', 'Orpington', 'o', 'Obična', 1, 'Domaćica: +10% proizvodnja', ''],
    ['sussex', '#09150', 'Saseks', 'o', 'Obična', 1, 'Izviđač: +12% brzina odreda', '']
  ];

  function scrColl(s) {
    return `<div class="cv scr ${'sk' + s}">${head(s, 'novcanik', 'Chikn kolekcija', '7 Chikn u novčaniku · 14 jaja dnevno · 4 starešine')}
<div class="scr-b" style="grid-template-rows:auto 1fr">
  <div class="tabs" style="margin:0"><span class="tb on">Sve (7)</span><span class="tb">Starešine (4)</span><span class="tb">Slobodne (3)</span><span class="tb">Legendarne (1)</span><span style="flex:1"></span><span class="chip gold">Sledeće nošenje za 03:12:40</span></div>
  <div class="cgrid">${CHIKN.map(c => `<div class="ccard">${ART.portrait(c[0], s)}<div><span class="id">${c[1]}</span><b>${c[2]}</b><span class="rar ${c[3]}">${c[4]}</span><div class="tr">${c[6]}</div><div class="note">${c[5]} ${c[5] === 1 ? 'jaje' : 'jaja'} dnevno</div></div><div class="as">${c[7] ? `<span>Starešina · ${c[7]}</span><span class="chip">promeni</span>` : `<span>Slobodna</span><span class="btn pri" style="padding:5px 10px">Postavi</span>`}</div></div>`).join('')}
    <div class="ccard empty">${I('pregled')}<b>Šumska straža nema starešinu</b><span class="note">Pašnjak 203/14 · postavi slobodnu Chikn za bonus kokošinjcu</span></div>
  </div>
</div></div>`;
  }

  const OTHER = [
    { id: 'komsiluk', name: 'Komšiluk', desc: 'Pregled sokaka: 15 placeva, vlasnici, jata, polja perja i brze akcije.', fn: scrMap },
    { id: 'inkubator', name: 'Inkubator', desc: 'Pretvaranje jaja iz novčanika u jedinice, transport, odbranu ili resurse.', fn: scrInk },
    { id: 'odred', name: 'Slanje odreda', desc: 'Izbor jedinica, cilja i misije, sa trajanjem, gorivom i nosivošću.', fn: scrSend },
    { id: 'borba', name: 'Izveštaj o borbi', desc: 'Gubici po jedinicama, snaga po rundama, plen i polje perja.', fn: scrRep },
    { id: 'kolekcija', name: 'Chikn kolekcija', desc: 'NFT Chikn iz novčanika: rasa, retkost, jaja dnevno i ko je starešina.', fn: scrColl }
  ];

  global.SCREENS = { mainA, mainB, mainC, OTHER, CHIKN };
})(window);
