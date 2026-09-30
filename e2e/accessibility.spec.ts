import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Regression guard for the WCAG contrast work done on the watchlist/stats
// cards - computed contrast ratios by hand once; this makes sure a future
// change can't silently reintroduce a failing ratio without a test noticing.
test.describe("Accessibility", () => {
  for (const path of ["/", "/markets", "/settings"]) {
    test(`${path} has no serious or critical axe violations`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical"
      );

      expect(
        serious,
        serious.map((v) => `${v.id}: ${v.description} (${v.nodes.length} node(s))`).join("\n")
      ).toHaveLength(0);
    });
  }
});
