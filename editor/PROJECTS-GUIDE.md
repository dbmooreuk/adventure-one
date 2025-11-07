# Project Management Guide

The Game Data Editor now includes **IndexedDB-based project management** that lets you work on multiple game projects simultaneously!

## 🎯 Features

### Multiple Projects
- Save multiple game projects in your browser
- Switch between projects instantly
- Each project is stored separately in IndexedDB

### Auto-Save
- Projects auto-save every 30 seconds
- Visual indicator shows when auto-save occurs
- Never lose your work!

### Project Operations
- **Create** new projects
- **Load** existing projects
- **Save** current project
- **Rename** projects
- **Duplicate** projects
- **Delete** projects
- **Export** any project as gameData.js

## 📋 How to Use

### Creating a New Project

1. Click **"✨ New Project"** button in the header
2. Enter a project name
3. Start adding scenes and items
4. Click **"💾 Save Project"** to save

### Saving Your Work

**Manual Save:**
- Click **"💾 Save Project"** anytime
- First time: You'll be prompted for a project name
- After that: Updates the current project

**Auto-Save:**
- Automatically saves every 30 seconds
- Only works when you have a current project loaded
- Watch for the "✓ Auto-saved" indicator in bottom-right

### Managing Projects

1. Click **"📁 Projects"** button
2. You'll see a list of all your saved projects with:
   - Project name
   - Number of scenes and items
   - Last modified date
   - Active project indicator (▶)

### Project Actions

Each project in the list has these buttons:

- **📂 Load** - Load this project into the editor
- **✏️ Rename** - Change the project name
- **📋 Duplicate** - Create a copy of the project
- **💾 Export** - Export as gameData.js file
- **🗑️ Delete** - Delete the project (with confirmation)

### Importing from File

You can still import gameData.js files:

1. Click **"📂 Import File"**
2. Select your gameData.js file
3. The data loads into the editor
4. Click **"💾 Save Project"** to save it as a new project

### Exporting to File

Two ways to export:

**Export Current Project:**
1. Click **"💾 Export File"** in header
2. Downloads current editor data as gameData.js

**Export Any Project:**
1. Click **"📁 Projects"**
2. Click **💾** button next to any project
3. Downloads that project as gameData.js

## 💡 Workflow Examples

### Scenario 1: Working on Multiple Games

```
1. Create "Space Adventure" project
2. Add scenes and items
3. Save project
4. Create "Fantasy Quest" project
5. Add different scenes and items
6. Save project
7. Switch between them anytime via Projects menu
```

### Scenario 2: Experimenting with Changes

```
1. Load your main project
2. Click Duplicate to create "Main Project (Copy)"
3. Load the copy
4. Make experimental changes
5. If you like them: Export and use
6. If not: Delete the copy, load original
```

### Scenario 3: Version Control

```
1. Work on "My Game v1.0"
2. When ready for new version: Duplicate to "My Game v1.1"
3. Load v1.1 and make changes
4. Keep v1.0 as backup
5. Export v1.1 when ready
```

## 🔧 Technical Details

### Storage Location
- Projects are stored in **IndexedDB** in your browser
- Database name: `GameDataEditorDB`
- Store name: `projects`

### Data Structure
Each project contains:
```javascript
{
    id: 1,                          // Auto-generated
    name: "My Game Project",        // Your project name
    gameData: { ... },              // Full game data
    created: "2024-01-01T12:00:00Z",
    lastModified: "2024-01-01T13:00:00Z"
}
```

### Storage Limits
- IndexedDB typically allows 50MB+ per domain
- Each project is usually < 100KB
- You can store hundreds of projects

### Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Data persists across browser sessions
- Clearing browser data will delete projects

## ⚠️ Important Notes

### Backup Your Work
- IndexedDB data is stored in your browser
- Clearing browser data will delete all projects
- **Always export important projects as gameData.js files**
- Keep backups of exported files

### Browser-Specific Storage
- Projects are stored per browser
- Chrome projects won't appear in Firefox
- Use Export/Import to move between browsers

### Private/Incognito Mode
- Projects may not persist in private browsing
- Use regular browser windows for project work

## 🐛 Troubleshooting

### Projects Not Saving
- Check browser console for errors
- Ensure you're not in private/incognito mode
- Try a different browser
- Check available storage space

### Auto-Save Not Working
- Make sure you have a current project loaded
- Check that you saved the project at least once
- Look for the project name in the header

### Can't See Projects
- Click "📁 Projects" button
- If list is empty, create a new project
- Check browser console for IndexedDB errors

### Lost Projects
- Check if you're in the same browser
- Check if browser data was cleared
- Look for exported gameData.js files as backups

## 📊 Storage Statistics

The Projects modal shows:
- **Project count** - How many projects you have
- **Storage used** - Total size in KB

## 🎮 Best Practices

1. **Name projects clearly** - Use descriptive names
2. **Save regularly** - Don't rely only on auto-save
3. **Export important work** - Keep gameData.js backups
4. **Use duplication** - Test changes in copies
5. **Clean up old projects** - Delete unused projects
6. **Check auto-save** - Watch for the indicator

## 🚀 Quick Reference

| Action | Button | Location |
|--------|--------|----------|
| New Project | ✨ New Project | Header |
| Save Project | 💾 Save Project | Header |
| Manage Projects | 📁 Projects | Header |
| Import File | 📂 Import File | Header |
| Export File | 💾 Export File | Header |
| Auto-save indicator | ✓ Auto-saved | Bottom-right |

---

**Happy project managing!** 🎉

