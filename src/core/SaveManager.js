/**
 * Save Manager Class
 * Handles game save/load operations and persistent storage
 */

import { EventEmitter } from './EventEmitter.js'
import { storage, gameplay } from '../config/gameConfig.js'

export class SaveManager extends EventEmitter {
    constructor(game) {
        super()
        this.game = game
        this.saveKey = storage.saveGameKey
        this.settingsKey = storage.settingsKey
        this.autoSaveInterval = null
        this.autoSaveDelay = gameplay.autoSaveDelay
    }

    /**
     * Initialize the save manager
     */
    async initialize() {
        console.log('💾 Initializing Save Manager...')
        
        // Check if localStorage is available
        this.checkStorageAvailability()
        
        // Set up auto-save
        this.setupAutoSave()
        
        console.log('✅ Save Manager initialized')
    }

    /**
     * Check if localStorage is available
     */
    checkStorageAvailability() {
        try {
            const test = '__storage_test__'
            localStorage.setItem(test, test)
            localStorage.removeItem(test)
            this.storageAvailable = true
        } catch (error) {
            console.warn('💾 localStorage not available:', error)
            this.storageAvailable = false
        }
    }

    /**
     * Set up auto-save functionality
     */
    setupAutoSave() {
        // Auto-save periodically during gameplay
        this.autoSaveInterval = setInterval(() => {
            const currentScene = this.game.stateManager?.getState('currentScene')
            if (currentScene && currentScene !== 'splash') {
                this.autoSave()
            }
        }, this.autoSaveDelay)
    }

    /**
     * Save the current game state
     * @param {string} [slot='main'] - Save slot name
     * @param {boolean} [isAutoSave=false] - Whether this is an auto-save
     * @returns {Promise<boolean>} Success status
     */
    async saveGame(slot = 'main', isAutoSave = false) {
        if (!this.storageAvailable) {
            console.warn('💾 Cannot save: localStorage not available')
            this.emit('saveError', 'Storage not available')
            return false
        }

        try {
            console.log('💾 Saving game to slot:', slot)

            // Get current game state
            const gameState = this.game.getGameState()

            // Add save metadata
            const saveData = {
                version: '1.0.0',
                slot,
                timestamp: Date.now(),
                gameState
            }

            // Save to localStorage
            const saveKey = slot === 'main' ? this.saveKey : `${this.saveKey}_${slot}`
            localStorage.setItem(saveKey, JSON.stringify(saveData))

            // Update save list
            this.updateSaveList(slot, saveData)

            console.log(`✅ Game saved to slot: ${slot}`)
            this.emit('gameSaved', { slot, timestamp: saveData.timestamp, isAutoSave })

            return true

        } catch (error) {
            console.error('💾 Failed to save game:', error)
            this.emit('saveError', error.message)
            return false
        }
    }

    /**
     * Load a saved game
     * @param {string} [slot='main'] - Save slot name
     * @returns {Promise<boolean>} Success status
     */
    async loadGame(slot = 'main') {
        if (!this.storageAvailable) {
            console.warn('💾 Cannot load: localStorage not available')
            this.emit('loadError', 'Storage not available')
            return false
        }

        try {
            console.log(`💾 Loading game from slot: ${slot}`)
            
            // Get save data
            const saveKey = slot === 'main' ? this.saveKey : `${this.saveKey}_${slot}`
            const savedData = localStorage.getItem(saveKey)
            
            if (!savedData) {
                console.warn(`💾 No save data found for slot: ${slot}`)
                this.emit('loadError', 'No save data found')
                return false
            }
            
            const saveData = JSON.parse(savedData)
            
            // Validate save data
            if (!this.validateSaveData(saveData)) {
                console.error('💾 Invalid save data')
                this.emit('loadError', 'Invalid save data')
                return false
            }
            
            // Restore game state
            await this.game.restoreGameState(saveData.gameState)
            
            console.log(`✅ Game loaded from slot: ${slot}`)
            this.emit('gameLoaded', { slot, timestamp: saveData.timestamp })
            
            return true
            
        } catch (error) {
            console.error('💾 Failed to load game:', error)
            this.emit('loadError', error.message)
            return false
        }
    }

