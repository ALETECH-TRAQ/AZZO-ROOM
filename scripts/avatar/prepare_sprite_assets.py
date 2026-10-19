"""Prepare generated eight-direction avatar sheets for the isometric prototype.

The image generator returns a transparent sheet with a small amount of colored
edge noise. Keep this deterministic cleanup in the repository so regenerated
art follows the same alpha and frame layout rules.
"""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT.parent / "generated_images"
OUTPUT_DIR = ROOT / "apps" / "web" / "public" / "sprites" / "avatars"

SHEETS = {
    "masc": "exec-c517b02e-071d-442c-b569-0d0c3aed26ca.png",
    "fem": "exec-8b596573-edd9-4576-b78e-0288913a4aa9.png",
}


def clean_sheet(source: Path, destination: Path) -> None:
    image = Image.open(source).convert("RGBA")
    frame_width = image.width / 8
    alpha = image.getchannel("A")
    cleaned = Image.new("L", image.size, 0)
    for index in range(8):
        left = round(index * frame_width)
        right = round((index + 1) * frame_width)
        frame_alpha = alpha.crop((left, 0, right, image.height))
        # The generator's edge matte contains saturated red/yellow pixels with
        # low opacity; keep only solid subject pixels and clean the fringe.
        frame_alpha = frame_alpha.point(lambda value: value if value >= 220 else 0)
        cleaned.paste(frame_alpha, (left, 0))

    image.putalpha(cleaned)
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, optimize=True)


def main() -> None:
    for name, filename in SHEETS.items():
        source = SOURCE_DIR / filename
        if not source.exists():
            raise SystemExit(f"Missing generated sheet: {source}")
        clean_sheet(source, OUTPUT_DIR / f"{name}-base-8dir.png")


if __name__ == "__main__":
    main()
