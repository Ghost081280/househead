// 🏠 House Head Chase - Game Configuration
// Version 2.0.0 - Local-only version for GitHub Pages

console.log('⚙️ Loading game configuration...');

// Game Configuration Object
const GameConfig = {
    // Game Metadata
    version: '2.0.0',
    title: 'House Head Chase',
    description: 'A fun, kid-friendly survival game where you avoid walking House Heads!',
    author: 'House Head Chase Team',
    
    // Environment Detection
    isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    isProduction: window.location.hostname.includes('github.io') || window.location.hostname.includes('pages.dev'),
    
    // Feature Flags - All Firebase features disabled
    features: {
        globalLeaderboard: false,        // Disabled - local only
        googleSignIn: false,             // Disabled - no authentication
        analytics: false,                // Disabled - no tracking
        consoleLogging: true,
        performanceMonitoring: true,
        pushNotifications: false,
        socialSharing: true,
        pwaSupportEnabled: true,
        offlineMode: true,
        localLeaderboard: true           // Enabled - local storage only
    },
    
    // Game Balance Settings (Kid-Friendly with Better Progression)
    gameBalance: {
        player: {
            startingHealth: 100,
            maxHealth: 100,
            baseSpeed: 3.8,        // Slightly faster player
            size: 18
        },
        enemies: {
            spawnRate: {
                base: 5500,           // Much slower initial spawning
                minimum: 2500,        // Reasonable minimum
                levelScaling: 0.08    // Even gentler difficulty increase
            },
            types: {
                small: {
                    size: 25,
                    speed: 0.7,       // Slower small houses
                    damage: 10,       // Less damage
                    spawnWeight: 0.8, // More small houses early on
                    activationTime: 3000  // Longer activation time
                },
                big: {
                    size: 40,
                    speed: 0.4,       // Much slower big houses
                    damage: 18,       // Less damage
                    spawnWeight: 0.2, // Fewer big houses early on
                    activationTime: 4500  // Much longer activation time
                }
            },
            // Progressive difficulty scaling by level
            levelModifiers: {
                1: { spawnRateMultiplier: 1.0, speedMultiplier: 0.8, damageMultiplier: 0.8 },
                2: { spawnRateMultiplier: 0.95, speedMultiplier: 0.85, damageMultiplier: 0.9 },
                3: { spawnRateMultiplier: 0.9, speedMultiplier: 0.9, damageMultiplier: 0.95 },
                4: { spawnRateMultiplier: 0.85, speedMultiplier: 0.95, damageMultiplier: 1.0 },
                5: { spawnRateMultiplier: 0.8, speedMultiplier: 1.0, damageMultiplier: 1.0 },
                6: { spawnRateMultiplier: 0.75, speedMultiplier: 1.05, damageMultiplier: 1.1 },
                7: { spawnRateMultiplier: 0.7, speedMultiplier: 1.1, damageMultiplier: 1.15 },
                8: { spawnRateMultiplier: 0.65, speedMultiplier: 1.15, damageMultiplier: 1.2 }
            }
        },
        powerups: {
            spawnRate: 8000,         // More frequent power-ups
            despawnTime: 18000,      // Longer available time
            types: {
                health: { 
                    value: 40,           // More healing
                    spawnWeight: 0.4,    // Balanced distribution
                    color: '#44ff44',
                    emoji: '💚'
                },
                shield: { 
                    duration: 7000,      // Longer shield
                    spawnWeight: 0.3,    // Balanced distribution
                    color: '#4488ff',
                    emoji: '🛡️'
                },
                freeze: { 
                    duration: 9000,      // Longer freeze
                    spawnWeight: 0.3,    // Equal distribution
                    color: '#88ddff',
                    emoji: '🧊'
                }
            }
        },
        scoring: {
            pointsPerSecond: 1,
            levelUpThreshold: 50,    // Slightly longer levels
            difficultyScaling: 0.08  // Gentler scaling
        }
    },
    
    // Audio Settings
    audio: {
        enabled: true,
        volume: 0.3,
        sounds: {
            spawn: { frequency: 180, duration: 0.3 },
            damage: { frequency: 120, duration: 0.2 },
            levelup: { frequency: 440, duration: 0.5 },
            flashlight: { frequency: 300, duration: 0.1 },
            powerup: { frequency: 660, duration: 0.3 },
            freeze: { frequency: 440, duration: 0.4 },
            bounce: { frequency: 200, duration: 0.1 }
        }
    },
    
    // UI Configuration
    ui: {
        theme: {
            primaryColor: '#ff4444',
            secondaryColor: '#4488ff',
            backgroundColor: '#001122',
            textColor: '#ffffff'
        },
        animations: {
            enabled: true,
            reducedMotion: false
        },
        responsiveBreakpoints: {
            mobile: 600,
            tablet: 1024,
            desktop: 1200
        },
        powerupSize: 20             // Larger power-up icons
    },
    
    // PWA Configuration
    pwa: {
        name: 'House Head Chase',
        shortName: 'HouseHeadChase',
        description: 'Fun survival game for kids - avoid the walking houses!',
        themeColor: '#ff4444',
        backgroundColor: '#000000',
        display: 'standalone',
        orientation: 'any',
        scope: './',
        startUrl: './',
        iconSizes: [16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 256, 384, 512]
    },
    
    // Privacy & Safety (COPPA Compliant)
    privacy: {
        coppaCompliant: true,
        minimumAge: 8,
        dataCollection: {
            personalInfo: false,     // No personal info collected
            analytics: false,        // No analytics
            crashReporting: false,   // No external reporting
            userGeneratedContent: false // No user content allowed
        },
        contentFiltering: {
            enabled: true,
            profanityFilter: true,
            moderatedChat: false     // No chat features
        }
    },
    
    // Performance Settings
    performance: {
        targetFPS: 60,
        maxEnemies: 15,             // Reduced max enemies
        maxPowerups: 6,             // Increased max power-ups
        canvasOptimization: true,
        memoryManagement: true
    },
    
    // Local Storage Configuration
    localStorage: {
        enabled: true,
        keyPrefix: 'houseHeadChase_',
        maxScores: 10,              // Keep top 10 scores
        compression: false,         // No compression needed for small data
        encryption: false           // No encryption needed for game scores
    },
    
    // Debug Settings
    debug: {
        showFPS: false,
        showMemoryUsage: false,
        verboseLogging: false,
        skipIntro: false,
        godMode: false
    },
    
    // Utility Functions
    utils: {
        getStorageKey: (key) => `houseHeadChase_${key}`,
        formatTime: (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        },
        generatePlayerName: () => {
            const adjectives = ['Brave', 'Quick', 'Smart', 'Swift', 'Clever', 'Bold', 'Fast', 'Bright'];
            const nouns = ['Runner', 'Player', 'Explorer', 'Hero', 'Champion', 'Survivor', 'Dodger', 'Escape'];
            const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
            const noun = nouns[Math.floor(Math.random() * nouns.length)];
            return `${adj} ${noun}`;
        },
        sanitizeInput: (input) => {
            return input.replace(/[<>&"']/g, '').trim();
        },
        isValidEmail: (email) => {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        // Get level-specific difficulty modifiers
        getLevelModifiers: (level) => {
            const modifiers = GameConfig.gameBalance.enemies.levelModifiers;
            if (modifiers[level]) {
                return modifiers[level];
            }
            // For levels beyond defined modifiers, use exponential scaling
            const baseMultiplier = Math.min(1.0 + (level - 8) * 0.05, 1.5); // Cap at 50% increase
            return {
                spawnRateMultiplier: Math.max(0.5, 0.65 - (level - 8) * 0.02),
                speedMultiplier: baseMultiplier,
                damageMultiplier: baseMultiplier
            };
        },
        // Local storage helper functions
        saveToLocal: (key, data) => {
            try {
                const storageKey = GameConfig.utils.getStorageKey(key);
                localStorage.setItem(storageKey, JSON.stringify(data));
                return true;
            } catch (error) {
                console.error('Failed to save to localStorage:', error);
                return false;
            }
        },
        loadFromLocal: (key, defaultValue = null) => {
            try {
                const storageKey = GameConfig.utils.getStorageKey(key);
                const data = localStorage.getItem(storageKey);
                return data ? JSON.parse(data) : defaultValue;
            } catch (error) {
                console.error('Failed to load from localStorage:', error);
                return defaultValue;
            }
        },
        clearLocal: (key) => {
            try {
                const storageKey = GameConfig.utils.getStorageKey(key);
                localStorage.removeItem(storageKey);
                return true;
            } catch (error) {
                console.error('Failed to clear localStorage:', error);
                return false;
            }
        }
    },
    
    // Error Messages
    messages: {
        errors: {
            gameLoadFailed: 'Game failed to load. Please refresh the page.',
            unsupportedBrowser: 'Your browser is not fully supported. Some features may not work.',
            storageError: 'Unable to save your progress. Please check your browser settings.',
            noLocalStorage: 'Local storage is not available. Scores will not be saved.'
        },
        success: {
            gameInstalled: 'Game installed successfully!',
            scoreSaved: 'Score saved locally!',
            dataExported: 'Game data exported successfully!'
        }
    },
    
    // External Links (Update with your GitHub Pages URL)
    links: {
        website: 'https://your-github-username.github.io/house-head-chase',
        support: 'https://github.com/your-github-username/house-head-chase/issues',
        github: 'https://github.com/your-github-username/house-head-chase',
        developerProfile: 'https://github.com/your-github-username'
    }
};

// Environment-specific overrides
if (GameConfig.isDevelopment) {
    GameConfig.debug.showFPS = true;
    GameConfig.debug.verboseLogging = true;
    console.log('🔧 Development mode enabled');
} else if (GameConfig.isProduction) {
    GameConfig.debug = { ...GameConfig.debug, showFPS: false, verboseLogging: false };
    console.log('🚀 Production mode enabled');
}

// Feature detection and browser compatibility
const checkBrowserSupport = () => {
    const required = {
        canvas: !!window.HTMLCanvasElement,
        localStorage: !!window.localStorage,
        requestAnimationFrame: !!window.requestAnimationFrame,
        touchEvents: 'ontouchstart' in window,
        webAudio: !!(window.AudioContext || window.webkitAudioContext),
        serviceWorker: 'serviceWorker' in navigator
    };
    
    GameConfig.browserSupport = required;
    
    // Check for critical missing features
    const critical = ['canvas', 'localStorage', 'requestAnimationFrame'];
    const missing = critical.filter(feature => !required[feature]);
    
    if (missing.length > 0) {
        console.error('❌ Missing critical browser features:', missing);
        GameConfig.isSupported = false;
    } else {
        GameConfig.isSupported = true;
        console.log('✅ Browser compatibility check passed');
    }
    
    return GameConfig.isSupported;
};

// Initialize configuration
const initializeConfig = () => {
    // Check browser support
    checkBrowserSupport();
    
    // Set up reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        GameConfig.ui.animations.reducedMotion = true;
        document.body.classList.add('reduced-motion');
        console.log('🎭 Reduced motion enabled');
    }
    
    // Set up high contrast preference
    if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
        document.body.classList.add('high-contrast');
        console.log('🎨 High contrast mode enabled');
    }
    
    // Mobile detection
    GameConfig.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    GameConfig.isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth > 600;
    GameConfig.isDesktop = !GameConfig.isMobile && !GameConfig.isTablet;
    
    // Device-specific optimizations
    if (GameConfig.isMobile) {
        GameConfig.performance.maxEnemies = 12; // Further reduce for mobile performance
        GameConfig.gameBalance.enemies.spawnRate.base = 6000; // Even slower spawning on mobile
        GameConfig.gameBalance.powerups.spawnRate = 7000; // More frequent power-ups on mobile
    }
    
    console.log(`📱 Device: ${GameConfig.isMobile ? 'Mobile' : GameConfig.isTablet ? 'Tablet' : 'Desktop'}`);
    
    // Test localStorage availability
    try {
        const testKey = GameConfig.utils.getStorageKey('test');
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        GameConfig.localStorage.available = true;
        console.log('💾 Local storage available');
    } catch (error) {
        GameConfig.localStorage.available = false;
        console.warn('⚠️ Local storage not available:', error);
    }
    
    // Make config available globally
    window.GameConfig = GameConfig;
    
    // Dispatch ready event
    const event = new CustomEvent('configReady', { detail: GameConfig });
    window.dispatchEvent(event);
    
    console.log('⚙️ Game configuration loaded successfully');
    console.log('🎮 Version:', GameConfig.version);
    console.log('🌍 Environment:', GameConfig.isDevelopment ? 'Development' : 'Production');
    console.log('⚖️ Difficulty balanced for better progression');
    console.log('📱 Local-only version for GitHub Pages');
    console.log('💾 Local storage:', GameConfig.localStorage.available ? 'Available' : 'Not available');
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeConfig);
} else {
    initializeConfig();
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
}

console.log('✅ Config module loaded - Local-only version');
