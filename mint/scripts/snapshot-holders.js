// Snapshot of who holds an ERC-721 collection (for the Roostr free claim).
//
//   node scripts/snapshot-holders.js --rpc <rpc url> --contract <address> --from 1 --to 12000 \
//     [--block <block number>] [--out snapshot/roostr.csv] [--exclude 0xabc,0xdef] [--resolve-like <address>] [--concurrency 6]
//
// Asks ownerOf for every token id at one block, so the list doesn't shift while it runs. Uses
// Multicall3 when the chain has it (a few dozen requests instead of one per token).
//
// Some tokens sit in contracts instead of wallets: staking or "daycare" contracts, marketplaces.
// The script lists every contract holder grouped by its code. When a group is a custody contract
// that keeps its depositor in owner() (Roostr Daycare does), pass any one of them with
// --resolve-like and its tokens are counted for that owner() wallet. Contracts you don't want on
// the list go in --exclude. Writes "address,count".
const fs = require('fs');
const path = require('path');
const { args, ethers } = require('./lib');

const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11';
const mc = new ethers.Interface(['function aggregate3((address target, bool allowFailure, bytes callData)[] calls) payable returns ((bool success, bytes returnData)[] returnData)']);
const nft = new ethers.Interface(['function ownerOf(uint256 tokenId) view returns (address)', 'function owner() view returns (address)']);
const SKIP = new Set(['0x0000000000000000000000000000000000000000', '0x000000000000000000000000000000000000dead']);

async function retry(fn, tries = 4) {
  for (let i = 0; ; i++) {
    try { return await fn(); } catch (e) { if (i >= tries - 1) throw e; await new Promise((r) => setTimeout(r, 600 * 2 ** i)); }
  }
}

// Calls `fn` on every target with Multicall3 when possible; returns decoded results or null on failure.
async function multi(provider, blockTag, useMc, items, encode, decode, batch = 250) {
  const out = new Array(items.length).fill(null);
  if (useMc) {
    for (let i = 0; i < items.length; i += batch) {
      const part = items.slice(i, i + batch);
      const data = mc.encodeFunctionData('aggregate3', [part.map((it) => ({ target: it.target, allowFailure: true, callData: encode(it) }))]);
      const raw = await retry(() => provider.call({ to: MULTICALL3, data, blockTag }));
      mc.decodeFunctionResult('aggregate3', raw)[0].forEach((r, j) => { if (r.success && r.returnData !== '0x') { try { out[i + j] = decode(r.returnData); } catch (e) { /* not an address */ } } });
      if ((i / batch) % 10 === 9) process.stderr.write(`  ${Math.min(i + batch, items.length)} of ${items.length}\n`);
    }
    return out;
  }
  let next = 0;
  await Promise.all(Array.from({ length: 16 }, async () => {
    while (next < items.length) {
      const k = next++;
      try { out[k] = decode(await retry(() => provider.call({ to: items[k].target, data: encode(items[k]), blockTag }), 2)); } catch (e) { /* reverted: no owner */ }
    }
  }));
  return out;
}

