"use client";

import { useQuery } from "@apollo/client/react";
import { GET_QUOTES } from "@/lib/graphql/queries";
import { useAppStore } from "@/lib/store/app-store";
import { Card, CardContent } from "@/components/ui/card";

type Quote = { symbol: string; changePercent: number; error: string | null };

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <Card className="flex-1">
      <CardContent className="py-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={
            "text-2xl font-semibold " +
            (tone === "up" ? "text-emerald-600" : tone === "down" ? "text-red-600" : "")
          }
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsBar() {
  const watchlist = useAppStore((s) => s.watchlist);
  const dataMode = useAppStore((s) => s.dataMode);

  // Same query + variables as WatchlistTable - Apollo dedupes this against
  // the already-active query rather than firing a second network request.
  const { data } = useQuery<{ quotes: Quote[] }, { symbols: string[]; mode: string }>(GET_QUOTES, {
    variables: { symbols: watchlist, mode: dataMode },
    pollInterval: 30000,
    skip: watchlist.length === 0,
  });

  const quotes = (data?.quotes ?? []).filter((q) => !q.error);
  const gainers = quotes.filter((q) => q.changePercent > 0).length;
  const losers = quotes.filter((q) => q.changePercent < 0).length;
  const avgChange = quotes.length
    ? quotes.reduce((sum, q) => sum + q.changePercent, 0) / quotes.length
    : 0;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Stat label="Tracking" value={String(watchlist.length)} />
      <Stat label="Gainers" value={String(gainers)} tone="up" />
      <Stat label="Losers" value={String(losers)} tone="down" />
      <Stat
        label="Avg. change"
        value={`${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`}
        tone={avgChange >= 0 ? "up" : "down"}
      />
    </div>
  );
}
