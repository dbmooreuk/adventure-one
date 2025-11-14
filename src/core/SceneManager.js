/**
 * Scene Manager Class
 * Handles scene transitions, scene state, and scene-related logic
 */

import { EventEmitter } from './EventEmitter.js'
import { SceneObject } from './SceneObject.js'

export class SceneManager extends EventEmitter {
    constructor(game) {
        super()
        this.game = game
        this.currentScene = null
        this.currentSceneIndex = 0
        this.scenes = []
        this.sceneStates = new Map()
        this.stagesIntroStatus = false
        this.sceneObjects = new Map() // Track SceneObject instances
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
                    customState: {},
                    locked: scene.locked || false, // Track if scene is locked
                    unlockedBy: scene.unlockedBy || null // What unlocks this scene
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
            const isFirstVisit = !sceneState.visited
            sceneState.visited = true

            // Update game state
            this.game.stateManager.setState('currentScene', sceneName)
            this.game.stateManager.setState('currentSceneIndex', this.currentSceneIndex)

            // Handle stage intro
            console.log(`🎭 About to handle stage intro for scene:`, scene.sceneName)
            this.handleStageIntro(scene)
            console.log(`🎭 Stage intro handled`)

            // Emit scene change event
            console.log(`🎭 SceneManager emitting 'sceneChanged' event for:`, scene)
            this.emit('sceneChanged', scene)
            console.log(`🎭 Event emitted successfully`)

            // Add achievement for regular scenes after 4 seconds (only on first visit)
            if (scene.sceneType === 'scene' && scene.achievement && isFirstVisit) {
                setTimeout(() => {
                    const achievementId = `scene_${scene.sceneName}_entered`
                    this.game.achievementManager?.addAchievement(
                        achievementId,
                        scene.achievement,
                        0, // Scenes don't award points, just journal entry
                        'scene'
                    )
                }, 4000)
            }

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
            const nextSceneState = this.getSceneState(nextScene.sceneName)

            // Check if next scene is locked
            if (nextSceneState.locked) {
                this.game.uiManager?.showMessage("You can't go there yet. Something is blocking the way.")
                return
            }

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
                customState: {},
                locked: false,
                unlockedBy: null
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
        console.log('🎬 addItemToScene called with:', itemName)
        if (!this.currentScene) {
            console.log('🎬 No current scene!')
            return
        }

        const sceneState = this.getSceneState(this.currentScene.sceneName)
        console.log('🎬 Current scene state items:', sceneState.items)

        if (!sceneState.items.includes(itemName)) {
            sceneState.items.push(itemName)
            console.log('🎬 Item added! New items:', sceneState.items)
            this.emit('sceneItemAdded', { sceneName: this.currentScene.sceneName, itemName })
        } else {
            console.log('🎬 Item already in scene')
        }
    }

    /**
     * Unlock a scene (allows navigation to it)
     * @param {string} sceneName - Scene name to unlock
     */
    unlockScene(sceneName) {
        const sceneState = this.getSceneState(sceneName)
        if (sceneState.locked) {
            sceneState.locked = false
            console.log(`🔓 Scene unlocked: ${sceneName}`)
            this.emit('sceneUnlocked', sceneName)
            this.game.uiManager?.showMessage("That works!")
        }
    }

    /**
     * Lock a scene (prevents navigation to it)
     * @param {string} sceneName - Scene name to lock
     */
    lockScene(sceneName) {
        const sceneState = this.getSceneState(sceneName)
        sceneState.locked = true
        console.log(`🔒 Scene locked: ${sceneName}`)
        this.emit('sceneLocked', sceneName)
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
     * @returns {boolean} True if next scene is available and unlocked
     */
    canGoNext() {
        if (this.currentSceneIndex >= this.scenes.length - 1) {
            return false
        }

        const nextScene = this.scenes[this.currentSceneIndex + 1]
        const nextSceneState = this.getSceneState(nextScene.sceneName)

        // Can go next if scene is not locked
        return !nextSceneState.locked
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
     * Reset all scene states to initial values
     */
    reset() {
        console.log('🔄 Resetting all scene states...')

        // Clear existing states
        this.sceneStates.clear()

        // Reinitialize all scene states from original game data
        this.initializeSceneStates()

        // Reset current scene
        this.currentScene = null
        this.currentSceneIndex = 0
        this.stagesIntroStatus = false

        console.log('✅ Scene states reset to initial values')
    }

    /**
     * Create SceneObject instances for items with animation config
     * This is called when a scene loads to create animated objects
     * @param {HTMLElement} sceneContainer - The scene container element
     */
    createSceneObjects(sceneContainer) {
        if (!this.currentScene || !sceneContainer) return

        // Clean up any existing scene objects first
        this.destroySceneObjects()

        const sceneItems = this.getCurrentSceneItems()
        const gameData = this.game.gameData

        sceneItems.forEach(itemName => {
            const itemData = gameData.sceneItems?.find(item => item.name === itemName)

            // Only create SceneObject if item has animation config
            if (itemData && itemData.animation) {
                const sceneObject = new SceneObject(itemData, sceneContainer, this.game)
                sceneObject.init()
                this.sceneObjects.set(itemName, sceneObject)

                console.log(`🎨 Created animated SceneObject: ${itemName}`)
            }
        })
    }

    /**
     * Destroy all SceneObject instances
     * Called when changing scenes or cleaning up
     */
    destroySceneObjects() {
        this.sceneObjects.forEach((sceneObject, itemName) => {
            sceneObject.destroy()
            console.log(`🗑️ Destroyed SceneObject: ${itemName}`)
        })
        this.sceneObjects.clear()
    }

    /**
     * Get a specific SceneObject by item name
     * @param {string} itemName - Name of the item
     * @returns {SceneObject|null} The SceneObject instance or null
     */
    getSceneObject(itemName) {
        return this.sceneObjects.get(itemName) || null
    }

    /**
     * Remove a specific SceneObject
     * @param {string} itemName - Name of the item to remove
     */
    removeSceneObject(itemName) {
        const sceneObject = this.sceneObjects.get(itemName)
        if (sceneObject) {
            sceneObject.destroy()
            this.sceneObjects.delete(itemName)
            console.log(`🗑️ Removed SceneObject: ${itemName}`)
        }
    }

    /**
     * Destroy the scene manager
     */
    destroy() {
        // Clean up all scene objects
        this.destroySceneObjects()

        this.currentScene = null
        this.scenes = []
        this.sceneStates.clear()
        this.removeAllListeners()
    }
}
