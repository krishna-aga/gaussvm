# GaussVM

**Gaussian prediction-market liquidity, executed through 1inch Aqua and SwapVM.**

GaussVM turns [Paradigm's pm-AMM research](https://www.paradigm.xyz/writing/pm-amm) into an executable test-token position. A custom SwapVM instruction prices YES/NO trades using the Gaussian invariant. Official Aqua contracts account for the maker's allocation and transfer tokens between wallets.

Built for **ETHOnline 2026**, with **1inch's Build an Aqua App** as the primary track. This is a working local/testnet research prototype, not an audited protocol or a promise of LP returns. The time-scaled mode is explicitly distinguished from the paper's complete economic result.

Powered by Aqua — © Degensoft Ltd 2025  
Powered by SwapVM — © Degensoft Ltd 2025

## Live Sepolia app

**[Open GaussVM](https://krishna-aga.github.io/gaussvm/)** · [Deployed contracts and public evidence](docs/live-deployment.md)

Connect an Ethereum wallet on **Sepolia**, with free faucet ETH for gas. Select **Get 100 YES + 100 NO**, then make a swap. The app uses worthless test assets, and receipts link to Sepolia Etherscan. Hosting uses free GitHub Pages; no mainnet assets or paid service is needed. The current market expires **11 October 2026 at 14:58:24 UTC**.

## Run the complete demo

Requirements: **Node.js 22.16+**, npm and Git. The Node scripts work in Windows PowerShell, macOS and Linux. No wallet extension, faucet, API key or paid service is needed locally.

From this existing workspace:

```sh
npm ci
git submodule update --init --recursive
npm run dev
```

Open **http://127.0.0.1:5173**. This compiles Solidity, starts a localhost EVM, deploys official Aqua and GaussVM, seeds a 1,000 YES + 1,000 NO position and starts the interface. It never connects to mainnet. Ctrl+C stops the services it started. A pre-existing local node is reused with a fresh market.

1. Select **Connect to swap**.
2. Select **Get 100 YES + 100 NO**. Faucet gUSD is claimed if needed; 100 gUSD becomes 100 YES and 100 NO. A funded wallet skips this step.
3. Swap NO for YES, then reverse direction. The journal shows actual hashes, blocks and gas.
4. Open **Liquidity** to inspect addresses, ship a static/time-scaled position, dock a maker position or merge complete sets.
5. To resolve, switch to the local maker wallet, advance the local clock to expiry, choose YES/NO and redeem. Restart the demo for a fresh market.

Keep the app running and execute this in a second terminal:

```sh
npm run demo
```

The script performs a real EVM swap, asserts that balance changes equal quoted amounts, and writes receipts, event logs and before/after balances to `reports/demo.json`. These hashes belong to the local chain, not a public explorer.

For submission evidence against **Aqua's canonical deployed address**, run `npm run demo:fork`. It reads Ethereum into an isolated localhost fork, deploys the custom SwapVM extension and executes a real local swap. No real funds or public transactions are used. The verified run and all outstanding submission requirements are in [qualification](docs/qualification.md).

Clone the published history with `git clone --recurse-submodules https://github.com/krishna-aga/gaussvm.git`. ZIP downloads omit the required upstream submodules.

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
| Saved workspace | Created positions, selection and receipts survive reload in the same browser; receipts export as JSON. |
| Reproducible tooling | Local deployment, transfer evidence, numerical/integration/browser tests, CI and optional free static hosting. |

The curve slider is illustrative and cannot change an executable order. Created positions and their selected strategy are saved per deployment in this browser. Use **Liquidity → Trading position** to switch between saved positions and the seed. The journal records this browser's transactions and offers **Download receipts**; it is not an index of all market activity. Reconnect your wallet after reloading. Interrupted receipt waits return as unknown and must be checked before another write. Clearing browser data removes this local history, and storage failures are shown explicitly.

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

Local operation is entirely free. The public **Sepolia-only** deployment uses faucet ETH, a test-only key in ignored `.env`, a free public RPC and GitHub Pages. All six deployed contracts have exact source-code matches on Sourcify. See [live deployment](docs/live-deployment.md) and [deployment instructions](docs/deployment.md).

`npm run build:public` uses the committed `deployments/sepolia.json` and excludes localhost configuration. Without a Sepolia manifest it produces a research preview. The manual GitHub Pages workflow publishes the static app; `npm run dev` continues to create an independent local market.

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
- [Troubleshooting and recovery](docs/troubleshooting.md)
- [Judge demo and submission evidence](docs/demo.md)
- [Verification](docs/verification.md)
- [Qualification requirements and submission checklist](docs/qualification.md)
- [AI assistance and human contribution disclosure](docs/ai-usage.md)
- [UX changes informed by Laws of UX](docs/ux.md)
- [Implemented design system](DESIGN.md)
- [Contribution and commit conventions](CONTRIBUTING.md)

## Attribution and licensing

The pm-AMM concept is by **Ciamac Moallemi and Dan Robinson**. GaussVM contributes the bounded numerical implementation, custom SwapVM instruction and complete Aqua outcome-position demo.

Official dependencies are pinned and unmodified. The SwapVM-derived source retains its source-available license; the combined project is not MIT-only. See [LICENSE](LICENSE) and [third-party notices](THIRD_PARTY_NOTICES.md). There is no endorsement or audit claim from Paradigm, 1inch or Degensoft.
