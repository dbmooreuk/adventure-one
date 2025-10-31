/**
 * Main Application Entry Point
 * Modern Adventure Game - Pure JavaScript ES6+ Implementation
 */

import './styles/main.css'
import { Game } from './core/Game.js'
import { registerServiceWorker } from './utils/serviceWorker.js'

/**
 * Scale game to fit window while maintaining aspect ratio
 */
function scaleGame() {
    const baseWidth = 1280
    const baseHeight = 720
    const gameContainer = document.querySelector('.game-container')

    if (!gameContainer) return

    // Calculate scale to fit window while maintaining aspect ratio
    const scaleX = window.innerWidth / baseWidth
    const scaleY = window.innerHeight / baseHeight
    const scale = Math.min(scaleX, scaleY)

    // Apply scale transform
    gameContainer.style.transform = `scale(${scale})`

    // Center the game container
    const scaledWidth = baseWidth * scale
    const scaledHeight = baseHeight * scale
    const offsetX = (window.innerWidth - scaledWidth) / 2
    const offsetY = (window.innerHeight - scaledHeight) / 2

    gameContainer.style.left = `${offsetX}px`
    gameContainer.style.top = `${offsetY}px`

    console.log(`🎮 Game scaled to ${(scale * 100).toFixed(1)}% (${Math.round(scaledWidth)}x${Math.round(scaledHeight)})`)
}

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

        // Initial game scaling
        scaleGame()

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

// Handle window resize for responsive scaling
window.addEventListener('resize', scaleGame)

// Handle orientation change for mobile devices
window.addEventListener('orientationchange', () => {
    setTimeout(scaleGame, 100) // Small delay to ensure dimensions are updated
})
