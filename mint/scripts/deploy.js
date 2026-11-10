// Deploys the collection with the settings in deploy.config.json.
//
//   DEPLOYER_KEY=<owner private key> node scripts/deploy.js --network robinhood-testnet [--config deploy.config.json] [--web-dir web]
//
// --network robinhood for mainnet. RH_RPC_URL overrides the public RPC (for example with an Alchemy URL).
//
// The deploying wallet becomes the owner. Afterwards web/config.json holds the contract
// address and web/abi.json the interface, so the mint page is ready to upload.
const path = require('path');
const { ROOT, args, readJson, writeJson, artifact, network, signer, webDir, ethers } = require('./lib');

(async () => {
  const a = args();
  const cfg = readJson(path.resolve(a.config || path.join(ROOT, 'deploy.config.json')));
  const problems = [];
  if (!ethers.isAddress(cfg.royaltyReceiver) || cfg.royaltyReceiver === ethers.ZeroAddress) problems.push('royaltyReceiver: put in the treasury wallet that receives royalties');
  if (/YOUR-DOMAIN/.test(cfg.placeholderURI || '')) problems.push('placeholderURI: put in your domain');
  if (!(Number(cfg.maxSupply) > 0)) problems.push('maxSupply must be above 0');
  if (!(Number(cfg.maxPerTx) > 0)) problems.push('maxPerTx must be above 0');
  if (!(Number(cfg.royaltyBps) >= 0 && Number(cfg.royaltyBps) <= 1000)) problems.push('royaltyBps: 0 to 1000 (1000 = 10%)');
  if (problems.length) { console.error('Fix deploy.config.json first:\n- ' + problems.join('\n- ')); process.exit(1); }

  const preset = network(a);
  const wallet = signer(a);
  const net = await wallet.provider.getNetwork();
  if (preset && Number(net.chainId) !== preset.chainId) { console.error(`The RPC is chain ${net.chainId}, not ${preset.chainName} (${preset.chainId}). Check RH_RPC_URL.`); process.exit(1); }
  const art = artifact();
  const factory = new ethers.ContractFactory(art.abi, art.bytecode, wallet);
  console.log(`Deploying "${cfg.name}" to chain ${net.chainId} from ${wallet.address} ...`);
  const nft = await factory.deploy(cfg.name, cfg.symbol, cfg.maxSupply, ethers.parseEther(String(cfg.priceEth)), cfg.maxPerTx, cfg.placeholderURI, cfg.royaltyReceiver, cfg.royaltyBps);
  await nft.waitForDeployment();
  const address = await nft.getAddress();

  const dir = webDir(a);
  const webCfgFile = path.join(dir, 'config.json');
  const webCfg = readJson(webCfgFile);
  webCfg.contract = address;
  webCfg.chainId = Number(net.chainId);
  if (preset) Object.assign(webCfg, { chainName: preset.chainName, rpcUrl: preset.rpcUrl, explorer: preset.explorer, currency: preset.currency });
  writeJson(webCfgFile, webCfg);
  writeJson(path.join(dir, 'abi.json'), art.abi);
  console.log(`Deployed at ${address}`);
  if (webCfg.explorer) console.log(`${webCfg.explorer.replace(/\/$/, '')}/address/${address}`);
  console.log(`Updated ${path.relative(process.cwd(), webCfgFile)} and abi.json. Next: node scripts/admin.js commit`);
})().catch((e) => { console.error(e.shortMessage || e.message); process.exit(1); });
