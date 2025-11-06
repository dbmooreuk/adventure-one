/**
 * UI Manager Class
 * Handles all user interface interactions, updates, and DOM manipulation
 */

import { EventEmitter } from './EventEmitter.js'
import { ui } from '../config/gameConfig.js'
import { SceneItem } from '../components/SceneItem.js'
import { InventoryItem } from '../components/InventoryItem.js'

export class UIManager extends EventEmitter {
    constructor(game) {
        super()
        this.game = game
        this.elements = {}
        this.currentAction = null
        this.isMenuOpen = false
        this.messageTimeout = null
        this.components = new Map() // Track component instances
        this.inventoryComponents = new Map() // Track inventory item components
    }

    /**
     * Initialize the UI manager
     */
    async initialize() {
        console.log('🖥️ Initializing UI Manager...')
        
        // Cache DOM elements
        this.cacheElements()
        
        // Set up event listeners
        this.setupEventListeners()
        
        // Initialize UI state
        this.initializeUI()
        
        console.log('✅ UI Manager initialized')
    }

    /**
     * Cache frequently used DOM elements
     */
    cacheElements() {
        this.elements = {
            // Scene elements
            sceneTitle: document.querySelector('.scene-title'),
            sceneText: document.querySelector('.scene-text'),
            sceneItemsOverlay: document.querySelector('.scene-items-overlay'),
            sceneInventoryOverlay: document.querySelector('.scene-inventory-overlay'),
            panelText: document.querySelector('.panel-text'),
            scoreBox: document.querySelector('.score-box'),
            stageTitle: document.querySelector('.stage-title'),
            pipsContainer: document.querySelector('.pips-container'),
            
            // Action buttons
            btnExamine: document.querySelector('.btn-examine'),
            btnGet: document.querySelector('.btn-get'),
            btnUse: document.querySelector('.btn-use'),
            
            // Navigation buttons
            btnBack: document.querySelector('.btn-back'),
            btnNext: document.querySelector('.btn-next'),
            btnStart: document.querySelector('.btn-start'),
            
            // Menu elements
            menuToggle: document.querySelector('#menu-toggle'),
            menu: document.querySelector('#menu'),
            btnSave: document.querySelector('.btn-save'),
            btnLoad: document.querySelector('.btn-load'),
            btnReset: document.querySelector('.btn-reset'),
            btnMute: document.querySelector('.btn-mute'),

            // Containers
            gameContainer: document.querySelector('.game-container'),
            sceneContainer: document.querySelector('.scene-container'),
            btnActionsContainer: document.querySelector('.btn-actions-container'),
            messages: document.querySelector('.messages'),
            loader: document.querySelector('#loader')
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Action buttons
        this.elements.btnExamine?.addEventListener('click', () => this.setAction('examine'))
        this.elements.btnGet?.addEventListener('click', () => this.setAction('get'))
        this.elements.btnUse?.addEventListener('click', () => this.setAction('use'))

        // Navigation buttons
        this.elements.btnBack?.addEventListener('click', () => this.navigateBack())
        this.elements.btnNext?.addEventListener('click', () => this.navigateNext())
        this.elements.btnStart?.addEventListener('click', () => this.startGame())

        // Menu buttons
        this.elements.menuToggle?.addEventListener('click', () => this.toggleMenu())
        this.elements.btnSave?.addEventListener('click', () => this.emit('saveRequested'))
        this.elements.btnLoad?.addEventListener('click', () => this.emit('loadRequested'))
        this.elements.btnReset?.addEventListener('click', () => this.emit('resetRequested'))
        this.elements.btnMute?.addEventListener('click', () => this.toggleMute())

        // Scene item interactions
        this.elements.sceneItemsOverlay?.addEventListener('click', (e) => this.handleSceneItemClick(e))

        // Inventory item interactions
        this.elements.sceneInventoryOverlay?.addEventListener('click', (e) => this.handleInventoryItemClick(e))

        // Listen for inventory item selection/deselection events
        this.game.inventoryManager?.on('itemSelected', (itemName) => this.handleItemSelected(itemName))
        this.game.inventoryManager?.on('itemDeselected', (itemName) => this.handleItemDeselected(itemName))
        this.game.inventoryManager?.on('selectionCleared', () => this.handleSelectionCleared())

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && !this.elements.menu?.contains(e.target) && !this.elements.menuToggle?.contains(e.target)) {
                this.closeMenu()
            }
        })

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e))
    }

    /**
     * Initialize UI state
     */
    initializeUI() {
        // Hide loader after initialization
        setTimeout(() => {
            this.elements.loader?.classList.add('done')
        }, 1000)
        
        // Set initial action
        this.setAction('examine')
        
        // Update menu button states
        this.updateMenuButtons()
    }

    /**
     * Set current action
     * @param {string} action - Action name ('examine', 'get', 'use')
     */
    setAction(action) {
        this.currentAction = action
        
        // Update button states
        document.querySelectorAll('.btn-action').forEach(btn => {
            btn.classList.remove('active', 'inactive')
            btn.classList.add('inactive')
        })
        
        const activeButton = document.querySelector(`.btn-${action}`)
        if (activeButton) {
            activeButton.classList.remove('inactive')
            activeButton.classList.add('active')
        }
        
        // Update body class for cursor changes
        document.body.className = document.body.className.replace(/\b(examine|get|use)\b/g, '')
        document.body.classList.add(action)
        
        this.emit('actionSelected', action)
    }

    /**
     * Handle scene item clicks
     * @param {Event} e - Click event
     */
    handleSceneItemClick(e) {
        const item = e.target.closest('.scene-item, .scene-target, .scene-link')
        if (!item) return

        const itemName = this.getItemNameFromElement(item)
        const itemType = this.getItemTypeFromElement(item)

        // Special handling for links with linkToScene - they navigate when clicked
        if (itemType === 'link') {
            const itemData = this.game.inventoryManager?.getItemData(itemName)

            // If it's a navigation link, activate it only when no action is selected or when action is 'get'
            // Allow 'examine' and 'use' to work normally on links
            if (itemData?.linkToScene && (!this.currentAction || this.currentAction === 'get')) {
                this.activateSceneLink(itemName)
                return
            }
        }

        switch (this.currentAction) {
            case 'examine':
                this.examineSceneItem(itemName, itemType)
                break
            case 'get':
                this.getSceneItem(itemName, itemType)
                break
            case 'use':
                this.useOnSceneItem(itemName, itemType)
                break
            default:
                // No action selected - for links, try to activate them
                if (itemType === 'link') {
                    this.activateSceneLink(itemName)
                } else {
                    this.showMessage("Choose an action first (Examine, Get, or Use).")
                }
                break
        }
    }

    /**
     * Activate a scene link (navigate to linked scene)
     * @param {string} itemName - Link item name
     */
    activateSceneLink(itemName) {
        const itemData = this.game.inventoryManager?.getItemData(itemName)

        if (!itemData) {
            this.showMessage("This doesn't seem to lead anywhere.")
            return
        }

        // Check if this link has a target scene
        if (itemData.linkToScene) {
            // Check if target scene is locked
            const targetSceneState = this.game.sceneManager?.getSceneState(itemData.linkToScene)

            if (targetSceneState?.locked) {
                const message = itemData.lockedMessage || "The way is blocked."
                this.showMessage(message)
                return
            }

            // Navigate to the linked scene
            const message = itemData.useMessage || `You proceed through the ${itemData.longName || itemName}.`
            this.showMessage(message)

            // Add points if specified
            if (itemData.points) {
                const achievementId = `navigate_${itemName}_to_${itemData.linkToScene}`
                this.game.addScore(itemData.points, achievementId)
            }

            // Change to the linked scene
            this.game.sceneManager?.changeScene(itemData.linkToScene)
        } else {
            this.showMessage("This doesn't seem to lead anywhere.")
        }
    }

    /**
     * Handle inventory item clicks
     * @param {Event} e - Click event
     */
    handleInventoryItemClick(e) {
        const item = e.target.closest('.inventory-item')
        if (!item) return

        const itemName = this.getItemNameFromElement(item)
        this.emit('itemClicked', itemName)
    }

    /**
     * Handle item selected event - add 'using' class
     * @param {string} itemName - Name of the selected item
     */
    handleItemSelected(itemName) {
        const component = this.inventoryComponents.get(itemName)
        if (component) {
            component.element.classList.add('using')
        }
    }

    /**
     * Handle item deselected event - remove 'using' class
     * @param {string} itemName - Name of the deselected item
     */
    handleItemDeselected(itemName) {
        const component = this.inventoryComponents.get(itemName)
        if (component) {
            component.element.classList.remove('using')
        }
    }

    /**
     * Handle selection cleared event - remove 'using' class from all items
     */
    handleSelectionCleared() {
        this.inventoryComponents.forEach(component => {
            component.element.classList.remove('using')
        })
    }

    /**
     * Examine a scene item
     * @param {string} itemName - Item name
     * @param {string} itemType - Item type
     */
    examineSceneItem(itemName, itemType) {
        const itemData = this.game.inventoryManager?.getItemData(itemName)

        if (itemData) {
            const message = itemData.lookAt || `You examine the ${itemData.longName || itemName}.`
            this.showMessage(message)
        } else {
            this.showMessage(`You examine the ${itemName}.`)
        }

        // Clear the action after examining
        this.setAction(null)
    }

    /**
     * Get a scene item
     * @param {string} itemName - Item name
     * @param {string} itemType - Item type
     */
    getSceneItem(itemName, itemType) {
        if (itemType === 'target' || itemType === 'link') {
            this.showMessage("You can't get this.")
            return
        }

        // Try to add to inventory
        const success = this.game.inventoryManager?.addItem(itemName)

        if (success) {
            // Remove from scene
            this.game.sceneManager?.removeItemFromScene(itemName)
            this.removeSceneItemElement(itemName)

            // Show pickup message
            const itemData = this.game.inventoryManager?.getItemData(itemName)
            const message = itemData?.pickUpMessage || `You pick up the ${itemData?.longName || itemName}.`
            this.showMessage(message)

            // Clear the action after getting the item
            this.setAction(null)
        }
    }

    /**
     * Use selected item on scene item
     * @param {string} itemName - Item name
     * @param {string} itemType - Item type
     */
    useOnSceneItem(itemName, itemType) {
        const selectedItems = this.game.inventoryManager?.getSelectedItems() || []

        if (selectedItems.length === 0) {
            this.showMessage("Select an item to use first.")
            return
        }

        if (selectedItems.length === 1) {
            // Use selected item on this target
            this.game.inventoryManager?.useItemOnTarget(selectedItems[0], itemName)
            // Clear the action after using the item
            this.setAction(null)
        } else {
            this.showMessage("You can only use one item at a time on targets.")
        }
    }

    /**
     * Navigate to previous scene
     */
    navigateBack() {
        if (this.game.sceneManager?.canGoBack()) {
            this.game.sceneManager.previousScene()
        }
    }

    /**
     * Navigate to next scene
     */
    navigateNext() {
        if (this.game.sceneManager?.canGoNext()) {
            this.game.sceneManager.nextScene()
        }
    }

    /**
     * Start the game from splash screen
     */
    startGame() {
        // Navigate to the first actual game scene (scene1)
        this.game.sceneManager?.changeScene('scene1')
    }

    /**
     * Toggle menu visibility
     */
    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen
        
        this.elements.menuToggle?.classList.toggle('on', this.isMenuOpen)
        
        if (this.isMenuOpen) {
            this.elements.menu?.style.setProperty('display', 'block')
            this.elements.menu?.animate([
                { height: '0px', opacity: '0' },
                { height: 'auto', opacity: '1' }
            ], { duration: 300, easing: 'ease-out' })
        } else {
            this.closeMenu()
        }
    }

    /**
     * Close menu
     */
    closeMenu() {
        this.isMenuOpen = false
        this.elements.menuToggle?.classList.remove('on')
        this.elements.menu?.style.setProperty('display', 'none')
    }

    /**
     * Toggle mute state
     */
    toggleMute() {
        this.emit('muteToggled')
        
        // Update button state
        const isMuted = this.game.audioManager?.getAudioState().isMuted
        this.elements.btnMute?.classList.toggle('active', !isMuted)
        this.elements.btnMute?.classList.toggle('inactive', isMuted)
    }

    /**
     * Update scene display
     * @param {Object} sceneData - Scene data
     */
    updateScene(sceneData) {
        console.log(`🎬 UIManager.updateScene called with:`, sceneData)

        // Update body classes first
        this.updateBodyClasses(sceneData)

        // Update UI visibility based on scene type BEFORE fadeIn
        this.updateUIVisibility(sceneData)

        // Update scene background image
        this.updateSceneBackground(sceneData)

        // Update scene text
        const isSplashScene = sceneData.sceneType === 'splash'

        if (this.elements.sceneTitle) {
            this.elements.sceneTitle.innerHTML = sceneData.title || ''
            if (!isSplashScene) {
                this.elements.sceneTitle.style.display = 'block'
                this.fadeIn(this.elements.sceneTitle)
            } else {
                // On splash, just show it without animation
                this.elements.sceneTitle.style.display = 'block'
                this.elements.sceneTitle.style.opacity = '1'
            }
        }

        if (this.elements.sceneText) {
            this.elements.sceneText.innerHTML = sceneData.textOne || ''
            if (!isSplashScene) {
                this.elements.sceneText.style.display = 'block'
                this.fadeIn(this.elements.sceneText)
            } else {
                // On splash, just show it without animation
                this.elements.sceneText.style.display = 'block'
                this.elements.sceneText.style.opacity = '1'
            }
        }

        // Update stage title
        if (this.elements.stageTitle) {
            this.elements.stageTitle.textContent = sceneData.stage || ''
        }

        // Update scene items
        this.updateSceneItems()

        // Update navigation buttons
        this.updateNavigationButtons()

        // Update progress pips
        this.updateProgressPips()
    }

    /**
     * Update scene background image
     * @param {Object} sceneData - Scene data
     */
    updateSceneBackground(sceneData) {
        const sceneContainer = this.elements.sceneContainer
        if (!sceneContainer) return

        if (sceneData.backgroundImage) {
            const imagePath = `/src/assets/images/backgrounds/${sceneData.backgroundImage}`
            sceneContainer.style.backgroundImage = `url('${imagePath}')`
            console.log(`🖼️ Set background image: ${imagePath}`)
        } else {
            // Use default gradient if no image specified
            sceneContainer.style.backgroundImage = ''
            console.log(`🖼️ Using default background (no image specified)`)
        }
    }

    /**
     * Update scene items display
     */
    updateSceneItems() {
        console.log('🎨 updateSceneItems called')
        if (!this.elements.sceneItemsOverlay) return

        this.elements.sceneItemsOverlay.innerHTML = ''

        const sceneItems = this.game.sceneManager?.getCurrentSceneItems() || []
        const gameData = this.game.gameData

        console.log('🎨 Scene items to render:', sceneItems)

        sceneItems.forEach(itemName => {
            const itemData = gameData.sceneItems?.find(item => item.name === itemName)
            console.log('🎨 Item data for', itemName, ':', itemData)
            if (itemData) {
                this.createSceneItemElement(itemData)
            }
        })
    }

    /**
     * Create scene item element using component
     * @param {Object} itemData - Item data
     */
    createSceneItemElement(itemData) {
        console.log('🎨 Creating scene item element for:', itemData.name, 'type:', itemData.type)

        // Create component instance
        const component = new SceneItem(itemData, this.game)

        // Store component reference
        this.components.set(itemData.name, component)

        // Append to overlay
        const element = component.getElement()
        console.log('🎨 Appending element to overlay. Overlay exists?', !!this.elements.sceneItemsOverlay)
        this.elements.sceneItemsOverlay?.appendChild(element)
        console.log('🎨 Element appended. Total children:', this.elements.sceneItemsOverlay?.children.length)
    }

    /**
     * Remove scene item element using component
     * @param {string} itemName - Item name
     */
    removeSceneItemElement(itemName) {
        const component = this.components.get(itemName)
        if (component) {
            component.remove('fadeOut')
            this.components.delete(itemName)
        }
    }

    /**
     * Update inventory display using components
     * @param {string[]} items - Inventory items
     */
    updateInventory(items) {
        if (!this.elements.sceneInventoryOverlay) return

        // Clear existing inventory components
        this.inventoryComponents.forEach(component => component.destroy())
        this.inventoryComponents.clear()

        const gameData = this.game.gameData

        items.forEach(itemName => {
            const itemData = gameData.sceneItems?.find(item => item.name === itemName)
            if (itemData) {
                // Create inventory item component
                const component = new InventoryItem(itemData, this.game)

                // Store component reference
                this.inventoryComponents.set(itemName, component)

                // Append to inventory overlay
                this.elements.sceneInventoryOverlay.appendChild(component.getElement())
            }
        })
    }

    /**
     * Update score display
     * @param {number} score - Current score
     */
    updateScore(score) {
        if (this.elements.scoreBox) {
            this.elements.scoreBox.textContent = `${score}%`
        }
    }

    /**
     * Show a message to the player
     * @param {string} message - Message text
     * @param {number} duration - Display duration in milliseconds (uses config default)
     */
    showMessage(message, duration = ui.messageDisplayDuration) {
        if (!this.elements.panelText) return

        // Remove existing show class if present
        this.elements.panelText.classList.remove('show')

        // Set message content
        this.elements.panelText.innerHTML = message

        // Set CSS variable for animation duration
        this.elements.panelText.style.setProperty('--message-duration', `${duration}ms`)

        // Force reflow to restart animation
        void this.elements.panelText.offsetWidth

        // Add show class to trigger animation
        this.elements.panelText.classList.add('show')

        // Clear existing timeout
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout)
        }

        // Auto-clear message after animation completes
        this.messageTimeout = setTimeout(() => {
            this.clearMessage()
        }, duration)
    }

    /**
     * Clear current message
     */
    clearMessage() {
        if (this.elements.panelText) {
            this.elements.panelText.classList.remove('show')
            // Clear content after animation
            setTimeout(() => {
                if (this.elements.panelText) {
                    this.elements.panelText.innerHTML = ''
                }
            }, 300)
        }

        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout)
            this.messageTimeout = null
        }
    }

    /**
     * Update navigation buttons state
     */
    updateNavigationButtons() {
        if (this.elements.btnBack) {
            this.elements.btnBack.disabled = !this.game.sceneManager?.canGoBack()
        }
        
        if (this.elements.btnNext) {
            this.elements.btnNext.disabled = !this.game.sceneManager?.canGoNext()
        }
    }

    /**
     * Update progress pips
     */
    updateProgressPips() {
        if (!this.elements.pipsContainer) return
        
        const progress = this.game.sceneManager?.getProgress()
        if (!progress) return
        
        this.elements.pipsContainer.innerHTML = ''
        
        for (let i = 0; i < this.game.stages; i++) {
            const pip = document.createElement('span')
            pip.className = `scene-pip ${i}`
            
            if (i <= progress.currentSceneIndex) {
                pip.style.opacity = '1'
            }
            
            this.elements.pipsContainer.appendChild(pip)
        }
    }

    /**
     * Update menu buttons based on game state
     */
    updateMenuButtons() {
        const hasSavedGame = this.game.saveManager?.hasSavedGame()
        const currentScene = this.game.stateManager?.getState('currentScene')
        
        if (currentScene === 'splash') {
            // On splash screen
            if (this.elements.btnLoad) {
                this.elements.btnLoad.style.display = hasSavedGame ? 'block' : 'none'
            }
            if (this.elements.btnSave) {
                this.elements.btnSave.style.display = 'none'
            }
        } else {
            // In game
            if (this.elements.btnLoad) {
                this.elements.btnLoad.style.display = hasSavedGame ? 'block' : 'none'
            }
            if (this.elements.btnSave) {
                this.elements.btnSave.style.display = 'block'
            }
        }
    }

    /**
     * Update body classes for scene
     * @param {Object} sceneData - Scene data
     */
    updateBodyClasses(sceneData) {
        // Remove old scene classes
        document.body.className = document.body.className.replace(/scene-\w+/g, '')
        document.body.className = document.body.className.replace(/type-\w+/g, '')

        // Add new scene class
        document.body.classList.add(`scene-${sceneData.sceneName}`)

        // Add scene type class (only 3 types: scene, puzzle, splash)
        if (sceneData.sceneType) {
            document.body.classList.add(`type-${sceneData.sceneType}`)
        }
    }

    /**
     * Update UI element visibility based on scene type
     * @param {Object} sceneData - Scene data
     */
    updateUIVisibility(sceneData) {
        const isSplashScene = sceneData.sceneType === 'splash'
        const isPuzzleScene = sceneData.sceneType === 'puzzle'

        console.log(`🎭 Updating UI visibility for scene: ${sceneData.sceneName}, type: ${sceneData.sceneType}, isSplash: ${isSplashScene}, isPuzzle: ${isPuzzleScene}`)

        // Elements to hide on splash screen or puzzle scenes
        const elementsToHide = [
            this.elements.scoreBox,
            this.elements.panelText,
            this.elements.sceneInventoryOverlay,
            this.elements.btnActionsContainer,
            this.elements.stageTitle,
            this.elements.pipsContainer
        ]

        // Hide/show elements based on scene type
        elementsToHide.forEach((element, index) => {
            if (element) {
                element.style.display = (isSplashScene || isPuzzleScene) ? 'none' : ''
                console.log(`  Element ${index} (${element.className}): ${(isSplashScene || isPuzzleScene) ? 'hidden' : 'shown'}`)
            } else {
                console.log(`  Element ${index}: not found`)
            }
        })

        // Handle navigation buttons
        if (this.elements.btnBack) {
            this.elements.btnBack.style.display = (isSplashScene || isPuzzleScene) ? 'none' : ''
            console.log(`  Back button: ${(isSplashScene || isPuzzleScene) ? 'hidden' : 'shown'}`)
        }
        if (this.elements.btnNext) {
            this.elements.btnNext.style.display = (isSplashScene || isPuzzleScene) ? 'none' : ''
            console.log(`  Next button: ${(isSplashScene || isPuzzleScene) ? 'hidden' : 'shown'}`)
        }

        // Load puzzle if this is a puzzle scene
        if (isPuzzleScene && this.game.puzzleManager) {
            console.log('🧩 Loading puzzle for scene:', sceneData.sceneName)
            this.game.puzzleManager.loadPuzzle(sceneData)
        }
        if (this.elements.btnStart) {
            this.elements.btnStart.style.display = isSplashScene ? '' : 'none'
            console.log(`  Start button: ${isSplashScene ? 'shown' : 'hidden'}`)
        } else {
            console.log(`  Start button: not found`)
        }
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboard(e) {
        switch (e.key) {
            case 'e':
            case 'E':
                this.setAction('examine')
                break
            case 'g':
            case 'G':
                this.setAction('get')
                break
            case 'u':
            case 'U':
                this.setAction('use')
                break
            case 'ArrowLeft':
                this.navigateBack()
                break
            case 'ArrowRight':
                this.navigateNext()
                break
            case 'Escape':
                this.closeMenu()
                break
        }
    }

    /**
     * Get item name from DOM element
     * @param {Element} element - DOM element
     * @returns {string} Item name
     */
    getItemNameFromElement(element) {
        // First try to get from data attribute (used by components)
        if (element.dataset.itemName) {
            return element.dataset.itemName
        }

        // Fallback to class-based detection
        const classes = Array.from(element.classList)
        return classes.find(cls => !['icon-font', 'scene-item', 'scene-target', 'scene-link', 'inventory-item', 'prop'].includes(cls) && !cls.startsWith('icon-'))
    }

    /**
     * Get item type from DOM element
     * @param {Element} element - DOM element
     * @returns {string} Item type
     */
    getItemTypeFromElement(element) {
        if (element.classList.contains('scene-item')) return 'item'
        if (element.classList.contains('scene-target')) return 'target'
        if (element.classList.contains('scene-link')) return 'link'
        if (element.classList.contains('inventory-item')) return 'inventory'
        return 'unknown'
    }

    /**
     * Fade in element
     * @param {Element} element - Element to fade in
     */
    fadeIn(element) {
        if (!element) return

        element.style.opacity = '0'
        element.style.display = 'block'

        element.animate([
            { opacity: '0' },
            { opacity: '1' }
        ], { duration: ui.sceneTransitionDuration, easing: 'ease-in' }).onfinish = () => {
            element.style.opacity = '1'
        }
    }

    /**
     * Clear all scene UI elements
     */
    clearScene() {
        console.log('🧹 Clearing all scene UI elements...')

        // Clear scene items
        if (this.elements.sceneItemsOverlay) {
            this.elements.sceneItemsOverlay.innerHTML = ''
        }

        // Clear inventory
        if (this.elements.sceneInventoryOverlay) {
            this.elements.sceneInventoryOverlay.innerHTML = ''
        }

        // Clear scene text
        if (this.elements.sceneTitle) {
            this.elements.sceneTitle.textContent = ''
        }
        if (this.elements.sceneText) {
            this.elements.sceneText.textContent = ''
        }

        // Clear background
        if (this.elements.sceneContainer) {
            this.elements.sceneContainer.style.backgroundImage = ''
        }

        // Reset score display
        this.updateScore(0)

        // Clear any active messages
        this.clearMessage()

        console.log('✅ Scene UI cleared')
    }

    /**
     * Destroy the UI manager
     */
    destroy() {
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout)
        }

        // Clean up all components
        this.components.forEach(component => component.destroy())
        this.components.clear()

        this.inventoryComponents.forEach(component => component.destroy())
        this.inventoryComponents.clear()

        this.elements = {}
        this.removeAllListeners()
    }
}
