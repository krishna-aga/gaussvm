import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseAbi,
  type Address,
  type Hash,
} from "viem";
import { hardhat, sepolia } from "viem/chains";

export type Deployment = {
  schemaVersion: number;
  chainId: number;
  network: string;
  rpcUrl: string;
  aqua: Address;
  router: Address;
  collateral: Address;
  market: Address;
  yes: Address;
  no: Address;
  maker: Address;
  resolver: Address;
  start: number;
  expiry: number;
  timeScaled: boolean;
  liquidity: string;
  order: { maker: Address; traits: string; data: `0x${string}` };
  orderHash: Hash;
  receipts: {
    label: string;
    hash: Hash;
    blockNumber: string;
    gasUsed: string;
  }[];
};
export const tokenAbi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function faucet()",
  "function totalSupply() view returns (uint256)",
]);
export const marketAbi = parseAbi([
  "function split(uint256)",
  "function merge(uint256)",
  "function redeem(uint256,uint256) returns (uint256)",
  "function resolve(bool)",
  "function cancelUnresolved()",
  "function status() view returns (uint8)",
  "function question() view returns (string)",
]);
export const aquaAbi = parseAbi([
  "function rawBalances(address,address,bytes32,address) view returns (uint248 balance,uint8 tokensCount)",
  "function ship(address,bytes,address[],uint256[]) returns (bytes32)",
  "function dock(address,bytes32,address[])",
]);
export const routerAbi = parseAbi([
  "function quote((address maker,uint256 traits,bytes data),uint256,bytes) returns (uint256 amountIn,uint256 amountOut,bytes32 orderHash)",
  "function swap((address maker,uint256 traits,bytes data),uint256,bytes) payable returns (uint256 amountIn,uint256 amountOut,bytes32 orderHash)",
  "function effectiveLiquidity(uint256,uint64,uint64,bool) view returns (uint256)",
]);
export const getChain = (d: Deployment) =>
  d.chainId === 31337 ? hardhat : sepolia;
export function getClient(d: Deployment) {
  if (![31337, 11155111].includes(d.chainId))
    throw new Error("Only local EVM and Sepolia are supported.");
  return createPublicClient({
    chain: getChain(d),
    transport: http(d.rpcUrl, { retryCount: 0 }),
    pollingInterval: 1500,
  });
}
export function localAvailable(d: Deployment) {
  return (
    d.chainId === 31337 &&
    ["127.0.0.1", "localhost"].includes(location.hostname) &&
    ["127.0.0.1", "localhost"].includes(new URL(d.rpcUrl).hostname)
  );
}
type Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (name: string, fn: (value: unknown) => void) => void;
  removeListener?: (name: string, fn: (value: unknown) => void) => void;
};
export const injected = () =>
  (window as unknown as { ethereum?: Provider }).ethereum;
export async function connect(
  d: Deployment,
  role: "trader" | "maker" = "trader",
) {
  if (localAvailable(d)) {
    const wallet = createWalletClient({
      chain: getChain(d),
      transport: http(d.rpcUrl, { retryCount: 0 }),
    });
    const accounts = await wallet.getAddresses();
    const account =
      role === "maker"
        ? accounts.find((a) => a.toLowerCase() === d.maker.toLowerCase())
        : accounts[1];
    if (!account)
      throw new Error(
        "The required local wallet is not available. Restart the local demo.",
      );
    return { wallet, account };
  }
  const provider = injected();
  if (!provider)
    throw new Error(
      "Install an Ethereum wallet, or run npm run dev locally for a wallet-free demo.",
    );
  const id = `0x${d.chainId.toString(16)}`;
  if ((await provider.request({ method: "eth_chainId" })) !== id) {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: id }],
    });
  }
  const wallet = createWalletClient({
    chain: getChain(d),
    transport: custom(provider as never),
  });
  const [account] = await wallet.requestAddresses();
  if (!account)
    throw new Error(
      "No wallet account was shared. Connect an account to continue.",
    );
  return { wallet, account };
}
export type Session = Awaited<ReturnType<typeof connect>>;
export const short = (value: string) =>
  `${value.slice(0, 6)}…${value.slice(-4)}`;
export const txUrl = (d: Deployment, hash: string) =>
  d.chainId === 11155111
    ? `https://sepolia.etherscan.io/tx/${hash}`
    : undefined;
