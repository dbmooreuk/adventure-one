/**
 * Safe Combination Puzzle
 * A standalone puzzle mini-game where players must enter the correct combination
 */

export class SafeCombinationPuzzle {
    constructor(container, config, callbacks, game) {
        this.container = container
        this.config = config
        this.callbacks = callbacks
        this.game = game

        // Puzzle state
        this.state = {
            combination: [0, 0, 0],
            attempts: 0,
            hintsUsed: [],
            isLocked: true
        }

        // Default configuration
        this.defaults = {
            solution: [3, 7, 2],
            maxAttempts: 10,
            dialCount: 3,
            dialMax: 9,
            hints: [
                "The first number is less than 5",
                "The middle number is greater than 5",
                "The last number is even"
            ],
            reward: "gold_bars"
        }

        // Merge config with defaults
        this.puzzleConfig = { ...this.defaults, ...config }

        // DOM elements
        this.elements = {}
    }

    /**
     * Initialize the puzzle
     */
    async init() {
        console.log('🔐 Initializing Safe Combination Puzzle...')
        this.render()
        this.attachEventListeners()
        console.log('✅ Safe puzzle initialized')
    }

    /**
     * Render the puzzle HTML
     */
    render() {
        const { dialCount, maxAttempts, hints } = this.puzzleConfig
        const { attempts, combination } = this.state

        this.container.innerHTML = `
            <div class="safe-puzzle">
                <div class="safe-puzzle-header">
                
                    <p class="safe-puzzle-subtitle">Enter the correct ${dialCount}-digit combination</p>
                    <div class="safe-puzzle-attempts">
                        Attempts: <span class="attempts-count">${attempts}</span> / ${maxAttempts}
                    </div>
                </div>

                <div class="safe-puzzle-body">
                    <div class="safe-dials">
                        ${this.renderDials()}
                    </div>



                    <div class="safe-controls ">
                        <button class="btn btn-puzzle btn-submit">
                            <span>🔓</span> Try Combination
                        </button>
                        <button class="btn btn-puzzle btn-hint" ${this.state.hintsUsed.length >= hints.length ? 'disabled' : ''}>
                            <span>💡</span> Get Hint (${hints.length - this.state.hintsUsed.length} left)
                        </button>
                    </div>

                    <div class="safe-hints">
                        ${this.state.hintsUsed.map(hint => `
                            <div class="hint-item">💡 ${hint}</div>
                        `).join('')}
                    </div>

                    <div class="safe-message"></div>
                </div>
            </div>
        `

        // Store element references
        this.elements.dials = this.container.querySelectorAll('.dial')
        this.elements.displayNumbers = this.container.querySelectorAll('.display-number')
        this.elements.submitBtn = this.container.querySelector('.btn-submit')
        this.elements.hintBtn = this.container.querySelector('.btn-hint')
        this.elements.message = this.container.querySelector('.safe-message')
        this.elements.attemptsCount = this.container.querySelector('.attempts-count')
        this.elements.hintsContainer = this.container.querySelector('.safe-hints')
    }

    /**
     * Render the dial controls
     */
    renderDials() {
        const { dialCount } = this.puzzleConfig
        const { combination } = this.state

        return Array.from({ length: dialCount }, (_, i) => `
            <div class="dial-container">
                <button class="dial-btn dial-up" data-dial="${i}" data-direction="up">
                    ▲
                </button>
                <div class="dial-value" data-dial="${i}">
                    ${combination[i]}
                </div>
                <button class="dial-btn dial-down" data-dial="${i}" data-direction="down">
                    ▼
                </button>
            </div>
        `).join('')
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Dial buttons
        this.container.querySelectorAll('.dial-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDialClick(e))
        })

        // Submit button
        this.elements.submitBtn?.addEventListener('click', () => this.handleSubmit())

