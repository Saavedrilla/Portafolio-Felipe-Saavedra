/* ============================================================
   PORTAFOLIO EN VINILO — v7 "La pieza"
   Une la escena 3D con la interfaz: pantalla de carga, la caja
   de discos, el panel con la ficha y la música.

   Música: cada disco toca su video oficial de YouTube (ver
   datos.js). Se eligió YouTube y no mp3 porque subir canciones de
   Korn o Slipknot a una web pública es redistribuir música con
   derechos; el video embebido sí está licenciado. Si quieres un
   mp3 propio para algún disco, pon su ruta en `audio`.
   ============================================================ */
import { DISCOS, svgArte } from './datos.js';
import { crearEscena } from './escena.js';

window.__piezaViva = true;   /* apaga el rescate de index.html */

const $ = id => document.getElementById(id);
const raiz = document.documentElement;
const params = new URLSearchParams(location.search);
const suave = matchMedia('(prefers-reduced-motion: reduce)').matches && !params.has('motion');
const porId = Object.fromEntries(DISCOS.map(d => [d.id, d]));

let escena = null;
let actual = null;        /* disco elegido (puede estar volando todavía) */
let panelAbierto = false;

/* ------------------------------------------------------------
   1. PANTALLA DE CARGA — por reloj, nunca se queda colgada
   ------------------------------------------------------------ */
const carga = (() => {
  const pct = $('cargaPct'), relleno = $('cargaRelleno'), texto = $('cargaTexto');
  const t0 = performance.now();
  let listo = false, cerrado = false;
  const frases = ['ARMANDO LA PIEZA', 'ORDENANDO LOS DISCOS', 'CALENTANDO LA BANDEJA', 'BAJANDO LA AGUJA'];

  const reloj = setInterval(pinta, 50);
  setTimeout(() => { listo = true; }, 7000);   /* tope duro */

  function pinta(){
    if (cerrado) return;
    const t = performance.now() - t0;
    const n = Math.min(listo ? 100 : 94, (t / 1000) * 100 * (listo ? 2 : 1));
    pct.textContent = Math.round(n);
    relleno.style.width = n + '%';
    texto.textContent = frases[Math.min(frases.length - 1, Math.floor(n / 26))];
    if (n < 100) return;
    cerrado = true;
    clearInterval(reloj);
    setTimeout(() => {
      raiz.classList.remove('cargando');
      setTimeout(() => $('carga')?.remove(), 600);
    }, 100);
  }
  return { listo(){ listo = true; } };
})();

/* ------------------------------------------------------------
   2. LA CAJA (acceso rápido, también para teclado y celular)
   ------------------------------------------------------------ */
const caja = $('caja');
DISCOS.forEach(d => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'mini';
  b.dataset.id = d.id;
  b.style.background = d.papel;
  b.setAttribute('aria-pressed', 'false');
  b.setAttribute('aria-label', `${d.cancion} de ${d.banda} — ${d.tema}`);
  b.title = `${d.cancion} — ${d.tema}`;
  b.innerHTML = svgArte(d) + `<span class="mini__num" style="color:${d.tinta}">${d.id}</span>`;
  b.addEventListener('click', () => elegir(d.id));
  caja.appendChild(b);
});

/* ------------------------------------------------------------
   3. SONIDO: YouTube + crujido de aguja sintetizado
   ------------------------------------------------------------ */
