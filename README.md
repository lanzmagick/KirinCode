# KirinCode

**Multi-Language Code Viewer & Editor** — editor fail kod dalam pelayar, diinspirasikan oleh Notepad++ dan disediakan untuk GitHub Pages.

**Laman (selepas GitHub Pages diaktifkan):** https://lanzmagick.github.io/KirinCode/

## Ciri versi 0.4

- **Code viewer dan editor:** syntax highlighting, nombor baris, code folding, bracket matching, auto-close brackets, word wrap, tab spacing dan tetapan saiz font.
- **Pelbagai bahasa:** CodeMirror memuatkan mode mengikut extension secara automatik. HTML, CSS, JS, JSON, XML, Markdown, Python, C/C++, Java, PHP, SQL dan banyak lagi (bergantung pada mode yang tersedia).
- **Format Left 4 Dead 2 / SourceMod:** .sp dan .inc kini menggunakan tokenizer SourcePawn khusus: preprocessor, methodmap, enum struct, native, forward, string, komen berbilang baris dan beberapa API popular SourceMod. Format .cfg, .nut, .vdf, .vmt kekal disokong.
- **Fallback Plain Text:** semua fail teks yang tidak dikenali boleh dibuka tanpa syntax highlighting.
- **Multiple tabs:** buka/edit banyak fail, serta pengesanan perubahan belum disimpan.
- **Find / Replace:** cari, kes sensitif, regex, ganti satu atau semua.
- **Fail tempatan:** buka banyak fail, drag & drop dan pilih folder jika disokong oleh pelayar.
- **ZIP:** baca fail teks daripada ZIP dan eksport semua tab sebagai satu ZIP.
- **GitHub File:** baca fail awam menggunakan pautan fail github.com atau raw.githubusercontent.com.
- **GitHub Repository Explorer:** masukkan owner/repo atau URL repo awam, buka folder, cari fail dan buka kod daripada GitHub terus ke tab tempatan (tanpa token).
- **Manual language selector:** pilih salah satu daripada 24 mod (termasuk Auto Detect), berguna apabila extension tidak dikenali; pilihan disimpan bagi sesi tab.
- **Live Preview:** paparan HTML dan Markdown sambil menaip. Desktop memaparkan editor dan preview sebelah-menyebelah; telefon menggunakan panel preview. HTML dijalankan dalam iframe sandbox tanpa JavaScript.
- **Compare Code:** bandingkan dua tab terbuka, paparkan nombor baris dan perbezaan yang ditambah, dipadam atau diubah.
- **Responsif:** sidebar mudah alih, tema dark/light dan kawalan untuk Android atau desktop.
- **Pemulihan sesi:** draf kecil disimpan dalam sessionStorage untuk tab pelayar yang sama; tetapan UI menggunakan localStorage.

### Had semasa

- Tiada server/backend: fail diproses dalam pelayar. Tidak ada upload fail secara automatik.
- Butang **Save** memuat turun salinan UTF-8 ke peranti; **bukan** commit atau menulis kembali ke GitHub.
- ZIP dihadkan kepada **15 MB** dan **120 entri**; fail teks tunggal maksimum **4 MB** demi prestasi.
- Fail binari, media, fail tersulit dan arkib selain ZIP belum disokong.
- Bahasa yang tiada mode CodeMirror dipaparkan sebagai teks biasa. SourcePawn menggunakan lexer khusus untuk warna kod, **bukan compiler, validator atau autocomplete semantik penuh**. Fungsi custom masih boleh dipaparkan sebagai fungsi biasa.
- GitHub Explorer hanya membaca **repositori awam** pada **default branch**. GitHub API boleh menghadkan permintaan awam tanpa token, dan senarai repo yang terlalu besar mungkin dipotong.
- Fungsi GitHub File asal masih untuk satu URL fail pada satu masa; nama branch yang mengandungi slash mungkin memerlukan URL raw yang tepat.
- CodeMirror, JSZip dan mode bahasa dimuatkan melalui CDN; Internet diperlukan untuk editor penuh. CodeMirror 5 adalah pustaka lama; migrasi CodeMirror 6 boleh dipertimbangkan kemudian.
- Simpanan sesi bukan sandaran: **muat turun fail penting**. Data besar mungkin tidak masuk ke sessionStorage.
- Live Preview HTML menyekat **JavaScript, borang, rangka bersarang, sambungan rangkaian JavaScript dan aset selain gambar HTTPS/data serta gaya inline**. Ini untuk keselamatan; bukan pelayar penuh atau laman web dinamik.
- Preview Markdown menyokong tajuk, teks tebal/condong, pautan selamat, gambar HTTPS, senarai, checklist, jadual, petikan dan blok kod. Ia belum menyokong seluruh spesifikasi CommonMark/GFM.
- Live Preview dihadkan kepada **200,000 aksara setiap fail** untuk mengelakkan pembekuan pelayar Android. Kod yang lebih besar masih boleh diedit tanpa preview.
- Compare Code dihadkan kepada **1,200 baris setiap fail**; perbandingan baris sahaja, bukan diff perkataan atau Git commit.

## Menggunakan mod SourcePawn

Buka fail `.sp` atau `.inc` dan syntax highlighting akan dikesan secara automatik. Untuk fail tanpa extension, pilih **SourcePawn** daripada senarai bahasa di status bar. Sokongan warna meliputi kedua-dua sintaks lama dan newdecls. Pengesanan ralat compile belum disokong.

