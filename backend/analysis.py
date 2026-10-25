from __future__ import annotations

from bisect import bisect_right
from datetime import date, datetime, time, timedelta
import math
from typing import Any
from zoneinfo import ZoneInfo

from backend.snapshot import Snapshot, iso, timestamp


def metrics(intervals: list[dict[str, Any]]) -> dict[str, Any]:
    matched = [row for row in intervals if row["error_mw"] is not None]
    n = len(matched)
    result = dict.fromkeys(("mae_mw", "rmse_mw", "bias_mw", "wape_pct", "p90_abs_error_mw",
                            "mean_actual_mw", "mean_forecast_mw"))
    result["n"] = n
    if not n:
        return result
    errors = [row["error_mw"] for row in matched]
    absolute = sorted(abs(error) for error in errors)
    actual_sum = math.fsum(row["actual_mw"] for row in matched)
    position = (n - 1) * 0.9
    lower, upper = math.floor(position), math.ceil(position)
    result.update({
        "mae_mw": math.fsum(absolute) / n,
        "rmse_mw": math.sqrt(math.fsum(error * error for error in errors) / n),
        "bias_mw": math.fsum(errors) / n,
        "wape_pct": 100 * math.fsum(absolute) / actual_sum if actual_sum else None,
        "p90_abs_error_mw": absolute[lower] + (absolute[upper] - absolute[lower]) * (position - lower),
        "mean_actual_mw": actual_sum / n,
        "mean_forecast_mw": math.fsum(row["forecast_mw"] for row in matched) / n,
    })
    return result


def replay(snapshot: Snapshot, decision_date: date, cutoff: time, include_actuals: bool = False) -> dict[str, Any]:
    london = ZoneInfo("Europe/London")
    cutoff_time = datetime.combine(decision_date, cutoff, london)
    delivery_date = decision_date + timedelta(days=1)
    midnight = datetime.combine(delivery_date, time(), london)
    intervals = []
    for hour in range(24):
        start = midnight + timedelta(hours=hour)
        history = snapshot.forecasts.get(start, ())
        selected_index = bisect_right(history, cutoff_time, key=lambda item: item.publish_time) - 1
        forecast = history[selected_index] if selected_index >= 0 else None
        actual_halves = []
        if include_actuals:
            for half in (start, start + timedelta(minutes=30)):
                revisions = snapshot.actuals.get(half, ())
                if revisions:
                    actual_halves.append(revisions[-1])
        actual = math.fsum(item.generation_mw for item in actual_halves) / 2 if len(actual_halves) == 2 else None
        error = forecast.generation_mw - actual if forecast is not None and actual is not None else None
        status = ("missing_forecast" if forecast is None else "forecast_only" if not include_actuals
                  else "missing_actual" if actual is None else "matched")
        intervals.append({
            "start_time": iso(start), "forecast_mw": forecast.generation_mw if forecast else None,
            "publish_time": iso(forecast.publish_time) if forecast else None,
            "forecast_source_id": forecast.source_id if forecast else None,
            "actual_mw": actual, "actual_source_ids": list(dict.fromkeys(item.source_id for item in actual_halves)),
            "actual_half_hours": [item.evidence() for item in actual_halves], "error_mw": error, "status": status,
        })
    forecast_rows = [row for row in intervals if row["forecast_mw"] is not None]
    powers = [row["forecast_mw"] for row in forecast_rows]
    issues = [row["publish_time"] for row in forecast_rows]
    return {
        "decision_date": str(decision_date), "delivery_date": str(delivery_date),
        "cutoff": cutoff.strftime("%H:%M"), "cutoff_time": iso(cutoff_time), "include_actuals": include_actuals,
        "expected_hours": len(intervals), "forecast_hours": len(forecast_rows),
        "matched_hours": sum(row["error_mw"] is not None for row in intervals),
        "mean_forecast_mw": math.fsum(powers) / len(powers) if powers else None,
        "peak_forecast_mw": max(powers) if powers else None, "min_forecast_mw": min(powers) if powers else None,
        "latest_publish_time": max(issues, key=timestamp) if issues else None,
        "oldest_publish_time": min(issues, key=timestamp) if issues else None,
        "metrics": metrics(intervals) if include_actuals else None, "intervals": intervals,
    }


def accuracy(snapshot: Snapshot, from_date: date, to_date: date, cutoff: time) -> dict[str, Any]:
    days = [replay(snapshot, from_date + timedelta(days=offset), cutoff, True)
            for offset in range((to_date - from_date).days + 1)]
    intervals = [row for day in days for row in day["intervals"]]
    return {
        "from_date": str(from_date), "to_date": str(to_date), "cutoff": cutoff.strftime("%H:%M"),
        **{key: sum(day[key] for day in days) for key in ("expected_hours", "forecast_hours", "matched_hours")},
        "metrics": metrics(intervals),
        "daily": [{key: day[key] for key in ("decision_date", "delivery_date", "expected_hours",
                                              "forecast_hours", "matched_hours", "metrics")} for day in days],
        "errors": [{key: row[key] for key in ("start_time", "forecast_mw", "actual_mw", "error_mw")}
                   for row in intervals if row["error_mw"] is not None],
    }
