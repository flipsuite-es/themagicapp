/* ==========================================================================
   The Magic App — herramienta de gestión para magos
   - Biblioteca personal: crea, organiza y guarda tus trucos (categorías,
     dificultad, estado, etiquetas, notas, vídeos por URL, favoritos).
   - Trucos incluidos: efectos listos para actuar (Lector Mental).
   - Todo se guarda en el dispositivo (localStorage). Exporta/importa copia.
   Sin dependencias. Funciona offline.
   ========================================================================== */
(function () {
  "use strict";

  var view = document.getElementById("view");
  var STORE_KEY = "magic_lib_v1";

  /* ---------------------------- utilidades ---------------------------- */
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; }
  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8); return v.toString(16); });
  }
  function isUuid(s) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s || ""); }

  /* Iconos SVG de línea (sin emojis, look profesional) */
  var ICONS = {
    hat: '<path d="M7 4.5h10v9H7z"/><path d="M4 17.5h16"/><path d="M7 13.5C5 14 4 15.6 4 17.5M17 13.5c2 .5 3 2.1 3 4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    star: '<path d="M12 3.5l2.6 5.2 5.8.9-4.2 4.1 1 5.7L12 16.8 6.8 19.4l1-5.7-4.2-4.1 5.8-.9z"/>',
    starfill: '<path d="M12 3.5l2.6 5.2 5.8.9-4.2 4.1 1 5.7L12 16.8 6.8 19.4l1-5.7-4.2-4.1 5.8-.9z" fill="currentColor" stroke="none"/>',
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c0-3.6 3.4-5.6 7.5-5.6s7.5 2 7.5 5.6"/>',
    library: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
    wand: '<path d="M4 20L13 11"/><path d="M15 3.5l.9 2.3 2.3.9-2.3.9L15 9.9l-.9-2.3-2.3-.9 2.3-.9z"/><path d="M19 11l.5 1.4 1.4.5-1.4.5L19 15l-.5-1.4-1.4-.5 1.4-.5z"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    play: '<path d="M8 5l11 7-11 7z" fill="currentColor" stroke="none"/>',
    link: '<path d="M9 15l6-6"/><path d="M11 6.5l1-1a4 4 0 015.5 5.5l-1 1"/><path d="M13 17.5l-1 1a4 4 0 01-5.5-5.5l1-1"/>',
    film: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M3.5 9.5h17M8 5.5v13M16 5.5v13"/>',
    upload: '<path d="M12 16V5M8 9l4-4 4 4"/><path d="M5 19h14"/>',
    trash: '<path d="M5 7h14M10 7V5h4v2M6.5 7l1 12.5h9L17.5 7"/>',
    edit: '<path d="M14.5 5.5l4 4M4 20l1-4L16 4.5l3.5 3.5L8 19.5z"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    cloud: '<path d="M7 18h9.5a3.8 3.8 0 000-7.6 4.8 4.8 0 00-9.2-1.3A3.4 3.4 0 007 18z"/>',
    theme: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 010 16z" fill="currentColor" stroke="none"/>',
    disk: '<path d="M5 4h11l3 3v13H5z"/><path d="M8.5 4v4.5h6V4M8 20v-5.5h8V20"/>',
    envelope: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 5.5L20 7"/>',
    book: '<path d="M4.5 5.2C4.5 4.5 5 4 5.7 4H19v14.5H6.2c-.9 0-1.7.5-1.7 1.5z"/><path d="M4.5 20V5.2"/>',
    logout: '<path d="M14 5H6v14h8"/><path d="M18 12H10M15 9l3 3-3 3"/>',
    refresh: '<path d="M20 11a8 8 0 10-1 4"/><path d="M20 5v6h-6"/>',
    cards: '<rect x="6" y="4.5" width="10" height="14" rx="2" transform="rotate(-8 11 11)"/><rect x="9" y="6" width="10" height="14" rx="2" transform="rotate(6 14 13)"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1.1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.1" fill="currentColor" stroke="none"/>',
    up: '<path d="M6 15l6-6 6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4.2l2.8 1.8"/>',
    calendar: '<rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M8 3v3M16 3v3"/>'
  };
  function icon(name, cls) { return '<svg class="i ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || "") + "</svg>"; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) { t = el('<div class="toast" id="toast"></div>'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1900);
  }

  var DIFF = { facil: "Fácil", medio: "Medio", dificil: "Difícil" };
  var STATUS = { poraprender: "Por aprender", aprendiendo: "Aprendiendo", dominado: "Dominado" };
  var DEFAULT_CATS = ["Cartomagia", "Mentalismo", "Monedas", "Close-up", "Escenario", "Otros"];
  var KINDS = ["Close-up", "Salón", "Escenario", "Calle"];
  var META_LABELS = { kind: "Tipo", duration: "Duración", reset: "Reset", angles: "Ángulos", props: "Materiales", sleights: "Técnicas", source: "Fuente" };
  var META_ORDER = ["kind", "duration", "reset", "angles", "props", "sleights", "source"];

  /* ------------------------------ estado ------------------------------ */
  function load() {
    var s = { version: 1, tricks: [], categories: DEFAULT_CATS.slice(), routines: [], gigs: [] };
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) { var p = JSON.parse(raw); s.tricks = p.tricks || []; s.categories = (p.categories && p.categories.length) ? p.categories : DEFAULT_CATS.slice(); s.routines = p.routines || []; s.gigs = p.gigs || []; }
    } catch (e) {}
    return s;
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { toast("No se pudo guardar"); } }
  var state = load();
  function getTrick(id) { return state.tricks.filter(function (t) { return t.id === id; })[0]; }
  function getRoutine(id) { return state.routines.filter(function (r) { return r.id === id; })[0]; }
  function getGig(id) { return state.gigs.filter(function (g) { return g.id === id; })[0]; }
  // Texto indexado para búsqueda: incluye notas, ficha y transcripciones/capítulos de vídeos
  function searchText(t) {
    var parts = [t.title, t.notes || "", t.category || "", (t.tags || []).join(" ")];
    var m = t.meta || {};
    for (var k in m) { if (m[k] && typeof m[k] === "string") parts.push(m[k]); }
    (t.media || []).forEach(function (md) {
      if (md.title) parts.push(md.title);
      if (md.description) parts.push(md.description);
      if (md.transcript) parts.push(md.transcript);
      if (md.chapters) md.chapters.forEach(function (c) { parts.push(c.title); });
    });
    return parts.join(" ").toLowerCase();
  }

  /* ----------------------- sesión / sincronización -------------------- */
  var session = null;                 // usuario actual (o null si offline/local)
  function logged() { return !!session; }
  function cloudReady() { return window.Cloud && Cloud.available(); }

  function toRow(t) {
    return { id: t.id, title: t.title, category: t.category, difficulty: t.difficulty, status: t.status, notes: t.notes || "", tags: t.tags || [], media: t.media || [], photos: t.photos || [], favorite: !!t.favorite, meta: t.meta || {} };
  }
  function rowToLocal(r) {
    return { id: r.id, title: r.title, category: r.category, difficulty: r.difficulty, status: r.status, notes: r.notes || "", tags: r.tags || [], media: r.media || [], photos: r.photos || [], favorite: !!r.favorite, meta: r.meta || {}, createdAt: Date.parse(r.created_at) || Date.now(), updatedAt: Date.parse(r.updated_at) || Date.now(), remote: true };
  }
  function toRoutineRow(r) { return { id: r.id, name: r.name, notes: r.notes || "", trick_ids: r.trickIds || [] }; }
  function routineRowToLocal(r) { return { id: r.id, name: r.name, notes: r.notes || "", trickIds: r.trick_ids || [], createdAt: Date.parse(r.created_at) || Date.now(), updatedAt: Date.parse(r.updated_at) || Date.now(), remote: true }; }
  function toGigRow(g) { return { id: g.id, date: g.date || null, client: g.client || "", venue: g.venue || "", fee: (g.fee === "" || g.fee == null) ? null : Number(g.fee), notes: g.notes || "", trick_ids: g.trickIds || [] }; }
  function gigRowToLocal(g) { return { id: g.id, date: g.date || "", client: g.client || "", venue: g.venue || "", fee: g.fee == null ? "" : g.fee, notes: g.notes || "", trickIds: g.trick_ids || [], createdAt: Date.parse(g.created_at) || Date.now(), updatedAt: Date.parse(g.updated_at) || Date.now(), remote: true }; }

  // Escritura a la nube (best-effort; si falla, queda local y se resube al sincronizar)
  function syncTrick(t) { if (logged() && cloudReady()) Cloud.upsertTrick(toRow(t)).then(function () { t.remote = true; }).catch(function () {}); }
  function syncDelete(id, wasRemote) { if (logged() && cloudReady() && wasRemote) Cloud.deleteTrick(id).catch(function () {}); }
  function syncRoutine(r) { if (logged() && cloudReady()) Cloud.upsertRoutine(toRoutineRow(r)).then(function () { r.remote = true; }).catch(function () {}); }
  function syncDeleteRoutine(id, wasRemote) { if (logged() && cloudReady() && wasRemote) Cloud.deleteRoutine(id).catch(function () {}); }
  function syncGig(g) { if (logged() && cloudReady()) Cloud.upsertGig(toGigRow(g)).then(function () { g.remote = true; }).catch(function () {}); }
  function syncDeleteGig(id, wasRemote) { if (logged() && cloudReady() && wasRemote) Cloud.deleteGig(id).catch(function () {}); }

  var syncing = false;
  function reflectSync() { var bl = document.getElementById("syncBtn"); if (bl) bl.classList.toggle("spinning", syncing); }
  function syncOnLogin(silent) {
    if (!logged() || !cloudReady()) return Promise.resolve();
    if (navigator.onLine === false) return Promise.resolve(); // offline: usa caché local
    syncing = true; reflectSync();
    // 1) subir los locales que aún no están en la nube
    var locals = state.tricks.filter(function (t) { return !t.remote; });
    var chain = Promise.resolve();
    locals.forEach(function (t) {
      chain = chain.then(function () {
        if (!isUuid(t.id)) t.id = uid();
        return Cloud.upsertTrick(toRow(t)).then(function () { t.remote = true; }).catch(function () {});
      });
    });
    // 2) traer todo de la nube y fusionar (la nube manda)
    // subir rutinas locales pendientes
    state.routines.filter(function (r) { return !r.remote; }).forEach(function (r) {
      chain = chain.then(function () {
        if (!isUuid(r.id)) r.id = uid();
        return Cloud.upsertRoutine(toRoutineRow(r)).then(function () { r.remote = true; }).catch(function () {});
      });
    });
    state.gigs.filter(function (g) { return !g.remote; }).forEach(function (g) {
      chain = chain.then(function () {
        if (!isUuid(g.id)) g.id = uid();
        return Cloud.upsertGig(toGigRow(g)).then(function () { g.remote = true; }).catch(function () {});
      });
    });
    return chain.then(function () { return Cloud.listTricks(); }).then(function (rows) {
      var byId = {};
      state.tricks.forEach(function (t) { if (!t.remote) byId[t.id] = t; }); // conserva pendientes
      rows.forEach(function (r) { byId[r.id] = rowToLocal(r); });
      state.tricks = Object.keys(byId).map(function (k) { return byId[k]; });
      return Cloud.listRoutines();
    }).then(function (rrows) {
      var rById = {};
      state.routines.forEach(function (r) { if (!r.remote) rById[r.id] = r; });
      rrows.forEach(function (r) { rById[r.id] = routineRowToLocal(r); });
      state.routines = Object.keys(rById).map(function (k) { return rById[k]; });
      return Cloud.listGigs();
    }).then(function (grows) {
      var gById = {};
      state.gigs.forEach(function (g) { if (!g.remote) gById[g.id] = g; });
      grows.forEach(function (g) { gById[g.id] = gigRowToLocal(g); });
      state.gigs = Object.keys(gById).map(function (k) { return gById[k]; });
      save();
      syncing = false; reflectSync();
      if (isMain()) route();
      if (!silent) toast("Sincronizado");
    }).catch(function () { syncing = false; reflectSync(); if (!silent) toast("No se pudo sincronizar"); });
  }
  function isMain() { var h = location.hash || "#/"; return h === "#/" || h === "" || h === "#/rutinas" || h === "#/bolos" || h === "#/ajustes" || h === "#/cuenta"; }
  var MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  function fmtDate(d) { if (!d) return "Sin fecha"; var p = String(d).split("-"); if (p.length < 3) return d; return (+p[2]) + " " + (MONTHS[(+p[1]) - 1] || "") + " " + p[0]; }

  /* --------------------------- parseo de vídeo ------------------------ */
  function parseVideo(url) {
    var u = (url || "").trim();
    var yt = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
    if (yt) return { provider: "youtube", id: yt[1], embed: "https://www.youtube-nocookie.com/embed/" + yt[1], thumb: "https://i.ytimg.com/vi/" + yt[1] + "/hqdefault.jpg", url: u };
    var vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) return { provider: "vimeo", id: vm[1], embed: "https://player.vimeo.com/video/" + vm[1], thumb: null, url: u };
    return { provider: "link", id: null, embed: null, thumb: null, url: u };
  }
  // Best-effort: intenta título/miniatura vía noembed (soporta CORS). Silencioso si falla.
  function fetchMeta(url) {
    return new Promise(function (resolve) {
      try {
        var ctrl = new AbortController();
        var to = setTimeout(function () { ctrl.abort(); }, 4500);
        fetch("https://noembed.com/embed?url=" + encodeURIComponent(url), { signal: ctrl.signal })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (j) { clearTimeout(to); resolve(j && !j.error ? { title: j.title || null, thumb: j.thumbnail_url || null } : null); })
          .catch(function () { resolve(null); });
      } catch (e) { resolve(null); }
    });
  }

  /* ------------------------------ navegación -------------------------- */
  function tabbar(active) {
    var tabs = [
      { h: "#/", ic: "library", t: "Biblioteca", k: "lib" },
      { h: "#/rutinas", ic: "list", t: "Rutinas", k: "rut" },
      { h: "#/bolos", ic: "calendar", t: "Bolos", k: "gig" },
      { h: "#/incluidos", ic: "wand", t: "Incluidos", k: "inc" },
      { h: "#/ajustes", ic: "sliders", t: "Ajustes", k: "set" }
    ];
    return '<nav class="tabbar"><div class="tbbrand">' + icon("hat") + "<span>The Magic App</span></div>" + tabs.map(function (x) {
      return '<a href="' + x.h + '" class="' + (active === x.k ? "on" : "") + '">' + icon(x.ic) + "<span>" + x.t + "</span></a>";
    }).join("") + "</nav>";
  }
  function mountTabbar(active) {
    var old = document.getElementById("tabbarEl"); if (old) old.remove();
    var n = el(tabbar(active)); n.id = "tabbarEl"; document.body.appendChild(n);
  }
  function clearTabbar() { var old = document.getElementById("tabbarEl"); if (old) old.remove(); var f = document.getElementById("fabEl"); if (f) f.remove(); }
  function mountFab(hash) {
    var old = document.getElementById("fabEl"); if (old) old.remove();
    var f = el('<button class="fab" id="fabEl">' + icon("plus") + "</button>");
    f.addEventListener("click", function () { location.hash = hash || "#/nuevo"; });
    document.body.appendChild(f);
  }

  /* ============================ BIBLIOTECA ============================= */
  var filter = { q: "", cat: "all", status: "all", fav: false };

  function renderLibrary() {
    mountTabbar("lib"); mountFab();
    var tricks = state.tricks.slice().sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });

    var catChips = ['<div class="chip ' + (filter.cat === "all" ? "active" : "") + '" data-cat="all">Todas</div>']
      .concat(state.categories.map(function (c) {
        return '<div class="chip ' + (filter.cat === c ? "active" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</div>";
      })).join("");

    var statusChips = [["all", "Estado"], ["poraprender", STATUS.poraprender], ["aprendiendo", STATUS.aprendiendo], ["dominado", STATUS.dominado]]
      .map(function (s) { return '<div class="chip ' + (filter.status === s[0] ? "active" : "") + '" data-st="' + s[0] + '">' + s[1] + "</div>"; }).join("");

    var filtered = tricks.filter(function (t) {
      if (filter.cat !== "all" && t.category !== filter.cat) return false;
      if (filter.status !== "all" && t.status !== filter.status) return false;
      if (filter.fav && !t.favorite) return false;
      if (filter.q) {
        var q = filter.q.toLowerCase();
        if (searchText(t).indexOf(q) < 0) return false;
      }
      return true;
    });

    var body;
    if (state.tricks.length === 0) {
      body = '<div class="empty"><div class="big">' + icon("hat") + '</div><h3>Tu biblioteca está vacía</h3>' +
        "<p>Guarda aquí cada truco que aprendas: notas, vídeos y tu progreso.<br>Empieza creando el primero.</p>" +
        '<button class="btn" onclick="location.hash=\'#/nuevo\'">Crear mi primer truco</button></div>';
    } else if (filtered.length === 0) {
      body = '<div class="empty"><div class="big">' + icon("search") + '</div><h3>Sin resultados</h3><p>Prueba a cambiar los filtros o la búsqueda.</p></div>';
    } else {
      body = '<div class="count">' + filtered.length + (filtered.length === 1 ? " truco" : " trucos") + "</div>" +
        '<div class="cards">' + filtered.map(trickCard).join("") + "</div>";
    }

    view.innerHTML =
      '<div class="screen wide">' +
      '<div class="appbar"><span class="brandmark">' + icon("hat") + '<span class="wm">The Magic App</span></span>' +
      '<h1 class="pagetitle">Biblioteca</h1>' +
      '<span class="spacer"></span>' +
      (logged() && cloudReady() ? '<button class="iconbtn ' + (syncing ? "spinning" : "") + '" id="syncBtn" title="Sincronizar">' + icon("cloud") + "</button>" : "") +
      '<button class="iconbtn ' + (filter.fav ? "on" : "") + '" id="favToggle" title="Favoritos">' + icon(filter.fav ? "starfill" : "star") + "</button>" +
      '<button class="iconbtn" id="acctBtn" title="Cuenta">' + icon("user") + "</button></div>" +
      '<div class="search"><span class="mag">' + icon("search", "i-sm") + '</span><input id="q" placeholder="Buscar en mi biblioteca…" value="' + esc(filter.q) + '"></div>' +
      '<div class="chips">' + catChips + "</div>" +
      '<div class="chips">' + statusChips + "</div>" +
      body +
      "</div>";

    var q = document.getElementById("q");
    q.addEventListener("input", function () { filter.q = q.value; refreshCards(); });
    document.getElementById("favToggle").addEventListener("click", function () { filter.fav = !filter.fav; renderLibrary(); });
    document.getElementById("acctBtn").addEventListener("click", function () { location.hash = "#/cuenta"; });
    var sb = document.getElementById("syncBtn"); if (sb) sb.addEventListener("click", function () { syncOnLogin(false); });
    view.querySelectorAll(".chip[data-cat]").forEach(function (c) { c.addEventListener("click", function () { filter.cat = c.getAttribute("data-cat"); renderLibrary(); }); });
    view.querySelectorAll(".chip[data-st]").forEach(function (c) { c.addEventListener("click", function () { filter.status = c.getAttribute("data-st"); renderLibrary(); }); });
    bindCards();
  }
  function refreshCards() {
    // re-render solo tarjetas al escribir (mantiene foco en el buscador)
    var q = filter.q.toLowerCase();
    var filtered = state.tricks.slice().sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); }).filter(function (t) {
      if (filter.cat !== "all" && t.category !== filter.cat) return false;
      if (filter.status !== "all" && t.status !== filter.status) return false;
      if (filter.fav && !t.favorite) return false;
      if (q && searchText(t).indexOf(q) < 0) return false;
      return true;
    });
    var holder = view.querySelector(".cards"); var countEl = view.querySelector(".count");
    if (!holder) { renderLibrary(); return; }
    if (filtered.length === 0) {
      holder.className = "";
      holder.innerHTML = '<div class="empty"><div class="big">' + icon("search") + '</div><h3>Sin resultados</h3><p>Prueba a cambiar los filtros o la búsqueda.</p></div>';
      if (countEl) countEl.textContent = "";
      return;
    }
    holder.className = "cards";
    holder.innerHTML = filtered.map(trickCard).join("");
    if (countEl) countEl.textContent = filtered.length + (filtered.length === 1 ? " truco" : " trucos");
    bindCards();
  }
  function bindCards() {
    view.querySelectorAll(".card[data-id]").forEach(function (c) {
      c.addEventListener("click", function () { location.hash = "#/truco/" + c.getAttribute("data-id"); });
    });
  }
  function trickCard(t) {
    var vid = (t.media || []).filter(function (m) { return m.provider !== "link"; })[0] || (t.media || [])[0];
    var thumb = vid && vid.thumb;
    var thumbHtml = thumb
      ? '<img src="' + esc(thumb) + '" loading="lazy" alt="">' + '<span class="play">' + icon("play", "i-sm") + "</span>"
      : '<span class="ph">' + icon(vid ? "film" : "cards") + "</span>";
    return (
      '<div class="card" data-id="' + t.id + '">' +
      '<div class="thumb">' + thumbHtml + (t.favorite ? '<span class="fav">' + icon("starfill", "i-sm") + "</span>" : "") + "</div>" +
      '<div class="body"><h3>' + esc(t.title) + "</h3>" +
      '<div class="meta">' + esc(t.category || "Sin categoría") + "</div>" +
      '<div class="foot"><span class="pill df">' + (DIFF[t.difficulty] || "—") + "</span>" +
      '<span class="pill st-' + (t.status || "poraprender") + '">' + (STATUS[t.status] || "") + "</span></div>" +
      "</div></div>"
    );
  }

  /* ============================ DETALLE ============================== */
  function renderDetail(id) {
    var t = getTrick(id);
    if (!t) { location.hash = "#/"; return; }
    clearTabbar();

    var media = (t.media || []).map(function (m, i) {
      var player;
      if (m.provider === "upload" && m.path) player = '<div class="player" id="upl' + i + '" data-path="' + esc(m.path) + '"></div>';
      else if (m.embed) player = '<div class="player"><iframe src="' + esc(m.embed) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>';
      else player = '<a class="linkcard" href="' + esc(m.url) + '" target="_blank" rel="noopener"><span class="ic">' + icon("link") + '</span><span class="n">' + esc(m.title || m.url) + '</span><span class="go">' + icon("chev", "i-sm") + "</span></a>";
      var extras = "";
      if (m.chapters && m.chapters.length) extras += '<div class="chapters">' + m.chapters.map(function (c) { return '<div class="chap"><span class="tm">' + esc(c.time) + "</span><span>" + esc(c.title) + "</span></div>"; }).join("") + "</div>";
      if (m.transcript) extras += '<details class="transcript"><summary>Transcripción</summary><div class="tr">' + esc(m.transcript) + "</div></details>";
      return player + extras;
    }).join("");

    var tags = (t.tags || []).length ? '<div class="sec-label">Etiquetas</div><div class="tagchips">' + t.tags.map(function (x) { return '<span class="tagchip">#' + esc(x) + "</span>"; }).join("") + "</div>" : "";
    var meta = t.meta || {};
    var specRows = META_ORDER.filter(function (k) { return meta[k]; }).map(function (k) {
      return '<div class="specrow"><span class="k">' + META_LABELS[k] + '</span><span class="v">' + esc(meta[k]) + "</span></div>";
    }).join("");
    var specs = specRows ? '<div class="sec-label">Ficha</div><div class="specs">' + specRows + "</div>" : "";
    var photosHtml = (t.photos || []).length ? '<div class="sec-label">Fotos</div><div class="photogrid">' + t.photos.map(function (p) { return '<div class="photocell view"><span class="ph-img" data-load="' + esc(p.path) + '"></span></div>'; }).join("") + "</div>" : "";

    view.innerHTML =
      '<div class="screen">' +
      '<div class="pagehead"><button class="back" onclick="location.hash=\'#/\'">' + icon("back") + '</button><h1>Truco</h1>' +
      '<span style="flex:1"></span>' +
      '<button class="iconbtn ' + (t.favorite ? "on" : "") + '" id="favBtn">' + icon(t.favorite ? "starfill" : "star") + "</button>" +
      '<button class="iconbtn" id="editBtn">' + icon("edit") + "</button></div>" +
      '<h1 class="title">' + esc(t.title) + "</h1>" +
      '<div class="detail-badges">' +
      '<span class="pill df">' + (DIFF[t.difficulty] || "—") + "</span>" +
      '<span class="pill st-' + (t.status || "poraprender") + '">' + (STATUS[t.status] || "") + "</span>" +
      '<span class="tagchip">' + esc(t.category || "Sin categoría") + "</span></div>" +
      (media ? '<div class="sec-label">Vídeos</div>' + media : "") +
      photosHtml +
      specs +
      (t.notes ? '<div class="sec-label">Notas</div><div class="notes">' + esc(t.notes) + "</div>" : "") +
      tags +
      '<div class="sec-label">Estado de aprendizaje</div>' +
      '<div class="seg" id="statusSeg">' +
      Object.keys(STATUS).map(function (k) { return '<button data-st="' + k + '" class="' + (t.status === k ? "on" : "") + '">' + STATUS[k] + "</button>"; }).join("") +
      "</div>" +
      '<button class="btn ghost" id="editBtn2">Editar truco</button>' +
      '<button class="btn danger" id="delBtn">Eliminar</button>' +
      "</div>";

    document.getElementById("favBtn").addEventListener("click", function () { t.favorite = !t.favorite; t.updatedAt = Date.now(); save(); syncTrick(t); renderDetail(id); });
    document.getElementById("editBtn").addEventListener("click", function () { location.hash = "#/editar/" + id; });
    document.getElementById("editBtn2").addEventListener("click", function () { location.hash = "#/editar/" + id; });
    view.querySelectorAll("#statusSeg button").forEach(function (b) {
      b.addEventListener("click", function () { t.status = b.getAttribute("data-st"); t.updatedAt = Date.now(); save(); syncTrick(t); renderDetail(id); toast("Estado actualizado"); });
    });
    document.getElementById("delBtn").addEventListener("click", function () {
      if (confirm("¿Eliminar “" + t.title + "”? No se puede deshacer.")) {
        var wasRemote = t.remote;
        state.tricks = state.tricks.filter(function (x) { return x.id !== id; }); save();
        syncDelete(id, wasRemote);
        toast("Truco eliminado"); location.hash = "#/";
      }
    });

    // Cargar reproductores de vídeos propios con URL firmada (caduca; se pide al ver)
    view.querySelectorAll(".player[data-path]").forEach(function (box) {
      if (cloudReady()) {
        Cloud.signedUrl(box.getAttribute("data-path")).then(function (url) {
          box.innerHTML = url
            ? '<video controls playsinline preload="metadata" src="' + esc(url) + '" style="position:absolute;inset:0;width:100%;height:100%"></video>'
            : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#fff">Vídeo no disponible</div>';
        });
      } else {
        box.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#fff">Inicia sesión para ver este vídeo</div>';
      }
    });
    // Cargar fotos con URL firmada (bucket photos)
    view.querySelectorAll(".ph-img[data-load]").forEach(function (sp) {
      var path = sp.getAttribute("data-load"); if (!path || !cloudReady()) return;
      Cloud.signedUrl(path, "photos").then(function (url) { if (url) sp.style.backgroundImage = "url(" + url + ")"; });
    });
  }

  /* ========================= CREAR / EDITAR ========================== */
  var draftMedia = [], draftPhotos = [];
  function renderForm(id) {
    clearTabbar();
    var editing = !!id;
    var t = editing ? getTrick(id) : null;
    if (editing && !t) { location.hash = "#/"; return; }
    draftMedia = t ? (t.media || []).slice() : [];
    draftPhotos = t ? (t.photos || []).slice() : [];
    var m = (t && t.meta) ? t.meta : {};
    var mv = function (k) { return esc(m[k] || ""); };

    var catOptions = state.categories.map(function (c) { return '<option value="' + esc(c) + '">'; }).join("");

    view.innerHTML =
      '<div class="screen">' +
      '<div class="pagehead"><button class="back" onclick="history.back()">' + icon("back") + '</button><h1>' + (editing ? "Editar truco" : "Nuevo truco") + "</h1></div>" +
      '<div class="field"><label>Título</label><input id="fTitle" placeholder="Ej. Carta ambiciosa" value="' + esc(t ? t.title : "") + '"></div>' +
      '<div class="row">' +
      '<div class="field"><label>Categoría</label><input id="fCat" list="cats" placeholder="Elige o crea…" value="' + esc(t ? t.category : "") + '"><datalist id="cats">' + catOptions + "</datalist></div>" +
      "</div>" +
      '<div class="field"><label>Dificultad</label><div class="seg" id="fDiff">' +
      Object.keys(DIFF).map(function (k) { return '<button type="button" data-v="' + k + '" class="' + ((t ? t.difficulty : "medio") === k ? "on" : "") + '">' + DIFF[k] + "</button>"; }).join("") +
      "</div></div>" +
      '<div class="field"><label>Estado</label><div class="seg" id="fStatus">' +
      Object.keys(STATUS).map(function (k) { return '<button type="button" data-v="' + k + '" class="' + ((t ? t.status : "poraprender") === k ? "on" : "") + '">' + STATUS[k] + "</button>"; }).join("") +
      "</div></div>" +
      '<div class="field"><label>Vídeos (pega una URL de YouTube, Vimeo…)</label>' +
      '<div class="vidadd"><input id="fVid" placeholder="https://…" inputmode="url"><button class="btn small" id="addVid" type="button">Añadir</button></div>' +
      (logged() ? '<button class="btn ghost" id="upVid" type="button" style="margin-top:10px">' + icon("upload", "i-sm") + ' Subir un vídeo propio</button><input type="file" id="fFile" accept="video/*" style="display:none">' :
        '<div class="hint" style="margin-top:8px">Inicia sesión (Ajustes → Cuenta) para <b>subir tus propios vídeos</b>.</div>') +
      '<div class="vidlist" id="vidList"></div>' +
      '<div class="hint">Se incrusta el reproductor y se intenta sacar la miniatura y el título automáticamente.</div></div>' +
      '<div class="field"><label>Fotos paso a paso</label>' +
      (logged() ? '<button class="btn ghost" id="addPhoto" type="button">' + icon("plus", "i-sm") + ' Añadir fotos</button><input type="file" id="fPhoto" accept="image/*" multiple style="display:none">' :
        '<div class="hint">Inicia sesión para añadir fotos a tus trucos.</div>') +
      '<div class="photogrid" id="photoList"></div></div>' +
      '<div class="field"><label>Notas / explicación</label><textarea id="fNotes" placeholder="El secreto, el manejo, la charla, tus recordatorios…">' + esc(t ? t.notes : "") + "</textarea></div>" +
      '<div class="field"><label>Etiquetas (separadas por comas)</label><input id="fTags" placeholder="control, empalme, doble volteo" value="' + esc(t && t.tags ? t.tags.join(", ") : "") + '"></div>' +
      '<div class="sec-label">Detalles profesionales</div>' +
      '<div class="field"><label>Tipo</label><div class="seg" id="mKind">' +
      KINDS.map(function (k) { return '<button type="button" data-v="' + k + '" class="' + (m.kind === k ? "on" : "") + '">' + k + "</button>"; }).join("") +
      "</div></div>" +
      '<div class="row"><div class="field"><label>Duración</label><input id="mDuration" placeholder="p. ej. 3 min" value="' + mv("duration") + '"></div>' +
      '<div class="field"><label>Reset</label><input id="mReset" placeholder="instantáneo / 30 s" value="' + mv("reset") + '"></div></div>' +
      '<div class="field"><label>Ángulos</label><input id="mAngles" placeholder="todos / frontal / mesa" value="' + mv("angles") + '"></div>' +
      '<div class="field"><label>Materiales / props</label><input id="mProps" placeholder="baraja, moneda, gimmick…" value="' + mv("props") + '"></div>' +
      '<div class="field"><label>Técnicas (sleights)</label><input id="mSleights" placeholder="doble volteo, empalme…" value="' + mv("sleights") + '"></div>' +
      '<div class="field"><label>Fuente / crédito</label><input id="mSource" placeholder="creador, libro, página… (respeta al creador)" value="' + mv("source") + '"></div>' +
      '<button class="btn" id="saveBtn">' + (editing ? "Guardar cambios" : "Crear truco") + "</button>" +
      '<button class="btn ghost" onclick="history.back()">Cancelar</button>' +
      "</div>";

    paintDraftMedia();
    paintDraftPhotos();

    view.querySelectorAll("#fDiff button").forEach(function (b) { b.addEventListener("click", function () { setSeg("#fDiff", b); }); });
    view.querySelectorAll("#fStatus button").forEach(function (b) { b.addEventListener("click", function () { setSeg("#fStatus", b); }); });
    view.querySelectorAll("#mKind button").forEach(function (b) {
      b.addEventListener("click", function () {
        var wasOn = b.classList.contains("on");
        view.querySelectorAll("#mKind button").forEach(function (x) { x.classList.remove("on"); });
        if (!wasOn) b.classList.add("on");
      });
    });

    document.getElementById("addVid").addEventListener("click", addVideoFromInput);
    document.getElementById("fVid").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addVideoFromInput(); } });

    var upBtn = document.getElementById("upVid");
    if (upBtn) {
      var fileInp = document.getElementById("fFile");
      upBtn.addEventListener("click", function () { fileInp.click(); });
      fileInp.addEventListener("change", function () {
        var file = fileInp.files[0]; if (!file) return;
        if (file.size > 5 * 1024 * 1024 * 1024) { toast("Vídeo demasiado grande (máx 5 GB)"); return; }
        upBtn.disabled = true; upBtn.textContent = "Subiendo… 0%";
        var item = { provider: "upload", path: null, title: file.name, thumb: null, uploading: true };
        draftMedia.push(item); paintDraftMedia();
        var resetBtn = function () { upBtn.disabled = false; upBtn.innerHTML = icon("upload", "i-sm") + " Subir un vídeo propio"; };
        Cloud.uploadVideo(file, function (pct) { upBtn.textContent = "Subiendo… " + pct + "%"; }).then(function (res) {
          item.path = res.path; item.uploading = false; resetBtn();
          paintDraftMedia(); toast("Vídeo subido");
        }).catch(function (err) {
          draftMedia = draftMedia.filter(function (m) { return m !== item; });
          resetBtn(); paintDraftMedia();
          toast((err && /413|exceed|size/i.test(err.message || "")) ? "Vídeo demasiado grande para el límite actual" : "No se pudo subir");
        });
      });
    }

    var addPhoto = document.getElementById("addPhoto");
    if (addPhoto) {
      var photoInp = document.getElementById("fPhoto");
      addPhoto.addEventListener("click", function () { photoInp.click(); });
      photoInp.addEventListener("change", function () {
        var files = Array.prototype.slice.call(photoInp.files || []);
        photoInp.value = "";
        files.forEach(function (file) {
          if (file.size > 25 * 1024 * 1024) { toast("Imagen muy grande (máx 25 MB)"); return; }
          var ph = { path: null, uploading: true };
          draftPhotos.push(ph); paintDraftPhotos();
          Cloud.uploadPhoto(file).then(function (res) { ph.path = res.path; ph.uploading = false; paintDraftPhotos(); })
            .catch(function () { draftPhotos = draftPhotos.filter(function (x) { return x !== ph; }); paintDraftPhotos(); toast("No se pudo subir la foto"); });
        });
      });
    }

    document.getElementById("saveBtn").addEventListener("click", function () { saveForm(id); });
  }
  function setSeg(sel, btn) { view.querySelectorAll(sel + " button").forEach(function (x) { x.classList.remove("on"); }); btn.classList.add("on"); }
  function segValue(sel) { var on = view.querySelector(sel + " button.on"); return on ? on.getAttribute("data-v") : null; }

  function addVideoFromInput() {
    var inp = document.getElementById("fVid");
    var url = inp.value.trim();
    if (!url) { toast("Pega una URL"); return; }
    var v = parseVideo(url);
    var item = { provider: v.provider, url: v.url, id: v.id, embed: v.embed, thumb: v.thumb, title: null };
    draftMedia.push(item); inp.value = ""; paintDraftMedia();
    // Extraer contenido: función de servidor si hay sesión; si no, metadatos básicos
    if (logged() && cloudReady()) {
      var addBtn = document.getElementById("addVid");
      if (addBtn) { addBtn.disabled = true; addBtn.textContent = "Extrayendo…"; }
      Cloud.extract(url).then(function (meta) {
        if (meta) {
          if (meta.title) item.title = meta.title;
          if (!item.thumb && meta.thumbnail) item.thumb = meta.thumbnail;
          if (meta.description) item.description = meta.description;
          if (meta.chapters && meta.chapters.length) item.chapters = meta.chapters;
          if (meta.transcript) item.transcript = meta.transcript;
          paintDraftMedia();
          var extras = (item.chapters ? item.chapters.length + " capítulos" : "") + (item.transcript ? (item.chapters ? " · " : "") + "transcripción" : "");
          toast(extras ? "Contenido extraído: " + extras : "Datos del vídeo listos");
        }
        if (addBtn) { addBtn.disabled = false; addBtn.textContent = "Añadir"; }
      });
    } else {
      fetchMeta(url).then(function (meta) {
        if (!meta) return;
        if (meta.title) item.title = meta.title;
        if (!item.thumb && meta.thumb) item.thumb = meta.thumb;
        paintDraftMedia();
      });
    }
  }
  function paintDraftMedia() {
    var list = document.getElementById("vidList");
    if (!list) return;
    list.innerHTML = draftMedia.map(function (m, i) {
      var thumb = m.thumb ? '<img src="' + esc(m.thumb) + '" alt="">' : icon(m.provider === "upload" ? "film" : m.provider === "link" ? "link" : "play", "i-sm");
      var sub = m.uploading ? "subiendo…" : (m.provider === "upload" ? "vídeo propio" : m.provider);
      return '<div class="vidrow"><div class="vt">' + thumb + "</div>" +
        '<div class="vi"><div class="n">' + esc(m.title || m.url || "vídeo") + '</div><div class="p">' + esc(sub) + "</div></div>" +
        '<button class="x" data-i="' + i + '" type="button">×</button></div>';
    }).join("");
    list.querySelectorAll(".x").forEach(function (b) {
      b.addEventListener("click", function () { draftMedia.splice(parseInt(b.getAttribute("data-i"), 10), 1); paintDraftMedia(); });
    });
  }
  function paintDraftPhotos() {
    var list = document.getElementById("photoList");
    if (!list) return;
    list.innerHTML = draftPhotos.map(function (ph, i) {
      var inner = ph.uploading ? '<span class="mini-spin"></span>' : '<span class="ph-img" data-load="' + esc(ph.path || "") + '"></span>';
      return '<div class="photocell">' + inner + '<button class="x" data-i="' + i + '" type="button">×</button></div>';
    }).join("");
    list.querySelectorAll(".x").forEach(function (b) {
      b.addEventListener("click", function () { draftPhotos.splice(parseInt(b.getAttribute("data-i"), 10), 1); paintDraftPhotos(); });
    });
    list.querySelectorAll(".ph-img[data-load]").forEach(function (sp) {
      var path = sp.getAttribute("data-load"); if (!path || !cloudReady()) return;
      Cloud.signedUrl(path, "photos").then(function (url) { if (url) sp.style.backgroundImage = "url(" + url + ")"; });
    });
  }
  function saveForm(id) {
    var title = document.getElementById("fTitle").value.trim();
    if (!title) { toast("Ponle un título"); return; }
    var cat = document.getElementById("fCat").value.trim() || "Otros";
    if (state.categories.indexOf(cat) < 0) state.categories.push(cat);
    var tags = document.getElementById("fTags").value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    var mval = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ""; };
    var kindOn = view.querySelector("#mKind button.on");
    var meta = { kind: kindOn ? kindOn.getAttribute("data-v") : "", duration: mval("mDuration"), reset: mval("mReset"), angles: mval("mAngles"), props: mval("mProps"), sleights: mval("mSleights"), source: mval("mSource") };
    Object.keys(meta).forEach(function (k) { if (!meta[k]) delete meta[k]; });
    var data = {
      title: title, category: cat,
      difficulty: segValue("#fDiff") || "medio",
      status: segValue("#fStatus") || "poraprender",
      notes: document.getElementById("fNotes").value.trim(),
      tags: tags, media: draftMedia.slice(), photos: draftPhotos.filter(function (p) { return p.path; }).map(function (p) { return { path: p.path }; }), meta: meta, updatedAt: Date.now()
    };
    if (id) {
      var t = getTrick(id); if (!t) { location.hash = "#/"; return; }
      Object.keys(data).forEach(function (k) { t[k] = data[k]; });
      save(); syncTrick(t); toast("Cambios guardados"); location.hash = "#/truco/" + id;
    } else {
      data.id = uid(); data.createdAt = Date.now(); data.favorite = false; data.remote = false;
      state.tricks.push(data); save(); syncTrick(data); toast("Truco creado"); location.hash = "#/truco/" + data.id;
    }
  }

  /* ============================ RUTINAS ============================== */
  function renderRoutines() {
    mountTabbar("rut"); mountFab("#/rutina-nueva");
    var rs = state.routines.slice().sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    var body;
    if (!rs.length) {
      body = '<div class="empty"><div class="big">' + icon("list") + '</div><h3>Sin rutinas todavía</h3>' +
        "<p>Monta tus espectáculos ordenando trucos, y ten las chuletas a mano en escena.</p>" +
        '<button class="btn" onclick="location.hash=\'#/rutina-nueva\'">Crear una rutina</button></div>';
    } else {
      body = '<div class="rlist">' + rs.map(function (r) {
        var n = (r.trickIds || []).length;
        return '<div class="rrow" data-id="' + r.id + '"><div class="ri">' + icon("list") + "</div>" +
          '<div class="rt"><div class="n">' + esc(r.name) + '</div><div class="d">' + n + (n === 1 ? " truco" : " trucos") + "</div></div>" +
          '<span class="go">' + icon("chev") + "</span></div>";
      }).join("") + "</div>";
    }
    view.innerHTML = '<div class="screen"><h1 class="title">Rutinas</h1><p class="subtitle">Tus sets y espectáculos.</p>' + body + "</div>";
    view.querySelectorAll(".rrow[data-id]").forEach(function (row) { row.addEventListener("click", function () { location.hash = "#/rutina/" + row.getAttribute("data-id"); }); });
  }

  function renderRoutineForm(id) {
    clearTabbar();
    var r = id ? getRoutine(id) : null;
    if (id && !r) { location.hash = "#/rutinas"; return; }
    view.innerHTML =
      '<div class="screen"><div class="pagehead"><button class="back" onclick="history.back()">' + icon("back") + "</button><h1>" + (id ? "Editar rutina" : "Nueva rutina") + "</h1></div>" +
      '<div class="field"><label>Nombre</label><input id="rName" placeholder="Ej. Set de close-up (15 min)" value="' + esc(r ? r.name : "") + '"></div>' +
      '<div class="field"><label>Notas</label><textarea id="rNotes" placeholder="Notas del set, transiciones, orden…">' + esc(r ? r.notes : "") + "</textarea></div>" +
      '<button class="btn" id="rSave">' + (id ? "Guardar" : "Crear rutina") + "</button>" +
      '<button class="btn ghost" onclick="history.back()">Cancelar</button></div>';
    document.getElementById("rSave").addEventListener("click", function () {
      var name = document.getElementById("rName").value.trim();
      if (!name) { toast("Ponle un nombre"); return; }
      var notes = document.getElementById("rNotes").value.trim();
      if (id) { r.name = name; r.notes = notes; r.updatedAt = Date.now(); save(); syncRoutine(r); location.hash = "#/rutina/" + id; }
      else {
        var nr = { id: uid(), name: name, notes: notes, trickIds: [], createdAt: Date.now(), updatedAt: Date.now(), remote: false };
        state.routines.push(nr); save(); syncRoutine(nr); location.hash = "#/rutina/" + nr.id;
      }
    });
  }

  function renderRoutineDetail(id) {
    var r = getRoutine(id);
    if (!r) { location.hash = "#/rutinas"; return; }
    clearTabbar();
    var items = (r.trickIds || []).map(function (tid, i) {
      var t = getTrick(tid);
      if (!t) return "";
      return '<div class="ritem"><div class="idx">' + (i + 1) + "</div>" +
        '<div class="rc" data-open="' + tid + '"><div class="n">' + esc(t.title) + '</div><div class="d">' + esc(t.category || "") + (t.meta && t.meta.duration ? " · " + esc(t.meta.duration) : "") + "</div></div>" +
        '<div class="ract"><button data-up="' + i + '">' + icon("up", "i-sm") + '</button><button data-down="' + i + '">' + icon("down", "i-sm") + '</button><button data-del="' + i + '">' + icon("x", "i-sm") + "</button></div></div>";
    }).join("");
    var empty = !(r.trickIds || []).length;

    view.innerHTML =
      '<div class="screen"><div class="pagehead"><button class="back" onclick="location.hash=\'#/rutinas\'">' + icon("back") + '</button><h1>Rutina</h1>' +
      '<span style="flex:1"></span><button class="iconbtn" id="rEdit">' + icon("edit") + "</button></div>" +
      '<h1 class="title">' + esc(r.name) + "</h1>" +
      (r.notes ? '<div class="notes" style="margin:6px 0 4px">' + esc(r.notes) + "</div>" : "") +
      (empty ? '<div class="empty" style="padding:36px 10px"><div class="big">' + icon("cards") + "</div><p>Aún no has añadido trucos.</p></div>"
        : '<div class="sec-label">Orden del set</div><div class="ritems">' + items + "</div>") +
      '<button class="btn ghost" id="rAdd">Añadir truco</button>' +
      (empty ? "" : '<button class="btn" id="rPerform">' + icon("play", "i-sm") + " Actuar</button>") +
      '<button class="btn danger" id="rDel">Eliminar rutina</button></div>';

    document.getElementById("rEdit").addEventListener("click", function () { location.hash = "#/rutina-edit/" + id; });
    document.getElementById("rAdd").addEventListener("click", function () { location.hash = "#/rutina-add/" + id; });
    var perf = document.getElementById("rPerform"); if (perf) perf.addEventListener("click", function () { location.hash = "#/actuar/" + id; });
    document.getElementById("rDel").addEventListener("click", function () {
      if (confirm("¿Eliminar la rutina “" + r.name + "”? (los trucos NO se borran)")) {
        var wr = r.remote; state.routines = state.routines.filter(function (x) { return x.id !== id; }); save(); syncDeleteRoutine(id, wr); toast("Rutina eliminada"); location.hash = "#/rutinas";
      }
    });
    view.querySelectorAll(".rc[data-open]").forEach(function (c) { c.addEventListener("click", function () { location.hash = "#/truco/" + c.getAttribute("data-open"); }); });
    var move = function (i, dir) { var a = r.trickIds; var j = i + dir; if (j < 0 || j >= a.length) return; var tmp = a[i]; a[i] = a[j]; a[j] = tmp; r.updatedAt = Date.now(); save(); syncRoutine(r); renderRoutineDetail(id); };
    view.querySelectorAll("[data-up]").forEach(function (b) { b.addEventListener("click", function () { move(parseInt(b.getAttribute("data-up"), 10), -1); }); });
    view.querySelectorAll("[data-down]").forEach(function (b) { b.addEventListener("click", function () { move(parseInt(b.getAttribute("data-down"), 10), 1); }); });
    view.querySelectorAll("[data-del]").forEach(function (b) { b.addEventListener("click", function () { r.trickIds.splice(parseInt(b.getAttribute("data-del"), 10), 1); r.updatedAt = Date.now(); save(); syncRoutine(r); renderRoutineDetail(id); }); });
  }

  function renderRoutineAdd(id) {
    var r = getRoutine(id);
    if (!r) { location.hash = "#/rutinas"; return; }
    clearTabbar();
    var pool = state.tricks.filter(function (t) { return (r.trickIds || []).indexOf(t.id) < 0; });
    var body = pool.length
      ? '<div class="rlist">' + pool.map(function (t) {
          return '<div class="rrow" data-add="' + t.id + '"><div class="ri">' + icon("cards") + "</div>" +
            '<div class="rt"><div class="n">' + esc(t.title) + '</div><div class="d">' + esc(t.category || "") + "</div></div><span class=\"go\">" + icon("plus", "i-sm") + "</span></div>";
        }).join("") + "</div>"
      : '<div class="empty" style="padding:40px 10px"><p>Ya has añadido todos tus trucos, o tu biblioteca está vacía.</p></div>';
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" onclick="location.hash=\'#/rutina/' + id + '\'">' + icon("back") + '</button><h1>Añadir a la rutina</h1></div>' + body + "</div>";
    view.querySelectorAll(".rrow[data-add]").forEach(function (row) {
      row.addEventListener("click", function () { r.trickIds.push(row.getAttribute("data-add")); r.updatedAt = Date.now(); save(); syncRoutine(r); toast("Añadido"); location.hash = "#/rutina/" + id; });
    });
  }

  /* -------------------------- MODO ACTUACIÓN ------------------------- */
  var wakeLock = null;
  function requestWake() { try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { wakeLock = w; }).catch(function () {}); } catch (e) {} }
  function releaseWake() { try { if (wakeLock) { wakeLock.release(); wakeLock = null; } } catch (e) {} }

  var perfState = null;
  function renderPerform(id) {
    var r = getRoutine(id);
    if (!r) { location.hash = "#/rutinas"; return; }
    var tricks = (r.trickIds || []).map(getTrick).filter(Boolean);
    if (!tricks.length) { location.hash = "#/rutina/" + id; return; }
    clearTabbar(); requestWake();
    perfState = { id: id, tricks: tricks, i: 0 };
    paintPerform();
  }
  function paintPerform() {
    var s = perfState; if (!s) return;
    var t = s.tricks[s.i];
    var meta = t.meta || {};
    var chips = META_ORDER.filter(function (k) { return meta[k]; }).slice(0, 4).map(function (k) { return '<span class="pchip">' + esc(meta[k]) + "</span>"; }).join("");
    document.getElementById("view").innerHTML =
      '<div class="screen perform" id="perf">' +
      '<div class="ptop"><span>' + (s.i + 1) + " / " + s.tricks.length + "</span>" +
      '<button class="pexit" id="pExit">' + icon("x") + "</button></div>" +
      '<div class="pbody" id="pBody">' +
      '<div class="pcat">' + esc(t.category || "") + "</div>" +
      '<h1 class="ptitle">' + esc(t.title) + "</h1>" +
      (chips ? '<div class="pchips">' + chips + "</div>" : "") +
      '<div class="pnotes">' + (t.notes ? esc(t.notes) : "<span style=\"opacity:.5\">— sin notas —</span>") + "</div>" +
      "</div>" +
      '<div class="pnav"><button id="pPrev" ' + (s.i === 0 ? "disabled" : "") + ">" + icon("back") + " Anterior</button>" +
      '<button id="pNext" ' + (s.i === s.tricks.length - 1 ? "disabled" : "") + ">Siguiente " + icon("chev") + "</button></div>" +
      "</div>";
    document.getElementById("pExit").addEventListener("click", exitPerform);
    var prev = document.getElementById("pPrev"), next = document.getElementById("pNext");
    prev.addEventListener("click", function () { if (s.i > 0) { s.i--; paintPerform(); } });
    next.addEventListener("click", function () { if (s.i < s.tricks.length - 1) { s.i++; paintPerform(); } });
    // swipe horizontal
    var x0 = null;
    var body = document.getElementById("pBody");
    body.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    body.addEventListener("touchend", function (e) {
      if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (dx < -50 && s.i < s.tricks.length - 1) { s.i++; paintPerform(); }
      else if (dx > 50 && s.i > 0) { s.i--; paintPerform(); }
    });
  }
  function exitPerform() { releaseWake(); var id = perfState ? perfState.id : null; perfState = null; location.hash = id ? "#/rutina/" + id : "#/rutinas"; }

  /* ============================== BOLOS ============================== */
  function renderGigs() {
    mountTabbar("gig"); mountFab("#/bolo-nuevo");
    var gs = state.gigs.slice().sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });
    var body;
    if (!gs.length) {
      body = '<div class="empty"><div class="big">' + icon("calendar") + '</div><h3>Sin bolos todavía</h3>' +
        "<p>Lleva tu agenda: fecha, cliente, caché y qué actuaste (para no repetir con el mismo público).</p>" +
        '<button class="btn" onclick="location.hash=\'#/bolo-nuevo\'">Añadir un bolo</button></div>';
    } else {
      body = '<div class="rlist">' + gs.map(function (g) {
        return '<div class="rrow" data-id="' + g.id + '"><div class="ri">' + icon("calendar") + "</div>" +
          '<div class="rt"><div class="n">' + esc(g.client || "Bolo") + '</div><div class="d">' + fmtDate(g.date) + (g.venue ? " · " + esc(g.venue) : "") + (g.fee !== "" && g.fee != null ? " · " + esc(g.fee) + " €" : "") + "</div></div>" +
          '<span class="go">' + icon("chev") + "</span></div>";
      }).join("") + "</div>";
    }
    view.innerHTML = '<div class="screen"><h1 class="title">Bolos</h1><p class="subtitle">Tu agenda de actuaciones.</p>' + body + "</div>";
    view.querySelectorAll(".rrow[data-id]").forEach(function (row) { row.addEventListener("click", function () { location.hash = "#/bolo/" + row.getAttribute("data-id"); }); });
  }

  function renderGigForm(id) {
    clearTabbar();
    var g = id ? getGig(id) : null;
    if (id && !g) { location.hash = "#/bolos"; return; }
    var sel = g ? (g.trickIds || []).slice() : [];
    var chips = state.tricks.map(function (t) {
      return '<button type="button" class="tchip ' + (sel.indexOf(t.id) >= 0 ? "on" : "") + '" data-id="' + t.id + '">' + esc(t.title) + "</button>";
    }).join("");
    view.innerHTML =
      '<div class="screen"><div class="pagehead"><button class="back" onclick="history.back()">' + icon("back") + "</button><h1>" + (id ? "Editar bolo" : "Nuevo bolo") + "</h1></div>" +
      '<div class="row"><div class="field"><label>Fecha</label><input id="gDate" type="date" value="' + esc(g ? g.date : "") + '"></div>' +
      '<div class="field"><label>Caché (€)</label><input id="gFee" type="number" inputmode="decimal" placeholder="0" value="' + esc(g && g.fee !== "" && g.fee != null ? g.fee : "") + '"></div></div>' +
      '<div class="field"><label>Cliente</label><input id="gClient" placeholder="Nombre / empresa" value="' + esc(g ? g.client : "") + '"></div>' +
      '<div class="field"><label>Lugar</label><input id="gVenue" placeholder="Local, ciudad…" value="' + esc(g ? g.venue : "") + '"></div>' +
      '<div class="field"><label>Notas</label><textarea id="gNotes" placeholder="Detalles del bolo…">' + esc(g ? g.notes : "") + "</textarea></div>" +
      '<div class="field"><label>Qué actué</label>' + (state.tricks.length ? '<div class="tchips" id="gTricks">' + chips + "</div>" : '<div class="hint">Aún no tienes trucos en la biblioteca.</div>') + "</div>" +
      '<button class="btn" id="gSave">' + (id ? "Guardar" : "Crear bolo") + "</button>" +
      '<button class="btn ghost" onclick="history.back()">Cancelar</button></div>';
    view.querySelectorAll("#gTricks .tchip").forEach(function (c) { c.addEventListener("click", function () { c.classList.toggle("on"); }); });
    document.getElementById("gSave").addEventListener("click", function () {
      var trickIds = Array.prototype.map.call(view.querySelectorAll("#gTricks .tchip.on"), function (c) { return c.getAttribute("data-id"); });
      var data = {
        date: document.getElementById("gDate").value, client: document.getElementById("gClient").value.trim(),
        venue: document.getElementById("gVenue").value.trim(), fee: document.getElementById("gFee").value.trim(),
        notes: document.getElementById("gNotes").value.trim(), trickIds: trickIds, updatedAt: Date.now()
      };
      if (!data.date && !data.client) { toast("Pon al menos fecha o cliente"); return; }
      if (id) { Object.keys(data).forEach(function (k) { g[k] = data[k]; }); save(); syncGig(g); location.hash = "#/bolo/" + id; }
      else { data.id = uid(); data.createdAt = Date.now(); data.remote = false; state.gigs.push(data); save(); syncGig(data); location.hash = "#/bolo/" + data.id; }
    });
  }

  function renderGigDetail(id) {
    var g = getGig(id);
    if (!g) { location.hash = "#/bolos"; return; }
    clearTabbar();
    var performed = (g.trickIds || []).map(getTrick).filter(Boolean);
    // Aviso de repetición: trucos que ya actuaste para el mismo cliente en otros bolos
    var repeated = [];
    if (g.client) {
      var cl = g.client.trim().toLowerCase();
      var prevIds = {};
      state.gigs.forEach(function (o) { if (o.id !== id && (o.client || "").trim().toLowerCase() === cl) (o.trickIds || []).forEach(function (tid) { prevIds[tid] = true; }); });
      repeated = performed.filter(function (t) { return prevIds[t.id]; });
    }
    var perfHtml = performed.length
      ? '<div class="ritems">' + performed.map(function (t) {
          var rep = repeated.indexOf(t) >= 0;
          return '<div class="ritem"><div class="rc" data-open="' + t.id + '"><div class="n">' + esc(t.title) + (rep ? ' <span class="reptag">ya actuado</span>' : "") + '</div><div class="d">' + esc(t.category || "") + "</div></div></div>";
        }).join("") + "</div>"
      : '<div class="hint">No registraste qué actuaste.</div>';

    view.innerHTML =
      '<div class="screen"><div class="pagehead"><button class="back" onclick="location.hash=\'#/bolos\'">' + icon("back") + '</button><h1>Bolo</h1>' +
      '<span style="flex:1"></span><button class="iconbtn" id="gEdit">' + icon("edit") + "</button></div>" +
      '<h1 class="title">' + esc(g.client || "Bolo") + "</h1>" +
      '<div class="detail-badges"><span class="tagchip">' + fmtDate(g.date) + "</span>" +
      (g.venue ? '<span class="tagchip">' + esc(g.venue) + "</span>" : "") +
      (g.fee !== "" && g.fee != null ? '<span class="pill df">' + esc(g.fee) + " €</span>" : "") + "</div>" +
      (g.notes ? '<div class="notes">' + esc(g.notes) + "</div>" : "") +
      (repeated.length ? '<div class="backstage-bar" style="color:var(--danger);border-color:color-mix(in srgb,var(--danger) 35%,transparent);background:color-mix(in srgb,var(--danger) 10%,transparent)"><span class="dot" style="background:var(--danger);box-shadow:none"></span> Ojo: ' + repeated.length + " truco(s) ya se los hiciste a este cliente.</div>" : "") +
      '<div class="sec-label">Qué actué</div>' + perfHtml +
      '<button class="btn danger" id="gDel">Eliminar bolo</button></div>';
    document.getElementById("gEdit").addEventListener("click", function () { location.hash = "#/bolo-edit/" + id; });
    view.querySelectorAll(".rc[data-open]").forEach(function (c) { c.addEventListener("click", function () { location.hash = "#/truco/" + c.getAttribute("data-open"); }); });
    document.getElementById("gDel").addEventListener("click", function () {
      if (confirm("¿Eliminar este bolo?")) { var wr = g.remote; state.gigs = state.gigs.filter(function (x) { return x.id !== id; }); save(); syncDeleteGig(id, wr); toast("Bolo eliminado"); location.hash = "#/bolos"; }
    });
  }

  /* ========================= TRUCOS INCLUIDOS ======================== */
  function renderIncluded() {
    mountTabbar("inc"); var f = document.getElementById("fabEl"); if (f) f.remove();
    view.innerHTML =
      '<div class="screen">' +
      '<h1 class="title">Trucos incluidos</h1>' +
      '<p class="subtitle">Efectos listos para actuar, con su método explicado.</p>' +
      '<div class="hero"><h2>Lector Mental</h2><p>La app “lee la mente” del espectador en su propio teléfono y revela su carta o palabra.</p></div>' +
      '<button class="btn" onclick="location.hash=\'#/lector\'">' + icon("play", "i-sm") + " Actuar</button>" +
      '<button class="btn ghost" onclick="location.hash=\'#/lector-metodo\'">' + icon("book", "i-sm") + " Aprender el método</button>" +
      "</div>";
  }

  /* ------------------------- LECTOR MENTAL --------------------------- */
  var VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  var SUITS = [{ sym: "♠" }, { sym: "♥" }, { sym: "♦" }, { sym: "♣" }];
  function suitName(s) { return ({ "♠": "Picas", "♥": "Corazones", "♦": "Diamantes", "♣": "Tréboles" })[s] || s; }
  var loaded = { type: null, card: null, text: null };

  function renderLector() {
    clearTabbar();
    view.innerHTML =
      '<div class="screen">' +
      '<div class="pagehead"><button class="back" onclick="location.hash=\'#/incluidos\'">' + icon("back") + '</button><h1>Lector Mental</h1></div>' +
      '<div class="scanwrap" id="scan"><div class="orb" id="orb"></div>' +
      '<div class="prompt" id="prompt">Coloca tu dedo en la esfera y piensa con fuerza en tu carta.</div>' +
      '<div class="sub">Cuando estés listo, pulsa la esfera.</div></div>' +
      "</div>";
    buildQuickSet();
    var orb = document.getElementById("orb"); if (orb) orb.addEventListener("click", runScan);
    armSwipeToLoad();
    if (loaded.type) markArmed();
  }
  function markArmed() { var o = document.getElementById("orb"); if (o) o.classList.add("armed"); var p = document.getElementById("prompt"); if (p) p.textContent = "La conexión está lista. Coloca tu dedo y concéntrate."; }
  function armSwipeToLoad() {
    var startY = null, top = false;
    function ts(e) { var y = e.touches ? e.touches[0].clientY : e.clientY; top = y < 60; startY = y; }
    function te(e) { if (!top || startY == null) return; var y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY; if (y - startY > 55) openQS(); startY = null; top = false; }
    document.addEventListener("touchstart", ts, { passive: true }); document.addEventListener("touchend", te);
    document.addEventListener("mousedown", ts); document.addEventListener("mouseup", te);
  }
  function buildQuickSet() {
    var old = document.getElementById("qs"); if (old) old.remove();
    var rows = SUITS.map(function (s) {
      var red = s.sym === "♥" || s.sym === "♦";
      var btns = VALUES.map(function (v) { return '<button class="cellbtn ' + (red ? "red" : "") + '" data-suit="' + s.sym + '" data-val="' + v + '">' + v + "</button>"; }).join("");
      return '<div class="suitrow"><div class="slabel"' + (red ? ' style="color:var(--danger)"' : "") + ">" + s.sym + '</div><div class="suits">' + btns + "</div></div>";
    }).join("");
    var qs = el('<div class="qs" id="qs"><h4>· carga secreta · desliza arriba para cerrar ·</h4>' + rows +
      '<div class="txtwrap"><input id="qsText" type="text" placeholder="…o escribe una palabra / número" autocomplete="off" autocapitalize="off" autocorrect="off"></div>' +
      '<div class="loaded" id="qsLoaded"></div>' +
      '<div class="qsrow"><button class="btn ghost" id="qsClear">Vaciar</button><button class="btn" id="qsUse">Usar palabra</button></div></div>');
    document.body.appendChild(qs);
    qs.querySelectorAll(".cellbtn").forEach(function (b) {
      b.addEventListener("click", function () {
        loaded = { type: "card", card: { suit: b.getAttribute("data-suit"), val: b.getAttribute("data-val") }, text: null };
        document.getElementById("qsLoaded").textContent = "Cargado: " + loaded.card.val + loaded.card.suit;
        setTimeout(closeQS, 380);
      });
    });
    qs.querySelector("#qsUse").addEventListener("click", function () {
      var t = qs.querySelector("#qsText").value.trim(); if (!t) { toast("Escribe algo primero"); return; }
      loaded = { type: "text", card: null, text: t }; document.getElementById("qsLoaded").textContent = "Cargado: " + t; setTimeout(closeQS, 250);
    });
    qs.querySelector("#qsClear").addEventListener("click", function () {
      loaded = { type: null, card: null, text: null }; qs.querySelector("#qsText").value = "";
      document.getElementById("qsLoaded").textContent = "(vacío — hará una lectura al azar)";
      var o = document.getElementById("orb"); if (o) o.classList.remove("armed");
    });
    var sY = null;
    qs.addEventListener("touchstart", function (e) { sY = e.touches[0].clientY; }, { passive: true });
    qs.addEventListener("touchend", function (e) { if (sY == null) return; if (sY - e.changedTouches[0].clientY > 50) closeQS(); sY = null; });
  }
  function openQS() { var q = document.getElementById("qs"); if (q) q.classList.add("open"); }
  function closeQS() { var q = document.getElementById("qs"); if (q) q.classList.remove("open"); if (loaded.type) markArmed(); }

  function runScan() {
    var result;
    if (loaded.type === "card") result = { kind: "card", card: loaded.card };
    else if (loaded.type === "text") result = { kind: "text", text: loaded.text };
    else result = { kind: "card", card: { suit: SUITS[rnd(4)].sym, val: VALUES[rnd(13)] } };
    view.innerHTML =
      '<div class="screen"><div class="pagehead"><button class="back" onclick="location.hash=\'#/incluidos\'">' + icon("back") + '</button><h1>Lector Mental</h1></div>' +
      '<div class="scanwrap" style="min-height:52vh"><div class="orb ' + (loaded.type ? "armed" : "") + '"></div>' +
      '<div class="prompt">Leyendo tu mente…</div><div class="progress"><i id="bar"></i></div><div class="scanstatus" id="st"></div></div></div>';
    var bar = document.getElementById("bar"), st = document.getElementById("st");
    var msgs = ["Sincronizando pulso…", "Detectando la imagen mental…", "Enfocando el símbolo…", "Revelando…"], p = 0;
    var iv = setInterval(function () {
      p += 3 + rnd(4); if (p > 100) p = 100; bar.style.width = p + "%";
      st.textContent = msgs[Math.min(msgs.length - 1, Math.floor(p / 26))];
      if (p >= 100) { clearInterval(iv); setTimeout(function () { showResult(result); }, 300); }
    }, 120);
  }
  function showResult(result) {
    var body;
    if (result.kind === "card") {
      var c = result.card, red = c.suit === "♥" || c.suit === "♦";
      body = '<div class="cardface ' + (red ? "red" : "") + '"><div class="corner tl">' + c.val + "<br>" + c.suit + '</div><div class="center">' + c.suit + '</div><div class="corner br">' + c.val + "<br>" + c.suit + "</div></div>" +
        '<div class="lbl" style="text-align:center;margin-top:18px;color:var(--ink-soft)">Tu carta era el <b>' + c.val + " de " + suitName(c.suit) + "</b>.</div>";
    } else { body = '<div class="textreveal">' + esc(result.text) + "</div>"; }
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" onclick="location.hash=\'#/incluidos\'">' + icon("back") + '</button><h1>Lector Mental</h1></div><div class="panel">' + body +
      '<button class="btn" onclick="location.hash=\'#/incluidos\'">Terminar</button></div></div>';
    loaded = { type: null, card: null, text: null };
  }

  function sec(title, eye, body) {
    var badge = eye === "pub" ? '<span class="eye pub">Lo ve el público</span><br>' : eye === "sec" ? '<span class="eye sec">Solo el mago</span><br>' : "";
    return "<section><h3>" + title + "</h3>" + badge + body + "</section>";
  }
  function renderLectorMethod() {
    clearTabbar();
    view.innerHTML =
      '<div class="screen"><div class="pagehead"><button class="back" onclick="location.hash=\'#/incluidos\'">' + icon("back") + '</button><h1>Método</h1></div>' +
      '<div class="backstage-bar"><span class="dot"></span> Solo para tus ojos — no lo enseñes al público</div>' +
      '<div class="panel tut"><h2>Lector Mental</h2>' +
      sec("Qué ve el público", "pub", "<p>El espectador piensa una carta (o una palabra, un nombre…). Pone el dedo en la esfera de SU teléfono, la app “lee su mente” y revela justo lo que pensaba.</p>") +
      sec("El secreto", "sec", "<p>La app no adivina: <b>tú le dices en secreto qué revelar</b>. Funciona con cualquier forzaje o peek que conozcas.</p><p><b>Cargar:</b> en la pantalla de la esfera, <b>desliza hacia abajo desde el borde superior</b>. Toca la carta o escribe la palabra. La esfera se pone <b>dorada</b> = cargada. Desliza arriba para cerrar.</p>") +
      sec("Paso a paso", "", "<ol><li>Averigua la carta con tu método.</li><li>Con el móvil en tu mano, di que “calibras el sensor” y carga a la vez, sin apenas mirar.</li><li>Comprueba que la esfera está dorada.</li><li>Entrega el móvil; que ponga el dedo y pulse.</li><li>Se revela su carta exacta.</li></ol>") +
      sec("Guion", "", '<div class="script">"Este sensor mide micro-señales de tu piel. Piensa en tu carta, pon el dedo aquí… relájate…"</div>') +
      sec("Errores a evitar", "", "<ul><li>Ensaya la carga hasta hacerla sin mirar.</li><li>No entregues el móvil hasta ver la esfera dorada.</li><li>No repitas el efecto para el mismo público.</li></ul>") +
      '<button class="btn" onclick="location.hash=\'#/lector\'">' + icon("play", "i-sm") + " Practicar</button></div></div>";
  }

  /* ============================= AJUSTES ============================= */
  function renderSettings() {
    mountTabbar("set"); var f = document.getElementById("fabEl"); if (f) f.remove();
    var theme = localStorage.getItem("magic_theme") || "auto";
    view.innerHTML =
      '<div class="screen"><h1 class="title">Ajustes</h1><p class="subtitle">' + state.tricks.length + " trucos guardados · " + state.categories.length + " categorías</p>" +
      '<div class="sec-label">Cuenta</div>' +
      '<div class="setrow" id="acctRow"><span class="si">' + icon(logged() ? "user" : "cloud") + '</span><div class="st"><div class="t">' +
      (logged() ? esc(session.email) : "Iniciar sesión / crear cuenta") + '</div><div class="d">' +
      (logged() ? "Sincronizado en la nube" : (cloudReady() ? "Sincroniza y sube vídeos entre dispositivos" : "Sin conexión")) + '</div></div><span class="go">' + icon("chev") + "</span></div>" +
      '<div class="sec-label">Apariencia</div>' +
      '<div class="setrow"><span class="si">' + icon("theme") + '</span><div class="st"><div class="t">Tema</div><div class="d">Claro, oscuro o según el sistema</div></div></div>' +
      '<div class="seg" id="themeSeg" style="margin-bottom:16px">' +
      [["auto", "Sistema"], ["light", "Claro"], ["dark", "Oscuro"]].map(function (x) { return '<button data-v="' + x[0] + '" class="' + (theme === x[0] ? "on" : "") + '">' + x[1] + "</button>"; }).join("") + "</div>" +
      '<div class="sec-label">Seguridad</div>' +
      '<div class="setrow"><span class="si">' + icon("hat") + '</span><div class="st"><div class="t">Bloqueo con PIN</div><div class="d">' +
      (hasPin() ? "Activado · se pide al abrir la app" : "Protege tus secretos si alguien coge tu móvil") + "</div></div></div>" +
      (hasPin()
        ? '<button class="btn ghost" id="lockNow">Bloquear ahora</button><button class="btn ghost" id="changePin">Cambiar PIN</button><button class="btn danger" id="removePin">Quitar PIN</button>'
        : '<button class="btn ghost" id="setPin">Activar PIN</button>') +
      '<div class="sec-label">Tus datos</div>' +
      '<div class="setrow"><span class="si">' + icon("disk") + '</span><div class="st"><div class="t">Copia de seguridad</div><div class="d">Exporta tu biblioteca a un archivo, o restáurala.</div></div></div>' +
      '<button class="btn ghost" id="exportBtn">Exportar biblioteca</button>' +
      '<button class="btn ghost" id="importBtn">Importar biblioteca</button>' +
      '<input type="file" id="importFile" accept="application/json" style="display:none">' +
      '<div class="sec-label" style="color:var(--danger)">Zona peligrosa</div>' +
      '<button class="btn danger" id="wipeBtn">Borrar todos mis trucos</button>' +
      '<p class="subtitle" style="text-align:center;margin-top:24px">The Magic App · tus datos se guardan solo en este dispositivo.</p>' +
      "</div>";

    var acct = document.getElementById("acctRow");
    if (acct) acct.addEventListener("click", function () { location.hash = "#/cuenta"; });
    view.querySelectorAll("#themeSeg button").forEach(function (b) {
      b.addEventListener("click", function () { setTheme(b.getAttribute("data-v")); renderSettings(); });
    });
    var byId = function (id) { return document.getElementById(id); };
    if (byId("setPin")) byId("setPin").addEventListener("click", function () { location.hash = "#/pin"; });
    if (byId("changePin")) byId("changePin").addEventListener("click", function () { location.hash = "#/pin"; });
    if (byId("lockNow")) byId("lockNow").addEventListener("click", function () { unlocked = false; renderLock(); });
    if (byId("removePin")) byId("removePin").addEventListener("click", function () {
      if (confirm("¿Quitar el PIN? La app dejará de pedirlo.")) { removePin(); toast("PIN eliminado"); renderSettings(); }
    });
    document.getElementById("exportBtn").addEventListener("click", exportData);
    document.getElementById("importBtn").addEventListener("click", function () { document.getElementById("importFile").click(); });
    document.getElementById("importFile").addEventListener("change", importData);
    document.getElementById("wipeBtn").addEventListener("click", function () {
      if (confirm("¿Seguro? Se borrarán TODOS tus trucos de este dispositivo.")) { state = { version: 1, tricks: [], categories: DEFAULT_CATS.slice() }; save(); toast("Biblioteca borrada"); location.hash = "#/"; }
    });
  }
  function exportData() {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "the-magic-app-biblioteca.json"; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); toast("Biblioteca exportada");
  }
  function importData(e) {
    var file = e.target.files[0]; if (!file) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var data = JSON.parse(r.result);
        if (!data || !Array.isArray(data.tricks)) throw 0;
        state = { version: 1, tricks: data.tricks, categories: (data.categories && data.categories.length) ? data.categories : DEFAULT_CATS.slice() };
        save(); toast("Biblioteca importada"); location.hash = "#/";
      } catch (err) { toast("Archivo no válido"); }
    };
    r.readAsText(file);
  }

  /* ============================== CUENTA ============================= */
  var authMode = "login";     // 'login' | 'signup'
  var pendingEmail = null;    // email a confirmar tras registro

  function renderAccount() {
    clearTabbar();
    if (!cloudReady()) {
      view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" onclick="location.hash=\'#/ajustes\'">' + icon("back") + '</button><h1>Cuenta</h1></div>' +
        '<div class="panel"><p>La sincronización en la nube no está disponible ahora mismo (sin conexión). Tu biblioteca sigue guardándose en este dispositivo.</p></div></div>';
      return;
    }
    if (logged()) return renderAccountLogged();
    if (pendingEmail) return renderConfirm();
    return renderAuthForm();
  }

  function renderAccountLogged() {
    view.innerHTML =
      '<div class="screen"><div class="pagehead"><button class="back" onclick="location.hash=\'#/ajustes\'">' + icon("back") + '</button><h1>Cuenta</h1></div>' +
      '<div class="setrow"><span class="si">' + icon("user") + '</span><div class="st"><div class="t">' + esc(session.email) + '</div><div class="d">Sesión iniciada · tu biblioteca se sincroniza</div></div></div>' +
      '<button class="btn" id="syncNow">Sincronizar ahora</button>' +
      '<button class="btn ghost" id="signOut">Cerrar sesión</button>' +
      '<p class="subtitle" style="text-align:center;margin-top:20px">Tus trucos se guardan en tu proyecto privado y solo tú puedes verlos.</p></div>';
    document.getElementById("syncNow").addEventListener("click", function () { toast("Sincronizando…"); syncOnLogin(); });
    document.getElementById("signOut").addEventListener("click", function () {
      Cloud.signOut().finally(function () { session = null; toast("Sesión cerrada"); location.hash = "#/ajustes"; });
    });
  }

  function renderAuthForm() {
    var isSignup = authMode === "signup";
    view.innerHTML =
      '<div class="screen"><div class="pagehead"><button class="back" onclick="location.hash=\'#/ajustes\'">' + icon("back") + '</button><h1>' + (isSignup ? "Crear cuenta" : "Iniciar sesión") + "</h1></div>" +
      '<p class="subtitle">Sincroniza tu biblioteca entre dispositivos y sube tus vídeos.</p>' +
      '<div class="field"><label>Email</label><input id="aEmail" type="email" inputmode="email" autocomplete="email" placeholder="tu@email.com"></div>' +
      '<div class="field"><label>Contraseña</label><input id="aPass" type="password" autocomplete="' + (isSignup ? "new-password" : "current-password") + '" placeholder="mínimo 6 caracteres"></div>' +
      '<button class="btn" id="aGo">' + (isSignup ? "Crear cuenta" : "Entrar") + "</button>" +
      '<button class="btn ghost" id="aSwap">' + (isSignup ? "Ya tengo cuenta · Iniciar sesión" : "No tengo cuenta · Registrarme") + "</button></div>";
    document.getElementById("aSwap").addEventListener("click", function () { authMode = isSignup ? "login" : "signup"; renderAccount(); });
    document.getElementById("aGo").addEventListener("click", function () {
      var email = document.getElementById("aEmail").value.trim();
      var pass = document.getElementById("aPass").value;
      if (!email || pass.length < 6) { toast("Email y contraseña (mín. 6)"); return; }
      var btn = document.getElementById("aGo"); btn.disabled = true; btn.textContent = "Un momento…";
      if (isSignup) {
        Cloud.signUp(email, pass).then(function (r) {
          if (r.error) { toast(traduce(r.error.message)); btn.disabled = false; btn.textContent = "Crear cuenta"; return; }
          if (r.data && r.data.session) { session = r.data.session.user; toast("¡Cuenta creada!"); syncOnLogin().then(function () { location.hash = "#/"; }); return; }
          pendingEmail = email; renderConfirm();
        }).catch(function () { toast("Error de conexión"); btn.disabled = false; btn.textContent = "Crear cuenta"; });
      } else {
        Cloud.signIn(email, pass).then(function (r) {
          if (r.error) { toast(traduce(r.error.message)); btn.disabled = false; btn.textContent = "Entrar"; return; }
          session = r.data.user; toast("¡Hola de nuevo!"); syncOnLogin().then(function () { location.hash = "#/"; });
        }).catch(function () { toast("Error de conexión"); btn.disabled = false; btn.textContent = "Entrar"; });
      }
    });
  }

  function renderConfirm() {
    view.innerHTML =
      '<div class="screen"><div class="pagehead"><button class="back" onclick="location.hash=\'#/cuenta\'">' + icon("back") + '</button><h1>Confirma tu email</h1></div>' +
      '<p class="subtitle">Te hemos enviado un <b>código</b> a <b>' + esc(pendingEmail) + "</b>. Escríbelo aquí para activar tu cuenta.</p>" +
      '<div class="field"><label>Código de confirmación</label><input id="cCode" inputmode="numeric" autocomplete="one-time-code" placeholder="6 dígitos"></div>' +
      '<button class="btn" id="cGo">Confirmar</button>' +
      '<button class="btn ghost" id="cResend">Reenviar código</button>' +
      '<button class="btn ghost" id="cCancel">Cancelar</button></div>';
    document.getElementById("cGo").addEventListener("click", function () {
      var code = document.getElementById("cCode").value.trim();
      if (!code) { toast("Escribe el código"); return; }
      var btn = document.getElementById("cGo"); btn.disabled = true; btn.textContent = "Comprobando…";
      Cloud.verifySignup(pendingEmail, code).then(function (r) {
        if (r.error) { toast(traduce(r.error.message)); btn.disabled = false; btn.textContent = "Confirmar"; return; }
        session = (r.data && r.data.user) || null; pendingEmail = null;
        toast("¡Cuenta activada!"); syncOnLogin().then(function () { location.hash = "#/"; });
      }).catch(function () { toast("Error de conexión"); btn.disabled = false; btn.textContent = "Confirmar"; });
    });
    document.getElementById("cResend").addEventListener("click", function () { Cloud.resend(pendingEmail).then(function () { toast("Código reenviado"); }).catch(function () { toast("No se pudo reenviar"); }); });
    document.getElementById("cCancel").addEventListener("click", function () { pendingEmail = null; location.hash = "#/ajustes"; });
  }

  function traduce(msg) {
    msg = (msg || "").toLowerCase();
    if (msg.indexOf("invalid login") >= 0) return "Email o contraseña incorrectos";
    if (msg.indexOf("already registered") >= 0 || msg.indexOf("already been registered") >= 0) return "Ese email ya tiene cuenta";
    if (msg.indexOf("token has expired") >= 0 || msg.indexOf("invalid") >= 0 && msg.indexOf("otp") >= 0) return "Código incorrecto o caducado";
    if (msg.indexOf("email not confirmed") >= 0) return "Confirma tu email primero";
    if (msg.indexOf("password") >= 0) return "La contraseña es demasiado corta";
    return "No se pudo completar";
  }

  /* ========================= BLOQUEO CON PIN ========================= */
  var unlocked = false, pinBuf = "";
  function hasPin() { try { return !!localStorage.getItem("magic_pin"); } catch (e) { return false; } }
  function pinHash(pin) {
    var data = new TextEncoder().encode("tma:" + pin);
    return crypto.subtle.digest("SHA-256", data).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
    });
  }
  function setPin(pin) { return pinHash(pin).then(function (h) { try { localStorage.setItem("magic_pin", h); } catch (e) {} }); }
  function removePin() { try { localStorage.removeItem("magic_pin"); } catch (e) {} }
  function checkPin(pin) { return pinHash(pin).then(function (h) { try { return h === localStorage.getItem("magic_pin"); } catch (e) { return false; } }); }

  function keypadHtml() {
    var keys = "";
    [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (n) { keys += '<button data-k="' + n + '">' + n + "</button>"; });
    keys += '<button class="blank"></button><button data-k="0">0</button><button class="act" data-k="del">' + icon("back") + "</button>";
    return keys;
  }
  function lockScreen(title, sub) {
    var dots = "<i></i><i></i><i></i><i></i>";
    return '<div class="screen lock" id="lockScreen"><div class="lk">' + icon("hat") + "</div>" +
      "<h1>" + title + '</h1><p id="lkMsg">' + (sub || "") + "</p>" +
      '<div class="pindots" id="pinDots">' + dots + "</div>" +
      '<div class="keypad">' + keypadHtml() + "</div></div>";
  }
  function paintDots() {
    var dots = document.querySelectorAll("#pinDots i");
    dots.forEach(function (d, i) { d.classList.toggle("on", i < pinBuf.length); });
  }
  function shakeLock(msg) {
    var s = document.getElementById("lockScreen"); if (s) { s.classList.add("shake"); setTimeout(function () { s.classList.remove("shake"); }, 420); }
    var m = document.getElementById("lkMsg"); if (m) m.textContent = msg || "";
    pinBuf = ""; paintDots();
  }
  function bindKeypad(onComplete) {
    document.querySelectorAll(".keypad button[data-k]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-k");
        if (k === "del") { pinBuf = pinBuf.slice(0, -1); paintDots(); return; }
        if (pinBuf.length >= 4) return;
        pinBuf += k; paintDots();
        if (pinBuf.length === 4) setTimeout(function () { onComplete(pinBuf); }, 120);
      });
    });
  }
  function renderLock() {
    clearTabbar(); pinBuf = "";
    view.innerHTML = lockScreen("Introduce tu PIN", "");
    bindKeypad(function (pin) {
      checkPin(pin).then(function (ok) {
        if (ok) { unlocked = true; boot(); } else { shakeLock("PIN incorrecto"); }
      });
    });
  }
  // Alta/cambio de PIN (2 pasos): introducir y confirmar
  function renderSetPin() {
    clearTabbar(); pinBuf = "";
    var first = null, phase = 1;
    view.innerHTML = lockScreen("Crea un PIN de 4 dígitos", "");
    bindKeypad(function (pin) {
      if (phase === 1) {
        first = pin; phase = 2; pinBuf = ""; paintDots();
        document.querySelector("#lockScreen h1").textContent = "Repite el PIN";
      } else {
        if (pin === first) { setPin(pin).then(function () { unlocked = true; toast("PIN activado"); location.hash = "#/ajustes"; }); }
        else { phase = 1; first = null; document.querySelector("#lockScreen h1").textContent = "Crea un PIN de 4 dígitos"; shakeLock("No coinciden, prueba otra vez"); }
      }
    });
  }

  /* ===================== PUERTA DE ENTRADA (login) =================== */
  function renderGate() {
    clearTabbar();
    if (pendingEmail) return gateConfirm();
    var isSignup = authMode === "signup";
    view.innerHTML =
      '<div class="screen gate">' +
      '<div class="gate-hero"><div class="logo">' + icon("hat") + "</div>" +
      '<h1 class="wm">The Magic <span>App</span></h1>' +
      '<p>Tu biblioteca de magia, siempre contigo.</p></div>' +
      '<div class="gate-card">' +
      '<div class="gate-tabs"><button class="' + (!isSignup ? "on" : "") + '" id="tabLogin">Entrar</button>' +
      '<button class="' + (isSignup ? "on" : "") + '" id="tabSignup">Crear cuenta</button></div>' +
      '<div class="field"><label>Email</label><input id="aEmail" type="email" inputmode="email" autocomplete="email" placeholder="tu@email.com"></div>' +
      '<div class="field"><label>Contraseña</label><input id="aPass" type="password" autocomplete="' + (isSignup ? "new-password" : "current-password") + '" placeholder="mínimo 6 caracteres"></div>' +
      '<button class="btn" id="aGo">' + (isSignup ? "Crear cuenta" : "Entrar") + "</button>" +
      "</div>" +
      '<p class="gate-foot">Necesitas una cuenta para guardar y sincronizar tus trucos.</p>' +
      "</div>";
    document.getElementById("tabLogin").addEventListener("click", function () { if (authMode !== "login") { authMode = "login"; renderGate(); } });
    document.getElementById("tabSignup").addEventListener("click", function () { if (authMode !== "signup") { authMode = "signup"; renderGate(); } });
    document.getElementById("aPass").addEventListener("keydown", function (e) { if (e.key === "Enter") gateSubmit(isSignup); });
    document.getElementById("aGo").addEventListener("click", function () { gateSubmit(isSignup); });
  }

  function gateSubmit(isSignup) {
    var email = document.getElementById("aEmail").value.trim();
    var pass = document.getElementById("aPass").value;
    if (!email || pass.length < 6) { toast("Email y contraseña (mín. 6)"); return; }
    var btn = document.getElementById("aGo"); btn.disabled = true; btn.textContent = "Un momento…";
    var done = function (label) { if (btn) { btn.disabled = false; btn.textContent = label; } };
    if (isSignup) {
      Cloud.signUp(email, pass).then(function (r) {
        if (r.error) { toast(traduce(r.error.message)); return done("Crear cuenta"); }
        if (r.data && r.data.session) { session = r.data.session.user; toast("¡Cuenta creada!"); return syncOnLogin(true).then(function () { location.hash = "#/"; route(); }); }
        pendingEmail = email; renderGate();
      }).catch(function () { toast("Error de conexión"); done("Crear cuenta"); });
    } else {
      Cloud.signIn(email, pass).then(function (r) {
        if (r.error) { toast(traduce(r.error.message)); return done("Entrar"); }
        session = r.data.user; toast("¡Hola de nuevo!"); syncOnLogin(true).then(function () { location.hash = "#/"; route(); });
      }).catch(function () { toast("Error de conexión"); done("Entrar"); });
    }
  }

  function gateConfirm() {
    view.innerHTML =
      '<div class="screen gate">' +
      '<div class="gate-hero"><div class="logo">' + icon("envelope") + '</div><h1 class="wm">Confirma tu email</h1>' +
      '<p>Código enviado a <b>' + esc(pendingEmail) + "</b></p></div>" +
      '<div class="gate-card">' +
      '<div class="field"><label>Código de confirmación</label><input id="cCode" inputmode="numeric" autocomplete="one-time-code" placeholder="6 dígitos"></div>' +
      '<button class="btn" id="cGo">Confirmar</button>' +
      '<button class="btn ghost" id="cResend">Reenviar código</button>' +
      '<button class="btn ghost" id="cCancel">Volver</button></div></div>';
    document.getElementById("cGo").addEventListener("click", function () {
      var code = document.getElementById("cCode").value.trim();
      if (!code) { toast("Escribe el código"); return; }
      var btn = document.getElementById("cGo"); btn.disabled = true; btn.textContent = "Comprobando…";
      Cloud.verifySignup(pendingEmail, code).then(function (r) {
        if (r.error) { toast(traduce(r.error.message)); btn.disabled = false; btn.textContent = "Confirmar"; return; }
        session = (r.data && r.data.user) || null; pendingEmail = null;
        toast("¡Cuenta activada!"); syncOnLogin(true).then(function () { location.hash = "#/"; route(); });
      }).catch(function () { toast("Error de conexión"); btn.disabled = false; btn.textContent = "Confirmar"; });
    });
    document.getElementById("cResend").addEventListener("click", function () { Cloud.resend(pendingEmail).then(function () { toast("Código reenviado"); }).catch(function () { toast("No se pudo reenviar"); }); });
    document.getElementById("cCancel").addEventListener("click", function () { pendingEmail = null; renderGate(); });
  }

  /* ------------------------------ tema -------------------------------- */
  function setTheme(mode) {
    localStorage.setItem("magic_theme", mode);
    applyTheme();
  }
  function applyTheme() {
    var mode = localStorage.getItem("magic_theme") || "auto";
    var root = document.documentElement;
    if (mode === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", mode);
  }

  /* ------------------------------ router ------------------------------ */
  function route() {
    try {
      var qs = document.getElementById("qs");
      if (qs && location.hash !== "#/lector") qs.classList.remove("open");
      // Bloqueo con PIN: protege todo hasta desbloquear
      if (hasPin() && !unlocked) return renderLock();
      // Puerta de entrada: si hay nube y no hay sesión, obligamos a iniciar sesión
      if (cloudReady() && !logged()) return renderGate();
      var h = location.hash || "#/";
      if (perfState && h.indexOf("#/actuar/") !== 0) { releaseWake(); perfState = null; }
      if (h === "#/pin") return renderSetPin();
      if (h === "#/" || h === "") return renderLibrary();
      if (h === "#/rutinas") return renderRoutines();
      if (h === "#/rutina-nueva") return renderRoutineForm(null);
      if (h.indexOf("#/rutina-edit/") === 0) return renderRoutineForm(h.slice(14));
      if (h.indexOf("#/rutina-add/") === 0) return renderRoutineAdd(h.slice(13));
      if (h.indexOf("#/actuar/") === 0) return renderPerform(h.slice(9));
      if (h.indexOf("#/rutina/") === 0) return renderRoutineDetail(h.slice(9));
      if (h === "#/bolos") return renderGigs();
      if (h === "#/bolo-nuevo") return renderGigForm(null);
      if (h.indexOf("#/bolo-edit/") === 0) return renderGigForm(h.slice(12));
      if (h.indexOf("#/bolo/") === 0) return renderGigDetail(h.slice(7));
      if (h === "#/nuevo") return renderForm(null);
      if (h.indexOf("#/editar/") === 0) return renderForm(h.slice(9));
      if (h.indexOf("#/truco/") === 0) return renderDetail(h.slice(8));
      if (h === "#/incluidos") return renderIncluded();
      if (h === "#/lector") return renderLector();
      if (h === "#/lector-metodo") return renderLectorMethod();
      if (h === "#/ajustes") return renderSettings();
      if (h === "#/cuenta") return renderAccount();
      renderLibrary();
    } catch (err) {
      if (view) view.innerHTML = '<div class="screen"><div class="panel"><h2>Vaya…</h2><p>Algo se atascó.</p><button class="btn" onclick="location.hash=\'#/\';location.reload()">Reiniciar</button></div></div>';
    }
  }

  // Arranque de la app (tras desbloqueo si hay PIN)
  var booted = false;
  function boot() {
    if (booted) return; booted = true;
    if (cloudReady()) {
      view.innerHTML = '<div class="screen splash"><div class="logo">' + icon("hat") + '</div><div class="wm">The Magic App</div><div class="spin"></div></div>';
      Cloud.currentUser().then(function (u) {
        session = u || null;
        route();
        if (session) syncOnLogin(true);
        Cloud.onChange(function (u2) {
          var was = logged(); session = u2 || null;
          if (was !== logged()) route();
        });
      }).catch(function () { session = null; route(); });
    } else {
      route(); // sin nube (modo local/preview)
    }
  }

  applyTheme();
  window.addEventListener("hashchange", route);
  if (hasPin() && !unlocked) renderLock();
  else boot();
})();
