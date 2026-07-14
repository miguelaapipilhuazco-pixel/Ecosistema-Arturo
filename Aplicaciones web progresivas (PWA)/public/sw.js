/**
 * Service Worker para Proyecto Feria de Ciencias
 * Gestión de caché offline, Stale-While-Revalidate y actualizaciones rápidas.
 */

const CACHE_NAME = 'ecosystem-os-cache-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/webxr.html',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-512-maskable.png',
  '/webxr-logo.png'
];

// Instalar Service Worker y cachear recursos estáticos básicos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Cacheando shell de la aplicación');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activar Service Worker y limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Borrando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar peticiones y servir desde caché / red (Stale-While-Revalidate)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar peticiones locales GET
  if (request.method !== 'GET' || !url.origin.startsWith(self.location.origin)) {
    return;
  }

  // Evitar interceptar recursos de desarrollo de Vite (hot reloading y compilación dinámica)
  if (
    url.pathname.includes('/@vite/') ||
    url.pathname.includes('/src/') ||
    url.pathname.includes('/@id/') ||
    url.pathname.includes('/node_modules/') ||
    url.searchParams.has('t') ||
    url.searchParams.has('import')
  ) {
    return;
  }

  // Si es un recurso estático o página principal
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        // Ejecutar fetch en paralelo para actualizar la caché en segundo plano
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Silenciar errores de red offline
        });

        // Retornar respuesta cacheada inmediatamente o esperar al fetch si no existe
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Mensaje para forzar la actualización (Skip Waiting)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
