import { parseAbi, parseAbiItem } from 'viem';
import { positionProbability } from './chart-math.mjs';

export const HISTORY_BLOCKS = 7200n;
export const MAX_TRADE_BLOCKS = 24;
const swapped = parseAbiItem('event Swapped(bytes32 orderHash,address maker,address taker,address tokenIn,address tokenOut,uint256 amountIn,uint256 amountOut)');
const balancesAbi = parseAbi(['function rawBalances(address,address,bytes32,address) view returns (uint248 balance,uint8 tokensCount)']);
const same = (a, b) => typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase();

export function matchesPosition(log, d) {
  const a = log.args;
  return !log.removed && same(log.address, d.router) && same(a?.orderHash, d.orderHash) && same(a?.maker, d.maker)
    && ((same(a.tokenIn, d.no) && same(a.tokenOut, d.yes)) || (same(a.tokenIn, d.yes) && same(a.tokenOut, d.no)))
    && typeof a.amountIn === 'bigint' && a.amountIn > 0n && typeof a.amountOut === 'bigint' && a.amountOut > 0n;
}

/** Bounded, read-only history. Prices are sampled from actual end-of-block allocations. */
export async function loadMarketHistory(client, d, snapshot) {
  const toBlock = snapshot.block;
  const fromBlock = toBlock > HISTORY_BLOCKS ? toBlock - HISTORY_BLOCKS : 0n;
  const logs = [];
  for (let start = fromBlock; start <= toBlock; start += 2000n) {
    const end = start + 1999n < toBlock ? start + 1999n : toBlock;
    logs.push(...await client.getLogs({ address: d.router, event: swapped, fromBlock: start, toBlock: end, strict: true }));
  }
  const matching = logs.filter(log => matchesPosition(log, d)).sort((a, b) =>
    a.blockNumber < b.blockNumber ? -1 : a.blockNumber > b.blockNumber ? 1 : a.logIndex - b.logIndex);
  const uniqueBlocks = [...new Set(matching.map(log => log.blockNumber))];
  const blocks = uniqueBlocks.slice(-MAX_TRADE_BLOCKS);
  // A real pre-trade snapshot supplies the starting point, never an invented 50% seed.
  if (blocks.length && blocks[0] > 0n) blocks.unshift(blocks[0] - 1n);
  const points = [];
  let unavailable = 0;
  for (let i = 0; i < blocks.length; i += 3) {
    const batch = await Promise.allSettled(blocks.slice(i, i + 3).map(async blockNumber => {
      const [block, yes, no] = await Promise.all([
        client.getBlock({ blockNumber }),
        client.readContract({ address: d.aqua, abi: balancesAbi, functionName: 'rawBalances', args: [d.maker, d.router, d.orderHash, d.yes], blockNumber }),
        client.readContract({ address: d.aqua, abi: balancesAbi, functionName: 'rawBalances', args: [d.maker, d.router, d.orderHash, d.no], blockNumber }),
      ]);
      const event = matching.find(log => log.blockNumber === blockNumber);
      if (event && block.hash && event.blockHash && block.hash !== event.blockHash) throw new Error('Block changed; reload history.');
      const active = yes[1] > 0 && yes[1] < 255 && no[1] > 0 && no[1] < 255;
      const probability = positionProbability(d, { active, status: 0, timestamp: Number(block.timestamp), reserveYes: yes[0], reserveNo: no[0] });
      return { block: blockNumber.toString(), timestamp: Number(block.timestamp), probability: probability ?? null, hash: event?.transactionHash, kind: event ? 'trade' : 'before' };
    }));
    for (let j = 0; j < batch.length; j++) {
      const result = batch[j];
      if (result.status === 'fulfilled') points.push(result.value);
      else { unavailable++; points.push({ block: blocks[i+j].toString(), timestamp: null, probability: null, kind: 'gap' }); }
    }
  }
  const times = new Map(points.filter(p => p.timestamp !== null).map(p => [p.block, p.timestamp]));
  const trades = matching.slice(-6).reverse().map(log => ({
    hash: log.transactionHash, block: log.blockNumber.toString(), logIndex: log.logIndex,
    timestamp: times.get(log.blockNumber.toString()) ?? null,
    side: same(log.args.tokenOut, d.yes) ? 'YES' : 'NO',
    amountIn: log.args.amountIn.toString(), amountOut: log.args.amountOut.toString(),
  }));
  return { points, trades, fromBlock: fromBlock.toString(), toBlock: toBlock.toString(), unavailable, limited: uniqueBlocks.length > MAX_TRADE_BLOCKS };
}
