// Utility functions

// Shuffle array
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Get random item from array
function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Get random items from array
function randomItems(array, count) {
    const shuffled = shuffle(array);
    return shuffled.slice(0, count);
}

// Normalize string (remove accents, lowercase)
function normalizeString(str) {
    return str.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

// Check if word is valid Indonesian word
function isValidWord(word, wordlist) {
    const normalized = normalizeString(word);
    return wordlist.some(w => normalizeString(w) === normalized);
}

// Filter words by length
function filterWordsByLength(words, length) {
    return words.filter(w => w.length === length);
}

// Filter words by pattern (for crossword)
function filterWordsByPattern(words, pattern) {
    const regex = new RegExp('^' + pattern.replace(/_/g, '.') + '$', 'i');
    return words.filter(w => regex.test(w));
}

// Get words containing letters
function getWordsWithLetters(words, letters, centerLetter = null, minLength = 3) {
    const letterSet = new Set(letters.toLowerCase().split(''));
    
    return words.filter(word => {
        if (word.length < minLength) return false;
        
        // Must contain center letter if specified
        if (centerLetter && !word.toLowerCase().includes(centerLetter.toLowerCase())) {
            return false;
        }
        
        // All letters must be in the letter set
        const wordLetters = word.toLowerCase().split('');
        return wordLetters.every(letter => letterSet.has(letter));
    });
}

// Check if word uses all letters (pangram)
function isPangram(word, letters) {
    const letterSet = new Set(letters.toLowerCase().split(''));
    const wordLetters = new Set(word.toLowerCase().split(''));
    return [...letterSet].every(letter => wordLetters.has(letter));
}

// Score word (for Spelling Bee)
function scoreWord(word, letters, minLength = 4) {
    if (word.length < minLength) return 0;
    
    let score = word.length === minLength ? 1 : word.length;
    
    // Bonus for pangram
    if (isPangram(word, letters)) {
        score += 7;
    }
    
    return score;
}

// Generate letter combinations for Letter Box
function generateLetterBox(wordlist, sides = 4, lettersPerSide = 3) {
    // Get common consonants and vowels
    const vowels = 'aeiou'.split('');
    const consonants = 'bcdfghjklmnprst'.split('');
    
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
        attempts++;
        
        const letters = [];
        const sideLetters = [];
        
        // Generate letters for each side
        for (let i = 0; i < sides; i++) {
            const side = [];
            const numVowels = Math.floor(Math.random() * 2) + 1; // 1-2 vowels per side
            
            // Add vowels
            for (let j = 0; j < numVowels && side.length < lettersPerSide; j++) {
                const vowel = randomItem(vowels);
                if (!side.includes(vowel)) side.push(vowel);
            }
            
            // Fill with consonants
            while (side.length < lettersPerSide) {
                const consonant = randomItem(consonants);
                if (!side.includes(consonant)) side.push(consonant);
            }
            
            sideLetters.push(side);
            letters.push(...side);
        }
        
        // Find valid words
        const validWords = wordlist.filter(word => {
            if (word.length < 3) return false;
            
            const wordLetters = word.toLowerCase().split('');
            const usedSides = new Set();
            
            // Check if word can be formed
            for (const letter of wordLetters) {
                let foundSide = -1;
                for (let i = 0; i < sideLetters.length; i++) {
                    if (sideLetters[i].includes(letter)) {
                        // Can't use same side consecutively
                        if (foundSide === -1 || foundSide !== i) {
                            foundSide = i;
                            usedSides.add(i);
                            break;
                        }
                    }
                }
                if (foundSide === -1) return false;
            }
            
            return usedSides.size >= 2; // Must use at least 2 sides
        });
        
        if (validWords.length >= 15) {
            return {
                sides: sideLetters,
                letters: letters.join(''),
                validWords: validWords,
                targetWords: validWords.slice(0, 10)
            };
        }
    }
    
    // Fallback: simpler generation
    const fallbackLetters = shuffle('abcdefghijklmnopqrstuvwxyz'.split('')).slice(0, sides * lettersPerSide);
    const sideLetters = [];
    for (let i = 0; i < sides; i++) {
        sideLetters.push(fallbackLetters.slice(i * lettersPerSide, (i + 1) * lettersPerSide));
    }
    
    return {
        sides: sideLetters,
        letters: fallbackLetters.join(''),
        validWords: [],
        targetWords: []
    };
}

// Generate Spelling Bee puzzle
function generateSpellingBee(wordlist, outerCount = 6) {
    const vowels = 'aeiou'.split('');
    const consonants = 'bcdfghjklmnprst'.split('');
    
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        attempts++;
        
        // Pick center letter (prefer vowels)
        const centerLetter = Math.random() < 0.6 ? randomItem(vowels) : randomItem(consonants);
        
        // Pick outer letters
        const outerLetters = [];
        const numVowels = Math.floor(Math.random() * 2) + 1;
        
        // Add vowels
        for (let i = 0; i < numVowels && outerLetters.length < outerCount; i++) {
            const vowel = randomItem(vowels.filter(v => v !== centerLetter));
            if (!outerLetters.includes(vowel)) outerLetters.push(vowel);
        }
        
        // Add consonants
        while (outerLetters.length < outerCount) {
            const consonant = randomItem(consonants.filter(c => c !== centerLetter));
            if (!outerLetters.includes(consonant)) outerLetters.push(consonant);
        }
        
        const allLetters = [centerLetter, ...outerLetters].join('');
        const validWords = getWordsWithLetters(wordlist, allLetters, centerLetter, 4);
        
        if (validWords.length >= 20) {
            const pangrams = validWords.filter(w => isPangram(w, allLetters));
            const maxScore = validWords.reduce((sum, w) => sum + scoreWord(w, allLetters), 0);
            
            return {
                centerLetter,
                outerLetters,
                validWords,
                pangrams,
                maxScore
            };
        }
    }
    
    // Fallback
    return null;
}

// Get difficulty adjustment based on performance
function getDifficultyMultiplier(stats) {
    if (!stats || !stats.played) return 1;
    
    const winRate = stats.winRate || 0;
    
    if (winRate > 80) return 1.2; // Make harder
    if (winRate < 40) return 0.8; // Make easier
    return 1;
}

// Local storage helpers
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving to storage:', e);
    }
}

function loadFromStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error('Error loading from storage:', e);
        return defaultValue;
    }
}

function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error('Error removing from storage:', e);
    }
}
