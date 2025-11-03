# Puzzles Directory

This directory contains standalone puzzle mini-games that can be integrated into adventure game scenes.

## 📁 Available Puzzles

### SafeCombinationPuzzle.js
A combination lock puzzle where players must enter the correct sequence of numbers.

**Features:**
- Configurable number of dials
- Adjustable dial range (0-9, 0-99, etc.)
- Hint system
- Attempt limiting
- Progress saving

**Configuration Example:**
```javascript
puzzleConfig: {
    solution: [3, 7, 2],
    maxAttempts: 10,
    dialCount: 3,
    dialMax: 9,
    hints: ["Hint 1", "Hint 2"],
    reward: "gold_bars",
    points: 50,
    returnScene: "vault_room"
}
```

---

## 🎮 Creating a New Puzzle

### 1. Create Puzzle Class

Create a new file in this directory (e.g., `SlidingTilePuzzle.js`):

```javascript
export class SlidingTilePuzzle {
    constructor(container, config, callbacks, game) {
        this.container = container  // DOM element to render into
        this.config = config        // Puzzle configuration from gameData
        this.callbacks = callbacks  // { onComplete, onCancel, onStateChange }
        this.game = game           // Access to game systems
        
        // Your puzzle state
        this.state = {
            tiles: [],
            moves: 0,
            completed: false
        }
    }
    
    async init() {
        // Initialize your puzzle
        this.render()
        this.attachEventListeners()
    }
    
    render() {
        // Create your puzzle UI
        this.container.innerHTML = `
            <div class="sliding-puzzle">
                <!-- Your puzzle HTML -->
            </div>
        `
    }
    
    attachEventListeners() {
        // Handle user interactions
    }
    
    checkSolution() {
        // Check if puzzle is solved
        if (this.isSolved()) {
            this.callbacks.onComplete({
                success: true,
                reward: this.config.reward,
                moves: this.state.moves
            })
        }
    }
    
    loadProgress(savedState) {
        // Restore saved progress (optional)
        if (savedState) {
            this.state = savedState
            this.render()
        }
    }
    
    destroy() {
        // Clean up when puzzle is closed
        this.container.innerHTML = ''
    }
}
```

### 2. Add Styles

Add puzzle-specific styles to `src/styles/_puzzle.scss`:

```scss
.sliding-puzzle {
  background: rgba($dark-marine, 0.95);
  border-radius: $border-radius-xl;
  padding: $spacing-xxl;
  
  // Your puzzle styles
}
```

### 3. Configure in gameData.js

```javascript
{
    sceneName: "sliding_puzzle_scene",
    sceneType: "puzzle",
    puzzleModule: "SlidingTilePuzzle",  // Must match class name
    puzzleConfig: {
        gridSize: 3,  // 3x3 grid
        reward: "puzzle_piece",
        points: 75,
        returnScene: "previous_scene"
    },
    backgroundImage: "puzzle-bg.png"
}
```

---

## 🔧 Puzzle Class API

### Constructor Parameters

- **`container`** (HTMLElement) - DOM element to render puzzle into
- **`config`** (Object) - Puzzle configuration from `puzzleConfig` in gameData
- **`callbacks`** (Object) - Callback functions:
  - `onComplete(result)` - Called when puzzle is solved
  - `onCancel()` - Called when player cancels puzzle
  - `onStateChange(state)` - Called when state changes (for auto-save)
- **`game`** (Game) - Reference to main game instance

### Required Methods

- **`async init()`** - Initialize and render the puzzle
- **`destroy()`** - Clean up when puzzle is closed

### Optional Methods

- **`loadProgress(savedState)`** - Restore saved progress
- **`render()`** - Render/update puzzle UI
- **`attachEventListeners()`** - Set up event handlers

### Accessing Game Systems

```javascript
// Play sounds
this.game.audioManager.playSound('success')

// Show messages
this.game.uiManager.showMessage('Puzzle solved!')

// Add items
this.game.inventoryManager.addItem('reward_item')

// Get scene state
const sceneState = this.game.sceneManager.getSceneState('scene_name')
```

