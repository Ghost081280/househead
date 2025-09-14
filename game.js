// 🏠 House Head Chase - COMPLETE COMMERCIAL VERSION
console.log('🏠 House Head Chase - Loading COMPLETE COMMERCIAL VERSION...');

// Wait for configuration to be ready
const waitForConfig = () => {
    return new Promise((resolve) => {
        if (window.GameConfig) {
            resolve(window.GameConfig);
        } else {
            window.addEventListener('configReady', (event) => {
                resolve(event.detail.config);
            });
        }
    });
};

// === ENHANCED SOUND SYSTEM ===
class SoundSystem {
    constructor() {
        this.context = null;
        this.enabled = true;
        this.sounds = new Map();
        this.masterGain = null;
        this.initialized = false;
        this.config = null;
    }

    async init(config = null) {
        this.config = config || window.GameConfig;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.masterGain.gain.setValueAtTime(0.3, this.context.currentTime);
            
            // Load saved audio preference
            const savedAudioState = localStorage.getItem(
                this.config?.utils.getStorageKey('audioEnabled') || 'houseHeadChase_audioEnabled'
            );
            this.enabled = savedAudioState !== 'false';
            
            this.initialized = true;
            console.log('🔊 Enhanced audio system initialized');
            
            // Track audio capability
            if (window.analytics) {
                window.analytics.trackEvent('audio_system_init', {
                    audio_context_supported: true,
                    user_preference: this.enabled
                });
            }
        } catch (e) {
            console.log('❌ Audio not supported:', e.message);
            this.enabled = false;
            this.initialized = false;
            
            if (window.analytics) {
                window.analytics.trackError(e, 'audio_init');
            }
        }
    }

    play(type, frequency = 220, duration = 0.1, volume = 0.3) {
        if (!this.enabled || !this.context || !this.initialized || !this.masterGain) return;

        try {
            // Resume context if suspended (required by modern browsers)
            if (this.context.state === 'suspended') {
                this.context.resume();
            }

            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);

            // Configure sound based on type
            const soundConfig = this.getSoundConfig(type);
            oscillator.type = soundConfig.waveType;
            oscillator.frequency.setValueAtTime(soundConfig.frequency, this.context.currentTime);
            
            // Apply volume with fade out
            gainNode.gain.setValueAtTime(soundConfig.volume * volume, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + soundConfig.duration);

            oscillator.start();
            oscillator.stop(this.context.currentTime + soundConfig.duration);

            // Clean up
            setTimeout(() => {
                try {
                    oscillator.disconnect();
                    gainNode.disconnect();
                } catch (e) {
                    // Ignore cleanup errors
                }
            }, soundConfig.duration * 1000 + 100);

        } catch (error) {
            console.warn('⚠️ Sound play failed:', error.message);
        }
    }

    getSoundConfig(type) {
        const configs = {
            spawn: { waveType: 'triangle', frequency: 180, volume: 0.2, duration: 0.3 },
            damage: { waveType: 'square', frequency: 120, volume: 0.4, duration: 0.2 },
            levelup: { waveType: 'sine', frequency: 440, volume: 0.3, duration: 0.5 },
            flashlight: { waveType: 'triangle', frequency: 300, volume: 0.15, duration: 0.1 },
            powerup: { waveType: 'sine', frequency: 660, volume: 0.25, duration: 0.3 },
            bounce: { waveType: 'square', frequency: 200, volume: 0.1, duration: 0.1 }
        };

        return configs[type] || configs.bounce;
    }

    toggle() {
        this.enabled = !this.enabled;
        
        // Save preference
        if (this.config) {
            localStorage.setItem(
                this.config.utils.getStorageKey('audioEnabled'), 
                this.enabled.toString()
            );
        }
        
        const btn = document.getElementById('audioToggle');
        if (btn) {
            btn.textContent = this.enabled ? '🔊' : '🔇';
            btn.setAttribute('aria-label', this.enabled ? 'Mute audio' : 'Unmute audio');
        }
        
        console.log(`🔊 Audio ${this.enabled ? 'enabled' : 'disabled'}`);
        
        // Track audio toggle
        if (window.analytics) {
            window.analytics.trackEvent('audio_toggle', {
                new_state: this.enabled ? 'enabled' : 'disabled'
            });
        }
    }

    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.context.currentTime);
        }
    }

    destroy() {
        if (this.context) {
            try {
                this.context.close();
            } catch (e) {
                console.warn('Audio context cleanup failed:', e);
            }
        }
        this.initialized = false;
    }
}

// === POWERUP SYSTEM ===
const PowerupTypes = {
    HEALTH: {
        name: 'Health Pack',
        emoji: '💚',
        color: '#44ff44',
        effect: 'health',
        value: 30,
        duration: 0,
        spawnWeight: 0.4,
        description: 'Restore 30 health points'
    },
    SHIELD: {
        name: 'Shield',
        emoji: '🛡️',
        color: '#4488ff',
        effect: 'shield',
        value: 0,
        duration: 5000,
        spawnWeight: 0.3,
        description: 'Invincible for 5 seconds'
    },
    SPEED: {
        name: 'Speed Boost',
        emoji: '⚡',
        color: '#ffaa44',
        effect: 'speed',
        value: 2,
        duration: 8000,
        spawnWeight: 0.3,
        description: 'Move 2x faster for 8 seconds'
    }
};

class Powerup {
    constructor(x, y, type, config) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.config = PowerupTypes[type];
        this.gameConfig = config;
        this.size = 15;
        this.collected = false;
        this.spawnTime = Date.now();
        this.pulseOffset = Math.random() * Math.PI * 2;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.despawnTime = this.spawnTime + 15000;
        this.glowIntensity = 0;
        
