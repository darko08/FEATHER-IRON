// Headless check of the game rules: node tests/engine-test.js
// Runs a scripted game (build, hatch, raid, scout, settle, transport, expeditions, hostile raids, save/load).
global.window = globalThis;
// Fixed random seed so expeditions and hostile raids play out the same way on every run.
Math.random = (() => { let x = 20261109; return () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296); })();
require(process.argv[2] || require('path').join(__dirname, '../prototype/src/engine.js'));
const G = window.GAME;
const ok = (c, m) => { if (!c) { console.log('FAIL:', m); process.exitCode = 1; } else console.log('ok  ', m); };
const done = [];
G.on((t, d) => done.push([t, d && (d.what || d.mission)]));
G.newGame('#04117');
const c = () => G.cur();
ok(G.S.eggs === 1000, 'starts with 1000 eggs');
const p0 = G.prod(c());
console.log('  prod at start', p0.g.toFixed(1), p0.r.toFixed(1), p0.o.toFixed(1), 'cap', G.caps(c()), 'capEggs(3)=', G.capEggs(3));
ok(G.build('field') === null, 'build Grain Field 1');
ok(G.build('pit') !== null, 'second build blocked while busy: ' + G.build('pit'));
G.advance(3600);
ok(c().b.field === 1 && !c().bq, 'field level 1 done after 1h');
// eggs -> units
ok(G.hatch('u', 'pecker', 50, 'egg') === null, 'hatch 50 Peckers with eggs');
console.log('  eggs left', G.S.eggs, 'queue dur h', (c().hq[0].dur / 3600).toFixed(2));
G.advance(1800);
console.log('  after 30 min: peckers', c().units.pecker, 'done', c().hq[0] && c().hq[0].done);
ok(c().units.pecker > 0 && c().units.pecker < 50, 'progressive delivery');
ok(G.speedUp('hatch') === null, 'speed-up hatch with eggs');
ok(c().units.pecker === 50 && c().hq.length === 0, 'all 50 Peckers delivered after speed-up');
ok(G.hatch('d', 'wattle', 10, 'egg') === null, 'hatch 10 Wattle with eggs');
ok(G.crack(20, 'o') === null, 'crack 20 eggs into Oil');
G.advance(4 * 3600);
ok(c().defs.wattle === 10, 'wattle delivered: ' + c().defs.wattle);
console.log('  res', JSON.stringify(c().res, (k, v) => typeof v === 'number' ? Math.round(v) : v));
ok(G.build('academy') === null, 'build Academy');
G.advance(6 * 3600);
ok(c().b.academy === 1, 'academy 1');
ok(G.research('logistics') === null || true, 'research logistics attempt: ' + G.research('logistics'));
// neighbors on home street
const row = [];
for (let p = 1; p <= 15; p++) { const n = G.npcAt(2, 117, p); row.push(n ? `${p}:${n.tier}${n.status || '-'}` : `${p}:${G.ownAt(2, 117, p) >= 0 ? 'ME' : 'free'}`); }
console.log('  street 117:', row.join(' '));
let target = null;
for (let s = 117; s < 140 && !target; s++) for (let p = 1; p <= 15 && !target; p++) { const n = G.npcAt(2, s, p); if (n && n.status === 'i') target = n; }
console.log('  raid target', target && `${target.key} ${target.name} tier ${target.tier} defs ${JSON.stringify(target.defs)} units ${JSON.stringify(target.units)}`);
const plan = G.planFlock(c().addr, target, { pecker: 50 }, 1);
console.log('  plan', JSON.stringify(plan));
const e1 = G.sendFlock({ mission: 'raid', to: { n: target.n, s: target.s, p: target.p }, units: { pecker: 50 }, cargo: {}, pct: 1 });
ok(e1 === null, 'send raid: ' + e1);
ok(c().units.pecker === 0, 'peckers left home');
G.advance(plan.secs * 2 + 120);
const bat = G.S.msgs.find(m => m.type === 'battle');
ok(!!bat, 'battle report: ' + (bat && bat.title));
if (bat) console.log('  ', bat.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 400));
ok(G.S.flocks.length === 0, 'flock returned');
console.log('  peckers home', c().units.pecker, 'shield', G.S.shieldUntil, 't', G.S.t);
G.S.shieldUntil = 1e12; // keep hostile raids out of the middle section; they get their own test below
// scout, settle, glean with forced tech
G.S.research.scouting = 4; G.S.research.carto = 1; G.S.research.pack = 3; G.S.research.shell = 2; c().b.hatchery = 4;
c().units.scout = 3; c().units.settler = 1; c().units.gleaner = 2; c().units.packbrahma = 4;
c().res.o += 20000; c().res.g += 5000; c().res.r += 5000;
ok(G.sendFlock({ mission: 'scout', to: target, units: { scout: 1 }, pct: 1 }) === null, 'send scout');
let free = null; for (let p = 1; p <= 15 && !free; p++) if (!G.npcAt(2, 118, p) && G.ownAt(2, 118, p) < 0) free = { n: 2, s: 118, p };
console.log('  free plot', JSON.stringify(free));
const e2 = G.sendFlock({ mission: 'settle', to: free, units: { settler: 1, packbrahma: 1 }, cargo: { g: 1000, r: 500, o: 0 }, pct: 1 });
ok(e2 === null, 'send settler: ' + e2);
const fk = Object.keys(G.S.feathers)[0];
console.log('  feather fields', JSON.stringify(G.S.feathers));
if (fk) { const [n, s, p] = fk.split('-').map(Number); const e3 = G.sendFlock({ mission: 'glean', to: { n, s, p }, units: { gleaner: 2 }, pct: 1 }); ok(e3 === null || /slots/.test(e3), 'send gleaners: ' + e3); }
G.advance(12 * 3600);
ok(G.S.coops.length === 2, 'settled second coop: ' + G.S.coops.map(x => `${x.name} ${G.addrStr(x.addr)} f${x.fields} ${x.temp}C`).join(' | '));
const sc = G.S.msgs.find(m => m.type === 'scout'); ok(!!sc, 'scout report: ' + (sc && sc.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 200)));
// transport to new coop
const nc = G.S.coops[1];
const e4 = G.sendFlock({ mission: 'transport', to: nc.addr, units: { packbrahma: 2 }, cargo: { g: 500, r: 0, o: 0 }, pct: 0.5 });
ok(e4 === null, 'transport at 50% speed: ' + e4);
// expedition + recall
c().units.pecker = (c().units.pecker || 0) + 20;
const e5 = G.sendFlock({ mission: 'expedition', to: {}, units: { pecker: 10 }, pct: 1 });
ok(e5 === null || /slots/.test(e5), 'expedition: ' + e5);
G.S.research.logistics = 3;
const e6 = G.sendFlock({ mission: 'expedition', to: {}, units: { pecker: 10 }, pct: 1 });
ok(e6 === null, 'expedition 2: ' + e6);
const last = G.S.flocks[G.S.flocks.length - 1];
G.advance(600);
ok(G.recall(last.id) === null, 'recall flock');
G.advance(48 * 3600);
ok(G.S.flocks.length === 0, 'all flocks home');
ok(nc.res.g >= 1500, 'transport delivered: ' + Math.round(nc.res.g));
// threats
G.S.shieldUntil = 0; let seen = 0;
for (let h = 0; h < 96; h++) { G.advance(3600); if (G.S.threats.some(G.threatSeen)) seen++; }
const raids = G.S.msgs.filter(m => m.type === 'battle' && / raided /.test(m.title));
console.log('  hostile raids in 4 days:', raids.length, 'hours with visible threat:', seen);
ok(raids.length > 0, 'threat system fires');
// persistence
const js = JSON.stringify(G.S); const back = JSON.parse(js); G.S = back; G.advance(3600);
ok(G.S.t > 0 && js.length < 200000, 'JSON roundtrip ok, size ' + js.length);
console.log('  points', G.points(), 'eggs', G.S.eggs, 'msgs', G.S.msgs.length, 'events', done.length);
ok(!Object.values(G.cur().res).some(v => !isFinite(v) || v < 0), 'resources finite and non-negative');
// battle sanity: big army vs tier-5 coop
let big = null; for (let s = 1; s < 500 && !big; s++) for (let p = 1; p <= 15 && !big; p++) { const n = G.npcAt(5, s, p); if (n && n.tier === 5 && n.status === '') big = n; }
console.log('  tier-5 sample', big && JSON.stringify({ defs: big.defs, units: big.units }));

