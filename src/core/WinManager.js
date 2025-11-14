import { EventEmitter } from './EventEmitter.js'
import { audio } from '../config/gameConfig.js'

/**
 * WinManager - Manages the win screen
 * Handles showing the win screen when player achieves winning points
 */
export class WinManager extends EventEmitter {
    constructor(game) {
        super()
        this.game = game
        this.elements = {}
    }

    /**
     * Initialize the win screen
     */
    initialize() {
        console.log('🏆 Initializing win screen...')
        
        // Get DOM elements
        this.elements = {
            winContainer: document.getElementById('win-container'),
            winTitle: document.querySelector('.win-title'),
            winText: document.querySelector('.win-text'),
            winPoints: document.getElementById('win-points'),
            winPointsValue: document.getElementById('win-points-value'),
            btnWinNewGame: document.getElementById('btn-win-new-game')
        }

        // Set up event listeners
        this.setupEventListeners()

        console.log('✅ Win screen initialized')
    }

    /**
     * Set up event listeners for win screen buttons
     */
    setupEventListeners() {
        // New Game button
        this.elements.btnWinNewGame?.addEventListener('click', () => {
            this.startNewGame()
        })
    }

    /**
     * Start a new game from win screen
     */
    async startNewGame() {
        console.log('🆕 Starting new game from win screen...')

        // Play button click sound
        this.game.audioManager?.playSound(audio.buttonClickSound)

        // Hide win screen
        this.hide()

        // Reset and start new game
        await this.resetAndStartNewGame()

        this.emit('newGameStarted')
    }

    /**
     * Reset game and start fresh
     */
    async resetAndStartNewGame() {
        console.log('🔄 Resetting game from win screen...')

        // Stop all audio
        this.game.audioManager?.stopAmbient()

        // Clear saved game
        await this.game.saveManager?.clearSave()

        // Reset all state
        this.game.score = 0
        this.game.achievements.clear()
        this.game.achievementManager?.clearJournal()
        this.game.inventoryManager?.clear()
        this.game.stateManager?.reset()
        this.game.sceneManager?.reset()

        // Clear all scene UI elements
        this.game.uiManager?.clearScene()

        // Start with first actual game scene (skip splash)
        await this.game.sceneManager?.changeScene('scene1')

        this.emit('gameReset')
    }

    /**
     * Show the win screen
     * @param {number} totalPoints - Total points achieved
     */
    async show(totalPoints = 0) {
        console.log('🎉 Showing win screen with', totalPoints, 'points')

        // Update points display
        if (this.elements.winPointsValue) {
            this.elements.winPointsValue.textContent = totalPoints
        }

        // Show win container
        if (this.elements.winContainer) {
            this.elements.winContainer.style.display = 'flex'
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

        // Stop current music and play victory sound/music if configured
        this.game.audioManager?.stopAmbient()
        
        this.emit('winScreenShown', { totalPoints })
    }

    /**
     * Hide the win screen and show game UI
     */
    hide() {
        if (this.elements.winContainer) {
            this.elements.winContainer.style.display = 'none'
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
}

