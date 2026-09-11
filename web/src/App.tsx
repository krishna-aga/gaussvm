import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  CircleHelp,
  Copy,
  ExternalLink,
  FlaskConical,
  Layers3,
  LoaderCircle,
  LogOut,
  Wallet,
  Waves,
  XCircle,
} from "lucide-react";
import {
  formatEther,
  isAddress,
  parseEther,
  type Abi,
  type Address,
  type Hash,
} from "viem";
import {
  makeOrder,
  encodeOrder,
  orderHash,
  takerData,
} from "../../lib/encoding.mjs";
import { cdf } from "../../lib/reference.mjs";
import { MARKET_QUESTION, MARKET_RULES } from "../../lib/market.mjs";
import { PurchaseFeedback } from "./PurchaseFeedback";
import {
  validateDeployment,
  workspaceKey,
  positionFrom,
  readWorkspace,
  writeWorkspace,
  receiptState,
} from "../../lib/workspace.mjs";
import { Curve } from "./Curve";
import {
  aquaAbi,
  connect,
  getClient,
  localAvailable,
  marketAbi,
  routerAbi,
  short,
  tokenAbi,
  txUrl,
  type Deployment,
  type Session,
} from "./chain";

type ChainState = {
  question: string;
  yes: bigint;
  no: bigint;
  collateral: bigint;
  reserveYes: bigint;
  reserveNo: bigint;
  active: boolean;
  status: number;
  timestamp: number;
  block: bigint;
};
type Transaction = {
  label: string;
  hash: Hash;
  state:
    | "pending"
    | "confirmed"
    | "failed"
    | "unknown"
    | "cancelled"
    | "replaced";
  account: Address;
  replacement?: "repriced" | "cancelled" | "replaced";
  gas?: string;
  block?: string;
};
type Position = Pick<
  Deployment,
  "maker" | "start" | "timeScaled" | "liquidity" | "order" | "orderHash"
>;
const browserStorage = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => localStorage.setItem(key, value),
};
const fmt = (v: bigint | undefined, digits = 2) =>
  v === undefined
    ? "—"
    : Number(formatEther(v)).toLocaleString("en-US", {
        maximumFractionDigits: digits,
      });
function errorText(error: unknown) {
  const details =
    error && typeof error === "object"
      ? (error as { message?: unknown; code?: number })
      : undefined;
  const text =
    typeof details?.message === "string" ? details.message : String(error);
  if (details?.code === 4001 || /reject|denied/i.test(text))
    return "The wallet request was declined. You can try again.";
  if (details?.code === -32002)
    return "A wallet request is already open. Check your wallet to continue.";
  if (/insufficient funds/i.test(text))
    return "This test wallet needs faucet ETH to cover gas.";
  if (/fetch|HTTP request|network/i.test(text))
    return "The blockchain connection is unavailable. Try again shortly.";
  if (/revert/i.test(text))
    return "The contract rejected this action. Check the amount, token balance, active position and market deadline, then get a new quote.";
  return text.split("\n")[0].slice(0, 230);
}

