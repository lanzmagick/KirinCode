/* KirinCode autocomplete UI: local CodeMirror hint dropdown; no network/AI calls. */
(function(){
"use strict";
const api=window.KirinCode,core=window.KirinCodeCompletionCore,cm=api?.getEditor?.();
const $=id=>document.getElementById(id);
if(!api||!core||!cm||!cm.showHint||!$("suggest-btn")||!$("autocomplete-select"))return;
const stored=(()=>{try{return localStorage.getItem("kirincode-complete-v1");}catch(e){return null;}})();
let enabled=stored!=="false",timer=null;
$("autocomplete-select").value=String(enabled);
const wordBefore=()=>{
 const cursor=cm.getCursor(),left=cm.getLine(cursor.line).slice(0,cursor.ch);
 return {cursor,prefix:(/[A-Za-z_]\w*$/.exec(left)||[""])[0]};
};
function data(editor){
 const {cursor,prefix}=wordBefore();
 const from={line:cursor.line,ch:cursor.ch-prefix.length};
 if(editor.somethingSelected())return {list:[],from,to:cursor};
 const files=api.getCompletionFiles(),active=files.find(f=>f.id===api.getActiveId());
 if(!active)return {list:[],from,to:cursor};
 // Do not suggest code inside strings or comments.
 const type=(editor.getTokenAt(cursor)||{}).type||"";
 if(/(?:^|\s)(?:comment|string)(?:\s|$)/.test(type))return {list:[],from,to:cursor};
 const items=core.suggest(files,active,prefix,45);
 return {from,to:cursor,list:items.map(item=>({
  text:item.text,
  displayText:item.text+"   · "+item.origin.slice(0,50),
  className:item.kind==="function"?"kirin-hint-function":item.kind==="macro"?"kirin-hint-macro":""
 }))};
}
function show(manual){
 clearTimeout(timer);
 if(!manual&&!enabled)return;
 if(!api.getActiveId())return;
 if(!manual&&cm.state.completionActive)return;
 if(!manual&&wordBefore().prefix.length<3)return;
 if(manual)cm.focus();
 cm.showHint({hint:data,completeSingle:false,closeOnUnfocus:true,alignWithWord:true});
}
$("suggest-btn").addEventListener("click",()=>show(true));
cm.addKeyMap({"Ctrl-Space":()=>show(true),"Cmd-Space":()=>show(true),"Alt-/":()=>show(true)});
$("autocomplete-select").addEventListener("change",event=>{
 enabled=event.target.value==="true";
 try{localStorage.setItem("kirincode-complete-v1",String(enabled));}catch(e){}
 if(!enabled){clearTimeout(timer);cm.closeHint();}
});
cm.on("inputRead",(editor,change)=>{
 if(!enabled||!change||change.origin!="+input"||change.text.length!==1||!/^[A-Za-z_]$/.test(change.text[0]))return;
 clearTimeout(timer);
 timer=setTimeout(()=>{
  if(cm.hasFocus()&&!cm.state.completionActive&&wordBefore().prefix.length>=3)show(false);
 },230);
});
api.subscribe(kind=>{
 if(kind==="activate"||kind==="files"){clearTimeout(timer);if(cm.state.completionActive)cm.closeHint();}
});
})();