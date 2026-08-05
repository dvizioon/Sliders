from PIL import Image
from pathlib import Path

BASE = Path(__file__).resolve().parents[1] / "images" / "monitores"
BG = (26, 30, 40)  # --surface
TARGET_WIDTH = 720
NAMES = ("daniel-estevao", "luis-gustavo")


def load_image(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def trim_transparent(image: Image.Image) -> Image.Image:
    alpha = image.split()[-1]
    bbox = alpha.getbbox()
    if not bbox:
        return image
    return image.crop(bbox)


def crop_to_aspect_top(image: Image.Image, ratio: float) -> Image.Image:
    width, height = image.size
    current = width / height

    if current > ratio:
        new_width = int(height * ratio)
        left = (width - new_width) // 2
        return image.crop((left, 0, left + new_width, height))

    new_height = int(width / ratio)
    return image.crop((0, 0, width, new_height))


def resize_width(image: Image.Image, width: int) -> Image.Image:
    height = int(image.height * (width / image.width))
    return image.resize((width, height), Image.Resampling.LANCZOS)


def export_jpg(image: Image.Image, path: Path) -> None:
    flat = Image.new("RGB", image.size, BG)
    flat.paste(image, mask=image.split()[-1])
    flat.save(path, "JPEG", quality=92)


def process(name: str, ratio: float | None = None) -> Image.Image:
    png_path = BASE / f"{name}.png"
    jpg_path = BASE / f"{name}.jpg"
    source_path = png_path if png_path.exists() else jpg_path

    image = trim_transparent(load_image(source_path))
    if ratio is not None:
        image = crop_to_aspect_top(image, ratio)
    image = resize_width(image, TARGET_WIDTH)
    export_jpg(image, jpg_path)

    if png_path.exists():
        image.save(png_path, "PNG")

    return image


def main() -> None:
    daniel = process("daniel-estevao")
    ratio = daniel.width / daniel.height
    luis = process("luis-gustavo", ratio)
    print("daniel", daniel.size, "ratio", round(ratio, 4))
    print("luis", luis.size)


if __name__ == "__main__":
    main()
