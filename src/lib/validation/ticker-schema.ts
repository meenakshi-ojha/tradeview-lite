import { z } from "zod";

// Format-only validation, not just UX polish: an invalid/nonexistent symbol
// added without a guard gets refetched on every 30s poll for nothing,
// burning real API quota. This regex check is free (sync, no network call).
// An async "does this symbol actually exist" check against a real
// symbol-search endpoint is a stretch item — it costs its own API call.
export const tickerSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "Enter a ticker symbol")
    .max(5, "Ticker symbols are 1-5 characters")
    .regex(/^[A-Za-z]+$/, "Letters only (e.g. AAPL)")
    .transform((s) => s.toUpperCase()),
});

export type TickerFormValues = z.infer<typeof tickerSchema>;
