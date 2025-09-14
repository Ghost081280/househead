// === HOUSE HEAD CHASE - MOBILE-FIRST WORKING VERSION ===
console.log('🏠 House Head Chase - Loading mobile-first version...');

// === SOUND SYSTEM ===
const soundSystem = {
    enabled: true,
    context: null,
    
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Audio system initialized');
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
                'flashlight': 300,
                'spawn': 180
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
    running: false,
    paused: false,
    canvas: null,
    ctx: null,
    gameLoopId: null,
    
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
        invulnerabilityTime: 0
    },
    
    enemies: [],
    powerups: [],
    
    flashlight: {
        on: false,
        intensity: 0,
        radius: 200,
        fadeSpeed: 0.1
    },
    
    level: 1,
    startTime: 0,
    lastEnemySpawn: 0,
    lastPowerupSpawn: 0,
    spawnRate: 3000,
    powerupSpawnRate: 12000,
    
    input: {
        lastTap: 0,
        doubleTapDelay: 300
    },
    
    camera: {
        shake: 0,
        intensity: 0
    },
    
    difficulty: 1
};

// === ENEMY CLASS WITH PROPER HOUSE RENDERING ===
class Enemy {
    constructor(x, y, type = 'small') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = type === 'big' ? 35 : 25;
        this.speed = type === 'big' ? 0.8 : 1.2;
        this.damage = type === 'big' ? 25 : 15;
        this.color = type === 'big' ? '#4a3a2a' : '#3a2a1a';
        this.state = 'spawning';
        this.spawnTime = Date.now();
        this.velocity = { x: 0, y: 0 };
        this.windowGlow = 0.5 + Math.random() * 0.5;
        this.lastDamageTime = 0;
        this.isVisible = false;
        
        // AI properties
        this.wanderTarget = { x: this.x, y: this.y };
        this.lastWanderUpdate = 0;
        this.alertRadius = type === 'big' ? 200 : 180;
        this.lastPlayerSeen = 0;
        
        // Leg animation
        this.legs = [];
        for (let i = 0; i < 6; i++) {
            this.legs.push({
                angle: (i / 6) * Math.PI * 2,
                length: this.size * 0.8,
                offset: Math.random() * Math.PI * 2,
                speed: 0.1 + Math.random() * 0.1
            });
        }
        
