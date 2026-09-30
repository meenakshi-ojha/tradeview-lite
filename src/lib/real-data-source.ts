import type { RawQuote, RawPricePoint } from "@/lib/data-source";

// Real API mode — Financial Modeling Prep (FMP), free tier: 250 calls/day,
// 512MB bandwidth/30 days. Mock mode is the default everywhere precisely
// because this budget is small enough that dev/demo iteration could burn
// through it by accident.
//
// Round 7 correction: `batch-quote` (what Round 2/6 assumed was free) is
// actually a paid-plan-only endpoint — it returns HTTP 402 on the free tier,
// which is exactly the "fetch failed" the user hit testing REAL mode for
// real. The free tier only has single-symbol `/stable/quote?symbol=X`, so
// this is back to one call per symbol, verified directly against the live
// API (see docs/architecture.html Round 7).
//
// FMP's free tier also returns 402 (not 404 or an empty array) for a symbol
// it won't serve — verified against a deliberately-fake ticker — so a
// per-symbol 402 is treated as UNKNOWN_SYMBOL, not a fatal error.
//
// Caching still applies exactly as designed: fetch() with { next: { revalidate } }
// only hits the Next.js Data Cache because this resolver runs inside a
// Next.js Route Handler via @as-integrations/next, not a standalone Apollo
// server outside Next's request lifecycle (the Round 3 fix). With no batch
// endpoint, N symbols = N provider calls per revalidate window, so the
// window is 60s here (not 30s) and REAL mode's client poll is disabled
// entirely (see watchlist-table.tsx / stats-bar.tsx / markets-grid.tsx) —
// otherwise a handful of symbols polling every 30s would burn the 250/day
// quota within an hour.

const FMP_BASE = "https://financialmodelingprep.com/stable";

type FmpQuote = {
  symbol: string;
  price: number;
  change: number;
  changePercentage: number; // FMP's field name — not "changePercent"
  timestamp?: number;
};

function toRawQuote(q: FmpQuote): RawQuote {
  return {
    symbol: q.symbol,
    price: q.price,
    change: q.change,
    changePercent: q.changePercentage,
    updatedAt: q.timestamp ? new Date(q.timestamp * 1000).toISOString() : new Date().toISOString(),
    stale: false,
    error: null,
  };
}

function errorQuote(symbol: string, error: string, stale = false): RawQuote {
  return {
    symbol,
    price: 0,
    change: 0,
    changePercent: 0,
    updatedAt: new Date().toISOString(),
    stale,
    error,
  };
}

async function fetchOneQuote(symbol: string, apiKey: string): Promise<RawQuote> {
  try {
    // 60s, not 30s: with no batch endpoint, every symbol is its own
    // provider call, so the cache window is the only thing standing
    // between a few watchlist symbols and burning the daily quota.
    const res = await fetch(`${FMP_BASE}/quote?symbol=${symbol}`, {
      headers: { apikey: apiKey },
      next: { revalidate: 60 },
    });

    if (res.status === 429) return errorQuote(symbol, "RATE_LIMITED", true);
    // FMP's free tier returns 402 for symbols it won't serve on this plan,
    // not 404 or an empty array — verified against a deliberately-fake
    // ticker. Treat it as unknown rather than a fatal fetch error.
    if (res.status === 402) return errorQuote(symbol, "UNKNOWN_SYMBOL");
    if (!res.ok) return errorQuote(symbol, "FETCH_FAILED", true);

    const data: FmpQuote[] = await res.json();
    if (data.length === 0) return errorQuote(symbol, "UNKNOWN_SYMBOL");
    return toRawQuote(data[0]);
  } catch {
    return errorQuote(symbol, "FETCH_FAILED", true);
  }
}

export async function getQuotesFromRealSource(symbols: string[]): Promise<RawQuote[]> {
  const apiKey = process.env.MARKET_DATA_API_KEY;
  if (!apiKey || symbols.length === 0) {
    return symbols.map((symbol) => errorQuote(symbol, "REAL_MODE_NOT_CONFIGURED"));
  }

  return Promise.all(symbols.map((symbol) => fetchOneQuote(symbol, apiKey)));
}

export async function getHistoryFromRealSource(symbol: string): Promise<RawPricePoint[]> {
  const apiKey = process.env.MARKET_DATA_API_KEY;
  if (!apiKey) return [];

  try {
    // Long TTL (1hr) — intraday history barely changes, no reason to
    // refetch it every poll. FMP has no batch history endpoint, but this
    // only ever runs for the single selected ticker, on click, not per-poll.
    const res = await fetch(`${FMP_BASE}/historical-price-eod/light?symbol=${symbol}`, {
      headers: { apikey: apiKey },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const data: Array<{ date: string; price: number }> = await res.json();
    return data
      .slice(0, 30)
      .reverse()
      .map((d) => ({ timestamp: d.date, price: d.price }));
  } catch {
    return [];
  }
}
