/**
 * SceneObject Class
 * Manages animated, interactive objects in scenes
 * Supports transform animations, sprite animations, and user interactions
 */

export class SceneObject {
    constructor(itemData, sceneContainer, game) {
        this.itemData = itemData
        this.sceneContainer = sceneContainer
        this.game = game
        this.element = null
        this.animationFrameId = null
        this.spriteFrameIndex = 0
        this.lastFrameTime = 0
        this.startTime = Date.now()
        this.isDestroyed = false
    }

    /**
     * Initialize the scene object
     * Creates DOM element and starts animations
     */
    init() {
        this.createElement()
        this.attachEventListeners()
        this.startAnimation()
    }

    /**
     * Create the DOM element for this object
     */
    createElement() {
        const el = document.createElement('button')
        el.className = 'scene-object'

        // Add item-specific classes
        if (this.itemData.name) {
            el.classList.add(`scene-object-${this.itemData.name}`)
            // Add item name class for UIManager compatibility
            el.classList.add(this.itemData.name)
        }

        if (this.itemData.type) {
            el.classList.add(`scene-object-type-${this.itemData.type}`)
            // Add legacy scene-type class for UIManager click handler compatibility
            el.classList.add(`scene-${this.itemData.type}`)
        }

        // Add custom class if specified
        if (this.itemData.style?.className) {
            el.classList.add(this.itemData.style.className)
        }

        // Add hover effect if specified
        if (this.itemData.style?.hoverEffect) {
            el.setAttribute('data-hover', this.itemData.style.hoverEffect)
        }

        // Apply positioning
        if (this.itemData.position && this.itemData.size) {
            el.style.left = `${this.itemData.position[0]}px`
            el.style.top = `${this.itemData.position[1]}px`
            el.style.width = `${this.itemData.size[0]}px`
            el.style.height = `${this.itemData.size[1]}px`
        }

        // Apply z-index if specified
        if (this.itemData.zIndex !== undefined) {
            el.style.zIndex = this.itemData.zIndex
        }

        // Disable pointer events if non-interactive
        if (this.itemData.nonInteractive) {
            el.style.pointerEvents = 'none'
            el.style.cursor = 'default'
        }

        // Apply image
        if (this.itemData.image) {
            const imagePath = `/src/assets/images/items/${this.itemData.image}`
            el.style.backgroundImage = `url('${imagePath}')`
        }

        // Apply polygon hit area if specified
        if (this.itemData.hitPolygon && this.itemData.hitPolygon.length > 0) {
            this.createPolygonHitArea(el)
        }
        // Apply rectangular hit area if specified (legacy support)
        else if (this.itemData.hitW || this.itemData.hitH) {
            const hitW = this.itemData.hitW || this.itemData.size[0]
            const hitH = this.itemData.hitH || this.itemData.size[1]
            const offsetX = (hitW - this.itemData.size[0]) / 2
            const offsetY = (hitH - this.itemData.size[1]) / 2

            // Use CSS custom properties for ::before pseudo-element
            el.style.setProperty('--hit-w', `${hitW}px`)
            el.style.setProperty('--hit-h', `${hitH}px`)
            el.style.setProperty('--hit-offset-x', `${offsetX}px`)
            el.style.setProperty('--hit-offset-y', `${offsetY}px`)
            el.setAttribute('data-has-hit-area', 'true')
        }

        // Add accessibility attributes
        el.setAttribute('role', 'button')
        el.setAttribute('tabindex', '0')
        el.setAttribute('aria-label', this.itemData.longName || this.itemData.name)

        this.element = el
        this.sceneContainer.appendChild(el)
    }

    /**
     * Attach event listeners for interactions
     */
    attachEventListeners() {
        if (!this.element) return

        // Listen for clicks to apply visual/audio feedback
        // Don't prevent default - let the event bubble to UIManager
        this.element.addEventListener('click', (e) => {
            // Play click sound if specified
            if (this.itemData.onClickSound && this.game.audioManager) {
                this.game.audioManager.playSound(this.itemData.onClickSound)
            }

            // Apply visual effect if specified
            if (this.itemData.onClickEffect) {
                this.applyClickEffect(this.itemData.onClickEffect)
            }
        })
    }

