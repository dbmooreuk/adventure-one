/**
 * Game Data Configuration
 * Contains all game scenes, items, and configuration data
 */

export const gameData = {
    // Game metadata
    title: "Adventure Game",
    version: "2.0.0",
    stages: 13,
    
    // Game scenes configuration
    scenes: [
        {
            sceneName: "splash",
            title: "Adventure Game",
            textOne: "Welcome to the adventure! Click Next to begin your journey.",
            stage: "Start",
            stageNumber: 0,
            sceneType: "splash",
            sceneMusic: "silence",
            backgroundImage: "screen-splash.png", // Optional: background image filename
            items: []
        },
        {
            sceneName: "scene1",
            title: "The Stasis Chamber",
            textOne: "You find yourself standing at the entrance of a mysterious cave. The air is thick with anticipation.",
            stage: "Stage 1",
            stageNumber: 1,
            sceneType: "outdoor",
            sceneMusic: "ambient1",
            backgroundImage: "screen-stasis.png", // Background image for this scene
            items: ["torch", "rope" , "crossing"]
        },
        {
            sceneName: "scene2",
            title: "Inside the Cave",
            textOne: "The cave is dark and damp. You can hear water dripping somewhere in the distance. You see a boat by the water's edge.",
            stage: "Stage 2",
            stageNumber: 2,
            sceneType: "indoor",
            sceneMusic: "ambient2",
            backgroundImage: "scene2.png",
            items: ["key", "map", "boat", "oar"]  // Boat and oar are HERE so you can use them to unlock scene3
        },
        {
            sceneName: "scene3",
            title: "The Underground Lake",
            textOne: "You emerge into a vast underground cavern with a crystal-clear lake in the center.",
            stage: "Stage 3",
            stageNumber: 3,
            sceneType: "underground",
            sceneMusic: "ambient3",
            items: [],  // Empty - you unlock this by using oar on boat in scene2
            locked: true,  // This scene is locked initially - need to use oar on boat to unlock
            unlockedBy: "crossing"  // Unlocked when "crossing" item is created
        },
        {
            sceneName: "scene4",
            title: "The Ancient Bridge",
            textOne: "An old stone bridge spans across a deep chasm. It looks fragile but passable.",
            stage: "Stage 4",
            stageNumber: 4,
            sceneType: "bridge",
            sceneMusic: "ambient4",
            items: ["plank", "hammer"]
        },
        {
            sceneName: "scene5",
            title: "The Forest Clearing",
            textOne: "You find yourself in a peaceful forest clearing surrounded by tall trees.",
            stage: "Stage 5",
            stageNumber: 5,
            sceneType: "forest",
            sceneMusic: "ambient5",
            items: ["berries", "stick"]
        },
        {
            sceneName: "scene6",
            title: "The Old Cabin",
            textOne: "A weathered wooden cabin sits in the middle of the clearing, its door slightly ajar.",
            stage: "Stage 6",
            stageNumber: 6,
            sceneType: "cabin",
            sceneMusic: "ambient6",
            items: ["lantern", "book"]
        },
        {
            sceneName: "scene7",
            title: "The Mountain Path",
            textOne: "A winding path leads up the mountainside. The view is breathtaking but treacherous.",
            stage: "Stage 7",
            stageNumber: 7,
            sceneType: "mountain",
            sceneMusic: "ambient7",
            items: ["pickaxe", "compass"]
        },
        {
            sceneName: "scene8",
            title: "The Crystal Chamber",
            textOne: "You enter a chamber filled with glowing crystals that illuminate the entire space.",
            stage: "Stage 8",
            stageNumber: 8,
            sceneType: "crystal",
            sceneMusic: "ambient8",
            items: ["crystal", "gem"]
        },
        {
            sceneName: "scene9",
            title: "The Ancient Temple",
            textOne: "Before you stands an ancient temple with intricate carvings covering its walls.",
            stage: "Stage 9",
            stageNumber: 9,
            sceneType: "temple",
            sceneMusic: "ambient9",
            items: ["statue", "scroll"]
        },
        {
            sceneName: "scene10",
            title: "The Treasure Chamber",
            textOne: "You've discovered the legendary treasure chamber! Gold and jewels sparkle everywhere.",
            stage: "Stage 10",
            stageNumber: 10,
            sceneType: "treasure",
            sceneMusic: "ambient10",
            items: ["treasure", "darkness"]
        },
        {
            sceneName: "scene11",
            title: "The Guardian's Lair",
            textOne: "A massive chamber where an ancient guardian once protected the treasure.",
            stage: "Stage 11",
            stageNumber: 11,
            sceneType: "guardian",
            sceneMusic: "ambient11",
            items: ["sword", "shield"],
            locked: true,  // Locked until crystal reveals the passage
            unlockedBy: "revelation"  // Unlocked by using crystal on darkness
        },
        {
            sceneName: "scene12",
            title: "The Final Challenge",
            textOne: "You face the final challenge that will determine your fate in this adventure.",
            stage: "Stage 12",
            stageNumber: 12,
            sceneType: "challenge",
            sceneMusic: "ambient12",
            items: ["orb", "staff"]
        },
        {
            sceneName: "ending",
            title: "Victory!",
            textOne: "Congratulations! You have successfully completed your adventure and claimed the treasure!",
            stage: "The End",
            stageNumber: 13,
            sceneType: "ending",
            sceneMusic: "victory",
            items: []
        }
    ],
    
    // Scene items and interactions
    sceneItems: [
        // Scene 1 items
        {
            name: "torch",
            longName: "Wooden Torch",
            type: "item",
            lookAt: "A sturdy wooden torch that could provide light in dark places.",
            pickUpMessage: "You pick up the torch. It might be useful in dark areas.",
            useWith: "darkness",
            useMessage: "The torch illuminates the area, revealing hidden details.",
            useResult: "light",
            outcome: "keep",//means stays in inventory after use
            points: 10,
            image: "torch.png", // Item image filename
            position: [100, 150],
            size: [50, 80]
        },
        {
            name: "rope",
            longName: "Coiled Rope",
            type: "item",
            lookAt: "A long, sturdy rope that could be used for climbing or securing things.",
            pickUpMessage: "You coil the rope and add it to your inventory.",
            useWith: "chasm",
            useMessage: "You secure the rope and use it to safely cross the chasm.",
            useResult: "bridge",
            outcome: "remove",
            points: 15,
            image: "bottle-complete.png",
            position: [200, 180],
            size: [60, 40]
        },
        
        // Scene 2 items
        {
            name: "key",
            longName: "Ancient Key",
            type: "item",
            lookAt: "An old, ornate key with mysterious symbols carved into it.",
            pickUpMessage: "You carefully pick up the ancient key.",
            useWith: "door",
            useMessage: "The key fits perfectly! The door creaks open.",
            useResult: "openDoor",
            outcome: "remove",
            points: 20,
            position: [150, 200],
            size: [30, 60]
        },
        {
            name: "map",
            longName: "Treasure Map",
            type: "item",
            lookAt: "A weathered map showing the layout of the cave system.",
            pickUpMessage: "You study the map briefly before folding it carefully.",
            useWith: "compass",
            useMessage: "Using the map with the compass, you determine the correct direction.",
            useResult: "direction",
            outcome: "keep",
            points: 25,
            position: [250, 120],
            size: [80, 60]
        },
        
        // Scene 2 items (boat is in scene2, not scene3)
        {
            name: "boat",
            longName: "Small Boat",
            type: "target",
            lookAt: "A small wooden boat that looks seaworthy enough for the lake.",
            useWith: "oar",
            useMessage: "You use the oar to paddle across the lake safely. The boat takes you to the other side!",
            useResult: "crossing",
            outcome: "scene", // ["scene", "removeTarget"] Create crossing link, remove oar from inventory, remove boat from scene
            nextScene: "scene3",  // Unlocks scene3 when used
            points: 30,
            image: "boat.png",
            position: [180, 250],
            size: [120, 80]
        },


        {
            name: "oar",
            longName: "Wooden Oar",
            type: "item",
            lookAt: "A wooden oar, perfect for rowing a boat.",
            pickUpMessage: "You pick up the oar. Now you can row a boat!",
            useWith: "boat",
            useMessage: "You use the oar to paddle the boat across the water.",
            useResult: "crossing",
            outcome: "remove", // Remove oar from inventory when used on boat
            points: 15,
            position: [300, 200],
            size: [100, 30]
        },
        {
            name: "crossing",
            longName: "Lake Crossing",
            type: "link",
            lookAt: "The boat is ready to take you across the lake to the other side.",
            pickUpMessage: null,
            useWith: null,
            useMessage: "You board the boat and cross the lake to the other side.",
            useResult: null,
            outcome: "scene",
            linkToScene: "scene3",  // ← Clicking this link takes you to scene3!
            lockedMessage: "The boat isn't ready yet.",  // Message if scene3 is still locked
            points: 20,  // Points for using the crossing
            position: [200, 220],
            size: [150, 100]
        },
        
        // Additional items for other scenes...
        {
            name: "crystal",
            longName: "Glowing Crystal",
            type: "item",
            lookAt: "A beautiful crystal that glows with an inner light.",
            pickUpMessage: "The crystal feels warm in your hands.",
            useWith: "darkness",
            useMessage: "The crystal's light reveals hidden passages.",
            useResult: "revelation",
            outcome: "keep",
            points: 40,
            position: [200, 150],
            size: [40, 60]
        },
        {
            name: "treasure",
            longName: "Golden Treasure",
            type: "item",
            lookAt: "A chest filled with golden coins and precious gems.",
            pickUpMessage: "You've found the legendary treasure!",
            useWith: null,
            useMessage: "The treasure is yours! You have completed your quest.",
            useResult: "victory",
            outcome: "keep",
            points: 100,
            position: [250, 200],
            size: [100, 80]
        },

        // Scene 10 items - Treasure Chamber
        {
            name: "darkness",
            longName: "Dark Corner",
            type: "target",
            lookAt: "A dark corner of the chamber shrouded in shadows. Something seems hidden there.",
            useWith: "crystal",
            useMessage: "The crystal's light reveals hidden passages in the darkness!",
            useResult: "revelation",
            outcome: "scene",
            nextScene: "scene11",  // Reveals the path to the Guardian's Lair
            points: 50,
            image: "darkness.png",
            position: [50, 100],
            size: [80, 120]
        },
        {
            name: "revelation",
            longName: "Hidden Passage",
            type: "link",
            lookAt: "A secret passage revealed by the crystal's light. It leads deeper into the chamber.",
            pickUpMessage: null,
            useWith: null,
            useMessage: "You step through the revealed passage.",
            useResult: null,
            outcome: "scene",
            linkToScene: "scene11",  // Links to Guardian's Lair
            lockedMessage: "The passage is still hidden in darkness.",
            points: 30,
            position: [60, 110],
            size: [100, 140]
        }
    ],
    
    // Audio configuration
    audio: {
        ambient: {
            silence: null,
            ambient1: "audio/ambient1.mp3",
            ambient2: "audio/ambient2.mp3", 
            ambient3: "audio/ambient3.mp3",
            ambient4: "audio/ambient4.mp3",
            ambient5: "audio/ambient5.mp3",
            ambient6: "audio/ambient6.mp3",
            ambient7: "audio/ambient7.mp3",
            ambient8: "audio/ambient8.mp3",
            ambient9: "audio/ambient9.mp3",
            ambient10: "audio/ambient10.mp3",
            ambient11: "audio/ambient11.mp3",
            ambient12: "audio/ambient12.mp3",
            victory: "audio/victory.mp3"
        },
        sounds: {
            addToInventory: "audio/pickup.mp3",
            useItem: "audio/use.mp3",
            sceneChange: "audio/transition.mp3",
            error: "audio/error.mp3",
            success: "audio/success.mp3"
        }
    },
    
    // UI configuration
    ui: {
        actions: ["examine", "get", "use"],
        maxInventorySize: 20,
        messageDisplayTime: 3000,
        fadeTransitionTime: 1000
    },
    
    // Game settings
    settings: {
        autoSave: true,
        autoSaveInterval: 30000, // 30 seconds
        soundEnabled: true,
        musicEnabled: true,
        defaultVolume: 0.7
    }
}
