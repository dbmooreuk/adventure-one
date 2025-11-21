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
        this.currentSceneText = '' // Store current scene text for Look button
        this.isSceneTextShowing = false // Track if scene text is currently displayed
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
            sceneItemsOverlay: document.querySelector('.scene-items-overlay'),
            sceneInventoryOverlay: document.querySelector('.scene-inventory-overlay'),
            panelText: document.querySelector('.panel-text'),
            panelTextContent: document.querySelector('.panel-text-content'),
            btnDismiss: document.querySelector('.btn-dismiss'),
            scoreBox: document.querySelector('.score-box'),
            stageTitle: document.querySelector('.stage-title'),
            pipsContainer: document.querySelector('.pips-container'),

            // Action buttons
            btnExamine: document.querySelector('.btn-examine'),
            btnGet: document.querySelector('.btn-get'),
            btnUse: document.querySelector('.btn-use'),
            btnCombine: document.querySelector('.btn-combine'),
            btnLook: document.querySelector('.btn-look'),

            // Navigation buttons
            btnBack: document.querySelector('.btn-back'),
            btnNext: document.querySelector('.btn-next'),
            btnStart: document.querySelector('.btn-start'),

            // Menu elements
            menuToggle: document.querySelector('#menu-toggle'),
            menu: document.querySelector('#menu'),
            menuContainer: document.querySelector('#menu-container'),
            btnClose: document.querySelector('.btn-close'),
            btnSave: document.querySelector('.btn-save'),
            btnLoad: document.querySelector('.btn-load'),
            btnReset: document.querySelector('.btn-reset'),
            btnMute: document.querySelector('.btn-mute'),

            // Containers
            gameContainer: document.querySelector('.game-container'),
            sceneContainer: document.querySelector('.scene-container'),
            btnActionsContainer: document.querySelector('.btn-actions-container'),
            messages: document.querySelector('.messages'),
            loader: document.querySelector('#loader'),

            // Achievement & Journal elements
            journalBtn: document.getElementById('journal-btn'),
            journalModal: document.getElementById('journal-modal'),
            journalEntries: document.getElementById('journal-entries'),
            journalTotalPoints: document.getElementById('journal-total-points'),
            journalTotalGoal: document.getElementById('journal-total-goal'),
            achievementModal: document.getElementById('achievement-modal')
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
        this.elements.btnCombine?.addEventListener('click', () => this.setAction('combine'))
        this.elements.btnLook?.addEventListener('click', () => this.toggleSceneText())

        // Navigation buttons
        this.elements.btnBack?.addEventListener('click', () => this.navigateBack())
        this.elements.btnNext?.addEventListener('click', () => this.navigateNext())
        this.elements.btnStart?.addEventListener('click', () => this.startGame())

        // Menu buttons
        this.elements.menuToggle?.addEventListener('click', () => this.toggleMenu())
        this.elements.btnClose?.addEventListener('click', () => this.closeMenu())
        this.elements.btnSave?.addEventListener('click', () => this.emit('saveRequested'))
        this.elements.btnLoad?.addEventListener('click', () => this.emit('loadRequested'))
        this.elements.btnReset?.addEventListener('click', () => {
            this.closeMenu()
            this.emit('resetRequested')
        })
        this.elements.btnMute?.addEventListener('click', () => this.toggleMute())

        // Dismiss button
        this.elements.btnDismiss?.addEventListener('click', () => this.dismissMessage())

        // Journal button - toggle modal
        this.elements.journalBtn?.addEventListener('click', () => this.toggleJournal())

        // Scene item interactions
        this.elements.sceneItemsOverlay?.addEventListener('click', (e) => this.handleSceneItemClick(e))

        // Inventory item interactions
        this.elements.sceneInventoryOverlay?.addEventListener('click', (e) => this.handleInventoryItemClick(e))

        // Listen for inventory item selection/deselection events
        this.game.inventoryManager?.on('itemSelected', (itemName) => this.handleItemSelected(itemName))
        this.game.inventoryManager?.on('itemDeselected', (itemName) => this.handleItemDeselected(itemName))
        this.game.inventoryManager?.on('selectionCleared', () => this.handleSelectionCleared())

        // Listen for save/load events
        this.game.saveManager?.on('gameSaved', (data) => this.handleGameSaved(data))
        this.game.saveManager?.on('gameLoaded', () => this.handleGameLoaded())

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && !this.elements.menu?.contains(e.target) && !this.elements.menuToggle?.contains(e.target)) {
                this.closeMenu()
            }
        })

        // Close journal when clicking outside
        document.addEventListener('click', (e) => {
            const isJournalOpen = this.elements.journalModal?.classList.contains('active')
            const journalContainer = this.elements.journalModal?.querySelector('.journal-container')

            if (isJournalOpen &&
                !journalContainer?.contains(e.target) &&
                !this.elements.journalBtn?.contains(e.target)) {
                this.toggleJournal()
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
     * @param {string} action - Action name ('examine', 'get', 'use', 'combine')
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
        document.body.className = document.body.className.replace(/\b(examine|get|use|combine)\b/g, '')
        document.body.classList.add(action)

        this.emit('actionSelected', action)
    }

    /**
     * Handle scene item clicks
     * @param {Event} e - Click event
     */
    handleSceneItemClick(e) {
        // Ignore clicks if intro screen is visible
        const introContainer = document.querySelector('.intro-container')
        if (introContainer && introContainer.style.display !== 'none') {
            return
        }

        // Look for scene items (both SceneItem components and SceneObjects)
        const item = e.target.closest('.scene-item, .scene-target, .scene-link, .scene-decor, .scene-character, .scene-object')
        if (!item) return

        // Check if item has a polygon hit area
        if (item.hasAttribute('data-has-polygon-hit-area')) {
            // Only allow clicks that originated from the polygon element itself
            const clickedPolygon = e.target.tagName === 'polygon' || e.target.closest('polygon')
            if (!clickedPolygon) {
                // Click was outside the polygon hit area - ignore it
                return
            }
        }

        const itemName = this.getItemNameFromElement(item)
        const itemType = this.getItemTypeFromElement(item)

        // Special handling for character type - show quiz when clicked (no action needed)
        if (itemType === 'character') {
            const itemData = this.game.inventoryManager?.getItemData(itemName)

            // If no action selected, show the quiz
            if (!this.currentAction) {
                this.showCharacterQuiz(itemName, itemData)
                return
            }
            // If examine action, show lookAt text
            if (this.currentAction === 'examine') {
                this.examineSceneItem(itemName, itemType)
                return
            }
            // Other actions not allowed on characters
            this.showMessage("You can't do that with a character.")
            return
        }

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
                // If locked, don't navigate - treat like any other item
                this.showMessage("Choose an action first (Examine, Get, or Use).")
                return
            }

            // Get target scene data to check if it's a puzzle
            const targetScene = this.game.sceneManager?.findScene(itemData.linkToScene)
            const isPuzzleScene = targetScene?.sceneType === 'puzzle'

            if (isPuzzleScene) {
                // Open puzzle as overlay (don't change scene)
                console.log('🧩 Opening puzzle overlay:', itemData.linkToScene)
                const currentSceneName = this.game.sceneManager?.currentScene?.sceneName
                this.game.puzzleManager?.loadPuzzle(targetScene, currentSceneName)
            } else {
                // Normal scene navigation
                // Show message for non-puzzle scenes
                if (itemData.useMessage) {
                    this.showMessage(itemData.useMessage)
                } else {
                    const message = `You proceed through the ${itemData.longName || itemName}.`
                    this.showMessage(message)
                }

                // Add points if specified
                if (itemData.points) {
                    const achievementId = `navigate_${itemName}_to_${itemData.linkToScene}`
                    this.game.addScore(itemData.points, achievementId)
                }

                // Change to the linked scene
                this.game.sceneManager?.changeScene(itemData.linkToScene)
            }
        } else {
            this.showMessage("This doesn't seem to lead anywhere.")
        }
    }

    /**
     * Handle inventory item clicks
     * @param {Event} e - Click event
     */
    handleInventoryItemClick(e) {
        // Ignore clicks if intro screen is visible
        const introContainer = document.querySelector('.intro-container')
        if (introContainer && introContainer.style.display !== 'none') {
            return
        }

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
            let message = itemData.lookAt || `You examine the ${itemData.longName || itemName}.`

            // For link items, check if target scene is unlocked and use unlockedMessage if available
            if (itemData.type === 'link' && itemData.linkToScene && itemData.unlockedMessage) {
                const targetSceneState = this.game.sceneManager?.getSceneState(itemData.linkToScene)
                if (targetSceneState && !targetSceneState.locked) {
                    message = itemData.unlockedMessage
                }
            }

            this.showMessage(message)

            // Check if this item has an achievement (for type: "item" or "decor")
            if ((itemData.type === 'item' || itemData.type === 'decor') && itemData.achievement) {
                const achievementId = `examine_${itemData.name}`
                const points = itemData.points || 0

                // Add achievement to journal (only once)
                this.game.achievementManager?.addAchievement(
                    achievementId,
                    itemData.achievement,
                    points,
                    'item'
                )

                // Add score if points specified
                if (points > 0) {
                    this.game.addScore(points, achievementId)
                }
            }
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
        // Check item type - only 'item' type can be picked up
        const itemData = this.game.inventoryManager?.getItemData(itemName)

        if (itemType === 'target' || itemType === 'link' || itemType === 'character' || itemData?.type === 'decor') {
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
            this.showMessage("You must have something to use it....")
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
     * Show character quiz dialog
     * @param {string} itemName - Character item name
     * @param {Object} itemData - Character item data
     */
    showCharacterQuiz(itemName, itemData) {
        if (!itemData || !itemData.question || !itemData.answers) {
            this.showMessage("This character has nothing to say.")
            return
        }

        // Check if already answered correctly
        const answeredKey = `character_${itemName}_answered`
        const alreadyAnswered = this.game.stateManager?.getState(answeredKey)

        if (alreadyAnswered) {
            this.showMessage(itemData.lookAt || "You've already spoken with this character.")
            return
        }

        // Create quiz modal
        const modal = document.createElement('div')
        modal.className = 'character-quiz-modal'
        modal.innerHTML = `
            <div class="character-quiz-container">
                <div class="character-quiz-question">${itemData.question}</div>
                <div class="character-quiz-answers">
                    ${itemData.answers.map((answer, index) => `
                        <button class="character-quiz-answer" data-index="${index}">
                            ${answer.text}
                        </button>
                    `).join('')}
                </div>
            </div>
        `

        // Add to DOM
        document.body.appendChild(modal)

        // Handle answer clicks
        const answerButtons = modal.querySelectorAll('.character-quiz-answer')
        answerButtons.forEach(button => {
            button.addEventListener('click', () => {
                const answerIndex = parseInt(button.dataset.index)
                const selectedAnswer = itemData.answers[answerIndex]

                // Handle correct/incorrect
                if (selectedAnswer.isCorrect) {
                    // Mark as answered correctly
                    this.game.stateManager?.setState(answeredKey, true)

                    // Remove modal
                    modal.remove()

                    // Show correct message
                    const message = itemData.correctMessage || "Correct!"
                    this.showMessage(message)

                    // Award points if specified
                    if (itemData.points) {
                        const achievementId = `character_${itemName}_correct`
                        this.game.addScore(itemData.points, achievementId)
                    }

                    // Add achievement (with or without points)
                    if (itemData.achievement) {
                        const achievementId = `character_${itemName}_achievement`
                        this.game.achievementManager?.addAchievement(
                            achievementId,
                            itemData.achievement,
                            itemData.points || 0,
                            'character'
                        )
                    }

                    // Give reward item
                    if (itemData.reward) {
                        // Normalize outcome to array for easier checking
                        const outcomes = Array.isArray(itemData.outcome) ? itemData.outcome : [itemData.outcome]

                        // Determine where to add the reward based on outcome
                        if (outcomes.includes('scene')) {
                            // Add to scene
                            this.game.sceneManager?.addItemToScene(itemData.reward)
                            this.updateSceneItems()
                            const rewardData = this.game.inventoryManager?.getItemData(itemData.reward)
                            const rewardMessage = `${rewardData?.longName || itemData.reward} appeared in the scene!`
                            setTimeout(() => this.showMessage(rewardMessage), 2000)
                        } else {
                            // Default: add to inventory (keep)
                            const rewardAdded = this.game.inventoryManager?.addItem(itemData.reward)
                            if (rewardAdded) {
                                const rewardData = this.game.inventoryManager?.getItemData(itemData.reward)
                                const rewardMessage = `You received: ${rewardData?.longName || itemData.reward}`
                                setTimeout(() => this.showMessage(rewardMessage), 2000)
                            }
                        }
                    }
                } else {
                    // Wrong answer - deduct 25 points
                    const currentScore = this.game.score || 0
                    const newScore = Math.max(0, currentScore - 25)
                    this.game.score = newScore
                    this.updateScore()

                    // Show incorrect message with point penalty
                    const message = itemData.incorrectMessage || "That's not correct. -25 points!"
                    this.showMessage(message)

                    // Modal stays open - user can try again
                    // Optionally add visual feedback to the wrong button
                    button.classList.add('wrong-answer')
                    setTimeout(() => {
                        button.classList.remove('wrong-answer')
                    }, 500)
                }
            })
        })

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove()
            }
        })
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
        this.elements.menuContainer?.classList.toggle('active', this.isMenuOpen)
    }

    /**
     * Close menu
     */
    closeMenu() {
        this.isMenuOpen = false
        this.elements.menuToggle?.classList.remove('on')
        this.elements.menuContainer?.classList.remove('active')
    }

    /**
     * Toggle mute state
     */
    toggleMute() {
        this.emit('muteToggled')

        // Update button state and text
        const isMuted = this.game.audioManager?.getAudioState().isMuted
        this.elements.btnMute?.classList.toggle('active', !isMuted)
        this.elements.btnMute?.classList.toggle('inactive', isMuted)

        // Update button text
        if (this.elements.btnMute) {
            this.elements.btnMute.textContent = isMuted ? 'Unmute' : 'Mute'
        }
    }

    /**
     * Update scene display
     * @param {Object} sceneData - Scene data
     */
    updateScene(sceneData) {
        console.log(`🎬 UIManager.updateScene called with:`, sceneData)

        // Fade out scene container
        const sceneContainer = this.elements.sceneContainer
        if (sceneContainer) {
            sceneContainer.classList.add('scene-transitioning')
        }

        // Wait for fade out, then update content
        setTimeout(() => {
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

            // Store and show scene text
            if (sceneData.textOne) {
                this.currentSceneText = sceneData.textOne

                if (!isSplashScene) {
                    // Show scene text with dismiss button for regular scenes
                    this.showSceneText()
                    this.updateLookButtonImage(true)
                }
            } else {
                this.currentSceneText = ''
                this.updateLookButtonImage(false)
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

            // Fade back in
            if (sceneContainer) {
                sceneContainer.classList.remove('scene-transitioning')
            }
        }, 400) // Match CSS transition duration
    }

    /**
     * Update scene background image and color
     * @param {Object} sceneData - Scene data
     */
    updateSceneBackground(sceneData) {
        const sceneContainer = this.elements.sceneContainer
        if (!sceneContainer) return

        // Set background color (shown behind image or when no image)
        if (sceneData.backgroundColor) {
            sceneContainer.style.backgroundColor = sceneData.backgroundColor
            console.log(`🎨 Set background color: ${sceneData.backgroundColor}`)
        } else {
            sceneContainer.style.backgroundColor = '#000000'
        }

        // Set background image (if specified)
        if (sceneData.backgroundImage) {
            const imagePath = `/src/assets/images/backgrounds/${sceneData.backgroundImage}`
            sceneContainer.style.backgroundImage = `url('${imagePath}')`
            console.log(`🖼️ Set background image: ${imagePath}`)
        } else {
            // Clear background image if not specified
            sceneContainer.style.backgroundImage = ''
            console.log(`🖼️ No background image (using color only)`)
        }
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
                // Only create SceneItem component if item does NOT have animation
                // Items with animation are handled by SceneObject in SceneManager
                if (!itemData.animation) {
                    this.createSceneItemElement(itemData)
                }
            }
        })

        // Create SceneObject instances for animated items
        this.game.sceneManager?.createSceneObjects(this.elements.sceneItemsOverlay)
    }

    /**
     * Create scene item element using component
     * @param {Object} itemData - Item data
     */
    createSceneItemElement(itemData) {
        // Create component instance
        const component = new SceneItem(itemData, this.game)

        // Store component reference
        this.components.set(itemData.name, component)

        // Append to overlay
        const element = component.getElement()
        this.elements.sceneItemsOverlay?.appendChild(element)
    }

    /**
     * Remove scene item element using component or SceneObject
     * @param {string} itemName - Item name
     */
    removeSceneItemElement(itemName) {
        // Try to remove SceneItem component first
        const component = this.components.get(itemName)
        if (component) {
            component.remove('fadeOut')
            this.components.delete(itemName)
            return
        }

        // If not a component, check if it's a SceneObject
        const sceneObject = this.game.sceneManager?.sceneObjects?.get(itemName)
        if (sceneObject) {
            // Fade out and destroy the SceneObject
            if (sceneObject.element) {
                sceneObject.element.style.animation = 'fadeOut 0.3s ease-out'
                setTimeout(() => {
                    sceneObject.destroy()
                    this.game.sceneManager?.sceneObjects?.delete(itemName)
                }, 300)
            } else {
                sceneObject.destroy()
                this.game.sceneManager?.sceneObjects?.delete(itemName)
            }
        }
    }

    /**
     * Update inventory display using components
     * @param {string[]} items - Inventory items
     */
    updateInventory(items) {
        if (!this.elements.sceneInventoryOverlay) return

        // Get all inventory slots
        const slots = this.elements.sceneInventoryOverlay.querySelectorAll('.inventory-slot')

        // Clear existing inventory components
        this.inventoryComponents.forEach(component => component.destroy())
        this.inventoryComponents.clear()

        // Clear all slots
        slots.forEach(slot => {
            slot.innerHTML = ''
        })

        const gameData = this.game.gameData

        // Place items into slots (max 7 items)
        items.slice(0, 7).forEach((itemName, index) => {
            const itemData = gameData.sceneItems?.find(item => item.name === itemName)
            if (itemData && slots[index]) {
                // Create inventory item component
                const component = new InventoryItem(itemData, this.game)

                // Store component reference
                this.inventoryComponents.set(itemName, component)

                // Place item in slot
                slots[index].appendChild(component.getElement())
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
     * @param {boolean} showDismiss - Whether to show dismiss button (default: false)
     */
    showMessage(message, duration = ui.messageDisplayDuration, showDismiss = false) {
        if (!this.elements.panelText || !this.elements.panelTextContent) return

        // If scene text is showing and this is a regular message (examine), dismiss scene text first
        if (this.isSceneTextShowing && !showDismiss) {
            this.isSceneTextShowing = false
        }

        // Remove existing classes
        this.elements.panelText.classList.remove('show', 'persistent')

        // Set message content
        this.elements.panelTextContent.innerHTML = message

        // Show/hide dismiss button and add persistent class if needed
        if (this.elements.btnDismiss) {
            this.elements.btnDismiss.style.display = showDismiss ? 'block' : 'none'
        }

        // Set CSS variable for animation duration
        this.elements.panelText.style.setProperty('--message-duration', `${duration}ms`)

        // Force reflow to restart animation
        void this.elements.panelText.offsetWidth

        // Add show class and persistent class if showing dismiss button
        this.elements.panelText.classList.add('show')
        if (showDismiss) {
            this.elements.panelText.classList.add('persistent')
        }

        // Clear existing timeout
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout)
        }

        // Only auto-clear if not showing dismiss button
        if (!showDismiss) {
            this.messageTimeout = setTimeout(() => {
                this.clearMessage()
            }, duration)
        }
    }

    /**
     * Toggle scene text visibility
     */
    toggleSceneText() {
        if (this.isSceneTextShowing) {
            // Hide the text
            this.dismissMessage()
            this.updateLookButtonImage(false)
        } else {
            // Show the text
            this.showSceneText()
            this.updateLookButtonImage(true)
        }
    }

    /**
     * Update the look button image
     * @param {boolean} isTextShowing - Whether the text is showing
     */
    updateLookButtonImage(isTextShowing) {
        const lookIcon = this.elements.btnLook?.querySelector('.look-icon')
        if (lookIcon) {
            const imagePath = isTextShowing
                ? 'src/assets/images/ui/look-open.png'   // Eye open when text is showing
                : 'src/assets/images/ui/look-closed.png' // Eye closed when text is hidden
            lookIcon.src = imagePath

            // Start blinking if eye is open, stop if closed
            if (isTextShowing) {
                this.startEyeBlink()
            } else {
                this.stopEyeBlink()
            }
        }
    }

    /**
     * Start random eye blink effect
     */
    startEyeBlink() {
        // Clear any existing blink interval
        this.stopEyeBlink()

        const lookIcon = this.elements.btnLook?.querySelector('.look-icon')
        if (!lookIcon) return

        // Random blink every 2-5 seconds
        const scheduleNextBlink = () => {
            const delay = 2000 + Math.random() * 6000 // 2-5 seconds
            this.blinkTimeout = setTimeout(() => {
                this.doBlink()
                scheduleNextBlink()
            }, delay)
        }

        scheduleNextBlink()
    }

    /**
     * Perform a single blink
     */
    doBlink() {
        const lookIcon = this.elements.btnLook?.querySelector('.look-icon')
        if (!lookIcon || !this.isSceneTextShowing) return

        // Close eye briefly
        lookIcon.src = 'src/assets/images/ui/look-closed.png'

        // Open eye after 100-150ms
        setTimeout(() => {
            if (this.isSceneTextShowing) {
                lookIcon.src = 'src/assets/images/ui/look-open.png'
            }
        }, 100 + Math.random() * 50)
    }

    /**
     * Stop eye blink effect
     */
    stopEyeBlink() {
        if (this.blinkTimeout) {
            clearTimeout(this.blinkTimeout)
            this.blinkTimeout = null
        }
    }

    /**
     * Show scene text with dismiss button
     */
    showSceneText() {
        if (!this.currentSceneText) return

        // Get the scene text with visible items appended
        const textWithItems = this.getSceneTextWithItems()

        this.isSceneTextShowing = true
        this.showMessage(textWithItems, 0, true) // 0 duration = no auto-dismiss
    }

    /**
     * Get scene text with visible items appended
     * @returns {string} Scene text with "You see: item1, item2" appended in a div
     */
    getSceneTextWithItems() {
        let text = ''

        // Get current scene data
        const currentScene = this.game.sceneManager?.currentScene

        // Prepend stage title and scene title if available
        if (currentScene) {
            if (currentScene.stage) {
                text += `<h1 class="stage-title body-md text-main-marine text-uppercase">${currentScene.stage}</h1>`
            }
            if (currentScene.title) {
                text += `<h2 class="scene-title body-lg text-main-marine">${currentScene.title}</h2>`
            }
        }

        // Add the scene text
        text += this.currentSceneText

        // Get visible items (non-decor items in current scene)
        const visibleItems = this.getVisibleSceneItems()

        if (visibleItems.length > 0) {
            const itemNames = visibleItems.map(item => item.longName || item.name)
            const itemListItems = itemNames.map(name => `<li>${name}</li>`).join('');
            text += ` <div class="sceneItems"><strong>Items of interest:</strong><ul>${itemListItems}</ul></div>`
        }

        return text
    }

    /**
     * Get visible scene items (excluding decor type)
     * @returns {Array} Array of item data objects
     */
    getVisibleSceneItems() {
        const sceneItems = this.game.sceneManager?.getCurrentSceneItems() || []
        const gameData = this.game.gameData
        const visibleItems = []

        sceneItems.forEach(itemName => {
            const itemData = gameData.sceneItems?.find(item => item.name === itemName)
            if (itemData && itemData.type !== 'decor') {
                visibleItems.push(itemData)
            }
        })

        return visibleItems
    }

    /**
     * Dismiss the current message (scene text or regular message)
     */
    dismissMessage() {
        this.isSceneTextShowing = false
        this.clearMessage()
        this.updateLookButtonImage(false)
    }

    /**
     * Clear current message
     */
    clearMessage() {
        if (this.elements.panelText) {
            this.elements.panelText.classList.remove('show', 'persistent')
        }

        // Clear content immediately
        if (this.elements.panelTextContent) {
            this.elements.panelTextContent.innerHTML = ''
        }

        // Hide dismiss button immediately
        if (this.elements.btnDismiss) {
            this.elements.btnDismiss.style.display = 'none'
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

        // Update mute button text based on current audio state
        const isMuted = this.game.audioManager?.getAudioState().isMuted
        if (this.elements.btnMute) {
            this.elements.btnMute.textContent = isMuted ? 'Unmute' : 'Mute'
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
     * Handle game saved event
     * @param {Object} data - Save data containing slot, timestamp, and isAutoSave flag
     */
    handleGameSaved(data) {
        // Only show message for manual saves, not auto-saves
        if (!data.isAutoSave) {
            this.showMessage('Progress Saved')
            this.closeMenu()
        }
    }

    /**
     * Handle game loaded event
     */
    handleGameLoaded() {
        this.showMessage('Progress Loaded')
        this.closeMenu()
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
        // Exclude common UI classes and prefixed classes
        const excludedClasses = ['icon-font', 'scene-item', 'scene-target', 'scene-link', 'scene-character', 'scene-decor', 'inventory-item', 'prop', 'scene-object']
        const excludedPrefixes = ['icon-', 'scene-object-', 'item--', 'target--', 'link--', 'character--']

        return classes.find(cls => {
            // Skip if in excluded list
            if (excludedClasses.includes(cls)) return false
            // Skip if starts with excluded prefix
            if (excludedPrefixes.some(prefix => cls.startsWith(prefix))) return false
            return true
        })
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
        if (element.classList.contains('scene-decor')) return 'decor'
        if (element.classList.contains('scene-character')) return 'character'
        if (element.classList.contains('inventory-item')) return 'inventory'

        // For SceneObjects, check the actual item data
        if (element.classList.contains('scene-object')) {
            const itemName = this.getItemNameFromElement(element)
            const itemData = this.game.inventoryManager?.getItemData(itemName)
            return itemData?.type || 'unknown'
        }

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

        // Clear inventory slots (but keep the slots themselves)
        if (this.elements.sceneInventoryOverlay) {
            const slots = this.elements.sceneInventoryOverlay.querySelectorAll('.inventory-slot')
            slots.forEach(slot => {
                slot.innerHTML = ''
            })
        }

        // Clear scene title
        if (this.elements.sceneTitle) {
            this.elements.sceneTitle.textContent = ''
        }

        // Clear background
        if (this.elements.sceneContainer) {
            this.elements.sceneContainer.style.backgroundImage = ''
        }

        // Reset score display
        this.updateScore(0)

        // Clear any active messages and scene text
        this.currentSceneText = ''
        this.isSceneTextShowing = false
        this.clearMessage()

        // Stop eye blink effect
        this.stopEyeBlink()

        console.log('✅ Scene UI cleared')
    }

    /**
     * Toggle journal modal open/closed
     */
    toggleJournal() {
        if (!this.elements.journalModal) {
            console.warn('Journal modal not found')
            return
        }

        // Check if modal is currently open
        const isOpen = this.elements.journalModal.classList.contains('active')

        if (isOpen) {
            // Close modal
            this.elements.journalModal.classList.remove('active')
        } else {
            // Open modal - get journal entries from achievement manager
            const journal = this.game.achievementManager?.getJournal() || []

            // Populate journal entries
            this.populateJournal(journal)

            // Show modal
            this.elements.journalModal.classList.add('active')
        }
    }

    /**
     * Populate journal with entries
     * @param {Array} journal - Array of journal entries
     */
    populateJournal(journal) {
        if (!this.elements.journalEntries) return

        // Clear existing entries
        this.elements.journalEntries.innerHTML = ''

        // Sort by timestamp (newest first)
        const sortedJournal = [...journal].sort((a, b) => b.timestamp - a.timestamp)

        // Create entry elements
        sortedJournal.forEach(entry => {
            const entryEl = document.createElement('div')
            entryEl.className = 'journal-entry p-md mb-xs'

            const header = document.createElement('div')
            header.className = 'journal-entry-header'

            const type = document.createElement('span')
            type.className = 'journal-entry-type'
            type.textContent = entry.type || 'achievement'

            const points = document.createElement('span')
            points.className = 'journal-entry-points'
            points.textContent = entry.points > 0 ? `+${entry.points} pts` : ''

            // header.appendChild(type)
            header.appendChild(points)

            const text = document.createElement('div')
            text.className = 'journal-entry-text'
            text.textContent = entry.text

            const date = document.createElement('div')
            date.className = 'journal-entry-date'
            date.textContent = new Date(entry.timestamp).toLocaleString()

            entryEl.appendChild(header)
            entryEl.appendChild(text)
            // entryEl.appendChild(date)

            this.elements.journalEntries.appendChild(entryEl)
        })

        // Calculate and display total points
        const totalPoints = this.game.achievementManager?.getTotalPoints() || 0
        const winPoints = this.game.gameConfig?.gameplay?.win || 60

        if (this.elements.journalTotalPoints) {
            this.elements.journalTotalPoints.textContent = totalPoints
        }
        if (this.elements.journalTotalGoal) {
            this.elements.journalTotalGoal.textContent = `/ ${winPoints}`
        }

        // Check if player has won
        if (totalPoints >= winPoints) {
            console.log('🎉 Player has achieved winning points!')
        }
    }

    /**
     * Destroy the UI manager
     */
    destroy() {
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout)
        }

        // Stop eye blink effect
        this.stopEyeBlink()

        // Clean up all components
        this.components.forEach(component => component.destroy())
        this.components.clear()

        this.inventoryComponents.forEach(component => component.destroy())
        this.inventoryComponents.clear()

        this.elements = {}
        this.removeAllListeners()
    }
}
