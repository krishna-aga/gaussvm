import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { createPublicClient, createWalletClient, http, keccak256 } from 'viem';
import { hardhat, mainnet } from 'viem/chains';
import { deploySystem } from '../lib/deploy.mjs';

// Reads Ethereum only. Every signed transaction is sent to the isolated localhost fork.
const canonicalAqua = '0x1111113ccf1426a8e30e2bff5e005d929bf6a90a';
const sourceUrl = process.env.FORK_RPC_URL || 'https://ethereum-rpc.publicnode.com';
const localUrl = 'http://127.0.0.1:8546';
const source = createPublicClient({chain:mainnet,transport:http(sourceUrl,{timeout:20000})});
const local = createPublicClient({chain:hardhat,transport:http(localUrl,{timeout:1000,retryCount:0})});
const children = [];
function start(file,args=[],stdio='inherit') {
  const child=spawn(process.execPath,[file,...args],{stdio}); children.push(child); return child;
}
async function run(file,args=[]) {
  const child=start(file,args);
  const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});
  if(code!==0) throw new Error(`${file} exited ${code}`);
}
function shutdown() { for(const child of children) if(child.exitCode===null) child.kill(); }
process.on('exit',shutdown);
process.on('SIGINT',()=>{shutdown();process.exit(130);});
process.on('SIGTERM',()=>{shutdown();process.exit(143);});

try {
  let occupied=false;
  try { await local.getChainId(); occupied=true; } catch { /* unused port */ }
  if(occupied) throw new Error('Port 8546 is occupied. Stop that service before starting the isolated fork.');
  if(await source.getChainId()!==1) throw new Error('FORK_RPC_URL must be a read-only Ethereum mainnet RPC.');
  const block=process.env.FORK_BLOCK ? BigInt(process.env.FORK_BLOCK) : await source.getBlockNumber();
  const sourceBlock=await source.getBlock({blockNumber:block});
  console.log(`Forking Ethereum block ${block}; canonical Aqua ${canonicalAqua}. All writes stay on localhost:8546.`);
  const code=await source.getCode({address:canonicalAqua,blockNumber:block});
  if(!code || code==='0x') throw new Error('Canonical Aqua is not deployed at this fork block.');
  await run('scripts/compile.mjs');
  fs.mkdirSync('reports',{recursive:true});
  const log=fs.createWriteStream('reports/fork-chain.log');
  const node=start('node_modules/hardhat/dist/src/cli.js',['node','--hostname','127.0.0.1','--port','8546','--chain-id','31337','--fork',sourceUrl,'--fork-block-number',String(block)],['ignore','pipe','pipe']);
  node.stdout.pipe(log); node.stderr.pipe(log);
  let ready=false;
  for(let i=0;i<120;i++) {
    try { if(await local.getChainId()===31337){ready=true;break;} } catch { /* booting */ }
    if(node.exitCode!==null) throw new Error('Fork startup failed. See reports/fork-chain.log.');
    await new Promise(resolve=>setTimeout(resolve,500));
  }
  if(!ready) throw new Error('Fork startup timed out.');
  const forkClient=createPublicClient({chain:hardhat,transport:http(localUrl,{timeout:120000})});
  const forkCode=await forkClient.getCode({address:canonicalAqua});
  if(forkCode!==code) throw new Error('Forked Aqua bytecode differs from the source block.');
  const wallet=createWalletClient({chain:hardhat,transport:http(localUrl,{timeout:120000,retryCount:0})});
  const maker=(await wallet.getAddresses())[0];
  const result=await deploySystem({publicClient:forkClient,wallet,maker,existingAqua:canonicalAqua});
  result.network='Local Ethereum fork';
  result.rpcUrl=localUrl;
  result.fork={sourceChainId:1,blockNumber:String(block),blockHash:sourceBlock.hash,aqua:canonicalAqua,aquaCodeHash:keccak256(code),aquaCodeBytes:(code.length-2)/2};
  // No remote RPC URL/key is persisted. The regular UI deployment is left intact.
  fs.mkdirSync('deployments',{recursive:true});
  fs.writeFileSync('deployments/fork.json',JSON.stringify(result,null,2));
  await run('scripts/track-demo.mjs',['--fork']);
  console.log(`Canonical Aqua fork verified at Ethereum block ${block}. No public transaction was sent.`);
} catch(error) {
  console.error(error.shortMessage || error.message);
  console.error('Fork evidence was not completed. Check reports/fork-chain.log and retry with a responsive read-only RPC.');
  process.exitCode=1;
} finally { shutdown(); }
