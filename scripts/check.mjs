import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function get(path) {
  assert.ok(existsSync(path), "Missing asset: " + path);
  return readFileSync(path, "utf8");
}
const html = get("index.html");
const scripts = ["app.js", "repo-explorer.js"];
for (const name of scripts) {
  const source = get(name);
  assert.doesNotThrow(() => new Function(source), "JavaScript syntax error in " + name);
}
for (const name of ["style.css", "repo.css", "icon.svg"]) get(name);

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, "Duplicate HTML IDs");
const idSet = new Set(ids);

for (const name of scripts) {
  const source = get(name);
  for (const match of source.matchAll(/\$\("([^"]+)"\)/g)) {
    assert.ok(idSet.has(match[1]), name + " refers to missing #" + match[1]);
  }
}

assert.ok(html.indexOf('src="app.js"') > -1, "Missing editor script");
assert.ok(html.indexOf('src="repo-explorer.js"') > html.indexOf('src="app.js"'),
  "Repo explorer must load after app.js");
assert.match(html, /rel="stylesheet" href="repo\.css"/, "Missing explorer styles");
assert.match(html, /id="repo-dialog"/, "Missing repository dialog");

const languageSelect = html.match(/<select id="language-select"[\s\S]*?<\/select>/);
assert.ok(languageSelect, "Missing manual language selector");
const choices = new Set([...languageSelect[0].matchAll(/<option value="([^"]+)"/g)].map(match => match[1]));
const app = get("app.js");
const languageSource = app.match(/const LANGUAGES = \{([\s\S]*?)\n\};/);
assert.ok(languageSource, "Missing language definitions");
for (const match of languageSource[1].matchAll(/^\s+([a-z]+):/gm)) {
  assert.ok(choices.has(match[1]), "Missing language select option " + match[1]);
}
assert.ok(choices.size >= 20, "Expected a rich language selector");

console.log("KirinCode validation passed: scripts, referenced IDs, assets, and languages.");
