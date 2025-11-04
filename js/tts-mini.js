// TTS Mini Game (Mini Crossword)
class TTSMiniGame {
    constructor() {
        this.container = document.getElementById('tts-mini-page');
        this.settings = getGameSettings('tts-mini');
        this.puzzle = null;
    }

    start() {
        const adaptive = getAdaptiveDifficulty('tts-mini');
        this.settings = {...this.settings, ...adaptive};
        
        this.puzzle = this.generatePuzzle();
        this.render();
        startGameSession('tts-mini');
    }

    generatePuzzle() {
        // Simple 5x5 crossword
        const size = this.settings.gridSize;
        return {
            size: size,
            grid: [
                ['M','A','K','A','N'],
                ['I','_','_','_','O'],
                ['N','A','S','I','_'],
                ['U','_','_','K','A'],
                ['M','A','T','A','_']
            ],
            across: [
                { num: 1, clue: 'Memakan sesuatu', answer: 'MAKAN', row: 0, col: 0 },
                { num: 3, clue: 'Beras yang sudah matang', answer: 'NASI', row: 2, col: 0 },
                { num: 5, clue: 'Alat untuk melihat', answer: 'MATA', row: 4, col: 0 }
            ],
            down: [
                { num: 1, clue: 'Mengkonsumsi cairan', answer: 'MINUM', row: 0, col: 0 },
                { num: 2, clue: 'Sedang', answer: 'LAGI', row: 0, col: 4 }
            ]
        };
    }

    getClueNumber(row, col) {
        let num = null;
        const acrossClue = this.puzzle.across.find(c => c.row === row && c.col === col);
        const downClue = this.puzzle.down.find(c => c.row === row && c.col === col);
        
        if (acrossClue) num = acrossClue.num;
        if (downClue && (!num || downClue.num < num)) num = downClue.num;
        
        return num;
    }

    render() {
        this.container.innerHTML = `
            <div class="game-header">
                <button class="btn-icon" onclick="returnToMenu()">🏠</button>
                <h1>TTS Mini</h1>
                <div class="header-buttons">
                    <button class="btn-icon" onclick="showSettings('tts-mini')">⚙️</button>
                </div>
            </div>
            
            <div class="game-content">
                <div class="crossword-grid" id="crossword-grid"></div>
                <div class="clues">
                    <div class="clue-section">
                        <h3>Mendatar</h3>
                        <ul class="clue-list" id="across-clues"></ul>
                    </div>
                    <div class="clue-section">
                        <h3>Menurun</h3>
                        <ul class="clue-list" id="down-clues"></ul>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button class="btn btn-primary" onclick="gameInstances['tts-mini'].check()">Periksa</button>
                </div>
            </div>
        `;
        
        this.renderGrid();
        this.renderClues();
    }

    renderGrid() {
        const grid = document.getElementById('crossword-grid');
        let html = '';
        
        this.puzzle.grid.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell === '_') {
                    html += '<div class="crossword-cell black"></div>';
                } else {
                    const clueNum = this.getClueNumber(i, j);
                    const numSpan = clueNum ? `<span class="clue-number">${clueNum}</span>` : '';
                    
                    html += `<div class="crossword-cell">
                                ${numSpan}
                                <input type="text" maxlength="1" data-row="${i}" data-col="${j}">
                             </div>`;
                }
            });
        });
        
        grid.style.gridTemplateColumns = `repeat(${this.puzzle.size}, 50px)`;
        grid.innerHTML = html;
    }

    renderClues() {
        const acrossClues = document.getElementById('across-clues');
        const downClues = document.getElementById('down-clues');
        
        acrossClues.innerHTML = this.puzzle.across.map(clue => 
            `<li>${clue.num}. ${clue.clue}</li>`
        ).join('');
        
        downClues.innerHTML = this.puzzle.down.map(clue => 
            `<li>${clue.num}. ${clue.clue}</li>`
        ).join('');
    }

    check() {
        let correct = true;
        
        this.puzzle.grid.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell !== '_') {
                    const input = document.querySelector(`input[data-row="${i}"][data-col="${j}"]`);
                    if (input && input.value.toUpperCase() !== cell) {
                        correct = false;
                    }
                }
            });
        });
        
        if (correct) {
            endGameSession(true);
            showMessage('Selamat! Semua benar!', 'success', 3000);
        } else {
            showMessage('Ada yang salah, coba lagi!', 'error');
        }
    }
}
