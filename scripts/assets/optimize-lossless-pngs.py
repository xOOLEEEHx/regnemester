"""Komprimer utvalgte store PNG-kart tapsfritt og verifiser pikslene."""

from __future__ import annotations

from pathlib import Path
from tempfile import NamedTemporaryFile

from PIL import Image, ImageChops


ROOT = Path(__file__).resolve().parents[2]
MAPS_DIR = ROOT / "public" / "regnemester" / "maps"
FILES = (
    "tallvokterens-rike-v4.png",
    "world-map-v2.png",
)
TOKEN_DIR = ROOT / "public" / "regnemester" / "Spillbrikkene"


def optimize(source_path: Path) -> None:
    with Image.open(source_path) as source:
        source.load()
        original_pixels = source.convert("RGBA")
        with NamedTemporaryFile(suffix=".png", delete=False, dir=source_path.parent) as temporary:
            temporary_path = Path(temporary.name)
        try:
            source.save(temporary_path, format="PNG", optimize=True, compress_level=9)
            with Image.open(temporary_path) as compressed:
                compressed.load()
                if ImageChops.difference(original_pixels, compressed.convert("RGBA")).getbbox() is not None:
                    raise ValueError(f"Pikslene ble endret i {source_path.name}")
            if temporary_path.stat().st_size < source_path.stat().st_size:
                temporary_path.replace(source_path)
        finally:
            temporary_path.unlink(missing_ok=True)


if __name__ == "__main__":
    for filename in FILES:
        optimize(MAPS_DIR / filename)
    for token_path in TOKEN_DIR.glob("*.png"):
        optimize(token_path)