    /**
     * Auto-save the game
     */
    autoSave() {
        this.saveGame('main', true).then(success => {
            if (success) {
                console.log('💾 Auto-save completed')
                this.emit('autoSaved')
            }
        })
    }

    /**
     * Check if a saved game exists
     * @param {string} [slot='main'] - Save slot name
     * @returns {boolean} True if save exists
     */
    hasSavedGame(slot = 'main') {
        if (!this.storageAvailable) return false
        
        const saveKey = slot === 'main' ? this.saveKey : `${this.saveKey}_${slot}`
        return localStorage.getItem(saveKey) !== null
    }

    /**
     * Get save data information without loading
     * @param {string} [slot='main'] - Save slot name
     * @returns {Object|null} Save info or null if not found
     */
    getSaveInfo(slot = 'main') {
        if (!this.storageAvailable) return null
        
        try {
            const saveKey = slot === 'main' ? this.saveKey : `${this.saveKey}_${slot}`
            const savedData = localStorage.getItem(saveKey)
            
            if (!savedData) return null
            
            const saveData = JSON.parse(savedData)
            
            return {
                slot,
                timestamp: saveData.timestamp,
                version: saveData.version,
                scene: saveData.gameState?.currentScene,
                score: saveData.gameState?.score || 0,
                playTime: this.calculatePlayTime(saveData.gameState?.timestamp)
            }
            
        } catch (error) {
            console.error(`💾 Failed to get save info for slot ${slot}:`, error)
            return null
        }
    }

    /**
     * Get all available saves
     * @returns {Object[]} Array of save information
     */
    getAllSaves() {
        if (!this.storageAvailable) return []

        const saves = []
        // Only 'main' slot is used now (auto-save and manual save use the same slot)
        const slots = ['main']

        slots.forEach(slot => {
            const saveInfo = this.getSaveInfo(slot)
            if (saveInfo) {
                saves.push(saveInfo)
            }
        })

        return saves.sort((a, b) => b.timestamp - a.timestamp)
    }

    /**
     * Delete a saved game
     * @param {string} [slot='main'] - Save slot name
     * @returns {boolean} Success status
     */
    deleteSave(slot = 'main') {
        if (!this.storageAvailable) return false
        
        try {
            const saveKey = slot === 'main' ? this.saveKey : `${this.saveKey}_${slot}`
            localStorage.removeItem(saveKey)
            
            // Update save list
            this.removeSaveFromList(slot)
            
            console.log(`💾 Deleted save slot: ${slot}`)
            this.emit('saveDeleted', slot)
            
            return true
            
        } catch (error) {
            console.error(`💾 Failed to delete save slot ${slot}:`, error)
            return false
        }
    }

    /**
     * Clear all save data
     * @returns {boolean} Success status
     */
    clearSave() {
        if (!this.storageAvailable) return false

        try {
            // Remove main save slot (auto-save and manual save use the same slot)
            localStorage.removeItem(this.saveKey)

            // Also clear any legacy 'auto' slot if it exists
            localStorage.removeItem(`${this.saveKey}_auto`)

            // Clear save list
            localStorage.removeItem(`${this.saveKey}_list`)

            console.log('💾 All save data cleared')
            this.emit('allSavesCleared')

            return true

        } catch (error) {
            console.error('💾 Failed to clear save data:', error)
            return false
        }
    }

