// House Head Survival - Main Game Logic
// Senior Game Designer, UI/UX Expert & Senior Engineer Implementation

console.log('🏠 House Head Survival - Loading...');

// Sound System
class SoundSystem {
    constructor() {
        this.context = null;
        this.enabled = true;
        this.sounds = new Map();
        this.init();
    }

    async init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Audio system initialized');
        } catch (e) {
            console.log('❌ Audio not supported');
            this.enabled = false;
        }
    }

    play(type, frequency = 220, duration = 0.1, volume = 0.3) {
        if (!this.enabled || !this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        switch (type) {
            case 'spawn':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(180, this.context.currentTime);
                gainNode.gain.setValueAtTime(volume, this.context.currentTime);
                duration = 0.3;
                break;
            case 'damage':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(120, this.context.currentTime);
                gainNode.gain.setValueAtTime(volume * 1.5, this.context.currentTime);
                duration = 0.2;
                break;
            case 'levelup':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(440, this.context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(880, this.context.currentTime + 0.5);
                gainNode.gain.setValueAtTime(volume, this.context.currentTime);
                duration = 0.5;
                break;
            case 'flashlight':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(300, this.context.currentTime);
                gainNode.gain.setValueAtTime(volume * 0.5, this.context.currentTime);
                duration = 0.1;
                break;
        }

        oscillator.start();
        oscillator.stop(this.context.currentTime + duration);
    }

    toggle() {
        this.enabled = !this.enabled;
        const btn = document.getElementById('audioToggle');
        btn.textContent = this.enabled ? '🔊' : '🔇';
        console.log(`🔊 Audio ${this.enabled ? 'enabled' : 'disabled'}`);
    }
}

// Game State
const gameState = {
    running: false,
    paused: false,
    canvas: null,
    ctx: null,
    player: {
        x: 0,
        y: 0,
        size: 15,
        health: 100,
        maxHealth: 100,
        speed: 3,
        isDragging: false,
        dragOffset: { x: 0, y: 0 }
    },
    enemies: [],
    flashlight: {
        on: false,
        intensity: 0,
        radius: 200,
        fadeSpeed: 0.1
    },
    score: 0,
    level: 1,
    startTime: 0,
    lastEnemySpawn: 0,
    lastScoreUpdate: 0,
    spawnRate: 3000,
    input: {
        lastTap: 0,
        doubleTapDelay: 300
    },
    camera: {
        shake: 0,
        intensity: 0
    },
    difficulty: 1,
    totalEnemiesSpawned: 0
};

// Enemy Types
const EnemyTypes = {
    SMALL: {
        name: 'Small House',
        size: 25,
        speed: 1.2,
        damage: 15,
        spawnWeight: 0.7,
        color: '#4a3a2a',
        activationTime: 2000
    },
    BIG: {
        name: 'Big House',
        size: 40,
        speed: 0.8,
        damage: 25,
        spawnWeight: 0.3,
        color: '#3a2a1a',
        activationTime: 3000
    }
};

// Enemy Class
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.config = EnemyTypes[type];
        this.size = this.config.size;
        this.speed = this.config.speed * (0.8 + Math.random() * 0.4);
        this.damage = this.config.damage;
        this.color = this.config.color;
        
        // Animation states
        this.state = 'spawning';
        this.spawnTime = Date.now();
        this.activationTime = this.config.activationTime + (Math.random() * 1000);
        this.legs = [];
        this.windowGlow = 0.5 + Math.random() * 0.5;
        this.lastDamageTime = 0;
        this.isVisible = false;
        
        // Initialize legs
        for (let i = 0; i < 6; i++) {
            this.legs.push({
                angle: (i / 6) * Math.PI * 2,
                length: this.size * 0.8,
                offset: Math.random() * Math.PI * 2,
                speed: 0.1 + Math.random() * 0.1
            });
        }
        
        console.log(`🏠 ${this.config.name} spawned at (${Math.floor(x)}, ${Math.floor(y)})`);
    }

    update() {
        const currentTime = Date.now();
        
        // Update state based on time
        if (this.state === 'spawning') {
            if (currentTime - this.spawnTime > 1000) {
                this.state = 'dormant';
                soundSystem.play('spawn', 180, 0.3, 0.2);
            }
        } else if (this.state === 'dormant') {
            if (currentTime - this.spawnTime > this.activationTime) {
                this.state = 'active';
                console.log(`🦵 ${this.config.name} grew legs! Now hunting...`);
            }
        }
        
        // Movement for active enemies
        if (this.state === 'active') {
            this.huntPlayer();
            this.updateLegs();
        }
        
        // Update visibility based on flashlight
        this.updateVisibility();
        
        // Window glow animation
        this.windowGlow = 0.5 + Math.sin(currentTime * 0.003 + this.x * 0.01) * 0.3;
        
        return true;
    }

    huntPlayer() {
        const dx = gameState.player.x - this.x;
        const dy = gameState.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 20) {
            const moveX = (dx / distance) * this.speed * gameState.difficulty;
            const moveY = (dy / distance) * this.speed * gameState.difficulty;
            
            this.x += moveX;
            this.y += moveY;
            
            // Keep in bounds
            this.x = Math.max(this.size, Math.min(gameState.canvas.width - this.size, this.x));
            this.y = Math.max(this.size + 80, Math.min(gameState.canvas.height - this.size, this.y));
        }
        
        // Check collision with player
        if (distance < this.size + gameState.player.size - 5) {
            this.damagePlayer();
        }
    }

    updateLegs() {
        this.legs.forEach(leg => {
            leg.offset += leg.speed;
        });
    }

    updateVisibility() {
        if (gameState.flashlight.on && gameState.flashlight.intensity > 0.3) {
            const dx = this.x - gameState.player.x;
            const dy = this.y - gameState.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.isVisible = distance < gameState.flashlight.radius;
        } else {
            const dx = this.x - gameState.player.x;
            const dy = this.y - gameState.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.isVisible = distance < 60;
        }
    }

    damagePlayer() {
        const currentTime = Date.now();
        if (currentTime - this.lastDamageTime > 1000) {
            gameState.player.health -= this.damage;
            this.lastDamageTime = currentTime;
            gameState.camera.shake = 10;
            gameState.camera.intensity = 8;
            soundSystem.play('damage');
            console.log(`💔 Player took ${this.damage} damage from ${this.config.name}`);
            
            showDamageIndicator(this.damage);
        }
    }

    draw() {
        if (!this.isVisible && this.state !== 'spawning') return;
        
        const ctx = gameState.ctx;
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.state === 'spawning') {
            this.drawSpawning();
        } else {
            this.drawHouse();
            if (this.state === 'active') {
                this.drawLegs();
            }
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
        
        // House shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-size/2 + 2, -size/2 + 2, size, size * 0.8);
        
        // House body gradient
        const gradient = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, this.type === 'BIG' ? '#2a1a0a' : '#3a2a1a');
        gradient.addColorStop(1, '#1a0a0a');
        ctx.fillStyle = gradient;
        ctx.fillRect(-size/2, -size/2, size, size * 0.8);
        
        // House outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(-size/2, -size/2, size, size * 0.8);
        
        // Roof
        const roofGradient = ctx.createLinearGradient(0, -size, 0, -size/2);
        roofGradient.addColorStop(0, '#2a1a0a');
        roofGradient.addColorStop(1, '#1a0a0a');
        ctx.fillStyle = roofGradient;
        ctx.beginPath();
        ctx.moveTo(-size/2 - 4, -size/2);
        ctx.lineTo(0, -size);
        ctx.lineTo(size/2 + 4, -size/2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Glowing windows (eyes)
        const glowIntensity = this.windowGlow;
        const eyeSize = size / (this.type === 'BIG' ? 6 : 8);
        
        ctx.shadowColor = '#ffff88';
        ctx.shadowBlur = 8;
        ctx.fillStyle = `rgba(255, 255, 136, ${glowIntensity})`;
        
        // Left eye
        ctx.fillRect(-size/3, -size/4, eyeSize, eyeSize);
        // Right eye
        ctx.fillRect(size/6, -size/4, eyeSize, eyeSize);
        
        ctx.shadowBlur = 0;
        
        // Eye outlines
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(-size/3, -size/4, eyeSize, eyeSize);
        ctx.strokeRect(size/6, -size/4, eyeSize, eyeSize);
        
        // Door (mouth)
        ctx.fillStyle = '#000';
        const doorWidth = this.type === 'BIG' ? size/3 : size/4;
        const doorHeight = size/4;
        ctx.fillRect(-doorWidth/2, size/6, doorWidth, doorHeight);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(-doorWidth/2, size/6, doorWidth, doorHeight);
        
        // Door handle
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(doorWidth/3, size/6 + doorHeight/2, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawLegs() {
        const ctx = gameState.ctx;
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = this.type === 'BIG' ? 5 : 3;
        ctx.lineCap = 'round';
        
        this.legs.forEach(leg => {
            const legX = Math.cos(leg.angle + leg.offset) * leg.length;
            const legY = Math.sin(leg.angle + leg.offset) * leg.length;
            
            const midX = legX * 0.6;
            const midY = legY * 0.6;
            
            ctx.beginPath();
            ctx.moveTo(0, this.size * 0.3);
            ctx.lineTo(midX, midY + this.size * 0.3);
            ctx.lineTo(legX, legY + this.size * 0.3);
            ctx.stroke();
            
            // Leg joint
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(midX, midY + this.size * 0.3, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Foot
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(legX, legY + this.size * 0.3, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

// Initialize sound system
const soundSystem = new SoundSystem();

// Player Drawing
function drawPlayer() {
    const ctx = gameState.ctx;
    const player = gameState.player;
    
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Player glow effect
    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur = 15;
    
    // Main body - bright blue dot
    ctx.fillStyle = '#4488ff';
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
    
    // Health indicator ring
    const healthPercent = player.health / player.maxHealth;
    if (healthPercent < 1) {
        ctx.strokeStyle = healthPercent > 0.5 ? '#44ff44' : healthPercent > 0.2 ? '#ffaa44' : '#ff4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, player.size + 5, -Math.PI/2, -Math.PI/2 + (healthPercent * Math.PI * 2));
        ctx.stroke();
    }
    
    ctx.restore();
}

// Flashlight System
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

// Environment Drawing
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
    
    // Subtle stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
        const x = (i * 23.7) % canvas.width;
        const y = (i * 37.3) % (canvas.height - 80);
        const brightness = Math.sin(Date.now() * 0.001 + i) * 0.5 + 0.5;
        ctx.globalAlpha = brightness * 0.3;
        ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;
    
    // Ground
    const groundGradient = ctx.createLinearGradient(0, canvas.height - 80, 0, canvas.height);
    groundGradient.addColorStop(0, '#1a2a1a');
    groundGradient.addColorStop(1, '#0a1a0a');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
}

// Game Systems
function spawnEnemy() {
    const currentTime = Date.now();
    if (currentTime - gameState.lastEnemySpawn < gameState.spawnRate) return;
    
    // Determine enemy type based on weights and level
    const rand = Math.random();
    const bigHouseChance = Math.min(0.3 + (gameState.level - 1) * 0.1, 0.6);
    const enemyType = rand < bigHouseChance ? 'BIG' : 'SMALL';
    
    // Random spawn position (away from player)
    let x, y;
    let attempts = 0;
    do {
        x = 50 + Math.random() * (gameState.canvas.width - 100);
        y = 100 + Math.random() * (gameState.canvas.height - 180);
        const distanceFromPlayer = Math.sqrt(
            Math.pow(x - gameState.player.x, 2) + Math.pow(y - gameState.player.y, 2)
        );
        attempts++;
        if (attempts > 10) break; // Prevent infinite loop
    } while (Math.sqrt(Math.pow(x - gameState.player.x, 2) + Math.pow(y - gameState.player.y, 2)) < 150);
    
    const enemy = new Enemy(x, y, enemyType);
    gameState.enemies.push(enemy);
    gameState.totalEnemiesSpawned++;
    gameState.lastEnemySpawn = currentTime;
    
    // Increase difficulty over time
    gameState.spawnRate = Math.max(1000, 3000 - (gameState.level - 1) * 200);
    
    console.log(`👻 Enemy spawned: ${enemyType}. Total: ${gameState.enemies.length}`);
}

function updateGame() {
    if (!gameState.running) return;
    
    const currentTime = Date.now();
    
    // Update flashlight intensity
    if (gameState.flashlight.on) {
        gameState.flashlight.intensity = Math.min(1, gameState.flashlight.intensity + gameState.flashlight.fadeSpeed);
    } else {
        gameState.flashlight.intensity = Math.max(0, gameState.flashlight.intensity - gameState.flashlight.fadeSpeed);
    }
    
    // Update enemies
    gameState.enemies = gameState.enemies.filter(enemy => enemy.update());
    
    // Spawn new enemies
    spawnEnemy();
    
    // Update score (1 point per second)
    if (currentTime - gameState.lastScoreUpdate > 1000) {
        gameState.score++;
        gameState.lastScoreUpdate = currentTime;
    }
    
    // Level up system
    const newLevel = Math.floor(gameState.score / 30) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameState.difficulty = 1 + (gameState.level - 1) * 0.2;
        soundSystem.play('levelup');
        showLevelUpEffect();
        console.log(`🎊 Level up! Now level ${gameState.level}`);
    }
    
    // Update camera shake
    if (gameState.camera.shake > 0) {
        gameState.camera.shake--;
        gameState.camera.intensity = Math.max(0, gameState.camera.intensity - 0.5);
    }
    
    // Check game over
    if (gameState.player.health <= 0) {
        endGame();
    }
    
    // Update UI
    updateUI();
}

function drawGame() {
    if (!gameState.running) return;
    
    const ctx = gameState.ctx;
    
    // Clear canvas
    ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    
    // Apply camera shake
    ctx.save();
    if (gameState.camera.shake > 0) {
        const shakeX = (Math.random() - 0.5) * gameState.camera.intensity;
        const shakeY = (Math.random() - 0.5) * gameState.camera.intensity;
        ctx.translate(shakeX, shakeY);
    }
    
    // Draw game world
    drawBackground();
    drawFlashlight();
    
    // Draw enemies
    gameState.enemies.forEach(enemy => enemy.draw());
    
    // Draw player
    drawPlayer();
    
    ctx.restore();
}

function gameLoop() {
    updateGame();
    drawGame();
    
    if (gameState.running) {
        requestAnimationFrame(gameLoop);
    }
}

// Input Handling
function setupInputHandlers() {
    const canvas = gameState.canvas;
    
    // Touch Events (Mobile)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Mouse Events (Desktop)
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('dblclick', handleDoubleClick);
    
    // Prevent context menu
    canvas.addEventListener('contextmenu', e => e.preventDefault());
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
    
    // Keep player in bounds
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
    
    // Update UI
    const indicator = document.getElementById('flashlightIndicator');
    if (gameState.flashlight.on) {
        indicator.classList.remove('hidden');
    } else {
        indicator.classList.add('hidden');
    }
    
    console.log(`🔦 Flashlight ${gameState.flashlight.on ? 'ON' : 'OFF'}`);
}

// UI Functions
function updateUI() {
    const health = Math.max(0, Math.floor(gameState.player.health));
    document.getElementById('health').textContent = health;
    document.getElementById('healthFill').style.width = (health / gameState.player.maxHealth * 100) + '%';
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('timer').textContent = Math.floor((Date.now() - gameState.startTime) / 1000);
    document.getElementById('level').textContent = gameState.level;
}

function showPowerupMessage(message) {
    // Add powerup message styling to CSS if not present
    if (!document.querySelector('style[data-powerup-message]')) {
        const style = document.createElement('style');
        style.setAttribute('data-powerup-message', 'true');
        style.textContent = `
            .powerup-message {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #44ff44;
                font-weight: bold;
                font-size: 20px;
                pointer-events: none;
                z-index: 1500;
                animation: powerupMessageFloat 1.5s ease-out forwards;
                font-family: 'Orbitron', monospace;
                text-shadow: 0 0 10px #44ff44;
                background: rgba(0, 0, 0, 0.8);
                padding: 8px 16px;
                border-radius: 20px;
                border: 2px solid #44ff44;
            }
            @keyframes powerupMessageFloat {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                20% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'powerup-message';
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (document.body.contains(messageDiv)) {
            document.body.removeChild(messageDiv);
        }
    }, 1500);
}

function updatePowerupIndicators() {
    const container = document.getElementById('powerupIndicators');
    if (!container) return;
    
    container.innerHTML = '';
    
    gameState.activePowerups.forEach(powerup => {
        const indicator = document.createElement('div');
        indicator.className = `powerup-indicator ${powerup.type.toLowerCase()}`;
        
        const timeLeft = Math.ceil(powerup.timeLeft / 1000);
        const config = PowerupTypes[powerup.type];
        
        indicator.innerHTML = `
            <span>${config.emoji}</span>
            <span>${timeLeft}s</span>
        `;
        
        container.appendChild(indicator);
    });
}

function showDamageIndicator(damage) {
    // Add damage indicator styling to CSS if not present
    if (!document.querySelector('style[data-damage-indicator]')) {
        const style = document.createElement('style');
        style.setAttribute('data-damage-indicator', 'true');
        style.textContent = `
            .damage-indicator {
                position: fixed;
                color: #ff4444;
                font-weight: bold;
                font-size: 18px;
                pointer-events: none;
                z-index: 1500;
                animation: damageFloat 0.8s ease-out forwards;
                font-family: 'Orbitron', monospace;
                text-shadow: 0 0 8px #ff4444;
            }
            @keyframes damageFloat {
                0% { transform: translateY(0); opacity: 1; }
                100% { transform: translateY(-40px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    const indicator = document.createElement('div');
    indicator.className = 'damage-indicator';
    indicator.textContent = `-${damage}`;
    
    // Convert canvas coordinates to screen coordinates
    const rect = gameState.canvas.getBoundingClientRect();
    indicator.style.left = (rect.left + (gameState.player.x * rect.width / gameState.canvas.width)) + 'px';
    indicator.style.top = (rect.top + (gameState.player.y * rect.height / gameState.canvas.height)) + 'px';
    
    document.body.appendChild(indicator);
    
    setTimeout(() => {
        if (document.body.contains(indicator)) {
            document.body.removeChild(indicator);
        }
    }, 800);
}

function showLevelUpEffect() {
    // Add level up styling to CSS if not present
    if (!document.querySelector('style[data-level-up]')) {
        const style = document.createElement('style');
        style.setAttribute('data-level-up', 'true');
        style.textContent = `
            .level-up-effect {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(45deg, rgba(255, 68, 68, 0.9), rgba(255, 136, 68, 0.9));
                color: white;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                font-family: 'Orbitron', monospace;
                font-weight: bold;
                z-index: 2500;
                animation: levelUpPulse 2s ease-out;
                backdrop-filter: blur(10px);
                border: 2px solid #ff4444;
            }
            @keyframes levelUpPulse {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    const levelDiv = document.createElement('div');
    levelDiv.className = 'level-up-effect';
    levelDiv.innerHTML = `
        <h2>🎊 LEVEL ${gameState.level}! 🎊</h2>
        <p>Difficulty Increased!</p>
    `;
    
    document.body.appendChild(levelDiv);
    
    setTimeout(() => {
        if (document.body.contains(levelDiv)) {
            document.body.removeChild(levelDiv);
        }
    }, 2000);
}

// High Score System
function getHighScores() {
    try {
        return JSON.parse(localStorage.getItem('houseHeadHighScores')) || [];
    } catch {
        return [];
    }
}

function saveHighScore(score, level, time) {
    const highScores = getHighScores();
    const newScore = {
        score: score,
        level: level,
        time: time,
        date: new Date().toLocaleDateString()
    };
    
    highScores.push(newScore);
    highScores.sort((a, b) => b.score - a.score);
    highScores.splice(10); // Keep top 10
    
    localStorage.setItem('houseHeadHighScores', JSON.stringify(highScores));
    console.log('💾 High score saved!', newScore);
}

function displayHighScores() {
    const highScores = getHighScores();
    const list = document.getElementById('highScoresList');
    
    if (highScores.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #ccc; padding: 20px;">No high scores yet!<br>Be the first to survive!</p>';
        return;
    }
    
    list.innerHTML = highScores.map((score, index) => 
        `<div class="high-score-item">
            <span class="high-score-rank">#${index + 1}</span>
            <span>${score.score}s (Lvl ${score.level})</span>
            <span class="high-score-date">${score.date}</span>
        </div>`
    ).join('');
}

// Social Sharing
function shareScore() {
    document.getElementById('shareScore').textContent = gameState.score;
    document.getElementById('shareModal').classList.remove('hidden');
}

function shareTwitter() {
    const text = `I just survived ${gameState.score} seconds in House Head Survival! 🏠💀 Can you beat my score?`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
}

function shareFacebook() {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
}

function copyScore() {
    const text = `I just survived ${gameState.score} seconds in House Head Survival! 🏠💀 Play at: ${window.location.href}`;
    navigator.clipboard.writeText(text).then(() => {
        alert('Score copied to clipboard! 📋');
    }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Score copied to clipboard! 📋');
    });
}

function closeShare() {
    document.getElementById('shareModal').classList.add('hidden');
}

// PWA Install
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt();
});

function showInstallPrompt() {
    const prompt = document.getElementById('installPrompt');
    if (prompt) {
        prompt.classList.remove('hidden');
    }
}

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('📱 App installed!');
            }
            deferredPrompt = null;
            dismissInstall();
        });
    }
}

function dismissInstall() {
    const prompt = document.getElementById('installPrompt');
    if (prompt) {
        prompt.classList.add('hidden');
    }
}

// Game Functions
function startGame() {
    console.log('🎮 Starting House Head Survival...');
    gameState.running = true;
    gameState.startTime = Date.now();
    gameState.lastScoreUpdate = Date.now();
    
    // Reset game state
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
        speedBoostTime: 0
    };
    
    gameState.enemies = [];
    gameState.powerups = [];
    gameState.activePowerups = [];
    gameState.score = 0;
    gameState.level = 1;
    gameState.difficulty = 1;
    gameState.lastEnemySpawn = 0;
    gameState.lastPowerupSpawn = 0;
    gameState.flashlight.on = false;
    gameState.flashlight.intensity = 0;
    gameState.camera.shake = 0;
    gameState.camera.intensity = 0;
    gameState.totalEnemiesSpawned = 0;
    
    // Initialize canvas
    gameState.canvas = document.getElementById('gameCanvas');
    gameState.ctx = gameState.canvas.getContext('2d');
    
    // Set canvas size to screen size
    resizeCanvas();
    
    // Position player in center
    gameState.player.x = gameState.canvas.width / 2;
    gameState.player.y = gameState.canvas.height / 2;
    
    // Hide screens
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    
    // Show controls hint
    setTimeout(() => {
        const hint = document.getElementById('controlsHint');
        if (hint) hint.style.display = 'block';
    }, 1000);
    
    // Hide hint after 5 seconds
    setTimeout(() => {
        const hint = document.getElementById('controlsHint');
        if (hint) hint.style.display = 'none';
    }, 6000);
    
    // Setup input handlers
    setupInputHandlers();
    
    // Start game loop
    gameLoop();
    
    console.log(`🎮 Game started! Canvas: ${gameState.canvas.width}x${gameState.canvas.height}`);
}

function endGame() {
    gameState.running = false;
    
    // Save high score
    const survivalTime = Math.floor((Date.now() - gameState.startTime) / 1000);
    saveHighScore(survivalTime, gameState.level, survivalTime);
    
    // Update final stats
    document.getElementById('finalScore').textContent = survivalTime;
    document.getElementById('finalTime').textContent = survivalTime;
    document.getElementById('finalLevel').textContent = gameState.level;
    document.getElementById('gameOver').classList.remove('hidden');
    
    // Hide controls hint
    const hint = document.getElementById('controlsHint');
    if (hint) hint.style.display = 'none';
    
    console.log('🎮 Game Over! Survival time:', survivalTime, 'seconds');
}

function restartGame() {
    startGame();
}

function showStartScreen() {
    document.getElementById('startScreen').classList.remove('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    gameState.running = false;
    
    // Hide controls hint
    const hint = document.getElementById('controlsHint');
    if (hint) hint.style.display = 'none';
}

function showHighScores() {
    displayHighScores();
    document.getElementById('highScoresModal').classList.remove('hidden');
}

function closeHighScores() {
    document.getElementById('highScoresModal').classList.add('hidden');
}

function showHelp() {
    document.getElementById('helpModal').classList.remove('hidden');
}

function closeHelp() {
    document.getElementById('helpModal').classList.add('hidden');
}

// Canvas Management
function resizeCanvas() {
    const canvas = gameState.canvas;
    if (!canvas) return;
    
    // Set canvas to full window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Set CSS size to match
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    
    console.log(`📏 Canvas resized to ${canvas.width}x${canvas.height}`);
    
    // Reposition player if needed
    if (gameState.running && gameState.player) {
        gameState.player.x = Math.min(gameState.player.x, canvas.width - gameState.player.size);
        gameState.player.y = Math.min(gameState.player.y, canvas.height - gameState.player.size - 80);
        constrainPlayer();
    }
}

// Initialize everything
window.addEventListener('load', () => {
    console.log('🏠 House Head Chase - PWA Loaded!');
    
    // Remove any stray buttons that might have been created
    const strayButtons = document.querySelectorAll('body > .btn, body > .modal-footer');
    strayButtons.forEach(btn => btn.remove());
    
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('❌ Service Worker registration failed:', error);
            });
    }
    
    // Setup audio toggle
    document.getElementById('audioToggle').addEventListener('click', () => {
        soundSystem.toggle();
    });
    
    // Setup window resize handler
    window.addEventListener('resize', () => {
        resizeCanvas();
    });
    
    // Setup orientation change handler for mobile
    window.addEventListener('orientationchange', () => {
        setTimeout(resizeCanvas, 100);
    });
    
    // Initialize high scores display
    displayHighScores();
    
    // Hide controls hint initially
    const hint = document.getElementById('controlsHint');
    if (hint) hint.style.display = 'none';
    
    console.log('🎮 Game ready to play!');
});
