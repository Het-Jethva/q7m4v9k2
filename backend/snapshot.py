from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
import gzip
import hashlib
import json
import math
from pathlib import Path
from types import MappingProxyType
from typing import Any, Mapping


class SnapshotError(ValueError):
    pass


def timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None or parsed.utcoffset().total_seconds() != 0:
        raise SnapshotError(f"Expected a UTC timestamp, received {value!r}")
    return parsed.astimezone(UTC)


def iso(value: datetime) -> str:
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")


@dataclass(frozen=True)
class Observation:
    start_time: datetime
    publish_time: datetime
    generation_mw: float
    source_id: str

    def evidence(self) -> dict[str, Any]:
        return {"start_time": iso(self.start_time), "publish_time": iso(self.publish_time),
                "generation_mw": self.generation_mw, "source_id": self.source_id}


@dataclass(frozen=True)
class Snapshot:
    manifest: Mapping[str, Any]
    forecasts: Mapping[datetime, tuple[Observation, ...]]
    actuals: Mapping[datetime, tuple[Observation, ...]]

    @property
    def sha256(self) -> str:
        return self.manifest["snapshot_sha256"]


def _index(rows: list, sources: dict, dataset: str, evidence: dict) -> Mapping:
    observations: dict[tuple[datetime, datetime], Observation] = {}
    for row in rows:
        source_id = row["source_id"]
        if source_id not in sources or sources[source_id]["dataset"] != dataset:
            raise SnapshotError(f"Unknown or incorrect source {source_id!r} for {dataset}")
        start, publication = timestamp(row["start_time"]), timestamp(row["publish_time"])
        raw_power = row["generation_mw"]
        if isinstance(raw_power, bool) or not isinstance(raw_power, (int, float)) or not math.isfinite(raw_power):
            raise SnapshotError("Generation must be a finite number")
        power = float(raw_power)
        if not datetime(2026, 1, 2, tzinfo=UTC) <= start < datetime(2026, 2, 2, tzinfo=UTC):
            raise SnapshotError("An observation falls outside the delivery scope")
        if start.second or start.microsecond or start.minute not in ((0,) if dataset == "WINDFOR" else (0, 30)):
            raise SnapshotError(f"Invalid {dataset} interval start")
        observation = Observation(start, publication, power, source_id)
        key = (start, publication)
        if key in observations and observations[key] != observation:
            raise SnapshotError(f"Conflicting duplicate at {iso(start)}, {iso(publication)}")
        if (start, publication, power) not in evidence[source_id]:
            raise SnapshotError(f"Observation does not match retained evidence in {source_id}")
        observations[key] = observation
    grouped: dict[datetime, list[Observation]] = {}
    for observation in observations.values():
        grouped.setdefault(observation.start_time, []).append(observation)
    return MappingProxyType({start: tuple(sorted(history, key=lambda item: item.publish_time))
                             for start, history in grouped.items()})


def load_snapshot(directory: Path) -> Snapshot:
    try:
        manifest = json.loads((directory / "manifest.json").read_text(encoding="utf-8"))
        content = gzip.decompress((directory / "snapshot.json.gz").read_bytes())
        if hashlib.sha256(content).hexdigest() != manifest["snapshot_sha256"]:
            raise SnapshotError("Snapshot SHA256 does not match manifest")
        payload = json.loads(content)
        if manifest["schema_version"] != 1 or payload["schema_version"] != 1:
            raise SnapshotError("Unsupported snapshot schema")
        scope = {"decision_from": "2026-01-01", "decision_to": "2026-01-31",
                 "delivery_from": "2026-01-02", "delivery_to": "2026-02-01"}
        if any(manifest.get(key) != value for key, value in scope.items()):
            raise SnapshotError("Manifest scope must cover January 2026 decisions")
        timestamp(manifest["retrieved_at"])
        sources: dict[str, dict] = {}
        evidence: dict[str, set] = {}
        for source in manifest["sources"]:
            source_id = source["id"]
            if source_id in sources or source["dataset"] not in ("WINDFOR", "FUELHH"):
                raise SnapshotError("Duplicate source identifier or unknown dataset")
            timestamp(source["retrieved_at"])
            if not source["url"].startswith("https://data.elexon.co.uk/bmrs/api/v1/datasets/"):
                raise SnapshotError("Source URL is not an Elexon dataset request")
            relative = Path(source["raw_path"])
            if relative.is_absolute() or relative.parts[0] != "data" or ".." in relative.parts:
                raise SnapshotError("Raw source path must stay inside data/")
            raw_path = directory.joinpath(*relative.parts[1:]).resolve()
            if not raw_path.is_relative_to(directory.resolve()):
                raise SnapshotError("Raw source path escapes the data directory")
            raw = gzip.decompress(raw_path.read_bytes())
            if hashlib.sha256(raw).hexdigest() != source["sha256"]:
                raise SnapshotError(f"Raw source SHA256 mismatch for {source_id}")
            records = json.loads(raw)
            if not isinstance(records, list) or len(records) != source["record_count"]:
                raise SnapshotError(f"Raw source record count mismatch for {source_id}")
            evidence[source_id] = {
                (timestamp(row["startTime"]), timestamp(row["publishTime"]), row["generation"])
                for row in records if source["dataset"] == "WINDFOR" or row.get("fuelType") == "WIND"
            }
            sources[source_id] = source
        for field in ("forecasts", "actuals"):
            if not isinstance(payload[field], list) or len(payload[field]) != manifest[f"{field[:-1]}_count"]:
                raise SnapshotError(f"Snapshot {field} count does not match manifest")
        forecasts = _index(payload["forecasts"], sources, "WINDFOR", evidence)
        actuals = _index(payload["actuals"], sources, "FUELHH", evidence)
        return Snapshot(MappingProxyType(manifest), forecasts, actuals)
    except SnapshotError:
        raise
    except (OSError, ValueError, TypeError, KeyError, IndexError, AttributeError, OverflowError) as error:
        raise SnapshotError(f"Cannot validate bundled snapshot: {error}") from error
