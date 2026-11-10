// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @dev Stand-in for the Roostr collection in local tests of the snapshot script. Not deployed anywhere real.
contract MockRoostr is ERC721 {
    constructor() ERC721("Mock Roostr", "MRST") {}

    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}
