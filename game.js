// House Head Chase - COMPLETE FIXED VERSION
console.log('🏠 House Head Chase - Loading COMPLETE FIXED VERSION...');

// === SOUND SYSTEM ===
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
            case 'powerup':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(660, this.context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1320, this.context.currentTime + 0.3);
                gainNode.gain.setValueAtTime(volume, this.context.currentTime);
                duration = 0.3;
                break;
        }

        oscillator.start();
        oscillator.stop(this.context.currentTime + duration);
    }

    toggle() {
        this.enabled = !this.enabled;
        const btn = document.getElementById('audioToggle');
        if (btn) {
            btn.textContent = this.enabled ? '🔊' : '🔇';
        }
        console.log(`🔊 Audio ${this.enabled ? 'enabled' : 'disabled'}`);
    }
}

// Initialize sound system
const soundSystem = new SoundSystem();

// === POWER-UP TYPES ===
const PowerupTypes = {
    HEALTH: {
        name: 'Health Pack',
        emoji: '💚',
        color: '#44ff44',
        effect: 'health',
        value: 30,
        duration: 0,
        spawnWeight: 0.4
    },
    SHIELD: {
        name: 'Shield',
        emoji: '🛡️',
        color: '#4488ff',
        effect: 'shield',
        value: 0,
        duration: 5000,
        spawnWeight: 0.3
    },
    SPEED: {
        name: 'Speed Boost',
        emoji: '⚡',
        color: '#ffaa44',
        effect: 'speed',
        value: 2,
        duration: 8000,
        spawnWeight: 0.3
    }
};

// === POWERUP CLASS ===
class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.config = PowerupTypes[type];
        this.size = 15;
        this.collected = false;
        this.spawnTime = Date.now();
        this.pulseOffset = Math.random() * Math.PI * 2;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.despawnTime = this.spawnTime + 15000;
        
        console.log(`⚡ ${this.config.name} spawned at (${Math.floor(x)}, ${Math.floor(y)})`);
    }

    update() {
        const currentTime = Date.now();
        
        if (currentTime > this.despawnTime) {
            return false;
        }
        
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
        
        soundSystem.play('powerup');
        showPowerupMessage(`+${this.config.name}!`);
        
        switch (this.config.effect) {
            case 'health':
                gameState.player.health = Math.min(gameState.player.maxHealth, 
                    gameState.player.health + this.config.value);
                console.log(`💚 Health restored: +${this.config.value}`);
                break;
                
            case 'shield':
                gameState.player.shieldTime = this.config.duration;
                gameState.activePowerups.push({
                    type: this.type,
                    timeLeft: this.config.duration
                });
                console.log(`🛡️ Shield activated for ${this.config.duration/1000}s`);
                break;
                
            case 'speed':
                gameState.player.speed = gameState.player.baseSpeed * this.config.value;
                gameState.player.speedBoostTime = this.config.duration;
                gameState.activePowerups.push({
                    type: this.type,
                    timeLeft: this.config.duration
                });
                console.log(`⚡ Speed boost activated for ${this.config.duration/1000}s`);
                break;
        }
    }

    draw() {
        if (this.collected) return;
        
        const ctx = gameState.ctx;
        const currentTime = Date.now();
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const floatY = Math.sin(currentTime * 0.003 + this.floatOffset) * 3;
        ctx.translate(0, floatY);
        
        const pulse = 0.8 + Math.sin(currentTime * 0.008 + this.pulseOffset) * 0.2;
        ctx.scale(pulse, pulse);
        
        ctx.shadowColor = this.config.color;
        ctx.shadowBlur = 15;
        
        ctx.fillStyle = this.config.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        switch (this.type) {
            case 'HEALTH':
                ctx.fillRect(-2, -6, 4, 12);
                ctx.fillRect(-6, -2, 12, 4);
                break;
            case 'SHIELD':
                ctx.beginPath();
                ctx.moveTo(0, -8);
                ctx.lineTo(6, -4);
                ctx.lineTo(6, 4);
                ctx.lineTo(0, 8);
                ctx.lineTo(-6, 4);
                ctx.lineTo(-6, -4);
                ctx.closePath();
                ctx.fill();
                break;
            case 'SPEED':
                ctx.beginPath();
                ctx.moveTo(-2, -8);
                ctx.lineTo(4, -2);
                ctx.lineTo(0, 0);
                ctx.lineTo(6, 6);
                ctx.lineTo(0, 8);
                ctx.lineTo(-4, 2);
                ctx.lineTo(0, 0);
                ctx.lineTo(-6, -6);
                ctx.closePath();
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
}

// === GAME STATE ===
const gameState = {
    running: false,
    paused: false,
    canvas: null,
    ctx: null,
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
        speedBoostTime: 0
    },
    enemies: [],
    powerups: [],
    activePowerups: [],
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
    lastPowerupSpawn: 0,
    lastScoreUpdate: 0,
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
    difficulty: 1,
    totalEnemiesSpawned: 0
};

