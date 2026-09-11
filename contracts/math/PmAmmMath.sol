// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { Gaussian } from './Gaussian.sol';

/// @notice Bounded exact-input solver for the pm-AMM invariant level set.
library PmAmmMath {
    uint256 internal constant MAX_RESERVE = 1e28;
    error InvalidScale();
    error InvalidReserves();
    error TradeOutsideDomain();
    error TradeTooSmall();

    function invariant(uint256 x, uint256 y, uint256 liquidity) internal pure returns (int256) {
        if (liquidity < 1e18 || liquidity > 1e27) revert InvalidScale();
        if (x > MAX_RESERVE || y > MAX_RESERVE) revert InvalidReserves();
        int256 d = int256(y) - int256(x);
        int256 z = d * 1e18 / int256(liquidity);
        return d * Gaussian.cdf(z) / 1e18 + int256(liquidity) * Gaussian.pdf(z) / 1e18 - int256(y);
    }

    function quote(uint256 x, uint256 y, uint256 liquidity, uint256 input) internal pure returns (uint256) {
        if (x == 0 || y <= 1 || input == 0 || x > MAX_RESERVE || input > MAX_RESERVE - x) revert InvalidReserves();
        int256 baseline = invariant(x, y, liquidity);
        // Keep a deliberately conservative gap, larger than observed fixed-point error.
        int256 target = baseline - int256(liquidity / 1e12 + 32);
        uint256 nextX = x + input;
        int256 domainRoom = int256(y) - int256(nextX) + int256(3 * liquidity);
        if (domainRoom <= 0) revert TradeOutsideDomain();
        uint256 high = uint256(domainRoom) < y - 1 ? uint256(domainRoom) : y - 1;
        if (invariant(nextX, y, liquidity) > target) revert TradeTooSmall();
        // Reject a trade requiring a root outside our supported domain / reserves.
        if (invariant(nextX, y - high, liquidity) <= target) revert TradeOutsideDomain();
        uint256 low;
        for (uint256 i; i < 64 && high - low > 1; ++i) {
            uint256 mid = low + (high - low) / 2;
            if (invariant(nextX, y - mid, liquidity) <= target) low = mid;
            else high = mid;
        }
        if (low == 0) revert TradeTooSmall();
        return low;
    }
}
