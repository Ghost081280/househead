// Key changes needed in the existing game.js file for time-focused gameplay

// === UPDATED GAME STATE ===
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

// === UPDATED TIME FORMATTING FUNCTION ===
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// === UPDATED TIME CALCULATION ===
function getCurrentSurvivalTime() {
    if (!gameState.startTime) return 0;
    return Math.floor((Date.now() - gameState.startTime) / 1000);
}

// === UPDATED UI FUNCTION ===
function updateUI() {
    const health = Math.max(0, Math.floor(gameState.player?.health || 0));
    const maxHealth = gameState.player?.maxHealth || 100;
    const survivalTime = getCurrentSurvivalTime();
    
    const healthEl = document.getElementById('health');
    const healthFillEl = document.getElementById('healthFill');
    const survivalTimeEl = document.getElementById('survivalTime');
    const levelEl = document.getElementById('level');
    
    if (healthEl) healthEl.textContent = health;
    if (healthFillEl) healthFillEl.style.width = (health / maxHealth * 100) + '%';
    if (survivalTimeEl) survivalTimeEl.textContent = formatTime(survivalTime);
    if (levelEl) levelEl.textContent = gameState.level;
    
    updatePowerupIndicators();
}

// === UPDATED LEVEL PROGRESSION (TIME-BASED) ===
function updateLevelProgression(currentTime) {
    const survivalTime = getCurrentSurvivalTime();
    
    // Level up every 30 seconds instead of score-based
    const newLevel = Math.floor(survivalTime / 30) + 1;
    
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameState.stats.highestLevel = Math.max(gameState.stats.highestLevel, newLevel);
        gameState.difficulty = 1 + (gameState.level - 1) * 0.15;
        
        soundSystem.play('levelup');
        showLevelUpEffect();
        
        // Track level up with time
        if (window.analytics) {
            window.analytics.trackLevelUp(newLevel, survivalTime, survivalTime);
        }
        
        // Show time milestone for significant achievements
        if (survivalTime > 0 && survivalTime % 60 === 0) {
            showTimeMilestone(survivalTime);
        }
        
        console.log(`🎊 Level up! Now level ${gameState.level} (Survival: ${formatTime(survivalTime)})`);
    }
}

// === NEW TIME MILESTONE FUNCTION ===
function showTimeMilestone(survivalTimeSeconds) {
    const minutes = Math.floor(survivalTimeSeconds / 60);
    
    if (minutes === 0) return; // Don't show for less than 1 minute
    
    const milestoneDiv = document.createElement('div');
    milestoneDiv.className = 'time-milestone';
    
    let milestoneText = '';
    let milestoneEmoji = '';
    
    if (minutes === 1) {
        milestoneText = '1 MINUTE SURVIVED!';
        milestoneEmoji = '🎯';
    } else if (minutes === 2) {
        milestoneText = '2 MINUTES! IMPRESSIVE!';
        milestoneEmoji = '🔥';
    } else if (minutes === 3) {
        milestoneText = '3 MINUTES! AMAZING!';
        milestoneEmoji = '⭐';
    } else if (minutes === 5) {
        milestoneText = '5 MINUTES! LEGENDARY!';
        milestoneEmoji = '👑';
    } else if (minutes >= 10) {
        milestoneText = `${minutes} MINUTES! GODLIKE!`;
        milestoneEmoji = '🚀';
    } else {
        milestoneText = `${minutes} MINUTES SURVIVED!`;
        milestoneEmoji = '🏆';
    }
    
    milestoneDiv.innerHTML = `
        <h2 style="margin: 0 0 8px 0; font-size: 24px;">${milestoneEmoji} ${milestoneText} ${milestoneEmoji}</h2>
        <p style="margin: 0; font-size: 14px; opacity: 0.9;">Keep going! You're doing great!</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #ffdddd;">Level: ${gameState.level}</p>
    `;
    
    document.body.appendChild(milestoneDiv);
    
    // Add glow effect to time displays
    document.body.classList.add('time-milestone-active');
    
    setTimeout(() => {
        if (document.body.contains(milestoneDiv)) {
            document.body.removeChild(milestoneDiv);
        }
        document.body.classList.remove('time-milestone-active');
    }, 2000);
    
    // Track time milestone
    if (window.analytics) {
        window.analytics.trackEvent('time_milestone', {
            minutes_survived: minutes,
            level_reached: gameState.level,
            milestone_type: minutes >= 5 ? 'major' : 'standard'
        });
    }
}

// === UPDATED GAME UPDATE FUNCTION ===
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
    
    // Update level progression (time-based instead of score-based)
    updateLevelProgression(currentTime);
    
    // Update camera effects
    updateCameraEffects();
    
    // Check game over condition
    if (gameState.player.health <= 0) {
        endGame();
    }
    
    // Update UI
    updateUI();
}

// === UPDATED END GAME FUNCTION ===
function endGame() {
    gameState.running = false;
    
    if (gameState.canvas) {
        gameState.canvas.classList.remove('active');
        gameState.canvas.style.pointerEvents = 'none';
    }
    
    const survivalTime = getCurrentSurvivalTime();
    gameState.stats.longestSurvival = Math.max(gameState.stats.longestSurvival, survivalTime);
    
    // Save high score (now based on time)
    saveHighScore(survivalTime, gameState.level);
    
    // Update game over screen with time
    document.getElementById('finalTime').textContent = formatTime(survivalTime);
    document.getElementById('finalLevel').textContent = gameState.level;
    
    // Hide HUD
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('powerupIndicators').classList.add('hidden');
    document.getElementById('flashlightIndicator').classList.add('hidden');
    document.getElementById('controlsHint').classList.add('hidden');
    
    // Show game over screen
    showScreen('gameOver');
    
    // Track game over with time
    if (window.analytics) {
        window.analytics.trackGameOver(
            survivalTime,
            gameState.level,
            survivalTime,
            'health_depleted'
        );
    }
    
    console.log('🎮 Game Over! Survival time:', formatTime(survivalTime));
}

