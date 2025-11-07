/**
 * Sample Game Data
 * Use this as a reference or import it to test the editor
 */

export const gameData = {
    title: "Sample Adventure Game",
    version: "1.0.0",

    scenes: [
        {
            sceneName: "start",
            title: "The Beginning",
            textOne: "You wake up in a mysterious room. There's a door to the north and a window to the east.",
            stage: "Stage 1",
            stageNumber: 1,
            sceneType: "scene",
            sceneMusic: "ambient1",
            backgroundImage: "room.png",
            items: ["key", "note", "door"]
        },
        {
            sceneName: "garden",
            title: "The Garden",
            textOne: "A beautiful garden with flowers and a fountain.",
            stage: "Stage 2",
            stageNumber: 2,
            sceneType: "scene",
            sceneMusic: "ambient2",
            backgroundImage: "garden.png",
            items: ["flower", "fountain"],
            locked: true,
            unlockedBy: "key"
        }
    ],

    sceneItems: [
        {
            name: "key",
            longName: "Rusty Key",
            shortName: "Key",
            type: "item",
            lookAt: "An old rusty key. It might open something.",
            pickUpMessage: "You pick up the rusty key.",
            useWith: "door",
            useMessage: "The key fits! The door unlocks.",
            useResult: "unlock_door",
            outcome: "remove",
            points: 10,
            image: "key.png",
            position: [200, 300],
            size: [40, 60],
            style: {
                className: "item--key",
                hoverEffect: "glow"
            }
        },
        {
            name: "note",
            longName: "Mysterious Note",
            shortName: "Note",
            type: "item",
            lookAt: "A note that reads: 'The key opens the door to the garden.'",
            pickUpMessage: "You pick up the note and read it.",
            useWith: null,
            useMessage: null,
            useResult: null,
            outcome: "keep",
            points: 5,
            image: "note.png",
            position: [400, 250],
            size: [60, 40]
        },
        {
            name: "door",
            longName: "Wooden Door",
            shortName: "Door",
            type: "link",
            linkToScene: "garden",
            lookAt: "A sturdy wooden door. It appears to be locked.",
            lockedMessage: "The door is locked. You need a key.",
            image: "door.png",
            position: [640, 200],
            size: [100, 200],
            style: {
                className: "item--door",
                hoverEffect: "pulse"
            }
        },
        {
            name: "flower",
            longName: "Beautiful Flower",
            shortName: "Flower",
            type: "decor",
            lookAt: "A beautiful red flower swaying in the breeze.",
            pickUpMessage: null,
            useWith: null,
            useMessage: null,
            useResult: null,
            outcome: null,
            points: 0,
            image: "flower.png",
            position: [300, 400],
            size: [50, 80],
            animation: {
                type: "bob",
                speed: 0.8,
                amplitude: 5
            },
            style: {
                className: "item--flower",
                hoverEffect: "glow"
            }
        },
        {
            name: "fountain",
            longName: "Stone Fountain",
            shortName: "Fountain",
            type: "target",
            lookAt: "A beautiful stone fountain with crystal clear water.",
            useWith: "bucket",
            useMessage: "You fill the bucket with water from the fountain.",
            useResult: "filled_bucket",
            outcome: "keep",
            points: 15,
            image: "fountain.png",
            position: [640, 360],
            size: [120, 150]
        }
    ]
};

