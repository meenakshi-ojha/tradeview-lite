import { afterEach, describe, expect, mock, test } from "bun:test";
import { getHistoryFromRealSource, getQuotesFromRealSource } from "./real-data-source";

const originalFetch = globalThis.fetch;
const originalKey = process.env.MARKET_DATA_API_KEY;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.MARKET_DATA_API_KEY;
  else process.env.MARKET_DATA_API_KEY = originalKey;
});

describe("getQuotesFromRealSource", () => {
  test("returns REAL_MODE_NOT_CONFIGURED and never calls fetch when no API key is set", async () => {
    delete process.env.MARKET_DATA_API_KEY;
    const fetchSpy = mock(async () => new Response("[]"));
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const quotes = await getQuotesFromRealSource(["AAPL", "MSFT"]);
    expect(quotes.every((q) => q.error === "REAL_MODE_NOT_CONFIGURED")).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("maps a successful response, including FMP's changePercentage -> changePercent rename", async () => {
    process.env.MARKET_DATA_API_KEY = "test-key";
    globalThis.fetch = mock(
      async () =>
        new Response(
          JSON.stringify([
            { symbol: "AAPL", price: 233.5, change: 1.2, changePercentage: 0.52, timestamp: 1700000000 },
          ]),
          { status: 200 }
        )
    ) as unknown as typeof fetch;

    const [quote] = await getQuotesFromRealSource(["AAPL"]);
    expect(quote.price).toBe(233.5);
    expect(quote.changePercent).toBe(0.52);
    expect(quote.error).toBeNull();
  });

  test("maps HTTP 402 to UNKNOWN_SYMBOL, not a fatal error", async () => {
    // Regression test: FMP's free tier returns 402 (not 404/empty) for a
    // symbol it won't serve - verified against the live API in Round 7.
    process.env.MARKET_DATA_API_KEY = "test-key";
    globalThis.fetch = mock(async () => new Response("", { status: 402 })) as unknown as typeof fetch;

    const [quote] = await getQuotesFromRealSource(["ZZZZ"]);
    expect(quote.error).toBe("UNKNOWN_SYMBOL");
  });

  test("maps HTTP 429 to RATE_LIMITED and marks the quote stale", async () => {
    process.env.MARKET_DATA_API_KEY = "test-key";
    globalThis.fetch = mock(async () => new Response("", { status: 429 })) as unknown as typeof fetch;

    const [quote] = await getQuotesFromRealSource(["AAPL"]);
    expect(quote.error).toBe("RATE_LIMITED");
    expect(quote.stale).toBe(true);
  });

  test("maps a thrown network error to FETCH_FAILED", async () => {
    process.env.MARKET_DATA_API_KEY = "test-key";
    globalThis.fetch = mock(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    const [quote] = await getQuotesFromRealSource(["AAPL"]);
    expect(quote.error).toBe("FETCH_FAILED");
    expect(quote.stale).toBe(true);
  });
});

describe("getHistoryFromRealSource", () => {
  test("returns an empty array when no API key is set", async () => {
    delete process.env.MARKET_DATA_API_KEY;
    expect(await getHistoryFromRealSource("AAPL")).toEqual([]);
  });

  test("reverses FMP's newest-first response into chronological order", async () => {
    process.env.MARKET_DATA_API_KEY = "test-key";
    globalThis.fetch = mock(
      async () =>
        new Response(
          JSON.stringify([
            { date: "2026-09-30", price: 340 },
            { date: "2026-09-29", price: 330 },
          ]),
          { status: 200 }
        )
    ) as unknown as typeof fetch;

    const points = await getHistoryFromRealSource("AAPL", 30);
    expect(points[0].timestamp).toBe("2026-09-29");
    expect(points[1].timestamp).toBe("2026-09-30");
  });
});
