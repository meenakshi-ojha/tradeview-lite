"use client";

import { useAppStore } from "@/lib/store/app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ModeToggle() {
  const dataMode = useAppStore((s) => s.dataMode);
  const setDataMode = useAppStore((s) => s.setDataMode);

  return (
    <div className="flex items-center gap-2">
      <Badge variant={dataMode === "MOCK" ? "secondary" : "default"}>
        {dataMode === "MOCK" ? "Mock data" : "Real data (FMP)"}
      </Badge>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDataMode(dataMode === "MOCK" ? "REAL" : "MOCK")}
        title="Real mode uses a very limited free API quota (250 calls/day) - flip deliberately"
      >
        Switch to {dataMode === "MOCK" ? "Real" : "Mock"}
      </Button>
    </div>
  );
}
