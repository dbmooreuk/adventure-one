/**
 * Game Configuration
 * Central location for all game constants and settings
 */

export const gameConfig = {
    // UI Settings
    ui: {
        actions: ["examine", "get", "use"], // Available action buttons
        maxInventorySize: 20,              // Maximum inventory items
        messageDisplayTime: 3000,          // Panel text popup duration (ms) - from gameData
        messageDisplayDuration: 5000,      // Panel text popup duration (ms) - legacy
        messageFadeInDuration: 200,        // Fade in time (ms)
        messageFadeOutDuration: 200,       // Fade out time (ms)
        fadeTransitionTime: 1000,          // Fade transition time (ms) - from gameData
        sceneTransitionDuration: 500,      // Scene change transition (ms)
        buttonDebounceDelay: 300,          // Prevent rapid button clicks (ms)
    },

    // Intro Screen Settings
    intro: {
        title: 'Adventure Game',
        text: 'Welcome to your adventure!',
        music: 'ambient1',
        backgroundImage: 'screen-splash.png',
    },

    // Audio Settings
    audio: {
        soundEnabled: true,                // Enable sound effects - from gameData
        musicEnabled: true,                // Enable music - from gameData
        defaultVolume: 0.7,                // Default audio volume (0-1) - from gameData
        fadeOutDuration: 500,              // Audio fade out time (ms)
        fadeInDuration: 500,               // Audio fade in time (ms)
        pickupSound: 'addToInventory',     // Sound when picking up items
        buttonClickSound: 'success',       // Sound when clicking Start/Continue buttons (unlocks audio)
    },

    // Game Mechanics
    gameplay: {
        totalStages: 13,                   // Total number of game stages
        scorePerStage: 100 / 13,           // Score increment per stage
        autoSave: true,                    // Auto-save on progress - from gameData
        autoSaveEnabled: true,             // Auto-save on progress - legacy
        autoSaveInterval: 30000,           // Auto-save interval (ms) - from gameData
        autoSaveDelay: 30000,
        win: 60,              // Auto-save interval (ms) - legacy
    },

    // Animation Settings
    animation: {
        itemHoverScale: 1.05,              // Scale factor on item hover
        itemTransitionSpeed: 300,          // Item transition duration (ms)
        fadeSpeed: 300,                    // General fade speed (ms)
    },

    // Inventory Settings
    inventory: {
        maxItems: 20,                      // Maximum inventory items
        itemSize: 60,                      // Inventory item size (px)
        itemGap: 3,                        // Gap between items (px)
    },

    // Debug Settings
    debug: {
        enableLogging: true,               // Enable console logging
        showHitboxes: false,               // Show item hitboxes (red borders)
        skipIntro: false,                  // Skip intro screen
    },

    // Game Dimensions (from SASS variables)
    dimensions: {
        gameWidth: 1280,                   // Virtual game width (px)
        gameHeight: 720,                   // Virtual game height (px)
        inventoryWidth: 208,               // Inventory panel width (px)
    },

    // Local Storage Keys
    storage: {
        saveGameKey: 'adventureGameSave',  // Save game data key
        settingsKey: 'adventureGameSettings', // Settings key
        achievementsKey: 'adventureGameAchievements', // Achievements key
    },
}

// Export individual sections for convenience
export const { ui, intro, audio, gameplay, animation, inventory, debug, dimensions, storage } = gameConfig

// Freeze the config to prevent accidental modifications
Object.freeze(gameConfig)
Object.freeze(ui)
Object.freeze(intro)
Object.freeze(audio)
Object.freeze(gameplay)
Object.freeze(animation)
Object.freeze(inventory)
Object.freeze(debug)
Object.freeze(dimensions)
Object.freeze(storage)

