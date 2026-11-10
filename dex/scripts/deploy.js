// Deploys the Estate exchange for one world and seeds its pools from dex.config.json.
//
//   RH_RPC_URL=<rpc> DEPLOYER_KEY=<owner key> node scripts/deploy.js [--config dex.config.json] [--out-dir .]
//
// "tickets" is the Feather & Iron NFT address (from the mint), "signer" is the address of the
// game server's signing key. The deploying wallet becomes the owner. Writes dex.deployed.json.
const path = require('path');
const { ROOT, readJson, writeJson, artifact, signer, resourceId, deployedFile, ethers } = require('./lib');

const arg = (name) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : undefined; };

(async () => {
  const cfg = readJson(path.resolve(arg('config') || path.join(ROOT, 'dex.config.json')));
  const problems = [];
  for (const k of ['tickets', 'signer']) if (!ethers.isAddress(cfg[k]) || cfg[k] === ethers.ZeroAddress) problems.push(`${k}: put in the real address`);
  if (problems.length) { console.error('Fix dex.config.json first:\n- ' + problems.join('\n- ')); process.exit(1); }
  const wallet = signer();
  const net = await wallet.provider.getNetwork();
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
  writeJson(deployedFile(arg('out-dir')), { address, chainId: Number(net.chainId), deployBlock: block, abi: art.abi });
  console.log(`Deployed at ${address} in block ${block}. Wrote dex.deployed.json (the game server reads it).`);
})().catch((e) => { console.error(e.shortMessage || e.message); process.exit(1); });
