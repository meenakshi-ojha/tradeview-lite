"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { GET_QUOTES } from "@/lib/graphql/queries";
import { useAppStore } from "@/lib/store/app-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Quote = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  updatedAt: string;
  stale: boolean;
  error: string | null;
};

const EMPTY_QUOTES: Quote[] = [];

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
});

const helper = createColumnHelper<typeof features, Quote>();

// Queried per-quote but never rendered anywhere - the polling design this
// project deliberately defends (30s in MOCK, disabled in REAL) had no
// on-screen proof it was actually happening.
function relativeFreshness(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)}m ago`;
}

function errorLabel(error: string | null) {
  switch (error) {
    case "UNKNOWN_SYMBOL":
      return "Unknown symbol";
    case "RATE_LIMITED":
      return "Rate limited";
    case "REAL_MODE_NOT_CONFIGURED":
      return "Real mode not set up";
    case "FETCH_FAILED":
      return "Fetch failed";
    default:
      return null;
  }
}

export function WatchlistTable() {
  const watchlist = useAppStore((s) => s.watchlist);
  const dataMode = useAppStore((s) => s.dataMode);
  const selectedSymbol = useAppStore((s) => s.selectedSymbol);
  const selectSymbol = useAppStore((s) => s.selectSymbol);
  const removeSymbol = useAppStore((s) => s.removeSymbol);

  // MOCK polls every 30s for a live demo feel (free, local). REAL mode has
  // no batch endpoint on the free FMP tier - N symbols = N provider calls -
  // so it fetches once per toggle/watchlist change instead of polling, to
  // avoid burning the 250-calls/day quota in minutes (see Round 7 in
  // docs/architecture.md).
  // errorPolicy: "all" - the default ("none") sets data to undefined on
  // any GraphQL error, which would blank a fully populated table over one
  // dropped poll. "all" keeps the last-good data around alongside the
  // error, so a transient failure degrades to a small banner instead of
  // wiping a working watchlist.
  const { data, loading, error } = useQuery<{ quotes: Quote[] }, { symbols: string[]; mode: string }>(GET_QUOTES, {
    variables: { symbols: watchlist, mode: dataMode },
    pollInterval: dataMode === "REAL" ? 0 : 30000,
    skip: watchlist.length === 0,
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  const quotes = data?.quotes ?? EMPTY_QUOTES;

  // Ticks once a second purely to force a re-render so "Updated Xs ago"
  // stays live between polls/refetches, not just at the moment data lands.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const latestUpdatedAt = quotes.reduce<string | null>(
    (latest, q) => (!latest || q.updatedAt > latest ? q.updatedAt : latest),
    null
  );

  const columns = useMemo(
    () => helper.columns([
      helper.accessor("symbol", { header: "Symbol", sortFn: "alphanumeric" }),
      helper.accessor("price", {
        header: "Price",
        sortFn: "basic",
        cell: (ctx) => `$${ctx.getValue().toFixed(2)}`,
      }),
      helper.accessor("changePercent", {
        header: "Change %",
        sortFn: "basic",
        cell: (ctx) => {
          const v = ctx.getValue();
          const positive = v >= 0;
          // emerald/red-700, not -600: -600 measures 3.77:1 against white,
          // below WCAG AA's 4.5:1 for text. The arrow icon also means the
          // signal isn't carried by color alone (WCAG 1.4.1).
          const Icon = positive ? ArrowUpRight : ArrowDownRight;
          return (
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${
                positive ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
              }`}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {positive ? "+" : ""}
              {v.toFixed(2)}%
            </span>
          );
        },
      }),
      helper.display({
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const q = row.original;
          const label = errorLabel(q.error);
          if (label) return <Badge variant="destructive">{label}</Badge>;
          if (q.stale) return <Badge variant="secondary">Stale</Badge>;
          return null;
        },
      }),
      helper.display({
        id: "remove",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              removeSymbol(row.original.symbol);
            }}
          >
            Remove
          </Button>
        ),
      }),
    ]),
    [removeSymbol]
  );

  const table = useTable({ features, columns, data: quotes, getRowId: (row) => row.symbol });
  const rows = table.getRowModel().rows;

  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 44,
    getItemKey: (index) => rows[index].id,
    overscan: 6,
  });

  // Core #6: empty / loading / error states. Apollo already surfaces
  // loading/error per query - this is the cheap, high-value part of the
  // design the second cross-review promoted from stretch to Core.
  if (watchlist.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        Your watchlist is empty. Add a ticker to get started.
      </div>
    );
  }

  if (loading && quotes.length === 0) {
    return (
      <div className="space-y-2">
        {watchlist.map((s) => (
          <Skeleton key={s} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  // Only a hard-fail when there's nothing to show at all - if we have
  // last-good data from a prior successful poll, keep it on screen (see
  // errorPolicy: "all" above) and just flag that the latest refresh failed.
  if (error && quotes.length === 0) {
    return (
      <div className="rounded-md border border-destructive/50 p-4 text-sm text-destructive">
        Couldn&apos;t load quotes: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {latestUpdatedAt && (
        <span className="self-end text-xs text-muted-foreground">
          Updated {relativeFreshness(latestUpdatedAt)}
        </span>
      )}
      <div className="rounded-md border">
        {error && (
          <div className="border-b border-destructive/50 bg-destructive/5 px-3 py-1.5 text-xs text-destructive">
            Couldn&apos;t refresh quotes — showing last known prices.
          </div>
        )}
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
          {table.getHeaderGroups().map((group) =>
            group.headers.map((header) => {
              const label = header.isPlaceholder ? null : <table.FlexRender header={header} />;
              const sortIndicator = { asc: " ↑", desc: " ↓" }[header.column.getIsSorted?.() as string] ?? "";

              // A non-sortable column ("Status", "") has nothing to click -
              // rendering it as a disabled <button> anyway gave axe a real,
              // correctly-flagged violation: the "remove" column's header is
              // a literal empty string, so that button had no accessible
              // name at all. Plain text for non-sortable columns instead.
              if (!header.column.getCanSort?.()) {
                return (
                  <span key={header.id} className="text-left">
                    {label}
                  </span>
                );
              }

              return (
                <button
                  key={header.id}
                  className="text-left hover:text-foreground"
                  onClick={header.column.getToggleSortingHandler?.()}
                >
                  {label}
                  {sortIndicator}
                </button>
              );
            })
          )}
        </div>
        {/* Height fits the actual rows (up to a 480px cap where it scrolls
            instead) - a fixed 480px regardless of row count was leaving a
            wall of empty space under a 3-row watchlist and pushing the rest
            of the page (news, etc.) further down than it needed to be. */}
        <div ref={scrollRef} style={{ height: Math.min(rows.length * 44, 480), overflow: "auto" }}>
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((item) => {
              const row = rows[item.index];
              const isSelected = row.original.symbol === selectedSymbol;
              return (
                <div
                  key={row.id}
                  data-index={item.index}
                  ref={virtualizer.measureElement}
                  onClick={() => selectSymbol(row.original.symbol)}
                  className={`absolute left-0 grid w-full grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-2 border-b px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 ${
                    isSelected ? "bg-muted" : ""
                  }`}
                  style={{ transform: `translateY(${item.start}px)` }}
                >
                  {row.getAllCells().map((cell) => (
                    <span key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
