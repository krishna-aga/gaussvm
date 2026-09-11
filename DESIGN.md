---
name: GaussVM
description: A daylight probability instrument with tactile sage surfaces and explicit transaction evidence.
colors:
  surface: "#e9ede8"
  ink: "#26372d"
  muted: "#52634f"
  green: "#315b41"
  green-hover: "#284d36"
  on-green: "#f4f7ee"
  recessed: "#e6ebe3"
  surface-hover: "#e0e7dc"
  badge-surface: "#dce4d9"
  badge-ink: "#4f6551"
  yes-surface: "#d4dfcf"
  yes-ink: "#315739"
  no-surface: "#e2ddd0"
  no-ink: "#706044"
  notice-surface: "#dce5d7"
  error-surface: "#eee0d7"
  error-ink: "#70442c"
  field-error: "#874326"
  focus: "#577e52"
  chart-comparison: "#9b8054"
  chart-fill: "#527b5c"
  chart-grid: "#ccd3cb"
typography:
  display:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "40px"
    fontWeight: 550
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "34px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "23px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  section:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "17px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "14px"
    fontWeight: 450
    lineHeight: 1.6
  label:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "11px"
    fontWeight: 450
    lineHeight: 1.6
  button:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.5
  amount:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "27px"
    fontWeight: 550
    lineHeight: 1.6
    letterSpacing: "-0.03em"
  address:
    fontFamily: "monospace"
    fontSize: "11px"
    fontWeight: 450
    lineHeight: 1.6
rounded:
  badge: "4px"
  token: "7px"
  control: "8px"
  button: "9px"
  navigation: "10px"
  segmented: "11px"
  field: "12px"
  formula: "14px"
  surface: "16px"
spacing:
  inline: "10px"
  compact: "12px"
  button-gap: "16px"
  mobile-gutter: "20px"
  mobile-section: "24px"
  detail-padding: "28px"
  desktop-section: "30px"
  desktop-gutter: "44px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.on-green}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "11px 16px"
  button-primary-hover:
    backgroundColor: "{colors.green-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "11px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-hover}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.green}"
    typography: "{typography.label}"
    padding: "7px 0"
  input-amount:
    backgroundColor: "{colors.recessed}"
    textColor: "{colors.ink}"
    typography: "{typography.amount}"
    rounded: "{rounded.field}"
    padding: "14px"
  navigation-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.green}"
    rounded: "{rounded.navigation}"
    padding: "11px 16px"
  token-yes:
    backgroundColor: "{colors.yes-surface}"
    textColor: "{colors.yes-ink}"
    rounded: "{rounded.token}"
    padding: "4px 9px"
  token-no:
    backgroundColor: "{colors.no-surface}"
    textColor: "{colors.no-ink}"
    rounded: "{rounded.token}"
    padding: "4px 9px"
  surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
  illustrative-badge:
    backgroundColor: "{colors.badge-surface}"
    textColor: "{colors.badge-ink}"
    rounded: "{rounded.badge}"
    padding: "4px 7px"
---

# Design System: GaussVM

## Overview

**Creative North Star: "The Daylight Probability Instrument"**

GaussVM uses the user-pinned neumorphic material recorded in [the interface direction](docs/design-direction.md): pale sage surfaces, paired daylight shadows, recessed fields and forest-green execution controls. The effect is calm, tactile and precise. Manrope connects the softly rounded controls to clear labels and measured numerical readouts; the Gaussian curve supplies the distinctive visual form without raster decoration.

The visual system supports inspection and action. Chain status, manual resolution, quote estimates and transaction evidence remain legible within the material. Depth groups controls and marks interaction; it does not replace text labels, state icons or keyboard focus. Preserve the chosen daylight sage identity when extending the interface.

This document captures `web/src/styles.css`, `web/src/App.tsx` and `web/src/Curve.tsx`, with desktop and mobile review captures as supporting visual evidence. The review handoff reported **ship** for its three fixed findings: contrast, receipt recovery and mobile access. That earlier disposition is limited to those findings; it establishes neither public deployment nor broader contract or economic approval. The subsequent first-swap simplification was verified with the updated browser suite and desktop/mobile captures.

**Key Characteristics:**

- Pale sage surfaces with paired raised and inset shadows.
- Forest-green actions, dark readable supporting text and restrained ochre comparison marks.
- Self-hosted Manrope with tabular transaction and balance figures.
- Explicit separation between curve illustration, executable quote and chain receipt.
- Responsive navigation, stacked mobile panels and direct access to swapping.

