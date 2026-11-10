const { expect } = require('chai');
const { ethers } = require('hardhat');
const { TOKENS, newNonce, signPermit, pollTrades } = require('../server/permits');

const FEE = ethers.parseEther('0.0002');
const U = 1_000_000n; // EGG_UNIT: pools count eggs in millionths
const { EGG, GRAIN, GRIT, OIL } = TOKENS;

async function revertsWith(promise, contract, name) {
  try { await promise; } catch (e) {
    const data = e.data || (e.error && e.error.data);
    const parsed = data ? contract.interface.parseError(data) : null;
    expect(parsed ? parsed.name : e.message).to.equal(name);
    return;
  }
  expect.fail(`expected revert ${name}`);
}

// Same pricing as the contract: constant product with the pool fee taken from the input.
function expectedOut(reserveIn, reserveOut, amountIn, feeBps = 30n) {
  const inAfterFee = amountIn * (10000n - feeBps);
  return (inAfterFee * reserveOut) / (reserveIn * 10000n + inAfterFee);
}

async function setup() {
  const [owner, server, alice, bob, treasury] = await ethers.getSigners();
  const tickets = await (await ethers.getContractFactory('MockTickets')).deploy();
  await tickets.mint(alice.address, 7);
  await tickets.mint(bob.address, 8);
  const ex = await (await ethers.getContractFactory('EstateExchange')).deploy(await tickets.getAddress(), server.address, FEE, 30, 500);
  await ex.setPool(GRAIN, 5000, 1_100_000);
  await ex.setPool(GRIT, 5000, 550_000);
  await ex.setPool(OIL, 5000, 280_000);
  const where = { chainId: (await ethers.provider.getNetwork()).chainId, exchange: await ex.getAddress() };
  const deadline = async (s = 600) => BigInt((await ethers.provider.getBlock('latest')).timestamp + s);
  const permit = async (over = {}) => {
    const p = { trader: alice.address, account: 7n, tokenIn: GRAIN, tokenOut: EGG, amountIn: 2200n, nonce: newNonce(), deadline: await deadline(), ...over };
    const sig = await signPermit(over.signer || server, where, (({ signer, ...rest }) => rest)(p));
    delete p.signer;
    return { p, sig };
  };
  return { ex, tickets, owner, server, alice, bob, treasury, permit, deadline, where };
}

