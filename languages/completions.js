/* KirinCode local code-completion index. No network access or evaluation of opened files. */
(function(){
"use strict";
const words={
sourcepawn:"public stock static native forward new decl const enum struct methodmap typedef typeset function property void int float char bool any Handle Action ConVar ArrayList StringMap Event if else for while switch case break continue return sizeof view_as delete true false null OnPluginStart OnPluginEnd OnMapStart OnMapEnd OnGameFrame OnClientConnected OnClientDisconnect OnClientPutInServer OnClientSayCommand Plugin_Continue Plugin_Changed Plugin_Handled Plugin_Stop GetClientName GetClientTeam IsClientInGame IsPlayerAlive PrintToServer PrintToChat PrintToChatAll PrintHintText PrintToConsole ReplyToCommand RegConsoleCmd RegAdminCmd CreateConVar FindConVar GetConVarInt GetConVarBool SetConVarInt HookEvent CreateTimer KillTimer GetClientOfUserId GetClientUserId Format FormatEx StrEqual StrContains ReplaceString GetRandomInt GetRandomFloat GetGameTime TeleportEntity SDKHook SDKUnhook SDKCall CreateEntityByName DispatchSpawn AcceptEntityInput RemoveEntity GetEntProp SetEntProp",
javascript:"const let var function return class extends new async await import export default from if else for while do switch case break continue try catch finally throw true false null undefined this super typeof instanceof Promise Map Set Array Object String Number Boolean JSON Math console document window querySelector getElementById textContent appendChild fetch setTimeout",
typescript:"interface type enum namespace readonly private public protected implements keyof typeof unknown never string number boolean any extends Promise Record Partial Required",
python:"def class lambda return yield async await import from as if elif else for while in is not and or try except finally raise with pass break continue global nonlocal True False None self print len range enumerate zip list dict set tuple str int float bool open super",
php:"function class public private protected static final abstract interface trait namespace use new return if else elseif foreach while switch case break continue true false null echo print array count strlen strpos str_replace json_encode json_decode isset empty require include",
sql:"SELECT FROM WHERE JOIN LEFT RIGHT INNER OUTER ON GROUP BY ORDER HAVING LIMIT OFFSET INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE ALTER DROP INDEX PRIMARY KEY FOREIGN REFERENCES DISTINCT COUNT SUM AVG MIN MAX AND OR NOT NULL IS LIKE BETWEEN EXISTS AS UNION ALL",
html:"html head body title meta link style script main section article nav header footer aside div span p a img h1 h2 h3 h4 h5 h6 ul ol li button input label form textarea select option table thead tbody tr td th figure svg details summary",
xml:"xml version encoding id class xmlns href name value",
css:"display flex grid block none position absolute relative fixed sticky width height min-width max-width margin padding border border-radius background background-color color font-size font-weight line-height gap align-items justify-content overflow opacity transform transition box-shadow",
c:"include define int long short char float double unsigned signed void const static extern struct typedef enum union sizeof return if else for while do switch case break continue malloc free printf fprintf NULL",
cpp:"include define int long char float double void auto const constexpr class struct namespace using template typename public private protected virtual override static inline new delete return if else for while switch case break continue std string vector map cout",
java:"class interface enum extends implements package import public private protected static final void int long boolean char float double String new return if else switch case for while try catch finally throw throws null true false this super",
kotlin:"fun val var class data sealed object companion interface package import suspend override public private protected internal return if else when for while in is as null true false this super",
csharp:"using namespace class struct interface public private protected internal static readonly async await Task void int float double decimal string bool var new return if else switch case for while try catch finally throw null true false this base",
lua:"local function return if then elseif else end for while repeat until do break true false nil and or not require print pairs ipairs table string math",
shell:"if then else elif fi for while do done case esac function export local readonly echo printf read test grep awk sed cat find chmod mkdir cd pwd exit return",
go:"package import func type struct interface map chan go defer select case default return if else for range break continue var const true false nil make new append len cap fmt",
rust:"fn let mut pub impl struct enum trait use mod crate super self Self async await move match if else while for loop in return break continue Some None Ok Err Result Option String Vec Box",
ruby:"def class module end if elsif else unless while until do yield return begin rescue ensure require include extend puts print nil true false self super",
swift:"import class struct enum protocol extension func let var public private internal static override init deinit guard if else switch case default for while repeat return throw try catch async await nil true false self",
dart:"import library class abstract extends implements mixin void dynamic var final const late static async await Future Stream return if else for while switch case break continue null true false this super",
yaml:"true false null yes no on off",
config:"true false on off enabled disabled yes no",
dockerfile:"FROM RUN CMD LABEL EXPOSE ENV ADD COPY ENTRYPOINT VOLUME USER WORKDIR ARG ONBUILD STOPSIGNAL HEALTHCHECK SHELL",
powershell:"Get-ChildItem Get-Content Set-Content Get-Item Set-Item Write-Host Write-Output ForEach-Object Where-Object Select-Object Sort-Object Import-Module Export-Module function param if else elseif foreach switch try catch finally return"
};
const exts={sp:"sourcepawn",inc:"sourcepawn",js:"javascript",jsx:"javascript",mjs:"javascript",ts:"typescript",tsx:"typescript",json:"javascript",py:"python",php:"php",sql:"sql",html:"html",htm:"html",xml:"xml",svg:"xml",css:"css",scss:"css",c:"c",h:"c",cpp:"cpp",cc:"cpp",hpp:"cpp",java:"java",kt:"kotlin",cs:"csharp",lua:"lua",sh:"shell",bash:"shell",go:"go",rs:"rust",rb:"ruby",swift:"swift",dart:"dart",yaml:"yaml",yml:"yaml",cfg:"config",ini:"config",ps1:"powershell"};
function language(file){
 if(!file)return "plain";
 if(file.override&&file.override!=="auto")return file.override;
 const filename=String(file.path||"").split("/").pop().toLowerCase();
 return filename==="dockerfile"?"dockerfile":exts[filename.split(".").pop()]||"plain";
}
function stripComments(source){
 let out="",state="normal",quote="",escaped=false;
 for(let i=0;i<source.length;i++){
  const ch=source[i],next=source[i+1];
  if(state==="line"){if(ch==="\n"){out+="\n";state="normal";}else out+=" ";continue;}
  if(state==="block"){
   if(ch==="*"&&next==="/"){out+="  ";i++;state="normal";}
   else out+=ch==="\n"?"\n":" ";
   continue;
  }
  if(state==="string"){
   out+=ch==="\n"?"\n":" ";
   if(escaped){escaped=false;continue;}
   if(ch==="\\"){escaped=true;continue;}
   if(ch===quote)state="normal";
   continue;
  }
  if(ch==="/"&&next==="/"){out+="  ";i++;state="line";continue;}
  if(ch==="/"&&next==="*"){out+="  ";i++;state="block";continue;}
  if(ch==="'"||ch==='"'){quote=ch;state="string";out+=" ";continue;}
  out+=ch;
 }
 return out;
}
function extractIncludeSymbols(text,origin){
 const code=stripComments(String(text).slice(0,200000)),map=new Map();
 function add(name,kind){
  if(map.size<450&&/^[A-Za-z_]\w*$/.test(name)&&!map.has(name))
    map.set(name,{text:name,kind,origin:String(origin||"include.inc")});
 }
 for(const match of code.matchAll(/^\s*(?:(?:native|forward|stock|public|static)\s+)+(?:[A-Za-z_]\w*(?:\s*:\s*[A-Za-z_]\w*)?\s+)?([A-Za-z_]\w*)\s*\(/gm))
  add(match[1],"function");
 for(const m of code.matchAll(/^\s*#\s*define\s+([A-Za-z_]\w*)/gm))add(m[1],"macro");
 for(const m of code.matchAll(/^\s*(?:methodmap|enum\s+struct|enum|typedef|typeset)\s+([A-Za-z_]\w*)/gm))
  add(m[1],"type");
 return [...map.values()];
}
function suggest(files,active,prefix,max=45){
 const query=String(prefix||"");
 if(query.length>80 || (query && !/^[A-Za-z_]\w*$/.test(query)))return [];
 const kind=language(active),result=new Map();
 function add(word,origin,type,rank){
  if(!word||word===query||!word.toLowerCase().startsWith(query.toLowerCase())||result.has(word.toLowerCase()))return;
  result.set(word.toLowerCase(),{text:word,origin,kind:type,rank});
 }
 if(kind==="sourcepawn"){
  let seen=0;
  for(const f of files||[]){
   if(!/\.inc$/i.test(String(f.path||""))||typeof f.content!=="string"||f.content.length>200000)continue;
   if(++seen>16)break;
   for(const item of extractIncludeSymbols(f.content,f.name||f.path))add(item.text,item.origin,item.kind,0);
  }
 }
 for(const word of (words[kind]||"").split(/\s+/).filter(Boolean))
  add(word,kind==="sourcepawn"?"SourceMod":"Keyword","keyword",1);
 // Include local symbols, bounded so large files do not stall Android.
 const text=String(active?.content||"").slice(0,90000);
 let seen=0;
 for(const match of (kind==="sourcepawn"?stripComments(text):text).matchAll(/\b[A-Za-z_][A-Za-z_0-9]{2,}\b/g)){
  add(match[0],"Fail semasa","local",2);
  if(++seen>3500)break;
 }
 return [...result.values()].sort((a,b)=>a.rank-b.rank||a.text.length-b.text.length||a.text.localeCompare(b.text)).slice(0,Math.max(1,Math.min(60,max)));
}
window.KirinCodeCompletionCore=Object.freeze({language,stripComments,extractIncludeSymbols,suggest,languageNames:Object.keys(words)});
})();