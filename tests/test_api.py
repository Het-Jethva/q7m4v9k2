import csv
import importlib
import io
import json
from fastapi.testclient import TestClient
import pytest

from backend.app import app, get_snapshot

api = importlib.import_module("backend.app")


@pytest.mark.parametrize("path", [
    "/api/replay?cutoff=9:00", "/api/replay?cutoff=24:00", "/api/replay?cutoff=09:60",
    "/api/replay?cutoff=09:00:00", "/api/replay?cutoff=09:00Z", "/api/replay?cutoff=00:00:01",
    "/api/replay?decision_date=2026-02-01", "/api/replay?decision_date=2025-12-31",
    "/api/replay?decision_date=2026-01-32", "/api/replay?decision_date=20260101",
    "/api/replay?decision_date=2026-01-01T00:00:00Z", "/api/replay?include_actuals=perhaps",
    "/api/accuracy?from_date=2026-01-20&to_date=2026-01-19",
    "/api/accuracy?from_date=2025-12-31", "/api/accuracy?to_date=2026-02-01",
    "/api/accuracy?from_date=2026-13-01", "/api/accuracy?cutoff=09:00:00",
    "/api/replay.csv?cutoff=24:00", "/api/accuracy.csv?from_date=2026-01-31&to_date=2026-01-01",
])
def test_invalid_query_returns_actionable_422(client, path):
    response = client.get(path)
    assert response.status_code == 422
    assert response.json()["detail"]


@pytest.mark.parametrize("cutoff", ["00:00", "09:00", "23:59"])
def test_valid_cutoffs_and_january_bounds(client, cutoff):
    response = client.get("/api/replay", params={"decision_date": "2026-01-31", "cutoff": cutoff})
    assert response.status_code == 200
    payload = response.json()
    assert payload["delivery_date"] == "2026-02-01"
    assert payload["cutoff"] == cutoff
    assert payload["cutoff_time"] == f"2026-01-31T{cutoff}:00Z"


def test_defaults_are_contract_defaults(client):
    replay = client.get("/api/replay").json()
    assert replay["decision_date"] == "2026-01-15"
    assert replay["cutoff"] == "09:00"
    assert replay["include_actuals"] is False
    accuracy = client.get("/api/accuracy").json()
    assert accuracy["from_date"] == "2026-01-01"
    assert accuracy["to_date"] == "2026-01-31"
    assert accuracy["expected_hours"] == 744
    assert len(accuracy["daily"]) == 31


@pytest.mark.parametrize("include_actuals", [False, True])
def test_replay_csv_matches_json_including_gaps_and_provenance(client, sample, include_actuals):
    params = {"decision_date": "2026-01-01", "cutoff": "09:00", "include_actuals": str(include_actuals).lower()}
    payload = client.get("/api/replay", params=params).json()
    response = client.get("/api/replay.csv", params=params)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "attachment;" in response.headers["content-disposition"]
    rows = list(csv.DictReader(io.StringIO(response.text)))
    assert len(rows) == 24
    for exported, interval in zip(rows, payload["intervals"], strict=True):
        assert exported["snapshot_sha256"] == sample.sha256
        assert exported["decision_date"] == payload["decision_date"]
        assert exported["delivery_date"] == payload["delivery_date"]
        assert exported["cutoff_time"] == payload["cutoff_time"]
        assert exported["cutoff"] == payload["cutoff"]
        for key, expected in interval.items():
            if isinstance(expected, list):
                assert json.loads(exported[key]) == expected
            elif expected is None:
                assert exported[key] == ""
            elif isinstance(expected, (int, float)):
                assert float(exported[key]) == expected
            else:
                assert exported[key] == expected


def test_accuracy_csv_matches_daily_replay_and_pooled_sample(client, sample):
    params = {"from_date": "2026-01-01", "to_date": "2026-01-02", "cutoff": "09:00"}
    response = client.get("/api/accuracy.csv", params=params)
    payload = client.get("/api/accuracy", params=params).json()
    rows = list(csv.DictReader(io.StringIO(response.text)))
    assert len(rows) == 48
    assert len([row for row in rows if row["error_mw"]]) == payload["matched_hours"] == 3
    assert {row["snapshot_sha256"] for row in rows} == {sample.sha256}
    for decision in ("2026-01-01", "2026-01-02"):
        replay = client.get("/api/replay", params={"decision_date": decision, "include_actuals": "true"}).json()
        exported = [row for row in rows if row["decision_date"] == decision]
        assert [row["start_time"] for row in exported] == [row["start_time"] for row in replay["intervals"]]
        assert [float(row["error_mw"]) if row["error_mw"] else None for row in exported] == [
            row["error_mw"] for row in replay["intervals"]]


def test_health_and_meta_expose_verified_snapshot_identity(client, sample):
    assert client.get("/api/health").json() == {"status": "ok", "snapshot_sha256": sample.sha256}
    meta = client.get("/api/meta").json()
    assert meta["product"] == "Northline"
    assert meta["timezone"] == "Europe/London"
    assert meta["forecast_count"] == 3
    assert meta["actual_count"] == 6
    assert meta["sources"] == sample.manifest["sources"]
    assert meta["snapshot_sha256"] == sample.sha256


def test_missing_snapshot_returns_503_without_import_failure(tmp_path, monkeypatch):
    app.dependency_overrides.clear()
    get_snapshot.cache_clear()
    monkeypatch.setattr(api, "DATA_DIR", tmp_path)
    with TestClient(app) as client:
        for path in ("/api/health", "/api/meta", "/api/replay", "/api/replay.csv", "/api/accuracy"):
            response = client.get(path)
            assert response.status_code == 503
            assert "scripts/fetch_data.py" in response.json()["detail"]
        assert client.get("/api/replay?cutoff=25:00").status_code == 422
    get_snapshot.cache_clear()


def test_frontend_files_and_routes_do_not_swallow_api_errors(tmp_path, monkeypatch):
    monkeypatch.setattr(api, "DIST_DIR", tmp_path)
    (tmp_path / "index.html").write_text("<html>Northline</html>")
    (tmp_path / "app.js").write_text("console.log('Northline')")
    with TestClient(app) as client:
        assert "Northline" in client.get("/").text
        assert "Northline" in client.get("/replay").text
        assert "console.log" in client.get("/app.js").text
        response = client.get("/api/unknown")
        assert response.status_code == 404
        assert response.headers["content-type"].startswith("application/json")


def test_real_bundled_snapshot_health_and_meta_if_present():
    if not (api.DATA_DIR / "manifest.json").exists():
        pytest.skip("The offline snapshot download has not finished yet")
    app.dependency_overrides.clear()
    get_snapshot.cache_clear()
    with TestClient(app) as client:
        health, meta = client.get("/api/health"), client.get("/api/meta")
        assert health.status_code == meta.status_code == 200
        manifest = json.loads((api.DATA_DIR / "manifest.json").read_text(encoding="utf-8"))
        assert health.json()["snapshot_sha256"] == meta.json()["snapshot_sha256"] == manifest["snapshot_sha256"]
        assert len(meta.json()["sources"]) == 64
        assert meta.json()["forecast_count"] > 0
        assert meta.json()["actual_count"] > 0
