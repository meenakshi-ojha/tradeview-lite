import { test, expect } from "@playwright/test";

test.describe("Watchlist management", () => {
  test("adding a suggested ticker adds a new row", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("combobox", { name: "Add ticker" }).click();
    await page.getByRole("option", { name: "GOOGL" }).click();

    await expect(page.locator("table, [data-index]").getByText("GOOGL", { exact: true }).first()).toBeVisible();
  });

  test("typing an unsuggested but valid symbol adds it via free entry", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("combobox", { name: "Add ticker" }).click();
    await page.getByPlaceholder("Search or type a symbol...").fill("HDFCBANK");
    await page.getByRole("button", { name: 'Add "HDFCBANK"' }).click();

    // Not in the mock universe, so it shows as an unknown symbol rather
    // than disappearing or crashing - regression check for the ticker
    // length-validation bug (max(5) used to reject anything over 5 chars).
    await expect(page.getByText("HDFCBANK", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Unknown symbol")).toBeVisible();
  });

  test("removing a ticker removes its row", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Remove" }).first().click();

    const trackingLabel = page.getByText("Tracking", { exact: true });
    await expect(trackingLabel.locator("..")).toContainText("2");
  });
});
