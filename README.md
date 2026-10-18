# Landing page — portafolio de diseño

Sitio de una sola página, sin frameworks ni build. Doble clic en `index.html` y funciona.

Dirección visual: cartel fotocopiado y pegado en un muro negro. Fondo de asfalto con
raspaduras, tipografía blanca cálida (no blanco de pantalla), y el gesto de la referencia
en negativo: la palabra impresa queda **hueca**, solo contorno, y encima cae la misma
palabra escrita a mano, sólida y fuera de registro. Una sola tira blanca en toda la
página —el footer— que es la que sostiene el contraste. Rojo seco reservado para señales
mínimas.

```
index.html    → contenido, estructura y filtros SVG
styles.css    → toda la parte visual
script.js     → menú móvil, año del footer, aparición al scroll
```

## El gesto central: lo impreso y lo escrito

La misma palabra aparece dos veces, mal alineada a propósito.

```html
<span class="stack">
  <span class="stack__print">TRABAJO</span>
  <span class="stack__hand" aria-hidden="true">TRABAJO</span>
</span>
```

`.stack__print` va en `color:transparent` con `-webkit-text-stroke`, así que sobre negro
se lee como un contorno. `.stack__hand` es decorativo y va con `aria-hidden`: quien use
lector de pantalla oye la palabra una sola vez.

Anton es muy condensada y el marcador es ancho, así que las dos palabras no miden igual.
El ancho se iguala con `font-size` en `.band__title .stack__hand`. **Si cambias el texto
de una banda, ajusta ese número** hasta que la mano cubra el contorno.

En la portada el título va solo escrito a mano (`.cover__word`), sin contorno detrás:
es lo que lo mantiene legible de un vistazo.

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

Sobre fondo negro conviene que las fotos sean **claras y contrastadas**, si no se pierden
contra el muro.

**Portada** — el panel de la derecha, en `styles.css`:

```css
.cover__photo{
  background-image: url("img/portada.jpg");
  background-size: cover;
  background-position: center;
}
```

Para redes, añade `og.jpg` (1200×630 px) en la raíz.

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
| Los colores base | variables `--void`, `--chalk`, `--blood` |
| Textura del muro | `background-image` de `body` |
| Intensidad del grano general | `.grain { opacity: .30 }` |
| Grosor del contorno de lo impreso | `.stack__print { -webkit-text-stroke }` |
| Cuánto se corre la mano sobre lo impreso | `.stack__hand { translate: ... }` |
| Alto del nav fijo (y el aire de los anclajes) | variable `--navh` |
| Ángulo de cada plancha de proyecto | `.plate:nth-child(n) { transform: rotate(...) }` |
| Cinta (tamaño, ángulo, posición) | `.tape` y sus variantes `--a` a `--d`, `--tl`, `--br` |
| Clip metálico de la ficha | `.clip` |
| Inclinación de la hoja de la ficha | `.sheet { transform: rotate(-.7deg) }` |
| Velocidad del texto en movimiento | `.marquee__track { animation: slide 38s }` |

Para marcar una palabra suelta con rotulador: `<span class="hl">PALABRA</span>`.

Tipografías (Google Fonts): **Anton** títulos, **Archivo** texto, **Special Elite**
etiquetas y datos, **Permanent Marker** la capa escrita a mano, **Rock Salt** las firmas.

El nav va fijo y transparente, con desenfoque. Por eso las secciones llevan
`scroll-margin-top`: sin eso, al pulsar un enlace del menú el título quedaría tapado.

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
