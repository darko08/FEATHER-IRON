/* Feather & Iron prototype: game data and simulation (original rules and numbers) */
(function (global) {
  'use strict';

  /* ---------- helpers ---------- */
  const fmt = (n) => Math.floor(n).toLocaleString('en-US');
  const pad = (n) => String(n).padStart(2, '0');
  function dur(sec) {
    sec = Math.max(0, Math.ceil(sec));
    const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    if (d) return `${d}d ${h}h ${pad(m)}m`;
    if (h) return `${h}h ${pad(m)}m ${pad(s)}s`;
    if (m) return `${m}m ${pad(s)}s`;
    return `${s}s`;
  }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- world ---------- */
  const HOODS = ['Old Estate', 'Cornfield', 'Sunflower', 'Watermill', 'Vineyard', 'Pasture', 'Brickworks', 'Apiary', 'Orchard', 'Haybarn', 'Millpond', 'Clover Hill'];
  const STREETS = 500;
  const PLOT = [null,
    { z: 'Roadside', f: [44, 72], t: [28, 34] }, { z: 'Roadside', f: [52, 84], t: [26, 32] }, { z: 'Roadside', f: [70, 110], t: [24, 30] },
    { z: 'Meadow', f: [150, 210], t: [18, 24] }, { z: 'Meadow', f: [172, 238], t: [16, 22] }, { z: 'Meadow', f: [165, 226], t: [16, 22] },
    { z: 'Gardens', f: [148, 204], t: [14, 20] }, { z: 'Gardens', f: [140, 196], t: [12, 18] }, { z: 'Gardens', f: [132, 186], t: [12, 18] },
    { z: 'Creek', f: [118, 166], t: [8, 14] }, { z: 'Creek', f: [110, 156], t: [6, 12] }, { z: 'Creek', f: [102, 148], t: [6, 12] },
    { z: 'Grove', f: [90, 132], t: [2, 8] }, { z: 'Grove', f: [80, 120], t: [0, 6] }, { z: 'Grove', f: [70, 110], t: [-2, 4] }];
  const ZONE = {
    Roadside: { img: 'z_roadside', note: 'Small and hot. The Oil Press runs best here.' },
    Meadow: { img: 'z_meadow', note: 'The most fields on the street. Best for a long game.' },
    Gardens: { img: 'z_gardens', note: 'Large plots in a mild climate.' },
    Creek: { img: 'z_creek', note: 'Medium plots, cool and damp. Oil runs slower.' },
    Grove: { img: 'z_grove', note: 'Small, cold plots by the trees. Oil struggles.' }
  };
  const oilHeat = (t) => 1 + 0.015 * (t - 15);
  const addrStr = (a) => a.wilds ? 'the Wilds' : `${HOODS[a.n]} ${a.s}/${a.p}`;

  /* ---------- buildings ---------- */
  const B = {
    field: { name: 'Grain Field', img: 'b_field', g: 45, r: 12, o: 0, f: 1.55, grp: 'Production', desc: 'Grows Grain, the bulk material for everything.' },
    pit: { name: 'Grit Pit', img: 'b_pit', g: 36, r: 22, o: 0, f: 1.6, grp: 'Production', desc: 'Digs Grit for research, armor and heavy units.' },
    press: { name: 'Oil Press', img: 'b_press', g: 160, r: 60, o: 0, f: 1.55, grp: 'Production', desc: 'Presses sunflower Oil, the fuel for every trip. Hot plots press more.' },
    windmill: { name: 'Windmill', img: 'b_windmill', g: 60, r: 20, o: 0, f: 1.55, grp: 'Production', desc: 'Makes the Power that runs the three producers.' },
    furnace: { name: 'Compost Furnace', img: 'b_furnace', g: 700, r: 300, o: 150, f: 1.8, grp: 'Production', req: { henhouse: 5, press: 5 }, desc: 'Burns Oil to make extra Power.' },
    granary: { name: 'Granary', img: 'b_granary', g: 800, r: 0, o: 0, f: 2, grp: 'Storage', desc: 'Raises how much Grain the coop can hold.' },
    bin: { name: 'Grit Bin', img: 'b_bin', g: 800, r: 400, o: 0, f: 2, grp: 'Storage', desc: 'Raises how much Grit the coop can hold.' },
    tank: { name: 'Oil Tank', img: 'b_tank', g: 800, r: 800, o: 0, f: 2, grp: 'Storage', desc: 'Raises how much Oil the coop can hold.' },
    henhouse: { name: 'Henhouse', img: 'b_henhouse', g: 300, r: 100, o: 50, f: 2, grp: 'Facilities', desc: 'The main building. Each level speeds up construction.' },
    workshop: { name: 'Workshop', img: 'b_workshop', g: 350, r: 180, o: 80, f: 2, grp: 'Facilities', req: { henhouse: 2 }, desc: 'Speeds up hatching with resources.' },
    hatchery: { name: 'Hatchery', img: 'b_hatchery', g: 300, r: 150, o: 60, f: 2, grp: 'Facilities', req: { henhouse: 2 }, desc: 'Hatches units and defenses. Its level sets how many eggs it handles per hour.' },
    academy: { name: 'Academy', img: 'b_academy', g: 180, r: 300, o: 150, f: 2, grp: 'Facilities', req: { henhouse: 1 }, desc: 'Runs research. Each level speeds it up.' },
    fence: { name: 'Fence Extension', img: 'b_fence', g: 20000, r: 40000, o: 20000, f: 2, grp: 'Facilities', req: { henhouse: 8, academy: 6 }, desc: 'Adds 4 build fields per level.' },
    tower: { name: 'Watchtower', img: 'b_tower', g: 2000, r: 4000, o: 1000, f: 2, grp: 'Facilities', req: { henhouse: 4 }, desc: 'Spots hostile flocks earlier: 30 minutes plus 30 per level.' },
    depot: { name: 'Feeder Depot', img: 'b_depot', g: 15000, r: 15000, o: 0, f: 2, grp: 'Facilities', req: { henhouse: 6 }, desc: 'Feeds allied flocks guarding your coop. Alliances are not in this prototype.' }
  };
  const bCost = (id, lvl) => { const d = B[id], m = Math.pow(d.f, lvl - 1); return { g: Math.floor(d.g * m), r: Math.floor(d.r * m), o: Math.floor(d.o * m) }; };

  /* ---------- research ---------- */
  const R = {
    stride: { name: 'Long Stride', icon: 'odred', g: 400, r: 0, o: 600, f: 2, req: { academy: 1 }, eff: '+10% speed for light units per level' },
    logistics: { name: 'Logistics', icon: 'strelica', g: 0, r: 400, o: 600, f: 2, req: { academy: 1 }, eff: '+1 flock in the field per level' },
    shell: { name: 'Shell Plating', icon: 'odbrana', g: 1000, r: 300, o: 0, f: 2, req: { academy: 2 }, eff: '+5% health per level' },
    pack: { name: 'Pack Training', icon: 'transport', g: 2000, r: 4000, o: 600, f: 2, req: { academy: 2 }, eff: '+10% speed and +5% cargo for pack units per level' },
    scouting: { name: 'Scouting', icon: 'uhodi', g: 200, r: 1000, o: 200, f: 2, req: { academy: 3 }, eff: 'Reports show defenses from level 2, flocks from 4, buildings from 6' },
    carto: { name: 'Cartography', icon: 'komsiluk', g: 4000, r: 8000, o: 4000, f: 1.75, req: { academy: 3 }, eff: 'One more coop every 2 levels' },
    agro: { name: 'Agronomy', icon: 'zrno', g: 1000, r: 2000, o: 1000, f: 2, req: { academy: 3 }, eff: '+2% production per level' },
    beak: { name: 'Beak Sharpening', icon: 'napad', g: 800, r: 200, o: 0, f: 2, req: { academy: 4 }, eff: '+5% attack per level' },
    genetics: { name: 'Egg Genetics', icon: 'jaja', g: 1500, r: 3000, o: 1500, f: 2, req: { academy: 4, hatchery: 4 }, eff: '+3% units per egg per level' },
    down: { name: 'Down Padding', icon: 'perje', g: 200, r: 600, o: 0, f: 2, req: { academy: 6 }, max: 10, eff: '+2% armor per level, up to +20%' },
    heavy: { name: 'Heavy March', icon: 'zgrade', g: 10000, r: 20000, o: 6000, f: 2, req: { academy: 7 }, eff: '+10% speed for heavy units per level' }
  };
  const rCost = (id, lvl) => { const d = R[id], m = Math.pow(d.f, lvl - 1); return { g: Math.floor(d.g * m), r: Math.floor(d.r * m), o: Math.floor(d.o * m) }; };

  /* ---------- units and defenses ---------- */
  const U = {
    pecker: { name: 'Pecker', img: 'u_pecker', role: 'Line hen, cheap and many', g: 150, r: 50, o: 0, atk: 8, arm: 0, hp: 40, spd: 30, cargo: 20, oilr: 2, cls: 'light', req: { hatchery: 1 }, frenzy: { scout: 5 } },
    packhen: { name: 'Pack Hen', img: 'u_packhen', role: 'Small transport', g: 150, r: 120, o: 0, atk: 1, arm: 0, hp: 60, spd: 24, cargo: 400, oilr: 2, cls: 'pack', req: { hatchery: 2 } },
    scout: { name: 'Scout', img: 'u_scout', role: 'Fast spy', g: 0, r: 100, o: 10, atk: 0, arm: 0, hp: 20, spd: 120, cargo: 5, oilr: 1, cls: 'light', req: { hatchery: 3, scouting: 1 } },
    spurguard: { name: 'Spurguard', img: 'u_spurguard', role: 'Heavy hen in mail and spurs', g: 400, r: 200, o: 0, atk: 20, arm: 15, hp: 110, spd: 26, cargo: 30, oilr: 5, cls: 'light', req: { hatchery: 4, shell: 2 } },
    packbrahma: { name: 'Pack Brahma', img: 'u_pack', role: 'Large transport', g: 450, r: 400, o: 0, atk: 1, arm: 5, hp: 180, spd: 20, cargo: 2000, oilr: 6, cls: 'pack', req: { hatchery: 4, pack: 2 } },
    gleaner: { name: 'Gleaner', img: 'u_gleaner', role: 'Gathers feather fields', g: 800, r: 500, o: 200, atk: 1, arm: 0, hp: 300, spd: 9, cargo: 1600, oilr: 15, cls: 'pack', req: { hatchery: 4, pack: 2, shell: 2 } },
    settler: { name: 'Settler Hen', img: 'u_settler', role: 'Claims a free plot', g: 800, r: 1500, o: 800, atk: 2, arm: 0, hp: 400, spd: 10, cargo: 500, oilr: 50, cls: 'pack', req: { hatchery: 4, pack: 3, carto: 1 } },
    vanguard: { name: 'Vanguard', img: 'u_vanguard', role: 'Rooster shock trooper', g: 1200, r: 500, o: 150, atk: 60, arm: 20, hp: 280, spd: 40, cargo: 120, oilr: 18, cls: 'light', req: { hatchery: 5, beak: 2 } },
    ironhen: { name: 'Ironhen', img: 'u_ironhen', role: 'Brahma in full plate', g: 3000, r: 1400, o: 0, atk: 110, arm: 35, hp: 720, spd: 22, cargo: 200, oilr: 30, cls: 'heavy', req: { hatchery: 7, shell: 5, heavy: 2 } },
    mortar: { name: 'Egg Mortar', img: 'u_mortar', role: 'Breaks defenses', g: 3600, r: 2000, o: 1200, atk: 240, arm: 10, hp: 480, spd: 14, cargo: 40, oilr: 55, cls: 'heavy', req: { hatchery: 8, beak: 5, heavy: 3 }, frenzy: { slinger: 3, cannon: 3, wire: 3 } },
    breacher: { name: 'Breacher', img: 'u_breacher', role: 'Breaks domes and towers', g: 5000, r: 4000, o: 1500, atk: 400, arm: 30, hp: 1100, spd: 12, cargo: 150, oilr: 75, cls: 'heavy', req: { hatchery: 9, beak: 6, heavy: 5 }, frenzy: { sdome: 4, ldome: 4, scarecrow: 4 } },
    brahma: { name: 'War Brahma', img: 'u_titan', role: 'Giant hen with a war tower', g: 300000, r: 250000, o: 80000, atk: 9000, arm: 55, hp: 60000, spd: 3, cargo: 50000, oilr: 5, cls: 'heavy', req: { hatchery: 12, heavy: 7, genetics: 5 }, frenzy: { pecker: 6, spurguard: 6, packhen: 6 } }
  };
  const D = {
    wattle: { name: 'Wattle Fence', img: 'd_wattle', g: 100, r: 0, o: 0, atk: 2, arm: 20, hp: 100, req: { hatchery: 1 }, note: 'Cheap wall that soaks hits' },
    wire: { name: 'Barbed Wire', img: 'd_wire', g: 160, r: 40, o: 0, atk: 6, arm: 0, hp: 90, req: { hatchery: 2 }, note: 'Hurts light units' },
    slinger: { name: 'Slinger Nest', img: 'd_slinger', g: 250, r: 80, o: 0, atk: 14, arm: 10, hp: 120, req: { hatchery: 2 }, note: 'The basic shooter' },
    cannon: { name: 'Corn Cannon', img: 'd_cannon', g: 900, r: 400, o: 100, atk: 70, arm: 20, hp: 450, req: { hatchery: 4, beak: 3 }, note: 'Strong against heavy hens' },
    scarecrow: { name: 'Scarecrow Tower', img: 'd_scarecrow', g: 4000, r: 2500, o: 600, atk: 300, arm: 30, hp: 2200, req: { hatchery: 6, beak: 6, shell: 4 }, note: 'The heavy tower' },
    sdome: { name: 'Small Shell Dome', img: 'd_dome', g: 2000, r: 2000, o: 0, atk: 0, arm: 0, hp: 12000, soak: 4000, max: 1, req: { hatchery: 1, down: 2 }, note: 'Soaks 4,000 damage a round' },
    ldome: { name: 'Large Shell Dome', img: 'd_dome', g: 10000, r: 10000, o: 0, atk: 0, arm: 0, hp: 60000, soak: 20000, max: 1, req: { hatchery: 6, down: 6 }, note: 'Soaks 20,000 damage a round' }
  };
  const eggsOf = (d) => Math.ceil((d.g + 2 * d.r + 4 * d.o) / 200);
  const valueOf = (d) => d.g + d.r + d.o;

  /* ---------- names for neighbors ---------- */
  const N1 = ['Dusty', 'Gravel', 'Black', 'Red', 'Little', 'Old', 'Iron', 'Mossy', 'Speckled', 'Barley', 'Copper', 'Muddy', 'Grey', 'Proud', 'Lucky', 'Stubborn', 'Rusty', 'Clover', 'Sergeant', 'Captain'];
  const N2 = ['Hen', 'Queen', 'Rooster', 'Comb', 'Clucker', 'Spur', 'Beak', 'Feather', 'Wattle', 'Brood', 'Crest', 'Pullet', 'Biddy', 'Scratch', 'Plume'];
  const COOPN = ['Dusty Corner', 'Road Watch', 'Meadow Hall', 'Golden Meadow', "Gardener's House", 'Cherry Shade', 'By the Creek', 'Reed Bank', 'Grove House', 'Last Fence', 'Sunny Rest', 'Stone Ford', 'Pine Coop', 'Old Barn', 'Hay Loft', 'Mill Yard', 'Plank Fort', 'Sandbag Hill'];
  const TAGS = ['BEAK', 'FENCE', 'GRAIN', 'MOSS', 'SPUR', 'YOLK', 'COMB', 'RUST'];

  /* ---------- state ---------- */
  let S = null;
  const listeners = [];
  const emit = (type, data) => listeners.forEach(fn => fn(type, data));

  function makeCoop(name, addr, home, seed) {
    const P = PLOT[addr.p], r = rng(seed || hash('coop:' + addrStr(addr)));
    const fields = home ? 175 : P.f[0] + Math.floor(r() * (P.f[1] - P.f[0] + 1));
    const temp = Math.round(P.t[0] + r() * (P.t[1] - P.t[0]));
    const b = {}; Object.keys(B).forEach(k => b[k] = 0);
    if (home) { b.henhouse = 1; b.hatchery = 3; }
    return { id: 'c' + Math.floor(r() * 1e9), name, addr: { n: addr.n, s: addr.s, p: addr.p }, zone: P.z, fields, temp, res: { g: home ? 600 : 0, r: home ? 400 : 0, o: home ? 100 : 0 }, b, units: {}, defs: {}, bq: null, hq: [] };
  }

  function newGame(ticket) {
    const home = makeCoop('Home Coop', { n: 2, s: 117, p: 6 }, true, 12345);
    const research = {}; Object.keys(R).forEach(k => research[k] = 0);
    S = {
      v: 1, t: 0, speed: 60, ticket, eggs: 1000, ledger: [{ t: 0, txt: `Ticket Chikn ${ticket} entered World 1`, d: 1000 }],
      research, rq: null, coops: [home], cur: 0, flocks: [], threats: [], msgs: [], npc: {}, feathers: {}, seq: 1,
      shieldUntil: 7 * 86400, spent: 0, hourMark: 0, scoutLog: {}, stats: {}, savedAt: Date.now()
    };
    addMsg('info', 'Welcome to the Estate', `<p>Your Chikn <b>${ticket}</b> holds a seat in World 1. Your home coop stands on <b>Sunflower 117/6</b>, a Meadow plot with 175 build fields.</p><p>1,000 eggs are in your wallet. Everything you hatch from eggs passes through the Hatchery, which handles ${capEggs(3)} eggs an hour at level 3.</p><p>Your fledgling shield keeps other players away for 7 days, or until you raid someone.</p>`);
    return S;
  }

  const cur = () => S.coops[S.cur];
  const capEggs = (L) => L > 0 ? Math.round(6 * Math.pow(L, 1.4)) : 0;
  const storeCap = (L) => Math.floor(10000 * Math.pow(1.55, L));
  const maxCoops = () => 1 + Math.ceil(S.research.carto / 2);
  const maxFlocks = () => 2 + S.research.logistics;
  const fieldsUsed = (c) => Object.values(c.b).reduce((a, b) => a + b, 0);
  const fieldsTotal = (c) => c.fields + 4 * c.b.fence;

  function prod(c) {
    const b = c.b, agro = 1 + 0.02 * S.research.agro;
    const pUse = 8 * b.field * Math.pow(1.12, b.field) + 9 * b.pit * Math.pow(1.12, b.pit) + 13 * b.press * Math.pow(1.12, b.press);
    const furnaceOn = b.furnace > 0 && c.res.o > 1;
    const pMake = 14 * b.windmill * Math.pow(1.12, b.windmill) + (furnaceOn ? 30 * b.furnace * Math.pow(1.06, b.furnace) : 0);
    const pf = pUse > 0 ? Math.min(1, pMake / pUse) : 1;
    return {
      g: 20 + 15 * b.field * Math.pow(1.14, b.field) * pf * agro,
      r: 10 + 9 * b.pit * Math.pow(1.14, b.pit) * pf * agro,
      o: 5 * b.press * Math.pow(1.14, b.press) * oilHeat(c.temp) * pf * agro - (furnaceOn ? 6 * b.furnace * Math.pow(1.1, b.furnace) : 0),
      pMake, pUse, pf
    };
  }
  const caps = (c) => ({ g: storeCap(c.b.granary), r: storeCap(c.b.bin), o: storeCap(c.b.tank) });

  function reqMet(req, c) {
    const miss = [];
    if (!req) return miss;
    for (const k in req) {
      const have = B[k] ? c.b[k] : S.research[k];
      if (have < req[k]) miss.push({ k, need: req[k], have, name: B[k] ? B[k].name : R[k].name });
    }
    return miss;
  }
  const canPay = (c, cost) => c.res.g >= cost.g && c.res.r >= cost.r && c.res.o >= cost.o;
  function pay(c, cost) { c.res.g -= cost.g; c.res.r -= cost.r; c.res.o -= cost.o; S.spent += cost.g + cost.r + cost.o; }

  /* ---------- actions ---------- */
  function build(id) {
    const c = cur(); const lvl = c.b[id] + 1, cost = bCost(id, lvl);
    if (c.bq) return 'The builders are busy. Wait for the current job or speed it up.';
    if (reqMet(B[id].req, c).length) return 'Requirements are not met yet.';
    if (id !== 'fence' && fieldsUsed(c) >= fieldsTotal(c)) return 'No free build fields. Build a Fence Extension.';
    if (!canPay(c, cost)) return 'Not enough resources.';
    pay(c, cost);
    const secs = Math.max(5, (cost.g + cost.r) / (1800 * (1 + c.b.henhouse)) * 3600);
    c.bq = { id, lvl, start: S.t, end: S.t + secs };
    return null;
  }
  function research(id) {
    const c = cur(); const lvl = S.research[id] + 1, cost = rCost(id, lvl);
    if (S.rq) return 'The Academy is already researching.';
    if (R[id].max && S.research[id] >= R[id].max) return 'Already at the top level.';
    if (reqMet(R[id].req, c).length) return 'Requirements are not met yet.';
    if (!canPay(c, cost)) return 'Not enough resources.';
    pay(c, cost);
    const secs = Math.max(5, (cost.g + cost.r) / (1000 * (1 + c.b.academy)) * 3600);
    S.rq = { id, lvl, start: S.t, end: S.t + secs, coop: S.cur };
    return null;
  }
  function hatch(kind, id, n, src) {
    const c = cur(), def = kind === 'u' ? U[id] : D[id];
    n = Math.floor(n);
    if (!(n > 0)) return 'Enter how many to hatch.';
    if (reqMet(def.req, c).length) return 'Requirements are not met yet.';
    if (def.max) {
      const have = (c.defs[id] || 0) + c.hq.filter(o => o.id === id).reduce((a, o) => a + o.n, 0);
      if (have + n > def.max) return 'Only one per coop.';
    }
    if (src === 'egg') {
      if (c.b.hatchery < 1) return 'Build a Hatchery first.';
      const eggs = eggsOf(def) * n;
      if (S.eggs < eggs) return `You need ${fmt(eggs)} eggs and have ${fmt(S.eggs)}.`;
      const bonus = kind === 'u' ? 1 + 0.03 * S.research.genetics : 1;
      const got = Math.floor(n * bonus);
      S.eggs -= eggs; S.spent += eggs * 200;
      S.ledger.unshift({ t: S.t, txt: `Hatched ${def.name} ×${fmt(got)}`, d: -eggs });
      S.stats = S.stats || {}; S.stats['egg_' + id] = (S.stats['egg_' + id] || 0) + got;
      c.hq.push({ kind, id, n: got, done: 0, src, dur: eggs / capEggs(c.b.hatchery) * 3600 });
    } else {
      const cost = { g: def.g * n, r: def.r * n, o: def.o * n };
      if (!canPay(c, cost)) return 'Not enough resources.';
      pay(c, cost);
      const each = Math.max(1, (def.g + def.r) / (2500 * (1 + c.b.workshop)) * 3600);
      c.hq.push({ kind, id, n, done: 0, src, dur: each * n });
    }
    return null;
  }
  function crack(eggs, into) {
    const c = cur();
    eggs = Math.floor(eggs);
    if (!(eggs > 0)) return 'Enter how many eggs to crack.';
    if (S.eggs < eggs) return 'Not enough eggs.';
    if (c.b.hatchery < 1) return 'Build a Hatchery first.';
    const per = { g: 200, r: 100, o: 50 }[into];
    S.eggs -= eggs; S.spent += eggs * 200;
    S.ledger.unshift({ t: S.t, txt: `Cracked into ${fmt(eggs * per)} ${{ g: 'Grain', r: 'Grit', o: 'Oil' }[into]}`, d: -eggs });
    c.hq.push({ kind: 'crack', id: into, n: eggs * per, done: 0, src: 'egg', dur: eggs / capEggs(c.b.hatchery) * 3600 });
    return null;
  }
  function speedCost(secLeft) { return Math.max(1, Math.ceil(secLeft / 600)); }
  function speedUp(what, coopIdx) {
    const c = S.coops[coopIdx == null ? S.cur : coopIdx];
    let left = 0, label = '';
    if (what === 'build' && c.bq) { left = c.bq.end - S.t; label = `${B[c.bq.id].name} ${c.bq.lvl}`; }
    else if (what === 'research' && S.rq) { left = S.rq.end - S.t; label = `${R[S.rq.id].name} ${S.rq.lvl}`; }
    else if (what === 'hatch' && c.hq.length) { const o = c.hq[0]; left = (o.start != null ? o.start + o.dur : S.t + o.dur) - S.t; label = o.kind === 'crack' ? 'Egg cracking' : (o.kind === 'u' ? U[o.id].name : D[o.id].name) + ' ×' + fmt(o.n); }
    else return 'Nothing to speed up.';
    const eggs = speedCost(left);
    if (S.eggs < eggs) return `You need ${eggs} eggs.`;
    S.eggs -= eggs; S.spent += eggs * 200;
    S.ledger.unshift({ t: S.t, txt: `Speed-up: ${label}`, d: -eggs });
    if (what === 'build') c.bq.end = S.t;
    else if (what === 'research') S.rq.end = S.t;
    else { const o = c.hq[0]; if (o.start == null) o.start = S.t; o.dur = S.t - o.start; }
    step(0.001);
    return null;
  }

  /* ---------- travel ---------- */
  function distance(a, b) {
    if (b.wilds) return 300;
    if (a.n !== b.n) { const d = Math.min(Math.abs(a.n - b.n), HOODS.length - Math.abs(a.n - b.n)); return 400 + 80 * d; }
    if (a.s !== b.s) return 20 + Math.abs(a.s - b.s);
    return 5 + Math.abs(a.p - b.p);
  }
  function unitSpeed(id) {
    const u = U[id];
    const bonus = u.cls === 'light' ? S.research.stride : u.cls === 'pack' ? S.research.pack : S.research.heavy;
    return u.spd * (1 + 0.1 * bonus);
  }
  function cargoOf(units) {
    let c = 0;
    for (const id in units) { const u = U[id]; c += units[id] * u.cargo * (u.cls === 'pack' ? 1 + 0.05 * S.research.pack : 1); }
    return Math.floor(c);
  }
  function planFlock(from, to, units, pct) {
    let spd = Infinity, oil = 0, count = 0;
    const dist = distance(from, to);
    for (const id in units) { if (units[id] > 0) { spd = Math.min(spd, unitSpeed(id)); oil += units[id] * U[id].oilr * dist / 100; count += units[id]; } }
    if (!count) return null;
    const v = spd * pct;
    return { dist, secs: dist / v * 3600, oil: Math.ceil(oil * (0.4 + 0.6 * pct) * 2), cargo: cargoOf(units), count };
  }

  /* ---------- neighbors ---------- */
  function ownAt(n, s, p) { return S.coops.findIndex(c => c.addr.n === n && c.addr.s === s && c.addr.p === p); }
  function npcAt(n, s, p) {
    if (ownAt(n, s, p) >= 0) return null;
    const key = `${n}-${s}-${p}`, o = S.npc[key];
    if (o && o.gone) return null;
    const r = rng(hash('w1:' + key));
    if (r() < 0.34) return null;
    const P = PLOT[p];
    const tr = r(), tier = tr < 0.36 ? 1 : tr < 0.66 ? 2 : tr < 0.86 ? 3 : tr < 0.96 ? 4 : 5;
    const sr = r(), status = sr < 0.24 ? 'i' : sr < 0.33 ? 'I' : sr < 0.38 ? 'm' : sr < 0.42 ? 'f' : '';
    const name = N1[Math.floor(r() * N1.length)] + ' ' + N2[Math.floor(r() * N2.length)];
    const coop = COOPN[Math.floor(r() * COOPN.length)];
    const tag = r() < 0.55 ? TAGS[Math.floor(r() * TAGS.length)] : '';
    const fields = P.f[0] + Math.floor(r() * (P.f[1] - P.f[0] + 1));
    const temp = Math.round(P.t[0] + r() * (P.t[1] - P.t[0]));
    const lv = [0, 5, 9, 13, 17, 21][tier] + Math.floor(r() * 3) - 1;
    const points = Math.round(Math.pow(lv, 2.7) * (0.8 + r() * 0.4));
    const pg = 20 + 15 * lv * Math.pow(1.14, lv), pr = 10 + 9 * (lv - 1) * Math.pow(1.14, lv - 1), po = 5 * (lv - 3) * Math.pow(1.14, lv - 3) * oilHeat(temp);
    const cap = storeCap(Math.max(1, Math.round(lv / 3)));
    const weak = status === 'i' || status === 'I' ? 0.35 : 1;
    const defs = {
      wattle: Math.round(tier * 10 * weak * r()), wire: Math.round(tier * 6 * weak * r()), slinger: Math.round(tier * tier * 4 * weak * (0.4 + r())),
      cannon: tier >= 2 ? Math.round(tier * 3 * weak * r()) : 0, scarecrow: tier >= 4 ? Math.round((tier - 3) * 3 * weak * r()) : 0,
      sdome: tier >= 3 && r() < 0.6 ? 1 : 0, ldome: tier >= 5 && r() < 0.5 ? 1 : 0
    };
    const units = {
      pecker: Math.round(tier * tier * 14 * weak * (0.3 + r())), spurguard: tier >= 2 ? Math.round(tier * tier * 4 * weak * r()) : 0,
      vanguard: tier >= 3 ? Math.round(tier * 3 * weak * r()) : 0, ironhen: tier >= 4 ? Math.round(tier * weak * r()) : 0,
      packbrahma: Math.round(tier * 2 * weak * r())
    };
    const npc = { key, n, s, p, name, coop, tag, tier, status, fields, temp, zone: P.z, lv, points, prod: { g: pg, r: Math.max(5, pr), o: Math.max(0, po) }, cap, defs, units };
    if (o) { if (o.defs) npc.defs = o.defs; if (o.units) npc.units = o.units; }
    return npc;
  }
  function npcRes(npc) {
    const o = S.npc[npc.key];
    const r = rng(hash('res:' + npc.key));
    const fill = npc.status === 'i' || npc.status === 'I' ? 1 : 0.25;
    const base = o && o.res ? o.res : { g: npc.cap * (0.2 + 0.5 * r()) * fill, r: npc.cap * (0.15 + 0.4 * r()) * fill, o: npc.cap * (0.05 + 0.3 * r()) * fill };
    const at = o && o.at != null ? o.at : 0;
    const h = Math.max(0, (S.t - at) / 3600), lim = npc.cap * fill;
    return { g: Math.min(lim, base.g + npc.prod.g * h), r: Math.min(lim, base.r + npc.prod.r * h), o: Math.min(lim, base.o + npc.prod.o * h) };
  }
  const featherAt = (key) => S.feathers[key] || null;

  /* ---------- combat ---------- */
  function groups(list, src, tech, isDef) {
    const out = [];
    for (const id in list) {
      const n = list[id] || 0; if (!n) continue;
      const d = isDef ? D[id] : U[id];
      out.push({ id, def: isDef, n0: n, n, atk: d.atk * (1 + 0.05 * tech.beak), arm: Math.min(80, d.arm + 2 * Math.min(10, tech.down)), hp: d.hp * (1 + 0.05 * tech.shell), soak: d.soak || 0, pool: 0, frenzy: (!isDef && U[id].frenzy) || {} });
    }
    return out;
  }
  const strength = (gs) => gs.reduce((a, g) => a + g.n * g.hp, 0);
  function volley(src, tgt) {
    const inc = new Map();
    const alive = tgt.filter(t => t.n > 0);
    const N = alive.reduce((a, t) => a + t.n, 0);
    if (!N) return inc;
    for (const s of src) {
      if (!s.n || !s.atk) continue;
      const total = s.n * s.atk;
      for (const t of alive) {
        const mult = s.frenzy[t.id] || 1;
        inc.set(t, (inc.get(t) || 0) + total * (t.n / N) * mult * (1 - t.arm / 100));
      }
    }
    // domes soak damage meant for the other defenders
    const domes = alive.filter(t => t.soak > 0);
    if (domes.length) {
      let soak = domes.reduce((a, d) => a + d.soak, 0);
      for (const [t, dmg] of inc) {
        if (t.soak) continue;
        const take = Math.min(soak, dmg);
        inc.set(t, dmg - take); soak -= take;
        const d = domes[0]; inc.set(d, (inc.get(d) || 0) + take);
        if (soak <= 0) break;
      }
    }
    return inc;
  }
  function applyDmg(inc) {
    for (const [t, dmg] of inc) {
      t.pool += dmg;
      const dead = Math.min(t.n, Math.floor(t.pool / t.hp));
      t.n -= dead; t.pool -= dead * t.hp;
      if (t.n === 0) t.pool = 0;
    }
  }
  function battle(att, def) {
    const A = groups(att.units, 'a', att.tech, false);
    const Dd = groups(def.units, 'd', def.tech, false).concat(groups(def.defs, 'd', def.tech, true));
    const a0 = strength(A) || 1, d0 = strength(Dd) || 1, rounds = [];
    for (let i = 0; i < 6; i++) {
      if (!strength(A) || !strength(Dd)) break;
      const ia = volley(A, Dd), id = volley(Dd, A);
      applyDmg(ia); applyDmg(id);
      rounds.push([Math.round(strength(A) / a0 * 100), Math.round(strength(Dd) / d0 * 100)]);
    }
    const aLeft = strength(A), dLeft = strength(Dd);
    const winner = !dLeft && aLeft ? 'att' : !aLeft ? 'def' : 'draw';
    const lostOf = (gs) => { const o = {}; gs.forEach(g => { o[g.id] = { before: g.n0, after: g.n, def: g.def }; }); return o; };
    return { winner, rounds, A: lostOf(A), D: lostOf(Dd) };
  }
  function feathersFrom(res) {
    let g = 0, r = 0;
    for (const side of [res.A, res.D]) for (const id in side) { const x = side[id]; if (x.def) continue; const lost = x.before - x.after; g += lost * U[id].g; r += lost * U[id].r; }
    return { g: Math.floor(g * 0.35), r: Math.floor(r * 0.35) };
  }
  function lootFrom(avail, cargo) {
    const take = { g: 0, r: 0, o: 0 }; let left = cargo;
    const want = { g: avail.g * 0.4, r: avail.r * 0.4, o: avail.o * 0.4 };
    for (let pass = 0; pass < 3 && left > 0; pass++) {
      const keys = ['g', 'r', 'o'].filter(k => want[k] - take[k] > 0.5);
      if (!keys.length) break;
      const share = left / keys.length;
      for (const k of keys) { const x = Math.min(share, want[k] - take[k]); take[k] += x; left -= x; }
    }
    return { g: Math.floor(take.g), r: Math.floor(take.r), o: Math.floor(take.o) };
  }
  const techOfNpc = (npc) => ({ beak: Math.max(0, npc.tier * 2 - 1), shell: Math.max(0, npc.tier * 2 - 1), down: Math.max(0, npc.tier - 1) });

  /* ---------- reports ---------- */
  function addMsg(type, title, html) {
    S.msgs.unshift({ id: 'm' + (S.seq++), t: S.t, type, title, html, read: false });
    if (S.msgs.length > 40) S.msgs.length = 40;
  }
  function unitTable(side) {
    const rows = Object.keys(side).map(id => { const x = side[id], name = x.def ? D[id].name : U[id].name, lost = x.before - x.after; return `<tr><td>${name}</td><td class="n">${fmt(x.before)}</td><td class="n">${fmt(x.after)}</td><td class="n ${lost ? 'neg' : ''}">${lost ? '−' + fmt(lost) : '0'}</td></tr>`; }).join('');
    return `<table class="tbl"><thead><tr><th>Unit</th><th>Before</th><th>After</th><th>Lost</th></tr></thead><tbody>${rows || '<tr><td colspan="4">Nothing there</td></tr>'}</tbody></table>`;
  }
  function battleHtml(res, attName, defName, loot, fe, rebuilt) {
    const word = res.winner === 'att' ? (attName === 'You' ? 'You win' : `${attName} wins`) : res.winner === 'def' ? (defName === 'You' ? 'You hold' : `${defName} holds`) : 'Draw after 6 rounds';
    return `<p class="rep-res">${word}${res.rounds.length && res.winner !== 'draw' ? ` in round ${res.rounds.length}` : ''}</p>` +
      `<div class="rep-cols"><div><h4>Attacker · ${attName}</h4>${unitTable(res.A)}</div><div><h4>Defender · ${defName}</h4>${unitTable(res.D)}</div></div>` +
      (res.rounds.length ? `<h4>Strength after each round</h4><div class="rounds">${res.rounds.map((r, i) => `<div><b>Round ${i + 1}</b><span>Attacker ${r[0]}%</span><i class="bar"><u style="width:${r[0]}%"></u></i><span>Defender ${r[1]}%</span><i class="bar d"><u style="width:${r[1]}%"></u></i></div>`).join('')}</div>` : '') +
      `<p class="rep-sum">Loot: ${fmt(loot.g)} Grain · ${fmt(loot.r)} Grit · ${fmt(loot.o)} Oil. Feather field: ${fmt(fe.g + fe.r)}.${rebuilt ? ` Defenses rebuilt: ${rebuilt}.` : ''} Eggs can't be raided.</p>`;
  }

  /* ---------- flocks ---------- */
  function sendFlock(o) {
    const c = cur();
    if (S.flocks.filter(f => !f.hostile).length >= maxFlocks()) return `All ${maxFlocks()} flock slots are in use. Research Logistics for more.`;
    const units = {}; let any = false;
    for (const id in o.units) { const n = Math.floor(o.units[id] || 0); if (n > 0) { if ((c.units[id] || 0) < n) return `Not enough ${U[id].name}s at this coop.`; units[id] = n; any = true; } }
    if (!any) return 'Pick at least one unit.';
    const to = o.mission === 'expedition' ? { wilds: true } : { n: +o.to.n, s: +o.to.s, p: +o.to.p };
    if (!to.wilds) {
      if (!(to.s >= 1 && to.s <= STREETS && to.p >= 1 && to.p <= 15)) return 'Pick a valid street (1–500) and plot (1–15).';
      if (to.n === c.addr.n && to.s === c.addr.s && to.p === c.addr.p) return 'That is this coop.';
    }
    const own = to.wilds ? -1 : ownAt(to.n, to.s, to.p), npc = to.wilds ? null : npcAt(to.n, to.s, to.p);
    const m = o.mission;
    if (m === 'raid' && !npc) return own >= 0 ? 'You can’t raid your own coop.' : 'There is no coop on that plot.';
    if (m === 'raid' && (npc.status === 'm' || npc.status === 'f')) return npc.status === 'm' ? 'That player is molting and can’t be attacked.' : 'That player still has a fledgling shield.';
    if (m === 'scout' && !units.scout) return 'Send at least one Scout.';
    if (m === 'scout' && !npc) return 'There is no coop to scout on that plot.';
    if ((m === 'transport' || m === 'station') && own < 0) return 'Transport and Station go to your own coops.';
    if (m === 'settle') { if (!units.settler) return 'Send a Settler Hen.'; if (npc || own >= 0) return 'That plot is taken.'; if (S.coops.length >= maxCoops()) return 'Research Cartography to run another coop.'; }
    if (m === 'glean') { if (!units.gleaner) return 'Send Gleaners.'; if (!featherAt(`${to.n}-${to.s}-${to.p}`)) return 'There is no feather field on that plot.'; }
    const pct = clamp(+o.pct || 1, 0.1, 1);
    const plan = planFlock(c.addr, to, units, pct);
    const cargo = { g: Math.floor(o.cargo && o.cargo.g || 0), r: Math.floor(o.cargo && o.cargo.r || 0), o: Math.floor(o.cargo && o.cargo.o || 0) };
    if (m !== 'transport' && m !== 'settle') { cargo.g = cargo.r = cargo.o = 0; }
    if (cargo.g + cargo.r + cargo.o > plan.cargo) return 'That is more than the flock can carry.';
    if (c.res.g < cargo.g || c.res.r < cargo.r || c.res.o < cargo.o + plan.oil) return `Not enough resources. The trip needs ${fmt(plan.oil)} Oil plus the cargo.`;
    c.res.g -= cargo.g; c.res.r -= cargo.r; c.res.o -= cargo.o + plan.oil;
    for (const id in units) c.units[id] -= units[id];
    S.flocks.push({ id: 'f' + (S.seq++), from: S.cur, fromAddr: { ...c.addr }, to, mission: m, units, cargo, depart: S.t, arrive: S.t + plan.secs, back: S.t + plan.secs * 2, state: 'out', secs: plan.secs });
    return null;
  }
  function recall(fid) {
    const f = S.flocks.find(x => x.id === fid);
    if (!f || f.state !== 'out' || f.hostile) return 'This flock can’t be recalled.';
    const gone = S.t - f.depart; f.state = 'back'; f.back = S.t + gone; f.recalled = true;
    return null;
  }
  function arrive(f) {
    const key = f.to.wilds ? '' : `${f.to.n}-${f.to.s}-${f.to.p}`;
    const where = addrStr(f.to);
    if (f.mission === 'raid') {
      const npc = npcAt(f.to.n, f.to.s, f.to.p);
      if (!npc || npc.status === 'm' || npc.status === 'f') { addMsg('info', `Raid called off at ${where}`, '<p>The target could not be attacked when the flock arrived. The flock turned back.</p>'); f.state = 'back'; return; }
      const res = battle({ units: f.units, tech: S.research }, { units: npc.units, defs: npc.defs, tech: techOfNpc(npc) });
      const survivors = {}; for (const id in res.A) survivors[id] = res.A[id].after;
      const dUnits = {}, dDefs = {}; let rebuilt = 0;
      for (const id in res.D) { const x = res.D[id]; if (x.def) { const lost = x.before - x.after; const back = Math.round(lost * 0.6); rebuilt += back; dDefs[id] = x.after + back; } else dUnits[id] = x.after; }
      const avail = npcRes(npc);
      const loot = res.winner === 'att' ? lootFrom(avail, cargoOf(survivors)) : { g: 0, r: 0, o: 0 };
      S.npc[key] = Object.assign(S.npc[key] || {}, { res: { g: avail.g - loot.g, r: avail.r - loot.r, o: avail.o - loot.o }, at: S.t, units: Object.assign({}, npc.units, dUnits), defs: Object.assign({}, npc.defs, dDefs) });
      const fe = feathersFrom(res);
      if (fe.g + fe.r > 0) { const old = S.feathers[key] || { g: 0, r: 0 }; S.feathers[key] = { g: old.g + fe.g, r: old.r + fe.r }; }
      S.stats = S.stats || {}; S.stats.raids = (S.stats.raids || 0) + 1;
      f.units = survivors; f.cargo = loot;
      if (S.shieldUntil > S.t) { S.shieldUntil = S.t; addMsg('info', 'Your fledgling shield is down', '<p>You raided another player, so your shield dropped. Other players can now attack your coops. Watch the telegraph.</p>'); }
      addMsg('battle', `Battle at ${where}`, battleHtml(res, 'You', npc.name, loot, fe, rebuilt));
      if (!Object.values(survivors).some(n => n > 0)) f.state = 'dead'; else f.state = 'back';
    } else if (f.mission === 'scout') {
      const npc = npcAt(f.to.n, f.to.s, f.to.p);
      if (!npc) { addMsg('scout', `Scout report: ${where}`, '<p>The plot is empty.</p>'); f.state = 'back'; return; }
      const lvl = S.research.scouting, rs = npcRes(npc);
      let html = `<p><b>${npc.coop}</b> · ${npc.name}${npc.tag ? ' [' + npc.tag + ']' : ''} · ${fmt(npc.points)} points</p><p>Grain ${fmt(rs.g)} · Grit ${fmt(rs.r)} · Oil ${fmt(rs.o)}</p>`;
      const list = (o, M) => Object.keys(o).filter(k => o[k] > 0).map(k => `${M[k].name} ${fmt(o[k])}`).join(' · ') || 'none';
      html += lvl >= 2 ? `<p><b>Defenses:</b> ${list(npc.defs, D)}</p>` : '<p class="muted">Defenses: research Scouting 2 to see them.</p>';
      html += lvl >= 4 ? `<p><b>Flocks:</b> ${list(npc.units, U)}</p>` : '<p class="muted">Flocks: research Scouting 4 to see them.</p>';
      html += lvl >= 6 ? `<p><b>Mines:</b> about level ${npc.lv}</p>` : '';
      S.scoutLog[key] = { t: S.t, g: rs.g, r: rs.r, o: rs.o };
      addMsg('scout', `Scout report: ${where}`, html);
      f.state = 'back';
    } else if (f.mission === 'transport') {
      const i = ownAt(f.to.n, f.to.s, f.to.p);
      if (i >= 0) { const c = S.coops[i]; c.res.g += f.cargo.g; c.res.r += f.cargo.r; c.res.o += f.cargo.o; addMsg('info', `Transport delivered to ${where}`, `<p>${fmt(f.cargo.g)} Grain · ${fmt(f.cargo.r)} Grit · ${fmt(f.cargo.o)} Oil</p>`); f.cargo = { g: 0, r: 0, o: 0 }; }
      f.state = 'back';
    } else if (f.mission === 'station') {
      const i = ownAt(f.to.n, f.to.s, f.to.p);
      if (i >= 0) { const c = S.coops[i]; for (const id in f.units) c.units[id] = (c.units[id] || 0) + f.units[id]; f.state = 'done'; addMsg('info', `Flock stationed at ${where}`, '<p>The units joined that coop.</p>'); }
      else f.state = 'back';
    } else if (f.mission === 'settle') {
      if (npcAt(f.to.n, f.to.s, f.to.p) || ownAt(f.to.n, f.to.s, f.to.p) >= 0 || S.coops.length >= maxCoops()) { addMsg('info', `Settling failed at ${where}`, '<p>The plot was taken or you have no free coop slot. The flock turned back.</p>'); f.state = 'back'; return; }
      const z = PLOT[f.to.p].z, nc = makeCoop(`${z} Outpost`, f.to, false, hash('settle:' + key + S.t));
      nc.res = { g: f.cargo.g, r: f.cargo.r, o: f.cargo.o };
      f.units.settler -= 1;
      for (const id in f.units) if (f.units[id] > 0) nc.units[id] = f.units[id];
      S.coops.push(nc); f.state = 'done';
      addMsg('info', `New coop at ${where}`, `<p>Your Settler Hen claimed a ${z} plot with <b>${nc.fields}</b> build fields at ${nc.temp} °C. Switch to it from the coop menu.</p>`);
    } else if (f.mission === 'glean') {
      const fe = S.feathers[key];
      const cap = cargoOf(f.units);
      if (fe) { const tot = fe.g + fe.r, take = Math.min(cap, tot), g = Math.floor(take * fe.g / tot), r = take - g; f.cargo = { g, r, o: 0 }; fe.g -= g; fe.r -= r; if (fe.g + fe.r < 1) delete S.feathers[key]; addMsg('info', `Gleaned at ${where}`, `<p>Your Gleaners picked up ${fmt(g)} Grain and ${fmt(r)} Grit worth of feathers.</p>`); }
      f.state = 'back';
    } else if (f.mission === 'expedition') {
      const r = Math.random(), size = Object.values(f.units).reduce((a, b) => a + b, 0), cap = cargoOf(f.units);
      let html;
      if (r < 0.35) { const amt = Math.min(cap, Math.floor(3000 + size * 220 * (0.5 + Math.random()))); f.cargo = { g: Math.floor(amt * 0.5), r: Math.floor(amt * 0.35), o: Math.floor(amt * 0.15) }; html = `<p>Past the fence the flock found an old supply cache: ${fmt(f.cargo.g)} Grain, ${fmt(f.cargo.r)} Grit and ${fmt(f.cargo.o)} Oil.</p>`; }
      else if (r < 0.5) { const n = Math.max(1, Math.floor(size * (0.1 + Math.random() * 0.3))); f.units.pecker = (f.units.pecker || 0) + n; html = `<p>${fmt(n)} stray hens joined the flock as Peckers.</p>`; }
      else if (r < 0.6) { const amt = Math.min(cap, 1500 + size * 60); f.cargo = { g: Math.floor(amt * 0.6), r: Math.floor(amt * 0.4), o: 0 }; html = `<p>The flock found an old feather field and brought back ${fmt(amt)} worth of Grain and Grit.</p>`; }
      else if (r < 0.85) { html = '<p>The Wilds were quiet. The flock found nothing.</p>'; }
      else if (r < 0.95) { f.back = S.t + f.secs * 1.6; html = '<p>A flooded creek held the flock up. It will come back late.</p>'; }
      else { f.state = 'dead'; addMsg('expedition', 'Expedition lost', '<p>The flock never came back from the Wilds.</p>'); return; }
      addMsg('expedition', 'Expedition report', html);
      f.state = 'back';
    }
  }
  function returnHome(f) {
    const c = S.coops[f.from] || S.coops[0];
    for (const id in f.units) if (f.units[id] > 0) c.units[id] = (c.units[id] || 0) + f.units[id];
    c.res.g += f.cargo.g || 0; c.res.r += f.cargo.r || 0; c.res.o += f.cargo.o || 0;
    if ((f.cargo.g || 0) + (f.cargo.r || 0) + (f.cargo.o || 0) > 0 && f.mission !== 'transport') addMsg('info', `Flock back at ${c.name}`, `<p>It brought ${fmt(f.cargo.g)} Grain · ${fmt(f.cargo.r)} Grit · ${fmt(f.cargo.o)} Oil.</p>`);
  }

  /* ---------- hostile flocks ---------- */
  function points() { return Math.floor(S.spent / 1000); }
  function maybeThreat() {
    if (S.t < S.shieldUntil || S.threats.length >= 2) return;
    const chance = 0.035 + Math.min(0.06, points() / 80000);
    if (Math.random() > chance) return;
    const target = Math.floor(Math.random() * S.coops.length), c = S.coops[target];
    let val = 0;
    for (const id in c.units) val += (c.units[id] || 0) * valueOf(U[id]);
    for (const id in c.defs) val += (c.defs[id] || 0) * valueOf(D[id]);
    val = val * (0.5 + Math.random() * 0.8) + 4000 + points() * 120;
    const units = { pecker: Math.floor(val * 0.5 / valueOf(U.pecker)), spurguard: Math.floor(val * 0.3 / valueOf(U.spurguard)), vanguard: Math.floor(val * 0.2 / valueOf(U.vanguard)) };
    const r = rng(hash('t' + S.t)), name = N1[Math.floor(r() * N1.length)] + ' ' + N2[Math.floor(r() * N2.length)];
    const from = { n: c.addr.n, s: clamp(c.addr.s + Math.floor(r() * 40) - 20, 1, STREETS), p: 1 + Math.floor(r() * 15) };
    const secs = 3600 * (1 + Math.random() * 2);
    S.threats.push({ id: 'h' + (S.seq++), name, tag: TAGS[Math.floor(r() * TAGS.length)], from, target, units, arrive: S.t + secs });
  }
  function threatArrive(h) {
    const c = S.coops[h.target]; if (!c) return;
    const res = battle({ units: h.units, tech: { beak: 3, shell: 3, down: 1 } }, { units: c.units, defs: c.defs, tech: S.research });
    let rebuilt = 0;
    for (const id in res.D) { const x = res.D[id]; if (x.def) { const lost = x.before - x.after, back = Math.round(lost * 0.6); rebuilt += back; c.defs[id] = x.after + back; } else c.units[id] = x.after; }
    const surv = {}; for (const id in res.A) surv[id] = res.A[id].after;
    const loot = res.winner === 'att' ? lootFrom(c.res, cargoOf(surv)) : { g: 0, r: 0, o: 0 };
    c.res.g -= loot.g; c.res.r -= loot.r; c.res.o -= loot.o;
    const fe = feathersFrom(res), key = `${c.addr.n}-${c.addr.s}-${c.addr.p}`;
    if (fe.g + fe.r > 0) { const old = S.feathers[key] || { g: 0, r: 0 }; S.feathers[key] = { g: old.g + fe.g, r: old.r + fe.r }; }
    addMsg('battle', `${h.name} raided ${c.name}`, battleHtml(res, h.name, 'You', loot, fe, rebuilt));
  }
  const threatSeen = (h) => S.t >= h.arrive - (1800 + 1800 * (S.coops[h.target] ? S.coops[h.target].b.tower : 0));

  /* ---------- simulation ---------- */
  function step(dt) {
    const t1 = S.t + dt;
    if (S.ledger.length > 60) S.ledger.length = 60;
    for (let ci = 0; ci < S.coops.length; ci++) {
      const c = S.coops[ci], p = prod(c), cp = caps(c), h = dt / 3600;
      if (c.res.g < cp.g) c.res.g = Math.min(cp.g, c.res.g + p.g * h);
      if (c.res.r < cp.r) c.res.r = Math.min(cp.r, c.res.r + p.r * h);
      if (p.o >= 0) { if (c.res.o < cp.o) c.res.o = Math.min(cp.o, c.res.o + p.o * h); } else c.res.o = Math.max(0, c.res.o + p.o * h);
      if (c.bq && t1 >= c.bq.end) { c.b[c.bq.id] = c.bq.lvl; emit('done', { what: `${B[c.bq.id].name} level ${c.bq.lvl}`, coop: c.name }); c.bq = null; }
      let clock = S.t;
      while (c.hq.length) {
        const o = c.hq[0];
        if (o.start == null) o.start = clock;
        const end = o.start + o.dur;
        const frac = o.dur > 0 ? clamp((t1 - o.start) / o.dur, 0, 1) : 1;
        if (o.kind !== 'crack') {
          const target = Math.floor(o.n * frac), delta = target - o.done;
          if (delta > 0) { const bag = o.kind === 'u' ? c.units : c.defs; bag[o.id] = (bag[o.id] || 0) + delta; o.done = target; }
        }
        if (t1 >= end) {
          if (o.kind === 'crack') c.res[o.id] += o.n;
          else if (o.done < o.n) { const bag = o.kind === 'u' ? c.units : c.defs; bag[o.id] = (bag[o.id] || 0) + (o.n - o.done); o.done = o.n; }
          c.hq.shift(); clock = end; emit('done', { what: o.kind === 'crack' ? 'Egg cracking' : `${(o.kind === 'u' ? U : D)[o.id].name} ×${fmt(o.n)}`, coop: c.name });
          if (c.hq[0]) c.hq[0].start = end;
        } else break;
      }
    }
    if (S.rq && t1 >= S.rq.end) { S.research[S.rq.id] = S.rq.lvl; emit('done', { what: `${R[S.rq.id].name} ${S.rq.lvl}` }); S.rq = null; }
    S.t = t1;
    for (const f of S.flocks) {
      if (f.state === 'out' && S.t >= f.arrive) { arrive(f); emit('flock', f); }
      if (f.state === 'back' && S.t >= f.back) { returnHome(f); f.state = 'home'; emit('flock', f); }
    }
    S.flocks = S.flocks.filter(f => f.state === 'out' || f.state === 'back');
    for (const h of S.threats) if (S.t >= h.arrive) { threatArrive(h); h.done = true; emit('flock', h); }
    S.threats = S.threats.filter(h => !h.done);
    const hr = Math.floor(S.t / 3600);
    while (S.hourMark < hr) { S.hourMark++; maybeThreat(); }
  }
  function advance(dt) { while (dt > 0) { const s = Math.min(dt, 60); step(s); dt -= s; } }

  global.GAME = {
    get S() { return S; }, set S(v) { S = v; },
    newGame, advance, step, build, research, hatch, crack, speedUp, speedCost, sendFlock, recall, planFlock, distance, npcAt, npcRes, ownAt, featherAt,
    prod, caps, capEggs, storeCap, maxCoops, maxFlocks, fieldsUsed, fieldsTotal, reqMet, canPay, bCost, rCost, eggsOf, cargoOf, points, threatSeen, cur, oilHeat,
    on: (fn) => listeners.push(fn),
    B, R, U, D, PLOT, ZONE, HOODS, STREETS, addrStr, fmt, dur, hash, rng
  };
})(window);
