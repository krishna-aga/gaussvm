import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEther, decodeEventLog, encodeAbiParameters } from 'viem';
import { publicClient,wallet,accounts,artifact,read,write,mineAt } from './helpers.mjs';
import { deploySystem } from '../lib/deploy.mjs';
import { takerData,makeOrder,encodeOrder,orderHash } from '../lib/encoding.mjs';

const e=parseEther;
const system=await deploySystem({publicClient,wallet,maker:accounts[0],log:()=>{}});
const c=(name,address)=>({address,abi:artifact(name).abi});
const aqua=c('Aqua',system.aqua), router=c('GaussVM',system.router), market=c('BinaryMarket',system.market);
const yes=c('OutcomeToken',system.yes), no=c('OutcomeToken',system.no), collateral=c('DemoCollateral',system.collateral);
const order={...system.order,traits:BigInt(system.order.traits)}, trader=accounts[1];
const balance=(token,account)=>read(token,'balanceOf',[account]);
const data=(tokenIn,minOutput=1n,extra={})=>takerData({tokenIn,yes:system.yes,no:system.no,minOutput,...extra});
await write(collateral,'faucet',[],trader);
await write(collateral,'approve',[market.address,e('500')],trader);
await write(market,'split',[e('500')],trader);
await write(yes,'approve',[router.address,e('500')],trader);
await write(no,'approve',[router.address,e('500')],trader);

test('Aqua ship leaves LP funds in the maker wallet',async()=>{
  assert.equal(await balance(yes,accounts[0]),e('1000'));
  assert.equal(await balance(no,accounts[0]),e('1000'));
  assert.equal(await balance(yes,aqua.address),0n);
  assert.equal(await balance(no,router.address),0n);
  assert.equal((await read(aqua,'rawBalances',[accounts[0],router.address,system.orderHash,yes.address]))[0],e('1000'));
});

test('both trade directions settle real transfers, match quotes, emit Swapped',async()=>{
  for(const [input,output] of [[no,yes],[yes,no]]) {
    const td=data(input.address), amount=e('10');
    const q=await publicClient.simulateContract({...router,functionName:'quote',args:[order,amount,td],account:trader});
    const [quotedIn,quotedOut]=q.result;
    const beforeIn=await balance(input,trader),beforeOut=await balance(output,trader);
    const makerIn=await balance(input,accounts[0]),makerOut=await balance(output,accounts[0]);
    const receipt=await write(router,'swap',[order,amount,data(input.address,quotedOut)],trader);
    assert.equal(beforeIn-await balance(input,trader),quotedIn);
    assert.equal(await balance(output,trader)-beforeOut,quotedOut);
    assert.equal(await balance(input,accounts[0])-makerIn,quotedIn);
    assert.equal(makerOut-await balance(output,accounts[0]),quotedOut);
    assert.equal(await balance(input,aqua.address),0n);
    assert.equal(await balance(input,router.address),0n);
    assert.equal((await read(aqua,'rawBalances',[accounts[0],router.address,system.orderHash,output.address]))[0],await balance(output,accounts[0]));
    const swap=receipt.logs.map(log=>{try{return decodeEventLog({abi:router.abi,...log});}catch{return null;}}).find(l=>l?.eventName==='Swapped');
    assert.equal(swap.args.amountOut,quotedOut);
    console.log(`Swap gas (${input.address===yes.address?'YES to NO':'NO to YES'}): ${receipt.gasUsed}`);
    assert.ok(receipt.gasUsed<8_000_000n);
  }
});

test('slippage, expired deadlines, unsupported exact output, malformed programs reject atomically',async()=>{
  const before=await balance(no,trader);
  await assert.rejects(write(router,'swap',[order,e('10'),data(no.address,e('100'))],trader));
  await assert.rejects(write(router,'swap',[order,e('10'),data(no.address,1n,{deadline:1})],trader));
  await assert.rejects(write(router,'swap',[order,e('10'),data(no.address,1n,{exactIn:false})],trader));
  const malformed={...order,data:order.data.slice(0,-2)};
  await assert.rejects(write(router,'swap',[malformed,e('10'),data(no.address)],trader));
  assert.equal(await balance(no,trader),before);
});