describe('EstateExchange', () => {
  it('prices a trade like a constant-product pool and emits Traded', async () => {
    const { ex, alice, permit } = await setup();
    const { p, sig } = await permit({ amountIn: 2200n });
    const want = expectedOut(1_100_000n, 5000n * U, 2200n) / U; // whole eggs
    expect(want).to.equal(9n);
    expect(await ex.quote(GRAIN, EGG, 2200)).to.equal(want);
    await expect(ex.connect(alice).trade(p, sig, want, { value: FEE }))
      .to.emit(ex, 'Traded').withArgs(7n, alice.address, GRAIN, EGG, 2200n, want, p.nonce);
    const pool = await ex.pools(GRAIN);
    expect(pool.goods).to.equal(1_102_200n);
    expect(pool.eggs).to.equal((5000n - want) * U); // the leftover fraction of an egg stays in the pool
    expect(await ex.nonceUsed(p.nonce)).to.equal(true);
    expect(await ex.price(GRAIN)).to.equal(1_102_200n * 10n ** 18n / (5000n - want));
  });

  it('never lowers a pool product, so the pool fee stays in the pool', async () => {
    const { ex, alice, permit } = await setup();
    const before = await ex.pools(OIL);
    const { p, sig } = await permit({ tokenIn: EGG, tokenOut: OIL, amountIn: 200n });
    await ex.connect(alice).trade(p, sig, 1, { value: FEE });
    const after = await ex.pools(OIL);
    expect(after.eggs * after.goods >= before.eggs * before.goods).to.equal(true);
  });

  it('routes resource to resource through eggs in one trade', async () => {
    const { ex, alice, permit } = await setup();
    const eggs = expectedOut(1_100_000n, 5000n * U, 22_000n); // millionths of an egg, no rounding to whole eggs
    const oil = expectedOut(5000n * U, 280_000n, eggs);
    expect(await ex.quote(GRAIN, OIL, 22_000)).to.equal(oil);
    const { p, sig } = await permit({ tokenIn: GRAIN, tokenOut: OIL, amountIn: 22_000n });
    await ex.connect(alice).trade(p, sig, oil, { value: FEE });
    expect((await ex.pools(GRAIN)).goods).to.equal(1_122_000n);
    expect((await ex.pools(OIL)).goods).to.equal(280_000n - oil);
  });

  it('collects the flat ETH fee and lets only the owner withdraw it', async () => {
    const { ex, alice, treasury, permit } = await setup();
    const { p, sig } = await permit();
    await revertsWith(ex.connect(alice).trade(p, sig, 1, { value: FEE - 1n }), ex, 'WrongFee');
    await ex.connect(alice).trade(p, sig, 1, { value: FEE });
    expect(await ethers.provider.getBalance(await ex.getAddress())).to.equal(FEE);
    try { await ex.connect(alice).withdraw(alice.address); expect.fail('non-owner withdrew'); } catch (e) { expect(String(e.message)).to.match(/OwnableUnauthorizedAccount|reverted/); }
    const before = await ethers.provider.getBalance(treasury.address);
    await ex.withdraw(treasury.address);
    expect((await ethers.provider.getBalance(treasury.address)) - before).to.equal(FEE);
  });

  it('rejects permits that are forged, reused, expired or used by someone else', async () => {
    const { ex, alice, bob, owner, permit, deadline } = await setup();
    const forged = await permit({ signer: owner });
    await revertsWith(ex.connect(alice).trade(forged.p, forged.sig, 1, { value: FEE }), ex, 'BadSignature');
    const ok = await permit();
    await revertsWith(ex.connect(bob).trade(ok.p, ok.sig, 1, { value: FEE }), ex, 'NotTrader');
    await ex.connect(alice).trade(ok.p, ok.sig, 1, { value: FEE });
    await revertsWith(ex.connect(alice).trade(ok.p, ok.sig, 1, { value: FEE }), ex, 'NonceUsed');
    const old = await permit({ deadline: (await deadline(0)) - 10n });
    await revertsWith(ex.connect(alice).trade(old.p, old.sig, 1, { value: FEE }), ex, 'Expired');
    // the amount is part of the signature: changing it breaks the permit
    const p2 = await permit();
    await revertsWith(ex.connect(alice).trade({ ...p2.p, amountIn: 999_999n }, p2.sig, 1, { value: FEE }), ex, 'BadSignature');
  });

  it('only the current holder of the account NFT can trade for it', async () => {
    const { ex, tickets, alice, bob, permit } = await setup();
    const { p, sig } = await permit();
    await tickets.connect(alice).transferFrom(alice.address, bob.address, 7);
    await revertsWith(ex.connect(alice).trade(p, sig, 1, { value: FEE }), ex, 'NotTicketOwner');
  });

  it('protects the player with minOut and the pools with a size limit', async () => {
    const { ex, alice, permit } = await setup();
    const a = await permit({ amountIn: 2200n });
    const want = await ex.quote(GRAIN, EGG, 2200);
    await revertsWith(ex.connect(alice).trade(a.p, a.sig, want + 1n, { value: FEE }), ex, 'BelowMinimum');
    const big = await permit({ amountIn: 60_000n }); // more than 5% of 1,100,000 Grain
    await revertsWith(ex.connect(alice).trade(big.p, big.sig, 1, { value: FEE }), ex, 'TooLarge');
    const dust = await permit({ amountIn: 100n }); // worth less than one egg
    await revertsWith(ex.connect(alice).trade(dust.p, dust.sig, 0, { value: FEE }), ex, 'BelowMinimum');
    const same = await permit({ tokenIn: GRAIN, tokenOut: GRAIN });
    await revertsWith(ex.connect(alice).trade(same.p, same.sig, 0, { value: FEE }), ex, 'SameToken');
    const none = await permit({ tokenIn: EGG, tokenOut: 9 });
    await revertsWith(ex.connect(alice).trade(none.p, none.sig, 0, { value: FEE }), ex, 'NoPool');
  });

  it('can be paused, and its settings stay in range', async () => {
    const { ex, alice, permit } = await setup();
    await ex.pause();
    const { p, sig } = await permit();
    try { await ex.connect(alice).trade(p, sig, 1, { value: FEE }); expect.fail('traded while paused'); } catch (e) { expect(String(e.message)).to.match(/EnforcedPause|reverted/); }
    await ex.unpause();
    await ex.connect(alice).trade(p, sig, 1, { value: FEE });
    await revertsWith(ex.setFees(FEE, 2000, 500), ex, 'BadSettings');
    await revertsWith(ex.setFees(FEE, 30, 0), ex, 'BadSettings');
    await revertsWith(ex.setPool(EGG, 1, 1), ex, 'BadSettings');
    await revertsWith(ex.setSigner(ethers.ZeroAddress), ex, 'BadSettings');
  });

  it('lets the game server follow trades with pollTrades', async () => {
    const { ex, alice, permit } = await setup();
    const seen = [];
    const from = await ethers.provider.getBlockNumber();
    const a = await permit({ amountIn: 2200n });
    const b = await permit({ tokenIn: EGG, tokenOut: GRIT, amountIn: 30n });
    await ex.connect(alice).trade(a.p, a.sig, 1, { value: FEE });
    await ex.connect(alice).trade(b.p, b.sig, 1, { value: FEE });
    const watcher = pollTrades(ex, { fromBlock: from + 1, intervalMs: 50, onTrade: (t) => { seen.push(t); } });
    for (let i = 0; i < 40 && seen.length < 2; i++) await new Promise((r) => setTimeout(r, 50));
    watcher.stop();
    expect(seen.map((t) => t.nonce)).to.deep.equal([a.p.nonce, b.p.nonce]);
    expect(seen[1].tokenOut).to.equal(GRIT);
    expect(seen[0].account).to.equal(7n);
  });
});
