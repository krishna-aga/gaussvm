import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ExternalLink, RefreshCw } from 'lucide-react';
import { formatEther } from 'viem';
import { loadMarketHistory } from '../../lib/market-history.mjs';
import { positionProbability } from '../../lib/chart-math.mjs';
import { getClient, txUrl, type Deployment } from './chain';

export type MarketSnapshot = {
  active: boolean; status: number; timestamp: number; block: bigint;
  reserveYes: bigint; reserveNo: bigint;
};
type Point = { block: string; timestamp: number | null; probability: number | null; hash?: string; kind: string };
type Trade = { hash: string; block: string; logIndex: number; timestamp: number | null; side: string; amountIn: string; amountOut: string };
type History = { points: Point[]; trades: Trade[]; fromBlock: string; toBlock: string; unavailable: number; limited: boolean };
const clock = (t: number) => new Date(t * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const date = (t: number) => new Date(t * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
const amount = (value: string) => Number(formatEther(BigInt(value))).toLocaleString(undefined, { maximumFractionDigits: 4 });

export function MarketChart({ deployment, snapshot, confirmedHash, onExplain }: {
  deployment?: Deployment; snapshot?: MarketSnapshot; confirmedHash?: string; onExplain: () => void;
}) {
  const key = deployment ? [deployment.chainId, deployment.market, deployment.router, deployment.maker, deployment.orderHash].join(':').toLowerCase() : '';
  const [record, setRecord] = useState<{ key: string; history: History }>();
  const [failure, setFailure] = useState<{ key: string; message: string }>();
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [hover, setHover] = useState<number>();
  const latest = useRef({ deployment, snapshot });
  latest.current = { deployment, snapshot };
  const bucket = Math.floor((snapshot?.timestamp ?? 0) / 30);
  // A receipt can arrive before App's post-transaction balance refresh. Rescan
  // when those balances land, even if the timestamp is in the same bucket.
  const reserves = snapshot ? `${snapshot.reserveYes}:${snapshot.reserveNo}:${snapshot.active}:${snapshot.status}` : '';
  useEffect(() => {
    const { deployment: d, snapshot: s } = latest.current;
    if (!d || !s) return;
    let active = true;
    setLoading(true);
    setHover(undefined);
    loadMarketHistory(getClient(d), d, s).then(result => {
      if (!active) return;
      setRecord({ key, history: result as History });
      setFailure(undefined);
    }).catch(() => {
      if (active) setFailure({ key, message: 'Trade history could not be refreshed. The current reading still uses available chain data.' });
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [key, bucket, reserves, confirmedHash, retry]);
  const history = record?.key === key ? record.history : undefined;
  const error = failure?.key === key ? failure.message : undefined;
  const probability = positionProbability(deployment, snapshot);
  const points: Point[] = [...(history?.points ?? [])];
  if (snapshot && probability !== undefined) {
    const existing = points.findIndex(p => p.block === snapshot.block.toString());
    const current = { block: snapshot.block.toString(), timestamp: snapshot.timestamp, probability, kind: 'current' };
    if (existing >= 0) points[existing] = { ...points[existing], ...current };
    else points.push(current);
  }
  const valid = points.filter((p): p is Point & { timestamp: number; probability: number } => p.timestamp !== null && p.probability !== null);
  const values = valid.map(p => p.probability);
  const low = Math.max(0, Math.floor((Math.min(...values, probability ?? .5) - .05) * 20) / 20);
  const high = Math.min(1, Math.max(low + .1, Math.ceil((Math.max(...values, probability ?? .5) + .05) * 20) / 20));
  const start = valid[0]?.timestamp ?? 0;
  const end = valid.at(-1)?.timestamp ?? start;
  const x = (t: number) => end === start ? 316 : 58 + (t - start) / (end - start) * 516;
  const y = (p: number) => 234 - (p - low) / (high - low) * 188;
  let path = '', connected = false;
  for (const point of points) {
    if (point.timestamp === null || point.probability === null) { connected = false; continue; }
    path += `${connected ? ' L' : 'M'}${x(point.timestamp).toFixed(2)},${y(point.probability).toFixed(2)}`;
    connected = true;
  }
  const selected = valid[hover ?? valid.length - 1];
  return (
    <section className="market-chart surface" aria-labelledby="market-chart-title">
      <div className="chart-title-row">
        <h2 id="market-chart-title">YES probability</h2>
        <span className="chart-source">{deployment ? `${deployment.network} · onchain` : 'No deployment'}</span>
      </div>
      <div className="chart-current">
        <strong data-testid="market-probability">{probability === undefined ? '—' : `${(probability * 100).toFixed(1)}%`}</strong>
        <span>{probability === undefined ? 'Current pricing unavailable' : 'Implied by this position’s pricing'}</span>
      </div>
      <p className="chart-context">Will GaussVM win ETHOnline 2026?</p>
      <svg className="market-history-graph" viewBox="0 0 620 280" role="img"
        aria-label={`Onchain YES probability chart. ${valid.length} available block observations. ${probability === undefined ? 'Current pricing unavailable.' : `Current implied YES ${(probability*100).toFixed(1)} percent.`}`}
        onPointerMove={event => {
          if (!valid.length) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const pointer = (event.clientX - rect.left) / rect.width * 620;
          const nearest = valid.reduce((best, point, index) => Math.abs(x(point.timestamp) - pointer) < Math.abs(x(valid[best].timestamp) - pointer) ? index : best, 0);
          setHover(nearest);
        }} onPointerLeave={() => setHover(undefined)}>
        {[low, (low + high) / 2, high].map(p => <g key={p}>
          <line x1="58" x2="574" y1={y(p)} y2={y(p)} className="graph-grid" />
          <text x="45" y={y(p)+5} textAnchor="end">{Number((p*100).toFixed(1))}%</text>
        </g>)}
        {valid.length ? <>
          <path d={path} className="history-line" />
          {valid.map((p, i) => <circle key={p.block} cx={x(p.timestamp)} cy={y(p.probability)} r={i === valid.length-1 ? 5 : 3} className="history-dot" />)}
          {selected && <g>
            <line x1={x(selected.timestamp)} x2={x(selected.timestamp)} y1="35" y2="240" className="graph-crosshair" />
            <circle cx={x(selected.timestamp)} cy={y(selected.probability)} r="7" className="selected-dot" />
          </g>}
          {start === end ? <text x="316" y="266" textAnchor="middle">{clock(start)}</text> : <>
            <text x="58" y="266">{clock(start)}</text><text x="574" y="266" textAnchor="end">{clock(end)}</text>
          </>}
        </> : <text x="316" y="148" textAnchor="middle">{loading ? 'Reading chain history…' : 'No price observations available'}</text>}
      </svg>
      <div className="chart-observation" data-testid="chart-observation">
        {selected ? <><strong>{(selected.probability*100).toFixed(2)}% YES</strong><span>{date(selected.timestamp)} · Block {selected.block}</span></> : <span>A graph appears when chain readings are available.</span>}
      </div>
      {valid.length > 1 && <div className="chart-point-controls" aria-label="Inspect price observations">
        <button className="text-button" disabled={(hover ?? valid.length-1) <= 0} onClick={() => setHover(Math.max(0,(hover ?? valid.length-1)-1))}>Previous point</button>
        <button className="text-button" disabled={hover === undefined || hover >= valid.length-1} onClick={() => setHover(Math.min(valid.length-1,(hover ?? 0)+1))}>Next point</button>
      </div>}
      <p className="chart-note">{valid.length === 1 ? 'One reading so far. ' : ''}Points are actual end-of-block prices, connected as a visual guide. This is test-market pricing, not an ETHGlobal forecast.</p>
      <div className="recent-trades-heading"><h3>Recent trades</h3><button className="icon-button" aria-label="Refresh market history" disabled={loading || !snapshot} onClick={() => setRetry(value => value+1)}><RefreshCw size={16} className={loading ? 'spin' : ''} /></button></div>
      {error && <p className="history-notice" role="status">{error} {history ? 'Earlier history is shown below.' : ''}</p>}
      {!!history?.unavailable && <p className="history-notice">Some historical balances are unavailable. Missing readings leave gaps in the line.</p>}
      {!!history?.trades.length ? <ul className="recent-trades">
        {history.trades.map(trade => <li key={`${trade.hash}:${trade.logIndex}`}>
          <span className={`token ${trade.side === 'YES' ? 'yes' : 'no'}`}>Bought {trade.side}</span>
          <span>{amount(trade.amountIn)} {trade.side === 'YES' ? 'NO' : 'YES'} <span aria-label="for">→</span> {amount(trade.amountOut)} {trade.side}</span>
          {deployment && txUrl(deployment, trade.hash) ? <a href={txUrl(deployment,trade.hash)} target="_blank" rel="noreferrer" aria-label={`View ${trade.side} trade in block ${trade.block}`}>Receipt <ExternalLink size={12} /></a> : <span className="trade-block">Block {trade.block}</span>}
        </li>)}
      </ul> : <p className="empty-trades">{loading ? 'Loading confirmed swaps…' : history ? 'No swaps found for this position in the scanned blocks.' : 'Confirmed swaps appear here when history is available.'}</p>}
      {history && <p className="history-scope">Selected position · Blocks {history.fromBlock}–{history.toBlock}. {history.limited ? 'Showing the latest 24 trade blocks.' : 'Prices sampled at swap blocks.'} Up to 6 recent trades shown.</p>}
      <button className="explain-link" onClick={onExplain}>Watch how a trade moves the price <ArrowRight size={17} /></button>
    </section>
  );
}