export default function App() {
  const [deployment, setDeployment] = useState<Deployment>();
  const [loading, setLoading] = useState(true),
    [page, setPage] = useState("market");
  const [session, updateSession] = useState<Session>(),
    [state, setState] = useState<ChainState>();
  const [error, setError] = useState(""),
    [chainError, setChainError] = useState(""),
    [busy, setBusy] = useState("");
  const [transactions, updateTransactions] = useState<Transaction[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [storageWarning, setStorageWarning] = useState("");
  const history = useRef<
    | {
        key: string;
        positions: Position[];
        selected: Hash;
        transactions: Transaction[];
      }
    | undefined
  >(undefined);
  const seed = useRef<Deployment | undefined>(undefined);
  const refreshSequence = useRef(0);
  const actionLock = useRef(false);
  const current = useRef({ deployment, session });
  current.current = { deployment, session };
  const [amount, setAmount] = useState("10"),
    [buyYes, setBuyYes] = useState(true);
  const [quote, setQuote] = useState<bigint>(),
    [quoting, setQuoting] = useState(false),
    [quoteError, setQuoteError] = useState("");
  const [remaining, setRemaining] = useState(100),
    [timeScaled, setTimeScaled] = useState(false);
  const [copied, setCopied] = useState<Hash>();
  const [freshPurchase, setFreshPurchase] = useState<Hash>();
  useEffect(() => {
    if (!freshPurchase) return;
    const timer = setTimeout(() => setFreshPurchase(undefined), 900);
    return () => clearTimeout(timer);
  }, [freshPurchase]);

  function persistHistory() {
    if (!history.current) return;
    const { key, ...value } = history.current;
    if (!writeWorkspace(browserStorage, key, value))
      setStorageWarning(
        "Browser storage is unavailable. Keep transaction hashes before refreshing; new history cannot be saved here.",
      );
  }
  function setTransactions(update: (previous: Transaction[]) => Transaction[]) {
    const next = update(history.current?.transactions ?? []);
    if (history.current) history.current.transactions = next;
    // Persist the submitted hash synchronously, before React's next render.
    persistHistory();
    updateTransactions(next);
  }
  function setSession(next: Session | undefined) {
    current.current.session = next;
    refreshSequence.current++;
    setState(undefined);
    setQuote(undefined);
    updateSession(next);
  }
  function selectPosition(selected: Hash) {
    const position = positions.find((p) => p.orderHash === selected);
    if (!seed.current || !position || !history.current) return;
    history.current.selected = selected;
    persistHistory();
    refreshSequence.current++;
    setState(undefined);
    setQuote(undefined);
    const next = { ...seed.current, ...position };
    current.current.deployment = next;
    setDeployment(next);
  }

  useEffect(() => {
    let active = true;
    fetch(`${import.meta.env.BASE_URL}deployment.json`)
      .then(async (r) => {
        if (r.status === 404) return;
        if (!r.ok)
          throw new Error(
            "Deployment configuration could not be loaded. Reload the page to try again.",
          );
        const d = (await r.json()) as Deployment;
        if (!validateDeployment(d))
          throw new Error(
            "Deployment configuration is invalid. Regenerate it with npm run deploy:local or the Sepolia deployment script.",
          );
        if (active) {
          seed.current = d;
          const saved = readWorkspace(browserStorage, d);
          history.current = {
            key: workspaceKey(d),
            positions: saved.positions,
            selected: saved.selected,
            transactions: saved.transactions,
          };
          setPositions(saved.positions);
          updateTransactions(saved.transactions);
          setStorageWarning(saved.warning);
          setDeployment({
            ...d,
            ...saved.positions.find(
              (p: Position) => p.orderHash === saved.selected,
            ),
          });
        }
      })
      .catch((e) => {
        if (active) setError(errorText(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!deployment) return;
    if (
      current.current.deployment !== deployment ||
      current.current.session !== session
    )
      return;
    const request = ++refreshSequence.current;
    const d = deployment,
      p = getClient(d);
    try {
      const block = await p.getBlock();
      const address = session?.account;
      const balance = (token: Address) =>
        address
          ? p.readContract({
              address: token,
              abi: tokenAbi,
              functionName: "balanceOf",
              args: [address],
              blockNumber: block.number,
            })
          : Promise.resolve(0n);
      const [
        yes,
        no,
        collateral,
        reserveYes,
        reserveNo,
        status,
        code,
        question,
      ] = await Promise.all([
        balance(d.yes),
        balance(d.no),
        balance(d.collateral),
        p.readContract({
          address: d.aqua,
          abi: aquaAbi,
          functionName: "rawBalances",
          args: [d.maker, d.router, d.orderHash, d.yes],
          blockNumber: block.number,
        }),
        p.readContract({
          address: d.aqua,
          abi: aquaAbi,
          functionName: "rawBalances",
          args: [d.maker, d.router, d.orderHash, d.no],
          blockNumber: block.number,
        }),
        p.readContract({
          address: d.market,
          abi: marketAbi,
          functionName: "status",
          blockNumber: block.number,
        }),
        p.getCode({ address: d.router, blockNumber: block.number }),
        p.readContract({
          address: d.market,
          abi: marketAbi,
          functionName: "question",
          blockNumber: block.number,
        }),
      ]);
      if (request !== refreshSequence.current) return;
      if (!code || code === "0x")
        throw new Error(
          "Deployment no longer exists. Restart npm run dev and reload this page.",
        );
      if (question !== MARKET_QUESTION)
        throw new Error(
          "This deployment uses an older market. Reload the published app or run npm run deploy:local for the current question.",
        );
      setState({
        question,
        yes,
        no,
        collateral,
        reserveYes: reserveYes[0],
        reserveNo: reserveNo[0],
        active:
          reserveYes[1] > 0 &&
          reserveYes[1] < 255 &&
          reserveNo[1] > 0 &&
          reserveNo[1] < 255,
        status,
        timestamp: Number(block.timestamp),
        block: block.number,
      });
      setChainError("");
    } catch (e) {
      if (request !== refreshSequence.current) return;
      setChainError(errorText(e));
      setState(undefined);
    }
  }, [deployment, session]);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 7000);
    return () => {
      refreshSequence.current++;
      clearInterval(timer);
    };
  }, [refresh]);
  const provider = session?.provider;
  useEffect(() => {
    if (!provider) return;
    const accountsChanged = (value: unknown) => {
      const connected = current.current.session;
      if (connected?.provider !== provider || !Array.isArray(value)) return;
      if (!value.length) {
        setSession(undefined);
        return;
      }
      const account = value[0];
      if (typeof account !== "string" || !isAddress(account)) return;
      if (account.toLowerCase() === connected.account.toLowerCase()) return;
      setSession({ ...connected, account });
    };
    const chainChanged = (value: unknown) => {
      const connected = current.current.session;
      if (connected?.provider !== provider || typeof value !== "string") return;
      const chainId = Number(value);
      if (
        !Number.isSafeInteger(chainId) ||
        chainId <= 0 ||
        chainId === connected.chainId
      )
        return;
      setSession({ ...connected, chainId });
    };
    const disconnected = () => {
      if (current.current.session?.provider === provider) setSession(undefined);
    };
    provider.on?.("accountsChanged", accountsChanged);
    provider.on?.("chainChanged", chainChanged);
    provider.on?.("disconnect", disconnected);
    return () => {
      provider.removeListener?.("accountsChanged", accountsChanged);
      provider.removeListener?.("chainChanged", chainChanged);
      provider.removeListener?.("disconnect", disconnected);
    };
  }, [provider]);

  const inputToken = deployment
    ? buyYes
      ? deployment.no
      : deployment.yes
    : undefined;
  const inputName = buyYes ? "NO" : "YES",
    outputName = buyYes ? "YES" : "NO";
  let parsed = 0n;
  try {
    if (/^(\d+(\.\d{0,18})?|\.\d{1,18})$/.test(amount.trim()))
      parsed = parseEther(amount.trim());
  } catch {}
  const open =
    !!deployment &&
    !!state &&
    state.status === 0 &&
    state.timestamp + 60 < deployment.expiry &&
    state.active;
  const quoteBlock = state?.block;
  const quoteTimestamp = state?.timestamp;
  useEffect(() => {
    let cancelled = false;
    setQuote(undefined);
    setQuoteError("");
    if (
      !deployment ||
      quoteBlock === undefined ||
      quoteTimestamp === undefined ||
      !open ||
      parsed <= 0n ||
      !inputToken
    ) {
      setQuoting(false);
      return;
    }
    setQuoting(true);
    const timer = setTimeout(async () => {
      try {
        const d = deployment;
        const result = await getClient(d).simulateContract({
          address: d.router,
          abi: routerAbi,
          functionName: "quote",
          args: [
            { ...d.order, traits: BigInt(d.order.traits) },
            parsed,
            takerData({
              tokenIn: inputToken,
              yes: d.yes,
              no: d.no,
              minOutput: 1n,
              deadline: quoteTimestamp + 120,
            }),
          ],
          account: session?.account ?? d.maker,
          blockNumber: quoteBlock,
        });
        if (!cancelled) setQuote(result.result[1]);
      } catch {
        if (!cancelled)
          setQuoteError(
            "No quote for this amount. Try a smaller trade within the supported probability range.",
          );
      } finally {
        if (!cancelled) setQuoting(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    deployment,
    quoteBlock,
    quoteTimestamp,
    open,
    parsed,
    inputToken,
    session,
  ]);

  async function action(
    label: string,
    fn: () => Promise<void>,
    allowUnconfirmed = false,
  ) {
    if (actionLock.current) return;
    if (
      !allowUnconfirmed &&
      history.current?.transactions.some(
        (tx) => tx.state === "unknown" || tx.state === "pending",
      )
    ) {
      setError(
        "Check the unconfirmed receipt before starting another transaction.",
      );
      return;
    }
    actionLock.current = true;
    setBusy(label);
    setError("");
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(errorText(e));
    } finally {
      actionLock.current = false;
      setBusy("");
    }
  }
  async function send(
    label: string,
    address: Address,
    abi: Abi,
    functionName: string,
    args: readonly unknown[] = [],
  ) {
    if (!deployment || !session) throw new Error("Connect a wallet first.");
    const unchanged = () => {
      if (
        current.current.session !== session ||
        current.current.deployment !== deployment
      )
        throw new Error(
          "Wallet or position changed. Review the current selection and try again.",
        );
    };
    unchanged();
    const p = getClient(deployment);
    if ((await p.getChainId()) !== deployment.chainId)
      throw new Error("Network changed. Connect again.");
    if ((await session.wallet.getChainId()) !== deployment.chainId)
      throw new Error("Wallet network changed. Connect again.");
    if (!localAvailable(deployment)) {
      const [account] = await session.wallet.getAddresses();
      if (account?.toLowerCase() !== session.account.toLowerCase())
        throw new Error("Wallet account changed. Connect again.");
    }
    const { request } = await p.simulateContract({
      address,
      abi,
      functionName,
      args,
      account: session.account,
    });
    unchanged();
    let hash = await session.wallet.writeContract(request);
    let replacementReason: Transaction["replacement"];
    setTransactions((t) => [
      { label, hash, account: session.account, state: "pending" },
      ...t,
    ]);
    let receipt;
    try {
      receipt = await p.waitForTransactionReceipt({
        hash,
        timeout: 60_000,
        onReplaced: (replacement) => {
          const oldHash = hash;
          hash = replacement.transaction.hash;
          replacementReason = replacement.reason;
          setTransactions((t) =>
            t.map((tx) =>
              tx.hash === oldHash
                ? {
                    ...tx,
                    hash,
                    replacement: replacement.reason,
                  }
                : tx,
            ),
          );
        },
      });
    } catch {
      setTransactions((t) =>
        t.map((tx) => (tx.hash === hash ? { ...tx, state: "unknown" } : tx)),
      );
      throw new Error(
        "Transaction submitted, but confirmation is unavailable. It may have completed. Use Check receipt in the journal before sending another transaction.",
      );
    }
    setTransactions((t) =>
      t.map((tx) =>
        tx.hash === hash
          ? {
              ...tx,
              state: receiptState(tx, receipt.status),
              gas: receipt.gasUsed.toString(),
              block: receipt.blockNumber.toString(),
            }
          : tx,
      ),
    );
    if (receipt.status !== "success") throw new Error("Transaction reverted.");
    if (replacementReason === "cancelled" || replacementReason === "replaced")
      throw new Error(
        "The wallet cancelled or replaced this transaction. The original action was not completed; review its receipt before trying again.",
      );
    return receipt;
  }
  const recheck = (hash: Hash) =>
    action(
      "Checking receipt",
      async () => {
        if (!deployment) return;
        let receipt;
        try {
          receipt = await getClient(deployment).getTransactionReceipt({ hash });
        } catch {
          throw new Error(
            "Confirmation is still unavailable. The transaction is not known to have failed; check this same hash again later.",
          );
        }
        setTransactions((t) =>
          t.map((tx) =>
            tx.hash === hash
              ? {
                  ...tx,
                  state: receiptState(tx, receipt.status),
                  gas: receipt.gasUsed.toString(),
                  block: receipt.blockNumber.toString(),
                }
              : tx,
          ),
        );
      },
      true,
    );
  async function approve(token: Address, spender: Address, quantity: bigint) {
    if (!deployment || !session) return;
    const allowed = await getClient(deployment).readContract({
      address: token,
      abi: tokenAbi,
      functionName: "allowance",
      args: [session.account, spender],
    });
    if (allowed < quantity)
      await send("Approve test tokens", token, tokenAbi, "approve", [
        spender,
        quantity,
      ]);
  }
  const connectWallet = (role: "trader" | "maker" = "trader") =>
    action(
      "Connecting",
      async () => {
        if (deployment) {
          setSession(await connect(deployment, role));
          setError("");
        }
      },
      true,
    );
  const fund = () =>
    action("Preparing test tokens", async () => {
      if (!deployment) return;
      if (!session) return;
      const balance = await getClient(deployment).readContract({
        address: deployment.collateral,
        abi: tokenAbi,
        functionName: "balanceOf",
        args: [session.account],
      });
      if (balance < parseEther("100"))
        await send(
          "Claim 10,000 gUSD",
          deployment.collateral,
          tokenAbi,
          "faucet",
        );
      await approve(
        deployment.collateral,
        deployment.market,
        parseEther("100"),
      );
      await send(
        "Split 100 complete sets",
        deployment.market,
        marketAbi,
        "split",
        [parseEther("100")],
      );
    });
  const swap = () =>
    action(`Swapping ${inputName} for ${outputName}`, async () => {
      if (!deployment || !inputToken || quote === undefined || !state)
        throw new Error(
          "The quote is updating. Wait for the estimate, then try again.",
        );
      const minOutput = (quote * 995n) / 1000n;
      if (minOutput === 0n) throw new Error("Trade amount is too small.");
      await approve(inputToken, deployment.router, parsed);
      const receipt = await send(
        `Swap ${inputName} → ${outputName}`,
        deployment.router,
        routerAbi,
        "swap",
        [
          { ...deployment.order, traits: BigInt(deployment.order.traits) },
          parsed,
          takerData({
            tokenIn: inputToken,
            yes: deployment.yes,
            no: deployment.no,
            minOutput,
            deadline: state.timestamp + 120,
          }),
        ],
      );
      setFreshPurchase(receipt.transactionHash);
    });
  const ship = () =>
    action("Shipping your position", async () => {
      if (!deployment || !session || !state) return;
      const p = getClient(deployment),
        b = await p.getBlock();
      const d = deployment;
      const order = makeOrder({
        maker: session.account,
        yes: d.yes,
        no: d.no,
        market: d.market,
        liquidity: parseEther("250.6628274631"),
        start: Number(b.timestamp),
        expiry: d.expiry,
        timeScaled,
      });
      await approve(d.yes, d.aqua, parseEther("100"));
      await approve(d.no, d.aqua, parseEther("100"));
      await send("Ship 100 YES + 100 NO", d.aqua, aquaAbi, "ship", [
        d.router,
        encodeOrder(order),
        [d.yes, d.no],
        [parseEther("100"), parseEther("100")],
      ]);
      const next = {
        ...d,
        maker: session.account,
        start: Number(b.timestamp),
        timeScaled,
        liquidity: "250662827463100000000",
        order: { ...order, traits: order.traits.toString() },
        orderHash: orderHash(order),
      } as Deployment;
      if (history.current) {
        history.current.positions = [
          ...history.current.positions.filter(
            (p) => p.orderHash !== next.orderHash,
          ),
          positionFrom(next),
        ];
        history.current.selected = next.orderHash;
        setPositions(history.current.positions);
        persistHistory();
      }
      refreshSequence.current++;
      current.current.deployment = next;
      setState(undefined);
      setQuote(undefined);
      setDeployment(next);
      setPage("market");
    });
  const balanceIn = state ? (buyYes ? state.no : state.yes) : 0n;
  const insufficient = !!session && parsed > balanceIn;
  const l = deployment
    ? (Number(deployment.liquidity) / 1e18) *
      (deployment.timeScaled && state
        ? Math.sqrt(
            Math.max(
              0,
              (deployment.expiry - state.timestamp) /
                (deployment.expiry - deployment.start),
            ),
          )
        : 1)
    : 1;
  const z = state ? Number(state.reserveNo - state.reserveYes) / 1e18 / l : 0;
  const probability =
    Number.isFinite(z) && Math.abs(z) <= 3 ? cdf(z) : undefined;
  const status = !state
    ? "Not connected"
    : state.status === 1
      ? "Resolved YES"
      : state.status === 2
        ? "Resolved NO"
        : state.status === 3
          ? "Cancelled"
          : !state.active
            ? "Position docked"
            : open
              ? "Trading open"
              : "Trading closed";
  const wrongNetwork = !!session && session.chainId !== deployment?.chainId;
  const disabled =
    !!busy ||
    wrongNetwork ||
    !!chainError ||
    !state ||
    transactions.some((tx) => tx.state === "unknown");
  const showTrade = !!session && (!state || state.yes > 0n || state.no > 0n);
  const demoStep = !session ? 0 : !showTrade ? 1 : 2;
  const latestTransaction = transactions[0];
  const swapConfirmed =
    latestTransaction?.state === "confirmed" &&
    latestTransaction.label.startsWith("Swap ");
  const cpOut =
    state && parsed > 0n
      ? (parsed * (buyYes ? state.reserveYes : state.reserveNo)) /
        ((buyYes ? state.reserveNo : state.reserveYes) + parsed)
      : undefined;

  return (
    <div className="app-shell">
      <header className="app-navigation">
        <a className="brand" href="#market" onClick={() => setPage("market")}>
          <span className="brand-mark">
            <Waves size={27} />
          </span>
          Gauss<span>VM</span>
        </a>
        <div className="sidebar-body">
          <nav aria-label="Main navigation">
            {[
              ["market", "Swap", Activity],
              ["position", "Liquidity", Layers3],
              ["research", "How it works", BookOpen],
            ].map(([id, label, Icon]) => (
              <button
                key={String(id)}
                className={page === id ? "nav-item active" : "nav-item"}
                onClick={() => setPage(String(id))}
                aria-current={page === id ? "page" : undefined}
              >
                <Icon size={19} />
                {String(label)}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main id="main-content">
        <header className="topbar">
          <div className="network">
            <span className={state ? "dot live" : "dot"} />
            {deployment?.network ?? "Research preview"}
            <span className="test-label">TEST ASSETS ONLY</span>
          </div>
          <div className="wallet-actions">
            {session ? (
              <>
                <span className="account">
                  <Wallet size={15} />
                  {short(session.account)}
                </span>
                <button
                  className="icon-button"
                  title="Disconnect wallet"
                  aria-label="Disconnect wallet"
                  disabled={!!busy}
                  onClick={() => setSession(undefined)}
                >
                  <LogOut size={17} />
                </button>
              </>
            ) : page !== "market" ? (
              <button
                className="button compact"
                onClick={() => void connectWallet()}
                disabled={!deployment || !!busy || !!chainError}
              >
                <Wallet size={17} />
                {deployment && localAvailable(deployment)
                  ? "Connect demo wallet"
                  : "Connect wallet"}
              </button>
            ) : null}
          </div>
        </header>
        <div
          className={`workspace ${page === "market" ? "market-workspace" : ""}`}
        >
          {!loading && !deployment && (
            <div className="notice">
              <FlaskConical size={20} />
              <div>
                <strong>Explore the curve, then run it locally.</strong>
                <p>
                  No chain deployment is configured. Run{" "}
                  <code>npm run dev</code> from the project to enable real
                  test-token swaps. This preview never fabricates trades.
                </p>
              </div>
            </div>
          )}
          {chainError && (
            <div className="notice error" role="alert">
              <XCircle size={20} />
              <div>
                <strong>Chain connection needs attention</strong>
                <p>{chainError}</p>
                <button className="text-button" onClick={() => void refresh()}>
                  Retry connection
                </button>
              </div>
            </div>
          )}
          {error && (
            <div className="notice error" role="alert">
              <CircleHelp size={20} />
              <p>{error}</p>
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                ×
              </button>
            </div>
          )}
          {storageWarning && (
            <div className="notice" role="status">
              <CircleHelp size={20} />
              <p>{storageWarning}</p>
            </div>
          )}
          {wrongNetwork && (
            <div className="notice" role="status">
              <Wallet size={20} />
              <div>
                <p>
                  Your wallet is on another network. Switch to{" "}
                  {deployment?.network} to continue.
                </p>
                {page !== "market" && (
                  <button
                    className="text-button"
                    disabled={!!busy}
                    onClick={() => void connectWallet()}
                  >
                    Switch to {deployment?.network}
                  </button>
                )}
              </div>
            </div>
          )}

          {page === "market" && (
            <div className="swap-workspace">
              <div className="page-heading">
                <h1>Swap outcomes</h1>
              </div>
              <section
                id="trade-panel"
                tabIndex={-1}
                className="trade-panel surface"
                aria-labelledby="trade-heading"
              >
                <header className="market-heading">
                  <h2 id="trade-heading">
                    {state?.question ?? MARKET_QUESTION}
                  </h2>
                  <div className="market-status">
                    <span className={open ? "dot live" : "dot"} />
                    <span>{status}</span>
                    {state && probability !== undefined && (
                      <span>{(probability * 100).toFixed(1)}% implied YES</span>
                    )}
                  </div>
                  <p>
                    Manual resolution: the resolver chooses the outcome after
                    expiry.
                  </p>
                  <details className="market-rules">
                    <summary>What counts as a win?</summary>
                    <p>{MARKET_RULES}</p>
                    <p>
                      This project means GaussVM. The displayed probability
                      comes from this test market’s pricing, not an assessment
                      by ETHGlobal.
                    </p>
                  </details>
                </header>
                <ol className="demo-steps" aria-label="Swap progress">
                  {["Connect", "Get tokens", "Swap"].map((label, index) => (
                    <li
                      key={label}
                      aria-current={demoStep === index ? "step" : undefined}
                      className={demoStep > index ? "done" : ""}
                    >
                      <span>
                        {demoStep > index ? <Check size={14} /> : index + 1}
                      </span>
                      {label}
                    </li>
                  ))}
                </ol>
                {!session && (
                  <p className="step-help">
                    {deployment && localAvailable(deployment)
                      ? "Use the demo wallet. No extension or real funds needed."
                      : "Connect a Sepolia wallet with faucet ETH to begin."}
                  </p>
                )}
                {session && !showTrade && (
                  <p className="step-help">
                    Get 100 YES and 100 NO test tokens to try either side.
                  </p>
                )}
                {showTrade && (
                  <>
                    <div
                      className="segmented"
                      data-outcome={buyYes ? "yes" : "no"}
                      aria-label="Swap direction"
                    >
                      <button
                        aria-pressed={buyYes}
                        className={buyYes ? "selected" : ""}
                        onClick={() => setBuyYes(true)}
                      >
                        Get YES
                      </button>
                      <button
                        aria-pressed={!buyYes}
                        className={!buyYes ? "selected" : ""}
                        onClick={() => setBuyYes(false)}
                      >
                        Get NO
                      </button>
                    </div>
                    <label className="amount-box">
                      <span>
                        You pay{" "}
                        <small>Balance: {session ? fmt(balanceIn) : "—"}</small>
                      </span>
                      <div>
                        <input
                          aria-label="Amount to swap"
                          inputMode="decimal"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          autoComplete="off"
                        />
                        <strong
                          className={
                            inputName === "YES" ? "token yes" : "token no"
                          }
                        >
                          {inputName}
                        </strong>
                      </div>
                    </label>
                    <div className="amount-box receive">
                      <span>
                        You receive <small>Estimated</small>
                      </span>
                      <div>
                        <output data-testid="quote">
                          {quoting ? (
                            <LoaderCircle className="spin" size={24} />
                          ) : (
                            fmt(quote, 6)
                          )}
                        </output>
                        <strong
                          className={
                            outputName === "YES" ? "token yes" : "token no"
                          }
                        >
                          {outputName}
                        </strong>
                      </div>
                    </div>
                    <dl className="quote-details">
                      <div>
                        <dt>Slippage protection</dt>
                        <dd>0.5%</dd>
                      </div>
                      <div>
                        <dt>Minimum received</dt>
                        <dd>
                          {fmt(
                            quote === undefined
                              ? undefined
                              : (quote * 995n) / 1000n,
                            4,
                          )}{" "}
                          {outputName}
                        </dd>
                      </div>
                    </dl>
                    {quoteError && (
                      <p className="field-error" role="status">
                        {quoteError}
                      </p>
                    )}
                    {parsed <= 0n && (
                      <p className="field-error" role="status">
                        Enter an amount greater than zero, with up to 18 decimal
                        places.
                      </p>
                    )}
                    {session && insufficient && (
                      <p className="field-error">
                        Your {inputName} balance is too low. Enter a smaller
                        amount or get more test tokens below.
                      </p>
                    )}
                  </>
                )}
                {wrongNetwork ? (
                  <button
                    className="button primary full"
                    disabled={!!busy}
                    onClick={() => void connectWallet()}
                  >
                    {busy || `Switch to ${deployment?.network}`}{" "}
                    <ArrowRight size={18} />
                  </button>
                ) : !session ? (
                  <button
                    className="button primary full"
                    disabled={!deployment || !!busy || !!chainError}
                    onClick={() => void connectWallet()}
                  >
                    Connect to swap <ArrowRight size={18} />
                  </button>
                ) : !showTrade ? (
                  <button
                    className="button primary full"
                    disabled={disabled || !open}
                    onClick={() => void fund()}
                  >
                    {busy ? (
                      <>
                        <LoaderCircle size={17} className="spin" />
                        {busy}
                      </>
                    ) : (
                      <>
                        Get 100 YES + 100 NO <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    className="button primary full"
                    disabled={
                      disabled ||
                      !open ||
                      !quote ||
                      parsed <= 0n ||
                      insufficient ||
                      quoting
                    }
                    onClick={() => void swap()}
                  >
                    {busy ? (
                      <>
                        <LoaderCircle size={17} className="spin" />
                        {busy}
                      </>
                    ) : (
                      <>
                        Swap {inputName} for {outputName}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                )}
                <p className="trade-disclaimer">
                  Test tokens have no monetary value. Approval and swap are
                  separate transactions.
                </p>
                {swapConfirmed && (
                  <PurchaseFeedback
                    key={latestTransaction.hash}
                    side={
                      latestTransaction.label.endsWith("YES") ? "YES" : "NO"
                    }
                    animate={freshPurchase === latestTransaction.hash}
                  />
                )}
                {transactions.some((tx) => tx.state === "unknown") && (
                  <p className="field-error">
                    Confirmation is unavailable.{" "}
                    <a href="#transactions">Check your receipt</a> before making
                    another transaction.
                  </p>
                )}
                <details className="wallet-details">
                  <summary>Your balances &amp; test tokens</summary>
                  <div className="wallet-balances">
                    <span>Your test wallet</span>
                    <strong>
                      {session ? fmt(state?.collateral) : "—"}{" "}
                      <small>gUSD</small>
                    </strong>
                    <div>
                      <span>{session ? fmt(state?.yes) : "—"} YES</span>
                      <span>{session ? fmt(state?.no) : "—"} NO</span>
                    </div>
                  </div>
                  <button
                    className="button full"
                    onClick={() => void fund()}
                    disabled={disabled || !session || !open}
                  >
                    Get more test tokens <span aria-hidden="true">+</span>
                  </button>
                  <p className="small-help">
                    Claims faucet gUSD and splits 100 into 100 YES + 100 NO. No
                    purchase required.
                  </p>
                </details>
              </section>
            </div>
          )}

          {page === "position" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Liquidity stays with you.</h1>
                  <p>
                    Liquidity positions for this market’s YES/NO pair. Inspect,
                    ship or close them through Aqua.
                  </p>
                </div>
                <Layers3 size={34} />
              </div>
              <section className="reserve-strip" aria-label="Position reserves">
                <div>
                  <span>YES allocation</span>
                  <strong>
                    {fmt(state?.reserveYes)} <small>YES</small>
                  </strong>
                </div>
                <div>
                  <span>NO allocation</span>
                  <strong>
                    {fmt(state?.reserveNo)} <small>NO</small>
                  </strong>
                </div>
                <div>
                  <span>Pricing instruction</span>
                  <strong>
                    {deployment?.timeScaled ? "Time-scaled" : "Static"}{" "}
                    <small>pm-AMM</small>
                  </strong>
                </div>
              </section>
              <div className="position-grid">
                <section className="surface detail-panel">
                  <h2>Active strategy</h2>
                  {positions.length > 1 && deployment && (
                    <label className="position-select">
                      Trading position
                      <select
                        value={deployment.orderHash}
                        disabled={disabled}
                        onChange={(e) => selectPosition(e.target.value as Hash)}
                      >
                        {positions.map((p, index) => (
                          <option key={p.orderHash} value={p.orderHash}>
                            {index === 0 ? "Seed" : "Saved"} ·{" "}
                            {p.timeScaled ? "Time-scaled" : "Static"} ·{" "}
                            {short(p.maker)} · {short(p.orderHash)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <dl className="address-list">
                    {[
                      ["Maker", deployment?.maker],
                      ["Aqua", deployment?.aqua],
                      ["SwapVM router", deployment?.router],
                      ["Market", deployment?.market],
                      ["Resolver", deployment?.resolver],
                      ["Strategy hash", deployment?.orderHash],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value ?? "No deployment"}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="facts">
                    <span>Expiry</span>
                    <strong>
                      {deployment
                        ? new Date(deployment.expiry * 1000).toLocaleString()
                        : "—"}
                    </strong>
                  </div>
                  <p>
                    Closing a position disables its Aqua allocation. The maker’s
                    tokens remain in their wallet. A shipped strategy is
                    immutable; a new start time creates a new strategy.
                  </p>
                  <button
                    className="button"
                    disabled={
                      disabled ||
                      !session ||
                      session.account.toLowerCase() !==
                        deployment?.maker.toLowerCase() ||
                      !state?.active
                    }
                    onClick={() =>
                      void action("Closing position", async () => {
                        if (deployment)
                          await send(
                            "Dock position",
                            deployment.aqua,
                            aquaAbi,
                            "dock",
                            [
                              deployment.router,
                              deployment.orderHash,
                              [deployment.yes, deployment.no],
                            ],
                          );
                      })
                    }
                  >
                    Close active position
                  </button>
                  {deployment &&
                    localAvailable(deployment) &&
                    session?.account.toLowerCase() !==
                      deployment.maker.toLowerCase() && (
                      <button
                        className="text-button"
                        disabled={!!busy}
                        onClick={() => void connectWallet("maker")}
                      >
                        Use the local maker wallet
                      </button>
                    )}
                </section>
                <section className="surface detail-panel">
                  <h2>Ship your own position</h2>
                  <p>
                    Allocate 100 YES and 100 NO from your connected wallet. This
                    becomes the displayed trading position.
                  </p>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={timeScaled}
                      onChange={(e) => setTimeScaled(e.target.checked)}
                    />
                    Use experimental time scaling
                  </label>
                  <p className="small-help">
                    Time scaling reduces the active curve scale as expiry
                    approaches. It retains inactive complete sets and does not
                    promise the paper’s total-portfolio LVR result.
                  </p>
                  <div className="position-amount">
                    <span>Position allocation</span>
                    <strong>
                      100 YES <span>+</span> 100 NO
                    </strong>
                  </div>
                  <button
                    className="button primary full"
                    disabled={
                      disabled ||
                      !session ||
                      state?.status !== 0 ||
                      !deployment ||
                      !state ||
                      state.timestamp + 60 >= deployment.expiry ||
                      state.yes < parseEther("100") ||
                      state.no < parseEther("100")
                    }
                    onClick={() => void ship()}
                  >
                    Approve & ship position <ArrowRight size={17} />
                  </button>
                  <button
                    className="text-button"
                    onClick={() => setPage("market")}
                  >
                    Get test tokens on the Swap screen
                  </button>
                </section>
              </div>
              <section className="surface detail-panel resolution">
                <h2>Complete the market lifecycle</h2>
                <p>
                  One gUSD backs a YES + NO pair. Merge pairs for collateral at
                  any time. After expiry, only the named resolver can select YES
                  or NO for one day; if they do not, anyone can cancel and each
                  side pays half.
                </p>
                <div className="button-row">
                  <button
                    className="button"
                    disabled={
                      disabled ||
                      !session ||
                      !state ||
                      state.yes < parseEther("10") ||
                      state.no < parseEther("10")
                    }
                    onClick={() =>
                      void action("Merging pairs", async () => {
                        if (deployment)
                          await send(
                            "Merge 10 pairs",
                            deployment.market,
                            marketAbi,
                            "merge",
                            [parseEther("10")],
                          );
                      })
                    }
                  >
                    Merge 10 pairs
                  </button>
                  {[true, false].map((outcome) => (
                    <button
                      key={String(outcome)}
                      className="button"
                      disabled={
                        disabled ||
                        !session ||
                        session.account.toLowerCase() !==
                          deployment?.resolver.toLowerCase() ||
                        !state ||
                        state.status !== 0 ||
                        !deployment ||
                        state.timestamp < deployment.expiry ||
                        state.timestamp >= deployment.expiry + 86400
                      }
                      onClick={() =>
                        void action("Resolving market", async () => {
                          if (deployment)
                            await send(
                              `Resolve ${outcome ? "YES" : "NO"}`,
                              deployment.market,
                              marketAbi,
                              "resolve",
                              [outcome],
                            );
                        })
                      }
                    >
                      Resolve {outcome ? "YES" : "NO"}
                    </button>
                  ))}
                  <button
                    className="button"
                    disabled={
                      disabled ||
                      !session ||
                      !state ||
                      !deployment ||
                      state.status !== 0 ||
                      state.timestamp < deployment.expiry + 86400
                    }
                    onClick={() =>
                      void action("Cancelling market", async () => {
                        if (deployment)
                          await send(
                            "Cancel unresolved market",
                            deployment.market,
                            marketAbi,
                            "cancelUnresolved",
                          );
                      })
                    }
                  >
                    Cancel after timeout
                  </button>
                  <button
                    className="button primary"
                    disabled={
                      disabled ||
                      !session ||
                      !state ||
                      state.status === 0 ||
                      (state.yes === 0n && state.no === 0n)
                    }
                    onClick={() =>
                      void action("Redeeming outcomes", async () => {
                        if (deployment && state)
                          await send(
                            "Redeem outcomes",
                            deployment.market,
                            marketAbi,
                            "redeem",
                            [state.yes, state.no],
                          );
                      })
                    }
                  >
                    Redeem all outcomes
                  </button>
                </div>
                {deployment && localAvailable(deployment) && (
                  <div className="local-controls">
                    <span>Local demo clock</span>
                    <button
                      className="text-button"
                      disabled={
                        disabled ||
                        !state ||
                        state.timestamp >= deployment.expiry
                      }
                      onClick={() =>
                        void action("Advancing local clock", async () => {
                          const p = getClient(deployment);
                          await p.request({
                            method: "evm_setNextBlockTimestamp" as never,
                            params: [deployment.expiry] as never,
                          });
                          await p.request({
                            method: "evm_mine" as never,
                            params: [] as never,
                          });
                        })
                      }
                    >
                      Advance to expiry
                    </button>
                    <small>
                      Irreversible for this local market. Restart the demo for a
                      fresh market.
                    </small>
                  </div>
                )}
              </section>
            </>
          )}

          {page === "research" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>From a paper to a position.</h1>
                  <p>
                    What GaussVM implements, where it diverges, and what the
                    tests establish.
                  </p>
                </div>
                <BookOpen size={34} />
              </div>
              <article className="research-content">
                <section>
                  <h2>What is an Aqua app?</h2>
                  <p>
                    Aqua is 1inch’s shared liquidity layer. A liquidity provider
                    authorizes a trading strategy while keeping its tokens in
                    their own wallet. An Aqua app supplies the trading rules and
                    uses Aqua to settle transfers when a trade executes.
                  </p>
                  <p>
                    Here, GaussVM is the Aqua app: our SwapVM extension prices
                    this market’s YES/NO swaps with the Gaussian pm-AMM rule.
                    Aqua records the maker’s allocation and transfers the
                    tokens. The separate BinaryMarket contract creates the
                    collateral-backed outcomes and handles manual resolution.
                  </p>
                  <p>
                    For example, buying YES pays NO to the maker and receives
                    YES from the maker. Shipping a liquidity position allocates
                    those tokens without depositing them into Aqua. Maker funds
                    must remain available for the swap to settle.
                  </p>
                  <p>
                    All saved liquidity positions use this one market and the
                    same YES/NO tokens. They are pricing strategies, not
                    additional markets.
                  </p>
                </section>
                <details className="research-curve">
                  <summary>Explore the Gaussian curve</summary>
                  <section className="curve-panel surface">
                    <div className="section-top">
                      <h3>A curve built for outcomes</h3>
                      <span className="subtle-badge">ILLUSTRATIVE</span>
                    </div>
                    <p>More of the curve’s liquidity sits near even odds.</p>
                    <div className="legend">
                      <span>
                        <i className="line-sample" />
                        pm-AMM shape
                      </span>
                      <span>
                        <i className="line-sample dashed" />
                        Constant product
                      </span>
                    </div>
                    <Curve
                      remaining={remaining / 100}
                      probability={probability ?? 0.5}
                    />
                    <div className="slider-row">
                      <label htmlFor="time">Explore time to expiry</label>
                      <output htmlFor="time">{remaining}% remaining</output>
                    </div>
                    <input
                      id="time"
                      type="range"
                      min="5"
                      max="100"
                      value={remaining}
                      onChange={(e) => setRemaining(Number(e.target.value))}
                    />
                    <p className="chart-note">
                      Normalized liquidity shape. This slider illustrates time
                      scaling; it does not change the live position or its
                      quotes.
                    </p>
                  </section>
                  <p>
                    Constant-product comparison for the current {amount}{" "}
                    {inputName} input: {fmt(cpOut, 4)} {outputName}.
                    Illustration only; executable quotes come from SwapVM.
                  </p>
                </details>
                <section>
                  <h2>Outcome tokens need a different model.</h2>
                  <p>
                    A YES token pays one unit of collateral if the event
                    resolves YES; a NO token pays it otherwise. Their behavior
                    near resolution differs from ordinary assets. Paradigm’s
                    pm-AMM models this with Gaussian score dynamics and
                    allocates liquidity accordingly.
                  </p>
                  <a
                    href="https://www.paradigm.xyz/writing/pm-amm"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read Moallemi & Robinson’s original research{" "}
                    <ExternalLink size={15} />
                  </a>
                </section>
                <section className="formula-panel">
                  <h2>The static invariant</h2>
                  <code>
                    z = (y − x) / L<br />
                    (y − x) Φ(z) + L φ(z) − y = 0
                  </code>
                  <p>
                    x and y are complementary outcome reserves. L is the
                    liquidity scale. Φ is the normal CDF; φ is its density.
                    GaussVM numerically solves the invariant for exact-input
                    swaps.
                  </p>
                </section>
                <section>
                  <h2>One instruction. Official settlement.</h2>
                  <ol className="execution-list">
                    <li>
                      <strong>Ship a strategy</strong>
                      <span>
                        The maker approves Aqua and records token allocations.
                        No deposit occurs.
                      </span>
                    </li>
                    <li>
                      <strong>Run the Gaussian instruction</strong>
                      <span>
                        SwapVM executes opcode 0x80, validates the pair and
                        expiry, and computes output.
                      </span>
                    </li>
                    <li>
                      <strong>Settle the trade</strong>
                      <span>
                        Official Aqua pull/push logic transfers tokens and
                        updates the allocation. A Swapped event provides the
                        receipt.
                      </span>
                    </li>
                  </ol>
                </section>
                <section>
                  <h2>Boundaries are part of the implementation.</h2>
                  <ul>
                    <li>
                      Exact input only, in either direction. Exact output
                      reverts.
                    </li>
                    <li>
                      The numerical domain is |z| ≤ 3. Trading stops 60 seconds
                      before expiry.
                    </li>
                    <li>
                      Time scaling preserves the current invariant level and
                      retains inactive complete sets. It is an extension, not a
                      verified implementation of every economic result in the
                      paper.
                    </li>
                    <li>
                      Manual resolution is trusted. The test collateral is
                      faucet-minted and has no monetary value.
                    </li>
                    <li>
                      The code is unaudited. Numerical tests do not prove
                      economic safety, profitability or fitness for real funds.
                    </li>
                  </ul>
                </section>
                <section>
                  <h2>Reproduce the evidence.</h2>
                  <pre>
                    npm ci
                    <br />
                    git submodule update --init --recursive
                    <br />
                    npm run check
                    <br />
                    npm run dev
                    <br />
                    <br /># In a second terminal
                    <br />
                    npm run demo
                  </pre>
                  <p>
                    The demo writes transaction receipts, event logs and
                    before/after balances to <code>reports/demo.json</code>.
                    Local hashes belong to your local chain and will not appear
                    on a public explorer.
                  </p>
                </section>
              </article>
            </>
          )}

          {transactions.length > 0 && (
            <section
              id="transactions"
              className="activity-section"
              tabIndex={-1}
            >
              <div className="section-top">
                <h3>Transaction journal</h3>
                <span>
                  {transactions.filter((t) => t.state === "confirmed").length}{" "}
                  confirmed ·{" "}
                  {storageWarning ? "session only" : "saved in this browser"}
                </span>
              </div>
              <button
                className="text-button"
                onClick={() => {
                  const blob = new Blob(
                    [
                      JSON.stringify(
                        {
                          chainId: seed.current?.chainId,
                          market: seed.current?.market,
                          exportedAt: new Date().toISOString(),
                          transactions,
                        },
                        null,
                        2,
                      ),
                    ],
                    { type: "application/json" },
                  );
                  const url = URL.createObjectURL(blob),
                    link = document.createElement("a");
                  link.href = url;
                  link.download = `gaussvm-receipts-${Date.now()}.json`;
                  link.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
              >
                Download receipts
              </button>
              <div className="journal-list">
                {transactions.map((tx) => (
                  <div key={tx.hash} className="journal-row">
                    {tx.state === "confirmed" ? (
                      <CheckCircle2 size={19} />
                    ) : tx.state === "failed" ||
                      tx.state === "cancelled" ||
                      tx.state === "replaced" ? (
                      <XCircle size={19} />
                    ) : tx.state === "unknown" ? (
                      <CircleHelp size={19} />
                    ) : (
                      <LoaderCircle className="spin" size={19} />
                    )}
                    <div>
                      <strong>{tx.label}</strong>
                      <span>
                        {tx.state === "unknown"
                          ? "Confirmation unavailable"
                          : tx.state}
                        {tx.block
                          ? ` · Block ${tx.block} · ${Number(tx.gas).toLocaleString()} gas`
                          : ""}
                        {` · ${short(tx.account)}`}
                      </span>
                    </div>
                    {tx.state === "unknown" && (
                      <button
                        className="text-button"
                        disabled={!!busy}
                        onClick={() => void recheck(tx.hash)}
                      >
                        Check receipt
                      </button>
                    )}
                    {deployment && txUrl(deployment, tx.hash) ? (
                      <a
                        href={txUrl(deployment, tx.hash)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {short(tx.hash)} <ExternalLink size={13} />
                      </a>
                    ) : (
                      <button
                        className="text-button"
                        title={tx.hash}
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(tx.hash);
                            setCopied(tx.hash);
                            setTimeout(() => setCopied(undefined), 1500);
                          } catch {
                            setError(`Transaction hash: ${tx.hash}`);
                          }
                        }}
                      >
                        {short(tx.hash)}
                        {copied === tx.hash ? (
                          <Check size={13} />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          <footer>
            <span>
              <Waves size={16} />
              GaussVM · ETHOnline 2026
            </span>
            <span>
              Built on 1inch Aqua + SwapVM <span className="footer-dot">·</span>{" "}
              Research demo
            </span>
          </footer>
          <p className="attribution">
            Powered by Aqua — © Degensoft Ltd 2025 · Powered by SwapVM — ©
            Degensoft Ltd 2025
          </p>
        </div>
      </main>
      <div className="sr-only" role="status" aria-live="polite">
        {busy ||
          (transactions[0]?.state === "confirmed"
            ? "Latest transaction confirmed."
            : "")}
      </div>
    </div>
  );
}
