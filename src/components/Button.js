/**
 * Button Component
 * Reusable button component with different styles and behaviors
 */

export class Button {
    constructor(options = {}) {
        this.text = options.text || 'Button'
        this.type = options.type || 'default' // 'action', 'nav', 'primary', 'secondary'
        this.className = options.className || ''
        this.onClick = options.onClick || (() => {})
        this.disabled = options.disabled || false
        this.id = options.id || null
        
        this.element = this.render()
    }

    /**
     * Render the button element
     * @returns {HTMLButtonElement}
     */
    render() {
        const button = document.createElement('button')
        
        // Base class
        button.className = 'btn'
        
        // Add type-specific class
        if (this.type !== 'default') {
            button.classList.add(`btn-${this.type}`)
        }
        
        // Add custom classes
        if (this.className) {
            this.className.split(' ').forEach(cls => {
                if (cls) button.classList.add(cls)
            })
        }
        
        // Set ID if provided
        if (this.id) {
            button.id = this.id
        }
        
        // Set text content
        button.textContent = this.text
        
        // Set disabled state
        button.disabled = this.disabled
        
        // Attach click handler
        this.handleClick = this.handleClick.bind(this)
        button.addEventListener('click', this.handleClick)
        
        return button
    }

    /**
     * Handle button click
     * @param {Event} event
     */
    handleClick(event) {
        if (!this.disabled) {
            this.onClick(event)
        }
    }

    /**
     * Update button text
     * @param {string} text
     */
    setText(text) {
        this.text = text
        if (this.element) {
            this.element.textContent = text
        }
    }

    /**
     * Enable the button
     */
    enable() {
        this.disabled = false
        if (this.element) {
            this.element.disabled = false
        }
    }

    /**
     * Disable the button
     */
    disable() {
        this.disabled = true
        if (this.element) {
            this.element.disabled = true
        }
    }

    /**
     * Add a CSS class
     * @param {string} className
     */
    addClass(className) {
        if (this.element) {
            this.element.classList.add(className)
        }
    }

    /**
     * Remove a CSS class
     * @param {string} className
     */
    removeClass(className) {
        if (this.element) {
            this.element.classList.remove(className)
        }
    }

    /**
     * Toggle a CSS class
     * @param {string} className
     */
    toggleClass(className) {
        if (this.element) {
            this.element.classList.toggle(className)
        }
    }

    /**
     * Show the button
     */
    show() {
        if (this.element) {
            this.element.style.display = ''
        }
    }

    /**
     * Hide the button
     */
    hide() {
        if (this.element) {
            this.element.style.display = 'none'
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
     * Destroy the button and clean up
     */
    destroy() {
        if (this.element) {
            this.element.removeEventListener('click', this.handleClick)
            this.element.remove()
        }
        this.element = null
        this.onClick = null
    }
}

