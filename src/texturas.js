/* ============================================================
   TEXTURAS DIBUJADAS EN CANVAS
   Todo lo que se ve impreso en la pieza (portadas, etiquetas,
   afiches, alfombra, piso) se dibuja aquí: sin imágenes externas
   salvo las fotos tramadas de img/.
   ============================================================ */
import * as THREE from 'three';
import { svgArte } from './datos.js';

const F = {
  titulo:  '"Anton", "Arial Narrow", sans-serif',
  stencil: '"Big Shoulders Stencil Display", "Anton", sans-serif',
  maquina: '"Special Elite", "Courier New", monospace',
  mano:    '"Permanent Marker", cursive',
};

/* Espera a que las fuentes existan antes de dibujarlas en canvas */
export async function fuentesListas(){
  if (!document.fonts) return;
  const pedidas = [
    '40px "Anton"', '900 40px "Big Shoulders Stencil Display"',
    '700 40px "Big Shoulders Stencil Display"', '40px "Special Elite"', '40px "Permanent Marker"',
  ].map(f => document.fonts.load(f).catch(() => {}));
  await Promise.race([Promise.all(pedidas), new Promise(r => setTimeout(r, 1500))]);
}

function lienzo(w, h = w){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function textura(c, { repetir = false, srgb = true } = {}){
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repetir) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}

/* grano de fotocopia encima de cualquier lienzo: un mosaico de ruido
   hecho una sola vez y pegado encima (recorrer cada píxel era lo más lento) */
let mosaico = null;
function grano(ctx, w, h, fuerza = 0.07){
  if (!mosaico) {
    const [c, x] = lienzo(256);
    const img = x.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    mosaico = c;
  }
  ctx.save();
  ctx.globalAlpha = Math.min(1, fuerza * 2.4);
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(mosaico, 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function cargaSvg(d){
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgArte(d, 512));
  });
}

/* ---------- PORTADA DE UN DISCO ---------- */
export async function portada(d){
  const S = 1024;
  const [c, x] = lienzo(S);
  x.fillStyle = d.papel; x.fillRect(0, 0, S, S);

  const arte = await cargaSvg(d);
  if (arte) x.drawImage(arte, S * 0.13, S * 0.08, S * 0.74, S * 0.74);

  x.fillStyle = d.tinta;
  x.textBaseline = 'alphabetic';
  x.font = `900 ${S * 0.12}px ${F.stencil}`;
  ajusta(x, d.cancion.toUpperCase(), S * 0.06, S * 0.86, S * 0.88);
  x.font = `${S * 0.042}px ${F.maquina}`;
  x.fillText((d.corta || d.banda).toUpperCase(), S * 0.06, S * 0.94);
  x.textAlign = 'right';
  x.fillText(d.id, S * 0.94, S * 0.07);
  x.textAlign = 'left';

  /* borde gastado */
  x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = S * 0.012;
  x.strokeRect(0, 0, S, S);
  grano(x, S, S, 0.09);
  return textura(c);
}

/* reduce la letra hasta que quepa en el ancho */
function ajusta(x, txt, px, py, max){
  let tam = parseFloat(x.font.match(/(\d+(\.\d+)?)px/)[1]);
  while (x.measureText(txt).width > max && tam > 10) {
    tam -= 2;
    x.font = x.font.replace(/\d+(\.\d+)?px/, tam + 'px');
  }
  x.fillText(txt, px, py);
}

/* ---------- CARA DEL VINILO: surcos + etiqueta ---------- */
export async function caraDisco(d){
  const S = 1024, m = S / 2;
  const [c, x] = lienzo(S);
  x.fillStyle = '#0B0B0A'; x.fillRect(0, 0, S, S);

  /* surcos */
  for (let r = m * 0.99; r > m * 0.36; r -= 1.6) {
    const v = 14 + Math.random() * 16;
    x.strokeStyle = `rgba(${v + 10},${v + 9},${v + 8},${0.55 + Math.random() * 0.4})`;
    x.lineWidth = 1;
    x.beginPath(); x.arc(m, m, r, 0, Math.PI * 2); x.stroke();
  }
  /* pistas: tres anillos lisos entre canciones */
  [0.82, 0.66, 0.5].forEach(k => {
    x.strokeStyle = 'rgba(0,0,0,.9)'; x.lineWidth = 5;
    x.beginPath(); x.arc(m, m, m * k, 0, Math.PI * 2); x.stroke();
  });
  /* brillo en abanico */
  const brillo = x.createConicGradient(0.6, m, m);
  brillo.addColorStop(0, 'rgba(255,255,255,0)');
  brillo.addColorStop(0.08, 'rgba(255,255,255,.10)');
  brillo.addColorStop(0.16, 'rgba(255,255,255,0)');
  brillo.addColorStop(0.5, 'rgba(255,255,255,0)');
  brillo.addColorStop(0.58, 'rgba(255,255,255,.08)');
  brillo.addColorStop(0.66, 'rgba(255,255,255,0)');
  x.fillStyle = brillo;
  x.beginPath(); x.arc(m, m, m, 0, Math.PI * 2); x.fill();

  /* etiqueta */
  const re = m * 0.34;
  x.save();
  x.beginPath(); x.arc(m, m, re, 0, Math.PI * 2); x.clip();
  x.fillStyle = d.papel; x.fillRect(m - re, m - re, re * 2, re * 2);
  const arte = await cargaSvg(d);
  if (arte) { x.globalAlpha = 0.75; x.drawImage(arte, m - re * 0.62, m - re * 0.86, re * 1.24, re * 1.24); x.globalAlpha = 1; }
  x.fillStyle = d.tinta;
  x.textAlign = 'center';
  x.font = `900 ${re * 0.24}px ${F.stencil}`;
  x.fillText(d.cancion.toUpperCase(), m, m + re * 0.62);
  x.font = `${re * 0.11}px ${F.maquina}`;
  x.fillText(`${(d.corta || d.banda).toUpperCase()} · LADO ${d.lado} · ${d.rpm} RPM`, m, m + re * 0.8);
  x.restore();

  /* agujero */
  x.fillStyle = '#050504';
  x.beginPath(); x.arc(m, m, S * 0.008, 0, Math.PI * 2); x.fill();
  return textura(c);
}

