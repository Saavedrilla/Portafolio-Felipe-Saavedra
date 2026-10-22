/* =========================================================
   Portafolio — motor de movimiento
   Vite + Lenis (scroll con inercia) + GSAP ScrollTrigger.

   Regla de la casa: el movimiento sirve al muro negro, no al
   revés. Nada de aquí cambia color, tipografía ni estructura.
   ========================================================= */

import Lenis from 'lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// En desarrollo, a mano desde la consola del navegador
if (import.meta.env.DEV) Object.assign(window, { gsap, ScrollTrigger });

const root = document.documentElement;

/* ---------------------------------------------------------
   ¿Movimiento completo o no?

   Ojo con esto: Windows tiene "mostrar animaciones" y si está
   apagado, el navegador contesta `prefers-reduced-motion: reduce`
   y cualquier sitio bien hecho se apaga solo. Por eso un sitio
   puede estar perfecto y verse muerto en tu máquina.

   Apagarlo todo era pasarse de frenada. Lo que molesta a quien
   pide menos movimiento es lo que desplaza cosas grandes y lo
   que secuestra el scroll: parallax, scroll horizontal clavado,
   inercia, marquesinas que aceleran. Un fundido no marea a
   nadie, y la pantalla de carga tampoco.

   Así que hay tres modos:
     full   movimiento completo.
     suave  sin inercia, sin parallax, sin scroll clavado;
            quedan la pantalla de carga y los fundidos.
     (el modo suave es el que se usa cuando el sistema pide
      menos movimiento, en vez de dejar la página muerta)

   - `?motion=full` fuerza el completo y queda guardado.
   - `?motion=auto` vuelve a respetar el sistema.
   --------------------------------------------------------- */
const parametro = new URLSearchParams(location.search).get('motion');
if (parametro === 'full') localStorage.setItem('motion', 'full');
if (parametro === 'auto') localStorage.removeItem('motion');

const forzado = localStorage.getItem('motion') === 'full';
const prefiereMenos = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const suave = !forzado && prefiereMenos;

root.classList.add('js');
root.classList.add(suave ? 'motion-suave' : 'motion-full');

/* =========================================================
   0. LO QUE FUNCIONA SIEMPRE: menú y año
   ========================================================= */
