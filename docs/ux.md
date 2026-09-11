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

- **Swap:** one panel groups the test-market question, manual resolution, implied probability, current setup step, actual quote/minimum output and primary action. The receipt journal appears once there is a transaction to show.
- **Your balances & test tokens:** expandable wallet balances and the additional token-preparation action.
- **Liquidity:** allocations, strategy addresses, ship/dock, merging, resolution and redemption.
- **How it works:** original research, expandable curve/time illustration, comparison and exact implementation boundaries.

The old sidebar, promotional heading, large probability display and mobile jump shortcut were removed. The primary task now sits directly in a narrow column. Moving the curve removes the need to jump past it. No contract capability was removed.

The subsequent cleanup removes repeated introductions, the second swap heading, duplicate direction controls and the empty receipt placeholder. Get YES / Get NO remains the single direction selector. The amount fields are more compact, with the sage material and readable labels retained.

Wallet events now describe state instead of producing a generic disconnection error. Unchanged events leave the session intact, selecting another account refreshes balances, and a wrong chain exposes **Switch to Sepolia**. A genuine account change during approval still stops the next transaction. Declined requests show a short retry message.

The single ETHOnline question is read from the chain. “What counts as a win?” reveals the prize criteria without expanding the initial screen. All liquidity strategies use this one market. The direction selector moves its raised selection surface in 200ms. After a fresh successful swap receipt, a 650ms YES/NO stamp identifies the purchased side and a clipped check mark completes the feedback. Failed, pending and unknown transactions never trigger it; restored receipts remain static. Reduced-motion settings remove movement while preserving the outcome label and receipt link. Both sides have equally affirmative purchase feedback: buying NO is not a failed action.

Test assets, manual resolution, slippage/minimum output and the separation between approval and swap remain visible where they matter. Transaction uncertainty still blocks new writes, preserves the hash across reloads and offers receipt recovery. A confirmed swap has an inline link to its receipt. Saved positions have a selector under Liquidity, and the journal can be downloaded. Only wallet access requires reconnection after a reload; no keys are cached. Storage failures remain visible.

## Verification

The twelve-scenario Playwright suite covers first-time step progression, actual swaps in both directions, 390px mobile first-action visibility/target size, no horizontal overflow, reduced motion, expandable curve navigation, missing/malformed deployment, RPC outage, receipt recovery across reload, receipt download, wallet cancellation, saved-position selection and the complete maker lifecycle. Four provider-event scenarios additionally cover duplicate events, account changes/revocation, switch/add-network recovery, rejected requests, mid-approval account changes and local-session isolation. A slow-RPC case ensures an unchanged block's quote is not restarted by balance polling. The injected provider fixture routes all writes to the local EVM; it does not automate wallet-extension dialogs. Screenshots of entry, trade and saved-position states were inspected on desktop and mobile. No claim is made about user-study completion times or a full assistive-technology/device matrix.
