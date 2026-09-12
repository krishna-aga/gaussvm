# Free local and testnet deployment

## Verified local path

```sh
npm ci
git submodule update --init --recursive
npm run dev
```

Local RPC: `http://127.0.0.1:8545`, chain ID **31337**. Web app: `http://127.0.0.1:5173`. The maker/resolver is Hardhat account 0; the default UI trader is account 1. Unlocked accounts and accelerated time are local conveniences. No private key is embedded in the browser.

The launcher generates `artifacts/`, `deployments/local.json` and `web/public/deployment.json`. Local manifests and `reports/local-chain.log` are ignored. To replace a stale or resolved market, run `npm run deploy:local` with the node running, then reload the browser. The launcher rejects a different network on port 8545. Vite's port is strict; free port 5173 if occupied.

## Canonical Aqua on a free local fork

```sh
npm run demo:fork
```

This independent script starts a temporary Ethereum fork on **localhost:8546**, chain **31337**, reuses canonical Aqua at `0x1111113ccf1426a8e30e2bff5e005d929bf6a90a`, and deploys the custom GaussVM extension and test outcomes locally. It checks that Aqua bytecode matches the source block and runs the complete track lifecycle, including three swaps with exact balance/event assertions. The fork is stopped when the script completes. The ordinary UI manifest and node at 8545 are unaffected.

The default read-only source is the free public Ethereum RPC at PublicNode. No API key, private key or mainnet wallet is used. Remote reads can be slow or unavailable. Optionally set `FORK_RPC_URL` to another Ethereum RPC and `FORK_BLOCK` to a specific source block in your shell. For example, PowerShell: `$env:FORK_BLOCK='25954422'` before running the command. Historical blocks require a provider that can serve that state. To load variables from an ignored `.env`, use `node --env-file=.env scripts/fork-demo.mjs`.

The run writes ignored `deployments/fork.json`, `reports/aqua-track-fork.json` and `reports/fork-chain.log`. It demonstrates shared wallet strategies, three swaps, docking, merging and redemption under a simulated local resolution. The manifest/evidence contains the source block/hash, canonical Aqua code hash, source hashes, local receipts and balances, without persisting the remote RPC URL. The fork log may contain upstream error details; review it before sharing. Local swap hashes are not public explorer transactions. [The verified lifecycle evidence](evidence/canonical-aqua-track.json) is a saved example; rerun the command for the final demo. The earlier one-swap report remains in [historical evidence](evidence/canonical-aqua-fork.json).

## Public Sepolia

Ethereum's [network documentation](https://ethereum.org/developers/docs/networks/) identifies Sepolia for application testing and lists free faucets. Eligibility and availability vary. Do not buy test ETH; the local demo remains complete when no faucet is available.

The contracts were deployed on **2026-09-11**, seeded with 1,000 YES + 1,000 NO and source-verified on Sourcify. The live app is **https://krishna-aga.github.io/gaussvm/**. Addresses, expiry and transaction evidence are recorded in [live-deployment.md](live-deployment.md). The instructions below create a new deployment; visiting the existing app does not require a private key or running a deploy script.

1. Create a dedicated test wallet and obtain free Sepolia ETH.
2. Copy `.env.example` to `.env`. Set `TESTNET_PRIVATE_KEY` locally and a Sepolia `SEPOLIA_RPC_URL`. Never commit the key.
3. Run:

```sh
npm run contracts:build
npm run deploy:sepolia
npm run dev:web
```

The script refuses a network other than Sepolia **11155111**. It deploys the unmodified official Aqua source, test collateral, custom GaussVM router and a thirty-day demo market, then seeds a position through approvals, split and ship. Every receipt and the order hash are checked. This does not claim a canonical mainnet Aqua address. Submitted hashes are logged before waiting for receipts; inspect an interrupted transaction before retrying the deployment, since rerunning creates a new system.

