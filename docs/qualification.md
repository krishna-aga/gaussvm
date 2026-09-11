# ETHOnline 2026 qualification review

Checked 2026-09-11. **Technical evidence is available; final submission eligibility is not yet fully confirmed.** A passing test suite cannot certify participant registration, human contributions, submission or judging decisions.

## Target prize

Primary target: **1inch — Build an Aqua App ($5,000)** in the From Scratch pool, subject to the team's actual registration and build history. The separate **$2,000 Continuity** prize is for registered Continuity participants. No other sponsor integration or prize eligibility is claimed. The supplied partner list does not require integrating every sponsor.

[Official 1inch requirements](https://ethglobal.com/events/ethonline2026/prizes/1inch)

| Requirement | Current evidence | Status |
| --- | --- | --- |
| Custom Aqua app with a sophisticated position | Complementary collateral-backed YES/NO positions; Gaussian exact-input pricing; static and experimental time-scaled modes. | Implemented |
| Official Aqua / SwapVM contracts | Pinned upstream sources; GaussVM inherits official SwapVM. The canonical Aqua fork run uses the existing published Aqua address, without replacing its code. | Verified locally and on a fork |
| Demonstrate the final position in scripts or UI | `npm run demo`, `npm run demo:fork`, integration tests and the React interface. | Executed |
| Present onchain token transfers during the final demo | Both demo scripts mine actual swaps and assert wallet balance changes. The recorded fork run uses canonical Aqua. | Evidence ready; final recorded presentation pending |
| Proper Git history | Focused commits began 2026-09-11, authored as Krishna. No backdating, squashing into one submission commit or manufactured history. | Present locally; publication pending |
| SwapVM usage improves scoring | Opcode `0x80` executes in the actual quote/swap path. This is a scoring preference, not a prize guarantee. | Implemented |

## Canonical contract evidence

`npm run demo:fork` starts an isolated local Ethereum fork at port 8546, checks Aqua's source-block bytecode against the fork, deploys the permitted custom SwapVM extension, ships a position and executes a swap. All signed transactions stay on localhost, chain 31337. The mainnet connection is read-only. The regular UI/node remain separate.

The successful run forked block **25,954,422**, used Aqua **`0x1111113ccf1426a8e30e2bff5e005d929bf6a90a`**, and swapped **10 NO → 9.936740437215125 YES** using **761,917 gas**. See [committed evidence summary](evidence/canonical-aqua-fork.json). Full receipt logs regenerate into `reports/fork-demo.json`. The swap hash belongs to the local fork and will not exist on Etherscan.

The address is published in [the pinned official Aqua README](https://github.com/1inch/aqua/blob/9c5c42e5840e8741fba3597c48456c9510212b66/README.md#deployments). The ordinary offline demo deploys unmodified Aqua source at a fresh address; it is not described as a canonical deployment. Use the fork demonstration in the submission to avoid that distinction being ambiguous.

## Event-wide submission requirements

Sources: [submission guidance](https://ethglobal.com/events/ethonline2026/info/details), [participant guide](https://ethglobal.com/events/ethonline2026/info/start), [rules](https://ethglobal.com/rules).

| Requirement | Action / status |
| --- | --- |
| Submission deadline | **13 September 2026, 12:00 EDT = 16:00 UTC = 21:30 IST.** Submit through the Hacker Dashboard. |
| Correct track and build period | Confirm the registered track and disclose any earlier project-specific work. Git timestamps support this repository's history but cannot establish activity outside it. |
| Participant eligibility | Each participant must meet acceptance/attendance requirements. Confirm dashboard check-ins and team details. These have not been inspected. |
| Repository and reused work | Publish the existing history; retain submodules, licenses, planning files and attribution. See [AI usage](ai-usage.md) and [third-party notices](../THIRD_PARTY_NOTICES.md). |
| Demo video | Record **2–4 minutes**, at least **720p**, with human narration and actual execution. Do not use AI voiceover or speed up playback. Video not yet supplied. |
| Partner selection | Select 1inch explicitly in the submission form and describe the integration. Up to three partners are allowed; only 1inch is currently supported. |
| AI transparency and team contribution | Disclose the substantial generated implementation. Meaningful team contribution is required and is **not yet documented sufficiently to certify eligibility**. See [ai-usage.md](ai-usage.md). |
| Finalist presentation, if chosen | Prepare the four-minute live demo and three-minute Q&A. Partner judging is asynchronous. |

The participant guide describes an attendance stake and a support route for financial constraints. This is separate from the free software infrastructure. No stake, payment or account submission was made by the coding assistant.

## Completion checklist

- [ ] Confirm registered track, participant acceptance, team and check-ins.
- [ ] Record verifiable human contributions and any pre-event project work in `ai-usage.md`.
- [ ] Publish the existing Git history when the owner authorizes it. The CLI is authenticated as `krishna-aga` with ADMIN permission; the standing instruction remains local-only.
- [ ] Run checks from the published clone and record the canonical-Aqua fork demo with human narration.
- [ ] Submit the repository, disclosures, 2–4 minute video and selected 1inch prize before the deadline.
- [ ] Save the actual submission confirmation. No submission is claimed until then.

Public Sepolia and website hosting are optional for the stated 1inch requirements because local forks are expressly allowed. No production deployment, real funds or extra sponsor SDK is necessary to demonstrate this track.
