// 🏠 House Head Chase - Configuration & Environment Management
// Version 2.0.0

console.log('🔧 Loading configuration...');

// Detect environment
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('.local') ||
                     window.location.search.includes('debug=true');

const isProduction = !isDevelopment;

// Configuration object
window.GameConfig = {
    // Environment
    environment: isDevelopment ? 'development' : 'production',
    isDevelopment: isDevelopment,
    isProduction: isProduction,
    
    // Version info
    version: '2.0.0',
    buildDate: '2025-01-15',
    
    // URLs and domains
    urls: {
        base: window.location.origin,
        api: isProduction ? 'https://api.househeadchase.com' : 'http://localhost:3000/api',
        cdn: isProduction ? 'https://cdn.househeadchase.com' : window.location.origin,
        social: {
            twitter: 'https://twitter.com/intent/tweet',
            facebook: 'https://www.facebook.com/sharer/sharer.php',
            reddit: 'https://www.reddit.com/submit'
        },
        support: {
            email: 'support@househeadchase.com',
            feedback: 'https://forms.gle/feedback-form-id',
            bugReport: 'https://github.com/househeadchase/issues/new'
        }
    },
    
    // Game settings
    game: {
        // Performance settings
        targetFPS: 60,
        maxEnemies: 50,
        maxPowerups: 10,
        canvasOptimizations: true,
        
        // Gameplay balance
        difficulty: {
            base: 1.0,
            scaling: 0.15,
            maxLevel: 100,
            spawnRateBase: 3000,
            spawnRateMin: 1000,
            powerupSpawnBase: 12000,
            powerupSpawnMin: 8000
        },
        
        // Player settings
        player: {
            baseSpeed: 3,
            maxHealth: 100,
            invulnerabilityTime: 1000,
            size: 15
        },
        
        // Enemy settings
        enemies: {
            smallHouse: {
                speed: 1.0,
                damage: 15,
                size: 25,
                spawnWeight: 0.7,
                activationTime: 2000
            },
            bigHouse: {
                speed: 0.6,
                damage: 25,
                size: 40,
                spawnWeight: 0.3,
                activationTime: 3000
            }
        },
        
        // Power-up settings
        powerups: {
            health: {
                value: 30,
                spawnWeight: 0.4,
                duration: 0,
                cooldown: 5000
            },
            shield: {
                duration: 5000,
                spawnWeight: 0.3,
                cooldown: 8000
            },
            speed: {
                multiplier: 2,
                duration: 8000,
                spawnWeight: 0.3,
                cooldown: 10000
            }
        },
        
        // Visual settings
        flashlight: {
            radius: 200,
            fadeSpeed: 0.1,
            intensity: 1.0
        }
    },
    
    // Analytics configuration
    analytics: {
        enabled: isProduction,
        googleAnalytics: {
            measurementId: isProduction ? 'G-XXXXXXXXXX' : null,
            config: {
                page_title: 'House Head Chase',
                page_location: window.location.href,
                custom_map: {
                    custom_parameter_1: 'game_version'
                }
            }
        },
        
        // Custom events to track
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
        
        // Performance tracking
        performance: {
            enabled: true,
            sampleRate: isProduction ? 0.1 : 1.0,
            thresholds: {
                loadTime: 3000,
                fps: 30,
                memoryUsage: 100 * 1024 * 1024 // 100MB
            }
        }
    },
    
    // PWA settings
    pwa: {
        enabled: true,
        installPrompt: {
            enabled: true,
            delay: 10000, // Show after 10 seconds
            dismissalPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
            maxShows: 3
        },
        
        // Update settings
        updates: {
            checkInterval: 60000, // Check every minute
            forceUpdate: false,
            showUpdatePrompt: true
        },
        
        // Offline settings
        offline: {
            enabled: true,
            fallbackPage: './offline.html',
            cacheStrategy: 'networkFirst' // or 'cacheFirst'
        }
    },
    
    // Feature flags
    features: {
        // Core features
        globalLeaderboards: false, // Will enable with Firebase
        achievements: true,
        socialSharing: true,
        pwaSplashScreen: true,
        
        // Experimental features
        aiDifficulty: false,
        multiplayerMode: false,
        customThemes: false,
        voiceControls: false,
        
        // Monetization features (future)
        advertisements: false,
        inAppPurchases: false,
        premiumMode: false,
        
        // Development features
        debugMode: isDevelopment,
        performanceMonitor: isDevelopment,
        errorReporting: isProduction,
        consoleLogging: isDevelopment
    },
    
    // UI/UX settings
    ui: {
        animations: {
            enabled: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            duration: 300,
            easing: 'ease-out'
        },
        
        accessibility: {
            highContrast: window.matchMedia('(prefers-contrast: high)').matches,
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            screenReader: true,
            keyboardNavigation: true
        },
        
        responsive: {
            breakpoints: {
                mobile: 600,
                tablet: 900,
                desktop: 1200
            }
        }
    },
    
    // Storage settings
    storage: {
        prefix: 'houseHeadChase_',
        version: '2.0',
        
        keys: {
            highScores: 'highScores',
            gameSettings: 'gameSettings',
            playerStats: 'playerStats',
            achievements: 'achievements',
            pwaInstallDismissed: 'pwaInstallDismissed',
            audioEnabled: 'audioEnabled'
        },
        
        // Data retention
        retention: {
            highScores: 30, // days
            playerStats: 365, // days
            gameSettings: -1 // never expire
        }
    },
    
    // API endpoints (for future Firebase integration)
    api: {
        endpoints: {
            leaderboard: '/leaderboard',
            achievements: '/achievements',
            playerStats: '/player-stats',
            feedback: '/feedback',
            errorReport: '/error-report'
        },
        
        timeout: 10000, // 10 seconds
        retries: 3,
        retryDelay: 1000
    },
    
    // Security settings
    security: {
        csp: {
            enabled: isProduction,
            reportUri: '/csp-report'
        },
        
        // Input validation
        validation: {
            maxNameLength: 50,
            maxScoreDigits: 10,
            allowedCharacters: /^[a-zA-Z0-9\s\-_!@#$%&*()+=<>?,.]*$/
        }
    },
    
    // Debug settings
    debug: {
        enabled: isDevelopment,
        level: isDevelopment ? 'verbose' : 'error',
        showFPS: isDevelopment,
        showMemory: isDevelopment,
        logPerformance: true,
        logErrors: true
    }
};

// Utility functions for configuration
window.GameConfig.utils = {
    // Get a configuration value with fallback
    get: function(path, fallback = null) {
        const keys = path.split('.');
        let value = window.GameConfig;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return fallback;
            }
        }
        
        return value;
    },
    
    // Check if a feature is enabled
    isFeatureEnabled: function(featureName) {
        return window.GameConfig.utils.get(`features.${featureName}`, false);
    },
    
    // Get current breakpoint
    getCurrentBreakpoint: function() {
        const width = window.innerWidth;
        const breakpoints = window.GameConfig.ui.responsive.breakpoints;
        
        if (width < breakpoints.mobile) return 'mobile';
        if (width < breakpoints.tablet) return 'tablet';
        return 'desktop';
    },
    
    // Storage helpers
    getStorageKey: function(key) {
        return window.GameConfig.storage.prefix + key;
    },
    
    // URL helpers
    getApiUrl: function(endpoint) {
        return window.GameConfig.urls.api + window.GameConfig.api.endpoints[endpoint];
    },
    
    // Performance helpers
    isHighPerformanceDevice: function() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return gl && navigator.hardwareConcurrency && navigator.hardwareConcurrency >= 4;
    },
    
    // Browser capability detection
    getBrowserCapabilities: function() {
        return {
            webAudio: !!(window.AudioContext || window.webkitAudioContext),
            canvas2D: !!document.createElement('canvas').getContext('2d'),
            localStorage: !!window.localStorage,
            serviceWorker: 'serviceWorker' in navigator,
            pushManager: 'PushManager' in window,
            notifications: 'Notification' in window,
            vibration: 'vibrate' in navigator,
            gamepad: 'getGamepads' in navigator,
            touchEvents: 'ontouchstart' in window,
            pointerEvents: 'onpointerdown' in window,
            orientationAPI: 'DeviceOrientationEvent' in window,
            fullscreenAPI: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled)
        };
    }
};

