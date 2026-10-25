"""Independently compare API replays with retained Elexon responses."""

from __future__ import annotations

import argparse
from datetime import date, datetime, timedelta
import gzip
import hashlib
import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]


def verify(base_url: str | None, live: bool, report_path: Path) -> None:
    manifest = json.loads((ROOT / "data/manifest.json").read_text())
    content = gzip.decompress((ROOT / "data/snapshot.json.gz").read_bytes())
    assert hashlib.sha256(content).hexdigest() == manifest["snapshot_sha256"], "Snapshot checksum mismatch"
    snapshot = json.loads(content)
    forecasts = {}
    actuals = {}
    live_checks = []
    for source in manifest["sources"]:
        raw = gzip.decompress((ROOT / source["raw_path"]).read_bytes())
        assert hashlib.sha256(raw).hexdigest() == source["sha256"], source["id"]
        records = json.loads(raw)
        assert len(records) == source["record_count"], source["id"]
        if live and source["id"] in {"WINDFOR-2026-01-15", "FUELHH-2026-01-16"}:
            with urlopen(source["url"], timeout=60) as response:
                current = json.load(response)
            assert current == records, f"Source has changed since snapshot: {source['id']}"
            live_checks.append(source["id"])
        for row in records:
            if not "2026-01-02T00:00:00Z" <= row["startTime"] < "2026-02-02T00:00:00Z":
                continue
            if source["dataset"] == "WINDFOR":
                key = row["startTime"], row["publishTime"]
                if key in forecasts:
                    assert forecasts[key] == row["generation"], f"Conflicting forecast {key}"
                forecasts[key] = row["generation"]
            elif row["fuelType"] == "WIND":
                key = row["startTime"], row["publishTime"]
                if key in actuals:
                    assert actuals[key] == row["generation"], f"Conflicting actual {key}"
                actuals[key] = row["generation"]
    assert forecasts == {(r["start_time"], r["publish_time"]): r["generation_mw"] for r in snapshot["forecasts"]}
    assert actuals == {(r["start_time"], r["publish_time"]): r["generation_mw"] for r in snapshot["actuals"]}
    latest_actual = {}
    for (target, publication), value in sorted(actuals.items()):
        latest_actual[target] = value
    checked_intervals = 0
    missing_forecasts = 0
    missing_actuals = 0
    api_replays = 0
    for day_number in range(1, 32):
        purchase = date(2026, 1, day_number)
        delivery = purchase + timedelta(days=1)
        for cutoff in ["00:00", "09:00", "12:00", "23:59"]:
            cutoff_iso = f"{purchase}T{cutoff}:00Z"
            expected = {}
            for (target, publication), value in sorted(forecasts.items()):
                if target[:10] == str(delivery) and publication <= cutoff_iso:
                    expected[target] = (publication, value)
            replay = None
            if base_url:
                query = urlencode({"decision_date": str(purchase), "cutoff": cutoff, "include_actuals": "true"})
                with urlopen(base_url.rstrip("/") + "/api/replay?" + query, timeout=30) as response:
                    replay = json.load(response)
                assert replay["decision_date"] == str(purchase)
                assert replay["delivery_date"] == str(delivery)
                assert len(replay["intervals"]) == 24
                api_replays += 1
            for hour in range(24):
                target = f"{delivery}T{hour:02d}:00:00Z"
                half = f"{delivery}T{hour:02d}:30:00Z"
                forecast = expected.get(target)
                actual = (latest_actual[target] + latest_actual[half]) / 2 if target in latest_actual and half in latest_actual else None
                missing_forecasts += forecast is None
                missing_actuals += actual is None
                if replay:
                    row = replay["intervals"][hour]
                    assert datetime.fromisoformat(row["start_time"].replace("Z", "+00:00")) == datetime.fromisoformat(target.replace("Z", "+00:00"))
                    assert row["forecast_mw"] == (forecast[1] if forecast else None), (purchase, cutoff, hour)
                    if forecast:
                        assert datetime.fromisoformat(row["publish_time"].replace("Z", "+00:00")) == datetime.fromisoformat(forecast[0].replace("Z", "+00:00"))
                    assert row["actual_mw"] == actual
                    assert row["error_mw"] == (forecast[1] - actual if forecast and actual is not None else None)
                checked_intervals += 1
    report = {
        "snapshot_sha256": manifest["snapshot_sha256"],
        "raw_responses_verified": len(manifest["sources"]),
        "forecast_observations_verified": len(forecasts),
        "actual_observations_verified": len(actuals),
        "decision_cutoffs": ["00:00", "09:00", "12:00", "23:59"],
        "hourly_intervals_checked": checked_intervals,
        "missing_forecasts": missing_forecasts,
        "missing_actual_pairs": missing_actuals,
        "api_replays_verified": api_replays,
        "live_source_responses_verified": live_checks,
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url")
    parser.add_argument("--live", action="store_true")
    parser.add_argument("--report", type=Path, default=ROOT / "docs/data-verification.json")
    args = parser.parse_args()
    verify(args.base_url, args.live, args.report)