        if (this.gameConfig?.features.consoleLogging) {
            console.log(`⚡ ${this.config.name} spawned at (${Math.floor(x)}, ${Math.floor(y)})`);
        }
    }

    update() {
        const currentTime = Date.now();
        
        // Despawn after timeout
        if (currentTime > this.despawnTime) {
            return false;
        }
        
        // Check collision with player
        if (gameState.player) {
            const dx = this.x - gameState.player.x;
            const dy = this.y - gameState.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.size + gameState.player.size - 5) {
                this.collect();
                return false;
            }
        }
        
        // Update glow effect
        this.glowIntensity = 0.5 + Math.sin(currentTime * 0.005) * 0.3;
        
        return true;
    }

    collect() {
        if (this.collected) return;
        this.collected = true;
        
        soundSystem.play('powerup');
        this.showCollectionEffect();
        
        // Apply powerup effect
        this.applyEffect();
        
        // Track collection
        if (window.analytics) {
            window.analytics.trackPowerupCollected(
                this.type.toLowerCase(),
                gameState.player?.health || 0,
                gameState.level || 1
            );
        }
    }

    applyEffect() {
        const player = gameState.player;
        if (!player) return;

        switch (this.config.effect) {
            case 'health':
                const healAmount = Math.min(this.config.value, player.maxHealth - player.health);
                player.health = Math.min(player.maxHealth, player.health + this.config.value);
                this.showFloatingText(`+${healAmount} HP`, '#44ff44');
                break;
                
            case 'shield':
                player.shieldTime = this.config.duration;
                gameState.activePowerups.push({
                    type: this.type,
                    timeLeft: this.config.duration,
                    config: this.config
                });
                this.showFloatingText('SHIELD ACTIVE!', '#4488ff');
                break;
                
            case 'speed':
                player.speed = player.baseSpeed * this.config.value;
                player.speedBoostTime = this.config.duration;
                gameState.activePowerups.push({
                    type: this.type,
                    timeLeft: this.config.duration,
                    config: this.config
                });
                this.showFloatingText('SPEED BOOST!', '#ffaa44');
                break;
        }

        console.log(`💊 ${this.config.name} activated`);
    }

    showCollectionEffect() {
        // Create collection particle effect (placeholder)
        if (typeof createParticleEffect === 'function') {
            createParticleEffect(this.x, this.y, this.config.color, 'powerup');
        }
    }

    showFloatingText(text, color) {
        const floatingText = document.createElement('div');
        floatingText.className = 'floating-powerup-text';
        floatingText.textContent = text;
        floatingText.style.cssText = `
            position: fixed;
            color: ${color};
            font-weight: bold;
            font-size: 16px;
            pointer-events: none;
            z-index: 8000;
            font-family: 'Orbitron', monospace;
            text-shadow: 0 0 8px ${color};
            animation: floatUp 1.5s ease-out forwards;
        `;
        
        const canvas = gameState.canvas;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const screenX = rect.left + (this.x * rect.width / canvas.width);
            const screenY = rect.top + (this.y * rect.height / canvas.height);
            
            floatingText.style.left = screenX + 'px';
            floatingText.style.top = screenY + 'px';
        }
        
        document.body.appendChild(floatingText);
        
        setTimeout(() => {
            if (document.body.contains(floatingText)) {
                document.body.removeChild(floatingText);
            }
        }, 1500);
    }

    draw() {
        if (this.collected) return;
        
        const ctx = gameState.ctx;
        if (!ctx) return;
        
        const currentTime = Date.now();
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Floating animation
        const floatY = Math.sin(currentTime * 0.003 + this.floatOffset) * 3;
        ctx.translate(0, floatY);
        
        // Pulsing scale
        const pulse = 0.8 + Math.sin(currentTime * 0.008 + this.pulseOffset) * 0.2;
        ctx.scale(pulse, pulse);
        
        // Glow effect
        ctx.shadowColor = this.config.color;
        ctx.shadowBlur = 15 * this.glowIntensity;
        
        // Main circle
        ctx.fillStyle = this.config.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Type-specific icon
        this.drawIcon(ctx);
        
        ctx.restore();
    }

    drawIcon(ctx) {
        ctx.fillStyle = '#000';
        ctx.font = `${this.size * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const iconSize = this.size * 0.4;
        
        switch (this.type) {
            case 'HEALTH':
                // Plus sign
                ctx.fillRect(-iconSize/4, -iconSize, iconSize/2, iconSize * 2);
                ctx.fillRect(-iconSize, -iconSize/4, iconSize * 2, iconSize/2);
                break;
                
            case 'SHIELD':
                // Shield shape
                ctx.beginPath();
                ctx.moveTo(0, -iconSize);
                ctx.lineTo(iconSize * 0.7, -iconSize * 0.5);
                ctx.lineTo(iconSize * 0.7, iconSize * 0.3);
                ctx.lineTo(0, iconSize);
                ctx.lineTo(-iconSize * 0.7, iconSize * 0.3);
                ctx.lineTo(-iconSize * 0.7, -iconSize * 0.5);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'SPEED':
                // Lightning bolt
                ctx.beginPath();
                ctx.moveTo(-iconSize * 0.2, -iconSize);
                ctx.lineTo(iconSize * 0.4, -iconSize * 0.2);
                ctx.lineTo(0, 0);
                ctx.lineTo(iconSize * 0.6, iconSize * 0.6);
                ctx.lineTo(0, iconSize);
                ctx.lineTo(-iconSize * 0.4, iconSize * 0.2);
                ctx.lineTo(0, 0);
                ctx.lineTo(-iconSize * 0.6, -iconSize * 0.6);
                ctx.closePath();
                ctx.fill();
                break;
        }
    }
}

// === ENEMY SYSTEM ===
const EnemyTypes = {
    SMALL: {
        name: 'Small House',
        size: 25,
        speed: 1.0,
        damage: 15,
        spawnWeight: 0.7,
        color: '#4a3a2a',
        activationTime: 2000,
        wanderRadius: 100,
        huntRadius: 180,
        health: 1
    },
    BIG: {
        name: 'Big House',
        size: 40,
        speed: 0.6,
        damage: 25,
        spawnWeight: 0.3,
        color: '#3a2a1a',
        activationTime: 3000,
        wanderRadius: 80,
        huntRadius: 200,
        health: 2
    }
};

class Enemy {
    constructor(x, y, type, config) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.config = EnemyTypes[type];
        this.gameConfig = config;
        this.size = this.config.size;
        this.baseSpeed = this.config.speed * (0.8 + Math.random() * 0.4);
        this.speed = this.baseSpeed;
        this.damage = this.config.damage;
        this.color = this.config.color;
        this.health = this.config.health;
        
        // State management
        this.state = 'spawning';
        this.spawnTime = Date.now();
        this.activationTime = this.config.activationTime + (Math.random() * 1000);
        this.lastDamageTime = 0;
        this.isVisible = false;
        
        // Visual properties
        this.legs = this.initializeLegs();
        this.windowGlow = 0.5 + Math.random() * 0.5;
        this.spawnProgress = 0;
        
        // AI properties
        this.aiState = 'wander';
        this.wanderTarget = { x: this.x, y: this.y };
        this.wanderTime = 0;
        this.lastWanderUpdate = 0;
        this.velocity = { x: 0, y: 0 };
        this.separationRadius = this.size * 2.5;
        this.lastPlayerSeen = 0;
        this.alertRadius = this.config.huntRadius;
        
        // Physics properties
        this.mass = this.type === 'BIG' ? 2 : 1;
        this.frictionCoeff = 0.95;
        
        if (this.gameConfig?.features.consoleLogging) {
            console.log(`🏠 ${this.config.name} spawned at (${Math.floor(x)}, ${Math.floor(y)})`);
        }
    }

    initializeLegs() {
        const legs = [];
        const legCount = this.type === 'BIG' ? 6 : 4;
        
        for (let i = 0; i < legCount; i++) {
            legs.push({
                angle: (i / legCount) * Math.PI * 2,
                length: this.size * 0.8,
                offset: Math.random() * Math.PI * 2,
                speed: 0.1 + Math.random() * 0.1,
                phase: Math.random() * Math.PI * 2
            });
        }
        
        return legs;
    }

    update() {
        const currentTime = Date.now();
        
        // Update state transitions
        this.updateState(currentTime);
        
        if (this.state === 'active') {
            this.updateAI(currentTime);
            this.updatePhysics();
            this.updateLegs(currentTime);
        }
        
        this.updateVisibility();
        this.updateVisuals(currentTime);
        
        return true;
    }

    updateState(currentTime) {
        switch (this.state) {
            case 'spawning':
                this.spawnProgress = Math.min((currentTime - this.spawnTime) / 1000, 1);
                if (currentTime - this.spawnTime > 1000) {
                    this.state = 'dormant';
                    soundSystem.play('spawn', 180, 0.3, 0.2);
                }
                break;
                
            case 'dormant':
                if (currentTime - this.spawnTime > this.activationTime) {
                    this.state = 'active';
                    this.onActivate();
                }
                break;
        }
    }

    onActivate() {
        console.log(`🦵 ${this.config.name} grew legs! Now hunting...`);
        
        // Track enemy activation
        if (window.analytics) {
            window.analytics.trackEvent('enemy_activated', {
                enemy_type: this.type.toLowerCase(),
                activation_time: Date.now() - this.spawnTime,
                current_level: gameState.level || 1
            });
        }
    }

    updateAI(currentTime) {
        if (!gameState.player) return;
        
        const playerX = gameState.player.x;
        const playerY = gameState.player.y;
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
        
        // Determine AI state based on game conditions
        this.determineAIState(distanceToPlayer, currentTime);
        
        // Execute AI behavior
        switch (this.aiState) {
            case 'hunt':
                this.huntPlayer(dx, dy, distanceToPlayer);
                break;
            case 'wander':
                this.wanderAI(currentTime);
                break;
        }
        
        // Apply separation and boundary forces
        this.applySeparation();
        this.applyBoundaryForces();
    }

    determineAIState(distanceToPlayer, currentTime) {
        const flashlightOn = gameState.flashlight?.on && gameState.flashlight?.intensity > 0.5;
        
        if (flashlightOn && distanceToPlayer < this.alertRadius) {
            this.aiState = 'hunt';
            this.lastPlayerSeen = currentTime;
        } else if (currentTime - this.lastPlayerSeen < 3000) {
            // Continue hunting briefly after losing sight
            this.aiState = 'hunt';
        } else if (distanceToPlayer < 50) {
            // Close proximity detection
            this.aiState = 'hunt';
        } else {
            this.aiState = 'wander';
        }
    }

    huntPlayer(dx, dy, distance) {
        if (distance > 5) {
            const difficulty = gameState.difficulty || 1;
            const huntSpeed = this.baseSpeed * difficulty * 1.2;
            
            // Improved pathfinding
            const moveVector = this.calculateMoveVector(dx, dy, distance, huntSpeed);
            
            this.velocity.x += moveVector.x * 0.3;
            this.velocity.y += moveVector.y * 0.3;
        }
    }

    calculateMoveVector(dx, dy, distance, speed) {
        // Basic obstacle avoidance
        let moveX = (dx / distance) * speed;
        let moveY = (dy / distance) * speed;
        
        // Add some randomness to prevent perfect tracking
        const randomOffset = (Math.random() - 0.5) * 0.3;
        moveX += randomOffset;
        moveY += randomOffset;
        
        return { x: moveX, y: moveY };
    }

    wanderAI(currentTime) {
        // Update wander target periodically
        if (currentTime - this.lastWanderUpdate > 2000 + Math.random() * 3000) {
            this.generateWanderTarget();
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

    generateWanderTarget() {
        const canvas = gameState.canvas;
        if (!canvas) return;
        
        const angle = Math.random() * Math.PI * 2;
        const distance = this.config.wanderRadius * (0.3 + Math.random() * 0.7);
        
        this.wanderTarget.x = this.x + Math.cos(angle) * distance;
        this.wanderTarget.y = this.y + Math.sin(angle) * distance;
        
        // Keep wander target in bounds
        const margin = this.size + 50;
        this.wanderTarget.x = Math.max(margin, Math.min(canvas.width - margin, this.wanderTarget.x));
        this.wanderTarget.y = Math.max(margin + 130, Math.min(canvas.height - margin, this.wanderTarget.y));
    }

    applySeparation() {
        const separationForce = { x: 0, y: 0 };
        let neighborCount = 0;
        
        for (const other of gameState.enemies) {
            if (other === this || other.state !== 'active') continue;
            
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.separationRadius && distance > 0) {
                const force = (this.separationRadius - distance) / this.separationRadius;
                separationForce.x += (dx / distance) * force * 2;
                separationForce.y += (dy / distance) * force * 2;
                neighborCount++;
            }
        }
        
        if (neighborCount > 0) {
            this.velocity.x += separationForce.x * 0.5;
            this.velocity.y += separationForce.y * 0.5;
        }
    }

    applyBoundaryForces() {
        const canvas = gameState.canvas;
        if (!canvas) return;
        
        const margin = 100;
        const forceStrength = 0.5;
        
        // Boundary repulsion
        if (this.x < margin) {
            this.velocity.x += forceStrength * (margin - this.x) / margin;
        }
        if (this.x > canvas.width - margin) {
            this.velocity.x -= forceStrength * (this.x - (canvas.width - margin)) / margin;
        }
        if (this.y < margin + 80) {
            this.velocity.y += forceStrength * ((margin + 80) - this.y) / margin;
        }
        if (this.y > canvas.height - margin) {
            this.velocity.y -= forceStrength * (this.y - (canvas.height - margin)) / margin;
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
        const canvas = gameState.canvas;
        if (canvas) {
            this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
            this.y = Math.max(this.size + 80, Math.min(canvas.height - this.size, this.y));
        }
        
        // Check collisions
        this.checkPlayerCollision();
        this.checkEnemyCollisions();
    }

    checkPlayerCollision() {
        const player = gameState.player;
        if (!player) return;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = this.size + player.size;
        
        if (distance < minDistance) {
            if (player.shieldTime <= 0) {
                this.damagePlayer();
            }
            
            this.handleCollisionResponse(dx, dy, distance, minDistance, player);
        }
    }

    handleCollisionResponse(dx, dy, distance, minDistance, player) {
        if (distance > 0) {
            const overlap = minDistance - distance;
            const separationX = (dx / distance) * overlap * 0.5;
            const separationY = (dy / distance) * overlap * 0.5;
            
            // Move entities apart
            this.x -= separationX * 0.8;
            this.y -= separationY * 0.8;
            
            if (player.shieldTime <= 0) {
                player.x += separationX * 0.2;
                player.y += separationY * 0.2;
            }
            
            // Apply bounce velocity
            this.velocity.x -= (dx / distance) * 2;
            this.velocity.y -= (dy / distance) * 2;
            
            soundSystem.play('bounce', 150, 0.1, 0.2);
        }
    }

    checkEnemyCollisions() {
        for (const other of gameState.enemies) {
            if (other === this || other.state !== 'active') continue;
            
            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = this.size + other.size;
            
            if (distance < minDistance && distance > 0) {
                this.resolveEnemyCollision(other, dx, dy, distance, minDistance);
            }
        }
    }

    resolveEnemyCollision(other, dx, dy, distance, minDistance) {
        const overlap = minDistance - distance;
        const separationX = (dx / distance) * overlap * 0.5;
        const separationY = (dy / distance) * overlap * 0.5;
        
        // Move enemies apart
        this.x -= separationX;
        this.y -= separationY;
        other.x += separationX;
        other.y += separationY;
        
        // Physics-based collision response
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

    updateLegs(currentTime) {
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        const legSpeed = 0.1 + speed * 0.02;
        
        this.legs.forEach(leg => {
            leg.offset += legSpeed;
        });
    }

    updateVisibility() {
        if (!gameState.player || !gameState.flashlight) return;
        
        const dx = this.x - gameState.player.x;
        const dy = this.y - gameState.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (gameState.flashlight.on && gameState.flashlight.intensity > 0.3) {
            this.isVisible = distance < gameState.flashlight.radius;
        } else {
            this.isVisible = distance < 60;
        }
    }

    updateVisuals(currentTime) {
        this.windowGlow = 0.5 + Math.sin(currentTime * 0.003 + this.x * 0.01) * 0.3;
    }

    damagePlayer() {
        const currentTime = Date.now();
        const player = gameState.player;
        
        if (!player || currentTime - this.lastDamageTime < 1000) return;
        
        player.health -= this.damage;
        this.lastDamageTime = currentTime;
        
        // Screen shake effect
        if (gameState.camera) {
            gameState.camera.shake = 10;
            gameState.camera.intensity = 8;
        }
        
        soundSystem.play('damage');
        this.showDamageIndicator(this.damage);
        
        console.log(`💔 Player took ${this.damage} damage from ${this.config.name}`);
        
        // Track damage dealt
        if (window.analytics) {
            window.analytics.trackEvent('player_damaged', {
                damage_amount: this.damage,
                enemy_type: this.type.toLowerCase(),
                player_health_remaining: Math.max(0, player.health),
                current_level: gameState.level || 1
            });
        }
    }

    showDamageIndicator(damage) {
        if (!gameState.canvas) return;
        
        const indicator = document.createElement('div');
        indicator.className = 'damage-indicator';
        indicator.textContent = `-${damage}`;
        indicator.style.cssText = `
            position: fixed;
            color: #ff4444;
            font-weight: bold;
            font-size: 18px;
            pointer-events: none;
            z-index: 8000;
            animation: damageFloat 0.8s ease-out forwards;
            font-family: 'Orbitron', monospace;
            text-shadow: 0 0 8px #ff4444;
        `;
        
        const rect = gameState.canvas.getBoundingClientRect();
        const screenX = rect.left + (gameState.player.x * rect.width / gameState.canvas.width);
        const screenY = rect.top + (gameState.player.y * rect.height / gameState.canvas.height);
        
        indicator.style.left = screenX + 'px';
        indicator.style.top = screenY + 'px';
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            if (document.body.contains(indicator)) {
                document.body.removeChild(indicator);
            }
        }, 800);
    }

    draw() {
        if (!this.isVisible && this.state !== 'spawning') return;
        
        const ctx = gameState.ctx;
        if (!ctx) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        switch (this.state) {
            case 'spawning':
                this.drawSpawning(ctx);
                break;
            case 'dormant':
                this.drawHouse(ctx);
                break;
            case 'active':
                this.drawHouse(ctx);
                this.drawLegs(ctx);
                break;
        }
        
        ctx.restore();
    }

    drawSpawning(ctx) {
        const currentSize = this.size * this.spawnProgress;
        const alpha = this.spawnProgress;
        
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha;
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
        gradient.addColorStop(0.5, this.type === 'BIG' ? '#2a1a0a' : '#3a2a1a');
        gradient.addColorStop(1, '#1a0a0a');
        ctx.fillStyle = gradient;
        ctx.fillRect(-size/2, -size/2, size, size * 0.8);
        
        // House outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(-size/2, -size/2, size, size * 0.8);
        
        // Roof
        this.drawRoof(ctx, size);
        
        // Windows (eyes)
        this.drawWindows(ctx, size);
        
        // Door
        this.drawDoor(ctx, size);
    }

    drawRoof(ctx, size) {
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
    }

    drawWindows(ctx, size) {
        const glowIntensity = this.windowGlow;
        const eyeSize = size / (this.type === 'BIG' ? 6 : 8);
        
        // Dynamic glow based on AI state
        const glowColor = this.aiState === 'hunt' ? '#ffaa88' : '#ffff88';
        const glowMultiplier = this.aiState === 'hunt' ? 1.2 : 1.0;
        
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8 * glowMultiplier;
        ctx.fillStyle = `rgba(255, 255, 136, ${glowIntensity * glowMultiplier})`;
        
        // Left window
        ctx.fillRect(-size/3, -size/4, eyeSize, eyeSize);
        // Right window
        ctx.fillRect(size/6, -size/4, eyeSize, eyeSize);
        
        ctx.shadowBlur = 0;
        
        // Window frames
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(-size/3, -size/4, eyeSize, eyeSize);
        ctx.strokeRect(size/6, -size/4, eyeSize, eyeSize);
    }

    drawDoor(ctx, size) {
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

    drawLegs(ctx) {
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = this.type === 'BIG' ? 5 : 3;
        ctx.lineCap = 'round';
        
        this.legs.forEach((leg, index) => {
            const legX = Math.cos(leg.angle + leg.offset) * leg.length;
            const legY = Math.sin(leg.angle + leg.offset) * leg.length;
            
            const midX = legX * 0.6;
            const midY = legY * 0.6;
            
            // Leg segments
            ctx.beginPath();
            ctx.moveTo(0, this.size * 0.3);
            ctx.lineTo(midX, midY + this.size * 0.3);
            ctx.lineTo(legX, legY + this.size * 0.3);
            ctx.stroke();
            
            // Joints
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(midX, midY + this.size * 0.3, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Feet
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(legX, legY + this.size * 0.3, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

// === GAME STATE ===
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
    
    // Scoring and progression
    score: 0,
    level: 1,
    startTime: 0,
    lastEnemySpawn: 0,
    lastPowerupSpawn: 0,
    lastScoreUpdate: 0,
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

// Initialize sound system
let soundSystem = null;

// === DRAWING FUNCTIONS ===
function drawPlayer() {
    const ctx = gameState.ctx;
    const player = gameState.player;
    if (!ctx || !player) return;
    
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Shield effect
    if (player.shieldTime > 0) {
        const shieldOpacity = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
        ctx.shadowColor = '#4488ff';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = `rgba(68, 136, 255, ${shieldOpacity})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, player.size + 8, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Player glow
    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur = 15;
    
    // Main body
    ctx.fillStyle = '#4488ff';
    ctx.beginPath();
    ctx.arc(0, 0, player.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#88bbff';
    ctx.beginPath();
    ctx.arc(0, 0, player.size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, player.size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Health indicator ring
    const healthPercent = player.health / player.maxHealth;
    if (healthPercent < 1) {
        const healthColor = healthPercent > 0.5 ? '#44ff44' : 
                           healthPercent > 0.2 ? '#ffaa44' : '#ff4444';
        
        ctx.strokeStyle = healthColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, player.size + 5, -Math.PI/2, -Math.PI/2 + (healthPercent * Math.PI * 2));
        ctx.stroke();
    }
    
    // Speed boost indicator
    if (player.speedBoostTime > 0) {
        const speedOpacity = Math.sin(Date.now() * 0.02) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255, 170, 68, ${speedOpacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, player.size + 12, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    ctx.restore();
}

// === MAIN GAME LOOP ===
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
    
    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Mouse events
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('dblclick', handleDoubleClick);
    
    // Keyboard events (for accessibility)
    canvas.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('keyup', handleKeyUp);
    
    // Context menu prevention
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    console.log('🎮 Input handlers initialized');
}

function handleTouchStart(e) {
    e.preventDefault();
    gameState.input.touchActive = true;
    
    const touch = e.touches[0];
    const rect = gameState.canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (gameState.canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (gameState.canvas.height / rect.height);
    
    startPlayerDrag(x, y);
    
    // Double tap detection
    const currentTime = Date.now();
    if (currentTime - gameState.input.lastTap < gameState.input.doubleTapDelay) {
        toggleFlashlight();
    }
    gameState.input.lastTap = currentTime;
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!gameState.player.isDragging || !gameState.input.touchActive) return;
    
    const touch = e.touches[0];
    const rect = gameState.canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (gameState.canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (gameState.canvas.height / rect.height);
    
    updatePlayerPosition(x, y);
}

function handleTouchEnd(e) {
    e.preventDefault();
    gameState.player.isDragging = false;
    gameState.input.touchActive = false;
}

function handleMouseDown(e) {
    gameState.input.mouseActive = true;
    
    const rect = gameState.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (gameState.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (gameState.canvas.height / rect.height);
    
    startPlayerDrag(x, y);
}

function handleMouseMove(e) {
    if (!gameState.player.isDragging || !gameState.input.mouseActive) return;
    
    const rect = gameState.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (gameState.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (gameState.canvas.height / rect.height);
    
    updatePlayerPosition(x, y);
}

function handleMouseUp(e) {
    gameState.player.isDragging = false;
    gameState.input.mouseActive = false;
}

function handleDoubleClick(e) {
    e.preventDefault();
    toggleFlashlight();
}

function handleKeyDown(e) {
    switch (e.code) {
        case 'Space':
        case 'KeyF':
            e.preventDefault();
            toggleFlashlight();
            break;
        case 'KeyP':
        case 'Pause':
            e.preventDefault();
            togglePause();
            break;
        case 'KeyM':
            e.preventDefault();
            soundSystem.toggle();
            break;
    }
}

function handleKeyUp(e) {
    // Handle key releases if needed
}

function startPlayerDrag(x, y) {
    const player = gameState.player;
    if (!player) return;
    
    const dx = x - player.x;
    const dy = y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < player.size + 20) {
        player.isDragging = true;
        player.dragOffset = { x: dx, y: dy };
    }
}

function updatePlayerPosition(x, y) {
    const player = gameState.player;
    if (!player) return;
    
    player.x = x - player.dragOffset.x;
    player.y = y - player.dragOffset.y;
    
    constrainPlayer();
}

function constrainPlayer() {
    const player = gameState.player;
    const canvas = gameState.canvas;
    if (!player || !canvas) return;
    
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
    
    // Track flashlight usage
    if (window.analytics) {
        window.analytics.trackFeatureUsage('flashlight', gameState.flashlight.on ? 'on' : 'off');
    }
    
    console.log(`🔦 Flashlight ${gameState.flashlight.on ? 'ON' : 'OFF'}`);
}

function togglePause() {
    gameState.paused = !gameState.paused;
    
    if (gameState.paused) {
        // Show pause overlay
        console.log('⏸️ Game paused');
    } else {
        // Resume game loop
        if (gameState.running) {
            gameLoop();
        }
        console.log('▶️ Game resumed');
    }
}

// === SHARE FUNCTIONALITY ===
function showShareModal() {
    const shareModal = document.getElementById('shareModal');
    const shareScoreValue = document.getElementById('shareScoreValue');
    const shareTimeValue = document.getElementById('shareTimeValue');
    const shareLevelValue = document.getElementById('shareLevelValue');
    const shareTextPreview = document.getElementById('shareTextPreview');
    
    if (!shareModal) {
        console.error('Share modal not found');
        return;
    }
    
    // Get current game stats
    const finalScore = document.getElementById('finalScore')?.textContent || '0';
    const finalTime = document.getElementById('finalTime')?.textContent || '0';
    const finalLevel = document.getElementById('finalLevel')?.textContent || '1';
    
    // Update share modal content
    if (shareScoreValue) shareScoreValue.textContent = finalScore;
    if (shareTimeValue) shareTimeValue.textContent = finalTime;
    if (shareLevelValue) shareLevelValue.textContent = finalLevel;
    
    // Generate share text
    const shareText = `I just survived for ${finalTime} seconds in House Head Chase! 🏠👾 Reached level ${finalLevel} with ${finalScore} points. Can you beat my score? Play free at: ${window.location.href}`;
    if (shareTextPreview) shareTextPreview.textContent = shareText;
    
    // Show modal
    hideAllScreens();
    shareModal.classList.remove('hidden');
    
    // Track share modal display
    if (window.analytics) {
        window.analytics.trackEvent('share_modal_opened', {
            score: parseInt(finalScore) || 0,
            time: parseInt(finalTime) || 0,
            level: parseInt(finalLevel) || 1
        });
    }
    
    console.log('📤 Share modal displayed');
}

function closeShareModal() {
    const shareModal = document.getElementById('shareModal');
    if (shareModal) {
        shareModal.classList.add('hidden');
        showScreen('gameOver');
    }
}

function shareToTwitter() {
    const shareText = document.getElementById('shareTextPreview')?.textContent || '';
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420,scrollbars=yes,resizable=yes');
    
    if (window.analytics) {
        window.analytics.trackShareScore('twitter', gameState.score || 0, gameState.level || 1);
    }
}

function shareToFacebook() {
    const gameUrl = window.location.href;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(gameUrl)}`;
    window.open(facebookUrl, '_blank', 'width=580,height=296,scrollbars=yes,resizable=yes');
    
    if (window.analytics) {
        window.analytics.trackShareScore('facebook', gameState.score || 0, gameState.level || 1);
    }
}

function shareToReddit() {
    const shareText = document.getElementById('shareTextPreview')?.textContent || '';
    const gameUrl = window.location.href;
    const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(gameUrl)}&title=${encodeURIComponent(shareText)}`;
    window.open(redditUrl, '_blank', 'width=600,height=500,scrollbars=yes,resizable=yes');
    
    if (window.analytics) {
        window.analytics.trackShareScore('reddit', gameState.score || 0, gameState.level || 1);
    }
}

function copyScoreToClipboard() {
    const shareText = document.getElementById('shareTextPreview')?.textContent || '';
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText).then(() => {
            showTemporaryMessage('Score copied to clipboard!');
            if (window.analytics) {
                window.analytics.trackShareScore('clipboard', gameState.score || 0, gameState.level || 1);
            }
        }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
            fallbackCopyToClipboard(shareText);
        });
    } else {
        fallbackCopyToClipboard(shareText);
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
            showTemporaryMessage('Score copied to clipboard!');
            if (window.analytics) {
                window.analytics.trackShareScore('clipboard_fallback', gameState.score || 0, gameState.level || 1);
            }
        } else {
            showTemporaryMessage('Failed to copy score');
        }
    } catch (err) {
        console.error('Fallback copy failed:', err);
        showTemporaryMessage('Copy not supported in this browser');
    }
    
    document.body.removeChild(textArea);
}

function showTemporaryMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'temp-message';
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(68, 255, 68, 0.95);
        color: #000;
        padding: 10px 20px;
        border-radius: 20px;
        font-weight: bold;
        z-index: 9000;
        font-size: 14px;
        box-shadow: 0 4px 15px rgba(68, 255, 68, 0.4);
        animation: tempMessageFade 2s ease-out forwards;
    `;
    
    // Add animation keyframes if not already present
    if (!document.querySelector('style[data-temp-message]')) {
        const style = document.createElement('style');
        style.setAttribute('data-temp-message', 'true');
        style.textContent = `
            @keyframes tempMessageFade {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (document.body.contains(messageDiv)) {
            document.body.removeChild(messageDiv);
        }
    }, 2000);
}

// === MAIN GAME FUNCTIONS ===
async function startGame() {
    try {
        console.log('🎮 Starting House Head Chase...');
        
        // Wait for configuration
        gameState.config = await waitForConfig();
        
        hideAllScreens();
        
        gameState.canvas = document.getElementById('gameCanvas');
        if (!gameState.canvas) {
            throw new Error('Canvas not found!');
        }
        
        gameState.ctx = gameState.canvas.getContext('2d');
        if (!gameState.ctx) {
            throw new Error('Could not get canvas context!');
        }
        
        // Initialize sound system
        if (!soundSystem) {
            soundSystem = new SoundSystem();
        }
        await soundSystem.init(gameState.config);
        
        resizeCanvas();
        
        gameState.canvas.classList.add('active');
        gameState.canvas.style.pointerEvents = 'auto';
        
        // Show HUD
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('powerupIndicators').classList.remove('hidden');
        
        // Initialize game state
        resetGameState();
        
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
        gameState.running = true;
        gameLoop();
        
        // Track game start
        if (window.analytics) {
            window.analytics.trackGameStart();
        }
        
        console.log(`🎮 Game started! Canvas: ${gameState.canvas.width}x${gameState.canvas.height}`);
        
    } catch (error) {
        console.error('❌ Failed to start game:', error);
        showErrorBoundary(error.message);
        
        if (window.analytics) {
            window.analytics.trackError(error, 'game_start');
        }
    }
}

