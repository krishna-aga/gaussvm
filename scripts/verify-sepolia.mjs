import fs from 'node:fs';
import assert from 'node:assert/strict';
import { loadArtifact } from '../lib/deploy.mjs';
import { validateDeployment } from '../lib/workspace.mjs';

// Free public source verification; no wallet, API key or transaction is used.
const d = JSON.parse(fs.readFileSync('deployments/sepolia.json', 'utf8'));
assert(validateDeployment(d) && d.chainId === 11155111, 'Valid Sepolia deployment required');
const build = JSON.parse(fs.readFileSync('artifacts/build-info.json', 'utf8'));
const api = 'https://sourcify.dev/server';
const report = { chainId: d.chainId, checkedAt: new Date().toISOString(), contracts: [] };
fs.mkdirSync('reports', { recursive: true });
const save = () => fs.writeFileSync('reports/sepolia-verification.json', JSON.stringify(report, null, 2));
async function json(path, options) {
  const response = await fetch(`${api}${path}`, { ...options, signal: AbortSignal.timeout(30000) });
  const body = await response.json();
  if (!response.ok) throw new Error(`Sourcify ${response.status}: ${body.message ?? JSON.stringify(body)}`);
  return body;
}
for (const [key, name, creator] of [
  ['aqua', 'Aqua', 'Aqua'], ['router', 'GaussVM', 'GaussVM'],
  ['collateral', 'DemoCollateral', 'DemoCollateral'], ['market', 'BinaryMarket', 'BinaryMarket'],
  ['yes', 'OutcomeToken', 'BinaryMarket'], ['no', 'OutcomeToken', 'BinaryMarket'],
]) {
  const address = d[key], artifact = loadArtifact(name);
  const entry = { name: key, address, url: `https://repo.sourcify.dev/${d.chainId}/${address}` };
  report.contracts.push(entry); save();
  let existing;
  try { existing = await json(`/v2/contract/${d.chainId}/${address}`); } catch { /* Not yet indexed. */ }
  if (existing?.match === 'exact_match') {
    entry.result = existing; save(); console.log(`${key}: ${existing.match}`); continue;
  }
  const ticket = await json(`/v2/verify/${d.chainId}/${address}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stdJsonInput: build.input, compilerVersion: build.compilerVersion,
      contractIdentifier: `${artifact.source}:${name}`,
      creationTransactionHash: d.receipts.find(r => r.label === `Deploy ${creator}`)?.hash }),
  });
  assert(ticket.verificationId, 'Verification ticket required');
  entry.verificationId = ticket.verificationId; save();
  console.log(`${key}: verification ${ticket.verificationId}`);
  let result;
  for (let i = 0; i < 60; i++) {
    result = await json(`/v2/verify/${ticket.verificationId}`);
    if (result.isJobCompleted) break;
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  entry.result = result; save();
  assert(result?.isJobCompleted && result.contract?.match, `Verification incomplete for ${key}: ${result?.error?.message ?? 'pending'}`);
  console.log(`${key}: ${result.contract.match}`);
}
console.log('All deployed contracts verified. Evidence: reports/sepolia-verification.json');
