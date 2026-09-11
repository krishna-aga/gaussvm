// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1
// GaussVM extension by Krishna, 2026-09-11. See LICENSES/SwapVM-1.1.txt.
pragma solidity 0.8.30;

import { SwapVM } from '@1inch/swap-vm/contracts/SwapVM.sol';
import { Context } from '@1inch/swap-vm/contracts/libs/VM.sol';
import { Math } from '@openzeppelin/contracts/utils/math/Math.sol';
import { PmAmmMath } from './math/PmAmmMath.sol';
import { BinaryMarket } from './market/BinaryMarket.sol';

/// @notice Official SwapVM settlement extended with a single Gaussian exact-input instruction.
/// @dev Opcode 0x80, 160 ABI-encoded argument bytes: market, L0, start, expiry, timeScaled.
contract GaussVM is SwapVM {
    uint8 public constant GAUSSIAN_SWAP = 0x80;
    uint256 public constant CUTOFF = 60;
    error InvalidProgram();
    error ExactOutputUnsupported();
    error MarketUnavailable();
    error UnsupportedPair();

    constructor(address aqua, address weth, address owner) SwapVM(aqua, weth, owner, 'GaussVM', '1') {}

    function effectiveLiquidity(uint256 initial, uint64 start, uint64 expiry, bool timeScaled) public view returns (uint256) {
        if (start >= expiry || block.timestamp < start || block.timestamp + CUTOFF >= expiry) revert MarketUnavailable();
        if (initial < 1e18 || initial > 1e27) revert PmAmmMath.InvalidScale();
        if (!timeScaled) return initial;
        uint256 ratio = (uint256(expiry) - block.timestamp) * 1e36 / (expiry - start);
        uint256 scaled = initial * Math.sqrt(ratio) / 1e18;
        if (scaled < 1e18) revert PmAmmMath.InvalidScale();
        return scaled;
    }

    function _dispatch(Context memory ctx, uint256 opcode, bytes calldata args) internal view override {
        // This router deliberately exposes only a complete one-instruction program.
        if (opcode != GAUSSIAN_SWAP || args.length != 160 || ctx.vm.nextPC != 162 || ctx.program().length != 162) revert InvalidProgram();
        if (!ctx.query.isExactIn) revert ExactOutputUnsupported();
        (address marketAddress, uint256 initial, uint64 start, uint64 expiry, bool timeScaled) = abi.decode(args, (address,uint256,uint64,uint64,bool));
        BinaryMarket market = BinaryMarket(marketAddress);
        if (market.status() != BinaryMarket.Status.Open || market.expiry() != expiry) revert MarketUnavailable();
        address yes = address(market.yes()); address no = address(market.no());
        if (!((ctx.query.tokenIn == yes && ctx.query.tokenOut == no) || (ctx.query.tokenIn == no && ctx.query.tokenOut == yes))) revert UnsupportedPair();
        uint256 liquidity = effectiveLiquidity(initial, start, expiry, timeScaled);
        ctx.swap.amountOut = PmAmmMath.quote(ctx.swap.balanceIn, ctx.swap.balanceOut, liquidity, ctx.swap.amountIn);
    }
}
