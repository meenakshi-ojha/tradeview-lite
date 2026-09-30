"use client";

import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar, Line } from "@visx/shape";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";

export type CandlePoint = { date: Date; open: number; high: number; low: number; close: number };

export function CandlestickChart({
  candles,
  width = 560,
  height = 240,
}: {
  candles: CandlePoint[];
  width?: number;
  height?: number;
}) {
  const margin = { top: 16, right: 16, bottom: 28, left: 48 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = scaleBand({
    domain: candles.map((_, i) => i),
    range: [0, innerWidth],
    padding: 0.3,
  });
  const yScale = scaleLinear({
    domain: [Math.min(...candles.map((c) => c.low)) * 0.98, Math.max(...candles.map((c) => c.high)) * 1.02],
    range: [innerHeight, 0],
  });

  // Cap tick count regardless of range - a 1Y view has ~250 candles, but
  // the axis should still only show a handful of readable date labels.
  const tickEvery = Math.max(1, Math.ceil(candles.length / 5));
  const tickValues = candles.map((_, i) => i).filter((i) => i % tickEvery === 0);
  const bandwidth = xScale.bandwidth();

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }} preserveAspectRatio="xMidYMid meet">
      <Group left={margin.left} top={margin.top}>
        {candles.map((c, i) => {
          const x = xScale(i) ?? 0;
          const isUp = c.close >= c.open;
          const color = isUp ? "#059669" : "#dc2626";
          const bodyTop = yScale(Math.max(c.open, c.close));
          const bodyBottom = yScale(Math.min(c.open, c.close));
          return (
            <Group key={i} left={x}>
              <Line
                from={{ x: bandwidth / 2, y: yScale(c.high) }}
                to={{ x: bandwidth / 2, y: yScale(c.low) }}
                stroke={color}
                strokeWidth={1}
              />
              <Bar x={0} y={bodyTop} width={bandwidth} height={Math.max(1, bodyBottom - bodyTop)} fill={color} />
            </Group>
          );
        })}
        <AxisLeft scale={yScale} numTicks={4} />
        <AxisBottom
          top={innerHeight}
          scale={xScale}
          tickValues={tickValues}
          tickFormat={(i) => {
            const d = candles[Number(i)]?.date;
            return d ? `${d.getMonth() + 1}/${d.getDate()}` : "";
          }}
        />
      </Group>
    </svg>
  );
}
