# SceneObject System - Integration Guide

## Overview

The SceneObject system provides a powerful, data-driven way to create animated, interactive objects in your game scenes. It supports:

- ✅ **Transform animations** (bob, pulse, spin, fade)
- ✅ **Sprite animations** (frame sequences and sprite sheets)
- ✅ **Click/tap interactions** with visual and audio feedback
- ✅ **Scene transitions** and puzzle triggers
- ✅ **Mobile-optimized** touch hitboxes
- ✅ **Automatic cleanup** to prevent memory leaks

---

## How It Works

### 1. Data-Driven Configuration

All scene objects are defined in `gameData.js` under the `sceneItems` array. When a scene loads:

1. **UIManager** calls `updateSceneItems()`
2. Items **without** `animation` property → rendered as `SceneItem` components (existing system)
3. Items **with** `animation` property → rendered as `SceneObject` instances (new system)
4. **SceneManager** creates and manages all `SceneObject` instances
5. On scene change, all `SceneObject` instances are destroyed automatically

### 2. Architecture

```
gameData.js (item definitions)
    ↓
SceneManager.createSceneObjects()
    ↓
SceneObject instances created
    ↓
Animations run via requestAnimationFrame
    ↓
User clicks/taps object
    ↓
Events handled (sound, effects, navigation, puzzles)
    ↓
SceneManager.destroySceneObjects() on scene change
```

---

## Animation Types

### Transform Animations

These use CSS transforms and are GPU-accelerated for smooth performance.

#### Bob (Vertical Movement)
```javascript
animation: {
    type: "bob",
    amplitude: 10,  // pixels to move up/down
    speed: 1        // speed multiplier
}
```

#### Pulse (Scale)
```javascript
animation: {
    type: "pulse",
    amplitude: 10,  // percentage to scale (10 = 1.0 to 1.1)
    speed: 1
}
```

#### Spin (Rotation)
```javascript
animation: {
    type: "spin",
    speed: 1  // rotations per second
}
```

#### Fade (Opacity)
```javascript
animation: {
    type: "fade",
    speed: 1  // fade cycle speed
}
```

### Sprite Animations

#### Frame-by-Frame (Image Array)
```javascript
animation: {
    type: "sprite",
    fps: 12,
    frames: [
        "butterfly-1.png",
        "butterfly-2.png",
        "butterfly-3.png",
        "butterfly-4.png"
    ]
}
```

#### Sprite Sheet (Single Image)
```javascript
animation: {
    type: "sprite",
    spriteSheet: "fan-sprite.png",
    frameWidth: 128,
    frameHeight: 128,
    frameCount: 8,
    fps: 10
}
```

---

## Click Interactions

### Visual Effects

```javascript
onClickEffect: "flash"   // Brightness flash
onClickEffect: "bounce"  // Jump animation
onClickEffect: "shake"   // Horizontal shake
```

### Sound Effects

```javascript
onClickSound: "pickup"   // From gameData.audio.sounds
onClickSound: "useItem"
onClickSound: "success"
onClickSound: "error"
```

### Scene Navigation

```javascript
linkToScene: "scene3"  // Navigate to scene3 on click
```

### Puzzle Triggers

```javascript
triggerPuzzle: {
    module: "SafeCombinationPuzzle",
    config: {
        solution: [3, 7, 2],
        reward: "gold_bars"
    }
}
```

---

## Mobile Touch Optimization

Use `hitW` and `hitH` to create larger touch targets without changing visual size:

```javascript
{
    name: "torch",
    position: [100, 150],
    size: [50, 80],        // Visual size
    hitW: 80,              // Touch area width
    hitH: 100,             // Touch area height
    // Creates 80x100 clickable area centered on 50x80 visual
}
```

---

## Complete Example

```javascript
// In gameData.js sceneItems array:
{
    name: "magical_orb",
    longName: "Magical Orb",
    shortName: "Orb",
    type: "item",
    lookAt: "A glowing orb that pulses with mystical energy.",
    pickUpMessage: "You carefully pick up the magical orb.",
    useWith: "pedestal",
    useMessage: "The orb fits perfectly into the pedestal!",
    useResult: "portal_opened",
    outcome: "remove",
    points: 50,
    
    // Visual properties
    image: "orb-glowing.png",
    position: [300, 200],
    size: [60, 60],
    
    // Animation
    animation: {
        type: "pulse",
        amplitude: 15,
        speed: 1.5
    },
    
    // Interactions
    onClickEffect: "flash",
    onClickSound: "success",
    hitW: 90,
    hitH: 90
}
```

---

## Integration with Existing Systems

### SceneItem vs SceneObject

- **SceneItem**: Static items, no animations, existing system
- **SceneObject**: Animated items, new system
- Both can coexist in the same scene
- UIManager automatically chooses which to use based on `animation` property

### Event Flow

```javascript
// SceneObject emits events that game systems can listen to:
game.on('sceneObjectClicked', ({ itemData, element }) => {
    // Handle custom logic
})
```

### Cleanup

SceneObjects are automatically destroyed when:
- Scene changes
- Item is removed from scene
- Game is reset

No manual cleanup needed! The system handles it.

---

## Best Practices

### Performance

1. **Use transform animations** for simple effects (bob, pulse, spin, fade)
2. **Use sprite animations** for complex character animations
3. **Limit sprite frame count** to 8-12 frames for smooth performance
4. **Use sprite sheets** instead of individual frames when possible

### Mobile

1. **Always set hitW/hitH** for items smaller than 44x44px
2. **Test on actual devices** - touch targets feel different than mouse
3. **Use onClickEffect** for immediate visual feedback

### Accessibility

1. Items are keyboard navigable (Tab key)
2. Items have ARIA labels from `longName`
3. Animations respect `prefers-reduced-motion`

### Organization

1. Group related items in gameData.js with comments
2. Use consistent naming: `item_name`, not `itemName` or `item-name`
3. Document complex animations with inline comments

---

## Troubleshooting

### Animation not playing
- Check that `animation` object exists in item data
- Verify image paths are correct
- Check browser console for errors

### Click not working
- Ensure item has `type` property
- Check z-index conflicts with other elements
- Verify pointer events aren't disabled

### Performance issues
- Reduce number of animated objects per scene (max 5-10)
- Lower FPS for sprite animations
- Use transform animations instead of sprites when possible

### Memory leaks
- SceneObjects should auto-cleanup
- Check browser DevTools Memory profiler
- Ensure `destroy()` is called on scene change

---

## API Reference

### SceneObject Constructor

```javascript
new SceneObject(itemData, sceneContainer, game)
```

### Methods

- `init()` - Initialize and start animations
- `destroy()` - Clean up and stop animations
- `updateData(newData)` - Update item data and restart animations
- `stopAnimation()` - Stop animations without destroying

### Properties

- `itemData` - Item configuration object
- `element` - DOM element
- `isDestroyed` - Cleanup flag

---

## Future Enhancements

Potential additions to the system:

- Path-based animations (move along bezier curves)
- Particle effects
- Physics-based animations
- Animation state machines
- Conditional animations based on game state

---

## Support

For questions or issues:
1. Check `plan.html` for visual reference
2. Review examples in `gameData.js`
3. Inspect browser console for errors
4. Check this documentation

Happy animating! 🎮✨

