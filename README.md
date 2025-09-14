# 🏠 House Head Chase

A thrilling survival game where you play as a blue dot trying to escape from terrifying House Heads that spawn and hunt you down! Survive as long as you can while collecting power-ups and avoiding damage.

## 🎮 Game Features

- **Survival Gameplay**: Dodge House Heads that spawn randomly and grow legs to chase you
- **Power-up System**: Collect health packs, shields, and speed boosts
- **Progressive Difficulty**: More enemies spawn as you level up
- **Flashlight Mechanic**: Use your flashlight to see enemies, but it reveals your location
- **Mobile & Desktop Support**: Touch controls for mobile, mouse controls for desktop
- **PWA Ready**: Install as an app on your device for offline play
- **High Score System**: Track your best survival times locally

## 🎯 How to Play

### Controls
- **Mobile**: Touch and drag the blue dot to move
- **Desktop**: Click and drag with mouse
- **Flashlight**: Double tap/click anywhere to toggle flashlight

### Objective
Survive as long as possible while avoiding contact with House Heads!

### Enemies
- **Small Houses**: Fast but deal less damage (15 HP)
- **Big Houses**: Slower but deal more damage (25 HP)
- Houses spawn → become dormant → grow legs → hunt you down!

### Power-ups
- **💚 Health Pack**: Restores 30 health points
- **🛡️ Shield**: Temporary invincibility for 5 seconds
- **⚡ Speed Boost**: Move 2x faster for 8 seconds

### Strategy Tips
- Use the flashlight to see hidden enemies, but use it sparingly
- Stay away from areas where houses are spawning
- Collect power-ups to survive longer
- Higher levels mean more frequent enemy spawns

## 🛠 Technical Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Graphics**: HTML5 Canvas with 2D rendering
- **Audio**: Web Audio API for sound effects
- **PWA**: Service Worker for offline functionality
- **Storage**: LocalStorage for high scores
- **Mobile**: Touch events and responsive design

## 📁 Project Structure

```
house-head-chase/
├── index.html          # Main game page
├── styles.css          # Game styling and responsive design
├── game.js             # Core game logic and classes
├── manifest.json       # PWA manifest
├── sw.js               # Service worker for offline support
├── offline.html        # Offline fallback page
├── README.md           # Project documentation
└── icons/              # PWA icons (various sizes)
    ├── icon-72.png
    ├── icon-96.png
    ├── icon-128.png
    ├── icon-144.png
    ├── icon-152.png
    ├── icon-192.png
    ├── icon-384.png
    └── icon-512.png
```

## 🚀 Getting Started

### Local Development

1. **Clone or download** the project files
2. **Start a local server** (required for PWA features):
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```
3. **Open** `http://localhost:8000` in your browser
4. **Start playing!**

### Deployment

Deploy to any static hosting service:
- **GitHub Pages**: Push to a repository and enable Pages
- **Netlify**: Drag and drop the folder or connect via Git
- **Vercel**: Connect your repository for automatic deployments
- **Firebase Hosting**: Use `firebase deploy`

## 🎨 Game Architecture

### Core Classes

- **`SoundSystem`**: Manages Web Audio API for game sounds
- **`Enemy`**: Handles house spawning, movement, and AI behavior
- **`Powerup`**: Manages power-up spawning, collection, and effects
- **`gameState`**: Central state management for all game data

### Key Systems

- **Game Loop**: 60 FPS update/render cycle using `requestAnimationFrame`
- **Input Handling**: Unified touch and mouse event system
- **Collision Detection**: Distance-based collision for player/enemy/powerup interactions
- **Visibility System**: Dynamic enemy visibility based on flashlight state
- **UI Management**: Real-time HUD updates and modal system

### Rendering Pipeline

1. **Clear Canvas**: Reset the drawing surface
2. **Draw Background**: Gradient background with animated stars
3. **Draw Flashlight**: Radial gradient light effect when active
4. **Draw Powerups**: Animated collectible items
5. **Draw Enemies**: Houses with legs when active
6. **Draw Player**: Blue dot with shield effects
7. **Apply Camera Shake**: Screen shake on damage

## 🔧 Configuration

### Game Balance

Adjust these values in `game.js` for different difficulty:

```javascript
// Enemy spawn rate (milliseconds)
spawnRate: 3000  // Lower = more frequent spawns

// Powerup spawn rate  
powerupSpawnRate: 12000  // Lower = more frequent powerups

// Player speed
baseSpeed: 3  // Higher = faster movement

// Health values
maxHealth: 100  // Player starting health
```

### Power-up Configuration

Modify `PowerupTypes` object to adjust power-up effects:

```javascript
HEALTH: {
    value: 30,        // Health restored
    spawnWeight: 0.4  // Spawn probability
},
SHIELD: {
    duration: 5000    // Shield time in milliseconds
},
SPEED: {
    value: 2,         // Speed multiplier
    duration: 8000    // Boost duration
}
```

## 📱 PWA Features

- **Offline Play**: Full game functionality without internet
- **Install Prompt**: Add to home screen on mobile devices
- **Background Sync**: High score syncing when connection returns
- **Responsive Design**: Optimized for all screen sizes
- **Touch Controls**: Native mobile experience

## 🎵 Audio System

- **Dynamic Sound Generation**: Uses Web Audio API oscillators
- **Sound Types**: Spawn, damage, level up, flashlight, powerup
- **Audio Toggle**: Players can mute/unmute all sounds
- **Browser Compatibility**: Graceful fallback when audio unavailable

## 🏆 High Score System

- **Local Storage**: Scores saved in browser's localStorage
- **Top 10 Tracking**: Maintains list of best survival times
- **Score Metrics**: Tracks survival time, level reached, and date
- **Sorting**: Automatically sorts by highest score

## 🐛 Browser Compatibility

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
- **Mobile Browsers**: iOS Safari 11+, Chrome Mobile 60+
- **Required Features**: Canvas 2D, Web Audio API, LocalStorage, Service Workers

## 🎮 Game States

1. **Start Screen**: Welcome screen with instructions
2. **Playing**: Active gameplay with HUD visible
3. **Game Over**: Shows final stats and options
4. **Modals**: Help, high scores, and sharing overlays

## 📊 Performance Optimization

- **Efficient Rendering**: Only draws visible enemies
- **Object Pooling**: Reuses game objects when possible
- **Collision Optimization**: Distance checks before expensive calculations
- **Memory Management**: Proper cleanup of DOM elements and event listeners

## 🔄 Future Enhancements

- **Multiplayer Support**: Real-time multiplayer survival
- **More Power-ups**: Additional special abilities
- **Boss Enemies**: Special large houses with unique behaviors
- **Achievements System**: Unlock rewards for specific goals
- **Sound Effects**: More diverse audio feedback
- **Visual Effects**: Particle systems and improved animations

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- **Font Sources**: Google Fonts (Creepster, Orbitron, Exo 2)
- **Icon Generation**: PWA icon generator tools
- **Inspiration**: Classic arcade survival games

---

**Made with ❤️ for survival game enthusiasts!**

Survive as long as you can! 🏠💀
