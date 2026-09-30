"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { GET_QUOTES } from "@/lib/graphql/queries";
import { INDEX_SYMBOLS, INDEX_LABELS } from "@/lib/data-source";
import { Card, CardContent } from "@/components/ui/card";

type Quote = { symbol: string; price: number; changePercent: number; error: string | null };

export function IndicesStrip() {
  // Always MOCK: indices are a fixed reference strip, not tied to the
  // user's REAL/MOCK toggle, so flipping to REAL mode to check a personal
  // watchlist can't also fan out extra real-provider calls for this.
  const { data } = useQuery<{ quotes: Quote[] }, { symbols: string[]; mode: string }>(GET_QUOTES, {
    variables: { symbols: INDEX_SYMBOLS, mode: "MOCK" },
    pollInterval: 30000,
  });

  const quotes = data?.quotes ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {quotes.map((q) => {
        const positive = q.changePercent >= 0;
        const Icon = positive ? ArrowUpRight : ArrowDownRight;
        return (
          <Card key={q.symbol}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  {INDEX_LABELS[q.symbol] ?? q.symbol}
                </div>
                <div className="text-lg font-semibold tabular-nums">{q.price.toFixed(2)}</div>
              </div>
              <span
                className={`inline-flex items-center gap-0.5 text-sm font-medium ${
                  positive ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                }`}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {positive ? "+" : ""}
                {q.changePercent.toFixed(2)}%
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
