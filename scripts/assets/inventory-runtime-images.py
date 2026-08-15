"""Lag et skrivebeskyttet inventar over bildefiler som Vite kan publisere."""

from __future__ import annotations

import argparse
import hashlib
import json
from collections import defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PUBLIC_ROOT = ROOT / "public"
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def inventory(public_root: Path) -> dict[str, Any]:
    files: list[dict[str, Any]] = []
    by_top_folder: dict[str, dict[str, int]] = defaultdict(lambda: {"files": 0, "bytes": 0})
    by_extension: dict[str, dict[str, int]] = defaultdict(lambda: {"files": 0, "bytes": 0})
    duplicate_groups: dict[str, list[str]] = defaultdict(list)

    for path in sorted(public_root.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        relative = path.relative_to(public_root).as_posix()
        size = path.stat().st_size
        extension = path.suffix.lower()
        top_folder = relative.split("/", 1)[0]
        content_hash = sha256(path)
        files.append(
            {
                "path": relative,
                "bytes": size,
                "extension": extension,
                "sha256": content_hash,
            }
        )
        by_top_folder[top_folder]["files"] += 1
        by_top_folder[top_folder]["bytes"] += size
        by_extension[extension]["files"] += 1
        by_extension[extension]["bytes"] += size
        duplicate_groups[content_hash].append(relative)

    total_bytes = sum(entry["bytes"] for entry in files)
    return {
        "publicRoot": str(public_root.resolve()),
        "totalFiles": len(files),
        "totalBytes": total_bytes,
        "totalMB": round(total_bytes / 1024 / 1024, 2),
        "byTopFolder": dict(sorted(by_top_folder.items(), key=lambda item: item[1]["bytes"], reverse=True)),
        "byExtension": dict(sorted(by_extension.items(), key=lambda item: item[1]["bytes"], reverse=True)),
        "largest": sorted(files, key=lambda entry: entry["bytes"], reverse=True)[:50],
        "duplicates": [
            {"sha256": content_hash, "paths": paths, "bytesEach": next(
                entry["bytes"] for entry in files if entry["path"] == paths[0]
            )}
            for content_hash, paths in duplicate_groups.items()
            if len(paths) > 1
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--public-root", type=Path, default=DEFAULT_PUBLIC_ROOT)
    parser.add_argument("--json", type=Path)
    args = parser.parse_args()

    report = inventory(args.public_root.resolve())
    rendered = json.dumps(report, ensure_ascii=False, indent=2)
    print(rendered)
    if args.json:
        output = args.json.resolve()
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(rendered + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
