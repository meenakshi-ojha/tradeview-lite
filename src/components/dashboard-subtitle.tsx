"use client";

import { useAppStore } from "@/lib/store/app-store";

// Was hardcoded as "updated every 30 seconds" regardless of mode - untrue
// in REAL mode, where client polling is deliberately disabled (no free
// batch endpoint - see real-data-source.ts). The copy should match what
// actually happens, not the MOCK-only behavior.
export function DashboardSubtitle() {
  const dataMode = useAppStore((s) => s.dataMode);
  return (
    <p className="text-sm text-muted-foreground">
      {dataMode === "REAL"
        ? "Real data (FMP) — refreshed on load and when your watchlist changes, not continuously polled."
        : "Your tracked symbols, updated every 30 seconds."}
    </p>
  );
}
