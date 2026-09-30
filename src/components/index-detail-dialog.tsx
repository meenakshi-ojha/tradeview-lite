"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_HISTORY, GET_CANDLES } from "@/lib/graphql/queries";
import { PriceHistoryChart } from "@/components/chart/price-history-chart";
import { CandlestickChart } from "@/components/chart/candlestick-chart";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type PricePoint = { timestamp: string; price: number };
type CandlePoint = { timestamp: string; open: number; high: number; low: number; close: number };
type HistoryRange = "WEEK" | "MONTH" | "QUARTER" | "YEAR";
type ChartType = "LINE" | "CANDLE";

const RANGE_OPTIONS: { value: HistoryRange; label: string }[] = [
  { value: "WEEK", label: "1W" },
  { value: "MONTH", label: "1M" },
  { value: "QUARTER", label: "3M" },
  { value: "YEAR", label: "1Y" },
];

export function IndexDetailDialog({
  symbol,
  label,
  open,
  onOpenChange,
}: {
  symbol: string | null;
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [range, setRange] = useState<HistoryRange>("MONTH");
  const [chartType, setChartType] = useState<ChartType>("LINE");

  // Indices are always MOCK (see indices-strip.tsx) - independent of the
  // user's REAL/MOCK toggle for their personal watchlist. No REAL-mode
  // fallback needed here for Candles the way price-chart.tsx has one, since
  // this modal never queries REAL data in the first place.
  const lineQuery = useQuery<{ history: PricePoint[] }, { symbol: string; mode: string; range: HistoryRange }>(
    GET_HISTORY,
    { variables: { symbol: symbol ?? "", mode: "MOCK", range }, skip: !symbol || chartType !== "LINE" }
  );

  const candleQuery = useQuery<{ candles: CandlePoint[] }, { symbol: string; range: HistoryRange }>(GET_CANDLES, {
    variables: { symbol: symbol ?? "", range },
    skip: !symbol || chartType !== "CANDLE",
  });

  const activeQuery = chartType === "CANDLE" ? candleQuery : lineQuery;
  const points = (lineQuery.data?.history ?? []).map((p) => ({ date: new Date(p.timestamp), price: p.price }));
  const candles = (candleQuery.data?.candles ?? []).map((c) => ({ ...c, date: new Date(c.timestamp) }));
  const isEmpty = chartType === "CANDLE" ? candles.length === 0 : points.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pr-8">
          <DialogTitle>{label} — price history</DialogTitle>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-7 px-2 text-xs", chartType === "LINE" && "bg-muted font-semibold")}
                onClick={() => setChartType("LINE")}
              >
                Line
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-7 px-2 text-xs", chartType === "CANDLE" && "bg-muted font-semibold")}
                onClick={() => setChartType("CANDLE")}
              >
                Candles
              </Button>
            </div>
            <div className="flex gap-1">
              {RANGE_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant="ghost"
                  size="sm"
                  className={cn("h-7 px-2 text-xs", range === opt.value && "bg-muted font-semibold")}
                  onClick={() => setRange(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </DialogHeader>
        {activeQuery.loading || isEmpty ? (
          <Skeleton className="h-[320px] w-full" />
        ) : chartType === "CANDLE" ? (
          <CandlestickChart candles={candles} width={640} height={320} />
        ) : (
          <PriceHistoryChart points={points} width={640} height={320} gradientId={`gradient-modal-${symbol}`} />
        )}
      </DialogContent>
    </Dialog>
  );
}