test('insufficient maker allowance rolls back balances and Aqua allocation',async()=>{
  await write(yes,'approve',[aqua.address,0n]);
  const before=await balance(no,trader);
  const allocation=await read(aqua,'rawBalances',[accounts[0],router.address,system.orderHash,no.address]);
  await assert.rejects(write(router,'swap',[order,e('10'),data(no.address)],trader));
  assert.equal(await balance(no,trader),before);
  assert.deepEqual(await read(aqua,'rawBalances',[accounts[0],router.address,system.orderHash,no.address]),allocation);
  await write(yes,'approve',[aqua.address,e('1000')]);
});

test('outcome mint/burn and early or unauthorized resolution reject',async()=>{
  await assert.rejects(write(yes,'mint',[trader,e('1')],trader));
  await assert.rejects(write(yes,'burn',[accounts[0],e('1')],trader));
  await assert.rejects(write(market,'resolve',[true]));
  await assert.rejects(write(market,'resolve',[true],trader));
  await assert.rejects(write(market,'cancelUnresolved',[],trader));
});

test('complete-set merge returns exactly one collateral per pair',async()=>{
  const before=await balance(collateral,trader);
  await write(market,'merge',[e('5')],trader);
  assert.equal(await balance(collateral,trader)-before,e('5'));
});

test('time scaling changes executable quotes and the expiry cutoff disables swaps',async()=>{
  const dynamic=makeOrder({maker:accounts[0],yes:yes.address,no:no.address,market:market.address,
    liquidity:BigInt(system.liquidity),start:system.start,expiry:system.expiry,timeScaled:true});
  await write(aqua,'ship',[router.address,encodeOrder(dynamic),[yes.address,no.address],[e('800'),e('800')]]);
  const quote=async()=> (await publicClient.simulateContract({...router,functionName:'quote',args:[dynamic,e('10'),data(no.address)],account:trader})).result[1];
  const initial=await quote();
  await mineAt(system.start+Math.floor((system.expiry-system.start)*.75));
  const later=await quote();
  assert.ok(later<initial);
  await write(router,'swap',[dynamic,e('10'),data(no.address,later*99n/100n)],trader);
  await mineAt(system.expiry-60);
  await assert.rejects(write(router,'swap',[order,e('1'),data(no.address)],trader));
  await write(aqua,'dock',[router.address,orderHash(dynamic),[yes.address,no.address]]);
  await assert.rejects(quote());
});

test('resolution and redemption are collateral-backed and cannot pay twice',async()=>{
  await mineAt(system.expiry);
  await assert.rejects(write(market,'resolve',[true],trader));
  await write(market,'resolve',[true]);
  const y=await balance(yes,trader),n=await balance(no,trader),before=await balance(collateral,trader);
  await write(market,'redeem',[y,n],trader);
  assert.equal(await balance(collateral,trader)-before,y);
  await assert.rejects(write(market,'redeem',[y,n],trader));
  await assert.rejects(write(market,'split',[e('1')],trader));
  await assert.rejects(write(market,'resolve',[false]));
  assert.equal(await balance(collateral,market.address),await read(yes,'totalSupply'));
});

test('timeout cancellation lets holders redeem half per side without resolver cooperation',async()=>{
  const b=await publicClient.getBlock();
  const a=artifact('BinaryMarket');
  const hash=await wallet.deployContract({...a,args:[collateral.address,accounts[0],b.timestamp+100n,'Timeout demonstration'],account:accounts[0]});
  const r=await publicClient.waitForTransactionReceipt({hash});
  const m=c('BinaryMarket',r.contractAddress);
  await write(collateral,'approve',[m.address,e('10')],trader);
  await write(m,'split',[e('10')],trader);
  await mineAt(b.timestamp+100n+86400n);
  await write(m,'cancelUnresolved',[],trader);
  const before=await balance(collateral,trader);
  await write(m,'redeem',[e('10'),e('10')],trader);
  assert.equal(await balance(collateral,trader)-before,e('10'));
});
