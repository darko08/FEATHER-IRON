// End-to-end check of the whole mint on a local chain: node e2e/run.js [--shots <dir>]
//
// Starts a Hardhat node, deploys a stand-in Roostr collection, takes the holder snapshot,
// builds the claim list, deploys Feather & Iron with scripts/deploy.js, opens claim and sale
// with scripts/admin.js, then clicks through the mint page in Chromium with a test wallet.
// Needs Playwright with Chromium.
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { ethers } = require('ethers');
const { chromium } = require('playwright');

const MINT = path.resolve(__dirname, '..');
const RPC = 'http://127.0.0.1:8545';
const PHRASE = 'test test test test test test test test test test test junk'; // Hardhat's public dev accounts
const acct = (i) => ethers.HDNodeWallet.fromPhrase(PHRASE, undefined, `m/44'/60'/0'/0/${i}`);
const shotsDir = (() => { const i = process.argv.indexOf('--shots'); return i > 0 ? path.resolve(process.argv[i + 1]) : null; })();
const results = [];
const check = (ok, what) => { results.push(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) process.exitCode = 1; };

function run(script, args, env) {
  return execFileSync('node', [path.join(MINT, 'scripts', script), ...args], { cwd: MINT, env: { ...process.env, ...env }, encoding: 'utf8' });
}

async function waitForRpc() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' });
      if (r.ok) return new ethers.JsonRpcProvider(RPC, 31337, { staticNetwork: true });
    } catch (e) { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Hardhat node did not start');
}

function serve(dir) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const file = path.join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/\/$/, '/index.html'));
      if (!file.startsWith(dir)) { res.writeHead(403); res.end(); return; }
      fs.readFile(file, (err, buf) => { if (err) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' }); res.end(buf); });
    }).listen(0, '127.0.0.1', () => resolve(srv));
  });
}

