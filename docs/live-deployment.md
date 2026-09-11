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
| Optimized GaussVM router | [`0xc6861469c1c0144d132efcc4a1261c4fd3e38310`](https://sepolia.etherscan.io/address/0xc6861469c1c0144d132efcc4a1261c4fd3e38310) |
| Binary market | [`0xb36c73b753424da9e7177a2b6b32310f4241eb4f`](https://sepolia.etherscan.io/address/0xb36c73b753424da9e7177a2b6b32310f4241eb4f) |
| Faucet gUSD | [`0x39bc0f0658f0d79b8f923e98fd840a41cd65c85e`](https://sepolia.etherscan.io/address/0x39bc0f0658f0d79b8f923e98fd840a41cd65c85e) |
| YES | [`0x3250101B123877c69A2C9b2a6c3178f863cE0Fa3`](https://sepolia.etherscan.io/address/0x3250101B123877c69A2C9b2a6c3178f863cE0Fa3) |
| NO | [`0x6649436b2F61F6760Dc8638ad41a187cBB3bf4c8`](https://sepolia.etherscan.io/address/0x6649436b2F61F6760Dc8638ad41a187cBB3bf4c8) |

Maker/resolver: `0xA816Fdc3ec3b1C32C7b22B18d9Bec2Ee88B7C431`. The dedicated test taker is `0x5076F136d3cD37B95471DcCFb5cf721f6448521b`. Their keys are retained only in the owner's ignored local `.env`; no signing key is committed, uploaded to CI or included in the frontend.

The current [manifest](../deployments/sepolia.json) retains market/setup receipts and records the optimized router deployment and migration. All six current contracts have **exact creation and runtime matches** on Sourcify; [open the GaussVM source](https://repo.sourcify.dev/11155111/0xc6861469c1c0144d132efcc4a1261c4fd3e38310) or inspect the [verification evidence](evidence/gas-source-verification.json). Source verification establishes source/bytecode correspondence, not a security audit.

The shared infrastructure is a Sepolia deployment of pinned official Aqua source and the custom SwapVM extension. The separate [canonical Aqua fork evidence](evidence/canonical-aqua-fork.json) uses 1inch's existing Ethereum deployment. These environments have distinct addresses and receipts.

## Optimized router rollout

On 11 September 2026, the new router was deployed in [transaction `0x8afc…c8d1`](https://sepolia.etherscan.io/tx/0x8afcd80eb27f0bad2ffdfc396fde6319c031e579d98ce0050600ef506114c8d1).
The market, question, YES/NO tokens, collateral, Aqua, resolver, expiry and encoded
seed order are unchanged. The old seed was docked and its closing **990.063259562784873650
YES + 1,010 NO** allocations were shipped to the optimized router. Other positions
on the old router were not migrated or closed. Old addresses and receipts remain
in the [pre-optimization manifest](../deployments/archive/sepolia-pre-gas.json).

Deployment, docking, the limited NO allowance update and shipping consumed
**0.003918242530447728 Sepolia ETH** across four confirmed transactions. A rerun
sent no further transactions. [Migration evidence](evidence/gas-router-migration.json)
and [exact source verification](evidence/gas-source-verification.json) are recorded.
See [gas optimization](gas-optimization.md) for paired benchmarks and custom-position
recovery. This migration used existing faucet funds and no paid service.

## ETHOnline market execution before router optimization

The published app exchanged **10 NO → 9.93674043721512635 YES** on the new market in [transaction `0xaa3e…8625`](https://sepolia.etherscan.io/tx/0xaa3e813b024e4b593ac14e62807cf01c0d30cc1f746ea057b161764a5bfd8625), block **11,682,848**, using **762,497 gas**. The successful `Swapped` event matches the taker's actual balances: YES increased from 100 to 109.93674043721512635 and NO decreased from 100 to 90. The YES purchase animation was observed after confirmation. [Current UI evidence](evidence/ethonline-ui.json) records these checks, and [migration evidence](evidence/ethonline-market.json) records the new deployment, old seed's docking and costs.

The first attempt confirmed collateral approval and splitting but timed out waiting for swap confirmation without submitting a swap. Its two successful receipts are retained in the evidence. After tightening quote refreshes, a retry from the already-funded wallet completed router approval and swap. This is evidence of the successful retry and the separately tested quote fix; it is not proof of the first attempt's exact cause. The test uses an EIP-1193 adapter with signing in Node, not automated extension dialogs. Desktop/mobile captures were inspected with no horizontal overflow at 390px.

Market replacement, old-seed docking and both public test attempts used **0.003551798172296685 Sepolia ETH** in gas. Total tracked project gas is **0.012372870520500209 Sepolia ETH**, leaving **0.087627129479499791 Sepolia ETH** across the two dedicated wallets at the recorded block. No additional funding or paid service was needed.

## Initial public execution evidence (retired market)

Before replacement, the published interface executed **10 NO → 9.93674043721512635 YES** in [transaction `0x0018…ba92`](https://sepolia.etherscan.io/tx/0x0018d1e3250a1f86452f5193e4bf4a27836cce26019d054f8662aaa3c2ecba92), block **11,682,691**, using **762,509 gas**. This receipt belongs to the retired question and its old tokens. Assertions matched the event's amounts with the taker's actual before/after balances. Desktop/mobile screenshots were inspected and there was no horizontal overflow at 390px.

Token preparation confirmed in the initial browser run, which then timed out waiting for the swap-success assertion. A second run from that funded taker completed approval and swap. The smoke test now stops immediately on a visible wallet/RPC error instead of waiting only for success. [The public evidence](evidence/sepolia-ui.json) preserves both attempts' submitted transactions, actual receipts and this limitation. The test used an EIP-1193 adapter with signing in Node; browser-extension confirmation dialogs were not automated.

The owner supplied **0.1 faucet Sepolia ETH**. Before replacement, deployment/setup, trader funding gas and the initial public UI execution had spent **0.008821072348203524 Sepolia ETH** in gas, leaving **0.091178927651796476 Sepolia ETH** across the deployer and test-taker wallets at that earlier snapshot. These figures exclude subsequent replacement/testing transactions. Funding the test taker was a transfer between those wallets, not an additional cost. These are test tokens; no real money was spent on deployment or hosting.

## Hosting and maintenance

GitHub Pages hosts static files with HTTPS. GitHub Actions uses standard Linux runners in the public repository. Reads use the free PublicNode Sepolia endpoint. No paid hosting, RPC subscription, database, mainnet transaction or purchased gas is involved. Free services and faucets can have availability limits.

After a frontend or manifest change, push the focused commits and dispatch `.github/workflows/pages.yml`. The published bundle includes only public deployment data. See [deployment.md](deployment.md) for source verification, the opt-in public UI test and redeployment commands.

When the current market expires, swaps stop. The resolver has a one-day window to choose the outcome; afterward anyone can cancel an unresolved market and redeem half per side. To provide a fresh trading demo, deploy a new market/system and publish its manifest. Public chain time cannot be fast-forwarded.
