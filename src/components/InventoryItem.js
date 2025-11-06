/**
 * InventoryItem Component
 * Represents an item in the player's inventory
 */

export class InventoryItem {
    constructor(itemData, game) {
        this.itemData = itemData
        this.game = game
        this.isSelected = false
        this.element = this.render()
    }

    /**
     * Render the inventory item element
     * @returns {HTMLDivElement}
     */
    render() {
        const element = document.createElement('div')
        
        // Add classes
        element.className = `inventory-item ${this.itemData.name}`
        element.setAttribute('data-item-name', this.itemData.name)
        
        // Apply image if specified
        if (this.itemData.image) {
            this.applyImage(element)
        } else {
            // Use text if no image
            element.textContent = this.itemData.shortName || this.itemData.name
        }
        
        // Apply custom style class if specified
        if (this.itemData.style?.className) {
            element.classList.add(this.itemData.style.className)
        }
        
        return element
    }

    /**
     * Apply background image to element
     * @param {HTMLElement} element
     */
    applyImage(element) {
        const imagePath = this.itemData.image
        const fullPath = `/src/assets/images/items/${imagePath}`

        element.style.backgroundImage = `url('${fullPath}')`
        element.style.backgroundSize = 'contain'
        element.style.backgroundRepeat = 'no-repeat'
        element.style.backgroundPosition = 'center'
    }

    /**
     * Select this item
     */
    select() {
        this.isSelected = true
        if (this.element) {
            this.element.classList.add('selected')
        }
    }

    /**
     * Deselect this item
     */
    deselect() {
        this.isSelected = false
        if (this.element) {
            this.element.classList.remove('selected')
        }
    }

    /**
     * Toggle selection state
     */
    toggleSelection() {
        if (this.isSelected) {
            this.deselect()
        } else {
            this.select()
        }
    }

    /**
     * Check if item is selected
     * @returns {boolean}
     */
    getIsSelected() {
        return this.isSelected
    }

    /**
     * Update item data
     * @param {Object} newData
     */
    updateData(newData) {
        this.itemData = { ...this.itemData, ...newData }
        
        // Re-render if needed
        if (newData.image !== undefined) {
            if (newData.image) {
                this.applyImage(this.element)
            } else {
                this.element.style.backgroundImage = ''
                this.element.textContent = this.itemData.shortName || this.itemData.name
            }
        }
    }

    /**
     * Show the item with animation
     * @param {string} animation - Animation type
     */
    show(animation = 'fadeIn') {
        this.element.style.display = ''
        
        if (animation === 'fadeIn') {
            this.element.style.opacity = '0'
            this.element.animate([
                { opacity: '0', transform: 'scale(0.8)' },
                { opacity: '1', transform: 'scale(1)' }
            ], { duration: 300, easing: 'ease-out' }).onfinish = () => {
                this.element.style.opacity = '1'
                this.element.style.transform = 'scale(1)'
            }
        }
    }

    /**
     * Hide the item with animation
     * @param {string} animation - Animation type
     */
    hide(animation = 'fadeOut') {
        if (animation === 'fadeOut') {
            this.element.animate([
                { opacity: '1', transform: 'scale(1)' },
                { opacity: '0', transform: 'scale(0.8)' }
            ], { duration: 300, easing: 'ease-in' }).onfinish = () => {
                this.element.style.display = 'none'
            }
        } else {
            this.element.style.display = 'none'
        }
    }

    /**
     * Remove the item with animation
     * @param {string} animation - Animation type
     */
    remove(animation = 'fadeOut') {
        if (animation === 'fadeOut') {
            this.element.animate([
                { opacity: '1', transform: 'scale(1)' },
                { opacity: '0', transform: 'scale(0.5)' }
            ], { duration: 300, easing: 'ease-in' }).onfinish = () => {
                this.destroy()
            }
        } else {
            this.destroy()
        }
    }

    /**
     * Get the DOM element
     * @returns {HTMLDivElement}
     */
    getElement() {
        return this.element
    }

    /**
     * Get item name
     * @returns {string}
     */
    getName() {
        return this.itemData.name
    }

    /**
     * Get item data
     * @returns {Object}
     */
    getData() {
        return this.itemData
    }

    /**
     * Destroy the component and clean up
     */
    destroy() {
        if (this.element) {
            this.element.remove()
        }
        this.element = null
        this.itemData = null
        this.game = null
    }
}

