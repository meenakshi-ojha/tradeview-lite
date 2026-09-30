"use client";

import { useMemo, useRef } from "react";
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

  // pollInterval: 30s - matches the rate-limit design point (see
  // tradeview-lite-architecture.html). REAL mode's resolver batches this
  // into one call for the whole watchlist rather than one per ticker.
  const { data, loading, error } = useQuery<{ quotes: Quote[] }, { symbols: string[]; mode: string }>(GET_QUOTES, {
    variables: { symbols: watchlist, mode: dataMode },
    pollInterval: 30000,
    skip: watchlist.length === 0,
    fetchPolicy: "cache-and-network",
  });

  const quotes = data?.quotes ?? EMPTY_QUOTES;

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
          return (
            <span className={positive ? "text-emerald-600" : "text-red-600"}>
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

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 p-4 text-sm text-destructive">
        Couldn&apos;t load quotes: {error.message}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
        {table.getHeaderGroups().map((group) =>
          group.headers.map((header) => (
            <button
              key={header.id}
              className="text-left hover:text-foreground"
              onClick={header.column.getToggleSortingHandler?.()}
              disabled={header.isPlaceholder || !header.column.getCanSort?.()}
            >
              {header.isPlaceholder ? null : <table.FlexRender header={header} />}
              {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted?.() as string] ?? ""}
            </button>
          ))
        )}
      </div>
      <div ref={scrollRef} style={{ height: 480, overflow: "auto" }}>
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
  );
}