function resetGameState() {
    const canvas = gameState.canvas;
    const config = gameState.config;
    
    gameState.player = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        size: config?.game.player.size || 15,
        health: config?.game.player.maxHealth || 100,
        maxHealth: config?.game.player.maxHealth || 100,
        speed: config?.game.player.baseSpeed || 3,
        baseSpeed: config?.game.player.baseSpeed || 3,
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
        shieldTime: 0,
        speedBoostTime: 0,
        velocity: { x: 0, y: 0 },
        invulnerabilityTime: 0
    };
    
    gameState.enemies = [];
    gameState.powerups = [];
    gameState.activePowerups = [];
    gameState.score = 0;
    gameState.level = 1;
    gameState.difficulty = 1;
    gameState.startTime = Date.now();
    gameState.lastEnemySpawn = 0;
    gameState.lastPowerupSpawn = 0;
    gameState.lastScoreUpdate = Date.now();
    gameState.spawnRate = config?.game.difficulty.spawnRateBase || 3000;
    gameState.powerupSpawnRate = config?.game.difficulty.powerupSpawnBase || 12000;
    gameState.totalEnemiesSpawned = 0;
    
    gameState.flashlight = {
        on: false,
        intensity: 0,
        radius: config?.game.flashlight.radius || 200,
        fadeSpeed: config?.game.flashlight.fadeSpeed || 0.1,
        batteryLife: 100
    };
    
    gameState.camera = {
        shake: 0,
        intensity: 0
    };
    
    gameState.stats = {
        enemiesEncountered: 0,
        powerupsCollected: 0,
        totalDamage: 0,
        highestLevel: 1,
        longestSurvival: 0
    };
    
    gameState.performance = {
        frameCount: 0,
        lastFPSUpdate: Date.now(),
        currentFPS: 60
    };
}

