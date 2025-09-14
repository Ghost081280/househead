// 🏠 House Head Chase - Fixed Firebase Integration
// Authentication & Global Leaderboard System

console.log('🔥 Loading Firebase integration...');

class FirebaseManager {
    constructor() {
        this.config = window.GameConfig;
        this.auth = null;
        this.db = null;
        this.user = null;
        this.isInitialized = false;
        this.firebaseFunctions = null;
    }

    async initialize() {
        if (!this.config?.features?.globalLeaderboard) {
            console.log('🔥 Firebase disabled - using local mode only');
            return;
        }

        try {
            // Load Firebase SDK using modern v10 approach
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            const { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, where } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            // Initialize Firebase with config
            const app = initializeApp(this.config.firebase.config);
            this.auth = getAuth(app);
            this.db = getFirestore(app);
            
            // Store Firebase functions for later use
            this.firebaseFunctions = {
                signInWithPopup,
                GoogleAuthProvider,
                signOut,
                onAuthStateChanged,
                collection,
                addDoc,
                query,
                orderBy,
                limit,
                getDocs,
                where
            };

            // Listen for auth state changes
            this.firebaseFunctions.onAuthStateChanged(this.auth, (user) => {
                this.handleAuthStateChange(user);
            });

            this.isInitialized = true;
            console.log('✅ Firebase initialized successfully');

            // Show auth container after successful init
            const authContainer = document.getElementById('authContainer');
            if (authContainer) {
                authContainer.classList.remove('hidden');
            }

        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            this.handleFirebaseError(error);
        }
    }

    handleAuthStateChange(user) {
        this.user = user;
        
        if (user) {
            console.log('👤 User signed in:', user.displayName || user.email);
            this.showUserProfile(user);
            this.updateUIForSignedInUser();
        } else {
            console.log('👤 User signed out');
            this.updateUIForSignedOutUser();
        }

        // Update global leaderboard when auth state changes
        this.updateGlobalLeaderboard();
    }

    async signInWithGoogle() {
        if (!this.isInitialized) {
            console.warn('⚠️ Firebase not initialized');
            return false;
        }

        try {
            const provider = new this.firebaseFunctions.GoogleAuthProvider();
            
            // Add kid-safe scopes
            provider.addScope('profile');
            provider.addScope('email');
            
            // Configure for family-friendly signin
            provider.setCustomParameters({
                prompt: 'select_account',
                hd: '' // Allow any domain
            });

            const result = await this.firebaseFunctions.signInWithPopup(this.auth, provider);
            const user = result.user;

            console.log('✅ Google sign-in successful');
            
            // Track sign-in event
            if (window.analytics) {
                window.analytics.trackEvent('user_signed_in', {
                    method: 'google',
                    first_time: !user.metadata.lastSignInTime
                });
            }

            return true;

        } catch (error) {
            console.error('❌ Google sign-in failed:', error);
            this.handleAuthError(error);
            return false;
        }
    }

    async signOut() {
        if (!this.isInitialized || !this.auth) {
            return;
        }

        try {
            await this.firebaseFunctions.signOut(this.auth);
            console.log('✅ User signed out');
            
            if (window.analytics) {
                window.analytics.trackEvent('user_signed_out');
            }

        } catch (error) {
            console.error('❌ Sign-out failed:', error);
        }
    }

    async submitScore(score, level, survivalTime) {
        if (!this.isInitialized || !this.user) {
            console.log('📊 Score saved locally only');
            return false;
        }

        try {
            const scoreData = {
                userId: this.user.uid,
                playerName: this.user.displayName || this.generatePlayerName(),
                score: score,
                level: level,
                survivalTime: survivalTime,
                timestamp: new Date(),
                gameVersion: this.config.version,
                // Kid-safe metadata
                isVerified: true,
                platform: 'web'
            };

            const docRef = await this.firebaseFunctions.addDoc(
                this.firebaseFunctions.collection(this.db, 'globalScores'), 
                scoreData
            );

            console.log('✅ Score submitted to global leaderboard:', docRef.id);
            
            if (window.analytics) {
                window.analytics.trackEvent('score_submitted', {
                    score: score,
                    level: level,
                    global: true
                });
            }

            return true;

        } catch (error) {
            console.error('❌ Score submission failed:', error);
            return false;
        }
    }

    async getGlobalLeaderboard(limit = 10) {
        if (!this.isInitialized) {
            return [];
        }

        try {
            const q = this.firebaseFunctions.query(
                this.firebaseFunctions.collection(this.db, 'globalScores'),
                this.firebaseFunctions.orderBy('score', 'desc'),
                this.firebaseFunctions.limit(limit)
            );

            const querySnapshot = await this.firebaseFunctions.getDocs(q);
            const scores = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                scores.push({
                    id: doc.id,
                    playerName: this.sanitizePlayerName(data.playerName),
                    score: data.score,
                    level: data.level,
                    survivalTime: data.survivalTime,
                    timestamp: data.timestamp.toDate(),
                    isCurrentUser: this.user && data.userId === this.user.uid
                });
            });

