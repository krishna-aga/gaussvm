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
  sidebar: "#e3e9e1"
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
    padding: "15px 14px 19px"
  navigation-active:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.green}"
    rounded: "{rounded.navigation}"
    padding: "14px 13px"
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

This document captures `web/src/styles.css`, `web/src/App.tsx` and `web/src/Curve.tsx`, with desktop and mobile review captures as supporting visual evidence. The review handoff reported **ship** for its three fixed findings: contrast, receipt recovery and mobile access. That disposition is limited to those findings; it establishes neither public deployment nor broader contract or economic approval.

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

- **Daylight sage** (`surface`) is the page and raised-panel material. **Sidebar sage** (`sidebar`) slightly separates navigation. **Recessed sage** (`recessed`) identifies amount wells.
- **Forest ink** (`ink`) carries headings, entered values and primary content. **Readable moss** (`muted`) is the resolved supporting-text color used throughout labels, explanations, axes and the transaction journal.
- **Light moss** (`badge-surface`, `badge-ink`) supports the explicit illustrative badge. **Outcome sage** (`yes-surface`, `yes-ink`) identifies YES tokens.
- **Notice sage** (`notice-surface`) supports setup guidance. **Clay notice** (`error-surface`, `error-ink`) and `field-error` distinguish actionable error copy without removing its words or icon.
- `chart-fill` is used only with fading opacity beneath the line; `chart-grid` supplies faint dashed guides. These are chart structure rather than text colors.

**The Readable Material Rule.** Keep the resolved supporting-text palette when adding content. Computed from the implemented opaque colors, `muted` has contrast ratios of 5.45:1 on `surface`, 5.33:1 on `recessed`, 5.22:1 on `sidebar` and 4.98:1 on `notice-surface`. The primary button pair is 7.17:1. These are specific color-pair checks, not a claim that every interface state has been audited. Disabled controls use reduced opacity and must remain visibly disabled.

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

The desktop shell has a 222px navigation column beside a flexible workspace. The workspace centers within a 1500px maximum width, with 44px side gutters and 40px top padding. The top bar is 91px tall. The market pairs a flexible curve region with a 340px trade panel and a 30px gap. Liquidity panels use a 1.25:1 column ratio. The research content has an 830px maximum width.

The layout responds at the implemented breakpoints:

| Condition | Implemented behavior |
| --- | --- |
| At least 1550px | Trade panel grows to 380px; the market gap becomes 38px; major panels use 29px padding; workspace top padding becomes 48px. |
| At most 1190px | Navigation narrows to 190px; workspace side gutters become 27px; trade panel becomes 300px with a 23px gap; the reserve strip uses two columns with the third item spanning both. |
| At most 960px | Navigation becomes a horizontal row; introductory and footer sidebar content is hidden; top bar becomes 74px; market retains two columns with a 310px trade panel; liquidity panels become equal columns. |
| At most 740px | Branding and navigation wrap into separate rows; workspace side gutters become 20px; market and liquidity panels stack; the trade panel takes full width; three compact reserve columns return; journal rows wrap; footer stacks. |

Spacing is contextual rather than a rigid eight-point system. Use the extracted repeated values for gutters, panel padding, inline gaps and section separation. Do not equalize all spacing: dense quote details and generous page-group separation have different jobs. Full addresses wrap, command blocks scroll horizontally within their own container, and flexible inputs use `min-width: 0` to avoid widening the page.

At widths of 740px or less, the early **Swap outcomes** jump reaches the trade panel with immediate scrolling and transfers focus to its named section. The target has a 20px scroll margin and `tabIndex={-1}`. This is the direct path to the action when mobile stacking puts the trade panel below the curve. The jump is hidden on desktop; the final two-class selector preserves that visibility against the shared button rule.

## Elevation & Depth

Depth is structural. Broad paired shadows lift the main panels from the same-color page; inset shadows recess amount fields, direction tracks, the position amount and the formula panel. Smaller raised shadows identify buttons, the active navigation item and the selected direction. Thin green-gray dividers separate balance groups, the journal and supporting sections. A darker fill supplies primary-action emphasis without changing the material language.

### Shadow Vocabulary

- **Raised surface:** `8px 8px 20px #ced5cd, -8px -8px 20px #fff` (`--shadow`). Use for the major curve, trade and detail panels.
- **Recessed field:** `inset 4px 4px 9px #d0d7ce, inset -4px -4px 9px #fbfdf9` (`--inset`). Use for input wells, track containers and pressed buttons.
- **Secondary button:** `4px 4px 9px #cfd7cb, -4px -4px 9px #fff`.
- **Primary button:** `4px 4px 9px #c3cebe, -4px -4px 9px #fff`.
- **Active navigation:** `5px 5px 10px #cbd3c7, -5px -5px 10px #f5fff3`.
- **Selected direction:** `3px 3px 7px #c5cec0, -3px -3px 7px #f7fff3`.

Button background and shadow transitions take 150ms; pressing an enabled button applies the recessed shadow. Loading icons rotate over one second with a linear infinite animation. Time scrubbing updates the SVG directly without an animation tween. Under `prefers-reduced-motion: reduce`, all animations and transitions are removed and scrolling uses `auto`; the labels and static state icons remain.

## Shapes

The form language is gently rounded and rectangular. Large surfaces use the broadest standard corners; input wells and the brand mark are smaller; navigation, buttons, tokens and badges step down according to their role. The frontmatter records the implemented radius vocabulary. Status dots and chart markers are circular. Keep shapes subordinate to clear grouping: no decorative card should be added solely to repeat the shadow effect.

