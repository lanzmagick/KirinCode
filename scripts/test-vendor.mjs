/* KirinCode vendor verification — all editor assets must work without a CDN. */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const cmRoot = "assets/vendor/codemirror/5.65.20/";
const cmScripts = [
  "codemirror.min.js",
  "addon/edit/matchbrackets.min.js",
  "addon/edit/closebrackets.min.js",
  "addon/selection/active-line.min.js",
  "addon/fold/foldcode.min.js",
  "addon/fold/foldgutter.min.js",
  "addon/fold/brace-fold.min.js",
  "addon/fold/indent-fold.min.js",
  "addon/search/searchcursor.min.js"
];
const cmStyles = [
  "codemirror.min.css",
  "theme/material-darker.min.css",
  "theme/eclipse.min.css",
  "addon/fold/foldgutter.min.css"
];
const html = readFileSync("index.html", "utf8");
const startupAssets = cmScripts.concat(cmStyles).map(path => cmRoot + path);
startupAssets.push("assets/vendor/jszip/3.10.1/jszip.min.js");
for (const path of startupAssets) {
  assert.ok(existsSync(path), "Missing vendor file " + path);
  assert.ok(html.includes('"' + path + '"'), "Missing script/style reference " + path);
  assert.ok(readFileSync(path).length > 50, "Empty vendor file " + path);
}
for (const path of cmScripts.concat(["assets/vendor/jszip/3.10.1/jszip.min.js"])) {
  const file = path.startsWith("assets/") ? path : cmRoot + path;
  assert.doesNotThrow(() => new Function(readFileSync(file, "utf8")), "Bad vendor JavaScript " + file);
}
assert.doesNotMatch(html, /(?:src|href)="https?:\/\//, "External runtime dependency remains");
const coreIndex = html.indexOf('src="' + cmRoot + 'codemirror.min.js"');
const addons = cmScripts.filter(x => x !== "codemirror.min.js");
for (const addon of addons)
  assert.ok(html.indexOf('src="' + cmRoot + addon + '"') > coreIndex, "CodeMirror addon loaded before core");
assert.ok(html.indexOf("assets/vendor/jszip/3.10.1/jszip.min.js") < html.indexOf('src="assets/js/app.js"'));
assert.match(readFileSync("assets/vendor/codemirror/LICENSE.md", "utf8"), /MIT License/);
assert.match(readFileSync("assets/vendor/jszip/LICENSE.markdown", "utf8"), /JSZip is dual licensed/);

// Real archive round-trip to check the vendored JSZip build, not only syntax.
const require = createRequire(import.meta.url);
const JSZip = require("../assets/vendor/jszip/3.10.1/jszip.min.js");
const created = new JSZip();
created.file("test/readme.txt", "KirinCode offline vendor ZIP");
const bytes = await created.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
const restored = await JSZip.loadAsync(bytes);
assert.equal(await restored.file("test/readme.txt").async("string"), "KirinCode offline vendor ZIP");
console.log("Vendored CodeMirror and JSZip assets verified; ZIP round-trip passed.");
