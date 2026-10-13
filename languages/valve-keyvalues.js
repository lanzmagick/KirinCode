/* Valve VDF / VMT syntax highlighting. */
(function(){
"use strict";
if(!window.CodeMirror)return;
CodeMirror.defineMode("valve-kv", function () {
  return {token:function(stream) {
    if (stream.eatSpace()) return null;
    if (stream.match(/^\/\/.*/)) return "comment";
    if (stream.match(/^#.*/)) return "meta";
    if (stream.match(/^"(?:[^"\\]|\\.)*"/)) return "string";
    if (stream.match(/^-?\d+(\.\d+)?/)) return "number";
    if (stream.match(/^[{}]/)) return "bracket";
    stream.next(); return null;
  }};
});
})();
