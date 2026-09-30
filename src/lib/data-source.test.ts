import { describe, expect, test } from "bun:test";
import {
  getCandlesFromSource,
  getHistoryFromSource,
  getMockNews,
  getQuoteFromSource,
  INDEX_SYMBOLS,
  KNOWN_SYMBOLS,
} from "./data-source";

describe("getQuoteFromSource", () => {
  test("returns UNKNOWN_SYMBOL for a symbol outside the mock universe", async () => {
    const quote = await getQuoteFromSource("NOTAREALTICKER");
    expect(quote.error).toBe("UNKNOWN_SYMBOL");
    expect(quote.price).toBe(0);
  });

  test("returns a valid quote shape for a known symbol", async () => {
    const quote = await getQuoteFromSource("AAPL");
    expect(quote.symbol).toBe("AAPL");
    // ~5% of calls are simulated as rate-limited by design - both branches
    // of that designed behavior are valid, so assert the invariant rather
    // than one specific (flaky) outcome.
    if (quote.error === null) {
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.stale).toBe(false);
    } else {
      expect(quote.error).toBe("RATE_LIMITED");
      expect(quote.stale).toBe(true);
    }
  });

  test("index symbols resolve through the same mock universe", async () => {
    for (const symbol of INDEX_SYMBOLS) {
      const quote = await getQuoteFromSource(symbol);
      expect(quote.error === null || quote.error === "RATE_LIMITED").toBe(true);
    }
  });
});

describe("getHistoryFromSource", () => {
  test("returns an empty array for an unknown symbol", async () => {
    expect(await getHistoryFromSource("NOTAREALTICKER")).toEqual([]);
  });

  test("returns days+1 points in ascending chronological order", async () => {
    const points = await getHistoryFromSource("AAPL", 10);
    expect(points).toHaveLength(11);
    for (let i = 1; i < points.length; i++) {
      expect(new Date(points[i].timestamp).getTime()).toBeGreaterThan(
        new Date(points[i - 1].timestamp).getTime()
      );
    }
  });
});

describe("getCandlesFromSource", () => {
  test("returns an empty array for an unknown symbol", async () => {
    expect(await getCandlesFromSource("NOTAREALTICKER")).toEqual([]);
  });

  test("every candle's high/low bounds its open and close", async () => {
    const candles = await getCandlesFromSource("AAPL", 15);
    expect(candles.length).toBeGreaterThan(0);
    for (const c of candles) {
      expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close));
      expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close));
    }
  });
});

describe("getMockNews", () => {
  test("returns headlines with valid past timestamps", () => {
    const news = getMockNews();
    expect(news.length).toBeGreaterThan(0);
    for (const item of news) {
      expect(new Date(item.publishedAt).getTime()).toBeLessThanOrEqual(Date.now());
    }
  });
});

describe("symbol universe", () => {
  test("KNOWN_SYMBOLS and INDEX_SYMBOLS don't overlap", () => {
    // Markets/watchlist symbols vs. the fixed indices strip should stay
    // distinct sets - an index accidentally addable to the watchlist (or
    // vice versa) would be a real bug, not just a cosmetic one.
    for (const s of INDEX_SYMBOLS) {
      expect(KNOWN_SYMBOLS).not.toContain(s);
    }
  });
});
