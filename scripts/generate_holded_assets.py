#!/usr/bin/env python3
"""Exportar en formatos sociales sin recortar textos ni marcas.

Uso: python scripts/generate_holded_assets.py --source imagen.png --output directorio
Requisito: Pillow. Adapta dimensiones sin recrear el arte generado por IA.
"""
import argparse
import io
import warnings
from pathlib import Path
from PIL import Image, ImageCms, ImageOps

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


def open_source_srgb(source_path: Path) -> Image.Image:
    """Normaliza orientacion EXIF y perfiles ICC, preservando transparencia."""
    with Image.open(source_path) as opened:
        rotated = ImageOps.exif_transpose(opened)
        alpha = rotated.getchannel("A") if "A" in rotated.getbands() else None
        embedded_icc = rotated.info.get("icc_profile")
        # CMYK debe conservarse hasta la transformacion ICC.
        color = rotated if rotated.mode in ("RGB", "CMYK", "L") else rotated.convert("RGB")
        if embedded_icc:
            try:
                input_profile = ImageCms.ImageCmsProfile(io.BytesIO(embedded_icc))
                color = ImageCms.profileToProfile(
                    color, input_profile, ImageCms.createProfile("sRGB"), outputMode="RGB"
                )
            except (ImageCms.PyCMSError, OSError, ValueError) as exc:
                raise ValueError(
                    f"No se puede convertir el perfil ICC de {source_path} a sRGB"
                ) from exc
        else:
            if rotated.mode == "CMYK":
                warnings.warn(
                    f"{source_path} es CMYK sin perfil ICC; colores no verificables",
                    stacklevel=2,
                )
            color = color.convert("RGB")
        result = color.convert("RGBA")
        if alpha is not None:
            result.putalpha(alpha)
        return result


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--source", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--background", default="#0D1B2A")
    args = p.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    source = open_source_srgb(args.source)
    srgb_icc = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes()
    for name, size in SIZES.items():
        canvas = Image.new("RGBA", size, args.background)
        fitted = ImageOps.contain(source, size, method=Image.Resampling.LANCZOS)
        canvas.alpha_composite(
            fitted, ((size[0] - fitted.width) // 2, (size[1] - fitted.height) // 2)
        )
        png = args.output / f"{name}.png"
        canvas.convert("RGB").save(png, optimize=True, icc_profile=srgb_icc)
        print(f"{png} : {size[0]}x{size[1]}")


if __name__ == "__main__":
    main()
