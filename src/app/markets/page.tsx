import { MarketsGrid } from "@/components/markets/markets-grid";

export default function MarketsPage() {
  return (
    <div className="flex w-full flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Markets</h1>
        <p className="text-sm text-muted-foreground">
          Browse the known symbol universe and add tickers to your watchlist.
        </p>
      </div>
      <MarketsGrid />
    </div>
  );
}
