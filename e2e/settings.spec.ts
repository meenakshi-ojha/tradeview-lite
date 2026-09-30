import { test, expect } from "@playwright/test";

test.describe("Settings page", () => {
  test("shows the data-mode toggle and watchlist reset", async ({ page }) => {
    await page.goto("/settings");

    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByText("Mock mode is the default")).toBeVisible();
    // .first(): the mode toggle also persists in the sidebar footer across
    // every route, so it's on-screen twice here.
    await expect(page.getByRole("button", { name: "Switch to Real" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset to default watchlist" })).toBeVisible();
  });

  test("reset restores the default watchlist after edits", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Remove" }).first().click();

    await page.goto("/settings");
    await expect(page.getByText(/Currently tracking 2 symbols/)).toBeVisible();

    await page.getByRole("button", { name: "Reset to default watchlist" }).click();
    await expect(page.getByText(/Currently tracking 3 symbols: AAPL, MSFT, NVDA/)).toBeVisible();
  });
});
