/**
 * SceneItem Component
 * Represents an interactive item in a scene (item, target, or link)
 */

export class SceneItem {
    constructor(itemData, game) {
        this.itemData = itemData
        this.game = game
        this.element = this.render()
    }

    /**
     * Render the scene item element
     * @returns {HTMLButtonElement}
     */
    render() {
        const element = document.createElement('button')
        
        // Add classes
        element.className = `${this.itemData.name} icon-font icon-${this.itemData.name} scene-${this.itemData.type} prop`
        
        // Apply positioning if specified
        if (this.itemData.position && this.itemData.size) {
            this.applyPositioning(element)
        }
        
        // Apply image if specified
        if (this.itemData.image) {
            this.applyImage(element)
        } else {
            // Use text if no image
            element.textContent = this.itemData.longName || this.itemData.name
        }
        
        // Apply hover effect if specified
        if (this.itemData.style?.hoverEffect) {
            element.setAttribute('data-hover', this.itemData.style.hoverEffect)
        }
        
        // Apply custom style class if specified
        if (this.itemData.style?.className) {
            element.classList.add(this.itemData.style.className)
        }
        
        return element
    }

    /**
     * Apply positioning styles to element
     * @param {HTMLElement} element
     */
    applyPositioning(element) {
        element.style.position = 'absolute'
        element.style.left = `${this.itemData.position[0]}px`
        element.style.top = `${this.itemData.position[1]}px`
        element.style.width = `${this.itemData.size[0]}px`
        element.style.height = `${this.itemData.size[1]}px`

        // Apply z-index if specified
        if (this.itemData.zIndex !== undefined) {
            element.style.zIndex = this.itemData.zIndex
        }

        // Apply polygon hit area if specified
        if (this.itemData.hitPolygon && this.itemData.hitPolygon.length > 0) {
            this.createPolygonHitArea(element)
        }
        // Apply rectangular hit area if specified (legacy support)
        else if (this.itemData.hitW || this.itemData.hitH) {
            const hitW = this.itemData.hitW || this.itemData.size[0]
            const hitH = this.itemData.hitH || this.itemData.size[1]
            const offsetX = (hitW - this.itemData.size[0]) / 2
            const offsetY = (hitH - this.itemData.size[1]) / 2

            // Use CSS custom properties for ::before pseudo-element
            element.style.setProperty('--hit-w', `${hitW}px`)
            element.style.setProperty('--hit-h', `${hitH}px`)
            element.style.setProperty('--hit-offset-x', `${offsetX}px`)
            element.style.setProperty('--hit-offset-y', `${offsetY}px`)
            element.setAttribute('data-has-hit-area', 'true')
        }

        // Disable pointer events if non-interactive
        if (this.itemData.nonInteractive) {
            element.style.pointerEvents = 'none'
            element.style.cursor = 'default'
        }
    }

    /**
     * Create SVG polygon hit area
     * @param {HTMLElement} element
     */
    createPolygonHitArea(element) {
        // Disable pointer events on the main element so only the polygon receives clicks
        element.style.pointerEvents = 'none'

        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.style.position = 'absolute'
        svg.style.top = '0'
        svg.style.left = '0'
        svg.style.width = '100%'
        svg.style.height = '100%'
        svg.style.pointerEvents = 'auto'
        svg.style.overflow = 'visible'

        // Create polygon element
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')

        // Convert points array to SVG points string
        const pointsStr = this.itemData.hitPolygon
            .map(([x, y]) => `${x},${y}`)
            .join(' ')

        polygon.setAttribute('points', pointsStr)
        polygon.style.fill = 'transparent'
        polygon.style.stroke = 'none'
        polygon.style.pointerEvents = 'auto'
        polygon.style.cursor = 'pointer'

        svg.appendChild(polygon)
        element.appendChild(svg)
        element.setAttribute('data-has-polygon-hit-area', 'true')
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

        // Make text smaller when using images
        element.style.fontSize = '0.7rem'
        element.style.textShadow = '1px 1px 3px rgba(0, 0, 0, 0.8)'
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
                this.element.textContent = this.itemData.longName || this.itemData.name
            }
        }
        
        if (newData.position || newData.size) {
            this.applyPositioning(this.element)
        }
    }

    /**
     * Show the item with animation
     * @param {string} animation - Animation type ('fadeIn', 'slideIn', etc.)
     */
    show(animation = 'fadeIn') {
        this.element.style.display = ''
        
        if (animation === 'fadeIn') {
            this.element.style.opacity = '0'
            this.element.animate([
                { opacity: '0' },
                { opacity: '1' }
            ], { duration: 300, easing: 'ease-in' }).onfinish = () => {
                this.element.style.opacity = '1'
            }
        }
    }

    /**
     * Hide the item with animation
     * @param {string} animation - Animation type ('fadeOut', 'slideOut', etc.)
     */
    hide(animation = 'fadeOut') {
        if (animation === 'fadeOut') {
            this.element.animate([
                { opacity: '1' },
                { opacity: '0' }
            ], { duration: 300, easing: 'ease-out' }).onfinish = () => {
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
            this.element.style.animation = 'fadeOut 0.3s ease-out'
            setTimeout(() => this.destroy(), 300)
        } else {
            this.destroy()
        }
    }

    /**
     * Get the DOM element
     * @returns {HTMLButtonElement}
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
     * Get item type
     * @returns {string}
     */
    getType() {
        return this.itemData.type
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

