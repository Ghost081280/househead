// 🏠 House Head Chase - Analytics & Performance Tracking
// Version 2.0.0

console.log('📊 Loading analytics module...');

// Analytics Manager Class
class AnalyticsManager {
    constructor() {
        this.config = window.GameConfig;
        this.enabled = this.config?.analytics?.enabled || false;
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.events = [];
        this.performance = {
            fps: 0,
            memory: 0,
            loadTime: 0,
            errors: 0
        };
        
        if (this.enabled) {
            this.initializeAnalytics();
        } else {
            console.log('📊 Analytics disabled for development environment');
        }
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    initializeAnalytics() {
        try {
            // Initialize Google Analytics 4 if configured
            if (this.config.analytics.googleAnalytics.measurementId) {
                this.initializeGA4();
            }
            
            // Initialize performance monitoring
            this.initializePerformanceMonitoring();
            
            // Track initial page load
            this.trackPageLoad();
            
            console.log('📊 Analytics initialized successfully');
        } catch (error) {
            console.error('❌ Analytics initialization failed:', error);
        }
    }
    
    initializeGA4() {
        const measurementId = this.config.analytics.googleAnalytics.measurementId;
        
        // Load Google Analytics script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        document.head.appendChild(script);
        
        // Initialize gtag
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        
        // Configure GA4
        gtag('config', measurementId, {
            page_title: 'House Head Chase',
            page_location: window.location.href,
            custom_map: {
                custom_parameter_1: 'game_version',
                custom_parameter_2: 'session_id',
                custom_parameter_3: 'player_level'
            },
            // Privacy settings
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
        });
        
        // Make gtag available globally
        window.gtag = gtag;
        
        console.log('📈 Google Analytics 4 initialized');
    }
    
    initializePerformanceMonitoring() {
        // Monitor FPS
        let frameCount = 0;
        let lastTime = performance.now();
        
        const monitorFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                this.performance.fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                frameCount = 0;
                lastTime = currentTime;
                
                // Update debug display if available
                const fpsCounter = document.getElementById('fpsCounter');
                if (fpsCounter) {
                    fpsCounter.textContent = this.performance.fps;
                }
                
                // Track poor performance
                if (this.performance.fps < this.config.analytics.performance.thresholds.fps) {
                    this.trackEvent('performance_issue', {
                        issue_type: 'low_fps',
                        fps_value: this.performance.fps,
                        session_id: this.sessionId
                    });
                }
            }
            
            requestAnimationFrame(monitorFPS);
        };
        
        requestAnimationFrame(monitorFPS);
        
