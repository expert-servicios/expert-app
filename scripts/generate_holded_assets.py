#!/usr/bin/env python3
"""Exportar en formatos sociales sin recortar textos ni marcas.
Uso: python scripts/generate_holded_assets.py --source imagen.png --output directorio
Requisito: Pillow. No recrea el arte generado por IA, solo adapta tamanos.
"""
import argparse
from pathlib import Path
from PIL import Image, ImageOps

SIZES = {
    "og_1200x630": (1200, 630),
    "facebook_linkedin_1200x627": (1200, 627),
    "x_card_1200x675": (1200, 675),
    "youtube_1280x720": (1280, 720),
    "linkedin_cover_1584x396": (1584, 396),
    "instagram_square_1080x1080": (1080, 1080),
    "ads_square_1200x1200": (1200, 1200),
    "instagram_portrait_1080x1350": (1080, 1350),
    "stories_1080x1920": (1080, 1920),
}

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--source", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--background", default="#0D1B2A")
    args = p.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    source = Image.open(args.source).convert("RGBA")
    for name, size in SIZES.items():
        canvas = Image.new("RGBA", size, args.background)
        fitted = ImageOps.contain(source, size, method=Image.Resampling.LANCZOS)
        canvas.alpha_composite(fitted, ((size[0]-fitted.width)//2, (size[1]-fitted.height)//2))
        png = args.output / f"{name}.png"
        canvas.convert("RGB").save(png, optimize=True)
        print(f"{png} : {size[0]}x{size[1]}")

if __name__ == "__main__":
    main()
