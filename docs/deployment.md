# Free local and testnet deployment

## Verified local path

```sh
npm ci
git submodule update --init --recursive
npm run dev
```

Local RPC: `http://127.0.0.1:8545`, chain ID **31337**. Web app: `http://127.0.0.1:5173`. The maker/resolver is Hardhat account 0; the default UI trader is account 1. Unlocked accounts and accelerated time are local conveniences. No private key is embedded in the browser.

The launcher generates `artifacts/`, `deployments/local.json` and `web/public/deployment.json`. Local manifests and `reports/local-chain.log` are ignored. To replace a stale or resolved market, run `npm run deploy:local` with the node running, then reload the browser. The launcher rejects a different network on port 8545. Vite's port is strict; free port 5173 if occupied.

## Optional Sepolia

Ethereum's [network documentation](https://ethereum.org/developers/docs/networks/) identifies Sepolia for application testing and lists free faucets. Eligibility and availability vary. Do not buy test ETH; the local demo remains complete when no faucet is available.

The script is implemented but **has not been broadcast or verified on public Sepolia** in this delivery. It requires a funded test-only wallet supplied by the developer.

1. Create a dedicated test wallet and obtain free Sepolia ETH.
2. Copy `.env.example` to `.env`. Set `TESTNET_PRIVATE_KEY` locally and a Sepolia `SEPOLIA_RPC_URL`. Never commit the key.
3. Run:

```sh
npm run contracts:build
npm run deploy:sepolia
npm run dev:web
```

The script refuses a network other than Sepolia **11155111**. It deploys the unmodified official Aqua source, test collateral, custom GaussVM router and a seven-day demo market, then seeds a position through approvals, split and ship. Every receipt and the order hash are checked. This does not claim a canonical mainnet Aqua address.

The public `deployments/sepolia.json` may be committed after verifying its addresses and explorer receipts. The browser uses a public RPC URL instead of exposing an authenticated endpoint. Complete a real wallet swap before claiming a working public deployment. Public RPC/faucet availability and test-gas consumption remain external constraints.

The interface uses an injected wallet on Sepolia and requests a network switch. If the wallet does not know Sepolia, add it in the wallet settings. The deployer is the disclosed resolver. A seven-day market must be replaced after expiry for later demos.

## Free static hosting

[GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) supports static hosting from public repositories on GitHub Free. No backend or database is needed.

```sh
npm run build:public
```

Without a Sepolia manifest, the artifact displays a research preview and disables chain actions. With one, it uses Sepolia. The build excludes localhost manifests, then restores the local development copy.

After pushing under the correct GitHub account, set **Settings → Pages → Source → GitHub Actions** and run **Publish research demo to GitHub Pages** manually. Inspect the workflow's returned URL. The expected repository URL is `https://krishna-aga.github.io/gaussvm/`; it is **not a claimed live URL** until published and verified.

The workflow is manual, not a deployment on push. Vite's relative base supports the repository subpath. Only `dist/` is published; source directories, logs and `.env` are excluded.

## Environment notes

- Git submodules are required; source ZIPs do not contain them.
- PowerShell works without Bash or Foundry; npm solc compiles Solidity.
- Playwright requires its Chromium download once. Linux CI uses `npx playwright install --with-deps chromium`.
- The launcher shuts down only its own children. Pre-existing local nodes are left running.
- Mainnet, paid RPC, databases, paid hosting and real-value collateral are outside the project.
