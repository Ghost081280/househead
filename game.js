// === FIXED GAME STATE ===
const gameState = {
    // Core game state
    running: false,
    paused: false,
    canvas: null,
    ctx: null,
    config: null,
    
    // Player state
    player: {
        x: 400,
        y: 300,
        size: 15,
        health: 100,
        maxHealth: 100,
        speed: 3,
        baseSpeed: 3,
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
        shieldTime: 0,
        speedBoostTime: 0,
        velocity: { x: 0, y: 0 },
        invulnerabilityTime: 0
    },
    
    // Game objects
    enemies: [],
    powerups: [],
    activePowerups: [],
    
    // Game mechanics
    flashlight: {
        on: false,
        intensity: 0,
        radius: 200,
        fadeSpeed: 0.1,
        batteryLife: 100
    },
    
    // Time-focused progression (removed score)
    level: 1,
    startTime: 0,
    lastEnemySpawn: 0,
    lastPowerupSpawn: 0,
    lastLevelUpdate: 0,
    spawnRate: 3000,
    powerupSpawnRate: 12000,
    
    // Input handling
    input: {
        lastTap: 0,
        doubleTapDelay: 300,
        touchActive: false,
        mouseActive: false
    },
    
    // Visual effects
    camera: {
        shake: 0,
        intensity: 0
    },
    
    // Performance tracking
    performance: {
        frameCount: 0,
        lastFPSUpdate: 0,
        currentFPS: 60
    },
    
    // Game statistics
    stats: {
        enemiesEncountered: 0,
        powerupsCollected: 0,
        totalDamage: 0,
        highestLevel: 1,
        longestSurvival: 0
    },
    
    // Difficulty scaling
    difficulty: 1,
    totalEnemiesSpawned: 0
};

// === FIXED TIME FORMATTING FUNCTION ===
function formatTime(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// === FIXED TIME CALCULATION ===
function getCurrentSurvivalTime() {
    if (!gameState.startTime || gameState.startTime === 0) return 0;
    return Math.floor((Date.now() - gameState.startTime) / 1000);
}

// === FIXED UI UPDATE FUNCTION ===
function updateUI() {
    try {
        const health = Math.max(0, Math.floor(gameState.player?.health || 0));
        const maxHealth = gameState.player?.maxHealth || 100;
        const survivalTime = getCurrentSurvivalTime();
        
        // Update health display
        const healthEl = document.getElementById('health');
        const healthFillEl = document.getElementById('healthFill');
        if (healthEl) healthEl.textContent = health;
        if (healthFillEl) healthFillEl.style.width = (health / maxHealth * 100) + '%';
        
        // Update time display - this was the main issue
        const survivalTimeEl = document.getElementById('survivalTime');
        if (survivalTimeEl) {
            survivalTimeEl.textContent = formatTime(survivalTime);
        }
        
        // Update level display
        const levelEl = document.getElementById('level');
        if (levelEl) levelEl.textContent = gameState.level;
        
        // Update health bar accessibility
        const healthBarEl = document.getElementById('healthBar');
        if (healthBarEl) {
            healthBarEl.setAttribute('aria-valuenow', health);
        }
        
        updatePowerupIndicators();
    } catch (error) {
        console.error('Error updating UI:', error);
    }
}

// === FIXED LEVEL PROGRESSION (TIME-BASED) ===
function updateLevelProgression(currentTime) {
    const survivalTime = getCurrentSurvivalTime();
    
    // Level up every 30 seconds instead of score-based
    const newLevel = Math.floor(survivalTime / 30) + 1;
    
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameState.stats.highestLevel = Math.max(gameState.stats.highestLevel, newLevel);
        gameState.difficulty = 1 + (gameState.level - 1) * 0.15;
        
        // Play level up sound if sound system is available
        if (window.soundSystem && typeof window.soundSystem.play === 'function') {
            window.soundSystem.play('levelup');
        }
        
        showLevelUpEffect();
        
        // Track level up with time
        if (window.analytics && typeof window.analytics.trackLevelUp === 'function') {
            window.analytics.trackLevelUp(newLevel, survivalTime, survivalTime);
        }
        
        // Show time milestone for significant achievements
        if (survivalTime > 0 && survivalTime % 60 === 0) {
            showTimeMilestone(survivalTime);
        }
        
        console.log(`🎊 Level up! Now level ${gameState.level} (Survival: ${formatTime(survivalTime)})`);
    }
}

