/**
 * Inventory Manager Class
 * Handles inventory operations, item interactions, and item combinations
 */

import { EventEmitter } from './EventEmitter.js'

export class InventoryManager extends EventEmitter {
    constructor(game) {
        super()
        this.game = game
        this.items = []
        this.maxItems = 20 // Maximum inventory size
        this.selectedItems = [] // For item combinations
    }

    /**
     * Initialize the inventory manager
     */
    async initialize() {
        console.log('🎒 Initializing Inventory Manager...')
        
        // Set up event listeners
        this.setupEventListeners()
        
        console.log('✅ Inventory Manager initialized')
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for item interactions from UI
        this.game.uiManager?.on('itemClicked', this.handleItemClick.bind(this))
    }

    /**
     * Add an item to inventory
     * @param {string} itemName - Name of the item to add
     * @returns {boolean} True if item was added successfully
     */
    addItem(itemName) {
        // Check if inventory is full
        if (this.items.length >= this.maxItems) {
            console.warn('🎒 Inventory is full!')
            this.emit('inventoryFull')
            return false
        }

        // Check if item already exists
        if (this.hasItem(itemName)) {
            console.warn(`🎒 Item already in inventory: ${itemName}`)
            return false
        }

        // Add item
        this.items.push(itemName)
        
        console.log(`🎒 Added item to inventory: ${itemName}`)
        
        // Emit events
        this.emit('itemAdded', itemName)
        this.emit('inventoryChanged', this.getItems())
        
        // Play sound effect
        this.game.audioManager?.playSound('addToInventory')
        
        return true
    }

    /**
     * Remove an item from inventory
     * @param {string} itemName - Name of the item to remove
     * @returns {boolean} True if item was removed successfully
     */
    removeItem(itemName) {
        const index = this.items.indexOf(itemName)
        
        if (index === -1) {
            console.warn(`🎒 Item not found in inventory: ${itemName}`)
            return false
        }

        // Remove item
        this.items.splice(index, 1)
        
        console.log(`🎒 Removed item from inventory: ${itemName}`)
        
        // Clear selection if this item was selected
        this.clearSelection(itemName)
        
        // Emit events
        this.emit('itemRemoved', itemName)
        this.emit('inventoryChanged', this.getItems())
        
        return true
    }

    /**
     * Check if inventory has a specific item
     * @param {string} itemName - Name of the item to check
     * @returns {boolean} True if item exists in inventory
     */
    hasItem(itemName) {
        return this.items.includes(itemName)
    }

    /**
     * Get all items in inventory
     * @returns {string[]} Array of item names
     */
    getItems() {
        return [...this.items] // Return a copy
    }

    /**
     * Set inventory items (used for loading saves)
     * @param {string[]} items - Array of item names
     */
    setItems(items) {
        this.items = [...items]
        this.selectedItems = []
        this.emit('inventoryChanged', this.getItems())
    }

    /**
     * Clear all items from inventory
     */
    clear() {
        this.items = []
        this.selectedItems = []
        this.emit('inventoryChanged', this.getItems())
        this.emit('inventoryCleared')
    }

    /**
     * Get inventory count
     * @returns {number} Number of items in inventory
     */
    getCount() {
        return this.items.length
    }

    /**
     * Check if inventory is full
     * @returns {boolean} True if inventory is at maximum capacity
     */
    isFull() {
        return this.items.length >= this.maxItems
    }

    /**
     * Handle item click for selection/deselection
     * @param {string} itemName - Name of the clicked item
     */
    handleItemClick(itemName) {
        const currentAction = this.game.stateManager.getState('currentAction')
        
        switch (currentAction) {
            case 'examine':
                this.examineItem(itemName)
                break
            case 'use':
                this.selectItemForUse(itemName)
                break
            case 'get':
                // Can't get items already in inventory
                this.game.uiManager?.showMessage("You already have this!")
                break
            default:
                this.game.uiManager?.showMessage("Choose an action first!")
                break
        }
    }

    /**
     * Examine an item
     * @param {string} itemName - Name of the item to examine
     */
    examineItem(itemName) {
        const itemData = this.getItemData(itemName)
        
        if (itemData) {
            const message = itemData.lookAt || `You examine the ${itemData.longName || itemName}.`
            this.game.uiManager?.showMessage(message)
        } else {
            this.game.uiManager?.showMessage(`You examine the ${itemName}.`)
        }
        
        this.emit('itemExamined', itemName)
    }

    /**
     * Select an item for use/combination
     * @param {string} itemName - Name of the item to select
     */
    selectItemForUse(itemName) {
        if (this.selectedItems.includes(itemName)) {
            // Deselect if already selected
            this.deselectItem(itemName)
        } else if (this.selectedItems.length < 2) {
            // Select item (max 2 for combinations)
            this.selectedItems.push(itemName)
            this.emit('itemSelected', itemName)
            
            // If two items selected, try to combine them
            if (this.selectedItems.length === 2) {
                this.attemptItemCombination()
            }
        } else {
            // Clear selection and select new item
            this.clearSelection()
            this.selectedItems.push(itemName)
            this.emit('itemSelected', itemName)
        }
    }

