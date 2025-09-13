# 🏠 House Head Chase

<div align="center">

![House Head Chase](https://img.shields.io/badge/Game-House%20Head%20Chase-ff4444?style=for-the-badge&logo=gamepad&logoColor=white)
![Version](https://img.shields.io/badge/Version-1.0.0-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-Ready-purple?style=for-the-badge)

**A thrilling survival game where you dodge terrifying House Heads with legs!**

[🎮 Play Now](https://ghost081280.github.io/househead/) • [📱 Install as App](#installation) • [🤝 Contribute](#contributing) • [🐛 Report Bug](https://ghost081280.github.io/househead/issues)

</div>

## 🎯 About

House Head Chase is a fast-paced survival game where you control a blue dot hero trying to survive as long as possible while being hunted by creepy houses that grow legs! Collect power-ups, use your flashlight strategically, and see how long you can survive as the difficulty increases.

### ✨ Features

- 🏃‍♂️ **Smooth Touch & Mouse Controls** - Drag to move on any device
- 🔦 **Dynamic Flashlight System** - Reveals enemies but exposes your location
- ⚡ **Power-up System** - Health packs, shields, and speed boosts
- 📈 **Progressive Difficulty** - Enemies spawn faster and move quicker over time
- 🏆 **Local High Scores** - Track your best survival times
- 📱 **PWA Ready** - Install as an app on any device
- 🎵 **Dynamic Sound Effects** - Audio feedback for all actions
- 🌐 **Offline Play** - Works without internet connection
- 📱 **Responsive Design** - Perfect on mobile, tablet, and desktop

## 🎮 How to Play

1. **Move** - Touch/click and drag the blue dot to move around
2. **Flashlight** - Double tap/click to toggle your flashlight
3. **Survive** - Avoid the House Heads that spawn and hunt you down
4. **Collect** - Grab power-ups for health, shields, and speed boosts
5. **Strategy** - Use the flashlight to see enemies, but it reveals your location!

### 🏠 Enemy Types

- **Small Houses** - Fast and nimble, deal 15 damage
- **Big Houses** - Slower but stronger, deal 25 damage

### ⚡ Power-ups

- **💚 Health Pack** - Restores 30 health points
- **🛡️ Shield** - 5 seconds of invincibility
- **⚡ Speed Boost** - 2x movement speed for 8 seconds

## 🚀 Quick Start

### For Players

1. **Web Browser**: Visit the [live demo](https://your-username.github.io/house-head-chase)
2. **PWA Install**: Click the install prompt or add to home screen
3. **Local Setup**: Download and open `index.html` in your browser

### For Developers

```bash
# Clone the repository
git clone https://github.com/your-username/house-head-chase.git

# Navigate to project directory
cd house-head-chase

# Open in your favorite editor
code .

# Serve locally (optional)
python -m http.server 8000
# or
npx serve .
# or simply open index.html in your browser
```

## 📁 Project Structure

```
house-head-chase/
├── index.html          # Main HTML file
├── styles.css          # All CSS styles and responsive design
├── game.js             # Core game logic and systems
├── manifest.json       # PWA manifest
├── sw.js              # Service worker for offline functionality
├── offline.html       # Offline fallback page
├── icons/             # PWA icons (various sizes)
├── screenshots/       # App store screenshots
└── README.md          # This file
```

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Graphics**: HTML5 Canvas API
- **Audio**: Web Audio API
- **PWA**: Service Workers, Web App Manifest
- **Storage**: localStorage for high scores
- **Fonts**: Google Fonts (Creepster, Orbitron, Exo 2)

## 🎨 Game Architecture

### Core Systems

- **Game Loop**: 60 FPS with `requestAnimationFrame`
- **Entity System**: Player, Enemies, Powerups classes
- **Sound System**: Dynamic audio with Web Audio API
- **Input System**: Unified touch/mouse handling
- **Camera System**: Screen shake effects
- **UI System**: Real-time HUD updates

### Key Classes

```javascript
// Main game systems
SoundSystem()      // Handles all audio
Enemy()           // House Head entities
Powerup()         // Collectible power-ups
gameState         // Central game state management
```

## 🤝 Contributing

We love contributions! Here's how you can help make House Head Chase even better:

### 🐛 Bug Reports

Found a bug? Please [open an issue](https://github.com/your-username/house-head-chase/issues) with:
- Browser and device info
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

### ✨ Feature Requests

Have an idea? We'd love to hear it! [Create an issue](https://github.com/your-username/house-head-chase/issues) with:
- Clear description of the feature
- Why it would be useful
- Any implementation ideas

### 🔧 Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### 🎯 Good First Issues

Looking to contribute? Try these beginner-friendly tasks:

- [ ] Add new enemy types with different behaviors
- [ ] Create new power-up types (double points, slow time, etc.)
- [ ] Improve particle effects
- [ ] Add screen transitions/animations
- [ ] Implement new background themes
- [ ] Add accessibility features
- [ ] Create unit tests
- [ ] Improve mobile performance

### 💡 Advanced Features to Implement

- [ ] Level editor
- [ ] Custom enemy AI patterns
- [ ] Achievement system
- [ ] Leaderboards with backend
- [ ] Save game states
- [ ] Custom controls configuration
- [ ] WebGL renderer for better performance

## 📋 Development Guidelines

### Code Style
- Use ES6+ features
- Follow semantic naming conventions
- Comment complex game logic
- Keep functions small and focused
- Use consistent indentation (2 spaces)

### Performance
- Maintain 60 FPS on mobile devices
- Optimize canvas rendering
- Use object pooling for entities
- Minimize garbage collection

### Testing
- Test on multiple devices and browsers
- Verify PWA functionality
- Check offline capabilities
- Validate responsive design

## 🌟 Roadmap

### Version 1.1
- [ ] New enemy types
- [ ] Boss battles
- [ ] Achievement system
- [ ] Better particle effects

### Version 1.2
- [ ] Multiplayer support
- [ ] Level themes
- [ ] Custom player skins
- [ ] Enhanced audio

### Version 2.0
- [ ] 3D graphics with Three.js
- [ ] Story mode
- [ ] Level editor
- [ ] Steam release

## 📊 Browser Support

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome  | ✅      | ✅     |
| Firefox | ✅      | ✅     |
| Safari  | ✅      | ✅     |
| Edge    | ✅      | ✅     |

**Minimum Requirements:**
- ES6 support
- Canvas API
- Web Audio API (optional)
- Service Workers (for PWA features)

## 🏆 Credits

- **Original Concept**: Inspired by classic survival games
- **Fonts**: Google Fonts (Creepster, Orbitron, Exo 2)
- **Icons**: Custom emoji-based design
- **Audio**: Web Audio API synthesized sounds

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 House Head Chase Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- Thanks to all contributors who help make this game better
- Special thanks to the web development community for inspiration
- Built with ❤️ for gamers everywhere

---

<div align="center">

**Made with 🏠 and ❤️**

[⭐ Star this repo](https://github.com/your-username/house-head-chase) • [🐦 Share on Twitter](https://twitter.com/intent/tweet?text=Check%20out%20House%20Head%20Chase%20-%20a%20thrilling%20survival%20game!&url=https://github.com/your-username/house-head-chase) • [💬 Join Discussion](https://github.com/your-username/house-head-chase/discussions)

</div>