            console.log(`📊 Loaded ${scores.length} global scores`);
            return scores;

        } catch (error) {
            console.error('❌ Failed to load global leaderboard:', error);
            return [];
        }
    }

    generatePlayerName() {
        const adjectives = ['Brave', 'Quick', 'Smart', 'Swift', 'Clever'];
        const nouns = ['Runner', 'Player', 'Explorer', 'Hero', 'Champion'];
        return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
    }

    // Kid-safe player name sanitization
    sanitizePlayerName(name) {
        if (!name) return this.generatePlayerName();
        
        // Remove any inappropriate content (basic filter)
        const cleaned = name
            .replace(/[<>]/g, '') // Remove HTML brackets
            .replace(/\b(bad|word|here)\b/gi, '***') // Basic word filter
            .trim();
            
        return cleaned || this.generatePlayerName();
    }

    updateUIForSignedInUser() {
        const signInBtn = document.getElementById('signInBtn');
        const signOutBtn = document.getElementById('signOutBtn');
        const userProfile = document.getElementById('userProfile');

        if (signInBtn) signInBtn.style.display = 'none';
        if (signOutBtn) signOutBtn.style.display = 'block';
        if (userProfile) {
            userProfile.style.display = 'block';
            userProfile.innerHTML = `
                <span class="user-avatar">👤</span>
                <span class="user-name">${this.user.displayName || 'Player'}</span>
            `;
        }

        // Enable global features
        this.enableGlobalFeatures();
    }

    updateUIForSignedOutUser() {
        const signInBtn = document.getElementById('signInBtn');
        const signOutBtn = document.getElementById('signOutBtn');
        const userProfile = document.getElementById('userProfile');

        if (signInBtn) signInBtn.style.display = 'block';
        if (signOutBtn) signOutBtn.style.display = 'none';
        if (userProfile) userProfile.style.display = 'none';

        // Disable global features
        this.disableGlobalFeatures();
    }

    enableGlobalFeatures() {
        const globalTab = document.getElementById('globalScoresTab');
        if (globalTab) {
            globalTab.disabled = false;
            globalTab.style.opacity = '1';
        }
    }

    disableGlobalFeatures() {
        const globalTab = document.getElementById('globalScoresTab');
        if (globalTab) {
            globalTab.disabled = true;
            globalTab.style.opacity = '0.5';
        }
    }

    showUserProfile(user) {
        console.log('👤 User Profile:', {
            name: user.displayName,
            email: user.email,
            uid: user.uid
        });
    }

    async updateGlobalLeaderboard() {
        const leaderboardContainer = document.getElementById('globalLeaderboardList');
        if (!leaderboardContainer) return;

        try {
            const scores = await this.getGlobalLeaderboard(10);
            
            if (scores.length === 0) {
                leaderboardContainer.innerHTML = '<p>No global scores yet. Be the first!</p>';
                return;
            }

            let html = '<div class="global-scores">';
            scores.forEach((score, index) => {
                const rank = index + 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                const isCurrentUser = score.isCurrentUser ? ' current-user' : '';
                
                html += `
                    <div class="global-score-item${isCurrentUser}">
                        <span class="rank">${medal}</span>
                        <span class="player-name">${score.playerName}</span>
                        <span class="score">${this.formatTime(score.survivalTime)}</span>
                        <span class="level">Lv.${score.level}</span>
                    </div>
                `;
            });
            html += '</div>';
            
            leaderboardContainer.innerHTML = html;

        } catch (error) {
            console.error('❌ Failed to update global leaderboard UI:', error);
            leaderboardContainer.innerHTML = '<p>Unable to load global scores.</p>';
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    handleFirebaseError(error) {
        console.error('Firebase Error:', error);
        
        // Show user-friendly error message
        const errorMessages = {
            'auth/popup-blocked': 'Please allow popups and try signing in again.',
            'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'default': 'Something went wrong. Please try again later.'
        };

        const message = errorMessages[error.code] || errorMessages.default;
        this.showMessage(message, 'error');
    }

    handleAuthError(error) {
        this.handleFirebaseError(error);
    }

    showMessage(message, type = 'info') {
        // Create a simple message display
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'error' ? '#ff4444' : '#44aa44'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: 'Orbitron', monospace;
            font-size: 14px;
            max-width: 300px;
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            if (document.body.contains(messageDiv)) {
                document.body.removeChild(messageDiv);
            }
        }, 5000);
    }
}

// Initialize Firebase Manager
let firebaseManager = null;

// Initialize when config is ready
const initializeFirebase = () => {
    if (window.GameConfig) {
        firebaseManager = new FirebaseManager();
        firebaseManager.initialize();
        
        // Make available globally
        window.firebaseManager = firebaseManager;
        
        console.log('✅ Firebase manager initialized');
    } else {
        console.warn('⚠️ GameConfig not ready, retrying...');
        setTimeout(initializeFirebase, 100);
    }
};

// Initialize when ready
if (window.GameConfig) {
    initializeFirebase();
} else {
    window.addEventListener('configReady', initializeFirebase);
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseManager;
}

console.log('✅ Firebase integration loaded');