    /**
     * Deselect an item
     * @param {string} itemName - Name of the item to deselect
     */
    deselectItem(itemName) {
        const index = this.selectedItems.indexOf(itemName)
        if (index !== -1) {
            this.selectedItems.splice(index, 1)
            this.emit('itemDeselected', itemName)
        }
    }

    /**
     * Clear all selected items
     * @param {string} [exceptItem] - Item name to keep selected
     */
    clearSelection(exceptItem = null) {
        const itemsToDeselect = exceptItem 
            ? this.selectedItems.filter(item => item !== exceptItem)
            : [...this.selectedItems]
        
        this.selectedItems = exceptItem ? [exceptItem] : []
        
        itemsToDeselect.forEach(item => {
            this.emit('itemDeselected', item)
        })
        
        if (itemsToDeselect.length > 0) {
            this.emit('selectionCleared')
        }
    }

    /**
     * Attempt to combine two selected items
     */
    attemptItemCombination() {
        if (this.selectedItems.length !== 2) return

        const [item1, item2] = this.selectedItems
        const combination = this.findItemCombination(item1, item2)

        if (combination) {
            this.performItemCombination(combination)
        } else {
            this.game.uiManager?.showMessage("These items can't be combined.")
            this.clearSelection()
        }
    }

    /**
     * Find a valid combination for two items
     * @param {string} item1 - First item name
     * @param {string} item2 - Second item name
     * @returns {Object|null} Combination data or null if no combination exists
     */
    findItemCombination(item1, item2) {
        const gameData = this.game.gameData
        const sceneItems = gameData.sceneItems || []

        // Check both orders of combination
        for (const itemData of sceneItems) {
            if ((itemData.name === item1 && itemData.useWith === item2) ||
                (itemData.name === item2 && itemData.useWith === item1)) {
                return itemData
            }
        }

        return null
    }

    /**
     * Perform item combination
     * @param {Object} combination - Combination data
     */
    performItemCombination(combination) {
        const [item1, item2] = this.selectedItems
        const resultItem = combination.useResult

        // Remove the combined items
        this.removeItem(item1)
        this.removeItem(item2)

        // Add the result item
        if (resultItem) {
            this.addItem(resultItem)
        }

        // Show message
        const message = combination.useMessage || `You combine the items and create ${resultItem}.`
        this.game.uiManager?.showMessage(message)

        // Add score if specified
        if (combination.points) {
            this.game.addScore(combination.points)
        }

        // Clear selection
        this.clearSelection()

        this.emit('itemsCombined', { item1, item2, result: resultItem })
    }

    /**
     * Use an item on a scene target
     * @param {string} itemName - Name of the item to use
     * @param {string} targetName - Name of the target
     */
    useItemOnTarget(itemName, targetName) {
        const itemData = this.getItemData(itemName)
        
        if (!itemData) {
            this.game.uiManager?.showMessage("You can't use that.")
            return
        }

        // Check if this item can be used on this target
        if (itemData.useWith === targetName) {
            this.performItemUse(itemData, targetName)
        } else {
            this.game.uiManager?.showMessage("That doesn't work.")
        }
    }

    /**
     * Perform item use action
     * @param {Object} itemData - Item data
     * @param {string} targetName - Target name
     */
    performItemUse(itemData, targetName) {
        const resultItem = itemData.useResult
        const outcome = itemData.outcome

        // Remove item if specified
        if (outcome === 'remove') {
            this.removeItem(itemData.name)
        }

        // Add result item if specified
        if (resultItem) {
            if (itemData.type === 'item') {
                this.addItem(resultItem)
            } else {
                // Add to scene or perform other actions
                this.game.sceneManager?.addItemToScene(resultItem)
            }
        }

        // Show message
        const message = itemData.useMessage || `You use the ${itemData.longName || itemData.name}.`
        this.game.uiManager?.showMessage(message)

        // Add score if specified
        if (itemData.points) {
            this.game.addScore(itemData.points)
        }

        this.emit('itemUsed', { item: itemData.name, target: targetName, result: resultItem })
    }

    /**
     * Get item data from game data
     * @param {string} itemName - Name of the item
     * @returns {Object|null} Item data or null if not found
     */
    getItemData(itemName) {
        const gameData = this.game.gameData
        const sceneItems = gameData.sceneItems || []
        
        return sceneItems.find(item => item.name === itemName) || null
    }

    /**
     * Get selected items
     * @returns {string[]} Array of selected item names
     */
    getSelectedItems() {
        return [...this.selectedItems]
    }

    /**
     * Destroy the inventory manager
     */
    destroy() {
        this.items = []
        this.selectedItems = []
        this.removeAllListeners()
    }
}
