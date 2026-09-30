import type { RawQuote, RawPricePoint } from "@/lib/data-source";

// Real API mode — Financial Modeling Prep (FMP), free tier: 250 calls/day,
// 512MB bandwidth/30 days. Mock mode is the default everywhere precisely
// because this budget is small enough that dev/demo iteration could burn
// through it by accident.
//
// FMP has a genuine batch quote endpoint (unlike the per-symbol-only
// assumption the architecture doc's Round 2 review was built around) — one
// call covers the whole watchlist, not one call per ticker. That's strictly
// better than the DataLoader/TTL-cache design that assumption produced.
//
// Caching still applies exactly as designed: fetch() with { next: { revalidate } }
// only hits the Next.js Data Cache because this resolver runs inside a
// Next.js Route Handler via @as-integrations/next, not a standalone Apollo
// server outside Next's request lifecycle (the Round 3 fix).

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

export async function getQuotesFromRealSource(symbols: string[]): Promise<RawQuote[]> {
  const apiKey = process.env.MARKET_DATA_API_KEY;
  if (!apiKey || symbols.length === 0) {
    return symbols.map((symbol) => ({
      symbol,
      price: 0,
      change: 0,
      changePercent: 0,
      updatedAt: new Date().toISOString(),
      stale: false,
      error: "REAL_MODE_NOT_CONFIGURED",
    }));
  }

  try {
    // One batched call for the entire watchlist — 30s Data Cache TTL,
    // matching the design point in the architecture doc.
    const res = await fetch(`${FMP_BASE}/batch-quote?symbols=${symbols.join(",")}`, {
      headers: { apikey: apiKey },
      next: { revalidate: 30 },
    });

    if (res.status === 429) {
      return symbols.map((symbol) => ({
        symbol,
        price: 0,
        change: 0,
        changePercent: 0,
        updatedAt: new Date().toISOString(),
        stale: true,
        error: "RATE_LIMITED",
      }));
    }

    if (!res.ok) {
      throw new Error(`FMP responded ${res.status}`);
    }

    const data: FmpQuote[] = await res.json();
    const bySymbol = new Map(data.map((q) => [q.symbol, q]));

    return symbols.map((symbol) => {
      const q = bySymbol.get(symbol);
      if (!q) {
        return {
          symbol,
          price: 0,
          change: 0,
          changePercent: 0,
          updatedAt: new Date().toISOString(),
          stale: false,
          error: "UNKNOWN_SYMBOL",
        };
      }
      return toRawQuote(q);
    });
  } catch {
    return symbols.map((symbol) => ({
      symbol,
      price: 0,
      change: 0,
      changePercent: 0,
      updatedAt: new Date().toISOString(),
      stale: true,
      error: "FETCH_FAILED",
    }));
  }
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
