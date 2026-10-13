/* Unit tests for the standalone SourcePawn lexer (no npm dependencies). */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const modes = Object.create(null);
const mimes = Object.create(null);
const cm = {
  defineMode(name, factory) { modes[name] = factory; },
  defineMIME(mime, name) { mimes[mime] = name; },
  registerHelper() {},
  fold: { brace() {} }
};
new Function("window", readFileSync("languages/sourcepawn.js", "utf8"))({ CodeMirror: cm });
assert.equal(typeof modes.sourcepawn, "function");
assert.equal(mimes["text/x-sourcepawn"], "sourcepawn");
const mode = modes.sourcepawn();

function lex(line, state = mode.startState()) {
  let pos = 0;
  const tokens = [];
  while (pos < line.length) {
    const start = pos;
    const stream = {
      string: line,
      get pos() { return pos; },
      set pos(value) { pos = value; },
      sol() { return pos === 0; },
      eol() { return pos >= line.length; },
      eatSpace() {
        const match = /^\s+/.exec(line.slice(pos));
        if (!match) return false;
        pos += match[0].length;
        return true;
      },
      match(pattern) {
        const rest = line.slice(pos);
        const found = typeof pattern === "string" ?
          (rest.startsWith(pattern) ? pattern : null) : pattern.exec(rest);
        if (!found) return false;
        pos += typeof found === "string" ? found.length : found[0].length;
        return true;
      },
      current() { return line.slice(start, pos); },
      next() { return line[pos++]; },
      peek() { return line[pos]; },
      skipToEnd() { pos = line.length; }
    };
    const style = mode.token(stream, state);
    assert.ok(pos > start, "Lexer must advance at " + line.slice(pos));
    tokens.push({ text: line.slice(start, pos), style });
  }
  return tokens;
}

function expect(line, token, style) {
  const match = lex(line).find(t => t.text === token);
  assert.ok(match, "Missing token " + token + " in " + line);
  assert.equal(match.style, style, "Wrong syntax category for " + token);
}
expect("#include <sourcemod>", "#include", "meta");
expect("#include <sourcemod>", "<sourcemod>", "string");
expect("#pragma newdecls required", "#pragma", "meta");
expect("#define LIMIT 20", "LIMIT", "def");
expect("enum struct ZombieData {", "enum", "keyword");
expect("enum struct ZombieData {", "struct", "keyword");
expect("enum struct ZombieData {", "ZombieData", "def");
expect("methodmap Survivor < Handle {", "Survivor", "def");
expect("public Action OnClientSayCommand(int client)", "public", "keyword");
expect("public Action OnClientSayCommand(int client)", "Action", "type");
expect("public Action OnClientSayCommand(int client)", "OnClientSayCommand", "def");
expect("PrintToChatAll(\"Hi\");", "PrintToChatAll", "builtin");
expect("PrintToChatAll(\"Hi\");", "\"Hi\"", "string");
expect("new Float:amount = 1.5;", "1.5", "number");
expect("char x = '\\n';", "'\\n'", "string");
expect("// comment", "// comment", "comment");
expect("if (client > 0) return Plugin_Handled;", "Plugin_Handled", "atom");
expect("int GetCount()", "GetCount", "variable-2");

const state = mode.startState();
assert.equal(lex("/* opening", state)[0].style, "comment");
const continued = lex("continued */ int i;", state);
assert.equal(continued[0].style, "comment");
assert.equal(continued.find(t => t.text === "int").style, "type");
console.log("SourcePawn tokenizer tests passed.");
