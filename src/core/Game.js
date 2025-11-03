/**
 * Main Game Class
 * Orchestrates all game systems and manages the overall game state
 */

import { EventEmitter } from './EventEmitter.js'
import { SceneManager } from './SceneManager.js'
import { StateManager } from './StateManager.js'
import { AudioManager } from './AudioManager.js'
import { UIManager } from './UIManager.js'
import { SaveManager } from './SaveManager.js'
import { InventoryManager } from './InventoryManager.js'
import { IntroManager } from './IntroManager.js'
import { PuzzleManager } from './PuzzleManager.js'
import { gameData } from '../data/gameData.js'
import { gameplay } from '../config/gameConfig.js'

export class Game extends EventEmitter {
    constructor() {
        super()

        // Core systems
        this.stateManager = new StateManager()
        this.sceneManager = new SceneManager(this)
        this.audioManager = new AudioManager(this)
        this.uiManager = new UIManager(this)
        this.saveManager = new SaveManager(this)
        this.inventoryManager = new InventoryManager(this)
        this.introManager = new IntroManager(this)
        this.puzzleManager = new PuzzleManager(this)

        // Game state
        this.isInitialized = false
        this.isPaused = false
        this.currentScene = null
        this.score = 0
        this.stages = gameplay.totalStages
        this.achievements = new Set() // Track completed achievements to prevent duplicate scoring

        // Bind methods
        this.handleSceneChange = this.handleSceneChange.bind(this)
        this.handleInventoryChange = this.handleInventoryChange.bind(this)
        this.handleScoreChange = this.handleScoreChange.bind(this)
    }

    /**
     * Initialize the game and all its systems
     */
    async initialize() {
        try {
            console.log('🎮 Initializing game systems...')
            
            // Load game data
            await this.loadGameData()
            
            // Initialize all managers
            await this.audioManager.initialize()
            await this.uiManager.initialize()
            await this.sceneManager.initialize()
            await this.saveManager.initialize()
            await this.inventoryManager.initialize()
            await this.introManager.initialize()
            await this.puzzleManager.initialize()

            // Set up event listeners
            this.setupEventListeners()

            // Show intro screen (it will handle saved game check)
            // Don't auto-start the game anymore - let intro screen handle it

            this.isInitialized = true
            this.emit('gameInitialized')
            
            console.log('✅ Game initialized successfully')
            
        } catch (error) {
            console.error('❌ Failed to initialize game:', error)
            throw error
        }
    }

    /**
     * Load game data from configuration
     */
    async loadGameData() {
        this.gameData = gameData
        this.stateManager.setState('gameData', this.gameData)
    }

    /**
     * Set up event listeners between systems
     */
    setupEventListeners() {
        // Scene events
        this.sceneManager.on('sceneChanged', this.handleSceneChange)
        
        // Inventory events
        this.inventoryManager.on('inventoryChanged', this.handleInventoryChange)
        
        // Score events
        this.on('scoreChanged', this.handleScoreChange)
        
        // UI events
        this.uiManager.on('actionSelected', (action) => {
            this.stateManager.setState('currentAction', action)
        })
        
        this.uiManager.on('saveRequested', () => {
            this.saveManager.saveGame()
        })
        
        this.uiManager.on('loadRequested', () => {
            this.saveManager.loadGame()
        })
        
        this.uiManager.on('resetRequested', () => {
            this.resetGame()
        })
    }

    /**
     * Start a new game
     */
    async startNewGame() {
        console.log('🆕 Starting new game...')

        // Reset all state
        this.score = 0
        this.achievements.clear() // Clear all achievements
        this.inventoryManager.clear()
        this.stateManager.reset()
        this.sceneManager.reset() // Reset all scene states (restores items to scenes)

        // Clear UI
        this.uiManager.clearScene()

        // Start with first actual game scene (skip splash)
        await this.sceneManager.changeScene('scene1')

        this.emit('gameStarted')
    }

    /**
     * Reset the game to initial state
     */
    async resetGame() {
        console.log('🔄 Resetting game...')

        // Confirm before resetting
        const confirmed = confirm('Are you sure you want to reset the game? This will delete your saved progress and return you to the intro screen.')
        if (!confirmed) {
            console.log('Reset cancelled by user')
            return
        }

        // Stop all audio
        this.audioManager.stopAmbient()

        // Clear saved game
        await this.saveManager.clearSave()

        // Reset all state
        this.score = 0
        this.achievements.clear()
        this.inventoryManager.clear()
        this.stateManager.reset()
        this.sceneManager.reset() // Reset all scene states (restores items to scenes)

        // Clear all scene UI elements
        this.uiManager.clearScene()

        // Show intro screen instead of starting game
        await this.introManager.show()

        this.emit('gameReset')
    }

