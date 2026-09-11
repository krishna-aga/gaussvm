import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

test.beforeAll(() =>
  execFileSync(process.execPath, ["scripts/deploy.mjs"], { stdio: "pipe" }),
);

async function walletFixture(page: Page, local = false) {
  const d = JSON.parse(fs.readFileSync("deployments/local.json", "utf8"));
  const response = await page.request.post("http://127.0.0.1:8545", {
    data: { jsonrpc: "2.0", id: 1, method: "eth_accounts", params: [] },
  });
  const accounts = (await response.json()).result as string[];
  const rpc = "https://wallet-test.invalid/";
  await page.route(`${rpc}**`, async (route) => {
    const payload = route.request().postDataJSON();
    if (payload.method === "eth_chainId")
      return route.fulfill({
        json: { jsonrpc: "2.0", id: payload.id, result: "0xaa36a7" },
      });
    const result = await route.fetch({ url: "http://127.0.0.1:8545" });
    return route.fulfill({ response: result });
  });
  if (!local)
    await page.route("**/deployment.json", (route) =>
      route.fulfill({
        json: { ...d, chainId: 11155111, network: "Sepolia", rpcUrl: rpc },
      }),
    );
  await page.addInitScript(
    ({ accounts, rpc }) => {
      const w = window as any;
      const listeners = new Map<string, Set<(value: unknown) => void>>();
      const state = {
        accounts: [accounts[0]],
        chain: "0x1",
        unknownNetwork: false,
        rejectSwitch: false,
        changeOnSend: false,
        calls: [] as string[],
        sent: [] as string[],
        nextAccount: accounts[2],
      };
      const emit = (event: string, value: any) => {
        if (event === "accountsChanged") state.accounts = value;
        if (event === "chainChanged") state.chain = value;
        listeners.get(event)?.forEach((callback) => callback(value));
      };
      w.__walletTest = { state, emit };
      w.ethereum = {
        on(event: string, callback: (value: unknown) => void) {
          if (!listeners.has(event)) listeners.set(event, new Set());
          listeners.get(event)!.add(callback);
        },
        removeListener(event: string, callback: (value: unknown) => void) {
          listeners.get(event)?.delete(callback);
        },
        async request({
          method,
          params = [],
        }: {
          method: string;
          params?: any[];
        }) {
          state.calls.push(method);
          if (method === "eth_chainId") return state.chain;
          if (method === "eth_accounts") return state.accounts;
          if (method === "eth_requestAccounts") {
            emit("accountsChanged", state.accounts);
            setTimeout(() => {
              emit("accountsChanged", state.accounts);
              emit("chainChanged", state.chain);
            }, 300);
            return state.accounts;
          }
          if (method === "wallet_switchEthereumChain") {
            if (state.rejectSwitch)
              throw { code: 4001, message: "User rejected request" };
            if (state.unknownNetwork)
              throw { code: 4902, message: "Unrecognized chain" };
            emit("chainChanged", params[0].chainId);
            return null;
          }
          if (method === "wallet_addEthereumChain") {
            state.unknownNetwork = false;
            return null;
          }
          if (method === "eth_sendTransaction") {
            // Fixture-only chain translation: all writes execute on the local EVM.
            params = [{ ...params[0], chainId: undefined }];
          }
          const response = await fetch(rpc, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
          });
          const result = await response.json();
          if (result.error) throw new Error(result.error.message);
          if (method === "eth_sendTransaction") {
            state.sent.push(result.result);
            if (state.changeOnSend) {
              state.changeOnSend = false;
              emit("accountsChanged", [state.nextAccount]);
            }
          }
          return result.result;
        },
      };
    },
    { accounts, rpc },
  );
  await page.goto("/");
  await expect(page.getByText("Trading open", { exact: true })).toBeVisible();
  return accounts;
}
const short = (address: string) =>
  new RegExp(`${address.slice(0, 6)}…${address.slice(-4)}`, "i");

