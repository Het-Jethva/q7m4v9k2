"""Download a reproducible, real Elexon snapshot for January decision dates."""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, date, datetime, timedelta
import gzip
import hashlib
import json
from pathlib import Path
import time
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://data.elexon.co.uk/bmrs/api/v1/datasets/"
TARGET_FROM = "2026-01-02T00:00:00Z"
TARGET_TO = "2026-02-02T00:00:00Z"


def fetch_day(task: tuple[str, date], raw_dir: Path, previous_sources: dict | None = None) -> dict:
    dataset, day = task
    if dataset == "WINDFOR":
        params = {
            "publishDateTimeFrom": f"{day}T00:00:00Z",
            "publishDateTimeTo": f"{day + timedelta(days=1)}T00:00:00Z",
        }
    else:
        params = {"settlementDateFrom": str(day), "settlementDateTo": str(day)}
    url = BASE + dataset + "/stream?" + urlencode(params)
    path = raw_dir / f"{dataset}-{day}.json.gz"
    source_id = f"{dataset}-{day}"
    previous = (previous_sources or {}).get(source_id)
    if path.exists() and previous:
        payload = gzip.decompress(path.read_bytes())
        if previous["url"] != url or previous["sha256"] != hashlib.sha256(payload).hexdigest():
            raise ValueError(f"Cached source does not match its manifest: {source_id}")
        retrieved_at = previous["retrieved_at"]
    else:
        for attempt in range(4):
            try:
                with urlopen(Request(url, headers={"User-Agent": "Northline-assignment/1.0"}), timeout=90) as response:
                    payload = response.read()
                break
            except Exception:
                if attempt == 3:
                    raise
                time.sleep(2 ** attempt)
        records = json.loads(payload)
        if not isinstance(records, list) or not records:
            raise ValueError(f"Unexpected or empty source response for {dataset} {day}")
        path.write_bytes(gzip.compress(payload, mtime=0))
        retrieved_at = datetime.now(UTC).isoformat()
    records = json.loads(payload)
    return {
        "id": source_id, "dataset": dataset, "url": url,
        "retrieved_at": retrieved_at, "sha256": hashlib.sha256(payload).hexdigest(),
        "raw_path": "data/raw/" + path.name,
        "record_count": len(records), "records": records,
    }


def build(output: Path) -> None:
    raw_dir = output / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    previous_manifest = output / "manifest.json"
    previous_sources = {
        row["id"]: row for row in json.loads(previous_manifest.read_text(encoding="utf-8"))["sources"]
    } if previous_manifest.exists() else {}
    tasks = [("WINDFOR", date(2025, 12, 30) + timedelta(days=i)) for i in range(33)]
    tasks += [("FUELHH", date(2026, 1, 2) + timedelta(days=i)) for i in range(31)]
    with ThreadPoolExecutor(max_workers=4) as pool:
        responses = list(pool.map(lambda task: fetch_day(task, raw_dir, previous_sources), tasks))
    forecasts: dict[tuple[str, str], dict] = {}
    actuals: dict[tuple[str, str], dict] = {}
    sources = []
    for response in responses:
        records = response.pop("records")
        sources.append(response)
        for row in records:
            start = row["startTime"]
            if not TARGET_FROM <= start < TARGET_TO:
                continue
            if response["dataset"] == "FUELHH" and row.get("fuelType") != "WIND":
                continue
            observation = {
                "start_time": start, "publish_time": row["publishTime"],
                "generation_mw": row["generation"], "source_id": response["id"],
            }
            collection = forecasts if response["dataset"] == "WINDFOR" else actuals
            key = (start, row["publishTime"])
            if key in collection and collection[key]["generation_mw"] != row["generation"]:
                raise ValueError(f"Conflicting source values at {key}")
            collection.setdefault(key, observation)
    snapshot = {
        "schema_version": 1,
        "forecasts": sorted(forecasts.values(), key=lambda row: (row["start_time"], row["publish_time"])),
        "actuals": sorted(actuals.values(), key=lambda row: (row["start_time"], row["publish_time"])),
    }
    content = json.dumps(snapshot, separators=(",", ":"), sort_keys=True).encode()
    manifest = {
        "schema_version": 1, "retrieved_at": max(source["retrieved_at"] for source in sources),
        "snapshot_sha256": hashlib.sha256(content).hexdigest(),
        "decision_from": "2026-01-01", "decision_to": "2026-01-31",
        "delivery_from": "2026-01-02", "delivery_to": "2026-02-01",
        "forecast_count": len(forecasts), "actual_count": len(actuals),
        "sources": sources,
    }
    output.mkdir(parents=True, exist_ok=True)
    (output / "snapshot.json.gz").write_bytes(gzip.compress(content, mtime=0))
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in manifest.items() if k != "sources"}, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "data")
    build(parser.parse_args().output)
