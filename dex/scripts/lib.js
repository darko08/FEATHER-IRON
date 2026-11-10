// Shared helpers for the exchange scripts. RPC and keys come from env vars, never from files.
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const { TOKENS } = require('../server/permits');

const ROOT = path.resolve(__dirname, '..');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');

function artifact() {
  const file = path.join(ROOT, 'artifacts/contracts/EstateExchange.sol/EstateExchange.json');
  if (!fs.existsSync(file)) throw new Error('Compile the contract first: npm run compile');
  return readJson(file);
}
// Robinhood Chain settings: robinhood-testnet or robinhood (see networks.json).
const NETWORKS = readJson(path.join(ROOT, 'networks.json'));
function network(name) {
  if (!name) return null;
  if (!NETWORKS[name]) throw new Error(`Unknown network "${name}". Use one of: ${Object.keys(NETWORKS).join(', ')}`);
  return { name, ...NETWORKS[name] };
}
// RPC from RH_RPC_URL (for example a private Alchemy URL), else the network's public RPC.
function provider(name) {
  const net = network(name);
  const rpc = process.env.RH_RPC_URL || (net && net.rpcUrl);
  if (!rpc) throw new Error('Pick the chain with --network robinhood-testnet (or robinhood), or set RH_RPC_URL.');
  return new ethers.JsonRpcProvider(rpc);
}
function signer(name) {
  if (!process.env.DEPLOYER_KEY) throw new Error('Set DEPLOYER_KEY to the private key of the owner wallet. Never commit it.');
  return new ethers.Wallet(process.env.DEPLOYER_KEY, provider(name));
}
function resourceId(name) {
  const id = TOKENS[String(name || '').toUpperCase()];
  if (!id) throw new Error(`Unknown resource ${name}. Use one of: ${Object.keys(TOKENS).filter((k) => TOKENS[k]).join(', ')}`);
  return id;
}
const deployedFile = (dir) => path.resolve(dir || ROOT, 'dex.deployed.json');

module.exports = { ROOT, NETWORKS, readJson, writeJson, artifact, network, provider, signer, resourceId, deployedFile, ethers, TOKENS };
