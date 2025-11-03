# Puzzle Integration Guide

## Complete Working Example - Safe Combination Puzzle

This guide shows you how to integrate standalone puzzle mini-games into your adventure game.

---

## 📁 Files Created

1. **`src/core/PuzzleManager.js`** - Manages puzzle lifecycle
2. **`src/puzzles/SafeCombinationPuzzle.js`** - Example puzzle implementation
3. **`src/styles/_puzzle.scss`** - Puzzle styling
4. **Updated `src/core/Game.js`** - Integrated PuzzleManager
5. **Updated `src/core/UIManager.js`** - Handles puzzle scene detection

---

## 🎮 How to Add a Puzzle Scene

### Step 1: Add Entry Point in Main Scene

Add a link item that takes the player to the puzzle scene:

```javascript
// In gameData.js - sceneItems array
{
    name: "safe_door",
    longName: "Mysterious Safe",
    type: "link",
    linkToScene: "safe_puzzle",  // ← Links to puzzle scene
    lookAt: "A heavy safe with a combination lock. It looks like it needs a 3-digit code.",
    image: "safe-small.png",
    position: [400, 300],
    size: [150, 200]
}
```

Add this item to a scene:

```javascript
// In gameData.js - scenes array
{
    sceneName: "vault_room",
    title: "The Vault Room",
    textOne: "A large safe dominates the room.",
    stage: "Stage 5",
    stageNumber: 5,
    sceneType: "indoor",
    sceneMusic: "ambient5",
    backgroundImage: "vault-room.png",
    items: ["safe_door"]  // ← Add the link item here
}
```

### Step 2: Add Puzzle Scene Configuration

```javascript
// In gameData.js - scenes array
{
    sceneName: "safe_puzzle",
    title: "Safe Combination Lock",
    textOne: "Enter the correct combination to unlock the safe.",
    stage: "Stage 5",
    stageNumber: 5,
    sceneType: "puzzle",  // ← IMPORTANT: Mark as puzzle scene
    
    // Puzzle-specific configuration
    puzzleModule: "SafeCombinationPuzzle",  // ← Which puzzle class to load
    puzzleConfig: {
        solution: [3, 7, 2],           // Correct combination
        maxAttempts: 10,               // Maximum tries
        dialCount: 3,                  // Number of dials
        dialMax: 9,                    // Max value per dial (0-9)
        hints: [                       // Available hints
            "The first number is less than 5",
            "The middle number is greater than 5",
            "The last number is even"
        ],
        reward: "gold_bars",           // Item given on success
        points: 50,                    // Points awarded
        returnScene: "vault_room",     // Where to go after completion
        unlockScene: "treasure_room"   // Optional: unlock another scene
    },
    
    backgroundImage: "safe-closeup.png",
    sceneMusic: "ambient5",
    items: []  // Puzzle scenes don't use traditional items
}
```

### Step 3: Add Reward Item

```javascript
// In gameData.js - sceneItems array
{
    name: "gold_bars",
    longName: "Gold Bars",
    type: "item",
    lookAt: "Shiny gold bars! These must be worth a fortune.",
    pickUpMessage: "You obtained the gold bars from the safe!",
    image: "gold-bars.png",
    position: [0, 0],  // Not used for puzzle rewards
    size: [0, 0]
}
```

---

## 🎯 Complete Example in gameData.js

```javascript
export const gameData = {
    title: "Adventure Game",
    version: "2.0.0",
    stages: 13,
    
    scenes: [
        // ... other scenes ...
        
        // Main scene with safe
        {
            sceneName: "vault_room",
            title: "The Vault Room",
            textOne: "A large safe dominates the room. Maybe you can crack the code?",
            stage: "Stage 5",
            stageNumber: 5,
            sceneType: "indoor",
            sceneMusic: "ambient5",
            backgroundImage: "vault-room.png",
            items: ["safe_door", "desk", "chair"]
        },
        
        // Puzzle scene
        {
            sceneName: "safe_puzzle",
            title: "Safe Combination Lock",
            textOne: "Enter the correct combination.",
            stage: "Stage 5",
            stageNumber: 5,
            sceneType: "puzzle",
            puzzleModule: "SafeCombinationPuzzle",
            puzzleConfig: {
                solution: [3, 7, 2],
                maxAttempts: 10,
                dialCount: 3,
                dialMax: 9,
                hints: [
                    "The first number is less than 5",
                    "The middle number is greater than 5",
                    "The last number is even"
                ],
                reward: "gold_bars",
                points: 50,
                returnScene: "vault_room",
                unlockScene: "treasure_room"
            },
            backgroundImage: "safe-closeup.png",
            sceneMusic: "ambient5",
            items: []
        },
        
        // Unlocked after puzzle
        {
            sceneName: "treasure_room",
            title: "The Treasure Room",
            textOne: "The safe opened! Inside is a hidden passage to a treasure room!",
            stage: "Stage 6",
            stageNumber: 6,
            sceneType: "treasure",
            sceneMusic: "ambient6",
            backgroundImage: "treasure-room.png",
            items: ["diamond", "crown"],
            locked: true  // Unlocked by completing safe puzzle
        }
    ],
    
    sceneItems: [
        // ... other items ...
        
        // Link to puzzle
        {
            name: "safe_door",
            longName: "Mysterious Safe",
            type: "link",
            linkToScene: "safe_puzzle",
            lookAt: "A heavy safe with a combination lock.",
            image: "safe-small.png",
            position: [400, 300],
            size: [150, 200]
        },
        
        // Puzzle reward
        {
            name: "gold_bars",
            longName: "Gold Bars",
            type: "item",
            lookAt: "Shiny gold bars!",
            pickUpMessage: "You obtained the gold bars!",
            image: "gold-bars.png",
            position: [0, 0],
            size: [0, 0]
        }
    ]
}
```