// === UPDATED SHARE FUNCTIONALITY ===
function showShareModal() {
    const shareModal = document.getElementById('shareModal');
    const shareTimeValue = document.getElementById('shareTimeValue');
    const shareLevelValue = document.getElementById('shareLevelValue');
    const shareTextPreview = document.getElementById('shareTextPreview');
    
    if (!shareModal) {
        console.error('Share modal not found');
        return;
    }
    
    // Get current game stats
    const finalTime = document.getElementById('finalTime')?.textContent || '0:00';
    const finalLevel = document.getElementById('finalLevel')?.textContent || '1';
    
    // Update share modal content
    if (shareTimeValue) shareTimeValue.textContent = finalTime;
    if (shareLevelValue) shareLevelValue.textContent = finalLevel;
    
    // Generate time-focused share text
    const shareText = `I just survived for ${finalTime} in House Head Chase! 🏠👾 Reached level ${finalLevel}. Can you beat my survival time? Play free at: ${window.location.href}`;
    if (shareTextPreview) shareTextPreview.textContent = shareText;
    
    // Show modal
    hideAllScreens();
    shareModal.classList.remove('hidden');
    
    // Track share modal display
    if (window.analytics) {
        const timeInSeconds = getCurrentSurvivalTime();
        window.analytics.trackEvent('share_modal_opened', {
            survival_time: timeInSeconds,
            level: parseInt(finalLevel) || 1,
            time_formatted: finalTime
        });
    }
    
    console.log('📤 Share modal displayed');
}

// === UPDATED HIGH SCORES DISPLAY ===
function displayHighScores() {
    console.log('📊 Displaying survival times...');
    
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
                    <div style="font-size: 48px; margin-bottom: 16px;">⏰</div>
                    <h3>No Survival Times Yet!</h3>
                    <p>Be the first to set a record.<br>Survive as long as you can!</p>
                </div>
            `;
            return;
        }
        
        let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
        
        highScores.forEach((record, index) => {
            const date = new Date(record.date);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const medals = ['🥇', '🥈', '🥉'];
            const medal = index < 3 ? medals[index] : `#${index + 1}`;
            
            const isRecent = Date.now() - record.timestamp < 24 * 60 * 60 * 1000; // Last 24 hours
            const survivalTimeFormatted = formatTime(record.score);
            
            html += `
                <div class="high-score-item survival-time-item ${isRecent ? 'recent-score' : ''}" style="
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    padding: 12px 16px; 
                    background: ${isRecent ? 'rgba(255, 170, 68, 0.15)' : 'rgba(255, 170, 68, 0.08)'}; 
                    border: 1px solid rgba(255, 170, 68, 0.3); 
                    border-radius: 8px;
                    transition: all 0.3s ease;
                    ${isRecent ? 'box-shadow: 0 0 15px rgba(255, 170, 68, 0.3);' : ''}
                ">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 20px; min-width: 35px; text-align: center;">${medal}</span>
                        <div>
                            <div class="survival-time-value" style="font-weight: bold; color: #ffaa44; font-size: 16px;">
                                ${survivalTimeFormatted}
                                ${isRecent ? '<span style="color: #ff6644; font-size: 12px; margin-left: 8px;">NEW!</span>' : ''}
                            </div>
                            <div style="font-size: 11px; color: #888; margin-top: 2px;">
                                Level ${record.level} • ${dateStr} ${timeStr}
                            </div>
                        </div>
                    </div>
                    <div style="text-align: right; font-size: 12px; color: #666;">
                        <div>${survivalTimeFormatted}</div>
                        <div>L${record.level}</div>
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
                    🗑️ Clear All Times
                </button>
            </div>
        `;
        
        listContainer.innerHTML = html;
        
        // Track high scores viewed
        if (window.analytics) {
            window.analytics.trackEvent('survival_times_viewed', {
                total_records: highScores.length,
                user_best_time: highScores[0]?.score || 0
            });
        }
        
    } catch (error) {
        console.error('❌ Error displaying survival times:', error);
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #ff4444;">
                <p>❌ Error loading survival times</p>
                <button onclick="displayHighScores()" class="btn secondary" style="margin-top: 10px;">
                    Try Again
                </button>
            </div>
        `;
    }
}

// === UPDATED NEW HIGH SCORE EFFECT ===
function showNewHighScoreEffect(survivalTimeSeconds) {
    // Create achievement notification
    const achievement = document.createElement('div');
    achievement.className = 'achievement-notification';
    const timeFormatted = formatTime(survivalTimeSeconds);
    
    achievement.innerHTML = `
        <div class="achievement-content">
            <span class="achievement-icon">🏆</span>
            <div>
                <div style="font-weight: bold; color: #ffaa44;">NEW BEST TIME!</div>
                <div style="font-size: 14px;">${timeFormatted} survived</div>
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
    
    console.log('🏆 New best time celebration displayed!');
}

// This represents the key changes needed - the complete file would include all the 
// previous functionality but with these time-focused updates integrated throughout
