/**
 * UI Manager Class
 * Handles all user interface interactions, updates, and DOM manipulation
 */

import { EventEmitter } from './EventEmitter.js'

export class UIManager extends EventEmitter {
    constructor(game) {
        super()
        this.game = game
        this.elements = {}
        this.currentAction = null
        this.isMenuOpen = false
        this.messageTimeout = null
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
        
        // Menu buttons
        this.elements.menuToggle?.addEventListener('click', () => this.toggleMenu())
        this.elements.btnSave?.addEventListener('click', () => this.emit('saveRequested'))
        this.elements.btnLoad?.addEventListener('click', () => this.emit('loadRequested'))
        this.elements.btnReset?.addEventListener('click', () => this.emit('resetRequested'))
        this.elements.btnMute?.addEventListener('click', () => this.toggleMute())
        
        // Scene item interactions
        this.elements.sceneItemsOverlay?.addEventListener('click', (e) => this.handleSceneItemClick(e))
        this.elements.sceneInventoryOverlay?.addEventListener('click', (e) => this.handleInventoryItemClick(e))
        
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
        // Update scene text
        if (this.elements.sceneTitle) {
            this.elements.sceneTitle.style.display = 'none'
            this.elements.sceneTitle.innerHTML = sceneData.title || ''
            this.fadeIn(this.elements.sceneTitle)
        }
        
        if (this.elements.sceneText) {
            this.elements.sceneText.style.display = 'none'
            this.elements.sceneText.innerHTML = sceneData.textOne || ''
            this.fadeIn(this.elements.sceneText)
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
        
        // Update body classes
        this.updateBodyClasses(sceneData)
    }

    /**
     * Update scene items display
     */
    updateSceneItems() {
        if (!this.elements.sceneItemsOverlay) return
        
        this.elements.sceneItemsOverlay.innerHTML = ''
        
        const sceneItems = this.game.sceneManager?.getCurrentSceneItems() || []
        const gameData = this.game.gameData
        
        sceneItems.forEach(itemName => {
            const itemData = gameData.sceneItems?.find(item => item.name === itemName)
            if (itemData) {
                this.createSceneItemElement(itemData)
            }
        })
    }

    /**
     * Create scene item element
     * @param {Object} itemData - Item data
     */
    createSceneItemElement(itemData) {
        const element = document.createElement('button')
        element.className = `${itemData.name} icon-font icon-${itemData.name} scene-${itemData.type} prop`
        
        if (itemData.type === 'link') {
            element.style.position = 'absolute'
            element.style.left = `${itemData.position[0]}px`
            element.style.top = `${itemData.position[1]}px`
            element.style.width = `${itemData.size[0]}px`
            element.style.height = `${itemData.size[1]}px`
        }
        
        element.textContent = itemData.longName || itemData.name
        
        this.elements.sceneItemsOverlay?.appendChild(element)
    }

    /**
     * Remove scene item element
     * @param {string} itemName - Item name
     */
    removeSceneItemElement(itemName) {
        const element = this.elements.sceneItemsOverlay?.querySelector(`.${itemName}`)
        if (element) {
            element.style.animation = 'fadeOut 0.3s ease-out'
            setTimeout(() => element.remove(), 300)
        }
    }

    /**
     * Update inventory display
     * @param {string[]} items - Inventory items
     */
    updateInventory(items) {
        if (!this.elements.sceneInventoryOverlay) return
        
        this.elements.sceneInventoryOverlay.innerHTML = ''
        
        const gameData = this.game.gameData
        
        items.forEach(itemName => {
            const itemData = gameData.sceneItems?.find(item => item.name === itemName)
            if (itemData) {
                const element = document.createElement('button')
                element.className = `${itemName} icon-font icon-${itemName} inventory-item prop`
                element.textContent = itemData.longName || itemName
                
                this.elements.sceneInventoryOverlay.appendChild(element)
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
     * @param {number} duration - Display duration in milliseconds
     */
    showMessage(message, duration = 3000) {
        if (!this.elements.panelText) return
        
        this.elements.panelText.innerHTML = message
        
        // Clear existing timeout
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout)
        }
        
        // Auto-clear message after duration
        this.messageTimeout = setTimeout(() => {
            this.clearMessage()
        }, duration)
    }

    /**
     * Clear current message
     */
    clearMessage() {
        if (this.elements.panelText) {
            this.elements.panelText.innerHTML = ''
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
        
        // Add new scene class
        document.body.classList.add(`scene-${sceneData.sceneName}`)
        
        // Add scene type class
        if (sceneData.sceneType) {
            document.body.classList.add(`type-${sceneData.sceneType}`)
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
        element.style.opacity = '0'
        element.style.display = 'block'
        
        element.animate([
            { opacity: '0' },
            { opacity: '1' }
        ], { duration: 1000, easing: 'ease-in' }).onfinish = () => {
            element.style.opacity = '1'
        }
    }

    /**
     * Destroy the UI manager
     */
    destroy() {
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout)
        }
        
        this.elements = {}
        this.removeAllListeners()
    }
}
