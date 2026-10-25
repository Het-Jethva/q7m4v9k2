import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { unitValue, hourText } from "./format";
import type { Replay } from "./api";
import type { Unit } from "./format";

const forecastChartConfig = {
  forecast: { label: "Forecast at cutoff", color: "var(--chart-3)" },
  actual: { label: "Actual generation", color: "var(--chart-2)" },
} satisfies ChartConfig;

export default function ForecastChart({
  data,
  unit,
  actuals,
}: {
  data: Replay;
  unit: Unit;
  actuals: boolean;
}) {
  const chart = data.intervals.map((interval) => ({
    hour: hourText(interval.start_time),
    forecast: unitValue(interval.forecast_mw, unit),
    actual: unitValue(interval.actual_mw, unit),
  }));

  return (
    <ChartContainer
      className="h-full w-full aspect-auto"
      config={forecastChartConfig}
    >
      <ComposedChart
        accessibilityLayer
        data={chart}
        margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="hour"
          tickLine={false}
          axisLine={false}
          minTickGap={45}
          dy={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          domain={[0, "auto"]}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => `${String(label)} · London · ${unit}`}
            />
          }
        />
        <Area
          type="linear"
          dataKey="forecast"
          stroke="none"
          fill="var(--color-forecast)"
          fillOpacity={0.15}
          isAnimationActive={false}
          connectNulls={false}
          tooltipType="none"
          legendType="none"
        />
        <Line
          type="linear"
          dataKey="forecast"
          stroke="var(--color-forecast)"
          strokeWidth={2.6}
          dot={false}
          activeDot={{
            r: 4,
            stroke: "var(--background)",
            strokeWidth: 2,
          }}
          connectNulls={false}
          isAnimationActive={false}
        />
        {actuals && (
          <Line
            type="linear"
            dataKey="actual"
            strokeDasharray="5 3"
            stroke="var(--color-actual)"
            strokeWidth={2.2}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        )}
        <ChartLegend content={<ChartLegendContent />} />
      </ComposedChart>
    </ChartContainer>
  );
}
