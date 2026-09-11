import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { deploySystem, loadArtifact } from '../lib/deploy.mjs';
import { MARKET_QUESTION } from '../lib/market.mjs';
import { validateDeployment } from '../lib/workspace.mjs';

// Replace the initial demo question, reusing already verified infrastructure.
// This command only sends Sepolia transactions, using the ignored local key.
const manifestPath = 'deployments/sepolia.json';
const archivePath = 'deployments/archive/sepolia-initial.json';
const progressPath = 'reports/market-replacement.json';
const current = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert(validateDeployment(current) && current.chainId === sepolia.id, 'Valid Sepolia manifest required');
if (current.question === MARKET_QUESTION) {
  console.log('The requested market is already configured. No transactions sent.');
  process.exit(0);
}
assert(process.env.TESTNET_PRIVATE_KEY && process.env.SEPOLIA_RPC_URL, 'Set the dedicated test wallet and Sepolia RPC in ignored .env');
const account = privateKeyToAccount(process.env.TESTNET_PRIVATE_KEY);
assert.equal(account.address.toLowerCase(), current.maker.toLowerCase(), 'Only the original test maker may migrate this seed');
const p = createPublicClient({ chain: sepolia, transport: http(process.env.SEPOLIA_RPC_URL, { timeout: 30000 }), pollingInterval: 3000 });
const wallet = createWalletClient({ account, chain: sepolia, transport: http(process.env.SEPOLIA_RPC_URL, { retryCount: 0 }) });
assert.equal(await p.getChainId(), sepolia.id, 'Sepolia only');
assert(await p.getBalance({ address: account.address }) > parseEther('0.01'), 'Needs 0.01 faucet Sepolia ETH as a deployment buffer');
const report = fs.existsSync(progressPath) ? JSON.parse(fs.readFileSync(progressPath, 'utf8')) : {
  startedAt: new Date().toISOString(), previousMarket: current.market, receipts: [], submitted: [],
};
assert.equal(report.previousMarket, current.market, 'Progress belongs to a different source market');
if (!report.manifest && report.submitted.length) throw new Error('An earlier deployment is incomplete. Inspect reports/market-replacement.json and its submitted hashes before deploying again.');
fs.mkdirSync('reports', { recursive: true });
fs.mkdirSync('deployments/archive', { recursive: true });
const save = () => fs.writeFileSync(progressPath, JSON.stringify(report, null, 2));
if (!fs.existsSync(archivePath)) fs.writeFileSync(archivePath, JSON.stringify(current, null, 2));
if (!report.manifest) {
  const next = await deploySystem({ publicClient: p, wallet, maker: account, expiry: current.expiry,
    existingAqua: current.aqua, existingRouter: current.router, existingCollateral: current.collateral,
    onReceipt: receipt => { report.receipts.push(receipt); save(); },
    log: message => { if (message.startsWith('Submitted ')) { report.submitted.push(message); save(); } console.log(message); },
  });
  const infrastructure = current.receipts.filter(r => ['Deploy Aqua', 'Deploy GaussVM', 'Deploy DemoCollateral'].includes(r.label));
  report.manifest = { ...next, rpcUrl: current.rpcUrl, receipts: [...infrastructure, ...next.receipts] };
  save();
}
const next = report.manifest;
assert(validateDeployment(next), 'New manifest must validate');
assert.equal(await p.readContract({ address: next.market, abi: loadArtifact('BinaryMarket').abi, functionName: 'question' }), MARKET_QUESTION);
const aqua = { address: current.aqua, abi: loadArtifact('Aqua').abi };
const [, tokenCount] = await p.readContract({ ...aqua, functionName: 'rawBalances', args: [account.address, current.router, current.orderHash, current.yes] });
if (!report.dockHash && Number(tokenCount) === 2) {
  const { request } = await p.simulateContract({ ...aqua, functionName: 'dock', args: [current.router, current.orderHash, [current.yes, current.no]], account });
  report.dockHash = await wallet.writeContract(request); save();
  console.log(`Submitted dock old seed: ${report.dockHash}`);
}
if (report.dockHash) {
  const receipt = await p.waitForTransactionReceipt({ hash: report.dockHash });
  assert.equal(receipt.status, 'success', 'Old seed retirement must confirm');
  report.dockReceipt = { hash: receipt.transactionHash, block: String(receipt.blockNumber), gas: String(receipt.gasUsed) };
}
const [, afterCount] = await p.readContract({ ...aqua, functionName: 'rawBalances', args: [account.address, current.router, current.orderHash, current.yes] });
assert.notEqual(Number(afterCount), 2, 'Old seed must be inactive');
report.completedAt = new Date().toISOString(); save();
fs.writeFileSync(manifestPath, JSON.stringify(next, null, 2));
// The local development manifest is deliberately left on its own local chain.
console.log(`Single Sepolia market ready: ${next.market}; ${MARKET_QUESTION}`);
