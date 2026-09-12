import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const root = process.cwd();
const output = path.join(root, 'docs/assets/ethglobal-submission');
const url = 'https://krishna-aga.github.io/gaussvm/';
const account = '0x5076F136d3cD37B95471DcCFb5cf721f6448521b';
const browser = await chromium.launch();
const evidence = { capturedAt: new Date().toISOString(), url, account,
  method: 'Unmodified hosted app with a read-only EIP-1193 adapter for the public test account. Actual chain reads and simulated quotes; signing and transaction submission are unsupported.',
  screenshots: [], errors: [] };
try {
  const logo = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
  const svg = fs.readFileSync(path.join(root, 'web/public/favicon.svg'), 'utf8');
  fs.writeFileSync(path.join(output, 'gaussvm-logo.svg'), svg);
  await logo.setContent(`<html><head><style>*{box-sizing:border-box}html,body{margin:0;width:512px;height:512px;background:#e9ede8}svg{display:block;width:512px;height:512px}</style></head><body>${svg}</body></html>`);
  await logo.screenshot({ path: path.join(output, 'gaussvm-logo-512.png') });
  await logo.close();

  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(60000);
  page.on('pageerror', error => evidence.errors.push(error.message));
  await page.addInitScript(({ account }) => {
    window.ethereum = {
      request: async ({ method, params }) => {
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') return [account];
        if (method === 'eth_chainId') return '0xaa36a7';
        if (method === 'wallet_switchEthereumChain' && params?.[0]?.chainId === '0xaa36a7') return null;
        throw new Error(`Submission screenshot adapter is read-only: ${method}`);
      }, on() {}, removeListener() {},
    };
  }, { account });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.getByText('Trading open', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Connect to swap', exact: true }).click();
  await page.getByRole('button', { name: 'Swap NO for YES', exact: true }).waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const output = document.querySelector('output');
    return output && /[0-9]/.test(output.textContent) && !output.querySelector('svg');
  });
  await page.evaluate(() => document.fonts.ready);
  async function capture(name, fullPage = false) {
    assert.equal(await page.getByRole('alert').count(), 0, 'Do not capture an error state');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
    await page.screenshot({ path: path.join(output, name), fullPage, animations: 'disabled' });
    evidence.screenshots.push({ file: name, fullPage, text: await page.locator('body').innerText() });
    console.log(`Captured ${name}`);
  }
  await capture('screenshot-01-swap.png');
  await page.getByRole('button', { name: 'Liquidity', exact: true }).click();
  await page.getByRole('heading', { name: 'Liquidity stays with you.' }).waitFor();
  await capture('screenshot-02-liquidity.png', true);
  await page.getByRole('button', { name: 'How it works', exact: true }).click();
  await page.getByRole('heading', { name: 'From a paper to a position.' }).waitFor();
  await page.locator('summary').filter({ hasText: 'Explore the Gaussian curve' }).click();
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.locator('.research-curve').evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await capture('screenshot-03-gaussian-curve.png');
  await page.getByRole('button', { name: 'Swap', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await capture('screenshot-04-mobile.png', true);
  assert.deepEqual(evidence.errors, []);
} finally {
  fs.writeFileSync(path.join(output, 'capture-evidence.json'), JSON.stringify(evidence, null, 2));
  await browser.close();
}