function endGame() {
    gameState.running = false;
    
    if (gameState.canvas) {
        gameState.canvas.classList.remove('active');
        gameState.canvas.style.pointerEvents = 'none';
    }
    
    const survivalTime = Math.floor((Date.now() - gameState.startTime) / 1000);
    gameState.stats.longestSurvival = Math.max(gameState.stats.longestSurvival, survivalTime);
    
    // Save high score
    saveHighScore(survivalTime, gameState.level);
    
    // Update game over screen
    document.getElementById('finalScore').textContent = survivalTime;
    document.getElementById('finalTime').textContent = survivalTime;
    document.getElementById('finalLevel').textContent = gameState.level;
    
    // Hide HUD
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('powerupIndicators').classList.add('hidden');
    document.getElementById('flashlightIndicator').classList.add('hidden');
    document.getElementById('controlsHint').classList.add('hidden');
    
    // Show game over screen
    showScreen('gameOver');
    
    // Track game over
    if (window.analytics) {
        window.analytics.trackGameOver(
            survivalTime,
            gameState.level,
            survivalTime,
            'health_depleted'
        );
    }
    
    console.log('🎮 Game Over! Survival time:', survivalTime, 'seconds');
}

// === UTILITY FUNCTIONS ===
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

// === UI FUNCTIONS ===
function updateUI() {
    const health = Math.max(0, Math.floor(gameState.player?.health || 0));
    const maxHealth = gameState.player?.maxHealth || 100;
    
    const healthEl = document.getElementById('health');
    const healthFillEl = document.getElementById('healthFill');
    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');
    
    if (healthEl) healthEl.textContent = health;
    if (healthFillEl) healthFillEl.style.width = (health / maxHealth * 100) + '%';
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
        const config = powerup.config || PowerupTypes[powerup.type];
        
        indicator.innerHTML = `
            <span>${config?.emoji || '⚡'}</span>
            <span>${timeLeft}s</span>
        `;
        
        container.appendChild(indicator);
    });
}

// === HIGH SCORES SYSTEM ===
function saveHighScore(score, level) {
    console.log(`💾 Saving high score: ${score}s, level ${level}`);
    
    try {
        const config = window.GameConfig;
        const storageKey = config ? config.utils.getStorageKey('highScores') : 'houseHeadChase_highScores';
        
        let highScores = [];
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                highScores = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error loading high scores:', e);
            highScores = [];
        }
        
        const newScore = {
            score: score,
            level: level,
            date: new Date().toISOString(),
            timestamp: Date.now(),
            version: config?.version || '2.0.0'
        };
        
        highScores.push(newScore);
        highScores.sort((a, b) => b.score - a.score);
        highScores = highScores.slice(0, 10); // Keep top 10
        
        localStorage.setItem(storageKey, JSON.stringify(highScores));
        
        // Check if this is a new high score
        const isNewBest = highScores[0].score === score && highScores[0].timestamp === newScore.timestamp;
        
        if (isNewBest) {
            showNewHighScoreEffect(score);
            
            // Track high score achievement
            if (window.analytics) {
                const previousBest = highScores.length > 1 ? highScores[1].score : 0;
                window.analytics.trackHighScore(score, previousBest, 1);
            }
        }
        
        console.log('✅ High score saved successfully');
        
    } catch (error) {
        console.error('❌ Error saving high score:', error);
        if (window.analytics) {
            window.analytics.trackError(error, 'save_high_score');
        }
    }
}

