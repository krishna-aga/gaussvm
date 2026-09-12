import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEther } from 'viem';
import { exampleStart, exampleTrade, exampleAtScore, positionProbability } from '../lib/chart-math.mjs';
import { invariant } from '../lib/reference.mjs';
import { loadMarketHistory, matchesPosition, MAX_TRADE_BLOCKS } from '../lib/market-history.mjs';

const d = { chainId: 31337, router: '0xrouter', maker: '0xmaker', orderHash: '0xorder', yes: '0xyes', no: '0xno', aqua: '0xaqua',
  liquidity: parseEther('2506.628274631').toString(), start: 0, expiry: 10000, timeScaled: false };
const snapshot = { block: 30n, timestamp: 130, reserveYes: parseEther('1000'), reserveNo: parseEther('1000'), active: true, status: 0 };
const log = (blockNumber=10n, side='YES') => ({ address:d.router, blockNumber, blockHash:`block-${blockNumber}`, transactionHash:`tx-${blockNumber}`, logIndex:0,
  args:{orderHash:d.orderHash,maker:d.maker,tokenIn:side==='YES'?d.no:d.yes,tokenOut:side==='YES'?d.yes:d.no,amountIn:parseEther('10'),amountOut:parseEther('9.9')} });

test('implied probability never invents a price for missing, closed or unsupported state', () => {
  assert.equal(positionProbability(d,snapshot),.5);
  for(const state of [undefined,{...snapshot,active:false},{...snapshot,status:1},{...snapshot,timestamp:9990},{...snapshot,reserveYes:0n},
    {...snapshot,reserveNo:parseEther('100000')}]) assert.equal(positionProbability(d,state),undefined);
  const imbalanced={...snapshot,reserveNo:parseEther('1200')};
  assert(positionProbability(d,imbalanced)>.5);
  assert(positionProbability({...d,timeScaled:true},{...imbalanced,timestamp:7500})>positionProbability(d,imbalanced));
});

test('example trades conserve the ideal invariant, move price in the correct direction and animate on the same curve', () => {
  let state=exampleStart();
  const initial=invariant(state.yes,state.no,state.liquidity);
  for(const [side,input] of [['YES',100],['YES',200],['NO',150]]) {
    const before=exampleAtScore((state.no-state.yes)/state.liquidity);
    const next=exampleTrade(state,side,input);
    assert(side==='YES'?next.probability>before.probability:next.probability<before.probability);
    assert(Math.abs(invariant(next.yes,next.no,next.liquidity)-initial)<1e-8);
    const a=(state.no-state.yes)/state.liquidity, b=(next.no-next.yes)/next.liquidity;
    for(let i=0;i<=10;i++) {
      const frame=exampleAtScore(a+(b-a)*i/10,state.liquidity);
      assert(Math.abs(invariant(frame.yes,frame.no,frame.liquidity))<1e-8);
    }
    state=next;
  }
  assert.throws(()=>exampleTrade(state,'YES',NaN));
  assert.throws(()=>exampleTrade(state,'YES',0));
  assert.throws(()=>exampleTrade(state,'YES',1000));
});

test('history filters router, strategy, maker, pair, removed events and invalid amounts', () => {
  assert(matchesPosition(log(),d));
  assert(matchesPosition(log(10n,'NO'),d));
  for(const event of [{...log(),removed:true},{...log(),address:'0xother'},
    ...['orderHash','maker','tokenOut'].map(field=>({...log(),args:{...log().args,[field]:'0xother'}})),
    {...log(),args:{...log().args,amountOut:0n}}]) assert(!matchesPosition(event,d));
});

function fixture(events, failedBlock) {
  const requested=[];
  return {requested,client:{
    getLogs:async args=>{requested.push(args);return events;},
    getBlock:async ({blockNumber})=>({timestamp:100n+blockNumber,hash:`block-${blockNumber}`}),
    readContract:async ({args,blockNumber})=>{
      if(blockNumber===failedBlock)throw new Error('Historical state unavailable');
      return [parseEther(args[3]===d.yes?'1000':String(1000+Number(blockNumber))),2];
    },
  }};
}
test('history samples actual block balances and preserves missing archive reads as gaps', async () => {
  const {client,requested}=fixture([log(20n,'NO'),log(),{...log(12n),args:{...log(12n).args,orderHash:'0xother'}}],10n);
  const history=await loadMarketHistory(client,d,snapshot);
  assert.deepEqual(history.points.map(p=>p.block),['9','10','20']);
  assert.equal(history.points[1].probability,null);
  assert.equal(history.unavailable,1);
  assert(history.points[0].probability>.5);
  assert.equal(history.points[2].probability,positionProbability(d,{...snapshot,timestamp:120,reserveNo:parseEther('1020')}));
  assert.equal(history.trades.length,2);
  assert.equal(history.trades[0].side,'NO');
  assert.equal(requested[0].toBlock,snapshot.block);
});
test('history is bounded and does not manufacture a starting 50 percent price when no trades exist', async () => {
  const empty=await loadMarketHistory(fixture([]).client,d,snapshot);
  assert.deepEqual(empty.points,[]);
  assert.deepEqual(empty.trades,[]);
  const events=Array.from({length:30},(_,i)=>log(BigInt(i+1)));
  const full=await loadMarketHistory(fixture(events).client,d,snapshot);
  assert.equal(full.points.length,MAX_TRADE_BLOCKS+1);
  assert.equal(full.trades.length,6);
  assert.equal(full.limited,true);
});
test('a changed block is not presented as an authenticated trade price', async () => {
  const event={...log(),blockHash:'old-fork'};
  const history=await loadMarketHistory(fixture([event]).client,d,snapshot);
  assert.equal(history.points.at(-1).probability,null);
  assert.equal(history.unavailable,1);
});