(async () => {
  const a = args();
  if (!a.rpc || !a.contract || !a.to) {
    console.error('Usage: node scripts/snapshot-holders.js --rpc <url> --contract <address> --from 1 --to <last id> [--block <n>] [--out file.csv] [--exclude 0x..,0x..] [--resolve-like 0x..]');
    process.exit(1);
  }
  // small JSON-RPC batches: public RPCs reject big ones
  const provider = new ethers.JsonRpcProvider(a.rpc, undefined, { batchMaxCount: 10 });
  const contract = ethers.getAddress(a.contract);
  const blockTag = a.block ? Number(a.block) : await provider.getBlockNumber();
  const from = Number(a.from || 1), to = Number(a.to);
  const exclude = new Set(String(a.exclude || '').split(',').filter(Boolean).map((x) => x.toLowerCase()));
  const useMc = (await provider.getCode(MULTICALL3, blockTag)) !== '0x';

  // 1. owner of every token
  const ids = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const owners = await multi(provider, blockTag, useMc, ids.map((id) => ({ target: contract, id })),
    (it) => nft.encodeFunctionData('ownerOf', [it.id]), (d) => nft.decodeFunctionResult('ownerOf', d)[0].toLowerCase());
  const counts = new Map();
  let missing = 0;
  owners.forEach((o) => { if (!o) missing++; else counts.set(o, (counts.get(o) || 0) + 1); });

  // 2. which holders are contracts, grouped by code
  const holders = [...counts.keys()];
  const codes = new Array(holders.length);
  let nextHolder = 0;
  await Promise.all(Array.from({ length: Number(a.concurrency || 6) }, async () => {
    while (nextHolder < holders.length) { const k = nextHolder++; codes[k] = await retry(() => provider.getCode(holders[k], blockTag), 6); }
  }));
  const groups = new Map();
  holders.forEach((h, i) => {
    if (codes[i] === '0x') return;
    const hash = ethers.keccak256(codes[i]);
    if (!groups.has(hash)) groups.set(hash, []);
    groups.get(hash).push(h);
  });

  // 3. custody contracts like Roostr Daycare: count their tokens for the depositor in owner()
  let resolvedTokens = 0, resolvedContracts = 0;
  if (a['resolve-like']) {
    const like = ethers.keccak256(await provider.getCode(ethers.getAddress(a['resolve-like']), blockTag));
    const custody = groups.get(like) || [];
    const depositors = await multi(provider, blockTag, useMc, custody.map((c) => ({ target: c })),
      () => nft.encodeFunctionData('owner'), (d) => nft.decodeFunctionResult('owner', d)[0].toLowerCase());
    custody.forEach((c, i) => {
      const who = depositors[i];
      if (!who || SKIP.has(who)) return;
      const n = counts.get(c);
      counts.delete(c);
      counts.set(who, (counts.get(who) || 0) + n);
      resolvedTokens += n; resolvedContracts++;
    });
    groups.delete(like);
  }

  // 4. write the list
  let skipped = 0;
  for (const h of [...counts.keys()]) if (SKIP.has(h) || exclude.has(h)) { skipped += counts.get(h); counts.delete(h); }
  const rows = [...counts.entries()].sort((x, y) => y[1] - x[1]);
  const out = path.resolve(a.out || 'snapshot/holders.csv');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, 'address,count\n' + rows.map(([h, n]) => `${ethers.getAddress(h)},${n}`).join('\n') + '\n');

  const total = rows.reduce((s, r) => s + r[1], 0);
  console.log(`Block ${blockTag}: ${rows.length} holders, ${total} tokens counted, ${skipped} skipped (excluded or burn address), ${missing} ids without an owner.`);
  if (a['resolve-like']) console.log(`Custody contracts like ${a['resolve-like']}: ${resolvedContracts} resolved to their depositors, ${resolvedTokens} tokens.`);
  const left = [...groups.entries()].map(([hash, list]) => ({ hash, list: list.filter((c) => counts.has(c)) })).filter((g) => g.list.length);
  if (left.length) {
    console.log('Contracts still on the list (check them; pass custody contracts with --resolve-like and others with --exclude):');
    for (const g of left.sort((x, y) => y.list.length - x.list.length)) {
      const tokens = g.list.reduce((s, c) => s + counts.get(c), 0);
      console.log(`  ${g.list.length} contract(s) with code ${g.hash.slice(0, 10)}…, ${tokens} tokens, e.g. ${ethers.getAddress(g.list[0])}`);
    }
  }
  console.log(`Largest holders: ${rows.slice(0, 5).map(([h, n]) => `${ethers.getAddress(h)} (${n})`).join(', ')}`);
  console.log(`Wrote ${path.relative(process.cwd(), out)}`);
})().catch((e) => { console.error(e.shortMessage || e.message); process.exit(1); });
