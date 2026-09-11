# Mathematical specification and limits

Primary attribution: [Ciamac Moallemi and Dan Robinson, pm-AMM, 2024-11-05](https://www.paradigm.xyz/writing/pm-amm). This project implements a bounded numerical version and documents its deviations. It does not establish a new AMM theorem or novelty claim.

## Conventions

- x = maker's allocated input reserve; y = allocated output reserve during a swap. Symmetry lets the same solver handle either direction.
- L = liquidity scale, in token atomic units. Outcome tokens have 18 decimals.
- WAD = 10^18. z = (y - x)/L is dimensionless.
- phi(z) is the standard normal density; Phi(z) is its CDF.
- The YES probability displayed in the interface uses x = YES and y = NO. Probability is Phi(z), not the YES/NO exchange ratio Phi(z)/(1-Phi(z)).

```text
F(x,y;L) = (y-x) Phi((y-x)/L) + L phi((y-x)/L) - y
```

Static source invariant: F = 0. The seed uses x = y = 1000 and L approximately 2506.628274631, so x approximately equals L phi(0). The finite decimal initialization introduces a small level offset; trades preserve that level conservatively.

For exact input a and output b the solver searches for F(x+a,y-b;L) = F(x,y;L). Holding x fixed, F decreases with y; hence F increases as b increases. The solver maintains a feasible lower output and an infeasible upper output. It returns the lower output, never a midpoint rounded upward. Along the curve, the marginal output/input ratio is Phi(z)/(1-Phi(z)).

## Gaussian arithmetic

`Gaussian.sol` computes exp(-z²/2) as the reciprocal of a positive power series for exp(z²/2). A second positive series evaluates:

```text
Phi(z) - 1/2 = phi(z) [z + z^3/3 + z^5/(3*5) + ...], z >= 0.
Phi(-z) = 1 - Phi(z).
```

Each series has at most 64 terms and stops if its next fixed-point term is zero. The supported domain is |z| <= 3. No polynomial approximation or unexplained Gaussian library is substituted. The code is independently checked against composite Simpson quadrature and JavaScript's native exponential, and PDF benchmarks. This is sampled validation, not certified interval arithmetic.

## Bounded solver

| Parameter | Enforced bound |
| --- | --- |
| Effective L | 10^18 through 10^27 atomic units (1 to 10^9 tokens) |
| Each reserve | Positive, at most 10^28 atomic units (10^10 tokens) |
| Post-trade input reserve | At most 10^28 |
| Normal score | -3 <= z <= 3 before and during the search |
| Output | Positive and strictly below allocated output reserve |
| Search | At most 64 bisections |
| Numerical guard | Target F is reduced by floor(L / 10^12) + 32 atomic units |

The guard creates an intentionally conservative difference from the ideal curve. It is not a configured percentage trading fee. It can make very small trades revert and makes splitting trades slightly less favorable. The bisection interval also contributes bounded downward rounding; at the largest reserve, the 64-step interval can be about 5.5e8 wei (5.5e-10 token). Output sensitivity is higher near extreme probabilities, so error must be evaluated at the output as well as at F.

The guard exceeds the observed error on the reported grid; it is not a formal proof that the arithmetic is conservative over every possible uint256 input. No universal error bound, gas upper bound or economic security claim follows from those finite tests.

## Time-scaled extension

```text
L(t) = L0 sqrt((expiry-t)/(expiry-start))
```

Timestamps use seconds and the ratio is dimensionless. The square root is computed with OpenZeppelin's integer `Math.sqrt` at 10^36 ratio precision. Orders must be past start, and stop at expiry minus 60 seconds. If effective L drops below one token or the position leaves |z| <= 3, pricing also stops; docking/merging/redemption remain available.

GaussVM recomputes the current F level at each trade's timestamp. If x and y share an offset c, then F(x+c,y+c;L) = F(x,y;L)-c. A nonzero level can therefore be represented as equal inactive complete sets plus the active curve. Time can change that offset without a transfer, while the wallet retains those sets. This preserves the instantaneous curve shape and marginal prices, but differs from treating all allocated wallet tokens as the paper's zero-level dynamic pool. It can also create a signed offset for arbitrary user-provided initial reserves. We do not claim constant expected LVR for the total wallet, automatic fee optimization or LP loss prevention.

The frontend slider is an illustration of the normalized fingerprint `L [p(1-p)]^(3/2) / phi(Phi^-1(p))`, with the Gaussian curve normalized to its initial center and scaled by sqrt(remaining lifetime). The constant-product reference is a constant normalized fingerprint. This is not absolute depth, TVL, a live order book or performance evidence. The quote panel's separate constant-product comparison uses the same current reserves and input, with zero fees, and is not executable in GaussVM.

## Verification interpretation

The default numerical test has a deterministic 121-point CDF/PDF grid on [-3,3] with 0.05 spacing and 45 root comparisons at L = 10, 1000, 10^6; z = -2,-1,0,1,2; input/L = 0.0001,0.001,0.01. The test uses CDF tolerance 2e-13, PDF tolerance 2e-14 and output tolerance 2e-9 L. Exact CDF complement symmetry and conservative fixed-point residuals are checked separately.

Conclusions are conditional on these bounds, tolerances and the independent double-precision reference. They do not authenticate the Gaussian score model for a real prediction event, prove profitability, establish robustness against all MEV strategies or replace a smart-contract audit.
