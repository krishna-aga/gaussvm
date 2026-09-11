import fs from 'node:fs';
import { createPublicClient,createWalletClient,http,parseEther,decodeEventLog } from 'viem';
import { hardhat } from 'viem/chains';
import { loadArtifact } from '../lib/deploy.mjs';
import { takerData } from '../lib/encoding.mjs';

const fork=process.argv.includes('--fork');
const d=JSON.parse(fs.readFileSync(`deployments/${fork?'fork':'local'}.json`,'utf8'));
const rpc=fork?'http://127.0.0.1:8546':'http://127.0.0.1:8545';
const publicClient=createPublicClient({chain:hardhat,transport:http(rpc,{timeout:fork?120000:10000})});
if(await publicClient.getChainId()!==31337) throw new Error('Demo only supports local chain 31337.');
const wallet=createWalletClient({chain:hardhat,transport:http(rpc,{timeout:fork?120000:10000,retryCount:0})});
const account=(await wallet.getAddresses())[1];
const c=(name,address)=>({address,abi:loadArtifact(name).abi});
const collateral=c('DemoCollateral',d.collateral),market=c('BinaryMarket',d.market),yes=c('OutcomeToken',d.yes),no=c('OutcomeToken',d.no),router=c('GaussVM',d.router);
const evidence={chainId:31337,description:fork?'Local fork transactions using the canonical Aqua deployment; not public-chain transactions':'Fresh local EVM transactions; not public explorer transactions',aqua:d.aqua,fork:d.fork,strategy:d.orderHash,transactions:[]};
async function write(contract,functionName,args=[]) {
  const {request}=await publicClient.simulateContract({...contract,functionName,args,account});
  const hash=await wallet.writeContract(request); const r=await publicClient.waitForTransactionReceipt({hash});
  if(r.status!=='success') throw new Error(`Reverted ${hash}`);
  evidence.transactions.push({action:functionName,hash,blockNumber:r.blockNumber.toString(),gasUsed:r.gasUsed.toString(),
    logs:r.logs.map(log=>({address:log.address,topics:log.topics,data:log.data}))});
  return r;
}
const balance=contract=>publicClient.readContract({...contract,functionName:'balanceOf',args:[account]});
await write(collateral,'faucet'); await write(collateral,'approve',[d.market,parseEther('100')]);
await write(market,'split',[parseEther('100')]); await write(no,'approve',[d.router,parseEther('10')]);
const order={...d.order,traits:BigInt(d.order.traits)};
const td=takerData({tokenIn:d.no,yes:d.yes,no:d.no,minOutput:1n});
const quote=await publicClient.simulateContract({...router,functionName:'quote',args:[order,parseEther('10'),td],account});
const output=quote.result[1];
const before={yes:await balance(yes),no:await balance(no)};
const receipt=await write(router,'swap',[order,parseEther('10'),takerData({tokenIn:d.no,yes:d.yes,no:d.no,minOutput:output})]);
const after={yes:await balance(yes),no:await balance(no)};
if(after.yes-before.yes!==output || before.no-after.no!==parseEther('10')) throw new Error('Balance delta mismatch');
evidence.swap={quote:output,before,after};
evidence.swapped=receipt.logs.map(l=>{try{return decodeEventLog({abi:router.abi,...l});}catch{return null;}}).find(l=>l?.eventName==='Swapped');
fs.mkdirSync('reports',{recursive:true});
const report=`reports/${fork?'fork-demo':'demo'}.json`;
fs.writeFileSync(report,JSON.stringify(evidence,(_,v)=>typeof v==='bigint'?v.toString():v,2));
console.log(`Verified swap ${receipt.transactionHash}: 10 NO -> ${Number(output)/1e18} YES; ${receipt.gasUsed} gas. Evidence: ${report}`);
