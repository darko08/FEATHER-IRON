const { expect } = require('chai');
const { ethers } = require('hardhat');
const { StandardMerkleTree } = require('@openzeppelin/merkle-tree');

const PRICE = ethers.parseEther('0.01');
const SECRET = ethers.id('feather-iron test secret');
const COMMIT = ethers.keccak256(SECRET);

async function revertsWith(promise, contract, name) {
  try { await promise; } catch (e) {
    const data = e.data || (e.error && e.error.data);
    const parsed = data ? contract.interface.parseError(data) : null;
    expect(parsed ? parsed.name : e.message).to.equal(name);
    return;
  }
  expect.fail(`expected revert ${name}`);
}

async function setup({ maxSupply = 20, maxPerTx = 5 } = {}) {
  const [owner, alice, bob, carol, dave, treasury] = await ethers.getSigners();
  const Nft = await ethers.getContractFactory('FeatherIronNFT');
  const nft = await Nft.deploy('Feather & Iron', 'FNI', maxSupply, PRICE, maxPerTx, 'https://example.com/unrevealed.json', treasury.address, 500);
  const list = [[alice.address, 3n], [bob.address, 1n], [carol.address, 2n]];
  const tree = StandardMerkleTree.of(list, ['address', 'uint256']);
  const proofOf = (addr) => { for (const [i, v] of tree.entries()) if (v[0] === addr) return { allowance: v[1], proof: tree.getProof(i) }; return null; };
  return { nft, owner, alice, bob, carol, dave, treasury, tree, proofOf, reserved: 6n };
}

