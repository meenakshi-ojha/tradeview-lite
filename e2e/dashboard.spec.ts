import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("loads with sidebar nav, indices, stats, watchlist, and chart", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Markets" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();

    // Indices strip: 3 fixed reference cards, always mock regardless of toggle
    // .first(): "Nasdaq 100"/"Dow 30" also appear inside mock news headlines
    await expect(page.getByText("S&P 500").first()).toBeVisible();
    await expect(page.getByText("Nasdaq 100").first()).toBeVisible();
    await expect(page.getByText("Dow 30").first()).toBeVisible();

    // Stats bar
    await expect(page.getByText("Tracking")).toBeVisible();

    // Default watchlist
    await expect(page.getByText("AAPL", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("MSFT", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("NVDA", { exact: true }).first()).toBeVisible();

    // Chart panel defaults to the first row (AAPL)
    await expect(page.getByText("AAPL — price history")).toBeVisible();

    // News panel
    await expect(page.getByText("Market news")).toBeVisible();

    expect(errors, `Console/page errors: ${errors.join("; ")}`).toHaveLength(0);
  });

  test("clicking a watchlist row updates the chart", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-index="1"]').click(); // MSFT row
    await expect(page.getByText("MSFT — price history")).toBeVisible();
  });
});
