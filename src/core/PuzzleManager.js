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
        this.puzzleOverlay = null
        this.currentSceneData = null
        this.parentScene = null // Store the scene that opened the puzzle
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
     * Load and initialize a puzzle as an overlay
     * @param {Object} sceneData - Scene data containing puzzle configuration
     * @param {string} parentSceneName - Name of the scene that opened the puzzle
     */
    async loadPuzzle(sceneData, parentSceneName = null) {
        try {
            console.log('🧩 Loading puzzle:', sceneData.puzzleModule)

            this.currentSceneData = sceneData
            this.parentScene = parentSceneName || this.game.sceneManager?.currentScene?.sceneName

            // Create puzzle overlay and container
            this.createPuzzleContainer(sceneData)

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
            this.game.uiManager?.showMessage("Failed to load puzzle.")
            this.handlePuzzleCancel()
        }
    }

    /**
     * Create the puzzle overlay and container element
     * @param {Object} sceneData - Scene data with puzzle configuration
     */
    createPuzzleContainer(sceneData) {
        const sceneContainer = this.game.uiManager?.elements?.sceneContainer
        if (!sceneContainer) {
            console.error('❌ Scene container not found!')
            return
        }

        // Create overlay backdrop if it doesn't exist
        if (!this.puzzleOverlay) {
            this.puzzleOverlay = document.createElement('div')
            this.puzzleOverlay.className = 'puzzle-overlay'
            this.puzzleOverlay.id = 'puzzle-overlay'
            sceneContainer.appendChild(this.puzzleOverlay)
        }

        // Create puzzle container if it doesn't exist
        if (!this.puzzleContainer) {
            this.puzzleContainer = document.createElement('div')
            this.puzzleContainer.className = 'puzzle-container'
            this.puzzleContainer.id = 'puzzle-container'
            this.puzzleOverlay.appendChild(this.puzzleContainer)

            // Create common Leave button
            this.leaveButton = document.createElement('button')
            this.leaveButton.className = 'puzzle-leave-btn'
            this.leaveButton.innerHTML = 'Leave'
            this.leaveButton.addEventListener('click', () => this.handlePuzzleCancel())
            this.puzzleOverlay.appendChild(this.leaveButton)
        }

        // Apply custom size and position from scene data
        const width = sceneData.puzzleWidth || 824
        const height = sceneData.puzzleHeight || 554
        const top = sceneData.puzzleTop !== undefined ? `${sceneData.puzzleTop}px` : 'auto'
        const left = sceneData.puzzleLeft !== undefined ? `${sceneData.puzzleLeft}px` : 'auto'
        const right = sceneData.puzzleRight !== undefined ? `${sceneData.puzzleRight}px` : 'auto'
        const bottom = sceneData.puzzleBottom !== undefined ? `${sceneData.puzzleBottom}px` : 'auto'

        this.puzzleContainer.style.width = `${width}px`
        this.puzzleContainer.style.height = `${height}px`
        this.puzzleContainer.style.top = top
        this.puzzleContainer.style.left = left
        this.puzzleContainer.style.right = right
        this.puzzleContainer.style.bottom = bottom

        // Show the overlay and container
        this.puzzleOverlay.style.display = 'flex'
        this.puzzleContainer.style.display = 'flex'

        // Trigger fade-in animation after a brief delay (for CSS transition)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.puzzleOverlay.classList.add('active')
                this.puzzleContainer.classList.add('active')
                if (this.leaveButton) {
                    this.leaveButton.classList.add('active')
                }
            })
        })
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

        // Close puzzle overlay after a delay (stay on parent scene)
        setTimeout(() => {
            this.unloadPuzzle()
        }, 1500)
    }

    /**
     * Handle puzzle cancellation
     */
    handlePuzzleCancel() {
        console.log('🚫 Puzzle cancelled')

        // Just close the overlay (stay on parent scene)
        this.unloadPuzzle()

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

        // Trigger fade-out animation
        if (this.puzzleOverlay) {
            this.puzzleOverlay.classList.remove('active')
        }
        if (this.puzzleContainer) {
            this.puzzleContainer.classList.remove('active')
        }
        if (this.leaveButton) {
            this.leaveButton.classList.remove('active')
        }

        // Wait for fade-out animation to complete before cleanup
        setTimeout(() => {
            // Destroy puzzle instance
            if (this.currentPuzzle) {
                if (typeof this.currentPuzzle.destroy === 'function') {
                    this.currentPuzzle.destroy()
                }
                this.currentPuzzle = null
            }

            // Hide puzzle overlay and clear container
            if (this.puzzleOverlay) {
                this.puzzleOverlay.style.display = 'none'
            }

            if (this.puzzleContainer) {
                this.puzzleContainer.innerHTML = ''
            }

            this.currentSceneData = null
            this.parentScene = null

            console.log('✅ Puzzle unloaded')
            this.emit('puzzleUnloaded')
        }, 300) // Match CSS transition duration
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

        if (this.puzzleOverlay) {
            this.puzzleOverlay.remove()
            this.puzzleOverlay = null
        }
    }
}

