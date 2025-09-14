// === COMPLETE HOUSE HEAD CHASE GAME ===
// Full game.js with all functionality

// === SOUND SYSTEM ===
const soundSystem = {
    enabled: true,
    context: null,
    
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Audio not supported');
            this.enabled = false;
        }
    },
    
    play(type, frequency = 440, volume = 0.3, duration = 0.2) {
        if (!this.enabled || !this.context) return;
        
        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            const frequencies = {
                'hit': 200,
                'powerup': 600,
                'levelup': 800,
                'enemy': 150,
                'flashlight': 300
            };
            
            oscillator.frequency.setValueAtTime(frequencies[type] || frequency, this.context.currentTime);
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0, this.context.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.context.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
            
            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + duration);
        } catch (e) {
            console.warn('Sound play failed:', e);
        }
    },
    
    toggle() {
        this.enabled = !this.enabled;
        const btn = document.getElementById('audioToggle');
        if (btn) {
            btn.textContent = this.enabled ? '🔊' : '🔇';
            btn.setAttribute('aria-label', this.enabled ? 'Mute audio' : 'Unmute audio');
        }
        console.log('🔊 Audio:', this.enabled ? 'ON' : 'OFF');
    }
};

// === GAME STATE ===
const gameState = {
    // Core game state
    running: false,
    paused: false,
    canvas: null,
    ctx: null,
    gameLoopId: null,
    
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
    
    // Time-focused progression
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

// === ENEMY CLASS ===
class Enemy {
    constructor(x, y, type = 'small') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = type === 'big' ? 25 : 15;
        this.speed = type === 'big' ? 1 : 1.5;
        this.health = type === 'big' ? 50 : 25;
        this.damage = type === 'big' ? 25 : 15;
        this.color = type === 'big' ? '#ff6644' : '#ff4444';
        this.state = 'spawning';
        this.spawnTime = Date.now();
        this.stateTime = 0;
        this.targetX = x;
        this.targetY = y;
        this.velocity = { x: 0, y: 0 };
    }
    
    update() {
        const currentTime = Date.now();
        this.stateTime = currentTime - this.spawnTime;
        
        // State transitions
        if (this.state === 'spawning' && this.stateTime > 1000) {
            this.state = 'dormant';
        } else if (this.state === 'dormant' && this.stateTime > 3000) {
            this.state = 'active';
            soundSystem.play('enemy');
        }
        
        // Movement
        if (this.state === 'active') {
            this.updateMovement();
        }
        
        // Check collision with player
        this.checkPlayerCollision();
        
        // Remove if off screen
        return this.isOnScreen();
    }
    
    updateMovement() {
        const player = gameState.player;
        let targetX = player.x;
        let targetY = player.y;
        
        // Hunting behavior when flashlight is on
        if (gameState.flashlight.on) {
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                this.velocity.x = (dx / distance) * this.speed * gameState.difficulty;
                this.velocity.y = (dy / distance) * this.speed * gameState.difficulty;
            }
        } else {
            // Random wandering when flashlight is off
            if (Math.random() < 0.02) {
                this.velocity.x = (Math.random() - 0.5) * this.speed;
                this.velocity.y = (Math.random() - 0.5) * this.speed;
            }
        }
        
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
        // Keep in bounds
        this.x = Math.max(this.size, Math.min(gameState.canvas.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(gameState.canvas.height - this.size, this.y));
    }
    
    checkPlayerCollision() {
        const player = gameState.player;
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.size + player.size && gameState.player.invulnerabilityTime <= 0) {
            this.damagePlayer();
        }
    }
    
    damagePlayer() {
        if (gameState.player.shieldTime > 0) return;
        
        gameState.player.health -= this.damage;
        gameState.player.invulnerabilityTime = 1000;
        gameState.stats.totalDamage += this.damage;
        
        soundSystem.play('hit');
        gameState.camera.shake = 10;
        
        console.log(`💥 Player hit! Health: ${gameState.player.health}`);
    }
    
    isOnScreen() {
        return this.x > -this.size && this.x < gameState.canvas.width + this.size &&
               this.y > -this.size && this.y < gameState.canvas.height + this.size;
    }
    
    render(ctx) {
        ctx.save();
        
        // Visibility based on flashlight
        let alpha = 0.3;
        if (gameState.flashlight.on) {
            const dx = this.x - gameState.player.x;
            const dy = this.y - gameState.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            alpha = Math.min(1, gameState.flashlight.radius / distance);
        } else {
            const dx = this.x - gameState.player.x;
            const dy = this.y - gameState.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            alpha = distance < 50 ? 1 : 0.1;
        }
        
        ctx.globalAlpha = alpha;
        
        // Draw house
        if (this.state === 'spawning') {
            ctx.fillStyle = '#666';
            ctx.globalAlpha = 0.5;
        } else if (this.state === 'dormant') {
            ctx.fillStyle = '#888';
        } else {
            ctx.fillStyle = this.color;
        }
        
        // Draw house body
        ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 1.5);
        
        // Draw roof
        ctx.beginPath();
        ctx.moveTo(this.x - this.size * 1.2, this.y - this.size);
        ctx.lineTo(this.x, this.y - this.size * 1.8);
        ctx.lineTo(this.x + this.size * 1.2, this.y - this.size);
        ctx.closePath();
        ctx.fill();
        
        // Draw legs if active
        if (this.state === 'active') {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x - this.size * 0.5, this.y + this.size * 0.5);
            ctx.lineTo(this.x - this.size * 0.7, this.y + this.size * 1.2);
            ctx.moveTo(this.x + this.size * 0.5, this.y + this.size * 0.5);
            ctx.lineTo(this.x + this.size * 0.7, this.y + this.size * 1.2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// === POWERUP CLASS ===
class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = 12;
        this.spawnTime = Date.now();
        this.lifetime = 15000; // 15 seconds
        this.collected = false;
        
        const types = {
            'health': { color: '#44ff44', symbol: '💚' },
            'shield': { color: '#4444ff', symbol: '🛡️' },
            'speed': { color: '#ffff44', symbol: '⚡' }
        };
        
        this.config = types[type] || types.health;
    }
    
    update() {
        const age = Date.now() - this.spawnTime;
        
        // Check if expired
        if (age > this.lifetime) {
            return false;
        }
        
        // Check collision with player
        const player = gameState.player;
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.size + player.size) {
            this.collect();
            return false;
        }
        
        return true;
    }
    
    collect() {
        soundSystem.play('powerup');
        gameState.stats.powerupsCollected++;
        
        switch (this.type) {
            case 'health':
                gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + 30);
                console.log('💚 Health restored!');
                break;
            case 'shield':
                gameState.player.shieldTime = 5000;
                console.log('🛡️ Shield activated!');
                break;
            case 'speed':
                gameState.player.speedBoostTime = 8000;
                console.log('⚡ Speed boost activated!');
                break;
        }
    }
    
    render(ctx) {
        const age = Date.now() - this.spawnTime;
        const fadeStart = this.lifetime - 3000;
        
        ctx.save();
        
        // Fade out in last 3 seconds
        if (age > fadeStart) {
            ctx.globalAlpha = 1 - (age - fadeStart) / 3000;
        }
        
        // Pulsing effect
        const pulse = Math.sin(age * 0.01) * 0.3 + 0.7;
        const size = this.size * pulse;
        
        // Draw powerup
        ctx.fillStyle = this.config.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
}

