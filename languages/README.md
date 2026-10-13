# KirinCode — Mode Bahasa Tempatan

Mode syntax highlighting yang digunakan oleh KirinCode diletakkan di folder ini, dan dipanggil melalui `loader.js` hanya apabila diperlukan.

- `loader.js`: peta nama mode, lokasi fail dan dependensi (dilarang mengambil mode luar).
- `catalog.js`: nama bahasa, pilihan Auto Detect dan pemetaan extension.
- `sourcepawn.js`: tokenizer SourcePawn yang dibuat untuk KirinCode.
- `valve-keyvalues.js`: tokenizer VDF/VMT khusus KirinCode.
- `_shared/meta.js`: metadata extension dan MIME CodeMirror 5.
- `_shared/simple.js`: bantuan untuk mode Rust dan Dockerfile.
- `xml/`, `css/`, `javascript/`, `html/`, `clike/`, `config/`, `python/`, `php/`, `sql/`, `markdown/`, `yaml/`, `shell/`, `lua/`, `go/`, `rust/`, `ruby/`, `perl/`, `swift/`, `dart/`, `diff/`, `dockerfile/`, `powershell/`, `toml/`: 23 mode yang diambil daripada sumber CodeMirror 5.65.20.

## Penting

Fail pihak ketiga disalin tanpa membuang header lesen asal, dari repositori `codemirror/codemirror5` pada tag `5.65.20`.

**Lesen:** rujuk `CODEMIRROR-LICENSE.md` (MIT). Pustaka CodeMirror core, addon dan JSZip **belum** dipindahkan ke dalam repo; hanya mode syntax highlighting disediakan secara tempatan.

Untuk menambah bahasa baharu: letak fail `.js` di folder bahasanya, daftar `path` dan `deps` pada `loader.js`, tambah pilihan pada `catalog.js` / `index.html`, dan kemas kini ujian `scripts/test-languages.mjs`.
