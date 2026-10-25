from datetime import date
import json
import os
from pathlib import Path
import shutil

from scripts.fetch_data import fetch_day


def test_cached_source_keeps_retrieval_time_after_checkout(tmp_path):
    root = Path(__file__).resolve().parents[1]
    manifest = json.loads((root / "data/manifest.json").read_text())
    source = next(row for row in manifest["sources"] if row["id"] == "WINDFOR-2025-12-30")
    raw_dir = tmp_path / "raw"
    raw_dir.mkdir()
    raw_file = raw_dir / "WINDFOR-2025-12-30.json.gz"
    shutil.copyfile(root / source["raw_path"], raw_file)
    os.utime(raw_file, (946684800, 946684800))

    result = fetch_day(("WINDFOR", date(2025, 12, 30)), raw_dir, {source["id"]: source})

    assert result["retrieved_at"] == source["retrieved_at"]
    assert result["sha256"] == source["sha256"]
    assert result["raw_path"] == "data/raw/WINDFOR-2025-12-30.json.gz"
