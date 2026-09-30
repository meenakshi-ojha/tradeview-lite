import { AddTickerForm } from "@/components/watchlist/add-ticker-form";
import { WatchlistTable } from "@/components/watchlist/watchlist-table";
import { PriceChart } from "@/components/chart/price-chart";
import { StatsBar } from "@/components/stats-bar";
import { IndicesStrip } from "@/components/indices-strip";
import { NewsPanel } from "@/components/news-panel";

export default function Home() {
  return (
    <div className="flex w-full flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your tracked symbols, updated every 30 seconds.
        </p>
      </div>

      <IndicesStrip />

      <StatsBar />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Watchlist</h2>
        <AddTickerForm />
      </div>

      {/* items-start: without it, CSS Grid stretches WatchlistTable to
          match PriceChart's height, undoing its own content-sized height. */}
      <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
        <WatchlistTable />
        <PriceChart />
      </div>

      <NewsPanel />
    </div>
  );
}
