# Landing page — portafolio de Felipe Saavedra

Sitio de una sola página, sin frameworks ni build. Doble clic en `index.html` y funciona.

En producción: <https://portafolio-felipe-saavedra.vercel.app>
Repositorio: <https://github.com/Saavedrilla/Portafolio-Felipe-Saavedra>

```
index.html    → contenido y estructura
styles.css    → toda la parte visual
script.js     → entradas al scroll, el clip, la cosa viva
assets/       → imágenes y clip de dominio público, con sus créditos
versiones/    → copias de versiones anteriores
```

## La idea

> La vista del ciclista: tú no te mueves, la carretera pasa por debajo.

De ahí sale el mecanismo de toda la página: **algo se queda clavado mientras lo demás pasa
por detrás**. El título de portada aguanta mientras los carteles desfilan; la tesis aguanta
mientras pasan las piezas.

Dirección «El cartel clavado», repartida por la skill `design-taste-frontend`
(semilla 1408796438). Reimprímela con:

```bash
node <skill>/scripts/draw.mjs --show
```

## La cosa viva

En `#taller`, el control deslizante mezcla dos capas de la misma pieza: arriba la superficie
sucia (grano y trama de fotocopia), debajo el sistema (retícula, escala, jerarquía). Es la
tesis «ruido arriba, orden debajo» demostrada en vez de afirmada.

Funciona con una sola variable CSS, `--noise`, que `script.js` pone en `#shopStack`:

```css
.shop__photo{ opacity:var(--noise, .5); }
.shop__grid { opacity:calc(1 - var(--noise, .5)); }
```

Sin JavaScript se queda a la mitad, que es un estado válido.

## Las imágenes

**Ninguna imagen del sitio es obra de Felipe.** Son piezas de museo en dominio público
—carteles litográficos de ciclismo de 1894 a 1903, una fotografía de carrera de 1894, un
grabado de un taller litográfico— que muestran el oficio del que viene su trabajo. Cada una
lleva autor, año y museo en la propia página, y todas están acreditadas en el footer.
Los datos completos están en `assets/credits.json`.

Esto es deliberado y no se debe tocar: presentarlas como trabajo propio sería mentir.

**Cuando tengas tus piezas reales**, cada panel de `#referencias` se cambia así:

```html
<img class="panel__img" src="assets/proyecto-1.jpg" width="1500" height="1000"
     alt="Describe lo que se ve">
<p class="panel__row">
  <span class="panel__year">2026</span>
  <span class="panel__title">Nombre del proyecto</span>
  <span class="panel__fact">Cliente · qué entregaste</span>
</p>
```

Y entonces cambia el texto de `.lede` («De aquí vengo») por el que corresponda a tu trabajo,
y quita del footer los créditos de las imágenes que ya no uses.

Un solo tratamiento para todas: `filter` cálido más una trama de puntos en SVG. Así una
litografía de 1896 y una foto moderna se leen como la misma familia. Vive en `.shot`,
`.plate`, `.pass`, `.panel__img` y `.cap__img`.

## Controles rápidos

| Quiero cambiar | Dónde en `styles.css` |
|---|---|
| Los colores | variables `--bg`, `--ink`, `--accent`, `--field-1` |
| El tamaño del título de portada | `--step-display` |
| Cuántas pantallas aguanta el título | número y tamaño de `.plate` |
| La trama de fotocopia | variable `--screen` y las reglas `::after` |
| El alto de la barra fija | `--navh` → `--barh` |

**Ojo con `--step-display`.** Panchang es extendida: cada mayúscula mide casi un cuerpo
entero. «PORTAFOLIO» son diez letras, así que el cuerpo máximo es más o menos
`(ancho de pantalla − márgenes) ÷ 10`. Si lo subes, el título se corta por los lados.

Tipografías (Fontshare): **Panchang** 700 para display, **Switzer** 400/500 para texto.
Dos, que es el máximo.

## Las herramientas que lo revisan

```bash
node <skill>/scripts/lint.mjs index.html styles.css script.js
node <skill>/scripts/inspect.mjs index.html
```

`inspect.mjs` abre la página en un navegador real a 1440, 768 y 390 px, la mide y deja
capturas en `.taste-skill/inspect/`. **Estado actual: 0 FAIL.** Quedan dos avisos
defendidos a propósito:

- *pinned-over-picture*: el solape es geométrico. El título va sobre una banda sólida y la
  tesis sobre una placa sólida, así que ninguna imagen se ve a través de las letras.
- *still-page*: el navegador que mide tiene activado «reducir movimiento», y bajo esa
  preferencia la página se queda quieta a propósito.

## Publicar un cambio

```bash
git add -A && git commit -m "Describe el cambio" && git push
```

Vercel redespliega solo en unos 30 segundos. Si algo sale mal, `git revert` lo deshace.

Para volver a una versión anterior, están en `versiones/` y como etiquetas de git
(`git tag -l`, luego `git checkout v2-muro-negro`).

## Ver en local

```bash
py -m http.server 8137
```

Luego abre <http://localhost:8137>. Si no ves los cambios, recarga sin caché
(Ctrl+Shift+R): el servidor de Python no manda cabeceras y el navegador se queda con la
copia vieja.
