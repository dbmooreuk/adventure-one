# Animation System Enhancement Proposal

## Problem
Currently, animations are mutually exclusive - you can only have ONE animation type (bob, pulse, spin, fade, sprite, or random). Users want to combine animations, like a sprite that also bobs, or an item that spins and fades.

## Solution: Layered Animation System

### Concept
Separate animations into two layers:
1. **Base Animation** - Primary visual (sprite, random, or none)
2. **Transform Modifiers** - Secondary effects that can be stacked (bob, pulse, spin, fade)

### Data Schema

**Old Format (single animation):**
```javascript
animation: {
    type: 'bob',
    speed: 1,
    amplitude: 10
}
```

**New Format (layered):**
```javascript
animation: {
    base: 'sprite',           // or 'random' or null/undefined for static
    transforms: ['bob', 'fade'], // Array of transform modifiers
    
    // Base animation settings
    fps: 12,                  // For sprite
    frames: ['frame1.png', 'frame2.png'],
    
    // Transform settings
    speed: 1,                 // Applies to all transforms
    bobAmplitude: 10,         // Specific to bob
    pulseAmplitude: 10,       // Specific to pulse
    fadeMin: 0.5,             // Specific to fade (min opacity)
    fadeMax: 1.0              // Specific to fade (max opacity)
}
```

### Examples

**Example 1: Sprite + Bob**
```javascript
{
    name: "butterfly",
    animation: {
        base: 'sprite',
        transforms: ['bob'],
        frames: ['butterfly1.png', 'butterfly2.png', 'butterfly3.png'],
        fps: 8,
        speed: 1,
        bobAmplitude: 15
    }
}
```
→ Animated butterfly that flaps wings AND bobs up and down

**Example 2: Static + Spin + Fade**
```javascript
{
    name: "magic_orb",
    animation: {
        base: null,  // or omit - static image
        transforms: ['spin', 'fade'],
        speed: 0.5,
        fadeMin: 0.3,
        fadeMax: 1.0
    }
}
```
→ Static orb image that spins AND fades in/out

**Example 3: Random Movement + Pulse**
```javascript
{
    name: "firefly",
    animation: {
        base: 'random',
        transforms: ['pulse'],
        speed: 1,
        pulseAmplitude: 20
    }
}
```
→ Item that moves randomly AND pulses in size

**Example 4: Sprite Only (backward compatible)**
```javascript
{
    name: "flag",
    animation: {
        base: 'sprite',
        transforms: [],  // or omit
        frames: ['flag1.png', 'flag2.png'],
        fps: 6
    }
}
```
→ Just animated sprite, no transforms

## Editor UI Design

### Animation Editor Panel

```
┌─────────────────────────────────────┐
│ Animation                           │
├─────────────────────────────────────┤
│                                     │
│ Base Animation:                     │
│ ○ None (Static)                     │
│ ● Sprite                            │
│ ○ Random Movement                   │
│                                     │
│ ┌─ Sprite Settings ────────────┐   │
│ │ Type: ● Spritesheet           │   │
│ │       ○ Multiple Images       │   │
│ │                               │   │
│ │ [Spritesheet settings...]     │   │
│ └───────────────────────────────┘   │
│                                     │
│ Transform Modifiers:                │
│ ☑ Bob      ☐ Pulse                  │
│ ☐ Spin     ☑ Fade                   │
│                                     │
│ ┌─ Transform Settings ─────────┐   │
│ │ Speed: [1.0    ] ×            │   │
│ │                               │   │
│ │ Bob Amplitude: [10  ] px      │   │
│ │ Fade Range: [0.5] to [1.0]    │   │
│ └───────────────────────────────┘   │
│                                     │
│ [Preview Animation]                 │
└─────────────────────────────────────┘
```

### Key UI Features:
1. **Radio buttons** for base animation (none/sprite/random)
2. **Checkboxes** for transform modifiers (can select multiple)
3. **Conditional fields** - only show settings for selected options
4. **Live preview** - shows combined animation effect

## Implementation Strategy

### Phase 1: Backward Compatibility
- Support BOTH old and new formats
- Auto-convert old format to new format internally
- Old format: `{type: 'bob', speed: 1}` → New: `{base: null, transforms: ['bob'], speed: 1}`

### Phase 2: Update Animation Engine
- Modify `startAnimation()` to apply base + transforms
- Combine transform matrices (bob + spin = translateY + rotate)
- Handle opacity separately (fade doesn't use transform)

### Phase 3: Update Editor
- New UI with radio + checkboxes
- Conditional field display
- Export to new format

### Phase 4: Migration Tool
- Add button in editor to "Upgrade Animation Format"
- Converts all items from old to new format
- Optional - can keep old format working indefinitely

## Benefits

✅ **Intuitive** - Clear separation between base and modifiers
✅ **Flexible** - Any combination of transforms
✅ **Backward Compatible** - Old animations still work
✅ **Extensible** - Easy to add new transform types
✅ **Editor-Friendly** - Checkboxes make it obvious you can combine
✅ **Performance** - Same rendering cost, just combined transforms

## Alternative: Simple Multi-Select

If the layered approach is too complex, a simpler option:

```javascript
animation: {
    types: ['sprite', 'bob', 'fade'],  // Multi-select array
    // ... settings for each type
}
```

Editor: Multi-select dropdown or checkboxes for all types.

**Pros:** Simpler data structure
**Cons:** Less clear that sprite/random are different from transforms

