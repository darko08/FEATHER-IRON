// Team commands for the deployed collection. The chain and contract come from web/config.json
// (written by the deploy); RH_RPC_URL or --network can override the RPC. Anything that changes the
// contract needs DEPLOYER_KEY (the owner wallet).
//
//   node scripts/admin.js status
//   node scripts/admin.js set-claim                 put the Roostr list from web/claims/index.json on the contract
//   node scripts/admin.js commit                    make the reveal secret (saved to secret.txt) and commit its hash
//   node scripts/admin.js provenance <metadata dir> hash 1.json..N.json and publish it (optional, before minting)
//   node scripts/admin.js open-claim | close-claim | open-sale | close-sale
//   node scripts/admin.js price <eth> [maxPerTx]
//   node scripts/admin.js team-mint <to> <quantity>
//   node scripts/admin.js reveal <base url ending in />
//   node scripts/admin.js withdraw <to>
//
// Options: --web-dir <dir> (default web), --secret-file <file> (default secret.txt), --force.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ROOT, args, readJson, provider, signer, webDir, ethers } = require('./lib');

const a = args();
const [cmd, ...rest] = a._;
const dir = webDir(a);
const secretFile = path.resolve(a['secret-file'] || path.join(ROOT, 'secret.txt'));

function contract(write) {
  const cfg = readJson(path.join(dir, 'config.json'));
  if (!cfg.contract) throw new Error('web/config.json has no contract address. Deploy first: npm run deploy');
  const abi = readJson(path.join(dir, 'abi.json'));
  return new ethers.Contract(cfg.contract, abi, write ? signer(a, cfg.rpcUrl) : provider(a, cfg.rpcUrl));
}

async function send(label, txPromise) {
  const tx = await txPromise;
  process.stdout.write(`${label}: ${tx.hash} ... `);
  await tx.wait();
  console.log('done');
}

const commands = {
  async status() {
    const c = contract(false);
    const [name, minted, max, price, perTx, claimOpen, publicOpen, root, reserved, claimedTotal, held, avail, commit, revealed, offset, owner] = await Promise.all([
      c.name(), c.totalMinted(), c.maxSupply(), c.price(), c.maxPerTx(), c.claimOpen(), c.publicOpen(), c.claimRoot(), c.claimReserved(),
      c.claimedTotal(), c.claimHeldBack(), c.publicAvailable(), c.revealCommit(), c.revealed(), c.offset(), c.owner()]);
    console.log(`${name} at ${await c.getAddress()} (owner ${owner})`);
    console.log(`Minted ${minted} of ${max}. Price ${ethers.formatEther(price)} ETH, up to ${perTx} per transaction.`);
    console.log(`Free claim: ${claimOpen ? 'OPEN' : 'closed'}. ${claimedTotal} of ${reserved} claimed, ${held} held back. Root ${root}`);
    console.log(`Public mint: ${publicOpen ? 'OPEN' : 'closed'}. ${avail} available.`);
    console.log(`Reveal: ${revealed ? `done, offset ${offset}` : commit === ethers.ZeroHash ? 'no commit yet' : 'committed, not revealed'}.`);
  },
  async 'set-claim'() {
    const idx = readJson(path.join(dir, 'claims/index.json'));
    await send(`Claim list (${idx.holders} holders, ${idx.reserved} mints)`, contract(true).setClaimList(idx.root, idx.reserved));
  },
  async commit() {
    if (fs.existsSync(secretFile) && !a.force) throw new Error(`${secretFile} already exists. Pass --force only if you mean to replace it before any mint.`);
    const secret = '0x' + crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretFile, secret + '\n', { mode: 0o600 });
    await send('Reveal commit', contract(true).commitReveal(ethers.keccak256(secret)));
    console.log(`Secret saved to ${path.relative(process.cwd(), secretFile)}: ${secret}`);
    console.log('Back it up now (password manager). Without it the collection can never be revealed.');
  },
  async provenance(metaDir) {
    if (!metaDir) throw new Error('Usage: admin.js provenance <metadata dir>');
    const c = contract(true);
    const max = Number(await c.maxSupply());
    const hashes = [];
    for (let i = 1; i <= max; i++) {
      const f = path.join(metaDir, `${i}.json`);
      if (!fs.existsSync(f)) throw new Error(`Missing ${f}`);
      hashes.push(ethers.keccak256(fs.readFileSync(f)));
    }
    const prov = ethers.keccak256(ethers.concat(hashes));
    await send(`Provenance ${prov}`, c.setProvenance(prov));
  },
  'open-claim': () => send('Free claim opened', contract(true).setClaimOpen(true)),
  'close-claim': () => send('Free claim closed', contract(true).setClaimOpen(false)),
  'open-sale': () => send('Public mint opened', contract(true).setPublicOpen(true)),
  'close-sale': () => send('Public mint closed', contract(true).setPublicOpen(false)),
  async price(eth, perTx) {
    if (!eth) throw new Error('Usage: admin.js price <eth> [maxPerTx]');
    const c = contract(true);
    await send(`Price ${eth} ETH`, c.setPrice(ethers.parseEther(eth), perTx ? Number(perTx) : await c.maxPerTx()));
  },
  'team-mint': (to, qty) => send(`Team mint ${qty} to ${to}`, contract(true).ownerMint(ethers.getAddress(to), Number(qty))),
  async reveal(baseURI) {
    if (!baseURI || !baseURI.endsWith('/')) throw new Error('Usage: admin.js reveal https://your-domain/metadata/   (ending in /)');
    const secret = fs.readFileSync(secretFile, 'utf8').trim();
    const c = contract(true);
    await send('Reveal', c.reveal(secret, baseURI));
    console.log(`Offset ${await c.offset()}. Token 1 now reads ${await c.tokenURI(1).catch(() => '(not minted)')}`);
  },
  withdraw: (to) => send(`Withdraw to ${to}`, contract(true).withdraw(ethers.getAddress(to))),
};

(async () => {
  if (!commands[cmd]) {
    console.error(fs.readFileSync(__filename, 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
    process.exit(1);
  }
  await commands[cmd](...rest);
})().catch((e) => {
  const data = e.data || (e.info && e.info.error && e.info.error.data);
  let reason = e.shortMessage || e.message;
  try { if (data) reason = ethers.Interface.from(readJson(path.join(dir, 'abi.json'))).parseError(data).name; } catch (_) { /* keep message */ }
  console.error(reason);
  process.exit(1);
});
