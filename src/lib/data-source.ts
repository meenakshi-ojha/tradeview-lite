// Mock data source shaped exactly like the real Finnhub calls will be.
// When a real API key exists, only getQuoteFromSource and getHistoryFromSource
// change (swap the mock body for a fetch() with { next: { revalidate } }) —
// nothing in the GraphQL schema or resolvers needs to change.

export type RawQuote = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  updatedAt: string;
  stale: boolean;
  error: string | null;
};

export type RawPricePoint = {
  timestamp: string;
  price: number;
};

// A small fixed universe so mock prices are stable-ish across polls.
const MOCK_BASE_PRICES: Record<string, number> = {
  AAPL: 232.5,
  MSFT: 428.1,
  GOOGL: 172.3,
  AMZN: 186.9,
  NVDA: 132.4,
  TSLA: 248.7,
  META: 561.2,
  NFLX: 712.8,
};

function seededJitter(symbol: string, seed: number) {
  // Cheap deterministic-ish pseudo-random walk so a symbol's price wobbles
  // realistically across polls instead of being pure static or pure noise.
  const t = Date.now() / 1000 + seed;
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) hash = (hash * 31 + symbol.charCodeAt(i)) % 100000;
  return Math.sin(t / 15 + hash) * 0.6;
}

/**
 * Mock stand-in for: fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}`, { next: { revalidate: 30 } })
 * Simulates: an invalid symbol (unknown ticker) and an occasional rate-limited/stale response,
 * so the UI's error/empty/rate-limited states have something real to render against now,
 * before a real API key exists.
 */
export async function getQuoteFromSource(symbol: string): Promise<RawQuote> {
  const base = MOCK_BASE_PRICES[symbol];

  if (!base) {
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

  // Simulate an occasional rate-limited response (~1 in 20 fetches) —
  // real behavior once Finnhub is wired in: show stale cached data + a badge,
  // not a hard error.
  const rateLimited = Math.random() < 0.05;

  const jitter = seededJitter(symbol, 0);
  const price = Math.max(0.01, base + jitter);
  const change = jitter;
  const changePercent = (jitter / base) * 100;

  return {
    symbol,
    price: Number(price.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    updatedAt: new Date().toISOString(),
    stale: rateLimited,
    error: rateLimited ? "RATE_LIMITED" : null,
  };
}

/**
 * Mock stand-in for a Finnhub candle/history call, cached with a much longer
 * TTL than quotes (hours, not seconds) once real data is wired in.
 */
export async function getHistoryFromSource(symbol: string): Promise<RawPricePoint[]> {
  const base = MOCK_BASE_PRICES[symbol];
  if (!base) return [];

  const points: RawPricePoint[] = [];
  const now = Date.now();
  let price = base * (0.94 + Math.random() * 0.05);

  for (let i = 30; i >= 0; i--) {
    price += (Math.random() - 0.48) * base * 0.01;
    points.push({
      timestamp: new Date(now - i * 24 * 60 * 60 * 1000).toISOString(),
      price: Number(Math.max(0.01, price).toFixed(2)),
    });
  }
  return points;
}

export const KNOWN_SYMBOLS = Object.keys(MOCK_BASE_PRICES);
