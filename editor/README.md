# Game Data Editor

A visual editor for creating and managing game data for the Adventure Game.

## 🚀 Getting Started

### Opening the Editor

1. Open `editor/index.html` in your web browser
2. You can either:
   - **Import** your existing `gameData.js` file
   - **Start fresh** with a new game

### Importing Existing Data

1. Click the "📂 Import gameData.js" button
2. Select your `src/data/gameData.js` file
3. The editor will load all scenes and items

### Exporting Data

1. Click the "💾 Export gameData.js" button
2. The file will download to your computer
3. Replace your existing `src/data/gameData.js` with the exported file

## 📋 Features

### Scene Editor

Create and edit game scenes with:

- **Basic Information**
  - Scene name (unique identifier)
  - Title and description
  - Stage number and label
  - Scene type (scene or puzzle)

- **Assets**
  - Background image
  - Background music

- **Items**
  - Select which items appear in the scene
  - Multi-select from item library

- **Lock Settings**
  - Mark scene as locked
  - Specify which item unlocks it

- **Puzzle Settings** (for puzzle scenes)
  - Puzzle module name
  - Puzzle configuration (JSON)

### Item Editor

Create and edit game items with:

- **Basic Information**
  - Name (unique identifier)
  - Long name and short name
  - Type (item, target, link, decor)
  - Look at description

- **Interaction**
  - Pick up message
  - Use with (other item name)
  - Use message and result
  - Outcome (keep, remove, scene)
  - Link to scene (for link type)
  - Points awarded

- **Visual Properties**
  - Image filename
  - Position [X, Y] on scene
  - Size [Width, Height]
  - Hit area (larger touch target)

- **Animation** (optional)
  - Type: bob, pulse, spin, fade, sprite
  - Speed and amplitude
  - Frame images (for sprite animation)
  - JSON configuration

- **Effects**
  - Click effect (flash, bounce, shake)
  - Click sound

- **Style**
  - CSS class name
  - Hover effect (glow, pulse, shine, swing)
  - JSON configuration

## 🎯 Item Types

- **item** - Pickupable items that go into inventory
- **target** - Non-pickupable items that can be used with other items
- **link** - Navigation links to other scenes
- **decor** - Non-interactive decorative items (can be examined)

## 🎨 Animation Types

- **bob** - Vertical bobbing motion
  - Properties: `speed`, `amplitude`
- **pulse** - Scaling pulse effect
  - Properties: `speed`, `amplitude`
- **spin** - Continuous rotation
  - Properties: `speed`
- **fade** - Fade in/out effect
  - Properties: `speed`
- **sprite** - Frame-by-frame animation
  - Properties: `fps`, `frames` (array of image filenames)

## 💡 Tips

### Naming Conventions

- **Scene names**: Use lowercase with underscores (e.g., `scene1`, `puzzle_safe`)
- **Item names**: Use lowercase with underscores (e.g., `torch`, `gold_bars`)
- **Image files**: Reference just the filename (e.g., `torch.png`)
- **Sound files**: Reference just the name without extension (e.g., `success`)

### Animation Configuration

Example bob animation:
```json
{
  "type": "bob",
  "speed": 1,
  "amplitude": 10
}
```

Example sprite animation:
```json
{
  "type": "sprite",
  "fps": 8,
  "frames": [
    "butterfly1.png",
    "butterfly2.png",
    "butterfly3.png",
    "butterfly4.png"
  ]
}
```

### Style Configuration

Example style with hover effect:
```json
{
  "className": "item--torch",
  "hoverEffect": "glow"
}
```

### Item Relationships

- **useWith**: Specify the name of another item this can be used with
- **linkToScene**: For link-type items, specify the scene to navigate to
- **nextScene**: For items with outcome "scene", specify which scene to unlock

## 🔧 Workflow

### Creating a New Scene

1. Click "➕" next to Scenes
2. Fill in basic information
3. Select background image and music
4. Add items to the scene
5. Configure lock settings if needed
6. Click "💾 Save Scene"

### Creating a New Item

1. Click "➕" next to Items
2. Fill in basic information
3. Set the item type
4. Configure interaction properties
5. Set visual properties (position, size, image)
6. Add animation if desired
7. Configure effects and style
8. Click "💾 Save Item"

### Positioning Items

- Use the Position [X, Y] fields to place items on the scene
- X: pixels from left edge
- Y: pixels from top edge
- Tip: Use the game's 1280x720 virtual canvas as reference

### Testing Your Changes

1. Export the gameData.js file
2. Replace `src/data/gameData.js` in your game
3. Refresh the game in your browser
4. Test the new scenes and items

## 📁 File Structure

```
editor/
├── index.html          # Main editor page
├── README.md           # This file
├── css/
│   └── editor.css      # Editor styles
└── js/
    ├── editor.js       # Main application
    ├── schema.js       # Data schema and validation
    ├── ui-manager.js   # UI rendering and updates
    ├── data-manager.js # Import/export functionality
    ├── scene-editor.js # Scene editing logic
    └── item-editor.js  # Item editing logic
```

## ⚠️ Important Notes

- Always **backup** your `gameData.js` before importing a new version
- The editor validates required fields but doesn't check for broken references
- Make sure referenced images and sounds exist in your assets folders
- Test exported data in the game before committing changes

## 🐛 Troubleshooting

### Import fails
- Make sure you're selecting the correct `gameData.js` file
- Check browser console for error messages
- Ensure the file has valid JavaScript syntax

### Export doesn't work
- Check that all required fields are filled in
- Validate JSON in animation and style fields
- Check browser console for errors

### Items don't appear in game
- Verify the item is added to the scene's items array
- Check that image paths are correct
- Ensure position is within the 1280x720 canvas

## 🎮 Happy Editing!

This editor is designed to make game development faster and more intuitive. If you find bugs or have feature requests, please document them for future improvements.

