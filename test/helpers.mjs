import fs from 'node:fs';
import { network } from 'hardhat';
import { after } from 'node:test';
import { createPublicClient, createWalletClient, custom } from 'viem';
import { hardhat } from 'viem/chains';

const connection = await network.create();
after(() => connection.close());
// Local deterministic reverts should surface immediately, not be retried as RPC failures.
export const transport = custom({ request: args => connection.provider.request(args) }, { retryCount: 0 });
export const publicClient = createPublicClient({ chain: hardhat, transport });
export const wallet = createWalletClient({ chain: hardhat, transport });
export const accounts = await wallet.getAddresses();
export const artifact = name => JSON.parse(fs.readFileSync(`artifacts/${name}.json`, 'utf8'));
export async function deploy(name, args = [], account = accounts[0]) {
  const a=artifact(name); const hash=await wallet.deployContract({ ...a, args, account });
  const receipt=await publicClient.waitForTransactionReceipt({ hash });
  return { address: receipt.contractAddress, abi: a.abi };
}
export const read = (contract, functionName, args = [], account=accounts[0]) => publicClient.readContract({ ...contract, functionName, args, account });
export async function write(contract, functionName, args = [], account = accounts[0]) {
  const { request }=await publicClient.simulateContract({ ...contract, functionName, args, account });
  const hash=await wallet.writeContract(request);
  const receipt=await publicClient.waitForTransactionReceipt({ hash });
  if(receipt.status !== 'success') throw new Error(`Transaction reverted: ${hash}`);
  return receipt;
}
export async function mineAt(timestamp) {
  await connection.provider.request({method:'evm_setNextBlockTimestamp',params:[Number(timestamp)]});
  await connection.provider.request({method:'evm_mine',params:[]});
}