    /**
     * Save game settings
     * @param {Object} settings - Settings object
     */
    saveSettings(settings) {
        if (!this.storageAvailable) return
        
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings))
            this.emit('settingsSaved', settings)
        } catch (error) {
            console.error('💾 Failed to save settings:', error)
        }
    }

    /**
     * Load game settings
     * @returns {Object|null} Settings object or null if not found
     */
    loadSettings() {
        if (!this.storageAvailable) return null
        
        try {
            const settings = localStorage.getItem(this.settingsKey)
            return settings ? JSON.parse(settings) : null
        } catch (error) {
            console.error('💾 Failed to load settings:', error)
            return null
        }
    }

    /**
     * Validate save data structure
     * @param {Object} saveData - Save data to validate
     * @returns {boolean} True if valid
     */
    validateSaveData(saveData) {
        if (!saveData || typeof saveData !== 'object') return false
        
        // Check required fields
        const required = ['version', 'timestamp', 'gameState']
        for (const field of required) {
            if (!(field in saveData)) return false
        }
        
        // Check game state structure
        const gameState = saveData.gameState
        if (!gameState || typeof gameState !== 'object') return false
        
        // Check for required game state fields
        const requiredGameState = ['currentScene', 'score', 'inventory']
        for (const field of requiredGameState) {
            if (!(field in gameState)) return false
        }
        
        return true
    }

    /**
     * Update the save list
     * @param {string} slot - Save slot name
     * @param {Object} saveData - Save data
     */
    updateSaveList(slot, saveData) {
        try {
            const listKey = `${this.saveKey}_list`
            const existingList = localStorage.getItem(listKey)
            const saveList = existingList ? JSON.parse(existingList) : {}
            
            saveList[slot] = {
                timestamp: saveData.timestamp,
                scene: saveData.gameState.currentScene,
                score: saveData.gameState.score
            }
            
            localStorage.setItem(listKey, JSON.stringify(saveList))
        } catch (error) {
            console.error('💾 Failed to update save list:', error)
        }
    }

    /**
     * Remove save from list
     * @param {string} slot - Save slot name
     */
    removeSaveFromList(slot) {
        try {
            const listKey = `${this.saveKey}_list`
            const existingList = localStorage.getItem(listKey)
            
            if (existingList) {
                const saveList = JSON.parse(existingList)
                delete saveList[slot]
                localStorage.setItem(listKey, JSON.stringify(saveList))
            }
        } catch (error) {
            console.error('💾 Failed to remove save from list:', error)
        }
    }

    /**
     * Calculate play time from timestamp
     * @param {number} startTime - Start timestamp
     * @returns {string} Formatted play time
     */
    calculatePlayTime(startTime) {
        if (!startTime) return 'Unknown'
        
        const elapsed = Date.now() - startTime
        const hours = Math.floor(elapsed / (1000 * 60 * 60))
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60))
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`
        } else {
            return `${minutes}m`
        }
    }

    /**
     * Export save data as JSON
     * @param {string} [slot='main'] - Save slot name
     * @returns {string|null} JSON string or null if failed
     */
    exportSave(slot = 'main') {
        if (!this.storageAvailable) return null
        
        try {
            const saveKey = slot === 'main' ? this.saveKey : `${this.saveKey}_${slot}`
            const saveData = localStorage.getItem(saveKey)
            
            if (!saveData) return null
            
            // Add export metadata
            const exportData = {
                ...JSON.parse(saveData),
                exportedAt: Date.now(),
                exportVersion: '1.0.0'
            }
            
            return JSON.stringify(exportData, null, 2)
            
        } catch (error) {
            console.error('💾 Failed to export save:', error)
            return null
        }
    }

    /**
     * Import save data from JSON
     * @param {string} jsonData - JSON save data
     * @param {string} [slot='main'] - Save slot name
     * @returns {boolean} Success status
     */
    importSave(jsonData, slot = 'main') {
        if (!this.storageAvailable) return false
        
        try {
            const saveData = JSON.parse(jsonData)
            
            // Validate imported data
            if (!this.validateSaveData(saveData)) {
                console.error('💾 Invalid imported save data')
                return false
            }
            
            // Save imported data
            const saveKey = slot === 'main' ? this.saveKey : `${this.saveKey}_${slot}`
            localStorage.setItem(saveKey, JSON.stringify(saveData))
            
            // Update save list
            this.updateSaveList(slot, saveData)
            
            console.log(`💾 Save imported to slot: ${slot}`)
            this.emit('saveImported', slot)
            
            return true
            
        } catch (error) {
            console.error('💾 Failed to import save:', error)
            return false
        }
    }

    /**
     * Destroy the save manager
     */
    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval)
            this.autoSaveInterval = null
        }
        
        this.removeAllListeners()
    }
}
