import gzip
import hashlib
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.app import app, get_snapshot
from backend.snapshot import load_snapshot


def observation(start: str, publication: str, power: float, source: str = "WINDFOR-test") -> dict:
    return {"start_time": start, "publish_time": publication, "generation_mw": power, "source_id": source}


def write_bundle(directory: Path, forecasts: list[dict], actuals: list[dict]) -> None:
    raw_dir = directory / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    sources = []
    retrieved = "2026-10-25T00:00:00Z"
    for dataset, source_id, observations in (("WINDFOR", "WINDFOR-test", forecasts),
                                              ("FUELHH", "FUELHH-test", actuals)):
        rows = [{"startTime": row["start_time"], "publishTime": row["publish_time"],
                 "generation": row["generation_mw"], "fuelType": "WIND"} for row in observations]
        raw = json.dumps(rows).encode()
        raw_path = raw_dir / f"{source_id}.json.gz"
        raw_path.write_bytes(gzip.compress(raw))
        sources.append({"id": source_id, "dataset": dataset,
                        "url": f"https://data.elexon.co.uk/bmrs/api/v1/datasets/{dataset}/stream?test=true",
                        "retrieved_at": retrieved, "sha256": hashlib.sha256(raw).hexdigest(),
                        "raw_path": f"data/raw/{raw_path.name}", "record_count": len(rows)})
    content = json.dumps({"schema_version": 1, "forecasts": forecasts, "actuals": actuals}).encode()
    (directory / "snapshot.json.gz").write_bytes(gzip.compress(content))
    manifest = {"schema_version": 1, "retrieved_at": retrieved,
                "snapshot_sha256": hashlib.sha256(content).hexdigest(),
                "decision_from": "2026-01-01", "decision_to": "2026-01-31",
                "delivery_from": "2026-01-02", "delivery_to": "2026-02-01",
                "forecast_count": len(forecasts), "actual_count": len(actuals), "sources": sources}
    (directory / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")


@pytest.fixture
def bundle(tmp_path):
    def build(forecasts=(), actuals=()):
        write_bundle(tmp_path, list(forecasts), list(actuals))
        return load_snapshot(tmp_path)
    return build


@pytest.fixture
def sample(bundle):
    forecasts, actuals = [], []
    for hour, forecast in enumerate((110, 80, 150)):
        start = f"2026-01-02T{hour:02d}:00:00Z"
        forecasts.append(observation(start, "2026-01-01T09:00:00Z", forecast))
        for minute in (0, 30):
            actuals.append(observation(f"2026-01-02T{hour:02d}:{minute:02d}:00Z",
                                       "2026-01-03T00:00:00Z", 100, "FUELHH-test"))
    return bundle(forecasts, actuals)


@pytest.fixture
def client(sample):
    app.dependency_overrides[get_snapshot] = lambda: sample
    with TestClient(app) as session:
        yield session
    app.dependency_overrides.clear()
