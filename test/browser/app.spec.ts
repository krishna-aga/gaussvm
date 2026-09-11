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
    page
      .getByRole("list", { name: "Swap progress" })
      .locator('[aria-current="step"]'),
  ).toHaveText("1Connect");
  await expect(page.getByRole("slider")).toHaveCount(0);
  fs.mkdirSync(".impeccable/review", { recursive: true });
  await page.screenshot({
    path: ".impeccable/review/desktop-entry.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Connect to swap", exact: true })
    .click();
  await expect(
    page
      .getByRole("list", { name: "Swap progress" })
      .locator('[aria-current="step"]'),
  ).toHaveText("2Get tokens");
  await page.getByRole("button", { name: "Get 100 YES + 100 NO" }).click();
  await expect(
    page
      .getByRole("list", { name: "Swap progress" })
      .locator('[aria-current="step"]'),
  ).toHaveText("3Swap");
  await expect(
    page.getByRole("button", { name: "Swap NO for YES", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Swap NO for YES", exact: true })
    .click();
  await expect(page.getByText("Swap NO → YES", { exact: true })).toBeVisible();
  await expect(page.getByText(/confirmed · Block/).last()).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "Swap confirmed." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Swap NO for YES", exact: true }),
  ).toBeEnabled();
  fs.mkdirSync(".impeccable/review", { recursive: true });
  await page.screenshot({
    path: ".impeccable/review/desktop.png",
    fullPage: true,
  });
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download receipts", exact: true })
    .click();
  const file = await downloaded;
  const exported = JSON.parse(fs.readFileSync((await file.path())!, "utf8"));
  expect(exported.chainId).toBe(31337);
  expect(
    exported.transactions.some(
      (tx: { label: string; state: string; block: string }) =>
        tx.label === "Swap NO → YES" && tx.state === "confirmed" && tx.block,
    ),
  ).toBe(true);
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
  await page.getByRole("button", { name: "How it works", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "The static invariant" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Swap", exact: true }).click();
  await page.getByRole("textbox", { name: "Amount to swap" }).fill("999999");
  await expect(page.getByText(/Your YES balance is too low/)).toBeVisible();
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
  const connect = page.getByRole("button", {
    name: "Connect to swap",
    exact: true,
  });
  await expect(connect).toBeInViewport();
  expect(
    await connect.evaluate((element) => element.getBoundingClientRect().height),
  ).toBeGreaterThanOrEqual(44);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".impeccable/review/mobile-entry.png",
    fullPage: true,
  });
  await connect.click();
  await expect(page.getByTestId("quote")).not.toHaveText("—");
  await expect(page.getByTestId("quote").locator("svg")).toHaveCount(0);
  await page.screenshot({
    path: ".impeccable/review/mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "How it works", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "From a paper to a position." }),
  ).toBeVisible();
  await expect(
    page.getByRole("slider", { name: "Explore time to expiry" }),
  ).toBeHidden();
  await page
    .locator("summary")
    .filter({ hasText: "Explore the Gaussian curve" })
    .click();
  await page.getByRole("slider", { name: "Explore time to expiry" }).fill("25");
  await expect(page.getByText("25% remaining", { exact: true })).toBeVisible();
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
  await expect(page.getByTestId("quote")).toHaveCount(0);
});

test("submitted transaction survives receipt-watcher failure and can be reconciled", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Trading open", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Connect to swap", exact: true })
    .click();
  await page.getByRole("button", { name: "Liquidity", exact: true }).click();
  let failReceipt = true;
  await page.route("http://127.0.0.1:8545/", async (route) => {
    const data = route.request().postDataJSON();
    if (data.method === "eth_getTransactionReceipt" && failReceipt) {
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: data.id,
          error: { code: -32000, message: "Injected receipt watcher outage" },
        }),
      });
    }
    return route.continue();
  });
  await page
    .getByRole("button", { name: "Merge 10 pairs", exact: true })
    .click();
  await expect(page.getByText(/^Confirmation unavailable/)).toBeVisible({
    timeout: 70000,
  });
  await expect(
    page.getByRole("button", { name: "Merge 10 pairs", exact: true }),
  ).toBeDisabled();
  const storedHash = await page
    .locator(".journal-row button[title]")
    .first()
    .getAttribute("title");
  await page.reload();
  await expect(page.getByText(/^Confirmation unavailable/)).toBeVisible();
  await expect(
    page.locator(".journal-row button[title]").first(),
  ).toHaveAttribute("title", storedHash!);
  await page
    .getByRole("button", { name: "Connect to swap", exact: true })
    .click();
  await page.getByRole("button", { name: "Liquidity", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Merge 10 pairs", exact: true }),
  ).toBeDisabled();
  failReceipt = false;
  await page
    .getByRole("button", { name: "Check receipt", exact: true })
    .click();
  await expect(page.getByText(/^Confirmation unavailable/)).toHaveCount(0);
  await expect(page.getByText(/confirmed · Block/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Merge 10 pairs", exact: true }),
  ).toBeEnabled();
});

test("malformed configuration shows recovery instructions without crashing", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const manifest = JSON.parse(
    fs.readFileSync("deployments/local.json", "utf8"),
  );
  await page.route("**/deployment.json", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ ...manifest, rpcUrl: "not a URL" }),
    }),
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "Deployment configuration is invalid",
  );
  await expect(
    page.getByRole("button", { name: "Connect to swap", exact: true }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});