// Initialize configuration based on device and browser
window.GameConfig.init = function() {
    console.log(`🎮 Initializing House Head Chase v${this.version}`);
    console.log(`🌍 Environment: ${this.environment}`);
    
    // Adjust settings based on device capabilities
    const capabilities = this.utils.getBrowserCapabilities();
    const isHighPerf = this.utils.isHighPerformanceDevice();
    
    if (!isHighPerf) {
        console.log('📱 Low-performance device detected, adjusting settings');
        this.game.maxEnemies = Math.floor(this.game.maxEnemies * 0.7);
        this.game.targetFPS = 45;
        this.game.canvasOptimizations = true;
    }
    
    // Adjust for mobile devices
    const isMobile = this.utils.getCurrentBreakpoint() === 'mobile';
    if (isMobile) {
        console.log('📱 Mobile device detected');
        this.game.flashlight.radius *= 0.8;
        this.ui.animations.duration *= 0.8;
    }
    
    // Apply accessibility preferences
    if (this.ui.accessibility.reducedMotion) {
        console.log('♿ Reduced motion preference detected');
        this.ui.animations.enabled = false;
        this.features.pwaSplashScreen = false;
    }
    
    if (this.ui.accessibility.highContrast) {
        console.log('👁️ High contrast preference detected');
        document.body.classList.add('high-contrast');
    }
    
    // Development mode setup
    if (this.isDevelopment) {
        console.log('🔧 Development mode enabled');
        document.body.classList.add('development');
        
        // Expose debug helpers globally
        window.debug = {
            config: this,
            gameState: null, // Will be set by game.js
            capabilities: capabilities,
            performance: {
                fps: 0,
                memory: 0,
                enemies: 0,
                powerups: 0
            }
        };
    }
    
    // Setup error handling
    if (this.features.errorReporting) {
        this.setupErrorReporting();
    }
    
    // Initialize storage cleanup
    this.initStorageCleanup();
    
    console.log('✅ Configuration initialized successfully');
    
    // Dispatch configuration ready event
    window.dispatchEvent(new CustomEvent('configReady', {
        detail: { config: this }
    }));
};

