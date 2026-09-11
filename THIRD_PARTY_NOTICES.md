# Provenance and notices

| Component | Pinned source | License |
| --- | --- | --- |
| SwapVM | `1inch/swap-vm` at `afd99c408b4ed610027f4426c6f98650acac9f5f` | LicenseRef-Degensoft-SwapVM-1.1, © Degensoft Ltd 2025. |
| Aqua | `1inch/aqua` at `9c5c42e5840e8741fba3597c48456c9510212b66` | LicenseRef-Degensoft-Aqua-Source-1.1, © Degensoft Ltd 2025. |
| Solidity Utils | `1inch/solidity-utils` at `2d91bb67665467afc06907a69513b0fa66c46f0d` (6.9.10 source) | MIT source/repository notices retained. |
| OpenZeppelin Contracts | 5.4.0 | MIT, notices in npm package. |
| Manrope | Fontsource variable package 5.2.8 | SIL OFL 1.1; self-hosted Latin font. |
| Other npm dependencies | Exact versions/integrities in package-lock.json | Their original package licenses apply. |

Upstream submodules are unmodified and retain all original copyright and third-party notices. The custom router extends official SwapVM rather than replacing settlement with a mock. Corresponding source and reproducible build steps are included under LICENSE.

The mathematical concept is by Ciamac Moallemi and Dan Robinson, [Paradigm, 2024-11-05](https://www.paradigm.xyz/writing/pm-amm). The bounded numerical implementation is original code, not copied Solidity from another pm-AMM project. No endorsement or audit is claimed.

Initial GaussVM change date: 2026-09-11. Git records the implementation steps.
