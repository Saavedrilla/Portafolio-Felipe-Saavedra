/* ============================================================
   PORTAFOLIO EN VINILO — Felipe Saavedra
   v6 "El tocadiscos".

   Lo que hace este archivo:
   1. pantalla de carga que cuenta a 100 mientras cargan fuentes e imágenes
   2. elegir un vinilo de la caja -> el disco vuela de la funda a la bandeja
   3. el plato gira, el brazo baja y la ficha del portafolio cambia
   4. sonido opcional: crujido de aguja sintetizado (sin archivos) y, si
      algún día pones un mp3 en audio/01.mp3 ... audio/07.mp3, suena ese
   ============================================================ */

const raiz = document.documentElement;
raiz.classList.remove('sin-js');

const plato      = document.getElementById('plato');
const disco      = document.getElementById('disco');
const etiqueta   = document.getElementById('discoEtiqueta');
const brazo      = document.getElementById('brazo');
const onda       = document.getElementById('onda');
const btnStop    = document.getElementById('btnStop');
const btnSonido  = document.getElementById('btnSonido');
const rail       = document.getElementById('cajaRail');
const vinilos    = [...document.querySelectorAll('.vinilo')];
const fichas     = [...document.querySelectorAll('.ficha')];
const suena = {
  lado:    document.getElementById('suenaLado'),
  pista:   document.getElementById('suenaPista'),
  cancion: document.getElementById('suenaCancion'),
  banda:   document.getElementById('suenaBanda'),
  tema:    document.getElementById('suenaTema'),
};

const suave = matchMedia('(prefers-reduced-motion: reduce)').matches
  && !new URLSearchParams(location.search).has('motion');

let puesto = null;   /* el botón del vinilo que está en la bandeja */

/* ------------------------------------------------------------
   1. PANTALLA DE CARGA
   ------------------------------------------------------------ */
(function pantallaDeCarga(){
  const capa    = document.getElementById('carga');
  const pct     = document.getElementById('cargaPct');
  const relleno = document.getElementById('cargaRelleno');
  if (!capa) return;

  const t0 = performance.now();
  const minimo = 1500;   /* que se vea el plato arrancar, aunque cargue al instante */
  const tope   = 3500;   /* pase lo que pase, a los 3,5 s la página se abre */
  let listo = document.readyState === 'complete';
  let cerrado = false;

  if (!listo) window.addEventListener('load', () => { listo = true; });

  /* Va por reloj, no por frames: si el navegador frena requestAnimationFrame
     (pasa con el movimiento reducido o con la pestaña en segundo plano) el
     contador igual llega a 100 y la página se abre. */
  const reloj = setInterval(pinta, 50);
  setTimeout(() => { listo = true; pinta(); }, tope);
  pinta();

  function pinta(){
    if (cerrado) return;
    const t = performance.now() - t0;
    const avance = Math.min(100, (t / minimo) * 100);
    const n = listo ? avance : Math.min(avance, 92);
    pct.textContent = Math.round(n);
    relleno.style.width = n + '%';
    if (n < 100) return;
    cerrado = true;
    clearInterval(reloj);
    setTimeout(() => {
      raiz.classList.remove('cargando');
      setTimeout(() => capa.remove(), 700);
    }, 200);
  }
})();

/* ------------------------------------------------------------
   2. LA ONDA (barritas del medidor)
   ------------------------------------------------------------ */
if (onda) {
  for (let i = 0; i < 34; i++) {
    const barra = document.createElement('i');
    barra.style.setProperty('--i', i);
    onda.appendChild(barra);
  }
}

/* ------------------------------------------------------------
   3. SONIDO: crujido de aguja sintetizado + mp3 si existe
   ------------------------------------------------------------ */
