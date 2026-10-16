/* Portafolio — Felipe Saavedra
   1) el año del cierre
   2) entrada escalonada de cada parte al entrar la sección
   3) la cosa viva: quitarle el ruido a la pieza                */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. año ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- 2. entradas ----------
     Cada parte entra por separado, escalonada, no el bloque entero
     de una vez. Si no hay IntersectionObserver o el usuario pidió
     menos movimiento, el contenido se queda visible y ya está.   */
  /* Ojo: .panel__row y .stage__word ya llevan un translateY propio
     para centrarse. Animarlos los descolocaría, así que se animan
     sus hijos. */
  var parts = document.querySelectorAll(
    '.plate, .pass, .thesis__line, .thesis__says, ' +
    '.lede__head, .lede__text, ' +
    '.panel__year, .panel__title, .panel__fact, ' +
    '.shop__head, .shop__text, .shop__state, .shop__piece, ' +
    '.caps__head, .cap__title, .cap__img, .cap__items li, ' +
    '.stage__word h2, .stage__says, ' +
    '.file__head, .file__bio p, .file__facts dt, .file__facts dd, ' +
    '.mail__says, .mail__address, .mail__where, .mail__links, ' +
    '.pin__says, .pin__foot .btn, ' +
    '.end__what, .end__links, .end__year, .end__credits, '+
    '.shop__ends span, .lede__text'
  );

  if (!reduced && 'IntersectionObserver' in window) {
    Array.prototype.forEach.call(parts, function (el) { el.classList.add('in'); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var group = el.closest('section') || document.body;
        var siblings = Array.prototype.filter.call(parts, function (p) {
          return (p.closest('section') || document.body) === group;
        });
        var i = siblings.indexOf(el);
        window.setTimeout(function () { el.classList.add('in-on'); }, Math.min(i, 6) * 80);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    Array.prototype.forEach.call(parts, function (el) { io.observe(el); });
  }

  /* ---------- 3. el clip ----------
     Un bucle mudo es decoración: si piden menos movimiento se
     queda en su fotograma, pero no se esconde.                  */
  var clip = document.querySelector('.pass__clip');
  if (clip && reduced) {
    clip.removeAttribute('autoplay');
    clip.autoplay = false;
    clip.pause();
  }

  /* ---------- 4. la imagen que se mueve ----------
     Cada panel de referencias se acerca despacio mientras pasa por
     la pantalla. Sólo transform, y sólo mientras es visible.      */
  var movers = document.querySelectorAll('.panel__img, .plate img, .pass img, .stage__img');

  if (!reduced && movers.length && 'IntersectionObserver' in window) {
    var live = [];
    var running = false;

    var paint = function () {
      var h = window.innerHeight || 1;
      live.forEach(function (img) {
        var box = img.getBoundingClientRect();
        var seen = (h - box.top) / (h + box.height);   // 0 al entrar, 1 al salir
        if (seen < 0) seen = 0; else if (seen > 1) seen = 1;
        var base = img.classList.contains('panel__img') ? 1.18 : 1.08;
        img.style.transform = 'scale(' + (base - seen * 0.06).toFixed(4) + ')';
      });
      if (live.length) window.requestAnimationFrame(paint);
      else running = false;
    };

    var watch = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var at = live.indexOf(entry.target);
        if (entry.isIntersecting && at === -1) live.push(entry.target);
        else if (!entry.isIntersecting && at !== -1) live.splice(at, 1);
      });
      /* Si entraban dos imágenes en el mismo lote, el bucle no
         arrancaba nunca. Se controla con una bandera, no contando. */
      if (live.length && !running) { running = true; window.requestAnimationFrame(paint); }
    }, { rootMargin: '10% 0px' });

    Array.prototype.forEach.call(movers, function (img) { watch.observe(img); });
  }

  /* ---------- 5. la cosa viva ----------
     Un control que mezcla las dos capas: arriba la superficie
     sucia, debajo la retícula. Sin JS el estado queda a la mitad,
     que es el que trae el HTML.                                  */
  var range = document.getElementById('shopRange');
  var stack = document.getElementById('shopStack');
  var state = document.getElementById('shopState');

  if (range && stack) {
    var words = function (v) {
      if (v <= 4)  return 'Sólo el sistema: retícula, escala y jerarquía';
      if (v <= 32) return 'Casi limpio. Se ve de qué está hecho';
      if (v <= 68) return 'Mitad y mitad';
      if (v <= 95) return 'Casi todo superficie. El sistema sigue debajo';
      return 'Sólo la superficie: grano, tinta y fotocopia';
    };

    var apply = function () {
      var v = Number(range.value);
      stack.style.setProperty('--noise', (v / 100).toFixed(3));
      if (state) state.textContent = words(v);
    };

    range.addEventListener('input', apply);
    apply();
  }
})();