// === FIXED START GAME FUNCTION ===
function startGame() {
    console.log('🎮 Starting new game...');
    
    // Reset all game state
    gameState.running = true;
    gameState.paused = false;
    gameState.level = 1;
    gameState.difficulty = 1;
    gameState.totalEnemiesSpawned = 0;
    
    // CRITICAL FIX: Set start time when game actually starts
    gameState.startTime = Date.now();
    
    // Reset player
    gameState.player = {
        x: 400,
        y: 300,
        size: 15,
        health: 100,
        maxHealth: 100,
        speed: 3,
        baseSpeed: 3,
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
        shieldTime: 0,
        speedBoostTime: 0,
        velocity: { x: 0, y: 0 },
        invulnerabilityTime: 0
    };
    
    // Clear arrays
    gameState.enemies = [];
    gameState.powerups = [];
    gameState.activePowerups = [];
    
    // Reset flashlight
    gameState.flashlight = {
        on: false,
        intensity: 0,
        radius: 200,
        fadeSpeed: 0.1,
        batteryLife: 100
    };
    
    // Reset spawn timers
    gameState.lastEnemySpawn = 0;
    gameState.lastPowerupSpawn = 0;
    gameState.lastLevelUpdate = 0;
    
    // Reset camera
    gameState.camera = {
        shake: 0,
        intensity: 0
    };
    
    // Initialize canvas if needed
    if (!gameState.canvas) {
        gameState.canvas = document.getElementById('gameCanvas');
        if (gameState.canvas) {
            gameState.ctx = gameState.canvas.getContext('2d');
            setupCanvas();
            setupEventListeners();
        }
    }
    
    // Show game UI
    hideAllScreens();
    showGameUI();
    
    // Enable canvas
    if (gameState.canvas) {
        gameState.canvas.classList.add('active');
        gameState.canvas.style.pointerEvents = 'auto';
        gameState.canvas.focus();
    }
    
    // Start game loop
    if (!gameState.gameLoopId) {
        gameState.gameLoopId = setInterval(gameLoop, 16); // ~60fps
    }
    
    console.log('✅ Game started successfully!');
}

// === FIXED END GAME FUNCTION ===
function endGame() {
    console.log('🎮 Ending game...');
    
    gameState.running = false;
    
    if (gameState.canvas) {
        gameState.canvas.classList.remove('active');
        gameState.canvas.style.pointerEvents = 'none';
    }
    
    // Stop game loop
    if (gameState.gameLoopId) {
        clearInterval(gameState.gameLoopId);
        gameState.gameLoopId = null;
    }
    
    const survivalTime = getCurrentSurvivalTime();
    gameState.stats.longestSurvival = Math.max(gameState.stats.longestSurvival, survivalTime);
    
    // Save high score (now based on time)
    saveHighScore(survivalTime, gameState.level);
    
    // FIXED: Update game over screen with correct element IDs
    try {
        const finalTimeEl = document.getElementById('finalTime');
        const finalLevelEl = document.getElementById('finalLevel');
        
        if (finalTimeEl) finalTimeEl.textContent = formatTime(survivalTime);
        if (finalLevelEl) finalLevelEl.textContent = gameState.level;
        
        console.log(`📊 Final stats - Time: ${formatTime(survivalTime)}, Level: ${gameState.level}`);
    } catch (error) {
        console.error('Error updating final stats:', error);
    }
    
    // Hide HUD
    hideGameUI();
    
    // Show game over screen
    showScreen('gameOver');
    
    // Track game over with time
    if (window.analytics && typeof window.analytics.trackGameOver === 'function') {
        window.analytics.trackGameOver(
            survivalTime,
            gameState.level,
            survivalTime,
            'health_depleted'
        );
    }
    
    console.log('🎮 Game Over! Survival time:', formatTime(survivalTime));
}

// === UI HELPER FUNCTIONS ===
function showGameUI() {
    const hud = document.getElementById('hud');
    const powerupIndicators = document.getElementById('powerupIndicators');
    const flashlightIndicator = document.getElementById('flashlightIndicator');
    const controlsHint = document.getElementById('controlsHint');
    
    if (hud) hud.classList.remove('hidden');
    if (powerupIndicators) powerupIndicators.classList.remove('hidden');
    if (flashlightIndicator) flashlightIndicator.classList.remove('hidden');
    if (controlsHint) controlsHint.classList.remove('hidden');
}

function hideGameUI() {
    const hud = document.getElementById('hud');
    const powerupIndicators = document.getElementById('powerupIndicators');
    const flashlightIndicator = document.getElementById('flashlightIndicator');
    const controlsHint = document.getElementById('controlsHint');
    
    if (hud) hud.classList.add('hidden');
    if (powerupIndicators) powerupIndicators.classList.add('hidden');
    if (flashlightIndicator) flashlightIndicator.classList.add('hidden');
    if (controlsHint) controlsHint.classList.add('hidden');
}

