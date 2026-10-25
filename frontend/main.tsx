import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  IconDownload as ArrowDownToLine,
  IconArrowRight as ArrowRight,
  IconArrowUpRight as ArrowUpRight,
  IconChartBar as BarChart3,
  IconChevronLeft as ChevronLeft,
  IconChevronRight as ChevronRight,
  IconAlertCircle as CircleAlert,
  IconClock as Clock3,
  IconExternalLink as ExternalLink,
  IconRefresh as RefreshCw,
  IconWind as Wind,
} from "@tabler/icons-react";
import {
  accuracyParams,
  accuracySchema,
  metaSchema,
  replayParams,
  replaySchema,
  useApi,
} from "./api";
import type { Accuracy, Meta, Metrics, Replay } from "./api";
import "./styles.css";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const forecastChartConfig = {
  forecast: { label: "Forecast at cutoff", color: "var(--chart-3)" },
  actual: { label: "Actual generation", color: "var(--chart-2)" },
} satisfies ChartConfig;
const accuracyChartConfig = {
  mae: { label: "Mean absolute error", color: "var(--chart-3)" },
  bias: { label: "Mean bias", color: "var(--chart-2)" },
} satisfies ChartConfig;

type Tab = "forecast" | "accuracy" | "methodology";
type Unit = "GW" | "MW";
const nav = [
  { id: "forecast", label: "Forecast" },
  { id: "accuracy", label: "Accuracy" },
  { id: "methodology", label: "Methodology" },
] satisfies { id: Tab; label: string }[];
const JAN_FIRST = "2026-01-01";
const JAN_LAST = "2026-01-31";
const dateText = (
  date: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
) =>
  new Date(date.includes("T") ? date : `${date}T00:00:00Z`).toLocaleDateString(
    "en-GB",
    { ...options, timeZone: "Europe/London" },
  );
const hourText = (date: string) =>
  new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
const issueText = (date: string | null) =>
  date
    ? `${dateText(date, { day: "numeric", month: "short" })}, ${hourText(date)}`
    : "Unavailable";
const unitValue = (value: number | null, unit: Unit) =>
  value === null ? null : value / (unit === "GW" ? 1000 : 1);
const powerText = (value: number | null, unit: Unit, signed = false) =>
  value === null
    ? "Unavailable"
    : `${signed && value > 0 ? "+" : ""}${(value / (unit === "GW" ? 1000 : 1)).toLocaleString("en-GB", { minimumFractionDigits: unit === "GW" ? 2 : 0, maximumFractionDigits: unit === "GW" ? 2 : 0 })}`;
const shiftDate = (date: string, shift: number) => {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + shift);
  return next.toISOString().slice(0, 10);
};

