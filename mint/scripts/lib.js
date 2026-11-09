// Shared helpers for the deploy, admin and snapshot scripts.
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const ROOT = path.resolve(__dirname, '..');

// --name value pairs and bare words; flags without a value become true.
function args(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const next = argv[i + 1];
      out[a.slice(2)] = next !== undefined && !next.startsWith('--') ? argv[++i] : true;
    } else out._.push(a);
  }
  return out;
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

function artifact() {
  const file = path.join(ROOT, 'artifacts/contracts/FeatherIronNFT.sol/FeatherIronNFT.json');
  if (!fs.existsSync(file)) throw new Error('Compile the contract first: npm run compile');
  return readJson(file);
}

function provider() {
  const rpc = process.env.RH_RPC_URL;
  if (!rpc) throw new Error('Set RH_RPC_URL to the RPC address of the RH chain.');
  return new ethers.JsonRpcProvider(rpc);
}

function signer() {
  const key = process.env.DEPLOYER_KEY;
  if (!key) throw new Error('Set DEPLOYER_KEY to the private key of the owner wallet. Never commit it.');
  return new ethers.Wallet(key, provider());
}

const webDir = (a) => path.resolve(a['web-dir'] || path.join(ROOT, 'web'));

module.exports = { ROOT, args, readJson, writeJson, artifact, provider, signer, webDir, ethers };
