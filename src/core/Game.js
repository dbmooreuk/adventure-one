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
import { gameData } from '../data/gameData.js'

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
        
        // Game state
        this.isInitialized = false
        this.isPaused = false
        this.currentScene = null
        this.score = 0
        this.stages = 13
        
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
            
            // Set up event listeners
            this.setupEventListeners()
            
            // Try to load saved game or start new game
            const hasSavedGame = await this.saveManager.hasSavedGame()
            if (hasSavedGame) {
                await this.saveManager.loadGame()
            } else {
                await this.startNewGame()
            }
            
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
        this.inventoryManager.clear()
        this.stateManager.reset()
        
        // Start with splash scene
        await this.sceneManager.changeScene('splash')
        
        this.emit('gameStarted')
    }

    /**
     * Reset the game to initial state
     */
    async resetGame() {
        console.log('🔄 Resetting game...')
        
        await this.saveManager.clearSave()
        await this.startNewGame()
        
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
     * Add points to the score
     */
    addScore(points) {
        const newScore = this.score + points
        this.emit('scoreChanged', newScore)
    }

    /**
     * Get current game state for saving
     */
    getGameState() {
        return {
            currentScene: this.currentScene?.sceneName || 'splash',
            score: this.score,
            inventory: this.inventoryManager.getItems(),
            sceneStates: this.sceneManager.getSceneStates(),
            customState: this.stateManager.getState('customState') || {},
            timestamp: Date.now()
        }
    }

    /**
     * Restore game state from save data
     */
    async restoreGameState(saveData) {
        try {
            this.score = saveData.score || 0
            
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
