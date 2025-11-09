export const gameData = {
  title: "Monachus",
  version: "1.0.0",
  
  scenes: [
    {
      sceneName: "scene1",
      title: "The Vestibule of Thought",
      textOne: "You awaken in a space of shifting geometry and soft light. Thought forms echo against mirrored stone.",
      sceneType: "scene",
      sceneMusic: "ambient1",
      backgroundImage: "vestibule.png",
      items: ["fragment_glass", "whispering_gear"]
    },
    {
      sceneName: "scene2",
      title: "The Chamber of Breath",
      textOne: "The architecture breathes around you. Walls pulse gently, alive with rhythm.",
      sceneType: "scene",
      sceneMusic: "ambient2",
      backgroundImage: "chamber_breath.png",
      items: ["resonant_coil"]
    },
    {
      sceneName: "scene3",
      title: "The Corridor of Echoes",
      textOne: "Endless doors whisper memories. Behind each lies a faintly familiar sound.",
      sceneType: "scene",
      sceneMusic: "ambient3",
      backgroundImage: "corridor_echoes.png",
      items: ["tone_key", "broken_mask"]
    },
    {
      sceneName: "scene4",
      title: "The Orchard of Wires",
      textOne: "Metallic trees hum with electric fruit. The air vibrates with harmonic tension.",
      sceneType: "puzzle",
      sceneMusic: "ambient4",
      backgroundImage: "orchard_wires.png",
      items: ["fruit_light"],
      puzzleModule: "HarmonicResonancePuzzle",
      puzzleConfig: {
        solutionPattern: ["low", "mid", "high"],
        hint: "Listen to the trees — tune them until they sing together.",
        reward: "fruit_light",
        points: 40,
        returnScene: "scene4"
      }
    },
    {
      sceneName: "scene5",
      title: "The Still Lake",
      textOne: "A black mirror of water stretches into nothingness.",
      sceneType: "scene",
      sceneMusic: "ambient5",
      backgroundImage: "still_lake.png",
      items: ["shadow_seed"],
      locked: true,
      unlockedBy: "fruit_light"
    },
    {
      sceneName: "scene6",
      title: "The Observatory",
      textOne: "Rotating celestial rings drift above you, aligned to unseen harmonies.",
      sceneType: "puzzle",
      sceneMusic: "ambient6",
      backgroundImage: "observatory.png",
      items: ["orb_alignment"],
      puzzleModule: "CelestialAlignmentPuzzle",
      puzzleConfig: {
        ringCount: 3,
        hint: "The tone key hums when you align correctly.",
        reward: "orb_alignment",
        points: 50,
        returnScene: "scene6"
      }
    },
    {
      sceneName: "scene7",
      title: "The Heart Engine",
      textOne: "A massive heart-machine beats irregularly in a void of light.",
      sceneType: "scene",
      sceneMusic: "ambient7",
      backgroundImage: "heart_engine.png",
      items: ["living_core"],
      combineItems: ["shadow_seed", "orb_alignment"],
      combineResult: "living_core"
    },
    {
      sceneName: "scene8",
      title: "The Maw of Silence",
      textOne: "The void breathes without sound. Action erases it — only stillness endures.",
      sceneType: "puzzle",
      sceneMusic: "ambient8",
      backgroundImage: "maw_silence.png",
      items: ["empty_vessel"],
      puzzleModule: "StillnessTrigger",
      puzzleConfig: {
        hint: "Sometimes doing nothing is the only act.",
        waitTime: 6,
        reward: "empty_vessel"
      }
    },
    {
      sceneName: "scene9",
      title: "The Mirror Cathedral",
      textOne: "A hall of infinite reflections. Each version of you moves differently.",
      sceneType: "scene",
      sceneMusic: "ambient9",
      backgroundImage: "mirror_cathedral.png",
      items: ["vessel_light"],
      useItems: ["mirror_mask", "empty_vessel"],
      useResult: "vessel_light"
    },
    {
      sceneName: "scene10",
      title: "The Dissolution",
      textOne: "The architecture fades. The light folds inward. There is only awareness.",
      sceneType: "scene",
      sceneMusic: "ambient10",
      backgroundImage: "dissolution.png",
      items: []
    }
  ],

  sceneItems: [
    { name: "fragment_glass", longName: "Fragment of Glass", type: "item", lookAt: "A cracked shard that distorts what it reflects.", pickUpMessage: "You take the fragment. It hums faintly.", combineWith: "whispering_gear", combineResult: "lens_mechanism" },
    { name: "whispering_gear", longName: "Whispering Gear", type: "item", lookAt: "A tiny rotating cog that seems to whisper.", pickUpMessage: "It vibrates softly in your hand.", combineWith: "fragment_glass", combineResult: "lens_mechanism" },
    { name: "resonant_coil", longName: "Resonant Coil", type: "item", lookAt: "Tubing that hums with the breath of the chamber.", pickUpMessage: "The coil vibrates to your rhythm." },
    { name: "tone_key", longName: "Tone Key", type: "item", lookAt: "A tuning fork of unknown material.", pickUpMessage: "It rings softly when near sound." },
    { name: "broken_mask", longName: "Broken Mask", type: "item", lookAt: "A faceless remnant of identity.", pickUpMessage: "You lift the mask. It feels familiar.", combineWith: "fragment_glass", combineResult: "mirror_mask" },
    { name: "fruit_light", longName: "Fruit of Light", type: "item", lookAt: "A luminous sphere containing liquid brightness.", pickUpMessage: "It warms your palm." },
    { name: "shadow_seed", longName: "Shadow Seed", type: "item", lookAt: "A seed that absorbs light.", pickUpMessage: "You catch the drifting seed." },
    { name: "orb_alignment", longName: "Orb of Alignment", type: "item", lookAt: "A sphere that hums in perfect equilibrium.", pickUpMessage: "The orb pulses once in your hand." },
    { name: "living_core", longName: "Living Core", type: "item", lookAt: "A glowing heart that beats faintly.", pickUpMessage: "It synchronizes with your pulse." },
    { name: "empty_vessel", longName: "Empty Vessel", type: "item", lookAt: "A hollow shape that feels impossibly heavy.", pickUpMessage: "You accept the emptiness." },
    { name: "vessel_light", longName: "Vessel of Light", type: "item", lookAt: "A vessel filled with radiant essence.", pickUpMessage: "It hums like a distant choir." }
  ],

  audio: {
    ambient: {
      ambient1: "audio/monachus_1.mp3",
      ambient2: "audio/monachus_2.mp3",
      ambient3: "audio/monachus_3.mp3",
      ambient4: "audio/monachus_4.mp3",
      ambient5: "audio/monachus_5.mp3",
      ambient6: "audio/monachus_6.mp3",
      ambient7: "audio/monachus_7.mp3",
      ambient8: "audio/monachus_8.mp3",
      ambient9: "audio/monachus_9.mp3",
      ambient10: "audio/monachus_10.mp3"
    },
    sounds: {
      pickup: "audio/pickup.mp3",
      use: "audio/use.mp3",
      success: "audio/success.mp3",
      error: "audio/error.mp3"
    }
  }
};