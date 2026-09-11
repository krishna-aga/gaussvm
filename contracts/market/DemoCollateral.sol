// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import { ERC20 } from '@openzeppelin/contracts/token/ERC20/ERC20.sol';

/// @notice Test-only faucet collateral. Has no monetary value and no production mode.
contract DemoCollateral is ERC20 {
    error FaucetLimit();
    constructor() ERC20('GaussVM test collateral', 'gUSD') {}
    function faucet() external {
        if (balanceOf(msg.sender) > 10_000e18) revert FaucetLimit();
        _mint(msg.sender, 10_000e18);
    }
}
