import fs from 'node:fs';
import { createPublicClient,createWalletClient,http } from 'viem';
import { hardhat,sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { deploySystem } from '../lib/deploy.mjs';

const remote=process.argv.includes('--sepolia');
if(remote && (!process.env.SEPOLIA_RPC_URL || !process.env.TESTNET_PRIVATE_KEY)) {
  throw new Error('Set SEPOLIA_RPC_URL and TESTNET_PRIVATE_KEY in your ignored .env. Use a test-only wallet with faucet ETH.');
}
const rpc=remote?process.env.SEPOLIA_RPC_URL:'http://127.0.0.1:8545';
const chain=remote?sepolia:hardhat;
const publicClient=createPublicClient({chain,transport:http(rpc)});
if(await publicClient.getChainId()!==chain.id) throw new Error('Wrong chain. Only local 31337 and Sepolia 11155111 are allowed.');
const account=remote?privateKeyToAccount(process.env.TESTNET_PRIVATE_KEY):undefined;
const wallet=createWalletClient({chain,transport:http(rpc),account});
const maker=account ?? (await wallet.getAddresses())[0];
if(remote && await publicClient.getBalance({address:maker.address})===0n) throw new Error('The test wallet needs faucet Sepolia ETH before deployment.');
const result=await deploySystem({publicClient,wallet,maker,duration:remote?7*86400:86400});
// Never publish a private RPC URL or private key in the browser manifest.
result.rpcUrl=remote?'https://ethereum-sepolia-rpc.publicnode.com':rpc;
fs.mkdirSync('deployments',{recursive:true}); fs.mkdirSync('web/public',{recursive:true});
const json=JSON.stringify(result,null,2);
fs.writeFileSync(`deployments/${remote?'sepolia':'local'}.json`,json);
fs.writeFileSync('web/public/deployment.json',json);
console.log(`Ready: ${result.network}, strategy ${result.orderHash}`);
