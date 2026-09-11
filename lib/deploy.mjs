import fs from 'node:fs';
import { parseEther, zeroAddress } from 'viem';
import { makeOrder, encodeOrder, orderHash } from './encoding.mjs';
import { MARKET_QUESTION } from './market.mjs';

export const loadArtifact = name => JSON.parse(fs.readFileSync(`artifacts/${name}.json`, 'utf8'));
export async function deploySystem({ publicClient, wallet, maker, resolver=maker, duration=86400, timeScaled=false, existingAqua, existingCollateral, existingRouter, expiry: fixedExpiry, onReceipt=()=>{}, log=console.log }) {
  const receipts=[];
  async function receipt(hash, label) {
    log(`Submitted ${label}: ${hash}`);
    const r=await publicClient.waitForTransactionReceipt({hash});
    if(r.status!=='success') throw new Error(`${label} reverted: ${hash}`);
    receipts.push({label,hash,blockNumber:r.blockNumber.toString(),gasUsed:r.gasUsed.toString()});
    onReceipt(receipts.at(-1));
    log(`${label}: ${hash}`); return r;
  }
  async function deploy(name,args=[]) {
    const a=loadArtifact(name);
    const r=await receipt(await wallet.deployContract({abi:a.abi,bytecode:a.bytecode,args,account:maker}),`Deploy ${name}`);
    return {address:r.contractAddress,abi:a.abi};
  }
  async function write(c,functionName,args=[]) {
    const {request}=await publicClient.simulateContract({...c,functionName,args,account:maker});
    return receipt(await wallet.writeContract(request),functionName);
  }
  for (const address of [existingAqua, existingCollateral, existingRouter].filter(Boolean)) {
    const code=await publicClient.getCode({address});
    if(!code || code==='0x') throw new Error('A supplied infrastructure address has no deployed code.');
  }
  const aqua=existingAqua ? {address:existingAqua,abi:loadArtifact('Aqua').abi} : await deploy('Aqua');
  const collateral=existingCollateral ? {address:existingCollateral,abi:loadArtifact('DemoCollateral').abi} : await deploy('DemoCollateral');
  // Native currency paths are unavailable: WETH is deliberately zero and only outcome pairs are accepted.
  const router=existingRouter ? {address:existingRouter,abi:loadArtifact('GaussVM').abi} : await deploy('GaussVM',[aqua.address,zeroAddress, typeof maker==='string'?maker:maker.address]);
  if ((await publicClient.readContract({...router,functionName:'AQUA'})).toLowerCase() !== aqua.address.toLowerCase()) throw new Error('Router uses a different Aqua contract.');
  const block=await publicClient.getBlock();
  const start=Number(block.timestamp), expiry=fixedExpiry ?? start+duration;
  const market=await deploy('BinaryMarket',[collateral.address,typeof resolver==='string'?resolver:resolver.address,BigInt(expiry),MARKET_QUESTION]);
  const read=(c,functionName,args=[])=>publicClient.readContract({...c,functionName,args});
  const yes=await read(market,'yes'),no=await read(market,'no');
  const tokenAbi=loadArtifact('OutcomeToken').abi;
  await write(collateral,'faucet');
  await write(collateral,'approve',[market.address,parseEther('1000')]);
  await write(market,'split',[parseEther('1000')]);
  await write({address:yes,abi:tokenAbi},'approve',[aqua.address,parseEther('1000')]);
  await write({address:no,abi:tokenAbi},'approve',[aqua.address,parseEther('1000')]);
  const makerAddress=typeof maker==='string'?maker:maker.address;
  const order=makeOrder({maker:makerAddress,yes,no,market:market.address,liquidity:parseEther('2506.628274631'),start,expiry,timeScaled});
  await write(aqua,'ship',[router.address,encodeOrder(order),[yes,no],[parseEther('1000'),parseEther('1000')]]);
  const hash=orderHash(order);
  if((await read(router,'hash',[order])).toLowerCase()!==hash.toLowerCase()) throw new Error('Order encoding differs from SwapVM');
  const chainId=await publicClient.getChainId();
  return {schemaVersion:1,chainId,network:chainId===31337?'Local EVM':'Sepolia',
    deployedAt:new Date().toISOString(),blockNumber:receipts[0].blockNumber,
    aqua:aqua.address,router:router.address,collateral:collateral.address,market:market.address,yes,no,
    maker:makerAddress,resolver:typeof resolver==='string'?resolver:resolver.address,
    question:MARKET_QUESTION,start,expiry,timeScaled,liquidity:'2506628274631000000000',order:{...order,traits:order.traits.toString()},orderHash:hash,
    sources:{swapVM:'afd99c408b4ed610027f4426c6f98650acac9f5f',aqua:'9c5c42e5840e8741fba3597c48456c9510212b66'},receipts};
}