    /**
     * Apply visual click effect
     * @param {string} effectType - Type of effect ('flash', 'bounce', 'shake')
     */
    applyClickEffect(effectType) {
        if (!this.element) return

        // Remove any existing effect class
        this.element.classList.remove('flash', 'bounce', 'shake')
        
        // Force reflow to restart animation
        void this.element.offsetWidth
        
        // Add effect class
        this.element.classList.add(effectType)
        
        // Remove class after animation completes
        setTimeout(() => {
            if (this.element) {
                this.element.classList.remove(effectType)
            }
        }, 400)
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
     * Trigger puzzle interaction
     */
    triggerPuzzle() {
        if (!this.itemData.triggerPuzzle) return

        const { module, config } = this.itemData.triggerPuzzle

        if (this.game.puzzleManager) {
            this.game.puzzleManager.startPuzzle(module, config)
        }
    }

    /**
     * Navigate to linked scene
     */
    navigateToScene() {
        if (!this.itemData.linkToScene) return

        if (this.game.sceneManager) {
            this.game.sceneManager.changeScene(this.itemData.linkToScene)
        }
    }

    /**
     * Start animation based on itemData.animation configuration
     */
    startAnimation() {
        if (!this.itemData.animation || !this.element) return

        const anim = this.itemData.animation
        
        if (anim.type === 'sprite') {
            this.startSpriteAnimation()
        } else {
            this.startTransformAnimation()
        }
    }

    /**
     * Start sprite-based animation (frame sequence or sprite sheet)
     */
    startSpriteAnimation() {
        const anim = this.itemData.animation
        const fps = anim.fps || 12
        const frameDuration = 1000 / fps

        const animate = (currentTime) => {
            if (this.isDestroyed) return

            // Calculate if enough time has passed for next frame
            if (currentTime - this.lastFrameTime >= frameDuration) {
                this.lastFrameTime = currentTime

                if (anim.frames && anim.frames.length > 0) {
                    // Frame-by-frame animation using image array
                    this.spriteFrameIndex = (this.spriteFrameIndex + 1) % anim.frames.length
                    const framePath = `/src/assets/images/items/${anim.frames[this.spriteFrameIndex]}`
                    this.element.style.backgroundImage = `url('${framePath}')`
                } else if (anim.spriteSheet) {
                    // Sprite sheet animation using background-position
                    const frameCount = anim.frameCount || 1
                    this.spriteFrameIndex = (this.spriteFrameIndex + 1) % frameCount
                    const frameWidth = anim.frameWidth || this.itemData.size[0]
                    const xOffset = -(this.spriteFrameIndex * frameWidth)
                    
                    const sheetPath = `/src/assets/images/items/${anim.spriteSheet}`
                    this.element.style.backgroundImage = `url('${sheetPath}')`
                    this.element.style.backgroundPosition = `${xOffset}px 0`
                }
            }

            this.animationFrameId = requestAnimationFrame(animate)
        }

        this.animationFrameId = requestAnimationFrame(animate)
    }

    /**
     * Start transform-based animation (bob, pulse, spin, fade)
     */
    startTransformAnimation() {
        const anim = this.itemData.animation
        const speed = anim.speed || 1
        const amplitude = anim.amplitude || 10

        const animate = () => {
            if (this.isDestroyed || !this.element) return

            const elapsed = (Date.now() - this.startTime) * speed
            const t = elapsed / 1000 // Time in seconds

            let transform = ''

            switch (anim.type) {
                case 'bob':
                    // Vertical bobbing motion
                    const bobY = Math.sin(t * 2) * amplitude
                    transform = `translateY(${bobY}px)`
                    break

                case 'pulse':
                    // Scale pulsing
                    const scale = 1 + (Math.sin(t * 2) * amplitude / 100)
                    transform = `scale(${scale})`
                    break

                case 'spin':
                    // Continuous rotation
                    const rotation = (t * 60 * speed) % 360
                    transform = `rotate(${rotation}deg)`
                    break

                case 'fade':
                    // Opacity fading
                    const opacity = 0.5 + (Math.sin(t * 2) * 0.5)
                    this.element.style.opacity = opacity
                    break
            }

            if (transform) {
                this.element.style.transform = transform
            }

            this.animationFrameId = requestAnimationFrame(animate)
        }

        this.animationFrameId = requestAnimationFrame(animate)
    }

    /**
     * Stop all animations
     */
    stopAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId)
            this.animationFrameId = null
        }
    }

    /**
     * Update item data and refresh display
     * @param {Object} newData - New item data to merge
     */
    updateData(newData) {
        this.itemData = { ...this.itemData, ...newData }
        
        // Restart animation if animation config changed
        if (newData.animation !== undefined) {
            this.stopAnimation()
            this.startAnimation()
        }
    }

    /**
     * Clean up and destroy the scene object
     * IMPORTANT: Always call this when removing objects to prevent memory leaks
     */
    destroy() {
        this.isDestroyed = true
        
        // Stop all animations
        this.stopAnimation()
        
        // Remove DOM element
        if (this.element) {
            this.element.remove()
            this.element = null
        }
        
        // Clear references
        this.itemData = null
        this.sceneContainer = null
        this.game = null
    }
}

