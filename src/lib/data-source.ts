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
export async function getHistoryFromSource(symbol: string, days = 30): Promise<RawPricePoint[]> {
  const base = MOCK_BASE_PRICES[symbol];
  if (!base) return [];

  const points: RawPricePoint[] = [];
  const now = Date.now();
  let price = base * (0.94 + Math.random() * 0.05);

  for (let i = days; i >= 0; i--) {
    price += (Math.random() - 0.48) * base * 0.01;
    points.push({
      timestamp: new Date(now - i * 24 * 60 * 60 * 1000).toISOString(),
      price: Number(Math.max(0.01, price).toFixed(2)),
    });
  }
  return points;
}

export const KNOWN_SYMBOLS = Object.keys(MOCK_BASE_PRICES);

export type RawCandlePoint = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

// Mock-only, deliberately: the free FMP endpoint this app's REAL mode uses
// (historical-price-eod/light) only returns a single close price per day,
// no open/high/low. There's no real OHLC data to plug in here, so
// candlesticks stay a mock-mode-only feature rather than a REAL mode call
// that can't succeed.
export async function getCandlesFromSource(symbol: string, days = 30): Promise<RawCandlePoint[]> {
  const base = MOCK_BASE_PRICES[symbol];
  if (!base) return [];

  const points: RawCandlePoint[] = [];
  const now = Date.now();
  let close = base * (0.94 + Math.random() * 0.05);

  for (let i = days; i >= 0; i--) {
    const open = close;
    const drift = (Math.random() - 0.48) * base * 0.012;
    close = Math.max(0.01, open + drift);
    const high = Math.max(open, close) + Math.random() * base * 0.004;
    const low = Math.max(0.01, Math.min(open, close) - Math.random() * base * 0.004);

    points.push({
      timestamp: new Date(now - i * 24 * 60 * 60 * 1000).toISOString(),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });
  }
  return points;
}

// Indices are shown on the dashboard as a fixed strip, separate from the
// user's own watchlist — not addable/removable, so they live in the same
// price map (getQuoteFromSource works unmodified) but a separate symbol list.
const INDEX_BASE_PRICES: Record<string, number> = {
  SPX: 5810.25,
  NDX: 20452.1,
  DJI: 42150.6,
};
Object.assign(MOCK_BASE_PRICES, INDEX_BASE_PRICES);

export const INDEX_SYMBOLS = Object.keys(INDEX_BASE_PRICES);

export const INDEX_LABELS: Record<string, string> = {
  SPX: "S&P 500",
  NDX: "Nasdaq 100",
  DJI: "Dow 30",
};

export type MockNewsItem = {
  id: string;
  headline: string;
  source: string;
  publishedAt: string;
  relatedSymbol: string | null;
};

// Mock-only: FMP's news endpoint contract wasn't verified against this
// build, so rather than ship a real-mode call that might silently break or
// burn quota on an untested shape, news stays a canned mock feed.
const NEWS_TEMPLATES: Array<{ headline: string; source: string; relatedSymbol: string | null; minutesAgo: number }> = [
  { headline: "Fed holds rates steady, signals no cuts before Q2", source: "MarketWatch", relatedSymbol: null, minutesAgo: 42 },
  { headline: "AAPL nears all-time high on strong services revenue", source: "Reuters", relatedSymbol: "AAPL", minutesAgo: 95 },
  { headline: "Nasdaq 100 rally broadens beyond megacap tech", source: "Bloomberg", relatedSymbol: "NDX", minutesAgo: 130 },
  { headline: "NVDA supplier reports record data-center orders", source: "CNBC", relatedSymbol: "NVDA", minutesAgo: 210 },
  { headline: "Treasury yields tick up ahead of jobs report", source: "MarketWatch", relatedSymbol: null, minutesAgo: 300 },
  { headline: "MSFT cloud unit growth beats analyst estimates", source: "Reuters", relatedSymbol: "MSFT", minutesAgo: 400 },
];

export function getMockNews(): MockNewsItem[] {
  const now = Date.now();
  return NEWS_TEMPLATES.map((n, i) => ({
    id: String(i),
    headline: n.headline,
    source: n.source,
    relatedSymbol: n.relatedSymbol,
    publishedAt: new Date(now - n.minutesAgo * 60 * 1000).toISOString(),
  }));
}