        // Monitor memory usage (if available)
        if (performance.memory) {
            setInterval(() => {
                const memoryMB = performance.memory.usedJSHeapSize / (1024 * 1024);
                this.performance.memory = Math.round(memoryMB);
                
                // Update debug display
                const memoryUsage = document.getElementById('memoryUsage');
                if (memoryUsage) {
                    memoryUsage.textContent = this.performance.memory + 'MB';
                }
                
                // Track memory issues
                if (memoryMB > this.config.analytics.performance.thresholds.memoryUsage) {
                    this.trackEvent('performance_issue', {
                        issue_type: 'high_memory',
                        memory_mb: Math.round(memoryMB),
                        session_id: this.sessionId
                    });
                }
            }, 5000);
        }
    }
    
    trackPageLoad() {
        window.addEventListener('load', () => {
            const timing = performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            
            this.performance.loadTime = loadTime;
            
            this.trackEvent('page_load', {
                load_time: loadTime,
                dom_ready_time: timing.domContentLoadedEventEnd - timing.navigationStart,
                session_id: this.sessionId,
                user_agent: navigator.userAgent,
                screen_resolution: `${screen.width}x${screen.height}`,
                viewport_size: `${window.innerWidth}x${window.innerHeight}`
            });
            
            console.log(`🚀 Page loaded in ${loadTime}ms`);
        });
    }
    
    // Core event tracking method
    trackEvent(eventName, parameters = {}) {
        if (!this.enabled) {
            if (this.config.features.consoleLogging) {
                console.log(`📊 [Analytics] ${eventName}:`, parameters);
            }
            return;
        }
        
        try {
            // Add common parameters
            const eventData = {
                ...parameters,
                session_id: this.sessionId,
                game_version: this.config.version,
                timestamp: Date.now(),
                session_duration: Date.now() - this.startTime
            };
            
            // Store event locally for potential batch sending
            this.events.push({
                name: eventName,
                data: eventData
            });
            
            // Send to Google Analytics if available
            if (window.gtag) {
                gtag('event', eventName, eventData);
            }
            
            // Log in development
            if (this.config.isDevelopment) {
                console.log(`📊 Event tracked: ${eventName}`, eventData);
            }
            
        } catch (error) {
            console.error('❌ Error tracking event:', error);
        }
    }
    
    // Game-specific tracking methods
    trackGameStart(gameMode = 'standard') {
        this.trackEvent(this.config.analytics.events.gameStart, {
            game_mode: gameMode,
            player_returning: this.isReturningPlayer(),
            device_type: this.getDeviceType(),
            browser: this.getBrowserInfo()
        });
    }
    
    trackGameOver(score, level, survivalTime, reason = 'health_depleted') {
        this.trackEvent(this.config.analytics.events.gameOver, {
            final_score: score,
            final_level: level,
            survival_time: survivalTime,
            game_over_reason: reason,
            enemies_encountered: this.getGameStat('enemiesEncountered', 0),
            powerups_collected: this.getGameStat('powerupsCollected', 0)
        });
    }
    
    trackLevelUp(newLevel, score, survivalTime) {
        this.trackEvent(this.config.analytics.events.levelUp, {
            new_level: newLevel,
            current_score: score,
            survival_time: survivalTime,
            progression_rate: score / survivalTime // Score per second
        });
    }
    
    trackPowerupCollected(powerupType, playerHealth, currentLevel) {
        this.trackEvent(this.config.analytics.events.powerupCollected, {
            powerup_type: powerupType,
            player_health_before: playerHealth,
            current_level: currentLevel,
            collection_frequency: this.getGameStat('powerupFrequency', 0)
        });
    }
    
    trackHighScore(newScore, previousBest, rank) {
        this.trackEvent(this.config.analytics.events.highScore, {
            new_score: newScore,
            previous_best: previousBest,
            improvement: newScore - previousBest,
            leaderboard_rank: rank,
            achievement_type: 'high_score'
        });
    }
    
    trackPWAInstall() {
        this.trackEvent(this.config.analytics.events.pwaInstall, {
            install_source: 'install_prompt',
            time_to_install: Date.now() - this.startTime,
            platform: this.getPlatform()
        });
    }
    
    trackShareScore(platform, score, level) {
        this.trackEvent(this.config.analytics.events.shareScore, {
            share_platform: platform,
            shared_score: score,
            shared_level: level,
            share_method: 'in_game'
        });
    }
    
    trackError(error, context = 'general') {
        this.performance.errors++;
        
        this.trackEvent(this.config.analytics.events.errorOccurred, {
            error_message: error.message || 'Unknown error',
            error_context: context,
            error_stack: error.stack || 'No stack trace',
            session_errors: this.performance.errors,
            browser_info: this.getBrowserInfo()
        });
    }
    
    // User engagement tracking
    trackUserEngagement(action, value = null) {
        this.trackEvent('user_engagement', {
            engagement_type: action,
            engagement_value: value,
            session_duration: Date.now() - this.startTime
        });
    }
    
    trackFeatureUsage(feature, usage_type = 'used') {
        this.trackEvent('feature_usage', {
            feature_name: feature,
            usage_type: usage_type,
            session_id: this.sessionId
        });
    }
    
    // Helper methods
    isReturningPlayer() {
        const hasHighScores = localStorage.getItem(this.config.utils.getStorageKey('highScores'));
        return !!hasHighScores;
    }
    
    getDeviceType() {
        const width = window.innerWidth;
        if (width < 600) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }
    
    getBrowserInfo() {
        const ua = navigator.userAgent;
        const browser = {
            name: 'unknown',
            version: 'unknown'
        };
        
        if (ua.includes('Chrome')) browser.name = 'Chrome';
        else if (ua.includes('Firefox')) browser.name = 'Firefox';
        else if (ua.includes('Safari') && !ua.includes('Chrome')) browser.name = 'Safari';
        else if (ua.includes('Edge')) browser.name = 'Edge';
        
        return `${browser.name} (${navigator.platform})`;
    }
    
    getPlatform() {
        if (navigator.userAgentData && navigator.userAgentData.platform) {
            return navigator.userAgentData.platform;
        }
        return navigator.platform;
    }
    
    getGameStat(key, defaultValue) {
        if (window.gameState) {
            return window.gameState[key] || defaultValue;
        }
        return defaultValue;
    }
    
    // Privacy and compliance
    setUserConsent(hasConsent) {
        if (window.gtag) {
            gtag('consent', 'update', {
                analytics_storage: hasConsent ? 'granted' : 'denied',
                ad_storage: 'denied' // We don't use ads
            });
        }
    }
    
    // Data export for GDPR compliance
    exportUserData() {
        return {
            sessionId: this.sessionId,
            events: this.events,
            performance: this.performance,
            startTime: this.startTime,
            userAgent: navigator.userAgent,
            platform: this.getPlatform(),
            screenResolution: `${screen.width}x${screen.height}`
        };
    }
    
    // Clear user data
    clearUserData() {
        this.events = [];
        this.sessionId = this.generateSessionId();
        console.log('🧹 User analytics data cleared');
    }
}

