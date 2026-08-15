"""Konverter eksplisitt valgte runtimebilder med dimensjons- og alfakontroll."""

from __future__ import annotations

import argparse
import fnmatch
import json
import os
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from tempfile import NamedTemporaryFile, TemporaryDirectory
from typing import Any

from PIL import Image, ImageChops, features


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONFIG = Path(__file__).with_name("image-optimization-config.json")
DEFAULT_PUBLIC_ROOT = ROOT / "public"


@dataclass(frozen=True)
class ConversionResult:
    path: str
    destination: str
    profile: str
    sourceBytes: int
    outputBytes: int
    savingsPercent: float
    width: int
    height: int
    hasAlpha: bool
    accepted: bool
    reason: str


def load_config(path: Path) -> dict[str, Any]:
    config = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(config.get("profiles"), dict) or not config["profiles"]:
        raise ValueError("Konfigurasjonen mangler profiles")
    if not isinstance(config.get("groups"), dict):
        raise ValueError("Konfigurasjonen mangler groups")
    return config


def is_protected(relative_path: str, patterns: list[str]) -> bool:
    normalized = relative_path.replace("\\", "/").lower()
    name = Path(normalized).name
    name_tokens = set(re.split(r"[^a-z0-9æøå]+", Path(name).stem))
    if name_tokens.intersection({"mask", "collision", "template"}):
        return True
    for pattern in patterns:
        lowered_pattern = pattern.lower()
        technical_marker = next(
            (marker for marker in ("mask", "collision", "template") if f"*{marker}*" in lowered_pattern),
            None,
        )
        if technical_marker and technical_marker not in name_tokens:
            continue
        if fnmatch.fnmatch(normalized, lowered_pattern) or fnmatch.fnmatch(
            f"x/{normalized}", lowered_pattern
        ):
            return True
    return False


def image_has_alpha(image: Image.Image) -> bool:
    return "A" in image.getbands() or "transparency" in image.info


def alpha_channel(image: Image.Image) -> Image.Image:
    return image.convert("RGBA").getchannel("A")


def destination_for(source_path: Path, profile: dict[str, Any]) -> Path:
    output_format = str(profile["format"]).lower()
    if output_format == "webp":
        return source_path.with_suffix(".webp")
    if output_format == "png":
        return source_path.with_suffix(".png")
    raise ValueError(f"Ukjent bildeformat: {output_format}")


def save_candidate(source: Image.Image, destination: Path, profile: dict[str, Any]) -> None:
    output_format = str(profile["format"]).lower()
    if output_format == "webp":
        source.save(
            destination,
            format="WEBP",
            quality=int(profile["quality"]),
            method=int(profile.get("method", 6)),
            exact=image_has_alpha(source),
            exif=b"",
            xmp=b"",
            icc_profile=None,
        )
        return
    if output_format == "png":
        source.save(
            destination,
            format="PNG",
            optimize=bool(profile.get("optimize", True)),
            compress_level=int(profile.get("compressLevel", 9)),
        )
        return
    raise ValueError(f"Ukjent bildeformat: {output_format}")


def convert_file(
    source_path: Path,
    relative_path: str,
    profile_name: str,
    profile: dict[str, Any],
    *,
    apply: bool,
    temporary_root: Path,
) -> ConversionResult:
    source_bytes = source_path.stat().st_size
    destination_path = destination_for(source_path, profile)
    temporary_path = temporary_root / f"{source_path.stem}-{profile_name}{destination_path.suffix}"
    temporary_path.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(source_path) as source:
        source.load()
        original_size = source.size
        has_alpha = image_has_alpha(source)
        original_pixels = source.convert("RGBA") if profile.get("pixelExact") else None
        original_alpha = alpha_channel(source) if has_alpha else None
        save_candidate(source, temporary_path, profile)

    with Image.open(temporary_path) as converted:
        converted.load()
        if converted.size != original_size:
            raise ValueError(
                f"Dimensjonene ble endret for {relative_path}: {original_size} -> {converted.size}"
            )
        converted_has_alpha = image_has_alpha(converted)
        if has_alpha and not converted_has_alpha:
            raise ValueError(f"Alfakanalen forsvant for {relative_path}")
        if original_alpha is not None:
            converted_alpha = alpha_channel(converted)
            if ImageChops.difference(original_alpha, converted_alpha).getbbox() is not None:
                raise ValueError(f"Alfakanalen ble endret for {relative_path}")
        if original_pixels is not None:
            converted_pixels = converted.convert("RGBA")
            if ImageChops.difference(original_pixels, converted_pixels).getbbox() is not None:
                raise ValueError(f"Pikslene ble endret for tapsfri fil {relative_path}")

    output_bytes = temporary_path.stat().st_size
    savings_percent = round((1 - output_bytes / source_bytes) * 100, 2) if source_bytes else 0.0
    minimum = float(profile.get("minSavingsPercent", 0))
    accepted = savings_percent >= minimum
    reason = "accepted" if accepted else f"besparelse {savings_percent}% er under kravet {minimum}%"

    if apply and accepted:
        destination_path.parent.mkdir(parents=True, exist_ok=True)
        os.replace(temporary_path, destination_path)
    else:
        temporary_path.unlink(missing_ok=True)

    return ConversionResult(
        path=relative_path,
        destination=Path(relative_path).with_suffix(destination_path.suffix).as_posix(),
        profile=profile_name,
        sourceBytes=source_bytes,
        outputBytes=output_bytes,
        savingsPercent=savings_percent,
        width=original_size[0],
        height=original_size[1],
        hasAlpha=has_alpha,
        accepted=accepted,
        reason=reason,
    )


