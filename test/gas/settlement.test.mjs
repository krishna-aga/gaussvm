import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { decodeEventLog, parseEther, zeroAddress } from 'viem';
import { accounts, artifact, deploy, publicClient, wallet, read, write, mineAt } from '../helpers.mjs';
import { deploySystem } from '../../lib/deploy.mjs';
import { makeOrder, encodeOrder, orderHash, takerData } from '../../lib/encoding.mjs';

const e = parseEther, maker = accounts[0], trader = accounts[1];
const system = await deploySystem({ publicClient, wallet, maker, log: () => {} });
const contract = (name, address) => ({ address, abi: artifact(name).abi });
const optimized = contract('GaussVM', system.router);
const baseline = await deploy('BaselineGaussVM', [system.aqua, zeroAddress, maker]);
const aqua = contract('Aqua', system.aqua), market = contract('BinaryMarket', system.market);
const collateral = contract('DemoCollateral', system.collateral);
const yes = contract('OutcomeToken', system.yes), no = contract('OutcomeToken', system.no);
await write(collateral, 'faucet', [], trader);
await write(collateral, 'approve', [system.market, e('500')], trader);
await write(market, 'split', [e('500')], trader);
for (const token of [yes, no]) for (const router of [baseline, optimized]) {
  await write(token, 'approve', [router.address, e('500')], trader);
}
const rpc = (method, params = []) => publicClient.request({ method, params });
const snapshot = () => rpc('evm_snapshot');
const restore = async id => assert.equal(await rpc('evm_revert', [id]), true);
const rows = [];

test('full Aqua swaps use less gas with identical quotes, events, balances and allowances', async () => {
  const cases = [];
  for (const timeScaled of [false, true]) for (const side of ['YES', 'NO']) {
    for (const amount of ['0.000001', '10', '100']) cases.push({ timeScaled, side, amount, elapsed: 43200, y: '1000', n: '1000' });
    cases.push({ timeScaled, side, amount: '10', elapsed: 77760, y: '700', n: '1000' });
  }
  for (const c of cases) {
    const root = await snapshot();
    const order = makeOrder({ ...system, maker, liquidity: BigInt(system.liquidity), start: system.start - 1, timeScaled: c.timeScaled });
    const hash = orderHash(order);
    for (const router of [baseline, optimized]) {
      await write(aqua, 'ship', [router.address, encodeOrder(order), [system.yes, system.no], [e(c.y), e(c.n)]]);
    }
    await mineAt(system.start + c.elapsed);
    const td = takerData({ tokenIn: c.side === 'YES' ? system.yes : system.no, yes: system.yes, no: system.no, minOutput: 1n });
    const args = [order, e(c.amount), td];
    const quote = async router => (await publicClient.simulateContract({ ...router, functionName: 'quote', args, account: trader })).result;
    assert.deepEqual(await quote(optimized), await quote(baseline));
    async function execute(router) {
      await rpc('evm_setNextBlockTimestamp', [system.start + c.elapsed + 1]);
      const receipt = await write(router, 'swap', args, trader);
      const event = receipt.logs.map(log => {
        try { return decodeEventLog({ abi: router.abi, ...log }); } catch { return null; }
      }).find(log => log?.eventName === 'Swapped');
      assert(event);
      const state = [];
      for (const token of [yes, no]) {
        state.push(await read(token, 'balanceOf', [maker]), await read(token, 'balanceOf', [trader]),
          await read(token, 'allowance', [trader, router.address]), await read(token, 'allowance', [maker, system.aqua]),
          await read(aqua, 'rawBalances', [maker, router.address, hash, token.address]));
        assert.equal(await read(token, 'balanceOf', [router.address]), 0n);
        assert.equal(await read(token, 'balanceOf', [system.aqua]), 0n);
      }
      return { gas: receipt.gasUsed, event: event.args, state };
    }
    const before = await snapshot();
    const oldResult = await execute(baseline);
    await restore(before);
    const newResult = await execute(optimized);
    assert.deepEqual(newResult.event, oldResult.event);
    assert.deepEqual(newResult.state, oldResult.state);
    assert(newResult.gas < oldResult.gas, `Gas regression for ${JSON.stringify(c)}`);
    rows.push({ ...c, inputToken: c.side, output: newResult.event.amountOut.toString(),
      baselineGas: String(oldResult.gas), optimizedGas: String(newResult.gas),
      savedGas: String(oldResult.gas - newResult.gas),
      savedPercent: Number(((oldResult.gas - newResult.gas) * 10000n) / oldResult.gas) / 100 });
    await restore(root);
  }
  fs.mkdirSync('reports', { recursive: true });
  fs.writeFileSync('reports/gas-settlement.json', JSON.stringify({
    reference: JSON.parse(fs.readFileSync('artifacts/gas-baseline.json', 'utf8')),
    method: 'Local Cancun EVM; snapshot/revert fixes all pre-swap state and timestamp. Same contracts, calldata, order and finite allowances; only router math differs.',
    runtimeBytes: { baseline: (artifact('BaselineGaussVM').deployedBytecode.length - 2) / 2,
      optimized: (artifact('GaussVM').deployedBytecode.length - 2) / 2 },
    rows,
  }, null, 2));
  console.table(rows.map(({ timeScaled, inputToken, amount, y, baselineGas, optimizedGas, savedPercent }) =>
    ({ timeScaled, inputToken, amount, yesReserve: y, baselineGas, optimizedGas, savedPercent })));
});
