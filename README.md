# Landing page — portafolio de diseño

Sitio de una sola página, sin frameworks ni build. Doble clic en `index.html` y funciona.

Dirección visual: cartel fotocopiado y pegado en un muro. Fondo de concreto claro,
tipografía negra condensada, y encima una capa escrita a mano en marcador azul que cae
fuera de registro sobre lo impreso. Amarillo mostaza de resaltador. Barras negras arriba
y abajo que encuadran la página como una diapositiva.

```
index.html    → contenido, estructura y filtros SVG
styles.css    → toda la parte visual
script.js     → menú móvil, año del footer, aparición al scroll
```

## El gesto central: lo impreso y lo escrito

La misma palabra aparece dos veces, mal alineada a propósito: una compuesta en negro y
otra encima con marcador. Es lo que sostiene todo el sistema.

```html
<span class="stack">
  <span class="stack__print">TRABAJO</span>
  <span class="stack__hand" aria-hidden="true">TRABAJO</span>
</span>
```

`.stack__hand` es decorativo, por eso va con `aria-hidden`: quien use lector de pantalla
oye la palabra una sola vez.

Anton es muy condensada y el marcador es ancho, así que las dos palabras no miden igual.
El ancho se iguala con `font-size` en `.band__title .stack__hand` (ahora `.62em`).
**Si cambias el texto de una banda, ajusta ese número** hasta que la mano cubra lo impreso.

En la portada el título va solo escrito a mano (`.cover__word`), como en la referencia.
Las dos manchas de resaltador son `::before` y `::after` de ese mismo elemento.

## Qué editar antes de publicar

Busca los comentarios `<!-- EDITA: ... -->` dentro de `index.html`:

| Qué | Dónde |
|---|---|
| Tu nombre | nav, `.cover__name` en la portada, footer |
| Tu firma | `.signature` en `#ficha` y `.card-contact__sign` en `#contacto` |
| Experiencia y formación | bloque `.cv` en `#ficha` |
| Correo y redes | `.card-contact` en `#contacto` |
| Los 4 proyectos | `.plates` en `#trabajo` |
| Título y descripción para Google y redes | `<title>`, `<meta name="description">`, Open Graph |

## Poner tus imágenes reales

Las planchas de proyecto y el panel de la portada son composiciones hechas con CSS, para
que el sitio funcione sin depender de imágenes. En cuanto tengas las tuyas, se reemplazan
directo.

**Proyectos** — crea `img/` y cambia cada bloque:

```html
<div class="plate__img plate__img--a" aria-hidden="true"></div>
```

por:

```html
<img class="plate__img" src="img/proyecto-1.jpg" alt="Identidad para plataforma de IA">
```

La imagen hereda sola el filtro de fotocopia y la trama de puntos: entra a color y sale
en blanco y negro duro. Formato: 1200×900 px (o 900×1200 para la vertical), `.webp` o `.jpg`.

**Portada** — el panel de la derecha, en `styles.css`:

```css
.cover__photo{
  background-image: url("img/portada.jpg");
  background-size: cover;
  background-position: center;
}
```

Funciona mejor con una foto de contraste alto. El filtro y la trama la convierten en
semitono sola. Para redes, añade `og.jpg` (1200×630 px) en la raíz.

## Cómo están hechas las texturas

Los filtros viven al inicio de `index.html`, dentro del `<svg class="defs">`:

| Filtro | Qué hace | Dónde se usa |
|---|---|---|
| `#torn` | Rasga el borde desplazándolo con ruido | disponible, sin uso actual |
| `#torn2` | Igual pero más fino | hoja de la ficha, tarjeta de contacto |
| `#photocopy` | Pasa a gris y aplasta los tonos en escalones | planchas de proyecto, panel de portada |

Si quieres el borde **más rasgado**, sube el `scale` del `feDisplacementMap` (está en 17
y 12). Si lo quieres casi recto, bájalo a 4–6.

El blanco y negro de `#photocopy` sale de `tableValues`: cada número es un escalón de gris.
Menos números = más duro, más contrastado.

## Controles rápidos

| Quiero cambiar | Dónde en `styles.css` |
|---|---|
| Los colores base | variables `--concrete`, `--ink`, `--blue`, `--yellow-lit` |
| Textura del muro | `background-image` de `body` |
| Intensidad del grano general | `.grain { opacity: .19 }` |
| Cuánto se corre la mano sobre lo impreso | `.stack__hand { translate: ... }` |
| Ángulo de cada plancha de proyecto | `.plate:nth-child(n) { transform: rotate(...) }` |
| Manchas de resaltador de la portada | `.cover__word::before` y `::after` |
| Cinta (tamaño, ángulo, posición) | `.tape` y sus variantes `--a` a `--d`, `--tl`, `--br` |
| Clip metálico de la ficha | `.clip` |
| Inclinación de la hoja de la ficha | `.sheet { transform: rotate(-.7deg) }` |
| Velocidad del texto en movimiento | `.marquee__track { animation: slide 38s }` |

Para resaltar una palabra suelta en amarillo: `<span class="hl">PALABRA</span>`.

Tipografías (Google Fonts): **Anton** títulos, **Archivo** texto, **Space Mono** etiquetas,
**Permanent Marker** la capa escrita a mano.

## Publicar un cambio

Esta carpeta es el repositorio <https://github.com/Saavedrilla/Portafolio-Felipe-Saavedra>.
El sitio vive en <https://portafolio-felipe-saavedra.vercel.app>.

```bash
git add -A && git commit -m "Describe el cambio" && git push
```

Vercel detecta el push y vuelve a desplegar solo, en unos 30 segundos. No hay build ni
configuración: sirve `index.html` desde la raíz, con `vercel.json` para las URLs limpias
y las cabeceras de caché.

Si algo sale mal, `git revert` deshace el último cambio y el sitio vuelve como estaba.

## Ver en local con servidor (opcional)

```bash
py -m http.server 8123
```

Luego abre <http://localhost:8123>.
