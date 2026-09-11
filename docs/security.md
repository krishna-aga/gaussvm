# Security model and limits

This is an unaudited local/Sepolia research demo, without a production deployment mode.

## Trust boundaries

- **Resolution:** the immutable resolver selects YES/NO during the day after expiry. There is no external price oracle or dispute mechanism. After that window, anyone can cancel an unresolved market for half-value payouts on each side.
- **Collateral:** the demo uses its own worthless faucet token. Split checks the actual received amount before minting and rejects transfer-tax deposits. Rebasing and third-party collateral are unsupported economic models.
- **Maker availability:** Aqua allocation is not escrow. A maker may spend tokens or revoke approval, so quotes cannot guarantee settlement.
- **Aqua/SwapVM:** source is pinned, not rewritten. Official settlement and locks retain their upstream assumptions.
- **Numerics:** the guard has bounded experimental evidence, not a certified all-input error proof.
- **Confirmation:** receipt lookup failure is unknown, not transaction failure. The journal preserves the hash and blocks further writes until receipt rechecking resolves it.

## Implemented controls

- Pair, market status, exact-input mode, program length and expiry cutoff are checked in the opcode.
- Score, scale, reserve and input bounds reject unsupported arithmetic; bisection returns a conservative feasible output.
- Slippage/deadline checks are enforced by official SwapVM onchain.
- Only the market can mint/burn its outcome tokens; split/merge/redeem are reentrancy-protected.
- Failed transfers atomically roll back token and Aqua accounting changes.
- UI approvals request only needed quantities when allowance is insufficient.
- Unlocked-account behavior requires localhost page/RPC and chain 31337. Public deployment is restricted to Sepolia.

## Residual risks

No guarantee of profitability, fair external resolution, general MEV resistance or full-domain liveness is made. |z| <= 3 excludes extreme odds. Time scaling can leave that domain before expiry; docking, merging and redemption remain available.

The curve is normalized illustration, not measured depth. The constant-product comparison is a zero-fee calculation on the same reserves, not an executable venue quote. No LVR backtest, fee optimization, multi-market catalog or decentralized oracle is claimed.

`BinaryMarket` is a demo component, not an audited permissionless market factory. Use the supplied collateral and sensible expiries. Real-value use would require independent contract and economic audits, certified numerical analysis, a specified oracle/dispute mechanism and token-compatibility review. None is claimed complete.