---

## 🔧 How It Works

### 1. Player Flow

```
1. Player is in vault_room
   ↓
2. Player clicks on safe_door (link item)
   ↓
3. SceneManager.changeScene("safe_puzzle")
   ↓
4. UIManager detects sceneType: "puzzle"
   ↓
5. UIManager hides normal game UI (inventory, actions, etc.)
   ↓
6. PuzzleManager.loadPuzzle() is called
   ↓
7. SafeCombinationPuzzle module is dynamically imported
   ↓
8. Puzzle renders in puzzle-container
   ↓
9. Player interacts with puzzle (turn dials, submit)
   ↓
10. If correct: onComplete callback fires
    ↓
11. Game awards points, gives reward item
    ↓
12. Unlocks treasure_room scene
    ↓
13. Returns to vault_room
    ↓
14. Normal UI restored
```

### 2. Puzzle State Persistence

Puzzles automatically save progress:

```javascript
// Saved in scene state
sceneState.customState = {
    puzzleProgress: {
        combination: [3, 0, 0],
        attempts: 2,
        hintsUsed: ["The first number is less than 5"]
    },
    puzzleCompleted: false
}
```

If player leaves and returns, progress is restored!

### 3. Puzzle Completion

When puzzle is solved:

```javascript
// PuzzleManager.handlePuzzleComplete()
1. Awards points (with achievement tracking)
2. Gives reward item to inventory
3. Unlocks next scene (if specified)
4. Marks puzzle as completed
5. Returns to previous scene
```

---

## 🎨 Creating Your Own Puzzles

### Puzzle Class Template

```javascript
// src/puzzles/YourPuzzle.js
export class YourPuzzle {
    constructor(container, config, callbacks, game) {
        this.container = container
        this.config = config
        this.callbacks = callbacks
        this.game = game
        this.state = { /* your puzzle state */ }
    }
    
    async init() {
        // Initialize puzzle
        this.render()
        this.attachEventListeners()
    }
    
    render() {
        // Create HTML/Canvas for your puzzle
        this.container.innerHTML = `
            <div class="your-puzzle">
                <!-- Your puzzle UI -->
            </div>
        `
    }
    
    attachEventListeners() {
        // Handle user interactions
    }
    
    checkSolution() {
        // Check if puzzle is solved
        if (solved) {
            this.callbacks.onComplete({
                success: true,
                reward: this.config.reward
            })
        }
    }
    
    loadProgress(savedState) {
        // Restore saved progress
        this.state = savedState
    }
    
    destroy() {
        // Clean up
        this.container.innerHTML = ''
    }
}
```

### Add to gameData.js

```javascript
{
    sceneName: "your_puzzle_scene",
    sceneType: "puzzle",
    puzzleModule: "YourPuzzle",  // ← Must match class name
    puzzleConfig: {
        // Your puzzle-specific config
        reward: "special_item",
        points: 100,
        returnScene: "previous_scene"
    }
}
```

---

## 🎯 Puzzle Types You Can Create

- **Combination Locks** ✅ (Already implemented)
- **Sliding Tile Puzzles** (8-puzzle, 15-puzzle)
- **Wire Connection Puzzles** (Connect matching wires)
- **Memory Card Games** (Match pairs)
- **Lockpicking** (Timing-based)
- **Code Ciphers** (Decode messages)
- **Maze Navigation** (Find the exit)
- **Pattern Matching** (Repeat sequences)
- **Jigsaw Puzzles** (Arrange pieces)
- **Logic Puzzles** (Sudoku, etc.)

Each puzzle is completely independent!

---

## 🚀 Testing Your Puzzle

1. Add puzzle scene to gameData.js
2. Add link item to access it
3. Run `npm run dev`
4. Navigate to the scene with the link
5. Click the link to enter puzzle
6. Test puzzle mechanics
7. Verify completion rewards work
8. Check state persistence (leave and return)

---

## 📝 Notes

- Puzzles are **completely isolated** from the main game
- Each puzzle can use **any technology** (Canvas, SVG, HTML, etc.)
- Puzzle state is **automatically saved** with game saves
- Puzzles can **unlock scenes**, **give items**, and **award points**
- **No limit** to puzzle complexity - they're standalone mini-games!

---

## 🎉 You're Ready!

The puzzle system is fully integrated and ready to use. Just add your puzzle scenes to gameData.js and create your puzzle classes in `/src/puzzles/`!

