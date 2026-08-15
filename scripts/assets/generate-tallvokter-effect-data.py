"""Generer kompakte runtime-data fra Tallvokterens manuelle effektmaler.

Krever Pillow. Kildefilene ligger utenfor public slik at de ikke sendes til
elevenes enheter, mens de små genererte filene kan publiseres av Vite.
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "source-assets" / "regnemester" / "maps" / "tallvokter-fx" / "manual"
LEGACY_SOURCE_DIR = ROOT / "public" / "regnemester" / "maps" / "tallvokter-fx" / "manual"
RUNTIME_DIR = ROOT / "public" / "regnemester" / "maps" / "tallvokter-fx" / "runtime"
REGIONS_FILE = (
    ROOT
    / "src"
    / "regnereisen-bossreisen"
    / "showcase"
    / "tallvokterWaterfallRegions.generated.ts"
)

MAP_WIDTH = 3840
MAP_HEIGHT = 2560
MASK_WIDTH = MAP_WIDTH // 2
MASK_HEIGHT = MAP_HEIGHT // 2
GRID_SCALE = 4
MIN_COMPONENT_CELLS = 3


def source_path(filename: str) -> Path:
    preferred = SOURCE_DIR / filename
    return preferred if preferred.exists() else LEGACY_SOURCE_DIR / filename


def is_marker(pixel: tuple[int, ...]) -> bool:
    red, green, blue = pixel[:3]
    return red >= 235 and green <= 40 and blue >= 235


def generate_water_mask() -> None:
    source = Image.open(source_path("tallvokter-water-mask-manual-template.png")).convert("RGB")
    if source.size != (MAP_WIDTH, MAP_HEIGHT):
        raise ValueError(f"Uventet vannmaskestørrelse: {source.size}")

    pixels = source.load()
    alpha = Image.new("L", (MASK_WIDTH, MASK_HEIGHT), 0)
    output = alpha.load()
    for y in range(MASK_HEIGHT):
        for x in range(MASK_WIDTH):
            marked = sum(
                is_marker(pixels[x * 2 + offset_x, y * 2 + offset_y])
                for offset_y in range(2)
                for offset_x in range(2)
            )
            output[x, y] = round(marked / 4 * 255)

    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
    rgba = Image.new("RGBA", alpha.size, (255, 255, 255, 0))
    rgba.putalpha(alpha)
    rgba.save(RUNTIME_DIR / "tallvokter-water-mask.png", optimize=True, compress_level=9)


def generate_waterfall_regions() -> None:
    source = Image.open(source_path("tallvokter-waterfalls-manual-template.png")).convert("RGB")
    if source.size != (MAP_WIDTH, MAP_HEIGHT):
        raise ValueError(f"Uventet fossefallmaskestørrelse: {source.size}")

    pixels = source.load()
    grid_width = (MAP_WIDTH + GRID_SCALE - 1) // GRID_SCALE
    grid_height = (MAP_HEIGHT + GRID_SCALE - 1) // GRID_SCALE
    occupied: set[tuple[int, int]] = set()
    for y in range(MAP_HEIGHT):
        for x in range(MAP_WIDTH):
            if is_marker(pixels[x, y]):
                occupied.add((x // GRID_SCALE, y // GRID_SCALE))

    regions: list[dict[str, float]] = []
    while occupied:
        start = occupied.pop()
        queue = deque([start])
        component = [start]
        while queue:
            x, y = queue.popleft()
            for offset_y in (-1, 0, 1):
                for offset_x in (-1, 0, 1):
                    if offset_x == 0 and offset_y == 0:
                        continue
                    neighbor = (x + offset_x, y + offset_y)
                    if neighbor not in occupied:
                        continue
                    occupied.remove(neighbor)
                    component.append(neighbor)
                    queue.append(neighbor)

        if len(component) < MIN_COMPONENT_CELLS:
            continue
        xs = [point[0] for point in component]
        ys = [point[1] for point in component]
        left = min(xs) * GRID_SCALE
        top = min(ys) * GRID_SCALE
        right = min(MAP_WIDTH, (max(xs) + 1) * GRID_SCALE)
        bottom = min(MAP_HEIGHT, (max(ys) + 1) * GRID_SCALE)
        regions.append(
            {
                "x": (left + right) / 2,
                "y": top,
                "width": max(10, right - left),
                "height": max(12, bottom - top),
            }
        )

    regions.sort(key=lambda region: (region["y"], region["x"]))
    lines = [
        "// Generert av scripts/assets/generate-tallvokter-effect-data.py.",
        "// Endre den manuelle kildemasken og kjør generatoren i stedet for å redigere her.",
        "import type { WaterfallRegion } from './manualWaterfalls';",
        "",
        "export const TALLVOKTER_WATERFALL_REGIONS: readonly WaterfallRegion[] = [",
    ]
    for region in regions:
        values = ", ".join(f"{key}: {value:g}" for key, value in region.items())
        lines.append(f"  {{ {values} }},")
    lines.extend([
        "] as const;",
        "",
    ])
    REGIONS_FILE.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    generate_water_mask()
    generate_waterfall_regions()
