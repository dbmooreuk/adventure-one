/**
 * Scene Manager Class
 * Handles scene transitions, scene state, and scene-related logic
 */

import { EventEmitter } from './EventEmitter.js'

export class SceneManager extends EventEmitter {
    constructor(game) {
        super()
        this.game = game
        this.currentScene = null
        this.currentSceneIndex = 0
        this.scenes = []
        this.sceneStates = new Map()
        this.stagesIntroStatus = false
    }

    /**
     * Initialize the scene manager
     */
    async initialize() {
        console.log('🎬 Initializing Scene Manager...')
        
        // Load scenes from game data
        this.scenes = this.game.gameData.scenes || []
        
        // Initialize scene states
        this.initializeSceneStates()
        
        console.log(`✅ Scene Manager initialized with ${this.scenes.length} scenes`)
    }

    /**
     * Initialize scene states for all scenes
     */
    initializeSceneStates() {
        this.scenes.forEach(scene => {
            if (!this.sceneStates.has(scene.sceneName)) {
                this.sceneStates.set(scene.sceneName, {
                    visited: false,
                    items: [...(scene.items || [])], // Clone items array
                    customState: {}
                })
            }
        })
    }

    /**
     * Change to a new scene
     * @param {string} sceneName - Name of the scene to change to
     */
    async changeScene(sceneName) {
        try {
            const scene = this.findScene(sceneName)
            if (!scene) {
                throw new Error(`Scene not found: ${sceneName}`)
            }

            console.log(`🎬 Changing scene to: ${sceneName}`)

            // Update current scene info
            this.currentScene = scene
            this.currentSceneIndex = this.scenes.findIndex(s => s.sceneName === sceneName)

            // Mark scene as visited
            const sceneState = this.getSceneState(sceneName)
            sceneState.visited = true

            // Update game state
            this.game.stateManager.setState('currentScene', sceneName)
            this.game.stateManager.setState('currentSceneIndex', this.currentSceneIndex)

            // Handle stage intro
            this.handleStageIntro(scene)

            // Emit scene change event
            this.emit('sceneChanged', scene)

            console.log(`✅ Scene changed to: ${sceneName}`)

        } catch (error) {
            console.error(`❌ Failed to change scene to ${sceneName}:`, error)
            throw error
        }
    }

    /**
     * Navigate to the next scene
     */
    async nextScene() {
        if (this.currentSceneIndex < this.scenes.length - 1) {
            const nextScene = this.scenes[this.currentSceneIndex + 1]
            await this.changeScene(nextScene.sceneName)
        } else {
            console.log('📍 Already at the last scene')
        }
    }

    /**
     * Navigate to the previous scene
     */
    async previousScene() {
        if (this.currentSceneIndex > 0) {
            const prevScene = this.scenes[this.currentSceneIndex - 1]
            await this.changeScene(prevScene.sceneName)
        } else {
            console.log('📍 Already at the first scene')
        }
    }

    /**
     * Find a scene by name
     * @param {string} sceneName - Scene name to find
     * @returns {Object|null} Scene object or null if not found
     */
    findScene(sceneName) {
        return this.scenes.find(scene => scene.sceneName === sceneName) || null
    }

    /**
     * Get scene state
     * @param {string} sceneName - Scene name
     * @returns {Object} Scene state object
     */
    getSceneState(sceneName) {
        if (!this.sceneStates.has(sceneName)) {
            this.sceneStates.set(sceneName, {
                visited: false,
                items: [],
                customState: {}
            })
        }
        return this.sceneStates.get(sceneName)
    }

    /**
     * Update scene state
     * @param {string} sceneName - Scene name
     * @param {Object} updates - State updates
     */
    updateSceneState(sceneName, updates) {
        const state = this.getSceneState(sceneName)
        Object.assign(state, updates)
        this.emit('sceneStateChanged', { sceneName, state })
    }

    /**
     * Get all scene states
     * @returns {Object} All scene states
     */
    getSceneStates() {
        const result = {}
        for (const [sceneName, state] of this.sceneStates) {
            result[sceneName] = { ...state }
        }
        return result
    }

    /**
     * Set all scene states (used for loading saves)
     * @param {Object} states - Scene states object
     */
    setSceneStates(states) {
        this.sceneStates.clear()
        for (const [sceneName, state] of Object.entries(states)) {
            this.sceneStates.set(sceneName, { ...state })
        }
    }

    /**
     * Remove an item from the current scene
     * @param {string} itemName - Item name to remove
     */
    removeItemFromScene(itemName) {
        if (!this.currentScene) return

        const sceneState = this.getSceneState(this.currentScene.sceneName)
        const itemIndex = sceneState.items.indexOf(itemName)
        
        if (itemIndex !== -1) {
            sceneState.items.splice(itemIndex, 1)
            this.emit('sceneItemRemoved', { sceneName: this.currentScene.sceneName, itemName })
        }
    }

    /**
     * Add an item to the current scene
     * @param {string} itemName - Item name to add
     */
    addItemToScene(itemName) {
        if (!this.currentScene) return

        const sceneState = this.getSceneState(this.currentScene.sceneName)
        
        if (!sceneState.items.includes(itemName)) {
            sceneState.items.push(itemName)
            this.emit('sceneItemAdded', { sceneName: this.currentScene.sceneName, itemName })
        }
    }

    /**
     * Check if current scene has an item
     * @param {string} itemName - Item name to check
     * @returns {boolean} True if scene has the item
     */
    sceneHasItem(itemName) {
        if (!this.currentScene) return false

        const sceneState = this.getSceneState(this.currentScene.sceneName)
        return sceneState.items.includes(itemName)
    }

    /**
     * Handle stage introduction logic
     * @param {Object} scene - Scene object
     */
    handleStageIntro(scene) {
        const currentStage = scene.stageNumber
        const lastStage = this.game.stateManager.getState('lastStage', 0)

        if (currentStage > lastStage && !this.stagesIntroStatus) {
            this.stagesIntroStatus = true
            this.game.stateManager.setState('lastStage', currentStage)
            this.emit('stageIntro', scene)
        } else {
            this.stagesIntroStatus = false
        }
    }

    /**
     * Get current scene items that are still available
     * @returns {string[]} Array of available item names
     */
    getCurrentSceneItems() {
        if (!this.currentScene) return []

        const sceneState = this.getSceneState(this.currentScene.sceneName)
        return [...sceneState.items] // Return a copy
    }

    /**
     * Check if we can navigate to next scene
     * @returns {boolean} True if next scene is available
     */
    canGoNext() {
        return this.currentSceneIndex < this.scenes.length - 1
    }

    /**
     * Check if we can navigate to previous scene
     * @returns {boolean} True if previous scene is available
     */
    canGoBack() {
        return this.currentSceneIndex > 0
    }

    /**
     * Get scene progress information
     * @returns {Object} Progress information
     */
    getProgress() {
        const visitedScenes = Array.from(this.sceneStates.values())
            .filter(state => state.visited).length
        
        return {
            currentSceneIndex: this.currentSceneIndex,
            totalScenes: this.scenes.length,
            visitedScenes,
            progressPercentage: Math.round((visitedScenes / this.scenes.length) * 100)
        }
    }

    /**
     * Destroy the scene manager
     */
    destroy() {
        this.currentScene = null
        this.scenes = []
        this.sceneStates.clear()
        this.removeAllListeners()
    }
}