## Colors

The palette combines quiet green neutrals with a dark forest action accent; warm stone and ochre distinguish the complementary outcome and comparison curve.

### Primary

- **Forest green** (`green`) identifies execution controls, links, the Gaussian line, the probability marker and form accents. Its darker hover variant belongs to enabled primary buttons; `on-green` supplies their light text.
- **Focus sage** (`focus`) supplies the visible keyboard outline. Focus is an independent affordance, not a substitute for the raised or selected treatment.

### Secondary

- **Warm stone** (`no-surface`, `no-ink`) identifies NO tokens. **Muted ochre** (`chart-comparison`) is the dashed constant-product reference. These associations always retain written labels; color alone does not communicate direction or meaning.

### Neutral

- **Daylight sage** (`surface`) is the page and raised-panel material. **Recessed sage** (`recessed`) identifies amount wells.
- **Forest ink** (`ink`) carries headings, entered values and primary content. **Readable moss** (`muted`) is the resolved supporting-text color used throughout labels, explanations, axes and the transaction journal.
- **Light moss** (`badge-surface`, `badge-ink`) supports the explicit illustrative badge. **Outcome sage** (`yes-surface`, `yes-ink`) identifies YES tokens.
- **Notice sage** (`notice-surface`) supports setup guidance. **Clay notice** (`error-surface`, `error-ink`) and `field-error` distinguish actionable error copy without removing its words or icon.
- `chart-fill` is used only with fading opacity beneath the line; `chart-grid` supplies faint dashed guides. These are chart structure rather than text colors.

**The Readable Material Rule.** Keep the resolved supporting-text palette when adding content. Computed from the implemented opaque colors, `muted` has contrast ratios of 5.45:1 on `surface`, 5.33:1 on `recessed` and 4.98:1 on `notice-surface`. The primary button pair is 7.17:1. These are specific color-pair checks, not a claim that every interface state has been audited. Disabled controls use reduced opacity and must remain visibly disabled.

The companion `.impeccable/design.json` extends these primitives with component previews, shadows, motion and breakpoints. Its eight-step OKLCH color ramps are synthesized panel previews, not additional colors implemented by the application.

## Typography

**Display and body font:** Manrope Variable, with a sans-serif fallback. The Latin variable font is self-hosted from the OFL-licensed `@fontsource-variable/manrope` package, covers weights 200–800, and uses `font-display: swap`. Do not replace it with a remotely loaded font or a new display pairing during routine extensions.

The type feels precise without becoming a terminal. Headings are moderately weighted with tight tracking and balanced wrapping. The large implied-probability readout is lighter than a heading; amounts and output estimates follow that same measured emphasis. The system uses observed role sizes rather than a strict mathematical type scale.

- **Display:** the implied probability. It reduces to 34px at the intermediate breakpoint and 33px on mobile.
- **Headline:** page headings. They reduce to 29px at the intermediate breakpoint and 28px on mobile; mobile page headings are limited to 16ch.
- **Title and section:** market questions and panel headings. Details use 21px titles, and chart headings reduce to 14px on mobile.
- **Body:** the root text role. Operational explanations commonly use 12px; research prose uses 14px with a 1.95 line height and 72ch maximum width, reducing to 12px on mobile.
- **Label:** most quote details, reserve labels, journal metadata and supporting controls finish at 11px after the stylesheet's readability overrides. Test/version badges use 10px; the mobile illustrative badge remains 8px. Do not infer a blanket minimum from the base rules before the overrides.
- **Amount:** entered and estimated token amounts. Keep `font-variant-numeric: tabular-nums` on values, balances, odds and transaction figures.
- **Address:** plain monospace for contract addresses and strategy hashes, with wrapping anywhere when needed. Research formulas and command blocks also use monospace.

The SVG chart uses a 700-unit view box. Its text is 11 SVG units on desktop and 20 on mobile to compensate for visual scaling; those units are not the final rendered CSS pixel size.

## Layout

The application uses a horizontal brand/navigation header, a compact network/wallet row and a centered workspace. Navigation and the wider Liquidity/research workspace have a 1160px maximum width. The Swap workspace has a 656px maximum width including 32px side gutters, placing the primary task in a single column. At 740px and below, navigation wraps beneath the brand and gutters become 20px. The trade panel uses 26px padding on desktop and 22px by 20px on mobile. The first mobile Connect action is visible in the initial 390px by 844px viewport.

