// Turns the holder snapshot into the free-claim list.
//
//   node scripts/build-claims.js snapshot/roostr.csv [--out-dir web/claims]
//
// Each holder gets one free mint per Roostr held. For the mint page it writes 256 small files,
// claims/00.json .. claims/ff.json, grouped by the first two hex digits of the address, each mapping
// address -> { allowance, proof }. Every file exists, so a wallet that is not on the list gets an
// empty answer instead of an error. claims/index.json holds the root and total for admin.js set-claim.
const fs = require('fs');
const path = require('path');
const { StandardMerkleTree } = require('@openzeppelin/merkle-tree');
const { ROOT, args, writeJson, ethers } = require('./lib');

const a = args();
const csv = a._[0];
if (!csv) { console.error('Usage: node scripts/build-claims.js <snapshot.csv> [--out-dir web/claims]'); process.exit(1); }

const allowances = new Map();
const bad = [];
fs.readFileSync(csv, 'utf8').split(/\r?\n/).forEach((line, i) => {
  const [addr, count] = line.split(',').map((x) => (x || '').trim());
  if (!addr || /^address$/i.test(addr)) return;
  let checksummed;
  try { checksummed = ethers.getAddress(addr); } catch (e) { bad.push(`line ${i + 1}: bad address ${addr}`); return; }
  const n = Number(count);
  if (!Number.isInteger(n) || n <= 0) { bad.push(`line ${i + 1}: bad count ${count}`); return; }
  allowances.set(checksummed, (allowances.get(checksummed) || 0) + n);
});
if (bad.length) { console.error('Fix the snapshot first:\n' + bad.slice(0, 20).join('\n')); process.exit(1); }
if (!allowances.size) { console.error('The snapshot has no holders.'); process.exit(1); }

const values = [...allowances.entries()].map(([addr, n]) => [addr, String(n)]);
const tree = StandardMerkleTree.of(values, ['address', 'uint256']);
const outDir = path.resolve(a['out-dir'] || path.join(ROOT, 'web/claims'));
fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) if (/^(0x[0-9a-f]{40}|[0-9a-f]{2})\.json$/.test(f)) fs.unlinkSync(path.join(outDir, f));
const buckets = {};
for (let b = 0; b < 256; b++) buckets[b.toString(16).padStart(2, '0')] = {};
let reserved = 0n;
for (const [i, v] of tree.entries()) {
  reserved += BigInt(v[1]);
  const addr = v[0].toLowerCase();
  buckets[addr.slice(2, 4)][addr] = { allowance: v[1], proof: tree.getProof(i) };
}
for (const [b, data] of Object.entries(buckets)) fs.writeFileSync(path.join(outDir, `${b}.json`), JSON.stringify(data));
writeJson(path.join(outDir, 'index.json'), { root: tree.root, reserved: reserved.toString(), holders: values.length, source: path.basename(csv), createdAt: new Date().toISOString() });
console.log(`${values.length} holders, ${reserved} free mints in total.`);
console.log(`Merkle root ${tree.root}`);
console.log(`Wrote 257 files to ${path.relative(process.cwd(), outDir)}. Next: node scripts/admin.js set-claim`);
