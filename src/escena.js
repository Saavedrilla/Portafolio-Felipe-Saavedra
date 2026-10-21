/* ============================================================
   LA PIEZA EN 3D — Three.js
   Un mueble de vinilos contra la pared, una mesa con el
   tocadiscos y dos parlantes delante. Todo es geometría hecha
   en código: no hay modelos que descargar.

   Unidades en metros. La pared del fondo está en z = -1.75,
   la mesa en z = -0.45 y la cámara mira desde z positivo.
   ============================================================ */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import gsap from 'gsap';
import * as T from './texturas.js';

const PI = Math.PI;
const PARED_Z = -1.75;
const MESA_Y = 0.72;
const MESA_Z = -0.45;

/* el mueble: 5 columnas x 3 filas, como un Kallax */
const CEL = 0.335, INT = 0.016, EXT = 0.04, PROF = 0.39, COLS = 5, FILAS = 3, PATA = 0.07;
const ANCHO = COLS * CEL + (COLS - 1) * INT + 2 * EXT;
const ALTO  = FILAS * CEL + (FILAS - 1) * INT + 2 * EXT;
const MUEBLE_Z = PARED_Z + PROF / 2 + 0.006;
const FRENTE_Z = MUEBLE_Z + PROF / 2;

/* dónde va cada disco destacado: [columna, fila] (fila 0 = abajo) */
const VITRINA = [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [1, 1], [3, 1]];

/* el brazo: ángulos en radianes */
const BRAZO_REPOSO = 0;
const BRAZO_INICIO = -0.54;   /* aguja en el primer surco */
const BRAZO_FINAL  = -0.75;   /* aguja cerca de la etiqueta */

const mat = (color, rough = 0.7, metal = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });

function sombra(obj, emite = true, recibe = true){
  obj.traverse(o => { if (o.isMesh) { o.castShadow = emite; o.receiveShadow = recibe; } });
  return obj;
}

function celda(c, f){
  return {
    x: -ANCHO / 2 + EXT + c * (CEL + INT) + CEL / 2,
    y: PATA + EXT + f * (CEL + INT) + CEL / 2,
  };
}

