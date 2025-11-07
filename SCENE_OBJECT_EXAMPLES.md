# SceneObject System - Quick Examples

## SceneManager Integration Example

Here's how SceneManager integrates with SceneObject:

```javascript
// In SceneManager.js

import { SceneObject } from './SceneObject.js'

export class SceneManager extends EventEmitter {
    constructor(game) {
        super()
        this.sceneObjects = new Map() // Track SceneObject instances
    }

    /**
     * Create SceneObject instances for animated items
     */
    createSceneObjects(sceneContainer) {
        // Clean up existing objects
        this.destroySceneObjects()

        const sceneItems = this.getCurrentSceneItems()
        const gameData = this.game.gameData

        sceneItems.forEach(itemName => {
            const itemData = gameData.sceneItems?.find(item => item.name === itemName)
            
            // Only create SceneObject if item has animation
            if (itemData && itemData.animation) {
                const sceneObject = new SceneObject(itemData, sceneContainer, this.game)
                sceneObject.init()
                this.sceneObjects.set(itemName, sceneObject)
            }
        })
    }

    /**
     * Destroy all SceneObjects
     */
    destroySceneObjects() {
        this.sceneObjects.forEach(sceneObject => sceneObject.destroy())
        this.sceneObjects.clear()
    }
}
```

## UIManager Integration Example

```javascript
// In UIManager.js

updateSceneItems() {
    this.elements.sceneItemsOverlay.innerHTML = ''

    const sceneItems = this.game.sceneManager?.getCurrentSceneItems() || []
    const gameData = this.game.gameData

    sceneItems.forEach(itemName => {
        const itemData = gameData.sceneItems?.find(item => item.name === itemName)
        if (itemData) {
            // Items WITHOUT animation → use SceneItem component
            if (!itemData.animation) {
                this.createSceneItemElement(itemData)
            }
            // Items WITH animation → handled by SceneObject
        }
    })

    // Create SceneObject instances for animated items
    this.game.sceneManager?.createSceneObjects(this.elements.sceneItemsOverlay)
}
```

## Example Item Definitions

### 1. Bobbing Torch (Transform Animation)

```javascript
{
    name: "torch",
    longName: "Wooden Torch",
    type: "item",
    lookAt: "A sturdy wooden torch that could provide light in dark places.",
    pickUpMessage: "You pick up the torch.",
    useWith: "darkness",
    useResult: "light",
    outcome: "keep",
    points: 10,
    
    // Visual
    image: "torch.png",
    position: [100, 150],
    size: [50, 80],
    
    // Animation - vertical bobbing
    animation: {
        type: "bob",
        amplitude: 5,    // moves 5px up and down
        speed: 1         // normal speed
    },
    
    // Interactions
    onClickEffect: "flash",
    onClickSound: "pickup",
    hitW: 80,           // larger touch area
    hitH: 100
}
```

### 2. Pulsing Crystal (Transform Animation)

```javascript
{
    name: "crystal",
    longName: "Glowing Crystal",
    type: "item",
    lookAt: "A beautiful crystal that glows with an inner light.",
    pickUpMessage: "The crystal feels warm in your hands.",
    useWith: "darkness",
    useResult: "revelation",
    outcome: "keep",
    points: 40,
    
    image: "crystal.png",
    position: [200, 150],
    size: [40, 60],
    
    // Animation - fading glow
    animation: {
        type: "fade",
        speed: 1.5       // faster fade cycle
    },
    
    onClickEffect: "flash",
    onClickSound: "success"
}
```

### 3. Spinning Gear (Transform Animation)

```javascript
{
    name: "gear",
    longName: "Mechanical Gear",
    type: "item",
    lookAt: "A brass gear that's constantly rotating.",
    pickUpMessage: "You pick up the spinning gear.",
    position: [400, 300],
    size: [60, 60],
    image: "gear.png",
    
    // Animation - continuous rotation
    animation: {
        type: "spin",
        speed: 0.5       // half speed rotation
    },
    
    onClickEffect: "shake",
    onClickSound: "pickup"
}
```

### 4. Butterfly (Sprite Frame Animation)

```javascript
{
    name: "butterfly",
    longName: "Butterfly",
    type: "decor",      // decorative, can't be picked up
    lookAt: "A beautiful butterfly fluttering around.",
    position: [300, 100],
    size: [64, 64],
    
    // Animation - frame-by-frame
    animation: {
        type: "sprite",
        fps: 12,
        frames: [
            "butterfly-frame-1.png",
            "butterfly-frame-2.png",
            "butterfly-frame-3.png",
            "butterfly-frame-4.png"
        ]
    },
    
    onClickEffect: "bounce",
    onClickSound: "success"
}
```

