import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

async function buyYes(page: Page, amount = '10') {
  await page.getByRole('button',{name:'Connect to swap',exact:true}).click();
  await page.getByRole('button',{name:'Get 100 YES + 100 NO',exact:true}).click();
  await expect(page.getByRole('button',{name:'Swap NO for YES',exact:true})).toBeEnabled();
  await page.getByRole('textbox',{name:'Amount to swap'}).fill(amount);
  await page.getByRole('button',{name:'Swap NO for YES',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'Swap confirmed.'})).toBeVisible();
}

test('a real local swap updates the chart, exposes its receipt, and survives reload', async ({page})=>{
  execFileSync(process.execPath,['scripts/deploy.mjs'],{stdio:'pipe'});
  await page.goto('/');
  await expect(page.getByText('Trading open',{exact:true})).toBeVisible();
  await expect(page.getByTestId('market-probability')).toHaveText('50.0%');
  await buyYes(page);
  await expect(page.getByTestId('market-probability')).not.toHaveText('50.0%');
  await expect(page.locator('.recent-trades li')).toHaveCount(1);
  await expect(page.locator('.recent-trades')).toContainText('Bought YES');
  await expect(page.locator('.history-dot')).toHaveCount(2);
  await page.reload();
  await expect(page.locator('.recent-trades li')).toHaveCount(1);
  await expect(page.locator('.history-dot')).toHaveCount(2);
});

test('example moves on the curve, reverses direction and supports playback, pause and reset',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button',{name:'Watch how a trade moves the price'}).click();
  await expect(page.getByTestId('example-probability')).toHaveText('50.0%');
  const marker=page.getByTestId('example-marker');
  const initial=Number(await marker.getAttribute('cx'));
  await page.getByRole('button',{name:'Example: buy YES',exact:true}).click();
  await expect(page.getByRole('button',{name:'Example: buy NO',exact:true})).toBeEnabled();
  expect(Number(await marker.getAttribute('cx'))).toBeLessThan(initial);
  const yesPrice=parseFloat(await page.getByTestId('example-probability').innerText());
  await page.getByRole('button',{name:'Example: buy NO',exact:true}).click();
  await expect(page.getByRole('button',{name:'Example: buy YES',exact:true})).toBeEnabled();
  expect(parseFloat(await page.getByTestId('example-probability').innerText())).toBeLessThan(yesPrice);
  await page.getByRole('button',{name:'Play walkthrough',exact:true}).click();
  await expect(page.locator('.example-trade-story')).toContainText('Example trader buys YES');
  await page.getByRole('button',{name:'Pause walkthrough',exact:true}).click();
  const paused=await marker.getAttribute('cx');
  await page.waitForTimeout(1000);
  expect(await marker.getAttribute('cx')).toBe(paused);
  await page.getByRole('button',{name:'Reset trade example',exact:true}).click();
  await expect(page.getByTestId('example-probability')).toHaveText('50.0%');
  expect(errors).toEqual([]);
});

test('walkthrough completes three trades, and the time example pauses without drifting',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'How it works',exact:true}).click();
  await page.getByRole('button',{name:'Play walkthrough',exact:true}).click();
  await expect(page.locator('.example-trade-story')).toContainText('Example trader buys NO',{timeout:15000});
  await expect(page.getByRole('button',{name:'Play walkthrough',exact:true})).toBeVisible();
  await page.locator('summary').filter({hasText:'Explore the Gaussian curve'}).click();
  const slider=page.getByRole('slider',{name:'Explore time to expiry'});
  await page.getByRole('button',{name:'Play time example',exact:true}).click();
  await expect(slider).not.toHaveValue('100');
  await page.getByRole('button',{name:'Pause time example',exact:true}).click();
  const paused=await slider.inputValue();
  await page.waitForTimeout(500);
  await expect(slider).toHaveValue(paused);
});

test('reduced motion uses deliberate steps and examples never submit wallet transactions',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  let transactions=0;
  page.on('request',r=>{if(r.method()==='POST'&&r.postData()?.includes('eth_sendTransaction'))transactions++;});
  await page.goto('/');
  await page.getByRole('button',{name:'How it works',exact:true}).click();
  await page.getByRole('button',{name:'Next example trade',exact:true}).click();
  await expect(page.getByTestId('example-probability')).not.toHaveText('50.0%');
  await page.locator('summary').filter({hasText:'Explore the Gaussian curve'}).click();
  await page.getByRole('button',{name:'Advance time example',exact:true}).click();
  await expect(page.getByRole('slider',{name:'Explore time to expiry'})).toHaveValue('75');
  expect(transactions).toBe(0);
});

test('history RPC failure leaves the actual price and trading controls available',async({page})=>{
  await page.route('http://127.0.0.1:8545/',async route=>{
    if(route.request().postDataJSON()?.method==='eth_getLogs')await route.abort();else await route.continue();
  });
  await page.goto('/');
  await expect(page.locator('.history-notice')).toContainText('could not be refreshed');
  await expect(page.getByTestId('market-probability')).not.toHaveText('—');
  await expect(page.getByRole('button',{name:'Connect to swap',exact:true})).toBeEnabled();
});

test('chart and explanation fit desktop and mobile; mobile keeps connect before the chart',async({page})=>{
  execFileSync(process.execPath,['scripts/deploy.mjs'],{stdio:'pipe'});
  await page.goto('/');
  await expect(page.getByText('Trading open',{exact:true})).toBeVisible();
  await buyYes(page, '90');
  await page.getByRole('button',{name:'Get NO',exact:true}).click();
  await page.getByRole('textbox',{name:'Amount to swap'}).fill('150');
  await page.getByRole('button',{name:'Swap YES for NO',exact:true}).click();
  await expect(page.locator('.recent-trades li')).toHaveCount(2);
  await page.getByRole('button',{name:'Disconnect wallet',exact:true}).click();
  fs.mkdirSync('.impeccable/review',{recursive:true});
  for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]] as const){
    await page.setViewportSize({width,height});
    await page.goto('/');
    await expect(page.getByText('Trading open',{exact:true})).toBeVisible();
    await expect(page.locator('.recent-trades li')).toHaveCount(2);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(name==='mobile')await expect(page.getByRole('button',{name:'Connect to swap',exact:true})).toBeInViewport();
    await page.screenshot({path:`.impeccable/review/charts-${name}.png`,fullPage:true});
    await page.getByRole('button',{name:'How it works',exact:true}).click();
    await page.getByRole('button',{name:'Example: buy YES',exact:true}).click();
    await expect(page.getByRole('button',{name:'Example: buy NO',exact:true})).toBeEnabled();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:`.impeccable/review/explainer-${name}.png`,fullPage:true});
    await page.locator('.trade-explainer').screenshot({path:`.impeccable/review/explainer-detail-${name}.png`});
  }
});
