/**
 * Puzzle Manager Class
 * Handles loading, initialization, and lifecycle of puzzle mini-games
 */

import { EventEmitter } from './EventEmitter.js'

export class PuzzleManager extends EventEmitter {
    constructor(game) {
        super()
        this.game = game
        this.currentPuzzle = null
        this.puzzleContainer = null
        this.currentSceneData = null
    }

    /**
     * Initialize the puzzle manager
     */
    async initialize() {
        console.log('🧩 Initializing Puzzle Manager...')
        console.log('✅ Puzzle Manager initialized')
    }

    /**
     * Check if current scene is a puzzle scene
     * @param {Object} sceneData - Scene data
     * @returns {boolean} True if scene is a puzzle
     */
    isPuzzleScene(sceneData) {
        return sceneData?.sceneType === 'puzzle' && sceneData?.puzzleModule
    }

    /**
     * Load and initialize a puzzle
     * @param {Object} sceneData - Scene data containing puzzle configuration
     */
    async loadPuzzle(sceneData) {
        try {
            console.log('🧩 Loading puzzle:', sceneData.puzzleModule)
            
            this.currentSceneData = sceneData

            // Create puzzle container if it doesn't exist
            this.createPuzzleContainer()

            // Dynamically import the puzzle module
            const moduleName = sceneData.puzzleModule
            const module = await import(`../puzzles/${moduleName}.js`)
            const PuzzleClass = module[moduleName]

            if (!PuzzleClass) {
                throw new Error(`Puzzle class ${moduleName} not found in module`)
            }

            // Create puzzle instance with callbacks
            this.currentPuzzle = new PuzzleClass(
                this.puzzleContainer,
                sceneData.puzzleConfig || {},
                {
                    onComplete: (result) => this.handlePuzzleComplete(result),
                    onCancel: () => this.handlePuzzleCancel(),
                    onStateChange: (state) => this.handlePuzzleStateChange(state)
                },
                this.game
            )

            // Initialize the puzzle
            await this.currentPuzzle.init()

            // Load saved progress if exists
            this.loadPuzzleProgress()

            console.log('✅ Puzzle loaded successfully:', moduleName)
            this.emit('puzzleLoaded', { puzzle: moduleName, sceneData })

        } catch (error) {
            console.error('❌ Failed to load puzzle:', error)
            this.game.uiManager?.showMessage("Failed to load puzzle. Returning to previous scene.")
            this.handlePuzzleCancel()
        }
    }

    /**
     * Create the puzzle container element
     */
    createPuzzleContainer() {
        if (!this.puzzleContainer) {
            this.puzzleContainer = document.createElement('div')
            this.puzzleContainer.className = 'puzzle-container'
            this.puzzleContainer.id = 'puzzle-container'
            
            const sceneContainer = this.game.uiManager?.elements?.sceneContainer
            if (sceneContainer) {
                sceneContainer.appendChild(this.puzzleContainer)
            } else {
                console.error('❌ Scene container not found!')
            }
        }

        // Show the container
        this.puzzleContainer.style.display = 'flex'
    }

    /**
     * Handle puzzle completion
     * @param {Object} result - Puzzle completion result
     */
    handlePuzzleComplete(result) {
        console.log('🎉 Puzzle completed!', result)

        const config = this.currentSceneData?.puzzleConfig || {}

        // Award points
        const points = config.points || 50
        const achievementId = `puzzle_${this.currentSceneData.sceneName}_completed`
        this.game.addScore(points, achievementId)

        // Give reward item if specified
        if (result.reward || config.reward) {
            const rewardItem = result.reward || config.reward
            this.game.inventoryManager?.addItem(rewardItem)
            this.game.uiManager?.showMessage(`You obtained: ${rewardItem}!`)
        }

        // Play success sound
        this.game.audioManager?.playSound('success')

        // Mark puzzle as completed in scene state
        const sceneState = this.game.sceneManager?.getSceneState(this.currentSceneData.sceneName)
        if (sceneState) {
            sceneState.customState.puzzleCompleted = true
            sceneState.customState.completedAt = Date.now()
        }

        // Unlock next scene if specified
        if (config.unlockScene) {
            this.game.sceneManager?.unlockScene(config.unlockScene)
        }

        // Emit completion event
        this.emit('puzzleCompleted', { result, sceneData: this.currentSceneData })

        // Return to previous scene after a delay
        setTimeout(() => {
            this.unloadPuzzle()
            const returnScene = config.returnScene || this.game.sceneManager?.scenes[this.game.sceneManager.currentSceneIndex - 1]?.sceneName
            if (returnScene) {
                this.game.sceneManager?.changeScene(returnScene)
            }
        }, 1500)
    }

    /**
     * Handle puzzle cancellation
     */
    handlePuzzleCancel() {
        console.log('🚫 Puzzle cancelled')

        const config = this.currentSceneData?.puzzleConfig || {}
        
        this.unloadPuzzle()

        // Return to previous scene
        const returnScene = config.returnScene || this.game.sceneManager?.scenes[this.game.sceneManager.currentSceneIndex - 1]?.sceneName
        if (returnScene) {
            this.game.sceneManager?.changeScene(returnScene)
        }

        this.emit('puzzleCancelled', { sceneData: this.currentSceneData })
    }

    /**
     * Handle puzzle state changes (for auto-save)
     * @param {Object} state - Current puzzle state
     */
    handlePuzzleStateChange(state) {
        // Save puzzle progress to scene state
        const sceneState = this.game.sceneManager?.getSceneState(this.currentSceneData.sceneName)
        if (sceneState) {
            sceneState.customState.puzzleProgress = state
        }
    }

    /**
     * Load saved puzzle progress
     */
    loadPuzzleProgress() {
        const sceneState = this.game.sceneManager?.getSceneState(this.currentSceneData.sceneName)
        if (sceneState?.customState?.puzzleProgress && this.currentPuzzle?.loadProgress) {
            console.log('📂 Loading saved puzzle progress...')
            this.currentPuzzle.loadProgress(sceneState.customState.puzzleProgress)
        }
    }

    /**
     * Unload current puzzle and clean up
     */
    unloadPuzzle() {
        console.log('🧹 Unloading puzzle...')

        // Destroy puzzle instance
        if (this.currentPuzzle) {
            if (typeof this.currentPuzzle.destroy === 'function') {
                this.currentPuzzle.destroy()
            }
            this.currentPuzzle = null
        }

        // Hide/remove puzzle container
        if (this.puzzleContainer) {
            this.puzzleContainer.style.display = 'none'
            this.puzzleContainer.innerHTML = ''
        }

        this.currentSceneData = null

        console.log('✅ Puzzle unloaded')
        this.emit('puzzleUnloaded')
    }

    /**
     * Check if a puzzle is currently active
     * @returns {boolean} True if puzzle is active
     */
    isPuzzleActive() {
        return this.currentPuzzle !== null
    }

    /**
     * Get current puzzle instance
     * @returns {Object|null} Current puzzle or null
     */
    getCurrentPuzzle() {
        return this.currentPuzzle
    }

    /**
     * Destroy the puzzle manager
     */
    destroy() {
        this.unloadPuzzle()
        
        if (this.puzzleContainer) {
            this.puzzleContainer.remove()
            this.puzzleContainer = null
        }
    }
}

