import { useEffect, useRef, useState } from "react";
import { z } from "zod";

const nullableNumber = z.number().nullable();
export const metricsSchema = z.object({
  n: z.number(),
  mae_mw: nullableNumber,
  rmse_mw: nullableNumber,
  bias_mw: nullableNumber,
  wape_pct: nullableNumber,
  p90_abs_error_mw: nullableNumber,
  mean_actual_mw: nullableNumber,
  mean_forecast_mw: nullableNumber,
});
export const metaSchema = z.object({
  product: z.string(),
  decision_from: z.string(),
  decision_to: z.string(),
  delivery_from: z.string(),
  delivery_to: z.string(),
  default_cutoff: z.string(),
  timezone: z.string(),
  retrieved_at: z.string(),
  snapshot_sha256: z.string(),
  forecast_count: z.number(),
  actual_count: z.number(),
  sources: z.array(
    z.object({
      id: z.string(),
      dataset: z.string(),
      url: z.string(),
      retrieved_at: z.string(),
      sha256: z.string(),
      raw_path: z.string(),
      record_count: z.number(),
    }),
  ),
});
export const replaySchema = z.object({
  decision_date: z.string(),
  delivery_date: z.string(),
  cutoff: z.string(),
  cutoff_time: z.string(),
  include_actuals: z.boolean(),
  expected_hours: z.number(),
  forecast_hours: z.number(),
  matched_hours: z.number(),
  mean_forecast_mw: nullableNumber,
  peak_forecast_mw: nullableNumber,
  min_forecast_mw: nullableNumber,
  latest_publish_time: z.string().nullable(),
  oldest_publish_time: z.string().nullable(),
  metrics: metricsSchema.nullable(),
  intervals: z.array(
    z.object({
      start_time: z.string(),
      forecast_mw: nullableNumber,
      publish_time: z.string().nullable(),
      forecast_source_id: z.string().nullable(),
      actual_mw: nullableNumber,
      actual_source_ids: z.array(z.string()),
      actual_half_hours: z.array(
        z.object({
          start_time: z.string(),
          publish_time: z.string().nullable(),
          generation_mw: z.number(),
          source_id: z.string(),
        }),
      ),
      error_mw: nullableNumber,
      status: z.enum([
        "matched",
        "forecast_only",
        "missing_forecast",
        "missing_actual",
      ]),
    }),
  ),
});
export const accuracySchema = z.object({
  from_date: z.string(),
  to_date: z.string(),
  cutoff: z.string(),
  expected_hours: z.number(),
  forecast_hours: z.number(),
  matched_hours: z.number(),
  metrics: metricsSchema,
  daily: z.array(
    z.object({
      decision_date: z.string(),
      delivery_date: z.string(),
      expected_hours: z.number(),
      forecast_hours: z.number(),
      matched_hours: z.number(),
      metrics: metricsSchema,
    }),
  ),
  errors: z.array(
    z.object({
      start_time: z.string(),
      forecast_mw: z.number(),
      actual_mw: z.number(),
      error_mw: z.number(),
    }),
  ),
});
export type Replay = z.infer<typeof replaySchema>;
export type Accuracy = z.infer<typeof accuracySchema>;
export type Meta = z.infer<typeof metaSchema>;
export type Metrics = z.infer<typeof metricsSchema>;

export type Resource<T> =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: T };
const errorSchema = z.object({
  detail: z.union([z.string(), z.array(z.object({ msg: z.string() }))]),
});

export function useApi<T>(
  url: string | null,
  schema: z.ZodType<T>,
  revision = 0,
): Resource<T> {
  const cache = useRef(new Map<string, { revision: number; data: T }>());
  const [result, setResult] = useState<{
    url: string | null;
    revision: number;
    resource: Resource<T>;
  }>({ url, revision, resource: { kind: "loading" } });
  useEffect(() => {
    if (url === null) return;
    const requestUrl = url;
    const cached = cache.current.get(url);
    if (cached?.revision === revision) {
      setResult({
        url,
        revision,
        resource: { kind: "ready", data: cached.data },
      });
      return;
    }
    const controller = new AbortController();
    let active = true;
    setResult({ url, revision, resource: { kind: "loading" } });
    async function fetchData() {
      try {
        const response = await fetch(requestUrl, { signal: controller.signal });
        const body: unknown = await response.json();
        if (!response.ok) {
          const parsed = errorSchema.safeParse(body);
          const detail = parsed.success
            ? parsed.data.detail
            : `The server returned ${response.status}.`;
          throw new Error(
            typeof detail === "string"
              ? detail
              : detail.map((item) => item.msg).join(" "),
          );
        }
        const parsed = schema.safeParse(body);
        if (!parsed.success)
          throw new Error(
            "The data response has an unexpected format. Check the API and bundled snapshot, then retry.",
          );
        if (active) {
          cache.current.set(requestUrl, { revision, data: parsed.data });
          setResult({
            url,
            revision,
            resource: { kind: "ready", data: parsed.data },
          });
        }
      } catch (error) {
        if (active && !controller.signal.aborted)
          setResult({
            url,
            revision,
            resource: {
              kind: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "The data could not be loaded.",
            },
          });
      }
    }
    void fetchData();
    return () => {
      active = false;
      controller.abort();
    };
  }, [url, schema, revision]);
  return result.url === url && result.revision === revision
    ? result.resource
    : { kind: "loading" };
}

export function replayParams(
  decision: string,
  cutoff: string,
  actuals: boolean,
) {
  return new URLSearchParams({
    decision_date: decision,
    cutoff,
    include_actuals: String(actuals),
  }).toString();
}
export function accuracyParams(from: string, to: string, cutoff: string) {
  return new URLSearchParams({
    from_date: from,
    to_date: to,
    cutoff,
  }).toString();
}
