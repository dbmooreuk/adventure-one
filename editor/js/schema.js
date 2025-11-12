/**
 * Data Schema and Validation
 * Defines the structure and validation rules for game data
 */

export const ITEM_TYPES = ['item', 'target', 'link', 'decor'];
export const SCENE_TYPES = ['scene', 'puzzle'];
export const ANIMATION_TYPES = ['bob', 'pulse', 'spin', 'fade', 'sprite'];
export const HOVER_EFFECTS = ['glow', 'pulse', 'shine', 'swing'];
export const CLICK_EFFECTS = ['flash', 'bounce', 'shake'];
export const OUTCOMES = ['keep', 'remove', 'scene', 'removeTarget'];

/**
 * Scene Schema Definition
 */
export const sceneSchema = {
    sceneName: {
        type: 'string',
        required: true,
        label: 'Scene Name',
        help: 'Unique identifier for the scene (e.g., "scene1")',
        validate: (value) => {
            if (!value) return 'Scene name is required';
            if (!/^[a-z0-9_]+$/.test(value)) return 'Scene name must be lowercase letters, numbers, and underscores only';
            return null;
        }
    },
    title: {
        type: 'string',
        required: true,
        label: 'Title',
        help: 'Display title for the scene'
    },
    textOne: {
        type: 'textarea',
        required: true,
        label: 'Description',
        help: 'Main description text shown when entering the scene'
    },
    stage: {
        type: 'string',
        required: true,
        label: 'Stage',
        help: 'Stage label (e.g., "Stage 1")'
    },
    stageNumber: {
        type: 'number',
        required: true,
        label: 'Stage Number',
        help: 'Numeric stage number',
        min: 1,
        max: 99
    },
    sceneType: {
        type: 'select',
        required: true,
        label: 'Scene Type',
        options: SCENE_TYPES,
        default: 'scene'
    },
    sceneMusic: {
        type: 'string',
        required: false,
        label: 'Background Music',
        help: 'Audio file name (without extension)'
    },
    backgroundImage: {
        type: 'image',
        required: false,
        label: 'Background Image',
        help: 'Background image filename'
    },
    backgroundColor: {
        type: 'color',
        required: false,
        label: 'Background Color',
        help: 'Hex color value (e.g., #1a0a00) - shown behind image or when no image is set',
        default: '#000000'
    },
    items: {
        type: 'multiselect',
        required: false,
        label: 'Items in Scene',
        help: 'Select items that appear in this scene',
        default: []
    },
    locked: {
        type: 'boolean',
        required: false,
        label: 'Locked',
        help: 'Is this scene initially locked?',
        default: false
    },
    unlockedBy: {
        type: 'string',
        required: false,
        label: 'Unlocked By',
        help: 'Item name that unlocks this scene',
        condition: (data) => data.locked === true
    },
    puzzleModule: {
        type: 'string',
        required: false,
        label: 'Puzzle Module',
        help: 'Name of the puzzle module to load',
        condition: (data) => data.sceneType === 'puzzle'
    },
    puzzleConfig: {
        type: 'json',
        required: false,
        label: 'Puzzle Configuration',
        help: 'JSON configuration for the puzzle',
        condition: (data) => data.sceneType === 'puzzle'
    },
    puzzleWidth: {
        type: 'number',
        required: false,
        label: 'Puzzle Width',
        help: 'Width of puzzle container in pixels (default: 824)',
        default: 824,
        condition: (data) => data.sceneType === 'puzzle'
    },
    puzzleHeight: {
        type: 'number',
        required: false,
        label: 'Puzzle Height',
        help: 'Height of puzzle container in pixels (default: 554)',
        default: 554,
        condition: (data) => data.sceneType === 'puzzle'
    },
    puzzleTop: {
        type: 'number',
        required: false,
        label: 'Puzzle Top Position',
        help: 'Top position in pixels (leave empty for auto-center)',
        condition: (data) => data.sceneType === 'puzzle'
    },
    puzzleLeft: {
        type: 'number',
        required: false,
        label: 'Puzzle Left Position',
        help: 'Left position in pixels (leave empty for auto-center)',
        condition: (data) => data.sceneType === 'puzzle'
    },
    puzzleRight: {
        type: 'number',
        required: false,
        label: 'Puzzle Right Position',
        help: 'Right position in pixels (leave empty for auto-center)',
        condition: (data) => data.sceneType === 'puzzle'
    },
    puzzleBottom: {
        type: 'number',
        required: false,
        label: 'Puzzle Bottom Position',
        help: 'Bottom position in pixels (leave empty for auto-center)',
        condition: (data) => data.sceneType === 'puzzle'
    }
};

