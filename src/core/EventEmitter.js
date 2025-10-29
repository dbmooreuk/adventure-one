/**
 * Event Emitter Class
 * Provides event-driven communication between game systems
 */

export class EventEmitter {
    constructor() {
        this.events = new Map()
    }

    /**
     * Add an event listener
     * @param {string} event - Event name
     * @param {Function} listener - Event handler function
     * @param {Object} options - Options object
     * @param {boolean} options.once - If true, listener will be removed after first call
     */
    on(event, listener, options = {}) {
        if (typeof listener !== 'function') {
            throw new Error('Listener must be a function')
        }

        if (!this.events.has(event)) {
            this.events.set(event, [])
        }

        const listenerObj = {
            fn: listener,
            once: options.once || false
        }

        this.events.get(event).push(listenerObj)

        return this
    }

    /**
     * Add a one-time event listener
     * @param {string} event - Event name
     * @param {Function} listener - Event handler function
     */
    once(event, listener) {
        return this.on(event, listener, { once: true })
    }

    /**
     * Remove an event listener
     * @param {string} event - Event name
     * @param {Function} listener - Event handler function to remove
     */
    off(event, listener) {
        if (!this.events.has(event)) {
            return this
        }

        const listeners = this.events.get(event)
        const index = listeners.findIndex(l => l.fn === listener)
        
        if (index !== -1) {
            listeners.splice(index, 1)
        }

        // Clean up empty event arrays
        if (listeners.length === 0) {
            this.events.delete(event)
        }

        return this
    }

    /**
     * Remove all listeners for an event, or all events if no event specified
     * @param {string} [event] - Event name (optional)
     */
    removeAllListeners(event) {
        if (event) {
            this.events.delete(event)
        } else {
            this.events.clear()
        }

        return this
    }

    /**
     * Emit an event to all listeners
     * @param {string} event - Event name
     * @param {...any} args - Arguments to pass to listeners
     */
    emit(event, ...args) {
        if (!this.events.has(event)) {
            return false
        }

        const listeners = this.events.get(event).slice() // Create a copy to avoid issues with modifications during iteration
        
        for (const listenerObj of listeners) {
            try {
                listenerObj.fn.apply(this, args)
                
                // Remove one-time listeners
                if (listenerObj.once) {
                    this.off(event, listenerObj.fn)
                }
            } catch (error) {
                console.error(`Error in event listener for '${event}':`, error)
            }
        }

        return true
    }

    /**
     * Get the number of listeners for an event
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    listenerCount(event) {
        return this.events.has(event) ? this.events.get(event).length : 0
    }

    /**
     * Get all event names that have listeners
     * @returns {string[]} Array of event names
     */
    eventNames() {
        return Array.from(this.events.keys())
    }

    /**
     * Get all listeners for an event
     * @param {string} event - Event name
     * @returns {Function[]} Array of listener functions
     */
    listeners(event) {
        if (!this.events.has(event)) {
            return []
        }

        return this.events.get(event).map(l => l.fn)
    }
}
