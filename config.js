// 🏠 House Head Chase - Game Configuration
// Version 2.0.0 - Central configuration for all game systems

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
    isProduction: window.location.hostname.includes('firebase') || window.location.hostname.includes('househeadchase'),
    
    // Feature Flags
    features: {
        globalLeaderboard: true,
        googleSignIn: true,
        analytics: true,
        consoleLogging: true,
        performanceMonitoring: true,
        pushNotifications: false, // Disabled for kid-safe experience
        socialSharing: true,
        pwaSupportEnabled: true,
        offlineMode: true
    },
    
    // Firebase Configuration - Updated with Realtime Database URL
    firebase: {
        config: {
            // Replace these with your actual Firebase config values
            apiKey: "AIzaSyCV3xPzEe8EUv8JUaoVAOHZQvQiW2MxJVA",
            authDomain: "house-head-chase.firebaseapp.com",
            databaseURL: "https://house-head-chase-default-rtdb.firebaseio.com/",
            projectId: "house-head-chase",
            storageBucket: "house-head-chase.firebasestorage.app",
            messagingSenderId: "947955836936",
            appId: "1:947955836936:web:3f146e5a496c9e3f8ac9bd",
            measurementId: "G-FT0GWN6BLB"
        },
        // Firestore collection names
        collections: {
            scores: 'globalScores',
            users: 'users',
            feedback: 'feedback'
        }
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
                base: 5500,           // Much slower initial spawning (was 4000)
                minimum: 2500,        // Reasonable minimum (was 2000)
                levelScaling: 0.08    // Even gentler difficulty increase (was 0.1)
            },
            types: {
                small: {
                    size: 25,
                    speed: 0.7,       // Slower small houses (was 0.8)
                    damage: 10,       // Less damage (was 12)
                    spawnWeight: 0.8, // More small houses early on (was 0.7)
                    activationTime: 3000  // Longer activation time (was 2500)
                },
                big: {
                    size: 40,
                    speed: 0.4,       // Much slower big houses (was 0.5)
                    damage: 18,       // Less damage (was 20)
                    spawnWeight: 0.2, // Fewer big houses early on (was 0.3)
                    activationTime: 4500  // Much longer activation time (was 3500)
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
            spawnRate: 8000,         // More frequent power-ups (was 10000)
            despawnTime: 18000,      // Longer available time (was 15000)
            types: {
                health: { 
                    value: 40,           // More healing (was 35)
                    spawnWeight: 0.4,    // Balanced distribution (was 0.5)
                    color: '#44ff44',
                    emoji: '💚'
                },
                shield: { 
                    duration: 7000,      // Longer shield (was 6000)
                    spawnWeight: 0.3,    // Balanced distribution (same)
                    color: '#4488ff',
                    emoji: '🛡️'
                },
                freeze: { 
                    duration: 9000,      // Longer freeze (was 8000)
                    spawnWeight: 0.3,    // Equal distribution (was 0.2)
                    color: '#88ddff',
                    emoji: '🧊'
                }
            }
        },
        scoring: {
            pointsPerSecond: 1,
            levelUpThreshold: 50,    // Slightly longer levels (was 45)
            difficultyScaling: 0.08  // Gentler scaling (was 0.1)
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
    
    // Analytics Configuration (COPPA Compliant)
    analytics: {
        enabled: true,
        googleAnalytics: {
            measurementId: "G-XXXXXXXXXX" // Replace with your GA4 measurement ID
        },
        events: {
            gameStart: 'game_start',
            gameOver: 'game_over',
            levelUp: 'level_up',
            powerupCollected: 'powerup_collected',
            highScore: 'high_score_achieved',
            pwaInstall: 'pwa_install',
            shareScore: 'score_shared',
            errorOccurred: 'error_occurred'
        },
        performance: {
            thresholds: {
                fps: 30,              // Minimum acceptable FPS
                memoryUsage: 100      // MB memory usage warning threshold
            }
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
        powerupSize: 20             // Larger power-up icons (was 15)
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
            analytics: true,         // Anonymous analytics only
            crashReporting: true,    // For game improvement
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
        maxEnemies: 15,             // Reduced max enemies (was 20)
        maxPowerups: 6,             // Increased max power-ups (was 5)
        canvasOptimization: true,
        memoryManagement: true,
        backgroundSync: true
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
        }
    },
    
    // Error Messages
    messages: {
        errors: {
            firebaseInit: 'Unable to connect to game services. Playing in offline mode.',
            authFailed: 'Sign-in failed. Please try again.',
            networkError: 'Network error. Check your connection.',
            gameLoadFailed: 'Game failed to load. Please refresh the page.',
            unsupportedBrowser: 'Your browser is not fully supported. Some features may not work.'
        },
        success: {
            authSuccess: 'Successfully signed in!',
            scoreSubmitted: 'Score submitted to global leaderboard!',
            gameInstalled: 'Game installed successfully!'
        }
    },
    
    // External Links (Kid-Safe)
    links: {
        website: 'https://www.househeadchase.com',
        support: 'support@househeadchase.com',
        twitter: 'https://x.com/househeadchase',
        github: 'https://github.com/Ghost081280',
        privacyPolicy: 'https://www.househeadchase.com/privacy',
        termsOfService: 'https://www.househeadchase.com/terms'
    }
};

// Environment-specific overrides
if (GameConfig.isDevelopment) {
    GameConfig.debug.showFPS = true;
    GameConfig.debug.verboseLogging = true;
    GameConfig.features.analytics = false; // Disable analytics in development
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
    
    // Make config available globally
    window.GameConfig = GameConfig;
    
    // Dispatch ready event
    const event = new CustomEvent('configReady', { detail: GameConfig });
    window.dispatchEvent(event);
    
    console.log('⚙️ Game configuration loaded successfully');
    console.log('🎮 Version:', GameConfig.version);
    console.log('🌍 Environment:', GameConfig.isDevelopment ? 'Development' : 'Production');
    console.log('⚖️ Difficulty balanced for better progression');
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

console.log('✅ Config module loaded');
