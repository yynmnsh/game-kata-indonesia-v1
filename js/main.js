// Main application controller - Improved version
let currentGame = null;
let currentPage = 'home';
let gameInstances = {};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    loadStats();
    checkWordData();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Game cards click handlers
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', function() {
            const gameName = this.dataset.game;
            navigateToGame(gameName);
        });
    });
    
    // Stats button
    const statsBtn = document.getElementById('stats-btn');
    if (statsBtn) {
        statsBtn.addEventListener('click', showStats);
    }
    
    // Refresh words button
    const refreshBtn = document.getElementById('refresh-words-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshWordData);
    }
    
    // Modal close buttons
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });
    
    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
}

// Navigate to game page
function navigateToGame(gameName) {
    // Hide current page
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show game page
    const gamePage = document.getElementById(`${gameName}-page`);
    if (gamePage) {
        gamePage.classList.add('active');
        currentPage = gameName;
        currentGame = gameName;
        
        // Initialize or restart game
        if (!gameInstances[gameName]) {
            initializeGame(gameName);
        } else {
            gameInstances[gameName].start();
        }
    }
}

// Navigate to home
function navigateToHome() {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    document.getElementById('home-page').classList.add('active');
    currentPage = 'home';
    currentGame = null;
}

// Initialize a specific game
function initializeGame(gameName) {
    switch(gameName) {
        case 'katla':
            gameInstances[gameName] = new KatlaGame();
            break;
        case 'susun-kata':
            gameInstances[gameName] = new SusunKataGame();
            break;
        case 'sarang-kata':
            gameInstances[gameName] = new SarangKataGame();
            break;
        case 'kaitan':
            gameInstances[gameName] = new KaitanGame();
            break;
        case 'tts-mini':
            gameInstances[gameName] = new TTSMiniGame();
            break;
    }
    
    if (gameInstances[gameName]) {
        gameInstances[gameName].start();
    }
}

// Return to menu (called from games)
function returnToMenu() {
    navigateToHome();
}

// Check if word data is loaded
function checkWordData() {
    if (typeof WORDLISTS === 'undefined' || !WORDLISTS || !WORDLISTS.indonesian) {
        showMessage('Data kata belum lengkap. Silakan klik "Perbarui Kata" untuk mengunduh data tambahan.', 'info', 5000);
    }
}

