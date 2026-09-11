# GaussVM

A research-driven prediction-market AMM built on **1inch Aqua and SwapVM**, for ETHOnline 2026.

GaussVM implements a Gaussian pricing instruction inspired by Ciamac Moallemi and Dan Robinson's [pm-AMM](https://www.paradigm.xyz/writing/pm-amm). Liquidity remains in the maker's wallet; official Aqua contracts account for the position and settle transfers through an extended official SwapVM.

Work in progress. Executable setup, verification results, and deployment instructions are added as each component is validated. This repository does not claim audited security, guaranteed LP returns, or a public deployment before one is verified.

## Project constraints

- Local EVM and testnets only; no real-money assets or paid infrastructure.
- Small, meaningful commits authored as Krishna; no fabricated or backdated history.
- Official upstream contracts pinned by commit, with their licenses preserved.
- Numerical claims bounded by explicit tests and independent reference calculations.
- Neumorphic, accessible web interface; transaction status comes from chain receipts.

See [research](docs/research.md) for source findings and scope.