/* ---------- PISO DE MADERA ---------- */
export function piso(){
  const [c, x] = lienzo(1024);
  const tablas = 8, alto = 1024 / tablas;
  for (let i = 0; i < tablas; i++) {
    const base = 92 + Math.random() * 22;
    x.fillStyle = `rgb(${base + 40},${base + 18},${base - 12})`;
    x.fillRect(0, i * alto, 1024, alto);
    for (let v = 0; v < 60; v++) {
      x.strokeStyle = `rgba(60,35,15,${Math.random() * 0.18})`;
      x.lineWidth = 1 + Math.random() * 2;
      const y = i * alto + Math.random() * alto;
      x.beginPath(); x.moveTo(0, y);
      x.bezierCurveTo(300, y + (Math.random() - 0.5) * 8, 700, y + (Math.random() - 0.5) * 8, 1024, y);
      x.stroke();
    }
    x.fillStyle = 'rgba(30,18,8,.55)';
    x.fillRect(0, i * alto, 1024, 3);
    const corte = Math.random() * 1024;
    x.fillRect(corte, i * alto, 3, alto);
  }
  grano(x, 1024, 1024, 0.05);
  const t = textura(c, { repetir: true });
  t.repeat.set(3, 3);
  return t;
}

/* ---------- ALFOMBRA A CUADROS (la de las Vans) ---------- */
export function alfombra(){
  const [c, x] = lienzo(512);
  const n = 8, l = 512 / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    x.fillStyle = (i + j) % 2 ? '#141312' : '#E9E5DA';
    x.fillRect(i * l, j * l, l, l);
  }
  grano(x, 512, 512, 0.12);
  const t = textura(c, { repetir: true });
  t.repeat.set(2, 1.4);
  return t;
}

/* ---------- AFICHE: la gira del portafolio ---------- */
export function aficheGira(discos){
  const W = 600, H = 840;
  const [c, x] = lienzo(W, H);
  x.fillStyle = '#EDE9DF'; x.fillRect(0, 0, W, H);

  x.fillStyle = '#121110';
  x.fillRect(0, 0, W, 120);
  x.fillStyle = '#EDE9DF';
  x.font = `900 64px ${F.stencil}`;
  x.fillText('PORTAFOLIO', 34, 86);

  /* lo impreso en hueco */
  x.font = `190px ${F.titulo}`;
  x.lineWidth = 4; x.strokeStyle = '#121110';
  x.strokeText('TOUR', 30, 330);
  x.font = `118px ${F.titulo}`;
  x.strokeText('2026', 34, 450);
  /* lo escrito a mano encima */
  x.save();
  x.translate(70, 300); x.rotate(-0.08);
  x.fillStyle = '#C8321E';
  x.font = `86px ${F.mano}`;
  x.fillText('Saavedra', 0, 0);
  x.restore();

  x.fillStyle = '#121110';
  x.font = `21px ${F.maquina}`;
  discos.forEach((d, i) => {
    x.fillText(`${d.id}  ${d.cancion.toUpperCase()}`, 36, 520 + i * 36);
    x.textAlign = 'right';
    x.fillText(d.tema.toUpperCase(), W - 36, 520 + i * 36);
    x.textAlign = 'left';
  });
  x.fillRect(36, 790, W - 72, 4);
  grano(x, W, H, 0.1);
  return textura(c);
}

/* ---------- PLATO: borde con puntos estroboscópicos ---------- */
export function bordePlato(){
  const [c, x] = lienzo(1024, 64);
  const g = x.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, '#9A968E'); g.addColorStop(0.5, '#D9D5CC'); g.addColorStop(1, '#6E6B65');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 64);
  x.fillStyle = '#2A2826';
  for (let i = 0; i < 1024; i += 8) x.fillRect(i, 10, 4, 10);
  for (let i = 0; i < 1024; i += 9) x.fillRect(i, 26, 4, 10);
  for (let i = 0; i < 1024; i += 10) x.fillRect(i, 42, 5, 10);
  return textura(c);
}
