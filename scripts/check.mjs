import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function get(path) {
  assert.ok(existsSync(path), "Missing asset: " + path);
  return readFileSync(path, "utf8");
}
const html = get("index.html");
// Validate startup assets are vendored and accessible on GitHub Pages.
const vendorNames = ["codemirror.min.js","codemirror.min.css","theme/material-darker.min.css","theme/eclipse.min.css","addon/fold/foldgutter.min.css","addon/edit/matchbrackets.min.js","addon/edit/closebrackets.min.js","addon/selection/active-line.min.js","addon/fold/foldcode.min.js","addon/fold/foldgutter.min.js","addon/fold/brace-fold.min.js","addon/fold/indent-fold.min.js","addon/search/searchcursor.min.js"];
for (const name of vendorNames) {
  const path = "assets/vendor/codemirror/5.65.20/" + name;
  get(path);
  assert.ok(html.includes('"' + path + '"'), "Missing vendored asset: " + path);
}
const jszipVendor = "assets/vendor/jszip/3.10.1/jszip.min.js";
get(jszipVendor);
assert.ok(html.includes('"' + jszipVendor + '"'), "Missing JSZip vendor script");
assert.doesNotMatch(html, /(?:src|href)="https?:\/\//i, "Scripts and stylesheet links must be local");
get("assets/vendor/codemirror/LICENSE.md");
get("assets/vendor/jszip/LICENSE.markdown");
// Files listed in index.html are loaded at startup; lazy-loaded scripts are validated separately.
const sourcePaths = [
  "assets/js/app.js",
  "assets/js/repo-explorer.js",
  "assets/js/workbench-core.js",
  "assets/js/workbench.js",
  "languages/catalog.js",
  "languages/loader.js",
  "languages/_shared/meta.js",
  "languages/_shared/simple.js",
  "languages/sourcepawn.js",
  "languages/valve-keyvalues.js"
];
for (const path of sourcePaths) {
  assert.doesNotThrow(() => new Function(get(path)), "Invalid JavaScript syntax in " + path);
}
for (const path of ["assets/css/style.css", "assets/css/repo.css", "assets/css/workbench.css", "assets/icons/icon.svg"]) get(path);

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, "Duplicate HTML IDs");
const idSet = new Set(ids);
for (const path of sourcePaths) {
  for (const match of get(path).matchAll(/\$\("([^"]+)"\)/g)) {
    assert.ok(idSet.has(match[1]), path + " references missing #" + match[1]);
  }
}

const lazyLoadedPaths = new Set(["languages/_shared/simple.js"]);
for (const path of [...sourcePaths.filter(path => !lazyLoadedPaths.has(path)), "assets/css/style.css", "assets/css/repo.css", "assets/css/workbench.css", "assets/icons/icon.svg"]) {
  assert.ok(html.includes('"' + path + '"'), "Missing startup asset path in HTML: " + path);
}
// A lazily loaded script is expected in the local language loader, NOT as a script tag in index.html.
const modeLoader = get("languages/loader.js");
for (const path of lazyLoadedPaths) {
  assert.ok(modeLoader.includes(path.replace(/^languages\//, "")), "Lazy script not registered: " + path);
}
const dependencyOrder = ["languages/_shared/meta.js", "languages/valve-keyvalues.js", "languages/sourcepawn.js", "languages/loader.js", "languages/catalog.js", "assets/js/workbench-core.js", "assets/js/app.js", "assets/js/workbench.js", "assets/js/repo-explorer.js"];
for (let i = 1; i < dependencyOrder.length; i++) {
  assert.ok(html.indexOf('src="' + dependencyOrder[i] + '"') > html.indexOf('src="' + dependencyOrder[i-1] + '"'), "Script order invalid");
}
const selector = html.match(/<select id="language-select"[\s\S]*?<\/select>/);
assert.ok(selector, "Language picker missing");
const choices = new Set([...selector[0].matchAll(/<option value="([^"]+)"/g)].map(m => m[1]));
const definitions = get("languages/catalog.js").match(/const LANGUAGES = \{([\s\S]*?)\n\};/);
assert.ok(definitions, "Language registry missing");
for (const match of definitions[1].matchAll(/^\s+([a-z]+):/gm)) {
  assert.ok(choices.has(match[1]), "Language option missing: " + match[1]);
}
assert.ok(choices.size >= 20, "Language picker has too few options");
console.log("KirinCode structure, syntax, references and language checks passed.");