def matches_any_glob(relative_path: str, patterns: list[str]) -> bool:
    normalized = relative_path.replace("\\", "/")
    return any(
        fnmatch.fnmatch(normalized, pattern.replace("\\", "/"))
        or fnmatch.fnmatch(f"x/{normalized}", pattern.replace("\\", "/"))
        for pattern in patterns
    )


def resolve_entries(
    config: dict[str, Any],
    requested_groups: list[str],
    all_groups: bool,
    public_root: Path,
) -> list[dict[str, str]]:
    groups: dict[str, list[dict[str, Any]]] = config["groups"]
    names = list(groups) if all_groups else requested_groups
    if not names:
        raise ValueError("Velg minst én --group eller bruk --all")
    entries: list[dict[str, str]] = []
    profiles_by_path: dict[str, str] = {}
    for name in names:
        if name not in groups:
            raise ValueError(f"Ukjent gruppe: {name}")
        for entry in groups[name]:
            profile = entry.get("profile")
            if not isinstance(profile, str) or not profile:
                raise ValueError(f"Bildeoppføringen i gruppen {name} mangler profile")

            if isinstance(entry.get("path"), str):
                paths = [entry["path"].replace("\\", "/")]
            elif isinstance(entry.get("glob"), str):
                exclude_globs = entry.get("excludeGlobs", [])
                if not isinstance(exclude_globs, list) or not all(
                    isinstance(pattern, str) for pattern in exclude_globs
                ):
                    raise ValueError(f"Ugyldig excludeGlobs i gruppen {name}")
                paths = sorted(
                    candidate.relative_to(public_root).as_posix()
                    for candidate in public_root.glob(entry["glob"])
                    if candidate.is_file()
                    and not matches_any_glob(candidate.relative_to(public_root).as_posix(), exclude_globs)
                )
            else:
                raise ValueError(f"Bildeoppføringen i gruppen {name} mangler path eller glob")

            for relative_path in paths:
                existing_profile = profiles_by_path.get(relative_path)
                if existing_profile and existing_profile != profile:
                    raise ValueError(
                        f"Bildefilen {relative_path} er valgt med både {existing_profile} og {profile}"
                    )
                if existing_profile:
                    continue
                profiles_by_path[relative_path] = profile
                entries.append({"path": relative_path, "profile": profile})
    return entries


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--public-root", type=Path, default=DEFAULT_PUBLIC_ROOT)
    parser.add_argument("--group", action="append", default=[])
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()

    if args.apply and args.dry_run:
        raise ValueError("Bruk enten --apply eller --dry-run, ikke begge")
    if not features.check("webp"):
        raise RuntimeError("Pillow mangler WebP-støtte")

    config = load_config(args.config.resolve())
    public_root = args.public_root.resolve()
    entries = resolve_entries(config, args.group, args.all, public_root)
    patterns = list(config.get("protectedPathPatterns", []))
    results: list[ConversionResult] = []

    with TemporaryDirectory(prefix="regnemester-image-output-") as temporary:
        temporary_root = Path(temporary)
        for entry in entries:
            relative_path = entry["path"].replace("\\", "/")
            profile_name = entry["profile"]
            if profile_name not in config["profiles"]:
                raise ValueError(f"Ukjent profil: {profile_name}")
            profile = config["profiles"][profile_name]
            if str(profile["format"]).lower() != "png" and is_protected(relative_path, patterns):
                raise ValueError(f"Beskyttet teknisk bilde kan ikke tapskomprimeres: {relative_path}")
            source_path = public_root / Path(relative_path)
            if not source_path.is_file():
                raise FileNotFoundError(f"Bildefilen finnes ikke: {source_path}")
            results.append(
                convert_file(
                    source_path,
                    relative_path,
                    profile_name,
                    profile,
                    apply=args.apply,
                    temporary_root=temporary_root,
                )
            )

    report = {
        "mode": "apply" if args.apply else "dry-run",
        "accepted": sum(result.accepted for result in results),
        "rejected": sum(not result.accepted for result in results),
        "sourceBytes": sum(result.sourceBytes for result in results),
        "outputBytes": sum(result.outputBytes for result in results if result.accepted),
        "results": [asdict(result) for result in results],
    }
    rendered = json.dumps(report, ensure_ascii=False, indent=2)
    print(rendered)
    if args.report:
        output = args.report.resolve()
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(rendered + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
