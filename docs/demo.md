# Judge demonstration

## Three-minute flow

**0:00–0:25:** Explain that binary outcome tokens have a finite horizon. Attribute the Gaussian pm-AMM concept to Moallemi and Robinson. GaussVM implements its pricing as a SwapVM instruction.

**0:25–0:50:** Open Liquidity. Show maker, Aqua, router and strategy addresses. Explain that ship records allocation while trading outcome tokens remain in the maker wallet; BinaryMarket holds their collateral backing.

**0:50–1:40:** Open Swap, select Connect to swap, then Get 100 YES + 100 NO. Swap 10 NO for YES and show the receipt. Present `npm run demo:fork` and `reports/aqua-track-fork.json`: the full command shows two strategies sharing a wallet, both static trade directions and a time-scaled trade through canonical Aqua. Point to the transaction hashes and exact wallet/event checks. Identify the source block and distinguish local fork transactions from public-chain transactions. Remote RPC waits may be cut out of the recording, without speeding up playback or hiding which operations ran.

**1:40–2:15:** Show `contracts/GaussVM.sol` and the 162-byte program in the architecture guide. The custom instruction reads reserves, checks the pair/expiry and computes output; official SwapVM/Aqua settle it.

**2:15–2:40:** Show the executable time-scaled quote before and after the fork's local clock advance. If showing the UI curve slider, identify it as illustrative: the slider does not mutate a live order. The command's time-scaled swap is the actual execution evidence.

**2:40–3:00:** Show the successful docking, merge and redemption checks at the end of the command. Clearly label the YES resolution as a disposable-chain simulation, not an event result. State manual resolver trust, numerical bounds and the experimental status of time scaling.

## 1inch track evidence

| Supplied 1inch requirement | Evidence |
| --- | --- |
| Sophisticated Aqua position | Complementary outcomes, Gaussian pricing, shared wallet strategies, time scale and complete redemption. |
| Official contracts | Exact upstream submodules; unmodified Aqua and inherited SwapVM. |
| SwapVM usage | Opcode 0x80 is reached in actual swap transactions. |
| Token transfer demonstration | Three mined swaps in the full-lifecycle runner, matching token transfers, maker/taker balances and Aqua accounting. |
| Tests or UI | Both implemented. |
| Genuine Git history | Focused local commits as Krishna, without fabricated dates. |

The [event page](https://ethglobal.com/events/ethonline2026/prizes/1inch) remains authoritative. This is evidence mapping, not a prize guarantee. The supplied rules allow local forks. `npm run demo:fork` now provides a verified canonical-Aqua fork path; `npm run dev` remains the fast, independent local source-deployment UI path. Describe these environments accurately.

The repository and [Sepolia app](live-deployment.md) are published under krishna-aga with the existing history preserved. The sole target is **1inch — Build an Aqua App ($5,000)**. Krishna handles submission; [qualification.md](qualification.md) maps technical evidence, and [AI disclosure](ai-usage.md) records assistance and the solo-builder confirmation. Retain the existing licenses and attribution.

The required video is **2–4 minutes**, at least **720p**, with no AI voiceover. Submission is due **13 September 2026 at 21:30 IST**. See the [official submission guide](https://ethglobal.com/events/ethonline2026/info/details).

## Suggested description

GaussVM brings Gaussian prediction-market pricing to 1inch Aqua. Its custom SwapVM instruction exchanges collateral-backed YES/NO tokens while the maker's trading tokens remain in their wallet until settlement. Static and time-scaled strategies share that wallet inventory with separate Aqua accounting. A reproducible canonical-Aqua fork demo proves three swaps, exact token transfers, maker-controlled docking, merging and full redemption. The bounded solver is checked against an independent reference; the interface makes experimental time scaling, numerical limits and manual resolution explicit.