    /**
     * Pause the game
     */
    pause() {
        if (this.isPaused) return
        
        this.isPaused = true
        this.audioManager.pauseAll()
        this.emit('gamePaused')
    }

    /**
     * Resume the game
     */
    resume() {
        if (!this.isPaused) return
        
        this.isPaused = false
        this.audioManager.resumeAll()
        this.emit('gameResumed')
    }

    /**
     * Handle scene change events
     */
    handleSceneChange(sceneData) {
        console.log(`🎮 Game.handleSceneChange called with:`, sceneData)
        this.currentScene = sceneData
        this.stateManager.setState('currentScene', sceneData.sceneName)
        
        // Update audio
        this.audioManager.playAmbient(sceneData.sceneMusic)
        
        // Update UI
        this.uiManager.updateScene(sceneData)
        
        this.emit('sceneChanged', sceneData)
    }

    /**
     * Handle inventory change events
     */
    handleInventoryChange(inventory) {
        this.stateManager.setState('inventory', inventory)
        this.uiManager.updateInventory(inventory)
        
        this.emit('inventoryChanged', inventory)
    }

    /**
     * Handle score change events
     */
    handleScoreChange(newScore) {
        this.score = newScore
        this.stateManager.setState('score', newScore)
        this.uiManager.updateScore(newScore)
    }

    /**
     * Add points to the score for a specific achievement
     * @param {number} points - Points to add
     * @param {string} achievementId - Unique identifier for this achievement
     */
    addScore(points, achievementId = null) {
        // If an achievement ID is provided, check if it's already been earned
        if (achievementId) {
            if (this.achievements.has(achievementId)) {
                console.log(`🏆 Achievement already earned: ${achievementId}`)
                return // Don't add points again
            }
            // Mark this achievement as earned
            this.achievements.add(achievementId)
            console.log(`🏆 New achievement earned: ${achievementId} (+${points} points)`)
        }

        this.score += points // Actually update the score
        console.log(`📊 Score updated: ${this.score} (+${points})`)
        this.emit('scoreChanged', this.score)
    }

    /**
     * Get current game state for saving
     */
    getGameState() {
        const state = {
            currentScene: this.currentScene?.sceneName || 'splash',
            score: this.score,
            achievements: Array.from(this.achievements), // Convert Set to Array for JSON serialization
            inventory: this.inventoryManager.getItems(),
            sceneStates: this.sceneManager.getSceneStates(),
            customState: this.stateManager.getState('customState') || {},
            timestamp: Date.now()
        }
        console.log('💾 Getting game state for save:', { score: state.score, achievements: state.achievements })
        return state
    }

    /**
     * Restore game state from save data
     */
    async restoreGameState(saveData) {
        try {
            console.log('💾 Restoring game state:', { score: saveData.score, achievements: saveData.achievements })
            this.score = saveData.score || 0

            // Restore achievements
            this.achievements = new Set(saveData.achievements || [])

            // Restore inventory
            this.inventoryManager.setItems(saveData.inventory || [])

            // Restore scene states
            if (saveData.sceneStates) {
                this.sceneManager.setSceneStates(saveData.sceneStates)
            }

            // Restore custom state
            if (saveData.customState) {
                this.stateManager.setState('customState', saveData.customState)
            }

            // Change to saved scene
            await this.sceneManager.changeScene(saveData.currentScene || 'splash')

            // Update UI with restored score
            this.uiManager.updateScore(this.score)
            console.log('📊 UI updated with restored score:', this.score)

            console.log('✅ Game state restored successfully')

        } catch (error) {
            console.error('❌ Failed to restore game state:', error)
            throw error
        }
    }

    /**
     * Cleanup and destroy the game
     */
    destroy() {
        this.audioManager?.destroy()
        this.uiManager?.destroy()
        this.sceneManager?.destroy()
        this.saveManager?.destroy()
        this.inventoryManager?.destroy()
        this.stateManager?.destroy()
        
        this.removeAllListeners()
        
        console.log('🗑️ Game destroyed')
    }
}
