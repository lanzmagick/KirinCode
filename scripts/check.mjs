import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function get(path) {
  assert.ok(existsSync(path), "Missing asset: " + path);
  return readFileSync(path, "utf8");
}
const html = get("index.html");
const sourcePaths = [
  "assets/js/app.js",
  "assets/js/repo-explorer.js",
  "assets/js/workbench-core.js",
  "assets/js/workbench.js",
  "languages/catalog.js",
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

for (const path of [...sourcePaths, "assets/css/style.css", "assets/css/repo.css", "assets/css/workbench.css", "assets/icons/icon.svg"]) {
  assert.ok(html.includes('"' + path + '"'), "Missing local path in HTML: " + path);
}
const dependencyOrder = ["languages/valve-keyvalues.js", "languages/sourcepawn.js", "languages/catalog.js", "assets/js/workbench-core.js", "assets/js/app.js", "assets/js/workbench.js", "assets/js/repo-explorer.js"];
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
