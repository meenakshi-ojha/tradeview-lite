import { AddTickerForm } from "@/components/watchlist/add-ticker-form";
import { WatchlistTable } from "@/components/watchlist/watchlist-table";
import { PriceChart } from "@/components/chart/price-chart";
import { ModeToggle } from "@/components/mode-toggle";
import { StatsBar } from "@/components/stats-bar";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="flex w-full items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold">TradeView Lite</h1>
          <p className="text-sm text-muted-foreground">
            A watchlist dashboard built to close GraphQL/Next.js gaps — see{" "}
            <code>docs/architecture.html</code> for the full design reasoning.
          </p>
        </div>
        <ModeToggle />
      </header>

      <main className="flex w-full flex-1 flex-col gap-6 p-6">
        <StatsBar />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Watchlist</h2>
          <AddTickerForm />
        </div>

        <div className="grid flex-1 gap-6 lg:grid-cols-[3fr_2fr]">
          <WatchlistTable />
          <PriceChart />
        </div>
      </main>
    </div>
  );
}
