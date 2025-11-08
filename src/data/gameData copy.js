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
            sceneName: "scene1",
            title: "The Stasis Chamber",
            textOne: "You find yourself standing at the entrance of a mysterious cave. The air is thick with anticipation.",
            stage: "Stage 1",
            stageNumber: 1,
            sceneType: "scene",
            sceneMusic: "ambient1",
            backgroundImage: "screen-stasis.png", // Background image for this scene
            items: ["torch", "rope", "crossing", "butterfly", "gear"]
        },
        {
            sceneName: "scene2",
            title: "Inside the Cave",
            textOne: "The cave is dark and damp. You can hear water dripping somewhere in the distance. You see a boat by the water's edge and a mysterious safe in the corner.",
            stage: "Stage 2",
            stageNumber: 2,
            sceneType: "scene",
            sceneMusic: "ambient2",
            backgroundImage: "scene2.png",
            items: ["key", "map", "boat", "oar", "safe_door"]  // Added safe_door for puzzle test
        },
        {
            sceneName: "safe_puzzle",
            title: "Safe Combination Lock",
            textOne: "Enter the correct combination to unlock the safe.",
            stage: "Stage 2",
            stageNumber: 2,
            sceneType: "puzzle",
            puzzleModule: "SafeCombinationPuzzle",
            puzzleConfig: {
                solution: [3, 7, 2],
                maxAttempts: 10,
                dialCount: 3,
                dialMax: 9,
                hints: [
                    "The first number is less than 5",
                    "The middle number is greater than 5",
                    "The last number is even"
                ],
                reward: "gold_bars",
                points: 50,
                returnScene: "scene2"
            },
            backgroundImage: "safe-closeup.png",
            sceneMusic: "ambient2",
            items: []
        },
        {
            sceneName: "scene3",
            title: "The Underground Lake",
            textOne: "You emerge into a vast underground cavern with a crystal-clear lake in the center.",
            stage: "Stage 3",
            stageNumber: 3,
            sceneType: "scene",
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
            sceneType: "scene",
            sceneMusic: "ambient4",
            items: ["plank", "hammer"]
        },
        {
            sceneName: "scene5",
            title: "The Forest Clearing",
            textOne: "You find yourself in a peaceful forest clearing surrounded by tall trees.",
            stage: "Stage 5",
            stageNumber: 5,
            sceneType: "scene",
            sceneMusic: "ambient5",
            items: ["berries", "stick"]
        },
        {
            sceneName: "scene6",
            title: "The Old Cabin",
            textOne: "A weathered wooden cabin sits in the middle of the clearing, its door slightly ajar.",
            stage: "Stage 6",
            stageNumber: 6,
            sceneType: "scene",
            sceneMusic: "ambient6",
            items: ["lantern", "book"]
        },
        {
            sceneName: "scene7",
            title: "The Mountain Path",
            textOne: "A winding path leads up the mountainside. The view is breathtaking but treacherous.",
            stage: "Stage 7",
            stageNumber: 7,
            sceneType: "scene",
            sceneMusic: "ambient7",
            items: ["pickaxe", "compass"]
        },
        {
            sceneName: "scene8",
            title: "The Crystal Chamber",
            textOne: "You enter a chamber filled with glowing crystals that illuminate the entire space.",
            stage: "Stage 8",
            stageNumber: 8,
            sceneType: "scene",
            sceneMusic: "ambient8",
            items: ["crystal", "gem"]
        },
        {
            sceneName: "scene9",
            title: "The Ancient Temple",
            textOne: "Before you stands an ancient temple with intricate carvings covering its walls.",
            stage: "Stage 9",
            stageNumber: 9,
            sceneType: "scene",
            sceneMusic: "ambient9",
            items: ["statue", "scroll"]
        },
        {
            sceneName: "scene10",
            title: "The Treasure Chamber",
            textOne: "You've discovered the legendary treasure chamber! Gold and jewels sparkle everywhere.",
            stage: "Stage 10",
            stageNumber: 10,
            sceneType: "scene",
            sceneMusic: "ambient10",
            items: ["treasure", "darkness"]
        },
        {
            sceneName: "scene11",
            title: "The Guardian's Lair",
            textOne: "A massive chamber where an ancient guardian once protected the treasure.",
            stage: "Stage 11",
            stageNumber: 11,
            sceneType: "scene",
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
            sceneType: "scene",
            sceneMusic: "ambient12",
            items: ["orb", "staff"]
        },
        {
            sceneName: "ending",
            title: "Victory!",
            textOne: "Congratulations! You have successfully completed your adventure and claimed the treasure!",
            stage: "The End",
            stageNumber: 13,
            sceneType: "scene",
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
            shortName: "Torch",
            type: "item",
            lookAt: "A sturdy wooden torch that could provide light in dark places.",
            pickUpMessage: "You pick up the torch. It might be useful in dark areas.",
            useWith: "darkness",
            useMessage: "The torch illuminates the area, revealing hidden details.",
            useResult: "light",
            outcome: "keep",//means stays in inventory after use
            points: 10,
            image: "butterfly1.png", // Item image filename
            position: [100, 150],
            size: [50, 80],
            animation: {
                type: "bob",
                amplitude: 5,
                speed: 1
            },
            onClickEffect: "flash",
            onClickSound: "success",
            hitW: 80,
            hitH: 100,
            style: {
                className: "item--torch",
                hoverEffect: "glow"
            }
        },

        // Puzzle items - Safe puzzle
        {
            name: "safe_door",
            longName: "Mysterious Safe",
            shortName: "Safe",
            type: "link",
            linkToScene: "safe_puzzle",
            lookAt: "A heavy safe with a combination lock. Maybe you can crack the code? (Hint: 3-7-2)",
            image: "safe-small.png",
            position: [800, 250],
            size: [150, 200],
            style: {
                className: "item--safe",
                hoverEffect: "pulse"
            }
        },
        {
            name: "gold_bars",
            longName: "Gold Bars",
            shortName: "Gold",
            type: "item",
            lookAt: "Shiny gold bars! These must be worth a fortune.",
            pickUpMessage: "You obtained the gold bars from the safe!",
            image: "gold-bars.png",
            position: [0, 0],
            size: [0, 0],
            style: {
                className: "item--gold",
                hoverEffect: "shine"
            }
        },
        {
            name: "rope",
            longName: "Coiled Rope",
            shortName: "Rope",
            type: "item",
            lookAt: "A long, sturdy rope that could be used for climbing or securing things.",
            pickUpMessage: "You coil the rope and add it to your inventory.",
            useWith: "chasm",
            useMessage: "You secure the rope and use it to safely cross the chasm.",
            useResult: "bridge",
            outcome: "remove",
            points: 15,
            image: "rope.png",
            position: [200, 180],
            size: [60, 40],
            animation: {
                type: "pulse",
                amplitude: 8,
                speed: 0.8
            },
            onClickEffect: "bounce",
            onClickSound: "success",
            style: {
                className: "item--rope",
                hoverEffect: "glow"
            }
        },
        {
            name: "butterfly",
            longName: "Butterfly",
            shortName: "Butterfly",
            type: "decor",
            lookAt: "A beautiful butterfly fluttering around the chamber.",
            pickUpMessage: null,
            useWith: null,
            useMessage: null,
            useResult: null,
            outcome: null,
            points: 0,
            image: "butterfly1.png",
            position: [900, 120],
            size: [64, 64],
            animation: {
                type: "sprite",
                fps: 8,
                frames: [
                    "butterfly1.png",
                    "butterfly2.png",
                    "butterfly3.png",
                    "butterfly4.png"
                ]
            },
            onClickEffect: "bounce",
            onClickSound: "success",
            hitW: 90,
            hitH: 90
        },
        {
            name: "gear",
            longName: "Mechanical Gear",
            shortName: "Gear",
            type: "item",
            lookAt: "A brass gear that's constantly rotating. It might be part of a mechanism.",
            pickUpMessage: "You pick up the spinning gear. It's surprisingly light.",
            useWith: "machine",
            useMessage: "The gear fits perfectly into the mechanism!",
            useResult: "machine_activated",
            outcome: "remove",
            points: 20,
            image: "gear.png",
            position: [1050, 400],
            size: [60, 60],
            animation: {
                type: "spin",
                speed: 0.5
            },
            onClickEffect: "shake",
            onClickSound: "success",
            hitW: 90,
            hitH: 90,
                        style: {
                className: "item--key",
                hoverEffect: "glow"
            }
        },

        // Scene 2 items
        {
            name: "key",
            longName: "Ancient Key",
            shortName: "Key",
            type: "item",
            lookAt: "An old, ornate key with mysterious symbols carved into it.",
            pickUpMessage: "You carefully pick up the ancient key.",
            useWith: "door",
            useMessage: "The key fits perfectly! The door creaks open.",
            useResult: "openDoor",
            outcome: "remove",
            points: 20,
            image: "karibiner.png",
            position: [150, 200],
            size: [30, 60],
            style: {
                className: "item--key",
                hoverEffect: "glow"
            }
        },
        {
            name: "map",
            longName: "Treasure Map",
            shortName: "Map",
            type: "item",
            lookAt: "A weathered map showing the layout of the cave system.",
            pickUpMessage: "You study the map briefly before folding it carefully.",
            useWith: "compass",
            useMessage: "Using the map with the compass, you determine the correct direction.",
            useResult: "direction",
            outcome: "keep",
            points: 25,
            position: [250, 120],
            size: [80, 60],
                        style: {
                className: "item--key",
                hoverEffect: "glow"
            }
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
            image: "boat-without-oar.png",
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
            size: [100, 30],
                       style: {
                className: "item--torch",
                hoverEffect: "glow"
            }
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
            linkToScene: "scene5",  // ← Clicking this link takes you to scene3!
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
            image: "crystal.png",
            position: [200, 150],
            size: [40, 60],
            animation: {
                type: "fade",
                speed: 1.5
            },
            onClickEffect: "flash",
            onClickSound: "success"
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
            outcome: "removeTarget",
            nextScene: "scene1",  // Reveals the path to the Guardian's Lair
            points: 50,
            image: "butterfly2.png",
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
            linkToScene: "scene1",  // Links to Guardian's Lair
            lockedMessage: "The passage is still hidden in darkness.",
            image: "butterfly5.png",
            points: 30,
            position: [60, 110],
            size: [100, 140]
        }

        /* ========================================
         * ANIMATION EXAMPLES
         * ========================================
         * Below are example items showing different animation types.
         * Add these to scene items arrays to use them in your game.
         *
         * SPRITE FRAME ANIMATION EXAMPLE:
         * {
         *     name: "butterfly",
         *     longName: "Butterfly",
         *     type: "decor",
         *     lookAt: "A beautiful butterfly fluttering around.",
         *     position: [300, 100],
         *     size: [64, 64],
         *     animation: {
         *         type: "sprite",
         *         fps: 12,
         *         frames: [
         *             "butterfly-frame-1.png",
         *             "butterfly-frame-2.png",
         *             "butterfly-frame-3.png",
         *             "butterfly-frame-4.png"
         *         ]
         *     },
         *     onClickEffect: "bounce",
         *     onClickSound: "success"
         * }
         *
         * SPRITE SHEET ANIMATION EXAMPLE:
         * {
         *     name: "fan_blade",
         *     longName: "Spinning Fan",
         *     type: "decor",
         *     lookAt: "An old ceiling fan spinning slowly.",
         *     position: [500, 200],
         *     size: [128, 128],
         *     animation: {
         *         type: "sprite",
         *         spriteSheet: "fan-sprite-sheet.png",
         *         frameWidth: 128,
         *         frameHeight: 128,
         *         frameCount: 8,
         *         fps: 10
         *     },
         *     onClickSound: "useItem"
         * }
         *
         * SPIN ANIMATION EXAMPLE:
         * {
         *     name: "gear",
         *     longName: "Mechanical Gear",
         *     type: "item",
         *     lookAt: "A brass gear that's constantly rotating.",
         *     pickUpMessage: "You pick up the spinning gear.",
         *     position: [400, 300],
         *     size: [60, 60],
         *     image: "gear.png",
         *     animation: {
         *         type: "spin",
         *         speed: 0.5
         *     },
         *     onClickEffect: "shake",
         *     onClickSound: "pickup"
         * }
         *
         * PUZZLE TRIGGER EXAMPLE:
         * {
         *     name: "locked_chest",
         *     longName: "Locked Chest",
         *     type: "target",
         *     lookAt: "A mysterious chest with a combination lock.",
         *     position: [600, 350],
         *     size: [120, 100],
         *     image: "chest-locked.png",
         *     animation: {
         *         type: "pulse",
         *         amplitude: 5,
         *         speed: 0.5
         *     },
         *     onClickEffect: "shake",
         *     onClickSound: "useItem",
         *     triggerPuzzle: {
         *         module: "ChestPuzzle",
         *         config: {
         *             solution: [1, 2, 3],
         *             reward: "treasure_key"
         *         }
         *     },
         *     hitW: 150,
         *     hitH: 130
         * }
         */
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
    }
}
