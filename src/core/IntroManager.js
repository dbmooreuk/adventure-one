import { EventEmitter } from './EventEmitter.js'
import { audio } from '../config/gameConfig.js'

/**
 * IntroManager - Manages the intro/splash screen
 * Handles checking for saved games and showing appropriate buttons
 */
export class IntroManager extends EventEmitter {
    constructor(game) {
        super()
        this.game = game
        this.elements = {}
        this.hasSavedGame = false
    }

    /**
     * Initialize the intro screen
     */
    async initialize() {
        console.log('🎬 Initializing intro screen...')
        
        // Get DOM elements
        this.elements = {
            introContainer: document.querySelector('.intro-container'),
            introTitle: document.querySelector('.intro-title'),
            introText: document.querySelector('.intro-text'),
            btnNewGame: document.querySelector('.btn-new-game'),
            btnContinue: document.querySelector('.btn-continue'),
            btnResetIntro: document.querySelector('.btn-reset-intro')
        }

        // Check for saved game
        await this.checkSavedGame()

        // Set up event listeners
        this.setupEventListeners()

        console.log('✅ Intro screen initialized')
    }

    /**
     * Check if there's a saved game and update button visibility
     */
    async checkSavedGame() {
        try {
            this.hasSavedGame = await this.game.saveManager.hasSavedGame()
            
            if (this.hasSavedGame) {
                // Show Continue and Reset buttons
                if (this.elements.btnContinue) {
                    this.elements.btnContinue.style.display = 'block'
                    console.log('✅ Showing Continue button')
                }
                if (this.elements.btnResetIntro) {
                    this.elements.btnResetIntro.style.display = 'block'
                    console.log('✅ Showing Reset button')
                }
                if (this.elements.btnNewGame) {
                    this.elements.btnNewGame.style.display = 'block'
                    this.elements.btnNewGame.textContent = 'Start New Game'
                    console.log('✅ Showing New Game button (with saved game)')
                }
            } else {
                // Hide Continue and Reset buttons, show New Game button
                if (this.elements.btnContinue) {
                    this.elements.btnContinue.style.display = 'none'
                    console.log('❌ Hiding Continue button')
                }
                if (this.elements.btnResetIntro) {
                    this.elements.btnResetIntro.style.display = 'none'
                    console.log('❌ Hiding Reset button')
                }
                if (this.elements.btnNewGame) {
                    this.elements.btnNewGame.style.display = 'block'
                    this.elements.btnNewGame.textContent = 'Start Adventure'
                    console.log('✅ Showing Start Adventure button (no saved game)')
                }
            }

            console.log(`💾 Saved game ${this.hasSavedGame ? 'found' : 'not found'}`)
        } catch (error) {
            console.error('❌ Error checking for saved game:', error)
            this.hasSavedGame = false
        }
    }

    /**
     * Set up event listeners for intro buttons
     */
    setupEventListeners() {
        // New Game button
        this.elements.btnNewGame?.addEventListener('click', () => {
            this.startNewGame()
        })

        // Continue button
        this.elements.btnContinue?.addEventListener('click', () => {
            this.continueGame()
        })

        // Reset button
        this.elements.btnResetIntro?.addEventListener('click', () => {
            this.resetGame()
        })
    }

    /**
     * Start a new game
     */
    async startNewGame() {
        console.log('🆕 Starting new game from intro...')

        // If there's a saved game, confirm before starting new
        if (this.hasSavedGame) {
            const confirmed = confirm('Starting a new game will overwrite your saved progress. Continue?')
            if (!confirmed) return
        }

        // Play button click sound to unlock audio context (wait for it to start)
        console.log('🔊 Playing button click sound to unlock audio...')
        await this.game.audioManager?.playSound(audio.buttonClickSound)
        console.log('🔊 Button click sound completed')

        // Small delay to ensure audio context is fully unlocked
        await new Promise(resolve => setTimeout(resolve, 100))

        // Hide intro screen
        this.hide()

        // Start new game (this will go to scene1, not splash)
        await this.game.startNewGame()

        this.emit('newGameStarted')
    }

    /**
     * Continue from saved game
     */
    async continueGame() {
        console.log('▶️ Continuing from saved game...')

        // Play button click sound to unlock audio context (wait for it to start)
        await this.game.audioManager?.playSound(audio.buttonClickSound)

        // Small delay to ensure audio context is fully unlocked
        await new Promise(resolve => setTimeout(resolve, 100))

        // Hide intro screen
        this.hide()

        // Load saved game
        await this.game.saveManager.loadGame()

        this.emit('gameContinued')
    }

    /**
     * Reset game
     */
    async resetGame() {
        console.log('🔄 Resetting game from intro...')

        const confirmed = confirm('This will delete your saved game. Are you sure?')
        if (!confirmed) return

        // Stop all audio
        this.game.audioManager?.stopAmbient()

        // Clear saved game
        await this.game.saveManager.clearSave()

        // Reset all game state
        this.game.score = 0
        this.game.achievements.clear()
        this.game.inventoryManager.clear()
        this.game.stateManager.reset()
        this.game.sceneManager.reset() // Reset all scene states (restores items to scenes)

        // Clear all scene UI elements (even though we're on intro, clear any residual UI)
        this.game.uiManager?.clearScene()

        // Play intro music again
        await this.game.audioManager?.playAmbient(audio.introMusic)

        // Update button visibility
        await this.checkSavedGame()

        this.emit('gameReset')
    }

    /**
     * Hide the intro screen and show game UI
     */
    hide() {
        if (this.elements.introContainer) {
            this.elements.introContainer.style.display = 'none'
        }

        // Show game UI elements
        const sceneContainer = document.querySelector('.scene-container')
        const menuContainer = document.querySelector('#menu-container')

        if (sceneContainer) {
            sceneContainer.style.display = 'flex'
        }
        if (menuContainer) {
            menuContainer.style.display = 'block'
        }
    }

    /**
     * Show the intro screen and hide game UI
     */
    async show() {
        if (this.elements.introContainer) {
            this.elements.introContainer.style.display = 'flex'
        }

        // Hide game UI elements
        const sceneContainer = document.querySelector('.scene-container')
        const menuContainer = document.querySelector('#menu-container')

        if (sceneContainer) {
            sceneContainer.style.display = 'none'
        }
        if (menuContainer) {
            menuContainer.style.display = 'none'
        }

        // Play intro music
        if (this.game.audioManager) {
            await this.game.audioManager.playAmbient(audio.introMusic)
        }

        // Refresh saved game check
        await this.checkSavedGame()
    }
}