        console.log(`🏠 ${type} house spawned at (${Math.floor(x)}, ${Math.floor(y)})`);
    }
    
    update() {
        const currentTime = Date.now();
        const stateTime = currentTime - this.spawnTime;
        
        if (this.state === 'spawning' && stateTime > 1000) {
            this.state = 'dormant';
            soundSystem.play('spawn');
        } else if (this.state === 'dormant' && stateTime > 3000) {
            this.state = 'active';
            soundSystem.play('enemy');
            console.log(`🦵 ${this.type} house grew legs!`);
        }
        
        if (this.state === 'active') {
            this.updateAI();
            this.updateLegs();
        }
        
        this.updateVisibility();
        this.checkPlayerCollision();
        this.windowGlow = 0.5 + Math.sin(currentTime * 0.003 + this.x * 0.01) * 0.3;
        
        return this.isOnScreen();
    }
    
    updateAI() {
        const currentTime = Date.now();
        const player = gameState.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
        
        // AI behavior based on flashlight
        if (gameState.flashlight.on && gameState.flashlight.intensity > 0.5) {
            // Flashlight is on - hunt aggressively
            if (distanceToPlayer < this.alertRadius) {
                this.lastPlayerSeen = currentTime;
                const huntSpeed = this.speed * gameState.difficulty * 1.2;
                if (distanceToPlayer > 5) {
                    this.velocity.x = (dx / distanceToPlayer) * huntSpeed;
                    this.velocity.y = (dy / distanceToPlayer) * huntSpeed;
                }
            } else if (currentTime - this.lastPlayerSeen < 3000) {
                // Continue hunting briefly
                const huntSpeed = this.speed * gameState.difficulty * 0.8;
                if (distanceToPlayer > 5) {
                    this.velocity.x = (dx / distanceToPlayer) * huntSpeed;
                    this.velocity.y = (dy / distanceToPlayer) * huntSpeed;
                }
            } else {
                this.wander();
            }
        } else {
            // Flashlight is off - wander unless very close
            if (distanceToPlayer < 50) {
                const huntSpeed = this.speed * gameState.difficulty;
                this.velocity.x = (dx / distanceToPlayer) * huntSpeed;
                this.velocity.y = (dy / distanceToPlayer) * huntSpeed;
            } else {
                this.wander();
            }
        }
        
        // Apply movement
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
        // Boundary constraints
        this.x = Math.max(this.size, Math.min(gameState.canvas.width - this.size, this.x));
        this.y = Math.max(this.size + 80, Math.min(gameState.canvas.height - this.size, this.y));
        
        // Apply friction
        this.velocity.x *= 0.95;
        this.velocity.y *= 0.95;
    }
    
    wander() {
        const currentTime = Date.now();
        
        if (currentTime - this.lastWanderUpdate > 2000 + Math.random() * 3000) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 * (0.3 + Math.random() * 0.7);
            
            this.wanderTarget.x = this.x + Math.cos(angle) * distance;
            this.wanderTarget.y = this.y + Math.sin(angle) * distance;
            
            this.wanderTarget.x = Math.max(this.size + 50, Math.min(gameState.canvas.width - this.size - 50, this.wanderTarget.x));
            this.wanderTarget.y = Math.max(this.size + 130, Math.min(gameState.canvas.height - this.size - 50, this.wanderTarget.y));
            
            this.lastWanderUpdate = currentTime;
        }
        
        const dx = this.wanderTarget.x - this.x;
        const dy = this.wanderTarget.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 20) {
            const wanderSpeed = this.speed * 0.5;
            this.velocity.x += (dx / distance) * wanderSpeed * 0.2;
            this.velocity.y += (dy / distance) * wanderSpeed * 0.2;
        }
    }
    
    updateLegs() {
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        const legSpeed = 0.1 + speed * 0.02;
        
        this.legs.forEach(leg => {
            leg.offset += legSpeed;
        });
    }
    
    updateVisibility() {
        const player = gameState.player;
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (gameState.flashlight.on && gameState.flashlight.intensity > 0.3) {
            this.isVisible = distance < gameState.flashlight.radius;
        } else {
            this.isVisible = distance < 60;
        }
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
        const currentTime = Date.now();
        if (currentTime - this.lastDamageTime > 1000) {
            if (gameState.player.shieldTime <= 0) {
                gameState.player.health -= this.damage;
                gameState.player.invulnerabilityTime = 1000;
                gameState.camera.shake = 10;
                soundSystem.play('hit');
                console.log(`💥 Player hit! Health: ${gameState.player.health}`);
            }
            this.lastDamageTime = currentTime;
        }
    }
    
    isOnScreen() {
        return this.x > -this.size && this.x < gameState.canvas.width + this.size &&
               this.y > -this.size && this.y < gameState.canvas.height + this.size;
    }
    
    render(ctx) {
        if (!this.isVisible && this.state !== 'spawning') return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.state === 'spawning') {
            this.drawSpawning(ctx);
        } else {
            this.drawHouse(ctx);
            if (this.state === 'active') {
                this.drawLegs(ctx);
            }
        }
        
        ctx.restore();
    }
    
    drawSpawning(ctx) {
        const progress = Math.min((Date.now() - this.spawnTime) / 1000, 1);
        const currentSize = this.size * progress;
        
        ctx.fillStyle = this.color;
        ctx.globalAlpha = progress;
        ctx.fillRect(-currentSize/2, -currentSize/2, currentSize, currentSize * 0.8);
        ctx.globalAlpha = 1;
    }
    
    drawHouse(ctx) {
        const size = this.size;
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-size/2 + 2, -size/2 + 2, size, size * 0.8);
        
        // House body gradient
        const gradient = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, this.type === 'big' ? '#2a1a0a' : '#3a2a1a');
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
        
        // Windows (eyes) with glow
        const glowIntensity = this.windowGlow;
        const eyeSize = size / (this.type === 'big' ? 6 : 8);
        
        ctx.shadowColor = '#ffff88';
        ctx.shadowBlur = 8;
        ctx.fillStyle = `rgba(255, 255, 136, ${glowIntensity})`;
        
        ctx.fillRect(-size/3, -size/4, eyeSize, eyeSize);
        ctx.fillRect(size/6, -size/4, eyeSize, eyeSize);
        
        ctx.shadowBlur = 0;
        
        // Window frames
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(-size/3, -size/4, eyeSize, eyeSize);
        ctx.strokeRect(size/6, -size/4, eyeSize, eyeSize);
        
        // Door
        ctx.fillStyle = '#000';
        const doorWidth = this.type === 'big' ? size/3 : size/4;
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
    
    drawLegs(ctx) {
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = this.type === 'big' ? 5 : 3;
        ctx.lineCap = 'round';
        
        this.legs.forEach(leg => {
            const legX = Math.cos(leg.angle + leg.offset) * leg.length;
            const legY = Math.sin(leg.angle + leg.offset) * leg.length;
            
            const midX = legX * 0.6;
            const midY = legY * 0.6;
            
            // Draw leg
            ctx.beginPath();
            ctx.moveTo(0, this.size * 0.3);
            ctx.lineTo(midX, midY + this.size * 0.3);
            ctx.lineTo(legX, legY + this.size * 0.3);
            ctx.stroke();
            
            // Joint
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

// === POWERUP CLASS ===
class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = 12;
        this.spawnTime = Date.now();
        this.lifetime = 15000;
        this.pulseOffset = Math.random() * Math.PI * 2;
        
        const types = {
            'health': { color: '#44ff44', emoji: '💚' },
            'shield': { color: '#4444ff', emoji: '🛡️' },
            'speed': { color: '#ffff44', emoji: '⚡' }
        };
        
        this.config = types[type] || types.health;
        console.log(`⚡ ${this.config.emoji} ${type} powerup spawned`);
    }
    
    update() {
        const age = Date.now() - this.spawnTime;
        
        if (age > this.lifetime) {
            return false;
        }
        
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
        
        if (age > fadeStart) {
            ctx.globalAlpha = 1 - (age - fadeStart) / 3000;
        }
        
        const pulse = Math.sin(age * 0.008 + this.pulseOffset) * 0.3 + 0.7;
        const size = this.size * pulse;
        
        // Glow effect
        ctx.shadowColor = this.config.color;
        ctx.shadowBlur = 15;
        
        // Main circle
        ctx.fillStyle = this.config.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
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
    const elements = ['hud', 'powerupIndicators', 'flashlightIndicator'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    });
    
    // Show controls hint briefly
    setTimeout(() => {
        const hint = document.getElementById('controlsHint');
        if (hint) {
            hint.classList.remove('hidden');
            setTimeout(() => hint.classList.add('hidden'), 4000);
        }
    }, 1000);
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
        
        const healthEl = document.getElementById('health');
        const healthFillEl = document.getElementById('healthFill');
        if (healthEl) healthEl.textContent = health;
        if (healthFillEl) healthFillEl.style.width = (health / maxHealth * 100) + '%';
        
        const survivalTimeEl = document.getElementById('survivalTime');
        if (survivalTimeEl) {
            survivalTimeEl.textContent = formatTime(survivalTime);
        }
        
        const levelEl = document.getElementById('level');
        if (levelEl) levelEl.textContent = gameState.level;
        
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
    } else {
        indicator.classList.add('hidden');
    }
}

