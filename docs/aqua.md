# Aqua in GaussVM

GaussVM is a trading app built on 1inch Aqua. Aqua supplies liquidity accounting and settlement; our SwapVM extension supplies the Gaussian pricing instruction. The website is the interface to those contracts, hosted on GitHub Pages.

## What an Aqua app means

[Aqua](https://github.com/1inch/aqua#architecture) lets a liquidity provider authorize a strategy while keeping the trading tokens in their own wallet. The provider approves Aqua and ships an allocation. Aqua records how much that particular app/strategy may use. Shipping does not move those tokens into a pool.

An Aqua app defines what trades are allowed and how much output they receive. During a trade, it uses Aqua's transfer/accounting functions to settle with the maker. [SwapVM](https://github.com/1inch/swap-vm) is the programmable execution engine used by this project. GaussVM inherits the pinned official SwapVM implementation and adds Gaussian opcode `0x80`; it uses SwapVM's Aqua settlement path.

There is no separate “upload to Aqua” hosting step. This project is an Aqua app because its onchain execution uses Aqua. It is not a listing claim for a 1inch directory or the standard 1inch swap-aggregator API.

## A YES purchase

1. The maker splits faucet gUSD into YES/NO tokens and ships an allocation through Aqua. Those outcome tokens remain in the maker's wallet.
2. The buyer selects Get YES and specifies the NO tokens they want to spend. The interface simulates the GaussVM router for a quote.
3. Our custom SwapVM instruction calculates YES output from the Gaussian invariant, the maker's allocated balances and the immutable strategy parameters.
4. Once the buyer approves and submits the swap, the router takes NO from the buyer and pushes it through Aqua to the maker. Aqua pulls the corresponding YES from the maker to the buyer. Transfers and accounting settle in one transaction or revert together.
5. The interface confirms only from a successful receipt. The brief YES/NO stamp is purchase feedback, not a prediction that YES or NO will win.

The buyer approves the router; the maker approves Aqua. Allowances, balances, slippage and the deadline still constrain execution. Because allocation is not escrow, a maker can spend tokens or revoke approval and make a previously quoted trade unavailable.

## The market contract has a different job

`BinaryMarket` holds the gUSD backing the complete sets: one gUSD creates one YES plus one NO. It handles merging, manual resolution and redemption. Aqua does not decide who wins ETHOnline and does not serve as the event oracle.

The maker's **trading outcome tokens** stay in their wallet until settlement. The **collateral backing the outcomes** is held by BinaryMarket. Keeping these two roles distinct avoids an incorrect claim that all project assets always stay outside contracts.

The interface exposes one question: **Will this project win ETHOnline 2026?** “This project” means GaussVM. YES means at least one officially announced event prize, including partner prizes, by expiry; NO requires final results with no prize. Unavailable results should be left unresolved for timeout cancellation. These interpretation rules are documented and shown in the app; the contract enforces resolver permissions and timing, not external prize results.

Multiple saved liquidity strategies can trade this same question and token pair. They are not separate markets. Everything uses worthless test assets; this implementation makes no yield, profit or competition-result guarantee.

See [architecture](architecture.md) for encoding/transfer details, [security](security.md) for trust boundaries, and [live deployment](live-deployment.md) for the actual Sepolia contracts and receipts.
