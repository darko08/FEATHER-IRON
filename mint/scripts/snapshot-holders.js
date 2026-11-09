// Snapshot of who holds an ERC-721 collection (for the Roostr free claim).
//
//   node scripts/snapshot-holders.js --rpc <rpc url> --contract <address> --from 1 --to 10000 \
//     [--block <block number>] [--out snapshot/roostr.csv] [--exclude 0xabc,0xdef]
//
// Asks ownerOf for every token id in the range at one block, so the list doesn't shift while it runs.
// Writes "address,count". Check the top of the list for marketplace or escrow contracts and pass
// them with --exclude: tokens listed for sale there belong to the people who listed them.
const fs = require('fs');
const path = require('path');
const { args, ethers } = require('./lib');

const ABI = ['function ownerOf(uint256 tokenId) view returns (address)'];
const SKIP = new Set(['0x0000000000000000000000000000000000000000', '0x000000000000000000000000000000000000dead']);

async function withRetry(fn, tries = 4) {
  for (let i = 0; ; i++) {
    try { return await fn(); } catch (e) {
      const reverted = e.code === 'CALL_EXCEPTION' || /revert|nonexistent|invalid token/i.test(e.message || '');
      if (reverted || i >= tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 500 * 2 ** i));
    }
  }
}

(async () => {
  const a = args();
  if (!a.rpc || !a.contract || !a.to) {
    console.error('Usage: node scripts/snapshot-holders.js --rpc <url> --contract <address> --from 1 --to <last id> [--block <n>] [--out file.csv] [--exclude 0x..,0x..]');
    process.exit(1);
  }
  const provider = new ethers.JsonRpcProvider(a.rpc);
  const nft = new ethers.Contract(ethers.getAddress(a.contract), ABI, provider);
  const block = a.block ? Number(a.block) : await provider.getBlockNumber();
  const from = Number(a.from || 1), to = Number(a.to);
  const exclude = new Set(String(a.exclude || '').split(',').filter(Boolean).map((x) => x.toLowerCase()));
  const counts = new Map();
  let done = 0, missing = 0, skipped = 0;
  const ids = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const workers = Array.from({ length: Number(a.concurrency || 20) }, async () => {
    while (ids.length) {
      const id = ids.shift();
      try {
        const owner = (await withRetry(() => nft.ownerOf(id, { blockTag: block }))).toLowerCase();
        if (SKIP.has(owner) || exclude.has(owner)) skipped++;
        else counts.set(owner, (counts.get(owner) || 0) + 1);
      } catch (e) { missing++; }
      if (++done % 500 === 0) process.stderr.write(`  ${done} tokens checked\n`);
    }
  });
  await Promise.all(workers);
  const rows = [...counts.entries()].sort((x, y) => y[1] - x[1]);
  const out = path.resolve(a.out || 'snapshot/holders.csv');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, 'address,count\n' + rows.map(([addr, n]) => `${ethers.getAddress(addr)},${n}`).join('\n') + '\n');
  const total = rows.reduce((s, r) => s + r[1], 0);
  console.log(`Block ${block}: ${rows.length} holders, ${total} tokens counted, ${skipped} skipped (excluded or burn address), ${missing} ids without an owner.`);
  console.log(`Largest holders: ${rows.slice(0, 5).map(([addr, n]) => `${addr} (${n})`).join(', ')}`);
  console.log(`Wrote ${path.relative(process.cwd(), out)}`);
})().catch((e) => { console.error(e.shortMessage || e.message); process.exit(1); });
