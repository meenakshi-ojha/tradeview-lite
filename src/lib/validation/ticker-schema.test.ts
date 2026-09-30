import { describe, expect, test } from "bun:test";
import { tickerSchema } from "./ticker-schema";

describe("tickerSchema", () => {
  test("accepts a plain US ticker and uppercases it", () => {
    const result = tickerSchema.safeParse({ symbol: "aapl" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.symbol).toBe("AAPL");
  });

  test("accepts longer NSE-style tickers up to 10 chars", () => {
    // Regression test: max(5) used to silently reject TATACAP/HDFCBANK.
    for (const symbol of ["TATACAP", "HDFCBANK", "BAJFINANCE"]) {
      const result = tickerSchema.safeParse({ symbol });
      expect(result.success).toBe(true);
    }
  });

  test("rejects an empty or whitespace-only input", () => {
    expect(tickerSchema.safeParse({ symbol: "" }).success).toBe(false);
    expect(tickerSchema.safeParse({ symbol: "   " }).success).toBe(false);
  });

  test("rejects a symbol longer than 10 characters", () => {
    expect(tickerSchema.safeParse({ symbol: "TOOLONGTICKERNAME" }).success).toBe(false);
  });

  test("rejects non-letter characters", () => {
    expect(tickerSchema.safeParse({ symbol: "AAPL1" }).success).toBe(false);
    expect(tickerSchema.safeParse({ symbol: "AA-PL" }).success).toBe(false);
  });
});
