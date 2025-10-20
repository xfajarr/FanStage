// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArtistToken is ERC20, Ownable {
    uint8 private constant _decimals = 2;

    constructor(
        string memory name,
        string memory symbol,
        address campaignContract
    ) ERC20(name, symbol) Ownable(campaignContract) {
    }

    function decimals() public pure override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