### 5. Ceiling Fan (Sprite Sheet Animation)

```javascript
{
    name: "fan_blade",
    longName: "Spinning Fan",
    type: "decor",
    lookAt: "An old ceiling fan spinning slowly.",
    position: [500, 200],
    size: [128, 128],
    
    // Animation - sprite sheet
    animation: {
        type: "sprite",
        spriteSheet: "fan-sprite-sheet.png",  // single image with all frames
        frameWidth: 128,                       // width of each frame
        frameHeight: 128,                      // height of each frame
        frameCount: 8,                         // total frames in sheet
        fps: 10                                // playback speed
    },
    
    onClickSound: "useItem"
}
```

### 6. Locked Chest (Puzzle Trigger)

```javascript
{
    name: "locked_chest",
    longName: "Locked Chest",
    type: "target",
    lookAt: "A mysterious chest with a combination lock.",
    position: [600, 350],
    size: [120, 100],
    image: "chest-locked.png",
    
    // Animation - subtle pulse
    animation: {
        type: "pulse",
        amplitude: 5,
        speed: 0.5
    },
    
    // Interactions
    onClickEffect: "shake",
    onClickSound: "useItem",
    
    // Trigger puzzle on click
    triggerPuzzle: {
        module: "ChestPuzzle",
        config: {
            solution: [1, 2, 3],
            reward: "treasure_key"
        }
    },
    
    // Larger touch area for mobile
    hitW: 150,
    hitH: 130
}
```

### 7. Portal Link (Scene Navigation)

```javascript
{
    name: "portal",
    longName: "Mystical Portal",
    type: "link",
    lookAt: "A swirling portal that leads to another realm.",
    position: [400, 250],
    size: [100, 150],
    image: "portal.png",
    
    // Animation - spinning portal
    animation: {
        type: "spin",
        speed: 0.3
    },
    
    // Navigate to scene on click
    linkToScene: "scene5",
    
    onClickEffect: "flash",
    onClickSound: "sceneChange",
    hitW: 130,
    hitH: 180
}
```

## Adding Items to Scenes

```javascript
// In gameData.js scenes array:
{
    sceneName: "scene1",
    title: "The Stasis Chamber",
    textOne: "You find yourself in a mysterious chamber...",
    stage: "Stage 1",
    stageNumber: 1,
    sceneType: "scene",
    sceneMusic: "ambient1",
    backgroundImage: "screen-stasis.png",
    
    // Add item names here
    items: [
        "torch",        // bobbing torch
        "rope",         // pulsing rope
        "butterfly",    // animated butterfly
        "portal"        // spinning portal
    ]
}
```

## CSS Classes Applied

SceneObject automatically applies these classes:

```css
.scene-object                    /* Base class */
.scene-object-{name}             /* e.g., scene-object-torch */
.scene-object-type-{type}        /* e.g., scene-object-type-item */

/* Click effects (temporary) */
.flash                           /* Brightness flash */
.bounce                          /* Jump animation */
.shake                           /* Horizontal shake */
```

## Performance Tips

1. **Limit animated objects**: Max 5-10 per scene
2. **Use transform animations** for simple effects (better performance)
3. **Use sprite sheets** instead of individual frames
4. **Keep sprite frame counts low**: 8-12 frames ideal
5. **Test on mobile devices**: Animations may perform differently

## Debugging

```javascript
// Check if SceneObject was created
console.log(game.sceneManager.sceneObjects)

// Get specific SceneObject
const torch = game.sceneManager.getSceneObject('torch')
console.log(torch)

// Listen for click events
game.on('sceneObjectClicked', ({ itemData }) => {
    console.log('Clicked:', itemData.name)
})
```

## Common Patterns

### Animated Collectible Item
```javascript
{
    type: "item",
    animation: { type: "bob", amplitude: 5 },
    onClickEffect: "bounce",
    onClickSound: "pickup",
    hitW: 80, hitH: 80
}
```

### Animated Interactive Target
```javascript
{
    type: "target",
    animation: { type: "pulse", amplitude: 8 },
    onClickEffect: "shake",
    onClickSound: "useItem",
    useWith: "key"
}
```

### Animated Scene Link
```javascript
{
    type: "link",
    animation: { type: "fade", speed: 1.5 },
    onClickEffect: "flash",
    onClickSound: "sceneChange",
    linkToScene: "scene3"
}
```

### Decorative Animation
```javascript
{
    type: "decor",
    animation: { type: "sprite", fps: 12, frames: [...] },
    // No pickup, no use - just visual
}
```