function hideAllScreens() {
    const screens = ['startScreen', 'gameOver', 'highScoresModal', 'helpModal', 'shareModal'];
    screens.forEach(screenId => {
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('hidden');
        }
    });
}

function showScreen(screenId) {
    hideAllScreens();
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.remove('hidden');
    }
}

// === PLACEHOLDER FUNCTIONS (to be implemented) ===
function setupCanvas() {
    if (!gameState.canvas || !gameState.ctx) return;
    
    // Basic canvas setup
    const canvas = gameState.canvas;
    canvas.width = 800;
    canvas.height = 600;
    
    // Set canvas styles
    canvas.style.background = '#000';
    canvas.style.border = '2px solid #333';
}

function setupEventListeners() {
    if (!gameState.canvas) return;
    
    // Basic event listeners - implement full touch/mouse handling
    gameState.canvas.addEventListener('mousedown', handleMouseDown);
    gameState.canvas.addEventListener('mousemove', handleMouseMove);
    gameState.canvas.addEventListener('mouseup', handleMouseUp);
    
    // Touch events
    gameState.canvas.addEventListener('touchstart', handleTouchStart);
    gameState.canvas.addEventListener('touchmove', handleTouchMove);
    gameState.canvas.addEventListener('touchend', handleTouchEnd);
    
    // Double click/tap for flashlight
    gameState.canvas.addEventListener('dblclick', toggleFlashlight);
}

// === BASIC EVENT HANDLERS ===
function handleMouseDown(e) {
    const rect = gameState.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking near player
    const dx = x - gameState.player.x;
    const dy = y - gameState.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 50) {
        gameState.player.isDragging = true;
        gameState.player.dragOffset = { x: dx, y: dy };
    }
}

function handleMouseMove(e) {
    if (!gameState.player.isDragging) return;
    
    const rect = gameState.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - gameState.player.dragOffset.x;
    const y = e.clientY - rect.top - gameState.player.dragOffset.y;
    
    // Keep player in bounds
    gameState.player.x = Math.max(gameState.player.size, Math.min(gameState.canvas.width - gameState.player.size, x));
    gameState.player.y = Math.max(gameState.player.size, Math.min(gameState.canvas.height - gameState.player.size, y));
}

function handleMouseUp(e) {
    gameState.player.isDragging = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    gameState.canvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    gameState.canvas.dispatchEvent(mouseEvent);
}

function handleTouchEnd(e) {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    gameState.canvas.dispatchEvent(mouseEvent);
}

function toggleFlashlight() {
    gameState.flashlight.on = !gameState.flashlight.on;
    console.log('🔦 Flashlight:', gameState.flashlight.on ? 'ON' : 'OFF');
}

// === BASIC GAME LOOP ===
function gameLoop() {
    if (!gameState.running) return;
    
    updateGame();
    render();
}

function updateGame() {
    const currentTime = Date.now();
    
    // Update player effects
    updatePlayerEffects();
    
    // Update flashlight
    updateFlashlight();
    
    // Update level progression
    updateLevelProgression(currentTime);
    
    // Basic enemy spawning
    if (currentTime - gameState.lastEnemySpawn > gameState.spawnRate) {
        spawnEnemy();
        gameState.lastEnemySpawn = currentTime;
    }
    
    // Check game over
    if (gameState.player.health <= 0) {
        endGame();
        return;
    }
    
    // Update UI
    updateUI();
}

