/* KirinCode GitHub Repository Explorer — public, read-only API access. */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  if (!window.KirinCode || !$("repo-dialog")) return;

  const MAX_ENTRIES = 6000;
  const MAX_VISIBLE = 180;
  const state = {
    owner: "",
    repository: "",
    branch: "",
    entries: [],
    cwd: "",
    loading: false,
    version: 0,
    truncated: false
  };

  function element(tag, className, label) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (label !== undefined) node.textContent = label;
    return node;
  }

  function show(open) {
    $("repo-dialog").classList.toggle("visible", !!open);
    $("repo-dialog").setAttribute("aria-hidden", String(!open));
    if (open) $("repo-url").focus();
  }

  function message(text) {
    $("repo-footer").textContent = text;
  }

  function setLoading(busy) {
    state.loading = busy;
    $("repo-load").disabled = busy;
    $("repo-load").textContent = busy ? "Loading..." : "Open Repo";
    $("repo-filter").disabled = busy;
    $("repo-up").disabled = busy || !state.cwd;
  }

  function parseRepository(value) {
    let name = value.trim();
    if (!name) throw new Error("Masukkan nama repositori.");
    if (/^https?:\/\//i.test(name)) {
      const url = new URL(name);
      if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com") {
        throw new Error("Hanya URL HTTPS dari github.com disokong.");
      }
      name = url.pathname.replace(/^\/+|\/+$/g, "");
    }
    const parts = name.split("/");
    if (parts.length < 2) throw new Error("Format: owner/repository.");
    const owner = parts[0];
    const repository = parts[1].replace(/\.git$/i, "");
    if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(owner) ||
        !/^[A-Za-z0-9_.-]+$/.test(repository) ||
        repository === "." || repository === "..") {
      throw new Error("Nama owner atau repo tidak sah.");
    }
    return { owner: owner, repository: repository };
  }

  async function fetchGitHub(path) {
    const response = await fetch("https://api.github.com" + path, {
      headers: { Accept: "application/vnd.github+json" }
    });
    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        throw new Error("Had permintaan GitHub API dicapai. Cuba lagi selepas had pulih.");
      }
      if (response.status === 404) {
        throw new Error("Repo/fail tidak ditemui atau bukan repositori awam.");
      }
      throw new Error("GitHub API HTTP " + response.status);
    }
    return response.json();
  }

  async function loadRepository() {
    if (state.loading) return;
    let parsed;
    try { parsed = parseRepository($("repo-url").value); }
    catch (error) { message(error.message); return; }

    const revision = ++state.version;
    state.owner = parsed.owner;
    state.repository = parsed.repository;
    state.cwd = "";
    state.entries = [];
    state.truncated = false;
    $("repo-filter").value = "";
    $("repo-list").replaceChildren();
    $("repo-summary").textContent = "Membaca " + parsed.owner + "/" + parsed.repository + "...";
    message("Meminta senarai fail daripada GitHub API...");
    setLoading(true);

    try {
      const prefix = "/repos/" + encodeURIComponent(parsed.owner) + "/" + encodeURIComponent(parsed.repository);
      const metadata = await fetchGitHub(prefix);
      if (revision !== state.version) return;
      const branch = metadata.default_branch;
      if (!branch || typeof branch !== "string") throw new Error("Tiada branch utama.");
      // Git Trees accepts a branch ref; encoded to prevent path or query injection.
      const response = await fetchGitHub(prefix + "/git/trees/" + encodeURIComponent(branch) + "?recursive=1");
      if (revision !== state.version) return;
      if (!Array.isArray(response.tree)) throw new Error("Senarai repo tidak sah.");
      state.branch = branch;
      state.truncated = Boolean(response.truncated) || response.tree.length > MAX_ENTRIES;
      state.entries = response.tree.slice(0, MAX_ENTRIES).filter(item =>
        item && typeof item.path === "string" &&
        (item.type === "blob" || item.type === "tree") &&
        typeof item.sha === "string" && /^[0-9a-f]{40}$/i.test(item.sha)
      );
      $("repo-summary").textContent = parsed.owner + "/" + parsed.repository +
        " · " + branch + " · " + state.entries.length + " entri";
      render();
      message(state.truncated
        ? "GitHub memotong senarai repo besar. Sebahagian fail mungkin tidak muncul."
        : "Pilih folder atau fail. Kod dibuka sebagai salinan tempatan, tidak diubah dalam GitHub.");
    } catch (error) {
      if (revision === state.version) {
        $("repo-summary").textContent = "Gagal membuka repositori";
        message(error.message);
      }
    } finally {
      if (revision === state.version) setLoading(false);
    }
  }

  function row(path, type, size, openAction) {
    const btn = element("button", "repo-entry");
    btn.type = "button";
    btn.title = path;
    const isFolder = type === "tree";
    btn.append(element("span", "repo-symbol", isFolder ? "▣" : "⌁"));
    const label = element("span", "repo-entry-label");
    label.append(element("span", "repo-entry-name", path.split("/").pop()));
    label.append(element("span", "repo-entry-path", path));
    btn.append(label);
    if (!isFolder) {
      const kb = typeof size === "number" ? (size / 1024).toFixed(size < 1024 ? 1 : 0) + " KB" : "";
      btn.append(element("span", "repo-entry-size", kb));
    } else {
      btn.append(element("span", "repo-entry-size", "›"));
    }
    btn.addEventListener("click", openAction);
    return btn;
  }

  function render() {
    const view = $("repo-list");
    view.replaceChildren();
    $("repo-up").disabled = !state.cwd || state.loading;
    $("repo-breadcrumb").textContent = "/" + (state.cwd || "");
    const query = $("repo-filter").value.trim().toLowerCase();
    let candidates;
    if (query) {
      candidates = state.entries.filter(item => item.type === "blob" &&
        item.path.toLowerCase().includes(query) &&
        (!state.cwd || item.path.startsWith(state.cwd + "/")));
    } else {
      const prefix = state.cwd ? state.cwd + "/" : "";
      candidates = state.entries.filter(item => {
        if (!item.path.startsWith(prefix) || item.path === state.cwd) return false;
        const remainder = item.path.slice(prefix.length);
        return remainder.length > 0 && !remainder.includes("/");
      });
    }
    candidates.sort((a, b) => {
      if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
      return a.path.localeCompare(b.path, undefined, { numeric: true });
    });

    if (!candidates.length) {
      view.append(element("div", "repo-empty", query ? "Tiada fail sepadan." : "Folder kosong atau tiada kandungan."));
      return;
    }
    for (const item of candidates.slice(0, MAX_VISIBLE)) {
      if (item.type === "tree") {
        view.append(row(item.path, "tree", 0, () => {
          state.cwd = item.path;
          $("repo-filter").value = "";
          render();
        }));
      } else {
        view.append(row(item.path, "blob", item.size, () => openFile(item)));
      }
    }
    if (candidates.length > MAX_VISIBLE) {
      view.append(element("p", "repo-empty", "Hanya " + MAX_VISIBLE +
        " daripada " + candidates.length + " entri dipaparkan. Gunakan carian."));
    }
  }

  function decodeBase64(text) {
    const binary = atob(text.replace(/\s/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    if (bytes.subarray(0, 512).includes(0)) throw new Error("Fail binari tidak dapat diedit sebagai teks.");
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }

  async function openFile(item) {
    if (state.loading) return;
    if (typeof item.size === "number" && item.size > window.KirinCode.maxFileSize) {
      message("Fail terlalu besar (had 4 MB): " + item.path);
      return;
    }
    const owner = state.owner, repository = state.repository, version = state.version;
    message("Membuka " + item.path + "...");
    setLoading(true);
    try {
      const prefix = "/repos/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repository);
      const blob = await fetchGitHub(prefix + "/git/blobs/" + item.sha);
      if (version !== state.version) return;
      if (blob.encoding !== "base64" || typeof blob.content !== "string") {
        throw new Error("GitHub tidak memulangkan kandungan teks base64.");
      }
      const code = decodeBase64(blob.content);
      const path = owner + "/" + repository + "/" + item.path;
      window.KirinCode.openExternalText(path, code);
      show(false);
      window.KirinCode.toast("Dibuka dari GitHub: " + item.path + " (salinan tempatan)");
    } catch (error) {
      message("Gagal: " + error.message);
    } finally {
      if (version === state.version) setLoading(false);
    }
  }

  $("repo-btn").addEventListener("click", () => show(true));
  $("repo-close").addEventListener("click", () => show(false));
  $("repo-dialog").addEventListener("click", event => {
    if (event.target === $("repo-dialog")) show(false);
  });
  $("repo-connect").addEventListener("submit", event => {
    event.preventDefault();
    loadRepository();
  });
  $("repo-filter").addEventListener("input", render);
  $("repo-up").addEventListener("click", () => {
    if (!state.cwd) return;
    const paths = state.cwd.split("/");
    paths.pop();
    state.cwd = paths.join("/");
    render();
  });
  window.addEventListener("keydown", event => {
    if (event.key === "Escape" && $("repo-dialog").classList.contains("visible")) show(false);
  });
})();