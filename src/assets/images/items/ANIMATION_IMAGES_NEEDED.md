# Animation Images Needed

This document lists the images needed for the animated SceneObject examples in scene1.

## Current Animated Items in Scene 1

### 1. Torch (Bob Animation)
- **File**: `torch.png`
- **Status**: ⚠️ NEEDED
- **Size**: 50x80 pixels
- **Description**: A wooden torch with flames
- **Animation**: Vertical bobbing motion

### 2. Butterfly (Sprite Frame Animation)
- **Files**: 
  - `butterfly1.png`
  - `butterfly2.png`
  - `butterfly3.png`
  - `butterfly4.png`
- **Status**: ⚠️ NEEDED
- **Size**: 64x64 pixels each
- **Description**: 4 frames of a butterfly with wings in different positions
- **Animation**: Cycles through 4 frames at 8 FPS

### 3. Gear (Spin Animation)
- **File**: `gear.png`
- **Status**: ⚠️ NEEDED
- **Size**: 60x60 pixels
- **Description**: A brass mechanical gear
- **Animation**: Continuous rotation

### 4. Crystal (Fade Animation)
- **File**: `crystal.png`
- **Status**: ⚠️ NEEDED
- **Size**: 40x60 pixels
- **Description**: A glowing crystal
- **Animation**: Opacity fading in and out

## Temporary Workaround

Until you create the actual images, you can:

1. **Use existing images as placeholders**:
   - Use `rope.png` for torch
   - Use `karibiner.png` for gear
   - Use `bottle-complete.png` for crystal

2. **Update gameData.js** to use existing images:
```javascript
// Temporary - use existing images
{
    name: "torch",
    image: "rope.png",  // placeholder
    // ... rest of config
}
```

3. **Create simple placeholder images**:
   - Use any image editor (Photoshop, GIMP, Figma, etc.)
   - Or use online tools like Pixlr, Photopea
   - Or generate with AI (DALL-E, Midjourney, Stable Diffusion)

## Image Requirements

### General Guidelines
- **Format**: PNG with transparency
- **Color depth**: 32-bit RGBA
- **Optimization**: Use TinyPNG or similar to reduce file size
- **Naming**: Use lowercase with hyphens (e.g., `butterfly-1.png`)

### For Sprite Frames (Butterfly)
- All frames must be the same size
- Keep frame count low (4-8 frames ideal)
- Ensure smooth transitions between frames
- Consider using sprite sheets for better performance

### For Transform Animations (Torch, Gear, Crystal)
- Single static image
- Animation is handled by CSS transforms
- Image should be centered in canvas
- Transparent background recommended

## Creating Sprite Frames

### Option 1: Individual Frames
1. Create 4 separate PNG files
2. Name them: `butterfly1.png`, `butterfly2.png`, etc.
3. Each should be 64x64 pixels
4. Show butterfly wings in different positions

### Option 2: Sprite Sheet (More Efficient)
1. Create single image: 256x64 pixels (4 frames × 64px)
2. Arrange frames horizontally
3. Update gameData.js:
```javascript
animation: {
    type: "sprite",
    spriteSheet: "butterfly-sheet.png",
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 4,
    fps: 8
}
```

## Quick Test Without Images

To test the animation system without images:

1. **Comment out the image property**:
```javascript
{
    name: "torch",
    // image: "torch.png",  // commented out
    position: [100, 150],
    size: [50, 80],
    animation: { type: "bob", amplitude: 5 }
}
```

2. **Add background color in CSS**:
```scss
.scene-object-torch {
    background: orange;
    border: 2px solid red;
}
```

3. The animation will still work, just with a colored box instead of an image.

## Resources for Creating Images

### Free Image Editors
- **GIMP**: https://www.gimp.org/
- **Krita**: https://krita.org/
- **Photopea**: https://www.photopea.com/ (online)

### Free Assets
- **OpenGameArt**: https://opengameart.org/
- **Itch.io**: https://itch.io/game-assets/free
- **Kenney**: https://kenney.nl/assets

### AI Image Generation
- **DALL-E**: https://openai.com/dall-e-2
- **Midjourney**: https://www.midjourney.com/
- **Stable Diffusion**: https://stablediffusionweb.com/

## Next Steps

1. Create or source the needed images
2. Place them in `src/assets/images/items/`
3. Test in the game by running `npm run dev`
4. Check `plan.html` to verify items are configured correctly
5. Adjust positions and sizes as needed in `gameData.js`

## Notes

- The animation system works independently of images
- You can test animations with colored boxes first
- Images can be added/replaced later without code changes
- All image paths are relative to `/src/assets/images/items/`

