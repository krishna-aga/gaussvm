// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import { Gaussian } from '../math/Gaussian.sol';
import { PmAmmMath } from '../math/PmAmmMath.sol';
contract MathHarness {
    function cdf(int256 z) external pure returns (int256) { return Gaussian.cdf(z); }
    function pdf(int256 z) external pure returns (int256) { return Gaussian.pdf(z); }
    function invariant(uint256 x, uint256 y, uint256 l) external pure returns (int256) { return PmAmmMath.invariant(x,y,l); }
    function quote(uint256 x, uint256 y, uint256 l, uint256 a) external pure returns (uint256) { return PmAmmMath.quote(x,y,l,a); }
}
