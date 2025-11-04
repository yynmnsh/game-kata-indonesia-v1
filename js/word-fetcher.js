// Word Fetcher - Dynamic word loading from open sources
// This module fetches Indonesian words from various open sources

const WORD_SOURCES = {
    // GitHub raw content from Indonesian word lists
    github1: 'https://raw.githubusercontent.com/k ata-ai/kata-dataset/main/data/indonesian-words.txt',
    github2: 'https://raw.githubusercontent.com/andiazhar/indonesia-word-list/master/indonesia-word-list.txt',
    // Add more sources as needed
};

// Fetch additional words from external sources
async function fetchAdditionalWords() {
    console.log('Fetching additional words from external sources...');
    
    try {
        // Try to fetch from various sources
        const responses = await Promise.allSettled([
            fetchFromGitHub(),
            fetchFromLocalAPI()
        ]);
        
        // Merge all successful results
        let allWords = [];
        responses.forEach(response => {
            if (response.status === 'fulfilled' && response.value) {
                allWords = allWords.concat(response.value);
            }
        });
        
        // Remove duplicates and filter
        allWords = [...new Set(allWords)].filter(word => 
            word && 
            word.length >= 3 && 
            word.length <= 15 &&
            /^[a-z]+$/i.test(word)
        );
        
        // Merge with existing wordlist
        if (typeof WORDLISTS !== 'undefined' && WORDLISTS.indonesian) {
            WORDLISTS.indonesian = [...new Set([...WORDLISTS.indonesian, ...allWords])];
        } else {
            if (typeof WORDLISTS === 'undefined') {
                window.WORDLISTS = {};
            }
            WORDLISTS.indonesian = allWords;
        }
        
        console.log(`Successfully loaded ${allWords.length} additional words`);
        console.log(`Total words: ${WORDLISTS.indonesian.length}`);
        
        // Save to localStorage for offline use
        saveWordsToCache(WORDLISTS.indonesian);
        
        return allWords;
    } catch (error) {
        console.error('Error fetching additional words:', error);
        
        // Try to load from cache
        const cachedWords = loadWordsFromCache();
        if (cachedWords && cachedWords.length > 0) {
            console.log('Loaded words from cache');
            if (typeof WORDLISTS !== 'undefined') {
                WORDLISTS.indonesian = cachedWords;
            }
            return cachedWords;
        }
        
        throw error;
    }
}

// Fetch from GitHub sources
async function fetchFromGitHub() {
    // For now, return empty array since we're using offline wordlist
    // In production, you would uncomment this to fetch from real sources
    /*
    try {
        const response = await fetch(WORD_SOURCES.github1, { mode: 'cors' });
        if (!response.ok) throw new Error('GitHub fetch failed');
        const text = await response.text();
        return text.split('\n').map(w => w.trim().toLowerCase()).filter(w => w);
    } catch (error) {
        console.warn('GitHub fetch failed:', error);
        return [];
    }
    */
    return [];
}

// Fetch from local API or generate additional words
async function fetchFromLocalAPI() {
    // Generate some common Indonesian words programmatically
    // This is a fallback method
    return generateCommonWords();
}

// Generate common Indonesian word patterns
function generateCommonWords() {
    const commonRoots = [
        'aku', 'kamu', 'dia', 'kita', 'kami', 'mereka',
        'ada', 'tidak', 'bisa', 'mau', 'akan', 'sudah',
        'baik', 'buruk', 'besar', 'kecil', 'tinggi', 'rendah',
        'cepat', 'lambat', 'jauh', 'dekat', 'lama', 'baru',
        'suka', 'cinta', 'benci', 'takut', 'senang', 'sedih',
        'makan', 'minum', 'tidur', 'bangun', 'pergi', 'datang',
        'lihat', 'dengar', 'bicara', 'tulis', 'baca', 'belajar',
        'kerja', 'main', 'lari', 'jalan', 'duduk', 'berdiri',
        'rumah', 'sekolah', 'kantor', 'toko', 'pasar', 'jalan',
        'mobil', 'motor', 'sepeda', 'kereta', 'pesawat', 'kapal',
        'buku', 'pensil', 'kertas', 'meja', 'kursi', 'pintu',
        'hari', 'minggu', 'bulan', 'tahun', 'jam', 'menit',
        'pagi', 'siang', 'sore', 'malam', 'kemarin', 'besok'
    ];
    
    const prefixes = ['ber', 'me', 'di', 'ter', 'pe', 'ke', 'se'];
    const suffixes = ['kan', 'an', 'i', 'nya', 'lah', 'kah'];
    
    const words = [...commonRoots];
    
    // Generate with prefixes
    commonRoots.forEach(root => {
        prefixes.forEach(prefix => {
            words.push(prefix + root);
        });
    });
    
    // Generate with suffixes
    commonRoots.forEach(root => {
        suffixes.forEach(suffix => {
            words.push(root + suffix);
        });
    });
    
    return words.filter(w => w.length >= 3);
}

// Save words to localStorage cache
function saveWordsToCache(words) {
    try {
        const data = {
            words: words,
            timestamp: Date.now(),
            version: '1.0'
        };
        localStorage.setItem('cached-indonesian-words', JSON.stringify(data));
    } catch (error) {
        console.warn('Failed to cache words:', error);
    }
}

// Load words from localStorage cache
function loadWordsFromCache() {
    try {
        const cached = localStorage.getItem('cached-indonesian-words');
        if (!cached) return null;
        
        const data = JSON.parse(cached);
        
        // Check if cache is less than 30 days old
        const age = Date.now() - data.timestamp;
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        
        if (age > maxAge) {
            localStorage.removeItem('cached-indonesian-words');
            return null;
        }
        
        return data.words;
    } catch (error) {
        console.warn('Failed to load cached words:', error);
        return null;
    }
}

// Initialize word loading on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if we need to load words
    if (typeof WORDLISTS === 'undefined' || !WORDLISTS.indonesian || WORDLISTS.indonesian.length < 1000) {
        // Try to load from cache first
        const cached = loadWordsFromCache();
        if (cached && cached.length > 0) {
            if (typeof WORDLISTS === 'undefined') {
                window.WORDLISTS = {};
            }
            WORDLISTS.indonesian = cached;
            console.log('Loaded words from cache:', cached.length);
        }
    }
});

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchAdditionalWords,
        loadWordsFromCache,
        saveWordsToCache
    };
}
