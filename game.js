// House Head Chase - ENHANCED VERSION WITH IMPROVED AI AND COLLISION
console.log('🏠 House Head Chase - Loading ENHANCED VERSION...');

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
        speedBoostTime: 0,
        velocity: { x: 0, y: 0 } // For collision physics
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
    totalEnemiesSpawned: 0,
    collisionGrid: new Map() // For efficient collision detection
};

// === ENEMY TYPES ===
const EnemyTypes = {
    SMALL: {
        name: 'Small House',
        size: 25,
        speed: 1.0, // Slightly reduced base speed
        damage: 15,
        spawnWeight: 0.7,
        color: '#4a3a2a',
        activationTime: 2000,
        wanderRadius: 100,
        huntRadius: 180
    },
    BIG: {
        name: 'Big House',
        size: 40,
        speed: 0.6, // Reduced speed for balance
        damage: 25,
        spawnWeight: 0.3,
        color: '#3a2a1a',
        activationTime: 3000,
        wanderRadius: 80,
        huntRadius: 200
    }
};

// === ENHANCED ENEMY CLASS WITH AI AND COLLISION ===
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.config = EnemyTypes[type];
        this.size = this.config.size;
        this.baseSpeed = this.config.speed * (0.8 + Math.random() * 0.4);
        this.speed = this.baseSpeed;
        this.damage = this.config.damage;
        this.color = this.config.color;
        
        this.state = 'spawning';
        this.spawnTime = Date.now();
        this.activationTime = this.config.activationTime + (Math.random() * 1000);
        this.legs = [];
        this.windowGlow = 0.5 + Math.random() * 0.5;
        this.lastDamageTime = 0;
        this.isVisible = false;
        
        // Enhanced AI properties
        this.aiState = 'wander'; // 'wander', 'hunt', 'flee'
        this.wanderTarget = { x: this.x, y: this.y };
        this.wanderTime = 0;
        this.lastWanderUpdate = 0;
        this.velocity = { x: 0, y: 0 };
        this.separationRadius = this.size * 2.5; // Minimum distance from other enemies
        this.lastPlayerSeen = 0;
        this.alertRadius = this.config.huntRadius;
        
        // Collision properties
        this.mass = this.type === 'BIG' ? 2 : 1;
        this.bounceVelocity = { x: 0, y: 0 };
        this.frictionCoeff = 0.95;
        
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
        
        // State transitions
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
        
        // Determine AI state based on flashlight and distance
        if (gameState.flashlight.on && gameState.flashlight.intensity > 0.5) {
            // Flashlight is on - hunt the player
            if (distanceToPlayer < this.alertRadius) {
                this.aiState = 'hunt';
                this.lastPlayerSeen = currentTime;
            } else if (currentTime - this.lastPlayerSeen < 3000) {
                // Recently saw player, continue hunting for a bit
                this.aiState = 'hunt';
            } else {
                this.aiState = 'wander';
            }
        } else {
            // Flashlight is off - wander randomly unless very close
            if (distanceToPlayer < 50) {
                this.aiState = 'hunt'; // Only hunt if very close
            } else {
                this.aiState = 'wander';
            }
        }
        
        // Execute AI behavior
        switch (this.aiState) {
            case 'hunt':
                this.huntPlayer();
                break;
            case 'wander':
                this.wanderAI();
                break;
        }
        
        // Apply separation force to prevent bunching
        this.applySeparation();
        
        // Apply boundary forces
        this.applyBoundaryForces();
    }

    huntPlayer() {
        const dx = gameState.player.x - this.x;
        const dy = gameState.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            // Calculate hunting speed based on difficulty
            const huntSpeed = this.baseSpeed * gameState.difficulty * 1.2;
            
            // Move towards player with some randomness to avoid perfect tracking
            const randomOffset = (Math.random() - 0.5) * 0.3;
            const moveX = (dx / distance) * huntSpeed + randomOffset;
            const moveY = (dy / distance) * huntSpeed + randomOffset;
            
            this.velocity.x += moveX * 0.3;
            this.velocity.y += moveY * 0.3;
        }
    }

    wanderAI() {
        const currentTime = Date.now();
        
        // Update wander target periodically
        if (currentTime - this.lastWanderUpdate > 2000 + Math.random() * 3000) {
            const angle = Math.random() * Math.PI * 2;
            const distance = this.config.wanderRadius * (0.3 + Math.random() * 0.7);
            
            this.wanderTarget.x = this.x + Math.cos(angle) * distance;
            this.wanderTarget.y = this.y + Math.sin(angle) * distance;
            
            // Keep wander target in bounds
            this.wanderTarget.x = Math.max(this.size + 50, Math.min(gameState.canvas.width - this.size - 50, this.wanderTarget.x));
            this.wanderTarget.y = Math.max(this.size + 130, Math.min(gameState.canvas.height - this.size - 50, this.wanderTarget.y));
            
            this.lastWanderUpdate = currentTime;
        }
        
        // Move towards wander target
        const dx = this.wanderTarget.x - this.x;
        const dy = this.wanderTarget.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 20) {
            const wanderSpeed = this.baseSpeed * 0.5;
            this.velocity.x += (dx / distance) * wanderSpeed * 0.2;
            this.velocity.y += (dy / distance) * wanderSpeed * 0.2;
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
                // Apply stronger separation force
                const force = (this.separationRadius - distance) / this.separationRadius;
                separationForce.x += (dx / distance) * force * 2;
                separationForce.y += (dy / distance) * force * 2;
                neighborCount++;
            }
        });
        
        if (neighborCount > 0) {
            this.velocity.x += separationForce.x * 0.5;
            this.velocity.y += separationForce.y * 0.5;
        }
    }

    applyBoundaryForces() {
        const margin = 100;
        const forceStrength = 0.5;
        
        // Left boundary
        if (this.x < margin) {
            this.velocity.x += forceStrength * (margin - this.x) / margin;
        }
        // Right boundary
        if (this.x > gameState.canvas.width - margin) {
            this.velocity.x -= forceStrength * (this.x - (gameState.canvas.width - margin)) / margin;
        }
        // Top boundary
        if (this.y < margin + 80) {
            this.velocity.y += forceStrength * ((margin + 80) - this.y) / margin;
        }
        // Bottom boundary
        if (this.y > gameState.canvas.height - margin) {
            this.velocity.y -= forceStrength * (this.y - (gameState.canvas.height - margin)) / margin;
        }
    }

    updatePhysics() {
        // Apply velocity with damping
        this.velocity.x *= this.frictionCoeff;
        this.velocity.y *= this.frictionCoeff;
        
        // Limit velocity
        const maxVelocity = this.baseSpeed * 2;
        const velocityMag = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (velocityMag > maxVelocity) {
            this.velocity.x = (this.velocity.x / velocityMag) * maxVelocity;
            this.velocity.y = (this.velocity.y / velocityMag) * maxVelocity;
        }
        
        // Update position
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
        // Constrain to boundaries
        this.x = Math.max(this.size, Math.min(gameState.canvas.width - this.size, this.x));
        this.y = Math.max(this.size + 80, Math.min(gameState.canvas.height - this.size, this.y));
        
        // Check collision with player
        this.checkPlayerCollision();
        
        // Check collision with other enemies
        this.checkEnemyCollisions();
    }

    checkPlayerCollision() {
        const dx = gameState.player.x - this.x;
        const dy = gameState.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = this.size + gameState.player.size;
        
        if (distance < minDistance) {
            // Handle collision
            if (gameState.player.shieldTime <= 0) {
                this.damagePlayer();
            }
            
            // Bounce both entities apart
            if (distance > 0) {
                const overlap = minDistance - distance;
                const separationX = (dx / distance) * overlap * 0.5;
                const separationY = (dy / distance) * overlap * 0.5;
                
                // Move enemy away
                this.x -= separationX * 0.8;
                this.y -= separationY * 0.8;
                
                // Move player away (if not shielded)
                if (gameState.player.shieldTime <= 0) {
                    gameState.player.x += separationX * 0.2;
                    gameState.player.y += separationY * 0.2;
                }
                
                // Apply bounce velocity
                this.velocity.x -= (dx / distance) * 2;
                this.velocity.y -= (dy / distance) * 2;
                
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
                // Calculate collision response
                const overlap = minDistance - distance;
                const separationX = (dx / distance) * overlap * 0.5;
                const separationY = (dy / distance) * overlap * 0.5;
                
                // Move enemies apart
                this.x -= separationX;
                this.y -= separationY;
                other.x += separationX;
                other.y += separationY;
                
                // Apply bounce velocities based on mass
                const totalMass = this.mass + other.mass;
                const velocityExchange = 1.5;
                
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
        const legSpeed = 0.1 + speed * 0.02;
        
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
        
        // Dynamic glow based on AI state
        const glowColor = this.aiState === 'hunt' ? '#ffaa88' : '#ffff88';
        const glowMultiplier = this.aiState === 'hunt' ? 1.2 : 1.0;
        
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8 * glowMultiplier;
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
    const bigHouseChance = Math.min(0.25 + (gameState.level - 1) * 0.05, 0.4); // Reduced big house spawn rate
    const enemyType = rand < bigHouseChance ? 'BIG' : 'SMALL';
    
    let x, y;
    let attempts = 0;
    let validPosition = false;
    
    // Enhanced spawn positioning to prevent clustering
    do {
        const spawnMargin = 120;
        const centerAvoidanceRadius = Math.min(200, Math.max(gameState.canvas.width, gameState.canvas.height) * 0.25);
        
        // Try to spawn away from center and other enemies
        const angle = Math.random() * Math.PI * 2;
        const distance = spawnMargin + Math.random() * (centerAvoidanceRadius - spawnMargin);
        const centerX = gameState.canvas.width / 2;
        const centerY = gameState.canvas.height / 2;
        
        x = centerX + Math.cos(angle) * distance;
        y = centerY + Math.sin(angle) * distance;
        
        // Clamp to boundaries
        x = Math.max(80, Math.min(gameState.canvas.width - 80, x));
        y = Math.max(150, Math.min(gameState.canvas.height - 80, y));
        
        // Check distance from player
        const playerDistance = Math.sqrt(
            Math.pow(x - gameState.player.x, 2) + Math.pow(y - gameState.player.y, 2)
        );
        
        // Check distance from other enemies
        let tooCloseToOthers = false;
        const minEnemyDistance = 100;
        
        for (const enemy of gameState.enemies) {
            const enemyDistance = Math.sqrt(
                Math.pow(x - enemy.x, 2) + Math.pow(y - enemy.y, 2)
            );
            if (enemyDistance < minEnemyDistance) {
                tooCloseToOthers = true;
                break;
            }
        }
        
        validPosition = playerDistance > 180 && !tooCloseToOthers;
        attempts++;
    } while (!validPosition && attempts < 30);
    
    const enemy = new Enemy(x, y, enemyType);
    gameState.enemies.push(enemy);
    gameState.totalEnemiesSpawned++;
    gameState.lastEnemySpawn = currentTime;
    
    // Balanced spawn rate scaling
    gameState.spawnRate = Math.max(1500, 3500 - (gameState.level - 1) * 150);
    
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
            if (enemyDistance < 80) {
                tooCloseToEnemy = true;
                break;
            }
        }
        
        attempts++;
        if (attempts > 20) break;
    } while ((playerDistance < 100 || tooCloseToEnemy) && attempts < 20);
    
    const powerup = new Powerup(x, y, powerupType);
    gameState.powerups.push(powerup);
    gameState.lastPowerupSpawn = currentTime;
    
    // Slightly more frequent powerups for balance
    gameState.powerupSpawnRate = Math.max(8000, 12000 - (gameState.level - 1) * 200);
    
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
    
    // Balanced level progression
    const newLevel = Math.floor(gameState.score / 45) + 1; // Slower level progression
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameState.difficulty = 1 + (gameState.level - 1) * 0.15; // Gentler difficulty scaling
        soundSystem.play('levelup');
        showLevelUpEffect();
        console.log(`🎊 Level up! Now level ${gameState.level} (Difficulty: ${gameState.difficulty.toFixed(2)})`);
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
        <p>Enemies getting smarter!</p>
    `;
    
    document.body.appendChild(levelDiv);
    
    setTimeout(() => {
        if (document.body.contains(levelDiv)) {
            document.body.removeChild(levelDiv);
        }
    }, 2000);
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
        console.error(`❌ Screen not found: ${screenId}`);
    }
}

// === HIGH SCORES SYSTEM ===
function saveHighScore(score, level) {
    console.log(`💾 Saving high score: ${score}, level ${level}`);
    
    let highScores = [];
    try {
        const stored = localStorage.getItem('houseHeadChaseHighScores');
        if (stored) {
            highScores = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error loading high scores:', e);
    }
    
    const newScore = {
        score: score,
        level: level,
        date: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    highScores.push(newScore);
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10);
    
    try {
        localStorage.setItem('houseHeadChaseHighScores', JSON.stringify(highScores));
        console.log('✅ High score saved');
    } catch (e) {
        console.error('Error saving high scores:', e);
    }
}

function displayHighScores() {
    console.log('📊 Displaying high scores...');
    
    const listContainer = document.getElementById('highScoresList');
    if (!listContainer) {
        console.error('❌ High scores list container not found');
        return;
    }
    
    let highScores = [];
    try {
        const stored = localStorage.getItem('houseHeadChaseHighScores');
        if (stored) {
            highScores = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error loading high scores:', e);
    }
    
    if (highScores.length === 0) {
        listContainer.innerHTML = '<p style="color: #888; text-align: center;">No high scores yet. Play to set your first record!</p>';
        return;
    }
    
    let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
    highScores.forEach((score, index) => {
        const date = new Date(score.date);
        const dateStr = date.toLocaleDateString();
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
        
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; 
                        padding: 10px; background: rgba(255, 68, 68, 0.1); 
                        border: 1px solid rgba(255, 68, 68, 0.3); border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px; min-width: 30px;">${medal}</span>
                    <div>
                        <div style="font-weight: bold; color: #ff4444;">Score: ${score.score}s</div>
                        <div style="font-size: 12px; color: #888;">Level ${score.level} • ${dateStr}</div>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    listContainer.innerHTML = html;
}

// === SHARE SYSTEM ===
function showShareModal() {
    console.log('📤 Showing share modal...');
    
    if (!document.getElementById('shareModal')) {
        createShareModal();
    }
    
    const shareScore = document.getElementById('shareScore');
    if (shareScore) {
        shareScore.textContent = gameState.score;
    }
    
    showScreen('shareModal');
}

function closeShareModal() {
    console.log('🚫 Closing share modal...');
    showScreen('gameOver');
}

function createShareModal() {
    const modalHTML = `
        <div id="shareModal" class="modal-overlay hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📤 SHARE YOUR SCORE</h2>
                    <button class="close-btn" id="closeShareBtn">×</button>
                </div>
                <div class="modal-body">
                    <p style="text-align: center; font-size: 18px; margin-bottom: 20px;">
                        🏆 You survived for <strong id="shareScore">0</strong> seconds!
                    </p>
                    <div class="button-container">
                        <button class="btn secondary" id="shareTwitterBtn">🐦 Twitter</button>
                        <button class="btn secondary" id="shareFacebookBtn">📘 Facebook</button>
                        <button class="btn primary" id="copyScoreBtn">📋 Copy Score</button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn secondary" id="closeShareFooterBtn">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('closeShareBtn').addEventListener('click', closeShareModal);
    document.getElementById('closeShareFooterBtn').addEventListener('click', closeShareModal);
    document.getElementById('shareTwitterBtn').addEventListener('click', () => shareScore('twitter'));
    document.getElementById('shareFacebookBtn').addEventListener('click', () => shareScore('facebook'));
    document.getElementById('copyScoreBtn').addEventListener('click', () => shareScore('copy'));
}

