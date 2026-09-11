# Troubleshooting and recovery

## Start or restore the local demo

Run `npm run dev` from the repository. It starts the local chain and the web interface, or reuses a chain already running on localhost:8545. Keep that terminal open and visit http://127.0.0.1:5173.

If the market has expired, was resolved, or belongs to an old local node, keep the node running and run `npm run deploy:local`, then reload the page. This creates a fresh market without changing the previous onchain market. Each deployment has its own browser workspace.

If a port is occupied by another application, stop that application deliberately or use its existing terminal. The launcher does not terminate unrelated processes. Do not run two demo launchers against the same ports.

## No deployment or invalid configuration

A public build without a Sepolia deployment is a research preview. Run the local demo for execution. If the interface reports invalid configuration, regenerate the manifest with the appropriate local/Sepolia deployment command. Do not manually substitute arbitrary contract addresses: the encoded order, tokens, market and router must agree.

## A swap is unavailable

Check the displayed market status, wallet connection, input-token balance and amount. Amounts must be positive with no more than 18 decimal places; `.5` is accepted. Large trades or extreme probabilities can exceed the supported numerical domain. Try a smaller input. Time-scaled positions can leave that domain before expiry.

An approval and a swap are separate transactions. If approval succeeds but the swap fails, the next attempt checks the existing allowance. The displayed quote may have changed, so review the new minimum output before retrying. A docked or expired position cannot quote; switch to another saved active position or create a fresh local market.

## A transaction is unconfirmed

**Confirmation unavailable** means the result is unknown. Use **Check receipt** for the same hash. Refreshing preserves the hash and keeps new writes disabled until its receipt is resolved. Reconnecting a wallet does not prove that the earlier action failed.

A wallet cancellation or replacement stops the original operation; previously confirmed steps remain confirmed. The journal shows the replacement's receipt with a cancelled/replaced state. If a replacement happened while the app was closed and was never observed here, use the wallet or the public explorer to investigate the original nonce; do not assume the original transaction failed merely because its hash is not found. The journal is a browser cache, not a full chain indexer.

Use **Download receipts** to keep a JSON copy of the submitting addresses, hashes, states, block numbers and gas. Local-chain hashes have no public explorer page. The source block in fork evidence is public; the fork's swap transaction is local.

## Saved positions or receipts are missing

Use the same browser and origin. `localhost` and `127.0.0.1` have separate browser storage. Private browsing, storage restrictions and clearing site data can remove the cache. The app shows storage errors; keep downloaded receipts before closing if persistence is unavailable. Assets and Aqua allocations remain onchain even if the browser cache is removed. Positions created in this browser can be selected under **Liquidity → Trading position**; this is not automatic discovery of positions created elsewhere.

## Free fork or Sepolia RPC is slow

The ordinary local demo works independently of a remote RPC. The canonical fork demonstration needs a provider that serves the chosen Ethereum block. Use `FORK_RPC_URL` and optionally `FORK_BLOCK` as described in [deployment](deployment.md). A failed fork run is not successful evidence; the command reports failure and shuts down its own fork process.

Sepolia requires an injected wallet and free faucet ETH for gas. Test gUSD/YES/NO do not replace gas ETH. No mainnet transaction or purchase is necessary for this project.

## Run the checks

`npm run check` compiles contracts, executes the test suite and builds the interface. `npm run test:browser` exercises the local UI and deliberately resolves its final market. Provision a fresh market afterward for a manual demo. See [verification](verification.md) for the checks actually executed and their limits.
