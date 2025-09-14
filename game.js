// House Head Chase - WORKING Game Logic
console.log('🏠 House Head Chase - Loading WORKING VERSION...');

// === GLOBAL GAME STATE ===
const gameState = {
    running: false,
    canvas: null,
    ctx: null,
    player: {
        x: 400,
        y: 300,
        size: 15,
        health: 100,
        maxHealth: 100,
        speed: 3,
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
        shieldTime: 0
    },
    enemies: [],
    powerups: [],
    activePowerups: [],
    flashlight: {
        on: false,
        intensity: 0,
        radius: 200
    },
    score: 0,
    level: 1,
    startTime: 0,
    lastEnemySpawn: 0,
    lastPowerupSpawn: 0,
    spawnRate: 3000,
    input: {
        lastTap: 0,
        doubleTapDelay: 300
    }
};

// === SOUND SYSTEM ===
class SoundSystem {
    constructor() {
        this.context = null;
        this.enabled = true;
        this.init();
    }

    async init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Audio initialized');
        } catch (e) {
            console.log('❌ Audio not supported');
            this.enabled = false;
        }
    }

    play(type) {
        if (!this.enabled || !this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        let frequency = 220;
        let duration = 0.1;

        switch (type) {
            case 'spawn':
                frequency = 180;
                duration = 0.3;
                break;
            case 'damage':
                frequency = 120;
                duration = 0.2;
                break;
            case 'flashlight':
                frequency = 300;
                duration = 0.1;
                break;
            case 'powerup':
                frequency = 440;
                duration = 0.3;
                break;
        }

        oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
        gainNode.gain.setValueAtTime(0.3, this.context.currentTime);

        oscillator.start();
        oscillator.stop(this.context.currentTime + duration);
    }

    toggle() {
        this.enabled = !this.enabled;
        const btn = document.getElementById('audioToggle');
        if (btn) {
            btn.textContent = this.enabled ? '🔊' : '🔇';
        }
    }
}

const soundSystem = new SoundSystem();

// === ENEMY CLASS ===
class Enemy {
    constructor(x, y, size = 25) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = size > 30 ? 0.8 : 1.2;
        this.damage = size > 30 ? 25 : 15;
        this.color = size > 30 ? '#3a2a1a' : '#4a3a2a';
        this.state = 'spawning';
        this.spawnTime = Date.now();
        this.lastDamageTime = 0;
        this.isVisible = true; // Always visible for now
        this.windowGlow = 0.5 + Math.random() * 0.5;
        
        console.log(`🏠 Enemy spawned at (${Math.floor(x)}, ${Math.floor(y)}), size: ${size}`);
    }

    update() {
        const currentTime = Date.now();
        
        // Spawning phase
        if (this.state === 'spawning' && currentTime - this.spawnTime > 1000) {
            this.state = 'dormant';
            soundSystem.play('spawn');
        }
        
        // Activation phase
        if (this.state === 'dormant' && currentTime - this.spawnTime > 2500) {
            this.state = 'active';
            console.log(`🦵 Enemy activated! Now hunting...`);
        }

        // Movement for active enemies
        if (this.state === 'active') {
            this.huntPlayer();
        }

        // Window glow animation
        this.windowGlow = 0.5 + Math.sin(currentTime * 0.003) * 0.3;

        return true;
    }

    huntPlayer() {
        const dx = gameState.player.x - this.x;
        const dy = gameState.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 20) {
            const moveX = (dx / distance) * this.speed;
            const moveY = (dy / distance) * this.speed;
            
            this.x += moveX;
            this.y += moveY;

            // Keep in bounds
            this.x = Math.max(this.size, Math.min(gameState.canvas.width - this.size, this.x));
            this.y = Math.max(this.size + 80, Math.min(gameState.canvas.height - this.size, this.y));
        }

        // Check collision with player
        if (distance < this.size + gameState.player.size - 5 && gameState.player.shieldTime <= 0) {
            this.damagePlayer();
        }
    }

    damagePlayer() {
        const currentTime = Date.now();
        if (currentTime - this.lastDamageTime > 1000) {
            gameState.player.health -= this.damage;
            this.lastDamageTime = currentTime;
            soundSystem.play('damage');
            console.log(`💔 Player took ${this.damage} damage`);
        }
    }

    draw() {
        const ctx = gameState.ctx;
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.state === 'spawning') {
            this.drawSpawning();
        } else {
            this.drawHouse();
        }

        ctx.restore();
    }

    drawSpawning() {
        const ctx = gameState.ctx;
        const progress = Math.min((Date.now() - this.spawnTime) / 1000, 1);
        const currentSize = this.size * progress;

        ctx.fillStyle = this.color;
        ctx.globalAlpha = progress;
        ctx.fillRect(-currentSize/2, -currentSize/2, currentSize, currentSize * 0.8);
        ctx.globalAlpha = 1;
    }

    drawHouse() {
        const ctx = gameState.ctx;
        const size = this.size;

        // House body
        ctx.fillStyle = this.color;
        ctx.fillRect(-size/2, -size/2, size, size * 0.8);

        // Roof
        ctx.fillStyle = '#2a1a0a';
        ctx.beginPath();
        ctx.moveTo(-size/2 - 4, -size/2);
        ctx.lineTo(0, -size);
        ctx.lineTo(size/2 + 4, -size/2);
        ctx.closePath();
        ctx.fill();

        // Glowing windows (eyes)
        const eyeSize = size / 8;
        ctx.fillStyle = `rgba(255, 255, 136, ${this.windowGlow})`;
        ctx.fillRect(-size/3, -size/4, eyeSize, eyeSize);
        ctx.fillRect(size/6, -size/4, eyeSize, eyeSize);

        // Door (mouth)
        ctx.fillStyle = '#000';
        const doorWidth = size/4;
        const doorHeight = size/4;
        ctx.fillRect(-doorWidth/2, size/6, doorWidth, doorHeight);
    }
}

