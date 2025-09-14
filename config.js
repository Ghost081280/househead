/* === AUTHENTICATION UI === */
.auth-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1200;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: auto;
}

.auth-container .btn {
    min-width: 160px;
    font-size: 12px;
    padding: 8px 16px;
}

.user-profile {
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 68, 68, 0.3);
    border-radius: 20px;
    padding: 8px 12px;
    color: #ffffff;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    backdrop-filter: blur(10px);
}

.user-avatar {
    font-size: 16px;
}

.user-name {
    font-family: 'Orbitron', monospace;
    font-weight: bold;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Global leaderboard styles */
.global-scores {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.global-score-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(255, 68, 68, 0.1);
    border: 1px solid rgba(255, 68, 68, 0.3);
    border-radius: 8px;
    font-size: 12px;
}

.global-score-item.current-user {
    background: rgba(68, 136, 255, 0.2);
    border-color: rgba(68, 136, 255, 0.5);
    box-shadow: 0 0 10px rgba(68, 136, 255, 0.3);
}

.global-score-item .rank {
    font-size: 16px;
    min-width: 30px;
}

.global-score-item .player-name {
    flex: 1;
    margin: 0 10px;
    font-weight: bold;
    color: #ffffff;
}

.global-score-item .score {
    font-family: 'Orbitron', monospace;
    color: #ff6666;
    font-weight: bold;
}

.global-score-item .level {
    font-size: 10px;
    color: #888;
    margin-left: 8px;
}

/* === UTILITY CLASSES === */
