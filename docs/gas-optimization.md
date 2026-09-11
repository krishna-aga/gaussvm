# Gas optimization

The optimized router retains the current Gaussian formula, fixed-point rounding,
64-step bisection limit, conservative output guard, supported domain, time scaling,
and official Aqua/SwapVM settlement. It does not change the market or outcome tokens.

## Changes

`Gaussian.cdfAndPdf` computes the density once and returns it with the cumulative
distribution. Previously, the invariant called `cdf` (which itself called `pdf`)
and then evaluated `pdf` again. The series operations, termination conditions and
integer divisions are unchanged.

`PmAmmMath.quote` validates scale and initial reserves through its baseline
invariant evaluation. Its entry check bounds `nextX` by `MAX_RESERVE`, and all
candidate output reserves are in `[1, y]`. Subsequent invariant evaluations use a
private helper without repeating these established scale/reserve checks.
Gaussian domain checks and checked arithmetic still execute on every evaluation.
The public test harness's standalone invariant retains its original validation.

There is no new approximation, unchecked arithmetic, reduced iteration count,
unlimited approval, offchain price authority, or additional partner integration.

## Reproduce the comparison

```sh
npm ci
npm run contracts:build
npm run test:gas
```

`npm run check` includes these tests. The frozen math fixtures come from
`4e8cd92dcca618b50a7b2cfa5845eb637b70ff4f`. Before editing production math, their
compiled router and harness creation bytecode were checked against the original
build and matched exactly. The baseline compiler substitutes only the two math
sources in the current router/harness build, using the same solc 0.8.30,
optimizer 200, viaIR and Cancun settings. It records normalized source hashes.

The differential suite compares **1,246 exact return/revert byte sequences**:
410 CDF, 410 PDF, 178 invariant and 248 quote inputs. This includes **1,141
successful calls and 105 reverts**, signed extrema, reserve/scale boundaries,
domain endpoints, dust, invalid-input precedence and deterministic random inputs.
These are bounded regression results, not a proof over all possible inputs.

The full-settlement benchmark uses snapshot/revert to give both routers identical
pre-swap state and transaction timestamps. It compares quotes, swap event fields,
maker/taker token balances, finite allowances and Aqua allocations. Each swap
starts with a fresh transaction's access state; there is no warm-call gas trick.

| Local full-swap case | Baseline gas | Optimized gas | Reduction |
| --- | ---: | ---: | ---: |
| Static, balanced, 10 NO input | 767,087 | 578,848 | 24.53% |
| Static, balanced, 100 NO input | 1,044,731 | 756,932 | 27.54% |
| Time-scaled, halfway, 10 NO input | 778,133 | 586,636 | 24.60% |
| Time-scaled, late, imbalanced, 10 NO input | 1,533,602 | 1,091,047 | 28.85% |

All **16** measured swaps used less gas; reductions ranged from **21.37% to
28.85%**. This range describes the tested cases, not every possible trade. Actual
gas depends on reserve state, amount, calldata, allowance writes and token ordering.
An unrelated historical receipt is not used as the denominator for these savings.
Gas-price changes also affect fees independently of gas used.

Generated reports are `reports/gas-equivalence.json` and
`reports/gas-settlement.json`. Committed snapshots are linked from the verification
documentation. Existing independent numerical, economic and lifecycle tests remain
part of `npm run check`.

## Sepolia router migration

The router is immutable. Updating the live app therefore requires a new GaussVM
deployment; the existing Aqua, BinaryMarket, gUSD, YES, NO, expiry, resolver and
encoded seed order are reused.

After `npm run check`, the explicit testnet-only command is:

```sh
node --env-file=.env scripts/optimize-sepolia.mjs --execute
```

It requires the existing seed maker's dedicated test key and faucet Sepolia ETH.
It archives the current manifest, deploys the router, docks only the old seed,
and ships its closing allocations to the new router. It reconstructs any swaps
between the reserve snapshot and docking from Aqua events, including swaps in
the docking block. Reserves are never reset to the initial 1,000/1,000.
Maker allowances are raised only if necessary to cover these exact allocations.
No outcome tokens or collateral are transferred by the migration itself.

Submitted hashes are saved before receipt waits in
`reports/router-optimization.json`. Rerunning resumes recorded transactions;
rerunning after completion sends none. An interrupted migration can temporarily
leave the old seed docked before the new seed is shipped. Inspect its saved
receipts and resume the same build instead of deleting progress or redeploying.
Publish the new manifest only after migration and free source verification finish.

Only the project's seed is migrated. Other makers' positions and approvals stay
on the previous router. A maker can retire one through the original Aqua contract
with `dock(previousRouter, originalOrderHash, [YES, NO])`, from that maker's wallet;
tokens already remain in their wallet. To continue providing liquidity, ship a new
authorization to the current router. The archived manifest retains old addresses.

Browser workspaces now include the router address. Old cached receipts are kept,
but old custom authorizations are not silently treated as positions on a different
router. Takers approve the new router for the requested amount when needed.
