/* KirinCode Workbench Core: Markdown HTML escaping and bounded line compare. */
(function () {
"use strict";
const esc = v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function validURL(value,img) {
  const v=String(value).trim();
  if(v.length>2000)return null;
  if(img)return /^https:\/\/[^\s"'<>]+$/i.test(v)?v:null;
  return /^https?:\/\/[^\s"'<>]+$/i.test(v)||/^#[\w-]+$/.test(v)?v:null;
}
function inline(s) {
  return String(s).split(/(\x60[^\x60\n]+\x60)/g).map(part=>{
    if(part.charCodeAt(0)===96&&part.charCodeAt(part.length-1)===96)return "<code>"+esc(part.slice(1,-1))+"</code>";
    let t=esc(part);
    t=t.replace(/!\[([^\]\n]*)\]\(([^)\s]+)\)/g,(all,alt,url)=>{
      const safe=validURL(url,true);
      return safe?'<img src="'+esc(safe)+'" alt="'+alt+'" loading="lazy">':all;
    });
    t=t.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g,(all,label,url)=>{
      const safe=validURL(url,false);
      return safe?'<a href="'+esc(safe)+'" rel="noopener noreferrer">'+label+"</a>":all;
    });
    return t.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>")
      .replace(/__([^_]+)__/g,"<strong>$1</strong>")
      .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g,"<em>$1</em>");
  }).join("");
}
const listMatch=s=>/^ {0,3}([-*+]|\d+\.)\s+(.+)$/.exec(s);
const heading=s=>/^ {0,3}(#{1,6})\s+(.+?)(?:\s+#+\s*)?$/.exec(s);
const rule=s=>/^ {0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/.test(s);
const quote=s=>/^ {0,3}>/.test(s);
const tableDivider=s=>/^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(s);
const cells=s=>s.trim().replace(/^\||\|$/g,"").split("|").map(t=>t.trim());
function markdown(source) {
 const lines=String(source).replace(/\r\n?/g,"\n").split("\n");
 let i=0;const result=[];
 const block=s=>!s.trim()||/^ {0,3}(\x60{3,}|~{3,})/.test(s)||listMatch(s)||heading(s)||rule(s)||quote(s);
 while(i<lines.length) {
  const line=lines[i];
  if(!line.trim()){i++;continue;}
  const fence=/^ {0,3}(\x60{3,}|~{3,})([^\r\n]*)/.exec(line);
  if(fence){
    const marker=fence[1][0], count=fence[1].length, code=[];i++;
    const closing=new RegExp("^ {0,3}"+(marker.charCodeAt(0)===96?"\\x60":"~")+"{"+count+",}\\s*$");
    while(i<lines.length&&!closing.test(lines[i]))code.push(lines[i++]);
    if(i<lines.length)i++;
    const syntax=fence[2].trim(),attribute=/^[a-z0-9_+-]{1,32}$/i.test(syntax)?' data-language="'+esc(syntax)+'"':"";
    result.push("<pre><code"+attribute+">"+esc(code.join("\n"))+"</code></pre>");
    continue;
  }
  const h=heading(line);
  if(h){result.push("<h"+h[1].length+">"+inline(h[2])+"</h"+h[1].length+">");i++;continue;}
  if(rule(line)){result.push("<hr>");i++;continue;}
  if(quote(line)){
    const items=[];while(i<lines.length&&quote(lines[i]))items.push(lines[i++].replace(/^ {0,3}>\s?/,""));
    result.push("<blockquote>"+markdown(items.join("\n"))+"</blockquote>");continue;
  }
  if(listMatch(line)){
    const ordered=/^\d/.test(listMatch(line)[1]),tag=ordered?"ol":"ul",items=[];
    while(i<lines.length){
      const next=listMatch(lines[i]);
      if(!next||/^\d/.test(next[1])!==ordered)break;
      let content=next[2],checkbox="";
      const task=/^\[([ xX])\]\s+/.exec(content);
      if(task){content=content.slice(task[0].length);checkbox='<input type="checkbox" disabled'+(task[1].toLowerCase()==="x"?" checked":"")+'> ';}
      items.push("<li>"+checkbox+inline(content)+"</li>");i++;
    }
    result.push("<"+tag+">"+items.join("")+"</"+tag+">");continue;
  }
  if(i+1<lines.length&&line.includes("|")&&tableDivider(lines[i+1])){
    const headers=cells(line);i+=2;
    let output="<table><thead><tr>"+headers.map(h=>"<th>"+inline(h)+"</th>").join("")+"</tr></thead><tbody>";
    while(i<lines.length&&lines[i].includes("|")&&lines[i].trim()){
      const data=cells(lines[i++]);output+="<tr>"+headers.map((_,j)=>"<td>"+inline(data[j]||"")+"</td>").join("")+"</tr>";
    }
    result.push(output+"</tbody></table>");continue;
  }
  const p=[lines[i++].trim()];
  while(i<lines.length&&!block(lines[i])&&!(i+1<lines.length&&lines[i].includes("|")&&tableDivider(lines[i+1])))p.push(lines[i++].trim());
  result.push("<p>"+inline(p.join(" "))+"</p>");
 }
 return result.join("\n");
}
const CSP='<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; script-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; img-src https: data:; font-src data:; connect-src &#39;none&#39;; object-src &#39;none&#39;; frame-src &#39;none&#39;; form-action &#39;none&#39;; base-uri &#39;none&#39;">';
const style="html{color-scheme:light}body{max-width:900px;margin:24px auto;padding:0 20px;color:#1d2c43;background:white;font:16px/1.65 system-ui,sans-serif;overflow-wrap:anywhere}h1,h2,h3{line-height:1.3}h1,h2{border-bottom:1px solid #e0e5f0;padding-bottom:.3em}code,pre{font-family:ui-monospace,Consolas,monospace}code{background:#eef1fa;border-radius:4px;padding:2px 4px}pre{background:#111c30;color:#e8f2ff;border-radius:10px;padding:15px;overflow:auto}pre code{background:none;padding:0}a{color:#6550d9}img{max-width:100%;height:auto}blockquote{border-left:4px solid #8b7af7;margin:0;padding:4px 16px;background:#f5f3ff}table{border-collapse:collapse;max-width:100%}th,td{border:1px solid #d8deea;padding:8px 11px}th{background:#f1f3fa}";
function documentFor(source,type){
  if(type==="markdown")return '<!doctype html><html><head><meta charset="utf-8">'+CSP+"<style>"+style+"</style></head><body><article>"+markdown(source)+"</article></body></html>";
  if(type!=="html")return "";
  const text=String(source);
  return /<head\b[^>]*>/i.test(text)?text.replace(/<head\b[^>]*>/i,match=>match+CSP):CSP+text;
}
function compare(before,after){
 const a=String(before).replace(/\r\n?/g,"\n").split("\n");
 const b=String(after).replace(/\r\n?/g,"\n").split("\n");
 const max=1200;
 if(a.length>max||b.length>max)return {error:"Perbandingan maksimum "+max+" baris untuk setiap fail supaya telefon tidak berat."};
 const n=a.length,m=b.length,stride=m+1,dp=new Uint16Array((n+1)*(m+1));
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--){
  dp[i*stride+j]=a[i]===b[j]?dp[(i+1)*stride+j+1]+1:Math.max(dp[(i+1)*stride+j],dp[i*stride+j+1]);
 }
 let i=0,j=0,added=0,removed=0,modified=0,unchanged=0;const rows=[];
 while(i<n||j<m){
  if(i<n&&j<m&&a[i]===b[j]){
    rows.push({kind:"equal",left:i+1,right:j+1,leftText:a[i],rightText:b[j]});i++;j++;unchanged++;continue;
  }
  const deletes=[],inserts=[];
  while(i<n||j<m){
    if(i<n&&j<m&&a[i]===b[j])break;
    if(i<n&&(j===m||dp[(i+1)*stride+j]>=dp[i*stride+j+1]))deletes.push({line:i+1,text:a[i++]});
    else if(j<m)inserts.push({line:j+1,text:b[j++]});
  }
  for(let k=0;k<Math.max(deletes.length,inserts.length);k++){
    const x=deletes[k],y=inserts[k],kind=x&&y?"changed":x?"removed":"added";
    rows.push({kind,left:x?x.line:null,right:y?y.line:null,leftText:x?x.text:"",rightText:y?y.text:""});
    if(kind==="changed")modified++;else if(kind==="removed")removed++;else added++;
  }
 }
 return {rows,added,removed,modified,unchanged};
}
window.KirinCodeWorkbenchCore=Object.freeze({renderMarkdown:markdown,documentFor,compareLines:compare,escapeHTML:esc,maxLines:1200});
})();