
const CACHE_NAME = 'mada-trading-v1';
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://esm.sh/jspdf@^2.5.1',
  'https://esm.sh/jspdf-autotable@^3.8.2',
  'https://esm.sh/lucide-react@^0.562.0',
  'https://esm.sh/dexie@^4.2.1',
  'https://esm.sh/react-dom@^19.2.3/',
  'https://esm.sh/react@^19.2.3'
];

const LOCAL_ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './App.tsx',
  './types.ts',
  './db.ts',
  './metadata.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // On tente de mettre en cache tout ce qui est possible
      return cache.addAll([...LOCAL_ASSETS, ...EXTERNAL_ASSETS]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Stratégie : Cache First, puis Network
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Optionnel : Mettre en cache les nouvelles requêtes réussies
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    }).catch(() => {
      // Fallback si tout échoue
      return caches.match('./index.html');
    })
  );
});
