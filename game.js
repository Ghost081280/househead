// House Head Chase - LOCAL-ONLY VERSION
console.log('🏠 House Head Chase - Loading LOCAL-ONLY VERSION...');

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
            console.log('⚠ Audio not supported');
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
            case 'freeze':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(440, this.context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(220, this.context.currentTime + 0.4);
                gainNode.gain.setValueAtTime(volume, this.context.currentTime);
                duration = 0.4;
                break;
            case 'bounce':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(200, this.context.currentTime);
                gainNode.gain.setValueAtTime(volume * 0.3, this.context.currentTime);
                duration = 0.1;
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

// === POWER-UP TYPES WITH BALANCED DISTRIBUTION ===
const PowerupTypes = {
    HEALTH: {
        name: 'Health Pack',
        emoji: '💚',
        color: '#44ff44',
        effect: 'health',
        value: 40,
        duration: 0,
        spawnWeight: 0.4
    },
    SHIELD: {
        name: 'Shield',
        emoji: '🛡️',
        color: '#4488ff',
        effect: 'shield',
        value: 0,
        duration: 7000,
        spawnWeight: 0.3
    },
    FREEZE: {
        name: 'House Freeze',
        emoji: '🧊',
        color: '#88ddff',
        effect: 'freeze',
        value: 0,
        duration: 9000,
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
        this.size = window.GameConfig?.ui?.powerupSize || 20;
        this.collected = false;
        this.spawnTime = Date.now();
        this.pulseOffset = Math.random() * Math.PI * 2;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.despawnTime = this.spawnTime + (window.GameConfig?.gameBalance?.powerups?.despawnTime || 18000);
        
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
        
        if (distance < this.size + gameState.player.size - 3) {
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
                
            case 'freeze':
                gameState.freezeTime = this.config.duration;
                gameState.activePowerups.push({
                    type: this.type,
                    timeLeft: this.config.duration
                });
                gameState.enemies.forEach(enemy => {
                    if (enemy.state === 'active') {
                        enemy.state = 'frozen';
                        enemy.frozenUntil = Date.now() + this.config.duration;
                        enemy.velocity.x = 0;
                        enemy.velocity.y = 0;
                    }
                });
                soundSystem.play('freeze');
                console.log(`🧊 House Freeze activated for ${this.config.duration/1000}s`);
                break;
        }
        
        gameState.powerupStats = gameState.powerupStats || {};
        gameState.powerupStats[this.type] = (gameState.powerupStats[this.type] || 0) + 1;
    }

    draw() {
        if (this.collected) return;
        
        const ctx = gameState.ctx;
        const currentTime = Date.now();
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const floatY = Math.sin(currentTime * 0.003 + this.floatOffset) * 4;
        ctx.translate(0, floatY);
        
        const pulse = 0.85 + Math.sin(currentTime * 0.008 + this.pulseOffset) * 0.25;
        ctx.scale(pulse, pulse);
        
        ctx.shadowColor = this.config.color;
        ctx.shadowBlur = 18;
        
        ctx.fillStyle = this.config.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.font = `${this.size * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        switch (this.type) {
            case 'HEALTH':
                const crossSize = this.size * 0.5;
                ctx.fillRect(-crossSize * 0.2, -crossSize, crossSize * 0.4, crossSize * 2);
                ctx.fillRect(-crossSize, -crossSize * 0.2, crossSize * 2, crossSize * 0.4);
                break;
            case 'SHIELD':
                ctx.beginPath();
                ctx.moveTo(0, -this.size * 0.6);
                ctx.lineTo(this.size * 0.5, -this.size * 0.3);
                ctx.lineTo(this.size * 0.5, this.size * 0.3);
                ctx.lineTo(0, this.size * 0.6);
                ctx.lineTo(-this.size * 0.5, this.size * 0.3);
                ctx.lineTo(-this.size * 0.5, -this.size * 0.3);
                ctx.closePath();
                ctx.fill();
                break;
            case 'FREEZE':
                const iceSize = this.size * 0.4;
                ctx.fillStyle = '#000';
                ctx.fillRect(-iceSize, -iceSize * 0.15, iceSize * 2, iceSize * 0.3);
                ctx.fillRect(-iceSize, -iceSize * 0.15 + iceSize * 0.6, iceSize * 2, iceSize * 0.3);
                ctx.fillRect(-iceSize, -iceSize * 0.15 + iceSize * 1.2, iceSize * 2, iceSize * 0.3);
                ctx.fillRect(-iceSize * 0.15, -iceSize, iceSize * 0.3, iceSize * 2);
                ctx.fillRect(-iceSize * 0.7, -iceSize * 0.7, iceSize * 0.4, iceSize * 1.4);
                ctx.fillRect(iceSize * 0.3, -iceSize * 0.7, iceSize * 0.4, iceSize * 1.4);
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
        size: 18,
        health: 100,
        maxHealth: 100,
        speed: 3.8,
        baseSpeed: 3.8,
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
        shieldTime: 0,
        speedBoostTime: 0,
        velocity: { x: 0, y: 0 }
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
    freezeTime: 0,
    score: 0,
    level: 1,
    startTime: 0,
    lastEnemySpawn: 0,
    lastPowerupSpawn: 0,
    lastScoreUpdate: 0,
    spawnRate: 5500,
    powerupSpawnRate: 8000,
    input: {
        lastTap: 0,
        doubleTapDelay: 300
    },
    camera: {
        shake: 0,
        intensity: 0
    },
    difficulty: 1,
    totalEnemiesSpawned: 0,
    collisionGrid: new Map(),
    powerupStats: {},
    lastPowerupType: null,
    powerupRotationIndex: 0
};

// === ENEMY TYPES ===
const EnemyTypes = {
    SMALL: {
        name: 'Small House',
        size: 25,
        speed: 0.7,
        damage: 10,
        spawnWeight: 0.8,
        color: '#4a3a2a',
        activationTime: 3000,
        wanderRadius: 100,
        huntRadius: 180
    },
    BIG: {
        name: 'Big House',
        size: 40,
        speed: 0.4,
        damage: 18,
        spawnWeight: 0.2,
        color: '#3a2a1a',
        activationTime: 4500,
        wanderRadius: 80,
        huntRadius: 200
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
        
        const levelModifiers = window.GameConfig?.utils?.getLevelModifiers(gameState.level) || {
            speedMultiplier: 1,
            damageMultiplier: 1
        };
        
        this.baseSpeed = this.config.speed * (0.8 + Math.random() * 0.4) * levelModifiers.speedMultiplier;
        this.speed = this.baseSpeed;
        this.damage = Math.floor(this.config.damage * levelModifiers.damageMultiplier);
        this.color = this.config.color;
        
        this.state = 'spawning';
        this.spawnTime = Date.now();
        this.activationTime = this.config.activationTime + (Math.random() * 1500);
        this.legs = [];
        this.windowGlow = 0.5 + Math.random() * 0.5;
        this.lastDamageTime = 0;
        this.isVisible = false;
        this.frozenUntil = 0;
        
        this.aiState = 'wander';
        this.wanderTarget = { x: this.x, y: this.y };
        this.wanderTime = 0;
        this.lastWanderUpdate = 0;
        this.velocity = { x: 0, y: 0 };
        this.separationRadius = this.size * 2.5;
        this.lastPlayerSeen = 0;
        this.alertRadius = this.config.huntRadius;
        
        this.mass = this.type === 'BIG' ? 2 : 1;
        this.bounceVelocity = { x: 0, y: 0 };
        this.frictionCoeff = 0.96;
        
        for (let i = 0; i < 6; i++) {
            this.legs.push({
                angle: (i / 6) * Math.PI * 2,
                length: this.size * 0.8,
                offset: Math.random() * Math.PI * 2,
                speed: 0.08 + Math.random() * 0.08
            });
        }
        
        console.log(`🏠 ${this.config.name} spawned at (${Math.floor(x)}, ${Math.floor(y)}) - Level ${gameState.level} modifiers applied`);
    }

    update() {
        const currentTime = Date.now();
        
        if (this.state === 'spawning') {
            if (currentTime - this.spawnTime > 1200) {
                this.state = 'dormant';
                soundSystem.play('spawn', 180, 0.3, 0.2);
            }
        } else if (this.state === 'dormant') {
            if (currentTime - this.spawnTime > this.activationTime) {
                this.state = 'active';
                console.log(`🦵 ${this.config.name} grew legs! Now hunting...`);
            }
        } else if (this.state === 'frozen') {
            if (currentTime > this.frozenUntil) {
                this.state = 'active';
                console.log(`🔥 ${this.config.name} thawed out! Back to hunting...`);
            }
        }
        
        if (this.state === 'active') {
            this.updateAI();
            this.updatePhysics();
            this.updateLegs();
        }
        
        this.updateVisibility();
        this.windowGlow = 0.5 + Math.sin(currentTime * 0.003 + this.x * 0.01) * 0.3;
        
        return true;
    }

    updateAI() {
        const currentTime = Date.now();
        const playerX = gameState.player.x;
        const playerY = gameState.player.y;
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
        
        if (gameState.flashlight.on && gameState.flashlight.intensity > 0.5) {
            if (distanceToPlayer < this.alertRadius * 0.8) {
                this.aiState = 'hunt';
                this.lastPlayerSeen = currentTime;
            } else if (currentTime - this.lastPlayerSeen < 2000) {
                this.aiState = 'hunt';
            } else {
                this.aiState = 'wander';
            }
        } else {
            if (distanceToPlayer < 40) {
                this.aiState = 'hunt';
            } else {
                this.aiState = 'wander';
            }
        }
        
        switch (this.aiState) {
            case 'hunt':
                this.huntPlayer();
                break;
            case 'wander':
                this.wanderAI();
                break;
        }
        
        this.applySeparation();
        this.applyBoundaryForces();
    }

    huntPlayer() {
        const dx = gameState.player.x - this.x;
        const dy = gameState.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const huntSpeed = this.baseSpeed * gameState.difficulty * 0.9;
            const randomOffset = (Math.random() - 0.5) * 0.5;
            const moveX = (dx / distance) * huntSpeed + randomOffset;
            const moveY = (dy / distance) * huntSpeed + randomOffset;
            
            this.velocity.x += moveX * 0.25;
            this.velocity.y += moveY * 0.25;
        }
    }

    wanderAI() {
        const currentTime = Date.now();
        
        if (currentTime - this.lastWanderUpdate > 1500 + Math.random() * 2500) {
            const angle = Math.random() * Math.PI * 2;
            const distance = this.config.wanderRadius * (0.4 + Math.random() * 0.6);
            
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
            const wanderSpeed = this.baseSpeed * 0.4;
            this.velocity.x += (dx / distance) * wanderSpeed * 0.15;
            this.velocity.y += (dy / distance) * wanderSpeed * 0.15;
        }
    }

    applySeparation() {
        const separationForce = { x: 0, y: 0 };
        let neighborCount = 0;
        
        gameState.enemies.forEach(other => {
            if (other === this) return;
            
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.separationRadius && distance > 0) {
                const force = (this.separationRadius - distance) / this.separationRadius;
                separationForce.x += (dx / distance) * force * 1.5;
                separationForce.y += (dy / distance) * force * 1.5;
                neighborCount++;
            }
        });
        
        if (neighborCount > 0) {
            this.velocity.x += separationForce.x * 0.4;
            this.velocity.y += separationForce.y * 0.4;
        }
    }

    applyBoundaryForces() {
        const margin = 100;
        const forceStrength = 0.4;
        
        if (this.x < margin) {
            this.velocity.x += forceStrength * (margin - this.x) / margin;
        }
        if (this.x > gameState.canvas.width - margin) {
            this.velocity.x -= forceStrength * (this.x - (gameState.canvas.width - margin)) / margin;
        }
        if (this.y < margin + 80) {
            this.velocity.y += forceStrength * ((margin + 80) - this.y) / margin;
        }
        if (this.y > gameState.canvas.height - margin) {
            this.velocity.y -= forceStrength * (this.y - (gameState.canvas.height - margin)) / margin;
        }
    }

    updatePhysics() {
        this.velocity.x *= this.frictionCoeff;
        this.velocity.y *= this.frictionCoeff;
        
        const maxVelocity = this.baseSpeed * 1.8;
        const velocityMag = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (velocityMag > maxVelocity) {
            this.velocity.x = (this.velocity.x / velocityMag) * maxVelocity;
            this.velocity.y = (this.velocity.y / velocityMag) * maxVelocity;
        }
        
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
        this.x = Math.max(this.size, Math.min(gameState.canvas.width - this.size, this.x));
        this.y = Math.max(this.size + 80, Math.min(gameState.canvas.height - this.size, this.y));
        
        this.checkPlayerCollision();
        this.checkEnemyCollisions();
    }

    checkPlayerCollision() {
        const dx = gameState.player.x - this.x;
        const dy = gameState.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = this.size + gameState.player.size;
        
        if (distance < minDistance) {
            if (gameState.player.shieldTime <= 0) {
                this.damagePlayer();
            }
            
            if (distance > 0) {
                const overlap = minDistance - distance;
                const separationX = (dx / distance) * overlap * 0.5;
                const separationY = (dy / distance) * overlap * 0.5;
                
                this.x -= separationX * 0.8;
                this.y -= separationY * 0.8;
                
                if (gameState.player.shieldTime <= 0) {
                    gameState.player.x += separationX * 0.2;
                    gameState.player.y += separationY * 0.2;
                }
                
                this.velocity.x -= (dx / distance) * 1.5;
                this.velocity.y -= (dy / distance) * 1.5;
                
                soundSystem.play('bounce', 150, 0.1, 0.2);
            }
        }
    }

    checkEnemyCollisions() {
        gameState.enemies.forEach(other => {
            if (other === this) return;
            
            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = this.size + other.size;
            
            if (distance < minDistance && distance > 0) {
                const overlap = minDistance - distance;
                const separationX = (dx / distance) * overlap * 0.5;
                const separationY = (dy / distance) * overlap * 0.5;
                
                this.x -= separationX;
                this.y -= separationY;
                other.x += separationX;
                other.y += separationY;
                
                const totalMass = this.mass + other.mass;
                const velocityExchange = 1.2;
                
                const thisVelX = ((this.mass - other.mass) * this.velocity.x + 2 * other.mass * other.velocity.x) / totalMass;
                const thisVelY = ((this.mass - other.mass) * this.velocity.y + 2 * other.mass * other.velocity.y) / totalMass;
                const otherVelX = ((other.mass - this.mass) * other.velocity.x + 2 * this.mass * this.velocity.x) / totalMass;
                const otherVelY = ((other.mass - this.mass) * other.velocity.y + 2 * this.mass * this.velocity.y) / totalMass;
                
                this.velocity.x = thisVelX * velocityExchange;
                this.velocity.y = thisVelY * velocityExchange;
                other.velocity.x = otherVelX * velocityExchange;
                other.velocity.y = otherVelY * velocityExchange;
            }
        });
    }

    updateLegs() {
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        const legSpeed = 0.08 + speed * 0.015;
        
        this.legs.forEach(leg => {
            leg.offset += legSpeed;
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
        if (currentTime - this.lastDamageTime > 1800) {
            gameState.player.health -= this.damage;
            this.lastDamageTime = currentTime;
            gameState.camera.shake = 8;
            gameState.camera.intensity = 6;
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
        } else if (this.state === 'frozen') {
            this.drawFrozenHouse();
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
        const progress = Math.min((Date.now() - this.spawnTime) / 1200, 1);
        const currentSize = this.size * progress;
        
        ctx.fillStyle = this.color;
        ctx.globalAlpha = progress;
        ctx.fillRect(-currentSize/2, -currentSize/2, currentSize, currentSize * 0.8);
        ctx.globalAlpha = 1;
    }

    drawFrozenHouse() {
        const ctx = gameState.ctx;
        const size = this.size;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-size/2 + 2, -size/2 + 2, size, size * 0.8);
        
        const gradient = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
        gradient.addColorStop(0, '#6699cc');
        gradient.addColorStop(0.5, '#4488bb');
        gradient.addColorStop(1, '#2266aa');
        ctx.fillStyle = gradient;
        ctx.fillRect(-size/2, -size/2, size, size * 0.8);
        
        ctx.strokeStyle = '#88ddff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-size/2, -size/2, size, size * 0.8);
        
        const roofGradient = ctx.createLinearGradient(0, -size, 0, -size/2);
        roofGradient.addColorStop(0, '#4488bb');
        roofGradient.addColorStop(1, '#2266aa');
        ctx.fillStyle = roofGradient;
        ctx.beginPath();
        ctx.moveTo(-size/2 - 4, -size/2);
        ctx.lineTo(0, -size);
        ctx.lineTo(size/2 + 4, -size/2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        const eyeSize = size / (this.type === 'BIG' ? 6 : 8);
        
        ctx.shadowColor = '#88ddff';
        ctx.shadowBlur = 4;
        ctx.fillStyle = 'rgba(136, 221, 255, 0.3)';
        
        ctx.fillRect(-size/3, -size/4, eyeSize, eyeSize);
        ctx.fillRect(size/6, -size/4, eyeSize, eyeSize);
        
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#88ddff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-size/3, -size/4, eyeSize, eyeSize);
        ctx.strokeRect(size/6, -size/4, eyeSize, eyeSize);
        
        ctx.fillStyle = '#4488bb';
        const doorWidth = this.type === 'BIG' ? size/3 : size/4;
        const doorHeight = size/4;
        ctx.fillRect(-doorWidth/2, size/6, doorWidth, doorHeight);
        ctx.strokeStyle = '#88ddff';
        ctx.strokeRect(-doorWidth/2, size/6, doorWidth, doorHeight);
        
        ctx.fillStyle = '#88ddff';
        ctx.beginPath();
        ctx.arc(doorWidth/3, size/6 + doorHeight/2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.7;
        
        const crystalTime = Date.now() * 0.002;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + crystalTime;
            const x = Math.cos(angle) * (size * 0.3);
            const y = Math.sin(angle) * (size * 0.2);
            
            ctx.fillRect(x - 1, y - 1, 2, 2);
        }
        
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
        
        const glowColor = this.aiState === 'hunt' ? '#ffaa88' : '#ffff88';
        const glowMultiplier = this.aiState === 'hunt' ? 1.1 : 1.0;
        
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 6 * glowMultiplier;
        ctx.fillStyle = `rgba(255, 255, 136, ${glowIntensity * glowMultiplier})`;
        
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

// === SHARE MODAL FUNCTIONS ===
function showShareModal() {
    console.log('📤 Showing share modal...');
    
    const survivalTime = getCurrentSurvivalTime();
    const level = gameState ? gameState.level : 1;
    const timeFormatted = formatTime(survivalTime);
    
    const shareTimeEl = document.getElementById('shareTimeValue');
    const shareLevelEl = document.getElementById('shareLevelValue');
    const copyPreview = document.getElementById('copyPreviewText');
    
    if (shareTimeEl) shareTimeEl.textContent = timeFormatted;
    if (shareLevelEl) shareLevelEl.textContent = level;
    
    const copyText = `🏠 I survived ${timeFormatted} and reached level ${level} in House Head Chase! Can you beat my score?

Play now: https://your-github-username.github.io/house-head-chase/`;
    
    if (copyPreview) copyPreview.textContent = copyText;
    
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.pointerEvents = 'auto';
        console.log('✅ Share modal displayed');
    } else {
        console.error('⚠️ Share modal not found in DOM');
    }
}

function closeShareModal() {
    console.log('🚫 Closing share modal...');
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.pointerEvents = 'none';
    }
}

