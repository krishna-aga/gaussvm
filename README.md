# GaussVM

**Gaussian prediction-market liquidity, executed through 1inch Aqua and SwapVM.**

GaussVM turns [Paradigm's pm-AMM research](https://www.paradigm.xyz/writing/pm-amm) into an executable test-token position. A custom SwapVM instruction prices YES/NO trades using the Gaussian invariant. Official Aqua contracts account for the maker's allocation and transfer tokens between wallets.

Built for **ETHOnline 2026**, with **1inch's Build an Aqua App** as the primary track. This is a working local research prototype, not an audited protocol or a promise of LP returns. The time-scaled mode is explicitly distinguished from the paper's complete economic result.

Powered by Aqua — © Degensoft Ltd 2025  
Powered by SwapVM — © Degensoft Ltd 2025

## Run the complete demo

Requirements: **Node.js 22.16+**, npm and Git. The Node scripts work in Windows PowerShell, macOS and Linux. No wallet extension, faucet, API key or paid service is needed locally.

From this existing workspace:

```sh
npm ci
git submodule update --init --recursive
npm run dev
```

Open **http://127.0.0.1:5173**. This compiles Solidity, starts a localhost EVM, deploys official Aqua and GaussVM, seeds a 1,000 YES + 1,000 NO position and starts the interface. It never connects to mainnet. Ctrl+C stops the services it started. A pre-existing local node is reused with a fresh market.

1. Select **Connect demo wallet**.
2. Select **Prepare 100 test sets**. Faucet gUSD is claimed if needed; 100 gUSD becomes 100 YES and 100 NO.
3. Swap NO for YES, then reverse direction. The journal shows actual hashes, blocks and gas.
4. Open **Liquidity** to inspect addresses, ship a static/time-scaled position, dock a maker position or merge complete sets.
5. To resolve, switch to the local maker wallet, advance the local clock to expiry, choose YES/NO and redeem. Restart the demo for a fresh market.

Keep the app running and execute this in a second terminal:

```sh
npm run demo
```

The script performs a real EVM swap, asserts that balance changes equal quoted amounts, and writes receipts, event logs and before/after balances to `reports/demo.json`. These hashes belong to the local chain, not a public explorer.

The remote is configured as `https://github.com/krishna-aga/gaussvm.git`, but the implementation is intentionally kept local at the owner's request. Once pushed, clone with `git clone --recurse-submodules https://github.com/krishna-aga/gaussvm.git`. ZIP downloads omit the required upstream submodules.

## What is implemented

| Component | Behavior |
| --- | --- |
| Gaussian opcode `0x80` | Exact-input YES/NO swaps, bounded CDF/PDF and conservative bisection. |
| Official SwapVM base | Pinned current dispatch, order validation, slippage/deadline enforcement, locks and settlement. |
| Official Aqua | Unmodified source deployment; ship/dock and push/pull transfers; maker tokens stay in the wallet until execution. |
| Binary outcomes | Collateral-backed split/merge, manual resolver, timeout cancellation and redemption. |
| Two strategy modes | Static L or normalized square-root time scale, with documented inactive complete-set offset. |
| Neumorphic interface | Live balances/quotes, limited approvals, swaps, position controls, mobile layout and research explorer. |
| Receipt recovery | Failed confirmation lookup preserves an unknown result; recheck the same hash before another write. |
| Reproducible tooling | Local deployment, transfer evidence, numerical/integration/browser tests, CI and optional free static hosting. |

The curve slider is illustrative and cannot change an executable order. The journal covers the current browser session. A newly shipped strategy becomes selected for that session; refreshing returns to the manifest's seed. There is no multi-market indexer or persistent position catalog.

## Verification

```sh
npm run check          # Solidity build, tests, TypeScript and production build
npx playwright install chromium
npm run test:browser   # Starts a local demo if necessary
npm run audit:math     # Bounded computation, source hashes, versions and manifest
npm audit             # Dependency advisories
```

Browser tests provision a fresh market each run, then resolve it in the lifecycle scenario. Run `npm run deploy:local` and refresh, or restart `npm run dev`, before a subsequent manual demo. Results and limits are recorded in [verification](docs/verification.md). No test count establishes universal safety.

## Testnet and hosting

Local operation is entirely free. Optional **Sepolia-only** deployment uses faucet ETH and a test-only key in an ignored `.env`. No public contract or website deployment is claimed in this local delivery. See [deployment instructions](docs/deployment.md).

`npm run build:public` produces an honest research preview without a Sepolia manifest. With a verified `deployments/sepolia.json`, it uses that deployment. It excludes localhost deployment details from public artifacts. A manual GitHub Pages workflow is included for free static hosting after the repository is pushed.

## Repository map

```text
contracts/          Gaussian pricing, SwapVM extension, test collateral and outcomes
vendor/             Official Aqua, SwapVM and Solidity Utils Git submodules
lib/                Shared encoding, deployment and independent math reference
scripts/            Compile, local dev, deploy, demo and computation provenance
test/               Numerical, economic, integration and browser tests
web/                React/TypeScript interface
docs/               Research, math, architecture, deployment and demo guides
deployments/        Generated chain manifests (local ignored)
reports/            Generated evidence, excluded from commits
```

## Documentation

- [Research and partner choices](docs/research.md)
- [Mathematical specification](docs/math.md)
- [Architecture and byte encoding](docs/architecture.md)
- [Security assumptions](docs/security.md)
- [Local and Sepolia deployment](docs/deployment.md)
- [Judge demo and submission evidence](docs/demo.md)
- [Verification](docs/verification.md)
- [Implemented design system](DESIGN.md)
- [Contribution and commit conventions](CONTRIBUTING.md)

## Attribution and licensing

The pm-AMM concept is by **Ciamac Moallemi and Dan Robinson**. GaussVM contributes the bounded numerical implementation, custom SwapVM instruction and complete Aqua outcome-position demo.

Official dependencies are pinned and unmodified. The SwapVM-derived source retains its source-available license; the combined project is not MIT-only. See [LICENSE](LICENSE) and [third-party notices](THIRD_PARTY_NOTICES.md). There is no endorsement or audit claim from Paradigm, 1inch or Degensoft.
