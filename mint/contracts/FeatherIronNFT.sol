// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title Feather & Iron: game ticket NFTs
/// @notice Each token is one account in the game. Roostr holders claim for free from a snapshot
/// (a Merkle list of address and allowance); everything not claimed is sold in the public mint.
/// Until the reveal every token shows the same placeholder. At the reveal a one-time random offset
/// decides which metadata file (1..maxSupply) each token gets, so nobody can pick traits by minting.
contract FeatherIronNFT is ERC721, ERC2981, Ownable, ReentrancyGuard {
    using Strings for uint256;

    uint256 public immutable maxSupply;
    /// @notice Tokens minted so far. Token ids run from 1 in mint order and are never burned.
    uint256 public totalMinted;

    // Public mint
    bool public publicOpen;
    uint256 public price;
    uint256 public maxPerTx;

    // Free claim for Roostr holders. Leaves are (address account, uint256 allowance).
    bool public claimOpen;
    bytes32 public claimRoot;
    /// @notice Sum of all allowances in the snapshot. While the claim is open, the unclaimed part
    /// is held back from the public mint.
    uint256 public claimReserved;
    uint256 public claimedTotal;
    mapping(address => uint256) public claimed;

    // Metadata and reveal
    string public placeholderURI;
    string public baseURI;
    /// @notice Hash of the final, ordered metadata set, published before minting starts.
    bytes32 public provenanceHash;
    /// @notice keccak256 of the team's secret, committed before minting starts.
    bytes32 public revealCommit;
    bool public revealed;
    uint256 public offset;

    event ClaimListSet(bytes32 root, uint256 reserved);
    event ClaimOpenSet(bool open);
    event PublicOpenSet(bool open);
    event PriceSet(uint256 price, uint256 maxPerTx);
    event ProvenanceSet(bytes32 provenanceHash);
    event RevealCommitted(bytes32 commit);
    event Revealed(uint256 offset, string baseURI);
    event BaseURISet(string baseURI);
    event PlaceholderURISet(string placeholderURI);

    error ClaimClosed();
    error SaleClosed();
    error NotOnList();
    error OverAllowance();
    error BadQuantity();
    error SoldOut();
    error WrongPayment();
    error TooLate();
    error NoCommit();
    error BadSecret();
    error AlreadyRevealed();
    error NotRevealed();
    error WithdrawFailed();

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        uint256 price_,
        uint256 maxPerTx_,
        string memory placeholderURI_,
        address royaltyReceiver,
        uint96 royaltyBps
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        if (maxSupply_ == 0 || maxPerTx_ == 0) revert BadQuantity();
        maxSupply = maxSupply_;
        price = price_;
        maxPerTx = maxPerTx_;
        placeholderURI = placeholderURI_;
        _setDefaultRoyalty(royaltyReceiver, royaltyBps);
    }

    // ---------------------------------------------------------------- views

    function totalSupply() external view returns (uint256) {
        return totalMinted;
    }

    /// @notice Claims still owed to listed holders while the claim is open.
    function claimHeldBack() public view returns (uint256) {
        if (!claimOpen || claimReserved <= claimedTotal) return 0;
        return claimReserved - claimedTotal;
    }

    /// @notice How many tokens the public mint can still sell.
    function publicAvailable() public view returns (uint256) {
        uint256 left = maxSupply - totalMinted;
        uint256 held = claimHeldBack();
        return left > held ? left - held : 0;
    }

    /// @notice Metadata file number (1..maxSupply) of a token. The game reads traits from the same file.
    function metadataIndex(uint256 tokenId) public view returns (uint256) {
        if (!revealed) revert NotRevealed();
        _requireOwned(tokenId);
        return ((tokenId - 1 + offset) % maxSupply) + 1;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        if (!revealed) return placeholderURI;
        return string.concat(baseURI, metadataIndex(tokenId).toString(), ".json");
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // ---------------------------------------------------------------- minting

    /// @notice Free claim for Roostr holders. `allowance` and `proof` come from the snapshot files.
    /// A holder may claim in several transactions until the allowance is used.
    function claim(uint256 allowance, uint256 quantity, bytes32[] calldata proof) external nonReentrant {
        if (!claimOpen) revert ClaimClosed();
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, allowance))));
        if (!MerkleProof.verifyCalldata(proof, claimRoot, leaf)) revert NotOnList();
        if (quantity == 0 || claimed[msg.sender] + quantity > allowance) revert OverAllowance();
        claimed[msg.sender] += quantity;
        claimedTotal += quantity;
        _mintMany(msg.sender, quantity);
    }

    /// @notice Public mint, paid in the chain's native currency (ETH).
    function mint(uint256 quantity) external payable nonReentrant {
        if (!publicOpen) revert SaleClosed();
        if (quantity == 0 || quantity > maxPerTx) revert BadQuantity();
        if (quantity > publicAvailable()) revert SoldOut();
        if (msg.value != price * quantity) revert WrongPayment();
        _mintMany(msg.sender, quantity);
    }

    /// @notice Team mint for giveaways and testing. It can never use supply held back for the claim.
    function ownerMint(address to, uint256 quantity) external onlyOwner nonReentrant {
        if (quantity == 0) revert BadQuantity();
        if (quantity > publicAvailable()) revert SoldOut();
        _mintMany(to, quantity);
    }

    function _mintMany(address to, uint256 quantity) private {
        uint256 first = totalMinted + 1;
        if (totalMinted + quantity > maxSupply) revert SoldOut();
        totalMinted += quantity;
        for (uint256 i; i < quantity; ++i) {
            _safeMint(to, first + i);
        }
    }

    // ---------------------------------------------------------------- team settings

    function setClaimList(bytes32 root, uint256 reserved) external onlyOwner {
        claimRoot = root;
        claimReserved = reserved;
        emit ClaimListSet(root, reserved);
    }

    function setClaimOpen(bool open) external onlyOwner {
        if (open && revealCommit == bytes32(0)) revert NoCommit();
        claimOpen = open;
        emit ClaimOpenSet(open);
    }

    function setPublicOpen(bool open) external onlyOwner {
        if (open && revealCommit == bytes32(0)) revert NoCommit();
        publicOpen = open;
        emit PublicOpenSet(open);
    }

    function setPrice(uint256 price_, uint256 maxPerTx_) external onlyOwner {
        if (maxPerTx_ == 0) revert BadQuantity();
        price = price_;
        maxPerTx = maxPerTx_;
        emit PriceSet(price_, maxPerTx_);
    }

    /// @notice Publish the hash of the final metadata set. Only before the first mint.
    function setProvenance(bytes32 provenanceHash_) external onlyOwner {
        if (totalMinted != 0) revert TooLate();
        provenanceHash = provenanceHash_;
        emit ProvenanceSet(provenanceHash_);
    }

    /// @notice Commit keccak256(secret) before the first mint. The claim and the sale can't open without it.
    function commitReveal(bytes32 commit) external onlyOwner {
        if (totalMinted != 0) revert TooLate();
        revealCommit = commit;
        emit RevealCommitted(commit);
    }

    /// @notice One-time reveal: the secret, the previous block hash and the mint count set the offset.
    function reveal(bytes32 secret, string calldata baseURI_) external onlyOwner {
        if (revealed) revert AlreadyRevealed();
        if (revealCommit == bytes32(0) || keccak256(abi.encodePacked(secret)) != revealCommit) revert BadSecret();
        offset = uint256(keccak256(abi.encodePacked(secret, blockhash(block.number - 1), totalMinted))) % maxSupply;
        revealed = true;
        baseURI = baseURI_;
        emit Revealed(offset, baseURI_);
    }

    /// @notice Move the metadata to a new server after the reveal. The file numbers stay the same.
    function setBaseURI(string calldata baseURI_) external onlyOwner {
        if (!revealed) revert NotRevealed();
        baseURI = baseURI_;
        emit BaseURISet(baseURI_);
    }

    function setPlaceholderURI(string calldata placeholderURI_) external onlyOwner {
        placeholderURI = placeholderURI_;
        emit PlaceholderURISet(placeholderURI_);
    }

    function setRoyalty(address receiver, uint96 bps) external onlyOwner {
        _setDefaultRoyalty(receiver, bps);
    }

    function withdraw(address payable to) external onlyOwner nonReentrant {
        (bool ok, ) = to.call{value: address(this).balance}("");
        if (!ok) revert WithdrawFailed();
    }
}
