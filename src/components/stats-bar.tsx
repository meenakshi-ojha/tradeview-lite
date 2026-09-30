"use client";

import { Eye, TrendingUp, TrendingDown, Activity, type LucideIcon } from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { GET_QUOTES } from "@/lib/graphql/queries";
import { useAppStore } from "@/lib/store/app-store";
import { Card, CardContent } from "@/components/ui/card";

type Quote = { symbol: string; changePercent: number; error: string | null };

type Tone = "up" | "down" | "neutral";

const TONE_STYLES: Record<Tone, { badge: string; icon: string; value: string }> = {
  up: { badge: "bg-emerald-50 dark:bg-emerald-950/40", icon: "text-emerald-700 dark:text-emerald-400", value: "text-emerald-700 dark:text-emerald-400" },
  down: { badge: "bg-red-50 dark:bg-red-950/40", icon: "text-red-700 dark:text-red-400", value: "text-red-700 dark:text-red-400" },
  neutral: { badge: "bg-muted", icon: "text-foreground", value: "text-foreground" },
};

function Stat({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone: Tone }) {
  const styles = TONE_STYLES[tone];
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${styles.badge}`}>
          <Icon className={`size-5 ${styles.icon}`} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className={`text-2xl font-semibold tabular-nums ${styles.value}`}>{value}</div>
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
    pollInterval: dataMode === "REAL" ? 0 : 30000,
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
      <Stat icon={Eye} label="Tracking" value={String(watchlist.length)} tone="neutral" />
      <Stat icon={TrendingUp} label="Gainers" value={String(gainers)} tone="up" />
      <Stat icon={TrendingDown} label="Losers" value={String(losers)} tone="down" />
      <Stat
        icon={Activity}
        label="Avg. change"
        value={`${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`}
        tone={avgChange >= 0 ? "up" : "down"}
      />
    </div>
  );
}
