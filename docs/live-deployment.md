# Live Sepolia deployment

**App:** https://krishna-aga.github.io/gaussvm/  
**Source:** https://github.com/krishna-aga/gaussvm  
**Network:** Ethereum Sepolia, chain ID **11155111**

Deployed on **11 September 2026**. The seeded market expires **11 October 2026 at 14:58:24 UTC**. It uses a manual resolver and worthless faucet collateral. The complete local lifecycle demo remains available with `npm run dev`.

The single active question is **Will this project win ETHOnline 2026?** “This project” means GaussVM; YES means any officially announced event prize, including partner prizes, by expiry. The app explains the rules and reads the question from the contract. The original demo market was replaced with a new BinaryMarket and YES/NO tokens; Aqua, router and gUSD were reused. The old seed is docked. [Earlier tokens and receipts](retired-market.md) remain documented separately.

## Use the app

1. Open the app in a browser with an Ethereum wallet extension.
2. Enable Sepolia in the wallet and obtain free Sepolia ETH for gas. Ethereum's [network guide](https://ethereum.org/developers/docs/networks/#sepolia) lists testnet faucets; eligibility varies. Do not purchase test ETH.
3. Select **Connect to swap**. Approve the account/network request in your wallet.
4. Select **Get 100 YES + 100 NO**. Approve the faucet, collateral approval and split transactions when requested. Test gUSD and outcome tokens have no monetary value.
5. Enter an amount and review the estimate/minimum received. Select **Swap NO for YES** and approve the limited token allowance and swap.
6. Open the journal's Sepolia explorer link to inspect the actual receipt. Saved history belongs to this browser; **Download receipts** exports it.

The initial position has 1,000 YES + 1,000 NO allocated through Aqua. Allocation does not deposit these tokens into Aqua: they stay in the maker wallet and move when trades settle. The current seed uses the static Gaussian pm-AMM mode. The Liquidity page can create an experimental time-scaled position.

## Contracts

| Contract | Sepolia address |
| --- | --- |
| Official Aqua source deployment | [`0x2f478eb1726c83108f1363f01757bae7dfe9bed6`](https://sepolia.etherscan.io/address/0x2f478eb1726c83108f1363f01757bae7dfe9bed6) |
| GaussVM router | [`0xee9bd9a83feaf9df60fe6ad0ced4bd30c3fd18e9`](https://sepolia.etherscan.io/address/0xee9bd9a83feaf9df60fe6ad0ced4bd30c3fd18e9) |
| Binary market | [`0xb36c73b753424da9e7177a2b6b32310f4241eb4f`](https://sepolia.etherscan.io/address/0xb36c73b753424da9e7177a2b6b32310f4241eb4f) |
| Faucet gUSD | [`0x39bc0f0658f0d79b8f923e98fd840a41cd65c85e`](https://sepolia.etherscan.io/address/0x39bc0f0658f0d79b8f923e98fd840a41cd65c85e) |
| YES | [`0x3250101B123877c69A2C9b2a6c3178f863cE0Fa3`](https://sepolia.etherscan.io/address/0x3250101B123877c69A2C9b2a6c3178f863cE0Fa3) |
| NO | [`0x6649436b2F61F6760Dc8638ad41a187cBB3bf4c8`](https://sepolia.etherscan.io/address/0x6649436b2F61F6760Dc8638ad41a187cBB3bf4c8) |

Maker/resolver: `0xA816Fdc3ec3b1C32C7b22B18d9Bec2Ee88B7C431`. The dedicated test taker is `0x5076F136d3cD37B95471DcCFb5cf721f6448521b`. Their keys are retained only in the owner's ignored local `.env`; no signing key is committed, uploaded to CI or included in the frontend.

The current [manifest](../deployments/sepolia.json) contains the three original infrastructure deployment receipts and seven new market/setup receipts. All six current contracts have **exact creation and runtime matches** on Sourcify; [open the GaussVM source](https://repo.sourcify.dev/11155111/0xee9bd9a83feaf9df60fe6ad0ced4bd30c3fd18e9) or inspect the [verification evidence](evidence/ethonline-source-verification.json). Source verification establishes source/bytecode correspondence, not a security audit.

The shared infrastructure is a Sepolia deployment of pinned official Aqua source and the custom SwapVM extension. The separate [canonical Aqua fork evidence](evidence/canonical-aqua-fork.json) uses 1inch's existing Ethereum deployment. These environments have distinct addresses and receipts.

## Initial public execution evidence (retired market)

Before replacement, the published interface executed **10 NO → 9.93674043721512635 YES** in [transaction `0x0018…ba92`](https://sepolia.etherscan.io/tx/0x0018d1e3250a1f86452f5193e4bf4a27836cce26019d054f8662aaa3c2ecba92), block **11,682,691**, using **762,509 gas**. This receipt belongs to the retired question and its old tokens. Assertions matched the event's amounts with the taker's actual before/after balances. Desktop/mobile screenshots were inspected and there was no horizontal overflow at 390px.

Token preparation confirmed in the initial browser run, which then timed out waiting for the swap-success assertion. A second run from that funded taker completed approval and swap. The smoke test now stops immediately on a visible wallet/RPC error instead of waiting only for success. [The public evidence](evidence/sepolia-ui.json) preserves both attempts' submitted transactions, actual receipts and this limitation. The test used an EIP-1193 adapter with signing in Node; browser-extension confirmation dialogs were not automated.

The owner supplied **0.1 faucet Sepolia ETH**. Before replacement, deployment/setup, trader funding gas and the initial public UI execution had spent **0.008821072348203524 Sepolia ETH** in gas, leaving **0.091178927651796476 Sepolia ETH** across the deployer and test-taker wallets at that earlier snapshot. These figures exclude subsequent replacement/testing transactions. Funding the test taker was a transfer between those wallets, not an additional cost. These are test tokens; no real money was spent on deployment or hosting.

## Hosting and maintenance

GitHub Pages hosts static files with HTTPS. GitHub Actions uses standard Linux runners in the public repository. Reads use the free PublicNode Sepolia endpoint. No paid hosting, RPC subscription, database, mainnet transaction or purchased gas is involved. Free services and faucets can have availability limits.

After a frontend or manifest change, push the focused commits and dispatch `.github/workflows/pages.yml`. The published bundle includes only public deployment data. See [deployment.md](deployment.md) for source verification, the opt-in public UI test and redeployment commands.

When the current market expires, swaps stop. The resolver has a one-day window to choose the outcome; afterward anyone can cancel an unresolved market and redeem half per side. To provide a fresh trading demo, deploy a new market/system and publish its manifest. Public chain time cannot be fast-forwarded.
