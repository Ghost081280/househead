# 🏠 House Head Chase

A thrilling survival game for kids where you play as a blue dot trying to escape from terrifying House Heads that spawn and hunt you down! Survive as long as you can while collecting power-ups and avoiding damage.

[![Play Now](https://img.shields.io/badge/Play%20Now-🎮%20www.househeadchase.com-ff4444?style=for-the-badge)](https://www.househeadchase.com)
[![Follow on Twitter](https://img.shields.io/badge/Follow-@househeadchase-1da1f2?style=for-the-badge&logo=twitter)](https://x.com/househeadchase)

## 🎮 Game Features

- **🎯 Kid-Friendly Survival Gameplay**: Dodge House Heads that spawn randomly and grow legs to chase you
- **⚡ Power-up System**: Collect health packs, shields, and speed boosts
- **📈 Progressive Difficulty**: More enemies spawn as you level up
- **🔦 Flashlight Mechanic**: Use your flashlight to see enemies, but it reveals your location
- **📱 Cross-Platform**: Touch controls for mobile, mouse controls for desktop
- **📲 PWA Ready**: Install as an app on your device for offline play
- **🏆 Global Leaderboard**: Compete with players worldwide (with Google Sign-In)
- **👨‍👩‍👧‍👦 Family Safe**: COPPA compliant, no inappropriate content

## 🎯 How to Play

### Controls
- **📱 Mobile**: Touch and drag the blue dot to move
- **🖥️ Desktop**: Click and drag with mouse
- **🔦 Flashlight**: Double tap/click anywhere to toggle flashlight

### Objective
Survive as long as possible while avoiding contact with House Heads!

### Enemies
- **🏠 Small Houses**: Fast but deal less damage (12 HP)
- **🏚️ Big Houses**: Slower but deal more damage (20 HP)
- Houses spawn → become dormant → grow legs → hunt you down!

### Power-ups
- **💚 Health Pack**: Restores 35 health points
- **🛡️ Shield**: Temporary invincibility for 6 seconds
- **⚡ Speed Boost**: Move faster for 10 seconds

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
- **Storage**: LocalStorage for local scores + Firebase for global leaderboard
- **Authentication**: Firebase Auth with Google Sign-In
- **Database**: Cloud Firestore for global scores
- **Mobile**: Touch events and responsive design

## 📁 Project Structure

```
house-head-chase/
├── index.html              # Main game page
├── styles.css              # Game styling and responsive design
├── game.js                 # Core game logic and classes
├── config.js               # Game configuration
├── firebase-integration.js # Firebase auth & leaderboard
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker for offline support
├── offline.html            # Offline fallback page
├── package.json            # Project dependencies
├── firebase.json           # Firebase configuration
├── .firebaserc             # Firebase project settings
├── README.md               # Project documentation
├── scripts/                # Build and utility scripts
│   ├── generate-icons.js   # Icon generation
│   └── build.js           # Production build script
└── icons/                  # PWA icons (various sizes)
    ├── icon-192.png
    ├── icon-512.png
    └── ... (other sizes)
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm 8+
- Firebase CLI (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/househeadchase/house-head-chase.git
   cd house-head-chase
   ```

2. **Install dependencies**
   ```bash
   npm install
   npm run setup
   ```

3. **Start local server**
   ```bash
   npm start
   ```

4. **Open** `http://localhost:3000` in your browser
5. **Start playing!**

### Firebase Setup (for Global Features)

1. **Create Firebase Project**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

2. **Configure Firebase**
   - Enable Authentication (Google provider)
   - Set up Cloud Firestore
   - Configure hosting

3. **Update Firebase Config**
   - Replace Firebase config in `config.js` with your project settings
   - Update project IDs in `.firebaserc`

### Deployment

```bash
# Build for production
npm run build

# Deploy to Firebase
npm run deploy:production

# Or deploy to staging
npm run deploy:staging
```

## 🎨 Game Architecture

### Core Classes

- **`SoundSystem`**: Manages Web Audio API for game sounds
- **`Enemy`**: Enhanced AI for house spawning, movement, and behavior
- **`Powerup`**: Manages power-up spawning, collection, and effects
- **`FirebaseManager`**: Handles authentication and global leaderboard
- **`gameState`**: Central state management for all game data

### Key Systems

- **Game Loop**: 60 FPS update/render cycle using `requestAnimationFrame`
- **Enhanced AI**: Smart enemy behavior with separation, pathfinding, and hunting
- **Collision Detection**: Optimized physics with realistic bouncing
- **Visibility System**: Dynamic enemy visibility based on flashlight state
- **Global Leaderboard**: Real-time score submission and ranking
- **PWA Features**: Offline support, install prompts, background sync

## 🔧 Configuration

### Game Balance (Kid-Friendly)

```javascript
// Slower, more forgiving gameplay
difficulty: {
    baseSpawnRate: 4000,     // Slower enemy spawning
    minSpawnRate: 2000,      // Reasonable minimum
    levelScaling: 0.1        // Gentler difficulty curve
},

// More generous power-ups
powerups: {
    spawnRate: 10000,        // More frequent power-ups
    health: { value: 35 },   // More healing
    shield: { duration: 6000 }, // Longer protection
    speed: { duration: 10000 }  // Longer boost
}
```

## 📱 PWA Features

- **🔄 Offline Play**: Full game functionality without internet
- **📲 Install Prompt**: Add to home screen on mobile devices
- **🔄 Background Sync**: Score syncing when connection returns
- **📱 Responsive Design**: Optimized for all screen sizes
- **👆 Touch Controls**: Native mobile experience

## 🔐 Privacy & Safety

- **👨‍👩‍👧‍👦 COPPA Compliant**: Safe for children under 13
- **🔒 Secure Authentication**: Google Sign-In with minimal permissions
- **🛡️ Content Filtering**: Kid-safe player names and content
- **📊 Privacy-First Analytics**: No personal data collection
- **🚫 Ad-Free**: Completely free with no advertisements

## 🏆 Global Leaderboard

- **🌍 Worldwide Competition**: Compete with players globally
- **🔐 Secure Scores**: Firebase-verified score submission
- **👤 User Profiles**: Google Sign-In for persistent progress
- **📊 Real-Time Rankings**: Live leaderboard updates
- **🏅 Achievement Tracking**: Personal best records

## 🐛 Browser Compatibility

- **✅ Modern Browsers**: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
- **📱 Mobile Browsers**: iOS Safari 11+, Chrome Mobile 60+
- **🔧 Required Features**: Canvas 2D, Web Audio API, LocalStorage, Service Workers

## 🔄 Development Workflow

```bash
# Development
npm run dev          # Start local server
npm run lint         # Check code quality
npm run test         # Run tests

# Building
npm run build        # Production build
npm run build:icons  # Generate PWA icons

# Deployment
npm run deploy:staging    # Deploy to staging
npm run deploy:production # Deploy to production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📊 Performance

- **⚡ Load Time**: < 2 seconds on 3G
- **📱 Mobile Optimized**: 60 FPS on most devices
- **💾 Small Bundle**: < 100KB total size
- **🔄 Offline Ready**: Works without internet

## 📞 Support

- **🌐 Website**: [www.househeadchase.com](https://www.househeadchase.com)
- **🐦 Twitter**: [@househeadchase](https://x.com/househeadchase)
- **📧 Email**: [support@househeadchase.com](mailto:support@househeadchase.com)
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/househeadchase/house-head-chase/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **👨‍👩‍👧‍👦 Beta Testers**: Thanks to all the families who tested the game
- **🎮 Inspiration**: Classic arcade survival games
- **🔥 Firebase**: For providing amazing backend services
- **🌐 Web Standards**: For making PWAs possible

---

**Made with ❤️ for kids and families!**

🏠 **House Head Chase** - Where survival meets fun! 🎮

[Play Now](https://www.househeadchase.com) | [Follow Us](https://x.com/househeadchase)
