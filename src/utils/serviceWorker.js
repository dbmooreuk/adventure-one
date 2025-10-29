/**
 * Service Worker Registration Utility
 * Handles PWA functionality and offline caching
 */

/**
 * Register service worker for PWA functionality
 */
export async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            console.log('🔧 Registering service worker...')
            
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            })
            
            console.log('✅ Service worker registered successfully:', registration.scope)
            
            // Handle updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('🔄 New service worker available')
                        // Optionally notify user about update
                        showUpdateNotification()
                    }
                })
            })
            
        } catch (error) {
            console.warn('❌ Service worker registration failed:', error)
        }
    } else {
        console.warn('⚠️ Service workers not supported')
    }
}

/**
 * Show update notification to user
 */
function showUpdateNotification() {
    // Simple notification - could be enhanced with a proper UI
    if (confirm('A new version is available. Reload to update?')) {
        window.location.reload()
    }
}

/**
 * Unregister service worker (for development/testing)
 */
export async function unregisterServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations()
            
            for (const registration of registrations) {
                await registration.unregister()
                console.log('🗑️ Service worker unregistered')
            }
        } catch (error) {
            console.error('❌ Failed to unregister service worker:', error)
        }
    }
}
