// PokéGuía sin conexión: guarda la app y lo que vas abriendo.
// Archivos de la app: primero la red (para ver los cambios) y, si no hay, la copia guardada.
// Imágenes y sonidos: primero la copia guardada.
const VERSION = 'pokeguia-v6';
const BASE = ['./', 'index.html', 'manifest.json', 'icono-192.png', 'icono-512.png', 'datos.js', 'extra.js', 'estadisticas_antiguas.js', 'movimientos.js', 'movs/descripciones.js',
  'gimnasios.js', 'gimnasios_fotos.js', 'obediencia.js', 'crianza.js', 'lugares_fotos.js', 'mapas.js', 'mapas_reales.js', 'mapas_reales_extra.js',
  'ubic/nombres.js', 'ubic/nombres_pkhex.js', 'rivales.js', 'objetos.js', 'objetos_lugares.js', 'funciones.js', 'funciones2.js', 'imagenes/indice.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(BASE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  const multimedia = /\.(png|jpe?g|gif|webp|svg|ogg|mp3)$/i.test(url.pathname) || r.destination === 'image' || r.destination === 'audio';
  if (multimedia) {
    e.respondWith(caches.match(r).then(c => c || fetch(r).then(resp => {
      if (resp && (resp.ok || resp.type === 'opaque')) { const copia = resp.clone(); caches.open(VERSION).then(ca => ca.put(r, copia)); }
      return resp;
    }).catch(() => c)));
    return;
  }
  if (url.origin !== location.origin && !/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return;
  e.respondWith(fetch(r, {cache: 'no-cache'}).then(resp => {
    if (resp && resp.ok) { const copia = resp.clone(); caches.open(VERSION).then(ca => ca.put(r, copia)); }
    return resp;
  }).catch(() => caches.match(r).then(c => c || caches.match('index.html'))));
});