Icons are small Lucide line drawings paired with text or an accessible name. The mark is a waves icon inside a forest-green rounded square, followed by the differently weighted GaussVM wordmark. No generated raster assets are used.

## Components

### Buttons and focus

Buttons are raised and compact, with a 43px minimum height and the frontmatter padding; compact wallet controls use a 38px minimum height and 9px by 13px padding. Full-width trade actions distribute the label and icon across the row. Primary controls use forest green; secondary controls share the surface color; text actions are underlined and transparent. Enabled hover changes the fill, and enabled press uses the inset shadow. Disabled buttons use `opacity: 0.5` and a `not-allowed` cursor.

Buttons, links and inputs receive a 3px solid focus outline with a 4px offset; the amount input uses a 5px offset. Icon-only actions have accessible labels. Preserve native buttons and links rather than making generic containers clickable. The current small icon controls are not evidence of a universal 44px target-size guarantee.

### Amount fields and direction selector

The amount field is a labeled recessed well with a balance row, a large decimal input and a written YES/NO token tag. The estimated output uses the same material but is an `output`, not an editable input. During quotation, the estimate becomes a loading icon; missing values appear as an em dash. The direction selector uses two native buttons with `aria-pressed`, a recessed shared track and a raised selected option. Its reverse-direction icon has an explicit accessible name.

### Navigation and surfaces

Market, Liquidity and The research are buttons in a named navigation region. The active item combines raised depth, green text and `aria-current="page"`. Desktop navigation is vertical; the responsive layouts described above preserve the same three choices in a row. Panels use descriptive headings and consistent padding; the chart and trade controls remain visually distinct from the flatter reserve and custody information beneath them.

### Curve and chain truth

The signature curve is a labeled SVG, sampled across the supported Gaussian domain and drawn against YES probability. A solid green profile and a dashed ochre constant-product reference have written legends. A vertical marker indicates the displayed probability; shaded area fades toward the baseline. The **ILLUSTRATIVE** badge, visible note and accessible SVG label explicitly identify the drawing as an illustration, not an executable quote or live depth measurement.

The time slider ranges from 5% to 100% remaining and compresses the normalized profile by the square root of the selected fraction. It changes only the illustration. The large implied-probability figure is calculated from fetched allocation and strategy data; a disconnected or unavailable chain does not receive a fabricated value. The chart may center its illustrative marker at 50% when chain probability is unavailable. An actual quote is obtained separately from the router simulation, and its estimate, minimum received and 0.5% slippage protection are shown in the trade panel. The constant-product output is a separate calculated comparison, not a second executable quote.

### Notices and transaction journal

Preview mode names the absence of a deployment and explains local execution. Chain failures expose a retry action; errors appear in a clay notice with `role="alert"`. Field-level quote failure explains the amount/domain problem near the trade action. Test-token value, manual resolution and separate approval/swap transactions stay visible in the relevant flow.

The journal is session state in React, not a durable transaction archive. Its empty state describes future receipt entries without creating sample activity. Rows include an action label, written state and a state-specific icon. Block and gas metadata appear only after receipt retrieval. Local hashes are copyable; explorer links are conditional on a configured transaction URL. A polite live region announces busy work or the latest confirmed transaction.

| Receipt state | Visual and interaction meaning |
| --- | --- |
| Pending | A submitted hash exists; a spinner and the written pending label show that confirmation is still awaited. |
| Confirmed | A retrieved receipt reports success; the check icon, block and gas describe that receipt. |
| Failed | A retrieved receipt reports failure; a failure icon and written state communicate the result. |
| Unknown | Receipt waiting was unavailable, including timeout; a question icon and **Confirmation unavailable** label preserve uncertainty. **Check receipt** retries retrieval for the same hash. New transaction actions are disabled while any unknown entry remains. |

**The Receipt Evidence Rule.** A timeout is not failure evidence. Preserve the submitted hash, offer receipt recovery, and allow only the retrieved receipt to establish confirmed or failed state. The 60-second receipt wait and wallet replacement handling belong to transaction behavior; elapsed time or a changing illustration must never become a success indicator. Because the journal is session-only, this recovery guarantee is limited to the current mounted session.

## Do's and Don'ts

### Do:

- **Do** preserve the pinned daylight sage neumorphic material, self-hosted Manrope and forest-green execution emphasis.
- **Do** use the resolved dark supporting-text colors alongside the paired shadows; inspect the final cascade when extending responsive styles.
- **Do** keep written states, native controls, keyboard focus and reduced-motion behavior intact.
- **Do** label the curve as illustrative and keep its time slider separate from actual strategy and quote state.
- **Do** preserve same-hash receipt recovery and the explicit unknown state when confirmation is unavailable.
- **Do** keep the mobile path to swapping direct, with both scroll and focus transfer.

### Don't:

- **Don't** infer transaction success from submission, timeout, an estimate or the curve illustration.
- **Don't** fabricate balances, market history, receipt metadata, trading activity or public deployment status.
- **Don't** hide test-asset value, manual-resolution authority or approval/swap separation behind a visual treatment.
- **Don't** replace text and icons with color-only status cues or remove focus to preserve a soft shadow.
- **Don't** present the session journal as persistent history or the limited visual review disposition as a security or economic approval.
