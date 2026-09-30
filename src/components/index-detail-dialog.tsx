"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_HISTORY } from "@/lib/graphql/queries";
import { PriceHistoryChart } from "@/components/chart/price-history-chart";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type PricePoint = { timestamp: string; price: number };
type HistoryRange = "WEEK" | "MONTH" | "QUARTER" | "YEAR";

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

  // Indices are always MOCK (see indices-strip.tsx) - independent of the
  // user's REAL/MOCK toggle for their personal watchlist.
  const { data, loading } = useQuery<{ history: PricePoint[] }, { symbol: string; mode: string; range: HistoryRange }>(
    GET_HISTORY,
    { variables: { symbol: symbol ?? "", mode: "MOCK", range }, skip: !symbol }
  );

  const points = (data?.history ?? []).map((p) => ({ date: new Date(p.timestamp), price: p.price }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pr-8">
          <DialogTitle>{label} — price history</DialogTitle>
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
        </DialogHeader>
        {loading || points.length === 0 ? (
          <Skeleton className="h-[320px] w-full" />
        ) : (
          <PriceHistoryChart points={points} width={640} height={320} gradientId={`gradient-modal-${symbol}`} />
        )}
      </DialogContent>
    </Dialog>
  );
}