function shareScore(platform) {
    const score = gameState.score;
    const level = gameState.level;
    const gameUrl = window.location.origin; // Uses current domain automatically
    const message = `🏠 I survived ${score} seconds and reached level ${level} in House Head Chase! Can you beat my score?`;
    const messageWithUrl = `${message}\n\nPlay now: ${gameUrl}`;
    
    switch (platform) {
        case 'twitter':
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(gameUrl)}`, '_blank');
            break;
        case 'facebook':
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(gameUrl)}&quote=${encodeURIComponent(message)}`, '_blank');
            break;
        case 'copy':
            navigator.clipboard.writeText(messageWithUrl).then(() => {
                alert('Score and game link copied to clipboard!');
            }).catch(() => {
                alert('Could not copy score. Please try again.');
            });
            break;
    }
}

// === PWA FUNCTIONS ===
let deferredPrompt;

function setupPWAInstall() {
    console.log('📱 Setting up PWA install...');
    
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('📱 Install prompt available');
        e.preventDefault();
        deferredPrompt = e;
        
        // Show our custom install prompt
        const installPrompt = document.getElementById('installPrompt');
        if (installPrompt) {
            installPrompt.classList.remove('hidden');
        }
        
        // Also show install button in HUD after game starts
        setTimeout(() => {
            showInstallHint();
        }, 10000); // Show after 10 seconds of gameplay
    });
    
    // Listen for successful installation
    window.addEventListener('appinstalled', (e) => {
        console.log('✅ PWA installed successfully');
        hideInstallPrompt();
        
        // Show success message
        if (typeof showPowerupMessage === 'function') {
            showPowerupMessage('📱 App Installed! Play offline anytime!');
        }
        
        // Clear the deferred prompt
        deferredPrompt = null;
    });
    
    // Check if already in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
        console.log('📱 Already running as installed app');
        hideInstallPrompt();
    }
}

