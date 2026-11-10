// What the game server needs to work with the Estate exchange.
//
// Flow for one trade:
//   1. The player asks the game to trade (for example 500 Grain for eggs).
//   2. The server checks the Market limit, takes the 500 Grain out of the coop, stores a pending
//      trade with a new nonce, and signs a permit with signPermit().
//   3. The page sends exchange.trade(permit, signature, minOut) from the player's wallet with the ETH fee.
//   4. pollTrades() sees the Traded event and the server credits amountOut to the account.
//   5. If the deadline passes and nonceUsed(nonce) is still false, the server returns the 500 Grain.
//
// The signer key is a hot key on the game server: keep it out of the repository, and if it leaks,
// pause the exchange and set a new signer.
const { ethers } = require('ethers');

const TOKENS = { EGG: 0, GRAIN: 1, GRIT: 2, OIL: 3 };

const PERMIT_TYPES = {
  Permit: [
    { name: 'trader', type: 'address' },
    { name: 'account', type: 'uint256' },
    { name: 'tokenIn', type: 'uint8' },
    { name: 'tokenOut', type: 'uint8' },
    { name: 'amountIn', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
};

const domain = (chainId, exchange) => ({ name: 'Feather & Iron Exchange', version: '1', chainId: Number(chainId), verifyingContract: exchange });

/** A fresh random nonce for a permit. Store it with the pending trade. */
const newNonce = () => BigInt(ethers.hexlify(ethers.randomBytes(32)));

/**
 * Sign a trade permit. Take what the player pays out of the game before calling this.
 * @param {ethers.Wallet} wallet  the server's signer key
 * @param {{chainId: number|bigint, exchange: string}} where
 * @param {{trader: string, account: bigint|number, tokenIn: number, tokenOut: number, amountIn: bigint|number, nonce: bigint, deadline: bigint|number}} permit
 */
function signPermit(wallet, where, permit) {
  return wallet.signTypedData(domain(where.chainId, where.exchange), PERMIT_TYPES, permit);
}

/**
 * Watch for trades from a block on. Calls onTrade({ account, trader, tokenIn, tokenOut, amountIn,
 * amountOut, nonce, txHash, blockNumber }) once per trade, in order, after `confirmations` blocks.
 * Save the returned lastBlock() somewhere so a restart continues where it stopped.
 */
function pollTrades(contract, { fromBlock, onTrade, intervalMs = 4000, confirmations = 1 }) {
  let next = fromBlock;
  let stopped = false;
  let timer = null;
  const tick = async () => {
    try {
      const head = (await contract.runner.provider.getBlockNumber()) - (confirmations - 1);
      if (head >= next) {
        const events = await contract.queryFilter(contract.filters.Traded(), next, head);
        for (const e of events) {
          const [account, trader, tokenIn, tokenOut, amountIn, amountOut, nonce] = e.args;
          await onTrade({ account, trader, tokenIn: Number(tokenIn), tokenOut: Number(tokenOut), amountIn, amountOut, nonce, txHash: e.transactionHash, blockNumber: e.blockNumber });
        }
        next = head + 1;
      }
    } catch (err) {
      console.error('pollTrades:', err.shortMessage || err.message);
    }
    if (!stopped) timer = setTimeout(tick, intervalMs);
  };
  tick();
  return { stop() { stopped = true; clearTimeout(timer); }, lastBlock: () => next - 1 };
}

module.exports = { TOKENS, PERMIT_TYPES, domain, newNonce, signPermit, pollTrades };
