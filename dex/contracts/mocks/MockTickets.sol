// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @dev Stand-in for the Feather & Iron NFT in local tests. Not deployed anywhere real.
contract MockTickets is ERC721 {
    constructor() ERC721("Mock Tickets", "MTIX") {}

    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}
