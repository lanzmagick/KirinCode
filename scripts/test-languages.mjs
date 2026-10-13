/* Tests for local CodeMirror language scripts and lazy dependency loading. */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const base = "https://example.test/KirinCode/languages/";
const observed = [];
const CM = { modes: Object.create(null) };
const browser = { CodeMirror: CM };
const doc = {
  currentScript: { src: base + "loader.js" },
  createElement(name) { assert.equal(name, "script"); return { async: false }; },
  head: {
    appendChild(script) {
      const src = new URL(script.src);
      assert.equal(src.origin, "https://example.test", "No external script URLs");
      const relative = src.pathname.split("/languages/")[1];
      assert.ok(relative && !relative.includes(".."), "Safe local script path");
      assert.ok(existsSync("languages/" + relative), "Mode missing: " + relative);
      const filename = relative.split("/").pop().replace(/\.js$/, "");
      queueMicrotask(() => {
        observed.push(filename);
        if (filename === "simple") CM.defineSimpleMode = function () {};
        else CM.modes[filename] = function () {};
        script.onload();
      });
    }
  }
};
new Function("window", "document", "URL", readFileSync("languages/loader.js", "utf8"))(browser, doc, URL);
const loader = browser.KirinCodeModeLoader;
const manifest = loader.entries();
assert.equal(manifest.length, 24, "Expected 23 local language modes and one helper");
const modeNames = new Set(manifest.map(x => x.name));
for (const entry of manifest) {
  assert.ok(existsSync("languages/" + entry.path), entry.path + " not vendored");
  assert.doesNotThrow(() => new Function(readFileSync("languages/" + entry.path, "utf8")), "Bad JS " + entry.path);
  for (const dependency of entry.dependencies)
    assert.ok(modeNames.has(dependency), "Missing dependency " + dependency);
}
function visit(name, stack = new Set()) {
  assert.ok(!stack.has(name), "Cyclic dependencies: " + name);
  stack.add(name);
  for (const dep of manifest.find(e=>e.name===name).dependencies) visit(dep, new Set(stack));
}
for (const name of modeNames) visit(name);
await loader.load("php");
assert.ok(CM.modes.php);
assert.ok(CM.modes.htmlmixed);
assert.ok(observed.indexOf("xml") < observed.indexOf("htmlmixed"));
assert.ok(observed.indexOf("css") < observed.indexOf("htmlmixed"));
assert.ok(observed.indexOf("javascript") < observed.indexOf("htmlmixed"));
assert.ok(observed.indexOf("htmlmixed") < observed.indexOf("php"));
assert.ok(observed.indexOf("clike") < observed.indexOf("php"));
await Promise.all([loader.load("rust"), loader.load("dockerfile")]);
assert.equal(observed.filter(x=>x==="simple").length, 1, "Shared simple addon should load once");
await loader.load("toml");
assert.ok(CM.modes.toml);
await assert.rejects(loader.load("unbundled-mode"), /No bundled/);
assert.ok(existsSync("languages/CODEMIRROR-LICENSE.md"), "Upstream license missing");

const html = readFileSync("index.html", "utf8");
assert.ok(html.includes('src="languages/_shared/meta.js"'));
assert.ok(html.includes('src="languages/loader.js"'));
assert.ok(html.indexOf('src="languages/loader.js"') < html.indexOf('src="languages/catalog.js"'));
assert.doesNotMatch(html, /cdnjs\.cloudflare\.com[^"']*\/mode\//, "External mode CDN should not be used");
assert.doesNotMatch(readFileSync("languages/catalog.js","utf8"), /modeURL\s*=\s*["']https?:/);
const languageRegistry = readFileSync("languages/catalog.js", "utf8");
assert.match(languageRegistry, /language|LANGUAGES/);
assert.match(languageRegistry, /text\/x-sourcepawn/);
assert.match(readFileSync("assets/js/app.js","utf8"), /loader\.load\(language\.mode\)/);
console.log("Local language modes: 23, helper dependencies and offline paths verified.");
