"use client";

import { useState } from "react";
import { Newspaper } from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { GET_NEWS } from "@/lib/graphql/queries";
import { INDEX_SYMBOLS } from "@/lib/data-source";
import { useAppStore } from "@/lib/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SymbolDetailDialog } from "@/components/symbol-detail-dialog";

type NewsItem = {
  id: string;
  headline: string;
  source: string;
  publishedAt: string;
  relatedSymbol: string | null;
};

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NewsPanel() {
  const { data, loading } = useQuery<{ news: NewsItem[] }>(GET_NEWS);
  const dataMode = useAppStore((s) => s.dataMode);
  const [openSymbol, setOpenSymbol] = useState<string | null>(null);

  // Indices stay MOCK regardless of the toggle, same as the indices strip -
  // a click on an NDX headline shouldn't fire a REAL provider call for it.
  const openMode = openSymbol && INDEX_SYMBOLS.includes(openSymbol) ? "MOCK" : dataMode;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="size-4" aria-hidden="true" />
          Market news
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {loading && !data
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
          : (data?.news ?? []).map((item) => {
              const rowContent = (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{item.headline}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.source} · {relativeTime(item.publishedAt)}
                    </span>
                  </div>
                  {item.relatedSymbol && <Badge variant="secondary">{item.relatedSymbol}</Badge>}
                </>
              );

              // Only headlines with a related symbol get real button
              // semantics - a plain div for the rest, not a disabled button
              // (that would visually gray out perfectly normal news items).
              if (!item.relatedSymbol) {
                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0"
                  >
                    {rowContent}
                  </div>
                );
              }

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => setOpenSymbol(item.relatedSymbol)}
                  className="h-auto w-full items-start justify-between gap-3 rounded-sm border-b p-2 text-left last:border-b-0 last:pb-0"
                >
                  {rowContent}
                </Button>
              );
            })}
      </CardContent>
      <SymbolDetailDialog
        symbol={openSymbol}
        label={openSymbol ?? ""}
        mode={openMode}
        open={openSymbol !== null}
        onOpenChange={(open) => !open && setOpenSymbol(null)}
      />
    </Card>
  );
}