function displayHighScores() {
    console.log('📊 Displaying high scores...');
    
    const listContainer = document.getElementById('highScoresList');
    if (!listContainer) {
        console.error('❌ High scores list container not found');
        return;
    }
    
    try {
        const config = window.GameConfig;
        const storageKey = config ? config.utils.getStorageKey('highScores') : 'houseHeadChase_highScores';
        
        let highScores = [];
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                highScores = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error loading high scores for display:', e);
        }
        
        if (highScores.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #888;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🏆</div>
                    <h3>No High Scores Yet!</h3>
                    <p>Be the first to set a record.<br>Survive as long as you can!</p>
                </div>
            `;
            return;
        }
        
        let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
        
        highScores.forEach((score, index) => {
            const date = new Date(score.date);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const medals = ['🥇', '🥈', '🥉'];
            const medal = index < 3 ? medals[index] : `#${index + 1}`;
            
            const isRecent = Date.now() - score.timestamp < 24 * 60 * 60 * 1000; // Last 24 hours
            
            html += `
                <div class="high-score-item ${isRecent ? 'recent-score' : ''}" style="
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    padding: 12px 16px; 
                    background: ${isRecent ? 'rgba(255, 68, 68, 0.15)' : 'rgba(255, 68, 68, 0.05)'}; 
                    border: 1px solid rgba(255, 68, 68, 0.3); 
                    border-radius: 8px;
                    transition: all 0.3s ease;
                    ${isRecent ? 'box-shadow: 0 0 15px rgba(255, 68, 68, 0.3);' : ''}
                ">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 20px; min-width: 35px; text-align: center;">${medal}</span>
                        <div>
                            <div style="font-weight: bold; color: #ff4444; font-size: 16px;">
                                ${score.score}s
                                ${isRecent ? '<span style="color: #ffaa44; font-size: 12px; margin-left: 8px;">NEW!</span>' : ''}
                            </div>
                            <div style="font-size: 11px; color: #888; margin-top: 2px;">
                                Level ${score.level} • ${dateStr} ${timeStr}
                            </div>
                        </div>
                    </div>
                    <div style="text-align: right; font-size: 12px; color: #666;">
                        <div>${score.score}s</div>
                        <div>L${score.level}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Add clear scores button if there are scores
        html += `
            <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <button id="clearScoresBtn" class="btn secondary" style="font-size: 12px; min-width: auto; padding: 6px 12px;" 
                        onclick="clearHighScores()">
                    🗑️ Clear All Scores
                </button>
            </div>
        `;
        
        listContainer.innerHTML = html;
        
        // Track high scores viewed
        if (window.analytics) {
            window.analytics.trackEvent('high_scores_viewed', {
                total_scores: highScores.length,
                user_best_score: highScores[0]?.score || 0
            });
        }
        
    } catch (error) {
        console.error('❌ Error displaying high scores:', error);
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #ff4444;">
                <p>❌ Error loading high scores</p>
                <button onclick="displayHighScores()" class="btn secondary" style="margin-top: 10px;">
                    Try Again
                </button>
            </div>
        `;
    }
}

function clearHighScores() {
    if (!confirm('🗑️ Are you sure you want to clear all high scores? This cannot be undone.')) {
        return;
    }
    
    try {
        const config = window.GameConfig;
        const storageKey = config ? config.utils.getStorageKey('highScores') : 'houseHeadChase_highScores';
        
        localStorage.removeItem(storageKey);
        displayHighScores(); // Refresh the display
        
        // Track score clearing
        if (window.analytics) {
            window.analytics.trackEvent('high_scores_cleared', {
                action_type: 'manual_clear'
            });
        }
        
        console.log('🧹 High scores cleared');
        
        // Show temporary message
        showTemporaryMessage('High scores cleared!');
        
    } catch (error) {
        console.error('❌ Error clearing high scores:', error);
        alert('Error clearing high scores. Please try again.');
    }
}

function showNewHighScoreEffect(score) {
    // Create achievement notification
    const achievement = document.createElement('div');
    achievement.className = 'achievement-notification';
    achievement.innerHTML = `
        <div class="achievement-content">
            <span class="achievement-icon">🏆</span>
            <div>
                <div style="font-weight: bold; color: #ffaa44;">NEW HIGH SCORE!</div>
                <div style="font-size: 14px;">${score} seconds survived</div>
            </div>
        </div>
    `;
    
    // Add to achievement notification area or create floating element
    const gameOverScreen = document.getElementById('gameOver');
    const achievementContainer = gameOverScreen?.querySelector('#achievementNotification');
    
    if (achievementContainer) {
        achievementContainer.innerHTML = '';
        achievementContainer.appendChild(achievement);
        achievementContainer.classList.remove('hidden');
    } else {
        // Create floating achievement
        achievement.style.cssText = `
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
            box-shadow: 0 8px 32px rgba(255, 170, 68, 0.6);
            animation: achievementBounce 0.8s ease-out;
        `;
        
        document.body.appendChild(achievement);
        
        setTimeout(() => {
            if (document.body.contains(achievement)) {
                document.body.removeChild(achievement);
            }
        }, 3000);
    }
    
    // Play celebration sound
    soundSystem.play('levelup', 440, 0.8, 0.4);
    
    console.log('🏆 New high score celebration displayed!');
}

// === UI ENHANCEMENT FUNCTIONS ===
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
                padding: 25px 35px;
                border-radius: 15px;
                text-align: center;
                font-family: 'Orbitron', monospace;
                font-weight: bold;
                z-index: 8000;
                animation: levelUpPulse 2s ease-out;
                backdrop-filter: blur(10px);
                border: 3px solid #ff4444;
                box-shadow: 0 0 30px rgba(255, 68, 68, 0.6);
            }
            @keyframes levelUpPulse {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                20% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    const levelDiv = document.createElement('div');
    levelDiv.className = 'level-up-effect';
    levelDiv.innerHTML = `
        <h2 style="margin: 0 0 8px 0; font-size: 24px;">🎊 LEVEL ${gameState.level}! 🎊</h2>
        <p style="margin: 0; font-size: 14px; opacity: 0.9;">Enemies getting smarter!</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #ffdddd;">Difficulty: ${(gameState.difficulty * 100).toFixed(0)}%</p>
    `;
    
    document.body.appendChild(levelDiv);
    
    setTimeout(() => {
        if (document.body.contains(levelDiv)) {
            document.body.removeChild(levelDiv);
        }
    }, 2000);
}

function showErrorBoundary(message) {
    const errorBoundary = document.getElementById('errorBoundary');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorBoundary && errorMessage) {
        errorMessage.textContent = message || 'An unexpected error occurred.';
        errorBoundary.classList.remove('hidden');
        
        // Track error display
        if (window.analytics) {
            window.analytics.trackEvent('error_boundary_shown', {
                error_message: message,
                page_location: window.location.href
            });
        }
    }
}

function reportError() {
    const errorMessage = document.getElementById('errorMessage')?.textContent || 'Unknown error';
    const config = window.GameConfig;
    
    const subject = encodeURIComponent('House Head Chase - Error Report');
    const body = encodeURIComponent(`
Error Details:
${errorMessage}

Technical Information:
- Browser: ${navigator.userAgent}
- URL: ${window.location.href}
- Time: ${new Date().toISOString()}
- Game Version: ${config?.version || 'Unknown'}
- Screen Resolution: ${screen.width}x${screen.height}
- Viewport: ${window.innerWidth}x${window.innerHeight}

Additional Context:
Please describe what you were doing when this error occurred.
    `.trim());
    
    const supportEmail = config?.urls?.support?.email || 'support@househeadchase.com';
    window.open(`mailto:${supportEmail}?subject=${subject}&body=${body}`);
    
    // Track error reporting
    if (window.analytics) {
        window.analytics.trackEvent('error_reported', {
            error_message: errorMessage,
            report_method: 'email'
        });
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
        
        // Track install prompt availability
        if (window.analytics) {
            window.analytics.trackEvent('pwa_install_prompt_shown', {
                source: 'browser_automatic'
            });
        }
    });
    
    // Listen for successful installation
    window.addEventListener('appinstalled', (e) => {
        console.log('✅ PWA installed successfully');
        hideInstallPrompt();
        
        showTemporaryMessage('📱 App Installed! Play offline anytime!');
        
        // Track successful installation
        if (window.analytics) {
            window.analytics.trackPWAInstall();
        }
        
        deferredPrompt = null;
    });
    
    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
        console.log('📱 Already running as installed app');
        hideInstallPrompt();
    }
}