/**
 * Item Schema Definition
 */
export const itemSchema = {
    name: {
        type: 'string',
        required: true,
        label: 'Name',
        help: 'Unique identifier (lowercase, no spaces)',
        validate: (value) => {
            if (!value) return 'Name is required';
            if (!/^[a-z0-9_]+$/.test(value)) return 'Name must be lowercase letters, numbers, and underscores only';
            return null;
        }
    },
    longName: {
        type: 'string',
        required: true,
        label: 'Long Name',
        help: 'Full display name'
    },
    shortName: {
        type: 'string',
        required: false,
        label: 'Short Name',
        help: 'Abbreviated name for inventory'
    },
    type: {
        type: 'select',
        required: true,
        label: 'Type',
        options: ITEM_TYPES,
        default: 'item'
    },
    lookAt: {
        type: 'textarea',
        required: true,
        label: 'Look At Description',
        help: 'Text shown when examining the item'
    },
    pickUpMessage: {
        type: 'string',
        required: false,
        label: 'Pick Up Message',
        help: 'Message shown when picking up the item',
        condition: (data) => data.type === 'item'
    },
    useWith: {
        type: 'item-select',
        required: false,
        label: 'Use With',
        help: 'Item this can be used with'
    },
    useMessage: {
        type: 'string',
        required: false,
        label: 'Use Message',
        help: 'Message shown when using the item'
    },
    useResult: {
        type: 'item-select',
        required: false,
        label: 'Use Result',
        help: 'Item to add when used (appears on scene or in inventory based on outcome)'
    },
    outcome: {
        type: 'multi-select-dropdown',
        required: false,
        label: 'Outcome',
        options: OUTCOMES,
        help: 'What happens after using the item (can select multiple)'
    },
    combineWith: {
        type: 'item-select',
        required: false,
        label: 'Combine With',
        help: 'Item this can be combined with (inventory only)'
    },
    combineResult: {
        type: 'item-select',
        required: false,
        label: 'Combine Result',
        help: 'Item created when combined'
    },
    combineMessage: {
        type: 'string',
        required: false,
        label: 'Combine Message',
        help: 'Message shown when items are combined'
    },
    combinePoints: {
        type: 'number',
        required: false,
        label: 'Combine Points',
        help: 'Points awarded for combining',
        default: 0,
        min: 0
    },
    linkToScene: {
        type: 'string',
        required: false,
        label: 'Link To Scene',
        help: 'Scene name to link to',
        condition: (data) => data.type === 'link'
    },
    nextScene: {
        type: 'string',
        required: false,
        label: 'Next Scene',
        help: 'Scene to unlock when used',
        condition: (data) => data.outcome === 'scene'
    },
    lockedMessage: {
        type: 'string',
        required: false,
        label: 'Locked Message',
        help: 'Message shown if link is locked',
        condition: (data) => data.type === 'link'
    },
    points: {
        type: 'number',
        required: false,
        label: 'Points',
        help: 'Points awarded for this item',
        default: 0,
        min: 0
    },
    image: {
        type: 'image',
        required: false,
        label: 'Image',
        help: 'Item image filename'
    },
    zIndex: {
        type: 'number',
        required: false,
        label: 'Z-Index',
        help: 'Layer order (higher numbers appear on top)',
        default: 1,
        min: 0,
        max: 100
    },
    position: {
        type: 'position',
        required: false,
        label: 'Position [X, Y]',
        help: 'Position on scene canvas',
        default: [0, 0]
    },
    size: {
        type: 'size',
        required: false,
        label: 'Size [W, H]',
        help: 'Width and height in pixels',
        default: [50, 50]
    },
    hitW: {
        type: 'number',
        required: false,
        label: 'Hit Width',
        help: 'Touch target width (larger than visual size)',
        min: 0
    },
    hitH: {
        type: 'number',
        required: false,
        label: 'Hit Height',
        help: 'Touch target height (larger than visual size)',
        min: 0
    },
    nonInteractive: {
        type: 'boolean',
        required: false,
        label: 'Non-Interactive',
        help: 'If checked, item is visible but not clickable (decorative only)',
        default: false
    },
    animation: {
        type: 'animation',
        required: false,
        label: 'Animation',
        help: 'Animation configuration'
    },
    onClickEffect: {
        type: 'select',
        required: false,
        label: 'Click Effect',
        options: CLICK_EFFECTS,
        help: 'Visual effect when clicked'
    },
    onClickSound: {
        type: 'string',
        required: false,
        label: 'Click Sound',
        help: 'Sound to play when clicked'
    },
    style: {
        type: 'style',
        required: false,
        label: 'Style',
        help: 'CSS class and hover effect'
    }
};

