/* KirinCode 0.8 — local, versioned draft snapshots via IndexedDB.
 * No server and no network. A backup export is a portable JSON file.
 */
(function () {
"use strict";
const DB_NAME="KirinCodeDrafts",STORE="workspaces",KEY="default",VERSION=1;
const MAX_FILES=32,MAX_CHARS=2000000,MAX_TOTAL=8000000;
function validateSnapshot(value,allowEmpty=true){
  if(!value||typeof value!=="object"||!Array.isArray(value.files)||value.files.length>MAX_FILES||
      (!allowEmpty&&value.files.length===0))throw Error("Format backup tidak sah atau terlalu banyak fail.");
  let total=0;
  const files=[], seen=new Set();
  for(const item of value.files){
    if(!item||typeof item!=="object"||typeof item.path!=="string"||
       !item.path.length||item.path.length>240||typeof item.content!=="string"||
       item.content.length>MAX_CHARS)throw Error("Fail backup tidak sah atau terlalu besar (maksimum 2 juta aksara).");
    const saved=typeof item.saved==="string"?item.saved:item.content;
    if(saved.length>MAX_CHARS)throw Error("Saiz metadata draf melebihi had.");
    total+=item.content.length+saved.length;
    if(total>MAX_TOTAL)throw Error("Had backup ialah 8 juta aksara termasuk sejarah perubahan.");
    let id=Number.isSafeInteger(item.id)&&item.id>0&&!seen.has(item.id)?item.id:files.length+1;
    while(seen.has(id))id++;
    seen.add(id);
    files.push({id,path:item.path,content:item.content,saved,override:typeof item.override==="string"&&item.override.length<=40?item.override:"auto"});
  }
  let active=Number.isSafeInteger(value.active)?value.active:null;
  if(!files.some(f=>f.id===active))active=files[0]?.id||null;
  return {active,files};
}
function parseBackup(input){
  const value=typeof input==="string"?JSON.parse(input):input;
  if(!value||value.format!=="KirinCode Backup"||value.version!==1)
    throw Error("Fail bukan KirinCode Backup versi 1.");
  return validateSnapshot(value.snapshot,false);
}
function makeBackup(snapshot){
  return JSON.stringify({
    format:"KirinCode Backup",version:1,exportedAt:new Date().toISOString(),
    snapshot:validateSnapshot(snapshot,false)
  },null,2);
}
let connection=null;
function openDB(){
  if(!window.indexedDB)return Promise.reject(Error("IndexedDB tidak tersedia dalam pelayar ini."));
  if(connection)return connection;
  connection=new Promise((resolve,reject)=>{
    let request;
    try{request=window.indexedDB.open(DB_NAME,VERSION);}
    catch(error){reject(error);return;}
    request.onupgradeneeded=()=>{
      if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);
    };
    request.onsuccess=()=>{
      const db=request.result;
      db.onversionchange=()=>{db.close();connection=null;};
      resolve(db);
    };
    request.onerror=()=>reject(request.error||Error("Gagal membuka IndexedDB."));
    request.onblocked=()=>reject(Error("IndexedDB terkunci oleh tab lain."));
  }).catch(error=>{connection=null;throw error;});
  return connection;
}
async function load(){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const transaction=db.transaction(STORE,"readonly");
    const request=transaction.objectStore(STORE).get(KEY);
    request.onsuccess=()=>{
      try{resolve(request.result?validateSnapshot(request.result.snapshot):null);}
      catch(error){reject(error);}
    };
    request.onerror=()=>reject(request.error||Error("Gagal membaca backup."));
    transaction.onabort=()=>reject(transaction.error||Error("Backup gagal dibaca."));
  });
}
async function save(snapshot){
  const clean=validateSnapshot(snapshot);
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const transaction=db.transaction(STORE,"readwrite");
    transaction.objectStore(STORE).put({snapshot:clean,savedAt:Date.now()},KEY);
    transaction.oncomplete=()=>resolve(true);
    transaction.onerror=()=>reject(transaction.error||Error("Backup tidak dapat disimpan."));
    transaction.onabort=()=>reject(transaction.error||Error("Simpanan backup dibatalkan."));
  });
}
window.KirinCodeDrafts=Object.freeze({
  load,save,validateSnapshot,parseBackup,makeBackup,
  maxFiles:MAX_FILES,maxChars:MAX_CHARS,maxTotal:MAX_TOTAL
});
})();