// === CANVAS SETUP ===
function setupCanvas() {
    const canvas = gameState.canvas;
    if (!canvas) return;
    
    function resizeCanvas() {
        // Mobile-first: full screen on mobile, contained on desktop
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        
        // Reposition player if needed
        if (gameState.running && gameState.player) {
            gameState.player.x = Math.min(gameState.player.x, canvas.width - gameState.player.size);
            gameState.player.y = Math.min(gameState.player.y, canvas.height - gameState.player.size);
        }
        
        console.log(`Canvas resized to ${canvas.width}x${canvas.height}`);
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));
}

// === INPUT HANDLING ===
function setupEventListeners() {
    const canvas = gameState.canvas;
    if (!canvas) return;
    
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('dblclick', handleDoubleClick);
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    window.addEventListener('keydown', handleKeyDown);
}

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
    }
}

function toggleFlashlight() {
    gameState.flashlight.on = !gameState.flashlight.on;
    soundSystem.play('flashlight');
    console.log('🔦 Flashlight:', gameState.flashlight.on ? 'ON' : 'OFF');
}

// === GAME LOGIC ===
function startGame() {
    console.log('🎮 Starting new game...');
    
    gameState.running = true;
    gameState.paused = false;
    gameState.level = 1;
    gameState.difficulty = 1;
    gameState.startTime = Date.now();
    
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
        invulnerabilityTime: 0
    };
    
    gameState.enemies = [];
    gameState.powerups = [];
    
    gameState.flashlight = {
        on: false,
        intensity: 0,
        radius: 200,
        fadeSpeed: 0.1
    };
    
    gameState.lastEnemySpawn = 0;
    gameState.lastPowerupSpawn = 0;
    
    gameState.camera = { shake: 0, intensity: 0 };
    
    hideAllScreens();
    showGameUI();
    
    gameState.canvas.classList.add('active');
    gameState.canvas.style.pointerEvents = 'auto';
    
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
    
    updatePlayerEffects();
    updateFlashlight();
    
    gameState.enemies = gameState.enemies.filter(enemy => enemy.update());
    gameState.powerups = gameState.powerups.filter(powerup => powerup.update());
    
    spawnEntities(currentTime);
    updateLevelProgression();
    updateCameraEffects();
    
    if (gameState.player.health <= 0) {
        endGame();
        return;
    }
    
    updateUI();
}

