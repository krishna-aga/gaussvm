# Verification

Recorded results below are from **12 September 2026** and earlier deployment runs. Saved evidence applies to its recorded source hashes and chain state. Rerun the commands to verify a changed checkout.

## Run the checks

```sh
npm ci
git submodule update --init --recursive
npm run check
npx playwright install chromium
npm run test:browser
npm run audit:math
npm audit --audit-level=high
```

`npm run check` compiles Solidity, runs core tests, gas comparisons and the local lifecycle, then typechecks and builds the interface. Browser tests create and resolve a local market; run `npm run deploy:local` with the node running before using it for a manual demo.

## Recorded results

| Check | Result and scope |
| --- | --- |
| Core suite | 24 tests passed, covering numerical/economic behavior, real Aqua transfers, router migration, configuration, persistence and receipt states. |
| Gas regression | 3 tests passed: 1,246 exact return/revert comparisons and 16 paired swaps. Measured gas reductions were 21.37–28.85%. [Benchmarks](gas-optimization.md). |
| Local lifecycle | 9 milestones passed, including shared wallet strategies, three swaps, docking, merging and full redemption. |
| Browser suite | 12 scenarios passed: both swap directions, mobile/reduced motion, wallet events, receipt recovery, cancellation, saved positions and maker lifecycle. |
| TypeScript and Vite | Typecheck and production build passed. The public build excluded localhost configuration. |
| Dependency audit | npm reported 0 vulnerabilities at the time of the recorded run. |
| Hosted Sepolia swap | 10 NO produced 9.811808425194647650 YES using 612,134 gas at the migrated reserve state. Receipt events and wallet deltas matched. [Evidence](evidence/gas-ui.json). |
| Source verification | All six current Sepolia contracts had exact creation/runtime matches on Sourcify. [Evidence](evidence/gas-source-verification.json). |

Recorded environment: Windows x64, Node 22.16.0, npm 11.4.2, Solidity 0.8.30 with optimizer 200/viaIR/Cancun, Hardhat 3.16.0, viem 2.56.3 and Playwright 1.63.0 with Chromium.

## Reproduce the lifecycle

```sh
npm run demo:track
npm run demo:fork
```

Each command starts and closes its own disposable local EVM. The first deploys official Aqua source; the second uses canonical Aqua at `0x1111113ccf1426a8e30e2bff5e005d929bf6a90a` on an Ethereum fork and checks its bytecode against the source block. See [fork configuration](deployment.md#canonical-aqua-on-a-free-local-fork) for RPC and block options.

The lifecycle ships static and time-scaled strategies against the same maker wallet, executes both static directions and a time-scaled swap, docks both strategies, merges complete sets, and simulates YES resolution/redemption. Swap assertions check exact maker/taker balance changes, Aqua and SwapVM events, output transfers, no residual custody, and unchanged accounting for the other strategy.

Reports are saved to `reports/aqua-track.json` and `reports/aqua-track-fork.json`. The [saved canonical report](evidence/canonical-aqua-track.json) records 9 milestones, 3 swaps and 18 lifecycle receipts at Ethereum source block **25,959,307**, with source/artifact hashes. All writes and the simulated resolution occurred on localhost; fork transaction hashes are not public-chain receipts.

For a single swap against the running UI market, use `npm run demo`; its quote, receipts and balance changes are saved to `reports/demo.json`.

## Numerical coverage

The recorded numerical checks sampled 121 CDF/PDF points on [-3,3] at 0.05 spacing and 45 swap roots across three liquidity scales, five scores and three trade fractions. Maximum observed CDF error was **2.886579864025407e-15** against independent Simpson quadrature; root error stayed below **2e-9 L**. Complement symmetry, conservative residuals, round trips, monotonicity and trade splitting passed their stated assertions.

`npm run audit:math` writes `reports/math-audit.json` and its log, including tool versions and source/artifact hashes. It checks that those hashes remain unchanged during the run. Supported domains and tolerances are specified in [math.md](math.md).

## Evidence and limits

- [Gas equivalence](evidence/gas-equivalence.json) and [paired settlement measurements](evidence/gas-settlement.json) compare identical reserve, timestamp, allowance and compiler states.
- [Router migration](evidence/gas-router-migration.json) records the Sepolia seed migration. [Live deployment](live-deployment.md) lists contracts, public receipts and historical evidence.
- Browser tests use an injected provider backed by a local EVM; the public smoke test signs in Node. Wallet-extension dialogs and a full browser/device matrix were not tested. Desktop and 390px mobile captures were inspected in the recorded runs.
- Finite numerical tests, source verification and passing builds do not establish an all-input proof, contract audit, real-market LVR result or profitability. See [security limits](security.md).
