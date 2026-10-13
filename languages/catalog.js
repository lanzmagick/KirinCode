/* KirinCode language registry: all custom language mappings in one place. */
(function(){
"use strict";
if(!window.CodeMirror)throw new Error("CodeMirror is required");
const CodeMirror=window.CodeMirror;
CodeMirror.modeURL="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.20/mode/%N/%N.min.js";
function basename(path){return String(path||"untitled.txt").replace(/\\/g,"/").split("/").pop()||"untitled.txt";}
function extension(path){return basename(path).split(".").pop().toLowerCase();}
function lang(path) {
  const special = {
    sp:["SourcePawn","text/x-csrc","clike"], inc:["SourcePawn","text/x-csrc","clike"],
    cfg:["Config","text/x-properties","properties"],
    vdf:["Valve VDF","valve-kv",null],vmt:["Valve VMT","valve-kv",null],
    nut:["Squirrel","text/javascript","javascript"],
    smali:["Smali (text)","text/plain",null],
    log:["Log","text/plain",null]
  };
  if (special[extension(path)]) {
    const a=special[extension(path)]; return {name:a[0],mime:a[1],mode:a[2]};
  }
  const a = CodeMirror.findModeByFileName(basename(path)) || CodeMirror.findModeByExtension(extension(path));
  return a ? {name:a.name,mime:a.mime,mode:a.mode} : {name:"Plain Text",mime:"text/plain",mode:null};
}
const LANGUAGES = {
  auto:null,
  plain:{name:"Plain Text",mime:"text/plain",mode:null},
  sourcepawn:{name:"SourcePawn",mime:"text/x-csrc",mode:"clike"},
  c:{name:"C",mime:"text/x-csrc",mode:"clike"},
  cpp:{name:"C++",mime:"text/x-c++src",mode:"clike"},
  html:{name:"HTML",mime:"text/html",mode:"htmlmixed"},
  css:{name:"CSS",mime:"text/css",mode:"css"},
  javascript:{name:"JavaScript",mime:"text/javascript",mode:"javascript"},
  typescript:{name:"TypeScript",mime:"application/typescript",mode:"javascript"},
  json:{name:"JSON",mime:"application/json",mode:"javascript"},
  python:{name:"Python",mime:"text/x-python",mode:"python"},
  java:{name:"Java",mime:"text/x-java",mode:"clike"},
  kotlin:{name:"Kotlin",mime:"text/x-kotlin",mode:"clike"},
  php:{name:"PHP",mime:"application/x-httpd-php",mode:"php"},
  sql:{name:"SQL",mime:"text/x-sql",mode:"sql"},
  xml:{name:"XML",mime:"application/xml",mode:"xml"},
  markdown:{name:"Markdown",mime:"text/x-markdown",mode:"markdown"},
  yaml:{name:"YAML",mime:"text/x-yaml",mode:"yaml"},
  shell:{name:"Shell",mime:"text/x-sh",mode:"shell"},
  lua:{name:"Lua",mime:"text/x-lua",mode:"lua"},
  rust:{name:"Rust",mime:"text/x-rustsrc",mode:"rust"},
  go:{name:"Go",mime:"text/x-go",mode:"go"},
  config:{name:"Config",mime:"text/x-properties",mode:"properties"},
  valve:{name:"Valve KeyValues",mime:"valve-kv",mode:null}
};
window.KirinCodeLanguages=Object.freeze({
  detect:lang,
  has:(key)=>Object.prototype.hasOwnProperty.call(LANGUAGES,key),
  resolve:(path,override)=>(override && LANGUAGES[override])||lang(path),
  choices:()=>Object.keys(LANGUAGES)
});
})();
