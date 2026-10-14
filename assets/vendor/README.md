# KirinCode — vendor assets

This folder contains pinned third-party build artifacts used by KirinCode and hosted locally on GitHub Pages.

- CodeMirror **5.65.20** core, CSS, themes, addons under `codemirror/5.65.20/`, obtained from the corresponding cdnjs release assets.
- JSZip **3.10.1** under `jszip/3.10.1/`, obtained from the corresponding cdnjs release asset.
- Original license texts are preserved at `codemirror/LICENSE.md` (MIT) and `jszip/LICENSE.markdown` (MIT or GPLv3).

These are third-party dependencies, **not KirinCode-owned source code**. Keep the upstream copyright and license texts when redistributing.

No external CDN requests are needed for syntax highlighting or the editor runtime. GitHub API reads of remote repositories still require connectivity. PWA navigation offline caching has not been enabled.
