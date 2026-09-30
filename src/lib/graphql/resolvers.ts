import { getQuoteFromSource, getHistoryFromSource, getCandlesFromSource, getMockNews } from "@/lib/data-source";
import { getQuotesFromRealSource, getHistoryFromRealSource } from "@/lib/real-data-source";

// Real-Finnhub note superseded: the real provider is FMP (Financial
// Modeling Prep), which has a genuine batch-quote endpoint — one call
// covers the whole watchlist in REAL mode, not one call per ticker. Mock
// mode stays per-symbol (it's free/local, batching doesn't matter there).
//
// Caching (REAL mode) only actually applies because this resolver runs
// inside a Next.js Route Handler via @as-integrations/next — not a
// standalone Apollo server outside Next's request lifecycle. See
// docs/architecture.md for the full reasoning.
//
// Mode defaults to MOCK everywhere (schema default + client default) so
// the real provider's 250-calls/day free quota is never burned by accident
// during dev/demo iteration.

type Mode = "MOCK" | "REAL";
type HistoryRange = "WEEK" | "MONTH" | "QUARTER" | "YEAR";

const RANGE_DAYS: Record<HistoryRange, number> = {
  WEEK: 7,
  MONTH: 30,
  QUARTER: 90,
  YEAR: 365,
};

export const resolvers = {
  Query: {
    quotes: async (_: unknown, { symbols, mode }: { symbols: string[]; mode: Mode }) => {
      if (mode === "REAL") {
        return getQuotesFromRealSource(symbols);
      }
      return Promise.all(symbols.map((s) => getQuoteFromSource(s)));
    },
    history: async (
      _: unknown,
      { symbol, mode, range }: { symbol: string; mode: Mode; range: HistoryRange }
    ) => {
      const days = RANGE_DAYS[range];
      const fetcher = mode === "REAL" ? getHistoryFromRealSource : getHistoryFromSource;
      return fetcher(symbol, days);
    },
    candles: async (_: unknown, { symbol, range }: { symbol: string; range: HistoryRange }) => {
      return getCandlesFromSource(symbol, RANGE_DAYS[range]);
    },
    news: async () => getMockNews(),
  },
};
