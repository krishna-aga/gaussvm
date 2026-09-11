# Security model and limits

This is an unaudited local/Sepolia research demo, without a production deployment mode.

## Trust boundaries

- **Resolution:** the immutable resolver selects YES/NO during the day after expiry. There is no external price oracle or dispute mechanism. After that window, anyone can cancel an unresolved market for half-value payouts on each side.
- **Event interpretation:** the ETHOnline question and published prize rules are a manual-resolution convention. The contract stores the question but cannot verify prize announcements or force the resolver to follow that convention. Pool-implied odds are not an ETHGlobal assessment of the project.
- **Collateral:** the demo uses its own worthless faucet token. Split checks the actual received amount before minting and rejects transfer-tax deposits. Rebasing and third-party collateral are unsupported economic models.
- **Maker availability:** Aqua allocation is not escrow. A maker may spend tokens or revoke approval, so quotes cannot guarantee settlement.
- **Aqua/SwapVM:** source is pinned, not rewritten. Official settlement and locks retain their upstream assumptions.
- **Numerics:** the guard has bounded experimental evidence, not a certified all-input error proof.
- **Confirmation:** receipt lookup failure is unknown, not transaction failure. The journal preserves the hash and blocks further writes until receipt rechecking resolves it.
- **Wallet replacements:** successful cancellation or unrelated replacement receipts are not treated as success for the requested action. Subsequent setup/swap steps stop. Gas-only repricing can complete the original operation.
- **Browser history:** localStorage contains public addresses, strategy definitions and receipt metadata, never private keys. It is a convenience cache, not independent chain evidence or a synchronized ledger. Clearing/blocking browser data limits recovery; failures are visible. A replacement made while the app was closed may leave the original hash unresolved and require wallet/explorer investigation.

## Implemented controls

- Pair, market status, exact-input mode, program length and expiry cutoff are checked in the opcode.
- Score, scale, reserve and input bounds reject unsupported arithmetic; bisection returns a conservative feasible output.
- Slippage/deadline checks are enforced by official SwapVM onchain.
- Only the market can mint/burn its outcome tokens; split/merge/redeem are reentrancy-protected.
- Failed transfers atomically roll back token and Aqua accounting changes.
- UI approvals request only needed quantities when allowance is insufficient.
- Unlocked-account behavior requires localhost page/RPC and chain 31337. Public deployment is restricted to Sepolia.
- Manifests and restored strategies must contain valid addresses, supported network configuration and a matching encoded order/hash before they reach execution.
- Reads use a single block snapshot and reject stale responses after wallet/position changes. Writes recheck wallet context; overlapping UI actions are locked.
- Wallet listeners attach only to the connected provider. Duplicate account/network events are ignored; real changes invalidate the previous operation context. A wrong network blocks writes until switched back, and an account change during approval stops the following swap while preserving any submitted receipt. Local demo sessions ignore unrelated extension events.

## Residual risks

No guarantee of profitability, fair external resolution, general MEV resistance or full-domain liveness is made. |z| <= 3 excludes extreme odds. Time scaling can leave that domain before expiry; docking, merging and redemption remain available.

The curve is normalized illustration, not measured depth. The constant-product comparison is a zero-fee calculation on the same reserves, not an executable venue quote. No LVR backtest, fee optimization, multi-market catalog or decentralized oracle is claimed.

`BinaryMarket` is a demo component, not an audited permissionless market factory. Use the supplied collateral and sensible expiries. Real-value use would require independent contract and economic audits, certified numerical analysis, a specified oracle/dispute mechanism and token-compatibility review. None is claimed complete.
