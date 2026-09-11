# Verification record

Verified locally on 2026-09-11. This record describes executed checks, not an independent security audit.

## Environment and source

- Windows x64, Node 22.16.0, npm 11.4.2.
- Solidity 0.8.30, optimizer 200 runs, viaIR, Cancun EVM.
- Hardhat 3.16.0, viem 2.56.3, Playwright 1.63.0 / Chromium.
- A separate clean Git clone at `8a03eda` fetched the exact three upstream submodules, installed with `npm ci`, and passed `npm run check`. The subsequent `a772188` change only corrects CSS specificity for the mobile jump control.
- The bounded numerical audit at `a772188e5b2137d26b98a32aed5ffba89b33ac0e` recorded a clean source tree, freshly compiled MathHarness artifact, tool versions and input hashes.
- A subsequent qualification/UX pass added the canonical Aqua fork demonstration and replaced the initial market layout with a guided Swap flow. The earlier clean-clone and numerical manifest remain evidence for their recorded revisions, not an assertion that those manifests cover later edits.
- The final product pass added validated configuration, saved positions and receipts, cancellation/replacement handling and stale-wallet-state protection. The current check and browser suites passed after these changes; the Solidity implementation is unchanged.

## Results that ran

| Check | Result |
| --- | --- |
| Solidity compilation | Pass. GaussVM deployed runtime: 16,226 bytes, below the EVM 24,576-byte limit. |
| Contract / mathematical / economic / workspace suite | **21 tests passed**: 16 onchain/numerical tests and 5 configuration, persistence and receipt-state tests. Includes real official-Aqua transfers in both directions. |
| Browser suite | **7 scenarios passed**: swaps/export, mobile/reduced motion, no-deployment preview, receipt failure/reload/recovery, malformed configuration, cancellation/reload, saved positions and maker lifecycle. |
| Canonical Aqua fork | Pass at Ethereum source block 25,954,422: matching Aqua bytecode, position ship and an actual local swap. No public transaction. |
| TypeScript and Vite production build | Pass. Separate Ethereum bundle and self-hosted Latin font; no oversized-chunk warning. |
| Public static build | Pass; confirmed it excludes local `deployment.json` and restores the local development manifest. |
| JavaScript dependency audit | **0 known vulnerabilities** reported by npm at verification time. |
| Separate clean-clone install/check | Pass, including dependency retrieval, all 16 tests, TypeScript and build. |
| Bounded numerical evidence runner | 7 tests passed; manifest includes source/artifact hashes, runtime and result log. |
| Desktop/mobile visual review | The isolated reviewer's three findings were corrected: text contrast, receipt recovery and mobile access. Verdict: ship at the scope of those fixes. |

## Numerical observations

- 121 CDF/PDF samples on [-3,3], spaced by 0.05.
- Maximum observed CDF absolute error: **2.886579864025407e-15** against independent Simpson quadrature.
- 45 swap-root comparisons using three liquidity scales, five initial scores and three trade fractions; output error stayed below the test tolerance of 2e-9 L.
- Exact CDF complement symmetry and conservative fixed-point invariant residuals passed.
- Sampled round trips, monotonicity, trade splitting and a 20-trade alternating sequence passed their stated assertions.

The domains, tolerances, arithmetic and non-claims are specified in [math.md](math.md). These observations do not establish a universal error bound or economic safety.

## Transfer and gas evidence

The integration fixture's two measured swaps used **767,171 gas** (NO to YES) and **576,555 gas** (YES to NO). The final local RPC demo measured **762,392 gas** for its swap of 10 NO to 9.936740437215125 YES. Gas depends on reserves, direction, warm/cold state and arithmetic convergence; these are examples, not upper bounds or optimization claims.

`npm run demo` generates `reports/demo.json`, containing actual transaction hashes, block numbers, receipt logs, quote and wallet balance changes. Tests assert maker/taker deltas and no residual input balance in Aqua/router. A simulated quote is not substituted for a mined swap.

`npm run audit:math` regenerates `reports/math-audit.json` and `reports/math-audit.log`. The manifest validator accepted the version 1 evidence format. It is a legacy schema: no OS memory/CPU limits are certified, and input hashes are a project-specific field. The runner does enforce subprocess timeouts and checks that source/artifact hashes did not change during the run.

## Browser behavior exercised

The tests execute both swap directions, limited approvals, complete-set preparation and merge, real maker ship/dock, local expiry advancement, resolution and redemption. All seven scenarios passed in the final browser run, including Connect → Get tokens → Swap progression, the first mobile action in the viewport with at least 44px height, no horizontal overflow, hidden-until-expanded research curve, insufficient-balance prevention and RPC outage. An injected receipt-watcher RPC failure preserves an unknown transaction across reload; restoring RPC and selecting Check receipt observes its successful receipt.

A real local-chain pending approval was replaced by a same-nonce cancellation. Its receipt remained cancelled after reload, outcome balances did not change, and the next token-preparation step did not run. Saved static/time-scaled positions survived reload and switching, including mobile layout checks. Receipt export was downloaded and parsed. A malformed deployment URL produced recovery instructions without a page crash. Desktop/mobile entry, trade and saved-position screenshots were inspected.

The canonical fork demonstration used **761,917 gas** for 10 NO → 9.936740437215125 YES. Its source provenance and receipt are in [evidence/canonical-aqua-fork.json](evidence/canonical-aqua-fork.json). The initial attempt timed out on a free remote RPC; the successful run used longer localhost request timeouts. This path depends on upstream historical-state availability.

The nine integration tests passed again after strengthening assertions to match the specific slippage, deadline, exact-output and program-parser errors. Malformed and unknown-opcode orders are allocated through Aqua first, so missing allocation cannot substitute for the intended rejection.

The journal is a validated browser cache scoped to the deployment, not a complete chain indexer. Pending entries restore as unknown. Storage failures are surfaced and tested; clearing browser data can remove cached history. Injected-wallet rejection/account switching and public Sepolia transactions have not been tested with an external wallet. The cancellation test uses the local unlocked-account RPC. There is no claimed full browser/device matrix.

## Remaining external verification

No GitHub push, GitHub Actions run, website publication, public Sepolia deployment or external-wallet test was performed. Git commits remain local as requested. CI and Pages workflows are provided; their hosted executions must be checked after publication. No paid resource was used.

Solidity prints an upstream EIP-1153 transient-storage caution. The inherited SwapVM lock is cleared after execution, but this warning is not proof that every possible composed use is safe. No audit, formal proof, real-market LVR study or production certification is claimed.