---

## 📊 Puzzle State Management

### Auto-Save Progress

Call `onStateChange` callback to save progress:

```javascript
updateState() {
    this.state.moves++
    this.callbacks.onStateChange(this.state)  // Auto-saves
}
```

### Load Saved Progress

Implement `loadProgress()` to restore state:

```javascript
loadProgress(savedState) {
    if (savedState) {
        this.state = savedState
        this.render()  // Re-render with saved state
    }
}
```

---

## 🎯 Completion Handling

### Success

```javascript
this.callbacks.onComplete({
    success: true,
    reward: this.config.reward,  // Item to give player
    // Optional: additional data
    score: 100,
    time: 45.2
})
```

This will:
1. Award points (from `puzzleConfig.points`)
2. Give reward item to inventory
3. Unlock scenes (if `puzzleConfig.unlockScene` specified)
4. Return to previous scene

### Cancellation

```javascript
this.callbacks.onCancel()
```

Returns player to previous scene without rewards.

---

## 🎨 Styling Guidelines

### Use Existing SASS Variables

```scss
@use 'variables' as *;
@use 'mixins' as *;

.your-puzzle {
    background: rgba($dark-marine, 0.95);
    border-radius: $border-radius-xl;
    padding: $spacing-xxl;
    @include shadow-xl;
    
    .puzzle-button {
        background: $main-blue;
        color: $light-yellow;
        @include body-lg;
    }
}
```

### Responsive Design

```scss
@media (max-width: 768px) {
    .your-puzzle {
        padding: $spacing-lg;
        font-size: $font-size-md;
    }
}
```

---

## 💡 Best Practices

### 1. Keep Puzzles Self-Contained
- Don't modify global game state directly
- Use callbacks for game interactions
- Clean up in `destroy()`

### 2. Provide Visual Feedback
```javascript
showMessage(text, type) {
    const msg = this.container.querySelector('.puzzle-message')
    msg.textContent = text
    msg.className = `puzzle-message ${type}`
}
```

### 3. Handle Edge Cases
```javascript
handleSubmit() {
    if (this.state.attempts >= this.config.maxAttempts) {
        this.showMessage('Out of attempts!', 'error')
        setTimeout(() => this.callbacks.onCancel(), 2000)
        return
    }
    // ... check solution
}
```

### 4. Use Game Audio
```javascript
// Success sound
this.game.audioManager.playSound('success')

// Error sound
this.game.audioManager.playSound('error')

// Click sound
this.game.audioManager.playSound('useItem')
```

### 5. Save State Frequently
```javascript
handleMove() {
    this.state.moves++
    this.callbacks.onStateChange(this.state)  // Save after each move
}
```

---

## 🚀 Example Puzzle Ideas

### Simple Puzzles
- **Number Guessing** - Guess a random number
- **Color Matching** - Match color sequences
- **Simon Says** - Repeat patterns
- **Tic Tac Toe** - Beat the AI

### Medium Puzzles
- **Sliding Tiles** - Arrange tiles in order
- **Wire Connections** - Connect matching endpoints
- **Memory Cards** - Find matching pairs
- **Maze Navigation** - Find the exit

### Complex Puzzles
- **Jigsaw Puzzle** - Arrange image pieces
- **Sudoku** - Fill the grid
- **Chess Puzzle** - Checkmate in N moves
- **Physics Puzzle** - Stack objects to reach goal

---

## 📝 Testing Checklist

- [ ] Puzzle renders correctly
- [ ] All interactions work
- [ ] Solution checking works
- [ ] Completion callback fires
- [ ] Reward item is given
- [ ] Points are awarded
- [ ] State saves and restores
- [ ] Cancel button works
- [ ] Responsive on mobile
- [ ] Sounds play correctly
- [ ] No console errors

---

## 🎉 Happy Puzzle Creating!

Each puzzle is a standalone mini-game. Be creative and have fun!