const sonido = {
  on: true, ctx: null, gan: null,
  yt: null, ytListo: false, pendiente: null, mp3: null,

  /* hay que despertarlo dentro de un clic */
  despierta(){
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const largo = this.ctx.sampleRate * 2;
      const buf = this.ctx.createBuffer(1, largo, this.ctx.sampleRate);
      const dat = buf.getChannelData(0);
      let ult = 0;
      for (let i = 0; i < largo; i++) {
        ult = (ult + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        dat[i] = ult * 3.5;
        if (Math.random() < 0.0004) dat[i] += (Math.random() * 2 - 1) * 0.6;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      this.gan = this.ctx.createGain();
      this.gan.gain.value = 0;
      src.connect(this.gan).connect(this.ctx.destination);
      src.start();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  crujido(nivel){
    if (!this.gan) return;
    this.gan.gain.cancelScheduledValues(this.ctx.currentTime);
    this.gan.gain.linearRampToValueAtTime(this.on ? nivel : 0, this.ctx.currentTime + 0.4);
  },

  golpe(){
    if (!this.ctx || !this.on) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(), t = this.ctx.currentTime;
    o.type = 'triangle';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(g).connect(this.ctx.destination);
    o.start(t); o.stop(t + 0.22);
  },

  /* prepara el video al elegir (dentro del clic) y lo suelta al bajar la aguja */
  prepara(d){
    this.para();
    if (d.audio) {
      this.mp3 = new Audio(d.audio);
      this.mp3.preload = 'auto';
      return;
    }
    if (this.ytListo) this.yt.cueVideoById(d.yt);
    else this.pendiente = d;
  },

  suena(d){
    this.crujido(0.045);
    if (d.audio && this.mp3) {
      this.mp3.muted = !this.on;
      this.mp3.play().catch(() => {});
      return;
    }
    if (!this.ytListo) { this.pendiente = d; return; }
    if (this.on) this.yt.unMute(); else this.yt.mute();
    this.yt.setVolume(85);
    this.yt.playVideo();
    /* si el navegador bloquea el arranque, se pide un clic en el video */
    clearTimeout(this.vigia);
    this.vigia = setTimeout(() => {
      const e = this.yt.getPlayerState();
      if (escena?.sonando !== false && e !== 1 && e !== 3) $('suena').classList.add('pide-play');
    }, 3000);
  },

  para(){
    this.crujido(0);
    if (this.mp3) { this.mp3.pause(); this.mp3 = null; }
    if (this.ytListo) { try { this.yt.pauseVideo(); } catch {} }
  },

  silencio(on){
    this.on = on;
    if (this.mp3) this.mp3.muted = !on;
    if (this.ytListo) on ? this.yt.unMute() : this.yt.mute();
    this.crujido(on && escena?.sonando ? 0.045 : 0);
  },

  avance(){
    if (this.mp3 && this.mp3.duration) return this.mp3.currentTime / this.mp3.duration;
    if (!this.ytListo) return 0;
    try {
      const dur = this.yt.getDuration();
      return dur ? this.yt.getCurrentTime() / dur : 0;
    } catch { return 0; }
  },
};

/* API de YouTube: el reproductor vive visible en la tarjeta de lo que suena */
window.onYouTubeIframeAPIReady = () => {
  sonido.yt = new YT.Player('yt', {
    width: '288', height: '162',
    playerVars: { playsinline: 1, rel: 0, modestbranding: 1, controls: 1, origin: location.origin },
    events: {
      onReady(){
        sonido.ytListo = true;
        const p = sonido.pendiente;
        sonido.pendiente = null;
        if (p) { sonido.yt.cueVideoById(p.yt); if (escena?.sonando || !escena) sonido.suena(p); }
      },
      onStateChange(ev){
        if (ev.data === YT.PlayerState.PLAYING) $('suena').classList.remove('pide-play');
        if (ev.data === YT.PlayerState.ENDED) levantarAguja();
      },
    },
  });
};
(() => {
  const s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  s.async = true;
  document.head.appendChild(s);
})();

/* ------------------------------------------------------------
   4. ELEGIR UN DISCO
   ------------------------------------------------------------ */
function elegir(id){
  const d = porId[id];
  if (!d) return;
  sonido.despierta();

  if (id === actual) {
    abrePanel(id);
    if (escena && !escena.sonando) escena.tocar();
    return;
  }

  actual = id;
  sonido.prepara(d);
  muestraTarjeta(d);
  marcaCaja(id);
  $('pista').classList.add('fuera');
  abrePanel(id);

  if (escena) {
    escena.poner(id);
    /* seguro: si en 4 s la aguja no bajó (equipo lento), la canción suena igual */
    setTimeout(() => { if (actual === id && !escena.sonando) sonido.suena(d); }, 4000);
  }
  else { sonido.suena(d); }       /* sin 3D: suena de inmediato */
}

function muestraTarjeta(d){
  $('suena').hidden = false;
  $('suenaMini').innerHTML = svgArte(d);
  $('suenaMini').style.background = d.papel;
  $('suenaLado').textContent = d.lado;
  $('suenaPista').textContent = d.id;
  $('suenaRpm').textContent = d.rpm === 45 ? '45' : '33⅓';
  $('suenaCancion').textContent = d.cancion;
  $('suenaBanda').textContent = `${d.banda} · ${d.anio}`;
  $('suenaAvance').style.width = '0%';
  $('btnAguja').textContent = 'Levantar aguja';
  rpm = d.rpm;
  velocidad();
  if (escena) escena.cambiaRpm(d.rpm);
}

function marcaCaja(id){
  caja.querySelectorAll('.mini').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
}

function levantarAguja(){
  sonido.para();
  if (escena) escena.levantar();
  $('btnAguja').textContent = 'Bajar aguja';
}

$('btnAguja').addEventListener('click', () => {
  if (!actual) return;
  sonido.despierta();
  if (escena ? escena.sonando : $('btnAguja').textContent === 'Levantar aguja') levantarAguja();
  else {
    $('btnAguja').textContent = 'Levantar aguja';
    if (escena) escena.tocar(); else sonido.suena(porId[actual]);
  }
});

let rpm = 33;
/* un disco a la velocidad equivocada suena acelerado o lento, como en la vida real */
function velocidad(){
  const d = porId[actual];
  const tasa = !d || rpm === d.rpm ? 1 : (rpm > d.rpm ? 1.25 : 0.75);
  if (sonido.ytListo) try { sonido.yt.setPlaybackRate(tasa); } catch {}
  if (sonido.mp3) sonido.mp3.playbackRate = tasa;
}
$('btnRpm').addEventListener('click', () => {
  if (!actual) return;
  rpm = rpm === 33 ? 45 : 33;
  $('suenaRpm').textContent = rpm === 45 ? '45' : '33⅓';
  if (escena) escena.cambiaRpm(rpm);
  velocidad();
});

$('btnSonido').addEventListener('click', e => {
  const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
  e.currentTarget.setAttribute('aria-pressed', String(on));
  e.currentTarget.querySelector('b').textContent = on ? 'on' : 'off';
  sonido.despierta();
  sonido.silencio(on);
});

$('btnFicha').addEventListener('click', () => actual && abrePanel(actual));

/* avance de la canción: barra y brazo que se mete hacia la etiqueta */
setInterval(() => {
  if (!actual) return;
  const f = sonido.avance();
  $('suenaAvance').style.width = (f * 100).toFixed(1) + '%';
  if (escena) escena.progreso(f);
}, 500);

/* ------------------------------------------------------------
   5. EL PANEL
   ------------------------------------------------------------ */
const panel = $('panel');
const angosto = () => matchMedia('(max-width:760px)').matches;

function abrePanel(id){
  const d = porId[id];
  document.querySelectorAll('.ficha').forEach(f => f.classList.toggle('is-activa', f.dataset.ficha === id));
  $('panelPista').textContent = `PISTA ${d.id} · LADO ${d.lado} · ${d.tema}`;
  $('panelCuerpo').scrollTop = 0;
  panel.classList.add('abierto');
  panel.setAttribute('aria-hidden', 'false');
  panelAbierto = true;
  if (escena) {
    escena.mueveVista(true);
    if (angosto()) escena.desplaza(0, panel.offsetHeight * 0.5);
    else escena.desplaza(panel.offsetWidth * 0.5, 0);
  }
}

function cierraPanel(){
  panel.classList.remove('abierto');
  panel.setAttribute('aria-hidden', 'true');
  panelAbierto = false;
  if (escena) {
    escena.desplaza(0, 0);
    escena.mueveVista(!!actual && !angosto());
  }
}

$('panelCerrar').addEventListener('click', cierraPanel);

function salta(paso){
  const i = actual ? DISCOS.findIndex(d => d.id === actual) : -1;
  const sig = DISCOS[(i + paso + DISCOS.length) % DISCOS.length];
  elegir(sig.id);
}
$('discoAnterior').addEventListener('click', () => salta(-1));
$('discoSiguiente').addEventListener('click', () => salta(1));

document.querySelectorAll('[data-abre]').forEach(el => el.addEventListener('click', e => {
  e.preventDefault();
  elegir(el.dataset.abre);
}));

addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input, textarea')) return;
  if (e.key === 'Escape') { panelAbierto ? cierraPanel() : levantarAguja(); }
  if (e.key === 'ArrowRight') salta(1);
  if (e.key === 'ArrowLeft') salta(-1);
});

/* ------------------------------------------------------------
   6. GLOBO al pasar sobre un disco del mueble
   ------------------------------------------------------------ */
const globo = $('globo');
function pasa(d, x, y){
  if (!d) { globo.classList.remove('si'); return; }
  globo.innerHTML = `<b>${d.cancion}</b><span>${d.corta || d.banda} · <i>${d.tema}</i></span>`;
  globo.style.left = x + 'px';
  globo.style.top = y + 'px';
  globo.classList.add('si');
}

/* ------------------------------------------------------------
   7. ARRANQUE DE LA ESCENA
   ------------------------------------------------------------ */
(async () => {
  try {
    /* si el 3D no responde en 10 s, la página sigue sin él */
    const limite = new Promise((_, no) => setTimeout(() => no(new Error('el 3D tardó demasiado')), 10000));
    escena = await Promise.race([limite, crearEscena($('escena'), DISCOS, {
      suave,
      alElegir: elegir,
      alPasar: pasa,
      alTocarPlato: () => actual && abrePanel(actual),
      /* clic en una zona vacía: cierra la ficha y se aleja para ver la pieza entera */
      alFondo: () => { if (panelAbierto) cierraPanel(); escena.mueveVista(false); },
      alSonar: d => {
        sonido.golpe();
        if (d.id === actual) sonido.suena(d);
        $('btnAguja').textContent = 'Levantar aguja';
      },
      alCallar: () => { sonido.crujido(0); },
    })]);
  } catch (err) {
    console.warn('Sin 3D:', err);
    escena = null;
    $('sin3d').hidden = false;
    $('escena').hidden = true;
  }
  carga.listo();
})();
