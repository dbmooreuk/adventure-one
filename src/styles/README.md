# SASS Styles Guide

## Overview

This project uses SASS (Syntactically Awesome Style Sheets) for styling. SASS provides variables, nesting, mixins, and other features that make CSS more maintainable and powerful.

## Development Workflow

### Running the Development Server

```bash
npm run dev
```

This command will:
1. Start the SASS compiler in watch mode (automatically compiles SCSS to CSS when you save)
2. Start the Vite development server

**Important:** Edit the `.scss` files, NOT the `.css` files! The `main.css` file is auto-generated from `main.scss`.

### Building for Production

```bash
npm run build
```

This compiles the SASS to compressed CSS and builds the project for production.

### SASS Commands (if needed separately)

```bash
# Watch SCSS files and compile on change (expanded/readable format)
npm run sass:watch

# Compile SCSS once (compressed format for production)
npm run sass:build
```

## File Structure

```
src/
├── assets/
│   └── fonts/           # Web font files (woff, ttf)
└── styles/
    ├── _fonts.scss          # Font-face declarations
    ├── _variables.scss      # Color palette, typography, and design tokens
    ├── _example-usage.scss  # Examples of how to use variables
    ├── main.scss           # Main stylesheet (imports fonts & variables)
    └── README.md           # This file
```

## Typography

### Font Families

The project uses **Latin Modern Mono** as the primary font - a clean, modern monospace typeface.

**Available font variables:**
- `$font-family-mono: 'Latin Modern Mono', 'Courier New', Courier, monospace`
- `$font-family-system: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...`

**Font weights and styles:**
- Regular (400) - Normal text
- Bold (700) - Headings, emphasis
- Italic (400) - Emphasis, quotes

**Usage:**
```scss
body {
  font-family: $font-family-mono;
}

.system-text {
  font-family: $font-family-system; // Fallback to system fonts if needed
}

.emphasis {
  font-weight: 700; // Bold
  font-style: italic; // Italic
}
```

## Color Palette

### Yellow Colors
- `$main-yellow: #FFFEE0` - Main yellow color
- `$light-yellow: #F8FCE2` - Light yellow variant
- `$dark-yellow: #E3E2CA` - Dark yellow variant

### Pink Colors
- `$main-pink: #C92890` - Main pink color
- `$light-pink: #D25FA3` - Light pink variant
- `$dark-pink: #3B193C` - Dark pink variant

### Blue Colors
- `$dark-blue: #001928` - Dark blue
- `$main-blue: #091D40` - Main blue color

### Marine/Teal Colors
- `$darker-marine: #17384B` - Darkest marine
- `$dark-marine: #005B6E` - Dark marine
- `$main-marine: #619E9F` - Main marine/teal
- `$light-marine: #B2D5C7` - Light marine

### Accent Colors
- `$primary-dialog-highlight: #FFC800` - Primary highlight color

### Utility Colors
- `$white: #FFFFFF`
- `$black: #000000`

## How to Use Variables

### Basic Usage

```scss
.my-element {
  background-color: $main-pink;
  color: $light-yellow;
  border: 2px solid $dark-pink;
}
```

### With Transparency

```scss
.overlay {
  background-color: rgba($dark-blue, 0.8); // 80% opacity
}
```

### In Gradients

```scss
.gradient-bg {
  background: linear-gradient(135deg, $main-marine 0%, $dark-marine 100%);
}
```

### With Hover States

```scss
.button {
  background-color: $main-pink;
  
  &:hover {
    background-color: $light-pink;
  }
}
```

## Additional Variables

### Spacing
- `$spacing-xs: 0.25rem` (4px)
- `$spacing-sm: 0.5rem` (8px)
- `$spacing-md: 1rem` (16px)
- `$spacing-lg: 1.5rem` (24px)
- `$spacing-xl: 2rem` (32px)
- `$spacing-xxl: 3rem` (48px)

### Font Sizes
- `$font-size-xs: 0.75rem` (12px)
- `$font-size-sm: 0.875rem` (14px)
- `$font-size-base: 1rem` (16px)
- `$font-size-lg: 1.125rem` (18px)
- `$font-size-xl: 1.25rem` (20px)
- `$font-size-2xl: 1.5rem` (24px)
- `$font-size-3xl: 2rem` (32px)
- `$font-size-4xl: 2.5rem` (40px)

### Border Radius
- `$border-radius-sm: 4px`
- `$border-radius-md: 8px`
- `$border-radius-lg: 12px`
- `$border-radius-xl: 16px`
- `$border-radius-full: 9999px` (for pills/circles)

### Transitions
- `$transition-fast: 0.15s ease`
- `$transition-base: 0.3s ease`
- `$transition-slow: 0.5s ease`

### Z-Index Layers
- `$z-index-base: 1`
- `$z-index-dropdown: 10`
- `$z-index-overlay: 50`
- `$z-index-modal: 100`
- `$z-index-tooltip: 200`

## Creating New Styles

### 1. Import Variables (if creating a new SCSS file)

```scss
@use 'variables' as *;
```

Note: We use the modern `@use` syntax instead of the deprecated `@import`.

### 2. Use Variables in Your Styles

```scss
.my-component {
  background-color: $dark-blue;
  color: $light-yellow;
  padding: $spacing-lg;
  border-radius: $border-radius-md;
  transition: all $transition-base;
}
```

### 3. Use SASS Features

#### Nesting
```scss
.card {
  background: $white;
  padding: $spacing-md;
  
  .header {
    color: $main-pink;
    font-size: $font-size-xl;
  }
  
  .content {
    color: $dark-blue;
    margin-top: $spacing-sm;
  }
}
```

#### Mixins
```scss
@mixin button-style($bg, $color) {
  background-color: $bg;
  color: $color;
  padding: $spacing-sm $spacing-lg;
  border-radius: $border-radius-md;
  transition: all $transition-base;
}

.btn-primary {
  @include button-style($main-pink, $white);
}
```

## Best Practices

1. **Always use variables** instead of hardcoded colors
2. **Use spacing variables** for consistent spacing throughout the app
3. **Use transition variables** for consistent animation timing
4. **Use nesting** to keep related styles together
5. **Create mixins** for reusable style patterns
6. **Keep specificity low** - avoid deep nesting (max 3-4 levels)

## Adding New Variables

To add new variables, edit `src/styles/_variables.scss`:

```scss
// Add your new variable
$my-new-color: #123456;
```

Then use it in your styles:

```scss
.my-element {
  color: $my-new-color;
}
```

## Examples

See `_example-usage.scss` for comprehensive examples of:
- Using color variables
- Using spacing variables
- Creating gradients
- Using transparency
- Creating mixins
- Nested selectors
- And more!

## Development

When you run `npm run dev`, the SASS compiler watches your `.scss` files and automatically compiles them to `main.css` whenever you save. The compiled CSS file will be visible in `src/styles/main.css` so you can inspect the output.

**Important Notes:**
- Always edit `.scss` files, never edit `.css` files directly
- The `main.css` file is auto-generated and will be overwritten
- Changes to `.scss` files will trigger automatic recompilation
- The browser will automatically reload with your changes

## Build

When you run `npm run build`, SASS compiles all `.scss` files into optimized, compressed CSS for production.