// === UTILITY FUNCTIONS ===
function formatTime(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getCurrentSurvivalTime() {
    if (!gameState.startTime || gameState.startTime === 0) return 0;
    return Math.floor((Date.now() - gameState.startTime) / 1000);
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// === SCREEN MANAGEMENT ===
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

function showGameUI() {
    const elements = ['hud', 'powerupIndicators', 'flashlightIndicator', 'controlsHint'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    });
}

function hideGameUI() {
    const elements = ['hud', 'powerupIndicators', 'flashlightIndicator', 'controlsHint'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
}

// === UI UPDATE ===
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
        
        // Update time display
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
        updateFlashlightIndicator();
    } catch (error) {
        console.error('Error updating UI:', error);
    }
}

function updatePowerupIndicators() {
    const container = document.getElementById('powerupIndicators');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (gameState.player.shieldTime > 0) {
        const shield = document.createElement('div');
        shield.className = 'powerup-indicator';
        shield.innerHTML = '🛡️';
        shield.title = `Shield: ${Math.ceil(gameState.player.shieldTime / 1000)}s`;
        container.appendChild(shield);
    }
    
    if (gameState.player.speedBoostTime > 0) {
        const speed = document.createElement('div');
        speed.className = 'powerup-indicator';
        speed.innerHTML = '⚡';
        speed.title = `Speed: ${Math.ceil(gameState.player.speedBoostTime / 1000)}s`;
        container.appendChild(speed);
    }
}