        // Hint button
        this.elements.hintBtn?.addEventListener('click', () => this.handleHint())
    }

    /**
     * Handle dial button clicks
     */
    handleDialClick(e) {
        const dialIndex = parseInt(e.target.dataset.dial)
        const direction = e.target.dataset.direction
        const { dialMax } = this.puzzleConfig

        // Update combination
        if (direction === 'up') {
            this.state.combination[dialIndex] = (this.state.combination[dialIndex] + 1) % (dialMax + 1)
        } else {
            this.state.combination[dialIndex] = (this.state.combination[dialIndex] - 1 + dialMax + 1) % (dialMax + 1)
        }

        // Update display
        this.updateDisplay()

        // Play click sound
        this.game.audioManager?.playSound('useItem')

        // Save state
        this.saveState()
    }

    /**
     * Update the display
     */
    updateDisplay() {
        // Update dial values
        this.container.querySelectorAll('.dial-value').forEach((el, i) => {
            el.textContent = this.state.combination[i]
        })

        // Update display numbers
        this.elements.displayNumbers?.forEach((el, i) => {
            el.textContent = this.state.combination[i]
        })
    }

    /**
     * Handle submit button
     */
    handleSubmit() {
        const { solution } = this.puzzleConfig

        this.state.attempts++
        this.elements.attemptsCount.textContent = this.state.attempts

        // Check if combination is correct
        const isCorrect = this.state.combination.every((num, i) => num === solution[i])

        if (isCorrect) {
            this.handleSuccess()
        } else {
            this.handleFailure()
        }

        this.saveState()
    }

    /**
     * Handle successful combination
     */
    handleSuccess() {
        this.state.isLocked = false
        this.showMessage('✅ Correct! The safe opens...', 'success')
        
        // Disable controls
        this.elements.submitBtn.disabled = true
        this.elements.hintBtn.disabled = true
        this.container.querySelectorAll('.dial-btn').forEach(btn => btn.disabled = true)

        // Play success sound
        this.game.audioManager?.playSound('success')

        // Call completion callback
        setTimeout(() => {
            this.callbacks.onComplete({
                success: true,
                reward: this.puzzleConfig.reward,
                attempts: this.state.attempts
            })
        }, 1500)
    }

    /**
     * Handle failed attempt
     */
    handleFailure() {
        const { maxAttempts } = this.puzzleConfig
        const remainingAttempts = maxAttempts - this.state.attempts

        if (remainingAttempts <= 0) {
            this.showMessage('❌ Out of attempts! The safe remains locked.', 'error')
            this.game.audioManager?.playSound('error')
            
            // Disable controls
            this.elements.submitBtn.disabled = true
            this.container.querySelectorAll('.dial-btn').forEach(btn => btn.disabled = true)

            // Return to scene after delay
            setTimeout(() => {
                this.callbacks.onCancel()
            }, 2000)
        } else {
            this.showMessage(`❌ Incorrect! ${remainingAttempts} attempts remaining.`, 'error')
            this.game.audioManager?.playSound('error')
        }
    }

    /**
     * Handle hint button
     */
    handleHint() {
        const { hints } = this.puzzleConfig
        const availableHints = hints.filter(h => !this.state.hintsUsed.includes(h))

        if (availableHints.length > 0) {
            const hint = availableHints[0]
            this.state.hintsUsed.push(hint)

            // Re-render to show new hint
            this.render()
            this.attachEventListeners()

            this.showMessage(`💡 Hint: ${hint}`, 'info')
            this.saveState()
        }
    }



    /**
     * Show message
     */
    showMessage(text, type = 'info') {
        if (this.elements.message) {
            this.elements.message.textContent = text
            this.elements.message.className = `safe-message ${type}`
            this.elements.message.style.display = 'block'
        }
    }

    /**
     * Save current state
     */
    saveState() {
        this.callbacks.onStateChange?.(this.state)
    }

    /**
     * Load saved progress
     */
    loadProgress(savedState) {
        if (savedState) {
            this.state = { ...this.state, ...savedState }
            this.render()
            this.attachEventListeners()
            console.log('📂 Loaded puzzle progress:', this.state)
        }
    }

    /**
     * Destroy the puzzle and clean up
     */
    destroy() {
        console.log('🧹 Destroying Safe Combination Puzzle...')
        
        // Remove event listeners (handled by clearing innerHTML)
        this.container.innerHTML = ''
        this.elements = {}
    }
}

