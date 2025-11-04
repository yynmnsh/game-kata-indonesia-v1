// Katla Game (Indonesian Wordle)
class KatlaGame {
    constructor() {
        this.container = document.getElementById('katla-page');
        this.settings = getGameSettings('katla');
        this.wordLength = this.settings.wordLength;
        this.maxAttempts = this.settings.maxAttempts;
        this.currentRow = 0;
        this.currentTile = 0;
        this.gameActive = false;
        this.targetWord = '';
        this.guesses = [];
        this.keyboardState = {};
    }

    start() {
        // Apply adaptive difficulty
        const adaptive = getAdaptiveDifficulty('katla');
        this.wordLength = adaptive.wordLength;
        this.maxAttempts = adaptive.maxAttempts;
        
        this.render();
        this.pickWord();
        this.gameActive = true;
        this.currentRow = 0;
        this.currentTile = 0;
        this.guesses = [];
        this.keyboardState = {};
        
        startGameSession('katla');
        
        // Add keyboard listener
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
    }

    pickWord() {
        if (typeof WORDLISTS === 'undefined' || !WORDLISTS.indonesian) {
            showMessage('Data kata tidak tersedia. Gunakan kata contoh.', 'error');
            this.targetWord = 'MAKAN'; // Fallback
            return;
        }
        
        const words = filterWordsByLength(WORDLISTS.indonesian, this.wordLength);
        if (words.length === 0) {
            this.targetWord = 'MAKAN'; // Fallback
            return;
        }
        
        this.targetWord = randomItem(words).toUpperCase();
        console.log('Target:', this.targetWord); // For testing
    }

    render() {
        this.container.innerHTML = `
            <div class="game-header">
                <button class="btn-icon" onclick="returnToMenu()">🏠</button>
                <h1>Katla</h1>
                <div class="header-buttons">
                    <button class="btn-icon" onclick="showSettings('katla')">⚙️</button>
                    <button class="btn-icon" onclick="gameInstances['katla'].showHelp()">❓</button>
                </div>
            </div>
            
            <div class="game-content">
                <div class="katla-grid" id="katla-grid"></div>
                <div class="keyboard" id="katla-keyboard"></div>
            </div>
        `;
        
        this.renderGrid();
        this.renderKeyboard();
    }

    renderGrid() {
        const grid = document.getElementById('katla-grid');
        let html = '';
        
        for (let i = 0; i < this.maxAttempts; i++) {
            html += '<div class="katla-row">';
            for (let j = 0; j < this.wordLength; j++) {
                html += '<div class="katla-tile" data-row="' + i + '" data-col="' + j + '"></div>';
            }
            html += '</div>';
        }
        
        grid.innerHTML = html;
    }

    renderKeyboard() {
        const keyboard = document.getElementById('katla-keyboard');
        const rows = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
        ];
        
        let html = '';
        rows.forEach(row => {
            html += '<div class="keyboard-row">';
            row.forEach(key => {
                const className = key.length > 1 ? 'key wide' : 'key';
                const state = this.keyboardState[key] || '';
                html += `<button class="${className} ${state}" onclick="gameInstances['katla'].handleKey('${key}')">${key}</button>`;
            });
            html += '</div>';
        });
        
