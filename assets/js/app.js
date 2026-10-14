/* KirinCode: all editing happens locally in the browser. */
(function () {
"use strict";
const $ = (id) => document.getElementById(id);
const FILE_MAX = 4 * 1024 * 1024;
const ZIP_MAX = 15 * 1024 * 1024;
const tabs = [];
let languageLoadTicket = 0;
const listeners = new Set();
function emit(kind){for(const callback of listeners){try{callback(kind);}catch(error){console.error("KirinCode subscriber:",error);}}}
let current = null, seq = 0, quiet = false, toastTimeout, autosaveTimeout, dragLevel = 0;
let draftsReady = false, draftTimer = null, draftWrites = Promise.resolve();
let config = {theme:"dark",wrap:false,font:14,tab:2};
try { Object.assign(config, JSON.parse(localStorage.getItem("kirincode-settings-v1") || "{}")); } catch(e) {}
function say(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $("toast").classList.remove("show"), 3500);
}
if (!window.CodeMirror) {
  say("CodeMirror gagal dimuat; semak sambungan internet.");
  return;
}
const cm = CodeMirror.fromTextArea($("code-input"), {
  mode:"text/plain", theme:"material-darker", lineNumbers:true,
  styleActiveLine:true, matchBrackets:true, autoCloseBrackets:true,
  foldGutter:true, gutters:["CodeMirror-linenumbers","CodeMirror-foldgutter"],
  indentUnit:2, tabSize:2, lineWrapping:false,
  extraKeys:{
    "Ctrl-S":downloadCurrent,"Cmd-S":downloadCurrent,
    "Ctrl-Shift-S":downloadZip,"Cmd-Shift-S":downloadZip,
    "Ctrl-N":makeNew,"Cmd-N":makeNew,
    "Ctrl-O":chooseFiles,"Cmd-O":chooseFiles,
    "Ctrl-F":()=>showFind(true,false),"Cmd-F":()=>showFind(true,false),
    "Ctrl-H":()=>showFind(true,true),
    "Ctrl-W":()=>{if(current) closeTab(current.id);},
    "Ctrl-Tab":()=>switchNext(1),"Ctrl-Shift-Tab":()=>switchNext(-1)
  }
});
const editorElement = document.querySelector(".CodeMirror");
function normPath(path) {
  return String(path || "untitled.txt").replace(/\\/g,"/").split("/").filter(p=>p && p!=="." && p!=="..").join("/").slice(0,240) || "untitled.txt";
}
function basename(path) { return normPath(path).split("/").pop(); }
function extension(path) { return basename(path).split(".").pop().toLowerCase(); }
function applyLanguage(file) {
  const language=window.KirinCodeLanguages.resolve(file.path,file.override);
  const ticket=++languageLoadTicket;
  const loader=window.KirinCodeModeLoader;
  const ready=!language.mode || loader.installed(language.mode);
  cm.setOption("mode",ready?language.mime:"text/plain");
  $("status-lang").textContent=language.name+(ready?"":" (loading...)");
  $("language-select").value=file.override || "auto";
  if (!ready) loader.load(language.mode).then(()=>{
    if (ticket!==languageLoadTicket || !current || current.id!==file.id) return;
    cm.setOption("mode",language.mime);
    $("status-lang").textContent=language.name;
    cm.refresh();
  }).catch((error)=>{
    if (ticket!==languageLoadTicket || !current || current.id!==file.id) return;
    $("status-lang").textContent="Plain Text";
    say("Language mode: "+error.message);
  });
}
function isDirty(file) {return file.doc.getValue()!==file.saved;}
function el(tag,cls,value) {
  const n=document.createElement(tag);
  if(cls)n.className=cls;
  if(value!==undefined)n.textContent=value;
  return n;
}
function render() {
  const strip=$("tabs"), list=$("file-list");
  strip.replaceChildren();list.replaceChildren();
  const filter=$("search-files").value.toLowerCase().trim();
  let matches=0;
  for(const file of tabs) {
    const selected=!!current && file.id===current.id;
    const tab=el("button","tab"+(selected?" active":""));
    tab.type="button";tab.title=file.path;tab.setAttribute("role","tab");
    tab.setAttribute("aria-selected",String(selected));
    tab.append(el("span","tab-title",file.name));
    if(isDirty(file))tab.append(el("span","dirty-dot"));
    const close=el("span","tab-close","×");
    close.title="Tutup "+file.name;
    close.addEventListener("click",e=>{e.stopPropagation();closeTab(file.id);});
    tab.append(close);
    tab.addEventListener("click",()=>activate(file.id));strip.append(tab);
    if(!file.path.toLowerCase().includes(filter))continue;
    matches++;
    const item=el("button","file-item"+(selected?" active":""));
    item.type="button";item.title=file.path;
    item.append(el("span","file-mark",extension(file.name).slice(0,4)));
    const description=el("span");
    description.style.flex="1";description.style.minWidth="0";
    description.append(el("span","file-name",file.name),el("span","file-path",file.path));
    item.append(description);
    if(isDirty(file))item.append(el("span","file-dot","●"));
    item.addEventListener("click",()=>activate(file.id));
    list.append(item);
  }
  if(!matches)list.append(el("div","empty-state",tabs.length?"Tiada fail ditemui.":"Buka fail atau cipta fail baharu."));
  $("status-count").textContent=tabs.length+" files";
  $("save-btn").disabled=!current;
  $("zip-btn").disabled=tabs.length===0;
}
function position() {
  const p=cm.getCursor();
  $("status-pos").textContent="Ln "+(p.line+1)+", Col "+(p.ch+1);
  $("status-length").textContent=cm.getValue().length.toLocaleString()+" aksara";
  $("status-file").textContent=current?current.path:"Tiada fail";
}
function draftStatus(message) {
  const node=$("backup-status");
  if(node)node.textContent=message;
}
function snapshotWorkspace(){
  return {active:current?current.id:null,files:tabs.map(file=>({
    id:file.id,path:file.path,content:file.doc.getValue(),saved:file.saved,override:file.override
  }))};
}
function persistDraft(){
  if(!draftsReady||quiet)return;
  clearTimeout(draftTimer);
  const snapshot=snapshotWorkspace();
  // Serial writes keep the most recent edit from being replaced by a slower older save.
  draftWrites=draftWrites.catch(()=>{}).then(()=>window.KirinCodeDrafts.save(snapshot))
    .then(()=>{draftStatus("Draf disimpan dalam peranti · "+new Date().toLocaleTimeString("ms-MY",{hour:"2-digit",minute:"2-digit"}));},
      error=>{draftStatus("Backup gagal: "+error.message+". Eksport backup secara manual.");});
}
function scheduleDraft(){
  if(!draftsReady||quiet)return;
  clearTimeout(draftTimer);
  draftStatus("Menyimpan draf...");
  draftTimer=setTimeout(persistDraft,900);
}

function saveSession() {
  if(quiet)return;
  scheduleDraft();
  clearTimeout(autosaveTimeout);
  autosaveTimeout=setTimeout(()=>{
    try {
      const data={active:current?current.id:null,files:tabs.filter(f=>f.doc.getValue().length<=350000).slice(0,16).map(f=>({id:f.id,path:f.path,content:f.doc.getValue(),saved:f.saved,override:f.override}))};
      const serialized=JSON.stringify(data);
      if(serialized.length<1400000)sessionStorage.setItem("kirincode-session-v1",serialized);
    }catch(e){}
  },650);
}
function activate(id) {
  const file=tabs.find(f=>f.id===id);
  if(!file||current&&current.id===id)return;
  current=file;
  cm.swapDoc(file.doc);cm.setOption("readOnly",false);
  applyLanguage(file);render();position();hideSidebar();
  requestAnimationFrame(()=>cm.refresh());
  emit("activate");
}
function add(path,content,selected=true,saved) {
  path=normPath(path);
  const file={id:++seq,path:path,name:basename(path),doc:new CodeMirror.Doc(String(content),"text/plain"),saved:saved===undefined?String(content):String(saved),override:"auto"};
  tabs.push(file);
  if(selected)activate(file.id);else render();
  saveSession();emit("files");return file;
}
function closeTab(id) {
  const i=tabs.findIndex(f=>f.id===id);
  if(i<0)return;
  if(isDirty(tabs[i])&&!confirm("Perubahan "+tabs[i].name+" belum dimuat turun. Tutup juga?"))return;
  tabs.splice(i,1);
  if(current&&current.id===id) {
    current=null;
    if(tabs.length)activate(tabs[Math.max(0,i-1)].id);
    else {
      cm.swapDoc(new CodeMirror.Doc("","text/plain"));
      cm.setOption("readOnly",true);
      $("status-lang").textContent="Plain Text";
    }
  }
  render();position();saveSession();emit("files");
}
function switchNext(offset) {
  if(!current||tabs.length<2)return;
  const index=tabs.findIndex(t=>t.id===current.id);
  activate(tabs[(index+offset+tabs.length)%tabs.length].id);
}
function makeNew() {
  const name=prompt("Nama fail baharu:","untitled.txt");
  if(name===null)return;
  add(name.trim(),"");cm.focus();
}
function chooseFiles() {$("file-input").click();}
function download(blob,name) {
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function downloadCurrent() {
  if(!current)return;
  const value=current.doc.getValue();
  download(new Blob([value],{type:"text/plain;charset=utf-8"}),current.name);
  current.saved=value;render();saveSession();say("Fail dimuat turun: "+current.name);
}
async function downloadZip() {
  if(!tabs.length)return;
  if(!window.JSZip){say("JSZip tidak dapat dimuat.");return;}
  const zip=new JSZip(),seen=new Set();
  for(const file of tabs) {
    let path=normPath(file.path);
    if(seen.has(path))path=file.id+"-"+basename(path);
    seen.add(path);zip.file(path,file.doc.getValue());
  }
  try {
    download(await zip.generateAsync({type:"blob",compression:"DEFLATE"}),"KirinCode-files.zip");
    say("ZIP mengandungi "+tabs.length+" fail.");
  }catch(e){say("Gagal eksport ZIP: "+e.message);}
}
function decode(bytes) {
  if(bytes.length>1&&bytes[0]===255&&bytes[1]===254)return new TextDecoder("utf-16le").decode(bytes);
  if(bytes.length>1&&bytes[0]===254&&bytes[1]===255)return new TextDecoder("utf-16be").decode(bytes);
  if(bytes.subarray(0,512).includes(0))return null;
  return new TextDecoder("utf-8").decode(bytes);
}
async function openZip(file) {
  if(!window.JSZip){say("JSZip tidak dapat dimuat.");return;}
  if(file.size>ZIP_MAX){say("Had ZIP 15 MB.");return;}
  try {
    const archive=await JSZip.loadAsync(file);
    const entries=Object.values(archive.files).filter(e=>!e.dir);
    if(entries.length>120){say("ZIP melebihi 120 fail.");return;}
    let opened=0,skipped=0,total=0;
    for(const entry of entries) {
      const size=entry._data&&entry._data.uncompressedSize;
      if(typeof size!=="number"||size>FILE_MAX||total+size>ZIP_MAX){skipped++;continue;}
      total+=size;
      const bytes=await entry.async("uint8array");
      if(bytes.length>FILE_MAX){skipped++;continue;}
      const contents=decode(bytes);
      if(contents===null){skipped++;continue;}
      add(entry.name,contents,false);opened++;
    }
    if(opened)activate(tabs[tabs.length-1].id);
    say("ZIP: "+opened+" fail dibuka; "+skipped+" dilangkau.");
  }catch(e){say("ZIP rosak/tidak disokong: "+e.message);}
}
async function openFiles(fileList) {
  const inputs=Array.from(fileList||[]);
  for(const file of inputs) {
    try {
      if(file.name.toLowerCase().endsWith(".zip")){await openZip(file);continue;}
      if(file.size>FILE_MAX){say(file.name+" melebihi 4 MB.");continue;}
      const text=decode(new Uint8Array(await file.arrayBuffer()));
      if(text===null){say(file.name+" adalah binari.");continue;}
      add(file.webkitRelativePath||file.name,text);
    }catch(e){say("Ralat membaca "+file.name+": "+e.message);}
  }
}
function escapePattern(s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g,"\\$&");
}
function searchRegex(global) {
  const term=$("find-input").value;
  return new RegExp($("find-regex").checked?term:escapePattern(term),(global?"g":"")+($("find-case").checked?"":"i"));
}
function updateMatches() {
  const term=$("find-input").value,contents=cm.getValue();
  if(!term){$("match-count").textContent="0 padanan";return;}
  try {
    const re=searchRegex(true);
    let count=0,result;
    while((result=re.exec(contents))!==null && count<10000){
      count++;
      if(!result[0])re.lastIndex++;
    }
    $("match-count").textContent=count+(count>=10000?"+":"")+" padanan";
  }catch(e){$("match-count").textContent="Regex tidak sah";}
}
function findNext(backwards) {
  if(!$("find-input").value)return;
  try {
    const pattern=$("find-regex").checked?searchRegex(false):$("find-input").value;
    const search=(at)=>cm.getSearchCursor(pattern,at,!$("find-case").checked);
    let cursor=search(cm.getCursor(backwards?"from":"to"));
    let found=backwards?cursor.findPrevious():cursor.findNext();
    if(!found){
      const last=cm.lastLine();
      cursor=search(backwards?{line:last,ch:cm.getLine(last).length}:{line:0,ch:0});
      found=backwards?cursor.findPrevious():cursor.findNext();
    }
    if(found){cm.setSelection(cursor.from(),cursor.to());cm.scrollIntoView(cursor.from(),100);cm.focus();}
    else say("Teks tidak ditemui.");
  }catch(e){say("Regex tidak sah.");}
}
function replaceOne() {
  const term=$("find-input").value;
  if(!term)return;
  try {
    const regex=new RegExp("^(?:"+($("find-regex").checked?term:escapePattern(term))+")$",$("find-case").checked?"":"i");
    if(cm.getSelection()&&regex.test(cm.getSelection()))cm.replaceSelection($("replace-input").value);
    findNext(false);
  }catch(e){say("Regex tidak sah.");}
}
function replaceAll() {
  if(!$("find-input").value)return;
  try {
    const regex=searchRegex(true),value=cm.getValue();
    let count=0;
    const result=value.replace(regex,()=>{count++;return $("replace-input").value;});
    if(count)cm.setValue(result);
    say(count+" padanan diganti.");
  }catch(e){say("Regex tidak sah.");}
}
function showFind(visible,replace=false) {
  $("findbar").classList.toggle("visible",visible);
  for(const name of ["replace-input","replace-btn","replace-all-btn"])$(name).classList.toggle("hide",!replace);
  if(visible){$("find-input").focus();$("find-input").select();updateMatches();}
  else cm.focus();
}
function applyConfig() {
  config.theme=config.theme==="light"?"light":"dark";
  config.font=Math.max(11,Math.min(24,Number(config.font)||14));
  config.tab=[2,4,8].includes(Number(config.tab))?Number(config.tab):2;
  document.documentElement.dataset.theme=config.theme;
  cm.setOption("theme",config.theme==="light"?"eclipse":"material-darker");
  cm.setOption("lineWrapping",!!config.wrap);
  cm.setOption("tabSize",config.tab);cm.setOption("indentUnit",config.tab);
  editorElement.style.fontSize=config.font+"px";
  $("theme-select").value=config.theme;
  $("wrap-select").value=String(!!config.wrap);
  $("tab-select").value=String(config.tab);
  $("font-input").value=config.font;
  try{localStorage.setItem("kirincode-settings-v1",JSON.stringify(config));}catch(e){}
  cm.refresh();
}
function settingsVisible(open) {
  $("settings-dialog").classList.toggle("visible",open);
  $("settings-dialog").setAttribute("aria-hidden",String(!open));
  if(!open)cm.focus();
}
function showSidebar() {$("sidebar").classList.add("open");$("sidebar-scrim").classList.add("visible");}
function hideSidebar() {$("sidebar").classList.remove("open");$("sidebar-scrim").classList.remove("visible");}
async function githubFile() {
  const entered=prompt("URL fail awam GitHub (contoh github.com/user/repo/blob/main/file.js):");
  if(!entered)return;
  try {
    const u=new URL(entered.trim());
    if(u.protocol!=="https:")throw Error("HTTPS sahaja.");
    let raw,path;
    if(u.hostname==="github.com") {
      const found=u.pathname.match(/^\/([^/]+)\/([^/]+)\/(?:blob|raw)\/([^/]+)\/(.+)$/);
      if(!found)throw Error("Masukkan pautan FAIL GitHub, bukan repo/folder.");
      raw="https://raw.githubusercontent.com/"+found[1]+"/"+found[2]+"/"+found[3]+"/"+found[4];
      path=found[4];
    } else if(u.hostname==="raw.githubusercontent.com") {
      raw=u.href;path=u.pathname.split("/").slice(4).join("/");
    } else throw Error("Domain GitHub tidak dikenali.");
    const response=await fetch(raw);
    if(!response.ok)throw Error("HTTP "+response.status);
    if(Number(response.headers.get("content-length")||0)>FILE_MAX)throw Error("Fail terlalu besar.");
    const bytes=new Uint8Array(await response.arrayBuffer());
    if(bytes.length>FILE_MAX)throw Error("Fail terlalu besar.");
    const result=decode(bytes);
    if(result===null)throw Error("Fail binari.");
    add(path,result);say("Kod GitHub berjaya dibuka.");
  }catch(e){say("GitHub: "+e.message);}
}
function applySnapshot(snapshot){
  const clean=window.KirinCodeDrafts.validateSnapshot(snapshot);
  clearTimeout(autosaveTimeout);clearTimeout(draftTimer);
  quiet=true;
  let chosen=null;
  try{
    tabs.splice(0);current=null;seq=0;
    for(const file of clean.files){
      const opened=add(file.path,file.content,false,file.saved);
      if(window.KirinCodeLanguages.has(file.override))opened.override=file.override;
      if(file.id===clean.active)chosen=opened;
    }
    if(tabs.length)activate((chosen||tabs[0]).id);
    else{
      cm.swapDoc(new CodeMirror.Doc("","text/plain"));
      cm.setOption("readOnly",true);
      $("status-lang").textContent="Plain Text";
    }
    render();position();emit("files");
    return tabs.length>0;
  }finally{quiet=false;}
}
function restoreSession(){
  try{
    const data=JSON.parse(sessionStorage.getItem("kirincode-session-v1")||"null");
    return data&&Array.isArray(data.files)&&data.files.length?applySnapshot(data):false;
  }catch(error){return false;}
}
function exportBackup(){
  if(!tabs.length){say("Tiada fail untuk dieksport.");return;}
  try{
    const json=window.KirinCodeDrafts.makeBackup(snapshotWorkspace());
    const stamp=new Date().toISOString().slice(0,16).replace("T","-").replace(":","-");
    download(new Blob([json],{type:"application/json;charset=utf-8"}),"KirinCode-backup-"+stamp+".json");
    say("Backup JSON berjaya dieksport.");
  }catch(error){say("Backup: "+error.message);}
}
async function importBackup(file){
  if(!file)return;
  if(file.size>64*1024*1024){say("Backup terlalu besar (maksimum 64 MB).");return;}
  let snapshot;
  try{snapshot=window.KirinCodeDrafts.parseBackup(await file.text());}
  catch(error){say("Fail backup tidak sah: "+error.message);return;}
  if(!confirm("Gantikan semua tab yang sedang dibuka dengan "+snapshot.files.length+" fail daripada backup? Eksport backup semasa dahulu jika perlu."))return;
  try{
    applySnapshot(snapshot);
    saveSession();
    persistDraft();
    draftStatus("Backup diimport · "+snapshot.files.length+" fail");
    say("Backup dipulihkan: "+snapshot.files.length+" fail.");
  }catch(error){say("Pemulihan gagal: "+error.message);}
}
async function startWorkspace(){
  let restored=false, storageError=null;
  draftStatus("Memeriksa draf IndexedDB...");
  try{
    const saved=await window.KirinCodeDrafts.load();
    if(saved&&saved.files.length && !tabs.length){
      restored=applySnapshot(saved);
      if(restored)say("Draf lama dipulihkan daripada IndexedDB.");
    }
  }catch(error){storageError=error;}
  if(!restored&&!tabs.length)restored=restoreSession();
  if(!restored&&!tabs.length)add("welcome.sp","// KirinCode — Multi-Language Code Editor\n// Buka fail dari peranti, ZIP atau pautan GitHub.\n\n#include <sourcemod>\n\npublic void OnPluginStart()\n{\n    PrintToServer(\"Hello from KirinCode!\");\n}\n");
  draftsReady=true;
  if(storageError)draftStatus("IndexedDB tidak tersedia: "+storageError.message+". Gunakan Export Backup.");
  else scheduleDraft();
  render();position();
}

$("new-btn").onclick=makeNew;$("new-side-btn").onclick=makeNew;
$("open-btn").onclick=chooseFiles;$("open-side-btn").onclick=chooseFiles;
$("save-btn").onclick=downloadCurrent;$("zip-btn").onclick=downloadZip;
$("folder-btn").onclick=()=>$("folder-input").click();
$("github-btn").onclick=githubFile;
$("file-input").onchange=e=>{openFiles(e.target.files);e.target.value="";};
$("folder-input").onchange=e=>{openFiles(e.target.files);e.target.value="";};
$("search-files").oninput=render;
$("language-select").addEventListener("change",(event)=>{
  if(!current)return;
  const name=event.target.value;
  if(!window.KirinCodeLanguages.has(name))return;
  current.override=name;
  applyLanguage(current);
  saveSession();
});
$("find-btn").onclick=()=>showFind(true,false);
$("replace-toggle-btn").onclick=()=>showFind(true,true);
$("find-close").onclick=()=>showFind(false);
$("find-prev").onclick=()=>findNext(true);$("find-next").onclick=()=>findNext(false);
$("replace-btn").onclick=replaceOne;$("replace-all-btn").onclick=replaceAll;
for(const name of ["find-input","find-case","find-regex"])$(name).addEventListener("input",updateMatches);
$("find-input").onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();findNext(e.shiftKey);}if(e.key==="Escape")showFind(false);};
$("settings-btn").onclick=()=>settingsVisible(true);
$("settings-close").onclick=()=>settingsVisible(false);
$("settings-dialog").onclick=e=>{if(e.target===$("settings-dialog"))settingsVisible(false);};
$("theme-select").onchange=e=>{config.theme=e.target.value;applyConfig();};
$("wrap-select").onchange=e=>{config.wrap=e.target.value==="true";applyConfig();};
$("font-input").onchange=e=>{config.font=e.target.value;applyConfig();};
$("tab-select").onchange=e=>{config.tab=e.target.value;applyConfig();};
$("backup-export-btn").onclick=exportBackup;
$("backup-import-btn").onclick=()=>$("backup-file-input").click();
$("backup-file-input").onchange=e=>{
  const file=e.target.files&&e.target.files[0];
  e.target.value="";
  importBackup(file);
};
$("menu-btn").onclick=showSidebar;
$("sidebar-close").onclick=hideSidebar;$("sidebar-scrim").onclick=hideSidebar;
window.addEventListener("keydown",e=>{if(e.key==="Escape"){hideSidebar();settingsVisible(false);showFind(false);}});
const workspace=$("workspace");
workspace.addEventListener("dragenter",e=>{e.preventDefault();dragLevel++;$("drop-overlay").classList.add("visible");});
workspace.addEventListener("dragover",e=>e.preventDefault());
workspace.addEventListener("dragleave",e=>{e.preventDefault();dragLevel=Math.max(0,dragLevel-1);if(!dragLevel)$("drop-overlay").classList.remove("visible");});
workspace.addEventListener("drop",e=>{e.preventDefault();dragLevel=0;$("drop-overlay").classList.remove("visible");if(e.dataTransfer)openFiles(e.dataTransfer.files);});
cm.on("cursorActivity",position);
cm.on("change",()=>{if(current){render();position();updateMatches();saveSession();emit("edit");}});
// Small, bounded integration surface for the public repository explorer.
window.KirinCode = Object.freeze({
  openExternalText(path, text) {
    if(typeof text!=="string" || new Blob([text]).size>FILE_MAX)throw Error("Fail melebihi had 4 MB.");
    add(path,text);
  },
  toast: say,
  maxFileSize: FILE_MAX,
  getEditor(){return cm;},
  getCompletionFiles(){
    const candidates=[];
    if(current)candidates.push(current);
    for(const file of tabs){
      if(candidates.length>=17)break;
      if(file!==current && /\.inc$/i.test(file.path))candidates.push(file);
    }
    return candidates.map(file=>({
      id:file.id,name:file.name,path:file.path,override:file.override,
      content:file.doc.getValue().slice(0,200000)
    }));
  },
  getFiles(){return tabs.map(file=>({
    id:file.id,name:file.name,path:file.path,content:file.doc.getValue(),override:file.override
  }));},
  getActiveId(){return current?current.id:null;},
  subscribe(listener){
    if(typeof listener!=="function")throw TypeError("Listener must be function");
    listeners.add(listener);
    return ()=>listeners.delete(listener);
  }
});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")persistDraft();});
window.addEventListener("pagehide",persistDraft);
applyConfig();
startWorkspace();
})();