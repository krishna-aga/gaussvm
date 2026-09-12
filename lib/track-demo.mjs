import assert from 'node:assert/strict';
import { decodeEventLog, formatEther, parseEther } from 'viem';
import { loadArtifact } from './deploy.mjs';
import { encodeOrder, makeOrder, orderHash, takerData } from './encoding.mjs';

// Run only on a fresh, disposable local deployment: this advances time and resolves it.
export async function runTrackDemo({ publicClient, wallet, system: d, advanceTo, log = console.log }) {
  assert.equal(await publicClient.getChainId(), 31337, 'Track demo requires a local EVM');
  const maker = d.maker, trader = (await wallet.getAddresses())[1];
  assert.notEqual(maker.toLowerCase(), trader.toLowerCase());
  const contract = (name, address) => ({ address, abi: loadArtifact(name).abi });
  const aqua = contract('Aqua', d.aqua), router = contract('GaussVM', d.router);
  // Aqua's reverts bubble through SwapVM; include those errors for precise assertions.
  router.abi = [...router.abi, ...aqua.abi.filter(item => item.type === 'error')];
  const market = contract('BinaryMarket', d.market), collateral = contract('DemoCollateral', d.collateral);
  const yes = contract('OutcomeToken', d.yes), no = contract('OutcomeToken', d.no);
  const read = (c, functionName, args = []) => publicClient.readContract({ ...c, functionName, args });
  const balance = (c, account) => read(c, 'balanceOf', [account]);
  const staticOrder = { ...d.order, traits: BigInt(d.order.traits) };
  const dynamicOrder = makeOrder({ maker, yes: d.yes, no: d.no, market: d.market,
    liquidity: BigInt(d.liquidity), start: d.start, expiry: d.expiry, timeScaled: true });
  const staticHash = orderHash(staticOrder), dynamicHash = orderHash(dynamicOrder);
  assert.equal(staticHash, d.orderHash);
  assert.equal(d.timeScaled, false, 'Start from the fresh static seed');
  assert.equal((await read(router, 'AQUA')).toLowerCase(), d.aqua.toLowerCase());
  assert.equal(await read(router, 'GAUSSIAN_SWAP'), 128);
  const evidence = { schemaVersion: 1, status: 'passed', chainId: 31337,
    description: d.fork ? 'Canonical Aqua on a local Ethereum fork; these transactions are not public.'
      : 'Isolated local EVM with unmodified official Aqua source; these transactions are not public.',
    fork: d.fork, contracts: { aqua: d.aqua, router: d.router, market: d.market, collateral: d.collateral, yes: d.yes, no: d.no },
    maker, trader, strategies: { static: staticHash, timeScaled: dynamicHash },
    deploymentTransactions: d.receipts, transactions: [], swaps: [], checks: [] };
  const saveReceipt = (action, r) => {
    assert.equal(r.status, 'success');
    evidence.transactions.push({ action, hash: r.transactionHash, blockNumber: r.blockNumber,
      blockHash: r.blockHash, gasUsed: r.gasUsed, status: r.status,
      logs: r.logs.map(({ address, topics, data }) => ({ address, topics, data })) });
  };
  async function write(c, functionName, args = [], account = maker) {
    const { request } = await publicClient.simulateContract({ ...c, functionName, args, account });
    const hash = await wallet.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    saveReceipt(functionName, receipt);
    return receipt;
  }
  function events(receipt, c, name) {
    return receipt.logs.filter(l => l.address.toLowerCase() === c.address.toLowerCase()).flatMap(l => {
      try { const event = decodeEventLog({ abi: c.abi, ...l }); return event.eventName === name ? [event.args] : []; }
      catch { return []; }
    });
  }
  function oneEvent(receipt, c, name) {
    const matches = events(receipt, c, name);
    assert.equal(matches.length, 1, `Expected one ${name} from ${c.address}`);
    return matches[0];
  }
  function check(description) { evidence.checks.push(description); log(`PASS ${description}`); }
  const holdings = async account => ({ yes: await balance(yes, account), no: await balance(no, account) });
  const allocations = hash => read(aqua, 'safeBalances', [maker, d.router, hash, d.yes, d.no]);
  async function snapshot(hash) {
    return { maker: await holdings(maker), trader: await holdings(trader),
      aqua: await holdings(d.aqua), router: await holdings(d.router), allocations: await allocations(hash) };
  }
  const noCustody = state => {
    for (const c of ['aqua', 'router']) assert.deepEqual(state[c], { yes: 0n, no: 0n });
  };
  function noTransfers(receipt) {
    for (const c of [yes, no, collateral]) assert.equal(events(receipt, c, 'Transfer').length, 0);
  }
  const td = (tokenIn, minOutput = 1n) => takerData({ tokenIn, yes: d.yes, no: d.no, minOutput });
  async function quote(order, tokenIn) {
    return (await publicClient.simulateContract({ ...router, functionName: 'quote',
      args: [order, parseEther('10'), td(tokenIn)], account: trader })).result[1];
  }

  const seed = await snapshot(staticHash);
  assert.deepEqual(seed.maker, { yes: parseEther('1000'), no: parseEther('1000') });
  assert.deepEqual(seed.allocations, [parseEther('1000'), parseEther('1000')]);
  noCustody(seed);
  const seedShip = await publicClient.getTransactionReceipt({ hash: d.receipts.find(r => r.label === 'ship').hash });
  saveReceipt('seed ship', seedShip);
  noTransfers(seedShip);
  assert.equal(oneEvent(seedShip, aqua, 'Shipped').strategyHash, staticHash);
  evidence.seed = seed;
  check('Shipping allocates 1,000 YES + 1,000 NO without transferring maker tokens');

  const sharedShip = await write(aqua, 'ship', [d.router, encodeOrder(dynamicOrder), [d.yes, d.no], [parseEther('1000'), parseEther('1000')]]);
  noTransfers(sharedShip);
  assert.equal(oneEvent(sharedShip, aqua, 'Shipped').strategyHash, dynamicHash);
  assert.deepEqual(await snapshot(staticHash), seed);
  assert.deepEqual(await allocations(dynamicHash), seed.allocations);
  evidence.sharedLiquidity = { maker: seed.maker, staticAllocation: seed.allocations,
    timeScaledAllocation: await allocations(dynamicHash),
    meaning: 'Both strategies share the same wallet inventory. Allocations are not additional tokens or guaranteed simultaneous liquidity.' };
  check('Two distinct strategies share one maker wallet, with no second deposit');

  await write(collateral, 'faucet', [], trader);
  await write(collateral, 'approve', [d.market, parseEther('100')], trader);
  await write(market, 'split', [parseEther('100')], trader);
  const initialDynamicQuote = await quote(dynamicOrder, d.no);

  async function swap(order, input, output, mode, untouchedHash) {
    const hash = orderHash(order), amount = parseEther('10');
    await write(input, 'approve', [d.router, amount], trader);
    const quoted = await quote(order, input.address);
    // The time-scaled quote can change between the quote and mined block.
    const minimum = mode === 'static' ? quoted : quoted * 995n / 1000n;
    const before = await snapshot(hash), untouched = await allocations(untouchedHash);
    const receipt = await write(router, 'swap', [order, amount, td(input.address, minimum)], trader);
    const actual = oneEvent(receipt, router, 'Swapped');
    assert.equal(actual.orderHash, hash);
    for (const [field, expected] of Object.entries({ maker, taker: trader, tokenIn: input.address, tokenOut: output.address })) {
      assert.equal(actual[field].toLowerCase(), expected.toLowerCase());
    }
    assert.equal(actual.amountIn, amount);
    assert.ok(actual.amountOut >= minimum);
    if (mode === 'static') assert.equal(actual.amountOut, quoted);
    const after = await snapshot(hash);
    const inputSide = input.address === d.yes ? 'yes' : 'no', outputSide = inputSide === 'yes' ? 'no' : 'yes';
    assert.equal(before.trader[inputSide] - after.trader[inputSide], amount);
    assert.equal(after.trader[outputSide] - before.trader[outputSide], actual.amountOut);
    assert.equal(after.maker[inputSide] - before.maker[inputSide], amount);
    assert.equal(before.maker[outputSide] - after.maker[outputSide], actual.amountOut);
    const inputIndex = inputSide === 'yes' ? 0 : 1, outputIndex = 1 - inputIndex;
    assert.equal(after.allocations[inputIndex] - before.allocations[inputIndex], amount);
    assert.equal(before.allocations[outputIndex] - after.allocations[outputIndex], actual.amountOut);
    assert.deepEqual(await allocations(untouchedHash), untouched);
    noCustody(after);
    for (const [eventName, token, value] of [['Pushed', input.address, amount], ['Pulled', output.address, actual.amountOut]]) {
      const event = oneEvent(receipt, aqua, eventName);
      assert.equal(event.maker.toLowerCase(), maker.toLowerCase());
      assert.equal(event.app.toLowerCase(), d.router.toLowerCase());
      assert.equal(event.strategyHash, hash);
      assert.equal(event.token.toLowerCase(), token.toLowerCase());
      assert.equal(event.amount, value);
    }
    // The output transfer is maker -> trader. SwapVM forwards input through itself to Aqua.push.
    const outputTransfer = oneEvent(receipt, output, 'Transfer');
    assert.equal(outputTransfer.from.toLowerCase(), maker.toLowerCase());
    assert.equal(outputTransfer.to.toLowerCase(), trader.toLowerCase());
    assert.equal(outputTransfer.value, actual.amountOut);
    evidence.swaps.push({ mode, direction: `${inputSide.toUpperCase()} -> ${outputSide.toUpperCase()}`,
      hash: receipt.transactionHash, gasUsed: receipt.gasUsed, quotedOutput: quoted, minimumOutput: minimum,
      executed: actual, before, after });
    check(`${mode}: 10 ${inputSide.toUpperCase()} -> ${formatEther(actual.amountOut)} ${outputSide.toUpperCase()}; wallet deltas, Aqua events and allocation isolation match`);
    log(`  tx ${receipt.transactionHash}; block ${receipt.blockNumber}; gas ${receipt.gasUsed}`);
  }

  await swap(staticOrder, no, yes, 'static', dynamicHash);
  await swap(staticOrder, yes, no, 'static', dynamicHash);
  await advanceTo(d.start + Math.floor((d.expiry - d.start) * 0.75));
  const laterDynamicQuote = await quote(dynamicOrder, d.no);
  assert.ok(laterDynamicQuote < initialDynamicQuote);
  evidence.timeScaling = { initialQuote: initialDynamicQuote, laterQuote: laterDynamicQuote,
    timestamp: (await publicClient.getBlock()).timestamp, note: 'Local clock advanced to 75% of lifetime; experimental retained-complete-set mode.' };
  check('Elapsed time changes the executable time-scaled quote while its allocation is unchanged');
  await swap(dynamicOrder, no, yes, 'time-scaled', staticHash);

  evidence.docking = [];
  for (const [order, hash] of [[staticOrder, staticHash], [dynamicOrder, dynamicHash]]) {
    const before = await holdings(maker);
    const receipt = await write(aqua, 'dock', [d.router, hash, [d.yes, d.no]]);
    noTransfers(receipt);
    assert.equal(oneEvent(receipt, aqua, 'Docked').strategyHash, hash);
    assert.deepEqual(await holdings(maker), before);
    await assert.rejects(quote(order, d.no), /SafeBalancesForTokenNotInActiveStrategy/);
    evidence.docking.push({ strategy: hash, makerBefore: before, makerAfter: await holdings(maker), hash: receipt.transactionHash });
  }
  check('Docking both strategies preserves wallet tokens and disables their quotes');

  for (const account of [maker, trader]) {
    const before = await balance(collateral, account);
    await write(market, 'merge', [parseEther('1')], account);
    assert.equal(await balance(collateral, account) - before, parseEther('1'));
  }
  check('Each complete-set merge returns exactly one collateral token');
  await advanceTo(d.expiry);
  await write(market, 'resolve', [true], maker);
  evidence.resolution = { outcome: 'YES', simulated: true,
    note: 'Manual test resolution on the disposable local chain; not an assertion about ETHOnline results.', redemptions: [] };
  for (const account of [maker, trader]) {
    const tokens = await holdings(account), before = await balance(collateral, account);
    const receipt = await write(market, 'redeem', [tokens.yes, tokens.no], account);
    const payout = await balance(collateral, account) - before;
    assert.equal(payout, tokens.yes);
    assert.deepEqual(await holdings(account), { yes: 0n, no: 0n });
    evidence.resolution.redemptions.push({ account, tokens, payout, hash: receipt.transactionHash });
  }
  assert.equal(await balance(collateral, d.market), 0n);
  assert.equal(await read(yes, 'totalSupply'), 0n);
  assert.equal(await read(no, 'totalSupply'), 0n);
  check('Simulated YES resolution redeems both holders exactly and leaves no outstanding collateral or outcomes');
  return evidence;
}
