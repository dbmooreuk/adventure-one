# Image System Setup Guide

## ✅ What Has Been Implemented

### 1. Directory Structure Created
```
src/assets/images/
├── backgrounds/     # Scene background images go here
├── items/          # Item images go here
└── README.md       # Detailed documentation
```

### 2. gameData.js Updated
Added image support to scenes and items:

**Scene Example:**
```javascript
{
    sceneName: "scene1",
    backgroundImage: "scene1.png",  // NEW: Background image reference
    // ... rest of scene data
}
```

**Item Example:**
```javascript
{
    name: "torch",
    image: "torch.png",  // NEW: Item image reference
    // ... rest of item data
}
```

### 3. UIManager.js Enhanced
- Added `updateSceneBackground()` method to load scene backgrounds
- Updated `createSceneItemElement()` to display item images
- Updated `updateInventory()` to show images in inventory
- Images are loaded from `/src/assets/images/backgrounds/` and `/src/assets/images/items/`

### 4. Image Display Features
- **Scene backgrounds**: Full-screen, cover the entire scene area
- **Scene items**: Positioned absolutely with background images
- **Inventory items**: Show images in inventory slots
- **Fallback**: If no image specified, shows text labels (backward compatible)

## 📋 Images You Need to Create

### Background Images (1920×1080px recommended)

Place these in `src/assets/images/backgrounds/`:

1. `splash.png` - Splash screen
2. `scene1.png` - The Beginning (cave entrance)
3. `scene2.png` - Inside the Cave
4. `scene3.png` - The Underground Lake
5. `scene4.png` - The Ancient Bridge
6. `scene5.png` - The Forest Clearing
7. `scene6.png` - The Old Cabin
8. `scene7.png` - The Mountain Path
9. `scene8.png` - The Crystal Chamber
10. `scene9.png` - The Hidden Temple
11. `scene10.png` - The Sacred Altar
12. `scene11.png` - The Final Chamber
13. `scene12.png` - The Treasure Room
14. `scene13.png` - Victory (ending)

### Item Images (256×256px recommended, PNG with transparency)

Place these in `src/assets/images/items/`:

Currently configured items:
1. `torch.png` - Wooden Torch
2. `rope.png` - Coiled Rope
3. `boat.png` - Small Boat

**Note:** Only 3 items have been configured with images so far. You can add more by editing `src/data/gameData.js` and adding `image: "filename.png"` to any item.

## 🎨 How to Add Images

### Step 1: Create Your Images
- Use any image editor (Photoshop, GIMP, Procreate, etc.)
- Follow the size recommendations above
- Optimize for web (compress to reduce file size)

### Step 2: Place Images in Correct Directory
```bash
# For backgrounds
cp your-image.png src/assets/images/backgrounds/scene1.png

# For items
cp your-item.png src/assets/images/items/torch.png
```

### Step 3: Reference in gameData.js
The images are already referenced in gameData.js for the examples above. To add more:

```javascript
// For a scene
{
    sceneName: "scene4",
    backgroundImage: "scene4.png",  // Add this line
    // ... other properties
}

// For an item
{
    name: "key",
    image: "key.png",  // Add this line
    // ... other properties
}
```

### Step 4: Test
Run `npm run dev` and navigate to the scene to see your images!

## 🔧 Quick Start (Testing Without Real Images)

You can test the system with placeholder images:

### Option 1: Use Solid Color Placeholders
Create simple colored PNG files to test:
```bash
# On macOS/Linux with ImageMagick
convert -size 1920x1080 xc:blue src/assets/images/backgrounds/scene1.png
convert -size 256x256 xc:red src/assets/images/items/torch.png
```

### Option 2: Download Free Placeholder Images
- [Unsplash](https://unsplash.com/) - Free high-quality photos
- [Pexels](https://www.pexels.com/) - Free stock photos
- [Placeholder.com](https://placeholder.com/) - Simple placeholder generator

### Option 3: Use AI Image Generation
- [DALL-E](https://openai.com/dall-e-2)
- [Midjourney](https://www.midjourney.com/)
- [Stable Diffusion](https://stability.ai/)

## 📝 Example Prompts for AI Image Generation

### For Backgrounds:
- "A mysterious cave entrance in a dark forest, atmospheric lighting, game art style"
- "Inside a dark damp cave with water dripping, underground atmosphere, adventure game background"
- "An underground lake in a crystal cavern, glowing crystals, fantasy game art"

### For Items:
- "A wooden torch with flames, game item icon, transparent background, top-down view"
- "A coiled rope, adventure game item, simple icon style, transparent background"
- "An ancient ornate key with mysterious symbols, game item icon, transparent background"

## 🎯 Current Status

### ✅ Completed
- [x] Directory structure created
- [x] gameData.js updated with image references
- [x] UIManager updated to display images
- [x] Documentation created
- [x] System tested and working

### ⏳ Pending (Your Tasks)
- [ ] Create/obtain background images
- [ ] Create/obtain item images
- [ ] Place images in correct directories
- [ ] Test images in game
- [ ] Add more items with images (optional)

## 🚀 Testing the System

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Check browser console** for image loading messages:
   - `🖼️ Set background image: /src/assets/images/backgrounds/scene1.png`
   - `🖼️ Set item image: /src/assets/images/items/torch.png`

3. **Look for 404 errors** if images aren't loading

4. **Verify images display correctly** in:
   - Scene backgrounds
   - Scene items (clickable objects)
   - Inventory items

## 💡 Tips

1. **Start simple**: Use placeholder images first to test the system
2. **Optimize images**: Compress before adding to keep game fast
3. **Consistent style**: Keep all images in the same art style
4. **Test on different screens**: Ensure images look good at different resolutions
5. **Use transparency**: PNG with alpha channel works best for items

## 📚 Additional Resources

- See `src/assets/images/README.md` for detailed technical documentation
- Check `src/data/gameData.js` for all scene and item configurations
- Review `src/core/UIManager.js` for image rendering implementation

## ❓ Troubleshooting

**Q: Images not showing?**
- Check filename matches exactly (case-sensitive)
- Verify image is in correct directory
- Check browser console for errors

**Q: Images look stretched?**
- Use recommended dimensions
- Check aspect ratio

**Q: Game running slow?**
- Compress images
- Reduce file sizes
- Use appropriate formats (JPG for photos, PNG for graphics)

---

**Ready to add your images!** Just drop them in the appropriate folders and they'll automatically appear in the game. 🎮

