import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { createPublicClient, createWalletClient, http, parseEther, decodeEventLog } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { loadArtifact } from '../lib/deploy.mjs';
import { validateDeployment } from '../lib/workspace.mjs';

// Opt-in public test: real Sepolia writes through the hosted UI. Never run in CI.
const appUrl = 'https://krishna-aga.github.io/gaussvm/';
if (!process.env.TESTNET_TRADER_PRIVATE_KEY) throw new Error('Set a dedicated funded TESTNET_TRADER_PRIVATE_KEY in ignored .env.');
const d = JSON.parse(fs.readFileSync('deployments/sepolia.json', 'utf8'));
assert(validateDeployment(d) && d.chainId === sepolia.id, 'Valid Sepolia deployment required');
const served = await (await fetch(`${appUrl}deployment.json?check=${Date.now()}`)).json();
assert.equal(served.orderHash, d.orderHash, 'Hosted deployment must match the tested contracts');
const account = privateKeyToAccount(process.env.TESTNET_TRADER_PRIVATE_KEY);
assert.notEqual(account.address.toLowerCase(), d.maker.toLowerCase(), 'Use a separate taker wallet');
const p = createPublicClient({ chain: sepolia, transport: http(d.rpcUrl), pollingInterval: 4000 });
const wallet = createWalletClient({ account, chain: sepolia, transport: http(d.rpcUrl, { retryCount: 0 }) });
assert.equal(await p.getChainId(), sepolia.id);
assert(await p.getBalance({ address: account.address }) > 0n, 'Taker needs faucet Sepolia ETH');
const tokenAbi = loadArtifact('OutcomeToken').abi;
const balance = (token, blockNumber) => p.readContract({ address: token, abi: tokenAbi, functionName: 'balanceOf', args: [account.address], blockNumber });
const evidence = { chainId: sepolia.id, appUrl, testedAt: new Date().toISOString(), account: account.address, market: d.market,
  router: d.router, strategy: d.orderHash, walletAdapter: 'EIP-1193 test adapter; signing stays in the Node process, never the page. Not a browser-extension approval-dialog test.', transactions: [] };
fs.mkdirSync('reports', { recursive: true });
const save = () => fs.writeFileSync('reports/sepolia-ui.json', JSON.stringify(evidence, null, 2));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(180000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const allowed = [d.collateral, d.market, d.yes, d.no, d.router].map(address => address.toLowerCase());
  await page.exposeFunction('testWalletRequest', async ({ method, params = [] }) => {
    if (method === 'eth_chainId') return '0xaa36a7';
    if (method === 'eth_accounts' || method === 'eth_requestAccounts') return [account.address];
    if (method === 'wallet_switchEthereumChain') {
      assert.equal(params[0].chainId, '0xaa36a7'); return null;
    }
    if (method === 'eth_sendTransaction') {
      const tx = params[0];
      assert.equal(await p.getChainId(), sepolia.id);
      assert.equal(tx.from.toLowerCase(), account.address.toLowerCase());
      assert(allowed.includes(tx.to.toLowerCase()), 'Unrecognized transaction target');
      assert.equal(BigInt(tx.value ?? 0), 0n, 'Test UI never transfers native ETH');
      const hash = await wallet.sendTransaction({ to: tx.to, data: tx.data, value: 0n });
      evidence.transactions.push({ hash }); save();
      console.log(`Submitted UI transaction: ${hash}`);
      return hash;
    }
    throw new Error(`Unsupported test wallet request: ${method}`);
  });
  await page.addInitScript(() => {
    window.ethereum = { request: args => window.testWalletRequest(args), on() {}, removeListener() {} };
  });
  await page.goto(appUrl);
  await page.getByText('Trading open', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Connect to swap', exact: true }).click();
  const preparation = page.getByRole('button', { name: 'Get 100 YES + 100 NO', exact: true });
  const swap = page.getByRole('button', { name: 'Swap NO for YES', exact: true });
  await preparation.or(swap).waitFor();
  if (await preparation.isVisible()) await preparation.click();
  await swap.click();
  const success = page.getByRole('status').filter({ hasText: 'Swap confirmed.' });
  const alert = page.getByRole('alert');
  await success.or(alert).waitFor();
  if (await alert.isVisible()) throw new Error(await alert.innerText());
  const last = evidence.transactions.at(-1);
  const receipt = await p.getTransactionReceipt({ hash: last.hash });
  assert.equal(receipt.status, 'success');
  const event = receipt.logs.map(log => {
    try { return decodeEventLog({ abi: loadArtifact('GaussVM').abi, ...log }); } catch { return null; }
  }).find(log => log?.eventName === 'Swapped');
  assert(event, 'Actual Swapped event required');
  const [yesBefore, noBefore, yesAfter, noAfter] = await Promise.all([
    balance(d.yes, receipt.blockNumber - 1n), balance(d.no, receipt.blockNumber - 1n),
    balance(d.yes, receipt.blockNumber), balance(d.no, receipt.blockNumber),
  ]);
  assert.equal(noBefore - noAfter, parseEther('10'));
  assert(yesAfter > yesBefore, 'Swap must deliver real output tokens');
  assert.equal(event.args.amountIn, noBefore - noAfter);
  assert.equal(event.args.amountOut, yesAfter - yesBefore);
  evidence.swap = { hash: last.hash, input: (noBefore - noAfter).toString(), output: (yesAfter - yesBefore).toString(),
    before: { yes: yesBefore.toString(), no: noBefore.toString() }, after: { yes: yesAfter.toString(), no: noAfter.toString() } };
  for (const tx of evidence.transactions) {
    const r = await p.getTransactionReceipt({ hash: tx.hash });
    assert.equal(r.status, 'success');
    Object.assign(tx, { status: r.status, block: r.blockNumber.toString(), gas: r.gasUsed.toString(),
      feeWei: (r.gasUsed * r.effectiveGasPrice).toString() });
  }
  assert.deepEqual(errors, []);
  await page.screenshot({ path: 'reports/sepolia-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No mobile overflow');
  await page.screenshot({ path: 'reports/sepolia-mobile.png', fullPage: true });
  evidence.result = 'passed'; save();
  console.log(`Hosted Sepolia swap verified: ${last.hash}; output ${evidence.swap.output} wei YES`);
} catch (error) {
  const page = browser.contexts()[0]?.pages()[0];
  if (page && !page.isClosed()) {
    evidence.pageState = await page.locator('body').innerText();
    await page.screenshot({ path: 'reports/sepolia-ui-failure.png', fullPage: true });
  }
  evidence.result = 'failed'; evidence.error = error.message; save(); throw error;
} finally { await browser.close(); }
