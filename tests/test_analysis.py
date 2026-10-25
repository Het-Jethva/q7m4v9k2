from datetime import date, time
import math

import pytest

from backend.analysis import accuracy, replay
from tests.conftest import observation


def test_known_error_metrics_and_linear_percentile(sample):
    result = replay(sample, date(2026, 1, 1), time(9), True)
    assert result["expected_hours"] == 24
    assert result["forecast_hours"] == result["matched_hours"] == 3
    assert result["metrics"] == pytest.approx({
        "n": 3, "mae_mw": 80 / 3, "rmse_mw": math.sqrt(1000), "bias_mw": 40 / 3,
        "wape_pct": 80 / 3, "p90_abs_error_mw": 44,
        "mean_actual_mw": 100, "mean_forecast_mw": 340 / 3,
    })
    assert [row["error_mw"] for row in result["intervals"][:3]] == [10, -20, 50]
    assert result["mean_forecast_mw"] == pytest.approx(340 / 3)
    assert result["peak_forecast_mw"] == 150
    assert result["min_forecast_mw"] == 80


def test_default_replay_hides_all_actual_evidence_and_metrics(sample):
    result = replay(sample, date(2026, 1, 1), time(9))
    assert result["metrics"] is None
    assert result["matched_hours"] == 0
    assert result["include_actuals"] is False
    for row in result["intervals"]:
        assert row["actual_mw"] is row["error_mw"] is None
        assert row["actual_source_ids"] == row["actual_half_hours"] == []
        assert row["status"] == ("forecast_only" if row["forecast_mw"] is not None else "missing_forecast")


def test_per_target_latest_publication_includes_cutoff_and_never_uses_future(bundle):
    snapshot = bundle([
        observation("2026-01-02T00:00:00Z", "2026-01-01T08:00:00Z", 10),
        observation("2026-01-02T00:00:00Z", "2026-01-01T09:00:00Z", 20),
        observation("2026-01-02T00:00:00Z", "2026-01-01T09:00:01Z", 30),
        observation("2026-01-02T01:00:00Z", "2026-01-01T09:01:00Z", 40),
        observation("2026-01-02T02:00:00Z", "2025-12-31T09:00:00Z", 50),
        observation("2026-01-02T02:00:00Z", "2026-01-01T08:00:00Z", 60),
    ])
    result = replay(snapshot, date(2026, 1, 1), time(9))
    assert [row["forecast_mw"] for row in result["intervals"][:3]] == [20, None, 60]
    assert result["intervals"][1]["publish_time"] is None
    assert result["oldest_publish_time"] == "2026-01-01T08:00:00Z"
    assert result["latest_publish_time"] == "2026-01-01T09:00:00Z"


def test_midnight_cutoff_and_month_end_delivery(bundle):
    snapshot = bundle([
        observation("2026-02-01T00:00:00Z", "2026-01-30T23:59:59Z", 10),
        observation("2026-02-01T00:00:00Z", "2026-01-31T00:00:00Z", 20),
        observation("2026-02-01T00:00:00Z", "2026-01-31T00:00:01Z", 30),
        observation("2026-02-01T23:00:00Z", "2026-01-30T09:00:00Z", 40),
    ])
    result = replay(snapshot, date(2026, 1, 31), time())
    assert result["cutoff_time"] == "2026-01-31T00:00:00Z"
    assert result["delivery_date"] == "2026-02-01"
    assert result["intervals"][0]["forecast_mw"] == 20
    assert result["intervals"][-1]["start_time"] == "2026-02-01T23:00:00Z"
    assert result["intervals"][-1]["forecast_mw"] == 40


def test_latest_actual_revisions_require_both_half_hours(bundle):
    forecast = [observation("2026-01-02T00:00:00Z", "2026-01-01T09:00:00Z", 100),
                observation("2026-01-02T01:00:00Z", "2026-01-01T09:00:00Z", 200)]
    actuals = [observation("2026-01-02T00:00:00Z", "2026-01-02T00:31:00Z", 20, "FUELHH-test"),
               observation("2026-01-02T00:00:00Z", "2026-01-04T00:00:00Z", 80, "FUELHH-test"),
               observation("2026-01-02T00:30:00Z", "2026-01-03T00:00:00Z", 100, "FUELHH-test"),
               observation("2026-01-02T01:00:00Z", "2026-01-03T00:00:00Z", 50, "FUELHH-test")]
    result = replay(bundle(forecast, actuals), date(2026, 1, 1), time(9), True)
    first, incomplete = result["intervals"][:2]
    assert first["actual_mw"] == 90
    assert first["error_mw"] == 10
    assert first["actual_half_hours"][0]["publish_time"] == "2026-01-04T00:00:00Z"
    assert len(first["actual_half_hours"]) == 2
    assert incomplete["actual_mw"] is incomplete["error_mw"] is None
    assert incomplete["status"] == "missing_actual"
    assert len(incomplete["actual_half_hours"]) == 1
    assert result["matched_hours"] == result["metrics"]["n"] == 1


def test_zero_actual_denominator_and_zero_forecast_are_distinct_from_gaps(bundle):
    forecasts = [observation("2026-01-02T00:00:00Z", "2026-01-01T09:00:00Z", 0)]
    actuals = [observation(f"2026-01-02T00:{minute}:00Z", "2026-01-03T00:00:00Z", 0, "FUELHH-test")
               for minute in ("00", "30")]
    result = replay(bundle(forecasts, actuals), date(2026, 1, 1), time(9), True)
    assert result["metrics"]["n"] == 1
    assert result["metrics"]["wape_pct"] is None
    assert result["metrics"]["mae_mw"] == result["metrics"]["rmse_mw"] == 0
    assert result["intervals"][0]["status"] == "matched"


def test_no_matching_observations_returns_null_metrics(bundle):
    result = replay(bundle(), date(2026, 1, 1), time(9), True)
    assert result["metrics"]["n"] == 0
    assert all(value is None for key, value in result["metrics"].items() if key != "n")
    assert result["mean_forecast_mw"] is result["peak_forecast_mw"] is result["min_forecast_mw"] is None
    assert result["latest_publish_time"] is result["oldest_publish_time"] is None
    assert all(row["forecast_mw"] is None for row in result["intervals"])


def test_accuracy_pools_errors_instead_of_averaging_daily_rmse(bundle):
    forecasts, actuals = [], []
    for day, hour, power in ((2, 0, 100), (3, 0, 110), (3, 1, 110)):
        forecasts.append(observation(f"2026-01-{day:02d}T{hour:02d}:00:00Z", "2026-01-01T09:00:00Z", power))
        for minute in (0, 30):
            actuals.append(observation(f"2026-01-{day:02d}T{hour:02d}:{minute:02d}:00Z",
                                       "2026-01-04T00:00:00Z", 100, "FUELHH-test"))
    result = accuracy(bundle(forecasts, actuals), date(2026, 1, 1), date(2026, 1, 2), time(9))
    assert result["expected_hours"] == 48
    assert result["metrics"]["n"] == result["matched_hours"] == 3
    assert result["metrics"]["rmse_mw"] == pytest.approx(math.sqrt(200 / 3))
    assert [day["metrics"]["rmse_mw"] for day in result["daily"]] == [0, 10]
    assert len(result["errors"]) == 3