(function basics() {
  const burger = document.getElementById('navBurger');
  const links = document.getElementById('navLinks');

  if (burger && links) {
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    links.addEventListener('click', (e) => {
      if (e.target.tagName !== 'A') return;
      links.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  }

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();

arrancar();

function arrancar() {
  /* =======================================================
     2. LENIS — el scroll con inercia.
     Es el cambio que más se "siente" y son cuatro líneas:
     Lenis manda el scroll, GSAP lleva el reloj, y
     ScrollTrigger se actualiza con cada frame de Lenis.
     ======================================================= */
  /* En modo suave no hay inercia: manda el scroll del navegador.
     Para no llenar el resto del archivo de condicionales, se
     devuelve un sustituto con la misma forma que Lenis. */
  const lenis = suave
    ? {
        on() {},
        stop() {},
        start() {},
        raf() {},
        scrollTo(destino, opciones = {}) {
          const y = destino.getBoundingClientRect().top + window.scrollY + (opciones.offset || 0);
          window.scrollTo({ top: y, behavior: 'auto' });
        },
      }
    : new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

  if (!suave) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
  }
  gsap.ticker.lagSmoothing(0);

  // Los enlaces del menú ahora los mueve Lenis
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -64 });
    });
  });

  /* =======================================================
     3. PRELOADER
     Cuenta hasta 100 mientras cargan fuentes e imágenes, y
     después levanta el telón y entra la portada.
     ======================================================= */
  const loader = document.getElementById('loader');
  const fill = document.getElementById('loaderFill');
  const pct = document.getElementById('loaderPct');
  const progreso = { v: 0 };

  lenis.stop();

  const cuenta = gsap.to(progreso, {
    v: 100,
    duration: 2.4,
    ease: 'power2.inOut',
    onUpdate() {
      const n = Math.round(progreso.v);
      if (pct) pct.textContent = String(n);
      if (fill) fill.style.width = n + '%';
    },
  });

  const listo = Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((res) => {
      if (document.readyState === 'complete') res();
      else window.addEventListener('load', res, { once: true });
    }),
  ]);

  listo.then(() => {
    // Si ya cargó todo, acelera la cuenta en vez de esperarla
    gsap.to(cuenta, { timeScale: 1.9, duration: 0.4 });
  });

  cuenta.eventCallback('onComplete', abrir);

  function abrir() {
    /* La cortina y la entrada de la portada van en la MISMA
       timeline. Crear tweens desde un callback de otra timeline
       los deja congelados en su estado inicial. */
    const piezas = ['.cover__edge', '.cover__title', '.cover__name', '.cover__sub'].filter((s) =>
      document.querySelector(s)
    );

    // La portada arranca escondida antes de levantar el telón
    gsap.set(piezas, { yPercent: suave ? 0 : 110, opacity: 0 });
    gsap.set('.cover__photo', { scale: suave ? 1 : 1.14, opacity: 0 });
    gsap.set('.tape--a', { opacity: 0 });

    const tl = gsap.timeline({
      onComplete() {
        root.classList.remove('is-loading');
        loader?.remove();
        lenis.start();
        ScrollTrigger.refresh();
      },
    });

    tl.to('.loader__bar, .loader__pct', { opacity: 0, duration: 0.3 })
      .to('.loader__type', { yPercent: -18, opacity: 0, duration: 0.6, ease: 'power3.in' }, '-=.1')
      .to(loader, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '-=.25')

      /* ---- 4. PORTADA: cada línea sube desde su máscara ---- */
      .to(
        '.cover__photo',
        { scale: 1, opacity: 1, duration: 1.6, ease: 'power3.out' },
        '-=.75'
      )
      .to(
        piezas,
        { yPercent: 0, opacity: 1, duration: 1.1, ease: 'power4.out', stagger: 0.09 },
        '<'
      )
      .fromTo(
        '.tape--a',
        { rotate: -70, opacity: 0 },
        { rotate: -24, opacity: 1, duration: 0.9, ease: 'back.out(1.7)' },
        '-=.6'
      );
  }

  /* =======================================================
     4b. ENTRADAS SEGURAS

     `gsap.from` es una trampa aquí: guarda el estado final en
     el momento de crearse, y cuando ScrollTrigger recalcula
     posiciones —lo hace, porque la sección de proceso está
     clavada y mueve toda la página— puede quedarse colgado en
     el estado inicial. Resultado: elementos invisibles para
     siempre.

     Con `set` + `to` el estado final está escrito en el tween,
     no deducido. Si algo falla, falla visible.
     ======================================================= */
  function entra(elementos, disparador, opciones = {}) {
    const lista = Array.from(elementos || []);
    if (!lista.length) return;

    const { stagger = 0.08, start = 'top 82%' } = opciones;
    // En suave no se desplaza nada: solo aparece.
    const yPercent = suave ? 0 : (opciones.yPercent ?? 26);
    const rotate = suave ? 0 : (opciones.rotate ?? 0);

    gsap.set(lista, { yPercent, rotate, opacity: 0 });
    gsap.to(lista, {
      yPercent: 0,
      rotate: 0,
      opacity: 1,
      duration: 1,
      stagger,
      ease: 'power3.out',
      scrollTrigger: { trigger: disparador, start, once: true },
    });
  }

  /* =======================================================
     5. APARICIONES — reemplaza al IntersectionObserver
     ======================================================= */
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    onEnter: (lote) =>
      lote.forEach((el, i) => gsap.delayedCall(i * 0.07, () => el.classList.add('is-visible'))),
  });

  /* =======================================================
     6. EL GESTO DE LA CASA, AHORA VIVO
     Lo impreso va hueco y lo manuscrito cae encima fuera de
     registro. Con scroll, ese desajuste respira: la mano se
     separa del molde y vuelve.
     ======================================================= */
  document.querySelectorAll('.stack').forEach((stack) => {
    const hand = stack.querySelector('.stack__hand');
    const print = stack.querySelector('.stack__print');
    if (!hand || !print) return;

    if (!suave) {
      gsap
        .timeline({
          scrollTrigger: { trigger: stack, start: 'top 85%', end: 'bottom 25%', scrub: 1 },
        })
        .fromTo(hand, { x: -14, y: 8, rotate: -1.6 }, { x: 10, y: -6, rotate: 1.2, ease: 'none' });
    }

    // El contorno impreso se dibuja al entrar
    entra([print], stack, { yPercent: 60, start: 'top 86%' });
  });

  /* =======================================================
     7. MARQUEE QUE OBEDECE AL SCROLL
     Gira solo, pero acelera y cambia de sentido según hacia
     dónde y qué tan rápido te mueves.
     ======================================================= */
  (function marquee() {
    const track = document.querySelector('.marquee__track');
    if (!track || suave) return;   // en suave lo anima el CSS, a ritmo fijo

    const loop = gsap.to(track, {
      xPercent: -50,
      duration: 26,
      ease: 'none',
      repeat: -1,
    });

    let sentido = 1;
    lenis.on('scroll', ({ velocity }) => {
      const v = velocity || 0;
      if (v !== 0) sentido = v > 0 ? 1 : -1;
      loop.timeScale(sentido * gsap.utils.clamp(0.6, 7, 1 + Math.abs(v) * 0.08));
      gsap.to(track, { skewX: gsap.utils.clamp(-9, 9, -v * 0.3), duration: 0.5, overwrite: true });
    });
  })();

  /* =======================================================
     8. PARALLAX EN LAS PLACAS
     La imagen se mueve un poco menos que su marco: de ahí
     viene la sensación de profundidad.
     ======================================================= */
  document.querySelectorAll('.plate').forEach((plate) => {
    const img = plate.querySelector('.plate__img');
    if (!img || suave) return;

    gsap.fromTo(
      img,
      { yPercent: -7, scale: 1.12 },
      {
        yPercent: 7,
        ease: 'none',
        scrollTrigger: { trigger: plate, start: 'top bottom', end: 'bottom top', scrub: true },
      }
    );
  });

  /* =======================================================
     9. PROCESO EN HORIZONTAL
     La sección se clava y los cuatro pasos desfilan de lado.
     Es el mismo truco de los paneles 01/02/03/04.
     ======================================================= */
  (function proceso() {
    const track = document.querySelector('.steps-track');
    const steps = document.querySelector('.steps');
    if (!track || !steps || suave) return;   // clavar la seccion secuestra el scroll

    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      const recorrido = () => Math.max(0, steps.scrollWidth - window.innerWidth);

      gsap.to(steps, {
        x: () => -recorrido(),
        ease: 'none',
        scrollTrigger: {
          trigger: track,
          start: 'top top',
          end: () => '+=' + recorrido(),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      // Cada paso se levanta cuando entra en cuadro
      gsap.from('.steps .step', {
        yPercent: 22,
        opacity: 0,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: track,
          start: 'top top',
          end: () => '+=' + recorrido(),
          scrub: 1,
        },
      });
    });
  })();

  /* =======================================================
     9b. EL GOLPE DE BLANCO
     La foto se mueve dentro de su marco y el texto entra
     escalonado. Lo que da la profundidad es el salto de valor,
     esto solo lo acompaña.
     ======================================================= */
  (function golpe() {
    const slam = document.querySelector('.slam');
    if (!slam) return;

    if (!suave) gsap.fromTo(
      slam.querySelector('.slam__img'),
      { yPercent: -9 },
      {
        yPercent: 9,
        ease: 'none',
        scrollTrigger: { trigger: slam, start: 'top bottom', end: 'bottom top', scrub: true },
      }
    );

    entra(slam.querySelectorAll('.slam__kicker, .slam__title, .slam__text, .slam__meta'), slam, {
      yPercent: 40,
      stagger: 0.1,
      start: 'top 62%',
    });
  })();

  /* =======================================================
     10. LA FICHA SE ASIENTA
     Entra ligeramente torcida, como una hoja recién pegada.
     ======================================================= */
  entra(document.querySelectorAll('.sheet'), '.sheet-wrap', {
    rotate: -2.4,
    yPercent: 9,
    start: 'top 78%',
  });

  /* =======================================================
     11. NAV: se esconde al bajar, vuelve al subir
     ======================================================= */
  (function nav() {
    const bar = document.querySelector('.nav');
    if (!bar) return;

    ScrollTrigger.create({
      start: 'top -90',
      end: 99999,
      onUpdate({ direction, progress }) {
        bar.classList.toggle('is-stuck', progress > 0);
        bar.classList.toggle('is-hidden', direction === 1 && progress > 0);
      },
      onLeaveBack: () => bar.classList.remove('is-stuck', 'is-hidden'),
    });
  })();

  /* =======================================================
     12. Cuando cambian fuentes o tamaño, recalcular
     ======================================================= */
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('resize', () => ScrollTrigger.refresh());
}
