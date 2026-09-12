# 1inch Build an Aqua App — technical qualification

Scope checked against the [official 1inch challenge](https://ethglobal.com/events/ethonline2026/prizes/1inch) on **2026-09-12**. GaussVM exclusively targets **Build an Aqua App ($5,000)**. Krishna Agarwal is the solo builder and is handling the event submission.

## Requirements and evidence

| Track requirement | Implementation and executable evidence |
| --- | --- |
| Custom Aqua app implementing a sophisticated DeFi position | Collateral-backed YES/NO outcomes, Gaussian exact-input pricing, static and time-scaled strategies, shared wallet allocations and complete-set merge/redemption. `npm run demo:track` exercises the entire position. |
| Official Aqua / SwapVM contracts | Official Aqua and SwapVM sources are pinned as unmodified Git submodules. `GaussVM.sol` inherits official SwapVM and overrides dispatch for Gaussian opcode `0x80`. `npm run demo:fork` uses Aqua's actual canonical deployment on a local Ethereum fork. |
| Demonstrate final positions through tests, scripts or UI | `npm run check` includes contract, numerical, economic, gas-regression and full-lifecycle track checks. `npm run test:browser` exercises the interface. A [Sepolia app](https://krishna-aga.github.io/gaussvm/) is also available. |
| Present onchain token transfers during the demo; local forks allowed | The track runner mines three swaps and asserts exact maker/taker deltas, matching Aqua Pushed/Pulled and SwapVM Swapped events, the output ERC-20 Transfer, no residual custody and isolated strategy accounting. Its canonical-fork mode provides the same proof against official deployed Aqua. Show this execution and the resulting report in the demo. |
| Proper Git history; no single-commit entry on the final day | The repository already has 47 incremental commits from 2026-09-11 before this track-readiness pass, covering research, contracts, interface, tests, deployment and optimization. Existing commits and dates are preserved. Subsequent work uses ordinary focused commits. |
| SwapVM projects receive higher scoring | Opcode `0x80` runs in the actual quote/swap path, with official order validation, slippage/deadline enforcement, locking and Aqua settlement. This establishes implementation evidence, not a judging outcome. |

## Reproduce the evidence

```sh
npm ci
git submodule update --init --recursive
npm run check
npx playwright install chromium
npm run test:browser
npm run demo:fork
```

`npm run demo:track` also runs the lifecycle independently, without the UI or a node already running. It creates and closes its own EVM. The fork command uses a separate localhost node on port 8546. Both commands use test tokens and deliberately simulate resolution on a disposable chain; neither changes the public market or the normal UI's local market.

| Artifact | What it establishes |
| --- | --- |
| `reports/aqua-track.json` | Local-source lifecycle with nine checked milestones, three swaps, exact balance/event checks and source hashes. |
| `reports/aqua-track-fork.json` | The same lifecycle using canonical Aqua, including source block, bytecode hash and actual local-fork receipts. |
| [Current canonical fork evidence](evidence/canonical-aqua-track.json) | Saved report for the track-readiness run, tied to its recorded source hashes. |
| [Earlier canonical fork evidence](evidence/canonical-aqua-fork.json) | Historical one-swap demonstration on the pre-optimization router; retained with its original source block and gas measurement. |
| [Public Sepolia evidence](live-deployment.md) | Existing public contract addresses, source verification and live swap receipts. |
| [Verification record](verification.md) | Executed checks with their scope and limitations. |

The canonical Aqua address is **`0x1111113ccf1426a8e30e2bff5e005d929bf6a90a`**, published in the [pinned upstream README](https://github.com/1inch/aqua/blob/9c5c42e5840e8741fba3597c48456c9510212b66/README.md#deployments). The fork runner checks that the code at that address matches the Ethereum source block. It deploys the custom SwapVM extension, as the challenge permits. No code is injected or replaced at Aqua's address.

The fork connection reads Ethereum; all signed transactions stay on localhost, chain 31337. Fork hashes do not exist on Etherscan. Free RPC historical-state availability can affect reruns; use `FORK_RPC_URL` or `FORK_BLOCK` when necessary. Regular local mode deploys the official Aqua source at a fresh address and does not describe that address as canonical.

## Track scope and presentation

The strongest demonstration is the executable position: shared wallet liquidity → custom Gaussian pricing → real Aqua transfers → maker-controlled docking → outcome redemption. The [1inch brief](1inch-track.md) explains the track fit and the [demo guide](demo.md) provides a timed walkthrough.

Numerical bounds, manual resolution, collateral custody and experimental time scaling remain explicit. No yield, audit or prize guarantee is claimed. Attribution, source licenses and [AI contribution disclosure](ai-usage.md) remain in the repository. Event registration, video upload and final submission are handled by Krishna; this document records technical evidence, not an application confirmation.