function updateFlashlightIndicator() {
    const indicator = document.getElementById('flashlightIndicator');
    if (!indicator) return;
    
    if (gameState.flashlight.on) {
        indicator.classList.remove('hidden');
        indicator.classList.add('active');
    } else {
        indicator.classList.add('hidden');
        indicator.classList.remove('active');
    }
}

// === GAME INITIALIZATION ===
function initializeGame() {
    console.log('🎮 Initializing House Head Chase...');
    
    // Initialize sound
    soundSystem.init();
    
    // Get canvas
    gameState.canvas = document.getElementById('gameCanvas');
    if (!gameState.canvas) {
        console.error('❌ Canvas not found!');
        return false;
    }
    
    gameState.ctx = gameState.canvas.getContext('2d');
    if (!gameState.ctx) {
        console.error('❌ Canvas context not found!');
        return false;
    }
    
    // Setup canvas
    setupCanvas();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup button events
    setupButtonEvents();
    
    // Show start screen
    showScreen('startScreen');
    
    console.log('✅ Game initialized successfully!');
    return true;
}

function setupCanvas() {
    const canvas = gameState.canvas;
    const container = document.getElementById('gameContainer');
    
    // Set canvas size
    function resizeCanvas() {
        const containerRect = container.getBoundingClientRect();
        const aspectRatio = 4/3;
        
        let width = Math.min(800, containerRect.width - 40);
        let height = Math.min(600, containerRect.height - 40);
        
        // Maintain aspect ratio
        if (width / height > aspectRatio) {
            width = height * aspectRatio;
        } else {
            height = width / aspectRatio;
        }
        
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Set canvas styles
    canvas.style.background = '#000';
    canvas.style.border = '2px solid #333';
    canvas.style.borderRadius = '8px';
}

function setupEventListeners() {
    const canvas = gameState.canvas;
    if (!canvas) return;
    
    // Mouse events
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('dblclick', handleDoubleClick);
    
    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Prevent context menu
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    // Keyboard events
    window.addEventListener('keydown', handleKeyDown);
}

function setupButtonEvents() {
    // Start game
    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) {
        startBtn.addEventListener('click', startGame);
    }
    
    // Restart game
    const restartBtn = document.getElementById('restartGameBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', restartGame);
    }
    
    // Show start screen
    const homeBtn = document.getElementById('showStartScreenBtn');
    if (homeBtn) {
        homeBtn.addEventListener('click', goToStartScreen);
    }
    
    // Audio toggle
    const audioBtn = document.getElementById('audioToggle');
    if (audioBtn) {
        audioBtn.addEventListener('click', () => soundSystem.toggle());
    }
    
    // High scores
    const highScoresBtn = document.getElementById('showHighScoresBtn');
    if (highScoresBtn) {
        highScoresBtn.addEventListener('click', showHighScores);
    }
    
    // Help
    const helpBtn = document.getElementById('showHelpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', showHelp);
    }
    
    // Share
    const shareBtn = document.getElementById('shareScoreBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', showShareModal);
    }
}

