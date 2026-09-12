import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createPublicClient, createWalletClient, custom, http, keccak256 } from 'viem';
import { hardhat } from 'viem/chains';
import { deploySystem } from '../lib/deploy.mjs';
import { runTrackDemo } from '../lib/track-demo.mjs';

const fork = process.argv.includes('--fork');
const report = `reports/${fork ? 'aqua-track-fork' : 'aqua-track'}.json`;
fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync(report, JSON.stringify({ status: 'running', startedAt: new Date().toISOString() }));
const git = args => execFileSync('git', args, { encoding: 'utf8' }).trim();
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const inputs = ['contracts/GaussVM.sol', 'contracts/OfficialDependencies.sol', 'contracts/math/Gaussian.sol',
  'contracts/math/PmAmmMath.sol', 'contracts/market/BinaryMarket.sol', 'contracts/market/DemoCollateral.sol',
  'lib/deploy.mjs', 'lib/encoding.mjs', 'lib/market.mjs', 'lib/track-demo.mjs', 'scripts/track-demo.mjs',
  'scripts/fork-demo.mjs', 'scripts/compile.mjs', 'hardhat.config.ts', 'package-lock.json',
  'artifacts/GaussVM.json', 'artifacts/build-info.json'];
const sourceHashes = Object.fromEntries(inputs.map(file => [file, sha(file)]));
const repository = { commit: git(['rev-parse', 'HEAD']), dirty: !!git(['status', '--porcelain']),
  commitCount: Number(git(['rev-list', '--count', 'HEAD'])), submodules: git(['submodule', 'status']) };
const startedAt = new Date().toISOString();
let connection;
try {
  // Upstream contracts must match the committed pins, with no working-tree edits.
  if (repository.submodules.split('\n').some(line => /^[-+U]/.test(line))) throw new Error('Initialize the pinned official submodules before the track demo.');
  for (const path of ['vendor/aqua', 'vendor/swap-vm', 'vendor/solidity-utils']) {
    if (git(['-C', path, 'status', '--porcelain'])) throw new Error(`Official dependency has local edits: ${path}`);
  }
  let transport;
  if (fork) transport = http('http://127.0.0.1:8546', { timeout: 120000, retryCount: 0 });
  else {
    const { network } = await import('hardhat');
    connection = await network.create();
    transport = custom({ request: args => connection.provider.request(args) }, { retryCount: 0 });
  }
  const publicClient = createPublicClient({ chain: hardhat, transport });
  const wallet = createWalletClient({ chain: hardhat, transport });
  if (await publicClient.getChainId() !== 31337) throw new Error('Track demo only supports local chain 31337.');
  const d = fork ? JSON.parse(fs.readFileSync('deployments/fork.json', 'utf8'))
    : await deploySystem({ publicClient, wallet, maker: (await wallet.getAddresses())[0], log: () => {} });
  if (fork && (!d.fork || d.aqua.toLowerCase() !== '0x1111113ccf1426a8e30e2bff5e005d929bf6a90a')) {
    throw new Error('Fork demo requires the canonical Aqua manifest from scripts/fork-demo.mjs.');
  }
  const aquaCodeHash = keccak256(await publicClient.getCode({ address: d.aqua }));
  if (fork && aquaCodeHash !== d.fork.aquaCodeHash) throw new Error('Canonical Aqua bytecode no longer matches the source block.');
  console.log(`\n1inch Build an Aqua App: ${fork ? 'canonical Aqua on an isolated Ethereum fork' : 'isolated local EVM'}`);
  console.log(`Aqua ${d.aqua}\nGaussVM ${d.router}\nAll tokens and resolutions below are local test demonstrations.\n`);
  const evidence = await runTrackDemo({ publicClient, wallet, system: d, advanceTo: async timestamp => {
    await publicClient.request({ method: 'evm_setNextBlockTimestamp', params: [Number(timestamp)] });
    await publicClient.request({ method: 'evm_mine', params: [] });
  } });
  if (inputs.some(file => sourceHashes[file] !== sha(file))) throw new Error('Source or build artifacts changed during the demo. Rerun on a stable tree.');
  Object.assign(evidence, { startedAt, completedAt: new Date().toISOString(), repository,
    sourceHashes, environment: { node: process.version, compiler: JSON.parse(fs.readFileSync('artifacts/build-info.json', 'utf8')).compilerVersion },
    deployedCodeHashes: { aqua: aquaCodeHash, router: keccak256(await publicClient.getCode({ address: d.router })) } });
  fs.writeFileSync(report, JSON.stringify(evidence, (_, value) => typeof value === 'bigint' ? value.toString() : value, 2));
  console.log(`\n${evidence.checks.length} checks passed; ${evidence.swaps.length} real EVM swaps. Evidence: ${report}`);
} catch (error) {
  fs.writeFileSync(report, JSON.stringify({ status: 'failed', startedAt, repository, error: error.shortMessage || error.message }, null, 2));
  throw error;
} finally { await connection?.close(); }
