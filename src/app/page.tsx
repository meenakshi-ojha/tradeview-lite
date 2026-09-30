import { AddTickerForm } from "@/components/watchlist/add-ticker-form";
import { WatchlistTable } from "@/components/watchlist/watchlist-table";
import { PriceChart } from "@/components/chart/price-chart";
import { ModeToggle } from "@/components/mode-toggle";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">TradeView Lite</h1>
          <p className="text-sm text-muted-foreground">
            A watchlist dashboard built to close GraphQL/Next.js gaps — see the architecture
            doc in the repo for the full design reasoning.
          </p>
        </div>
        <ModeToggle />
      </div>

      <AddTickerForm />

      <div className="grid gap-6 md:grid-cols-2">
        <WatchlistTable />
        <PriceChart />
      </div>
    </main>
  );
}
