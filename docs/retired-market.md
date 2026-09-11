# Retired initial Sepolia demo

The initial “Will the demo resolver choose YES?” market was replaced by **Will this project win ETHOnline 2026?** on 11 September 2026. The active app exposes only the new question. Onchain contracts and historical receipts cannot be deleted or renamed.

The original maker's seed allocation was docked in [this Sepolia transaction](https://sepolia.etherscan.io/tx/0x2a1c7fb28c4fafc8a517170b34bc36ad22f020ca1a9a94a0a1ea60de7859730d). Docking disables that allocation; it does not burn a holder's tokens or withdraw BinaryMarket collateral. The new market reuses the original Aqua, GaussVM router and gUSD contract, and has fresh YES/NO tokens.

## Earlier test tokens

- Old BinaryMarket: `0x733662c9da4ff2c6c9407f7fcbb0152a79f626eb`.
- Old YES: `0x1007922A41C3d2494b3e3e93D615935Ea2ab8830`.
- Old NO: `0x527d1F97a33e6B0E51759b77EAf76c4a61371EA1`.
- Shared gUSD: `0x39bc0f0658f0d79b8f923e98fd840a41cd65c85e`.

Old outcomes are not the new market's outcomes. Use the app's test-token preparation action for the new pair. Both pairs are worthless test assets.

A holder can still call the **old BinaryMarket's** `merge(uint256 amount)` from their own account to burn equal amounts of old YES and NO and receive that amount of gUSD. Amounts use 18 decimals; no token approval is needed for this merge. A holder needs both sides in at least that quantity and Sepolia ETH for gas. This remains available after expiry.

For unmatched outcomes, the old contract retains its original expiry, **11 October 2026 at 14:58:24 UTC**, and its one-day manual-resolution window. If it remains unresolved after **12 October 2026 at 14:58:24 UTC**, anyone may call `cancelUnresolved()`; `redeem(yesAmount,noAmount)` then returns half a gUSD per token, rounded down. If the resolver chooses an outcome during the window, the winning side instead redeems one-for-one. This document does not promise a particular old-market resolution.

The [archived manifest](../deployments/archive/sepolia-initial.json) contains all original addresses and seed receipts. [Initial UI execution evidence](evidence/sepolia-ui.json) remains unchanged. The new market uses a separate browser-history key; the app does not delete the earlier stored records. Explorer receipts remain public, and the old Solidity/ABI is still in the repository and [Sourcify](https://repo.sourcify.dev/11155111/0x733662c9da4ff2c6c9407f7fcbb0152a79f626eb).
