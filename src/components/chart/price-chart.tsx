"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { PriceHistoryChart } from "@/components/chart/price-history-chart";
import { CandlestickChart } from "@/components/chart/candlestick-chart";
import { GET_HISTORY, GET_CANDLES } from "@/lib/graphql/queries";
import { useAppStore } from "@/lib/store/app-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WIDTH = 560;
const HEIGHT = 240;

type HistoryRange = "WEEK" | "MONTH" | "QUARTER" | "YEAR";
type ChartType = "LINE" | "CANDLE";

const RANGE_OPTIONS: { value: HistoryRange; label: string }[] = [
  { value: "WEEK", label: "1W" },
  { value: "MONTH", label: "1M" },
  { value: "QUARTER", label: "3M" },
  { value: "YEAR", label: "1Y" },
];

export function PriceChart() {
  const selectedSymbol = useAppStore((s) => s.selectedSymbol);
  const dataMode = useAppStore((s) => s.dataMode);
  const [range, setRange] = useState<HistoryRange>("MONTH");
  const [chartType, setChartType] = useState<ChartType>("LINE");

  type PricePoint = { timestamp: string; price: number };
  type CandlePoint = { timestamp: string; open: number; high: number; low: number; close: number };

  // Long TTL (1hr) once real mode is wired - intraday history barely
  // changes, no reason to refetch it every 30s poll like quotes.
  const lineQuery = useQuery<{ history: PricePoint[] }, { symbol: string; mode: string; range: HistoryRange }>(
    GET_HISTORY,
    { variables: { symbol: selectedSymbol ?? "", mode: dataMode, range }, skip: !selectedSymbol || chartType !== "LINE" }
  );

  // Candlesticks are mock-only, deliberately: the free FMP endpoint REAL
  // mode uses (historical-price-eod/light) only returns a single close
  // price per day, not open/high/low - there's no real OHLC data to plug
  // in, so REAL mode short-circuits to an explanatory message below instead
  // of firing a query that can't succeed.
  const candleQuery = useQuery<{ candles: CandlePoint[] }, { symbol: string; range: HistoryRange }>(GET_CANDLES, {
    variables: { symbol: selectedSymbol ?? "", range },
    skip: !selectedSymbol || chartType !== "CANDLE" || dataMode === "REAL",
  });

  if (!selectedSymbol) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Select a ticker from the watchlist to see its price history.
        </CardContent>
      </Card>
    );
  }

  const controls = (
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
  );

  const header = (
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>{selectedSymbol} — price history</CardTitle>
      {controls}
    </CardHeader>
  );

  if (chartType === "CANDLE" && dataMode === "REAL") {
    return (
      <Card>
        {header}
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Candlestick charts aren&apos;t available in Real mode — the free FMP endpoint this app
          uses only returns closing price, not open/high/low. Switch to Mock data, or use the Line
          view.
        </CardContent>
      </Card>
    );
  }

  const activeQuery = chartType === "CANDLE" ? candleQuery : lineQuery;

  if (activeQuery.loading) {
    return (
      <Card>
        {header}
        <CardContent>
          <Skeleton className="h-[240px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (activeQuery.error) {
    return (
      <Card>
        {header}
        <CardContent className="text-sm text-destructive">
          Couldn&apos;t load history for {selectedSymbol}: {activeQuery.error.message}
        </CardContent>
      </Card>
    );
  }

  if (chartType === "CANDLE") {
    const candles = (candleQuery.data?.candles ?? []).map((c) => ({ ...c, date: new Date(c.timestamp) }));
    if (candles.length === 0) {
      return (
        <Card>
          {header}
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No history available for {selectedSymbol} — it isn&apos;t a recognized symbol in mock
            data.
          </CardContent>
        </Card>
      );
    }
    return (
      <Card>
        {header}
        <CardContent>
          <CandlestickChart candles={candles} width={WIDTH} height={HEIGHT} />
        </CardContent>
      </Card>
    );
  }

  const points = (lineQuery.data?.history ?? []).map((p) => ({ date: new Date(p.timestamp), price: p.price }));

  if (points.length === 0) {
    return (
      <Card>
        {header}
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No history available for {selectedSymbol} — it isn&apos;t a recognized symbol in the
          current data mode.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {header}
      <CardContent>
        <PriceHistoryChart points={points} width={WIDTH} height={HEIGHT} gradientId={`gradient-main-${selectedSymbol}`} />
      </CardContent>
    </Card>
  );
}
