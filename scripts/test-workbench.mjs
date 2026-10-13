/* KirinCode workbench tests — built-in Node assertions, no dependencies. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const window = {};
const source = readFileSync("assets/js/workbench-core.js", "utf8");
new Function("window", source)(window);
const core = window.KirinCodeWorkbenchCore;
assert.ok(core, "Workbench API missing");

const sample = "# KirinCode\n\n**Strong** and *emphasis*.\n\n- [x] Completed\n\n~~~js\nconst x = '<b>';\n~~~";
const rendered = core.renderMarkdown(sample);
assert.match(rendered, /<h1>KirinCode<\/h1>/);
assert.match(rendered, /<strong>Strong<\/strong>/);
assert.match(rendered, /<em>emphasis<\/em>/);
assert.match(rendered, /disabled checked/);
assert.match(rendered, /&lt;b&gt;/);
assert.match(core.renderMarkdown("|Name|Code|\n|---|---|\n|A|B|"), /<table>/);
assert.match(core.renderMarkdown("[OK](https://example.org)"), /href="https:\/\/example.org"/);
assert.doesNotMatch(core.renderMarkdown("[bad](javascript:alert(1))"), /href="javascript:/i);
assert.doesNotMatch(core.renderMarkdown("<script>alert(1)</script>"), /<script>/i);
assert.doesNotMatch(core.renderMarkdown("![bad](javascript:alert(1))"), /<img/);

// Deep blockquotes must not overflow the browser stack.
assert.ok(core.renderMarkdown(">".repeat(3000) + " hi").length > 0);
assert.match(readFileSync("assets/js/workbench.js", "utf8"), /200000/);

const htmlDoc = core.documentFor("<html><head></head><body><script>BAD()</script></body></html>", "html");
const mdDoc = core.documentFor(sample, "markdown");
for (const html of [htmlDoc, mdDoc]) {
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /script-src &#39;none&#39;/);
  assert.match(html, /default-src &#39;none&#39;/);
}
assert.match(mdDoc, /<h1>KirinCode<\/h1>/);

const modified = core.compareLines("a\nb\nc", "a\nx\nc");
assert.equal(modified.modified, 1);
assert.equal(modified.unchanged, 2);
assert.equal(modified.rows[1].leftText, "b");
assert.equal(modified.rows[1].rightText, "x");
assert.equal(core.compareLines("a\nc", "a\nb\nc").added, 1);
assert.equal(core.compareLines("a\nb\nc", "a\nc").removed, 1);
assert.equal(core.compareLines("same", "same").unchanged, 1);
assert.equal(core.compareLines("", "").modified, 0);
assert.match(core.compareLines("x\n".repeat(1300), "x").error, /1200/);

const html = readFileSync("index.html", "utf8");
assert.match(html, /<iframe\b[^>]*\bsandbox=""/);
assert.match(html, /id="preview-btn"/);
assert.match(html, /id="compare-btn"/);
for (const path of ["assets/js/workbench-core.js","assets/js/workbench.js","assets/css/workbench.css"]) {
  assert.ok(html.includes('"' + path + '"'), "Missing new asset reference: " + path);
}
const order = ["assets/js/workbench-core.js","assets/js/app.js","assets/js/workbench.js"];
for(let i=1;i<order.length;i++)
  assert.ok(html.indexOf(order[i]) > html.indexOf(order[i-1]), "Workbench script order is incorrect");
assert.match(readFileSync("assets/js/app.js", "utf8"), /getFiles\(\)/);
assert.match(readFileSync("assets/js/app.js", "utf8"), /subscribe\(listener\)/);
console.log("KirinCode 0.4 workbench preview and comparison tests passed.");