test("wallet connection tolerates setup/duplicate events and follows real account changes", async ({
  page,
}) => {
  const accounts = await walletFixture(page);
  await page.evaluate(() =>
    (window as any).__walletTest.emit("chainChanged", "0x1"),
  );
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Connect to swap", exact: true })
    .click();
  await expect(page.locator(".wallet-actions .account")).toContainText(
    short(accounts[0]),
  );
  await expect(
    page.getByRole("button", { name: "Swap NO for YES", exact: true }),
  ).toBeEnabled();
  await page.waitForTimeout(400); // Duplicate provider events arrive after connection.
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.evaluate(() => {
    const { state, emit } = (window as any).__walletTest;
    emit("accountsChanged", [state.accounts[0].toLowerCase()]);
    emit("chainChanged", "0xAA36A7");
  });
  await expect(
    page.getByRole("button", { name: "Swap NO for YES", exact: true }),
  ).toBeEnabled();
  await page.evaluate(
    (account) =>
      (window as any).__walletTest.emit("accountsChanged", [account]),
    accounts[2],
  );
  await expect(page.locator(".wallet-actions .account")).toContainText(
    short(accounts[2]),
  );
  await expect(
    page.getByRole("button", { name: "Get 100 YES + 100 NO", exact: true }),
  ).toBeEnabled();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.evaluate(() =>
    (window as any).__walletTest.emit("accountsChanged", []),
  );
  await expect(
    page.getByRole("button", { name: "Connect to swap", exact: true }),
  ).toBeEnabled();
  await page.evaluate(
    (account) =>
      (window as any).__walletTest.emit("accountsChanged", [account]),
    accounts[0],
  );
  await expect(
    page.getByRole("button", { name: "Connect to swap", exact: true }),
  ).toBeEnabled();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("wrong networks block writes and recover through switch/add or wallet events", async ({
  page,
}) => {
  await walletFixture(page);
  await page
    .getByRole("button", { name: "Connect to swap", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Swap NO for YES", exact: true }),
  ).toBeEnabled();
  await page.evaluate(() => {
    const t = (window as any).__walletTest;
    t.state.unknownNetwork = true;
    t.emit("chainChanged", "0x1");
  });
  await expect(
    page.getByRole("button", { name: "Swap NO for YES", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Switch to Sepolia", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Swap NO for YES", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(() => (window as any).__walletTest.state.calls),
  ).toContain("wallet_addEthereumChain");
  await page.evaluate(() => {
    const t = (window as any).__walletTest;
    t.state.rejectSwitch = true;
    t.emit("chainChanged", "0x1");
  });
  await page
    .getByRole("button", { name: "Switch to Sepolia", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("declined");
  await page.evaluate(() => {
    (window as any).__walletTest.state.rejectSwitch = false;
  });
  await page
    .getByRole("button", { name: "Switch to Sepolia", exact: true })
    .click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Swap NO for YES", exact: true }),
  ).toBeEnabled();
  await page.evaluate(() =>
    (window as any).__walletTest.emit("chainChanged", "0x1"),
  );
  await page.evaluate(() =>
    (window as any).__walletTest.emit("chainChanged", "0xaa36a7"),
  );
  await expect(
    page.getByRole("button", { name: "Swap NO for YES", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(() => (window as any).__walletTest.state.sent),
  ).toHaveLength(0);
});

test("account change after approval stops the following swap and preserves its receipt", async ({
  page,
}) => {
  const accounts = await walletFixture(page);
  await page
    .getByRole("button", { name: "Connect to swap", exact: true })
    .click();
  await page.evaluate(() => {
    (window as any).__walletTest.state.changeOnSend = true;
  });
  await page
    .getByRole("button", { name: "Swap NO for YES", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Wallet or position changed",
  );
  await expect(page.locator(".wallet-actions .account")).toContainText(
    short(accounts[2]),
  );
  await expect(page.locator(".journal-row")).toContainText("confirmed · Block");
  expect(
    await page.evaluate(() => (window as any).__walletTest.state.sent),
  ).toHaveLength(1);
  await expect(page.getByText("Swap NO → YES", { exact: true })).toHaveCount(0);
});

test("local demo sessions ignore unrelated injected-wallet events", async ({
  page,
}) => {
  await walletFixture(page, true);
  await page
    .getByRole("button", { name: "Connect to swap", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Disconnect wallet", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    (window as any).__walletTest.emit("accountsChanged", []);
    (window as any).__walletTest.emit("chainChanged", "0x1");
  });
  await expect(
    page.getByRole("button", { name: "Disconnect wallet", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
