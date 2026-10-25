import gzip
import hashlib
import json

import pytest

from backend.snapshot import SnapshotError, load_snapshot
from tests.conftest import observation, write_bundle


def test_snapshot_hash_mismatch_is_rejected(tmp_path):
    write_bundle(tmp_path, [], [])
    path = tmp_path / "snapshot.json.gz"
    path.write_bytes(gzip.compress(b'{"schema_version":1,"forecasts":[],"actuals":[]}'))
    with pytest.raises(SnapshotError, match="Snapshot SHA256"):
        load_snapshot(tmp_path)


def test_raw_source_hash_mismatch_is_rejected(tmp_path):
    write_bundle(tmp_path, [], [])
    (tmp_path / "raw" / "WINDFOR-test.json.gz").write_bytes(gzip.compress(b"[{}]"))
    with pytest.raises(SnapshotError, match="Raw source SHA256"):
        load_snapshot(tmp_path)


def test_conflicting_duplicate_observation_is_rejected(tmp_path):
    write_bundle(tmp_path, [observation("2026-01-02T00:00:00Z", "2026-01-01T09:00:00Z", 10),
                            observation("2026-01-02T00:00:00Z", "2026-01-01T09:00:00Z", 20)], [])
    with pytest.raises(SnapshotError, match="Conflicting duplicate"):
        load_snapshot(tmp_path)


def test_unknown_source_identifier_is_rejected(tmp_path):
    write_bundle(tmp_path, [observation("2026-01-02T00:00:00Z", "2026-01-01T09:00:00Z", 10, "unknown")], [])
    with pytest.raises(SnapshotError, match="Unknown or incorrect source"):
        load_snapshot(tmp_path)


def test_normalized_row_must_exist_in_retained_source(tmp_path):
    write_bundle(tmp_path, [observation("2026-01-02T00:00:00Z", "2026-01-01T09:00:00Z", 10)], [])
    path = tmp_path / "snapshot.json.gz"
    payload = json.loads(gzip.decompress(path.read_bytes()))
    payload["forecasts"][0]["generation_mw"] = 11
    altered = json.dumps(payload).encode()
    path.write_bytes(gzip.compress(altered))
    manifest_path = tmp_path / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    manifest["snapshot_sha256"] = hashlib.sha256(altered).hexdigest()
    manifest_path.write_text(json.dumps(manifest))
    with pytest.raises(SnapshotError, match="does not match retained evidence"):
        load_snapshot(tmp_path)


@pytest.mark.parametrize("start,power", [("2026-01-02T00:30:00Z", 10),
                                         ("2026-01-01T00:00:00Z", 10),
                                         ("2026-01-02T00:00:00Z", float("nan")),
                                         ("2026-01-02T00:00:00Z", True)])
def test_invalid_observation_shape_is_rejected(tmp_path, start, power):
    write_bundle(tmp_path, [observation(start, "2026-01-01T09:00:00Z", power)], [])
    with pytest.raises(SnapshotError):
        load_snapshot(tmp_path)


def test_raw_path_cannot_escape_snapshot_directory(tmp_path):
    write_bundle(tmp_path, [], [])
    manifest_path = tmp_path / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    manifest["sources"][0]["raw_path"] = "data/../../private.json.gz"
    manifest_path.write_text(json.dumps(manifest))
    with pytest.raises(SnapshotError, match="inside data"):
        load_snapshot(tmp_path)
