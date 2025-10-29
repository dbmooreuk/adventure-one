/**
 * State Manager Class
 * Manages global game state with reactive updates
 */

import { EventEmitter } from './EventEmitter.js'

export class StateManager extends EventEmitter {
    constructor() {
        super()
        this.state = new Map()
        this.history = []
        this.maxHistorySize = 50
    }

    /**
     * Set a state value
     * @param {string} key - State key
     * @param {any} value - State value
     * @param {boolean} silent - If true, won't emit change event
     */
    setState(key, value, silent = false) {
        const oldValue = this.state.get(key)
        
        // Only update if value actually changed
        if (oldValue !== value) {
            // Add to history for undo functionality
            this.addToHistory(key, oldValue, value)
            
            // Update state
            this.state.set(key, value)
            
            // Emit change event
            if (!silent) {
                this.emit('stateChanged', { key, oldValue, newValue: value })
                this.emit(`${key}Changed`, value, oldValue)
            }
        }
        
        return this
    }

    /**
     * Get a state value
     * @param {string} key - State key
     * @param {any} defaultValue - Default value if key doesn't exist
     * @returns {any} State value
     */
    getState(key, defaultValue = undefined) {
        return this.state.has(key) ? this.state.get(key) : defaultValue
    }

    /**
     * Check if a state key exists
     * @param {string} key - State key
     * @returns {boolean} True if key exists
     */
    hasState(key) {
        return this.state.has(key)
    }

    /**
     * Delete a state key
     * @param {string} key - State key
     * @param {boolean} silent - If true, won't emit change event
     */
    deleteState(key, silent = false) {
        if (this.state.has(key)) {
            const oldValue = this.state.get(key)
            this.addToHistory(key, oldValue, undefined)
            
            this.state.delete(key)
            
            if (!silent) {
                this.emit('stateChanged', { key, oldValue, newValue: undefined })
                this.emit(`${key}Deleted`, oldValue)
            }
        }
        
        return this
    }

    /**
     * Update state by merging with existing object value
     * @param {string} key - State key
     * @param {Object} updates - Object with updates to merge
     * @param {boolean} silent - If true, won't emit change event
     */
    updateState(key, updates, silent = false) {
        const currentValue = this.getState(key, {})
        
        if (typeof currentValue === 'object' && currentValue !== null && !Array.isArray(currentValue)) {
            const newValue = { ...currentValue, ...updates }
            this.setState(key, newValue, silent)
        } else {
            throw new Error(`Cannot update non-object state key: ${key}`)
        }
        
        return this
    }

    /**
     * Get all state as a plain object
     * @returns {Object} All state data
     */
    getAllState() {
        const result = {}
        for (const [key, value] of this.state) {
            result[key] = value
        }
        return result
    }

    /**
     * Set multiple state values at once
     * @param {Object} stateUpdates - Object with key-value pairs to set
     * @param {boolean} silent - If true, won't emit change events
     */
    setMultipleState(stateUpdates, silent = false) {
        for (const [key, value] of Object.entries(stateUpdates)) {
            this.setState(key, value, silent)
        }
        
        if (!silent) {
            this.emit('multipleStateChanged', stateUpdates)
        }
        
        return this
    }

    /**
     * Reset all state
     * @param {boolean} silent - If true, won't emit change event
     */
    reset(silent = false) {
        const oldState = this.getAllState()
        this.state.clear()
        this.history = []
        
        if (!silent) {
            this.emit('stateReset', oldState)
        }
        
        return this
    }

    /**
     * Add state change to history
     * @private
     */
    addToHistory(key, oldValue, newValue) {
        this.history.push({
            key,
            oldValue,
            newValue,
            timestamp: Date.now()
        })
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift()
        }
    }

    /**
     * Get state change history
     * @param {number} limit - Maximum number of history entries to return
     * @returns {Array} History entries
     */
    getHistory(limit = 10) {
        return this.history.slice(-limit)
    }

    /**
     * Subscribe to state changes for a specific key
     * @param {string} key - State key to watch
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        const eventName = `${key}Changed`
        this.on(eventName, callback)
        
        // Return unsubscribe function
        return () => this.off(eventName, callback)
    }

    /**
     * Create a computed state that updates when dependencies change
     * @param {string} key - Computed state key
     * @param {string[]} dependencies - Array of state keys this computed value depends on
     * @param {Function} computeFn - Function that computes the value
     */
    createComputed(key, dependencies, computeFn) {
        const updateComputed = () => {
            const depValues = dependencies.map(dep => this.getState(dep))
            const computedValue = computeFn(...depValues)
            this.setState(key, computedValue, true) // Silent update to avoid infinite loops
        }
        
        // Update when any dependency changes
        dependencies.forEach(dep => {
            this.on(`${dep}Changed`, updateComputed)
        })
        
        // Initial computation
        updateComputed()
        
        return this
    }

    /**
     * Destroy the state manager
     */
    destroy() {
        this.state.clear()
        this.history = []
        this.removeAllListeners()
    }
}
