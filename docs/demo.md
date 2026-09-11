# Judge demonstration

## Three-minute flow

**0:00–0:25:** Explain that binary outcome tokens have a finite horizon. Attribute the Gaussian pm-AMM concept to Moallemi and Robinson. GaussVM implements its pricing as a SwapVM instruction.

**0:25–0:50:** Open Liquidity. Show maker, Aqua, router and strategy addresses. Explain that ship records allocation while funds remain in the maker wallet.

**0:50–1:40:** Connect the demo trader, prepare test sets, swap 10 NO for YES, and reverse direction. Show real receipts. Run `npm run demo` in another terminal and open `reports/demo.json` for quoted output, balance deltas and event logs. Explicitly identify the local EVM.

**1:40–2:15:** Show `contracts/GaussVM.sol` and the 162-byte program in the architecture guide. The custom instruction reads reserves, checks the pair/expiry and computes output; official SwapVM/Aqua settle it.

**2:15–2:40:** Scrub the illustrative time slider and explain that it does not mutate the live order. Optionally ship a time-scaled position. The integration test advances time and executes that strategy onchain.

**2:40–3:00:** Show resolution/redemption or its passing tests. State manual resolver trust, numerical bounds, unaudited status and the difference between the cash-retaining extension and the paper's complete LVR result.

## Primary-track evidence

| Supplied 1inch requirement | Evidence |
| --- | --- |
| Sophisticated Aqua position | Complementary outcomes, Gaussian pricing, optional time scale. |
| Official contracts | Exact upstream submodules; unmodified Aqua and inherited SwapVM. |
| SwapVM usage | Opcode 0x80 is reached in actual swap transactions. |
| Token transfer demonstration | Script/browser transactions, receipts and asserted balance deltas. |
| Tests or UI | Both implemented. |
| Genuine Git history | Focused local commits as Krishna, without fabricated dates. |

The [event page](https://ethglobal.com/events/ethonline2026/prizes) remains authoritative. This is evidence mapping, not a prize guarantee. The supplied rules allow local forks; this implementation demonstrates a fresh local EVM running official source deployments. It is not represented as a mainnet fork or canonical live Aqua deployment. Confirm that format with the sponsor if they require canonical-instance evidence beyond source fidelity.

Before submission, push the existing commits once the correct account is connected; verify permitted build dates and disclose pre-existing work; rerun checks from a clean clone; record a video visibly executing a transfer; include actual environment and explorer links only if deployed. Do not claim an unimplemented oracle, additional sponsor integration or economic audit.

## Suggested description

GaussVM brings Gaussian prediction-market pricing to 1inch Aqua. Its custom SwapVM instruction exchanges collateral-backed YES/NO tokens while maker liquidity remains in the maker's wallet until settlement. A local demo shows real transfers, lifecycle redemption and a bounded solver checked against an independent reference. The interface distinguishes static pm-AMM from experimental cash-retaining time scaling and makes numerical limits and manual resolution explicit.
