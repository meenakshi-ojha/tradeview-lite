"use client";

import { useAppStore } from "@/lib/store/app-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

export function SettingsPanel() {
  const watchlist = useAppStore((s) => s.watchlist);
  const resetWatchlist = useAppStore((s) => s.resetWatchlist);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Data source</CardTitle>
          <CardDescription>
            Mock mode is the default so the free Financial Modeling Prep quota (250 calls/day)
            never gets burned by accident during development or demos.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-xs">
          <ModeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Watchlist</CardTitle>
          <CardDescription>
            Currently tracking {watchlist.length} symbol{watchlist.length === 1 ? "" : "s"}:{" "}
            {watchlist.join(", ") || "none"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={resetWatchlist}>
            Reset to default watchlist
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