// === POWERUP CLASS ===
class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'health', 'shield', 'speed'
        this.size = 15;
        this.collected = false;
        this.spawnTime = Date.now();
        this.despawnTime = this.spawnTime + 15000;
        
        console.log(`⚡ Powerup spawned: ${type} at (${Math.floor(x)}, ${Math.floor(y)})`);
    }

    update() {
        if (Date.now() > this.despawnTime) {
            return false;
        }

        // Check collision with player
        const dx = this.x - gameState.player.x;
        const dy = this.y - gameState.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.size + gameState.player.size - 5) {
            this.collect();
            return false;
        }

        return true;
    }

    collect() {
        if (this.collected) return;
        this.collected = true;

        switch (this.type) {
            case 'health':
                gameState.player.health = Math.min(gameState.player.maxHealth, 
                    gameState.player.health + 30);
                console.log(`💚 Health restored: +30`);
                break;
            case 'shield':
                gameState.player.shieldTime = 5000;
                gameState.activePowerups.push({
                    type: 'SHIELD',
                    timeLeft: 5000
                });
                console.log(`🛡️ Shield activated for 5s`);
                break;
        }

        soundSystem.play('powerup');
    }

    draw() {
        if (this.collected) return;

        const ctx = gameState.ctx;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Pulsing effect
        const pulse = 0.8 + Math.sin(Date.now() * 0.008) * 0.2;
        ctx.scale(pulse, pulse);

        // Color based on type
        let color = '#44ff44';
        if (this.type === 'shield') color = '#4488ff';
        if (this.type === 'speed') color = '#ffaa44';

        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Inner bright core
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// === DRAWING FUNCTIONS ===
function drawPlayer() {
    const ctx = gameState.ctx;
    const player = gameState.player;

    ctx.save();
    ctx.translate(player.x, player.y);

    // Shield effect
    if (player.shieldTime > 0) {
        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, player.size + 8, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Player body - bright blue dot
    ctx.fillStyle = '#4488ff';
    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, 0, player.size, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#88bbff';
    ctx.beginPath();
    ctx.arc(0, 0, player.size * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Center dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, player.size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawFlashlight() {
    if (!gameState.flashlight.on || gameState.flashlight.intensity <= 0) return;

    const ctx = gameState.ctx;
    const player = gameState.player;
    const intensity = gameState.flashlight.intensity;

    // Create radial gradient for flashlight
    const gradient = ctx.createRadialGradient(
        player.x, player.y, 0,
        player.x, player.y, gameState.flashlight.radius
    );

    gradient.addColorStop(0, `rgba(255, 255, 200, ${intensity * 0.6})`);
    gradient.addColorStop(0.3, `rgba(255, 255, 150, ${intensity * 0.4})`);
    gradient.addColorStop(0.7, `rgba(255, 255, 100, ${intensity * 0.2})`);
    gradient.addColorStop(1, 'rgba(255, 255, 50, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
}

function drawBackground() {
    const ctx = gameState.ctx;
    const canvas = gameState.canvas;

    // Dark gradient background
    const gradient = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)
    );
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// === GAME SYSTEMS ===
function spawnEnemy() {
    const currentTime = Date.now();
    if (currentTime - gameState.lastEnemySpawn < gameState.spawnRate) return;

    const enemySize = Math.random() < 0.7 ? 25 : 40;
    let x, y;
    let attempts = 0;
    let distanceFromPlayer = 0;

    do {
        x = 50 + Math.random() * (gameState.canvas.width - 100);
        y = 100 + Math.random() * (gameState.canvas.height - 180);
        distanceFromPlayer = Math.sqrt(
            Math.pow(x - gameState.player.x, 2) + Math.pow(y - gameState.player.y, 2)
        );
        attempts++;
        if (attempts > 10) break;
    } while (distanceFromPlayer < 150);

    const enemy = new Enemy(x, y, enemySize);
    gameState.enemies.push(enemy);
    gameState.lastEnemySpawn = currentTime;

    console.log(`👻 Enemy spawned at (${Math.floor(x)}, ${Math.floor(y)}). Total: ${gameState.enemies.length}`);
}

function spawnPowerup() {
    const currentTime = Date.now();
    if (currentTime - gameState.lastPowerupSpawn < 15000) return;

    const types = ['health', 'shield'];
    const powerupType = types[Math.floor(Math.random() * types.length)];

    let x, y;
    let attempts = 0;
    let playerDistance = 0;

    do {
        x = 80 + Math.random() * (gameState.canvas.width - 160);
        y = 120 + Math.random() * (gameState.canvas.height - 200);

        playerDistance = Math.sqrt(
            Math.pow(x - gameState.player.x, 2) + Math.pow(y - gameState.player.y, 2)
        );

        attempts++;
        if (attempts > 20) break;
    } while (playerDistance < 120 && attempts < 20);

    const powerup = new Powerup(x, y, powerupType);
    gameState.powerups.push(powerup);
    gameState.lastPowerupSpawn = currentTime;

    console.log(`⚡ Powerup spawned: ${powerupType} at (${Math.floor(x)}, ${Math.floor(y)})`);
}

function updateGame() {
    if (!gameState.running) return;

    const currentTime = Date.now();

    // Update flashlight
    if (gameState.flashlight.on) {
        gameState.flashlight.intensity = Math.min(1, gameState.flashlight.intensity + 0.1);
    } else {
        gameState.flashlight.intensity = Math.max(0, gameState.flashlight.intensity - 0.1);
    }

    // Update shield time
    if (gameState.player.shieldTime > 0) {
        gameState.player.shieldTime -= 16;
    }

    // Update active powerups
    gameState.activePowerups = gameState.activePowerups.filter(powerup => {
        powerup.timeLeft -= 16;
        return powerup.timeLeft > 0;
    });

    // Update enemies
    gameState.enemies = gameState.enemies.filter(enemy => enemy.update());

    // Update powerups
    gameState.powerups = gameState.powerups.filter(powerup => powerup.update());

    // Spawn enemies
    spawnEnemy();

    // Spawn powerups
    spawnPowerup();

    // Update score
    gameState.score = Math.floor((currentTime - gameState.startTime) / 1000);

    // Level up
    const newLevel = Math.floor(gameState.score / 30) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameState.spawnRate = Math.max(1000, 3000 - (gameState.level - 1) * 200);
        console.log(`🎊 Level up! Now level ${gameState.level}`);
    }

    // Check game over
    if (gameState.player.health <= 0) {
        endGame();
    }

    updateUI();
}

function drawGame() {
    if (!gameState.running || !gameState.ctx) return;

    const ctx = gameState.ctx;

    // Clear canvas
    ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);

    // Draw background
    drawBackground();

    // Draw flashlight
    drawFlashlight();

    // Draw powerups
    gameState.powerups.forEach(powerup => powerup.draw());

    // Draw enemies
    gameState.enemies.forEach(enemy => enemy.draw());

    // Draw player
    drawPlayer();
}

function gameLoop() {
    updateGame();
    drawGame();

    if (gameState.running) {
        requestAnimationFrame(gameLoop);
    }
}

// === INPUT HANDLING ===
function setupInputHandlers() {
    const canvas = gameState.canvas;
    if (!canvas) {
        console.error('❌ Cannot setup input - canvas not found!');
        return;
    }

    console.log('🎮 Setting up input handlers...');

    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Mouse events
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('dblclick', handleDoubleClick);

    // Prevent context menu
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    console.log('✅ Input handlers attached to canvas');
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = gameState.canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (gameState.canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (gameState.canvas.height / rect.height);

    // Check if touching the player
    const dx = x - gameState.player.x;
    const dy = y - gameState.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < gameState.player.size + 20) {
        gameState.player.isDragging = true;
        gameState.player.dragOffset = { x: dx, y: dy };
        console.log('👆 Player grabbed');
    }

    // Double tap detection
    const currentTime = Date.now();
    if (currentTime - gameState.input.lastTap < gameState.input.doubleTapDelay) {
        toggleFlashlight();
    }
    gameState.input.lastTap = currentTime;
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!gameState.player.isDragging) return;

    const touch = e.touches[0];
    const rect = gameState.canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (gameState.canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (gameState.canvas.height / rect.height);

    // Move player
    gameState.player.x = x - gameState.player.dragOffset.x;
    gameState.player.y = y - gameState.player.dragOffset.y;

    constrainPlayer();
}

function handleTouchEnd(e) {
    e.preventDefault();
    gameState.player.isDragging = false;
}

function handleMouseDown(e) {
    const rect = gameState.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (gameState.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (gameState.canvas.height / rect.height);

    // Check if clicking on player
    const dx = x - gameState.player.x;
    const dy = y - gameState.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < gameState.player.size + 20) {
        gameState.player.isDragging = true;
        gameState.player.dragOffset = { x: dx, y: dy };
        console.log('🖱️ Player grabbed with mouse');
    }
}

function handleMouseMove(e) {
    const rect = gameState.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (gameState.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (gameState.canvas.height / rect.height);

    if (gameState.player.isDragging) {
        gameState.player.x = x - gameState.player.dragOffset.x;
        gameState.player.y = y - gameState.player.dragOffset.y;
        constrainPlayer();
    }
}

function handleMouseUp(e) {
    gameState.player.isDragging = false;
}

function handleDoubleClick(e) {
    e.preventDefault();
    toggleFlashlight();
}

function constrainPlayer() {
    const player = gameState.player;
    const canvas = gameState.canvas;

    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(player.size + 80, Math.min(canvas.height - player.size - 80, player.y));
}

function toggleFlashlight() {
    gameState.flashlight.on = !gameState.flashlight.on;
    soundSystem.play('flashlight');

    const indicator = document.getElementById('flashlightIndicator');
    if (indicator) {
        if (gameState.flashlight.on) {
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }

    console.log(`🔦 Flashlight ${gameState.flashlight.on ? 'ON' : 'OFF'}`);
}

// === UI FUNCTIONS ===
function updateUI() {
    const health = Math.max(0, Math.floor(gameState.player.health));
    const healthEl = document.getElementById('health');
    const healthFillEl = document.getElementById('healthFill');
    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');

    if (healthEl) healthEl.textContent = health;
    if (healthFillEl) healthFillEl.style.width = (health / gameState.player.maxHealth * 100) + '%';
    if (scoreEl) scoreEl.textContent = gameState.score;
    if (levelEl) levelEl.textContent = gameState.level;

    updatePowerupIndicators();
}

function updatePowerupIndicators() {
    const container = document.getElementById('powerupIndicators');
    if (!container) return;

    container.innerHTML = '';

    gameState.activePowerups.forEach(powerup => {
        const indicator = document.createElement('div');
        indicator.className = `powerup-indicator ${powerup.type.toLowerCase()}`;

        const timeLeft = Math.ceil(powerup.timeLeft / 1000);

        indicator.innerHTML = `
            <span>🛡️</span>
            <span>${timeLeft}s</span>
        `;

        container.appendChild(indicator);
    });
}

// === MAIN GAME FUNCTIONS ===
function startGame() {
    console.log('🎮 STARTING GAME - WORKING VERSION!');

    // Hide all screens
    hideAllModals();
    
    // Get canvas
    gameState.canvas = document.getElementById('gameCanvas');
    if (!gameState.canvas) {
        console.error('❌ Canvas not found!');
        alert('Canvas not found! Check your HTML.');
        return;
    }
    
    gameState.ctx = gameState.canvas.getContext('2d');
    if (!gameState.ctx) {
        console.error('❌ Could not get canvas context!');
        alert('Could not get canvas context!');
        return;
    }

    // Resize canvas
    resizeCanvas();

    // FORCE HIDE START SCREEN
    const startScreen = document.getElementById('startScreen');
    if (startScreen) {
        startScreen.style.display = 'none';
        startScreen.classList.add('hidden');
        console.log('✅ Start screen hidden');
    }

    // FORCE SHOW HUD
    const hud = document.getElementById('hud');
    if (hud) {
        hud.style.display = 'flex';
        hud.classList.remove('hidden');
        console.log('✅ HUD shown');
    }

    // Reset game state
    gameState.running = true;
    gameState.startTime = Date.now();

    // Reset player to center of canvas
    gameState.player = {
        x: gameState.canvas.width / 2,
        y: gameState.canvas.height / 2,
        size: 15,
        health: 100,
        maxHealth: 100,
        speed: 3,
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
        shieldTime: 0
    };

    // Clear arrays
    gameState.enemies = [];
    gameState.powerups = [];
    gameState.activePowerups = [];
    gameState.score = 0;
    gameState.level = 1;
    gameState.lastEnemySpawn = 0;
    gameState.lastPowerupSpawn = 0;
    gameState.flashlight.on = false;
    gameState.flashlight.intensity = 0;

    console.log(`🔵 Player positioned at (${gameState.player.x}, ${gameState.player.y})`);
    console.log(`📏 Canvas size: ${gameState.canvas.width}x${gameState.canvas.height}`);

    // Setup input handlers
    setupInputHandlers();

    // Show controls hint
    setTimeout(() => {
        const hint = document.getElementById('controlsHint');
        if (hint) {
            hint.classList.remove('hidden');
            setTimeout(() => hint.classList.add('hidden'), 4000);
        }
    }, 1000);

    // Start game loop
    console.log('🚀 Starting game loop...');
    gameLoop();

    console.log('🎮 GAME STARTED SUCCESSFULLY!');
}

function endGame() {
    gameState.running = false;

    const survivalTime = Math.floor((Date.now() - gameState.startTime) / 1000);

    // Update final stats
    document.getElementById('finalScore').textContent = survivalTime;
    document.getElementById('finalTime').textContent = survivalTime;
    document.getElementById('finalLevel').textContent = gameState.level;

    // Hide HUD and show game over
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('gameOver').classList.remove('hidden');

    console.log('🎮 Game Over! Survival time:', survivalTime, 'seconds');
}

function restartGame() {
    console.log('🔄 Restarting game...');
    startGame();
}

function showStartScreen() {
    console.log('🏠 Showing start screen...');
    hideAllModals();
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('startScreen').classList.remove('hidden');
    gameState.running = false;
}

function showHighScores() {
    console.log('🏆 Showing high scores...');
    hideAllModals();
    document.getElementById('highScoresModal').classList.remove('hidden');
}

function closeHighScores() {
    console.log('🚫 Closing high scores...');
    document.getElementById('highScoresModal').classList.add('hidden');
}

function showHelp() {
    console.log('❓ Showing help...');
    hideAllModals();
    document.getElementById('helpModal').classList.remove('hidden');
}

function closeHelp() {
    console.log('🚫 Closing help...');
    document.getElementById('helpModal').classList.add('hidden');
}

function hideAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.classList.add('hidden');
    });
    console.log('🚫 All modals hidden');
}

// === CANVAS MANAGEMENT ===
function resizeCanvas() {
    const canvas = gameState.canvas;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    console.log(`📏 Canvas resized to ${canvas.width}x${canvas.height}`);

    // Reposition player if game is running
    if (gameState.running && gameState.player) {
        gameState.player.x = Math.min(gameState.player.x, canvas.width - gameState.player.size);
        gameState.player.y = Math.min(gameState.player.y, canvas.height - gameState.player.size - 100);
        constrainPlayer();
    }
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏠 DOM LOADED - Setting up game...');

    // Pre-initialize canvas
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        console.log('🎯 Canvas pre-initialized');
    } else {
        console.error('❌ Canvas not found in DOM!');
    }

    // Setup button event listeners
    console.log('🔧 Setting up button listeners...');
    
    const buttons = {
        'startGameBtn': startGame,
        'restartGameBtn': restartGame,
        'showStartScreenBtn': showStartScreen,
        'showHighScoresBtn': showHighScores,
        'showHelpBtn': showHelp,
        'closeHighScoresBtn': closeHighScores,
        'closeHighScoresFooterBtn': closeHighScores,
        'closeHelpBtn': closeHelp,
        'closeHelpFooterBtn': closeHelp,
        'audioToggle': () => soundSystem.toggle()
    };

    for (const [id, handler] of Object.entries(buttons)) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', handler);
            console.log(`✅ ${id} button attached`);
        } else {
            console.warn(`⚠️ Button ${id} not found`);
        }
    }

    // Window event handlers
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));

    // Hide controls hint initially
    const hint = document.getElementById('controlsHint');
    if (hint) hint.classList.add('hidden');

    // Ensure all modals are hidden
    hideAllModals();

    console.log('🎮 GAME READY TO PLAY!');
});

// Global function access for debugging
window.startGame = startGame;
window.gameState = gameState;

console.log('✅ Game script loaded successfully!');
