# Modern Adventure Game

A modernized version of the adventure game built with pure JavaScript ES6+ modules, following best practices and scalable architecture patterns.

## 🎮 Features

- **Pure JavaScript ES6+**: No frameworks, just modern vanilla JavaScript
- **Modular Architecture**: Clean separation of concerns with ES6 modules
- **Event-Driven Design**: Decoupled systems communicating via events
- **Progressive Web App**: Offline support with service workers
- **Modern Build System**: Vite for fast development and optimized builds
- **SASS/SCSS Styling**: Maintainable and scalable CSS architecture
- **Save/Load System**: Persistent game state with localStorage
- **Audio Management**: Web Audio API integration
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

### Core Systems

- **Game**: Main orchestrator managing all game systems
- **StateManager**: Centralized state management with reactive updates
- **SceneManager**: Handles scene transitions and scene state
- **InventoryManager**: Manages item collection, usage, and combinations
- **AudioManager**: Controls music, sound effects, and audio settings
- **UIManager**: Handles all user interface interactions and updates
- **SaveManager**: Persistent storage and save/load functionality

### Design Patterns

- **Event Emitter Pattern**: For inter-system communication
- **Module Pattern**: ES6 modules for clean code organization
- **Observer Pattern**: Reactive state updates
- **Strategy Pattern**: Pluggable game mechanics
- **Command Pattern**: Action handling and undo functionality

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone or navigate to the project directory
cd adventure-game-modern

# Install dependencies
npm install

# Start development server
npm run dev

npm run dev -- --host # To access on network

# Build for production
npm run build

# Preview production build
npm run serve

#kill all running servers
killall node


### Development

The development server runs on `http://localhost:3000` with hot module replacement enabled.

## 📁 Project Structure

```
adventure-game-modern/
├── public/                 # Static assets
│   ├── assets/            # Game assets
│   │   ├── audio/         # Sound files
│   │   ├── fonts/         # Web fonts
│   │   ├── img/           # Images
│   │   └── sass/          # SCSS stylesheets
│   ├── manifest.json      # PWA manifest
│   └── sw.js             # Service worker
├── src/                   # Source code
│   ├── core/             # Core game systems
│   │   ├── Game.js       # Main game class
│   │   ├── StateManager.js
│   │   ├── SceneManager.js
│   │   ├── InventoryManager.js
│   │   ├── AudioManager.js
│   │   ├── UIManager.js
│   │   ├── SaveManager.js
│   │   └── EventEmitter.js
│   ├── data/             # Game data
│   │   └── gameData.js   # Scenes, items, configuration
│   ├── styles/           # SCSS entry point
│   │   └── main.scss
│   ├── utils/            # Utility functions
│   │   └── serviceWorker.js
│   └── main.js           # Application entry point
├── index.html            # Main HTML file
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
└── README.md            # This file
```

## 🎯 Game Features

### Core Gameplay

- **Point-and-Click Adventure**: Classic adventure game mechanics
- **13 Unique Scenes**: Diverse environments to explore
- **Inventory System**: Collect, examine, and use items
- **Item Combinations**: Combine items to create new ones
- **Progressive Difficulty**: Increasingly complex puzzles
- **Score System**: Track progress and achievements

### Technical Features

- **Auto-Save**: Automatic progress saving
- **Manual Save/Load**: Multiple save slots
- **Audio Controls**: Music and sound effect volume controls
- **Keyboard Shortcuts**: Quick action selection
- **Responsive UI**: Adapts to different screen sizes
- **Offline Play**: Works without internet connection

## 🎨 Styling Architecture

The project uses a modern SASS architecture:

- **Variables**: Centralized design tokens
- **Mixins**: Reusable style patterns
- **Components**: Modular component styles
- **Utilities**: Helper classes
- **Themes**: Scene-specific color schemes

## 🔧 Configuration

### Game Data

Game content is configured in `src/data/gameData.js`:

- Scene definitions and transitions
- Item properties and interactions
- Audio file mappings
- UI configuration
- Game settings

### Build Configuration

Vite configuration in `vite.config.js`:

- SASS preprocessing
- Asset optimization
- Development server settings
- Build output configuration

## 🧪 Development Guidelines

### Code Style

- Use ES6+ features (modules, classes, arrow functions)
- Follow consistent naming conventions
- Write self-documenting code with clear variable names
- Add JSDoc comments for public methods
- Use async/await for asynchronous operations

### Architecture Principles

- **Single Responsibility**: Each class has one clear purpose
- **Dependency Injection**: Pass dependencies through constructors
- **Event-Driven**: Use events for loose coupling
- **Immutable State**: Avoid direct state mutations
- **Error Handling**: Graceful error handling and recovery

### Performance Considerations

- Lazy load assets when possible
- Use efficient DOM manipulation
- Implement proper cleanup in destroy methods
- Optimize audio loading and playback
- Cache frequently accessed elements

## 🚀 Deployment

### Production Build

```bash
npm run build
```

Creates an optimized build in the `dist/` directory.

### PWA Features

The game includes Progressive Web App features:

- Service worker for offline caching
- Web app manifest for installation
- Responsive design for mobile devices
- Fast loading with asset optimization

## 🔄 Migration from Legacy

This modern version replaces the jQuery-based implementation with:

- **ES6 Modules** instead of global variables
- **Class-based architecture** instead of procedural code
- **Event system** instead of direct function calls
- **Modern build tools** instead of Gulp
- **SASS architecture** instead of plain CSS
- **Service workers** instead of basic caching

## 🤝 Contributing

1. Follow the established code style and architecture
2. Write tests for new features
3. Update documentation for API changes
4. Use meaningful commit messages
5. Test across different browsers and devices

## 📄 License

This project maintains the same license as the original adventure game project.

## 🎉 Acknowledgments

- Built upon the foundation of the original jQuery-based adventure game
- Modernized with current web development best practices
- Designed for scalability and maintainability
