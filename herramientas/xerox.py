"""
xerox.py — convierte fotos crudas en fotocopias.

No es un filtro bonito: tira todo el gris y deja blanco puro y negro puro,
que es como funcionan los carteles que te gustan.

Uso:
    py herramientas/xerox.py fotos/ciclismo
    py herramientas/xerox.py fotos/mias --trama puntos --contraste 3.2
    py herramientas/xerox.py fotos/mias/IMG_0423.jpg --trama umbral --umbral 140

Las fotocopias salen en  fotos/_procesadas/  y los originales no se tocan.
"""

import argparse
import pathlib
import random
import sys

try:
    from PIL import Image, ImageDraw, ImageEnhance, ImageOps
except ImportError:
    sys.exit("Falta Pillow.  Instálalo con:  py -m pip install Pillow")

# Los HEIC del iPhone: Pillow no los lee solo.
try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError:
    pass

EXTS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".bmp", ".heic", ".heif"}


def abrir(ruta: pathlib.Path) -> Image.Image:
    """Abre la foto respetando la rotación que grabó el teléfono."""
    try:
        im = Image.open(ruta)
    except Exception as e:
        if ruta.suffix.lower() in {".heic", ".heif"}:
            raise RuntimeError(
                "Es un HEIC de iPhone y Pillow no lo lee solo.\n"
                "    Arréglalo con:  py -m pip install pillow-heif\n"
                "    O exporta como JPG desde el teléfono."
            ) from e
        raise
    return ImageOps.exif_transpose(im)


def preparar(im, ancho, contraste, brillo):
    """Gris, tamaño, y el rango estirado hasta que duela."""
    im = im.convert("L")
    if im.width > ancho:
        im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)
    im = ImageOps.autocontrast(im, cutoff=2)
    if brillo != 1.0:
        im = ImageEnhance.Brightness(im).enhance(brillo)
    return ImageEnhance.Contrast(im).enhance(contraste)


def trama_puntos(gris, celda=5, angulo=45):
    """
    Semitono de verdad: una rejilla girada de puntos cuyo tamaño crece
    donde la foto es oscura. Es lo que hace una imprenta, no una fotocopiadora,
    pero es la trama que se ve en tus referencias.
    """
    g = gris.rotate(-angulo, expand=True, fillcolor=255)
    out = Image.new("L", g.size, 255)
    dib = ImageDraw.Draw(out)
    maximo = celda * 1.42
    for y in range(0, g.height, celda):
        for x in range(0, g.width, celda):
            bloque = g.crop((x, y, min(x + celda, g.width), min(y + celda, g.height)))
            if not bloque.width or not bloque.height:
                continue
            oscuridad = 1 - (sum(bloque.getdata()) / (len(bloque.getdata()) * 255))
            r = (oscuridad ** 0.72) * maximo / 2
            if r > 0.3:
                cx, cy = x + celda / 2, y + celda / 2
                dib.ellipse((cx - r, cy - r, cx + r, cy + r), fill=0)
    out = out.rotate(angulo, expand=True, fillcolor=255)
    # recorta el marco que deja la rotación
    w, h = gris.size
    cx, cy = out.width // 2, out.height // 2
    return out.crop((cx - w // 2, cy - h // 2, cx - w // 2 + w, cy - h // 2 + h))


def ensuciar(im, cantidad, semilla):
    """Polvo y pelusa del cristal de la fotocopiadora."""
    if cantidad <= 0:
        return im
    rnd = random.Random(semilla)
    im = im.convert("L")
    dib = ImageDraw.Draw(im)
    motas = int(im.width * im.height * cantidad / 1000)
    for _ in range(motas):
        x, y = rnd.randrange(im.width), rnd.randrange(im.height)
        largo = rnd.choice((1, 1, 1, 2, 2, 4, 7))
        color = 0 if rnd.random() < 0.6 else 255
        if rnd.random() < 0.3:
            dib.line((x, y, x + rnd.randint(-largo, largo), y + largo), fill=color)
        else:
            dib.point((x, y), fill=color)
    return im


def procesar(ruta, destino, args):
    im = abrir(ruta)
    gris = preparar(im, args.ancho, args.contraste, args.brillo)

    if args.trama == "puntos":
        salida = trama_puntos(gris, celda=args.celda, angulo=args.angulo)
        salida = ensuciar(salida, args.suciedad, args.semilla)
    elif args.trama == "umbral":
        salida = ensuciar(gris, args.suciedad, args.semilla)
        salida = salida.point(lambda p: 255 if p > args.umbral else 0, mode="1")
    else:  # dither — Floyd-Steinberg, la trama sucia del fanzine
        salida = ensuciar(gris, args.suciedad, args.semilla)
        salida = salida.convert("1")

    salida = salida.convert("L")
    if args.invertir:
        salida = ImageOps.invert(salida)

    destino.parent.mkdir(parents=True, exist_ok=True)
    salida.save(destino, "PNG", optimize=True)
    return salida.size, destino.stat().st_size


def main():
    p = argparse.ArgumentParser(description="Convierte fotos en fotocopias.")
    p.add_argument("entrada", help="Un archivo o una carpeta")
    p.add_argument("--salida", default="fotos/_procesadas")
    p.add_argument("--trama", choices=("dither", "puntos", "umbral"), default="dither",
                   help="dither = fanzine (por defecto) · puntos = semitono de imprenta · umbral = stencil duro")
    p.add_argument("--ancho", type=int, default=1500)
    p.add_argument("--contraste", type=float, default=2.6, help="Súbelo hasta que se rompa")
    p.add_argument("--brillo", type=float, default=1.0)
    p.add_argument("--umbral", type=int, default=128, help="Solo con --trama umbral")
    p.add_argument("--celda", type=int, default=5, help="Tamaño del punto, solo con --trama puntos")
    p.add_argument("--angulo", type=int, default=45, help="Giro de la rejilla, solo con --trama puntos")
    p.add_argument("--suciedad", type=float, default=0.35, help="Polvo. 0 lo apaga")
    p.add_argument("--invertir", action="store_true", help="Negativo: blanco sobre negro")
    p.add_argument("--semilla", type=int, default=7)
    args = p.parse_args()

    entrada = pathlib.Path(args.entrada)
    salida = pathlib.Path(args.salida)

    if entrada.is_file():
        fotos = [entrada]
    else:
        fotos = sorted(f for f in entrada.rglob("*") if f.suffix.lower() in EXTS)

    if not fotos:
        sys.exit(f"No encontré fotos en {entrada}")

    print(f"{len(fotos)} foto(s) · trama {args.trama} · contraste {args.contraste}\n")
    fallos = 0
    for f in fotos:
        destino = salida / (f.stem + f"--{args.trama}.png")
        try:
            (w, h), peso = procesar(f, destino, args)
            print(f"  {f.name[:40]:42s} -> {destino.name[:40]:44s} {w}x{h}  {peso // 1024} KB")
        except Exception as e:
            fallos += 1
            print(f"  {f.name[:40]:42s} -> ERROR: {e}")

    print(f"\nListas en {salida}/")
    if fallos:
        print(f"{fallos} no se pudieron abrir.")
    print("Si queda muy gris, sube --contraste. Si se come la cara, bájalo.")


if __name__ == "__main__":
    main()
