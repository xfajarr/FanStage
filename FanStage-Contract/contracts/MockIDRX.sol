// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockIDRX is ERC20, Ownable {
    event OnRamp(address indexed user, uint256 amount);
    event OffRamp(address indexed user, uint256 amount);

    constructor() ERC20("Mock IDRX", "IDRX") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10 ** 2); 
    }

    function decimals() public pure override returns (uint8) {
        return 2; // IDRX has 2 decimals
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function approve(
        address spender,
        uint256 amount
    ) public override returns (bool) {
        return super.approve(spender, amount);
    }

    function onRamp(uint256 idrxAmount) external {
        _mint(msg.sender, idrxAmount);
        emit OnRamp(msg.sender, idrxAmount);
    }

    function offRamp(uint256 idrxAmount) external {
        _burn(msg.sender, idrxAmount);
        emit OffRamp(msg.sender, idrxAmount);
    }
}
