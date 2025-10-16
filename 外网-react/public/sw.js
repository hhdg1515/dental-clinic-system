const APP_SHELL_CACHE = 'fad-app-shell-v1';
const STATIC_CACHE = 'fad-app-static-v1';
const KB_CACHE = 'fad-app-kb-v1';

const APP_SHELL_ROUTES = ['/index.html', '/app/login', '/app/dashboard', '/app/appointment'];
const FIREBASE_HOSTS = new Set([
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com'
]);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_ROUTES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => ![APP_SHELL_CACHE, STATIC_CACHE, KB_CACHE].includes(key))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (FIREBASE_HOSTS.has(url.host)) {
    return;
  }

  if (request.mode === 'navigate' && url.pathname.startsWith('/app')) {
    event.respondWith(handleAppNavigation(request));
    return;
  }

  if (url.origin === self.location.origin && isStaticAssetRequest(request)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith('/kb/') && url.pathname.endsWith('.json')) {
    event.respondWith(handleKnowledgeBase(request));
    return;
  }
});

async function handleAppNavigation(request) {
  const cache = await caches.open(APP_SHELL_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(async () => cachedResponse ?? cache.match('/index.html'));

  return cachedResponse ?? fetchPromise;
}

async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    if (cached) {
      return cached;
    }
    throw error;
  }
}

async function handleKnowledgeBase(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(KB_CACHE);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(KB_CACHE);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

function isStaticAssetRequest(request) {
  if (request.destination) {
    return ['style', 'script', 'font', 'image'].includes(request.destination);
  }
  return /\.(css|js|woff2?|png|jpg|jpeg|svg|gif|ico)$/i.test(new URL(request.url).pathname);
}
