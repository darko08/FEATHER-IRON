# Feather & Iron: the Estate exchange

The DEX where players trade game resources for eggs, on Robinhood Chain. One exchange per game world.

## How it works

Every pool holds eggs against one resource (Grain, Grit, Oil) and prices trades like Uniswap v2: a constant product, a 0.3% pool fee that stays in the pool, and no trade bigger than 5% of the paying side. Grain for Oil goes through eggs in one trade.

Resources and eggs never become tokens. A trade runs like this:

1. The player asks the game for a trade, for example 500 Grain for eggs.
2. The game server checks the Market limit, takes the 500 Grain out of the coop and signs a permit (EIP-712) with a fresh nonce and a short deadline.
3. The player sends `trade(permit, signature, minOut)` from the wallet that holds the account's Feather & Iron NFT, with the flat ETH fee.
4. The contract checks the permit, prices the trade from the pools, updates them and emits `Traded`.
5. The game server sees `Traded` and credits the eggs to the account. If the deadline passes and `nonceUsed(nonce)` is still false, it returns the 500 Grain.

Why no tokens:

- **No pushing:** goods can't be sent between wallets, so nobody can feed another account through the exchange. Every trade is against the pools.
- **No safe outside the game:** nothing sits in a wallet where raids can't reach it.
- **No other pools:** without a token, nobody can open an EGG/ETH or Grain/USDC pool elsewhere, so eggs can't be bought for money.
- **Less to break:** no approvals, no token supply to protect, and a small contract.

The ETH fee is the revenue: every trade pays `tradeFee` (0.0002 ETH by default), which stays in the contract until the owner withdraws it to the treasury.

Eggs inside the pools are counted in millionths (`EGG_UNIT`), so a Grain-for-Oil trade loses nothing to rounding in the middle. Players always pay and receive whole eggs.

## Files

```
contracts/EstateExchange.sol   the exchange
server/permits.js              for the game server: sign permits, watch trades (pollTrades)
scripts/deploy.js              deploys and seeds the pools from dex.config.json, writes dex.deployed.json
scripts/admin.js               status, pools, fees, signer, pause, withdraw
test/                          contract tests (npm test)
e2e/run.js                     the scripts on a local chain: deploy, sign, trade, watch, withdraw
```

## Setup and tests

```bash
cd dex
npm install
npm run compile
npm test
node e2e/run.js
```

## Launch

1. Deploy the Feather & Iron NFT first (`mint/`); its address goes into `tickets`.
2. Make a signing key for the game server. Its address goes into `signer`; the key stays on the server only.
3. Check `dex.config.json`: the ETH fee, the pool fee, the largest trade and the starting pools. The defaults price 1 egg at 220 Grain, 110 Grit and 56 Oil with 5,000 eggs in each pool. Cracking an egg in the game gives 200 Grain, 100 Grit or 50 Oil, so arbitrage keeps the pool price above that.
4. Deploy, on the testnet first:

```bash
export RH_RPC_URL=<robinhood chain rpc>
export DEPLOYER_KEY=<private key of the owner wallet>   # never commit it or paste it anywhere
npm run deploy
node scripts/admin.js status
```

5. The game server reads `dex.deployed.json` (address, chain id, ABI, deploy block), signs permits with `signPermit()` and follows trades with `pollTrades()`.

Team commands: `node scripts/admin.js set-pool GRAIN <eggs> <grain>`, `fees <eth> <pool bps> <max trade bps>`, `signer <address>`, `pause`, `unpause`, `withdraw <treasury>`.

## Safety

- The contract uses OpenZeppelin building blocks and has tests, but no paid audit. Test on the testnet first.
- The server's signing key can create trades. If it leaks: `pause`, then `signer <new address>`, then `unpause`. Permits expire, so set short deadlines (10 minutes is plenty).
- Only the holder of the account's NFT can use a permit, and each nonce works once.
- The owner sets the pools. That's a trust point, like any game operator's; every change emits `PoolSet`, so players can see it.
- The contract targets the Cancun EVM (OpenZeppelin 5 needs it). If the chain rejects the deploy, pin `@openzeppelin/contracts` to 5.0.2 and set `evmVersion` to `shanghai`.