The ordered Connect, Get tokens, Swap indicators reflect current wallet/balance state. An empty wallet sees token preparation as the primary action; a funded wallet sees the direction/amount/quote form. Wallet balances and additional tokens live in native expandable details. The research curve and slider moved to an expandable section of How it works. Allocation figures moved to Liquidity. The former sidebar and mobile jump are removed because the curve no longer precedes the swap.

The market question, manual-resolution note and implied probability sit inside the trade panel. One page heading introduces the task. Get YES / Get NO is the single direction selector, and the two amount wells have 14px padding with a 10px gap. Repeated introductions and the empty journal placeholder are omitted.

Liquidity retains its two-column position controls and stacks at 740px. The research article retains its 830px measure. Full addresses wrap, code blocks scroll inside their container and amount inputs use `min-width: 0`. The primary execution flow remains narrow at all widths. See [the UX rationale](docs/ux.md).

## Elevation & Depth

Depth is structural. Broad paired shadows lift the main panels from the same-color page; inset shadows recess amount fields, direction tracks, the position amount and the formula panel. Smaller raised shadows identify buttons, the active navigation item and the selected direction. Thin green-gray dividers separate balance groups, the journal and supporting sections. A darker fill supplies primary-action emphasis without changing the material language.

### Shadow Vocabulary

- **Raised surface:** `8px 8px 20px #ced5cd, -8px -8px 20px #fff` (`--shadow`). Use for the major curve, trade and detail panels.
- **Recessed field:** `inset 4px 4px 9px #d0d7ce, inset -4px -4px 9px #fbfdf9` (`--inset`). Use for input wells, track containers and pressed buttons.
- **Secondary button:** `4px 4px 9px #cfd7cb, -4px -4px 9px #fff`.
- **Primary button:** `4px 4px 9px #c3cebe, -4px -4px 9px #fff`.
- **Active navigation:** `4px 4px 10px #ced5cd, -4px -4px 10px #fff`.
- **Selected direction:** `3px 3px 7px #c5cec0, -3px -3px 7px #f7fff3`.

Button background and shadow transitions take 150ms; pressing an enabled button applies the recessed shadow. Loading icons rotate over one second with a linear infinite animation. Time scrubbing updates the SVG directly without an animation tween. Under `prefers-reduced-motion: reduce`, all animations and transitions are removed and scrolling uses `auto`; the labels and static state icons remain.

## Shapes

The form language is gently rounded and rectangular. Large surfaces use the broadest standard corners; input wells and the brand mark are smaller; navigation, buttons, tokens and badges step down according to their role. The frontmatter records the implemented radius vocabulary. Status dots and chart markers are circular. Keep shapes subordinate to clear grouping: no decorative card should be added solely to repeat the shadow effect.

Icons are small Lucide line drawings paired with text or an accessible name. The mark is a waves icon inside a forest-green rounded square, followed by the differently weighted GaussVM wordmark. No generated raster assets are used.

## Components

### Buttons and focus

Buttons are raised and compact, with a 44px minimum height and the frontmatter padding; compact wallet controls use a 44px minimum height and 9px by 13px padding. Full-width trade actions distribute the label and icon across the row. Primary controls use forest green; secondary controls share the surface color; text actions are underlined and transparent. Enabled hover changes the fill, and enabled press uses the inset shadow. Disabled buttons use `opacity: 0.5` and a `not-allowed` cursor.

Buttons, links and inputs receive a 3px solid focus outline with a 4px offset; the amount input uses a 5px offset. Icon-only actions have accessible labels. Preserve native buttons and links rather than making generic containers clickable. Icon buttons and direction buttons have a 44px minimum height; icon buttons also have a 44px minimum width. This does not assert that every inline text link is a 44px target.

### Amount fields and direction selector

The amount field is a labeled recessed well with a balance row, a large decimal input and a written YES/NO token tag. The estimated output uses the same material but is an `output`, not an editable input. During quotation, the estimate becomes a loading icon; missing values appear as an em dash. The direction selector uses two native buttons with `aria-pressed`, a recessed shared track and a raised selected option. Its reverse-direction icon has an explicit accessible name.

### Navigation and surfaces

Swap, Liquidity and How it works are buttons in a named horizontal navigation region. The active item combines raised depth, green text and `aria-current="page"`. The same destinations remain available on mobile. Native details/summary controls expose wallet information and the research curve on demand. Slippage, minimum received, manual resolution and test-token value remain visible in the relevant flow.

