# KirinCode

**Multi-Language Code Viewer & Editor** — editor fail kod dalam pelayar, diinspirasikan oleh Notepad++ dan disediakan untuk GitHub Pages.

**Laman (selepas GitHub Pages diaktifkan):** https://lanzmagick.github.io/KirinCode/

## Ciri versi 0.2

- **Code viewer dan editor:** syntax highlighting, nombor baris, code folding, bracket matching, auto-close brackets, word wrap, tab spacing dan tetapan saiz font.
- **Pelbagai bahasa:** CodeMirror memuatkan mode mengikut extension secara automatik. HTML, CSS, JS, JSON, XML, Markdown, Python, C/C++, Java, PHP, SQL dan banyak lagi (bergantung pada mode yang tersedia).
- **Format Left 4 Dead 2 / SourceMod:** .sp, .inc (highlight gaya C), .cfg (properties), .nut (gaya JS), .vdf dan .vmt (mode Valve KeyValues asas).
- **Fallback Plain Text:** semua fail teks yang tidak dikenali boleh dibuka tanpa syntax highlighting.
- **Multiple tabs:** buka/edit banyak fail, serta pengesanan perubahan belum disimpan.
- **Find / Replace:** cari, kes sensitif, regex, ganti satu atau semua.
- **Fail tempatan:** buka banyak fail, drag & drop dan pilih folder jika disokong oleh pelayar.
- **ZIP:** baca fail teks daripada ZIP dan eksport semua tab sebagai satu ZIP.
- **GitHub File:** baca fail awam menggunakan pautan fail github.com atau raw.githubusercontent.com.
- **GitHub Repository Explorer:** masukkan owner/repo atau URL repo awam, buka folder, cari fail dan buka kod daripada GitHub terus ke tab tempatan (tanpa token).
- **Manual language selector:** pilih salah satu daripada 24 mod (termasuk Auto Detect), berguna apabila extension tidak dikenali; pilihan disimpan bagi sesi tab.
- **Responsif:** sidebar mudah alih, tema dark/light dan kawalan untuk Android atau desktop.
- **Pemulihan sesi:** draf kecil disimpan dalam sessionStorage untuk tab pelayar yang sama; tetapan UI menggunakan localStorage.

### Had semasa

- Tiada server/backend: fail diproses dalam pelayar. Tidak ada upload fail secara automatik.
- Butang **Save** memuat turun salinan UTF-8 ke peranti; **bukan** commit atau menulis kembali ke GitHub.
- ZIP dihadkan kepada **15 MB** dan **120 entri**; fail teks tunggal maksimum **4 MB** demi prestasi.
- Fail binari, media, fail tersulit dan arkib selain ZIP belum disokong.
- Bahasa yang tiada mode CodeMirror dipaparkan sebagai teks biasa. Sesetengah extension khas menggunakan highlighting anggaran, bukan parser khusus.
- GitHub Explorer hanya membaca **repositori awam** pada **default branch**. GitHub API boleh menghadkan permintaan awam tanpa token, dan senarai repo yang terlalu besar mungkin dipotong.
- Fungsi GitHub File asal masih untuk satu URL fail pada satu masa; nama branch yang mengandungi slash mungkin memerlukan URL raw yang tepat.
- CodeMirror, JSZip dan mode bahasa dimuatkan melalui CDN; Internet diperlukan untuk editor penuh. CodeMirror 5 adalah pustaka lama; migrasi CodeMirror 6 boleh dipertimbangkan kemudian.
- Simpanan sesi bukan sandaran: **muat turun fail penting**. Data besar mungkin tidak masuk ke sessionStorage.

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

- index.html — antaramuka GitHub Pages dan CDN
- style.css — tema dan susun atur desktop/mobile
- app.js — editor, fail, ZIP, carian, session dan language override
- repo-explorer.js — baca GitHub public repo tree dan blob API
- repo.css — gaya dialog Explorer dan language picker
- icon.svg — favicon KirinCode
- scripts/check.mjs — pemeriksaan sintaks dan rujukan UI
- .github/workflows/validate.yml — semakan automatik semasa push/PR

## Roadmap

- [x] Viewer/editor berbilang format
- [x] Responsive Android/desktop
- [x] Multiple tabs, find/replace, ZIP import/export
- [x] Viewer fail GitHub awam
- [x] GitHub repo explorer (folder & tree) untuk repositori awam
- [x] Language picker manual setiap tab
- [ ] Syntax highlighting SourcePawn penuh (parser khusus, bukan C-like)
- [ ] Markdown/HTML preview yang selamat
- [ ] Offline PWA dan pilihan backup draf
- [ ] Penambahbaikan aksesibiliti, ujian E2E dan penskalaan fail besar

## Kredit

CodeMirror 5 (MIT), JSZip (MIT). KirinCode dibangunkan sebagai projek web statik. Semakan GitHub Actions menggunakan Node.js (tanpa pemasangan dependensi).
