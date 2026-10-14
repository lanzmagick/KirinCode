/* KirinCode 0.7 autocomplete regression tests (no DOM or npm needed). */
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";

const browser={};
const code=readFileSync("languages/completions.js","utf8");
new Function("window",code)(browser);
const api=browser.KirinCodeCompletionCore;
assert.ok(api,"Completion API is registered");

const include = [
  "#include <sourcemod>",
  "native bool IsTankAlive(int client);",
  "forward Action OnSpecialSpawn(int entity);",
  "stock void HealPlayer(",
  "  int client, int amount",
  ");",
  "#define KIRIN_LIMIT 200",
  "methodmap MyCustomMethod < Handle {",
  "enum struct CustomData {",
  "  int count;",
  "}",
  "// native bool FakeFromComment();",
  "/* forward void AlsoFake(); */",
  "char message[] = \"native void Pretend();\";"
].join("\n");

const symbols=api.extractIncludeSymbols(include,"custom.inc");
for(const name of ["IsTankAlive","OnSpecialSpawn","HealPlayer","KIRIN_LIMIT","MyCustomMethod","CustomData"])
  assert.ok(symbols.some(x=>x.text===name), "Missing parsed .inc declaration "+name);
for(const name of ["FakeFromComment","AlsoFake","Pretend"])
  assert.ok(!symbols.some(x=>x.text===name), "Comment/string leaked into symbols "+name);
assert.equal(api.language({path:"plugins/boss.sp",override:"auto"}),"sourcepawn");
assert.equal(api.language({path:"include/test.inc",override:"auto"}),"sourcepawn");
assert.equal(api.language({path:"test.sp",override:"javascript"}),"javascript");
assert.equal(api.language({path:"main.py",override:"auto"}),"python");
assert.equal(api.language({path:"Dockerfile",override:"auto"}),"dockerfile");

const files=[
  {id:1,path:"plugin.sp",name:"plugin.sp",override:"auto",content:"native int CurFunc(){return 0;}"},
  {id:2,path:"custom.inc",name:"custom.inc",override:"auto",content:include}
];
const results=api.suggest(files,files[0],"IsTa");
assert.equal(results[0].text,"IsTankAlive");
assert.equal(results[0].origin,"custom.inc");
assert.equal(results[0].kind,"function");
const macros=api.suggest(files,files[0],"KIR");
assert.ok(macros.some(s=>s.text==="KIRIN_LIMIT"&&s.kind==="macro"));
const manual=api.suggest(files,files[0],"");
assert.ok(manual.length>0 && manual.length<=45);
const keywords=api.suggest([], {path:"hello.py",override:"auto",content:""}, "pri");
assert.ok(keywords.some(x=>x.text==="print"));
const tags=api.suggest([], {path:"home.html",override:"auto",content:""}, "but");
assert.ok(tags.some(x=>x.text==="button"));
const local=api.suggest([], {path:"test.js",override:"auto",content:"const specialIdentifier = 2;"}, "spe");
assert.ok(local.some(x=>x.text==="specialIdentifier"));
const ignored=api.suggest([], {path:"test.py",content:""}, "alert(1)");
assert.deepEqual(ignored,[]);
const stripped=api.stripComments("native void Active(); // native void NotActive();");
assert.ok(stripped.includes("Active")&&!stripped.includes("NotActive"));

const html=readFileSync("index.html","utf8");
for(const path of [
  "languages/completions.js","assets/js/autocomplete.js","assets/css/autocomplete.css",
  "assets/vendor/codemirror/5.65.20/addon/hint/show-hint.min.js",
  "assets/vendor/codemirror/5.65.20/addon/hint/show-hint.min.css"
]){
  assert.ok(existsSync(path),"Missing autocomplete asset: "+path);
  assert.ok(html.includes('"'+path+'"'),"Asset omitted from HTML: "+path);
}
assert.ok(html.indexOf('src="languages/completions.js"') < html.indexOf('src="assets/js/autocomplete.js"'));
assert.ok(html.indexOf('src="assets/js/app.js"') < html.indexOf('src="assets/js/autocomplete.js"'));
assert.match(html,/id="suggest-btn"/);
assert.match(html,/id="autocomplete-select"/);
const editor=readFileSync("assets/js/app.js","utf8");
assert.match(editor,/getEditor\(\)/);
assert.match(editor,/getCompletionFiles\(\)/);
const ui=readFileSync("assets/js/autocomplete.js","utf8");
assert.match(ui,/Ctrl-Space/);
assert.match(ui,/inputRead/);
assert.match(ui,/completeSingle:false/);
console.log("KirinCode autocomplete tests passed: include symbols, dictionaries, UI integration.");
