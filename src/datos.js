/* ============================================================
   LOS SIETE VINILOS — una sola fuente de verdad.
   Para cambiar una canción: edita `cancion`, `banda`, `anio` y `yt`
   (el código del video de YouTube, lo que va después de "watch?v=").
   Si prefieres un mp3 propio, pon la ruta en `audio`
   (ej. 'audio/01.mp3') y se usa ese en vez de YouTube.
   ============================================================ */

export const DISCOS = [
  {
    id: '01', cancion: 'Blind', banda: 'Korn', anio: 1994, lado: 'A', rpm: 33,
    tema: 'Quién soy', papel: '#C8321E', tinta: '#121110',
    yt: 'SGK00Q7xx-s', audio: '',
    arte: '<circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="50" cy="50" r="16" fill="currentColor"/><path d="M6 50h88" stroke="currentColor" stroke-width="7"/>',
  },
  {
    id: '02', cancion: 'Toxicity', banda: 'System Of A Down', corta: 'S.O.A.D.', anio: 2001, lado: 'A', rpm: 33,
    tema: 'Mis fuertes', papel: '#B4961E', tinta: '#121110',
    yt: 'iywaBOMvYLI', audio: '',
    arte: '<path d="M50 12 88 78H12z" fill="none" stroke="currentColor" stroke-width="5"/><path d="M50 40 70 74H30z" fill="currentColor"/>',
  },
  {
    id: '03', cancion: 'Break Stuff', banda: 'Limp Bizkit', anio: 2000, lado: 'A', rpm: 45,
    tema: 'Identidad', papel: '#121110', tinta: '#F4F2ED',
    yt: 'ZpUYjpKg9KY', audio: '',
    arte: '<path d="M10 30h80v14H10zM10 56h80v14H10z" fill="currentColor"/><path d="M44 6 36 94" stroke="#C8321E" stroke-width="9"/>',
  },
  {
    id: '04', cancion: 'Duality', banda: 'Slipknot', anio: 2004, lado: 'A', rpm: 45,
    tema: 'Motion y video', papel: '#2B2A27', tinta: '#F4F2ED',
    yt: '6fVE8kSM43I', audio: '',
    arte: '<path d="M50 10a40 40 0 010 80z" fill="currentColor"/><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="5"/><path d="M50 10v80" stroke="#C8321E" stroke-width="4"/>',
  },
  {
    id: '05', cancion: 'No One Knows', banda: 'Queens of the Stone Age', corta: 'QOTSA', anio: 2002, lado: 'A', rpm: 33,
    tema: 'UI y UX', papel: '#E6E3DA', tinta: '#121110',
    yt: 's88r_q7oufE', audio: '',
    arte: '<g fill="currentColor"><circle cx="28" cy="30" r="9"/><circle cx="52" cy="30" r="6"/><circle cx="74" cy="30" r="3"/><circle cx="28" cy="54" r="6"/><circle cx="52" cy="54" r="9"/><circle cx="74" cy="54" r="6"/><circle cx="28" cy="76" r="3"/><circle cx="52" cy="76" r="6"/><circle cx="74" cy="76" r="9"/></g>',
  },
  {
    id: '06', cancion: 'Freak on a Leash', banda: 'Korn', anio: 1998, lado: 'B', rpm: 33,
    tema: 'El proceso', papel: '#3A3733', tinta: '#F4F2ED',
    yt: 'jRGrNDV2mKc', audio: '',
    arte: '<g fill="none" stroke="currentColor" stroke-width="6"><rect x="18" y="18" width="30" height="30" rx="14"/><rect x="52" y="52" width="30" height="30" rx="14"/><path d="M40 40 60 60"/></g>',
  },
  {
    id: '07', cancion: 'Aerials', banda: 'System Of A Down', corta: 'S.O.A.D.', anio: 2001, lado: 'B', rpm: 33,
    tema: 'Contacto', papel: '#F4F2ED', tinta: '#121110',
    yt: 'L-iepu3EtyE', audio: '',
    arte: '<g stroke="currentColor" stroke-width="4"><path d="M50 50 50 6M50 50 94 50M50 50 50 94M50 50 6 50M50 50 81 19M50 50 19 81M50 50 81 81M50 50 19 19"/></g><circle cx="50" cy="50" r="12" fill="#C8321E"/>',
  },
];

/* El arte como SVG completo, con la tinta ya puesta */
export function svgArte(d, tam = 100){
  const cuerpo = d.arte.split('currentColor').join(d.tinta);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${tam}" height="${tam}">${cuerpo}</svg>`;
}
