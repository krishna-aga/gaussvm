# Simpler first-swap flow

The task is to execute and understand a test swap. The sage neumorphic material is preserved, but the initial screen now has one primary action at each stage: **Connect → Get tokens → Swap**. Progress reflects wallet/balance state, not a timer. A funded returning wallet reaches the swap form directly.

## Principles applied

| Guidance | Implementation |
| --- | --- |
| [Hick's Law](https://lawsofux.com/hicks-law/) | Reduce competing choices. Token preparation becomes the main action for an empty wallet; the advanced curve no longer competes with execution. |
| [Chunking](https://lawsofux.com/chunking/) | Group connection/setup/trade into an ordered sequence. Keep each amount with its token, balance and quote. |
| [Fitts's Law](https://lawsofux.com/fittss-law/) | The full-width primary button, direction buttons and icon controls have at least 44px height. The mobile first action appears in the initial viewport. |
| [Jakob's Law](https://lawsofux.com/jakobs-law/) | Keep familiar pay/receive fields, a visible swap direction and standard expandable details. |
| [Doherty Threshold](https://lawsofux.com/doherty-threshold/) | Show pending work promptly and display receipt-based success or uncertainty. Blockchain confirmation is not promised within 400ms. |

These are design decisions informed by Laws of UX, not measured user-study results or a quantified speed improvement.

## Where the details went

- **Swap:** test-market question, manual resolution, implied probability, current setup step, actual quote/minimum output, the primary action and receipt journal.
- **Your balances & test tokens:** expandable wallet balances and the additional token-preparation action.
- **Liquidity:** allocations, strategy addresses, ship/dock, merging, resolution and redemption.
- **How it works:** original research, expandable curve/time illustration, comparison and exact implementation boundaries.

The old sidebar, promotional heading, large probability display and mobile jump shortcut were removed. The primary task now sits directly in a narrow column. Moving the curve removes the need to jump past it. No contract capability was removed.

Test assets, manual resolution, slippage/minimum output and the separation between approval and swap remain visible where they matter. Transaction uncertainty still blocks new writes, preserves the hash and offers receipt recovery. A confirmed swap has an inline link to its receipt. Session-only history remains a limitation.

## Verification

The updated five-scenario Playwright suite covers first-time step progression, actual swaps in both directions, 390px mobile first-action visibility/target size, no horizontal overflow, reduced motion, expandable curve navigation, missing deployment, RPC outage, receipt recovery and the complete maker lifecycle. Screenshots of entry and trade states were inspected on desktop and mobile. No claim is made about user-study completion times or a full assistive-technology/device matrix.