const sonido = {
  on: false, ctx: null, ruido: null, gan: null, pista: null,

  arranca(){
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();

    /* dos segundos de ruido rosa flojo, en bucle: el disco "respirando" */
    const largo = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, largo, this.ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    let ultimo = 0;
    for (let i = 0; i < largo; i++) {
      const blanco = Math.random() * 2 - 1;
      ultimo = (ultimo + 0.02 * blanco) / 1.02;
      datos[i] = ultimo * 3.5;
      if (Math.random() < 0.0004) datos[i] += (Math.random() * 2 - 1) * 0.6; /* chasquidos */
    }
    this.ruido = this.ctx.createBufferSource();
    this.ruido.buffer = buffer;
    this.ruido.loop = true;
    this.gan = this.ctx.createGain();
    this.gan.gain.value = 0;
    this.ruido.connect(this.gan).connect(this.ctx.destination);
    this.ruido.start();
  },

  crujido(nivel){
    if (!this.gan) return;
    this.gan.gain.linearRampToValueAtTime(nivel, this.ctx.currentTime + 0.35);
  },

  golpeDeAguja(){
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(140, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.18, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
    o.connect(g).connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + 0.2);
  },

  /* si existe audio/<id>.mp3 lo toca; si no, se queda con el crujido */
  tocaPista(id){
    this.paraPista();
    if (!this.on) return;
    const a = new Audio('audio/' + id + '.mp3');
    a.volume = 0.8;
    a.play().then(() => { this.pista = a; }).catch(() => { this.pista = null; });
  },

  paraPista(){
    if (this.pista) { this.pista.pause(); this.pista = null; }
  },

  enciende(){
    this.on = true;
    this.arranca();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    if (plato.dataset.estado === 'gira') this.crujido(0.1);
  },

  apaga(){
    this.on = false;
    this.crujido(0);
    this.paraPista();
  },
};

if (btnSonido) {
  btnSonido.addEventListener('click', () => {
    const encendido = btnSonido.getAttribute('aria-pressed') === 'true';
    if (encendido) { sonido.apaga(); btnSonido.setAttribute('aria-pressed', 'false'); btnSonido.querySelector('b').textContent = 'off'; }
    else { sonido.enciende(); btnSonido.setAttribute('aria-pressed', 'true'); btnSonido.querySelector('b').textContent = 'on';
           if (puesto) sonido.tocaPista(puesto.dataset.id); }
  });
}

/* ------------------------------------------------------------
   4. PONER UN DISCO
   ------------------------------------------------------------ */
function poner(vinilo){
  if (!vinilo || vinilo === puesto) return;
  const d = vinilo.dataset;

  /* el disco anterior vuelve a su funda */
  if (puesto) puesto.classList.remove('is-puesto');
  puesto = vinilo;
  vinilo.classList.add('is-puesto');
  vinilos.forEach(v => v.setAttribute('aria-pressed', String(v === vinilo)));

  /* la etiqueta del plato copia el arte de la funda */
  const arte = vinilo.querySelector('.arte');
  etiqueta.innerHTML = '';
  if (arte) etiqueta.appendChild(arte.cloneNode(true));
  const texto = document.createElement('span');
  texto.className = 'et-texto';
  texto.textContent = d.cancion;
  etiqueta.appendChild(texto);
  const funda = vinilo.querySelector('.vinilo__funda');
  const css = funda ? getComputedStyle(funda) : null;
  etiqueta.style.setProperty('--et-papel', css ? css.getPropertyValue('--papel') : '#C8321E');
  etiqueta.style.setProperty('--et-tinta', css ? css.getPropertyValue('--tinta') : '#121110');

  /* velocidad: 33⅓ da una vuelta cada 1.8s, 45 cada 1.33s */
  const rpm = d.rpm === '45' ? 45 : 33;
  marcaRpm(rpm);

  /* ficha + datos de "lo que suena" */
  suena.lado.textContent    = d.lado;
  suena.pista.textContent   = d.id;
  suena.cancion.textContent = d.cancion;
  suena.banda.textContent   = d.banda + ' · ' + d.anio;
  suena.tema.textContent    = d.tema;
  muestraFicha(d.id);

  vuela(vinilo);

  /* el plato: disco puesto -> la aguja baja -> gira */
  plato.dataset.estado = 'puesto';
  if (sonido.on) sonido.golpeDeAguja();
  setTimeout(() => {
    plato.dataset.estado = 'gira';
    if (sonido.on) { sonido.crujido(0.1); sonido.tocaPista(d.id); }
  }, suave ? 180 : 520);

  btnStop.disabled = false;

  if (matchMedia('(max-width:1000px)').matches) {
    document.getElementById('notas').scrollIntoView({ behavior: suave ? 'auto' : 'smooth', block: 'start' });
  }
}