function shareToX() {
    console.log('🐦 Sharing to X...');
    const survivalTime = getCurrentSurvivalTime();
    const level = gameState ? gameState.level : 1;
    const message = `🏠 I survived ${formatTime(survivalTime)} and reached level ${level} in House Head Chase! Can you beat my score?`;
    const url = 'https://your-github-username.github.io/house-head-chase/';
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

function shareToFacebook() {
    console.log('📘 Sharing to Facebook...');
    const url = 'https://your-github-username.github.io/house-head-chase/';
    const survivalTime = getCurrentSurvivalTime();
    const level = gameState ? gameState.level : 1;
    const message = `🏠 I survived ${formatTime(survivalTime)} and reached level ${level} in House Head Chase! Can you beat my score?`;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

function copyScoreToClipboard() {
    console.log('📋 Copying to clipboard...');
    const survivalTime = getCurrentSurvivalTime();
    const level = gameState ? gameState.level : 1;
    const message = `🏠 I survived ${formatTime(survivalTime)} and reached level ${level} in House Head Chase! Can you beat my score?

Play now: https://your-github-username.github.io/house-head-chase/`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message).then(() => {
            showCopyConfirmation();
        }).catch((err) => {
            console.error('Clipboard API failed, using fallback:', err);
            fallbackCopyToClipboard(message);
        });
    } else {
        fallbackCopyToClipboard(message);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopyConfirmation();
        } else {
            console.error('Fallback copy failed');
            alert('Copy failed. Please copy manually.');
        }
    } catch (err) {
        console.error('Fallback copy error:', err);
        alert('Copy failed. Please copy manually.');
    } finally {
        document.body.removeChild(textArea);
    }
}