test("wallet cancellation stops token preparation and survives reload as cancelled", async ({
  page,
}) => {
  const rpcUrl = "http://127.0.0.1:8545";
  const rpc = async (method: string, params: unknown[] = []) => {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    expect(data.error).toBeUndefined();
    return data.result;
  };
  await page.goto("/");
  await expect(page.getByText("Trading open", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Connect to swap", exact: true })
    .click();
  const prepare = page.getByRole("button", {
    name: "Get 100 YES + 100 NO",
    exact: true,
  });
  if (await prepare.isVisible()) await prepare.click();
  await expect(
    page.getByRole("button", { name: "Swap NO for YES", exact: true }),
  ).toBeEnabled();
  await page
    .locator("summary")
    .filter({ hasText: "Your balances & test tokens" })
    .click();
  await expect(
    page.getByRole("button", { name: "Get more test tokens", exact: true }),
  ).toBeVisible();
  const manifest = JSON.parse(
    fs.readFileSync("deployments/local.json", "utf8"),
  );
  const [, account] = await rpc("eth_accounts");
  const balance = () =>
    rpc("eth_call", [
      {
        to: manifest.yes,
        data: `0x70a08231${account.slice(2).padStart(64, "0")}`,
      },
      "latest",
    ]);
  const before = await balance();
  const splitCount = await page
    .getByText("Split 100 complete sets", { exact: true })
    .count();
  let originalHash = "",
    observedPending = false;
  await page.route(`${rpcUrl}/`, async (route) => {
    const payload = route.request().postDataJSON();
    if (payload.method === "eth_sendTransaction") {
      const response = await route.fetch();
      const json = await response.json();
      originalHash = json.result;
      return route.fulfill({ response });
    }
    if (
      payload.method === "eth_getTransactionByHash" &&
      payload.params[0] === originalHash
    ) {
      const response = await route.fetch();
      await route.fulfill({ response });
      observedPending = true;
      return;
    }
    return route.continue();
  });
  try {
    await rpc("evm_setAutomine", [false]);
    await page
      .getByRole("button", { name: "Get more test tokens", exact: true })
      .click();
    await expect.poll(() => observedPending).toBe(true);
    const original = await rpc("eth_getTransactionByHash", [originalHash]);
    const bump = (value: string) =>
      `0x${(BigInt(value) * 2n + 1n).toString(16)}`;
    const replacementHash = await rpc("eth_sendTransaction", [
      {
        from: account,
        to: account,
        value: "0x0",
        gas: "0x5208",
        nonce: original.nonce,
        maxFeePerGas: bump(original.maxFeePerGas),
        maxPriorityFeePerGas: bump(original.maxPriorityFeePerGas),
      },
    ]);
    await rpc("evm_mine");
    await expect(page.getByText(/cancelled · Block/)).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole("alert")).toContainText(
      "original action was not completed",
    );
    expect(await balance()).toBe(before);
    expect(
      await page.getByText("Split 100 complete sets", { exact: true }).count(),
    ).toBe(splitCount);
    await page.reload();
    await expect(page.getByText(/cancelled · Block/)).toBeVisible();
    await expect(
      page.locator(".journal-row button[title]").first(),
    ).toHaveAttribute("title", replacementHash);
    await expect(
      page.getByText("Swap confirmed.", { exact: false }),
    ).toHaveCount(0);
  } finally {
    await rpc("evm_setAutomine", [true]);
    await rpc("evm_mine");
  }
});

test("maker can ship and dock a position, resolve at expiry, and redeem through the UI", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Trading open", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Connect to swap", exact: true })
    .click();
  await page.getByRole("button", { name: "Liquidity", exact: true }).click();
  await page
    .getByRole("button", { name: "Use the local maker wallet", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Use experimental time scaling" })
    .check();
  await page.getByRole("button", { name: "Approve & ship position" }).click();
  await expect(
    page.getByText("Ship 100 YES + 100 NO", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".journal-row").filter({ hasText: "Ship 100 YES + 100 NO" }),
  ).toContainText("confirmed · Block");
  await page.getByRole("button", { name: "Liquidity", exact: true }).click();
  await expect(
    page.getByText("Time-scaled", { exact: false }).first(),
  ).toBeVisible();
  const selected = await page
    .getByRole("combobox", { name: "Trading position" })
    .inputValue();
  await page.reload();
  await page.getByRole("button", { name: "Liquidity", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Trading position" }),
  ).toHaveValue(selected);
  const picker = page.getByRole("combobox", { name: "Trading position" });
  await expect(picker.locator("option")).toHaveCount(2);
  await expect(picker).toBeEnabled();
  await picker.selectOption({ index: 0 });
  await expect(
    page.getByRole("region", { name: "Position reserves" }),
  ).toContainText("Static");
  await expect(picker).toBeEnabled();
  await picker.selectOption(selected);
  await expect(
    page.getByRole("region", { name: "Position reserves" }),
  ).toContainText("Time-scaled");
  await page.screenshot({
    path: ".impeccable/review/saved-position-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".impeccable/review/saved-position-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page
    .getByRole("button", { name: "Use the local maker wallet", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Close active position", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Close active position", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Advance to expiry", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Resolve YES", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Resolve YES", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Redeem all outcomes", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Redeem all outcomes", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Redeem all outcomes", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("Redeem outcomes", { exact: true }),
  ).toBeVisible();
});
