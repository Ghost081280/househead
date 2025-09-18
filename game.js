// === MAIN GAME FUNCTIONS ===
function endGame() {
    gameState.running = false;
    
    if (gameState.canvas) {
        gameState.canvas.classList.remove('active');
        gameState.canvas.style.pointerEvents = 'none';
    }
    
    const survivalTime = Math.floor((Date.now() - gameState.startTime) / 1000);
    const level = gameState.level;
    
    // Generate player name
    let playerName;
    if (window.firebaseManager && window.firebaseManager.user) {
        // Use signed-in user's name
        playerName = window.firebaseManager.user.displayName || window.GameConfig?.utils?.generatePlayerName() || 'Anonymous Player';
    } else {
        // Generate a random player name for anonymous players
        playerName = window.GameConfig?.utils?.generatePlayerName() || 'Anonymous Player';
    }
    
    // Save high score locally
    saveHighScore(survivalTime, level);
    
    // Submit to Firebase (both signed-in and anonymous players)
    if (window.firebaseManager) {
        console.log(`📤 Submitting score to Firebase: ${playerName}, ${survivalTime}s, Level ${level}`);
        
        window.firebaseManager.submitScore(playerName, survivalTime, level)
            .then(success => {
                if (success) {
                    console.log('✅ Score successfully submitted to global leaderboard');
                    // Show success message
                    if (typeof showPowerupMessage === 'function') {
                        showPowerupMessage('📤 Score submitted to global leaderboard!');
                    }
                    
                    // Update the global leaderboard display if visible
                    setTimeout(() => {
                        if (window.firebaseManager.updateGlobalLeaderboard) {
                            window.firebaseManager.updateGlobalLeaderboard();
                        }
                    }, 1000);
                } else {
                    console.log('⚠️ Score saved locally - will sync when online');
                    if (typeof showPowerupMessage === 'function') {
                        showPowerupMessage('💾 Score saved locally - will sync when online');
                    }
                }
            })
            .catch(error => {
                console.error('❌ Error submitting score:', error);
                if (typeof showPowerupMessage === 'function') {
                    showPowerupMessage('⚠️ Score saved locally only');
                }
            });
    } else {
        console.log('⚠️ Firebase not available - score saved locally only');
    }
    
    // Update UI with game results
    document.getElementById('finalTime').textContent = formatTime(survivalTime);
    document.getElementById('finalLevel').textContent = level;
    
    // Show global rank if available and user is signed in
    if (window.firebaseManager && window.firebaseManager.user) {
        // Try to get updated rank information
        setTimeout(async () => {
            try {
                const scores = await window.firebaseManager.getGlobalLeaderboard(100); // Get more scores to calculate rank
                const userScores = scores.filter(score => score.isCurrentUser);
                if (userScores.length > 0) {
                    const userBestScore = Math.max(...userScores.map(score => score.survivalTime));
                    const rank = scores.filter(score => score.survivalTime > userBestScore).length + 1;
                    
                    const globalRankInfo = document.getElementById('globalRankInfo');
                    const globalRank = document.getElementById('globalRank');
                    if (globalRankInfo && globalRank) {
                        globalRank.textContent = `#${rank}`;
                        globalRankInfo.classList.remove('hidden');
                    }
                }
            } catch (error) {
                console.error('❌ Failed to get rank information:', error);
            }
        }, 2000);
    }
    
    // Hide game UI elements
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('powerupIndicators').classList.add('hidden');
    document.getElementById('flashlightIndicator').classList.add('hidden');
    document.getElementById('controlsHint').classList.add('hidden');
    
    // Show game over screen
    showScreen('gameOver');
    
    // Show auth UI after game ends (with delay)
    authUIManager.onGameEnd();
    
    console.log(`🎮 Game Over! Player: ${playerName}, Survival time: ${formatTime(survivalTime)}, Level: ${level}`);
    console.log('📊 Power-up distribution:', gameState.powerupStats);
    
    // Track game over event for analytics
    if (window.analytics) {
        window.analytics.trackEvent('game_over', {
            player_name: playerName,
            survival_time: survivalTime,
            final_level: level,
            enemies_spawned: gameState.totalEnemiesSpawned,
            powerups_collected: Object.values(gameState.powerupStats || {}).reduce((sum, count) => sum + count, 0)
        });
    }
}
