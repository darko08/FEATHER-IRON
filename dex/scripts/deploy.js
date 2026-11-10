// Deploys the Estate exchange for one world and seeds its pools from dex.config.json.
//
//   DEPLOYER_KEY=<owner key> node scripts/deploy.js --network robinhood-testnet [--config dex.config.json] [--out-dir .]
//
// --network robinhood for mainnet. RH_RPC_URL overrides the public RPC (for example with an Alchemy URL).
//
// "tickets" is the Feather & Iron NFT address (from the mint), "signer" is the address of the
// game server's signing key. The deploying wallet becomes the owner. Writes dex.deployed.json.
const path = require('path');
const { ROOT, readJson, writeJson, artifact, network, signer, resourceId, deployedFile, ethers } = require('./lib');

const arg = (name) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : undefined; };

(async () => {
  const cfg = readJson(path.resolve(arg('config') || path.join(ROOT, 'dex.config.json')));
  const problems = [];
  for (const k of ['tickets', 'signer']) if (!ethers.isAddress(cfg[k]) || cfg[k] === ethers.ZeroAddress) problems.push(`${k}: put in the real address`);
  if (problems.length) { console.error('Fix dex.config.json first:\n- ' + problems.join('\n- ')); process.exit(1); }
  const preset = network(arg('network'));
  const wallet = signer(arg('network'));
  const net = await wallet.provider.getNetwork();
  if (preset && Number(net.chainId) !== preset.chainId) { console.error(`The RPC is chain ${net.chainId}, not ${preset.chainName} (${preset.chainId}). Check RH_RPC_URL.`); process.exit(1); }
  const art = artifact();
  console.log(`Deploying the Estate exchange to chain ${net.chainId} from ${wallet.address} ...`);
  const ex = await new ethers.ContractFactory(art.abi, art.bytecode, wallet)
    .deploy(cfg.tickets, cfg.signer, ethers.parseEther(String(cfg.tradeFeeEth)), cfg.poolFeeBps, cfg.maxTradeBps);
  await ex.waitForDeployment();
  const address = await ex.getAddress();
  const block = (await ex.deploymentTransaction().wait()).blockNumber;
  let nonce = await wallet.getNonce();
  for (const [name, p] of Object.entries(cfg.pools || {})) {
    const tx = await ex.setPool(resourceId(name), p.eggs, p.goods, { nonce: nonce++ });
    await tx.wait();
    console.log(`Pool ${name}: ${p.eggs} eggs and ${p.goods} ${name} (1 egg = ${(p.goods / p.eggs).toFixed(1)})`);
  }
  writeJson(deployedFile(arg('out-dir')), { address, chainId: Number(net.chainId), network: preset ? preset.name : null, deployBlock: block, abi: art.abi });
  console.log(`Deployed at ${address} in block ${block}. Wrote dex.deployed.json (the game server reads it).`);
})().catch((e) => { console.error(e.shortMessage || e.message); process.exit(1); });