function showCopyConfirmation() {
    const copyButtons = document.querySelectorAll('.share-btn');
    let btn = null;
    
    copyButtons.forEach(button => {
        if (button.textContent.includes('Copy')) {
            btn = button;
        }
    });
    
    if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="share-icon">✅</span>Copied!';
        btn.disabled = true;
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 2000);
    }
    console.log('✅ Text copied to clipboard');
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
    const config = window.GameConfig?.gameBalance?.enemies;
    
    if (!config) return;
    
    const levelModifiers = window.GameConfig.utils.getLevelModifiers(gameState.level);
    const adjustedSpawnRate = gameState.spawnRate * levelModifiers.spawnRateMultiplier;
    
    if (currentTime - gameState.lastEnemySpawn < adjustedSpawnRate) return;
    
    const maxEnemies = window.GameConfig.performance.maxEnemies || 15;
    if (gameState.enemies.length >= maxEnemies) return;
    
    const rand = Math.random();
    let bigHouseChance = Math.min(0.15 + (gameState.level - 1) * 0.03, 0.35);
    
    if (window.GameConfig.isMobile) {
        bigHouseChance *= 0.7;
    }
    
    const enemyType = rand < bigHouseChance ? 'BIG' : 'SMALL';
    
    let x, y;
    let attempts = 0;
    let validPosition = false;
    
    do {
        const spawnMargin = 140;
        const centerAvoidanceRadius = Math.min(250, Math.max(gameState.canvas.width, gameState.canvas.height) * 0.3);
        
        const angle = Math.random() * Math.PI * 2;
        const distance = spawnMargin + Math.random() * (centerAvoidanceRadius - spawnMargin);
        const centerX = gameState.canvas.width / 2;
        const centerY = gameState.canvas.height / 2;
        
        x = centerX + Math.cos(angle) * distance;
        y = centerY + Math.sin(angle) * distance;
        
        x = Math.max(80, Math.min(gameState.canvas.width - 80, x));
        y = Math.max(150, Math.min(gameState.canvas.height - 80, y));
        
        const playerDistance = Math.sqrt(
            Math.pow(x - gameState.player.x, 2) + Math.pow(y - gameState.player.y, 2)
        );
        
        let tooCloseToOthers = false;
        const minEnemyDistance = 120;
        
        for (const enemy of gameState.enemies) {
            const enemyDistance = Math.sqrt(
                Math.pow(x - enemy.x, 2) + Math.pow(y - enemy.y, 2)
            );
            if (enemyDistance < minEnemyDistance) {
                tooCloseToOthers = true;
                break;
            }
        }
        
        validPosition = playerDistance > 220 && !tooCloseToOthers;
        attempts++;
    } while (!validPosition && attempts < 30);
    
    const enemy = new Enemy(x, y, enemyType);
    gameState.enemies.push(enemy);
    gameState.totalEnemiesSpawned++;
    gameState.lastEnemySpawn = currentTime;
    
    const baseSpawnRate = config.spawnRate.base;
    gameState.spawnRate = Math.max(config.spawnRate.minimum, 
        baseSpawnRate - (gameState.level - 1) * 200);
    
    console.log(`👻 Enemy spawned: ${enemyType}. Total: ${gameState.enemies.length}, Level: ${gameState.level}`);
}

