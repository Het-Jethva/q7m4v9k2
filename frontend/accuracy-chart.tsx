import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
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
import { dateText, unitValue } from "./format";
import type { Accuracy } from "./api";
import type { Unit } from "./format";

const accuracyChartConfig = {
  mae: { label: "Mean absolute error", color: "var(--chart-3)" },
  bias: { label: "Mean bias", color: "var(--chart-2)" },
} satisfies ChartConfig;

export default function AccuracyChart({
  data,
  unit,
}: {
  data: Accuracy;
  unit: Unit;
}) {
  const chart = data.daily.map((day) => ({
    day: dateText(day.decision_date, { day: "numeric", month: "short" }),
    mae: unitValue(day.metrics.mae_mw, unit),
    bias: unitValue(day.metrics.bias_mw, unit),
  }));

  return (
    <ChartContainer
      className="h-full w-full aspect-auto"
      config={accuracyChartConfig}
    >
      <ComposedChart
        accessibilityLayer
        data={chart}
        margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          minTickGap={28}
          dy={10}
        />
        <YAxis tickLine={false} axisLine={false} width={48} />
        <ReferenceLine y={0} stroke="var(--muted-foreground)" />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => `${String(label)} · ${unit}`}
            />
          }
        />
        <Bar
          dataKey="mae"
          fill="var(--color-mae)"
          radius={[3, 3, 0, 0]}
          maxBarSize={25}
          isAnimationActive={false}
        />
        <Line
          type="linear"
          dataKey="bias"
          strokeDasharray="5 3"
          stroke="var(--color-bias)"
          strokeWidth={2}
          dot={false}
          connectNulls={false}
          isAnimationActive={false}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </ComposedChart>
    </ChartContainer>
  );
}
