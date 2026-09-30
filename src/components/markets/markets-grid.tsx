"use client";

import { ArrowDownRight, ArrowUpRight, Check, Plus } from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { GET_QUOTES } from "@/lib/graphql/queries";
import { KNOWN_SYMBOLS } from "@/lib/data-source";
import { useAppStore } from "@/lib/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Quote = {
  symbol: string;
  price: number;
  changePercent: number;
  error: string | null;
};

export function MarketsGrid() {
  const watchlist = useAppStore((s) => s.watchlist);
  const addSymbol = useAppStore((s) => s.addSymbol);
  const dataMode = useAppStore((s) => s.dataMode);

  // Deliberately a separate query from the watchlist's — this browses the
  // full known universe, not just the symbols the user has already added.
  const { data, loading, error } = useQuery<{ quotes: Quote[] }, { symbols: string[]; mode: string }>(
    GET_QUOTES,
    { variables: { symbols: KNOWN_SYMBOLS, mode: dataMode }, pollInterval: 30000 }
  );

  if (loading && !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {KNOWN_SYMBOLS.map((s) => (
          <Skeleton key={s} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 p-4 text-sm text-destructive">
        Couldn&apos;t load market data: {error.message}
      </div>
    );
  }

  const quotes = data?.quotes ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {quotes.map((q) => {
        const inWatchlist = watchlist.includes(q.symbol);
        const positive = q.changePercent >= 0;
        const Icon = positive ? ArrowUpRight : ArrowDownRight;
        return (
          <Card key={q.symbol}>
            <CardContent className="flex flex-col gap-3 py-4">
              <div className="flex items-start justify-between">
                <span className="text-base font-semibold">{q.symbol}</span>
                <Button
                  variant={inWatchlist ? "secondary" : "outline"}
                  size="sm"
                  disabled={inWatchlist}
                  onClick={() => addSymbol(q.symbol)}
                  aria-label={inWatchlist ? `${q.symbol} already in watchlist` : `Add ${q.symbol} to watchlist`}
                >
                  {inWatchlist ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                  {inWatchlist ? "Added" : "Add"}
                </Button>
              </div>
              {q.error ? (
                <span className="text-sm text-muted-foreground">Unavailable</span>
              ) : (
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-semibold tabular-nums">${q.price.toFixed(2)}</span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-sm font-medium ${
                      positive ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                    }`}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {positive ? "+" : ""}
                    {q.changePercent.toFixed(2)}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