function updatePlayerEffects() {
    if (gameState.player.shieldTime > 0) {
        gameState.player.shieldTime -= 16;
    }
    
    if (gameState.player.speedBoostTime > 0) {
        gameState.player.speedBoostTime -= 16;
        gameState.player.speed = gameState.player.baseSpeed * 2;
    } else {
        gameState.player.speed = gameState.player.baseSpeed;
    }
    
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
    if (currentTime - gameState.lastEnemySpawn > gameState.spawnRate / gameState.difficulty) {
        spawnEnemy();
        gameState.lastEnemySpawn = currentTime;
    }
    
    if (currentTime - gameState.lastPowerupSpawn > gameState.powerupSpawnRate) {
        spawnPowerup();
        gameState.lastPowerupSpawn = currentTime;
    }
}

function spawnEnemy() {
    const canvas = gameState.canvas;
    const margin = 80;
    let x, y;
    let attempts = 0;
    let validPosition = false;
    
    do {
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
            case 0: x = Math.random() * canvas.width; y = -margin; break;
            case 1: x = canvas.width + margin; y = Math.random() * canvas.height; break;
            case 2: x = Math.random() * canvas.width; y = canvas.height + margin; break;
            case 3: x = -margin; y = Math.random() * canvas.height; break;
        }
        
        const playerDistance = Math.sqrt(
            Math.pow(x - gameState.player.x, 2) + Math.pow(y - gameState.player.y, 2)
        );
        
        validPosition = playerDistance > 200;
        attempts++;
    } while (!validPosition && attempts < 20);
    
    const type = Math.random() < 0.25 ? 'big' : 'small';
    const enemy = new Enemy(x, y, type);
    gameState.enemies.push(enemy);
    
    console.log(`👾 Enemy spawned: ${type}`);
}

