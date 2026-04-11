# 🐱 Lost in the Woods 3D

A 3D browser-based platformer about a cat lost in the woods, trying to find their way home. Built with **Three.js** and **Cannon.js**.

## 🎮 Gameplay

Navigate the cat through 3D levels filled with platforms, hazards, and collectibles. Jump across gaps, avoid dangerous obstacles, and collect coins to help the cat find their way home!

## 🕹️ Controls

| Key | Action |
|-----|--------|
| **W / Arrow Up** | Move forward |
| **A / Arrow Left** | Move left |
| **S / Arrow Down** | Move backward / Crouch |
| **D / Arrow Right** | Move right |
| **Space** | Jump |
| **Shift** | Run (hold while moving) |
| **Mouse** | Camera follows automatically |

## 🚀 Quick Start

No build step required! Just open `index.html` in any modern web browser.

```bash
# Option 1: Direct open
open index.html

# Option 2: Local server (recommended for module loading)
npx serve .
# or
python -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## 📁 Project Structure

```
cat-woods-3d/
├── index.html          # Main HTML entry point
├── README.md           # This file
├── css/
│   └── style.css       # Game styling
└── src/
    ├── main.js         # Entry point
    ├── game.js         # Main game controller with Three.js setup
    ├── player.js       # Player (cat) class with 3D physics
    ├── input.js        # Keyboard input handling
    └── level.js        # Level generation and collectibles
```

## 🏗️ Architecture

The game follows the same component-based architecture as the original 2D version:

- **Game**: Main orchestrator, initializes Three.js scene, Cannon.js physics, game loop
- **Player**: Cat entity with 3D movement, animation, and physics body
- **Level**: Procedural platform generation, collectibles, hazards
- **Input**: Keyboard handling (same API as 2D version)

### Key Differences from 2D Version

| Feature | 2D | 3D |
|---------|-----|-----|
| Rendering | HTML5 Canvas | Three.js WebGL |
| Physics | Custom AABB | Cannon.js rigid body |
| Camera | 2D scroll | Third-person follow |
| Levels | Predefined | Procedural generation |

## 🔧 Technologies

- **Three.js r160** - 3D rendering
- **Cannon-es** - 3D physics engine
- **ES Modules** - Modern JavaScript
- **Import Maps** - Native module loading (no bundler)

## 🎯 Features

- ✅ 3D platforming with physics
- ✅ 3 levels with increasing difficulty
- ✅ Collectible coins (animated)
- ✅ Lives system (9 lives!)
- ✅ Running mechanic (Shift to sprint)
- ✅ Third-person camera with smooth follow
- ✅ Procedural level generation
- ✅ Animated decorations (trees, grass, particles)
- ✅ Moving platforms
- ✅ Timer and scoring system

## 📈 Level Progression

1. **Level 1**: Basic platforms, learn the controls
2. **Level 2**: Varied heights, moving platforms
3. **Level 3**: Complex layouts, vertical challenges

## 🎨 Art Style

The game uses simple geometric shapes with a low-poly aesthetic:
- Orange box with ears/tail for the cat
- Green platforms represent mossy stones
- Trees and grass for forest atmosphere
- Gold coins with spinning animation

## 🔮 Future Enhancements

- [ ] Custom 3D models for cat character
- [ ] Textured environments
- [ ] Sound effects and music
- [ ] More level themes (cave, mountain, snow)
- [ ] Enemy AI (foxes, owls)
- [ ] Power-ups (double jump, speed boost)
- [ ] Save/load system
- [ ] High score table

## 📝 License

MIT - Feel free to use as a starting point for your own 3D platformer!

## 🙏 Credits

- Original 2D Engine: Vanilla JS with HTML5 Canvas
- 3D Rewrite: Three.js + Cannon.js
- Inspiration: Super Mario 3D, Celeste, Fez