function spawnPowerup() {
    const currentTime = Date.now();
    const config = window.GameConfig?.gameBalance?.powerups;
    
    if (!config) return;
    
    if (currentTime - gameState.lastPowerupSpawn < gameState.powerupSpawnRate) return;
    
    const maxPowerups = window.GameConfig.performance.maxPowerups || 6;
    if (gameState.powerups.length >= maxPowerups) return;
    
    const powerupKeys = Object.keys(PowerupTypes);
    let powerupType;
    
    const stats = gameState.powerupStats || {};
    const totalCollected = Object.values(stats).reduce((sum, count) => sum + count, 0);
    
    if (totalCollected < 6) {
        powerupType = powerupKeys[gameState.powerupRotationIndex % powerupKeys.length];
        gameState.powerupRotationIndex++;
    } else {
        const healthCount = stats.HEALTH || 0;
        const shieldCount = stats.SHIELD || 0;
        const freezeCount = stats.FREEZE || 0;
        
        const counts = { HEALTH: healthCount, SHIELD: shieldCount, FREEZE: freezeCount };
        const minCount = Math.min(...Object.values(counts));
        const leastCollected = Object.keys(counts).filter(key => counts[key] === minCount);
        
        if (Math.random() < 0.7) {
            powerupType = leastCollected[Math.floor(Math.random() * leastCollected.length)];
        } else {
            powerupType = powerupKeys[Math.floor(Math.random() * powerupKeys.length)];
        }
    }
    
    let x, y;
    let attempts = 0;
    let playerDistance = 0;
    let tooCloseToEnemy = false;
    
    do {
        const margin = 120;
        x = margin + Math.random() * (gameState.canvas.width - margin * 2);
        y = margin + Math.random() * (gameState.canvas.height - margin * 2);
        
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
        if (attempts > 25) break;
    } while ((playerDistance < 80 || tooCloseToEnemy) && attempts < 25);
    
    const powerup = new Powerup(x, y, powerupType);
    gameState.powerups.push(powerup);
    gameState.lastPowerupSpawn = currentTime;
    
    gameState.powerupSpawnRate = Math.max(6000, config.spawnRate - (gameState.level - 1) * 150);
    
    console.log(`⚡ Powerup spawned: ${powerupType}. Total: ${gameState.powerups.length}. Stats:`, gameState.powerupStats);
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
    
    if (gameState.freezeTime > 0) {
        gameState.freezeTime -= 16;
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
    
    const config = window.GameConfig?.gameBalance?.scoring;
    const levelThreshold = config?.levelUpThreshold || 50;
    const newLevel = Math.floor(gameState.score / levelThreshold) + 1;
    
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameState.difficulty = 1 + (gameState.level - 1) * (config?.difficultyScaling || 0.08);
        soundSystem.play('levelup');
        showLevelUpEffect();
        
        const levelModifiers = window.GameConfig.utils.getLevelModifiers(gameState.level);
        console.log(`🎊 Level up! Now level ${gameState.level} (Difficulty: ${gameState.difficulty.toFixed(2)}, Modifiers:`, levelModifiers, ')');
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
    
    if (distance < gameState.player.size + 25) {
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
    
    if (distance < gameState.player.size + 25) {
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
    const levelEl = document.getElementById('level');
    
    if (healthEl) healthEl.textContent = health;
    if (healthFillEl) healthFillEl.style.width = (health / gameState.player.maxHealth * 100) + '%';
    if (levelEl) levelEl.textContent = gameState.level;
    
    const survivalTime = getCurrentSurvivalTime();
    const survivalTimeEl = document.getElementById('survivalTime');
    if (survivalTimeEl) {
        survivalTimeEl.textContent = formatTime(survivalTime);
    }
    
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
                font-size: 22px;
                pointer-events: none;
                z-index: 8000;
                animation: powerupMessageFloat 1.8s ease-out forwards;
                font-family: 'Orbitron', monospace;
                text-shadow: 0 0 12px #44ff44;
                background: rgba(0, 0, 0, 0.8);
                padding: 10px 18px;
                border-radius: 25px;
                border: 2px solid #44ff44;
            }
            @keyframes powerupMessageFloat {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                20% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
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
    }, 1800);
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
                font-size: 20px;
                pointer-events: none;
                z-index: 8000;
                animation: damageFloat 1.0s ease-out forwards;
                font-family: 'Orbitron', monospace;
                text-shadow: 0 0 10px #ff4444;
            }
            @keyframes damageFloat {
                0% { transform: translateY(0); opacity: 1; }
                100% { transform: translateY(-50px); opacity: 0; }
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
    }, 1000);
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
                background: linear-gradient(45deg, rgba(255, 68, 68, 0.95), rgba(255, 136, 68, 0.95));
                color: white;
                padding: 25px;
                border-radius: 15px;
                text-align: center;
                font-family: 'Orbitron', monospace;
                font-weight: bold;
                z-index: 8000;
                animation: levelUpPulse 2.5s ease-out;
                backdrop-filter: blur(15px);
                border: 3px solid #ff4444;
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
        <p>Enemies getting tougher - you got this!</p>
    `;
    
    document.body.appendChild(levelDiv);
    
    setTimeout(() => {
        if (document.body.contains(levelDiv)) {
            document.body.removeChild(levelDiv);
        }
    }, 2500);
}

// === SCREEN MANAGEMENT ===
function hideAllScreens() {
    console.log('🚫 Hiding all screens...');
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('highScoresModal').classList.add('hidden');
    document.getElementById('helpModal').classList.add('hidden');
    
    const shareModal = document.getElementById('shareModal');
    if (shareModal) shareModal.classList.add('hidden');
}

function showScreen(screenId) {
    console.log(`📺 Showing screen: ${screenId}`);
    hideAllScreens();
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.remove('hidden');
    } else {
        console.error(`⚠ Screen not found: ${screenId}`);
    }
}

// === LOCAL HIGH SCORES SYSTEM ===
function saveHighScore(survivalTime, level) {
    console.log(`💾 Saving high score: ${survivalTime}s, level ${level}`);
    
    if (!window.GameConfig?.localStorage?.available) {
        console.warn('⚠️ Local storage not available');
        return false;
    }
    
    let highScores = [];
    try {
        const stored = window.GameConfig.utils.loadFromLocal('highScores', []);
        if (stored) {
            highScores = stored;
        }
    } catch (e) {
        console.error('Error loading high scores:', e);
    }
    
    const playerName = window.GameConfig?.utils?.generatePlayerName() || 'Anonymous Player';
    
    const newScore = {
        playerName: playerName,
        survivalTime: survivalTime,
        level: level,
        date: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    highScores.push(newScore);
    highScores.sort((a, b) => b.survivalTime - a.survivalTime);
    highScores = highScores.slice(0, 10);
    
    try {
        window.GameConfig.utils.saveToLocal('highScores', highScores);
        console.log('✅ High score saved locally');
        return true;
    } catch (e) {
        console.error('Error saving high scores:', e);
        return false;
    }
}

function displayHighScores() {
    console.log('📊 Displaying high scores...');
    
    const listContainer = document.getElementById('highScoresList');
    if (!listContainer) {
        console.error('⚠ High scores list container not found');
        return;
    }
    
    let highScores = [];
    try {
        highScores = window.GameConfig?.utils?.loadFromLocal('highScores', []) || [];
    } catch (e) {
        console.error('Error loading high scores:', e);
    }
    
    if (highScores.length === 0) {
        listContainer.innerHTML = '<p style="color: #888; text-align: center;">No local scores yet. Play to set your first record!</p>';
        return;
    }
    
    let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
    highScores.forEach((score, index) => {
        const date = new Date(score.date);
        const dateStr = date.toLocaleDateString();
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
        const playerName = score.playerName || 'Anonymous Player';
        const survivalTime = score.survivalTime || 0;
        
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; 
                        padding: 10px; background: rgba(255, 68, 68, 0.1); 
                        border: 1px solid rgba(255, 68, 68, 0.3); border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px; min-width: 30px;">${medal}</span>
                    <div>
                        <div style="font-weight: bold; color: #ff4444;">
                            ${playerName}
                        </div>
                        <div style="font-size: 12px; color: #888;">
                            Time: ${formatTime(survivalTime)} • Level ${score.level} • ${dateStr}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    listContainer.innerHTML = html;
}

// === PWA FUNCTIONS ===
let deferredPrompt;

function setupPWAInstall() {
    console.log('📱 Setting up PWA install...');
    
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('📱 Install prompt available');
        e.preventDefault();
        deferredPrompt = e;
        
        const installPrompt = document.getElementById('installPrompt');
        if (installPrompt) {
            installPrompt.classList.remove('hidden');
        }
        
        setTimeout(() => {
            showInstallHint();
        }, 10000);
    });
    
    window.addEventListener('appinstalled', (e) => {
        console.log('✅ PWA installed successfully');
        hideInstallPrompt();
        
        if (typeof showPowerupMessage === 'function') {
            showPowerupMessage('📱 App Installed! Play offline anytime!');
        }
        
        deferredPrompt = null;
    });
    
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
        console.log('📱 Already running as installed app');
        hideInstallPrompt();
    }
}

function installPWA() {
    if (!deferredPrompt) {
        console.log('⚠ Install prompt not available');
        showManualInstallInstructions();
        return;
    }
    
    console.log('📱 Showing install prompt...');
    deferredPrompt.prompt();
    
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('✅ User accepted install prompt');
        } else {
            console.log('⚠ User dismissed install prompt');
        }
        deferredPrompt = null;
        hideInstallPrompt();
    });
}

function hideInstallPrompt() {
    const installPrompt = document.getElementById('installPrompt');
    if (installPrompt) {
        installPrompt.classList.add('hidden');
    }
}

function showInstallHint() {
    if (deferredPrompt && gameState.running) {
        if (typeof showPowerupMessage === 'function') {
            showPowerupMessage('📱 Add to home screen for better experience!');
        }
    }
}

function showManualInstallInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let instructions = '';
    
    if (isIOS) {
        instructions = 'On iOS: Tap the Share button (square with arrow) in Safari, then "Add to Home Screen"';
    } else if (isAndroid) {
        instructions = 'On Android: Tap the menu (⋮) in Chrome, then "Add to Home screen" or "Install app"';
    } else {
        instructions = 'Look for the install icon (⊕) in your browser\'s address bar, or check the menu for "Install" option';
    }
    
    alert('📱 Install House Head Chase as an app!\n\n' + instructions);
}

// === NAVIGATION HELPER FUNCTIONS ===
function goToStartScreen() {
    console.log('🏠 Going to start screen...');
    gameState.running = false;
    
    if (gameState.canvas) {
        gameState.canvas.classList.remove('active');
        gameState.canvas.style.pointerEvents = 'none';
    }
    
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('powerupIndicators').classList.add('hidden');
    document.getElementById('flashlightIndicator').classList.add('hidden');
    document.getElementById('controlsHint').classList.add('hidden');
    
    showScreen('startScreen');
}

function closeModalReturnToStart() {
    console.log('🏠 Closing modal and returning to start...');
    showScreen('startScreen');
}

// === MAIN GAME FUNCTIONS ===
function startGame() {
    console.log('🎮 Starting House Head Chase...');
    
    hideAllScreens();
    
    gameState.canvas = document.getElementById('gameCanvas');
    if (!gameState.canvas) {
        console.error('⚠ Canvas not found!');
        return;
    }
    
    gameState.ctx = gameState.canvas.getContext('2d');
    if (!gameState.ctx) {
        console.error('⚠ Could not get canvas context!');
        return;
    }
    
    resizeCanvas();
    
    gameState.canvas.classList.add('active');
    gameState.canvas.style.pointerEvents = 'auto';
    
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('powerupIndicators').classList.remove('hidden');
    
    gameState.running = true;
    gameState.startTime = Date.now();
    gameState.lastScoreUpdate = Date.now();
    
    const config = window.GameConfig?.gameBalance;
    gameState.player = {
        x: gameState.canvas.width / 2,
        y: gameState.canvas.height / 2,
        size: 18,
        health: config?.player?.startingHealth || 100,
        maxHealth: config?.player?.maxHealth || 100,
        speed: config?.player?.baseSpeed || 3.8,
        baseSpeed: config?.player?.baseSpeed || 3.8,
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
        shieldTime: 0,
        speedBoostTime: 0,
        velocity: { x: 0, y: 0 }
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
    gameState.freezeTime = 0;
    gameState.camera.shake = 0;
    gameState.camera.intensity = 0;
    gameState.totalEnemiesSpawned = 0;
    gameState.powerupStats = {};
    gameState.powerupRotationIndex = 0;
    
    gameState.spawnRate = config?.enemies?.spawnRate?.base || 5500;
    gameState.powerupSpawnRate = config?.powerups?.spawnRate || 8000;
    
    console.log(`🔵 Player positioned at (${gameState.player.x}, ${gameState.player.y})`);
    console.log('⚖️ Balanced difficulty settings applied');
    
    setTimeout(() => {
        const hint = document.getElementById('controlsHint');
        if (hint) {
            hint.classList.remove('hidden');
            setTimeout(() => hint.classList.add('hidden'), 5000);
        }
    }, 1000);
    
    setupInputHandlers();
    gameLoop();
    
    console.log(`🎮 Game started! Canvas: ${gameState.canvas.width}x${gameState.canvas.height}`);
}

function endGame() {
    gameState.running = false;
    
    if (gameState.canvas) {
        gameState.canvas.classList.remove('active');
        gameState.canvas.style.pointerEvents = 'none';
    }
    
    const survivalTime = Math.floor((Date.now() - gameState.startTime) / 1000);
    const level = gameState.level;
    
    saveHighScore(survivalTime, level);
    
    document.getElementById('finalTime').textContent = formatTime(survivalTime);
    document.getElementById('finalLevel').textContent = level;
    
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('powerupIndicators').classList.add('hidden');
    document.getElementById('flashlightIndicator').classList.add('hidden');
    document.getElementById('controlsHint').classList.add('hidden');
    
    showScreen('gameOver');
    
    console.log(`🎮 Game Over! Survival time: ${formatTime(survivalTime)}, Level: ${level}`);
    console.log('📊 Power-up distribution:', gameState.powerupStats);
}

function restartGame() {
    console.log('🔄 Restarting game...');
    startGame();
}

function showStartScreen() {
    goToStartScreen();
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

// === GLOBAL FUNCTION ASSIGNMENTS ===
window.startGame = startGame;
window.restartGame = restartGame;
window.goToStartScreen = goToStartScreen;
window.showHighScores = showHighScores;
window.closeHighScores = closeHighScores;
window.showHelp = showHelp;
window.closeHelp = closeHelp;
window.showShareModal = showShareModal;
window.closeShareModal = closeShareModal;
window.shareToX = shareToX;
window.shareToFacebook = shareToFacebook;
window.copyScoreToClipboard = copyScoreToClipboard;
window.soundSystem = soundSystem;
window.gameState = gameState;
window.getCurrentSurvivalTime = getCurrentSurvivalTime;
window.formatTime = formatTime;
window.displayHighScores = displayHighScores;
window.installPWA = installPWA;
window.hideInstallPrompt = hideInstallPrompt;

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏠 House Head Chase - DOM Ready!');
    
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        console.log('🎯 Canvas initialized:', canvas.width, 'x', canvas.height);
    }
    
    console.log('🔗 Setting up navigation system...');
    
    const buttons = {
        'startGameBtn': startGame,
        'restartGameBtn': restartGame,
        'showStartScreenBtn': goToStartScreen,
        'showHighScoresBtn': showHighScores,
        'closeHighScoresBtn': closeHighScores,
        'closeHighScoresFooterBtn': closeHighScores,
        'showHelpBtn': showHelp,
        'closeHelpBtn': closeHelp,
        'closeHelpFooterBtn': closeHelp,
        'shareScoreBtn': showShareModal,
        'audioToggle': () => soundSystem.toggle()
    };
    
    Object.entries(buttons).forEach(([buttonId, handler]) => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.onclick = null;
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`📘 Button clicked: ${buttonId}`);
                handler();
            });
            console.log(`✅ Event listener attached to: ${buttonId}`);
        } else {
            console.warn(`⚠️ Button not found: ${buttonId}`);
        }
    });
    
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));
    
    setupPWAInstall();
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('✅ Service Worker registered'))
            .catch(error => console.log('⚠ Service Worker registration failed:', error));
    }
    
    goToStartScreen();
    
    console.log('✅ Navigation system initialized successfully!');
    console.log('⚖️ Game difficulty balanced for better progression!');
    console.log('📱 LOCAL-ONLY version ready for GitHub Pages!');
});

console.log('✅ LOCAL-ONLY Game script loaded successfully!');
