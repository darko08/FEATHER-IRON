// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @title Feather & Iron: the Estate exchange
/// @notice On-chain pools that price game resources against eggs, one exchange per game world.
/// Resources and eggs never leave the game as tokens. A trade works like this:
///   1. The game server takes what the player pays out of the coop or egg balance and signs a permit.
///   2. The player sends the permit from the wallet that holds the account's Feather & Iron NFT
///      and pays the flat ETH fee.
///   3. The contract prices the trade from the pools (constant product, like Uniswap v2),
///      updates them and emits Traded.
///   4. The game server sees Traded and credits the result to the account.
/// With no tokens there is nothing to send between wallets, keep outside the game or trade in
/// another pool, so a player cannot push resources to another player through the exchange.
/// If a permit expires unused, the game server returns what it took (check nonceUsed).
contract EstateExchange is Ownable, Pausable, ReentrancyGuard, EIP712 {
    using SafeCast for uint256;

    /// @notice Token id 0 is eggs; 1, 2, 3... are resources (Grain, Grit, Oil in World 1).
    uint8 public constant EGG = 0;
    /// @notice Pools count eggs in millionths, so a trade routed through eggs (Grain for Oil) loses
    /// nothing to rounding in the middle. Players always pay and receive whole eggs; the fraction
    /// of an egg left over when a player receives eggs stays in the pool.
    uint256 public constant EGG_UNIT = 1e6;

    struct Pool {
        uint128 eggs; // millionths of an egg
        uint128 goods;
    }

    /// @notice What the game server signs for one trade.
    struct Permit {
        address trader;   // wallet that must send the trade
        uint256 account;  // Feather & Iron NFT id; one NFT is one game account
        uint8 tokenIn;
        uint8 tokenOut;
        uint256 amountIn;
        uint256 nonce;    // unique per permit, chosen by the game server
        uint256 deadline; // unix time
    }

    bytes32 private constant PERMIT_TYPEHASH = keccak256(
        "Permit(address trader,uint256 account,uint8 tokenIn,uint8 tokenOut,uint256 amountIn,uint256 nonce,uint256 deadline)"
    );

    IERC721 public immutable tickets;
    address public signer;
    /// @notice Flat fee in wei that every trade pays. It stays here until the owner withdraws it.
    uint256 public tradeFee;
    /// @notice Pool fee in basis points (30 = 0.3%). It stays in the pool and deepens it.
    uint16 public poolFeeBps;
    /// @notice Largest trade as a share of the paying side of a pool, in basis points (500 = 5%).
    uint16 public maxTradeBps;

    mapping(uint8 => Pool) public pools;
    mapping(uint256 => bool) public nonceUsed;

    event Traded(
        uint256 indexed account,
        address indexed trader,
        uint8 tokenIn,
        uint8 tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 nonce
    );
    event PoolSet(uint8 indexed resource, uint256 eggs, uint256 goods);
    event SignerSet(address signer);
    event FeesSet(uint256 tradeFee, uint16 poolFeeBps, uint16 maxTradeBps);

    error Expired();
    error NotTrader();
    error NotTicketOwner();
    error NonceUsed();
    error BadSignature();
    error WrongFee();
    error SameToken();
    error NoPool();
    error TooLarge();
    error BelowMinimum();
    error ZeroAmount();
    error BadSettings();
    error WithdrawFailed();

    constructor(IERC721 tickets_, address signer_, uint256 tradeFee_, uint16 poolFeeBps_, uint16 maxTradeBps_)
        Ownable(msg.sender)
        EIP712("Feather & Iron Exchange", "1")
    {
        tickets = tickets_;
        _setSigner(signer_);
        _setFees(tradeFee_, poolFeeBps_, maxTradeBps_);
    }

    // ---------------------------------------------------------------- views

    /// @notice What a trade would return right now, before the ETH fee.
    function quote(uint8 tokenIn, uint8 tokenOut, uint256 amountIn) external view returns (uint256) {
        _checkPair(tokenIn, tokenOut, amountIn);
        if (tokenIn == EGG) return _out(pools[tokenOut], amountIn * EGG_UNIT, true);
        if (tokenOut == EGG) return _out(pools[tokenIn], amountIn, false) / EGG_UNIT;
        return _out(pools[tokenOut], _out(pools[tokenIn], amountIn, false), true);
    }

    /// @notice Units of a resource per whole egg, scaled by 1e18.
    function price(uint8 resource) external view returns (uint256) {
        Pool memory p = pools[resource];
        if (p.eggs == 0) revert NoPool();
        return uint256(p.goods) * 1e18 * EGG_UNIT / p.eggs;
    }

    /// @notice The EIP-712 digest the game server signs for a permit.
    function permitDigest(Permit calldata p) public view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(abi.encode(PERMIT_TYPEHASH, p.trader, p.account, p.tokenIn, p.tokenOut, p.amountIn, p.nonce, p.deadline))
        );
    }

    // ---------------------------------------------------------------- trading

    /// @notice Trade with a permit from the game server. `minOut` is the player's own slippage limit.
    function trade(Permit calldata p, bytes calldata signature, uint256 minOut)
        external
        payable
        nonReentrant
        whenNotPaused
        returns (uint256 amountOut)
    {
        if (block.timestamp > p.deadline) revert Expired();
        if (msg.sender != p.trader) revert NotTrader();
        if (tickets.ownerOf(p.account) != msg.sender) revert NotTicketOwner();
        if (nonceUsed[p.nonce]) revert NonceUsed();
        if (msg.value != tradeFee) revert WrongFee();
        if (ECDSA.recover(permitDigest(p), signature) != signer) revert BadSignature();
        nonceUsed[p.nonce] = true;

        _checkPair(p.tokenIn, p.tokenOut, p.amountIn);
        if (p.tokenIn == EGG) amountOut = _swap(p.tokenOut, p.amountIn * EGG_UNIT, true);
        else if (p.tokenOut == EGG) amountOut = _swapToWholeEggs(p.tokenIn, p.amountIn);
        else amountOut = _swap(p.tokenOut, _swap(p.tokenIn, p.amountIn, false), true);
        if (amountOut == 0 || amountOut < minOut) revert BelowMinimum();

        emit Traded(p.account, msg.sender, p.tokenIn, p.tokenOut, p.amountIn, amountOut, p.nonce);
    }

    function _checkPair(uint8 tokenIn, uint8 tokenOut, uint256 amountIn) private pure {
        if (tokenIn == tokenOut) revert SameToken();
        if (amountIn == 0) revert ZeroAmount();
    }

    function _out(Pool memory p, uint256 amountIn, bool eggsIn) private view returns (uint256) {
        if (p.eggs == 0 || p.goods == 0) revert NoPool();
        (uint256 reserveIn, uint256 reserveOut) = eggsIn ? (uint256(p.eggs), uint256(p.goods)) : (uint256(p.goods), uint256(p.eggs));
        if (amountIn * 10_000 > reserveIn * maxTradeBps) revert TooLarge();
        uint256 inAfterFee = amountIn * (10_000 - poolFeeBps);
        return inAfterFee * reserveOut / (reserveIn * 10_000 + inAfterFee);
    }

    function _swap(uint8 resource, uint256 amountIn, bool eggsIn) private returns (uint256 out) {
        Pool storage pool = pools[resource];
        out = _out(pool, amountIn, eggsIn);
        if (eggsIn) {
            pool.eggs = (uint256(pool.eggs) + amountIn).toUint128();
            pool.goods = (uint256(pool.goods) - out).toUint128();
        } else {
            pool.goods = (uint256(pool.goods) + amountIn).toUint128();
            pool.eggs = (uint256(pool.eggs) - out).toUint128();
        }
    }

    /// @dev Pays out whole eggs only; the pool gives up exactly what the player receives.
    function _swapToWholeEggs(uint8 resource, uint256 goodsIn) private returns (uint256 whole) {
        Pool storage pool = pools[resource];
        whole = _out(pool, goodsIn, false) / EGG_UNIT;
        pool.goods = (uint256(pool.goods) + goodsIn).toUint128();
        pool.eggs = (uint256(pool.eggs) - whole * EGG_UNIT).toUint128();
    }

    // ---------------------------------------------------------------- team settings

    /// @notice Seed or adjust a pool, in whole eggs. The team owns all liquidity, so this sets both reserves.
    function setPool(uint8 resource, uint128 eggs, uint128 goods) external onlyOwner {
        if (resource == EGG) revert BadSettings();
        pools[resource] = Pool((uint256(eggs) * EGG_UNIT).toUint128(), goods);
        emit PoolSet(resource, eggs, goods);
    }

    function setSigner(address signer_) external onlyOwner {
        _setSigner(signer_);
    }

    function setFees(uint256 tradeFee_, uint16 poolFeeBps_, uint16 maxTradeBps_) external onlyOwner {
        _setFees(tradeFee_, poolFeeBps_, maxTradeBps_);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Send the collected ETH fees to the treasury.
    function withdraw(address payable to) external onlyOwner nonReentrant {
        (bool ok, ) = to.call{value: address(this).balance}("");
        if (!ok) revert WithdrawFailed();
    }

    function _setSigner(address signer_) private {
        if (signer_ == address(0)) revert BadSettings();
        signer = signer_;
        emit SignerSet(signer_);
    }

    function _setFees(uint256 tradeFee_, uint16 poolFeeBps_, uint16 maxTradeBps_) private {
        if (poolFeeBps_ > 1_000 || maxTradeBps_ == 0 || maxTradeBps_ > 5_000) revert BadSettings();
        tradeFee = tradeFee_;
        poolFeeBps = poolFeeBps_;
        maxTradeBps = maxTradeBps_;
        emit FeesSet(tradeFee_, poolFeeBps_, maxTradeBps_);
    }
}
