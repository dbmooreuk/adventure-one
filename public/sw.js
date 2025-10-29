/**
 * Service Worker for Adventure Game PWA
 * Handles caching and offline functionality
 */

const CACHE_NAME = 'adventure-game-v1'
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/src/main.js',
    '/src/styles/main.scss',
    '/public/manifest.json',
    '/public/assets/sass/style.scss',
    '/public/assets/sass/_variables.scss',
    '/public/assets/sass/_mixins.scss',
    '/public/assets/sass/_fonts.scss',
    '/public/assets/sass/_colors.scss'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...')
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching static assets')
                return cache.addAll(STATIC_CACHE_URLS)
            })
            .then(() => {
                console.log('✅ Service Worker installed')
                return self.skipWaiting()
            })
            .catch((error) => {
                console.error('❌ Cache installation failed:', error)
            })
    )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker activating...')
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Deleting old cache:', cacheName)
                            return caches.delete(cacheName)
                        }
                    })
                )
            })
            .then(() => {
                console.log('✅ Service Worker activated')
                return self.clients.claim()
            })
    )
})

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return
    }
    
    // Skip chrome-extension requests
    if (event.request.url.startsWith('chrome-extension://')) {
        return
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    return cachedResponse
                }
                
                // Otherwise fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response
                        }
                        
                        // Clone the response for caching
                        const responseToCache = response.clone()
                        
                        // Cache the response for future use
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache)
                            })
                        
                        return response
                    })
                    .catch((error) => {
                        console.warn('🌐 Network request failed:', error)
                        
                        // Return offline fallback for HTML requests
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html')
                        }
                        
                        throw error
                    })
            })
    )
})

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting()
    }
})
