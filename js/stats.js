// Stats management system

const STATS_KEY = 'game-kata-stats';
const SETTINGS_KEY_PREFIX = 'game-kata-settings-';

// Initialize stats
function loadStats() {
    const stats = loadFromStorage(STATS_KEY, {});
    return stats;
}

// Get stats for a specific game
function getGameStats(gameName = null) {
    const allStats = loadStats();
    
    if (gameName) {
        return allStats[gameName] || {
            played: 0,
            won: 0,
            lost: 0,
            winRate: 0,
            currentStreak: 0,
            maxStreak: 0,
            averageAttempts: 0,
            totalTime: 0,
            averageTime: 0
        };
    }
    
    return allStats;
}

// Update stats after game completion
function updateStats(gameName, result) {
    const allStats = loadStats();
    const gameStats = getGameStats(gameName);
    
    gameStats.played++;
    
    if (result.won) {
        gameStats.won++;
        gameStats.currentStreak++;
        gameStats.maxStreak = Math.max(gameStats.maxStreak, gameStats.currentStreak);
    } else {
        gameStats.lost++;
        gameStats.currentStreak = 0;
    }
    
    gameStats.winRate = Math.round((gameStats.won / gameStats.played) * 100);
    
    if (result.attempts) {
        const totalAttempts = (gameStats.averageAttempts * (gameStats.played - 1)) + result.attempts;
        gameStats.averageAttempts = Math.round(totalAttempts / gameStats.played * 10) / 10;
    }
    
    if (result.time) {
        gameStats.totalTime += result.time;
        gameStats.averageTime = Math.round(gameStats.totalTime / gameStats.played);
    }
    
    allStats[gameName] = gameStats;
    saveToStorage(STATS_KEY, allStats);
    
    return gameStats;
}

// Reset stats for a specific game
function resetGameStats(gameName) {
    const allStats = loadStats();
    delete allStats[gameName];
    saveToStorage(STATS_KEY, allStats);
}

// Reset all stats
function resetAllStats() {
    removeFromStorage(STATS_KEY);
}

// Get game settings
function getGameSettings(gameName) {
    const defaults = {
        'katla': {
            wordLength: 5,
            maxAttempts: 6,
            hardMode: false
        },
        'susun-kata': {
            sides: 4,
            lettersPerSide: 3,
            minWordLength: 3
        },
        'sarang-kata': {
            outerLetters: 6,
            minLength: 4,
            showHints: false
        },
        'kaitan': {
            gridSize: '4x4',
            maxMistakes: 4,
            showCategory: false
        },
        'tts-mini': {
            gridSize: 5,
            showTimer: true
        }
    };
    
    const key = SETTINGS_KEY_PREFIX + gameName;
    const saved = loadFromStorage(key);
    
    return saved || defaults[gameName] || {};
}

// Save game settings
function saveGameSettings(gameName, settings) {
    const key = SETTINGS_KEY_PREFIX + gameName;
    saveToStorage(key, settings);
}

// Get player performance level
function getPerformanceLevel(gameName) {
    const stats = getGameStats(gameName);
    
    if (stats.played < 5) return 'beginner';
    
    const winRate = stats.winRate;
    
    if (winRate >= 80) return 'expert';
    if (winRate >= 60) return 'advanced';
    if (winRate >= 40) return 'intermediate';
    return 'beginner';
}

// Calculate adaptive difficulty
function getAdaptiveDifficulty(gameName) {
    const level = getPerformanceLevel(gameName);
    const settings = getGameSettings(gameName);
    
    const adjustments = {
        'katla': {
            beginner: { wordLength: 4, maxAttempts: 7 },
            intermediate: { wordLength: 5, maxAttempts: 6 },
            advanced: { wordLength: 5, maxAttempts: 5 },
            expert: { wordLength: 6, maxAttempts: 6 }
        },
        'susun-kata': {
            beginner: { sides: 3, lettersPerSide: 2 },
            intermediate: { sides: 4, lettersPerSide: 3 },
            advanced: { sides: 4, lettersPerSide: 3 },
            expert: { sides: 4, lettersPerSide: 4 }
        },
        'sarang-kata': {
            beginner: { outerLetters: 5, minLength: 3 },
            intermediate: { outerLetters: 6, minLength: 4 },
            advanced: { outerLetters: 6, minLength: 4 },
            expert: { outerLetters: 7, minLength: 4 }
        },
        'kaitan': {
            beginner: { gridSize: '3x4', maxMistakes: 5 },
            intermediate: { gridSize: '4x4', maxMistakes: 4 },
            advanced: { gridSize: '4x4', maxMistakes: 4 },
            expert: { gridSize: '4x4', maxMistakes: 3 }
        },
        'tts-mini': {
            beginner: { gridSize: 5 },
            intermediate: { gridSize: 5 },
            advanced: { gridSize: 7 },
            expert: { gridSize: 7 }
        }
    };
    
    return adjustments[gameName]?.[level] || settings;
}

// Track game session
function startGameSession(gameName) {
    const session = {
        game: gameName,
        startTime: Date.now(),
        moves: [],
        completed: false
    };
    
    saveToStorage('current-session', session);
    return session;
}

function endGameSession(won, attempts = null) {
    const session = loadFromStorage('current-session');
    if (!session) return null;
    
    const endTime = Date.now();
    const duration = endTime - session.startTime;
    
    session.completed = true;
    session.endTime = endTime;
    session.duration = duration;
    session.won = won;
    session.attempts = attempts;
    
    // Update stats
    updateStats(session.game, {
        won,
        attempts,
        time: duration
    });
    
    removeFromStorage('current-session');
    
    return session;
}

// Get achievement progress
function getAchievements(gameName) {
    const stats = getGameStats(gameName);
    
    const achievements = [
        {
            id: 'first-win',
            name: 'Kemenangan Pertama',
            description: 'Menangkan permainan pertama kali',
            unlocked: stats.won >= 1
        },
        {
            id: 'win-streak-3',
            name: 'Streak 3',
            description: 'Menang 3 kali berturut-turut',
            unlocked: stats.maxStreak >= 3
        },
        {
            id: 'win-streak-10',
            name: 'Streak 10',
            description: 'Menang 10 kali berturut-turut',
            unlocked: stats.maxStreak >= 10
        },
        {
            id: 'played-10',
            name: 'Pemain Aktif',
            description: 'Mainkan 10 kali',
            unlocked: stats.played >= 10
        },
        {
            id: 'played-50',
            name: 'Pemain Veteran',
            description: 'Mainkan 50 kali',
            unlocked: stats.played >= 50
        },
        {
            id: 'win-rate-80',
            name: 'Ahli',
            description: 'Capai win rate 80%',
            unlocked: stats.winRate >= 80 && stats.played >= 10
        }
    ];
    
    return achievements;
}

// Export stats as JSON
function exportStats() {
    const stats = loadStats();
    const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game-kata-stats.json';
    a.click();
    URL.revokeObjectURL(url);
}

// Import stats from JSON
function importStats(jsonData) {
    try {
        const stats = JSON.parse(jsonData);
        saveToStorage(STATS_KEY, stats);
        return true;
    } catch (e) {
        console.error('Error importing stats:', e);
        return false;
    }
}
