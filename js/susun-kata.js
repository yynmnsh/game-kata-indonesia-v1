// Susun Kata Game (Letter Box) - Improved version
class SusunKataGame {
    constructor() {
        this.container = document.getElementById('susun-kata-page');
        this.settings = getGameSettings('susun-kata');
        this.puzzle = null;
        this.foundWords = [];
        this.currentWord = '';
        this.lastSide = null;
    }

    start() {
        // Get settings with proper defaults
        this.settings = getGameSettings('susun-kata');
        
        // Ensure 3 letters per side is the default
        if (!this.settings.lettersPerSide) {
            this.settings.lettersPerSide = 3;
        }
        if (!this.settings.sides) {
            this.settings.sides = 4;
        }
        
        this.foundWords = [];
        this.currentWord = '';
        this.lastSide = null;
        
        // Generate puzzle
        if (typeof WORDLISTS !== 'undefined' && WORDLISTS.indonesian && WORDLISTS.indonesian.length > 0) {
            this.puzzle = generateLetterBox(
                WORDLISTS.indonesian,
                this.settings.sides,
                this.settings.lettersPerSide
            );
        } else {
            // Fallback puzzle with 3 letters per side
            this.puzzle = {
                sides: [
                    ['a','b','c'], 
                    ['d','e','f'], 
                    ['g','h','i'], 
                    ['j','k','l']
                ],
                letters: 'abcdefghijkl',
                validWords: ['bad', 'ace', 'jade', 'face', 'cable'],
                targetWords: ['bad', 'ace', 'jade', 'face', 'cable']
            };
        }
        
        this.render();
        startGameSession('susun-kata');
    }

    render() {
        this.container.innerHTML = `
            <div class="game-header">
                <button class="btn-icon" onclick="returnToMenu()">🏠</button>
                <h1>Susun Kata</h1>
                <div class="header-buttons">
                    <button class="btn-icon" onclick="showSettings('susun-kata')">⚙️</button>
                    <button class="btn-icon" onclick="gameInstances['susun-kata'].showHelp()">❓</button>
                    <button class="btn-icon" onclick="gameInstances['susun-kata'].start()">🔄</button>
                </div>
            </div>
            
            <div class="game-content">
                <div class="letterbox-container">
                    <div class="letterbox-info">
                        <p>Bentuk kata dari huruf-huruf di kotak. Huruf berurutan harus dari sisi yang berbeda!</p>
                    </div>
                    
                    <div class="letterbox-box" id="letterbox"></div>
                    
                    <div class="word-input-area">
                        <input type="text" class="word-input" id="word-input" 
                               placeholder="Pilih huruf..." readonly>
                        <div style="display: flex; gap: 10px; margin-top: 10px; justify-content: center;">
                            <button class="btn btn-primary" onclick="gameInstances['susun-kata'].submitWord()">✓ Submit</button>
                            <button class="btn btn-secondary clearWord" onclick="gameInstances['susun-kata'].clearWord()">✗ Hapus</button>
                        </div>
                    </div>
                    
                    <div class="found-words">
                        <h3>Kata Ditemukan: <span id="found-count">${this.foundWords.length}</span>/${this.puzzle.targetWords.length}</h3>
                        <div class="word-list" id="found-list"></div>
                    </div>
                </div>
            </div>
        `;
        
        this.renderBox();
        this.updateFoundWords();
    }

    renderBox() {
        const box = document.getElementById('letterbox');
        const positions = ['top', 'right', 'bottom', 'left'];
        
        let html = '';
        
        this.puzzle.sides.forEach((side, idx) => {
            html += `<div class="letterbox-side ${positions[idx]}">`;
            side.forEach(letter => {
                const isInWord = this.currentWord.toUpperCase().includes(letter.toUpperCase());
                const currentSide = this.getSide(letter);
                const disabled = this.currentWord.length > 0 && currentSide === this.lastSide;
                
                html += `<button class="letter-btn ${isInWord ? 'selected' : ''}" 
                                onclick="gameInstances['susun-kata'].addLetter('${letter}')"
                                ${disabled ? 'disabled' : ''}>
                            ${letter.toUpperCase()}
                        </button>`;
            });
            html += '</div>';
        });
        
        box.innerHTML = html;
    }

    getSide(letter) {
        for (let i = 0; i < this.puzzle.sides.length; i++) {
            if (this.puzzle.sides[i].includes(letter.toLowerCase())) {
                return i;
            }
        }
        return -1;
    }

    addLetter(letter) {
        const currentSide = this.getSide(letter);
        
        // Prevent consecutive letters from the same side
        if (this.currentWord.length > 0 && currentSide === this.lastSide) {
            showMessage('Tidak bisa memilih huruf dari sisi yang sama berturut-turut!', 'error');
            return;
        }
        
        this.currentWord += letter.toUpperCase();
        this.lastSide = currentSide;
        document.getElementById('word-input').value = this.currentWord;
        this.renderBox();
    }

    clearWord() {
        this.currentWord = '';
        this.lastSide = null;
        document.getElementById('word-input').value = '';
        this.renderBox();
    }

    submitWord() {
        const word = this.currentWord.toLowerCase();
        
        if (word.length < 3) {
            showMessage('Kata terlalu pendek (minimal 3 huruf)', 'error');
            return;
        }
        
        if (this.foundWords.includes(word)) {
            showMessage('Kata sudah ditemukan!', 'error');
            return;
        }
        
        // Check if word is valid
        const isValid = this.puzzle.validWords.some(w => w.toLowerCase() === word);
        
        if (!isValid) {
            showMessage('Kata tidak valid atau tidak ditemukan dalam daftar', 'error');
            return;
        }
        
        // Word is valid!
        this.foundWords.push(word);
        this.updateFoundWords();
        this.clearWord();
        showMessage('Benar! +1', 'success');
        
        // Check win condition
        if (this.foundWords.length >= this.puzzle.targetWords.length) {
            this.win();
        }
    }

    updateFoundWords() {
        document.getElementById('found-count').textContent = this.foundWords.length;
        const list = document.getElementById('found-list');
        list.innerHTML = this.foundWords.map(w => 
            `<span class="word-tag">${w.toUpperCase()}</span>`
        ).join('');
    }

    win() {
        endGameSession(true);
        showMessage('🎉 Selamat! Semua kata ditemukan!', 'success', 3000);
        setTimeout(() => {
            if (confirm('Permainan selesai! Main lagi?')) {
                this.start();
            } else {
                returnToMenu();
            }
        }, 2000);
    }

    showHelp() {
        showMessage('Bentuk kata dengan menghubungkan huruf dari sisi yang berbeda. Minimal 3 huruf. Huruf berurutan tidak boleh dari sisi yang sama!', 'info', 5000);
    }
}
