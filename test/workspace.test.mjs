import test from 'node:test';
import assert from 'node:assert/strict';
import { makeOrder,orderHash } from '../lib/encoding.mjs';
import { validateDeployment,workspaceKey,positionFrom,readWorkspace,writeWorkspace,receiptState } from '../lib/workspace.mjs';

const a=n=>`0x${String(n).padStart(40,'0')}`;
const base={schemaVersion:1,chainId:31337,network:'Local EVM',rpcUrl:'http://127.0.0.1:8545',aqua:a(1),router:a(2),market:a(3),collateral:a(4),yes:a(5),no:a(6),maker:a(7),resolver:a(7),start:100,expiry:10000,timeScaled:false,liquidity:'2506628274631000000000'};
function deployment(values={}) {const d={...base,...values};const order=makeOrder(d);return {...d,order:{...order,traits:String(order.traits)},orderHash:orderHash(order)};}
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}};
const seed=deployment();

test('configuration rejects malformed RPC, unsupported chains and mismatched executable orders',()=>{
  assert.equal(validateDeployment(seed),true);
  for(const invalid of [{rpcUrl:'broken'},{chainId:1},{yes:base.no},{maker:a(9)},{orderHash:`0x${'ff'.repeat(32)}`},{liquidity:'0'},{expiry:0}]) assert.equal(validateDeployment({...seed,...invalid}),false);
});

test('selected positions survive reload while tampered strategy data is discarded',()=>{
  const db=storage(),custom=deployment({maker:a(8),start:101,timeScaled:true,liquidity:'250662827463100000000'});
  writeWorkspace(db,workspaceKey(seed),{positions:[positionFrom(custom),{...positionFrom(custom),maker:a(9)}],selected:custom.orderHash,transactions:[]});
  const loaded=readWorkspace(db,seed);
  assert.equal(loaded.selected,custom.orderHash);
  assert.deepEqual(loaded.positions.map(p=>p.orderHash),[seed.orderHash,custom.orderHash]);
  assert.equal(readWorkspace(db,deployment({start:102})).positions.length,1);
});

test('interrupted receipt waits restore as unknown without inventing confirmation',()=>{
  const db=storage(),hash=`0x${'ab'.repeat(32)}`;
  writeWorkspace(db,workspaceKey(seed),{positions:[],selected:seed.orderHash,transactions:[{label:'Swap NO → YES',hash,account:a(8),state:'pending'}]});
  const [tx]=readWorkspace(db,seed).transactions;
  assert.equal(tx.hash,hash);assert.equal(tx.state,'unknown');assert.equal(tx.block,undefined);
});

test('replacement receipts distinguish gas repricing from cancellation or another operation',()=>{
  assert.equal(receiptState({replacement:'repriced'},'success'),'confirmed');
  assert.equal(receiptState({replacement:'cancelled'},'success'),'cancelled');
  assert.equal(receiptState({replacement:'replaced'},'success'),'replaced');
  assert.equal(receiptState({},'reverted'),'failed');
});

test('blocked and corrupted browser storage produce a visible recoverable warning',()=>{
  const blocked={getItem(){throw new Error('blocked')},setItem(){throw new Error('full')}};
  assert.match(readWorkspace(blocked,seed).warning,/unavailable/);
  assert.equal(writeWorkspace(blocked,workspaceKey(seed),{}),false);
  const db=storage();db.setItem(workspaceKey(seed),'{broken');
  assert.match(readWorkspace(db,seed).warning,/unavailable/);
});