function App() {
  const [tab, setTab] = useState<Tab>("forecast");
  const [decision, setDecision] = useState("2026-01-15");
  const [cutoff, setCutoff] = useState("09:00");
  const [actuals, setActuals] = useState(false);
  const [unit, setUnit] = useState<Unit>("GW");
  const [from, setFrom] = useState(JAN_FIRST);
  const [to, setTo] = useState(JAN_LAST);
  const [revision, setRevision] = useState(0);
  const meta = useApi("/api/meta", metaSchema, revision);
  const replayQuery = replayParams(decision, cutoff, actuals);
  const accuracyQuery = accuracyParams(from, to, cutoff);
  const replay = useApi(`/api/replay?${replayQuery}`, replaySchema, revision);
  const accuracy = useApi(
    `/api/accuracy?${accuracyQuery}`,
    accuracySchema,
    revision,
  );
  const retry = () => setRevision((current) => current + 1);
  const commitInput =
    (setValue: (value: string) => void) =>
    (event: React.SyntheticEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      if (input.validity.valid && input.value) setValue(input.value);
    };
  const changeDecision = commitInput(setDecision);
  const changeCutoff = commitInput(setCutoff);
  const changeFrom = commitInput(setFrom);
  const changeTo = commitInput(setTo);
  const exportUrl =
    tab === "accuracy"
      ? `/api/accuracy.csv?${accuracyQuery}`
      : `/api/replay.csv?${replayQuery}`;
  const openDay = (date: string) => {
    setDecision(date);
    setActuals(true);
    setTab("forecast");
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };

  return (
    <Tabs
      className="min-h-screen gap-0"
      value={tab}
      onValueChange={(value) => {
        if (
          value === "forecast" ||
          value === "accuracy" ||
          value === "methodology"
        )
          setTab(value);
      }}
    >
      <header className="flex flex-wrap items-center gap-6 border-b px-5 py-4 md:gap-12 md:px-8">
        <a
          className="flex items-center gap-2 text-xl font-semibold tracking-tight"
          href="#main"
          aria-label="Northline home"
          onClick={() => setTab("forecast")}
        >
          <Wind className="size-6 text-primary" /> northline
          <span className="-ml-2 text-primary">.</span>
        </a>
        <TabsList
          variant="line"
          aria-label="Main navigation"
          className="order-3 sm:order-none"
        >
          {nav.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="ml-auto flex flex-col items-end gap-1">
          <Badge variant="secondary">January 2026 archive</Badge>
          <Badge variant={meta.kind === "error" ? "destructive" : "outline"}>
            {meta.kind === "ready"
              ? "Elexon snapshot loaded"
              : meta.kind === "error"
                ? "Source unavailable"
                : "Loading source snapshot"}
          </Badge>
        </div>
      </header>
      <div className="mx-auto w-full max-w-screen-2xl px-5 pt-6 md:px-8 md:pt-8">
        <main id="main" tabIndex={-1}>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {tab === "forecast"
                  ? "Wind forecast"
                  : tab === "accuracy"
                    ? "Forecast accuracy"
                    : "The evidence behind the forecast"}
              </h1>
            </div>
            {tab !== "methodology" && (
              <Button asChild variant="outline">
                <a href={exportUrl} download>
                  <ArrowDownToLine data-icon="inline-start" />
                  Export CSV
                </a>
              </Button>
            )}
          </div>
          {tab !== "methodology" && (
            <Card className="mb-8">
              <CardContent>
                <FieldGroup
                  className="flex-row flex-wrap items-end gap-6"
                  aria-label="Forecast filters"
                >
                  {tab === "forecast" ? (
                    <Field className="w-full shrink-0 sm:w-60">
                      <FieldLabel htmlFor="decision-date">
                        Purchase decision
                      </FieldLabel>
                      <InputGroup>
                        <InputGroupAddon>
                          <InputGroupButton
                            size="icon-xs"
                            aria-label="Previous decision day"
                            disabled={decision <= JAN_FIRST}
                            onClick={() => setDecision(shiftDate(decision, -1))}
                          >
                            <ChevronLeft />
                          </InputGroupButton>
                        </InputGroupAddon>
                        <InputGroupInput
                          id="decision-date"
                          type="date"
                          min={JAN_FIRST}
                          max={JAN_LAST}
                          value={decision}
                          onChange={changeDecision}
                          onInput={changeDecision}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            size="icon-xs"
                            aria-label="Next decision day"
                            disabled={decision >= JAN_LAST}
                            onClick={() => setDecision(shiftDate(decision, 1))}
                          >
                            <ChevronRight />
                          </InputGroupButton>
                        </InputGroupAddon>
                      </InputGroup>
                    </Field>
                  ) : (
                    <>
                      <Field className="w-full sm:w-48">
                        <FieldLabel htmlFor="from-date">
                          First decision
                        </FieldLabel>
                        <Input
                          id="from-date"
                          type="date"
                          min={JAN_FIRST}
                          max={to}
                          value={from}
                          onChange={changeFrom}
                          onInput={changeFrom}
                        />
                      </Field>
                      <span className="hidden pb-2 text-muted-foreground sm:block">
                        <ArrowRight className="size-4" />
                      </span>
                      <Field className="w-full sm:w-48">
                        <FieldLabel htmlFor="to-date">Last decision</FieldLabel>
                        <Input
                          id="to-date"
                          type="date"
                          min={from}
                          max={JAN_LAST}
                          value={to}
                          onChange={changeTo}
                          onInput={changeTo}
                        />
                      </Field>
                    </>
                  )}
                  <Field className="w-full shrink-0 sm:w-48">
                    <FieldLabel htmlFor="cutoff-time">
                      Decision cutoff <span>London time</span>
                    </FieldLabel>
                    <div>
                      <Input
                        id="cutoff-time"
                        type="time"
                        value={cutoff}
                        required
                        onChange={changeCutoff}
                        onInput={changeCutoff}
                      />
                    </div>
                  </Field>
                  <div className="flex w-full items-center gap-3 text-sm text-muted-foreground lg:ml-auto lg:w-auto">
                    {tab === "forecast" ? (
                      <>
                        <span className="text-primary">
                          <ArrowRight className="size-4" />
                        </span>
                        <div>
                          Next-day delivery
                          <strong className="block">
                            {dateText(shiftDate(decision, 1), {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </strong>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-primary">
                          <BarChart3 className="size-4" />
                        </span>
                        <div>
                          Historical comparison
                          <strong className="block">
                            Hourly, matched observations
                          </strong>
                        </div>
                      </>
                    )}
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>
          )}
          <TabsContent value="forecast">
            {tab === "forecast" &&
              (replay.kind === "ready" ? (
                <Forecast
                  data={replay.data}
                  actuals={actuals}
                  setActuals={setActuals}
                  unit={unit}
                  setUnit={setUnit}
                  exportUrl={exportUrl}
                />
              ) : (
                <RequestState
                  kind={replay.kind}
                  message={replay.kind === "error" ? replay.message : ""}
                  retry={retry}
                  label="Loading the selected forecast"
                />
              ))}
          </TabsContent>
          <TabsContent value="accuracy">
            {tab === "accuracy" &&
              (accuracy.kind === "ready" ? (
                <AccuracyPage
                  data={accuracy.data}
                  unit={unit}
                  setUnit={setUnit}
                  openDay={openDay}
                  exportUrl={exportUrl}
                />
              ) : (
                <RequestState
                  kind={accuracy.kind}
                  message={accuracy.kind === "error" ? accuracy.message : ""}
                  retry={retry}
                  label="Calculating historical errors"
                />
              ))}
          </TabsContent>
          <TabsContent value="methodology">
            {tab === "methodology" && (
              <Methodology meta={meta.kind === "ready" ? meta.data : null} />
            )}
          </TabsContent>
          <Separator className="mt-8" />
          <footer className="flex flex-col items-start justify-between gap-3 py-4 text-sm text-muted-foreground md:flex-row md:items-center">
            <span>
              Northline <span>·</span> GB wind intelligence
            </span>
            <span>
              {meta.kind === "ready"
                ? `Source snapshot retrieved ${dateText(meta.data.retrieved_at, { day: "numeric", month: "short", year: "numeric" })}`
                : "Source snapshot information pending"}{" "}
              <Button
                variant="link"
                size="xs"
                onClick={() => setTab("methodology")}
              >
                View provenance <ArrowUpRight data-icon="inline-end" />
              </Button>
            </span>
          </footer>
        </main>
      </div>
    </Tabs>
  );
}

function RequestState({
  kind,
  message,
  retry,
  label,
}: {
  kind: "loading" | "error";
  message: string;
  retry: () => void;
  label: string;
}) {
  if (kind === "loading")
    return (
      <div
        className="flex min-h-80 flex-col items-center justify-center gap-4 py-6"
        role="status"
        aria-label={label}
      >
        <span className="sr-only">{label}</span>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  return (
    <Empty
      className="flex min-h-80 flex-col items-center justify-center gap-4 py-6"
      role="alert"
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlert />
        </EmptyMedia>
        <EmptyTitle>We couldn't load this view</EmptyTitle>
        <EmptyDescription>
          {message} Confirm the API is running and the data snapshot is
          available.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={retry}>
          <RefreshCw data-icon="inline-start" />
          Retry loading
        </Button>
      </EmptyContent>
    </Empty>
  );
}
function UnitControl({
  unit,
  setUnit,
}: {
  unit: Unit;
  setUnit: (unit: Unit) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      spacing={0}
      value={unit}
      aria-label="Power unit"
      onValueChange={(value) => {
        if (value === "GW" || value === "MW") setUnit(value);
      }}
    >
      <ToggleGroupItem value="GW" aria-label="Gigawatts">
        GW
      </ToggleGroupItem>
      <ToggleGroupItem value="MW" aria-label="Megawatts">
        MW
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
function Metric({
  label,
  value,
  unit,
  detail,
}: {
  label: string;
  value: string;
  unit?: string;
  detail: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle>
          <span className="text-2xl tabular-nums">{value}</span>{" "}
          <span className="text-muted-foreground">{unit}</span>
        </CardTitle>
      </CardHeader>
      {detail && (
        <CardContent>
          <CardDescription>{detail}</CardDescription>
        </CardContent>
      )}
    </Card>
  );
}
function MetricsRow({
  metrics,
  unit,
  coverage,
  expected,
  layout = "rail",
}: {
  metrics: Metrics;
  unit: Unit;
  coverage: number;
  expected: number;
  layout?: "rail" | "summary";
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2",
        layout === "summary" ? "lg:grid-cols-4" : "lg:grid-cols-1",
      )}
    >
      <Metric
        label="Mean absolute error"
        value={powerText(metrics.mae_mw, unit)}
        unit={metrics.mae_mw === null ? "" : unit}
        detail=""
      />
      <Metric
        label="Root mean squared error"
        value={powerText(metrics.rmse_mw, unit)}
        unit={metrics.rmse_mw === null ? "" : unit}
        detail=""
      />
      <Metric
        label="Mean bias"
        value={powerText(metrics.bias_mw, unit, true)}
        unit={metrics.bias_mw === null ? "" : unit}
        detail="Forecast minus actual"
      />
      <Metric
        label="Weighted absolute error"
        value={
          metrics.wape_pct === null
            ? "Unavailable"
            : metrics.wape_pct.toFixed(1)
        }
        unit={metrics.wape_pct === null ? "" : "%"}
        detail={`${coverage} of ${expected} hours paired`}
      />
    </div>
  );
}
function Forecast({
  data,
  actuals,
  setActuals,
  unit,
  setUnit,
  exportUrl,
}: {
  data: Replay;
  actuals: boolean;
  setActuals: (value: boolean) => void;
  unit: Unit;
  setUnit: (value: Unit) => void;
  exportUrl: string;
}) {
  const chart = data.intervals.map((interval) => ({
    hour: hourText(interval.start_time),
    forecast: unitValue(interval.forecast_mw, unit),
    actual: unitValue(interval.actual_mw, unit),
  }));
  return (
    <>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(240px,1fr)]">
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Delivery profile{" "}
                <span>
                  {dateText(data.delivery_date, {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                National wind generation, hourly · London time
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <FieldGroup className="w-auto min-w-52 shrink-0">
                <Field orientation="horizontal">
                  <Checkbox
                    id="show-actuals"
                    checked={actuals}
                    onCheckedChange={(checked) => setActuals(checked === true)}
                  />
                  <FieldLabel htmlFor="show-actuals">
                    Show actuals <Badge variant="secondary">Hindsight</Badge>
                  </FieldLabel>
                </Field>
              </FieldGroup>
              <UnitControl unit={unit} setUnit={setUnit} />
            </div>
          </div>
          <p className="mt-4 text-right text-sm text-muted-foreground">
            {unit}
          </p>
          {data.forecast_hours === 0 && (
            <Alert className="col-span-full my-4">
              <CircleAlert />
              <AlertDescription>
                No eligible forecast was published before this cutoff. Choose a
                later cutoff to inspect another vintage.
              </AlertDescription>
            </Alert>
          )}
          <div
            className="h-72 w-full sm:h-80"
            role="img"
            aria-label={`Hourly wind forecast for ${dateText(data.delivery_date)} in ${unit}${actuals ? ", compared with retrospective actual generation" : ""}. Exact values appear in the interval table below.`}
          >
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
                      labelFormatter={(label) =>
                        `${String(label)} · London · ${unit}`
                      }
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
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              <Clock3 className="inline size-4" />
              00:00 to 23:00, hourly delivery starts
            </span>
            <span>
              {actuals
                ? `${data.matched_hours}/${data.expected_hours} hours paired with actuals`
                : "Decision-time view · Later updates excluded"}
            </span>
          </div>
        </section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Metric
            label="Average forecast"
            value={powerText(data.mean_forecast_mw, unit)}
            unit={data.mean_forecast_mw === null ? "" : unit}
            detail="Across available delivery hours"
          />
          <Metric
            label="Peak forecast"
            value={powerText(data.peak_forecast_mw, unit)}
            unit={data.peak_forecast_mw === null ? "" : unit}
            detail=""
          />
          <Metric
            label="Forecast range"
            value={
              data.min_forecast_mw === null || data.peak_forecast_mw === null
                ? "Unavailable"
                : `${powerText(data.min_forecast_mw, unit)} – ${powerText(data.peak_forecast_mw, unit)}`
            }
            unit={data.min_forecast_mw === null ? "" : unit}
            detail=""
          />
          <Metric
            label="Forecast coverage"
            value={`${data.forecast_hours}/${data.expected_hours}`}
            unit="hrs"
            detail={
              data.forecast_hours === data.expected_hours
                ? "All delivery hours available"
                : "Missing intervals remain gaps"
            }
          />
        </div>
      </div>
      <Alert role="note" className="mt-6">
        <AlertDescription>
          <div>
            <strong>
              {data.latest_publish_time
                ? `Selected issue ${issueText(data.latest_publish_time)}`
                : "No eligible forecast issue"}
            </strong>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Each hour uses its latest forecast available by {data.cutoff} on{" "}
              {dateText(data.decision_date, { day: "numeric", month: "short" })}
              ,
              {data.oldest_publish_time &&
              data.oldest_publish_time !== data.latest_publish_time
                ? ` with issues starting ${issueText(data.oldest_publish_time)} and no later updates filling gaps.`
                : " with no later updates filling gaps."}
            </p>
          </div>
          <Badge variant="outline" className="mt-2">
            WINDFOR <ArrowUpRight />
          </Badge>
        </AlertDescription>
      </Alert>
      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Interval detail
            </h2>
          </div>
          <Button variant="link" size="sm" asChild>
            <a href={exportUrl} download>
              Download data <ArrowDownToLine data-icon="inline-end" />
            </a>
          </Button>
        </div>
        <div className="max-w-full">
          <Table
            containerProps={{
              tabIndex: 0,
              "aria-label": "Hourly forecast interval table",
            }}
          >
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Delivery hour</TableHead>
                <TableHead scope="col" className="text-right tabular-nums">
                  Forecast, {unit}
                </TableHead>
                {actuals && (
                  <>
                    <TableHead scope="col" className="text-right tabular-nums">
                      Actual, {unit}
                    </TableHead>
                    <TableHead scope="col" className="text-right tabular-nums">
                      Error, {unit}
                    </TableHead>
                  </>
                )}
                <TableHead scope="col">Forecast issued</TableHead>
                <TableHead scope="col">Source evidence</TableHead>
                <TableHead scope="col">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.intervals.map((interval) => (
                <TableRow key={interval.start_time}>
                  <TableHead scope="row">
                    {hourText(interval.start_time)}
                    <span>
                      –{" "}
                      {hourText(
                        new Date(
                          new Date(interval.start_time).getTime() + 3600000,
                        ).toISOString(),
                      )}
                    </span>
                  </TableHead>
                  <TableCell className="text-right tabular-nums">
                    {powerText(interval.forecast_mw, unit)}
                  </TableCell>
                  {actuals && (
                    <>
                      <TableCell className="text-right tabular-nums">
                        {powerText(interval.actual_mw, unit)}
                      </TableCell>
                      <TableCell className="text-right">
                        {powerText(interval.error_mw, unit, true)}
                      </TableCell>
                    </>
                  )}
                  <TableCell>{issueText(interval.publish_time)}</TableCell>
                  <TableCell>
                    {interval.forecast_source_id ?? "No eligible forecast"}
                    {actuals && interval.actual_half_hours.length > 0 && (
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button variant="link" size="xs" className="px-0">
                            Actual half-hour evidence
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          {interval.actual_half_hours.map((half) => (
                            <div
                              className="py-2"
                              key={`${half.start_time}-${half.source_id}`}
                            >
                              {hourText(half.start_time)} ·{" "}
                              {powerText(half.generation_mw, unit)} {unit}
                              <br />
                              {half.source_id}
                              <br />
                              Published {issueText(half.publish_time)}
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        interval.status === "matched" ||
                        interval.status === "forecast_only"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {interval.status === "matched"
                        ? "Paired"
                        : interval.status === "forecast_only"
                          ? "Forecast"
                          : interval.status === "missing_forecast"
                            ? "Missing forecast"
                            : "Missing actual"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
      {actuals && (
        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                What happened
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Retrospective actuals. These values were unavailable at the
                decision cutoff.
              </p>
            </div>
          </div>
          {data.metrics && (
            <MetricsRow
              layout="summary"
              metrics={data.metrics}
              unit={unit}
              coverage={data.matched_hours}
              expected={data.expected_hours}
            />
          )}
          <p className="mt-3 max-w-prose text-sm text-muted-foreground">
            Positive bias means wind was overforecast, which can increase
            shortfall exposure. This is not a customer procurement calculation.
          </p>
        </section>
      )}
    </>
  );
}

function AccuracyPage({
  data,
  unit,
  setUnit,
  openDay,
  exportUrl,
}: {
  data: Accuracy;
  unit: Unit;
  setUnit: (value: Unit) => void;
  openDay: (date: string) => void;
  exportUrl: string;
}) {
  const chart = data.daily.map((day) => ({
    day: dateText(day.decision_date, { day: "numeric", month: "short" }),
    mae: unitValue(day.metrics.mae_mw, unit),
    bias: unitValue(day.metrics.bias_mw, unit),
  }));
  return (
    <>
      <div className="mb-6 flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
        <span>WINDFOR + WIND</span>
        <span>
          {data.matched_hours.toLocaleString()} /{" "}
          {data.expected_hours.toLocaleString()} hours paired ·{" "}
          {data.forecast_hours} forecast hours
        </span>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(240px,1fr)]">
        {data.matched_hours === 0 && (
          <Alert className="col-span-full my-4">
            <CircleAlert />
            <AlertDescription>
              No forecast and actual pairs exist for this selection. Try a later
              cutoff or another date range.
            </AlertDescription>
          </Alert>
        )}
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Daily forecast error
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                By purchase decision date · next-day delivery
              </p>
            </div>
            <UnitControl unit={unit} setUnit={setUnit} />
          </div>
          <p className="mt-4 text-right text-sm text-muted-foreground">
            {unit}
          </p>
          <div
            className="h-72 w-full sm:h-80"
            role="img"
            aria-label={`Daily mean absolute forecast error and bias in ${unit}. Exact values appear in the daily table.`}
          >
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
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>Positive bias = wind overforecast</span>
            <span>Negative bias = wind underforecast</span>
          </div>
        </section>
        <MetricsRow
          metrics={data.metrics}
          unit={unit}
          coverage={data.matched_hours}
          expected={data.expected_hours}
        />
      </div>
      <Alert role="note" className="mt-6">
        <AlertDescription>
          <div>
            <strong>Historical evidence, with its limits</strong>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Matched-hour metrics use retrospective, possibly revised actuals
              from January and describe in-sample errors, not future
              uncertainty.
            </p>
          </div>
          <Badge variant="outline" className="mt-2">
            IN-SAMPLE
          </Badge>
        </AlertDescription>
      </Alert>
      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Day by day</h2>
          </div>
          <Button variant="link" size="sm" asChild>
            <a href={exportUrl} download>
              Download data <ArrowDownToLine data-icon="inline-end" />
            </a>
          </Button>
        </div>
        <div className="max-w-full">
          <Table
            containerProps={{
              tabIndex: 0,
              "aria-label": "Daily forecast accuracy table",
            }}
          >
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Decision date</TableHead>
                <TableHead scope="col">Delivery date</TableHead>
                <TableHead scope="col" className="text-right tabular-nums">
                  MAE, {unit}
                </TableHead>
                <TableHead scope="col" className="text-right tabular-nums">
                  RMSE, {unit}
                </TableHead>
                <TableHead scope="col" className="text-right tabular-nums">
                  Bias, {unit}
                </TableHead>
                <TableHead scope="col" className="text-right tabular-nums">
                  WAPE
                </TableHead>
                <TableHead scope="col" className="text-right tabular-nums">
                  Paired hours
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.daily.map((day) => (
                <TableRow key={day.decision_date}>
                  <TableHead scope="row">
                    <Button
                      variant="link"
                      size="sm"
                      className="px-0"
                      onClick={() => openDay(day.decision_date)}
                    >
                      {dateText(day.decision_date, {
                        day: "numeric",
                        month: "short",
                      })}
                      <ArrowUpRight />
                    </Button>
                  </TableHead>
                  <TableCell>
                    {dateText(day.delivery_date, {
                      day: "numeric",
                      month: "short",
                    })}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {powerText(day.metrics.mae_mw, unit)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {powerText(day.metrics.rmse_mw, unit)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {powerText(day.metrics.bias_mw, unit, true)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {day.metrics.wape_pct === null
                      ? "Unavailable"
                      : `${day.metrics.wape_pct.toFixed(1)}%`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {day.matched_hours} / {day.expected_hours}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-3 max-w-prose text-sm text-muted-foreground">
          Pooled RMSE is calculated from all hourly errors. It is not the
          average of daily RMSE values. Power is shown in {unit}; WAPE remains a
          percentage.
        </p>
      </section>
    </>
  );
}

function Methodology({ meta }: { meta: Meta | null }) {
  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold tracking-tight">
              A decision-time reconstruction
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Northline reconstructs January 2026 purchase decisions using
              Elexon's national wind forecasts and actual generation. Each
              purchase date targets the next London calendar day, including 1
              February for the 31 January decision.
            </p>
          </div>
        </CardContent>
      </Card>
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">
          How the forecast is selected
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-medium">One cutoff. Each delivery hour.</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The cutoff is configurable from 00:00 to 23:59 in Europe/London.
              For each target hour, use the latest WINDFOR record published at
              or before that cutoff. Different hours may use different issues.
              Later forecasts never fill missing decision-time data.
            </p>
          </div>
          <div>
            <h3 className="font-medium">An explicit application assumption</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The default cutoff is 09:00. The assignment specifies no exchange
              or gate closure. This time is an application assumption, not a
              statement about a particular auction. Dates in this archive are in
              GMT.
            </p>
          </div>
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Aligning forecast and actuals
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A forecast at an hourly timestamp represents the following one-hour
          interval for this analysis. This is an alignment assumption, not a
          guarantee that the source value is an interval average. Its actual is
          the mean of both contributing WIND half-hours. If either is missing,
          that hour has no paired actual or error. There is no interpolation and
          missing values never become zero.
        </p>
        <Table
          containerProps={{
            tabIndex: 0,
            "aria-label": "Forecast alignment formulas",
          }}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Quantity</TableHead>
              <TableHead>Calculation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableHead scope="row">Hourly actual</TableHead>
              <TableCell>
                <code>(first half-hour + second half-hour) / 2</code>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead scope="row">Signed error</TableHead>
              <TableCell>
                <code>forecast − actual</code>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Actual generation is retrospective and can contain revisions. It
          appears only when you enable hindsight in Forecast, or in Accuracy.
          The interval table exposes each contributing half-hour and its source.
        </p>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Reading the error measures
        </h2>
        <Table
          containerProps={{
            tabIndex: 0,
            "aria-label": "Error measure formulas",
          }}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Measure</TableHead>
              <TableHead>Formula</TableHead>
              <TableHead>Meaning</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableHead scope="row">MAE</TableHead>
              <TableCell>
                <code>Σ |error| / n</code>
              </TableCell>
              <TableCell>The average absolute hourly miss.</TableCell>
            </TableRow>
            <TableRow>
              <TableHead scope="row">RMSE</TableHead>
              <TableCell>
                <code>√(Σ error² / n)</code>
              </TableCell>
              <TableCell>Larger misses contribute more.</TableCell>
            </TableRow>
            <TableRow>
              <TableHead scope="row">Mean bias</TableHead>
              <TableCell>
                <code>Σ error / n</code>
              </TableCell>
              <TableCell>Positive means wind was overforecast.</TableCell>
            </TableRow>
            <TableRow>
              <TableHead scope="row">WAPE</TableHead>
              <TableCell>
                <code>100 × Σ |error| / Σ actual</code>
              </TableCell>
              <TableCell>
                Unavailable when summed actual power is zero.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Metrics use matched hours only. Range summaries pool individual hourly
          errors and never average daily RMSE. The 90th percentile absolute
          error uses linear interpolation. All power measures are stored in MW,
          and display units convert consistently.
        </p>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">
          What this evidence supports
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Overforecast wind can increase shortfall exposure, while underforecast
          wind can leave more generation than expected. National generation
          alone cannot determine a customer's electricity purchase. There is no
          customer demand, portfolio position or price feed in this dataset.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This is descriptive evaluation of the January archive. It is not a
          calibrated uncertainty interval, a fitted risk model or a buy
          instruction. No synthetic observations are used.
        </p>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Source provenance
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          WINDFOR provides wind forecasts. WIND provides actual wind generation.
          Every source response is retained with its URL, retrieval timestamp
          and SHA-256 hash. CSV exports preserve the active cutoff, selected
          issues, gaps, source evidence and snapshot identity.
        </p>
        {meta ? (
          <>
            <Table
              containerProps={{
                tabIndex: 0,
                "aria-label": "Snapshot metadata",
              }}
            >
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableHead scope="row">Snapshot retrieved</TableHead>
                  <TableCell>
                    {new Date(meta.retrieved_at).toLocaleString("en-GB", {
                      timeZone: "UTC",
                    })}{" "}
                    UTC
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableHead scope="row">Records</TableHead>
                  <TableCell>
                    {meta.forecast_count.toLocaleString()} forecast ·{" "}
                    {meta.actual_count.toLocaleString()} actual
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableHead scope="row">Snapshot SHA-256</TableHead>
                  <TableCell className="break-all whitespace-normal">
                    {meta.snapshot_sha256}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="mt-6 max-w-full">
              <Table
                containerProps={{
                  tabIndex: 0,
                  "aria-label": "Retained source manifests",
                }}
              >
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Source request</TableHead>
                    <TableHead scope="col">Dataset</TableHead>
                    <TableHead scope="col" className="text-right tabular-nums">
                      Records
                    </TableHead>
                    <TableHead scope="col">Retrieved</TableHead>
                    <TableHead scope="col">Response hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meta.sources.map((source) => (
                    <TableRow key={source.id}>
                      <TableHead scope="row">
                        <Button asChild variant="link" size="xs">
                          <a href={source.url} target="_blank" rel="noreferrer">
                            {source.id}
                            <ExternalLink data-icon="inline-end" />
                          </a>
                        </Button>
                      </TableHead>
                      <TableCell>{source.dataset}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {source.record_count.toLocaleString()}
                      </TableCell>
                      <TableCell>{issueText(source.retrieved_at)}</TableCell>
                      <TableCell>
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="link" size="xs" className="px-0">
                              SHA-256
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <span className="break-all whitespace-normal">
                              {source.sha256}
                            </span>
                            <br />
                            <span className="break-all whitespace-normal">
                              {source.raw_path}
                            </span>
                          </CollapsibleContent>
                        </Collapsible>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <Alert className="col-span-full my-4">
            <AlertDescription>
              Source metadata is unavailable. Return to Forecast and retry
              loading the snapshot.
            </AlertDescription>
          </Alert>
        )}
      </section>
    </div>
  );
}

const container = document.getElementById("root");
if (!container) throw new Error("The application root is missing.");
createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
