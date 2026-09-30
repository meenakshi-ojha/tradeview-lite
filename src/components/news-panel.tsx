"use client";

import { Newspaper } from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { GET_NEWS } from "@/lib/graphql/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
          : (data?.news ?? []).map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{item.headline}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.source} · {relativeTime(item.publishedAt)}
                  </span>
                </div>
                {item.relatedSymbol && <Badge variant="secondary">{item.relatedSymbol}</Badge>}
              </div>
            ))}
      </CardContent>
    </Card>
  );
}
