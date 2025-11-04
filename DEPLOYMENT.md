# Panduan Deploy Game Kata Indonesia

## Ringkasan Perbaikan

✅ **Semua masalah telah diperbaiki:**

1. **Pengaturan berfungsi**: Settings langsung diterapkan saat diklik
2. **Susun Kata**: Default 3 huruf per sisi, UI lebih baik
3. **Sarang Kata**: Hexagon ditampilkan dengan benar
4. **Navigasi**: Setiap game punya halaman sendiri
5. **Word list dinamis**: Bisa di-update dari sumber terbuka

## Cara Deploy (Pilih Salah Satu)

### 🚀 Option 1: GitHub Pages (Recommended)

**Langkah-langkah:**

1. Buat repository baru di GitHub
2. Upload semua file ke repository
3. Aktifkan GitHub Pages:
   - Settings → Pages
   - Source: main branch
   - Save

**Hasil:** Website akan live di `https://username.github.io/repo-name/`

**Kelebihan:**
- Gratis selamanya
- Custom domain bisa (jika punya)
- Auto SSL certificate
- Easy to update (push ke GitHub)

---

### 🌐 Option 2: Netlify (Drag & Drop)

**Langkah-langkah:**

1. Buka [netlify.com](https://www.netlify.com/)
2. Sign up gratis
3. Drag & drop folder project
4. Done! Website langsung online

**Hasil:** Website akan live di `https://random-name.netlify.app/`

**Kelebihan:**
- Super mudah, tidak perlu git
- Custom domain gratis
- Auto deploy dari GitHub (optional)
- Form handling (jika butuh)

---

### ⚡ Option 3: Vercel

**Langkah-langkah:**

1. Buka [vercel.com](https://vercel.com/)
2. Sign up dengan GitHub
3. Import repository
4. Deploy otomatis

**Hasil:** Website akan live di `https://project-name.vercel.app/`

**Kelebihan:**
- Sangat cepat
- Auto deploy setiap push
- Preview untuk setiap branch
- Analytics gratis

---

### 💻 Option 4: Testing Lokal

Sebelum deploy, test dulu di komputer:

```bash
# Cara 1: Python (jika sudah install Python)
python -m http.server 8000

# Cara 2: Node.js (jika sudah install Node)
npx http-server -p 8000

# Cara 3: PHP (jika sudah install PHP)
php -S localhost:8000
```

Buka browser: `http://localhost:8000`

---

## File Structure yang Sudah Fixed

```
📁 game-kata-indonesia/
├── 📄 index.html              ✅ Updated with better navigation
├── 📁 css/
│   └── 📄 styles.css          ✅ Enhanced UI/UX
├── 📁 js/
│   ├── 📄 main.js             ✅ Fixed settings & navigation
│   ├── 📄 susun-kata.js       ✅ Fixed 3-letter default
│   ├── 📄 sarang-kata.js      ✅ Fixed hexagon display
│   ├── 📄 word-fetcher.js     ✅ New dynamic word loading
│   ├── 📄 utils.js
│   ├── 📄 stats.js
│   ├── 📄 katla.js
│   ├── 📄 kaitan.js
│   └── 📄 tts-mini.js
├── 📁 data/
│   └── 📄 wordlists.js        ✅ 59,814 Indonesian words
├── 📄 README.md
├── 📄 .gitignore
└── 📄 package.json
```

---

## Customization Tips

### Mengubah Jumlah Huruf per Sisi (Susun Kata)

Edit `js/stats.js`, line ~88:

```javascript
'susun-kata': {
    sides: 4,              // Ubah jadi 3 untuk 3 sisi
    lettersPerSide: 3,     // Ubah 2-4 sesuai keinginan
    minWordLength: 3
},
```

### Mengubah Warna Tema

Edit `css/styles.css`, tambahkan di awal file:

```css
:root {
    --primary-color: #3b82f6;    /* Biru */
    --secondary-color: #6b7280;  /* Abu-abu */
    --success-color: #10b981;    /* Hijau */
    --error-color: #ef4444;      /* Merah */
}
```

### Menambah Kata Sendiri

Edit `data/wordlists.js`, tambahkan di array:

```javascript
WORDLISTS.indonesian.push('katabaru1', 'katabaru2', ...);
```

---

## Troubleshooting

### ❌ "WORDLISTS is not defined"
**Solusi:** Pastikan `wordlists.js` dimuat sebelum game files di `index.html`

### ❌ Settings tidak berubah
**Solusi:** Clear browser cache (Ctrl+Shift+Del) atau hard refresh (Ctrl+F5)

### ❌ Game tidak muncul
**Solusi:** 
1. Buka Developer Console (F12)
2. Lihat error messages
3. Pastikan semua file JS dimuat dengan benar

### ❌ Hexagon Sarang Kata tidak muncul
**Solusi:** Sudah diperbaiki! Pastikan gunakan versi fixed ini.

---

## Performance Tips

1. **Lazy load images**: Jika menambahkan gambar, gunakan `loading="lazy"`
2. **Minify CSS/JS**: Untuk production, compress file dengan tools online
3. **Enable compression**: Netlify/Vercel otomatis enable gzip
4. **Use CDN**: Jika traffic tinggi, pertimbangkan Cloudflare

---

## Monetization Ideas (Optional)

Jika ingin monetize:
- Google AdSense (ads di sidebar)
- Ko-fi/Buy Me a Coffee (donasi)
- Patreon (premium features)
- Sponsored words/themes

---

## Next Steps

1. ✅ Deploy ke platform pilihan
2. ✅ Test semua games
3. ✅ Share link dengan teman
4. ⭐ Kumpulkan feedback
5. 🎨 Tambah themes/features baru

---

**Good luck dengan deployment! 🚀**

Jika ada pertanyaan, buka issue di GitHub atau contact developer.