When multiple positions have been created in this browser, Liquidity exposes a labeled native select with a 44px minimum height. The selected position survives reload. Changing it clears stale balances and quotes while the new position loads; switching is disabled during an operation or unresolved receipt.

### Curve and chain truth

The signature curve is a labeled SVG, sampled across the supported Gaussian domain and drawn against YES probability. A solid green profile and a dashed ochre constant-product reference have written legends. A vertical marker indicates the displayed probability; shaded area fades toward the baseline. The **ILLUSTRATIVE** badge, visible note and accessible SVG label explicitly identify the drawing as an illustration, not an executable quote or live depth measurement.

The time slider ranges from 5% to 100% remaining and compresses the normalized profile by the square root of the selected fraction. It changes only the illustration. The inline implied-probability figure is calculated from fetched allocation and strategy data; a disconnected or unavailable chain does not receive a fabricated value. The chart may center its illustrative marker at 50% when chain probability is unavailable. An actual quote is obtained separately from the router simulation, and its estimate, minimum received and 0.5% slippage protection are shown in the trade panel. The constant-product output is a separate calculated comparison under How it works, not a second executable quote.

### Notices and transaction journal

Preview mode names the absence of a deployment and explains local execution. Chain failures expose a retry action; errors appear in a clay notice with `role="alert"`. Field-level quote failure explains the amount/domain problem near the trade action. Test-token value, manual resolution and separate approval/swap transactions stay visible in the relevant flow.

A confirmed swap shows an inline success message linking to its actual journal receipt. Pending and unknown receipts never trigger that message. Positions and the journal are cached in this browser per deployment, with visible storage-failure feedback and a JSON receipt download. This cache is not a full chain indexer or cross-device archive. The journal appears only when it has transactions, including pending or unknown entries. Rows include an action label, submitting account, written state and a state-specific icon. Block and gas metadata appear only after receipt retrieval. Local hashes are copyable; explorer links are conditional on a configured transaction URL. A polite live region announces busy work or the latest confirmed transaction.

| Receipt state | Visual and interaction meaning |
| --- | --- |
| Pending | A submitted hash exists; a spinner and the written pending label show that confirmation is still awaited. |
| Confirmed | A retrieved receipt reports success for the original operation or its gas repricing; the check icon, block and gas describe that receipt. |
| Failed | A retrieved receipt reports failure; a failure icon and written state communicate the result. |
| Cancelled / replaced | A replacement receipt confirms cancellation or a different operation. A failure icon and written state explain that the original action did not complete; subsequent setup steps stop. |
| Unknown | Receipt waiting was unavailable, including timeout; a question icon and **Confirmation unavailable** label preserve uncertainty. **Check receipt** retries retrieval for the same hash. New transaction actions are disabled while any unknown entry remains. |

**The Receipt Evidence Rule.** A timeout is not failure evidence. Preserve the submitted hash and offer receipt recovery. A successful replacement receipt must be classified before treating the original operation as successful. Pending entries restore as unknown after reload. The 60-second wait is a UI deadline; elapsed time or a changing illustration must never become a success indicator. Browser storage can be cleared, and replacements that occur while the app is closed may require wallet or explorer investigation.

## Do's and Don'ts

### Do:

- **Do** preserve the pinned daylight sage neumorphic material, self-hosted Manrope and forest-green execution emphasis.
- **Do** use the resolved dark supporting-text colors alongside the paired shadows; inspect the final cascade when extending responsive styles.
- **Do** keep written states, native controls, keyboard focus and reduced-motion behavior intact.
- **Do** label the curve as illustrative and keep its time slider separate from actual strategy and quote state.
- **Do** preserve same-hash receipt recovery and the explicit unknown state when confirmation is unavailable.
- **Do** keep the next setup or swap action clear, with technical exploration available on demand.

### Don't:

- **Don't** infer transaction success from submission, timeout, an estimate or the curve illustration.
- **Don't** fabricate balances, market history, receipt metadata, trading activity or public deployment status.
- **Don't** hide test-asset value, manual-resolution authority or approval/swap separation behind a visual treatment.
- **Don't** replace text and icons with color-only status cues or remove focus to preserve a soft shadow.
- **Don't** present the browser cache as a complete transaction archive or the limited visual review disposition as a security or economic approval.