function installPWA() {
    if (!deferredPrompt) {
        console.log('❌ Install prompt not available');
        showManualInstallInstructions();
        return;
    }
    
    console.log('📱 Showing install prompt...');
    deferredPrompt.prompt();
    
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('✅ User accepted install prompt');
            
            // Track user acceptance
            if (window.analytics) {
                window.analytics.trackEvent('pwa_install_accepted', {
                    prompt_source: 'custom_prompt'
                });
            }
        } else {
            console.log('❌ User dismissed install prompt');
            
            // Track user dismissal
            if (window.analytics) {
                window.analytics.trackEvent('pwa_install_dismissed', {
                    prompt_source: 'custom_prompt'
                });
            }
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

function showManualInstallInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let instructions = '';
    
    if (isIOS) {
        instructions = 'On iOS: Tap the Share button (📤) in Safari, then "Add to Home Screen"';
    } else if (isAndroid) {
        instructions = 'On Android: Tap the menu (⋮) in Chrome, then "Add to Home screen" or "Install app"';
    } else {
        instructions = 'Look for the install icon (📱) in your browser\'s address bar, or check the menu for "Install" option';
    }
    
    alert(`📱 Install House Head Chase as an app!\n\n${instructions}\n\nThis will allow you to play offline and get a full-screen experience!`);
    
    // Track manual instruction display
    if (window.analytics) {
        window.analytics.trackEvent('pwa_manual_instructions_shown', {
            device_type: isIOS ? 'ios' : isAndroid ? 'android' : 'desktop',
            user_agent: navigator.userAgent
        });
    }
}

// Add CSS animation for floating text
if (!document.querySelector('style[data-floating-text]')) {
    const style = document.createElement('style');
    style.setAttribute('data-floating-text', 'true');
    style.textContent = `
        @keyframes floatUp {
            0% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(-40px); opacity: 0; }
        }
        @keyframes damageFloat {
            0% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(-40px); opacity: 0; }
        }
        .floating-powerup-text {
            animation: floatUp 1.5s ease-out forwards;
        }
    `;
    document.head.appendChild(style);
}

// Enhanced navigation system setup
function setupNavigationSystem() {
    console.log('🔗 Setting up enhanced navigation system...');
    
    const buttons = {
        'startGameBtn': startGame,
        'restartGameBtn': () => startGame(),
        'showStartScreenBtn': () => showScreen('startScreen'),
        'showHighScoresBtn': showHighScores,
        'closeHighScoresBtn': closeHighScores,
        'closeHighScoresFooterBtn': closeHighScores,
        'showHelpBtn': showHelp,
        'closeHelpBtn': closeHelp,
        'closeHelpFooterBtn': closeHelp,
        'shareScoreBtn': showShareModal,
        'closeShareBtn': closeShareModal,
        'closeShareFooterBtn': closeShareModal,
        'shareTwitter': shareToTwitter,
        'shareFacebook': shareToFacebook,
        'shareReddit': shareToReddit,
        'copyScore': copyScoreToClipboard,
        'audioToggle': () => soundSystem?.toggle(),
        'installPWABtn': () => window.installPWA && window.installPWA(),
        'hideInstallBtn': () => window.hideInstallPrompt && window.hideInstallPrompt()
    };
    
    // Setup all button event listeners
    Object.entries(buttons).forEach(([buttonId, handler]) => {
        const button = document.getElementById(buttonId);
        if (button && handler) {
            // Remove existing listeners
            button.onclick = null;
            
            // Add new listener with error handling
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`🔘 Button clicked: ${buttonId}`);
                
                try {
                    handler();
                } catch (error) {
                    console.error(`❌ Button handler failed for ${buttonId}:`, error);
                    if (window.analytics) {
                        window.analytics.trackError(error, `button_${buttonId}`);
                    }
                }
            });
            console.log(`✅ Event listener attached to: ${buttonId}`);
        } else if (buttonId !== 'installPWABtn' && buttonId !== 'hideInstallBtn') {
            // Don't warn about PWA buttons as they might not exist
            console.warn(`⚠️ Button not found or handler missing: ${buttonId}`);
        }
    });
    
    // Setup modal close buttons (X buttons)
    const modals = ['highScoresModal', 'helpModal', 'shareModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    const closeFunction = modalId === 'shareModal' ? closeShareModal :
                                        modalId === 'helpModal' ? closeHelp : closeHighScores;
                    closeFunction();
                }
            });
        }
    });
    
    // Setup keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close any open modals
            const openModal = document.querySelector('.modal-overlay:not(.hidden)');
            if (openModal) {
                const modalId = openModal.id;
                if (modalId === 'shareModal') closeShareModal();
                else if (modalId === 'helpModal') closeHelp();
                else if (modalId === 'highScoresModal') closeHighScores();
            }
        }
    });
    
    console.log('✅ Enhanced navigation system initialized successfully!');
}

// === GLOBAL FUNCTION ASSIGNMENTS ===
window.startGame = startGame;
window.restartGame = () => startGame();
window.goToStartScreen = () => showScreen('startScreen');
window.showHighScores = () => {
    displayHighScores();
    showScreen('highScoresModal');
};
window.closeHighScores = () => showScreen('startScreen');
window.showHelp = () => showScreen('helpModal');
window.closeHelp = () => showScreen('startScreen');
window.showShareModal = showShareModal;
window.closeShareModal = closeShareModal;
window.saveHighScore = saveHighScore;
window.displayHighScores = displayHighScores;
window.clearHighScores = clearHighScores;
window.showErrorBoundary = showErrorBoundary;
window.reportError = reportError;
window.installPWA = installPWA;
window.hideInstallPrompt = hideInstallPrompt;

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🏠 House Head Chase - Complete Commercial Version Loading!');
    
    try {
        // Wait for configuration
        const config = await waitForConfig();
        console.log('✅ Configuration loaded:', config.version);
        
        // Initialize canvas
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            console.log('🎯 Canvas initialized:', canvas.width, 'x', canvas.height);
        }
        
        // Setup event listeners
        setupNavigationSystem();
        
        // Setup resize handlers
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));
        
        // Initialize PWA setup
        setupPWAInstall();
        
        // Show start screen
        showScreen('startScreen');
        
        console.log('✅ House Head Chase Complete Commercial Version loaded successfully!');
        
    } catch (error) {
        console.error('❌ Failed to initialize game:', error);
        showErrorBoundary('Failed to load the game. Please refresh the page.');
        
        if (window.analytics) {
            window.analytics.trackError(error, 'game_init');
        }
    }
});

// Make game state available for debugging
if (window.GameConfig?.features.debugMode) {
    window.debug = window.debug || {};
    window.debug.gameState = gameState;
    window.debug.soundSystem = soundSystem;
}

console.log('✅ COMPLETE COMMERCIAL House Head Chase loaded with all features!');

function drawFlashlight() {
    const flashlight = gameState.flashlight;
    if (!flashlight || !flashlight.on || flashlight.intensity <= 0) return;
    
    const ctx = gameState.ctx;
    const player = gameState.player;
    if (!ctx || !player) return;
    
    const intensity = flashlight.intensity;
    
    // Create radial gradient for flashlight effect
    const gradient = ctx.createRadialGradient(
        player.x, player.y, 0,
        player.x, player.y, flashlight.radius
    );
    
    gradient.addColorStop(0, `rgba(255, 255, 200, ${intensity * 0.6})`);
    gradient.addColorStop(0.3, `rgba(255, 255, 150, ${intensity * 0.4})`);
    gradient.addColorStop(0.7, `rgba(255, 255, 100, ${intensity * 0.2})`);
    gradient.addColorStop(1, 'rgba(255, 255, 50, 0)');
    
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    ctx.restore();
}