The verified `deployments/sepolia.json` is committed. The browser uses a public RPC URL instead of exposing an authenticated endpoint. Public RPC/faucet availability and test-gas consumption remain external constraints.

The interface uses an injected wallet on Sepolia and requests a network switch. If the wallet reports an unknown network, the app requests adding Sepolia with the public RPC and explorer from the deployment configuration. Approve those requests in the wallet. Switching accounts refreshes balances automatically; switching away from Sepolia pauses writes and displays **Switch to Sepolia**. Unchanged provider events do not disconnect the session. Wallet access must still be reconnected after a page reload.

The deployer is the disclosed resolver. Replace the market after expiry for later demos. Public testnet time cannot be accelerated; the local lifecycle controls remain exclusive to the local demo.

### Replacing the initial question

`node --env-file=.env scripts/replace-market.mjs` migrates the original Sepolia demo to the single ETHOnline question. It reuses Aqua, GaussVM and gUSD, deploys BinaryMarket with new YES/NO tokens, seeds the new position, docks the old seed and writes the new public manifest. The old manifest is preserved in `deployments/archive/sepolia-initial.json`; old tokens/receipts are not erased or relabeled. It is a one-time migration: after completion, rerunning sends no transactions. An incomplete deployment stops and points to the submitted-hash progress file for inspection; a completed new market can resume the retirement step.

The existing expiry is retained. The UI accepts only the ETHOnline question and stores the new market's history separately. Earlier complete sets can still be merged using the archived contract addresses. See [market retirement](retired-market.md) before interacting with earlier tokens.

### Source verification and a public UI test

For the optimized router, use `node --env-file=.env scripts/optimize-sepolia.mjs --execute`
after `npm run check`. This reuses the market and tokens, preserving the seed's
closing reserves. Read the [migration and recovery instructions](gas-optimization.md#sepolia-router-migration)
before running it. Source verification and Pages publication follow migration.

`npm run contracts:build` also writes complete compiler input, including pinned imports, to ignored `artifacts/build-info.json`. Run `npm run verify:sepolia` to submit that source to the free Sourcify v2 API and record exact/partial match results in `reports/sepolia-verification.json`. This needs no API key or chain transaction.

`npm run test:sepolia` is an explicit public-chain smoke test, never part of CI. It requires a separately funded `TESTNET_TRADER_PRIVATE_KEY` in ignored `.env`, loads the published website and executes token preparation and a real swap through its wallet path. An EIP-1193 adapter keeps signing in Node; the browser never receives the key. It checks actual event/balance deltas, receipts and mobile overflow, and saves `reports/sepolia-ui.json` plus screenshots. This tests the app's injected-provider interface, not a wallet extension's approval dialogs. Rerunning consumes faucet gas and makes another real test swap.

## Free static hosting

[GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) supports static hosting from public repositories on GitHub Free. No backend or database is needed.

```sh
npm run build:public
```

Without a Sepolia manifest, the artifact displays a research preview and disables chain actions. With one, it uses Sepolia. The build excludes localhost manifests, then restores the local development copy.

The public repository has **Settings → Pages → Source → GitHub Actions** configured. After pushing a frontend or Sepolia-manifest update, run **Publish research demo to GitHub Pages** manually and inspect its result. The live URL is `https://krishna-aga.github.io/gaussvm/` with HTTPS enforced. Standard GitHub-hosted runners and Pages are used; no paid plan or larger runner is needed.

The workflow is manual, not a deployment on push. Vite's relative base supports the repository subpath. Only `dist/` is published; source directories, logs and `.env` are excluded.

## Environment notes

- Git submodules are required; source ZIPs do not contain them.
- PowerShell works without Bash or Foundry; npm solc compiles Solidity.
- Playwright requires its Chromium download once. Linux CI uses `npx playwright install --with-deps chromium`.
- The launcher shuts down only its own children. Pre-existing local nodes are left running.
- Mainnet writes, paid RPC, databases, paid hosting and real-value collateral are outside the project. The canonical demonstration reads mainnet state into a local fork.
