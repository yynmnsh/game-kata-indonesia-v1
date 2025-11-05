/**
 * API-Based Word Service for Game Kata Indonesia
 * 
 * This service fetches ALL words from external APIs instead of storing them locally.
 * Uses aggressive caching to minimize API calls and improve performance.
 * 
 * APIs Used:
 * - Primary: Kateglo API (http://kateglo.lostfocus.org/)
 * - Fallback: New KBBI API (https://new-kbbi-api.herokuapp.com/)
 * - Word Lists: GitHub raw content for bulk fetching
 */

class APIWordService {
    constructor() {
        this.cache = null; // Will be IndexedDB instance
        this.apis = {
            // Using working Indonesian wordlist from GitHub
            wordlist: 'https://raw.githubusercontent.com/geovedi/indonesian-wordlist/master/00-indonesian-wordlist.lst',
            // Alternative wordlist (backup)
            wordlistBackup: 'https://raw.githubusercontent.com/louisowen6/NLP_bahasa_resources/master/combined_stop_words.txt'
        };
        this.initCache();
    }

    /**
     * Initialize IndexedDB for caching
     */
    async initCache() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('KataGameDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.cache = request.result;
                console.log('✅ Cache initialized');
                resolve(this.cache);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Store for words by length
                if (!db.objectStoreNames.contains('wordsByLength')) {
                    const store = db.createObjectStore('wordsByLength', { keyPath: 'length' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                // Store for validated words
                if (!db.objectStoreNames.contains('validatedWords')) {
                    const store = db.createObjectStore('validatedWords', { keyPath: 'word' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                // Store for word metadata
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }
            };
        });
    }

    /**
     * Fetch initial word list from GitHub (one-time bulk fetch)
     */
    async fetchBulkWordList() {
        try {
            console.log('📥 Fetching bulk word list from GitHub...');
            
            // Try primary source
            let response = await fetch(this.apis.wordlist);
            
            // If primary fails, try backup
            if (!response.ok) {
                console.log('⚠️ Primary source failed, trying backup...');
                response = await fetch(this.apis.wordlistBackup);
            }
            
            if (!response.ok) throw new Error('Failed to fetch word list');
            
            const text = await response.text();
            const words = text.split('\n')
                .map(w => w.trim().toLowerCase())
                .filter(w => w.length >= 3 && w.length <= 15 && /^[a-z]+$/i.test(w));
            
            console.log(`✅ Fetched ${words.length} words from GitHub`);
            
            // Store in cache by length
            await this.cacheWordsByLength(words);
            
            return words;
        } catch (error) {
            console.error('❌ Failed to fetch bulk word list:', error);
            // Return emergency fallback words
            return this.getEmergencyFallbackWords();
        }
    }

    /**
     * Cache words organized by length
     */
    async cacheWordsByLength(words) {
        if (!this.cache) await this.initCache();
        
        const byLength = {};
        words.forEach(word => {
            const len = word.length;
            if (!byLength[len]) byLength[len] = [];
            byLength[len].push(word);
        });
        
        const transaction = this.cache.transaction(['wordsByLength'], 'readwrite');
        const store = transaction.objectStore('wordsByLength');
        
        for (const [length, wordList] of Object.entries(byLength)) {
            await store.put({
                length: parseInt(length),
                words: wordList,
                timestamp: Date.now()
            });
        }
        
        console.log('✅ Words cached by length');
    }

    /**
     * Get words by length (from cache or API)
     */
    async getWordsByLength(length, count = 20) {
        if (!this.cache) await this.initCache();
        
        // Try cache first
        const cached = await this.getCachedWordsByLength(length);
        
        if (cached && cached.words && cached.words.length > 0) {
            console.log(`✅ Using ${cached.words.length} cached ${length}-letter words`);
            return this.shuffle(cached.words).slice(0, count);
        }
        
        // Cache miss - fetch bulk list
        console.log(`⚠️ No cached ${length}-letter words, fetching bulk list...`);
        await this.fetchBulkWordList();
        
        // Try cache again
        const retryCache = await this.getCachedWordsByLength(length);
        if (retryCache && retryCache.words) {
            return this.shuffle(retryCache.words).slice(0, count);
        }
        
        // Emergency fallback
        return this.getEmergencyFallbackWords().filter(w => w.length === length).slice(0, count);
    }

    /**
     * Get cached words by length
     */
    async getCachedWordsByLength(length) {
        if (!this.cache) await this.initCache();
        
        return new Promise((resolve, reject) => {
            const transaction = this.cache.transaction(['wordsByLength'], 'readonly');
            const store = transaction.objectStore('wordsByLength');
            const request = store.get(length);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Validate a word against cached word list
     * (No external API calls - using cached list only)
     */
    async validateWord(word) {
        if (!word || word.length < 3) return false;
        
        // Check cache first
        const cached = await this.getCachedValidation(word);
        if (cached !== null) return cached;
        
        // Check if word exists in our cached word list
        const isValid = await this.checkInCachedList(word);
        
        // Cache result
        await this.cacheValidation(word, isValid);
        
        return isValid;
    }

    /**
     * Check if word exists in cached word list
     */
    async checkInCachedList(word) {
        const cached = await this.getCachedWordsByLength(word.length);
        if (cached && cached.words) {
            return cached.words.includes(word.toLowerCase());
        }
        return false;
    }

    /**
     * Cache word validation result
     */
    async cacheValidation(word, isValid) {
        if (!this.cache) return;
        
        const transaction = this.cache.transaction(['validatedWords'], 'readwrite');
        const store = transaction.objectStore('validatedWords');
        
        await store.put({
            word: word.toLowerCase(),
            valid: isValid,
            timestamp: Date.now()
        });
    }

    /**
     * Get cached validation result
     */
    async getCachedValidation(word) {
        if (!this.cache) await this.initCache();
        
        return new Promise((resolve) => {
            const transaction = this.cache.transaction(['validatedWords'], 'readonly');
            const store = transaction.objectStore('validatedWords');
            const request = store.get(word.toLowerCase());
            
            request.onsuccess = () => {
                if (request.result) {
                    // Check if cache is less than 7 days old
                    const age = Date.now() - request.result.timestamp;
                    if (age < 7 * 24 * 60 * 60 * 1000) {
                        resolve(request.result.valid);
                        return;
                    }
                }
                resolve(null);
            };
            request.onerror = () => resolve(null);
        });
    }

    /**
     * Get words containing specific letters
     */
    async getWordsWithLetters(letters, minLength = 3, centerLetter = null, maxCount = 50) {
        const letterSet = new Set(letters.toLowerCase().split(''));
        const allWords = [];
        
        // Get words of different lengths
        for (let len = minLength; len <= Math.min(letters.length + 3, 12); len++) {
            const words = await this.getWordsByLength(len, 200);
            allWords.push(...words);
        }
        
        // Filter words that can be formed with given letters
        const validWords = allWords.filter(word => {
            if (word.length < minLength) return false;
            
            // Must contain center letter if specified
            if (centerLetter && !word.includes(centerLetter.toLowerCase())) {
                return false;
            }
            
            // All letters must be in the letter set
            return word.split('').every(letter => letterSet.has(letter));
        });
        
        return this.shuffle(validWords).slice(0, maxCount);
    }

    /**
     * Get random words
     */
    async getRandomWords(count = 20, minLength = 3, maxLength = 8) {
        const allWords = [];
        
        for (let len = minLength; len <= maxLength; len++) {
            const words = await this.getWordsByLength(len, 50);
            allWords.push(...words);
        }
        
        return this.shuffle(allWords).slice(0, count);
    }

    /**
     * Check if cache needs refresh (older than 30 days)
     */
    async shouldRefreshCache() {
        if (!this.cache) await this.initCache();
        
        return new Promise((resolve) => {
            const transaction = this.cache.transaction(['metadata'], 'readonly');
            const store = transaction.objectStore('metadata');
            const request = store.get('lastBulkFetch');
            
            request.onsuccess = () => {
                if (!request.result) {
                    resolve(true);
                } else {
                    const age = Date.now() - request.result.timestamp;
                    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
                    resolve(age > thirtyDays);
                }
            };
            request.onerror = () => resolve(true);
        });
    }

    /**
     * Mark cache as refreshed
     */
    async markCacheRefreshed() {
        if (!this.cache) return;
        
        const transaction = this.cache.transaction(['metadata'], 'readwrite');
        const store = transaction.objectStore('metadata');
        await store.put({
            key: 'lastBulkFetch',
            timestamp: Date.now()
        });
    }

    /**
     * Clear all cache
     */
    async clearCache() {
        if (!this.cache) return;
        
        const storeNames = ['wordsByLength', 'validatedWords', 'metadata'];
        const transaction = this.cache.transaction(storeNames, 'readwrite');
        
        for (const storeName of storeNames) {
            await transaction.objectStore(storeName).clear();
        }
        
        console.log('✅ Cache cleared');
    }

    /**
     * Utility: Shuffle array
     */
    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /**
     * Emergency fallback words (minimal set for offline)
     */
    getEmergencyFallbackWords() {
        return [
            // 3-letter
            'ada', 'air', 'aku', 'apa', 'api', 'ayo', 'dan', 'dia', 'ini', 'itu',
            'jadi', 'kata', 'lagi', 'mari', 'oleh', 'saat', 'saja', 'satu', 'saya',
            'sini', 'tahu', 'tapi', 'tidak',
            // 4-letter
            'akan', 'anak', 'atau', 'baca', 'baik', 'baru', 'bawa', 'beli', 'bisa',
            'dari', 'dapat', 'hari', 'hidup', 'nama', 'pagi', 'pergi', 'siang',
            'sudah', 'tahun', 'waktu',
            // 5-letter
            'akhir', 'ambil', 'antara', 'benar', 'besar', 'bicara', 'bulan', 'cinta',
            'datang', 'dalam', 'dapat', 'dunia', 'jalan', 'kecil', 'makan', 'masih',
            'minum', 'punya', 'rumah', 'siang', 'sudah', 'tahun', 'tempat', 'tidak',
            'waktu'
        ];
    }
}

// Create global instance
const apiWordService = new APIWordService();

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing API Word Service...');
    
    // Check if we need to fetch bulk list
    const shouldRefresh = await apiWordService.shouldRefreshCache();
    
    if (shouldRefresh) {
        console.log('📥 First time or cache expired, fetching word list...');
        showLoadingMessage('Mengunduh daftar kata...');
        
        try {
            await apiWordService.fetchBulkWordList();
            await apiWordService.markCacheRefreshed();
            hideLoadingMessage();
            console.log('✅ Word list ready!');
        } catch (error) {
            console.error('❌ Failed to fetch word list:', error);
            hideLoadingMessage();
            showMessage('Gagal mengunduh daftar kata. Menggunakan kata darurat.', 'warning');
        }
    } else {
        console.log('✅ Using cached word list');
    }
});

// Helper functions for UI feedback
function showLoadingMessage(message) {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.querySelector('p').textContent = message;
        loader.classList.add('active');
    }
}

function hideLoadingMessage() {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.classList.remove('active');
    }
}

// Backward compatibility: Expose as wordManager
window.wordManager = {
    async getWordsForGame(gameType, options = {}) {
        switch(gameType) {
            case 'katla':
                return await apiWordService.getWordsByLength(options.length || 5, 1);
            
            case 'susun-kata':
                return await apiWordService.getWordsWithLetters(
                    options.letters,
                    3,
                    null,
                    50
                );
            
            case 'sarang-kata':
                return await apiWordService.getWordsWithLetters(
                    options.letters,
                    options.minLength || 4,
                    options.centerLetter,
                    100
                );
            
            case 'kaitan':
                return await apiWordService.getRandomWords(16, 4, 8);
            
            case 'tts-mini':
                return await apiWordService.getRandomWords(20, 3, 8);
            
            default:
                return await apiWordService.getRandomWords(20);
        }
    },
    
    async validateWord(word) {
        return await apiWordService.validateWord(word);
    },
    
    async getWordsByLength(length, count) {
        return await apiWordService.getWordsByLength(length, count);
    },
    
    async clearCache() {
        return await apiWordService.clearCache();
    }
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { apiWordService, APIWordService };
}
