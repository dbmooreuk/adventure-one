/**
 * Game Configuration
 * Central location for all game constants and settings
 */

export const gameConfig = {
    // UI Timing
    ui: {
        messageDisplayDuration: 5000,      // Panel text popup duration (ms)
        messageFadeInDuration: 200,        // Fade in time (ms)
        messageFadeOutDuration: 200,       // Fade out time (ms)
        sceneTransitionDuration: 500,      // Scene change transition (ms)
        buttonDebounceDelay: 300,          // Prevent rapid button clicks (ms)
    },

    // Audio Settings
    audio: {
        defaultVolume: 0.1,                // Default audio volume (0-1)
        fadeOutDuration: 500,              // Audio fade out time (ms)
        fadeInDuration: 500,               // Audio fade in time (ms)
        introMusic: 'ambient1',            // Music for intro/splash screen
        pickupSound: 'addToInventory',     // Sound when picking up items
    },

    // Game Mechanics
    gameplay: {
        totalStages: 13,                   // Total number of game stages
        scorePerStage: 100 / 13,           // Score increment per stage
        autoSaveEnabled: true,             // Auto-save on progress
        autoSaveDelay: 30000,              // Auto-save interval (ms) - 30 seconds
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
        inventoryWidth: 218,               // Inventory panel width (px)
    },

    // Local Storage Keys
    storage: {
        saveGameKey: 'adventureGameSave',  // Save game data key
        settingsKey: 'adventureGameSettings', // Settings key
        achievementsKey: 'adventureGameAchievements', // Achievements key
    },
}

// Export individual sections for convenience
export const { ui, audio, gameplay, animation, inventory, debug, dimensions, storage } = gameConfig

// Freeze the config to prevent accidental modifications
Object.freeze(gameConfig)
Object.freeze(ui)
Object.freeze(audio)
Object.freeze(gameplay)
Object.freeze(animation)
Object.freeze(inventory)
Object.freeze(debug)
Object.freeze(dimensions)
Object.freeze(storage)

