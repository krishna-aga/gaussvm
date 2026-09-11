import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createPublicClient, createWalletClient, http, keccak256, parseEther, zeroAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { loadArtifact } from '../lib/deploy.mjs';
import { migrateRouterSeed } from '../lib/router-migration.mjs';
import { validateDeployment } from '../lib/workspace.mjs';
import { MARKET_QUESTION } from '../lib/market.mjs';

// Explicit, resumable testnet-only rollout. Never deploys a market or new tokens.
assert(process.argv.includes('--execute'), 'Use --execute to authorize Sepolia test transactions. Run npm run check first.');
const manifestPath = 'deployments/sepolia.json', archivePath = 'deployments/archive/sepolia-pre-gas.json';
const progressPath = 'reports/router-optimization.json';
const current = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert(validateDeployment(current) && current.chainId === sepolia.id, 'Valid Sepolia manifest required');
const report = fs.existsSync(progressPath) ? JSON.parse(fs.readFileSync(progressPath, 'utf8')) : {
  startedAt: new Date().toISOString(), chainId: sepolia.id, sourceRouter: current.router, deployment: {}, migration: {},
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
};
if (report.completedAt && report.nextRouter?.toLowerCase() === current.router.toLowerCase()) {
  console.log('Optimized router is already configured. No transactions sent.'); process.exit(0);
}
assert.equal(report.sourceRouter.toLowerCase(), current.router.toLowerCase(), 'Progress belongs to another source router');
assert(process.env.TESTNET_PRIVATE_KEY && process.env.SEPOLIA_RPC_URL, 'Dedicated test wallet and Sepolia RPC required in ignored .env');
const maker = privateKeyToAccount(process.env.TESTNET_PRIVATE_KEY);
assert.equal(maker.address.toLowerCase(), current.maker.toLowerCase(), 'Use the original seed maker');
const p = createPublicClient({ chain: sepolia, transport: http(process.env.SEPOLIA_RPC_URL, { timeout: 30000 }), pollingInterval: 3000 });
const wallet = createWalletClient({ account: maker, chain: sepolia, transport: http(process.env.SEPOLIA_RPC_URL, { timeout: 30000, retryCount: 0 }) });
assert.equal(await p.getChainId(), sepolia.id, 'Sepolia only');
const balance = await p.getBalance({ address: maker.address });
assert(balance >= parseEther('0.01'), 'Needs 0.01 faucet Sepolia ETH as a deployment buffer');
assert.equal(await p.readContract({ address: current.market, abi: loadArtifact('BinaryMarket').abi, functionName: 'question' }), MARKET_QUESTION);
const block = await p.getBlock();
assert(Number(block.timestamp) < current.expiry - 600, 'Market must have more than ten minutes left');
const artifact = loadArtifact('GaussVM'), bytecodeHash = keccak256(artifact.bytecode);
if (report.bytecodeHash) assert.equal(report.bytecodeHash, bytecodeHash, 'Build changed during migration; inspect progress before resuming');
report.bytecodeHash = bytecodeHash;
report.makerBalanceBefore ??= String(balance);
fs.mkdirSync('reports', { recursive: true }); fs.mkdirSync('deployments/archive', { recursive: true });
const save = () => fs.writeFileSync(progressPath, JSON.stringify(report, null, 2));
save();
if (!fs.existsSync(archivePath)) fs.writeFileSync(archivePath, JSON.stringify(current, null, 2), { flag: 'wx' });
else assert.equal(JSON.parse(fs.readFileSync(archivePath, 'utf8')).router, current.router, 'Archive belongs to another source router');
if (!report.deployment.hash) {
  report.deployment.hash = await wallet.deployContract({ ...artifact, args: [current.aqua, zeroAddress, maker.address] });
  save(); console.log(`Submitted optimized router: ${report.deployment.hash}`);
}
const receipt = await p.waitForTransactionReceipt({ hash: report.deployment.hash });
assert.equal(receipt.status, 'success', 'Router deployment must confirm');
assert(receipt.contractAddress, 'Deployment must create a router');
report.nextRouter = receipt.contractAddress;
Object.assign(report.deployment, { label: 'Deploy GaussVM', blockNumber: String(receipt.blockNumber),
  gasUsed: String(receipt.gasUsed), feeWei: String(receipt.gasUsed * receipt.effectiveGasPrice) }); save();
await migrateRouterSeed({ publicClient: p, wallet, maker, current, nextRouter: report.nextRouter, progress: report.migration, save });
const next = { ...current, router: report.nextRouter, previousRouter: current.router,
  routerUpdatedAt: new Date().toISOString(), receipts: [
    ...current.receipts.filter(r => r.label !== 'Deploy GaussVM'), report.deployment, ...Object.values(report.migration.steps),
  ] };
assert(validateDeployment(next), 'Migrated manifest must validate');
report.makerBalanceAfter = String(await p.getBalance({ address: maker.address }));
report.completedAt = new Date().toISOString(); save();
fs.writeFileSync(manifestPath, JSON.stringify(next, null, 2));
console.log(`Optimized router ready: ${next.router}. Market, tokens, expiry and order hash are unchanged.`);