describe('FeatherIronNFT', () => {
  it('needs the reveal commit before the claim or the sale can open', async () => {
    const { nft } = await setup();
    await revertsWith(nft.setClaimOpen(true), nft, 'NoCommit');
    await revertsWith(nft.setPublicOpen(true), nft, 'NoCommit');
    await nft.commitReveal(COMMIT);
    await nft.setClaimOpen(true);
    expect(await nft.claimOpen()).to.equal(true);
  });

  it('lets listed holders claim their allowance in parts, and nobody else', async () => {
    const { nft, alice, bob, dave, tree, proofOf, reserved } = await setup();
    await nft.setClaimList(tree.root, reserved);
    await nft.commitReveal(COMMIT);
    await nft.setClaimOpen(true);
    const a = proofOf(alice.address);
    await nft.connect(alice).claim(a.allowance, 2, a.proof);
    await nft.connect(alice).claim(a.allowance, 1, a.proof);
    expect(await nft.balanceOf(alice.address)).to.equal(3n);
    await revertsWith(nft.connect(alice).claim(a.allowance, 1, a.proof), nft, 'OverAllowance');
    // claiming with a bigger allowance than the snapshot gave fails the proof
    await revertsWith(nft.connect(alice).claim(10, 1, a.proof), nft, 'NotOnList');
    // someone else can't use alice's proof
    await revertsWith(nft.connect(dave).claim(a.allowance, 1, a.proof), nft, 'NotOnList');
    const b = proofOf(bob.address);
    await revertsWith(nft.connect(bob).claim(b.allowance, 0, b.proof), nft, 'OverAllowance');
    expect(await nft.claimedTotal()).to.equal(3n);
  });

  it('holds back unclaimed allowances from the public mint while the claim is open', async () => {
    const { nft, alice, dave, tree, proofOf, reserved } = await setup({ maxSupply: 20, maxPerTx: 10 });
    await nft.setClaimList(tree.root, reserved);
    await nft.commitReveal(COMMIT);
    await nft.setClaimOpen(true);
    await nft.setPublicOpen(true);
    expect(await nft.publicAvailable()).to.equal(14n);
    await nft.connect(dave).mint(10, { value: PRICE * 10n });
    await nft.connect(dave).mint(4, { value: PRICE * 4n });
    await revertsWith(nft.connect(dave).mint(1, { value: PRICE }), nft, 'SoldOut');
    // holders can still claim their reserved tokens
    const a = proofOf(alice.address);
    await nft.connect(alice).claim(a.allowance, 3, a.proof);
    expect(await nft.totalSupply()).to.equal(17n);
    // closing the claim releases what was not claimed
    await nft.setClaimOpen(false);
    expect(await nft.publicAvailable()).to.equal(3n);
    await nft.connect(dave).mint(3, { value: PRICE * 3n });
    expect(await nft.totalSupply()).to.equal(20n);
    await revertsWith(nft.connect(dave).mint(1, { value: PRICE }), nft, 'SoldOut');
  });

  it('checks payment, quantity and sale state', async () => {
    const { nft, dave } = await setup();
    await revertsWith(nft.connect(dave).mint(1, { value: PRICE }), nft, 'SaleClosed');
    await nft.commitReveal(COMMIT);
    await nft.setPublicOpen(true);
    await revertsWith(nft.connect(dave).mint(1, { value: PRICE - 1n }), nft, 'WrongPayment');
    await revertsWith(nft.connect(dave).mint(6, { value: PRICE * 6n }), nft, 'BadQuantity');
    await revertsWith(nft.connect(dave).mint(0, { value: 0 }), nft, 'BadQuantity');
    await nft.connect(dave).mint(5, { value: PRICE * 5n });
    expect(await nft.ownerOf(5)).to.equal(dave.address);
  });

  it('shows the placeholder until the reveal, then maps every token to a different file', async () => {
    const { nft, owner, dave } = await setup({ maxSupply: 20, maxPerTx: 10 });
    await nft.setProvenance(ethers.id('metadata set v1'));
    await nft.commitReveal(COMMIT);
    await nft.setPublicOpen(true);
    await nft.connect(dave).mint(10, { value: PRICE * 10n });
    await nft.ownerMint(owner.address, 10);
    expect(await nft.tokenURI(1)).to.equal('https://example.com/unrevealed.json');
    await revertsWith(nft.metadataIndex(1), nft, 'NotRevealed');
    await revertsWith(nft.setProvenance(ethers.id('changed')), nft, 'TooLate');
    await revertsWith(nft.reveal(ethers.id('wrong'), 'https://example.com/meta/'), nft, 'BadSecret');
    await nft.reveal(SECRET, 'https://example.com/meta/');
    await revertsWith(nft.reveal(SECRET, 'https://example.com/meta/'), nft, 'AlreadyRevealed');
    const seen = new Set();
    for (let id = 1; id <= 20; id++) {
      const idx = await nft.metadataIndex(id);
      expect(idx >= 1n && idx <= 20n).to.equal(true);
      seen.add(idx);
      expect(await nft.tokenURI(id)).to.equal(`https://example.com/meta/${idx}.json`);
    }
    expect(seen.size).to.equal(20);
    await nft.setBaseURI('https://new-server.example/meta/');
    expect(await nft.tokenURI(1)).to.match(/^https:\/\/new-server\.example\/meta\/\d+\.json$/);
  });

  it('keeps team mints out of the claim reserve', async () => {
    const { nft, owner, tree, reserved } = await setup({ maxSupply: 10 });
    await nft.setClaimList(tree.root, reserved);
    await nft.commitReveal(COMMIT);
    await nft.setClaimOpen(true);
    await revertsWith(nft.ownerMint(owner.address, 5), nft, 'SoldOut');
    await nft.ownerMint(owner.address, 4);
    expect(await nft.totalSupply()).to.equal(4n);
  });

  it('pays royalties to the treasury and lets only the owner withdraw', async () => {
    const { nft, dave, treasury } = await setup();
    const [receiver, amount] = await nft.royaltyInfo(1, ethers.parseEther('1'));
    expect(receiver).to.equal(treasury.address);
    expect(amount).to.equal(ethers.parseEther('0.05'));
    await nft.commitReveal(COMMIT);
    await nft.setPublicOpen(true);
    await nft.connect(dave).mint(2, { value: PRICE * 2n });
    try { await nft.connect(dave).withdraw(dave.address); expect.fail('non-owner withdrew'); } catch (e) { expect(String(e.message)).to.match(/OwnableUnauthorizedAccount|reverted/); }
    const before = await ethers.provider.getBalance(treasury.address);
    await nft.withdraw(treasury.address);
    expect((await ethers.provider.getBalance(treasury.address)) - before).to.equal(PRICE * 2n);
    expect(await nft.supportsInterface('0x2a55205a')).to.equal(true); // ERC-2981
    expect(await nft.supportsInterface('0x80ac58cd')).to.equal(true); // ERC-721
  });
});
