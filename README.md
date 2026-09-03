# Landing page — portafolio de diseño

Sitio de una sola página, sin frameworks ni build. Doble clic en `index.html` y funciona.

Dirección visual: portafolio impreso escaneado. Negro de montaje, planchas de papel con
bordes rasgados, cinta roja, fotocopia a dos tintas y tipografía tapada por barras.

```
index.html    → contenido, estructura y filtros SVG
styles.css    → toda la parte visual
script.js     → menú móvil, año del footer, aparición al scroll
```

## Qué editar antes de publicar

Busca los comentarios `<!-- EDITA: ... -->` dentro de `index.html`:

| Qué | Dónde |
|---|---|
| Tu nombre | nav, cinta vertical de la portada, footer |
| Tu firma | `.signature` en `#ficha` y `.card-contact__sign` en `#contacto` |
| Experiencia y formación | bloque `.cv` en `#ficha` |
| Correo y redes | `.card-contact` en `#contacto` |
| Los 4 proyectos | `.plates` en `#trabajo` |
| Título y descripción para Google y redes | `<title>`, `<meta name="description">`, Open Graph |

## Poner tus imágenes reales

Las planchas de proyecto y la portada son composiciones hechas con CSS, para que el sitio
funcione sin depender de imágenes. En cuanto tengas las tuyas, se reemplazan directo.

**Proyectos** — crea `img/` y cambia cada bloque:

```html
<div class="plate__img plate__img--a" aria-hidden="true"></div>
```

por:

```html
<img class="plate__img" src="img/proyecto-1.jpg" alt="Identidad para plataforma de IA">
```

La imagen hereda sola el filtro de fotocopia y la trama de puntos. Formato: 1200×900 px
(o 900×1200 para la vertical), `.webp` o `.jpg`.

**Portada** — añade tu escaneo o ilustración a la plancha de papel, en `styles.css`:

```css
.slab--paper{
  background-image: url("img/portada.jpg");
  background-size: cover;
  background-position: center;
}
```

Para redes, añade `og.jpg` (1200×630 px) en la raíz.

## Cómo están hechas las texturas

Los tres filtros viven al inicio de `index.html`, dentro del `<svg class="defs">`:

| Filtro | Qué hace | Dónde se usa |
|---|---|---|
| `#torn` | Rasga el borde desplazándolo con ruido | plancha de la portada |
| `#torn2` | Igual pero más fino | hoja de la ficha, tarjeta de contacto |
| `#xerox` | Desatura y aplasta los tonos: fotocopia | planchas de proyecto |

Si quieres el borde **más rasgado**, sube el `scale` del `feDisplacementMap`
(está en 17 y 12). Si lo quieres casi recto, bájalo a 4–6.

## Controles rápidos

| Quiero cambiar | Dónde en `styles.css` |
|---|---|
| Los tres colores base | variables `--void`, `--red`, `--paper` |
| Intensidad del grano general | `.grain { opacity: .34 }` |
| Ángulo de cada plancha de proyecto | `.plate:nth-child(n) { transform: rotate(...) }` |
| Cinta adhesiva (tamaño, ángulo, posición) | `.tape` y sus variantes `--a` a `--d`, `--tl`, `--br` |
| Barra negra que tapa el título de portada | `.blackbar { left / width }` |
| Inclinación de la hoja de la ficha | `.sheet { transform: rotate(-.7deg) }` |
| Velocidad del texto en movimiento | `.marquee__track { animation: slide 38s }` |

Para tachar otra palabra: `<span class="strike">PALABRA</span>`.
La barra sale roja sobre texto claro y en papel sobre texto rojo.

Tipografías (Google Fonts): **Anton** títulos, **Archivo** texto, **Space Mono** etiquetas,
**Caveat** firma.

## Publicarla

El proyecto ya trae `vercel.json` (URLs limpias y cabeceras de caché) y `.vercelignore`.
No hace falta build ni configuración: Vercel sirve `index.html` desde la raíz.

**Vercel por CLI.** Requiere Node.js, que no está instalado en este equipo (y `winget`
tampoco está disponible). Descárgalo a mano desde <https://nodejs.org/es/download> — el
instalador `.msi` de la versión LTS para Windows x64. Después, terminal nueva y:

```bash
npx vercel
```

La primera vez pide iniciar sesión y hace algunas preguntas; acepta los valores por defecto.
Eso publica una URL de previsualización. Para la definitiva:

```bash
npx vercel --prod
```

**Vercel sin instalar nada** — sube la carpeta a un repositorio de GitHub e impórtalo en
<https://vercel.com/new>. Cada `git push` vuelve a desplegar solo.

Otras opciones: **Netlify Drop** (<https://app.netlify.com/drop>, arrastrar y soltar) o
**GitHub Pages** (Settings → Pages).

## Ver en local con servidor (opcional)

```bash
py -m http.server 8123
```

Luego abre <http://localhost:8123>.
