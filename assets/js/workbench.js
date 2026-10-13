/* KirinCode Workbench: live preview, file comparison and responsive panels. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const api=window.KirinCode, core=window.KirinCodeWorkbenchCore;
if(!api||!core||!$("preview-btn")||!$("compare-btn"))return;
const stage=$("editor-stage"),pane=$("preview-pane"),frame=$("preview-frame");
const compareDialog=$("compare-dialog"),leftSelect=$("compare-left"),rightSelect=$("compare-right");
let previewOpen=false, compareOpen=false,previewTimer=null,compareTimer=null;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const files=()=>api.getFiles();
const active=()=>files().find(f=>f.id===api.getActiveId())||null;
function typeFor(file){
 if(!file)return null;
 if(file.override==="html")return "html";
 if(file.override==="markdown")return "markdown";
 const ext=file.path.split(".").pop().toLowerCase();
 if(["htm","html"].includes(ext))return "html";
 if(["md","markdown"].includes(ext))return "markdown";
 return null;
}
function renderPreview(){
 if(!previewOpen)return;
 const file=active(),type=typeFor(file);
 $("preview-file").textContent=file?file.name:"Tiada fail";
 $("preview-kind").textContent=type?type.toUpperCase():"No Preview";
 $("preview-help").hidden=!!type;
 frame.hidden=!type;
 if(!type){
  $("preview-help").textContent=file?"Preview tersedia untuk fail .html, .htm, .md dan .markdown.":"Buka fail HTML atau Markdown untuk melihat preview.";
  frame.srcdoc="";return;
 }
 frame.srcdoc=core.documentFor(file.content,type);
}
function setPreview(show){
 previewOpen=!!show;
 pane.hidden=!previewOpen;
 stage.classList.toggle("preview-open",previewOpen);
 $("preview-btn").setAttribute("aria-pressed",String(previewOpen));
 $("preview-btn").classList.toggle("tool-active",previewOpen);
 if(previewOpen)renderPreview();else{clearTimeout(previewTimer);frame.srcdoc="";}
}
function debouncePreview(){
 if(!previewOpen)return;
 clearTimeout(previewTimer);
 previewTimer=setTimeout(renderPreview,300);
}
function toggleCompare(show){
 compareOpen=!!show;
 compareDialog.classList.toggle("visible",compareOpen);
 compareDialog.setAttribute("aria-hidden",String(!compareOpen));
 if(compareOpen){updateCompareOptions();renderCompare();}
}
function updateCompareOptions(){
 const opened=files(),oldLeft=leftSelect.value,oldRight=rightSelect.value;
 function fill(select){
  const frag=document.createDocumentFragment();
  for(const f of opened){
   const option=el("option",null,f.name+"  ("+f.path+")");
   option.value=String(f.id);
   frag.append(option);
  }
  select.replaceChildren(frag);
 }
 fill(leftSelect);fill(rightSelect);
 const ids=new Set(opened.map(f=>String(f.id)));
 const right=ids.has(oldRight)?oldRight:String(api.getActiveId()||opened.at(-1)?.id||"");
 const left=ids.has(oldLeft)?oldLeft:String(opened.find(f=>String(f.id)!==right)?.id||opened[0]?.id||"");
 leftSelect.value=left;rightSelect.value=right;
 if(opened.length>=2&&leftSelect.value===rightSelect.value){
  leftSelect.value=String(opened.find(f=>String(f.id)!==rightSelect.value)?.id||left);
 }
}
function renderCompare(){
 if(!compareOpen)return;
 const left=files().find(f=>String(f.id)===leftSelect.value);
 const right=files().find(f=>String(f.id)===rightSelect.value);
 const list=$("compare-results");list.replaceChildren();
 if(!left||!right){$("compare-stats").textContent="Buka sekurang-kurangnya dua fail untuk dibandingkan.";return;}
 if(left.id===right.id){$("compare-stats").textContent="Pilih dua tab yang berbeza.";return;}
 const diff=core.compareLines(left.content,right.content);
 if(diff.error){$("compare-stats").textContent=diff.error;return;}
 $("compare-stats").textContent=diff.modified+" diubah · "+diff.added+" ditambah · "+diff.removed+" dipadam · "+diff.unchanged+" sama";
 const fragment=document.createDocumentFragment();
 for(const line of diff.rows){
  const row=el("div","diff-row diff-"+line.kind);
  const a=el("div","diff-half left-half"),b=el("div","diff-half right-half");
  const leftN=el("span","diff-number",line.left===null?"":String(line.left));
  const rightN=el("span","diff-number",line.right===null?"":String(line.right));
  a.append(leftN,el("code",null,line.leftText));
  b.append(rightN,el("code",null,line.rightText));
  row.append(a,b);fragment.append(row);
 }
 list.append(fragment);
}
function debounceCompare(){
 if(!compareOpen)return;
 clearTimeout(compareTimer);compareTimer=setTimeout(()=>{updateCompareOptions();renderCompare();},350);
}
$("preview-btn").addEventListener("click",()=>setPreview(!previewOpen));
$("preview-close").addEventListener("click",()=>setPreview(false));
$("compare-btn").addEventListener("click",()=>toggleCompare(true));
$("compare-close").addEventListener("click",()=>toggleCompare(false));
compareDialog.addEventListener("click",e=>{if(e.target===compareDialog)toggleCompare(false);});
leftSelect.addEventListener("change",renderCompare);
rightSelect.addEventListener("change",renderCompare);
$("compare-swap").addEventListener("click",()=>{
 const left=leftSelect.value;leftSelect.value=rightSelect.value;rightSelect.value=left;renderCompare();
});
window.addEventListener("keydown",e=>{if(e.key==="Escape"&&compareOpen)toggleCompare(false);});
api.subscribe(event=>{
 if(previewOpen)event==="edit"?debouncePreview():renderPreview();
 if(compareOpen)event==="edit"?debounceCompare():(updateCompareOptions(),renderCompare());
});
})();