/**
 * Main Application Entry Point
 * Modern Adventure Game - Pure JavaScript ES6+ Implementation
 */

import './styles/main.css'
import { Game } from './core/Game.js'
import { registerServiceWorker } from './utils/serviceWorker.js'

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Hide loader after minimum display time
        setTimeout(() => {
            const loader = document.getElementById('loader')
            if (loader && !loader.classList.contains('done')) {
                loader.classList.add('done')
            }
        }, 1000)

        // Register service worker for PWA functionality
        if ('serviceWorker' in navigator) {
            await registerServiceWorker()
        }

        // Initialize the game
        const game = new Game()
        await game.initialize()
        
        // Make game globally accessible for debugging
        window.game = game
        
        console.log('🎮 Adventure Game initialized successfully!')
        
    } catch (error) {
        console.error('❌ Failed to initialize game:', error)
        
        // Show error message to user
        const errorDiv = document.createElement('div')
        errorDiv.className = 'error-message'
        errorDiv.innerHTML = `
            <h2>Game Failed to Load</h2>
            <p>Sorry, there was an error loading the game. Please refresh the page to try again.</p>
            <button onclick="location.reload()">Refresh Page</button>
        `
        document.body.appendChild(errorDiv)
    }
})

// Handle page visibility changes for audio management
document.addEventListener('visibilitychange', () => {
    if (window.game) {
        if (document.hidden) {
            window.game.audioManager?.pauseAll()
        } else {
            window.game.audioManager?.resumeAll()
        }
    }
})

// Handle beforeunload for auto-save
window.addEventListener('beforeunload', () => {
    if (window.game) {
        window.game.saveManager?.autoSave()
    }
})