function drawBackground() {
    const ctx = gameState.ctx;
    const canvas = gameState.canvas;
    if (!ctx || !canvas) return;
    
    // Gradient background
    const gradient = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)
    );
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Animated stars
    const time = Date.now() * 0.001;
    ctx.fillStyle = '#ffffff';
    
    for (let i = 0; i < 50; i++) {
        const x = (i * 23.7 + time * 10) % canvas.width;
        const y = (i * 37.3) % (canvas.height - 80);
        const brightness = Math.sin(time + i) * 0.5 + 0.5;
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

// === GAME SYSTEMS ===
function spawnEnemy() {
    if (!gameState.config || !gameState.canvas) return;
    
    const currentTime = Date.now();
    if (currentTime - gameState.lastEnemySpawn < gameState.spawnRate) return;
    
    // Determine enemy type based on level and difficulty
    const rand = Math.random();
    const bigHouseChance = Math.min(0.25 + (gameState.level - 1) * 0.05, 0.4);
    const enemyType = rand < bigHouseChance ? 'BIG' : 'SMALL';
    
    // Find safe spawn position
    const spawnPosition = findSafeSpawnPosition();
    if (!spawnPosition) {
        console.warn('⚠️ Could not find safe spawn position');
        return;
    }
    
    // Create enemy
    const enemy = new Enemy(spawnPosition.x, spawnPosition.y, enemyType, gameState.config);
    gameState.enemies.push(enemy);
    gameState.totalEnemiesSpawned++;
    gameState.stats.enemiesEncountered++;
    gameState.lastEnemySpawn = currentTime;
    
    // Update spawn rate with balanced scaling
    gameState.spawnRate = Math.max(1500, 3500 - (gameState.level - 1) * 150);
    
    // Update debug display
    updateDebugDisplay();
    
    if (gameState.config?.features.consoleLogging) {
        console.log(`👻 Enemy spawned: ${enemyType}. Total: ${gameState.enemies.length}`);
    }
}

function findSafeSpawnPosition() {
    const canvas = gameState.canvas;
    const player = gameState.player;
    if (!canvas || !player) return null;
    
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
        const spawnMargin = 120;
        const centerAvoidanceRadius = Math.min(200, Math.max(canvas.width, canvas.height) * 0.25);
        
        // Try to spawn away from center and other enemies
        const angle = Math.random() * Math.PI * 2;
        const distance = spawnMargin + Math.random() * (centerAvoidanceRadius - spawnMargin);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        let x = centerX + Math.cos(angle) * distance;
        let y = centerY + Math.sin(angle) * distance;
        
        // Clamp to boundaries
        x = Math.max(80, Math.min(canvas.width - 80, x));
        y = Math.max(150, Math.min(canvas.height - 80, y));
        
        // Check distance from player
        const playerDistance = Math.sqrt(
            Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2)
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
        
        if (playerDistance > 180 && !tooCloseToOthers) {
            return { x, y };
        }
        
        attempts++;
    }
    
    return null;
}

function spawnPowerup() {
    if (!gameState.config || !gameState.canvas) return;
    
    const currentTime = Date.now();
    if (currentTime - gameState.lastPowerupSpawn < gameState.powerupSpawnRate) return;
    
    // Determine powerup type based on weights and game state
    const powerupType = selectPowerupType();
    
    // Find safe spawn position
    const spawnPosition = findSafePowerupPosition();
    if (!spawnPosition) {
        console.warn('⚠️ Could not find safe powerup position');
        return;
    }
    
    const powerup = new Powerup(spawnPosition.x, spawnPosition.y, powerupType, gameState.config);
    gameState.powerups.push(powerup);
    gameState.lastPowerupSpawn = currentTime;
    
    // Adjust spawn rate
    gameState.powerupSpawnRate = Math.max(8000, 12000 - (gameState.level - 1) * 200);
    
    if (gameState.config?.features.consoleLogging) {
        console.log(`⚡ Powerup spawned: ${powerupType}. Total: ${gameState.powerups.length}`);
    }
}

function selectPowerupType() {
    const player = gameState.player;
    if (!player) return 'HEALTH';
    
    // Intelligent powerup selection based on player state
    if (player.health < 30) {
        return 'HEALTH'; // Prioritize health when low
    }
    
    const rand = Math.random();
    let cumulativeWeight = 0;
    
    for (const [type, config] of Object.entries(PowerupTypes)) {
        cumulativeWeight += config.spawnWeight;
        if (rand < cumulativeWeight) {
            return type;
        }
    }
    
    return 'HEALTH'; // Fallback
}

function findSafePowerupPosition() {
    const canvas = gameState.canvas;
    const player = gameState.player;
    if (!canvas || !player) return null;
    
    let attempts = 0;
    const maxAttempts = 20;
    
    while (attempts < maxAttempts) {
        const x = 80 + Math.random() * (canvas.width - 160);
        const y = 120 + Math.random() * (canvas.height - 200);
        
        const playerDistance = Math.sqrt(
            Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2)
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
        
        if (playerDistance > 100 && !tooCloseToEnemy) {
            return { x, y };
        }
        
        attempts++;
    }
    
    return null;
}

function updateGame() {
    if (!gameState.running) return;
    
    const currentTime = Date.now();
    
    // Update performance tracking
    updatePerformanceMetrics();
    
    // Update flashlight
    updateFlashlight();
    
    // Update player effects
    updatePlayerEffects();
    
    // Update active powerups
    updateActivePowerups();
    
    // Update game objects
    gameState.enemies = gameState.enemies.filter(enemy => enemy.update());
    gameState.powerups = gameState.powerups.filter(powerup => powerup.update());
    
    // Spawn new entities
    spawnEnemy();
    spawnPowerup();
    
    // Update score and level
    updateScoreAndLevel(currentTime);
    
    // Update camera effects
    updateCameraEffects();
    
    // Check game over condition
    if (gameState.player.health <= 0) {
        endGame();
    }
    
    // Update UI
    updateUI();
}

function updatePerformanceMetrics() {
    gameState.performance.frameCount++;
    
    const currentTime = Date.now();
    if (currentTime - gameState.performance.lastFPSUpdate > 1000) {
        gameState.performance.currentFPS = Math.round(
            (gameState.performance.frameCount * 1000) / 
            (currentTime - gameState.performance.lastFPSUpdate)
        );
        gameState.performance.frameCount = 0;
        gameState.performance.lastFPSUpdate = currentTime;
        
        updateDebugDisplay();
    }
}

function updateFlashlight() {
    const flashlight = gameState.flashlight;
    if (!flashlight) return;
    
    if (flashlight.on) {
        flashlight.intensity = Math.min(1, flashlight.intensity + flashlight.fadeSpeed);
    } else {
        flashlight.intensity = Math.max(0, flashlight.intensity - flashlight.fadeSpeed);
    }
}

function updatePlayerEffects() {
    const player = gameState.player;
    if (!player) return;
    
    // Update shield
    if (player.shieldTime > 0) {
        player.shieldTime -= 16;
    }
    
    // Update speed boost
    if (player.speedBoostTime > 0) {
        player.speedBoostTime -= 16;
        if (player.speedBoostTime <= 0) {
            player.speed = player.baseSpeed;
        }
    }
    
    // Update invulnerability
    if (player.invulnerabilityTime > 0) {
        player.invulnerabilityTime -= 16;
    }
}

function updateActivePowerups() {
    gameState.activePowerups = gameState.activePowerups.filter(powerup => {
        powerup.timeLeft -= 16;
        return powerup.timeLeft > 0;
    });
}

function updateScoreAndLevel(currentTime) {
    // Update score
    if (currentTime - gameState.lastScoreUpdate > 1000) {
        gameState.score++;
        gameState.lastScoreUpdate = currentTime;
    }
    
    // Check for level up
    const newLevel = Math.floor(gameState.score / 45) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameState.stats.highestLevel = Math.max(gameState.stats.highestLevel, newLevel);
        gameState.difficulty = 1 + (gameState.level - 1) * 0.15;
        
        soundSystem.play('levelup');
        showLevelUpEffect();
        
        // Track level up
        if (window.analytics) {
            window.analytics.trackLevelUp(newLevel, gameState.score, gameState.score);
        }
        
        console.log(`🎊 Level up! Now level ${gameState.level} (Difficulty: ${gameState.difficulty.toFixed(2)})`);
    }
}

function updateCameraEffects() {
    if (gameState.camera.shake > 0) {
        gameState.camera.shake--;
        gameState.camera.intensity = Math.max(0, gameState.camera.intensity - 0.5);
    }
}

function updateDebugDisplay() {
    if (!gameState.config?.features.debugMode) return;
    
    const fpsCounter = document.getElementById('fpsCounter');
    const enemyCount = document.getElementById('enemyCount');
    const memoryUsage = document.getElementById('memoryUsage');
    
    if (fpsCounter) {
        fpsCounter.textContent = gameState.performance.currentFPS;
    }
    
    if (enemyCount) {
        enemyCount.textContent = gameState.enemies.length;
    }
    
    if (memoryUsage && performance.memory) {
        const memoryMB = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
        memoryUsage.textContent = memoryMB + 'MB';
    }
}

function drawGame() {
    if (!gameState.running || !gameState.ctx) return;
    
    const ctx = gameState.ctx;
    
    // Clear canvas
    ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    
    ctx.save();
    
    // Apply camera shake
    if (gameState.camera.shake > 0) {
        const shakeX = (Math.random() - 0.5) * gameState.camera.intensity;
        const shakeY = (Math.random() - 0.5) * gameState.camera.intensity;
        ctx.translate(shakeX, shakeY);
    }
    
    // Draw game layers
    drawBackground();
    drawFlashlight();
    
    // Draw game objects
    gameState.powerups.forEach(powerup => powerup.draw());
    gameState.enemies.forEach(enemy => enemy.draw());
    drawPlayer();
    
    ctx.restore();
}