/**
 * Animation Schema (nested)
 */
export const animationSchema = {
    type: {
        type: 'select',
        required: true,
        label: 'Animation Type',
        options: ANIMATION_TYPES
    },
    speed: {
        type: 'number',
        required: false,
        label: 'Speed',
        help: 'Animation speed multiplier',
        default: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        condition: (data) => ['bob', 'pulse', 'spin', 'fade'].includes(data.type)
    },
    amplitude: {
        type: 'number',
        required: false,
        label: 'Amplitude',
        help: 'Movement distance in pixels',
        default: 10,
        min: 1,
        max: 50,
        condition: (data) => ['bob', 'pulse'].includes(data.type)
    },
    fps: {
        type: 'number',
        required: false,
        label: 'FPS',
        help: 'Frames per second',
        default: 12,
        min: 1,
        max: 60,
        condition: (data) => data.type === 'sprite'
    },
    frames: {
        type: 'array',
        required: false,
        label: 'Frame Images',
        help: 'Array of image filenames for sprite animation',
        condition: (data) => data.type === 'sprite'
    }
};

/**
 * Style Schema (nested)
 */
export const styleSchema = {
    className: {
        type: 'string',
        required: false,
        label: 'CSS Class Name',
        help: 'Custom CSS class'
    },
    hoverEffect: {
        type: 'select',
        required: false,
        label: 'Hover Effect',
        options: HOVER_EFFECTS
    }
};

/**
 * Validate data against schema
 */
export function validateField(fieldName, value, schema, allData = {}) {
    const field = schema[fieldName];
    if (!field) return null;

    // Check if field should be shown based on condition
    if (field.condition && !field.condition(allData)) {
        return null; // Field not applicable
    }

    // Required check
    if (field.required && (value === null || value === undefined || value === '')) {
        return `${field.label} is required`;
    }

    // Custom validation
    if (field.validate) {
        return field.validate(value);
    }

    // Type-specific validation
    if (field.type === 'number' && value !== null && value !== undefined && value !== '') {
        const num = Number(value);
        if (isNaN(num)) return `${field.label} must be a number`;
        if (field.min !== undefined && num < field.min) return `${field.label} must be at least ${field.min}`;
        if (field.max !== undefined && num > field.max) return `${field.label} must be at most ${field.max}`;
    }

    return null;
}

/**
 * Validate entire object against schema
 */
export function validateObject(data, schema) {
    const errors = {};
    
    for (const fieldName in schema) {
        const error = validateField(fieldName, data[fieldName], schema, data);
        if (error) {
            errors[fieldName] = error;
        }
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
}

