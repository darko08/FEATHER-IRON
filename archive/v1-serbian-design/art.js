/* Perje i Gvožđe — SVG art: units and buildings in three art directions
   A = Rovovski (dieselpunk), B = Heraldički, C = Agro-tech holo, S = silhouette (key art) */
(function (global) {
  'use strict';

  const PAL = {
    A: { ink: '#1c1912', sw: 2.1,
      plum: '#a88c5c', plumD: '#6c5434', plumL: '#d6c194', comb: '#8f2f20', beak: '#c9a248', leg: '#bf973c', legD: '#8f7030', eye: '#120f0a', white: '#ece2c8',
      metal: '#7b8380', metalD: '#454c4a', metalL: '#a7aea8', blue: '#73899a', blueD: '#506474',
      cloth: '#5e6240', clothD: '#43472d', clothG: '#4f5a3a', cloth2: '#7d3a28', leather: '#6b4a2c', wood: '#8b6a42', woodD: '#5a4128', canvas: '#a99d75',
      brick: 'url(#aBrick)', stone: '#8e897b', stoneD: '#6c675b', roof: '#6b716d', roofD: '#4e5451',
      glass: '#93aba0', glassL: '#b7c7bb', glow: '#f2b544', egg: '#e9ddbf', paint: '#e7dcc0', accent: '#a3442a', gold: '#b28c3c', straw: '#c4a457',
      ground: '#6b5e44', grass: '#6c6f45', sand: '#a8986c', dark: '#24211a', beam: 'rgba(255,214,120,.24)', smoke: 'rgba(70,66,56,.42)', shadow: 'rgba(28,22,12,.30)' },
    B: { ink: '#15100c', sw: 2.6,
      plum: '#efe4c6', plumD: '#d5c39a', plumL: '#fff8e6', comb: '#b3202a', beak: '#e2ad33', leg: '#e2ad33', legD: '#c08e22', eye: '#15100c', white: '#fbf4e2',
      metal: '#c9cdc8', metalD: '#8e9591', metalL: '#e7ebe6', blue: '#c9cdc8', blueD: '#8e9591',
      cloth: '#1f4f8c', clothD: '#2b2e33', clothG: '#2f6b3a', cloth2: '#a51d27', leather: '#7a4a24', wood: '#a06c39', woodD: '#6c4523', canvas: '#efe2c4',
      brick: '#b9603f', stone: '#d0c5ab', stoneD: '#a99c7f', roof: '#a8322a', roofD: '#7d221c',
      glass: '#3c6fae', glassL: '#a9c6e8', glow: '#f6c94f', egg: '#fbf1d6', paint: '#f4ead2', accent: '#a51d27', gold: '#dba631', straw: '#d9b356',
      ground: '#4d7b3a', grass: '#4d7b3a', sand: '#cdb98a', dark: '#2a2420', beam: 'rgba(246,201,79,.28)', smoke: 'rgba(120,110,95,.38)', shadow: 'rgba(21,16,12,.22)' }
  };

  const CC = { cy: '#5ff0ff', cyD: '#2fb7cc', am: '#ffc35a', co: '#ff7a5c', wh: '#d9fbff' };
  // C materials: [stroke, fillOpacity, fillColor?]
  const CMAT = {
    plum: [CC.cy, .07], plumD: [CC.cyD, .14], plumL: [CC.cy, .03], comb: [CC.co, .2], beak: [CC.am, .16], leg: [CC.cy, 0], legD: [CC.cyD, 0], eye: ['none', 1, CC.am], white: [CC.cy, .05],
    metal: [CC.cy, .1], metalD: [CC.cyD, .18], metalL: [CC.wh, .08], blue: [CC.cy, .1], blueD: [CC.cyD, .18],
    cloth: [CC.cy, .05], clothD: [CC.cyD, .12], clothG: [CC.cyD, .12], cloth2: [CC.co, .14], leather: [CC.cyD, .1], wood: [CC.cy, .06], woodD: [CC.cyD, .12], canvas: [CC.cy, .05],
    brick: [CC.cy, .06], stone: [CC.cy, .06], stoneD: [CC.cyD, .12], roof: [CC.cy, .08], roofD: [CC.cyD, .14],
    glass: [CC.am, .28], glassL: [CC.cy, .05], glow: ['none', 1, CC.am], egg: [CC.am, .22], paint: [CC.cy, .05], accent: [CC.co, .2], gold: [CC.am, .16], straw: [CC.am, .08],
    ground: [CC.cyD, .04], grass: [CC.cyD, .04], sand: [CC.cyD, .06], dark: [CC.cyD, .3], beam: ['none', .16, CC.am], smoke: ['none', 0, CC.cy], shadow: ['none', 0, CC.cy]
  };

  function attrs(s, m, o, opt) {
    if (s === 'S') {
      const sil = opt.sil || '#0c0f12';
      if (m === 'glow' || m === 'glass') return `fill="${opt.lit || '#ffcc66'}"`;
      if (m === 'beam') return `fill="${opt.lit || '#ffcc66'}" fill-opacity=".14"`;
      if (m === 'shadow') return 'fill="none"';
      if (m === 'smoke') return `fill="${sil}" fill-opacity=".35"`;
      return `fill="${sil}"`;
    }
    if (s === 'C') {
      const c = CMAT[m] || [CC.cy, .06];
      const fill = c[2] || c[0];
      const sw = o.sw ? o.sw * .6 : 1.3;
      return `fill="${fill}" fill-opacity="${c[1]}" stroke="${c[0]}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"${o.op ? ` opacity="${o.op}"` : ''}`;
    }
    const P = PAL[s];
    const fill = P[m] || m;
    const ns = o.ns || m === 'shadow' || m === 'smoke' || m === 'beam';
    return `fill="${fill}"${ns ? '' : ` stroke="${P.ink}" stroke-width="${o.sw || P.sw}" stroke-linejoin="round" stroke-linecap="round"`}${o.op ? ` opacity="${o.op}"` : ''}`;
  }

  function detail(s, d, o) {
    if (s === 'S') return '';
    let col, w, op;
    if (s === 'A') { col = PAL.A.ink; w = o.w || 1.15; op = o.op || .6; }
    else if (s === 'B') { col = PAL.B.ink; w = o.w || 1.5; op = o.op || .9; }
    else { col = o.c === 'am' ? CC.am : (o.c === 'co' ? CC.co : CC.cy); w = (o.w || 1.2) * .75; op = o.op || .75; }
    if (o.col && s !== 'C') col = PAL[s][o.col] || o.col;
    return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
  }

  function strap(s, d, m, w, o, opt) {
    if (s === 'S') return `<path d="${d}" fill="none" stroke="${opt.sil || '#0c0f12'}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (s === 'C') {
      const c = (CMAT[m] || CMAT.metal)[0] === 'none' ? CC.am : (CMAT[m] || CMAT.metal)[0];
      return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-opacity=".16" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    const P = PAL[s];
    const col = P[m] || m;
    return `<path d="${d}" fill="none" stroke="${P.ink}" stroke-width="${w + P.sw * 1.6}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  const FONTS = {
    A: "'Saira Stencil One','Big Shoulders Display',Impact,sans-serif",
    B: "Cinzel,'Cormorant Garamond',Georgia,serif",
    C: "'JetBrains Mono',ui-monospace,monospace"
  };

  function text(s, x, y, str, o) {
    if (s === 'S') return '';
    const fill = s === 'C' ? (o.c === 'am' ? CC.am : CC.cy) : (PAL[s][o.m || 'paint'] || o.m);
    return `<text x="${x}" y="${y}" font-family="${FONTS[s]}" font-size="${o.size || 10}" fill="${fill}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.tr ? ` transform="${o.tr}"` : ''}${o.op ? ` opacity="${o.op}"` : ''}${o.w ? ` font-weight="${o.w}"` : ''}>${str}</text>`;
  }

  function ctx(s, opt) {
    opt = opt || {};
    const k = { s, opt };
    k.at = (m, o) => attrs(s, m, o || {}, opt);
    k.p = (d, m, o) => `<path d="${d}" ${k.at(m, o)}${o && o.tr ? ` transform="${o.tr}"` : ''}/>`;
    k.c = (x, y, r, m, o) => `<circle cx="${x}" cy="${y}" r="${r}" ${k.at(m, o)}/>`;
    k.e = (x, y, rx, ry, m, o) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" ${k.at(m, o)}${o && o.tr ? ` transform="${o.tr}"` : ''}/>`;
    k.r = (x, y, w, h, m, o) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${o && o.rx ? ` rx="${o.rx}"` : ''} ${k.at(m, o)}/>`;
    k.d = (d, o) => detail(s, d, o || {});
    k.sl = (d, m, w, o) => strap(s, d, m, w, o || {}, opt);
    k.shade = (d) => s === 'A' ? `<path d="${d}" fill="url(#aShade)"/>` : '';
    k.t = (x, y, str, o) => text(s, x, y, str, o || {});
    k.g = (inner, tr) => `<g transform="${tr}">${inner}</g>`;
    k.ring = (x, y, r, m, w) => k.sl(`M${x - r},${y} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0`, m, w);
    return k;
  }

  const rect = (x, y, w, h) => `M${x},${y} H${x + w} V${y + h} H${x} Z`;
  const range = (a, b, st) => { const r = []; for (let v = a; st > 0 ? v <= b : v >= b; v += st) r.push(v); return r; };

  /* ---------------- chicken rig ---------------- */
  const G = {
    tail: 'M88,104 C76,96 62,80 56,58 C66,62 73,66 78,72 C77,60 80,50 86,42 C90,54 93,62 95,70 C98,60 103,54 110,50 C110,66 108,84 106,98 Z',
    rtail: ['M92,102 C80,74 64,48 40,40 C48,54 60,76 82,106 Z', 'M88,106 C70,88 50,72 28,72 C38,82 56,96 84,112 Z', 'M98,98 C94,72 88,48 72,30 C72,48 78,72 90,102 Z'],
    body: 'M80,98 C96,88 128,86 152,92 C170,98 180,114 174,132 C168,150 148,162 122,163 C100,163 82,153 75,137 C71,123 72,107 80,98 Z',
    fluffy: 'M82,100 q6,-10 16,-8 q6,-8 16,-4 q8,-6 16,0 q10,-4 16,4 q10,2 12,12 q8,6 4,16 q4,10 -4,16 q0,10 -12,12 q-6,8 -16,6 q-8,6 -18,2 q-10,4 -18,-4 q-10,0 -12,-10 q-8,-6 -4,-16 q-6,-14 4,-26 z',
    wing: 'M158,106 C164,120 156,134 140,140 C124,146 104,144 88,136 L97,131 L86,126 L97,122 L88,116 C102,106 132,100 158,106 Z',
    wingL: 'M100,118 C118,112 138,112 156,116 M98,127 C112,124 126,124 140,127',
    neck: 'M140,96 C140,78 148,62 158,52 L184,58 C182,74 178,90 170,104 C160,106 148,103 140,96 Z',
    neckL: 'M152,72 L147,90 M162,68 L157,93 M172,68 L168,96',
    beak: 'M183,42 Q197,45 202,51 Q195,55 183,57 Z',
    comb: 'M156,37 C155,29 159,25 163,29 C163,21 169,19 171,27 C173,20 179,21 179,29 C183,27 188,31 185,37 Z',
    rcomb: 'M152,38 C148,27 154,19 160,24 C158,13 168,9 170,20 C172,9 182,9 182,20 C186,12 196,16 190,28 C196,28 196,36 188,40 Z',
    wattle: 'M180,58 C186,62 186,72 181,74 C176,72 176,64 178,58 Z',
    rwattle: 'M178,58 C189,62 191,80 182,85 C173,83 172,68 176,58 Z',
    crest: 'M152,38 q-4,-8 4,-12 q0,-8 8,-8 q4,-6 10,-2 q8,-2 10,6 q8,2 6,10 q2,6 -6,8 l-32,0 z',
    legN: 'M110,158 L106,183', toesN: 'M97,185 L106,183 L120,185 M106,183 L116,189',
    legF: 'M130,158 L134,182', toesF: 'M126,185 L134,182 L148,184 M134,182 L144,188'
  };

  function legs(k, o) {
    const s = k.s;
    if (o.noLegs) return '';
    if (s === 'C') return k.d(G.legF + ' ' + G.toesF, { w: 2 }) + k.d(G.legN + ' ' + G.toesN, { w: 2.3 });
    if (s === 'S') return `<path d="${G.legF} ${G.toesF} ${G.legN} ${G.toesN}" fill="none" stroke="${k.opt.sil || '#0c0f12'}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    const P = PAL[s];
    const U = (d, w) => `<path d="${d}" fill="none" stroke="${P.ink}" stroke-width="${w + P.sw * 1.5}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const Cc = (d, c, w) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    return U(G.legF, 4.2) + U(G.toesF, 2.4) + Cc(G.legF, P.legD, 4.2) + Cc(G.toesF, P.legD, 2.4) +
      U(G.legN, 4.6) + U(G.toesN, 2.6) + Cc(G.legN, P.leg, 4.6) + Cc(G.toesN, P.leg, 2.6);
  }

  function chicken(k, o) {
    o = o || {};
    const g = o.gear || {}, roo = !!o.roo, M = o.mat || {};
    const pm = M.plum || 'plum', pd = M.plumD || 'plumD', nm = M.neck || pm, cm = M.comb || 'comb';
    let s = legs(k, o);
    if (roo) s += k.p(G.rtail[1], pd) + k.p(G.rtail[0], pm) + k.p(G.rtail[2], pd) + k.d('M50,52 L80,96 M44,78 L80,104');
    else s += k.p(G.tail, pd) + k.d('M74,70 L90,98 M92,58 L98,94');
    s += g.back || '';
    const body = o.fluffy ? G.fluffy : G.body;
    s += k.p(body, pm) + k.shade(body);
    s += g.torso || '';
    const tr = o.headTr ? ` transform="${o.headTr}"` : '';
    s += `<g${tr}>` + k.p(G.neck, nm) + k.shade(G.neck) + k.d(G.neckL) + (g.neck || '') + '</g>';
    if (!o.noWing) s += k.p(G.wing, pd) + k.d(G.wingL);
    s += g.wing || '';
    let h = k.c(170, 48, 15, pm);
    if (!o.noEar) h += k.e(163, 55, 3.6, 2.8, roo ? 'comb' : 'white');
    if (!o.noBeak) h += k.p(G.beak, 'beak') + k.d('M188,47 L191,47');
    if (!o.noWattle) h += k.p(roo ? G.rwattle : G.wattle, cm);
    if (o.crest) h += k.p(G.crest, M.crest || pm) + k.d('M160,30 q4,-4 8,0 M170,24 q4,-4 8,0');
    else if (!o.noComb) h += k.p(roo ? G.rcomb : G.comb, cm);
    if (!o.noEye) h += k.c(175, 45, 3.1, 'eye') + (k.s === 'A' || k.s === 'B' ? k.c(176.2, 43.8, 1, 'white', { ns: 1 }) : '');
    h += (g.head || '') + (g.face || '');
    s += `<g${tr}>${h}</g>`;
    s += g.front || '';
    return s;
  }

  /* ---------------- helpers ---------------- */
  function rivets(k, x1, y1, x2, y2, n, r) {
    let o = '';
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1);
      const x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
      if (k.s === 'C') o += `<circle cx="${x}" cy="${y}" r="${r * .7}" fill="${CC.cy}" opacity=".7"/>`;
      else if (k.s === 'S') o += '';
      else o += `<circle cx="${x}" cy="${y}" r="${r}" fill="${k.s === 'B' ? PAL.B.gold : PAL.A.metalD}" stroke="${PAL[k.s].ink}" stroke-width=".6"/>`;
    }
    return o;
  }

  function wheel(k, cx, cy, r) {
    const s = k.s;
    if (s === 'S') return k.c(cx, cy, r, 'x');
    if (s === 'A') {
      let o = k.c(cx, cy, r, 'dark') + k.c(cx, cy, r - 5, 'metal') + k.shade(`M${cx - r + 5},${cy} a${r - 5},${r - 5} 0 1,0 ${2 * (r - 5)},0 a${r - 5},${r - 5} 0 1,0 ${-2 * (r - 5)},0`) + k.c(cx, cy, r - 13, 'metalD') + k.c(cx, cy, 4, 'metalL');
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; o += rivets(k, cx + Math.cos(a) * (r - 9), cy + Math.sin(a) * (r - 9), 0, 0, 1, 1.4); }
      return o;
    }
    if (s === 'B') {
      let sp = '';
      for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; sp += `M${cx},${cy} L${(cx + Math.cos(a) * (r - 3)).toFixed(1)},${(cy + Math.sin(a) * (r - 3)).toFixed(1)} `; }
      return k.sl(sp, 'wood', 2.6) + k.ring(cx, cy, r - 2, 'wood', 4.5) + k.c(cx, cy, 5.5, 'woodD') + k.c(cx, cy, 2, 'gold', { ns: 1 });
    }
    let sp = '';
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; sp += `M${cx},${cy} L${(cx + Math.cos(a) * (r - 3)).toFixed(1)},${(cy + Math.sin(a) * (r - 3)).toFixed(1)} `; }
    return k.c(cx, cy, r, 'metalD') + k.d(sp) + k.c(cx, cy, r - 6, 'metal') + k.c(cx, cy, 3, 'glow');
  }

  function sandbags(k, x0, y, n, step) {
    let o = '';
    for (let i = 0; i < n; i++) o += k.e(x0 + i * (step || 17), y, 9.5, 5.2, 'sand') + k.d(`M${x0 + i * (step || 17) - 3},${y - 1} L${x0 + i * (step || 17) + 3},${y - 1}`, { w: .9 });
    return o;
  }

  function wire(k, x1, y, x2) {
    let d = '';
    for (let x = x1; x <= x2; x += 8) d += `M${x - 7},${y} a7,9 0 1,0 14,0 a7,9 0 1,0 -14,0 `;
    return k.d(d, { w: 1.1, op: .85 }) + k.d(`M${x1 - 8},${y} L${x2 + 8},${y}`, { w: 1.2 });
  }

  function smoke(k, pts) { return pts.map(([x, y, r]) => k.c(x, y, r, 'smoke')).join(''); }

  /* ---------------- units ---------------- */
  const UNITS = {
    uhoda: {
      name: 'Uhoda', tr: 'translate(26,37) scale(.8)',
      draw(k) {
        const s = k.s, g = {}, HT = 'translate(-8,10)';
        if (s === 'B') {
          g.torso = k.p('M142,90 C122,94 90,100 80,128 C86,150 118,162 150,158 C166,150 172,130 168,110 Z', 'leather') +
            k.d('M100,112 C104,130 112,146 122,156 M126,100 C128,120 132,140 140,156', { w: 1.2 }) +
            k.p('M144,140 L180,152 L144,147 Z', 'metal') + k.r(141, 135, 4, 16, 'gold');
          g.head = k.p('M150,58 C145,36 158,22 176,24 C190,26 196,38 192,52 L186,50 C182,40 172,36 164,42 C158,48 158,56 161,64 Z', 'leather') + k.c(156, 66, 3, 'gold');
          return chicken(k, { fluffy: true, gear: g, noComb: true, noWing: true, headTr: HT });
        }
        if (s === 'C') {
          g.torso = k.p('M92,80 C84,66 96,52 110,58 Z', 'metalL') + k.d('M100,64 L108,88') +
            k.p('M146,100 L162,108 L166,124 L154,138 L142,120 Z', 'metal') + k.c(155, 118, 2.2, 'glow');
          g.head = k.p('M152,54 C150,35 162,27 176,28 C189,30 195,40 193,51 L186,59 L160,61 Z', 'metal') + k.c(179, 44, 6.5, 'glass') + k.c(179, 44, 2.6, 'glow');
          g.front = k.r(40, 24, 30, 8, 'metal', { rx: 3 }) + k.e(38, 21, 11, 2.4, 'metalL') + k.e(72, 21, 11, 2.4, 'metalL') +
            k.d('M44,24 L40,21 M66,24 L70,21') + k.c(55, 35, 2, 'glow') + k.d('M55,38 L140,76', { c: 'am', dash: '3 4', op: .8 });
          return chicken(k, { fluffy: true, gear: g, noComb: true, noEye: true, headTr: HT });
        }
        g.torso = k.r(84, 78, 30, 24, 'clothD', { rx: 3 }) + k.c(93, 88, 3.2, 'metalL') + k.r(100, 84, 10, 4, 'dark') + k.d('M108,78 L86,20', { w: 1.6, op: .9 }) + k.c(86, 20, 1.8, 'metalD') +
          k.sl('M146,84 L144,106', 'leather', 1.6) + k.r(136, 104, 9, 15, 'metalD', { rx: 2 }) + k.r(146, 104, 9, 15, 'metalD', { rx: 2 }) + k.c(140.5, 118, 2.6, 'glass') + k.c(150.5, 118, 2.6, 'glass');
        g.head = k.p('M155,40 C156,29 182,27 189,36 L200,41 L187,43 L156,44 Z', 'cloth') + k.c(171, 30, 1.5, 'clothD', { ns: 1 });
        return chicken(k, { fluffy: true, gear: g, noComb: true, headTr: HT });
      }
    },

    kljucac: {
      name: 'Kljucač', tr: '',
      draw(k) {
        const s = k.s, g = {};
        if (s === 'B') {
          g.torso = k.p('M142,95 C156,100 170,110 175,124 C172,140 160,152 142,158 L124,161 C116,140 120,112 142,95 Z', 'cloth') + k.e(151, 128, 6.5, 8.5, 'gold');
          g.wing = k.c(114, 126, 17, 'metal') + k.c(114, 126, 12, 'cloth2') + k.d('M114,115 L114,137 M103,126 L125,126', { col: 'gold', w: 3, op: 1 }) + k.c(114, 126, 4, 'gold');
          g.head = k.p('M155,38 C155,22 185,22 185,38 Z', 'metal') + k.p('M144,41 C150,33 190,33 196,41 C190,47 150,47 144,41 Z', 'metal') + [158, 166, 174, 182].map(x => k.c(x, 37, 1.3, 'gold', { ns: 1 })).join('');
          g.front = k.p('M107,171 L97,173 L107,175 Z', 'gold') + k.p('M132,170 L123,172 L132,174 Z', 'gold');
          return chicken(k, { gear: g, noComb: true });
        }
        if (s === 'C') {
          g.torso = k.r(94, 78, 30, 17, 'metalD', { rx: 3 }) + k.c(102, 86.5, 2, 'glow') + k.c(109, 86.5, 2, 'glow') + k.d('M116,82 L121,82 M116,86 L121,86 M116,90 L121,90') +
            k.p('M150,99 L171,106 L179,123 L172,141 L155,150 L146,124 Z', 'metal') + k.d('M150,112 L176,118 M151,135 L173,129') + k.c(163, 124, 3, 'glow');
          g.wing = k.p('M92,122 L166,111 L174,115 L96,130 Z', 'metalL') + k.d('M96,126 L170,113', { c: 'am' });
          g.head = k.p('M150,46 L153,31 L168,25 L185,29 L191,39 L188,47 L178,50 L156,50 Z', 'metal') + k.p('M174,37 L191,40 L189,45 L175,45 Z', 'glass') + k.d('M157,30 L148,10') + k.c(148, 10, 2, 'glow');
          g.front = k.c(108, 168, 3, 'metalD') + k.c(132, 168, 3, 'metalD');
          return chicken(k, { gear: g, noComb: true, noEye: true });
        }
        g.torso = k.p('M92,96 L94,82 C95,77 99,75 104,75 L124,75 C129,75 132,78 132,83 L132,97 Z', 'clothD') +
          k.p('M96,75 C96,68 130,68 130,75 C130,81 96,81 96,75 Z', 'canvas') +
          k.sl('M146,98 L110,150', 'cloth', 5) + k.sl('M84,134 Q126,154 170,134', 'cloth', 6) +
          k.e(113, 146, 4.4, 5.6, 'egg') + k.e(128, 149, 4.4, 5.6, 'egg') + k.e(143, 146, 4.4, 5.6, 'egg');
        g.head = k.p('M143,41 Q170,47 197,41 Q170,35 143,41 Z', 'metalD') + k.p('M154,40 C154,25 186,25 186,40 Z', 'metal') + k.shade('M154,40 C154,25 186,25 186,40 Z') + k.d('M157,43 Q159,62 175,63', { col: 'leather', w: 1.8, op: 1 });
        g.face = k.sl('M171,46 L157,47', 'leather', 2) + k.c(176, 46, 5.4, 'metalD') + k.c(176, 46, 3.4, 'glass');
        g.front = k.p('M184,43 L216,50.5 L184,58 Z', 'metal') + k.d('M186,50.5 L210,50.5');
        return chicken(k, { gear: g, noComb: true, noEye: true });
      }
    },

    jurisnik: {
      name: 'Jurišnik', tr: 'translate(-6,-4) scale(1.03)',
      draw(k) {
        const s = k.s, g = {};
        if (s === 'B') {
          g.torso = k.p('M142,95 C158,100 172,110 176,126 C172,142 160,154 142,160 L118,162 C110,140 116,110 142,95 Z', 'cloth2') + k.p('M126,142 L150,120 L172,136 L170,144 L150,130 L130,150 Z', 'gold');
          g.wing = k.p('M96,102 L146,102 C146,124 140,142 121,162 C102,142 96,124 96,102 Z', 'cloth') + k.e(121, 124, 7, 9, 'gold') + [[106, 110], [136, 110], [121, 148]].map(([x, y]) => k.c(x, y, 2.6, 'gold')).join('');
          g.neck = k.d('M146,80 q4,3 8,0 q4,3 8,0 q4,3 8,0 M144,90 q4,3 8,0 q4,3 8,0 q4,3 8,0', { w: 1 });
          g.head = k.p('M164,26 C158,8 172,0 186,8 C178,10 172,16 172,25 Z', 'cloth2') + k.p('M168,26 C166,12 176,6 188,12 C180,14 176,18 176,25 Z', 'gold') +
            k.p('M152,54 C150,32 160,23 173,24 C184,25 191,33 191,42 L214,51 L191,58 C189,65 181,68 169,67 C158,66 152,62 152,54 Z', 'metal') +
            k.d('M174,41 L190,43', { w: 2.6, op: 1 }) + [[196, 50], [201, 51], [196, 54]].map(([x, y]) => k.c(x, y, 1.1, 'dark', { ns: 1 })).join('') + k.c(160, 46, 2.2, 'gold');
          g.front = k.c(103, 177, 3.2, 'gold') + k.c(130, 177, 3, 'gold');
          return chicken(k, { roo: true, gear: g, noComb: true, noBeak: true, noEye: true, noWattle: true, noEar: true, mat: { neck: 'metal' } });
        }
        if (s === 'C') {
          g.torso = k.p('M148,97 L172,104 L181,122 L174,142 L156,152 L144,124 Z', 'metal') + k.c(162, 124, 4, 'glow') + k.d('M150,110 L177,116 M150,138 L174,132');
          g.wing = k.p('M134,100 L168,102 L172,118 L150,128 L128,116 Z', 'metalL') + k.d('M138,108 L166,110');
          g.head = k.p('M156,30 L176,14 L182,24 L166,32 Z', 'metalD') + k.p('M148,54 L151,31 L169,22 L189,27 L196,39 L212,50 L196,56 L188,63 L160,64 Z', 'metal') + k.p('M171,35 L196,40 L198,46 L173,46 Z', 'glass');
          g.front = k.p('M96,84 L180,66 L182,75 L99,94 Z', 'metalD') + k.p('M178,61 L189,59 L191,77 L181,79 Z', 'metal') + k.c(124, 82, 2.2, 'glow') + k.c(138, 79, 2.2, 'glow') + k.c(152, 76, 2.2, 'glow') +
            k.p('M103,160 L113,160 L110,177 L101,177 Z', 'metal') + k.p('M127,160 L136,160 L136,176 L128,176 Z', 'metalD');
          return chicken(k, { roo: true, gear: g, noComb: true, noBeak: true, noEye: true, noWattle: true, noEar: true });
        }
        g.torso = k.p('M150,97 C164,99 176,106 181,116 L172,120 C166,111 158,106 147,104 Z', 'metal') +
          k.p('M147,106 C160,108 172,116 176,128 L167,132 C161,122 153,116 144,114 Z', 'metal') +
          k.p('M144,116 C156,119 166,128 169,140 L160,143 C155,133 148,127 141,125 Z', 'metal') +
          k.sl('M150,96 L102,152', 'leather', 7) +
          [[140, 108], [130, 120], [120, 132], [110, 144]].map(([x, y]) => k.e(x, y, 4, 5.2, 'egg', { tr: `rotate(-40 ${x} ${y})` })).join('');
        g.head = k.p('M145,42 Q170,47 199,43 Q170,37 145,42 Z', 'blueD') + k.p('M155,40 C155,26 187,26 187,40 Z', 'blue') + k.shade('M155,40 C155,26 187,26 187,40 Z') +
          k.p('M158,33 C164,20 178,20 184,33 L181,34 C176,26 166,26 161,34 Z', 'blue') + k.d('M158,44 Q160,60 176,62', { col: 'leather', w: 1.8, op: 1 });
        g.front = k.p('M106,172 L89,175 L106,178 Z', 'metal') + k.p('M131,171 L116,174 L131,177 Z', 'metalD');
        return chicken(k, { roo: true, gear: g, noComb: true });
      }
    },

    zaprega: {
      name: 'Zaprega', tr: '',
      draw(k) {
        const s = k.s;
        let o = '';
        if (s === 'C') {
          o += [52, 112, 172].map(x => k.p(`M${x - 11},134 L${x + 11},134 L${x + 6},170 L${x - 6},170 Z`, 'beam')).join('');
          o += k.p('M18,96 C18,74 36,64 64,64 L176,64 C204,64 220,80 220,98 C220,116 204,126 176,126 L64,126 C36,126 18,116 18,96 Z', 'metal');
          o += k.d('M40,78 L160,78 M40,112 L160,112 M70,64 L70,126 M110,64 L110,126 M150,64 L150,126');
          o += k.p('M168,68 C190,68 208,80 212,94 L168,94 Z', 'glass') + k.c(186, 82, 5.5, 'metalL') + k.p('M190.5,80 L198,82 L190.5,84.5 Z', 'beak');
          o += k.t(78, 100, 'NOSIVOST 25.000', { size: 7.5, ls: .8 }) + k.t(78, 92, 'Z-2', { size: 7, c: 'am' });
          o += [52, 112, 172].map(x => k.e(x, 131, 13, 4, 'metalD') + k.e(x, 131, 6, 2, 'glow')).join('');
          return o;
        }
        const hen = (tr) => `<g transform="${tr}">${chicken(k, { gear: { torso: k.sl('M150,100 C160,110 170,122 172,132', 'leather', 3) } })}</g>`;
        let w = '';
        if (s === 'B') {
          w += k.p('M14,92 L140,92 L136,134 L20,134 Z', 'wood') + k.d('M16,106 L139,106 M18,120 L137,120 M50,92 L50,134 M90,92 L90,134');
          w += k.p('M18,94 C18,44 136,44 136,94 Z', 'canvas') + k.d('M42,94 C42,62 52,52 60,50 M77,94 L77,48 M112,94 C112,62 102,52 94,50', { w: 1.2 });
          w += k.sl('M26,94 L26,24', 'woodD', 2.6) + k.p('M27,26 L60,33 L27,42 Z', 'cloth2') + k.p('M27,30 L46,33 L27,37 Z', 'gold');
          w += k.p('M68,98 L86,98 L86,110 C86,117 77,121 77,121 C77,121 68,117 68,110 Z', 'cloth') + k.e(77, 108, 3, 4, 'gold');
        } else {
          w += k.p('M14,90 L140,90 L136,134 L20,134 Z', 'wood') + k.shade('M14,90 L140,90 L136,134 L20,134 Z') + k.d('M16,104 L139,104 M18,119 L137,119');
          w += k.r(28, 95, 40, 34, 'metal') + k.r(82, 95, 44, 34, 'metal') + rivets(k, 31, 98, 65, 98, 5, 1.2) + rivets(k, 85, 98, 123, 98, 5, 1.2) + rivets(k, 31, 126, 65, 126, 5, 1.2) + rivets(k, 85, 126, 123, 126, 5, 1.2);
          w += k.t(104, 117, '117/6', { size: 11, anchor: 'middle' });
          w += k.p('M20,90 C24,62 58,54 80,56 C104,54 128,62 134,90 Z', 'canvas') + k.shade('M20,90 C24,62 58,54 80,56 C104,54 128,62 134,90 Z') +
            k.d('M40,90 C44,70 52,62 60,58 M80,90 L80,56 M118,90 C114,72 106,62 98,58', { w: 1.4 });
          w += k.r(118, 66, 16, 22, 'clothD', { rx: 2 }) + k.d('M122,66 L130,66');
        }
        w += wheel(k, 44, 150, 22) + wheel(k, 112, 150, 22);
        o += k.sl('M114,140 L180,152', 'woodD', 3) + k.sl('M114,146 L168,162', 'woodD', 3);
        o += `<g transform="translate(-2,31) scale(.9)">${w}</g>`;
        o += hen('translate(112,104.2) scale(.44)') + hen('translate(136,100.4) scale(.46)');
        return o;
      }
    },

    tvrdjava: {
      name: 'Tvrđava na kokošjim nogama', tr: '',
      draw(k) {
        const s = k.s;
        const leg = (far) => {
          const T = far ? 'translate(50,-4) rotate(-14 118 96)' : '';
          let o = '';
          const thigh = 'M98,96 C92,114 100,136 118,144 C130,147 138,138 136,126 C132,110 124,100 114,94 Z';
          const shank = 'M117,138 L131,143 L112,182 L101,179 Z';
          const toes = 'M106,180 L142,186 M106,180 L134,193 M106,180 L121,196 M106,180 L86,184';
          if (s === 'A') {
            o += k.sl(toes, far ? 'metalD' : 'metal', 5) + k.p(shank, 'metalD') + k.sl('M124,142 L108,180', 'metalL', 3) +
              k.p(thigh, far ? 'metalD' : 'metal') + k.shade(thigh) + rivets(k, 102, 104, 126, 140, 5, 1.6) + k.c(124, 140, 5, 'metalD');
          } else if (s === 'B') {
            o += k.sl(toes, far ? 'legD' : 'leg', 6) + k.p(shank, far ? 'legD' : 'leg') + k.d('M112,152 l12,4 M109,160 l12,4 M106,168 l12,4') +
              k.p(thigh, far ? '#b8a47a' : 'plumD') + k.d('M104,112 q6,5 12,0 q6,5 12,0 M104,124 q6,5 12,0 q6,5 12,0 M110,136 q6,4 12,0');
            o += [[142, 186], [134, 193], [121, 196], [86, 184]].map(([x, y]) => k.c(x, y, 2.4, 'dark', { ns: 1 })).join('');
          } else if (s === 'C') {
            o += k.sl(toes, 'metal', 3) + k.d('M118,140 L104,180 M126,142 L112,181', { w: 1.6 }) + k.p('M100,98 L120,92 L138,126 L122,146 Z', 'metal') +
              k.c(124, 140, 4.5, 'metalD') + k.c(124, 140, 1.8, 'glow') + k.c(106, 180, 3, 'glow');
          } else {
            o += k.sl(toes, 'x', 5) + k.p(shank, 'x') + k.p(thigh, 'x');
          }
          return T ? `<g transform="${T}">${o}</g>` : o;
        };
        let top = '';
        if (s === 'B') {
          top += k.p('M62,50 L186,50 L182,104 L66,104 Z', 'wood') + k.d('M64,61 L185,61 M65,72 L184,72 M65,83 L183,83 M66,94 L182,94');
          top += [56, 67, 78, 89, 100].map(y => k.c(64, y, 4, 'woodD') + k.c(184, y, 4, 'woodD')).join('');
          top += k.p('M56,52 L192,52 L192,34 L180,34 L180,41 L168,41 L168,34 L156,34 L156,41 L144,41 L144,34 L132,34 L132,41 L120,41 L120,34 L108,34 L108,41 L96,41 L96,34 L84,34 L84,41 L72,41 L72,34 L56,34 Z', 'stone') + k.d('M56,46 L192,46 M90,46 L90,52 M124,46 L124,52 M158,46 L158,52');
          top += k.r(150, 18, 26, 16, 'stone') + k.p('M146,20 L163,2 L180,20 Z', 'roof');
          top += k.sl('M62,34 L62,6', 'woodD', 2) + k.p('M63,7 L92,12 L63,19 Z', 'cloth2') + k.p('M63,10 L80,12 L63,15 Z', 'gold');
          top += k.p('M84,82 L84,70 C84,63 97,63 97,70 L97,82 Z', 'glow') + k.p('M151,82 L151,70 C151,63 164,63 164,70 L164,82 Z', 'glow');
          top += k.p('M113,62 L135,62 L135,77 C135,86 124,90 124,90 C124,90 113,86 113,77 Z', 'cloth2') + k.e(124, 74, 4, 5.5, 'gold');
        } else if (s === 'C') {
          top += k.p('M50,88 C50,44 90,22 124,22 C158,22 198,44 198,88 L188,104 L60,104 Z', 'metal');
          top += k.p('M66,64 C90,56 158,56 182,64 L180,72 C156,66 92,66 68,72 Z', 'glass');
          top += k.c(186, 82, 6, 'glow') + k.d('M110,24 L104,4 M124,22 L124,2 M138,24 L146,6') + k.c(104, 4, 1.6, 'glow') + k.c(124, 2, 1.6, 'glow') + k.c(146, 6, 1.6, 'glow');
          top += k.d('M60,90 L188,90 M80,104 L84,90 M168,104 L164,90') + k.t(96, 84, 'T-01', { size: 8, ls: 1.5, c: 'am' });
        } else {
          top += k.p('M46,32 L124,6 L202,32 Z', 'roof') + k.d('M70,24 L70,32 M90,17 L90,32 M110,10 L110,32 M130,8 L130,32 M150,13 L150,32 M170,20 L170,32 M190,27 L190,32');
          top += k.r(160, 8, 12, 18, 'metalD') + smoke(k, [[160, 6, 5], [150, 4, 4]]);
          top += k.p('M54,30 L194,30 L200,100 L48,100 Z', 'metal') + k.shade('M54,30 L194,30 L200,100 L48,100 Z');
          top += rivets(k, 60, 36, 188, 36, 12, 1.5) + rivets(k, 56, 94, 192, 94, 13, 1.5);
          top += k.r(70, 52, 20, 11, 'dark') + k.r(150, 52, 20, 11, 'dark') + k.p('M198,57 L229,53 L229,62 L199,66 Z', 'metalD');
          top += k.r(98, 41, 52, 6, 'glow') + k.r(112, 66, 24, 34, 'metalD') + k.c(131, 84, 1.6, 'metalL');
          top += k.t(80, 88, 'Nº1', { size: 12 }) + k.t(160, 88, '117/6', { size: 10 });
          top += k.sl('M48,70 L40,70 L40,76', 'metalD', 1.6) + k.c(40, 80, 4, 'glow');
        }
        return leg(true) + top + leg(false);
      }
    }
  };

  /* ---------------- buildings ---------------- */
  const BUILD = {
    kokosinjac: {
      name: 'Kokošinjac',
      draw(k) {
        const s = k.s;
        let o = '';
        if (s === 'C') {
          o += k.p('M196,118 L232,104 L236,116 L200,130 Z', 'glass') + k.d('M208,113 L212,126 M220,108 L224,121 M198,124 L234,110') + k.d('M216,123 L216,152');
          o += k.p('M40,150 C40,92 78,58 120,58 C162,58 200,92 200,150 Z', 'metal');
          o += k.d('M120,58 L120,150 M120,58 C100,74 88,108 86,150 M120,58 C140,74 152,108 154,150 M120,58 C84,68 62,104 60,150 M120,58 C156,68 178,104 180,150 M47,118 Q120,104 193,118 M60,90 Q120,78 180,90');
          o += k.p('M107,150 L107,128 C107,116 133,116 133,128 L133,150 Z', 'glass');
          o += k.d('M150,64 L164,22') + k.c(164, 22, 2.6, 'glow') + k.r(62, 124, 22, 10, 'glass', { rx: 2 }) + k.r(156, 124, 22, 10, 'glass', { rx: 2 });
          o += k.t(120, 104, '117/6', { size: 9, anchor: 'middle', ls: 1 });
          return o;
        }
        if (s === 'B') {
          o += k.r(26, 58, 32, 86, 'stone') + k.d('M26,74 L58,74 M26,90 L58,90 M26,106 L58,106 M26,122 L58,122 M42,58 L42,74 M34,74 L34,90 M50,90 L50,106 M38,106 L38,122') + k.p('M36,92 L36,84 C36,79 48,79 48,84 L48,92 Z', 'glow');
          o += k.p('M20,60 L42,16 L64,60 Z', 'roofD') + k.sl('M42,16 L42,4', 'woodD', 1.6) + k.p('M43,4 L62,8 L43,12 Z', 'cloth2');
          o += k.r(58, 126, 140, 18, 'stone') + k.d('M58,135 L198,135 M78,126 L78,135 M108,126 L108,135 M138,126 L138,135 M168,126 L168,135 M93,135 L93,144 M123,135 L123,144 M153,135 L153,144 M183,135 L183,144');
          o += k.r(60, 80, 136, 46, 'paint');
          o += k.sl('M62,82 L62,124 M100,82 L100,124 M150,82 L150,124 M194,82 L194,124 M62,103 L194,103', 'woodD', 3.4) + k.sl('M64,122 L98,84 M152,122 L192,84', 'woodD', 2.6);
          o += k.p('M50,84 L72,42 L180,42 L206,84 Z', 'roof') + k.d('M58,72 L198,72 M64,60 L192,60 M68,50 L186,50');
          o += k.p('M112,126 L112,108 C112,97 136,97 136,108 L136,126 Z', 'woodD') + k.c(131, 115, 1.6, 'gold');
          o += k.c(172, 94, 9, 'glass') + k.d('M163,94 L181,94 M172,85 L172,103');
          o += k.r(72, 88, 20, 13, 'glass') + k.d('M82,88 L82,101');
          o += k.p('M115,82 L133,82 L133,90 C133,95 124,98 124,98 C124,98 115,95 115,90 Z', 'cloth') + k.e(124, 89, 2.4, 3, 'gold');
          return o;
        }
        o += [56, 112, 178].map(x => k.r(x, 138, 6, 22, 'woodD')).join('');
        o += k.r(46, 74, 148, 66, 'wood') + k.shade(rect(46, 74, 148, 66)) + k.d(range(83, 131, 9).map(y => `M46,${y} L194,${y}`).join(' '));
        o += k.r(162, 26, 8, 22, 'metalD') + k.r(159, 23, 14, 4, 'metalD') + smoke(k, [[170, 16, 5], [178, 9, 6], [190, 4, 6]]);
        o += k.p('M36,80 L58,44 L182,44 L204,80 Z', 'roof') + k.d(range(66, 176, 9).map(x => `M${x},46 L${x},79`).join(' '), { w: 1 });
        o += k.r(62, 96, 26, 44, 'woodD') + k.d('M66,101 L84,101 M66,135 L84,135') + k.c(83, 118, 1.4, 'metalL');
        o += k.r(130, 88, 8, 26, 'woodD') + k.r(170, 88, 8, 26, 'woodD') + k.r(138, 90, 32, 22, 'glow') + k.d('M154,90 L154,112 M138,101 L170,101', { w: 2, op: .9 });
        o += k.t(98, 130, '117/6', { size: 13 });
        o += k.p('M150,140 L200,160 L192,162 L144,142 Z', 'wood') + k.d('M158,144 L156,148 M168,148 L166,152 M178,152 L176,156 M188,156 L186,160');
        o += sandbags(k, 18, 154, 6) + sandbags(k, 26, 145, 5);
        o += wire(k, 206, 150, 232);
        return o;
      }
    },

    vetrenjaca: {
      name: 'Vetrenjača',
      draw(k) {
        const s = k.s;
        let o = '';
        if (s === 'C') {
          o += k.p('M114,160 L117.5,76 L122.5,76 L126,160 Z', 'metal');
          o += k.r(136, 136, 48, 24, 'metalD', { rx: 3 }) + [0, 1, 2, 3].map(i => k.r(142 + i * 10, 142, 6, 12, i < 3 ? 'glow' : 'metal')).join('');
          o += k.p('M106,70 L140,70 C145,70 147,74 147,76 C147,78 145,82 140,82 L106,82 Z', 'metalD');
          o += [-90, 30, 150].map(a => `<g transform="translate(106,76) rotate(${a})">${k.p('M0,-2.6 C18,-5 42,-3 62,0 C42,2.6 18,3.6 0,2.6 Z', 'metal')}</g>`).join('');
          o += k.c(106, 76, 5, 'metal') + k.c(106, 76, 2, 'glow') + k.d('M70,76 a36,36 0 1,0 72,0 a36,36 0 1,0 -72,0', { dash: '2 6', op: .5 });
          o += k.t(154, 130, 'SNAGA +142', { size: 7.5, ls: .6, c: 'am' });
          return o;
        }
        if (s === 'B') {
          o += k.p('M88,160 L100,66 L140,66 L152,160 Z', 'stone') + k.d('M97,90 L143,90 M94,114 L146,114 M91,138 L149,138 M112,66 L110,90 M128,90 L130,114 M108,114 L106,138 M134,138 L136,160');
          o += k.p('M110,160 L110,142 C110,134 130,134 130,142 L130,160 Z', 'woodD') + k.p('M114,104 L114,96 C114,92 126,92 126,96 L126,104 Z', 'glow');
          o += k.p('M94,68 L120,42 L146,68 Z', 'roof');
          const sail = a => `<g transform="rotate(${a} 120 62)">${k.r(118, 8, 4, 54, 'woodD')}${k.r(122, 12, 14, 44, 'canvas')}${k.d('M122,23 L136,23 M122,34 L136,34 M122,45 L136,45 M129,12 L129,56', { w: 1 })}</g>`;
          o += [20, 110, 200, 290].map(sail).join('') + k.c(120, 62, 5, 'gold');
          return o;
        }
        o += k.r(156, 128, 44, 32, 'wood') + k.d('M167,128 L167,160 M178,128 L178,160 M189,128 L189,160') + k.p('M150,130 L178,114 L206,130 Z', 'roof') + k.r(164, 138, 12, 10, 'glow');
        o += k.sl('M224,160 L224,104', 'woodD', 3) + k.sl('M216,108 L232,108', 'woodD', 2) + k.d('M200,122 Q212,118 222,108', { w: 1 });
        o += k.sl('M90,160 L114,56', 'metalD', 3.2) + k.sl('M150,160 L126,56', 'metalD', 3.2);
        o += k.d('M97,130 L143,130 M102,106 L138,106 M108,80 L132,80 M97,130 L138,106 M143,130 L102,106 M102,106 L132,80 M138,106 L108,80', { w: 1.4, op: .9 });
        o += k.r(108, 52, 24, 5, 'metalD');
        o += k.sl('M120,44 L66,40', 'metalD', 2.4) + k.p('M38,26 L70,32 L70,50 L38,54 Z', 'paint') + k.t(54, 46, 'Š-3', { size: 10, anchor: 'middle', m: 'accent' });
        let bl = '';
        for (let i = 0; i < 18; i++) {
          const a = i * 20 * Math.PI / 180, d1 = 4 * Math.PI / 180, d2 = 7 * Math.PI / 180;
          const P = (r, t) => `${(120 + Math.cos(t) * r).toFixed(1)},${(44 + Math.sin(t) * r).toFixed(1)}`;
          bl += k.p(`M${P(8, a - d1)} L${P(31, a - d2)} L${P(31, a + d2)} L${P(8, a + d1)} Z`, 'metal', { sw: 1.2 });
        }
        o += bl + k.d('M89,44 a31,31 0 1,0 62,0 a31,31 0 1,0 -62,0', { w: 1.6, op: .9 }) + k.c(120, 44, 6, 'metal') + k.c(120, 44, 2, 'dark');
        return o;
      }
    },

    zitnica: {
      name: 'Žitnica',
      draw(k) {
        const s = k.s;
        let o = '';
        if (s === 'C') {
          o += k.r(70, 152, 100, 8, 'metalD') + k.d('M70,156 L30,156 L30,136 M170,156 L210,156 L210,140');
          o += k.d('M80,30 L80,152 M160,30 L160,152');
          for (let i = 0; i < 4; i++) {
            const y = 36 + i * 29;
            o += k.r(84, y, 72, 25, 'glassL', { rx: 7 }) + k.d(`M92,${y + 8} L148,${y + 8} M92,${y + 16} L148,${y + 16}`, { c: 'am', op: .9 });
          }
          o += k.p('M84,36 C84,20 156,20 156,36 Z', 'metal') + k.d('M120,22 L120,8') + k.c(120, 8, 2, 'glow');
          o += k.r(176, 52, 16, 5, 'metal', { rx: 2 }) + k.e(174, 50, 6, 1.6, 'metalL') + k.e(194, 50, 6, 1.6, 'metalL') + k.c(184, 60, 1.6, 'glow');
          o += k.t(34, 130, 'ZRNO +4.812/h', { size: 7.5, ls: .5, c: 'am' });
          return o;
        }
        if (s === 'B') {
          o += [66, 102, 138, 174].map(x => k.r(x - 4, 140, 8, 20, 'stone') + k.e(x, 140, 11, 4.5, 'stone')).join('');
          o += k.r(52, 92, 136, 46, 'wood') + k.d(range(62, 182, 12).map(x => `M${x},92 L${x},138`).join(' '), { w: 1 }) + k.r(108, 102, 24, 36, 'woodD') + k.c(127, 120, 1.6, 'gold');
          let th = '';
          for (let r = 0; r < 5; r++) {
            const y = 86 - r * 10;
            for (let x = 46 + r * 10; x < 194 - r * 10; x += 9) th += `M${x},${y} l4,-9 `;
          }
          o += k.p('M38,96 C58,56 90,40 120,38 C150,40 182,56 202,96 Z', 'straw') + k.d(th, { w: 1 });
          o += k.r(112, 138, 16, 6, 'woodD') + k.r(114, 144, 12, 6, 'woodD');
          o += k.p('M206,160 L212,124 L218,160 Z', 'straw') + k.p('M216,160 L222,128 L228,160 Z', 'straw') + k.sl('M206,146 L228,146', 'cloth2', 2);
          return o;
        }
        o += [24, 40].map(x => k.p(`M${x - 10},160 C${x - 14},146 ${x - 8},136 ${x},136 C${x + 8},136 ${x + 12},146 ${x + 10},160 Z`, 'canvas') + k.d(`M${x - 4},140 L${x + 4},140`)).join('');
        o += k.r(58, 58, 58, 102, 'metal') + k.shade(rect(58, 58, 58, 102)) + k.d(range(70, 150, 13).map(y => `M58,${y} L116,${y}`).join(' ')) + k.d('M64,60 L64,158 M71,60 L71,158 ' + range(66, 154, 8).map(y => `M64,${y} L71,${y}`).join(' '), { w: .9 });
        o += k.p('M54,60 L87,28 L120,60 Z', 'roof');
        o += k.r(124, 88, 36, 72, 'metal') + k.shade(rect(124, 88, 36, 72)) + k.d(range(100, 152, 13).map(y => `M124,${y} L160,${y}`).join(' ')) + k.p('M120,90 L142,68 L164,90 Z', 'roof');
        o += k.r(170, 24, 10, 136, 'metalD') + k.r(164, 14, 22, 14, 'metalD') + k.sl('M166,24 L102,40', 'metalD', 4);
        o += k.t(87, 116, 'ZRNO', { size: 13, anchor: 'middle' });
        return o;
      }
    },

    inkubator: {
      name: 'Inkubator',
      draw(k) {
        const s = k.s;
        let o = '';
        if (s === 'C') {
          o += k.r(36, 146, 168, 14, 'metalD', { rx: 3 }) + k.d('M48,153 L66,153 M174,153 L192,153');
          o += k.e(120, 112, 34, 40, 'glow', { op: .12 });
          o += k.p('M100,146 L106,136 L134,136 L140,146 Z', 'metal');
          o += k.e(120, 108, 20, 27, 'egg') + k.d('M120,108 m-34,0 a34,7 0 1,0 68,0 a34,7 0 1,0 -68,0', { c: 'am', op: .8 }) + k.d('M120,96 m-28,0 a28,5 0 1,0 56,0 a28,5 0 1,0 -56,0', { c: 'am', op: .5 });
          o += k.p('M48,146 C48,94 82,64 120,64 C158,64 192,94 192,146 Z', 'glassL');
          o += k.d('M120,64 L120,146 M84,76 C76,96 72,120 72,146 M156,76 C164,96 168,120 168,146 M54,118 Q120,104 186,118', { op: .45 });
          o += k.d('M48,140 C30,140 24,150 20,160 M192,140 C210,140 216,150 220,160');
          o += k.t(120, 58, 'INKUBATOR · 110 JAJA/H', { size: 7, anchor: 'middle', ls: .6, c: 'am' });
          return o;
        }
        if (s === 'B') {
          o += k.p('M48,160 L48,98 L60,92 L60,160 Z', 'stoneD') + k.p('M192,160 L192,98 L180,92 L180,160 Z', 'stoneD');
          o += k.r(58, 84, 124, 76, 'stone') + k.d('M58,102 L182,102 M58,120 L182,120 M58,138 L182,138 M80,84 L80,102 M150,84 L150,102 M70,102 L70,120 M166,102 L166,120 M84,120 L84,138 M156,120 L156,138');
          o += k.p('M76,86 C76,48 164,48 164,86 Z', 'gold') + k.d('M120,49 L120,86 M98,55 C94,64 92,76 92,86 M142,55 C146,64 148,76 148,86');
          o += k.e(120, 42, 6, 8, 'gold');
          o += k.p('M106,160 L106,132 Q120,110 134,132 L134,160 Z', 'woodD') + [[110, 140], [130, 140], [110, 152], [130, 152]].map(([x, y]) => k.c(x, y, 1.4, 'gold', { ns: 1 })).join('');
          o += k.e(120, 106, 10, 13, 'glass') + k.d('M120,93 L120,119 M110,106 L130,106');
          o += k.p('M66,92 L80,92 L80,128 L73,122 L66,128 Z', 'cloth2') + k.p('M160,92 L174,92 L174,128 L167,122 L160,128 Z', 'cloth2') + k.e(73, 104, 2.6, 3.4, 'gold') + k.e(167, 104, 2.6, 3.4, 'gold');
          return o;
        }
        o += k.r(150, 30, 8, 30, 'metalD') + k.r(170, 38, 8, 24, 'metalD') + smoke(k, [[154, 24, 5], [160, 14, 6], [174, 30, 4], [182, 22, 5]]);
        o += k.p('M30,76 L120,40 L210,76 Z', 'roof') + k.d('M54,67 L186,67 M78,57 L162,57 M102,48 L138,48');
        o += k.r(40, 74, 160, 86, 'brick');
        o += [60, 108, 156].map(x => k.p(`M${x},126 L${x},100 C${x},90 ${x + 24},90 ${x + 24},100 L${x + 24},126 Z`, 'glow') + k.d(`M${x + 12},91 L${x + 12},126 M${x},108 L${x + 24},108`, { w: 1.6, op: .9 })).join('');
        o += k.r(84, 136, 72, 14, 'paint') + k.t(120, 147, 'INKUBATOR', { size: 10, anchor: 'middle', m: 'dark' });
        o += k.c(188, 140, 7, 'paint') + k.d('M188,140 L192,135', { w: 1.4, op: 1 });
        o += k.r(204, 134, 30, 26, 'wood') + [[211, 141], [219, 141], [227, 141], [211, 152], [219, 152], [227, 152]].map(([x, y]) => k.e(x, y, 3.2, 4, 'egg', { sw: 1 })).join('');
        return o;
      }
    },

    strasilo: {
      name: 'Strašilo',
      draw(k) {
        const s = k.s;
        let o = '';
        if (s === 'C') {
          o += k.e(120, 154, 64, 6, 'metalD') + k.p('M100,154 L106,144 L134,144 L140,154 Z', 'metal') + k.c(120, 142, 3, 'glow');
          o += k.p('M108,142 L36,28 L204,28 L132,142 Z', 'beam');
          const holo = 'M120,40 L120,140 M66,74 L174,74 M98,76 L142,76 L150,126 L90,126 Z M120,56 m-13,0 a13,13 0 1,0 26,0 a13,13 0 1,0 -26,0';
          o += k.d(holo, { c: 'am', dash: '4 3', op: .9 }) + k.d('M96,92 L144,92 M94,108 L146,108', { c: 'am', op: .4 });
          o += k.r(182, 108, 12, 46, 'metal') + k.r(172, 96, 30, 14, 'metalD', { rx: 3 }) + k.r(200, 100, 24, 4, 'metalL') + k.c(180, 103, 2, 'glow');
          o += k.t(150, 24, 'PROJEKCIJA 87%', { size: 7, ls: .6, c: 'am' });
          return o;
        }
        if (s === 'B') {
          o += k.p('M84,160 L92,146 L148,146 L156,160 Z', 'stone') + k.d('M92,153 L148,153 M112,146 L112,153 M128,153 L128,160');
          o += k.r(116, 36, 8, 112, 'woodD') + k.r(62, 70, 116, 7, 'woodD');
          o += k.sl('M176,88 L176,16', 'woodD', 2.6) + k.p('M177,18 L210,25 L177,38 Z', 'cloth2') + k.p('M177,23 L196,25 L177,30 Z', 'gold');
          o += k.p('M66,70 L100,70 L100,84 L68,84 Z', 'cloth2') + k.p('M140,70 L174,70 L172,84 L140,84 Z', 'cloth2');
          o += k.p('M66,72 L54,66 L58,76 L50,80 L66,82 Z', 'straw') + k.p('M174,72 L186,66 L182,76 L190,80 L174,82 Z', 'straw');
          o += k.p('M100,72 L140,72 L146,128 L94,128 Z', 'cloth') + k.e(120, 98, 7, 9, 'gold') + k.p('M100,128 L96,138 L104,132 L110,140 L114,130 L122,140 L126,130 L134,140 L138,132 L146,138 L142,128 Z', 'straw');
          o += k.p('M106,40 C104,30 136,30 134,40 L134,64 C130,70 110,70 106,64 Z', 'canvas') + k.d('M112,50 l5,0 M123,50 l5,0 M112,58 q8,5 16,0 M114,56 l0,4 M120,57 l0,4 M126,56 l0,4');
          o += k.p('M104,40 L136,40 L131,24 L109,24 Z', 'metal') + k.d('M110,32 L130,32');
          return o;
        }
        o += sandbags(k, 84, 154, 5) + sandbags(k, 92, 145, 4);
        o += k.p('M128,52 L238,30 L238,84 L128,58 Z', 'beam');
        o += k.r(116, 40, 8, 106, 'woodD') + k.r(62, 70, 116, 7, 'woodD');
        o += k.p('M66,70 L102,70 L102,86 L72,88 Z', 'cloth') + k.p('M138,70 L174,70 L168,88 L138,86 Z', 'cloth');
        o += k.p('M98,72 L142,72 L152,130 L140,126 L134,134 L126,124 L118,134 L110,124 L100,132 L88,128 Z', 'cloth') + k.shade('M98,72 L142,72 L152,130 L140,126 L134,134 L126,124 L118,134 L110,124 L100,132 L88,128 Z') + k.sl('M100,100 L140,100', 'leather', 4);
        o += k.d('M70,77 L70,92 M168,77 L168,92', { w: 1 }) + k.r(66, 92, 8, 10, 'metal') + k.r(164, 92, 8, 10, 'metal');
        o += k.p('M104,38 L136,38 L132,68 L108,68 Z', 'metal') + k.shade('M104,38 L136,38 L132,68 L108,68 Z') + k.r(101, 34, 38, 5, 'metalD') + k.d('M106,36 C106,22 134,22 134,36', { w: 1.6 });
        o += k.c(127, 54, 6.5, 'metalD') + k.c(127, 54, 4, 'glow');
        o += k.t(112, 66, '7', { size: 8, m: 'paint' });
        return o;
      }
    }
  };

  /* ---------------- backdrops & wrappers ---------------- */
  function unitBack(k, h) {
    const gy = h - 14;
    if (k.s === 'A') return `<ellipse cx="120" cy="${gy}" rx="74" ry="6" fill="${PAL.A.shadow}"/>` + k.d(`M8,${gy + 1} C80,${gy - 2} 160,${gy - 2} 232,${gy + 1}`, { w: 1.3, op: .55 }) +
      k.d(`M30,${gy} l3,-6 l2,6 M196,${gy} l3,-7 l3,7 M212,${gy} l2,-5 l2,5`, { w: 1, op: .6 });
    if (k.s === 'B') return `<path d="M36,${h - 4} L36,74 C36,34 74,12 120,12 C166,12 204,34 204,74 L204,${h - 4}" fill="none" stroke="${PAL.B.gold}" stroke-width="1.4" opacity=".7"/>` +
      `<path d="M42,${h - 4} L42,76 C42,40 78,19 120,19 C162,19 198,40 198,76 L198,${h - 4}" fill="none" stroke="${PAL.B.gold}" stroke-width=".7" opacity=".6"/>` +
      `<path d="M14,${h} C60,${gy - 6} 180,${gy - 6} 226,${h} Z" fill="${PAL.B.grass}" stroke="${PAL.B.ink}" stroke-width="2"/>`;
    if (k.s === 'C') {
      let t = '';
      for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; t += `M${(120 + Math.cos(a) * 88).toFixed(1)},${(gy + Math.sin(a) * 9).toFixed(1)} L${(120 + Math.cos(a) * 94).toFixed(1)},${(gy + Math.sin(a) * 9.6).toFixed(1)} `; }
      return `<g fill="none" stroke="${CC.cy}">` +
        `<ellipse cx="120" cy="${gy}" rx="88" ry="9" stroke-opacity=".45"/><ellipse cx="120" cy="${gy}" rx="60" ry="6" stroke-opacity=".3"/><ellipse cx="120" cy="${gy}" rx="30" ry="3" stroke-opacity=".25"/>` +
        `<path d="${t}" stroke-opacity=".5"/><path d="M228,22 L228,${gy} M224,22 L232,22 M224,${gy} L232,${gy}" stroke-opacity=".45"/></g>`;
    }
    return '';
  }

  function unitSVG(id, s, o) {
    o = o || {};
    const U = UNITS[id];
    const k = ctx(s, o);
    const h = 200;
    const art = U.tr ? `<g transform="${U.tr}">${U.draw(k)}</g>` : U.draw(k);
    const cls = o.cls ? ` class="${o.cls}"` : '';
    return `<svg viewBox="0 0 240 ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${U.name}"${cls}>` +
      (o.bare ? '' : unitBack(k, h)) + (s === 'C' ? `<g filter="url(#cGlow)">${art}</g>` : art) + '</svg>';
  }

  function bldBack(k) {
    if (k.s === 'A') return `<ellipse cx="120" cy="161" rx="104" ry="5" fill="${PAL.A.shadow}"/>` + k.d('M4,161 C80,158 160,158 236,161', { w: 1.3, op: .55 });
    if (k.s === 'B') return `<path d="M0,172 C40,154 200,154 240,172 L240,180 L0,180 Z" fill="${PAL.B.grass}" stroke="${PAL.B.ink}" stroke-width="2"/>`;
    if (k.s === 'C') return `<g fill="none" stroke="${CC.cy}"><ellipse cx="120" cy="161" rx="108" ry="10" stroke-opacity=".4"/><ellipse cx="120" cy="161" rx="70" ry="6" stroke-opacity=".25"/><path d="M12,161 L228,161" stroke-opacity=".2"/></g>`;
    return '';
  }

  function buildingSVG(id, s, o) {
    o = o || {};
    const B = BUILD[id];
    const k = ctx(s, o);
    const art = B.draw(k);
    const cls = o.cls ? ` class="${o.cls}"` : '';
    return `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${B.name}"${cls}>` +
      (o.bare ? '' : bldBack(k)) + (s === 'C' ? `<g filter="url(#cGlow)">${art}</g>` : art) + '</svg>';
  }

  /* ---------------- breeds (portraits) ---------------- */
  const BREEDS = {
    leghorn: { A: { plum: '#ddd3bc', plumD: '#b9ad92' }, B: { plum: '#fbf4e2', plumD: '#e3d6b6' }, C: {} },
    rodajlend: { A: { plum: '#8c4d2e', plumD: '#5e321e' }, B: { plum: '#a51d27', plumD: '#7d151c' }, C: {} },
    brahma: { A: { plum: '#d9cfb6', plumD: '#a99e86', neck: '#3b3a34' }, B: { plum: '#fbf4e2', plumD: '#d5c39a', neck: '#2b2e33' }, C: {} },
    australorp: { A: { plum: '#2f322c', plumD: '#22251f' }, B: { plum: '#2b2e33', plumD: '#1b1d20' }, C: {} },
    orpington: { A: { plum: '#c39a55', plumD: '#97743c' }, B: { plum: '#dba631', plumD: '#b9861f' }, C: {} },
    sussex: { A: { plum: '#ddd3bc', plumD: '#b9ad92', neck: '#4b4a42' }, B: { plum: '#fbf4e2', plumD: '#e3d6b6', neck: '#2b2e33' }, C: {} },
    svilenka: { A: { plum: '#e8e0cc', plumD: '#c8bea6' }, B: { plum: '#fbf4e2', plumD: '#e3d6b6' }, C: {}, crest: true },
    kaporka: { A: { plum: '#2c2e29', plumD: '#1f211d', crest: '#e7e0cc' }, B: { plum: '#2b2e33', plumD: '#1b1d20', crest: '#fbf4e2' }, C: {}, crest: true },
    golosijan: { A: { plum: '#6e4a30', plumD: '#4e3322', neck: '#a84a3a' }, B: { plum: '#6c4523', plumD: '#4e3119', neck: '#b3202a' }, C: {} },
    svrljiska: { A: { plum: '#3b3d39', plumD: '#2a2c28' }, B: { plum: '#2b2e33', plumD: '#1b1d20' }, C: {} }
  };

  function portraitSVG(breed, s, o) {
    o = o || {};
    const k = ctx(s, o);
    const b = BREEDS[breed] || BREEDS.leghorn;
    const mat = Object.assign({}, b[s] || {});
    const roo = breed === 'rodajlend' || breed === 'golosijan';
    let inner = chicken(k, { roo, mat, crest: !!b.crest, noLegs: true });
    inner = s === 'C' ? `<g filter="url(#cGlow)">${inner}</g>` : inner;
    return `<svg viewBox="112 4 104 104" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${breed}"${o.cls ? ` class="${o.cls}"` : ''}>${inner}</svg>`;
  }

  /* ---------------- scenes ---------------- */
  function sceneSVG(s, o) {
    o = o || {};
    const W = 720, H = 300;
    const k = ctx(s, o);
    let bg = '';
    if (s === 'A') {
      bg = `<rect width="${W}" height="${H}" fill="url(#aSky)"/>` +
        `<path d="M0,214 C120,190 220,204 330,196 C450,186 560,206 720,190 L720,${H} L0,${H} Z" fill="#8d8160" opacity=".55"/>` +
        `<path d="M0,246 C140,236 300,240 420,238 C560,234 640,240 720,236 L720,${H} L0,${H} Z" fill="#6b5e44" opacity=".75"/>` +
        `<path d="M0,262 L720,262" stroke="#1c1912" stroke-width="1.2" opacity=".4"/>`;
    } else if (s === 'B') {
      bg = `<rect width="${W}" height="${H}" fill="#e9dcbc"/>` +
        `<path d="M0,200 C110,170 210,186 320,176 C440,164 560,188 720,170 L720,${H} L0,${H} Z" fill="#6e9a52" stroke="#15100c" stroke-width="2"/>` +
        `<path d="M0,244 C150,228 310,236 430,232 C560,228 650,236 720,232 L720,${H} L0,${H} Z" fill="#4d7b3a" stroke="#15100c" stroke-width="2"/>` +
        `<path d="M60,60 q20,-18 44,-6 q16,-14 34,0 q18,2 14,14 L56,68 Z M520,50 q20,-18 44,-6 q16,-14 34,0 q18,2 14,14 L516,58 Z" fill="#fbf4e2" stroke="#15100c" stroke-width="1.6"/>`;
    } else {
      let grid = '';
      for (let i = -12; i <= 12; i++) grid += `M${360 + i * 30},250 L${360 + i * 60},300 `;
      bg = `<rect width="${W}" height="${H}" fill="#06101d"/>` +
        `<g fill="none" stroke="${CC.cy}"><ellipse cx="360" cy="252" rx="330" ry="34" stroke-opacity=".4"/><ellipse cx="360" cy="252" rx="250" ry="25" stroke-opacity=".25"/><ellipse cx="360" cy="252" rx="160" ry="16" stroke-opacity=".2"/>` +
        `<path d="${grid}" stroke-opacity=".12"/><path d="M30,252 L690,252" stroke-opacity=".25"/></g>`;
    }
    const place = (svgInner, tr) => `<g transform="${tr}">${svgInner}</g>`;
    const bd = id => BUILD[id].draw(k);
    let mid = '';
    mid += place(bd('zitnica'), 'translate(8,108) scale(.8)');
    mid += place(bd('vetrenjaca'), 'translate(540,62) scale(1.1)');
    mid += place(bd('inkubator'), 'translate(392,124) scale(.72)');
    mid += place(bd('kokosinjac'), 'translate(170,58) scale(1.22)');
    mid += place(bd('strasilo'), 'translate(470,150) scale(.62)');
    if (s === 'C') mid = `<g filter="url(#cGlow)">${mid}</g>`;
    let lab = '';
    if (s === 'C') {
      const L = (x, y, x2, y2, t1, t2) => `<g><path d="M${x},${y} L${x2},${y2} L${x2 + 70},${y2}" fill="none" stroke="${CC.cy}" stroke-opacity=".6"/><circle cx="${x}" cy="${y}" r="2.5" fill="${CC.am}"/>` +
        `<text x="${x2 + 2}" y="${y2 - 5}" font-family="'JetBrains Mono',monospace" font-size="10" fill="${CC.cy}" letter-spacing=".8">${t1}</text><text x="${x2 + 2}" y="${y2 + 11}" font-family="'JetBrains Mono',monospace" font-size="9" fill="${CC.am}">${t2}</text></g>`;
      lab = L(60, 150, 30, 60, 'ŽITNICA', 'NIV 24 · +4.812/h') + L(330, 110, 300, 36, 'KOKOŠINJAC', 'NIV 14 · 148/192 POLJA') + L(470, 200, 448, 120, 'INKUBATOR', 'NIV 8') + L(660, 120, 610, 40, 'VETRENJAČA', 'NIV 22');
    }
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kokošinjac Suncokreti 117/6" preserveAspectRatio="xMidYMid ${o.fit || 'slice'}"${o.cls ? ` class="${o.cls}"` : ''}>${bg}${mid}${lab}</svg>`;
  }

  /* ---------------- hero key art ---------------- */
  function heroSVG() {
    const W = 1200, H = 470;
    let o = `<defs><linearGradient id="hSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101824"/><stop offset=".45" stop-color="#2c2a3c"/><stop offset=".72" stop-color="#8a4a36"/><stop offset=".9" stop-color="#d98a43"/><stop offset="1" stop-color="#efb05a"/></linearGradient>` +
      `<radialGradient id="hSun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".95"/><stop offset=".35" stop-color="#ffb04e" stop-opacity=".55"/><stop offset="1" stop-color="#ff9a3d" stop-opacity="0"/></radialGradient></defs>`;
    o += `<rect width="${W}" height="${H}" fill="url(#hSky)"/>`;
    let st = '';
    const rnd = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
    for (let i = 0; i < 70; i++) st += `<circle cx="${(rnd(i) * W).toFixed(0)}" cy="${(rnd(i + 99) * 170).toFixed(0)}" r="${(rnd(i + 7) * 1.1 + .3).toFixed(2)}" fill="#f4e9d0" opacity="${(rnd(i + 3) * .6 + .2).toFixed(2)}"/>`;
    o += st;
    o += `<circle cx="820" cy="350" r="190" fill="url(#hSun)"/><circle cx="820" cy="350" r="52" fill="#ffd27a" opacity=".9"/>`;
    o += `<path d="M0,318 C120,288 230,300 360,286 C520,268 640,300 780,284 C930,268 1060,292 1200,276 L1200,${H} L0,${H} Z" fill="#4c3540" opacity=".85"/>`;
    const far = ctx('S', { sil: '#3a2833', lit: '#ffc766' });
    o += `<g transform="translate(70,240) scale(.42)">${BUILD.kokosinjac.draw(far)}</g><g transform="translate(176,232) scale(.4)">${BUILD.zitnica.draw(far)}</g><g transform="translate(960,214) scale(.5)">${BUILD.vetrenjaca.draw(far)}</g><g transform="translate(1060,244) scale(.36)">${BUILD.kokosinjac.draw(far)}</g>`;
    o += `<path d="M0,352 C160,330 300,344 470,334 C640,322 760,348 940,336 C1060,328 1130,340 1200,334 L1200,${H} L0,${H} Z" fill="#241a22"/>`;
    const mid = ctx('S', { sil: '#1a1319', lit: '#ffcf6f' });
    o += `<g transform="translate(560,118) scale(1.18)">${UNITS.tvrdjava.draw(mid)}</g>`;
    o += `<g opacity=".8">${smoke(mid, [[757, 120, 9], [742, 104, 12], [722, 86, 15], [696, 70, 18]])}</g>`;
    o += `<g transform="translate(330,250) scale(.5)">${BUILD.inkubator.draw(mid)}</g>`;
    o += `<path d="M0,402 C200,386 380,396 560,390 C760,384 940,398 1200,388 L1200,${H} L0,${H} Z" fill="#0d0a0e"/>`;
    let fence = '';
    for (let x = 14; x < 1200; x += 46) fence += `M${x},${398 - Math.sin(x / 140) * 4} l0,-30 `;
    o += `<path d="${fence}" stroke="#0d0a0e" stroke-width="5" fill="none"/><path d="M0,378 C300,372 700,376 1200,372 M0,388 C300,382 700,386 1200,382" stroke="#0d0a0e" stroke-width="2.4" fill="none"/>`;
    const near = ctx('S', { sil: '#0d0a0e', lit: '#ffcf6f' });
    for (let i = 0; i < 9; i++) {
      const x = 120 + i * 56, y = 330 + Math.sin(i * .9) * 3;
      o += `<g transform="translate(${x},${y}) scale(.36)">${UNITS.kljucac.draw(near)}</g>`;
    }
    o += `<g transform="translate(1000,232) scale(1.02)">${BUILD.strasilo.draw(near)}</g>`;
    o += `<g transform="translate(560,316) scale(.5)">${UNITS.jurisnik.draw(near)}</g>`;
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Odred Kljucača maršira u sumrak pored Tvrđave na kokošjim nogama">${o}</svg>`;
  }

  const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>` +
    `<linearGradient id="aShade" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" stop-color="#1a1209" stop-opacity="0"/><stop offset="1" stop-color="#1a1209" stop-opacity=".42"/></linearGradient>` +
    `<linearGradient id="aSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfc2a0"/><stop offset=".7" stop-color="#e2d6b6"/><stop offset="1" stop-color="#d8cba8"/></linearGradient>` +
    `<pattern id="aBrick" width="16" height="8" patternUnits="userSpaceOnUse"><rect width="16" height="8" fill="#8a4f37"/><path d="M0,.5 H16 M0,4.5 H16 M4,.5 V4.5 M12,4.5 V8.5" stroke="#3e2418" stroke-width=".8" opacity=".75"/></pattern>` +
    `<filter id="cGlow" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur stdDeviation="1.3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
    `</defs></svg>`;

  const ICON = {
    zrno: '<path d="M12 21V8"/><path d="M12 8c-2.6-.6-4-2.6-4-5 2.6 0 4 1.8 4 4 0-2.2 1.4-4 4-4 0 2.4-1.4 4.4-4 5z"/><path d="M12 14c-2.6-.6-4-2.4-4-4.6 2.6 0 4 1.6 4 3.4 0-1.8 1.4-3.4 4-3.4 0 2.2-1.4 4-4 4.6z"/>',
    krec: '<path d="M4 9l8-5 8 5v7l-8 5-8-5z"/><path d="M4 9l8 5 8-5M12 14v7"/>',
    ulje: '<path d="M12 3c3 5 6 8 6 12a6 6 0 0 1-12 0c0-4 3-7 6-12z"/>',
    snaga: '<path d="M13 2L5 13h6l-1 9 8-12h-6z"/>',
    jaja: '<path d="M12 3c4 0 7 6 7 11a7 7 0 0 1-14 0c0-5 3-11 7-11z"/>',
    perje: '<path d="M20 4C11 4 6 10 6 18"/><path d="M6 18c7 0 13-5 14-14"/><path d="M4 20l2-2M9 14h4M11 11h4"/>',
    pregled: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
    zgrade: '<path d="M14 4l6 6-3 3-6-6z"/><path d="M11 7L4 14l3 3 7-7"/><path d="M4 20h9"/>',
    istrazivanja: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 15h9"/>',
    inkubator: '<path d="M12 6c3 0 5 4 5 7.5a5 5 0 0 1-10 0C7 10 9 6 12 6z"/><path d="M6 3l1.5 2M18 3l-1.5 2M12 2v2"/><path d="M4 21h16"/>',
    odbrana: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    odred: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    komsiluk: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
    jato: '<path d="M3 14c3-4 6-4 9 0 3-4 6-4 9 0"/><path d="M6 9c2-2.6 4-2.6 6 0 2-2.6 4-2.6 6 0"/>',
    poruke: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7l9 6 9-6"/>',
    rang: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
    novcanik: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12h5v3h-5a1.5 1.5 0 0 1 0-3z"/><path d="M5 6l10-3 1 3"/>',
    upozorenje: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
    sat: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    strelica: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    uhodi: '<circle cx="12" cy="12" r="3"/><path d="M2 12c3-5 6-7 10-7s7 2 10 7c-3 5-6 7-10 7s-7-2-10-7z"/>',
    napad: '<path d="M14 4l6 0 0 6-9 9-3-3 9-9"/><path d="M4 20l4-4M6 14l4 4"/>',
    transport: '<rect x="2" y="7" width="13" height="10" rx="1"/><path d="M15 10h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    poruka: '<path d="M4 5h16v11H9l-5 4z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>'
  };
  function icon(name, cls) {
    return `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] || ''}</svg>`;
  }

  global.ART = { unit: unitSVG, building: buildingSVG, portrait: portraitSVG, scene: sceneSVG, hero: heroSVG, icon, DEFS, UNITS, BUILD, BREEDS };
})(window);
