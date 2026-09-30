"use client";

import { scaleLinear, scaleTime } from "@visx/scale";
import { LinePath, AreaClosed } from "@visx/shape";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { LinearGradient } from "@visx/gradient";

export type PricePoint = { date: Date; price: number };

// Shared between the full dashboard chart, the expanded index modal, and the
// compact index-card sparklines - one visx renderer, three presentations
// (showAxes + size are the only knobs that differ).
export function PriceHistoryChart({
  points,
  width = 560,
  height = 240,
  showAxes = true,
  gradientId,
  color = "#4f46e5",
}: {
  points: PricePoint[];
  width?: number;
  height?: number;
  showAxes?: boolean;
  gradientId: string;
  color?: string;
}) {
  const margin = showAxes ? { top: 16, right: 16, bottom: 28, left: 48 } : { top: 2, right: 2, bottom: 2, left: 2 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = scaleTime({
    domain: [points[0].date, points[points.length - 1].date],
    range: [0, innerWidth],
  });
  const yScale = scaleLinear({
    domain: [Math.min(...points.map((p) => p.price)) * 0.98, Math.max(...points.map((p) => p.price)) * 1.02],
    range: [innerHeight, 0],
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }} preserveAspectRatio="xMidYMid meet">
      <LinearGradient id={gradientId} from={color} to={color} fromOpacity={0.25} toOpacity={0} />
      <Group left={margin.left} top={margin.top}>
        <AreaClosed
          data={points}
          x={(d) => xScale(d.date)}
          y={(d) => yScale(d.price)}
          yScale={yScale}
          fill={`url(#${gradientId})`}
          curve={undefined}
        />
        <LinePath
          data={points}
          x={(d) => xScale(d.date)}
          y={(d) => yScale(d.price)}
          stroke={color}
          strokeWidth={showAxes ? 2 : 1.5}
        />
        {showAxes && (
          <>
            <AxisLeft scale={yScale} numTicks={4} />
            <AxisBottom top={innerHeight} scale={xScale} numTicks={4} />
          </>
        )}
      </Group>
    </svg>
  );
}