function spawnPowerup() {
    const canvas = gameState.canvas;
    const margin = 100;
    
    let x, y;
    let attempts = 0;
    let validPosition = false;
    
    do {
        x = margin + Math.random() * (canvas.width - margin * 2);
        y = margin + Math.random() * (canvas.height - margin * 2);
        
        const playerDistance = Math.sqrt(
            Math.pow(x - gameState.player.x, 2) + Math.pow(y - gameState.player.y, 2)
        );
        
        let tooCloseToEnemy = false;
        for (const enemy of gameState.enemies) {
            const enemyDistance = Math.sqrt(
                Math.pow(x - enemy.x, 2) + Math.pow(y - enemy.y, 2)
            );
            if (enemyDistance < 80) {
                tooCloseToEnemy = true;
                break;
            }
        }
        
        validPosition = playerDistance > 100 && !tooCloseToEnemy;
        attempts++;
    } while (!validPosition && attempts < 20);
    
    const types = ['health', 'shield', 'speed'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const powerup = new Powerup(x, y, type);
    gameState.powerups.push(powerup);
    
    console.log(`⚡ Powerup spawned: ${type}`);
}

function updateLevelProgression() {
    const survivalTime = getCurrentSurvivalTime();
    const newLevel = Math.floor(survivalTime / 30) + 1;
    
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameState.difficulty = 1 + (gameState.level - 1) * 0.15;
        
        soundSystem.play('levelup');
        showLevelUpEffect();
        
        console.log(`🎊 Level up! Now level ${gameState.level}`);
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
    
    saveHighScore(survivalTime, gameState.level);
    
    try {
        const finalTimeEl = document.getElementById('finalTime');
        const finalLevelEl = document.getElementById('finalLevel');
        const shareTimeEl = document.getElementById('shareTimeValue');
        const shareLevelEl = document.getElementById('shareLevelValue');
        
        if (finalTimeEl) finalTimeEl.textContent = formatTime(survivalTime);
        if (finalLevelEl) finalLevelEl.textContent = gameState.level;
        if (shareTimeEl) shareTimeEl.textContent = formatTime(survivalTime);
        if (shareLevelEl) shareLevelEl.textContent = gameState.level;
    } catch (error) {
        console.error('Error updating final stats:', error);
    }
    
    hideGameUI();
    showScreen('gameOver');
    
    console.log('🎮 Game Over! Survival time:', formatTime(survivalTime));
}

// === RENDERING ===
function render() {
    if (!gameState.ctx || !gameState.canvas) return;
    
    const ctx = gameState.ctx;
    const canvas = gameState.canvas;
    
    ctx.save();
    if (gameState.camera.shake > 0) {
        const shakeX = (Math.random() - 0.5) * gameState.camera.shake;
        const shakeY = (Math.random() - 0.5) * gameState.camera.shake;
        ctx.translate(shakeX, shakeY);
    }
    
    // Clear and draw background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw star field
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
        const x = (i * 23.7) % canvas.width;
        const y = (i * 37.3) % canvas.height;
        const brightness = Math.sin(Date.now() * 0.001 + i) * 0.5 + 0.5;
        ctx.globalAlpha = brightness * 0.3;
        ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;
    
    // Draw flashlight if on
    if (gameState.flashlight.intensity > 0) {
        renderFlashlight(ctx);
    }
    
    // Draw game objects
    gameState.powerups.forEach(powerup => powerup.render(ctx));
    gameState.enemies.forEach(enemy => enemy.render(ctx));
    
    renderPlayer(ctx);
    
    ctx.restore();
}

function renderPlayer(ctx) {
    const player = gameState.player;
    
    ctx.save();
    
    if (gameState.player.invulnerabilityTime > 0) {
        ctx.globalAlpha = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
    }
    
    if (gameState.player.shieldTime > 0) {
        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.size + 8, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Player glow
    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur = 15;
    
    ctx.fillStyle = '#4488ff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#88bbff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
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

// === EFFECTS ===
function showLevelUpEffect() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(45deg, #4488ff, #6688ff);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 9999;
        animation: slideDown 2s ease-out;
        font-size: 18px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(68, 136, 255, 0.4);
    `;
    notification.textContent = `🎊 LEVEL ${gameState.level}! 🎊`;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            0% { transform: translateX(-50%) translateY(-100px); opacity: 0; }
            20% { transform: translateX(-50%) translateY(0); opacity: 1; }
            80% { transform: translateX(-50%) translateY(0); opacity: 1; }
            100% { transform: translateX(-50%) translateY(-20px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 2000);
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
        
        console.log('💾 High score saved:', formatTime(survivalTime));
    } catch (error) {
        console.error('Error saving high score:', error);
    }
}

function loadHighScores() {
    try {
        const stored = localStorage.getItem('houseHeadChase_highScores');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading high scores:', error);
        return [];
    }
}

function displayHighScores() {
    const container = document.getElementById('highScoresList');
    if (!container) return;
    
    const scores = loadHighScores();
    
    if (scores.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">No survival records yet! Play to set your first time.</p>';
        return;
    }
    
    let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
    scores.forEach((score, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
        
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; 
                        padding: 12px; background: rgba(255, 170, 68, 0.1); 
                        border: 1px solid rgba(255, 170, 68, 0.3); border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 20px; min-width: 30px;">${medal}</span>
                    <div>
                        <div style="font-weight: bold; color: #ffaa44;">⏰ ${formatTime(score.score)}</div>
                        <div style="font-size: 12px; color: #888;">Level ${score.level} • ${score.date}</div>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
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
    displayHighScores();
    showScreen('highScoresModal');
}

function showHelp() {
    showScreen('helpModal');
}

function showShareModal() {
    const survivalTime = getCurrentSurvivalTime();
    
    const shareTimeEl = document.getElementById('shareTimeValue');
    const shareLevelEl = document.getElementById('shareLevelValue');
    const sharePreviewEl = document.getElementById('shareTextPreview');
    
    if (shareTimeEl) shareTimeEl.textContent = formatTime(survivalTime);
    if (shareLevelEl) shareLevelEl.textContent = gameState.level;
    if (sharePreviewEl) {
        sharePreviewEl.textContent = `I just survived for ${formatTime(survivalTime)} in House Head Chase! 🏠👾 Can you beat my time? Play free!`;
    }
    
    showScreen('shareModal');
}

// === INITIALIZATION ===
function initializeGame() {
    console.log('🎮 Initializing House Head Chase...');
    
    soundSystem.init();
    
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
    
    setupCanvas();
    setupEventListeners();
    setupButtonEvents();
    
    showScreen('startScreen');
    
    console.log('✅ Game initialized successfully!');
    return true;
}

function setupButtonEvents() {
    const buttons = {
        'startGameBtn': startGame,
        'restartGameBtn': restartGame,
        'showStartScreenBtn': goToStartScreen,
        'showHighScoresBtn': showHighScores,
        'showHelpBtn': showHelp,
        'shareScoreBtn': showShareModal,
        'audioToggle': () => soundSystem.toggle()
    };
    
    Object.entries(buttons).forEach(([buttonId, handler]) => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', handler);
            console.log(`✅ Event listener attached to: ${buttonId}`);
        }
    });
}

// === GLOBAL EXPORTS ===
window.startGame = startGame;
window.restartGame = restartGame;
window.goToStartScreen = goToStartScreen;
window.showHighScores = showHighScores;
window.showHelp = showHelp;
window.showShareModal = showShareModal;
window.soundSystem = soundSystem;

// === MAIN INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 House Head Chase - Loading...');
    
    if (initializeGame()) {
        console.log('✅ House Head Chase ready to play!');
    } else {
        console.error('❌ Failed to initialize game');
    }
});

console.log('✅ Game script loaded successfully!');
