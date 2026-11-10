// End-to-end check of the exchange scripts on a local chain: node e2e/run.js
// Starts a Hardhat node, deploys a stand-in ticket NFT, deploys and seeds the exchange with
// scripts/deploy.js, signs a permit the way the game server does, trades from the ticket
// holder's wallet, watches the trade with pollTrades, then reads status and withdraws fees.
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ethers } = require('ethers');
const { TOKENS, newNonce, signPermit, pollTrades } = require('../server/permits');

const DEX = path.resolve(__dirname, '..');
const RPC = 'http://127.0.0.1:8546';
const PHRASE = 'test test test test test test test test test test test junk'; // Hardhat's public dev accounts
const acct = (i) => ethers.HDNodeWallet.fromPhrase(PHRASE, undefined, `m/44'/60'/0'/0/${i}`);
const results = [];
const check = (ok, what) => { results.push(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) process.exitCode = 1; };

async function up() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' }); if (r.ok) return; } catch (e) { /* starting */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Hardhat node did not start');
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fni-dex-'));
  const node = spawn('npx', ['hardhat', 'node', '--hostname', '127.0.0.1', '--port', '8546'], { cwd: DEX, stdio: 'ignore', detached: true });
  try {
    await up();
    // cacheTimeout -1: the admin calls below block the event loop, so a cached balance would never expire
    const provider = new ethers.JsonRpcProvider(RPC, 31337, { staticNetwork: true, cacheTimeout: -1 });
    const owner = new ethers.NonceManager(acct(0).connect(provider)), server = acct(1), player = acct(2).connect(provider), treasury = acct(3);
    const mock = JSON.parse(fs.readFileSync(path.join(DEX, 'artifacts/contracts/mocks/MockTickets.sol/MockTickets.json')));
    const tickets = await new ethers.ContractFactory(mock.abi, mock.bytecode, owner).deploy();
    await tickets.waitForDeployment();
    await (await tickets.mint(player.address, 42)).wait();

    const cfg = JSON.parse(fs.readFileSync(path.join(DEX, 'dex.config.json')));
    Object.assign(cfg, { tickets: await tickets.getAddress(), signer: server.address });
    fs.writeFileSync(path.join(tmp, 'dex.config.json'), JSON.stringify(cfg));
    const env = { ...process.env, RH_RPC_URL: RPC, DEPLOYER_KEY: acct(0).privateKey };
    const dep = execFileSync('node', [path.join(DEX, 'scripts/deploy.js'), '--config', path.join(tmp, 'dex.config.json'), '--out-dir', tmp], { env, encoding: 'utf8' });
    check(/Pool GRAIN: 5000 eggs and 1100000 GRAIN \(1 egg = 220\.0\)/.test(dep) && /Deployed at 0x/.test(dep), 'deploy script deploys and seeds three pools');
    const d = JSON.parse(fs.readFileSync(path.join(tmp, 'dex.deployed.json')));
    const ex = new ethers.Contract(d.address, d.abi, player);

    // the game server signs; the player trades 2,200 Grain for eggs and pays the fee
    const permit = { trader: player.address, account: 42n, tokenIn: TOKENS.GRAIN, tokenOut: TOKENS.EGG, amountIn: 2200n, nonce: newNonce(), deadline: BigInt(Math.floor(Date.now() / 1000) + 600) };
    const sig = await signPermit(server, { chainId: 31337, exchange: d.address }, permit);
    const quote = await ex.quote(TOKENS.GRAIN, TOKENS.EGG, 2200);
    const seen = [];
    const watcher = pollTrades(ex, { fromBlock: d.deployBlock, intervalMs: 100, onTrade: (t) => { seen.push(t); } });
    const fee = await ex.tradeFee();
    await (await ex.trade(permit, sig, quote * 99n / 100n, { value: fee })).wait();
    for (let i = 0; i < 50 && !seen.length; i++) await new Promise((r) => setTimeout(r, 100));
    watcher.stop();
    check(seen.length === 1 && seen[0].amountOut === quote && seen[0].nonce === permit.nonce, `server sees the trade: 2,200 Grain -> ${quote} eggs`);
    check(await ex.nonceUsed(permit.nonce), 'the permit is spent');

    const admin = (...a) => execFileSync('node', [path.join(DEX, 'scripts/admin.js'), ...a, '--dir', tmp], { env, encoding: 'utf8' });
    const st = admin('status');
    check(/GRAIN\s+[\d.]+ eggs \/ 1102200/.test(st) && /Fees waiting: 0\.0002 ETH/.test(st), 'status shows the new Grain pool and the fee');
    const before = await provider.getBalance(treasury.address);
    const w = admin('withdraw', treasury.address);
    const after = await provider.getBalance(treasury.address);
    check(after - before === fee, `withdraw sends the fee to the treasury${after - before === fee ? '' : ': ' + w}`);
    admin('pause');
    check(/PAUSED/.test(admin('status')), 'pause works from the admin script');
  } catch (e) {
    results.push('FAIL ' + (e.stack || e.message));
    process.exitCode = 1;
  } finally {
    try { process.kill(-node.pid); } catch (e) { /* gone */ }
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(results.join('\n'));
})();
