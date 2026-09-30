"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Check, Plus } from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { GET_QUOTES, GET_HISTORY } from "@/lib/graphql/queries";
import { KNOWN_SYMBOLS } from "@/lib/data-source";
import { useAppStore } from "@/lib/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceHistoryChart } from "@/components/chart/price-history-chart";
import { SymbolDetailDialog } from "@/components/symbol-detail-dialog";

type Quote = {
  symbol: string;
  price: number;
  changePercent: number;
  error: string | null;
};

type PricePoint = { timestamp: string; price: number };

function MarketCard({
  quote,
  inWatchlist,
  dataMode,
  onAdd,
  onOpen,
}: {
  quote: Quote;
  inWatchlist: boolean;
  dataMode: string;
  onAdd: () => void;
  onOpen: () => void;
}) {
  const positive = quote.changePercent >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  // Skipped entirely for a quote that's already errored - no point
  // fetching a sparkline for a symbol we know has no data.
  const { data, loading } = useQuery<{ history: PricePoint[] }, { symbol: string; mode: string; range: string }>(
    GET_HISTORY,
    { variables: { symbol: quote.symbol, mode: dataMode, range: "MONTH" }, skip: !!quote.error }
  );
  const points = (data?.history ?? []).map((p) => ({ date: new Date(p.timestamp), price: p.price }));

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-start justify-between">
          <span className="text-base font-semibold">{quote.symbol}</span>
          <Button
            variant={inWatchlist ? "secondary" : "outline"}
            size="sm"
            disabled={inWatchlist}
            onClick={onAdd}
            aria-label={inWatchlist ? `${quote.symbol} already in watchlist` : `Add ${quote.symbol} to watchlist`}
          >
            {inWatchlist ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
            {inWatchlist ? "Added" : "Add"}
          </Button>
        </div>
        {quote.error ? (
          <span className="text-sm text-muted-foreground">Unavailable</span>
        ) : (
          // The Add button above is already interactive, and a button can't
          // legally nest inside another button, so only the open-chart
          // region gets one - not the whole Card.
          <Button
            variant="ghost"
            onClick={onOpen}
            className="h-auto w-full flex-col items-stretch justify-start gap-3 p-2 text-left"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-semibold tabular-nums">${quote.price.toFixed(2)}</span>
              <span
                className={`inline-flex items-center gap-0.5 text-sm font-medium ${
                  positive ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                }`}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {positive ? "+" : ""}
                {quote.changePercent.toFixed(2)}%
              </span>
            </div>
            <div className="h-12">
              {loading || points.length === 0 ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <PriceHistoryChart
                  points={points}
                  width={220}
                  height={48}
                  showAxes={false}
                  gradientId={`gradient-market-${quote.symbol}`}
                  color={positive ? "#059669" : "#dc2626"}
                />
              )}
            </div>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function MarketsGrid() {
  const watchlist = useAppStore((s) => s.watchlist);
  const addSymbol = useAppStore((s) => s.addSymbol);
  const dataMode = useAppStore((s) => s.dataMode);
  const [openSymbol, setOpenSymbol] = useState<string | null>(null);

  // Deliberately a separate query from the watchlist's — this browses the
  // full known universe, not just the symbols the user has already added.
  // In REAL mode this alone is 8 provider calls (no batch endpoint on the
  // free tier), so polling is disabled here too - see watchlist-table.tsx.
  const { data, loading, error } = useQuery<{ quotes: Quote[] }, { symbols: string[]; mode: string }>(
    GET_QUOTES,
    { variables: { symbols: KNOWN_SYMBOLS, mode: dataMode }, pollInterval: dataMode === "REAL" ? 0 : 30000 }
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
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {quotes.map((q) => (
          <MarketCard
            key={q.symbol}
            quote={q}
            inWatchlist={watchlist.includes(q.symbol)}
            dataMode={dataMode}
            onAdd={() => addSymbol(q.symbol)}
            onOpen={() => setOpenSymbol(q.symbol)}
          />
        ))}
      </div>
      <SymbolDetailDialog
        symbol={openSymbol}
        label={openSymbol ?? ""}
        mode={dataMode}
        open={openSymbol !== null}
        onOpenChange={(open) => !open && setOpenSymbol(null)}
      />
    </>
  );
}
