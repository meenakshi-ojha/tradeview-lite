"use client";

import { useQuery } from "@apollo/client/react";
import { scaleLinear, scaleTime } from "@visx/scale";
import { LinePath, AreaClosed } from "@visx/shape";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { LinearGradient } from "@visx/gradient";
import { GET_HISTORY } from "@/lib/graphql/queries";
import { useAppStore } from "@/lib/store/app-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const WIDTH = 560;
const HEIGHT = 240;
const MARGIN = { top: 16, right: 16, bottom: 28, left: 48 };

export function PriceChart() {
  const selectedSymbol = useAppStore((s) => s.selectedSymbol);
  const dataMode = useAppStore((s) => s.dataMode);

  // Long TTL (1hr) once real mode is wired - intraday history barely
  // changes, no reason to refetch it every 30s poll like quotes.
  type PricePoint = { timestamp: string; price: number };
  const { data, loading, error } = useQuery<{ history: PricePoint[] }, { symbol: string; mode: string }>(GET_HISTORY, {
    variables: { symbol: selectedSymbol ?? "", mode: dataMode },
    skip: !selectedSymbol,
  });

  if (!selectedSymbol) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Select a ticker from the watchlist to see its price history.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <Skeleton className="h-[240px] w-full" />;
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 p-4 text-sm text-destructive">
        Couldn&apos;t load history for {selectedSymbol}: {error.message}
      </div>
    );
  }

  const points = (data?.history ?? []).map((p) => ({
    date: new Date(p.timestamp),
    price: p.price,
  }));

  if (points.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No history available for {selectedSymbol} — it isn&apos;t a recognized symbol in the
          current data mode.
        </CardContent>
      </Card>
    );
  }

  const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const xScale = scaleTime({
    domain: [points[0].date, points[points.length - 1].date],
    range: [0, innerWidth],
  });
  const yScale = scaleLinear({
    domain: [Math.min(...points.map((p) => p.price)) * 0.98, Math.max(...points.map((p) => p.price)) * 1.02],
    range: [innerHeight, 0],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{selectedSymbol} — price history</CardTitle>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ width: "100%", height: "auto" }}
          preserveAspectRatio="xMidYMid meet"
        >
          <LinearGradient id="area-gradient" from="#4f46e5" to="#4f46e5" fromOpacity={0.25} toOpacity={0} />
          <Group left={MARGIN.left} top={MARGIN.top}>
            <AreaClosed
              data={points}
              x={(d) => xScale(d.date)}
              y={(d) => yScale(d.price)}
              yScale={yScale}
              fill="url(#area-gradient)"
              curve={undefined}
            />
            <LinePath
              data={points}
              x={(d) => xScale(d.date)}
              y={(d) => yScale(d.price)}
              stroke="#4f46e5"
              strokeWidth={2}
            />
            <AxisLeft scale={yScale} numTicks={4} />
            <AxisBottom top={innerHeight} scale={xScale} numTicks={4} />
          </Group>
        </svg>
      </CardContent>
    </Card>
  );
}
