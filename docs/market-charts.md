# Market chart and pm-AMM examples

The frontend pairs the selected position's onchain pricing history with interactive explanations for a video walkthrough. It retains the sage/cream palette, Manrope typography, existing neumorphic surfaces, and the supplied logo.

## Where to find them

- **Swap outcomes:** the **YES probability** graph answers “Will GaussVM win ETHOnline 2026?” for the selected maker position. The trading panel shows the same current implied YES probability.
- Above 960px, the graph is on the left and trading is on the right. At 960px and below, trading comes first and the graph follows, keeping connection and swap controls ahead of history.
- **How it works:** **See a trade change the price.** appears before the explanatory article. The graph's **Watch how a trade moves the price** button opens this page at the top.
- **Explore the Gaussian curve** expands a separate illustration of time scaling. The trade example's graph and controls sit side by side on desktop and stack on narrower screens.

## Actual market readings

The current reading uses the selected maker's YES and NO allocations in Aqua, read at the same block as market status. It does not use the viewer's token balances or aggregate all positions.

```text
z = (reserveNo - reserveYes) / effectiveLiquidity
implied YES probability = Phi(z)
effectiveLiquidity = L0                         (static position)
effectiveLiquidity = L0 sqrt((expiry-t)/(expiry-start))  (time-scaled position)
```

`Phi` is the reference implementation's normal CDF; reserves and liquidity use matching units. This is a numerical display derived from actual chain state, not an executable quote, the YES/NO exchange ratio, or an ETHGlobal forecast. Contract arithmetic and limits are described in [math.md](math.md).

Missing deployment/state, inactive allocations, a resolved market, pre-start or expiry-minus-60-seconds timing, nonpositive reserves, effective liquidity below one token, or an unsupported score outside `[-3, 3]` produce **Current pricing unavailable**. The graph does not manufacture a 50% starting point.

History is bounded and read-only:

- Scan router `Swapped` logs from `max(0, currentBlock - 7200)` through the snapshot block, in requests of at most 2,000 blocks.
- Filter by router, maker, order hash, and the YES/NO pair; reject removed events and invalid amounts.
- Read actual end-of-block allocations for the latest 24 distinct matching trade blocks, plus the block immediately before the oldest retained trade block. Add or replace the latest current snapshot separately.
- Use each block's timestamp, displayed in the browser's local date/time format. Multiple swaps in one block share an end-of-block observation; this is not a tick-by-tick execution-price chart.
- Failed historical reads or a detected block-hash mismatch leave gaps. Unsupported historical pricing also breaks the line. Connections between available points are only a visual guide.
- Show up to six recent swaps, newest first, with input/output amounts and a receipt link when an explorer is configured; otherwise show the block number.

Move the pointer over the graph, or use **Previous point** / **Next point**, to inspect the timestamp, block, and probability. These buttons appear when multiple observations exist. SVG descriptions and text readings also expose the graph's meaning without relying on color or pointer interaction.

The app refreshes its block snapshot every seven seconds. History reloads when the deployment/position changes, the snapshot crosses a 30-second timestamp bucket, allocations or status change, or a confirmed swap hash arrives. Allocation changes trigger another scan even if a receipt arrived before the refreshed balances. **Refresh market history** retries the history read. A history RPC failure keeps earlier history for the same position with a notice; the current reading and trading controls remain independently available when their chain reads succeed.

## Example controls and boundaries

The trade example starts at 1,000 YES, 1,000 NO, and 50%. It uses an ideal static, zero-fee research curve in local component state. Buying YES pays NO and reduces the maker's YES inventory, raising implied YES probability; buying NO moves it the other way.

- Set **Example trade size** from 10 to 300 tokens in steps of 10, then select **Example: buy YES** or **Example: buy NO**.
- The marker and inventory values animate along the same invariant curve over 850ms. The text reports tokens paid/received and before/after probability.
- **Play walkthrough** resets the example and plays three trades: buy YES with 100 NO, buy YES with 200 NO, then buy NO with 150 YES.
- **Pause walkthrough** freezes playback; **Resume walkthrough** continues it. Playback pauses if the example leaves the viewport or the tab becomes hidden.
- **Reset trade example** restores the even starting position and clears playback, trade text, and errors. Manual inputs are disabled during an animation or active walkthrough. Trades beyond the example's supported range show a reset message.
- With the system's reduced-motion preference enabled, values update immediately and **Next example trade** advances the scripted sequence one deliberate step at a time. Preference changes are observed while the page is open.

Examples require no wallet connection and send no transactions or gas. Their outputs are illustrations; real quotes come from the contract's bounded numerical solver.

The time illustration scales the normalized Gaussian liquidity shape by the square root of remaining lifetime; the dashed constant-product reference stays fixed. **Explore time to expiry** manually selects 5–100% remaining. **Play time example** advances to 5% over seven seconds; **Pause time example** stops it, and playing again from 5% restarts at 100%. It also stops when hidden or outside the viewport. Under reduced motion, **Advance time example** subtracts 25 percentage points, wrapping to 100% when at 25% or less. Set the slider to 100% to reset manually.

This normalized shape is not absolute depth, TVL, a live order book, or performance evidence. Its probability marker uses the current position's implied probability when available, otherwise an illustrative 50% center. Moving its time slider does not alter the position or its quotes.

## Brief video walkthrough

1. Open **Swap outcomes** and show the market question, current probability, selected-position history, and recent swaps. Use observation controls to connect a reading to its block.
2. Select **Watch how a trade moves the price**. Start the walkthrough and explain the YES inventory decrease as the marker moves toward a higher YES probability.
3. Pause to show tokens paid/received, resume through the NO trade, then reset. Demonstrate one manual trade size if useful.
4. Expand **Explore the Gaussian curve**, play or manually advance time, and identify it as a normalized illustration. Return to **Swap outcomes** for actual position pricing.

## Maintenance and validation

- `web/src/MarketChart.tsx`: current reading, history rendering, observation controls, refresh dependencies, and recovery notices.
- `lib/market-history.mjs`: log matching, scan/sample bounds, historical allocation reads, timestamps, and gaps.
- `lib/chart-math.mjs`: current probability guards, ideal example trades, and invariant-preserving animation positions; `lib/reference.mjs` supplies the numerical functions.
- `web/src/TradeExplainer.tsx`, `Curve.tsx`, and `useReducedMotion.ts`: example state, playback, normalized shape, and motion preferences.
- `web/src/App.tsx`: block-consistent snapshot, polling, position selection, page navigation, and placement. `web/src/charts.css` extends the existing visual system and responsive layout.

Recorded validation for this feature: six chart-data unit tests and six chart browser tests passed. The seven app, four wallet, and one quote browser tests also passed across the validation runs; `npm run build:public` passed. These results cover the tested local behavior and do not establish production deployment or financial accuracy.

```sh
node --test test/chart-data.test.mjs
npx playwright test test/browser/charts.spec.ts
npx playwright test test/browser/app.spec.ts test/browser/wallet.spec.ts test/browser/quote.spec.ts
npm run build:public
```

Browser tests use the Playwright local development setup and can redeploy the local fixture and execute local test swaps. The chart suite covers reload persistence, example direction/playback/reset, time pause, reduced motion with no example transactions, history failure, and desktop/mobile layout.

The finishing review returned **ship**, with no material fixes. Review captures: `.impeccable/review/charts-desktop.png`, `charts-mobile.png`, `explainer-detail-desktop.png`, and `explainer-detail-mobile.png`.