// === ENEMY TYPES ===
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

// === ENEMY CLASS ===
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
        
        this.state = 'spawning';
        this.spawnTime = Date.now();
        this.activationTime = this.config.activationTime + (Math.random() * 1000);
        this.legs = [];
        this.windowGlow = 0.5 + Math.random() * 0.5;
        this.lastDamageTime = 0;
        this.isVisible = false;
        
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
        
        if (this.state === 'active') {
            this.huntPlayer();
            this.updateLegs();
        }
        
        this.updateVisibility();
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
            
            this.x = Math.max(this.size, Math.min(gameState.canvas.width - this.size, this.x));
            this.y = Math.max(this.size + 80, Math.min(gameState.canvas.height - this.size, this.y));
        }
        
        if (distance < this.size + gameState.player.size - 5 && gameState.player.shieldTime <= 0) {
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
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-size/2 + 2, -size/2 + 2, size, size * 0.8);
        
        const gradient = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, this.type === 'BIG' ? '#2a1a0a' : '#3a2a1a');
        gradient.addColorStop(1, '#1a0a0a');
        ctx.fillStyle = gradient;
        ctx.fillRect(-size/2, -size/2, size, size * 0.8);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(-size/2, -size/2, size, size * 0.8);
        
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
        
        const glowIntensity = this.windowGlow;
        const eyeSize = size / (this.type === 'BIG' ? 6 : 8);
        
        ctx.shadowColor = '#ffff88';
        ctx.shadowBlur = 8;
        ctx.fillStyle = `rgba(255, 255, 136, ${glowIntensity})`;
        
        ctx.fillRect(-size/3, -size/4, eyeSize, eyeSize);
        ctx.fillRect(size/6, -size/4, eyeSize, eyeSize);
        
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(-size/3, -size/4, eyeSize, eyeSize);
        ctx.strokeRect(size/6, -size/4, eyeSize, eyeSize);
        
        ctx.fillStyle = '#000';
        const doorWidth = this.type === 'BIG' ? size/3 : size/4;
        const doorHeight = size/4;
        ctx.fillRect(-doorWidth/2, size/6, doorWidth, doorHeight);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(-doorWidth/2, size/6, doorWidth, doorHeight);
        
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
            
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(midX, midY + this.size * 0.3, 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(legX, legY + this.size * 0.3, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

// === DRAWING FUNCTIONS ===
function drawPlayer() {
    const ctx = gameState.ctx;
    const player = gameState.player;
    
    ctx.save();
    ctx.translate(player.x, player.y);
    
    if (player.shieldTime > 0) {
        ctx.shadowColor = '#4488ff';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, player.size + 8, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur = 15;
    
    ctx.fillStyle = '#4488ff';
    ctx.beginPath();
    ctx.arc(0, 0, player.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#88bbff';
    ctx.beginPath();
    ctx.arc(0, 0, player.size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
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

function drawFlashlight() {
    if (!gameState.flashlight.on || gameState.flashlight.intensity <= 0) return;
    
    const ctx = gameState.ctx;
    const player = gameState.player;
    const intensity = gameState.flashlight.intensity;
    
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
    
    const gradient = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)
    );
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
        const x = (i * 23.7) % canvas.width;
        const y = (i * 37.3) % (canvas.height - 80);
        const brightness = Math.sin(Date.now() * 0.001 + i) * 0.5 + 0.5;
        ctx.globalAlpha = brightness * 0.3;
        ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;
    
    const groundGradient = ctx.createLinearGradient(0, canvas.height - 80, 0, canvas.height);
    groundGradient.addColorStop(0, '#1a2a1a');
    groundGradient.addColorStop(1, '#0a1a0a');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
}

// === GAME SYSTEMS ===
function spawnEnemy() {
    const currentTime = Date.now();
    if (currentTime - gameState.lastEnemySpawn < gameState.spawnRate) return;
    
    const rand = Math.random();
    const bigHouseChance = Math.min(0.3 + (gameState.level - 1) * 0.1, 0.6);
    const enemyType = rand < bigHouseChance ? 'BIG' : 'SMALL';
    
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
    
    const enemy = new Enemy(x, y, enemyType);
    gameState.enemies.push(enemy);
    gameState.totalEnemiesSpawned++;
    gameState.lastEnemySpawn = currentTime;
    
    gameState.spawnRate = Math.max(1000, 3000 - (gameState.level - 1) * 200);
    
    console.log(`👻 Enemy spawned: ${enemyType}. Total: ${gameState.enemies.length}`);
}

function spawnPowerup() {
    const currentTime = Date.now();
    if (currentTime - gameState.lastPowerupSpawn < gameState.powerupSpawnRate) return;
    
    const rand = Math.random();
    let powerupType = 'HEALTH';
    
    if (rand < PowerupTypes.HEALTH.spawnWeight) {
        powerupType = 'HEALTH';
    } else if (rand < PowerupTypes.HEALTH.spawnWeight + PowerupTypes.SHIELD.spawnWeight) {
        powerupType = 'SHIELD';
    } else {
        powerupType = 'SPEED';
    }
    
    let x, y;
    let attempts = 0;
    let playerDistance = 0;
    let tooCloseToEnemy = false;
    
    do {
        x = 80 + Math.random() * (gameState.canvas.width - 160);
        y = 120 + Math.random() * (gameState.canvas.height - 200);
        
        playerDistance = Math.sqrt(
            Math.pow(x - gameState.player.x, 2) + Math.pow(y - gameState.player.y, 2)
        );
        
        tooCloseToEnemy = false;
        for (const enemy of gameState.enemies) {
            const enemyDistance = Math.sqrt(
                Math.pow(x - enemy.x, 2) + Math.pow(y - enemy.y, 2)
            );
            if (enemyDistance < 100) {
                tooCloseToEnemy = true;
                break;
            }
        }
        
        attempts++;
        if (attempts > 20) break;
    } while ((playerDistance < 120 || tooCloseToEnemy) && attempts < 20);
    
    const powerup = new Powerup(x, y, powerupType);
    gameState.powerups.push(powerup);
    gameState.lastPowerupSpawn = currentTime;
    
    console.log(`⚡ Powerup spawned: ${powerupType}. Total: ${gameState.powerups.length}`);
}

function updateGame() {
    if (!gameState.running) return;
    
    const currentTime = Date.now();
    
    if (gameState.flashlight.on) {
        gameState.flashlight.intensity = Math.min(1, gameState.flashlight.intensity + gameState.flashlight.fadeSpeed);
    } else {
        gameState.flashlight.intensity = Math.max(0, gameState.flashlight.intensity - gameState.flashlight.fadeSpeed);
    }
    
    if (gameState.player.shieldTime > 0) {
        gameState.player.shieldTime -= 16;
    }
    
    if (gameState.player.speedBoostTime > 0) {
        gameState.player.speedBoostTime -= 16;
        if (gameState.player.speedBoostTime <= 0) {
            gameState.player.speed = gameState.player.baseSpeed;
        }
    }
    
    gameState.activePowerups = gameState.activePowerups.filter(powerup => {
        powerup.timeLeft -= 16;
        return powerup.timeLeft > 0;
    });
    
    gameState.enemies = gameState.enemies.filter(enemy => enemy.update());
    gameState.powerups = gameState.powerups.filter(powerup => powerup.update());
    
    spawnEnemy();
    spawnPowerup();
    
    if (currentTime - gameState.lastScoreUpdate > 1000) {
        gameState.score++;
        gameState.lastScoreUpdate = currentTime;
    }
    
    const newLevel = Math.floor(gameState.score / 30) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameState.difficulty = 1 + (gameState.level - 1) * 0.2;
        soundSystem.play('levelup');
        showLevelUpEffect();
        console.log(`🎊 Level up! Now level ${gameState.level}`);
    }
    
    if (gameState.camera.shake > 0) {
        gameState.camera.shake--;
        gameState.camera.intensity = Math.max(0, gameState.camera.intensity - 0.5);
    }
    
    if (gameState.player.health <= 0) {
        endGame();
    }
    
    updateUI();
}

function drawGame() {
    if (!gameState.running || !gameState.ctx) return;
    
    const ctx = gameState.ctx;
    
    ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    
    ctx.save();
    if (gameState.camera.shake > 0) {
        const shakeX = (Math.random() - 0.5) * gameState.camera.intensity;
        const shakeY = (Math.random() - 0.5) * gameState.camera.intensity;
        ctx.translate(shakeX, shakeY);
    }
    
    drawBackground();
    drawFlashlight();
    
    gameState.powerups.forEach(powerup => powerup.draw());
    gameState.enemies.forEach(enemy => enemy.draw());
    
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

// === INPUT HANDLING ===
function setupInputHandlers() {
    const canvas = gameState.canvas;
    if (!canvas) return;
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('dblclick', handleDoubleClick);
    
    canvas.addEventListener('contextmenu', e => e.preventDefault());
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = gameState.canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (gameState.canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (gameState.canvas.height / rect.height);
    
    const dx = x - gameState.player.x;
    const dy = y - gameState.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < gameState.player.size + 20) {
        gameState.player.isDragging = true;
        gameState.player.dragOffset = { x: dx, y: dy };
    }
    
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
    player.y = Math.max(player.size + 100, Math.min(canvas.height - player.size - 100, player.y));
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

function showPowerupMessage(message) {
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
                z-index: 8000;
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
                z-index: 8000;
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
                z-index: 8000;
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

// === SCREEN MANAGEMENT - FIXED ===
function hideAllScreens() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('highScoresModal').classList.add('hidden');
    document.getElementById('helpModal').classList.add('hidden');
}

function showScreen(screenId) {
    hideAllScreens();
    document.getElementById(screenId).classList.remove('hidden');
}

// === MAIN GAME FUNCTIONS ===
function startGame() {
    console.log('🎮 Starting FIXED House Head Chase...');
    
    // Hide all screens first
    hideAllScreens();
    
    // Get canvas
    gameState.canvas = document.getElementById('gameCanvas');
    if (!gameState.canvas) {
        console.error('❌ Canvas not found!');
        return;
    }
    
    gameState.ctx = gameState.canvas.getContext('2d');
    if (!gameState.ctx) {
        console.error('❌ Could not get canvas context!');
        return;
    }
    
    // Resize canvas to full screen
    resizeCanvas();
    
    // Show HUD and game elements
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('powerupIndicators').classList.remove('hidden');
    
    // Initialize game state
    gameState.running = true;
    gameState.startTime = Date.now();
    gameState.lastScoreUpdate = Date.now();
    
    // Reset player to center
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
        speedBoostTime: 0
    };
    
    // Reset game state
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
    
    console.log(`🔵 Player positioned at (${gameState.player.x}, ${gameState.player.y})`);
    
    // Show controls hint
    setTimeout(() => {
        const hint = document.getElementById('controlsHint');
        if (hint) {
            hint.classList.remove('hidden');
            setTimeout(() => hint.classList.add('hidden'), 4000);
        }
    }, 1000);
    
    // Setup input handlers
    setupInputHandlers();
    
    // Start game loop
    gameLoop();
    
    console.log(`🎮 FIXED Game started! Canvas: ${gameState.canvas.width}x${gameState.canvas.height}`);
}

function endGame() {
    gameState.running = false;
    
    const survivalTime = Math.floor((Date.now() - gameState.startTime) / 1000);
    
    // Save high score
    saveHighScore(survivalTime, gameState.level);
    
    // Update final score displays
    document.getElementById('finalScore').textContent = survivalTime;
    document.getElementById('finalTime').textContent = survivalTime;
    document.getElementById('finalLevel').textContent = gameState.level;
    
    // Also update share score
    const shareScore = document.getElementById('shareScore');
    if (shareScore) shareScore.textContent = survivalTime;
    
    // Hide game elements
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('powerupIndicators').classList.add('hidden');
    document.getElementById('flashlightIndicator').classList.add('hidden');
    document.getElementById('controlsHint').classList.add('hidden');
    
    // Show game over screen
    showScreen('gameOver');
    
    console.log('🎮 Game Over! Survival time:', survivalTime, 'seconds');
}

function restartGame() {
    console.log('🔄 Restarting game...');
    startGame();
}

function showStartScreen() {
    console.log('🏠 Showing start screen...');
    gameState.running = false;
    
    // Hide all game elements
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('powerupIndicators').classList.add('hidden');
    document.getElementById('flashlightIndicator').classList.add('hidden');
    document.getElementById('controlsHint').classList.add('hidden');
    
    // Show start screen
    showScreen('startScreen');
}

function showHighScores() {
    console.log('🏆 Showing high scores...');
    displayHighScores();
    showScreen('highScoresModal');
}

function closeHighScores() {
    console.log('🚫 Closing high scores...');
    closeModalReturnToStart();
}

function showHelp() {
    console.log('❓ Showing help...');
    showScreen('helpModal');
}

function closeHelp() {
    console.log('🚫 Closing help...');
    closeModalReturnToStart();
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
    
    if (gameState.running && gameState.player) {
        gameState.player.x = Math.min(gameState.player.x, canvas.width - gameState.player.size);
        gameState.player.y = Math.min(gameState.player.y, canvas.height - gameState.player.size - 100);
        constrainPlayer();
    }
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏠 COMPLETE FIXED House Head Chase - DOM Ready!');
    
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        console.log('🎯 Canvas pre-initialized:', canvas.width, 'x', canvas.height);
    }
    
    // Simple, direct button event listeners - no complex mapping
    console.log('🔗 Setting up button listeners...');
    
    // Start game button
    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) {
        startBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🎮 Start game clicked');
            startGame();
        });
        console.log('✅ Start game button attached');
    } else {
        console.error('❌ Start game button not found!');
    }
    
    // Restart game button
    const restartBtn = document.getElementById('restartGameBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔄 Restart game clicked');
            restartGame();
        });
        console.log('✅ Restart game button attached');
    }
    
    // Show start screen button
    const showStartBtn = document.getElementById('showStartScreenBtn');
    if (showStartBtn) {
        showStartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🏠 Show start screen clicked');
            goToStartScreen();
        });
        console.log('✅ Show start screen button attached');
    }
    
    // High scores buttons
    const showHighScoresBtn = document.getElementById('showHighScoresBtn');
    if (showHighScoresBtn) {
        showHighScoresBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🏆 Show high scores clicked');
            showHighScores();
        });
        console.log('✅ Show high scores button attached');
    } else {
        console.error('❌ Show high scores button not found!');
    }
    
    const closeHighScoresBtn = document.getElementById('closeHighScoresBtn');
    if (closeHighScoresBtn) {
        closeHighScoresBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🚫 Close high scores clicked');
            closeHighScores();
        });
        console.log('✅ Close high scores button attached');
    }
    
    const closeHighScoresFooterBtn = document.getElementById('closeHighScoresFooterBtn');
    if (closeHighScoresFooterBtn) {
        closeHighScoresFooterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🚫 Close high scores footer clicked');
            closeHighScores();
        });
        console.log('✅ Close high scores footer button attached');
    }
    
    // Help buttons
    const showHelpBtn = document.getElementById('showHelpBtn');
    if (showHelpBtn) {
        showHelpBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('❓ Show help clicked');
            showHelp();
        });
        console.log('✅ Show help button attached');
    } else {
        console.error('❌ Show help button not found!');
    }
    
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    if (closeHelpBtn) {
        closeHelpBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🚫 Close help clicked');
            closeHelp();
        });
        console.log('✅ Close help button attached');
    }
    
    const closeHelpFooterBtn = document.getElementById('closeHelpFooterBtn');
    if (closeHelpFooterBtn) {
        closeHelpFooterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🚫 Close help footer clicked');
            closeHelp();
        });
        console.log('✅ Close help footer button attached');
    }
    
    // Share buttons
    const shareScoreBtn = document.getElementById('shareScoreBtn');
    if (shareScoreBtn) {
        shareScoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📤 Share score clicked');
            showShareModal();
        });
        console.log('✅ Share score button attached');
    }
    
    const closeShareBtn = document.getElementById('closeShareBtn');
    if (closeShareBtn) {
        closeShareBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🚫 Close share clicked');
            closeShareModal();
        });
        console.log('✅ Close share button attached');
    }
    
    const closeShareFooterBtn = document.getElementById('closeShareFooterBtn');
    if (closeShareFooterBtn) {
        closeShareFooterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🚫 Close share footer clicked');
            closeShareModal();
        });
        console.log('✅ Close share footer button attached');
    }
    
    const shareTwitterBtn = document.getElementById('shareTwitterBtn');
    if (shareTwitterBtn) {
        shareTwitterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🐦 Share Twitter clicked');
            shareScore('twitter');
        });
        console.log('✅ Share Twitter button attached');
    }
    
    const shareFacebookBtn = document.getElementById('shareFacebookBtn');
    if (shareFacebookBtn) {
        shareFacebookBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📘 Share Facebook clicked');
            shareScore('facebook');
        });
        console.log('✅ Share Facebook button attached');
    }
    
    const copyScoreBtn = document.getElementById('copyScoreBtn');
    if (copyScoreBtn) {
        copyScoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📋 Copy score clicked');
            shareScore('copy');
        });
        console.log('✅ Copy score button attached');
    }
    
    // Audio toggle
    const audioToggle = document.getElementById('audioToggle');
    if (audioToggle) {
        audioToggle.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔊 Audio toggle clicked');
            soundSystem.toggle();
        });
        console.log('✅ Audio toggle button attached');
    }
    
    // PWA install buttons
    const installAppBtn = document.getElementById('installAppBtn');
    if (installAppBtn) {
        installAppBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📱 Install app clicked');
            installPWA();
        });
        console.log('✅ Install app button attached');
    }
    
    const dismissInstallBtn = document.getElementById('dismissInstallBtn');
    if (dismissInstallBtn) {
        dismissInstallBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('❌ Dismiss install clicked');
            hideInstallPrompt();
        });
        console.log('✅ Dismiss install button attached');
    }
    
    // Setup window event listeners
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));
    
    // Initialize PWA features
    setupPWAInstall();
    
    // Make sure start screen is visible initially
    goToStartScreen();
    
    console.log('🎮 ALL BUTTONS ATTACHED - GAME READY!');
    
    // Debug: Log all buttons found
    const allButtons = document.querySelectorAll('button');
    console.log(`🔍 Found ${allButtons.length} buttons total:`, Array.from(allButtons).map(btn => btn.id || btn.className));
});

console.log('✅ COMPLETE FIXED Game script with direct button handlers loaded!');