function render() {
    if (!gameState.ctx || !gameState.canvas) return;
    
    const ctx = gameState.ctx;
    const canvas = gameState.canvas;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw player
    ctx.fillStyle = '#4af';
    ctx.beginPath();
    ctx.arc(gameState.player.x, gameState.player.y, gameState.player.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw flashlight effect
    if (gameState.flashlight.on && gameState.flashlight.intensity > 0) {
        const gradient = ctx.createRadialGradient(
            gameState.player.x, gameState.player.y, 0,
            gameState.player.x, gameState.player.y, gameState.flashlight.radius * gameState.flashlight.intensity
        );
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// === BASIC UPDATE FUNCTIONS ===
function updatePlayerEffects() {
    // Update shield time
    if (gameState.player.shieldTime > 0) {
        gameState.player.shieldTime -= 16;
    }
    
    // Update speed boost time
    if (gameState.player.speedBoostTime > 0) {
        gameState.player.speedBoostTime -= 16;
        gameState.player.speed = gameState.player.baseSpeed * 2;
    } else {
        gameState.player.speed = gameState.player.baseSpeed;
    }
    
    // Update invulnerability
    if (gameState.player.invulnerabilityTime > 0) {
        gameState.player.invulnerabilityTime -= 16;
    }
}

function updateFlashlight() {
    const target = gameState.flashlight.on ? 1 : 0;
    const current = gameState.flashlight.intensity;
    
    if (Math.abs(current - target) > 0.01) {
        gameState.flashlight.intensity += (target - current) * gameState.flashlight.fadeSpeed;
    } else {
        gameState.flashlight.intensity = target;
    }
}

function spawnEnemy() {
    // Basic enemy spawning - implement full enemy system later
    console.log('👾 Enemy spawned (placeholder)');
}

function updatePowerupIndicators() {
    const container = document.getElementById('powerupIndicators');
    if (!container) return;
    
    // Clear existing indicators
    container.innerHTML = '';
    
    // Show active powerups
    if (gameState.player.shieldTime > 0) {
        const shield = document.createElement('div');
        shield.className = 'powerup-indicator';
        shield.innerHTML = '🛡️';
        container.appendChild(shield);
    }
    
    if (gameState.player.speedBoostTime > 0) {
        const speed = document.createElement('div');
        speed.className = 'powerup-indicator';
        speed.innerHTML = '⚡';
        container.appendChild(speed);
    }
}

function showLevelUpEffect() {
    console.log('🎊 Level up effect (placeholder)');
}

function showTimeMilestone(survivalTimeSeconds) {
    const minutes = Math.floor(survivalTimeSeconds / 60);
    
    if (minutes === 0) return;
    
    console.log(`🏆 Time milestone: ${minutes} minutes survived!`);
    
    // Create simple milestone notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ffaa44;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        font-weight: bold;
        z-index: 9999;
    `;
    notification.textContent = `${minutes} minute${minutes > 1 ? 's' : ''} survived! 🏆`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 3000);
}

// === HIGH SCORE FUNCTIONS ===
function saveHighScore(survivalTime, level) {
    try {
        const storageKey = 'houseHeadChase_highScores';
        let highScores = [];
        
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                highScores = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error loading existing high scores:', e);
        }
        
        const newScore = {
            score: survivalTime,
            level: level,
            date: new Date().toISOString().split('T')[0],
            timestamp: Date.now()
        };
        
        highScores.push(newScore);
        highScores.sort((a, b) => b.score - a.score);
        highScores = highScores.slice(0, 10); // Keep top 10
        
        localStorage.setItem(storageKey, JSON.stringify(highScores));
        
        // Check if this is a new high score
        if (highScores[0].score === survivalTime) {
            showNewHighScoreEffect(survivalTime);
        }
        
        console.log('💾 High score saved:', formatTime(survivalTime));
    } catch (error) {
        console.error('Error saving high score:', error);
    }
}

function showNewHighScoreEffect(survivalTimeSeconds) {
    console.log('🏆 New high score effect:', formatTime(survivalTimeSeconds));
    
    // Simple high score notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(45deg, #ffaa44, #ff6644);
        color: white;
        padding: 20px 30px;
        border-radius: 15px;
        font-weight: bold;
        z-index: 9000;
        text-align: center;
        box-shadow: 0 8px 32px rgba(255, 170, 68, 0.6);
    `;
    notification.innerHTML = `
        <h3 style="margin: 0 0 10px 0;">🏆 NEW BEST TIME! 🏆</h3>
        <p style="margin: 0; font-size: 18px;">${formatTime(survivalTimeSeconds)}</p>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 3000);
}

// === NAVIGATION FUNCTIONS ===
function restartGame() {
    startGame();
}

function goToStartScreen() {
    gameState.running = false;
    if (gameState.gameLoopId) {
        clearInterval(gameState.gameLoopId);
        gameState.gameLoopId = null;
    }
    hideAllScreens();
    showScreen('startScreen');
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 House Head Chase - Initializing...');
    
    // Initialize game when DOM is ready
    setupEventBindings();
    
    // Show start screen
    showScreen('startScreen');
    
    console.log('✅ Game initialized successfully!');
});

function setupEventBindings() {
    // Start game button
    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) {
        startBtn.addEventListener('click', startGame);
    }
    
    // Restart game button
    const restartBtn = document.getElementById('restartGameBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', restartGame);
    }
    
    // Go to start screen button
    const homeBtn = document.getElementById('showStartScreenBtn');
    if (homeBtn) {
        homeBtn.addEventListener('click', goToStartScreen);
    }
    
    // Audio toggle
    const audioBtn = document.getElementById('audioToggle');
    if (audioBtn) {
        audioBtn.addEventListener('click', function() {
            if (window.soundSystem && typeof window.soundSystem.toggle === 'function') {
                window.soundSystem.toggle();
            }
        });
    }
    
    console.log('🎮 Event bindings setup complete');
}