## Cara guna Live Preview dan Compare Code

- **Live Preview:** buka fail HTML (.html/.htm) atau Markdown (.md/.markdown), kemudian tekan **Preview**. Panel akan dikemas kini selepas perubahan kod; tekan ✕ untuk tutup. HTML dinyahaktifkan skripnya dalam iframe sandbox.
- **Compare Code:** buka sekurang-kurangnya dua fail dalam tab KirinCode, tekan **Compare**, pilih fail kiri dan kanan. Baris merah menunjukkan kod dibuang, hijau menunjukkan kod baharu dan kombinasi merah/hijau menunjukkan baris yang diubah. Bandingan auto-update selepas edit.

## Cara guna GitHub Repo Explorer

1. Di editor, tekan **GitHub Repo**.
2. Masukkan URL seperti https://github.com/lanzmagick/KirinCode atau nama pendek lanzmagick/KirinCode.
3. Tekan **Open Repo**, kemudian buka folder atau cari nama fail.
4. Tekan fail untuk membukanya dalam editor. Anda boleh ubah kod dan memuat turun salinan; ini **tidak commit ke GitHub**.

Untuk menukar syntax highlighting, pilih bahasa melalui dropdown **Auto Detect** di status bar bahagian bawah.

## Cara aktifkan GitHub Pages

1. Pergi ke **Settings → Pages** untuk repo ini.
2. Di **Build and deployment**, pilih **Deploy from a branch**.
3. Pilih **main**, folder **/(root)**, kemudian tekan **Save**.
4. Buka https://lanzmagick.github.io/KirinCode/ selepas penerbitan selesai.

Tiada proses npm install, backend atau build diperlukan. index.html berada terus di root branch.

## Shortcut

| Shortcut | Tindakan |
| --- | --- |
| Ctrl/Cmd + N | Fail baharu |
| Ctrl/Cmd + O | Buka fail |
| Ctrl/Cmd + S | Muat turun fail semasa |
| Ctrl/Cmd + Shift + S | Eksport semua tab sebagai ZIP |
| Ctrl/Cmd + F | Cari |
| Ctrl + H | Cari dan ganti |
| Ctrl + Tab | Tab seterusnya |
| Ctrl + Shift + Tab | Tab sebelumnya |
| Ctrl/Cmd + W | Tutup tab editor |

## Struktur projek

Semua kod berkaitan bahasa diletakkan dalam folder **languages/**. Fail pihak ketiga CodeMirror (core dan beberapa mode) masih dimuatkan melalui CDN; fail konfigurasi bahasa dan mode khas KirinCode disimpan dalam repo.

```text
KirinCode/
├── index.html
├── README.md
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   ├── repo.css
│   │   └── workbench.css
│   ├── js/
│   │   ├── app.js
│   │   ├── repo-explorer.js
│   │   ├── workbench-core.js
│   │   └── workbench.js
│   └── icons/
│       └── icon.svg
├── languages/
│   ├── catalog.js
│   ├── sourcepawn.js
│   └── valve-keyvalues.js
├── scripts/
│   ├── check.mjs
│   ├── test-sourcepawn.mjs
│   └── test-workbench.mjs
└── .github/
    └── workflows/
        └── validate.yml
```


- `index.html` — titik masuk GitHub Pages
- `assets/css/` — tema utama dan gaya Repo Explorer
- `assets/js/` — editor, GitHub Repo Explorer, Live Preview dan Compare Code
- `assets/css/workbench.css` — panel preview/compare responsif
- `assets/icons/` — favicon dan ikon
- `languages/catalog.js` — pengesanan format, 24 pilihan bahasa dan rujukan CodeMirror
- `languages/valve-keyvalues.js` — mode khas Valve VDF/VMT
- `languages/sourcepawn.js` — lexer SourcePawn khusus untuk .sp dan .inc
- `scripts/test-sourcepawn.mjs` — ujian token SourcePawn
- `scripts/test-workbench.mjs` — ujian Markdown, iframe CSP, diff dan sambungan UI
- `scripts/check.mjs` — pemeriksaan sintaks, laluan fail dan UI
- .github/workflows/validate.yml — semakan automatik semasa push/PR

## Roadmap

- [x] Viewer/editor berbilang format
- [x] Responsive Android/desktop
- [x] Multiple tabs, find/replace, ZIP import/export
- [x] Viewer fail GitHub awam
- [x] GitHub repo explorer (folder & tree) untuk repositori awam
- [x] Language picker manual setiap tab
- [x] Syntax highlighting SourcePawn khusus (tokenizer, bukan compiler)
- [ ] Custom SourceMod API token dictionary/import daripada fail .inc
- [x] Live Preview HTML/Markdown menggunakan iframe sandbox dan CSP terhad
- [x] Compare Code dua tab dengan diff baris responsif
- [ ] Live Preview Markdown berasaskan renderer lengkap CommonMark/GFM dan ujian pelayar automatik
- [ ] Offline PWA dan pilihan backup draf
- [ ] Penambahbaikan aksesibiliti, ujian E2E dan penskalaan fail besar

## Kredit

CodeMirror 5 (MIT), JSZip (MIT). KirinCode dibangunkan sebagai projek web statik. Semakan GitHub Actions menggunakan Node.js (tanpa pemasangan dependensi).
