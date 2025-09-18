// 🏠 House Head Chase - Enhanced Firebase Integration
// Authentication & Global Leaderboard System with Realtime Database

console.log('🔥 Loading Firebase integration...');

class FirebaseManager {
    constructor() {
        this.config = window.GameConfig;
        this.auth = null;
        this.db = null;
        this.realtimeDB = null;
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
            const { getDatabase, ref, push, set, orderByChild, limitToLast, get } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');

            // Initialize Firebase with config
            const app = initializeApp(this.config.firebase.config);
            this.auth = getAuth(app);
            this.db = getFirestore(app);
            this.realtimeDB = getDatabase(app);
            
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
                where,
                ref,
                push,
                set,
                orderByChild,
                limitToLast,
                get
            };

            // Listen for auth state changes
            this.firebaseFunctions.onAuthStateChanged(this.auth, (user) => {
                this.handleAuthStateChange(user);
            });

            this.isInitialized = true;
            console.log('✅ Firebase initialized successfully with Realtime Database');

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

    async submitScore(playerName, survivalTime, level) {
        if (!this.isInitialized) {
            console.log('📊 Score saved locally only - Firebase not initialized');
            return false;
        }

        const scoreData = {
            playerName: this.sanitizePlayerName(playerName),
            survivalTime: survivalTime,
            level: level,
            timestamp: Date.now(),
            dateTime: new Date().toISOString(),
            gameVersion: this.config.version,
            platform: 'web',
            userId: this.user ? this.user.uid : 'anonymous',
            isVerified: !!this.user
        };

        try {
            // Submit to Realtime Database
            const scoresRef = this.firebaseFunctions.ref(this.realtimeDB, 'globalScores');
            await this.firebaseFunctions.push(scoresRef, scoreData);

            console.log('✅ Score submitted to Realtime Database:', scoreData);
            
            // Also submit to Firestore if user is signed in (for backup)
            if (this.user) {
                try {
                    await this.firebaseFunctions.addDoc(
                        this.firebaseFunctions.collection(this.db, 'globalScores'), 
                        scoreData
                    );
                    console.log('✅ Score also backed up to Firestore');
                } catch (firestoreError) {
                    console.warn('⚠️ Firestore backup failed:', firestoreError);
                }
            }
            
            if (window.analytics) {
                window.analytics.trackEvent('score_submitted', {
                    score: survivalTime,
                    level: level,
                    global: true,
                    player_name: scoreData.playerName
                });
            }

            return true;

        } catch (error) {
            console.error('❌ Score submission failed:', error);
            
            // Try to save locally as fallback
            this.saveScoreLocally(scoreData);
            return false;
        }
    }

    saveScoreLocally(scoreData) {
        try {
            const localScores = JSON.parse(localStorage.getItem('pendingScores') || '[]');
            localScores.push(scoreData);
            localStorage.setItem('pendingScores', JSON.stringify(localScores));
            console.log('💾 Score saved locally for later sync');
        } catch (error) {
            console.error('❌ Failed to save score locally:', error);
        }
    }

    async syncPendingScores() {
        if (!this.isInitialized) return;

        try {
            const pendingScores = JSON.parse(localStorage.getItem('pendingScores') || '[]');
            if (pendingScores.length === 0) return;

            console.log(`🔄 Syncing ${pendingScores.length} pending scores...`);

            for (const scoreData of pendingScores) {
                try {
                    const scoresRef = this.firebaseFunctions.ref(this.realtimeDB, 'globalScores');
                    await this.firebaseFunctions.push(scoresRef, scoreData);
                    console.log('✅ Synced pending score:', scoreData.playerName);
                } catch (error) {
                    console.error('❌ Failed to sync score:', error);
                    break; // Stop syncing if one fails
                }
            }

            // Clear synced scores
            localStorage.removeItem('pendingScores');
            console.log('✅ All pending scores synced');

        } catch (error) {
            console.error('❌ Failed to sync pending scores:', error);
        }
    }

    async getGlobalLeaderboard(limitCount = 10) {
        if (!this.isInitialized) {
            return [];
        }

        try {
            const scoresRef = this.firebaseFunctions.ref(this.realtimeDB, 'globalScores');
            const scoresQuery = this.firebaseFunctions.query(
                scoresRef,
                this.firebaseFunctions.orderByChild('survivalTime'),
                this.firebaseFunctions.limitToLast(limitCount)
            );

            const snapshot = await this.firebaseFunctions.get(scoresQuery);
            const scores = [];

            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const data = childSnapshot.val();
                    scores.push({
                        id: childSnapshot.key,
                        playerName: this.sanitizePlayerName(data.playerName),
                        survivalTime: data.survivalTime,
                        level: data.level,
                        timestamp: data.timestamp,
                        dateTime: data.dateTime,
                        isCurrentUser: this.user && data.userId === this.user.uid,
                        isVerified: data.isVerified || false
                    });
                });

                // Sort by survival time (descending) since limitToLast gets the highest values
                scores.sort((a, b) => b.survivalTime - a.survivalTime);
            }

            console.log(`📊 Loaded ${scores.length} global scores from Realtime Database`);
            return scores;

        } catch (error) {
            console.error('❌ Failed to load global leaderboard:', error);
            return [];
        }
    }

    generatePlayerName() {
        const adjectives = ['Brave', 'Quick', 'Smart', 'Swift', 'Clever', 'Bold', 'Fast', 'Bright'];
        const nouns = ['Runner', 'Player', 'Explorer', 'Hero', 'Champion', 'Survivor', 'Dodger', 'Escape'];
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
        
        // Sync any pending scores
        this.syncPendingScores();
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
                const verifiedBadge = score.isVerified ? ' ✓' : '';
                
                html += `
                    <div class="global-score-item${isCurrentUser}">
                        <span class="rank">${medal}</span>
                        <span class="player-name">${score.playerName}${verifiedBadge}</span>
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
        
        console.log('✅ Firebase manager initialized with Realtime Database support');
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

console.log('✅ Firebase integration loaded with Realtime Database support');
