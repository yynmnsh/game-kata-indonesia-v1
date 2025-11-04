// Sarang Kata Game (Spelling Bee) - Improved version
class SarangKataGame {
    constructor() {
        this.container = document.getElementById('sarang-kata-page');
        this.settings = getGameSettings('sarang-kata');
        this.puzzle = null;
        this.foundWords = [];
        this.score = 0;
        this.currentWord = '';
    }

    start() {
        // Get settings
        this.settings = getGameSettings('sarang-kata');
        
        // Ensure defaults
        if (!this.settings.outerLetters) {
            this.settings.outerLetters = 6;
        }
        if (!this.settings.minLength) {
            this.settings.minLength = 4;
        }
        
        this.foundWords = [];
        this.score = 0;
        this.currentWord = '';
        
        // Generate puzzle
        if (typeof WORDLISTS !== 'undefined' && WORDLISTS.indonesian && WORDLISTS.indonesian.length > 0) {
            this.puzzle = generateSpellingBee(WORDLISTS.indonesian, this.settings.outerLetters);
        }
        
        // Fallback puzzle
        if (!this.puzzle) {
            this.puzzle = {
                centerLetter: 'a',
                outerLetters: ['b','c','d','e','i','n'],
                validWords: ['baca', 'dada', 'abad', 'abadi', 'cabai', 'dacing', 'banda'],
                pangrams: [],
                maxScore: 100
            };
        }
        
        this.render();
        startGameSession('sarang-kata');
    }

    render() {
        const allLetters = [this.puzzle.centerLetter, ...this.puzzle.outerLetters];
        
        this.container.innerHTML = `
            <div class="game-header">
                <button class="btn-icon" onclick="returnToMenu()">🏠</button>
                <h1>Sarang Kata</h1>
                <div class="header-buttons">
                    <button class="btn-icon" onclick="showSettings('sarang-kata')">⚙️</button>
                    <button class="btn-icon" onclick="gameInstances['sarang-kata'].showHelp()">❓</button>
                    <button class="btn-icon" onclick="gameInstances['sarang-kata'].start()">🔄</button>
                </div>
            </div>
            
            <div class="game-content bee-container">
                <div class="letterbox-info">
                    <p>Buat kata dari huruf-huruf yang tersedia. Harus menggunakan huruf tengah (kuning)!</p>
                </div>
                
                <div class="bee-score">
                    Skor: <span id="bee-score">${this.score}</span> / ${this.puzzle.maxScore}
                </div>
                
                <div class="bee-hive">
                    ${this.renderHexagons(allLetters)}
                </div>
                
                <div class="word-input-area">
                    <input type="text" class="word-input" id="bee-input" 
                           placeholder="Ketik kata..." readonly>
                    <div style="display: flex; gap: 10px; margin-top: 10px; justify-content: center; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="gameInstances['sarang-kata'].submitWord()">✓ Submit</button>
                        <button class="btn btn-secondary clearWord" onclick="gameInstances['sarang-kata'].clearWord()">✗ Hapus</button>
                        <button class="btn btn-secondary" onclick="gameInstances['sarang-kata'].shuffleOuter()">🔀 Acak</button>
                    </div>
                </div>
                
                <div class="found-words">
                    <h3>Kata Ditemukan: ${this.foundWords.length}</h3>
                    <div class="word-list" id="bee-found-list"></div>
                </div>
            </div>
        `;
        
        this.updateFoundWords();
    }

    renderHexagons(letters) {
        // letters[0] is center, letters[1-6] are outer
        let html = '';
        
        // Outer hexagons (indices 1-6)
        for (let i = 1; i <= 6; i++) {
            if (letters[i]) {
                html += `<button class="hex-btn" onclick="gameInstances['sarang-kata'].addLetter('${letters[i]}')">${letters[i].toUpperCase()}</button>`;
            }
        }
        
        // Center hexagon (index 0)
        html += `<button class="hex-btn center" onclick="gameInstances['sarang-kata'].addLetter('${letters[0]}')">${letters[0].toUpperCase()}</button>`;
        
        return html;
    }

    addLetter(letter) {
        this.currentWord += letter.toUpperCase();
        document.getElementById('bee-input').value = this.currentWord;
    }

    clearWord() {
        this.currentWord = '';
        document.getElementById('bee-input').value = '';
    }

    shuffleOuter() {
        // Shuffle the outer letters
        const shuffled = shuffle(this.puzzle.outerLetters);
        this.puzzle.outerLetters = shuffled;
        this.render();
        this.updateFoundWords();
    }

    submitWord() {
        const word = this.currentWord.toLowerCase();
        
        if (word.length < this.settings.minLength) {
            showMessage(`Kata minimal ${this.settings.minLength} huruf`, 'error');
            return;
        }
        
        // Must contain center letter
        if (!word.includes(this.puzzle.centerLetter.toLowerCase())) {
            showMessage('Harus menggunakan huruf tengah (kuning)!', 'error');
            return;
        }
        
        // Check if all letters are valid
        const allLetters = this.puzzle.centerLetter + this.puzzle.outerLetters.join('');
        const wordLetters = word.split('');
        const hasInvalidLetter = wordLetters.some(l => !allLetters.toLowerCase().includes(l));
        
        if (hasInvalidLetter) {
            showMessage('Gunakan hanya huruf yang tersedia!', 'error');
            return;
        }
        
        if (this.foundWords.includes(word)) {
            showMessage('Kata sudah ditemukan!', 'error');
            return;
        }
        
        // Check if word exists in valid words
        if (!this.puzzle.validWords.includes(word)) {
            showMessage('Kata tidak ditemukan dalam kamus', 'error');
            return;
        }
        
        // Valid word!
        const points = scoreWord(word, allLetters, this.settings.minLength);
        this.foundWords.push(word);
        this.score += points;
        
        document.getElementById('bee-score').textContent = this.score;
        this.updateFoundWords();
        this.clearWord();
        
        // Check if pangram
        if (isPangram(word, allLetters)) {
            showMessage('🎉 PANGRAM! +' + points, 'success', 3000);
        } else {
            showMessage(`✓ Benar! +${points}`, 'success');
        }
        
        // Check if reached max score
        if (this.score >= this.puzzle.maxScore) {
            this.win();
        }
    }

    updateFoundWords() {
        const list = document.getElementById('bee-found-list');
        if (list) {
            list.innerHTML = this.foundWords
                .sort()
                .map(w => `<span class="word-tag">${w.toUpperCase()}</span>`)
                .join('');
        }
    }

    win() {
        endGameSession(true);
        showMessage('🎉 Luar biasa! Skor maksimal tercapai!', 'success', 4000);
        setTimeout(() => {
            if (confirm('Permainan selesai! Main lagi?')) {
                this.start();
            } else {
                returnToMenu();
            }
        }, 3000);
    }

    showHelp() {
        showMessage(`Buat kata minimal ${this.settings.minLength} huruf. Harus menggunakan huruf tengah (kuning). Bonus untuk pangram (gunakan semua huruf)!`, 'info', 6000);
    }
}
