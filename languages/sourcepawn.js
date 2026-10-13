/* KirinCode SourcePawn highlighting — lexical syntax only, not a compiler. */
(function () {
  "use strict";
  if (!window.CodeMirror) return;
  const CM = window.CodeMirror;
  const words = (s) => new Set(s.trim().split(/\s+/));
  const flow = words("if else for while do switch case default return break continue goto");
  const declaration = words("public static stock native forward const new decl enum struct methodmap typedef typeset function property get set operator builtin");
  const introducesName = words("struct methodmap typedef typeset property");
  const types = words("void int int8 int16 int32 int64 float char bool any String Handle Action Function Plugin ConVar ArrayList StringMap Menu Panel DataPack KeyValues Database DBResultSet Transaction Event Vector");
  const literal = words("sizeof this delete view_as true false null INVALID_FUNCTION");
  const constants = words("Plugin_Continue Plugin_Changed Plugin_Handled Plugin_Stop INVALID_HANDLE INVALID_ENT_REFERENCE MAXPLAYERS MAX_NAME_LENGTH PLATFORM_MAX_PATH FCVAR_NOTIFY FCVAR_REPLICATED FCVAR_SPONLY ADMFLAG_ROOT ADMFLAG_GENERIC ADMFLAG_BAN");
  const builtins = words("PrintToServer PrintToChat PrintToChatAll PrintCenterText PrintHintText PrintToConsole ReplyToCommand RegConsoleCmd RegAdminCmd HookEvent UnhookEvent CreateConVar FindConVar GetConVarInt GetConVarBool GetConVarFloat SetConVarInt SetConVarBool CreateTimer KillTimer GetClientOfUserId GetClientUserId GetClientName GetClientTeam IsClientInGame IsPlayerAlive GetMaxClients GetClientCount Format FormatEx StrEqual StrContains ReplaceString GetRandomInt GetRandomFloat GetGameTime GetEngineTime TeleportEntity SDKHook SDKUnhook SDKCall CreateEntityByName DispatchSpawn AcceptEntityInput RemoveEntity GetEntityClassname IsValidEntity GetEntProp SetEntProp GetEntPropFloat SetEntPropFloat GetEntPropVector SetEntPropVector");
  const callbacks = words("OnPluginStart OnPluginEnd OnMapStart OnMapEnd OnClientPutInServer OnClientConnected OnClientDisconnect OnClientDisconnect_Post OnClientAuthorized OnClientPostAdminCheck OnConfigsExecuted OnGameFrame OnEntityCreated OnEntityDestroyed OnClientSayCommand");

  function comment(stream, state) {
    const end = stream.string.indexOf("*/", stream.pos);
    if (end < 0) stream.skipToEnd();
    else { stream.pos = end + 2; state.block = false; }
    return "comment";
  }
  function stringToken(stream, state) {
    let escape = false;
    while (!stream.eol()) {
      const ch = stream.next();
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === state.quote) { state.quote = null; break; }
    }
    return "string";
  }
  CM.defineMode("sourcepawn", function () {
    return {
      name: "sourcepawn",
      startState: () => ({ block:false, quote:null, expecting:null, directive:false }),
      copyState: (s) => ({ block:s.block, quote:s.quote, expecting:s.expecting, directive:s.directive }),
      token: function (stream, state) {
        if (stream.sol()) state.directive = false;
        if (state.block) return comment(stream, state);
        if (state.quote) return stringToken(stream, state);
        if (stream.eatSpace()) return null;
        if (stream.match("//")) { stream.skipToEnd(); return "comment"; }
        if (stream.match("/*")) { state.block = true; return comment(stream, state); }
        if (stream.peek() === '"' || stream.peek() === "'") {
          state.quote = stream.next();
          return stringToken(stream, state);
        }
        if (/^\s*$/.test(stream.string.slice(0, stream.pos)) && stream.match(/^#\s*[A-Za-z_]\w*/)) {
          state.directive = true;
          state.expecting = stream.current().replace(/^#\s*/, "") === "define" ? "name" : null;
          return "meta";
        }
        if (state.directive && stream.match(/^<[^>\r\n]+>/)) return "string";
        if (stream.match(/^(?:0x[0-9A-Fa-f]+|0b[01]+|\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)/)) return "number";
        if (stream.match(/^[A-Za-z_]\w*/)) {
          const word = stream.current();
          if (state.expecting === "enum" && word === "struct") {
            state.expecting = "name";
            return "keyword";
          }
          if (state.expecting) { state.expecting = null; return "def"; }
          if (word === "enum") { state.expecting = "enum"; return "keyword"; }
          if (introducesName.has(word)) { state.expecting = "name"; return "keyword"; }
          if (flow.has(word) || declaration.has(word)) return "keyword";
          if (types.has(word)) return "type";
          if (literal.has(word)) return "atom";
          if (constants.has(word) || /^[A-Z][A-Z0-9_]+$/.test(word)) return "atom";
          if (builtins.has(word)) return "builtin";
          if (callbacks.has(word)) return "def";
          if (/^[ \t]*\(/.test(stream.string.slice(stream.pos))) return "variable-2";
          return "variable";
        }
        if (stream.match(/^(?:\+\+|--|==|!=|<=|>=|&&|\|\||<<|>>|->|[-+*/%&|^~=!<>?:]+)/)) return "operator";
        if (stream.match(/^[()[\]{}]/)) return "bracket";
        if (stream.match(/^[;,.]/)) return null;
        stream.next(); return null;
      },
      electricChars: "}"
    };
  });
  CM.defineMIME("text/x-sourcepawn", "sourcepawn");
  if (CM.registerHelper && CM.fold && CM.fold.brace)
    CM.registerHelper("fold", "sourcepawn", CM.fold.brace);
})();