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
function provider() {
  if (!process.env.RH_RPC_URL) throw new Error('Set RH_RPC_URL to the Robinhood Chain RPC address.');
  return new ethers.JsonRpcProvider(process.env.RH_RPC_URL);
}
function signer() {
  if (!process.env.DEPLOYER_KEY) throw new Error('Set DEPLOYER_KEY to the private key of the owner wallet. Never commit it.');
  return new ethers.Wallet(process.env.DEPLOYER_KEY, provider());
}
function resourceId(name) {
  const id = TOKENS[String(name || '').toUpperCase()];
  if (!id) throw new Error(`Unknown resource ${name}. Use one of: ${Object.keys(TOKENS).filter((k) => TOKENS[k]).join(', ')}`);
  return id;
}
const deployedFile = (dir) => path.resolve(dir || ROOT, 'dex.deployed.json');

module.exports = { ROOT, readJson, writeJson, artifact, provider, signer, resourceId, deployedFile, ethers, TOKENS };
