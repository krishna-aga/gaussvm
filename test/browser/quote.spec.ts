import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { toFunctionSelector } from "viem";

test.beforeAll(() =>
  execFileSync(process.execPath, ["scripts/deploy.mjs"], { stdio: "pipe" }),
);

test("an unchanged block does not restart a slow quote on balance refresh", async ({
  page,
}) => {
  const d = JSON.parse(fs.readFileSync("deployments/local.json", "utf8"));
  const selector = toFunctionSelector(
    "quote((address,uint256,bytes),uint256,bytes)",
  );
  let connectedQuotes = 0;
  await page.route("http://127.0.0.1:8545/", async (route) => {
    const payload = route.request().postDataJSON();
    const call = payload.params?.[0];
    if (
      payload.method === "eth_call" &&
      call?.data?.startsWith(selector) &&
      call?.from?.toLowerCase() !== d.maker.toLowerCase()
    ) {
      connectedQuotes++;
      // Longer than the 7-second balance poll, on a block that stays unchanged.
      if (connectedQuotes === 1)
        await new Promise((resolve) => setTimeout(resolve, 8500));
    }
    await route.continue();
  });
  await page.goto("/");
  await expect(page.getByText("Trading open", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Connect to swap", exact: true })
    .click();
  // Empty wallets still have a read-only quote prepared for token setup.
  await expect.poll(() => connectedQuotes).toBe(1);
  await page.waitForTimeout(9500);
  expect(connectedQuotes).toBe(1);
  await expect(page.getByRole("alert")).toHaveCount(0);
});
