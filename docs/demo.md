# Judge demonstration

## Three-minute flow

**0:00–0:25:** Explain that binary outcome tokens have a finite horizon. Attribute the Gaussian pm-AMM concept to Moallemi and Robinson. GaussVM implements its pricing as a SwapVM instruction.

**0:25–0:50:** Open Liquidity. Show maker, Aqua, router and strategy addresses. Explain that ship records allocation while funds remain in the maker wallet.

**0:50–1:40:** Open Swap, select Connect to swap, then Get 100 YES + 100 NO. Swap 10 NO for YES, then reverse direction. Show the receipt. Present the `npm run demo:fork` execution and `reports/fork-demo.json` to show settlement through canonical Aqua. Identify the source block and distinguish local fork transactions from public-chain transactions. Remote RPC waits may be cut out of the recording, without speeding up playback or hiding which operations ran.

**1:40–2:15:** Show `contracts/GaussVM.sol` and the 162-byte program in the architecture guide. The custom instruction reads reserves, checks the pair/expiry and computes output; official SwapVM/Aqua settle it.

**2:15–2:40:** Open How it works → Explore the Gaussian curve. Scrub the illustrative time slider and explain that it does not mutate the live order. Optionally ship a time-scaled position. The integration test advances time and executes that strategy onchain.

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

The [event page](https://ethglobal.com/events/ethonline2026/prizes/1inch) remains authoritative. This is evidence mapping, not a prize guarantee. The supplied rules allow local forks. `npm run demo:fork` now provides a verified canonical-Aqua fork path; `npm run dev` remains the fast, independent local source-deployment UI path. Describe these environments accurately.

Before submission, complete [qualification.md](qualification.md), including [AI disclosure and human contributions](ai-usage.md). The CLI is now connected as krishna-aga; publication still awaits the owner's instruction. Retain the existing history, disclose reused work, check the published clone and record actual transfers with human narration. Do not claim an unimplemented oracle, additional sponsor integration or economic audit.

The required video is **2–4 minutes**, at least **720p**, with no AI voiceover. Submission is due **13 September 2026 at 21:30 IST**. See the [official submission guide](https://ethglobal.com/events/ethonline2026/info/details).

## Suggested description

GaussVM brings Gaussian prediction-market pricing to 1inch Aqua. Its custom SwapVM instruction exchanges collateral-backed YES/NO tokens while maker liquidity remains in the maker's wallet until settlement. A local demo shows real transfers, lifecycle redemption and a bounded solver checked against an independent reference. The interface distinguishes static pm-AMM from experimental cash-retaining time scaling and makes numerical limits and manual resolution explicit.