// A minimal EIP-1193 wallet that signs through the Hardhat node's unlocked accounts.
const walletScript = ({ account, rpc }) => {
  let connected = false;
  window.__rejectNext = false;
  window.ethereum = {
    async request({ method, params }) {
      if (method === 'eth_requestAccounts') { connected = true; return [account]; }
      if (method === 'eth_accounts') return connected ? [account] : [];
      if (method === 'wallet_switchEthereumChain' || method === 'wallet_addEthereumChain') return null;
      if (method === 'eth_sendTransaction' && window.__rejectNext) { window.__rejectNext = false; const e = new Error('User rejected the request.'); e.code = 4001; throw e; }
      const r = await fetch(rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params: params || [] }) });
      const j = await r.json();
      if (j.error) { const e = new Error(j.error.message); e.code = j.error.code; e.data = j.error.data; throw e; }
      return j.result;
    },
    on() {}, removeListener() {},
  };
};

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fni-e2e-'));
  const node = spawn('npx', ['hardhat', 'node', '--hostname', '127.0.0.1', '--port', '8545'], { cwd: MINT, stdio: 'ignore', detached: true });
  let browser, srv;
  try {
    const provider = await waitForRpc();
    const owner = acct(0).connect(provider), alice = acct(1), bob = acct(2), carol = acct(3), dave = acct(4), treasury = acct(5);

    // 1. stand-in Roostr collection: alice holds 3, bob 1, carol 2
    const mockArt = JSON.parse(fs.readFileSync(path.join(MINT, 'artifacts/contracts/mocks/MockRoostr.sol/MockRoostr.json')));
    const roostr = await new ethers.ContractFactory(mockArt.abi, mockArt.bytecode, owner).deploy();
    await roostr.waitForDeployment();
    let nonce = await provider.getTransactionCount(owner.address);
    for (const [to, id] of [[alice, 1], [alice, 2], [alice, 3], [bob, 4], [carol, 5], [carol, 6]]) await (await roostr.mint(to.address, id, { nonce: nonce++ })).wait();

    // 2. snapshot and claim list
    const csv = path.join(tmp, 'snapshot.csv');
    const snap = run('snapshot-holders.js', ['--rpc', RPC, '--contract', await roostr.getAddress(), '--from', '1', '--to', '8', '--out', csv]);
    check(/3 holders, 6 tokens counted, 0 skipped .*2 ids without an owner/.test(snap), 'snapshot finds 3 holders and 6 Roostrs');
    const web = path.join(tmp, 'web');
    fs.cpSync(path.join(MINT, 'web'), web, { recursive: true });
    const claims = run('build-claims.js', [csv, '--out-dir', path.join(web, 'claims')]);
    check(/3 holders, 6 free mints/.test(claims), 'claim list has 6 free mints');
    const bucket = JSON.parse(fs.readFileSync(path.join(web, 'claims', alice.address.toLowerCase().slice(2, 4) + '.json')));
    check(bucket[alice.address.toLowerCase()] && bucket[alice.address.toLowerCase()].allowance === '3', 'claim file holds the first holder with 3');
    check(fs.readdirSync(path.join(web, 'claims')).filter((f) => /^[0-9a-f]{2}\.json$/.test(f)).length === 256, 'all 256 claim files exist');

    // 3. deploy and open
    const cfg = JSON.parse(fs.readFileSync(path.join(web, 'config.json')));
    Object.assign(cfg, { rpcUrl: RPC, chainName: 'Local test chain', explorer: '' });
    fs.writeFileSync(path.join(web, 'config.json'), JSON.stringify(cfg));
    const deployCfg = path.join(tmp, 'deploy.config.json');
    fs.writeFileSync(deployCfg, JSON.stringify({ name: 'Feather & Iron', symbol: 'FNI', maxSupply: 50, priceEth: '0.01', maxPerTx: 5, placeholderURI: 'https://example.test/unrevealed.json', royaltyReceiver: treasury.address, royaltyBps: 500 }));
    const env = { RH_RPC_URL: RPC, DEPLOYER_KEY: acct(0).privateKey };
    const dep = run('deploy.js', ['--config', deployCfg, '--web-dir', web], env);
    check(/Deployed at 0x[0-9a-fA-F]{40}/.test(dep), 'deploy script deploys and writes the page config');
    const admin = (...a) => run('admin.js', [...a, '--web-dir', web, '--secret-file', path.join(tmp, 'secret.txt')], env);
    admin('set-claim'); admin('commit'); admin('open-claim'); admin('open-sale');
    check(/Free claim: OPEN\. 0 of 6 claimed, 6 held back/.test(admin('status')), 'claim open with 6 held back');

    // 4. the page
    srv = await serve(web);
    const url = `http://127.0.0.1:${srv.address().port}/index.html`;
    browser = await chromium.launch();
    const errors = [];
    const open = async (who, vp) => {
      const page = await browser.newPage({ viewport: vp || { width: 1440, height: 900 }, reducedMotion: 'reduce', deviceScaleFactor: shotsDir ? 2 : 1 });
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      await page.addInitScript(walletScript, { account: who.address, rpc: RPC });
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => document.getElementById('minted').textContent !== '–');
      return page;
    };
    const statusText = (page) => page.$eval('#status', (el) => el.textContent);
    const waitStatus = (page, re) => page.waitForFunction((src) => new RegExp(src).test(document.getElementById('status').textContent), re.source, { timeout: 20000 });

    const page = await open(alice);
    check((await page.textContent('#minted')).trim() === '0 / 50', 'page reads the supply from the chain');
    check(await page.isDisabled('#claimBtn'), 'claim button waits for a wallet');
    if (shotsDir) await page.screenshot({ path: path.join(shotsDir, 'mint-desktop-start.jpg'), type: 'jpeg', quality: 82 });
    await page.click('#connect');
    await page.waitForFunction(() => /can claim/.test(document.getElementById('claimMsg').textContent));
    check(/can claim 3 free\. 3 left/.test(await page.textContent('#claimMsg')), 'holder sees 3 free claims');
    await page.fill('#claimQty', '2');
    await page.click('#claimBtn');
    await waitStatus(page, /Done\. You got 2 tickets: #1, #2/);
    check(true, 'claim of 2 goes through');
    await page.waitForFunction(() => /1 left/.test(document.getElementById('claimMsg').textContent));
    check(true, 'page shows 1 claim left');
    await page.evaluate(() => { window.__rejectNext = true; });
    await page.click('#mintBtn');
    await waitStatus(page, /cancelled in the wallet/);
    check(true, 'a cancelled transaction shows a plain message');
    await page.fill('#mintQty', '2');
    await page.click('#mintBtn');
    await waitStatus(page, /Done\. You got 2 tickets: #3, #4/);
    check(true, 'public mint of 2 goes through');
    await page.waitForFunction(() => /holds 4/.test(document.getElementById('mineMsg').textContent));
    check(true, 'wallet shows 4 tickets');
    if (shotsDir) { await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(shotsDir, 'mint-desktop-after.jpg'), type: 'jpeg', quality: 82, fullPage: true }); }
    await page.close();

    const p2 = await open(dave, { width: 390, height: 844 });
    await p2.click('#connect');
    await p2.waitForFunction(() => /not on the Roostr list/.test(document.getElementById('claimMsg').textContent));
    check(await p2.isDisabled('#claimBtn'), 'wallet without Roostrs cannot claim');
    const sw = await p2.evaluate(() => document.documentElement.scrollWidth);
    check(sw <= 390, `phone layout has no sideways scroll (${sw}px)`);
    if (shotsDir) await p2.screenshot({ path: path.join(shotsDir, 'mint-phone.jpg'), type: 'jpeg', quality: 82, fullPage: true });
    await p2.close();
    check(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);

    // 5. reveal
    const rev = admin('reveal', 'https://example.test/meta/');
    check(/Token 1 now reads https:\/\/example\.test\/meta\/\d+\.json/.test(rev), 'reveal maps tokens to metadata files');
    check(/Minted 4 of 50/.test(admin('status')), 'status shows 4 minted');
  } catch (e) {
    results.push('FAIL ' + (e.stack || e.message));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (srv) srv.close();
    try { process.kill(-node.pid); } catch (e) { /* already gone */ }
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(results.join('\n'));
})();
