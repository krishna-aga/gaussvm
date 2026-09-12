# GaussVM for Build an Aqua App

**Sole target: 1inch — Build an Aqua App ($5,000). Solo builder: Krishna Agarwal.**

GaussVM is a prediction-market liquidity position whose Gaussian pricing runs as a custom instruction inside official SwapVM. Official Aqua keeps track of the maker's strategy allocations and settles the outcome-token transfers. The UI, test suite and disposable-chain demo exercise that complete path.

## Why this fits the track

The [official challenge](https://ethglobal.com/events/ethonline2026/prizes/1inch) asks for a sophisticated Aqua position, permits custom SwapVM instructions, favors SwapVM use and requires demonstrated transfers with proper Git history.

| What judges can evaluate | GaussVM's concrete contribution |
| --- | --- |
| Position sophistication | Collateral-backed complementary outcomes, Gaussian exact-input pricing, static and experimental time-scaled strategies, merge and redemption. |
| Aqua's role | A single wallet can authorize multiple strategies without depositing its trading tokens into either. Each swap changes only its selected strategy's accounting. |
| SwapVM's role | Opcode `0x80` reads the live Aqua reserves and sets swap output. The inherited engine validates the order and settles the trade. Removing this instruction removes the executable pricing path. |
| Technical evidence | Bounded independent numerical comparisons, exact gas regression checks, receipt events and exact maker/taker balance deltas. |
| Usable demonstration | A live Sepolia interface, a standalone local lifecycle command and the same demonstration against canonical Aqua on an Ethereum fork. |

The pm-AMM research is by Ciamac Moallemi and Dan Robinson. GaussVM's contribution is its bounded implementation in SwapVM and the complete Aqua-backed position, not invention of the Gaussian invariant. See [research](research.md) and [gas measurements](gas-optimization.md).

## One command for the position

After `npm ci` and `git submodule update --init --recursive`:

```sh
npm run demo:track
```

The command creates a disposable local chain, runs the lifecycle and closes that chain. It needs no wallet, faucet or running UI. Its output shows nine checked milestones:

1. Ship 1,000 YES + 1,000 NO; the maker retains all those outcome tokens and the ship receipt contains no token transfers.
2. Ship a second, time-scaled strategy against the same wallet inventory, with no second deposit.
3. Execute 10 NO → YES through the static strategy.
4. Execute 10 YES → NO through the static strategy.
5. Advance the local clock to 75% of the market lifetime and observe a changed executable time-scaled quote.
6. Execute 10 NO → YES through the time-scaled strategy. Each swap checks both wallets, Aqua's Pushed/Pulled events, the output Transfer, the Swapped event, the selected allocation and the unchanged other allocation.
7. Dock both strategies. Tokens remain in the maker wallet and their quotes now reject with Aqua's specific inactive-strategy error.
8. Merge complete sets back into collateral.
9. Advance to expiry, simulate a manual YES resolution and redeem both holders. Payouts match their winning tokens; no collateral or outcome supply remains.

The JSON report is `reports/aqua-track.json`. It includes transaction hashes, blocks, raw receipt logs, before/after balances, strategy hashes, source/artifact hashes, upstream commits and runtime code hashes. `npm run check` includes this demonstration, and CI is configured to upload the report as `aqua-track-evidence`.

## Canonical Aqua demonstration

```sh
npm run demo:fork
```

This executes the same lifecycle against Aqua at `0x1111113ccf1426a8e30e2bff5e005d929bf6a90a`. It compares the fork's code to the source block before deploying GaussVM. Ethereum is read-only; all signed transactions go to the disposable local fork on port 8546, chain 31337. The normal UI market is independent.

The report is `reports/aqua-track-fork.json`. `FORK_RPC_URL` can select another Ethereum read RPC and `FORK_BLOCK` can select an available historical block. Free RPC availability can affect setup time. Local-fork transaction hashes do not appear on a public explorer. The [existing Sepolia receipts](live-deployment.md) are the public-chain evidence.

## What to show and say

Start with the live app and a short explanation: **“GaussVM gives binary outcome tokens a Gaussian pricing curve, implemented directly inside SwapVM, while Aqua keeps the maker's trading tokens in their wallet until a trade executes.”**

Show a swap and its receipt. Then run the canonical fork command and point out the Aqua address, both strategies sharing one wallet, the three successful swap transactions and the redemption result. Show `contracts/GaussVM.sol` to connect opcode `0x80` to the execution. The [demo guide](demo.md) gives a timed walkthrough.

## Boundaries that matter to this position

- Shared allocations do not multiply tokens or guarantee simultaneous liquidity. Maker balances and allowances still determine whether a trade can settle.
- Outcome tokens remain in wallets; their gUSD backing is held by `BinaryMarket` until merge or redemption.
- The time-scaled variant retains inactive complete sets. It does not establish the paper's complete dynamic LVR result.
- This is a zero-fee test-token prototype with a manual resolver. It does not demonstrate LP yield or a production-ready prediction market. The demo's YES resolution is a local simulation, not a statement about event results.

These limits keep the project's claims aligned with what judges can execute and inspect.