export async function crearEscena(canvas, discos, avisos = {}){
  /* ---------------- motor ---------------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const escena = new THREE.Scene();
  escena.background = new THREE.Color('#E9E5DC');
  escena.fog = new THREE.Fog('#E9E5DC', 5, 11);

  const camara = new THREE.PerspectiveCamera(36, 1, 0.05, 30);

  await T.fuentesListas();

  /* ---------------- la pieza ---------------- */
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), mat('#ffffff', 0.78, 0, { map: T.piso() }));
  suelo.rotation.x = -PI / 2;
  suelo.receiveShadow = true;
  escena.add(suelo);

  const pared = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), mat('#F4F2ED', 0.95));
  pared.position.set(0, 3, PARED_Z);
  pared.receiveShadow = true;
  escena.add(pared);

  const zocalo = new THREE.Mesh(new THREE.BoxGeometry(12, 0.09, 0.02), mat('#DCD7CB', 0.8));
  zocalo.position.set(0, 0.045, PARED_Z + 0.01);
  escena.add(zocalo);

  const alfombra = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.5), mat('#ffffff', 1, 0, { map: T.alfombra() }));
  alfombra.rotation.x = -PI / 2;
  alfombra.position.set(0, 0.003, -0.35);
  alfombra.receiveShadow = true;
  escena.add(alfombra);

  /* ---------------- el mueble de vinilos ---------------- */
  const mueble = new THREE.Group();
  const madera = mat('#1E1D1B', 0.55);
  const tabla = (w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), madera);
    m.position.set(x, y, z); mueble.add(m);
  };
  const base = PATA;
  tabla(EXT, ALTO, PROF, -ANCHO / 2 + EXT / 2, base + ALTO / 2, 0);
  tabla(EXT, ALTO, PROF,  ANCHO / 2 - EXT / 2, base + ALTO / 2, 0);
  tabla(ANCHO, EXT, PROF, 0, base + EXT / 2, 0);
  tabla(ANCHO, EXT, PROF, 0, base + ALTO - EXT / 2, 0);
  for (let c = 1; c < COLS; c++) {
    tabla(INT, ALTO - 2 * EXT, PROF, -ANCHO / 2 + EXT + c * (CEL + INT) - INT / 2, base + ALTO / 2, 0);
  }
  for (let f = 1; f < FILAS; f++) {
    tabla(ANCHO - 2 * EXT, INT, PROF, 0, base + EXT + f * (CEL + INT) - INT / 2, 0);
  }
  tabla(ANCHO, ALTO, 0.006, 0, base + ALTO / 2, -PROF / 2 + 0.003);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    tabla(0.04, PATA, 0.04, sx * (ANCHO / 2 - 0.05), PATA / 2, sz * (PROF / 2 - 0.05));
  });
  mueble.position.z = MUEBLE_Z;
  escena.add(sombra(mueble));

  /* lomos de discos: cientos de cajas finas en una sola malla */
  const paleta = ['#121110', '#1E1D1B', '#2B2A27', '#E9E5DA', '#C8321E', '#B4961E', '#3B4A6B',
                  '#6B6660', '#8C2A1C', '#D8D2C4', '#121110', '#F4F2ED', '#4A4742'];
  const ocupadas = new Set(VITRINA.map(([c, f]) => c + ',' + f));
  const lomos = [];
  for (let f = 0; f < FILAS; f++) for (let c = 0; c < COLS; c++) {
    if (ocupadas.has(c + ',' + f)) continue;
    const { x, y } = celda(c, f);
    const lleno = 0.72 + Math.random() * 0.28;
    let px = x - CEL / 2 + 0.004;
    const tope = x - CEL / 2 + CEL * lleno;
    while (px < tope) {
      const g = 0.004 + Math.random() * 0.006;
      const alto = 0.305 + Math.random() * 0.012;
      lomos.push({ x: px + g / 2, y: y - CEL / 2 + alto / 2, z: -0.01 + Math.random() * 0.02, g, alto, rz: 0 });
      px += g + 0.0006;
    }
    /* los últimos se recuestan si sobra espacio */
    if (lleno < 0.95) {
      const caidos = lomos.slice(-5);
      caidos.forEach((l, i) => {
        l.rz = -(0.06 + i * 0.05);
        l.x += i * 0.008;
      });
    }
  }
  const lomoGeo = new THREE.BoxGeometry(1, 1, 1);
  const lomoMalla = new THREE.InstancedMesh(lomoGeo, mat('#ffffff', 0.62), lomos.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  const color = new THREE.Color();
  lomos.forEach((l, i) => {
    e.set(0, 0, l.rz);
    q.setFromEuler(e);
    m4.compose(v.set(l.x, l.y, MUEBLE_Z + 0.02 + l.z), q, s.set(l.g, l.alto, 0.31));
    lomoMalla.setMatrixAt(i, m4);
    lomoMalla.setColorAt(i, color.set(paleta[(Math.random() * paleta.length) | 0]));
  });
  sombra(lomoMalla);
  escena.add(lomoMalla);

  /* ---------------- la vitrina: los 7 discos de frente ---------------- */
  const fundas = {};
  /* las 14 texturas (portada + cara del disco) se preparan a la vez */
  const impresos = await Promise.all(discos.map(d => Promise.all([T.portada(d), T.caraDisco(d)])));
  const canto = mat('#D8D2C4', 0.8);
  const fondoGeo = new THREE.BoxGeometry(0.31, 0.31, 0.004);
  const fondoN = VITRINA.length * 5;
  const fondoMalla = new THREE.InstancedMesh(fondoGeo, mat('#ffffff', 0.7), fondoN);
  let fi = 0;

  for (let i = 0; i < discos.length; i++) {
    const d = discos[i];
    const [c, f] = VITRINA[i];
    const { x, y } = celda(c, f);

    /* discos de relleno detrás del destacado */
    for (let k = 0; k < 5; k++) {
      e.set(-0.1 - k * 0.012, 0, (Math.random() - 0.5) * 0.02);
      q.setFromEuler(e);
      m4.compose(v.set(x + (Math.random() - 0.5) * 0.008, y - CEL / 2 + 0.158, MUEBLE_Z - 0.12 + k * 0.022), q, s.set(1, 1, 1));
      fondoMalla.setMatrixAt(fi, m4);
      fondoMalla.setColorAt(fi, color.set(paleta[(Math.random() * paleta.length) | 0]));
      fi++;
    }

    const [tapa, caraTex] = impresos[i];
    const frente = mat('#ffffff', 0.55, 0, { map: tapa });
    const atras = mat(d.papel, 0.7);
    const funda = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.31, 0.006), [canto, canto, canto, canto, frente, atras]);
    funda.position.set(x, y - CEL / 2 + 0.162, FRENTE_Z - 0.075);
    funda.rotation.x = -0.1;
    funda.userData.id = d.id;
    sombra(funda);
    escena.add(funda);

    /* el disco que vive dentro de la funda */
    const cara = mat('#ffffff', 0.32, 0.05, { map: caraTex });
    const borde = mat('#0B0B0A', 0.4);
    const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.0025, 96), [borde, cara, borde]);
    disco.visible = false;
    disco.castShadow = true;
    escena.add(disco);

    fundas[d.id] = {
      d, funda, disco,
      base: { pos: funda.position.clone(), rx: funda.rotation.x },
    };
  }
  sombra(fondoMalla);
  escena.add(fondoMalla);

  /* encima del mueble: una planta, una lámpara y discos apilados */
  const arriba = PATA + ALTO;
  const maceta = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.058, 0.14, 32), mat('#B5643C', 0.85));
  maceta.position.set(-0.68, arriba + 0.07, MUEBLE_Z);
  escena.add(sombra(maceta));
  const hojaMat = mat('#4E6B3A', 0.7, 0, { flatShading: true });
  for (let k = 0; k < 9; k++) {
    const hoja = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.32 + Math.random() * 0.14, 5), hojaMat);
    const a = (k / 9) * PI * 2;
    hoja.position.set(-0.68 + Math.cos(a) * 0.03, arriba + 0.28, MUEBLE_Z + Math.sin(a) * 0.03);
    hoja.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45);
    escena.add(sombra(hoja));
  }

  const lampara = new THREE.Group();
  const metal = mat('#1E1D1B', 0.35, 0.6);
  const pie = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.02, 32), metal);
  const vara = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.36, 12), metal);
  vara.position.y = 0.19;
  const pantalla = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.14, 32, 1, true), mat('#C8321E', 0.6, 0, { side: THREE.DoubleSide }));
  pantalla.position.y = 0.38;
  const foco = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), new THREE.MeshBasicMaterial({ color: '#FFE2B0' }));
  foco.position.y = 0.34;
  lampara.add(pie, vara, pantalla, foco);
  lampara.position.set(0.7, arriba + 0.01, MUEBLE_Z + 0.02);
  escena.add(sombra(lampara, true, false));
  foco.castShadow = false;

  for (let k = 0; k < 5; k++) {
    const plano = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.006, 0.31), mat(paleta[(k * 3) % paleta.length], 0.6));
    plano.position.set(0.08 + (Math.random() - 0.5) * 0.02, arriba + 0.003 + k * 0.0065, MUEBLE_Z + (Math.random() - 0.5) * 0.02);
    plano.rotation.y = (Math.random() - 0.5) * 0.18;
    escena.add(sombra(plano));
  }

  /* ---------------- afiches en la pared ---------------- */
  function afiche(tex, w, h, x, y, rz){
    const g = new THREE.Group();
    const papel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat('#ffffff', 0.9, 0, { map: tex }));
    g.add(papel);
    const cinta = mat('#E2D3AE', 0.9, 0, { transparent: true, opacity: 0.82 });
    [[-1, 1], [1, 1]].forEach(([sx, sy]) => {
      const t = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.03), cinta);
      t.position.set(sx * (w / 2 - 0.02), sy * (h / 2 - 0.005), 0.002);
      t.rotation.z = sx * 0.5;
      g.add(t);
    });
    g.position.set(x, y, PARED_Z + 0.004);
    g.rotation.z = rz;
    papel.receiveShadow = true;
    escena.add(g);
    return g;
  }
  afiche(T.aficheGira(discos), 0.5, 0.7, -1.36, 1.24, 0.025);

  const cargador = new THREE.TextureLoader();
  const foto = (url, alto, x, y, rz) => cargador.load(url, tex => {
    tex.colorSpace = THREE.SRGBColorSpace;
    const r = tex.image.width / tex.image.height;
    afiche(tex, alto * r, alto, x, y, rz);
  });
  foto(new URL('../img/jefe.png', import.meta.url).href, 0.6, 1.36, 1.52, -0.03);
  foto(new URL('../img/casco-ruta.png', import.meta.url).href, 0.34, 1.02, 1.62, 0.04);

  /* ---------------- la mesa ---------------- */
  const mesa = new THREE.Group();
  const cubierta = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.045, 0.56, 4, 0.01), mat('#5A3E2A', 0.55));
  cubierta.position.y = MESA_Y - 0.0225;
  mesa.add(cubierta);
  const fierro = mat('#121110', 0.4, 0.5);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.032, MESA_Y - 0.045, 0.032), fierro);
    p.position.set(sx * 0.7, (MESA_Y - 0.045) / 2, sz * 0.24);
    mesa.add(p);
  });
  /* travesaño con un cajón de discos debajo */
  const repisa = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.02, 0.5), mat('#5A3E2A', 0.6));
  repisa.position.y = 0.16;
  mesa.add(repisa);
  const cajon = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.36), mat('#C8321E', 0.7));
  cajon.position.set(-0.42, 0.29, 0);
  mesa.add(cajon);
  for (let k = 0; k < 14; k++) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.31, 0.006), mat(paleta[(Math.random() * paleta.length) | 0], 0.65));
    l.position.set(-0.42, 0.33, -0.15 + k * 0.022);
    l.rotation.x = -0.25 + k * 0.01;
    mesa.add(l);
  }
  mesa.position.z = MESA_Z;
  escena.add(sombra(mesa));

  /* ---------------- el tocadiscos ---------------- */
  const toca = new THREE.Group();
  toca.position.set(0, MESA_Y, MESA_Z);
  escena.add(toca);

  const plinto = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.07, 0.36, 4, 0.009), mat('#161514', 0.42, 0.1));
  plinto.position.y = 0.047;
  const patas = mat('#0B0B0A', 0.5);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.012, 24), patas);
    p.position.set(sx * 0.19, 0.006, sz * 0.14);
    toca.add(p);
  });
  const placa = new THREE.Mesh(new THREE.BoxGeometry(0.452, 0.002, 0.352), mat('#26241F', 0.3, 0.5));
  placa.position.y = 0.083;
  toca.add(plinto, placa);
  const TOPE = 0.084;

  /* plato que gira */
  const plato = new THREE.Group();
  plato.position.set(-0.06, TOPE, 0);
  const bordeTex = T.bordePlato();
  const plataMat = mat('#B8B4AA', 0.3, 0.85);
  const platoMalla = new THREE.Mesh(
    new THREE.CylinderGeometry(0.152, 0.152, 0.024, 96),
    [mat('#ffffff', 0.35, 0.7, { map: bordeTex }), plataMat, plataMat]
  );
  platoMalla.position.y = 0.012;
  const goma = new THREE.Mesh(new THREE.CylinderGeometry(0.147, 0.147, 0.003, 96), mat('#101010', 0.95));
  goma.position.y = 0.0255;
  const eje = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.024, 12), mat('#D8D4CA', 0.2, 0.9));
  eje.position.y = 0.031;
  plato.add(platoMalla, goma, eje);
  toca.add(plato);
  const DISCO_Y = 0.0283;

  /* brazo */
  const pivote = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.03, 0.026, 32), mat('#C9C5BB', 0.3, 0.85));
  pivote.position.set(0.165, TOPE + 0.013, -0.11);
  toca.add(pivote);
  const brazo = new THREE.Group();
  brazo.position.set(0.165, TOPE + 0.043, -0.11);
  const inclina = new THREE.Group();
  brazo.add(inclina);
  const cromo = mat('#D8D4CA', 0.22, 0.95);
  const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.0034, 0.0034, 0.24, 12), cromo);
  tubo.rotation.x = PI / 2;
  tubo.position.z = 0.12;
  const cabeza = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.006, 0.042), mat('#121110', 0.4));
  cabeza.position.set(-0.003, -0.002, 0.245);
  cabeza.rotation.y = 0.35;
  const capsula = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.011, 0.018), mat('#C8321E', 0.5));
  capsula.position.set(-0.004, -0.009, 0.25);
  capsula.rotation.y = 0.35;
  const contrapeso = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.036, 24), mat('#2B2A27', 0.35, 0.7));
  contrapeso.rotation.x = PI / 2;
  contrapeso.position.z = -0.045;
  inclina.add(tubo, cabeza, capsula, contrapeso);
  inclina.rotation.x = -0.05;
  toca.add(brazo);
  const apoyo = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.03, 12), mat('#121110', 0.5));
  apoyo.position.set(0.168, TOPE + 0.015, 0.128);
  toca.add(apoyo);

  /* mandos */
  const boton = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.007, 24), mat('#3A3733', 0.4, 0.3));
  boton.position.set(-0.19, TOPE + 0.004, 0.148);
  const b33 = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.005, 0.012), mat('#D8D4CA', 0.4, 0.5));
  b33.position.set(-0.145, TOPE + 0.003, 0.152);
  const b45 = b33.clone(); b45.position.x = -0.118;
  const luzMat = new THREE.MeshStandardMaterial({ color: '#3A0E08', emissive: '#C8321E', emissiveIntensity: 0 });
  const luz = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 12, 12), luzMat);
  luz.position.set(-0.2, TOPE + 0.004, -0.15);
  const pitch = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.003, 0.11), mat('#0B0B0A', 0.6));
  pitch.position.set(0.195, TOPE + 0.002, 0.07);
  const perilla = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.01, 0.012), mat('#D8D4CA', 0.4, 0.5));
  perilla.position.set(0.195, TOPE + 0.006, 0.07);
  toca.add(boton, b33, b45, luz, pitch, perilla);
  sombra(toca);

  /* ---------------- parlantes ---------------- */
  const conos = [];
  [-1, 1].forEach(lado => {
    const p = new THREE.Group();
    const caja = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.27, 0.19, 3, 0.008), mat('#1E1D1B', 0.6));
    caja.position.y = 0.135;
    const cono = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.014, 40), mat('#121110', 0.9));
    cono.rotation.x = PI / 2;
    cono.position.set(0, 0.1, 0.096);
    const tapita = new THREE.Mesh(new THREE.SphereGeometry(0.02, 20, 10, 0, PI * 2, 0, PI / 2), mat('#2B2A27', 0.5));
    tapita.rotation.x = PI / 2;
    tapita.position.set(0, 0.1, 0.1);
    const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.01, 24), mat('#3A3733', 0.4, 0.4));
    tw.rotation.x = PI / 2;
    tw.position.set(0, 0.215, 0.095);
    p.add(caja, cono, tapita, tw);
    p.position.set(lado * 0.56, MESA_Y, MESA_Z + 0.02);
    p.rotation.y = -lado * 0.28;
    escena.add(sombra(p));
    conos.push(cono, tapita);
  });

  /* ---------------- luces ---------------- */
  escena.add(new THREE.HemisphereLight('#FFF6E8', '#6B5A48', 1.0));

  const clave = new THREE.SpotLight('#FFE9CC', 38, 0, 0.62, 0.75, 2);
  clave.position.set(-1.1, 3.1, 1.3);
  clave.target.position.set(0, 0.6, -0.8);
  clave.castShadow = true;
  clave.shadow.mapSize.set(2048, 2048);
  clave.shadow.bias = -0.0003;
  clave.shadow.normalBias = 0.02;
  clave.shadow.camera.near = 1;
  clave.shadow.camera.far = 8;
  escena.add(clave, clave.target);

  const relleno = new THREE.DirectionalLight('#DDE5FF', 0.55);
  relleno.position.set(2.5, 1.8, 2);
  escena.add(relleno);

  const calida = new THREE.PointLight('#FFB061', 1.6, 3.2, 2);
  calida.position.set(0.7, arriba + 0.33, MUEBLE_Z + 0.08);
  escena.add(calida);

  /* ---------------- cámara: vistas ---------------- */
  const vista = { px: 0, py: 1.5, pz: 1.4, tx: 0, ty: 0.86, tz: -0.8 };
  const desfase = { x: 0, y: 0 };
  const raton = { x: 0, y: 0, sx: 0, sy: 0 };
  const suave = !!avisos.suave;

  function vistas(){
    const vertical = camara.aspect < 0.85;
    return vertical
      ? { general: { px: 0, py: 1.85, pz: 3.0, tx: 0, ty: 0.88, tz: -0.75 },
          foco:    { px: 0.18, py: 1.3, pz: 0.62, tx: -0.02, ty: 0.8, tz: -0.45 } }
      : { general: { px: 0, py: 1.52, pz: 1.62, tx: 0, ty: 0.98, tz: -0.8 },
          foco:    { px: 0.4, py: 1.16, pz: 0.3, tx: -0.02, ty: 0.8, tz: -0.47 } };
  }

  let enFoco = false;
  function mueveVista(foco, dur = 1.4){
    enFoco = foco;
    gsap.to(vista, { ...vistas()[foco ? 'foco' : 'general'], duration: dur, ease: 'power3.inOut', overwrite: true });
  }

  /* corrimiento de la imagen para dejar sitio al panel: x en px, y en px */
  function desplaza(x, y, dur = 1){
    gsap.to(desfase, { x, y, duration: dur, ease: 'power3.inOut', overwrite: true });
  }

  /* ---------------- tamaño ---------------- */
  function ajustaTam(){
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.fov = camara.aspect < 0.85 ? 48 : 36;
    camara.updateProjectionMatrix();
    Object.assign(vista, vistas()[enFoco ? 'foco' : 'general']);
  }
  addEventListener('resize', ajustaTam);
  ajustaTam();
  Object.assign(vista, vistas().general);

  /* ---------------- ratón: pasar y elegir ---------------- */
  const rayo = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const objetivos = Object.values(fundas).map(f => f.funda);
  let encima = null;

  function apunta(ev){
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    rayo.setFromCamera(ndc, camara);
    const toque = rayo.intersectObjects([...objetivos, plinto, platoMalla], false)[0];
    return toque ? toque.object : null;
  }

  canvas.addEventListener('pointermove', ev => {
    raton.x = (ev.clientX / innerWidth) * 2 - 1;
    raton.y = (ev.clientY / innerHeight) * 2 - 1;
    if (ev.pointerType === 'touch') return;
    const o = apunta(ev);
    const id = o && o.userData.id;
    const nuevo = id ? fundas[id] : null;
    if (nuevo !== encima) {
      if (encima && encima.d.id !== actual) asoma(encima, false);
      encima = nuevo;
      if (encima && encima.d.id !== actual) asoma(encima, true);
    }
    canvas.style.cursor = (nuevo || o === plinto || o === platoMalla) ? 'pointer' : '';
    avisos.alPasar && avisos.alPasar(nuevo ? nuevo.d : null, ev.clientX, ev.clientY);
  });
  canvas.addEventListener('pointerleave', () => {
    if (encima && encima.d.id !== actual) asoma(encima, false);
    encima = null;
    avisos.alPasar && avisos.alPasar(null);
  });
  canvas.addEventListener('click', ev => {
    const o = apunta(ev);
    if (!o) { avisos.alFondo && avisos.alFondo(); return; }
    if (o.userData.id) avisos.alElegir && avisos.alElegir(o.userData.id);
    else if (actual) avisos.alTocarPlato && avisos.alTocarPlato();
  });

  function asoma(f, si){
    gsap.to(f.funda.position, { z: f.base.pos.z + (si ? 0.07 : 0), y: f.base.pos.y + (si ? 0.015 : 0), duration: 0.35, ease: 'power2.out' });
    gsap.to(f.funda.rotation, { x: si ? -0.02 : f.base.rx, duration: 0.35, ease: 'power2.out' });
  }

  /* ---------------- poner y sacar discos ---------------- */
  let actual = null;      /* id del disco en el plato */
  let ocupado = false;
  let pendiente = null;
  let estado = 'quieto';  /* quieto | sonando */
  const giro = { vel: 0, meta: 0 };
  let rpm = 33;
  let progreso = 0;

  const radPorSeg = r => (r === 45 ? 45 : 33.333) * 2 * PI / 60;

  function aguja(abajo){
    const tl = gsap.timeline();
    if (abajo) {
      tl.to(brazo.rotation, { y: BRAZO_INICIO, duration: 0.8, ease: 'power2.inOut' })
        .to(inclina.rotation, { x: 0.012, duration: 0.35, ease: 'power2.in' });
    } else {
      tl.to(inclina.rotation, { x: -0.05, duration: 0.25, ease: 'power2.out' })
        .to(brazo.rotation, { y: BRAZO_REPOSO, duration: 0.8, ease: 'power2.inOut' });
    }
    return tl;
  }

  function devuelve(id){
    const f = fundas[id];
    const disco = f.disco;
    escena.attach(disco);
    const destino = f.base.pos;
    const tl = gsap.timeline({ onComplete(){ disco.visible = false; } });
    tl.to(disco.position, { x: f.base.pos.x, y: destino.y + 0.42, z: destino.z + 0.25, duration: 0.6, ease: 'power2.inOut' }, 0)
      .to(disco.rotation, { x: PI / 2 + f.base.rx, y: 0, z: 0, duration: 0.6, ease: 'power2.inOut' }, 0)
      .to(disco.position, { y: destino.y + 0.005, z: destino.z + 0.004, duration: 0.4, ease: 'power2.in' });
    asoma(f, false);
    return tl;
  }

  async function poner(id){
    if (ocupado) { pendiente = id; return; }
    if (id === actual) { if (estado !== 'sonando') await tocar(); return; }
    ocupado = true;

    if (actual) {
      if (estado === 'sonando') await levantar(true);
      const viejo = actual;
      actual = null;
      await devuelve(viejo);
    }

    const f = fundas[id];
    actual = id;
    avisos.alCambiar && avisos.alCambiar(f.d);
    const disco = f.disco;
    const fp = f.funda.position;

    /* el disco aparece dentro de la funda, de frente */
    disco.visible = true;
    disco.position.set(fp.x, fp.y, fp.z + 0.004);
    disco.rotation.set(PI / 2 + f.funda.rotation.x, 0, 0);

    const destino = new THREE.Vector3();
    plato.localToWorld(destino.set(0, DISCO_Y, 0));

    const tl = gsap.timeline();
    tl.to(fp, { z: f.base.pos.z + 0.16, y: f.base.pos.y + 0.03, duration: 0.4, ease: 'power2.out' }, 0)
      .to(f.funda.rotation, { x: 0.05, duration: 0.4, ease: 'power2.out' }, 0)
      .to(disco.position, { z: f.base.pos.z + 0.166, y: f.base.pos.y + 0.03, duration: 0.4, ease: 'power2.out' }, 0)
      /* sale por arriba */
      .to(disco.position, { y: f.base.pos.y + 0.36, duration: 0.45, ease: 'power2.out' })
      /* vuela al plato acostándose */
      .to(disco.position, { x: destino.x, z: destino.z, duration: 0.9, ease: 'power2.inOut' })
      .to(disco.position, { y: destino.y + 0.22, duration: 0.9, ease: 'sine.inOut' }, '<')
      .to(disco.rotation, { x: 0, y: PI * 2.2, duration: 0.9, ease: 'power2.inOut' }, '<')
      /* cae en el eje */
      .to(disco.position, { y: destino.y, duration: 0.32, ease: 'power3.in' })
      .add(() => asoma(f, false), '-=0.9');
    if (suave) tl.timeScale(1.4);
    await tl;

    plato.attach(disco);
    disco.position.set(0, DISCO_Y, 0);
    disco.rotation.set(0, disco.rotation.y, 0);

    ocupado = false;
    await tocar();
    if (pendiente && pendiente !== actual) { const p = pendiente; pendiente = null; poner(p); }
    else pendiente = null;
  }

  async function tocar(){
    if (!actual) return;
    giro.meta = radPorSeg(rpm);
    gsap.to(luzMat, { emissiveIntensity: 3, duration: 0.3 });
    gsap.to(boton.position, { y: TOPE + 0.002, duration: 0.1, yoyo: true, repeat: 1 });
    progreso = 0;
    await aguja(true);
    estado = 'sonando';
    avisos.alSonar && avisos.alSonar(fundas[actual].d);
  }

  async function levantar(rapido = false){
    if (estado !== 'sonando' && !rapido) return;
    estado = 'quieto';
    avisos.alCallar && avisos.alCallar();
    const tl = aguja(false);
    giro.meta = 0;
    gsap.to(luzMat, { emissiveIntensity: 0, duration: 0.3 });
    if (rapido) tl.timeScale(1.6);
    await tl;
  }

  function cambiaRpm(r){
    rpm = r;
    gsap.to(b33.position, { y: TOPE + (r === 33 ? 0.001 : 0.003), duration: 0.15 });
    gsap.to(b45.position, { y: TOPE + (r === 45 ? 0.001 : 0.003), duration: 0.15 });
    if (estado === 'sonando') giro.meta = radPorSeg(r);
  }
  cambiaRpm(33);

  /* ---------------- bucle ---------------- */
  const reloj = new THREE.Clock();
  let latido = 0;

  function cuadro(){
    const dt = Math.min(reloj.getDelta(), 0.05);
    const t = reloj.elapsedTime;

    giro.vel += (giro.meta - giro.vel) * Math.min(1, dt * (giro.meta > giro.vel ? 2.2 : 1.1));
    plato.rotation.y -= giro.vel * dt;

    if (estado === 'sonando' && !ocupado) {
      const meta = BRAZO_INICIO + (BRAZO_FINAL - BRAZO_INICIO) * progreso;
      brazo.rotation.y += (meta - brazo.rotation.y) * Math.min(1, dt * 0.8);
      /* el disco nunca es perfecto: la aguja cabecea un poco */
      inclina.rotation.x = 0.012 + Math.sin(t * giro.vel) * 0.0012;
    }

    /* parlantes: bombean mientras suena */
    const meta = estado === 'sonando' && !suave ? 1 : 0;
    latido += (meta - latido) * Math.min(1, dt * 3);
    const golpe = Math.pow(Math.max(0, Math.sin(t * PI * 3.4)), 6) * latido;
    conos.forEach((c, i) => { c.position.z = (i % 2 ? 0.1 : 0.096) + golpe * 0.006; });

    /* cámara con un poco de vida según el ratón */
    raton.sx += (raton.x - raton.sx) * Math.min(1, dt * 2.5);
    raton.sy += (raton.y - raton.sy) * Math.min(1, dt * 2.5);
    const amp = suave ? 0.02 : 0.07;
    camara.position.set(vista.px + raton.sx * amp, vista.py - raton.sy * amp * 0.6, vista.pz);
    camara.lookAt(vista.tx, vista.ty, vista.tz);

    if (desfase.x || desfase.y) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      camara.setViewOffset(w, h, desfase.x, desfase.y, w, h);
    } else if (camara.view && camara.view.enabled) {
      camara.clearViewOffset();
    }

    renderer.render(escena, camara);
  }
  /* compila los shaders mientras sigue la pantalla de carga,
     para que el primer cuadro no dé un tirón */
  try { await renderer.compileAsync(escena, camara); } catch {}
  renderer.setAnimationLoop(cuadro);

  return {
    poner,
    levantar: () => levantar(false),
    tocar,
    cambiaRpm,
    mueveVista,
    desplaza,
    progreso: f => { progreso = Math.max(0, Math.min(1, f)); },
    get actual(){ return actual; },
    get sonando(){ return estado === 'sonando'; },
  };
}
