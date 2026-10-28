// Service worker: guarda los archivos para que la app abra sin internet.
// Al cambiar cualquier archivo, sube el número de CACHE para que los dispositivos se actualicen.
const CACHE="acred-v5";
const FILES=[
    "./",

    "./index.html",
    "./styles.css"

    ,"./data.js",
    "./app.js",
    "./manifest.json",

    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/icon-maskable-512.png"
];

// Instalación: descarga y guarda todos los archivos
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});

// Activación: borra cachés de versiones anteriores
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});

// Peticiones: primero internet (para tener la última versión); si no hay, usa lo guardado
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r})
    .catch(()=>caches.match(e.request).then(r=>r||caches.match("index.html"))));
});