function installPWA() {
    if (!deferredPrompt) {
        console.log('❌ Install prompt not available');
        // Fallback: show manual install instructions
        showManualInstallInstructions();
        return;
    }
    
    console.log('📱 Showing install prompt...');
    deferredPrompt.prompt();
    
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('✅ User accepted install prompt');
        } else {
            console.log('❌ User dismissed install prompt');
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
        console.error('❌ Canvas not found!');
        return;
    }
    
    gameState.ctx = gameState.canvas.getContext('2d');
    if (!gameState.ctx) {
        console.error('❌ Could not get canvas context!');
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
    gameState.camera.shake = 0;
    gameState.camera.intensity = 0;
    gameState.totalEnemiesSpawned = 0;
    
    console.log(`🔵 Player positioned at (${gameState.player.x}, ${gameState.player.y})`);
    
    setTimeout(() => {
        const hint = document.getElementById('controlsHint');
        if (hint) {
            hint.classList.remove('hidden');
            setTimeout(() => hint.classList.add('hidden'), 4000);
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
    
    saveHighScore(survivalTime, gameState.level);
    
    document.getElementById('finalScore').textContent = survivalTime;
    document.getElementById('finalTime').textContent = survivalTime;
    document.getElementById('finalLevel').textContent = gameState.level;
    
    const shareScore = document.getElementById('shareScore');
    if (shareScore) shareScore.textContent = survivalTime;
    
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('powerupIndicators').classList.add('hidden');
    document.getElementById('flashlightIndicator').classList.add('hidden');
    document.getElementById('controlsHint').classList.add('hidden');
    
    showScreen('gameOver');
    
    console.log('🎮 Game Over! Survival time:', survivalTime, 'seconds');
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
window.soundSystem = soundSystem;

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
                console.log(`🔘 Button clicked: ${buttonId}`);
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
            .catch(error => console.log('❌ Service Worker registration failed:', error));
    }
    
    goToStartScreen();
    
    console.log('✅ Navigation system initialized successfully!');
});

console.log('✅ ENHANCED Game script loaded with improved AI and collision system!');
