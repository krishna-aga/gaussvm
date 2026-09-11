import fs from 'node:fs';
import hre from 'hardhat';
import { createPublicClient, createWalletClient, custom } from 'viem';
import { hardhat } from 'viem/chains';

export const transport = custom({ request: args => hre.network.provider.request(args) });
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
  await hre.network.provider.send('evm_setNextBlockTimestamp', [Number(timestamp)]);
  await hre.network.provider.send('evm_mine');
}
