/* KirinCode 0.8 recovery and portable JSON tests (no external packages). */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const file="assets/js/drafts.js";
assert.ok(existsSync(file));
const source=readFileSync(file,"utf8");
assert.doesNotThrow(()=>new Function(source));

let stored;
const fakeIndexedDB={
  open(name,version){
    assert.equal(name,"KirinCodeDrafts");
    assert.equal(version,1);
    const request={};
    queueMicrotask(()=>{
      request.result={
        objectStoreNames:{contains:()=>false},
        createObjectStore() {},
        close() {},
        transaction(store,mode){
          assert.equal(store,"workspaces");
          const transaction={
            objectStore(){
              return {
                get(key){
                  assert.equal(key,"default");
                  const r={};
                  queueMicrotask(()=>{r.result=stored;r.onsuccess?.();});
                  return r;
                },
                put(value,key){
                  assert.equal(key,"default");
                  queueMicrotask(()=>{stored=value;transaction.oncomplete?.();});
                  return {};
                }
              };
            }
          };
          return transaction;
        }
      };
      request.onupgradeneeded?.();
      request.onsuccess?.();
    });
    return request;
  }
};
const browser={indexedDB:fakeIndexedDB};
new Function("window",source)(browser);
const api=browser.KirinCodeDrafts;
assert.ok(api);
const one={
  active:5,files:[
    {id:5,path:"plugins/boss.sp",content:"public void OnPluginStart() { PrintToChatAll(\"hi\"); }",saved:"public void OnPluginStart() {}",override:"sourcepawn"},
    {id:9,path:"include/custom.inc",content:"native bool IsTank(int client);",saved:"native bool IsTank(int client);",override:"auto"}
  ]
};
assert.equal(await api.load(),null);
assert.equal(await api.save(one),true);
const loaded=await api.load();
assert.equal(loaded.active,5);
assert.equal(loaded.files.length,2);
assert.equal(loaded.files[0].content,one.files[0].content);
assert.equal(loaded.files[0].saved,one.files[0].saved); // Unsaved edits preserved.
assert.equal(loaded.files[0].override,"sourcepawn");
const exported=api.makeBackup(one);
const restored=api.parseBackup(exported);
assert.deepEqual(restored,loaded);
const metadata=JSON.parse(exported);
assert.equal(metadata.version,1);
assert.equal(metadata.format,"KirinCode Backup");
assert.ok(metadata.exportedAt);
assert.throws(()=>api.parseBackup('{"format":"other","version":1,"snapshot":{"files":[]}}'),/bukan KirinCode/);
assert.throws(()=>api.parseBackup("{broken"),SyntaxError);
assert.throws(()=>api.parseBackup('{"format":"KirinCode Backup","version":1,"snapshot":{"files":[]}}'),/Format backup/);
assert.throws(()=>api.validateSnapshot({files:[{path:"x",content:"x".repeat(2000001)}]}),/terlalu besar/);
assert.throws(()=>api.validateSnapshot({files:Array.from({length:33},(_,i)=>({path:"file"+i,content:""}))}),/terlalu banyak/);
assert.equal(api.validateSnapshot({files:[],active:null}).files.length,0);
assert.equal(api.maxFiles,32);
const dup=api.validateSnapshot({files:[{id:2,path:"one.sp",content:"x"},{id:2,path:"two.inc",content:"y"}]});
assert.notEqual(dup.files[0].id,dup.files[1].id);
assert.ok(appSizeCheckIsSafe());
function appSizeCheckIsSafe(){return readFileSync("assets/js/app.js","utf8").includes("64*1024*1024");}

const html=readFileSync("index.html","utf8");
assert.ok(html.indexOf('src="assets/js/drafts.js"')<html.indexOf('src="assets/js/app.js"'));
for(const name of ["backup-status","backup-export-btn","backup-import-btn","backup-file-input"])
  assert.ok(html.includes('id="'+name+'"'),name+" missing");
assert.ok(html.includes('href="assets/css/drafts.css"'));
const app=readFileSync("assets/js/app.js","utf8");
for(const name of ["startWorkspace","restoreSession","applySnapshot","persistDraft","importBackup","exportBackup"])
  assert.ok(app.includes(name),name+" not integrated");
assert.match(app,/visibilitychange/);
assert.match(app,/pagehide/);
console.log("KirinCode draft recovery tests passed (IndexedDB round-trip, dirty state and JSON import/export).");
