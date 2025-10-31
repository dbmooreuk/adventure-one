# Game Images

This directory contains all images used in the game, organized by type.

## Directory Structure

```
src/assets/images/
├── backgrounds/     # Scene background images
├── items/          # Item and object images
└── README.md       # This file
```

## Background Images

Background images are used for scene backgrounds. They should be referenced in `src/data/gameData.js` in the scene configuration.

### Naming Convention
- Use descriptive names: `scene1.png`, `cave-interior.png`, `forest-clearing.png`
- Format: PNG or JPG
- Recommended size: 1920×1080px (will be scaled to fit 1280×720 game area)

### Usage in gameData.js

```javascript
{
    sceneName: "scene1",
    title: "The Beginning",
    // ... other properties
    backgroundImage: "scene1.png",  // Filename in backgrounds/ directory
    items: ["torch", "rope"]
}
```

### Current Background Images Needed

Based on the game data, you'll need images for:
- `splash.png` - Splash screen background
- `scene1.png` - The Beginning (cave entrance)
- `scene2.png` - Inside the Cave
- `scene3.png` - The Underground Lake
- `scene4.png` - The Ancient Bridge
- `scene5.png` - The Forest Clearing
- `scene6.png` - The Old Cabin
- `scene7.png` - The Mountain Path
- `scene8.png` - The Crystal Chamber
- `scene9.png` - The Hidden Temple
- `scene10.png` - The Sacred Altar
- `scene11.png` - The Final Chamber
- `scene12.png` - The Treasure Room
- `scene13.png` - Victory (ending scene)

## Item Images

Item images are used for interactive objects in scenes and inventory items.

### Naming Convention
- Use item names: `torch.png`, `rope.png`, `key.png`
- Format: PNG with transparency recommended
- Recommended size: 256×256px or smaller (will be scaled to fit)

### Usage in gameData.js

```javascript
{
    name: "torch",
    longName: "Wooden Torch",
    type: "item",
    // ... other properties
    image: "torch.png",  // Filename in items/ directory
    position: [100, 150],
    size: [50, 80]
}
```

### Current Item Images Needed

Based on the game data, you'll need images for:
- `torch.png` - Wooden Torch
- `rope.png` - Coiled Rope
- `key.png` - Ancient Key
- `map.png` - Treasure Map
- `boat.png` - Small Boat
- `oar.png` - Wooden Oar
- Plus any other items defined in gameData.js

## Image Guidelines

### Technical Requirements
- **Backgrounds**: 1920×1080px (16:9 aspect ratio)
- **Items**: 256×256px or smaller, PNG with transparency
- **File formats**: PNG (preferred for items), JPG (acceptable for backgrounds)
- **File size**: Keep under 500KB per image for performance

### Visual Style
- Maintain consistent art style across all images
- Use appropriate lighting and atmosphere for each scene
- Items should be clearly recognizable
- Consider using semi-transparent backgrounds for items

### Performance Tips
- Optimize images before adding them to the project
- Use appropriate compression
- Consider using WebP format for better compression (with PNG fallback)
- Lazy load images if needed for large games

## Adding New Images

1. **Create or obtain your image** following the guidelines above
2. **Optimize the image** using tools like:
   - [TinyPNG](https://tinypng.com/) for PNG compression
   - [Squoosh](https://squoosh.app/) for advanced optimization
3. **Place the file** in the appropriate directory:
   - Backgrounds → `src/assets/images/backgrounds/`
   - Items → `src/assets/images/items/`
4. **Reference in gameData.js**:
   - For scenes: Add `backgroundImage: "filename.png"`
   - For items: Add `image: "filename.png"`
5. **Test in the game** to ensure proper display

## Placeholder Images

If you don't have images yet, the game will work without them:
- **Scenes without backgroundImage**: Will show the default gradient background
- **Items without image**: Will show text labels instead

## Example: Complete Scene with Background

```javascript
{
    sceneName: "scene1",
    title: "The Beginning",
    textOne: "You find yourself at a mysterious cave entrance.",
    stage: "Stage 1",
    stageNumber: 1,
    sceneType: "outdoor",
    sceneMusic: "ambient1",
    backgroundImage: "scene1.png",  // ← Background image
    items: ["torch", "rope"]
}
```

## Example: Complete Item with Image

```javascript
{
    name: "torch",
    longName: "Wooden Torch",
    type: "item",
    lookAt: "A sturdy wooden torch.",
    pickUpMessage: "You pick up the torch.",
    useWith: "darkness",
    useMessage: "The torch illuminates the area.",
    useResult: "light",
    outcome: "keep",
    points: 10,
    image: "torch.png",  // ← Item image
    position: [100, 150],
    size: [50, 80]
}
```

## Troubleshooting

### Image not showing
1. Check the filename matches exactly (case-sensitive)
2. Verify the image is in the correct directory
3. Check browser console for 404 errors
4. Ensure the path in gameData.js is just the filename, not the full path

### Image looks stretched or distorted
1. Check the image dimensions match recommendations
2. Verify the aspect ratio is correct
3. For items, ensure `size` property in gameData.js is appropriate

### Performance issues
1. Reduce image file sizes
2. Use appropriate compression
3. Consider using lower resolution images
4. Implement lazy loading for large numbers of images

