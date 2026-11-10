// Team commands for the Estate exchange. Uses RH_RPC_URL, and DEPLOYER_KEY (the owner) for changes.
//
//   node scripts/admin.js status
//   node scripts/admin.js set-pool <GRAIN|GRIT|OIL> <eggs> <goods>
//   node scripts/admin.js fees <eth per trade> <pool fee bps> <max trade bps>
//   node scripts/admin.js signer <address>
//   node scripts/admin.js pause | unpause
//   node scripts/admin.js withdraw <to>
//
// Option: --dir <folder with dex.deployed.json> (default: this folder).
const { readJson, provider, signer, resourceId, deployedFile, ethers, TOKENS } = require('./lib');

const argv = process.argv.slice(2);
const dirAt = argv.indexOf('--dir');
const dir = dirAt >= 0 ? argv.splice(dirAt, 2)[1] : undefined;
const [cmd, ...rest] = argv;

function exchange(write) {
  const d = readJson(deployedFile(dir));
  return new ethers.Contract(d.address, d.abi, write ? signer() : provider());
}
async function send(label, txp) { const tx = await txp; process.stdout.write(`${label}: ${tx.hash} ... `); await tx.wait(); console.log('done'); }

const commands = {
  async status() {
    const ex = exchange(false);
    const [owner, sgn, fee, poolFee, maxTrade, paused, bal] = await Promise.all([ex.owner(), ex.signer(), ex.tradeFee(), ex.poolFeeBps(), ex.maxTradeBps(), ex.paused(), ex.runner.provider.getBalance(await ex.getAddress())]);
    console.log(`Exchange ${await ex.getAddress()} (owner ${owner}, signer ${sgn})${paused ? ' PAUSED' : ''}`);
    console.log(`Fee ${ethers.formatEther(fee)} ETH per trade, pool fee ${Number(poolFee) / 100}%, largest trade ${Number(maxTrade) / 100}% of a pool. Fees waiting: ${ethers.formatEther(bal)} ETH`);
    for (const [name, id] of Object.entries(TOKENS)) {
      if (!id) continue;
      const p = await ex.pools(id);
      const eggs = Number(p.eggs) / 1e6; // pools count eggs in millionths
      console.log(`  ${name.padEnd(6)} ${eggs.toFixed(2)} eggs / ${p.goods} -> 1 egg = ${eggs ? (Number(p.goods) / eggs).toFixed(1) : '-'} ${name}`);
    }
  },
  'set-pool': (name, eggs, goods) => send(`Pool ${name}`, exchange(true).setPool(resourceId(name), BigInt(eggs), BigInt(goods))),
  fees: (eth, poolBps, maxBps) => send('Fees', exchange(true).setFees(ethers.parseEther(eth), Number(poolBps), Number(maxBps))),
  signer: (addr) => send('Signer', exchange(true).setSigner(ethers.getAddress(addr))),
  pause: () => send('Paused', exchange(true).pause()),
  unpause: () => send('Unpaused', exchange(true).unpause()),
  withdraw: (to) => send(`Withdraw to ${to}`, exchange(true).withdraw(ethers.getAddress(to))),
};

(async () => {
  if (!commands[cmd]) { console.error(require('fs').readFileSync(__filename, 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n')); process.exit(1); }
  await commands[cmd](...rest);
})().catch((e) => { console.error(e.shortMessage || e.message); process.exit(1); });