// Error reporting setup
window.GameConfig.setupErrorReporting = function() {
    const originalConsoleError = console.error;
    console.error = function(...args) {
        originalConsoleError.apply(console, args);
        
        // Track errors in production
        if (window.GameConfig.isProduction && window.gtag) {
            gtag('event', 'exception', {
                description: args.join(' '),
                fatal: false,
                custom_parameter_1: window.GameConfig.version
            });
        }
    };
};

// Storage cleanup initialization
window.GameConfig.initStorageCleanup = function() {
    try {
        const now = Date.now();
        const retention = this.storage.retention;
        
        Object.entries(retention).forEach(([key, days]) => {
            if (days > 0) {
                const storageKey = this.utils.getStorageKey(key);
                const data = localStorage.getItem(storageKey);
                
                if (data) {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.timestamp) {
                            const age = now - parsed.timestamp;
                            const maxAge = days * 24 * 60 * 60 * 1000;
                            
                            if (age > maxAge) {
                                localStorage.removeItem(storageKey);
                                console.log(`🧹 Cleaned up expired data: ${key}`);
                            }
                        }
                    } catch (e) {
                        // Invalid data, remove it
                        localStorage.removeItem(storageKey);
                    }
                }
            }
        });
    } catch (error) {
        console.warn('⚠️ Storage cleanup failed:', error);
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.GameConfig.init();
    });
} else {
    window.GameConfig.init();
}

console.log('✅ Configuration module loaded');
