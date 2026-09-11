import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { encodeFunctionData } from 'viem';
import { deploy, publicClient } from '../helpers.mjs';

const baseline = await deploy('BaselineMathHarness');
const optimized = await deploy('MathHarness');
const WAD = 10n ** 18n, MAX = 10n ** 28n, UMAX = (1n << 256n) - 1n;
let seed = 0x6761757373766dn;
const random = max => {
  seed ^= seed << 13n; seed ^= seed >> 7n; seed ^= seed << 17n;
  seed = BigInt.asUintN(64, seed);
  return seed % max;
};
const counts = { successes: 0, reverts: 0, functions: {} };
async function outcome(contract, data) {
  try {
    const result = await publicClient.call({ to: contract.address, data });
    return { success: result.data };
  } catch (error) {
    for (let cause = error; cause; cause = cause.cause) {
      if (typeof cause.data === 'string' && cause.data.startsWith('0x')) return { revert: cause.data };
    }
    throw error; // RPC or infrastructure failure is never treated as a matching revert.
  }
}
async function compare(functionName, args) {
  const data = encodeFunctionData({ abi: baseline.abi, functionName, args });
  const expected = await outcome(baseline, data), actual = await outcome(optimized, data);
  assert.deepEqual(actual, expected, `${functionName}(${args.join(',')})`);
  counts[expected.revert ? 'reverts' : 'successes']++;
  counts.functions[functionName] = (counts.functions[functionName] ?? 0) + 1;
}

test('Gaussian functions return byte-identical values and revert data across the domain and its boundaries', async () => {
  const values = [-3n * WAD - 1n, -3n * WAD, -1n, 0n, 1n, 3n * WAD, 3n * WAD + 1n,
    -(1n << 255n), (1n << 255n) - 1n];
  for (let i = -100; i <= 100; i++) values.push(BigInt(i) * 3n * WAD / 100n);
  for (let i = 0; i < 200; i++) values.push(random(6n * WAD + 1n) - 3n * WAD);
  for (const z of values) for (const fn of ['cdf', 'pdf']) await compare(fn, [z]);
});

test('invariant and quote match the frozen implementation exactly, including invalid input precedence', async () => {
  for (const l of [WAD, WAD + 1n, 10n ** 21n, 10n ** 24n, 10n ** 27n]) {
    for (const z of [-3n * WAD, -3n * WAD + 1n, -WAD, 0n, WAD, 3n * WAD - 1n, 3n * WAD]) {
      const x = 4n * l, y = x + z * l / WAD;
      await compare('invariant', [x, y, l]);
      for (const input of [1n, l / 1000n, l / 10n]) await compare('quote', [x, y, l, input]);
    }
  }
  // Seeded broad samples include integer rounding residues, imbalanced reserves,
  // both input directions, near-domain roots and quotes too small to execute.
  for (let i = 0; i < 128; i++) {
    const l = WAD + random(10n ** 18n) * 10n ** BigInt(i % 10);
    const x = 4n * l + random(l), y = x + random(6n * l + 1n) - 3n * l;
    await compare('invariant', [x, y, l]);
    await compare('quote', [i % 2 ? y : x, i % 2 ? x : y, l, 1n + random(l / 2n)]);
    if (i % 32 === 31) console.log(`Compared ${i + 1} seeded reserve states`);
  }
  for (const [x, y, l, a] of [
    [0n, WAD, WAD, 1n], [WAD, 1n, WAD, 1n], [WAD, 0n, WAD, 1n], [WAD, WAD, WAD, 0n],
    [WAD, WAD, WAD - 1n, 1n], [WAD, WAD, 10n ** 27n + 1n, 1n],
    [MAX, MAX, WAD, 1n], [MAX - 1n, MAX, WAD, 1n], [MAX + 1n, MAX, WAD, 1n],
    [MAX, MAX + 1n, WAD, 1n], [UMAX, UMAX, UMAX, UMAX], [WAD, UMAX, 0n, 1n],
    [1n, 2n, WAD, 1n], [WAD, WAD, WAD, UMAX], [WAD, WAD, 0n, 0n],
  ]) {
    await compare('invariant', [x, y, l]);
    await compare('quote', [x, y, l, a]);
  }
  assert(counts.successes > 0 && counts.reverts > 0);
  fs.mkdirSync('reports', { recursive: true });
  fs.writeFileSync('reports/gas-equivalence.json', JSON.stringify({
    reference: JSON.parse(fs.readFileSync('artifacts/gas-baseline.json', 'utf8')),
    seed: '0x6761757373766d', ...counts, comparison: 'Exact ABI return bytes or revert data',
    limitation: 'Deterministic bounded differential testing, not a proof over every possible input.',
  }, null, 2));
  console.log(`Exact differential comparisons: ${JSON.stringify(counts)}`);
});