// Refresh word data
async function refreshWordData() {
    if (typeof fetchAdditionalWords === 'function') {
        showLoading(true);
        try {
            await fetchAdditionalWords();
            showMessage('Data kata berhasil diperbarui!', 'success');
        } catch (error) {
            showMessage('Gagal memperbarui data kata: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    } else {
        showMessage('Fitur ini memerlukan koneksi internet.', 'info');
    }
}

// Show stats modal
function showStats() {
    const modal = document.getElementById('stats-modal');
    const content = document.getElementById('stats-content');
    
    const stats = getGameStats();
    
    let html = '';
    const hasStats = Object.keys(stats).length > 0;
    
    if (!hasStats) {
        html = '<p style="text-align: center; color: #6b7280;">Belum ada data statistik. Mainkan beberapa game untuk melihat statistik Anda!</p>';
    } else {
        for (const [game, data] of Object.entries(stats)) {
            const gameName = getGameDisplayName(game);
            html += `
                <div class="stat-section">
                    <h3>${gameName}</h3>
                    <div class="stat-grid">
                        <div class="stat-item">
                            <div class="stat-value">${data.played || 0}</div>
                            <div class="stat-label">Dimainkan</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${data.won || 0}</div>
                            <div class="stat-label">Menang</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${data.winRate || 0}%</div>
                            <div class="stat-label">Win Rate</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${data.currentStreak || 0}</div>
                            <div class="stat-label">Streak</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    content.innerHTML = html;
    modal.classList.add('active');
}

// Close stats modal
function closeStats() {
    document.getElementById('stats-modal').classList.remove('active');
}

// Show settings modal
function showSettings(gameName) {
    const modal = document.getElementById('settings-modal');
    const content = document.getElementById('settings-content');
    
    const settings = getGameSettings(gameName);
    
    let html = `<h3>Pengaturan ${getGameDisplayName(gameName)}</h3>`;
    
    switch(gameName) {
        case 'katla':
            html += `
                <div class="setting-item">
                    <label for="katla-length">Panjang kata:</label>
                    <select id="katla-length">
                        <option value="4" ${settings.wordLength === 4 ? 'selected' : ''}>4 huruf</option>
                        <option value="5" ${settings.wordLength === 5 ? 'selected' : ''}>5 huruf</option>
                        <option value="6" ${settings.wordLength === 6 ? 'selected' : ''}>6 huruf</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label for="katla-attempts">Jumlah percobaan:</label>
                    <select id="katla-attempts">
                        <option value="5" ${settings.maxAttempts === 5 ? 'selected' : ''}>5</option>
                        <option value="6" ${settings.maxAttempts === 6 ? 'selected' : ''}>6</option>
                        <option value="7" ${settings.maxAttempts === 7 ? 'selected' : ''}>7</option>
                    </select>
                </div>
            `;
            break;
        case 'susun-kata':
            html += `
                <div class="setting-item">
                    <label for="letterbox-sides">Jumlah sisi:</label>
                    <select id="letterbox-sides">
                        <option value="3" ${settings.sides === 3 ? 'selected' : ''}>3 sisi</option>
                        <option value="4" ${settings.sides === 4 ? 'selected' : ''}>4 sisi</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label for="letterbox-letters">Huruf per sisi:</label>
                    <select id="letterbox-letters">
                        <option value="2" ${settings.lettersPerSide === 2 ? 'selected' : ''}>2 huruf</option>
                        <option value="3" ${settings.lettersPerSide === 3 ? 'selected' : ''}>3 huruf</option>
                        <option value="4" ${settings.lettersPerSide === 4 ? 'selected' : ''}>4 huruf</option>
                    </select>
                </div>
            `;
            break;
        case 'sarang-kata':
            html += `
                <div class="setting-item">
                    <label for="bee-outer">Jumlah huruf luar:</label>
                    <select id="bee-outer">
                        <option value="5" ${settings.outerLetters === 5 ? 'selected' : ''}>5 huruf</option>
                        <option value="6" ${settings.outerLetters === 6 ? 'selected' : ''}>6 huruf</option>
                        <option value="7" ${settings.outerLetters === 7 ? 'selected' : ''}>7 huruf</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label for="bee-min">Panjang kata minimum:</label>
                    <select id="bee-min">
                        <option value="3" ${settings.minLength === 3 ? 'selected' : ''}>3 huruf</option>
                        <option value="4" ${settings.minLength === 4 ? 'selected' : ''}>4 huruf</option>
                        <option value="5" ${settings.minLength === 5 ? 'selected' : ''}>5 huruf</option>
                    </select>
                </div>
            `;
            break;
        case 'kaitan':
            html += `
                <div class="setting-item">
                    <label for="connections-grid">Ukuran grid:</label>
                    <select id="connections-grid">
                        <option value="4x4" ${settings.gridSize === '4x4' ? 'selected' : ''}>4×4 (16 kata)</option>
                        <option value="3x4" ${settings.gridSize === '3x4' ? 'selected' : ''}>3×4 (12 kata)</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label for="connections-mistakes">Jumlah kesalahan maksimal:</label>
                    <select id="connections-mistakes">
                        <option value="3" ${settings.maxMistakes === 3 ? 'selected' : ''}>3</option>
                        <option value="4" ${settings.maxMistakes === 4 ? 'selected' : ''}>4</option>
                        <option value="5" ${settings.maxMistakes === 5 ? 'selected' : ''}>5</option>
                    </select>
                </div>
            `;
            break;
        case 'tts-mini':
            html += `
                <div class="setting-item">
                    <label for="crossword-size">Ukuran grid:</label>
                    <select id="crossword-size">
                        <option value="5" ${settings.gridSize === 5 ? 'selected' : ''}>5×5</option>
                        <option value="7" ${settings.gridSize === 7 ? 'selected' : ''}>7×7</option>
                    </select>
                </div>
            `;
            break;
    }
    
    html += '<div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">';
    html += '<button class="btn btn-primary" onclick="applySettings(\'' + gameName + '\')">Terapkan & Mulai Ulang</button>';
    html += '<button class="btn btn-secondary" onclick="closeSettings()">Batal</button>';
    html += '</div>';
    
    content.innerHTML = html;
    modal.classList.add('active');
}

// Apply settings and restart game
function applySettings(gameName) {
    const settings = getGameSettings(gameName);
    let updated = false;
    
    switch(gameName) {
        case 'katla':
            const kLength = document.getElementById('katla-length');
            const kAttempts = document.getElementById('katla-attempts');
            if (kLength && kAttempts) {
                settings.wordLength = parseInt(kLength.value);
                settings.maxAttempts = parseInt(kAttempts.value);
                updated = true;
            }
            break;
        case 'susun-kata':
            const lSides = document.getElementById('letterbox-sides');
            const lLetters = document.getElementById('letterbox-letters');
            if (lSides && lLetters) {
                settings.sides = parseInt(lSides.value);
                settings.lettersPerSide = parseInt(lLetters.value);
                updated = true;
            }
            break;
        case 'sarang-kata':
            const bOuter = document.getElementById('bee-outer');
            const bMin = document.getElementById('bee-min');
            if (bOuter && bMin) {
                settings.outerLetters = parseInt(bOuter.value);
                settings.minLength = parseInt(bMin.value);
                updated = true;
            }
            break;
        case 'kaitan':
            const cGrid = document.getElementById('connections-grid');
            const cMistakes = document.getElementById('connections-mistakes');
            if (cGrid && cMistakes) {
                settings.gridSize = cGrid.value;
                settings.maxMistakes = parseInt(cMistakes.value);
                updated = true;
            }
            break;
        case 'tts-mini':
            const tSize = document.getElementById('crossword-size');
            if (tSize) {
                settings.gridSize = parseInt(tSize.value);
                updated = true;
            }
            break;
    }
    
    if (updated) {
        saveGameSettings(gameName, settings);
        closeSettings();
        
        // Restart game with new settings
        if (gameInstances[gameName]) {
            gameInstances[gameName].settings = settings;
            gameInstances[gameName].start();
            showMessage('Pengaturan diterapkan!', 'success');
        }
    }
}

// Close settings modal
function closeSettings() {
    document.getElementById('settings-modal').classList.remove('active');
}

// Restart current game
function restartGame() {
    if (currentGame && gameInstances[currentGame]) {
        gameInstances[currentGame].start();
    }
}

// Get display name for game
function getGameDisplayName(gameName) {
    const names = {
        'katla': 'Katla',
        'susun-kata': 'Susun Kata',
        'sarang-kata': 'Sarang Kata',
        'kaitan': 'Kaitan',
        'tts-mini': 'TTS Mini'
    };
    return names[gameName] || gameName;
}

// Show message/alert
function showMessage(text, type = 'info', duration = 2000) {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.opacity = '0';
        setTimeout(() => message.remove(), 300);
    }, duration);
}

// Show/hide loading indicator
function showLoading(show) {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        if (show) {
            loader.classList.add('active');
        } else {
            loader.classList.remove('active');
        }
    }
}
