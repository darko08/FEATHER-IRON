require('@nomicfoundation/hardhat-ethers');
require('@nomicfoundation/hardhat-chai-matchers');

// Deploying to Robinhood Chain is done with scripts/deploy.js (plain ethers, RPC and key from env vars).
// Hardhat itself is used to compile and to run the tests on its built-in local chain.
module.exports = {
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // OpenZeppelin 5.x needs Cancun (MCOPY). If a chain rejects the deploy, pin
      // @openzeppelin/contracts to 5.0.2 and set this to 'shanghai'.
      evmVersion: 'cancun',
    },
  },
  paths: { sources: './contracts', tests: './test', artifacts: './artifacts', cache: './cache' },
};
