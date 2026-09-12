# Research and scope

Checked 2026-09-11 against primary sources.

## Sources

1. [Moallemi and Robinson, pm-AMM: A Uniform AMM for Prediction Markets](https://www.paradigm.xyz/writing/pm-amm), published 2024-11-05. The rendered equations were checked directly, including their accessible LaTeX labels.
2. [ETHOnline 2026 prizes](https://ethglobal.com/events/ethonline2026/prizes): 1inch's Aqua application track offers $5,000 of the sponsor's $7,000 total. SwapVM use receives higher scoring; official contracts, demonstrated transfers, and genuine commit history matter. No evidence supports predictions of 1-3 competing submissions or guaranteed prizes.
3. [Official SwapVM source](https://github.com/1inch/swap-vm/tree/afd99c408b4ed610027f4426c6f98650acac9f5f): current dispatch, token-pair encoding, five-argument constructor, and three-argument quote/swap differ from older README snippets. Read source and tests first.
4. [Official Aqua source](https://github.com/1inch/aqua/tree/9c5c42e5840e8741fba3597c48456c9510212b66): ship records a per-maker/app/strategy allocation, without depositing tokens. Pull/push settle ERC-20 transfers. Allocation is not guaranteed available wallet liquidity.
5. [Aqua SDK](https://github.com/1inch/sdks/tree/master/typescript/aqua): useful for general integrations; this project initially encodes the pinned contract interfaces directly to avoid SDK/source version mismatch.

## Verified mathematical statement

With complementary outcome reserves x and y, z = (y-x)/L, standard normal CDF Phi and density phi, the static invariant is:

```text
F(x,y;L) = (y-x) Phi((y-x)/L) + L phi((y-x)/L) - y = 0
```

The dynamic expression substitutes L sqrt(T-t) for L. Time units must be fixed. We use initial scale L0 and normalized remaining lifetime, L(t) = L0 sqrt((expiry-t)/(expiry-start)).

The source's uniform LVR result assumes Gaussian score dynamics, frictionless arbitrage and the modeled pool. It is not a profitability guarantee. Static pm-AMM still has increasing LVR near expiration. Dynamic liquidity declines near expiry; this does not eliminate arbitrage losses. Not all prediction markets follow Gaussian score dynamics.

## Implementation decision

Ship static Gaussian pricing and an explicitly named time-scaled extension. Swaps preserve the current F level at the transaction's timestamp. A common reserve offset represents inactive complete sets kept in the wallet, rather than forcing a token movement solely because time passed. This reproduces the time-dependent marginal curve with retained cash; it is not a claim that total wallet value satisfies the paper's unshifted dynamic LVR theorem.

The custom instruction will support exact input only, both YES/NO directions, bounded numerical arguments and an expiry cutoff. Exact output is rejected explicitly. Outcomes are fully backed by a test collateral token. Resolution is a disclosed manual authority with a cancellation timeout, not a decentralized oracle.

## Track decision

The sole target is **1inch — Build an Aqua App ($5,000)**. Product work, demonstrations and evidence focus on official Aqua settlement and the custom SwapVM instruction. The standalone track demo makes shared wallet liquidity, strategy accounting and the full outcome lifecycle observable. Additional sponsor integrations are outside this project's scope.
