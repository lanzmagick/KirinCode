# KirinCode

**Multi-Language Code Viewer & Editor** — editor fail kod dalam pelayar, diinspirasikan oleh Notepad++ dan disediakan untuk GitHub Pages.

**Laman (selepas GitHub Pages diaktifkan):** https://lanzmagick.github.io/KirinCode/

## Ciri versi 0.6

- **Code viewer dan editor:** syntax highlighting, nombor baris, code folding, bracket matching, auto-close brackets, word wrap, tab spacing dan tetapan saiz font.
- **Pelbagai bahasa:** 23 mode CodeMirror sumber tempatan dengan loading mengikut keperluan; pilihan tambahan C#, Ruby, Perl, Swift, Dart, Dockerfile, Diff, PowerShell dan TOML. Sokongan Java/Kotlin/C/C++ melalui mode C-like serta JSON/TypeScript melalui JavaScript.
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
- **CodeMirror 5.65.20 (enjin, tema, addon) dan JSZip 3.10.1 kini dihoskan tempatan** di `assets/vendor/`. Tiada lagi pautan CDN untuk menjalankan editor. Mode bahasa juga tempatan, dengan lazy-load berdasarkan bahasa. Namun, offline sepenuhnya pada pelayaran semula belum dijamin tanpa service worker; GitHub Repo Explorer masih memerlukan Internet.
- Simpanan sesi bukan sandaran: **muat turun fail penting**. Data besar mungkin tidak masuk ke sessionStorage.
- Live Preview HTML menyekat **JavaScript, borang, rangka bersarang, sambungan rangkaian JavaScript dan aset selain gambar HTTPS/data serta gaya inline**. Ini untuk keselamatan; bukan pelayar penuh atau laman web dinamik.
- Preview Markdown menyokong tajuk, teks tebal/condong, pautan selamat, gambar HTTPS, senarai, checklist, jadual, petikan dan blok kod. Ia belum menyokong seluruh spesifikasi CommonMark/GFM.
- Live Preview dihadkan kepada **200,000 aksara setiap fail** untuk mengelakkan pembekuan pelayar Android. Kod yang lebih besar masih boleh diedit tanpa preview.
- Compare Code dihadkan kepada **1,200 baris setiap fail**; perbandingan baris sahaja, bukan diff perkataan atau Git commit.

## Vendor tempatan — Patch 0.6

Semua dependensi yang digunakan pada `index.html` kini datang dari fail di repo sendiri:

- `assets/vendor/codemirror/5.65.20/` — CodeMirror core JS/CSS, tema `material-darker` dan `eclipse`, serta addon match/close brackets, active line, fold dan search cursor.
- `assets/vendor/jszip/3.10.1/` — JSZip bagi import/eksport ZIP.
- `assets/vendor/codemirror/LICENSE.md` — lesen upstream MIT CodeMirror.
- `assets/vendor/jszip/LICENSE.markdown` — pilihan lesen upstream MIT atau GPLv3 untuk JSZip.

**Keupayaan offline:** semua fail statik aplikasi kini berasal dari GitHub Pages sendiri; selepas fail dimuat, browser boleh menggunakan cache HTTP yang sedia ada. Tetapi ini **belum PWA offline penuh** — Chrome mungkin tidak boleh membuka semula halaman dari awal tanpa sambungan sekiranya cache dibuang. Service worker yang mengawal seluruh laman GitHub Pages lazimnya memerlukan `sw.js` pada root, jadi ia belum ditambah demi mengekalkan syarat root hanya HTML dan Markdown.

Ujian `node scripts/test-vendor.mjs` memeriksa fail vendor, lesen dan fungsi ZIP round-trip.

## Mode bahasa tempatan

Pilih **Auto Detect** supaya extension fail memilih script tempatan secara automatik, atau tukar bahasa secara manual di status bar. Fail bahasa berada dalam subfolder `languages/` dan dimuat secara lazy-load; perubahan bahasa semasa fail masih dimuat tidak akan mengubah tab lain. XML, CSS dan JavaScript akan dimuat dahulu sebagai dependensi HTML; HTML dan C-like pula menjadi dependensi PHP. Rust dan Dockerfile menggunakan helper simple mode.

**Nota lesen:** CodeMirror 5.65.20 adalah projek MIT berasingan; baca `languages/CODEMIRROR-LICENSE.md`. Mode bahasa lain yang belum tersedia akan kekal dalam Plain Text, tanpa mengambil skrip luar.

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

Semua fail highlighting bahasa berada dalam folder **languages/** dan dimuat hanya apabila diperlukan. Fail sumber CodeMirror 5.65.20 dikekalkan dengan lesen MIT asal. CodeMirror core, gaya UI, addon dan JSZip kini disimpan dalam `assets/vendor/`.

```text
KirinCode/
├── index.html
├── README.md
├── LICENSE.md
├── assets/
│   ├── vendor/ (CodeMirror 5.65.20, JSZip 3.10.1)
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
│   ├── loader.js
│   ├── sourcepawn.js
│   ├── valve-keyvalues.js
│   ├── _shared/ (meta.js, simple.js)
│   ├── html/, css/, javascript/, php/, python/, ...
│   ├── clike/, sql/, markdown/, yaml/, lua/, rust/, ...
│   └── CODEMIRROR-LICENSE.md
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
- `languages/catalog.js` — pengesanan format dan 33 pilihan bahasa (termasuk Auto Detect dan Plain Text)
- `languages/loader.js` — memuatkan mode dan dependensi dari folder tempatan; tiada URL CDN untuk highlighting
- `languages/<mode>/` — salinan source CodeMirror 5.65.20 yang berkaitan
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
- [x] 23 mode bahasa tempatan dan loader dependensi berperingkat
- [x] Self-host CodeMirror core, addon editor dan JSZip (tiada CDN)
- [ ] PWA offline penuh dengan service worker (memerlukan pengecualian fail `sw.js` di root)
- [x] Live Preview HTML/Markdown menggunakan iframe sandbox dan CSP terhad
- [x] Compare Code dua tab dengan diff baris responsif
- [ ] Live Preview Markdown berasaskan renderer lengkap CommonMark/GFM dan ujian pelayar automatik
- [ ] Offline PWA dan pilihan backup draf
- [ ] Penambahbaikan aksesibiliti, ujian E2E dan penskalaan fail besar

## Lesen

KirinCode diedarkan di bawah **[MIT License](LICENSE.md)**. Pengguna dibenarkan menggunakan, mengubah, mengedarkan dan mengkomersialkan kod projek dengan mengekalkan notis hak cipta serta lesen asal.

**Copyright © 2026 LanzMagick.**

Pustaka pihak ketiga seperti CodeMirror dan JSZip mempunyai lesen masing-masing; lesen KirinCode tidak menggantikan syarat lesen pustaka tersebut.

## Kredit

CodeMirror 5 (MIT), JSZip (MIT atau GPLv3 — pengguna pilih). KirinCode dibangunkan sebagai projek web statik. Semakan GitHub Actions menggunakan Node.js (tanpa pemasangan dependensi).