// Performance Monitor Class
class PerformanceMonitor {
    constructor(analytics) {
        this.analytics = analytics;
        this.metrics = {
            frameDrops: 0,
            memorySpikes: 0,
            loadTimes: [],
            interactionDelays: []
        };
        
        this.setupMonitoring();
    }
    
    setupMonitoring() {
        // Monitor long tasks
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.duration > 50) { // Long task threshold
                            this.analytics.trackEvent('performance_issue', {
                                issue_type: 'long_task',
                                duration: entry.duration,
                                task_name: entry.name
                            });
                        }
                    });
                });
                
                observer.observe({ entryTypes: ['longtask'] });
            } catch (error) {
                console.log('PerformanceObserver not fully supported');
            }
        }
        
        // Monitor resource loading
        window.addEventListener('load', () => {
            const resources = performance.getEntriesByType('resource');
            const slowResources = resources.filter(resource => resource.duration > 1000);
            
            slowResources.forEach(resource => {
                this.analytics.trackEvent('performance_issue', {
                    issue_type: 'slow_resource',
                    resource_name: resource.name,
                    duration: resource.duration,
                    size: resource.transferSize
                });
            });
        });
    }
    
    measureInteraction(name, startTime) {
        return () => {
            const duration = performance.now() - startTime;
            this.metrics.interactionDelays.push(duration);
            
            if (duration > 100) { // Slow interaction threshold
                this.analytics.trackEvent('performance_issue', {
                    issue_type: 'slow_interaction',
                    interaction_name: name,
                    duration: duration
                });
            }
        };
    }
    
    getAverageInteractionDelay() {
        if (this.metrics.interactionDelays.length === 0) return 0;
        const sum = this.metrics.interactionDelays.reduce((a, b) => a + b, 0);
        return sum / this.metrics.interactionDelays.length;
    }
}

// A/B Testing Manager (for future use)
class ABTestingManager {
    constructor(analytics) {
        this.analytics = analytics;
        this.tests = {};
        this.userVariants = this.loadUserVariants();
    }
    
    loadUserVariants() {
        const stored = localStorage.getItem('abTestVariants');
        return stored ? JSON.parse(stored) : {};
    }
    
    saveUserVariants() {
        localStorage.setItem('abTestVariants', JSON.stringify(this.userVariants));
    }
    
    assignVariant(testName, variants) {
        if (this.userVariants[testName]) {
            return this.userVariants[testName];
        }
        
        // Simple random assignment
        const variant = variants[Math.floor(Math.random() * variants.length)];
        this.userVariants[testName] = variant;
        this.saveUserVariants();
        
        this.analytics.trackEvent('ab_test_assignment', {
            test_name: testName,
            variant: variant
        });
        
        return variant;
    }
    
    trackConversion(testName, conversionType = 'default') {
        const variant = this.userVariants[testName];
        if (!variant) return;
        
        this.analytics.trackEvent('ab_test_conversion', {
            test_name: testName,
            variant: variant,
            conversion_type: conversionType
        });
    }
}

// Initialize Analytics
let analytics = null;
let performanceMonitor = null;
let abTesting = null;

// Wait for config to be ready
const initializeAnalytics = () => {
    if (window.GameConfig) {
        analytics = new AnalyticsManager();
        performanceMonitor = new PerformanceMonitor(analytics);
        abTesting = new ABTestingManager(analytics);
        
        // Make analytics available globally
        window.analytics = analytics;
        window.performanceMonitor = performanceMonitor;
        window.abTesting = abTesting;
        
        console.log('✅ Analytics system initialized');
    } else {
        console.warn('⚠️ GameConfig not available, retrying analytics initialization...');
        setTimeout(initializeAnalytics, 100);
    }
};

// Initialize when config is ready
if (window.GameConfig) {
    initializeAnalytics();
} else {
    window.addEventListener('configReady', initializeAnalytics);
}

// Export for ES6 modules (future use)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnalyticsManager, PerformanceMonitor, ABTestingManager };
}

console.log('✅ Analytics module loaded');
