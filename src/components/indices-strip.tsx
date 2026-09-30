"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { GET_QUOTES, GET_HISTORY } from "@/lib/graphql/queries";
import { INDEX_SYMBOLS, INDEX_LABELS } from "@/lib/data-source";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceHistoryChart } from "@/components/chart/price-history-chart";
import { SymbolDetailDialog } from "@/components/symbol-detail-dialog";

type Quote = { symbol: string; price: number; changePercent: number; error: string | null };
type PricePoint = { timestamp: string; price: number };

function IndexCard({ quote, onClick }: { quote: Quote; onClick: () => void }) {
  const positive = quote.changePercent >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  // One month, fixed - a compact glance chart, not the full range picker
  // (that's what clicking through to the modal is for).
  const { data, loading } = useQuery<{ history: PricePoint[] }, { symbol: string; mode: string; range: string }>(
    GET_HISTORY,
    { variables: { symbol: quote.symbol, mode: "MOCK", range: "MONTH" } }
  );
  const points = (data?.history ?? []).map((p) => ({ date: new Date(p.timestamp), price: p.price }));

  return (
    <Card>
      <CardContent className="py-4">
        <Button
          variant="ghost"
          onClick={onClick}
          className="h-auto w-full flex-col items-stretch justify-start gap-2 p-0 text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                {INDEX_LABELS[quote.symbol] ?? quote.symbol}
              </div>
              <div className="text-lg font-semibold tabular-nums">{quote.price.toFixed(2)}</div>
            </div>
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
          <div className="h-10">
            {loading || points.length === 0 ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <PriceHistoryChart
                points={points}
                width={200}
                height={40}
                showAxes={false}
                gradientId={`gradient-spark-${quote.symbol}`}
                color={positive ? "#059669" : "#dc2626"}
              />
            )}
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}

export function IndicesStrip() {
  // Always MOCK: indices are a fixed reference strip, not tied to the
  // user's REAL/MOCK toggle, so flipping to REAL mode to check a personal
  // watchlist can't also fan out extra real-provider calls for this.
  const { data } = useQuery<{ quotes: Quote[] }, { symbols: string[]; mode: string }>(GET_QUOTES, {
    variables: { symbols: INDEX_SYMBOLS, mode: "MOCK" },
    pollInterval: 30000,
  });

  const [openSymbol, setOpenSymbol] = useState<string | null>(null);
  const quotes = data?.quotes ?? [];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quotes.map((q) => (
          <IndexCard key={q.symbol} quote={q} onClick={() => setOpenSymbol(q.symbol)} />
        ))}
      </div>
      <SymbolDetailDialog
        symbol={openSymbol}
        label={openSymbol ? INDEX_LABELS[openSymbol] ?? openSymbol : ""}
        mode="MOCK"
        open={openSymbol !== null}
        onOpenChange={(open) => !open && setOpenSymbol(null)}
      />
    </>
  );
}
