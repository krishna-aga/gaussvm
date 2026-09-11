import { test, expect } from "@playwright/test";
import fs from "node:fs";

test("desktop: real trade, LP controls, lifecycle and chain failure handling", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByText("Trading open", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Swap outcomes", exact: true }),
  ).toBeHidden();
  await page
    .getByRole("button", { name: "Connect demo wallet", exact: true })
    .click();
  await page.getByRole("button", { name: "Prepare 100 test sets" }).click();
  await expect(
    page.getByRole("button", { name: "Swap NO for YES", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Swap NO for YES", exact: true })
    .click();
  await expect(page.getByText("Swap NO → YES", { exact: true })).toBeVisible();
  await expect(page.getByText(/confirmed · Block/).last()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Swap NO for YES", exact: true }),
  ).toBeEnabled();
  fs.mkdirSync(".impeccable/review", { recursive: true });
  await page.screenshot({
    path: ".impeccable/review/desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Get NO", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Swap YES for NO", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Swap YES for NO", exact: true })
    .click();
  await expect(page.getByText("Swap YES → NO", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Liquidity", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Liquidity stays with you." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Merge 10 pairs", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Merge 10 pairs", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "The research", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "The static invariant" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Market", exact: true }).click();
  await page.getByRole("textbox", { name: "Amount to swap" }).fill("999999");
  await expect(page.getByText(/You need more YES tokens/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Swap YES for NO", exact: true }),
  ).toBeDisabled();
  await page.getByRole("textbox", { name: "Amount to swap" }).fill("10");
  expect(errors).toEqual([]);
  // A failed RPC must not leave the previously healthy execution controls enabled.
  await page.route("http://127.0.0.1:8545/", (route) => route.abort());
  await expect(page.getByText("Chain connection needs attention")).toBeVisible({
    timeout: 15000,
  });
  await expect(
    page.getByRole("button", { name: "Swap YES for NO", exact: true }),
  ).toBeDisabled();
});

test("mobile: readable layout, reduced motion, illustration and research navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByText("Trading open", { exact: true })).toBeVisible();
  await page.getByRole("slider", { name: "Explore time to expiry" }).fill("25");
  await expect(page.getByText("25% remaining", { exact: true })).toBeVisible();
  await expect(page.getByTestId("quote")).not.toHaveText("—");
  await expect(page.getByTestId("quote").locator("svg")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".impeccable/review/mobile.png",
    fullPage: true,
  });
  await page.getByRole('button',{name:'Swap outcomes',exact:true}).click();
  await expect(page.locator('#trade-panel')).toBeFocused();
  await page.getByRole("button", { name: "The research", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "From a paper to a position." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("unconfigured deployment shows an honest research preview", async ({
  page,
}) => {
  await page.route("**/deployment.json", (route) =>
    route.fulfill({ status: 404, body: "Not deployed" }),
  );
  await page.goto("/");
  await expect(
    page.getByText("Explore the curve, then run it locally."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Connect to swap", exact: true }),
  ).toBeDisabled();
  await expect(page.getByTestId("quote")).toHaveText("—");
});

test('submitted transaction survives receipt-watcher failure and can be reconciled',async({page})=>{
  await page.goto('/');
  await expect(page.getByText('Trading open',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Connect demo wallet',exact:true}).click();
  await page.getByRole('button',{name:'Liquidity',exact:true}).click();
  let failReceipt=true;
  await page.route('http://127.0.0.1:8545/',async route=>{
    const data=route.request().postDataJSON();
    if(data.method==='eth_getTransactionReceipt'&&failReceipt){
      return route.fulfill({contentType:'application/json',body:JSON.stringify({jsonrpc:'2.0',id:data.id,error:{code:-32000,message:'Injected receipt watcher outage'}})});
    }
    return route.continue();
  });
  await page.getByRole('button',{name:'Merge 10 pairs',exact:true}).click();
  await expect(page.getByText('Confirmation unavailable',{exact:true})).toBeVisible({timeout:70000});
  await expect(page.getByRole('button',{name:'Merge 10 pairs',exact:true})).toBeDisabled();
  failReceipt=false;
  await page.getByRole('button',{name:'Check receipt',exact:true}).click();
  await expect(page.getByText('Confirmation unavailable',{exact:true})).toHaveCount(0);
  await expect(page.getByText(/confirmed · Block/)).toBeVisible();
  await expect(page.getByRole('button',{name:'Merge 10 pairs',exact:true})).toBeEnabled();
});

test('maker can ship and dock a position, resolve at expiry, and redeem through the UI',async({page})=>{
  await page.goto('/');
  await expect(page.getByText('Trading open',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Connect demo wallet',exact:true}).click();
  await page.getByRole('button',{name:'Liquidity',exact:true}).click();
  await page.getByRole('button',{name:'Use the local maker wallet',exact:true}).click();
  await page.getByRole('checkbox',{name:'Use experimental time scaling'}).check();
  await page.getByRole('button',{name:'Approve & ship position'}).click();
  await expect(page.getByText('Time-scaled',{exact:false}).first()).toBeVisible();
  await page.getByRole('button',{name:'Liquidity',exact:true}).click();
  await page.getByRole('button',{name:'Close active position',exact:true}).click();
  await expect(page.getByRole('button',{name:'Close active position',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Advance to expiry',exact:true}).click();
  await expect(page.getByRole('button',{name:'Resolve YES',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Resolve YES',exact:true}).click();
  await expect(page.getByRole('button',{name:'Redeem all outcomes',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Redeem all outcomes',exact:true}).click();
  await expect(page.getByRole('button',{name:'Redeem all outcomes',exact:true})).toBeDisabled();
  await expect(page.getByText('Redeem outcomes',{exact:true})).toBeVisible();
});
