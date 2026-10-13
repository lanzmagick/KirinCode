/* KirinCode local mode loader.
 * Modes are vendored from CodeMirror 5.65.20 under languages/.
 * Loads only the selected mode and its dependencies, with no mode CDN URLs.
 */
(function () {
  "use strict";
  const CM = window.CodeMirror;
  if (!CM) throw Error("CodeMirror must load before the language loader.");
  const SCRIPT_BASE = new URL(".", document.currentScript.src);
  const DEFINITIONS = Object.freeze({
    xml:          { path:"xml/xml.js" },
    css:          { path:"css/css.js" },
    javascript:   { path:"javascript/javascript.js" },
    htmlmixed:    { path:"html/htmlmixed.js", deps:["xml","javascript","css"] },
    clike:        { path:"clike/clike.js" },
    properties:   { path:"config/properties.js" },
    python:       { path:"python/python.js" },
    php:          { path:"php/php.js", deps:["htmlmixed","clike"] },
    sql:          { path:"sql/sql.js" },
    markdown:     { path:"markdown/markdown.js", deps:["xml"] },
    yaml:         { path:"yaml/yaml.js" },
    shell:        { path:"shell/shell.js" },
    lua:          { path:"lua/lua.js" },
    go:           { path:"go/go.js" },
    simple:       { path:"_shared/simple.js" },
    rust:         { path:"rust/rust.js", deps:["simple"] },
    ruby:         { path:"ruby/ruby.js" },
    perl:         { path:"perl/perl.js" },
    swift:        { path:"swift/swift.js" },
    dart:         { path:"dart/dart.js", deps:["clike"] },
    diff:         { path:"diff/diff.js" },
    dockerfile:   { path:"dockerfile/dockerfile.js", deps:["simple"] },
    powershell:   { path:"powershell/powershell.js" },
    toml:         { path:"toml/toml.js" }
  });
  const inFlight = new Map();
  function installed(name) {
    if (name === "simple") return typeof CM.defineSimpleMode === "function";
    return !!(CM.modes && CM.modes[name]);
  }
  function load(name) {
    if (!Object.prototype.hasOwnProperty.call(DEFINITIONS, name))
      return Promise.reject(Error("No bundled language module for " + name));
    if (installed(name)) return Promise.resolve();
    if (inFlight.has(name)) return inFlight.get(name);
    const entry = DEFINITIONS[name];
    const task = Promise.all((entry.deps || []).map(load)).then(() => new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL(entry.path, SCRIPT_BASE).href;
      script.async = true;
      script.onload = () => installed(name) ? resolve() : reject(Error("Mode failed to register: " + name));
      script.onerror = () => reject(Error("Failed to load local mode: " + name));
      document.head.appendChild(script);
    }));
    inFlight.set(name, task);
    task.catch(() => inFlight.delete(name));
    return task;
  }
  window.KirinCodeModeLoader = Object.freeze({
    load,
    has: (name) => Object.prototype.hasOwnProperty.call(DEFINITIONS, name),
    installed,
    entries: () => Object.entries(DEFINITIONS).map(([name,entry]) => ({
      name, path:entry.path, dependencies:(entry.deps || []).slice()
    }))
  });
})();