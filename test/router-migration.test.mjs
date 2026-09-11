import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEther, zeroAddress } from 'viem';
import { accounts, artifact, deploy, publicClient, wallet, read, write } from './helpers.mjs';
import { deploySystem } from '../lib/deploy.mjs';
import { migrateRouterSeed } from '../lib/router-migration.mjs';
import { makeOrder, encodeOrder, orderHash, takerData } from '../lib/encoding.mjs';

test('router migration preserves closing reserves, catches concurrent swaps, resumes and touches only the seed', async () => {
  const e = parseEther, maker = accounts[0], trader = accounts[1];
  const current = await deploySystem({ publicClient, wallet, maker, log: () => {} });
  const c = (name, address) => ({ address, abi: artifact(name).abi });
  const next = await deploy('GaussVM', [current.aqua, zeroAddress, maker]);
  const aqua = c('Aqua', current.aqua), old = c('GaussVM', current.router);
  const yes = c('OutcomeToken', current.yes), no = c('OutcomeToken', current.no);
  const collateral = c('DemoCollateral', current.collateral), market = c('BinaryMarket', current.market);
  await write(collateral, 'faucet', [], trader);
  await write(collateral, 'approve', [current.market, e('100')], trader);
  await write(market, 'split', [e('100')], trader);
  await write(no, 'approve', [old.address, e('100')], trader);
  const other = makeOrder({ ...current, liquidity: BigInt(current.liquidity), start: current.start - 1, timeScaled: true });
  await write(aqua, 'ship', [old.address, encodeOrder(other), [yes.address, no.address], [e('1'), e('1')]]);
  const order = { ...current.order, traits: BigInt(current.order.traits) };
  const args = [order, e('10'), takerData({ tokenIn: no.address, yes: yes.address, no: no.address, minOutput: 1n })];
  let closing, balances, inserted = false, writes = 0;
  const migratingWallet = { writeContract: async request => {
    if (!inserted && request.functionName === 'dock') {
      inserted = true;
      await write(old, 'swap', args, trader); // Lands after migration's reserve snapshot.
      closing = await Promise.all([yes, no].map(token => read(aqua, 'rawBalances', [maker, old.address, current.orderHash, token.address])));
      balances = await Promise.all([yes, no].map(token => read(token, 'balanceOf', [maker])));
    }
    writes++;
    return wallet.writeContract(request);
  } };
  const progress = {};
  const options = { publicClient, wallet: migratingWallet, maker, current, nextRouter: next.address, progress, log: () => {} };
  await assert.rejects(migrateRouterSeed({ ...options, maker: trader }), /Only the seed maker/);
  await assert.rejects(migrateRouterSeed({ ...options, nextRouter: old.address }), /different router/);
  await assert.rejects(migrateRouterSeed({ ...options, publicClient: { ...publicClient,
    getLogs: async () => { throw new Error('Simulated index read interruption'); } } }), /Simulated index read/);
  assert(progress.steps['Dock previous router seed'].hash);
  assert.equal(progress.completedAt, undefined);
  await migrateRouterSeed(options);
  assert.deepEqual(progress.allocations, closing.map(([amount]) => String(amount)));
  assert.deepEqual(await Promise.all([yes, no].map(token => read(token, 'balanceOf', [maker]))), balances);
  assert.equal(Number((await read(aqua, 'rawBalances', [maker, old.address, orderHash(other), yes.address]))[1]), 2);
  // A subsequent swap is executable with the same tokens and order.
  await write(no, 'approve', [next.address, e('100')], trader);
  await write(next, 'swap', args, trader);
  const before = writes;
  await migrateRouterSeed(options);
  assert.equal(writes, before, 'Completed migration must not send more transactions');
});
