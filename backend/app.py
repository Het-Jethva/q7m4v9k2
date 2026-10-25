from __future__ import annotations

import csv
from dataclasses import dataclass
from datetime import date, time, timedelta
from functools import lru_cache
import io
import json
from pathlib import Path
import re

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.responses import FileResponse, Response

from backend.analysis import accuracy, replay
from backend.snapshot import Snapshot, SnapshotError, load_snapshot

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
DIST_DIR = ROOT / "dist"
app = FastAPI(title="Northline", description="Decision-time wind forecast replay", version="1.0.0")


@lru_cache(maxsize=1)
def get_snapshot() -> Snapshot:
    try:
        return load_snapshot(DATA_DIR)
    except SnapshotError as error:
        raise HTTPException(status_code=503, detail=(
            f"Bundled Elexon snapshot is unavailable or invalid. {error}. "
            "Run python scripts/fetch_data.py from the project root, then restart or redeploy the application."
        )) from error


def _decision(value: str, name: str) -> date:
    try:
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
            raise ValueError
        parsed = date.fromisoformat(value)
    except ValueError as error:
        raise HTTPException(422, detail=f"{name} must be a valid YYYY-MM-DD date.") from error
    if not date(2026, 1, 1) <= parsed <= date(2026, 1, 31):
        raise HTTPException(422, detail=f"{name} must be between 2026-01-01 and 2026-01-31.")
    return parsed


def _cutoff(value: str) -> time:
    if not re.fullmatch(r"(?:[01]\d|2[0-3]):[0-5]\d", value):
        raise HTTPException(422, detail="cutoff must be HH:MM from 00:00 through 23:59 in Europe/London.")
    return time.fromisoformat(value)


@dataclass(frozen=True)
class ReplayQuery:
    decision_date: date
    cutoff: time
    include_actuals: bool


@dataclass(frozen=True)
class AccuracyQuery:
    from_date: date
    to_date: date
    cutoff: time


def replay_query(decision_date: str = Query("2026-01-15"), cutoff: str = Query("09:00"),
                 include_actuals: bool = Query(False)) -> ReplayQuery:
    return ReplayQuery(_decision(decision_date, "decision_date"), _cutoff(cutoff), include_actuals)


def accuracy_query(from_date: str = Query("2026-01-01"), to_date: str = Query("2026-01-31"),
                   cutoff: str = Query("09:00")) -> AccuracyQuery:
    first, last = _decision(from_date, "from_date"), _decision(to_date, "to_date")
    if first > last:
        raise HTTPException(422, detail="from_date must be on or before to_date.")
    return AccuracyQuery(first, last, _cutoff(cutoff))


@app.get("/api/health")
def health(snapshot: Snapshot = Depends(get_snapshot)) -> dict:
    return {"status": "ok", "snapshot_sha256": snapshot.sha256}


@app.get("/api/meta")
def meta(snapshot: Snapshot = Depends(get_snapshot)) -> dict:
    return {"product": "Northline", "default_cutoff": "09:00", "timezone": "Europe/London",
            **{key: value for key, value in snapshot.manifest.items() if key != "schema_version"}}


@app.get("/api/replay")
def replay_json(query: ReplayQuery = Depends(replay_query), snapshot: Snapshot = Depends(get_snapshot)) -> dict:
    return replay(snapshot, query.decision_date, query.cutoff, query.include_actuals)


@app.get("/api/accuracy")
def accuracy_json(query: AccuracyQuery = Depends(accuracy_query), snapshot: Snapshot = Depends(get_snapshot)) -> dict:
    return accuracy(snapshot, query.from_date, query.to_date, query.cutoff)


CSV_FIELDS = ["decision_date", "delivery_date", "cutoff", "cutoff_time", "include_actuals", "start_time",
              "forecast_mw", "publish_time", "forecast_source_id", "actual_mw", "actual_source_ids",
              "actual_half_hours", "error_mw", "status", "snapshot_sha256"]


def _csv(snapshot: Snapshot, days: list[dict], filename: str) -> Response:
    stream = io.StringIO(newline="")
    writer = csv.DictWriter(stream, fieldnames=CSV_FIELDS)
    writer.writeheader()
    for day in days:
        context = {key: day[key] for key in ("decision_date", "delivery_date", "cutoff", "cutoff_time", "include_actuals")}
        for interval in day["intervals"]:
            row = {**context, **interval, "snapshot_sha256": snapshot.sha256}
            for field in ("actual_source_ids", "actual_half_hours"):
                row[field] = json.dumps(row[field], separators=(",", ":"))
            writer.writerow(row)
    return Response(stream.getvalue(), media_type="text/csv", headers={
        "Content-Disposition": f'attachment; filename="{filename}"',
    })


@app.get("/api/replay.csv")
def replay_csv(query: ReplayQuery = Depends(replay_query), snapshot: Snapshot = Depends(get_snapshot)) -> Response:
    day = replay(snapshot, query.decision_date, query.cutoff, query.include_actuals)
    return _csv(snapshot, [day], f"northline-replay-{query.decision_date}-{query.cutoff.strftime('%H%M')}.csv")


@app.get("/api/accuracy.csv")
def accuracy_csv(query: AccuracyQuery = Depends(accuracy_query), snapshot: Snapshot = Depends(get_snapshot)) -> Response:
    days = [replay(snapshot, query.from_date + timedelta(days=offset), query.cutoff, True)
            for offset in range((query.to_date - query.from_date).days + 1)]
    return _csv(snapshot, days, f"northline-accuracy-{query.from_date}-to-{query.to_date}-{query.cutoff.strftime('%H%M')}.csv")


@app.get("/{path:path}", include_in_schema=False)
def frontend(path: str) -> FileResponse:
    if path == "api" or path.startswith("api/"):
        raise HTTPException(404, detail="Unknown API endpoint.")
    candidate = (DIST_DIR / path).resolve()
    if not candidate.is_relative_to(DIST_DIR.resolve()):
        raise HTTPException(404, detail="File not found.")
    if candidate.is_file():
        return FileResponse(candidate)
    index = DIST_DIR / "index.html"
    if index.is_file():
        return FileResponse(index)
    raise HTTPException(404, detail="Frontend build unavailable. Run npm run build, or use the development frontend.")