// === INPUT HANDLING ===
function handleMouseDown(e) {
    if (!gameState.running) return;
    
    const rect = gameState.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (gameState.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (gameState.canvas.height / rect.height);
    
    const dx = x - gameState.player.x;
    const dy = y - gameState.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 50) {
        gameState.player.isDragging = true;
        gameState.player.dragOffset = { x: dx, y: dy };
        gameState.canvas.style.cursor = 'grabbing';
    }
}

function handleMouseMove(e) {
    if (!gameState.running || !gameState.player.isDragging) return;
    
    const rect = gameState.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (gameState.canvas.width / rect.width) - gameState.player.dragOffset.x;
    const y = (e.clientY - rect.top) * (gameState.canvas.height / rect.height) - gameState.player.dragOffset.y;
    
    gameState.player.x = Math.max(gameState.player.size, Math.min(gameState.canvas.width - gameState.player.size, x));
    gameState.player.y = Math.max(gameState.player.size, Math.min(gameState.canvas.height - gameState.player.size, y));
}

function handleMouseUp(e) {
    gameState.player.isDragging = false;
    gameState.canvas.style.cursor = 'crosshair';
}

function handleDoubleClick(e) {
    if (!gameState.running) return;
    toggleFlashlight();
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    gameState.canvas.dispatchEvent(mouseEvent);
    
    // Double tap detection
    const now = Date.now();
    if (now - gameState.input.lastTap < gameState.input.doubleTapDelay) {
        toggleFlashlight();
    }
    gameState.input.lastTap = now;
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

function handleKeyDown(e) {
    if (!gameState.running) return;
    
    switch (e.code) {
        case 'Space':
            e.preventDefault();
            toggleFlashlight();
            break;
        case 'KeyP':
            e.preventDefault();
            togglePause();
            break;
    }
}

function toggleFlashlight() {
    gameState.flashlight.on = !gameState.flashlight.on;
    soundSystem.play('flashlight');
    console.log('🔦 Flashlight:', gameState.flashlight.on ? 'ON' : 'OFF');
}

function togglePause() {
    gameState.paused = !gameState.paused;
    console.log('⏸️ Game:', gameState.paused ? 'PAUSED' : 'RESUMED');
}

// === GAME LOGIC ===
function startGame() {
    console.log('🎮 Starting new game...');
    
    // Reset game state
    gameState.running = true;
    gameState.paused = false;
    gameState.level = 1;
    gameState.difficulty = 1;
    gameState.totalEnemiesSpawned = 0;
    gameState.startTime = Date.now();
    
    // Reset player
    gameState.player = {
        x: gameState.canvas.width / 2,
        y: gameState.canvas.height / 2,
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
    
    // Reset timers
    gameState.lastEnemySpawn = 0;
    gameState.lastPowerupSpawn = 0;
    gameState.lastLevelUpdate = 0;
    
    // Reset camera
    gameState.camera = { shake: 0, intensity: 0 };
    
    // Show game UI
    hideAllScreens();
    showGameUI();
    
    // Enable canvas
    gameState.canvas.classList.add('active');
    gameState.canvas.style.pointerEvents = 'auto';
    gameState.canvas.focus();
    
    // Start game loop
    if (!gameState.gameLoopId) {
        gameState.gameLoopId = requestAnimationFrame(gameLoop);
    }
    
    console.log('✅ Game started successfully!');
}

function gameLoop() {
    if (!gameState.running) return;
    
    if (!gameState.paused) {
        updateGame();
    }
    
    render();
    
    gameState.gameLoopId = requestAnimationFrame(gameLoop);
}

function updateGame() {
    const currentTime = Date.now();
    
    // Update player effects
    updatePlayerEffects();
    
    // Update flashlight
    updateFlashlight();
    
    // Update enemies
    gameState.enemies = gameState.enemies.filter(enemy => enemy.update());
    
    // Update powerups
    gameState.powerups = gameState.powerups.filter(powerup => powerup.update());
    
    // Spawn entities
    spawnEntities(currentTime);
    
    // Update level progression
    updateLevelProgression();
    
    // Update camera effects
    updateCameraEffects();
    
    // Check game over
    if (gameState.player.health <= 0) {
        endGame();
        return;
    }
    
    // Update UI
    updateUI();
}

function updatePlayerEffects() {
    // Update shield time
    if (gameState.player.shieldTime > 0) {
        gameState.player.shieldTime -= 16;
    }
    
    // Update speed boost
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

function spawnEntities(currentTime) {
    // Spawn enemies
    if (currentTime - gameState.lastEnemySpawn > gameState.spawnRate / gameState.difficulty) {
        spawnEnemy();
        gameState.lastEnemySpawn = currentTime;
    }
    
    // Spawn powerups
    if (currentTime - gameState.lastPowerupSpawn > gameState.powerupSpawnRate) {
        spawnPowerup();
        gameState.lastPowerupSpawn = currentTime;
    }
}

function spawnEnemy() {
    const canvas = gameState.canvas;
    const margin = 50;
    let x, y;
    
    // Spawn at random edge
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
        case 0: // Top
            x = Math.random() * canvas.width;
            y = -margin;
            break;
        case 1: // Right
            x = canvas.width + margin;
            y = Math.random() * canvas.height;
            break;
        case 2: // Bottom
            x = Math.random() * canvas.width;
            y = canvas.height + margin;
            break;
        case 3: // Left
            x = -margin;
            y = Math.random() * canvas.height;
            break;
    }
    
    const type = Math.random() < 0.3 ? 'big' : 'small';
    const enemy = new Enemy(x, y, type);
    gameState.enemies.push(enemy);
    gameState.stats.enemiesEncountered++;
    gameState.totalEnemiesSpawned++;
    
    console.log(`👾 Enemy spawned: ${type} at (${Math.round(x)}, ${Math.round(y)})`);
}

function spawnPowerup() {
    const canvas = gameState.canvas;
    const margin = 100;
    
    const x = margin + Math.random() * (canvas.width - margin * 2);
    const y = margin + Math.random() * (canvas.height - margin * 2);
    
    const types = ['health', 'shield', 'speed'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const powerup = new Powerup(x, y, type);
    gameState.powerups.push(powerup);
    
    console.log(`⚡ Powerup spawned: ${type} at (${Math.round(x)}, ${Math.round(y)})`);
}

function updateLevelProgression() {
    const survivalTime = getCurrentSurvivalTime();
    const newLevel = Math.floor(survivalTime / 30) + 1;
    
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameState.stats.highestLevel = Math.max(gameState.stats.highestLevel, newLevel);
        gameState.difficulty = 1 + (gameState.level - 1) * 0.15;
        
        soundSystem.play('levelup');
        showLevelUpEffect();
        
        if (survivalTime > 0 && survivalTime % 60 === 0) {
            showTimeMilestone(survivalTime);
        }
        
        console.log(`🎊 Level up! Now level ${gameState.level} (Survival: ${formatTime(survivalTime)})`);
    }
}

function updateCameraEffects() {
    if (gameState.camera.shake > 0) {
        gameState.camera.shake *= 0.9;
        if (gameState.camera.shake < 0.1) {
            gameState.camera.shake = 0;
        }
    }
}

function endGame() {
    console.log('🎮 Ending game...');
    
    gameState.running = false;
    
    if (gameState.gameLoopId) {
        cancelAnimationFrame(gameState.gameLoopId);
        gameState.gameLoopId = null;
    }
    
    if (gameState.canvas) {
        gameState.canvas.classList.remove('active');
        gameState.canvas.style.pointerEvents = 'none';
    }
    
    const survivalTime = getCurrentSurvivalTime();
    gameState.stats.longestSurvival = Math.max(gameState.stats.longestSurvival, survivalTime);
    
    // Save high score
    saveHighScore(survivalTime, gameState.level);
    
    // Update game over screen
    try {
        const finalTimeEl = document.getElementById('finalTime');
        const finalLevelEl = document.getElementById('finalLevel');
        
        if (finalTimeEl) finalTimeEl.textContent = formatTime(survivalTime);
        if (finalLevelEl) finalLevelEl.textContent = gameState.level;
    } catch (error) {
        console.error('Error updating final stats:', error);
    }
    
    // Hide game UI and show game over screen
    hideGameUI();
    showScreen('gameOver');
    
    console.log('🎮 Game Over! Survival time:', formatTime(survivalTime));
}

// === RENDERING ===
function render() {
    if (!gameState.ctx || !gameState.canvas) return;
    
    const ctx = gameState.ctx;
    const canvas = gameState.canvas;
    
    // Apply camera shake
    ctx.save();
    if (gameState.camera.shake > 0) {
        const shakeX = (Math.random() - 0.5) * gameState.camera.shake;
        const shakeY = (Math.random() - 0.5) * gameState.camera.shake;
        ctx.translate(shakeX, shakeY);
    }
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Render enemies
    gameState.enemies.forEach(enemy => enemy.render(ctx));
    
    // Render powerups
    gameState.powerups.forEach(powerup => powerup.render(ctx));
    
    // Render player
    renderPlayer(ctx);
    
    // Render flashlight effect
    if (gameState.flashlight.intensity > 0) {
        renderFlashlight(ctx);
    }
    
    // Render UI overlays
    renderUIOverlays(ctx);
    
    ctx.restore();
}

function renderPlayer(ctx) {
    const player = gameState.player;
    
    ctx.save();
    
    // Invulnerability effect
    if (gameState.player.invulnerabilityTime > 0) {
        ctx.globalAlpha = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
    }
    
    // Shield effect
    if (gameState.player.shieldTime > 0) {
        ctx.strokeStyle = '#4444ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.size + 8, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Player
    ctx.fillStyle = '#4af';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Player border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Speed boost effect
    if (gameState.player.speedBoostTime > 0) {
        ctx.strokeStyle = '#ffff44';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.size + 5 + i * 3, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    ctx.restore();
}

function renderFlashlight(ctx) {
    const player = gameState.player;
    const intensity = gameState.flashlight.intensity;
    
    const gradient = ctx.createRadialGradient(
        player.x, player.y, 0,
        player.x, player.y, gameState.flashlight.radius * intensity
    );
    
    gradient.addColorStop(0, `rgba(255, 255, 200, ${0.3 * intensity})`);
    gradient.addColorStop(0.5, `rgba(255, 255, 200, ${0.1 * intensity})`);
    gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
    
    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    ctx.restore();
}

function renderUIOverlays(ctx) {
    // Performance info (debug)
    if (window.location.search.includes('debug')) {
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.fillText(`Enemies: ${gameState.enemies.length}`, 10, 20);
        ctx.fillText(`Powerups: ${gameState.powerups.length}`, 10, 35);
        ctx.fillText(`FPS: ${gameState.performance.currentFPS}`, 10, 50);
    }
}

// === EFFECTS ===
function showLevelUpEffect() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(45deg, #4af, #6cf);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 9999;
        animation: slideDown 2s ease-out;
        box-shadow: 0 4px 20px rgba(68, 170, 255, 0.4);
    `;
    notification.textContent = `🎊 LEVEL ${gameState.level}! 🎊`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 2000);
}

function showTimeMilestone(survivalTimeSeconds) {
    const minutes = Math.floor(survivalTimeSeconds / 60);
    if (minutes === 0) return;
    
    const notification = document.createElement('div');
    notification.className = 'time-milestone';
    
    let text, emoji;
    if (minutes === 1) {
        text = '1 MINUTE SURVIVED!';
        emoji = '🎯';
    } else if (minutes === 2) {
        text = '2 MINUTES! IMPRESSIVE!';
        emoji = '🔥';
    } else if (minutes === 3) {
        text = '3 MINUTES! AMAZING!';
        emoji = '⭐';
    } else if (minutes === 5) {
        text = '5 MINUTES! LEGENDARY!';
        emoji = '👑';
    } else if (minutes >= 10) {
        text = `${minutes} MINUTES! GODLIKE!`;
        emoji = '🚀';
    } else {
        text = `${minutes} MINUTES SURVIVED!`;
        emoji = '🏆';
    }
    
    notification.innerHTML = `
        <h2 style="margin: 0 0 8px 0; font-size: 24px;">${emoji} ${text} ${emoji}</h2>
        <p style="margin: 0; font-size: 14px; opacity: 0.9;">Keep going! You're doing great!</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #ffdddd;">Level: ${gameState.level}</p>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 2500);
}

// === HIGH SCORES ===
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
        highScores = highScores.slice(0, 10);
        
        localStorage.setItem(storageKey, JSON.stringify(highScores));
        
        if (highScores[0].score === survivalTime) {
            showNewHighScoreEffect(survivalTime);
        }
        
        console.log('💾 High score saved:', formatTime(survivalTime));
    } catch (error) {
        console.error('Error saving high score:', error);
    }
}

function showNewHighScoreEffect(survivalTimeSeconds) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(45deg, #ffaa44, #ff6644);
        color: white;
        padding: 25px 35px;
        border-radius: 15px;
        font-weight: bold;
        z-index: 9000;
        text-align: center;
        box-shadow: 0 8px 32px rgba(255, 170, 68, 0.6);
        animation: newHighScore 3s ease-out;
    `;
    notification.innerHTML = `
        <h3 style="margin: 0 0 10px 0;">🏆 NEW BEST TIME! 🏆</h3>
        <p style="margin: 0; font-size: 20px;">${formatTime(survivalTimeSeconds)}</p>
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
        cancelAnimationFrame(gameState.gameLoopId);
        gameState.gameLoopId = null;
    }
    hideAllScreens();
    hideGameUI();
    showScreen('startScreen');
}

function showHighScores() {
    console.log('🏆 Showing high scores...');
    // Placeholder - implement modal
    alert('High scores feature coming soon!');
}

function showHelp() {
    console.log('❓ Showing help...');
    // Placeholder - implement modal
    alert('Help feature coming soon!');
}

function showShareModal() {
    console.log('📤 Showing share modal...');
    // Placeholder - implement modal
    alert('Share feature coming soon!');
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 House Head Chase - Loading...');
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            0% { transform: translateX(-50%) translateY(-100px); opacity: 0; }
            20% { transform: translateX(-50%) translateY(0); opacity: 1; }
            80% { transform: translateX(-50%) translateY(0); opacity: 1; }
            100% { transform: translateX(-50%) translateY(-20px); opacity: 0; }
        }
        
        @keyframes newHighScore {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            20% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
            80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Initialize game
    if (initializeGame()) {
        console.log('✅ House Head Chase ready to play!');
    } else {
        console.error('❌ Failed to initialize game');
    }
});

// === GLOBAL EXPORTS ===
window.startGame = startGame;
window.restartGame = restartGame;
window.goToStartScreen = goToStartScreen;
window.showHighScores = showHighScores;
window.showHelp = showHelp;
window.showShareModal = showShareModal;
window.soundSystem = soundSystem;