        keyboard.innerHTML = html;
    }

    handleKeyPress(e) {
        if (!this.gameActive) return;
        
        if (e.key === 'Enter') {
            this.handleKey('ENTER');
        } else if (e.key === 'Backspace') {
            this.handleKey('⌫');
        } else if (e.key.match(/^[a-z]$/i)) {
            this.handleKey(e.key.toUpperCase());
        }
    }

    handleKey(key) {
        if (!this.gameActive) return;
        
        if (key === 'ENTER') {
            this.submitGuess();
        } else if (key === '⌫') {
            this.deleteLetter();
        } else {
            this.addLetter(key);
        }
    }

    addLetter(letter) {
        if (this.currentTile < this.wordLength) {
            const tile = document.querySelector(
                `.katla-tile[data-row="${this.currentRow}"][data-col="${this.currentTile}"]`
            );
            tile.textContent = letter;
            tile.classList.add('filled');
            this.currentTile++;
        }
    }

    deleteLetter() {
        if (this.currentTile > 0) {
            this.currentTile--;
            const tile = document.querySelector(
                `.katla-tile[data-row="${this.currentRow}"][data-col="${this.currentTile}"]`
            );
            tile.textContent = '';
            tile.classList.remove('filled');
        }
    }

    submitGuess() {
        if (this.currentTile !== this.wordLength) {
            showMessage('Kata kurang panjang', 'error');
            return;
        }
        
        // Get current guess
        let guess = '';
        for (let i = 0; i < this.wordLength; i++) {
            const tile = document.querySelector(
                `.katla-tile[data-row="${this.currentRow}"][data-col="${i}"]`
            );
            guess += tile.textContent;
        }
        
        // Validate word
        if (typeof WORDLISTS !== 'undefined' && WORDLISTS.indonesian) {
            if (!isValidWord(guess, WORDLISTS.indonesian)) {
                showMessage('Kata tidak valid', 'error');
                return;
            }
        }
        
        this.guesses.push(guess);
        this.checkGuess(guess);
        
        // Check win/loss
        if (guess === this.targetWord) {
            this.win();
        } else if (this.currentRow === this.maxAttempts - 1) {
            this.lose();
        } else {
            this.currentRow++;
            this.currentTile = 0;
        }
    }

    checkGuess(guess) {
        const targetLetters = this.targetWord.split('');
        const guessLetters = guess.split('');
        const result = new Array(this.wordLength).fill('absent');
        const used = new Array(this.wordLength).fill(false);
        
        // First pass: mark correct letters
        for (let i = 0; i < this.wordLength; i++) {
            if (guessLetters[i] === targetLetters[i]) {
                result[i] = 'correct';
                used[i] = true;
            }
        }
        
        // Second pass: mark present letters
        for (let i = 0; i < this.wordLength; i++) {
            if (result[i] === 'absent') {
                for (let j = 0; j < this.wordLength; j++) {
                    if (!used[j] && guessLetters[i] === targetLetters[j]) {
                        result[i] = 'present';
                        used[j] = true;
                        break;
                    }
                }
            }
        }
        
        // Update tiles
        for (let i = 0; i < this.wordLength; i++) {
            const tile = document.querySelector(
                `.katla-tile[data-row="${this.currentRow}"][data-col="${i}"]`
            );
            setTimeout(() => {
                tile.classList.add(result[i]);
            }, i * 200);
            
            // Update keyboard
            const letter = guessLetters[i];
            const currentState = this.keyboardState[letter];
            if (result[i] === 'correct' || !currentState) {
                this.keyboardState[letter] = result[i];
            } else if (result[i] === 'present' && currentState !== 'correct') {
                this.keyboardState[letter] = result[i];
            }
        }
        
        setTimeout(() => {
            this.renderKeyboard();
        }, this.wordLength * 200);
    }

    win() {
        this.gameActive = false;
        endGameSession(true, this.currentRow + 1);
        
        setTimeout(() => {
            showMessage(`Selamat! Kata: ${this.targetWord}`, 'success', 3000);
            this.showResults(true);
        }, 1000);
    }

    lose() {
        this.gameActive = false;
        endGameSession(false, this.maxAttempts);
        
        setTimeout(() => {
            showMessage(`Kata yang benar: ${this.targetWord}`, 'error', 3000);
            this.showResults(false);
        }, 1000);
    }

    showResults(won) {
        const stats = getGameStats('katla');
        let html = `
            <div style="text-align: center; margin-top: 20px;">
                <h3>${won ? 'Kemenangan!' : 'Coba Lagi!'}</h3>
                <p>Kata: <strong>${this.targetWord}</strong></p>
                <p>Percobaan: ${this.currentRow + 1}/${this.maxAttempts}</p>
                <div style="margin: 20px 0;">
                    <p>Win Rate: ${stats.winRate}%</p>
                    <p>Streak: ${stats.currentStreak}</p>
                </div>
                <button class="btn btn-primary" onclick="gameInstances['katla'].start()">Main Lagi</button>
                <button class="btn btn-secondary" onclick="returnToMenu()">Menu</button>
            </div>
        `;
        
        const resultDiv = document.createElement('div');
        resultDiv.innerHTML = html;
        this.container.appendChild(resultDiv);
    }

    showHelp() {
        showMessage('Tebak kata dalam ' + this.maxAttempts + ' percobaan. Hijau = benar, Kuning = ada tapi salah posisi, Abu = tidak ada.', 'info', 5000);
    }
}
