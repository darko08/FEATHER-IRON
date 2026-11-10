# Feather & Iron mint

The NFT collection that works as the ticket into the game: one NFT is one account in World 1.

- **Roostr holders mint free:** one ticket for every Roostr in the snapshot. They can claim in several transactions.
- **Public mint:** everything that isn't claimed is sold for ETH. While the claim is open, the unclaimed tickets stay held back for holders. Closing the claim releases them to the sale.
- **Random traits, fair reveal:** until the reveal every token shows the same sealed ticket. At the reveal a one-time random offset decides which metadata file each token gets, using a secret the team commits before the first mint.

```
contracts/FeatherIronNFT.sol   the collection (OpenZeppelin ERC-721, ERC-2981 royalties)
scripts/snapshot-holders.js    who holds Roostr NFTs at a given block
scripts/build-claims.js        snapshot -> free-claim list (Merkle root + files for the mint page)
scripts/deploy.js              deploys with deploy.config.json, writes web/config.json and web/abi.json
scripts/admin.js               team commands: claim list, commit, open/close, price, reveal, withdraw
web/                           the mint page: upload this folder to the VPS
metadata/                      sealed-ticket metadata and image shown before the reveal
test/                          contract tests (npm test)
e2e/run.js                     whole flow on a local chain, clicked through in a browser
```

## Robinhood Chain

| | Mainnet | Testnet |
|---|---|---|
| `--network` | `robinhood` | `robinhood-testnet` |
| Chain ID | 4663 | 46630 |
| Public RPC | https://rpc.mainnet.chain.robinhood.com | https://rpc.testnet.chain.robinhood.com |
| Explorer | https://robinhoodchain.blockscout.com | https://explorer.testnet.chain.robinhood.com |
| Gas | ETH | Sepolia ETH, free from https://faucet.testnet.chain.robinhood.com |

ETH reaches Robinhood Chain through the Arbitrum bridge (https://portal.arbitrum.io/bridge?destinationChain=robinhood-chain&sourceChain=ethereum). The public RPCs are rate-limited; for launch day, Robinhood recommends a private RPC such as Alchemy, which you set with `RH_RPC_URL`. Both networks run the Cancun EVM, which this contract needs.

## Costs

Only gas: deploying the contract and the team's admin transactions. Deploying takes about 2.55 million gas; at mainnet's gas price in November 2026 (0.02 gwei) that is about 0.00005 ETH. Holders pay the small network fee of their own claim or mint. Everything here is open source and the page is static, so it runs on any web server.

## Setup

Node 18 or newer.

```bash
cd mint
npm install
npm run compile
npm test
```

## Launch, step by step

Do the whole run on the Robinhood Chain testnet first.

**1. Snapshot of Roostr holders.** Roostr lives on Avalanche C-Chain: contract `0xCf91B99548b1C17dD1095c0680E20de380635e20`, 12,000 tokens with ids 1 to 12000. Pick the snapshot block and run:

```bash
node scripts/snapshot-holders.js --rpc https://api.avax.network/ext/bc/C/rpc \
  --contract 0xCf91B99548b1C17dD1095c0680E20de380635e20 --from 1 --to 12000 \
  --block <snapshot block> --resolve-like 0xE8516dB065b0D3ab5FB1E4b209955A1A172D6DfC \
  --out snapshot/roostr.csv
```

Roostrs in Roostr Daycare sit in small custody contracts (55 of them held 355 Roostrs in November 2026). `--resolve-like` takes any one of them and counts all of their Roostrs for the wallet that put them there (`owner()` of each contract). The script then lists the contracts still on the list; in the November 2026 test, four held nine Roostrs. If one is a marketplace or escrow contract, run again with `--exclude <address>`. A smart-contract wallet that belongs to a holder can stay.

The test run at block 99,893,884 gave 1,900 holders and 12,000 free mints, in 42 seconds.

**2. Free-claim list.**

```bash
npm run claims -- snapshot/roostr.csv
```

This writes `web/claims/` (256 small files plus `index.json` with the root and total).

**3. Settings.** In `deploy.config.json` set the treasury wallet (`royaltyReceiver`, also receives royalties), your domain in `placeholderURI`, the price, supply and per-transaction limit. Upload `metadata/unrevealed.json` and `metadata/unrevealed.webp` to `https://<your domain>/metadata/` and change `YOUR-DOMAIN` inside the JSON.

**4. Deploy.** Use a wallet made only for deploying; it becomes the owner.

```bash
export DEPLOYER_KEY=<private key of the owner wallet>   # never commit it or paste it anywhere
npm run deploy -- --network robinhood-testnet           # later: --network robinhood
```

The deploy fills `web/config.json` with the contract, chain, RPC and explorer, so the page and the admin commands below know where to look.

**5. Prepare and open.**

```bash
node scripts/admin.js set-claim     # puts the Roostr list on the contract
node scripts/admin.js commit        # makes the reveal secret, saves it to secret.txt
```

Back up the secret it prints (password manager). Without it the collection can never be revealed. Then upload the `web/` folder to the VPS and open:

```bash
node scripts/admin.js open-claim
node scripts/admin.js open-sale      # can wait until the holders had their time
node scripts/admin.js close-claim    # releases unclaimed tickets to the public mint
node scripts/admin.js status         # anytime
```

Optional, before the first mint: `node scripts/admin.js provenance <folder with 1.json .. N.json>` publishes a hash of the final metadata set, so anyone can check later that it wasn't changed.

**6. Reveal.** Put the final metadata on the VPS as `1.json` to `N.json` (one per token, with the traits) and run:

```bash
node scripts/admin.js reveal https://<your domain>/metadata/
```

Token N then reads `https://<your domain>/metadata/<metadataIndex(N)>.json`. The game reads traits through the same `metadataIndex`. If the files move to another server later, `setBaseURI` points the contract there.

**7. Money.** `node scripts/admin.js withdraw <treasury address>` sends the sale ETH out of the contract.

## On the VPS

Any static server works. For nginx, let marketplaces read the metadata and keep the live files fresh:

```nginx
location /metadata/ { add_header Access-Control-Allow-Origin *; }
location ~ ^/mint/(config\.json|claims/) { add_header Cache-Control "no-cache"; }
```

## Safety

- The contract is standard OpenZeppelin code with a small amount of mint logic and has tests, but no paid audit. Run everything on the testnet first and keep the owner key offline when you don't need it. Later, `transferOwnership` can move ownership to a hardware wallet or a multisig.
- `secret.txt`, `.env` and `snapshot/` are in `.gitignore`. Keep them that way.
- The contract targets the Cancun EVM (OpenZeppelin 5 needs it). Robinhood Chain runs it: a deploy estimate passed on both networks in November 2026.

## Tests

```bash
npm test          # contract
node e2e/run.js   # whole flow on a local chain with a test wallet in Chromium (needs Playwright)
```
