const CACHE_NAME = 'nasashe-pwa-v1'
const scopeUrl = new URL(self.registration.scope)
const scopePath = scopeUrl.pathname.replace(/\/$/, '')
const BASE_PATH = scopePath === '/' ? '' : scopePath

const CORE_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.webmanifest`,
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached

      return fetch(request)
        .then((response) => {
          const cloned = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned))
          return response
        })
        .catch(() => {
          if (request.mode === 'navigate') {
            return caches.match(`${BASE_PATH}/index.html`)
          }

          return Promise.reject(new Error('Network request failed and no cache available'))
        })
    }),
  )
})
