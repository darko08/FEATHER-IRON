/* EGG token season model: 90 days, one AMM pool EGG/ETH (0.3% fee to the treasury), daily flows.
   Pure function, no DOM. Players buy more when an egg is cheap compared with its value in the game
   (utility) and sell more when it is expensive, so the price settles instead of running away. */
(function (root) {
  const BASE = { players: 6000, lay: 1, useShare: 0.55, sellShare: 0.25, holderSell: 0.01, buyerShare: 0.02, buyEth: 0.0015, utility: 0.000055, rush: 2.5, trades: 1.5, tradeFee: 0.0002, buyback: 0.2, prize: 0.3, stakeShare: 0.25, stake: 50, poolEth: 100, poolEgg: 2000000 };
  const SCENARIOS = {
    base: Object.assign({}, BASE, { label: 'Zdrava ekonomija' }),
    dump: Object.assign({}, BASE, { label: 'Dump', useShare: 0.2, sellShare: 0.9, holderSell: 0.08, buyerShare: 0.005, utility: 0.00003, rush: 1.3, buyback: 0.1, stakeShare: 0.03 }),
    nosink: Object.assign({}, BASE, { label: 'Slaba potrošnja', useShare: 0.08, sellShare: 0.4, holderSell: 0.02, buyerShare: 0.01, utility: 0.00004, rush: 1.3, buyback: 0.1, stakeShare: 0.1 }),
    race: Object.assign({}, BASE, { label: 'Takmičarski finiš', useShare: 0.7, sellShare: 0.15, holderSell: 0.006, buyerShare: 0.04, utility: 0.00008, rush: 4, trades: 2, buyback: 0.25, stakeShare: 0.4 })
  };
  const FEE = 0.003;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function simulate(p, days = 90) {
    let eth = p.poolEth, egg = p.poolEgg, float = 0, burned = 0, laidTotal = 0, prize = 0, treasury = 0, volEth = 0, staked = 0;
    const stakeTarget = p.players * p.stakeShare * p.stake, stakeDays = 14;
    const swapBuy = (ethIn) => { const inF = ethIn * (1 - FEE); const o = egg * inF / (eth + inF); eth += inF; egg -= o; volEth += ethIn; return { out: o, fee: ethIn * FEE }; };
    const swapSell = (eggIn) => { const inF = eggIn * (1 - FEE); const o = eth * inF / (egg + inF); egg += inF; eth -= o; volEth += o; return { out: o, fee: o * FEE }; };
    const start = eth / egg, out = [];
    for (let d = 1; d <= days; d++) {
      const t = d / days, rush = 1 + (p.rush - 1) * t * t * t;
      const price = eth / egg, cheap = clamp(Math.pow(p.utility / price, 1.5), 0, 3), rich = clamp(Math.pow(price / p.utility, 1.5), 0.2, 5);
      let fees = 0;
      // hens lay; players use part in the game (burned), sell part, keep the rest
      const laid = p.players * p.lay; laidTotal += laid;
      const used = laid * Math.min(1, p.useShare * rush / Math.sqrt(rich));
      const sold = Math.max(0, laid - used) * Math.min(1, p.sellShare * rich * (1 - 0.6 * t));
      float += laid - used - sold; burned += used;
      if (sold > 0) fees += swapSell(sold).fee;
      const hs = float * Math.min(0.5, p.holderSell * rich * (1 - 0.5 * t));
      if (hs > 0) { float -= hs; fees += swapSell(hs).fee; }
      // season stake: bought over the first two weeks and locked
      if (d <= stakeDays && stakeTarget > 0) { const want = stakeTarget / stakeDays; const r = swapBuy(want * (eth / egg) / (1 - FEE) * 1.01); staked += r.out; fees += r.fee; }
      // players buying eggs with ETH for a small edge, mostly spent right away
      const buyIn = p.players * p.buyerShare * p.buyEth * rush * cheap;
      if (buyIn > 0) { const r = swapBuy(buyIn); fees += r.fee; burned += r.out * 0.9; float += r.out * 0.1; }
      // revenue: Market trade fees + pool swap fees; part buys back and burns eggs, part funds prizes
      const rev = p.players * p.trades * p.tradeFee + fees;
      // buyback only while an egg trades below its target (the utility value); otherwise that share stays in the treasury
      const bb = eth / egg < p.utility ? rev * p.buyback : 0; if (bb > 0) burned += swapBuy(bb).out;
      prize += rev * p.prize; treasury += rev * (1 - p.prize) - bb;
      out.push({ d, price: eth / egg, poolEth: eth, poolEgg: egg, float, burned, laid: laidTotal, staked, prize, treasury, rev });
    }
    const last = out[out.length - 1];
    return { days: out, start, end: last.price, change: last.price / start - 1, prize: last.prize, treasury: last.treasury, burned: last.burned, laid: last.laid, float: last.float, staked: last.staked, volEth };
  }
  root.EggSim = { BASE, SCENARIOS, simulate };
})(typeof window !== 'undefined' ? window : globalThis);
