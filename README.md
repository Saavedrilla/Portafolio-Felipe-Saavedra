# Portafolio en vinilo — v6 "El tocadiscos"

La versión vigente del sitio. Fondo papel `#F4F2ED`, un tocadiscos a la izquierda y una
caja de siete vinilos abajo: cada disco es una canción (Korn, System Of A Down, Limp
Bizkit, Slipknot, QOTSA) y, del otro lado, una parte del portafolio. Al elegir un vinilo
el disco vuela de la funda a la bandeja, baja la aguja y cambia la ficha de contenido.

```
index.html           -> estructura: carga, tocadiscos, fichas y caja de discos
src/tocadiscos.css   -> toda la parte visual de esta versión
src/tocadiscos.js    -> pantalla de carga, poner/levantar disco, teclado y sonido
```

| Disco | Canción | Sección del portafolio |
|---|---|---|
| 01 | Korn — Blind | Quién soy |
| 02 | System Of A Down — Toxicity | Mis fuertes (estilos que trabajo) |
| 03 | Limp Bizkit — Break Stuff | Identidad / branding |
| 04 | Slipknot — Duality | Motion y video |
| 05 | QOTSA — No One Knows | UI y UX |
| 06 | Korn — Freak on a Leash | El proceso |
| 07 | System Of A Down — Aerials | Contacto |

**Para editar el contenido:** busca `EDITA` en `index.html`. Cada ficha es un
`<article class="ficha" data-ficha="NN">`. Para cambiar la canción de un vinilo basta
con editar los `data-` del botón correspondiente en la sección `.caja`.

**Tipografías (nu metal, no gamer):** Anton (titulares), Big Shoulders Stencil Display
(estencil de los rótulos), Special Elite (máquina de escribir de los datos técnicos),
Permanent Marker (lo escrito a mano encima) y Archivo para el texto corrido.

**Sonido:** el botón de la cabecera enciende un crujido de aguja sintetizado (no hay
archivos de audio). Si algún día pones `audio/01.mp3` ... `audio/07.mp3`, cada disco toca
el suyo; si el archivo no existe, no pasa nada y se queda el crujido.

**Movimiento:** la pantalla de carga y el plato girando funcionan siempre, también con el
movimiento reducido de Windows; en ese modo el disco gira más lento y se apagan los
nervios (vúmetros, onda, rebotes). `?motion=full` fuerza todo.

Versiones anteriores: `versiones/` y etiquetas de git (`v2-muro-negro`,
`v3-cartel-clavado`, `v5-muro-negro-movimiento`).

---

# Versión anterior: el muro negro (guardada en `versiones/v5-muro-negro`)


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

---

## v4 — El motor de movimiento (Vite + GSAP + Lenis)

El sitio dejó de ser HTML plano: ahora se compila con Vite. **La identidad no
cambió** (muro negro, Anton + Permanent Marker, lo impreso hueco con lo
manuscrito encima). Lo único nuevo es cómo se mueve.

### Comandos

```bash
npm install     # una sola vez
npm run dev     # servidor local en http://localhost:5173
npm run build   # genera dist/ (es lo que publica Vercel)
```

Vercel detecta Vite solo: no hay que configurar nada.

### Archivos

| Archivo | Qué hace |
|---|---|
| `index.html` | El contenido. Igual que siempre, más el preloader. |
| `styles.css` | La identidad. **Intacto.** |
| `src/motion.css` | Solo movimiento: preloader, proceso horizontal, nav. |
| `src/main.js` | El motor: Lenis + GSAP ScrollTrigger. |
| `script.js` | Ya no se usa. Queda como respaldo de la v3. |

### Lo que hace el motor

1. **Preloader** que cuenta a 100 y levanta el telón.
2. **Lenis**: scroll con inercia.
3. **Portada**: cada línea sube desde su máscara.
4. **El gesto de la casa, vivo**: lo manuscrito se desplaza respecto a lo
   impreso según el scroll. El fuera de registro respira.
5. **Marquee** que acelera y cambia de sentido con la velocidad del scroll.
6. **Parallax** en las placas de trabajo.
7. **Proceso en horizontal**: la sección se clava y los cuatro pasos desfilan.
8. **Nav** que se esconde al bajar y vuelve al subir.

### Importante: `prefers-reduced-motion`

Windows tiene un ajuste de **"mostrar animaciones"**. Si está apagado, el
navegador contesta `prefers-reduced-motion: reduce` y este sitio —como
cualquier sitio bien hecho— se apaga solo y se muestra estático.

**En esta máquina ese ajuste está APAGADO** (`MinAnimate = 0`). Por eso el
sitio puede verse muerto aunque esté perfecto.

- Para verlo con todo el movimiento: **`?motion=full`** al final de la URL.
  Queda guardado en el navegador, basta con entrar así una vez.
- Para volver a respetar el sistema: `?motion=auto`.
- Para arreglarlo de raíz: Windows → Configuración → Accesibilidad →
  Efectos visuales → **Efectos de animación: Activado**.

---

## v5 - Fotografia, escala y el golpe de blanco

El sitio no estaba plano por el codigo: estaba plano porque no tenia ni una
sola fotografia y porque todo pesaba lo mismo. Tres movimientos lo arreglan.

### 1. Tus fotos, por fin en el sitio

Las cuatro de `fotos/_seleccion/` pasaron por `xerox.py` a 1600 px y quedaron
en **`img/`** (esa carpeta SI sube a git y a Vercel; `fotos/` sigue ignorada
porque son los originales pesados).

| Archivo | Donde |
|---|---|
| `retrato-casco.png` | Portada. Es la pieza que sostiene la pagina. |
| `mtb-318.png` | El bloque blanco a pantalla completa. |
| `casco-ruta.png` | La placa de trabajo de ciclismo. |
| `jefe.png` | La ficha, junto al CV. |

Son PNG de 1 bit (blanco puro y negro puro), entre 179 y 244 KB.

Para cambiarlas: deja el original en `fotos/_seleccion/`, corre
`py herramientas/xerox.py fotos/_seleccion --salida img --trama dither --ancho 1600`
y renombra. Vite les pone hash solo.

### 2. La escala salta

- El nombre de la portada pasa de pie de foto a titular (Anton, hasta 6.2rem).
- La seccion nueva tiene el titular mas grande de toda la pagina.
- Servicios baja el volumen a proposito. Si todo grita, nada grita.

### 3. El golpe de blanco

`<section class="slam">`: una seccion entera invertida, blanco con tinta
negra, a pantalla completa, entre dos negros. **Esto es lo que da
profundidad** - no el parallax. Cuando vuelve el negro, pesa.

### Una trampa de GSAP que costo caro

`gsap.from` guarda el estado final cuando se crea el tween. Como la seccion de
proceso esta clavada y mueve toda la pagina, ScrollTrigger recalcula posiciones
y el tween puede quedarse colgado en el estado inicial: **elementos invisibles
para siempre**. Por eso en `main.js` hay una funcion `entra()` que usa
`set` + `to`: el estado final esta escrito, no deducido. Si algo falla, falla
visible. No volver a usar `gsap.from` para entradas en este sitio.