function marcaRpm(rpm){
  document.querySelectorAll('.rpm__btn').forEach(b => {
    b.classList.toggle('is-on', Number(b.dataset.rpm) === rpm);
  });
  disco.style.setProperty('--vuelta', (rpm === 45 ? 1.333 : 1.8) + 's');
}

document.querySelectorAll('.rpm__btn').forEach(b => {
  b.addEventListener('click', () => marcaRpm(Number(b.dataset.rpm)));
});

/* El disco sale de la funda y cae en la bandeja (FLIP) */
function vuela(vinilo){
  if (suave) return;
  const origen = vinilo.querySelector('.vinilo__disco');
  const destino = disco;
  if (!origen || !destino.getBoundingClientRect) return;

  const a = origen.getBoundingClientRect();
  const b = destino.getBoundingClientRect();
  if (!a.width || !b.width) return;

  const clon = document.createElement('div');
  clon.className = 'vuelo';
  clon.style.cssText =
    'left:' + a.left + 'px; top:' + a.top + 'px; width:' + a.width + 'px; height:' + a.height + 'px;';
  document.body.appendChild(clon);

  const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
  const dy = (b.top + b.height / 2) - (a.top + a.height / 2);
  const escala = b.width / a.width;

  clon.animate(
    [
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: 'translate(' + dx * 0.5 + 'px,' + (dy * 0.45 - 70) + 'px) scale(' + (escala * 0.8) + ') rotate(-120deg)', opacity: 1, offset: 0.55 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + escala + ') rotate(-300deg)', opacity: 0 },
    ],
    { duration: 620, easing: 'cubic-bezier(.35,.05,.2,1)' }
  ).finished.then(() => clon.remove()).catch(() => clon.remove());
}

function muestraFicha(id){
  fichas.forEach(f => f.classList.toggle('is-activa', f.dataset.ficha === id));
}

/* ------------------------------------------------------------
   5. LEVANTAR LA AGUJA
   ------------------------------------------------------------ */
function levanta(){
  if (!puesto) return;
  puesto.classList.remove('is-puesto');
  puesto.setAttribute('aria-pressed', 'false');
  puesto = null;
  plato.dataset.estado = 'vacio';
  btnStop.disabled = true;
  sonido.crujido(0);
  sonido.paraPista();
  suena.lado.textContent = '—';
  suena.pista.textContent = '—';
  suena.cancion.textContent = 'Nada en la bandeja';
  suena.banda.textContent = '—';
  suena.tema.textContent = '—';
  muestraFicha('00');
}

btnStop.addEventListener('click', levanta);

/* ------------------------------------------------------------
   6. CLICS Y TECLADO
   ------------------------------------------------------------ */
vinilos.forEach(v => {
  v.setAttribute('aria-pressed', 'false');
  v.addEventListener('click', () => poner(v));
});

/* clic en el disco del plato = levantar la aguja */
plato.querySelector('.plato__bandeja').addEventListener('click', () => {
  if (puesto) levanta();
});

addEventListener('keydown', e => {
  if (e.key === 'Escape') { levanta(); return; }
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const i = puesto ? vinilos.indexOf(puesto) : -1;
  const sig = e.key === 'ArrowRight'
    ? vinilos[(i + 1 + vinilos.length) % vinilos.length]
    : vinilos[(i - 1 + vinilos.length) % vinilos.length];
  poner(sig);
  sig.scrollIntoView({ behavior: suave ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
});

/* la caja se puede arrastrar con la rueda del ratón en horizontal */
if (rail) {
  rail.addEventListener('wheel', e => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    rail.scrollLeft += e.deltaY;
    e.preventDefault();
  }, { passive: false });
}
