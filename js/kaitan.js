// Kaitan Game (Connections)
class KaitanGame {
    constructor() {
        this.container = document.getElementById('kaitan-page');
        this.settings = getGameSettings('kaitan');
        this.puzzle = null;
        this.selected = [];
        this.solved = [];
        this.mistakes = 0;
    }

    start() {
        const adaptive = getAdaptiveDifficulty('kaitan');
        this.settings = {...this.settings, ...adaptive};
        
        this.selected = [];
        this.solved = [];
        this.mistakes = 0;
        
        this.puzzle = this.generatePuzzle();
        this.render();
        startGameSession('kaitan');
    }

    generatePuzzle() {
        // Simple puzzle generation
        const categories = [
            { name: 'BUAH', words: ['APEL','JERUK','MANGGA','PISANG'], difficulty: 1 },
            { name: 'HEWAN', words: ['KUCING','ANJING','BURUNG','IKAN'], difficulty: 2 },
            { name: 'WARNA', words: ['MERAH','BIRU','HIJAU','KUNING'], difficulty: 3 },
            { name: 'ANGKA', words: ['SATU','DUA','TIGA','EMPAT'], difficulty: 4 }
        ];
        
        let words = [];
        categories.forEach(cat => words.push(...cat.words));
        words = shuffle(words);
        
        return { categories, words };
    }

    render() {
        this.container.innerHTML = `
            <div class="game-header">
                <button class="btn-icon" onclick="returnToMenu()">🏠</button>
                <h1>Kaitan</h1>
                <div class="header-buttons">
                    <button class="btn-icon" onclick="showSettings('kaitan')">⚙️</button>
                </div>
            </div>
            
            <div class="game-content">
                <div style="text-align: center; margin-bottom: 20px;">
                    <p>Kesalahan: ${this.mistakes}/${this.settings.maxMistakes}</p>
                </div>
                <div id="solved-groups"></div>
                <div class="connections-grid" id="connections-grid"></div>
                <div style="text-align: center; margin-top: 20px;">
                    <button class="btn btn-primary" onclick="gameInstances['kaitan'].submit()">Submit</button>
                    <button class="btn btn-secondary" onclick="gameInstances['kaitan'].deselect()">Batal</button>
                </div>
            </div>
        `;
        
        this.renderGrid();
        this.renderSolved();
    }

    renderGrid() {
        const grid = document.getElementById('connections-grid');
        let html = '';
        
        this.puzzle.words.forEach(word => {
            if (this.solved.includes(word)) return;
            
            const selected = this.selected.includes(word);
            html += `<div class="connection-card ${selected ? 'selected' : ''}" 
                         onclick="gameInstances['kaitan'].toggleCard('${word}')">
                        ${word}
                     </div>`;
        });
        
        grid.innerHTML = html;
    }

    renderSolved() {
        const container = document.getElementById('solved-groups');
        let html = '';
        
        this.puzzle.categories.forEach(cat => {
            if (cat.solved) {
                html += `<div class="solved-group difficulty-${cat.difficulty}">
                            <h4>${cat.name}</h4>
                            <div class="words">${cat.words.join(', ')}</div>
                         </div>`;
            }
        });
        
        container.innerHTML = html;
    }

    toggleCard(word) {
        const idx = this.selected.indexOf(word);
        if (idx > -1) {
            this.selected.splice(idx, 1);
        } else {
            if (this.selected.length < 4) {
                this.selected.push(word);
            }
        }
        this.renderGrid();
    }

    deselect() {
        this.selected = [];
        this.renderGrid();
    }

    submit() {
        if (this.selected.length !== 4) {
            showMessage('Pilih 4 kata', 'error');
            return;
        }
        
        // Check if correct
        let found = null;
        for (const cat of this.puzzle.categories) {
            if (cat.solved) continue;
            if (cat.words.every(w => this.selected.includes(w))) {
                found = cat;
                break;
            }
        }
        
        if (found) {
            found.solved = true;
            this.solved.push(...this.selected);
            this.selected = [];
            showMessage('Benar!', 'success');
            this.render();
            
            if (this.solved.length === this.puzzle.words.length) {
                this.win();
            }
        } else {
            this.mistakes++;
            this.selected = [];
            this.render();
            
            if (this.mistakes >= this.settings.maxMistakes) {
                this.lose();
            } else {
                showMessage('Salah!', 'error');
            }
        }
    }

    win() {
        endGameSession(true);
        showMessage('Selamat!', 'success', 3000);
    }

    lose() {
        endGameSession(false);
        showMessage('Game Over', 'error', 3000);
    }
}
