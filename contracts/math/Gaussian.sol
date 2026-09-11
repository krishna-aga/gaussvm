// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1
pragma solidity 0.8.30;

/// @notice Bounded WAD normal distribution, evaluated with positive convergent series.
/// @dev Supported |z| <= 3. No claim of correctly rounded transcendental arithmetic.
library Gaussian {
    int256 internal constant WAD = 1e18;
    int256 internal constant INV_SQRT_2PI = 398942280401432677;
    error GaussianDomain();

    function pdf(int256 z) internal pure returns (int256) {
        if (z < -3e18 || z > 3e18) revert GaussianDomain();
        // exp(-z^2/2) = 1 / exp(z^2/2), with nonnegative series terms.
        int256 a = z * z / (2 * WAD);
        int256 term = WAD;
        int256 sum = WAD;
        for (int256 n = 1; n <= 64; ++n) {
            term = term * a / (WAD * n);
            sum += term;
            if (term == 0) break;
        }
        return INV_SQRT_2PI * WAD / sum;
    }

    function cdf(int256 z) internal pure returns (int256) {
        int256 density = pdf(z);
        int256 a = z < 0 ? -z : z;
        int256 square = a * a / WAD;
        int256 term = a;
        int256 sum = a;
        // Integral identity: Phi(z)-1/2 = phi(z) [z + z^3/3 + z^5/(3*5) + ...].
        for (int256 n = 1; n <= 64; ++n) {
            term = term * square / (WAD * (2 * n + 1));
            sum += term;
            if (term == 0) break;
        }
        int256 area = density * sum / WAD;
        return z < 0 ? WAD / 2 - area : WAD / 2 + area;
    }
}
