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

## Costs

Only gas: deploying the contract and the team's admin transactions. Holders pay the small network fee of their own claim or mint. Everything here is open source and the page is static, so it runs on any web server.

## Setup

Node 18 or newer.

```bash
cd mint
npm install
npm run compile
npm test
```

## Launch, step by step

Do the whole run on the RH chain's testnet first.

**1. Snapshot of Roostr holders.** Pick the snapshot block and run it against the chain where Roostr lives:

```bash
node scripts/snapshot-holders.js --rpc <roostr chain rpc> --contract <roostr address> --from 1 --to <last token id> --block <snapshot block> --out snapshot/roostr.csv
```

Look at the largest holders it prints. If one of them is a marketplace or escrow contract, those tokens belong to the people who listed them: run again with `--exclude <address>` and add those holders by hand if you want to.

**2. Free-claim list.**

```bash
npm run claims -- snapshot/roostr.csv
```

This writes `web/claims/` (256 small files plus `index.json` with the root and total).

**3. Settings.** In `deploy.config.json` set the treasury wallet (`royaltyReceiver`, also receives royalties), your domain in `placeholderURI`, the price, supply and per-transaction limit. In `web/config.json` set the chain name, RPC address, block explorer and currency. Upload `metadata/unrevealed.json` and `metadata/unrevealed.webp` to `https://<your domain>/metadata/` and change `YOUR-DOMAIN` inside the JSON.

**4. Deploy.** Use a wallet made only for deploying; it becomes the owner.

```bash
export RH_RPC_URL=<rh chain rpc>
export DEPLOYER_KEY=<private key of the owner wallet>   # never commit it or paste it anywhere
npm run deploy
```

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
- The contract targets the Cancun EVM (OpenZeppelin 5 needs it). If the RH chain rejects the deploy, pin `@openzeppelin/contracts` to 5.0.2 and set `evmVersion` to `shanghai` in `hardhat.config.js`.

## Tests

```bash
npm test          # contract
node e2e/run.js   # whole flow on a local chain with a test wallet in Chromium (needs Playwright)
```
