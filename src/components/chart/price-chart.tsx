"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { PriceHistoryChart } from "@/components/chart/price-history-chart";
import { GET_HISTORY } from "@/lib/graphql/queries";
import { useAppStore } from "@/lib/store/app-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WIDTH = 560;
const HEIGHT = 240;

type HistoryRange = "WEEK" | "MONTH" | "QUARTER" | "YEAR";

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

  // Long TTL (1hr) once real mode is wired - intraday history barely
  // changes, no reason to refetch it every 30s poll like quotes.
  type PricePoint = { timestamp: string; price: number };
  const { data, loading, error } = useQuery<
    { history: PricePoint[] },
    { symbol: string; mode: string; range: HistoryRange }
  >(GET_HISTORY, {
    variables: { symbol: selectedSymbol ?? "", mode: dataMode, range },
    skip: !selectedSymbol,
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

  const rangeSelector = (
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
  );

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{selectedSymbol} — price history</CardTitle>
          {rangeSelector}
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[240px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{selectedSymbol} — price history</CardTitle>
          {rangeSelector}
        </CardHeader>
        <CardContent className="text-sm text-destructive">
          Couldn&apos;t load history for {selectedSymbol}: {error.message}
        </CardContent>
      </Card>
    );
  }

  const points = (data?.history ?? []).map((p) => ({
    date: new Date(p.timestamp),
    price: p.price,
  }));

  if (points.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{selectedSymbol} — price history</CardTitle>
          {rangeSelector}
        </CardHeader>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No history available for {selectedSymbol} — it isn&apos;t a recognized symbol in the
          current data mode.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{selectedSymbol} — price history</CardTitle>
        {rangeSelector}
      </CardHeader>
      <CardContent>
        <PriceHistoryChart points={points} width={WIDTH} height={HEIGHT} gradientId={`gradient-main-${selectedSymbol}`} />
      </CardContent>
    </Card>
  );
}