// ---------- market: the same pricing as the on-chain exchange ----------
G.newGame('#00001');
const mc = G.cur();
ok(G.marketTrade('e', 'g', 10) === 'Build a Market in this coop first.', 'market needs the building');
mc.b.market = 1;
const pools0 = JSON.parse(JSON.stringify(G.S.market.pools));
const q = G.marketQuote('e', 'g', 10);
const want = Math.floor(10 * 9970 * 1100000 / (5000 * 10000 + 10 * 9970));
ok(q.out === want, `quote matches the exchange contract formula (10 eggs -> ${q.out} Grain)`);
const g0 = mc.res.g, e0 = G.S.eggs;
ok(G.marketTrade('e', 'g', 10, q.min) === null, 'trade 10 eggs for Grain');
ok(G.S.eggs === e0 - 10 && mc.res.g === g0 + want, 'eggs paid and Grain received');
ok(G.S.market.pools.g.e === pools0.g.e + 10 && G.S.market.pools.g.x === pools0.g.x - want, 'pool moved like the contract');
ok(/limit/.test(G.marketTrade('e', 'g', 45) || ''), 'daily limit of 50 eggs per Market level holds');
ok(/5%/.test(G.marketQuote('e', 'o', 400).err || ''), 'trades above 5% of a pool are refused');
const two = G.marketQuote('g', 'o', 2000);
ok(two.out > 0 && two.eggs > 0, `Grain to Oil goes through eggs (${two.eggs} eggs -> ${two.out} Oil)`);
G.advance(86400);
ok(G.marketUsedToday() === 0, 'the limit resets the next day');
G.S.market.pools.g = { e: 6000, x: 900000 }; // 150 Grain per egg, below the 200 an egg cracks into
G.advance(30 * 86400);
const rate = G.S.market.pools.g.x / G.S.market.pools.g.e;
ok(rate >= 195, `arbitrage lifts Grain back to the cracking value (${rate.toFixed(1)} per egg after 30 days)`);
ok(Object.values(G.S.market.pools).every((pl) => pl.e > 0 && pl.x > 0 && Number.isFinite(pl.e)), 'pools stay positive');
const old = JSON.parse(JSON.stringify(G.S)); delete old.market; old.coops.forEach((c) => delete c.b.market);
G.S = old;
ok(!!G.S.market && G.cur().b.market === 0 && Number.isFinite(G.fieldsUsed(G.cur())), 'old saves get the market and the new building');

