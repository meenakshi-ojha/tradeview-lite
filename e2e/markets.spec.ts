import { test, expect } from "@playwright/test";

test.describe("Markets page", () => {
  test("renders the known symbol universe", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/markets");

    await expect(page.getByRole("heading", { name: "Markets" })).toBeVisible();
    for (const symbol of ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "NFLX"]) {
      await expect(page.getByText(symbol, { exact: true })).toBeVisible();
    }

    // AAPL/MSFT/NVDA start in the default watchlist - already "Added"
    await expect(page.getByRole("button", { name: /AAPL already in watchlist/ })).toBeVisible();

    expect(errors, `Page errors: ${errors.join("; ")}`).toHaveLength(0);
  });

  test("clicking the price/sparkline area opens a chart modal", async ({ page }) => {
    await page.goto("/markets");

    // The Add button and the open-chart region are separate controls (a
    // button can't legally nest inside another button) - clicking the
    // price area, not the Add button, should be what opens the modal.
    const googlSymbol = page.getByText("GOOGL", { exact: true });
    const googlCard = googlSymbol.locator("xpath=ancestor::div[contains(@data-slot,'card-content')]");
    await googlCard.getByRole("button").last().click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("GOOGL — price history")).toBeVisible();
  });

  test("Add button adds to watchlist without opening the modal", async ({ page }) => {
    await page.goto("/markets");
    await page.getByRole("button", { name: "Add GOOGL to watchlist" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByRole("button", { name: /GOOGL already in watchlist/ })).toBeVisible();
  });
});
