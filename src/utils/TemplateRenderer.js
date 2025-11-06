/**
 * Template Renderer Utility
 * Handles rendering HTML templates with data binding
 */

export class TemplateRenderer {
    /**
     * Render a template with data
     * @param {string} templateId - ID of the template element
     * @param {Object} data - Data to bind to the template
     * @returns {HTMLElement|null} Cloned and populated element
     */
    static render(templateId, data = {}) {
        const template = document.getElementById(templateId)
        if (!template) {
            console.warn(`Template not found: ${templateId}`)
            return null
        }

        // Clone the template content
        const clone = template.content.cloneNode(true)
        const element = clone.firstElementChild

        if (!element) {
            console.warn(`Template ${templateId} has no root element`)
            return null
        }

        // Populate with data
        this.bindData(element, data)

        return element
    }

    /**
     * Bind data to element and its children
     * @param {HTMLElement} element - Element to bind data to
     * @param {Object} data - Data object
     */
    static bindData(element, data) {
        // Bind data attributes
        Object.entries(data).forEach(([key, value]) => {
            // Find elements with data-bind attribute
            const targets = element.querySelectorAll(`[data-bind="${key}"]`)
            
            targets.forEach(target => {
                this.bindValue(target, value)
            })

            // Also check the root element
            if (element.getAttribute('data-bind') === key) {
                this.bindValue(element, value)
            }
        })

        // Set data-* attributes
        Object.entries(data).forEach(([key, value]) => {
            if (key.startsWith('data-')) {
                element.setAttribute(key, value)
            }
        })
    }

    /**
     * Bind a value to a specific element
     * @param {HTMLElement} target - Target element
     * @param {*} value - Value to bind
     */
    static bindValue(target, value) {
        const tagName = target.tagName.toLowerCase()

        if (tagName === 'img') {
            target.src = value
            if (!target.alt) {
                target.alt = value
            }
        } else if (tagName === 'input' || tagName === 'textarea') {
            target.value = value
        } else if (target.hasAttribute('data-bind-attr')) {
            const attr = target.getAttribute('data-bind-attr')
            target.setAttribute(attr, value)
        } else if (target.hasAttribute('data-bind-style')) {
            const styleProp = target.getAttribute('data-bind-style')
            target.style[styleProp] = value
        } else {
            target.textContent = value
        }
    }

    /**
     * Render multiple items from a template
     * @param {string} templateId - ID of the template element
     * @param {Array} dataArray - Array of data objects
     * @returns {Array<HTMLElement>} Array of rendered elements
     */
    static renderMultiple(templateId, dataArray = []) {
        return dataArray.map(data => this.render(templateId, data)).filter(Boolean)
    }

    /**
     * Render and append to container
     * @param {string} templateId - ID of the template element
     * @param {Object} data - Data to bind
     * @param {HTMLElement} container - Container to append to
     * @returns {HTMLElement|null} Rendered element
     */
    static renderTo(templateId, data, container) {
        const element = this.render(templateId, data)
        if (element && container) {
            container.appendChild(element)
        }
        return element
    }

    /**
     * Render multiple items and append to container
     * @param {string} templateId - ID of the template element
     * @param {Array} dataArray - Array of data objects
     * @param {HTMLElement} container - Container to append to
     * @returns {Array<HTMLElement>} Array of rendered elements
     */
    static renderMultipleTo(templateId, dataArray, container) {
        const elements = this.renderMultiple(templateId, dataArray)
        if (container) {
            elements.forEach(element => {
                if (element) container.appendChild(element)
            })
        }
        return elements
    }

    /**
     * Clear and render to container
     * @param {string} templateId - ID of the template element
     * @param {Array} dataArray - Array of data objects
     * @param {HTMLElement} container - Container to clear and append to
     * @returns {Array<HTMLElement>} Array of rendered elements
     */
    static clearAndRender(templateId, dataArray, container) {
        if (container) {
            container.innerHTML = ''
        }
        return this.renderMultipleTo(templateId, dataArray, container)
    }
}

