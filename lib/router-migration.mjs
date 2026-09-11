import assert from 'node:assert/strict';
import { decodeEventLog } from 'viem';
import { loadArtifact } from './deploy.mjs';
import { encodeOrder, orderHash } from './encoding.mjs';

/** Move only the maker's seed authorization; no collateral or outcome tokens move.
 * Progress must be persisted by the caller before waiting for each transaction.
 */
export async function migrateRouterSeed({ publicClient: p, wallet, maker, current, nextRouter,
  progress, save = () => {}, log = console.log }) {
  const account = typeof maker === 'string' ? maker : maker.address;
  const same = (a, b) => a.toLowerCase() === b.toLowerCase();
  assert(same(account, current.maker), 'Only the seed maker may migrate its authorization');
  assert(!same(nextRouter, current.router), 'A different router is required');
  const aqua = { address: current.aqua, abi: loadArtifact('Aqua').abi };
  const router = { address: nextRouter, abi: loadArtifact('GaussVM').abi };
  const tokens = [current.yes, current.no], tokenAbi = loadArtifact('OutcomeToken').abi;
  const order = { ...current.order, traits: BigInt(current.order.traits) };
  assert(same(orderHash(order), current.orderHash), 'Seed order must match its hash');
  assert(same(await p.readContract({ ...router, functionName: 'AQUA' }), current.aqua), 'Aqua must remain unchanged');
  if (progress.sourceRouter) {
    assert(same(progress.sourceRouter, current.router) && same(progress.nextRouter, nextRouter)
      && same(progress.orderHash, current.orderHash), 'Progress belongs to another migration');
  } else {
    Object.assign(progress, { sourceRouter: current.router, nextRouter, orderHash: current.orderHash, steps: {} }); save();
  }
  async function transact(label, contract, functionName, args) {
    const step = progress.steps[label] ??= {};
    if (!step.hash) {
      const { request } = await p.simulateContract({ ...contract, functionName, args, account: maker });
      step.hash = await wallet.writeContract(request); save(); log(`Submitted ${label}: ${step.hash}`);
    }
    const r = await p.waitForTransactionReceipt({ hash: step.hash });
    assert.equal(r.status, 'success', `${label} must confirm successfully`);
    Object.assign(step, { label, blockNumber: String(r.blockNumber), gasUsed: String(r.gasUsed),
      feeWei: String(r.gasUsed * r.effectiveGasPrice) }); save();
    return r;
  }
  if (!progress.snapshot) {
    const block = await p.getBlock();
    const balances = [];
    for (const token of tokens) {
      const [amount, count] = await p.readContract({ ...aqua, functionName: 'rawBalances',
        args: [account, current.router, current.orderHash, token], blockNumber: block.number });
      assert.equal(Number(count), 2, 'Source seed must be active'); balances.push(String(amount));
    }
    progress.snapshot = { blockNumber: String(block.number), balances }; save();
  }
  const dock = await transact('Dock previous router seed', aqua, 'dock', [current.router, current.orderHash, tokens]);
  if (!progress.allocations) {
    const balances = progress.snapshot.balances.map(BigInt);
    const fromBlock = BigInt(progress.snapshot.blockNumber) + 1n;
    // Include any swaps mined after the snapshot, even before docking in the
    // same block. Never reset a traded position to its initial 1000/1000 reserves.
    const logs = await p.getLogs({ address: current.aqua, fromBlock, toBlock: dock.blockNumber });
    for (const log of logs) {
      let event;
      try { event = decodeEventLog({ abi: aqua.abi, ...log }); } catch { continue; }
      const a = event.args;
      if (!['Pushed', 'Pulled'].includes(event.eventName) || !same(a.maker, account)
        || !same(a.app, current.router) || !same(a.strategyHash, current.orderHash)) continue;
      const i = tokens.findIndex(token => same(token, a.token));
      assert(i >= 0, 'Unexpected token in seed events');
      balances[i] += event.eventName === 'Pushed' ? a.amount : -a.amount;
    }
    assert(balances.every(amount => amount > 0n), 'Closing reserves must be positive');
    progress.allocations = balances.map(String); save();
  }
  if (!progress.completedAt) {
    for (let i = 0; i < tokens.length; i++) {
      const token = { address: tokens[i], abi: tokenAbi }, amount = BigInt(progress.allocations[i]);
      assert(await p.readContract({ ...token, functionName: 'balanceOf', args: [account] }) >= amount, 'Maker inventory is insufficient');
      const allowance = await p.readContract({ ...token, functionName: 'allowance', args: [account, current.aqua] });
      if (allowance < amount) await transact(`Approve migrated ${i === 0 ? 'YES' : 'NO'} allocation`, token, 'approve', [current.aqua, amount]);
    }
    await transact('Ship optimized router seed', aqua, 'ship', [nextRouter, encodeOrder(order), tokens, progress.allocations.map(BigInt)]);
  }
  for (let i = 0; i < tokens.length; i++) {
    const previous = await p.readContract({ ...aqua, functionName: 'rawBalances', args: [account, current.router, current.orderHash, tokens[i]] });
    const next = await p.readContract({ ...aqua, functionName: 'rawBalances', args: [account, nextRouter, current.orderHash, tokens[i]] });
    assert.equal(Number(previous[1]), 255, 'Previous seed must be docked');
    assert.equal(Number(next[1]), 2, 'Optimized seed must be active');
    // A completed migration can be resumed after trading; only the initial
    // post-ship checkpoint requires equality to the original closing reserves.
    if (!progress.completedAt) assert.equal(next[0], BigInt(progress.allocations[i]));
  }
  progress.completedAt ??= new Date().toISOString(); save();
  return progress;
}
