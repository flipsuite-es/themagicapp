/* ==========================================================================
   App del Mago — herramienta de gestión para magos
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
    hat: '<path d="M7.5 15V6.2c0-1 .7-1.7 1.6-1.7h5.8c.9 0 1.6.7 1.6 1.7V15"/><path d="M3.5 15h17"/><path d="M7.5 11.8h9"/>',
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
    pause: '<path d="M9 5v14M15 5v14"/>',
    sound: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a4 4 0 010 7M18.5 6a7 7 0 010 12"/>',
    mute: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
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
    calendar: '<rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M8 3v3M16 3v3"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    chart: '<path d="M4 4v16h16"/><path d="M8 16v-4M13 16v-7M18 16v-3"/>',
    share: '<circle cx="6.5" cy="12" r="2.4"/><circle cx="17" cy="6" r="2.4"/><circle cx="17" cy="18" r="2.4"/><path d="M8.7 10.9l6.1-3.5M8.7 13.1l6.1 3.5"/>',
    bell: '<path d="M18 16V11a6 6 0 1 0-12 0v5l-1.6 2.4h15.2L18 16zM9.5 19.5a2.5 2.5 0 0 0 5 0"/>',
    people: '<circle cx="9" cy="8.5" r="3.1"/><path d="M3.5 19c0-3 2.4-4.9 5.5-4.9s5.5 1.9 5.5 4.9"/><path d="M15.5 5.6a2.7 2.7 0 0 1 0 5.3"/><path d="M17 13.6c2.4.3 3.9 2 3.9 4.5"/>',
    bag: '<path d="M6 8h12l-1 11.5H7L6 8Z"/><path d="M9 8V6.6a3 3 0 0 1 6 0V8"/>',
    lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5"/>',
    heart: '<path d="M12 19.6C6.3 15.7 3.2 12.6 3.2 9.2 3.2 6.9 5 5.1 7.2 5.1c1.6 0 2.9.8 3.6 2 .7-1.2 2-2 3.6-2 2.2 0 4 1.8 4 4.1 0 3.4-3.1 6.5-8.8 10.4z"/>',
    heartfill: '<path fill="currentColor" stroke="none" d="M12 19.6C6.3 15.7 3.2 12.6 3.2 9.2 3.2 6.9 5 5.1 7.2 5.1c1.6 0 2.9.8 3.6 2 .7-1.2 2-2 3.6-2 2.2 0 4 1.8 4 4.1 0 3.4-3.1 6.5-8.8 10.4z"/>',
    chat: '<path d="M5 5.5h14a1.2 1.2 0 0 1 1.2 1.2v8.6a1.2 1.2 0 0 1-1.2 1.2H10l-4 3v-3H5a1.2 1.2 0 0 1-1.2-1.2V6.7A1.2 1.2 0 0 1 5 5.5Z"/>',
    send: '<path d="M20.5 3.5 10.2 13.8"/><path d="M20.5 3.5 14 20.5l-3.8-6.7-6.7-3.8Z"/>',
    bookmark: '<path d="M6.5 4h11a1 1 0 0 1 1 1v15l-6.5-4-6.5 4V5a1 1 0 0 1 1-1Z"/>',
    bookmarkfill: '<path fill="currentColor" stroke="none" d="M6.5 3.5h11a1.5 1.5 0 0 1 1.5 1.5v15.6a.6.6 0 0 1-.92.5L12 17.2l-6.08 3.9a.6.6 0 0 1-.92-.5V5a1.5 1.5 0 0 1 1.5-1.5Z"/>',
    repost: '<path d="M17 3l3 3-3 3"/><path d="M4 11V9a3 3 0 0 1 3-3h13"/><path d="M7 21l-3-3 3-3"/><path d="M20 13v2a3 3 0 0 1-3 3H4"/>',
    dots: '<circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.3 3.6 8.5S14.4 18.2 12 20.5C9.6 18.2 8.4 15.2 8.4 12S9.6 5.8 12 3.5Z"/>',
    trophy: '<path d="M7 4.5h10v3a5 5 0 0 1-10 0v-3Z"/><path d="M7 6H4.5v1.5A2.5 2.5 0 0 0 7 10M17 6h2.5v1.5A2.5 2.5 0 0 1 17 10M9.5 13.5h5M12 12.5V16m-2.5 3.5h5"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5"/>'
  };
  function icon(name, cls) { return '<svg class="i ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || "") + "</svg>"; }
  // Marca "App del Mago": emblema de sello con pica (curvas Bézier) y destello.
  // `seal` añade el doble anillo tipo moneda; sin él, el glifo para el logotipo.
  var SPADE = '<path d="M12 2.6C13.6 6.2 22 11.4 22 15.4C22 18.2 20.1 20 17.6 20C15.9 20 14.6 19.1 13.9 17.8C14.1 19.8 14.9 21.2 16 22L8 22C9.1 21.2 9.9 19.8 10.1 17.8C9.4 19.1 8.1 20 6.4 20C3.9 20 2 18.2 2 15.4C2 11.4 10.4 6.2 12 2.6Z"/>';
  var SPARK = '<path d="M19 2.6C19.28 4.5 19.6 4.82 21.5 5.1C19.6 5.38 19.28 5.7 19 7.6C18.72 5.7 18.4 5.38 16.5 5.1C18.4 4.82 18.72 4.5 19 2.6Z"/>';
  function mark(cls, seal) {
    var body = seal
      ? '<circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="0.85"/>' +
        '<circle cx="12" cy="12" r="9.35" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.4"/>' +
        '<g transform="translate(12 12.5) scale(0.6) translate(-12 -12.3)">' + SPADE + SPARK + "</g>"
      : SPADE + SPARK;
    return '<svg class="mk ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">' + body + "</svg>";
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) { t = el('<div class="toast" id="toast" role="status" aria-live="polite" aria-atomic="true"></div>'); document.body.appendChild(t); }
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
    return { id: t.id, title: t.title, category: t.category, difficulty: t.difficulty, status: t.status, notes: t.notes || "", tags: t.tags || [], media: t.media || [], photos: t.photos || [], favorite: !!t.favorite, meta: t.meta || {}, practice: t.practice || {} };
  }
  function rowToLocal(r) {
    return { id: r.id, title: r.title, category: r.category, difficulty: r.difficulty, status: r.status, notes: r.notes || "", tags: r.tags || [], media: r.media || [], photos: r.photos || [], favorite: !!r.favorite, meta: r.meta || {}, practice: r.practice || {}, createdAt: Date.parse(r.created_at) || Date.now(), updatedAt: Date.parse(r.updated_at) || Date.now(), remote: true };
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

  /* ----------------------- sincronización en vivo -------------------- */
  var realtimeCh = null, rerenderTimer = null;
  function startRealtime() {
    if (!cloudReady() || !logged() || !Cloud.subscribeRealtime) return;
    stopRealtime();
    realtimeCh = Cloud.subscribeRealtime(handleRealtime);
  }
  function stopRealtime() { if (realtimeCh) { Cloud.unsubscribeRealtime(realtimeCh); realtimeCh = null; } }
  function handleRealtime(table, event, newRow, oldRow) {
    var conv = table === "tricks" ? rowToLocal : table === "routines" ? routineRowToLocal : gigRowToLocal;
    var key = table === "tricks" ? "tricks" : table === "routines" ? "routines" : "gigs";
    var id = (newRow && newRow.id) || (oldRow && oldRow.id); if (!id) return;
    var arr = state[key], changed = false;
    if (event === "DELETE") {
      var next = arr.filter(function (x) { return x.id !== id; });
      if (next.length !== arr.length) { state[key] = next; changed = true; }
    } else if (newRow) {
      var local = conv(newRow), idx = -1;
      for (var i = 0; i < arr.length; i++) { if (arr[i].id === id) { idx = i; break; } }
      if (idx >= 0) arr[idx] = local; else arr.push(local);
      changed = true;
    }
    if (changed) { save(); scheduleRerender(); }
  }
  function scheduleRerender() {
    if (rerenderTimer) return;
    rerenderTimer = setTimeout(function () {
      rerenderTimer = null;
      var h = location.hash || "#/";
      if (/^#\/(nuevo|editar|rutina-nueva|rutina-edit|rutina-add|bolo-nuevo|bolo-edit|pin|lector)/.test(h)) return;
      if (perfState) return; // no interrumpir el modo actuación
      route();
    }, 400);
  }
  var MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  function fmtDate(d) { if (!d) return "Sin fecha"; var p = String(d).split("-"); if (p.length < 3) return d; return (+p[2]) + " " + (MONTHS[(+p[1]) - 1] || "") + " " + p[0]; }
  function fmtDateTs(ts) { var d = new Date(ts); return d.getDate() + " " + MONTHS[d.getMonth()]; }

  /* --------------------- Práctica (repetición espaciada) ------------- */
  var SR_INTERVALS = [1, 2, 4, 8, 16, 32]; // días entre repasos
  var DAY = 86400000;
  function dueTricks() {
    var now = Date.now();
    return state.tricks.filter(function (t) {
      if (t.status !== "aprendiendo") return false;
      var pr = t.practice || {}; return !pr.due || pr.due <= now;
    }).sort(function (a, b) { return ((a.practice && a.practice.due) || 0) - ((b.practice && b.practice.due) || 0); });
  }
  function markPracticed(t) {
    var reps = (t.practice && t.practice.reps) || 0;
    var interval = SR_INTERVALS[Math.min(reps, SR_INTERVALS.length - 1)];
    t.practice = { reps: reps + 1, interval: interval, last: Date.now(), due: Date.now() + interval * DAY };
    t.updatedAt = Date.now(); save(); syncTrick(t);
  }
  function postponePractice(t) { t.practice = t.practice || {}; t.practice.due = Date.now() + DAY; t.updatedAt = Date.now(); save(); syncTrick(t); }

  /* --------------------- Notificaciones (Web Push) ------------------- */
  function pushSupported() { return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window; }
  function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent || ""); }
  function urlB64ToUint8(base64) {
    var pad = "=".repeat((4 - (base64.length % 4)) % 4);
    var b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
    var raw = atob(b64), arr = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }
  function currentPushSub() {
    if (!pushSupported()) return Promise.resolve(null);
    return navigator.serviceWorker.ready.then(function (reg) { return reg.pushManager.getSubscription(); }).catch(function () { return null; });
  }
  function detectTz() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Madrid"; } catch (e) { return "Europe/Madrid"; } }
  function toggleHourRow(show) { var row = document.getElementById("hourRow"); if (row) row.style.display = show ? "" : "none"; }
  function setupHourSelector() {
    var sel = document.getElementById("hourSel"); if (!sel) return;
    toggleHourRow(true);
    if (!sel.options.length) {
      var opts = "";
      for (var h = 0; h < 24; h++) { opts += '<option value="' + h + '">' + (h < 10 ? "0" + h : h) + ":00</option>"; }
      sel.innerHTML = opts;
    }
    Cloud.getReminderPref().then(function (pref) { sel.value = String(pref && typeof pref.hour === "number" ? pref.hour : 19); });
    sel.onchange = function () {
      Cloud.saveReminderPref(parseInt(sel.value, 10), detectTz())
        .then(function () { toast("Aviso a las " + sel.value.padStart(2, "0") + ":00"); })
        .catch(function () { toast("No se pudo guardar la hora"); });
    };
  }
  function refreshPushToggle() {
    var btn = document.getElementById("pushToggle"), desc = document.getElementById("pushDesc");
    if (!btn) return;
    if (!pushSupported()) { btn.style.display = "none"; toggleHourRow(false); if (desc) desc.textContent = "Tu navegador no admite notificaciones"; return; }
    currentPushSub().then(function (sub) {
      var on = !!sub && (typeof Notification !== "undefined") && Notification.permission === "granted";
      if (on) { btn.textContent = "Desactivar recordatorios"; btn.className = "btn ghost"; btn.onclick = disablePush; setupHourSelector(); }
      else { btn.textContent = "Activar recordatorios"; btn.className = "btn"; btn.onclick = enablePush; toggleHourRow(false); }
    });
  }
  function enablePush() {
    if (!logged()) { toast("Inicia sesión primero"); return; }
    if (!pushSupported()) { toast("No compatible en este navegador"); return; }
    var btn = document.getElementById("pushToggle"); if (btn) { btn.disabled = true; btn.textContent = "Activando…"; }
    Notification.requestPermission().then(function (perm) {
      if (perm !== "granted") { toast("Permiso de notificaciones denegado"); if (btn) btn.disabled = false; refreshPushToggle(); return; }
      return navigator.serviceWorker.ready.then(function (reg) {
        return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(Cloud.pushKey()) });
      }).then(function (sub) {
        var j = sub.toJSON();
        return Cloud.savePushSub({ endpoint: sub.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, ua: (navigator.userAgent || "").slice(0, 200) });
      }).then(function () {
        // Preferencia de hora por defecto si aún no existe
        return Cloud.getReminderPref().then(function (pref) { if (!pref) return Cloud.saveReminderPref(19, detectTz()); });
      }).then(function () { toast("Recordatorios activados"); if (btn) btn.disabled = false; refreshPushToggle(); });
    }).catch(function () {
      if (btn) btn.disabled = false;
      toast(isIOS() ? "En iPhone añade antes la app a la pantalla de inicio" : "No se pudieron activar");
      refreshPushToggle();
    });
  }
  function disablePush() {
    var btn = document.getElementById("pushToggle"); if (btn) { btn.disabled = true; btn.textContent = "Desactivando…"; }
    currentPushSub().then(function (sub) {
      if (!sub) { if (btn) btn.disabled = false; refreshPushToggle(); return; }
      var endpoint = sub.endpoint;
      return sub.unsubscribe().then(function () { return Cloud.deletePushSub(endpoint).catch(function () {}); })
        .then(function () { toast("Recordatorios desactivados"); if (btn) btn.disabled = false; refreshPushToggle(); });
    }).catch(function () { if (btn) btn.disabled = false; toast("No se pudo desactivar"); refreshPushToggle(); });
  }

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

  // Captura un fotograma de un <video> ya listo, como miniatura JPEG.
  function capturePoster(v) {
    return new Promise(function (resolve) {
      var done = false, soft = null;
      var hard = setTimeout(function () { if (!done) { done = true; resolve(null); } }, 10000);
      function grab() {
        if (done) return; done = true; clearTimeout(hard); if (soft) clearTimeout(soft);
        try {
          var W = 640, ratio = (v.videoWidth && v.videoHeight) ? v.videoHeight / v.videoWidth : 0.5625;
          var c = document.createElement("canvas"); c.width = W; c.height = Math.round(W * ratio);
          c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
          c.toBlob(function (blob) { resolve(blob ? new File([blob], "poster.jpg", { type: "image/jpeg" }) : null); }, "image/jpeg", 0.82);
        } catch (e) { resolve(null); }
      }
      v.addEventListener("seeked", grab, { once: true });
      v.addEventListener("loadeddata", function () {
        try { v.currentTime = Math.min(1, (v.duration || 2) / 2); } catch (e) {}
        soft = setTimeout(grab, 1400); // si no llega 'seeked', captura el fotograma actual
      }, { once: true });
      v.addEventListener("error", function () { if (!done) { done = true; clearTimeout(hard); resolve(null); } });
    });
  }
  // Miniatura a partir de un archivo local (al subir el vídeo).
  function makePoster(file) {
    var url; try { url = URL.createObjectURL(file); } catch (e) { return Promise.resolve(null); }
    var v = document.createElement("video"); v.muted = true; v.playsInline = true; v.preload = "metadata"; v.src = url;
    return capturePoster(v).then(function (out) { try { URL.revokeObjectURL(url); } catch (e) {} return out; });
  }
  // Miniatura a partir de una URL firmada (relleno de vídeos ya subidos).
  function posterFromUrl(url) {
    var v = document.createElement("video"); v.muted = true; v.playsInline = true; v.preload = "metadata"; v.crossOrigin = "anonymous"; v.src = url;
    return capturePoster(v);
  }

  /* ------------------------------ navegación -------------------------- */
  function tabbar(active) {
    var tabs = [
      { h: "#/", ic: "library", t: "Biblioteca", k: "lib" },
      { h: "#/rutinas", ic: "list", t: "Rutinas", k: "rut" },
      { h: "#/bolos", ic: "calendar", t: "Bolos", k: "gig" }
    ];
    if (socialEnabled) tabs.push({ h: "#/comunidad", ic: "people", t: "Comunidad", k: "com" });
    else tabs.push({ h: "#/incluidos", ic: "wand", t: "Incluidos", k: "inc" });
    tabs.push({ h: "#/ajustes", ic: "sliders", t: "Ajustes", k: "set" });
    return '<nav class="tabbar"><div class="tbbrand">' + mark() + "<span>App del Mago</span></div>" + tabs.map(function (x) {
      return '<a href="' + x.h + '" class="' + (active === x.k ? "on" : "") + '">' + (active === x.k ? '<span class="tb-ind" aria-hidden="true"></span>' : "") + icon(x.ic) + "<span>" + x.t + "</span></a>";
    }).join("") + "</nav>";
  }
  function mountTabbar(active) {
    var old = document.getElementById("tabbarEl"); if (old) old.remove();
    var n = el(tabbar(active)); n.id = "tabbarEl"; document.body.appendChild(n);
  }
  function clearTabbar() { var old = document.getElementById("tabbarEl"); if (old) old.remove(); var f = document.getElementById("fabEl"); if (f) f.remove(); }
  function mountFab(hash) {
    var old = document.getElementById("fabEl"); if (old) old.remove();
    var f = el('<button class="fab" id="fabEl" aria-label="Crear">' + icon("plus") + "</button>");
    f.addEventListener("click", function () { location.hash = hash || "#/nuevo"; });
    document.body.appendChild(f);
  }

  /* ============================ BIBLIOTECA ============================= */
  var filter = { q: "", cat: "all", status: "all", fav: false };

  function renderLibrary() {
    mountTabbar("lib"); mountFab();
    var tricks = state.tricks.slice().sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    var dueCount = dueTricks().length;

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
      body = '<div class="empty">' + emptyArt() + '<h3>Tu biblioteca está vacía</h3>' +
        "<p>Guarda aquí cada truco que aprendas: notas, vídeos y tu progreso.<br>Empieza creando el primero.</p>" +
        '<button class="btn" onclick="location.hash=\'#/nuevo\'">Crear mi primer truco</button></div>';
    } else if (filtered.length === 0) {
      body = '<div class="empty">' + emptyArt() + '<h3>Sin resultados</h3><p>Prueba a cambiar los filtros o la búsqueda.</p></div>';
    } else {
      body = '<div class="count">' + filtered.length + (filtered.length === 1 ? " truco" : " trucos") + "</div>" +
        '<div class="cards">' + filtered.map(trickCard).join("") + "</div>";
    }

    view.innerHTML =
      '<div class="screen wide">' +
      '<div class="appbar"><span class="brandmark">' + mark() + '<span class="wm">App del Mago</span></span>' +
      '<h1 class="pagetitle">Biblioteca</h1>' +
      '<span class="spacer"></span>' +
      (logged() && cloudReady() ? '<button class="iconbtn ' + (syncing ? "spinning" : "") + '" id="syncBtn" aria-label="Sincronizar">' + icon("cloud") + "</button>" : "") +
      '<button class="iconbtn ' + (filter.fav ? "on" : "") + '" id="favToggle" aria-label="Favoritos" aria-pressed="' + (filter.fav ? "true" : "false") + '">' + icon(filter.fav ? "starfill" : "star") + "</button>" +
      '<button class="iconbtn" id="acctBtn" aria-label="Cuenta">' + icon("user") + "</button></div>" +
      '<div class="search"><span class="mag">' + icon("search", "i-sm") + '</span><input id="q" placeholder="Buscar en mi biblioteca…" value="' + esc(filter.q) + '"></div>' +
      (dueCount ? '<div class="pracbanner" id="pracBanner">' + icon("target", "i-sm") + "<span>" + dueCount + " truco" + (dueCount > 1 ? "s" : "") + " para practicar hoy</span>" + icon("chev", "i-sm") + "</div>" : "") +
      '<div class="chips">' + catChips + "</div>" +
      '<div class="chips">' + statusChips + "</div>" +
      body +
      "</div>";

    var q = document.getElementById("q");
    var qT; q.addEventListener("input", function () { filter.q = q.value; clearTimeout(qT); qT = setTimeout(refreshCards, 120); });
    document.getElementById("favToggle").addEventListener("click", function () { filter.fav = !filter.fav; renderLibrary(); });
    var pb = document.getElementById("pracBanner"); if (pb) pb.addEventListener("click", function () { location.hash = "#/practica"; });
    document.getElementById("acctBtn").addEventListener("click", function () { location.hash = "#/cuenta"; });
    var sb = document.getElementById("syncBtn"); if (sb) sb.addEventListener("click", function () { syncOnLogin(false); });
    view.querySelectorAll(".chip[data-cat]").forEach(function (c) { c.addEventListener("click", function () { filter.cat = c.getAttribute("data-cat"); renderLibrary(); }); });
    view.querySelectorAll(".chip[data-st]").forEach(function (c) { c.addEventListener("click", function () { filter.status = c.getAttribute("data-st"); renderLibrary(); }); });
    bindCards();
    backfillPosters();
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
      holder.innerHTML = '<div class="empty">' + emptyArt() + '<h3>Sin resultados</h3><p>Prueba a cambiar los filtros o la búsqueda.</p></div>';
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
    bindCardThumbs();
  }
  // Carga las miniaturas que requieren URL firmada (fotos y pósters de vídeo).
  function bindCardThumbs() {
    if (!cloudReady()) return;
    view.querySelectorAll(".cthumb[data-thumb]").forEach(function (sp) {
      var path = sp.getAttribute("data-thumb"); if (!path) return;
      Cloud.signedUrl(path, "photos").then(function (url) { if (url) { sp.style.backgroundImage = "url(" + url + ")"; sp.classList.add("loaded"); } });
    });
  }
  // Genera pósters que faltan para vídeos propios ya subidos (trucos creados
  // antes de esta mejora, o vídeos añadidos sin miniatura). Se ejecuta en
  // segundo plano, en serie, y actualiza cada tarjeta al terminar.
  var posterTried = {}, backfilling = false;
  function backfillPosters() {
    if (backfilling || !cloudReady() || !logged() || !Cloud.signedUrl) return;
    var queue = state.tricks.filter(function (t) {
      if (posterTried[t.id]) return false;
      var th = trickThumb(t); if (!th || th.kind !== "videoicon") return false; // solo si la tarjeta muestra el marcador
      return (t.media || []).some(function (m) { return m.provider === "upload" && m.path && !m.poster; });
    });
    if (!queue.length) return;
    backfilling = true;
    var next = function () {
      var t = queue.shift();
      if (!t) { backfilling = false; return; }
      posterTried[t.id] = true;
      var item = (t.media || []).filter(function (m) { return m.provider === "upload" && m.path && !m.poster; })[0];
      if (!item) { next(); return; }
      Cloud.signedUrl(item.path, "videos").then(function (url) {
        if (!url) { next(); return; }
        return posterFromUrl(url).then(function (file) {
          if (!file) { next(); return; }
          return Cloud.uploadPhoto(file).then(function (res) {
            item.poster = res.path; t.updatedAt = Date.now(); save(); syncTrick(t);
            updateCardThumb(t); next();
          });
        });
      }).catch(function () { next(); });
    };
    next();
  }
  function updateCardThumb(t) {
    var thumb = view.querySelector('.card[data-id="' + t.id + '"] .thumb'); if (!thumb) return;
    var item = (t.media || []).filter(function (m) { return m.poster; })[0]; if (!item) return;
    Cloud.signedUrl(item.poster, "photos").then(function (url) {
      if (!url) return;
      var fav = t.favorite ? '<span class="fav">' + icon("starfill", "i-sm") + "</span>" : "";
      thumb.innerHTML = '<span class="cthumb loaded" style="background-image:url(' + url + ')"></span><span class="play">' + icon("play", "i-sm") + "</span>" + fav;
    });
  }
  // Decide la miniatura del truco: foto → póster de vídeo → carátula de embed →
  // marcador de vídeo/enlace. Garantiza miniatura si hay fotos o vídeos.
  function trickThumb(t) {
    var media = t.media || [], photos = t.photos || [];
    var embed = media.filter(function (m) { return m.thumb; })[0];
    var poster = media.filter(function (m) { return m.poster; })[0];
    if (embed) return { kind: "embedimg", url: embed.thumb };
    if (poster) return { kind: "video", path: poster.poster };
    if (photos[0] && photos[0].path) return { kind: "img", path: photos[0].path };
    if (media.filter(function (m) { return m.provider !== "link"; })[0]) return { kind: "videoicon" };
    if (media.length) return { kind: "linkicon" };
    return null;
  }
  function trickCard(t) {
    var th = trickThumb(t), inner, play = "";
    if (!th) inner = '<span class="ph">' + engraving(t.id) + icon("cards") + "</span>";
    else if (th.kind === "embedimg") { inner = '<img src="' + esc(th.url) + '" loading="lazy" decoding="async" alt="">'; play = '<span class="play">' + icon("play", "i-sm") + "</span>"; }
    else if (th.kind === "img") inner = '<span class="cthumb" data-thumb="' + esc(th.path) + '"></span>';
    else if (th.kind === "video") { inner = '<span class="cthumb" data-thumb="' + esc(th.path) + '"></span>'; play = '<span class="play">' + icon("play", "i-sm") + "</span>"; }
    else if (th.kind === "videoicon") { inner = '<span class="ph">' + engraving(t.id) + icon("film") + "</span>"; play = '<span class="play">' + icon("play", "i-sm") + "</span>"; }
    else inner = '<span class="ph">' + engraving(t.id) + icon("link") + "</span>";
    return (
      '<div class="card" data-id="' + t.id + '">' +
      '<div class="thumb">' + inner + play + (t.favorite ? '<span class="fav">' + icon("starfill", "i-sm") + "</span>" : "") + "</div>" +
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

    var colMedia = (media ? '<div class="sec-label">Vídeos</div>' + media : "") + photosHtml;
    var colInfo =
      specs +
      (t.notes ? '<div class="sec-label">Notas</div><div class="notes">' + esc(t.notes) + "</div>" : "") +
      tags +
      '<div class="sec-label">Estado de aprendizaje</div>' +
      '<div class="seg" id="statusSeg">' +
      Object.keys(STATUS).map(function (k) { return '<button data-st="' + k + '" class="' + (t.status === k ? "on" : "") + '">' + STATUS[k] + "</button>"; }).join("") +
      "</div>" +
      '<button class="btn ghost" id="editBtn2">Editar truco</button>' +
      (logged() ? '<button class="btn ghost" id="shareBtn">' + icon("share", "i-sm") + " Compartir por enlace</button>" : "") +
      '<button class="btn danger" id="delBtn">Eliminar</button>';

    view.innerHTML =
      '<div class="screen detail">' +
      '<div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/\'">' + icon("back") + '</button><h1>Truco</h1>' +
      '<span style="flex:1"></span>' +
      '<button class="iconbtn ' + (t.favorite ? "on" : "") + '" id="favBtn">' + icon(t.favorite ? "starfill" : "star") + "</button>" +
      '<button class="iconbtn" id="editBtn" aria-label="Editar truco">' + icon("edit") + "</button></div>" +
      '<div class="d-eyebrow">' + esc(t.category || "Sin categoría") + "</div>" +
      '<h1 class="title">' + esc(t.title) + "</h1>" +
      '<div class="detail-badges">' +
      '<span class="pill df">' + (DIFF[t.difficulty] || "—") + "</span>" +
      '<span class="pill st-' + (t.status || "poraprender") + '">' + (STATUS[t.status] || "") + "</span></div>" +
      '<div class="detail-grid">' +
      '<div class="dcol">' + colMedia + "</div>" +
      '<div class="dcol">' + colInfo + "</div>" +
      "</div>" +
      "</div>";

    document.getElementById("favBtn").addEventListener("click", function () { t.favorite = !t.favorite; t.updatedAt = Date.now(); save(); syncTrick(t); renderDetail(id); });
    document.getElementById("editBtn").addEventListener("click", function () { location.hash = "#/editar/" + id; });
    document.getElementById("editBtn2").addEventListener("click", function () { location.hash = "#/editar/" + id; });
    var shBtn = document.getElementById("shareBtn"); if (shBtn) shBtn.addEventListener("click", function () { shareTrick(t, shBtn); });
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
            : '<div class="fallback">Vídeo no disponible</div>';
        });
      } else {
        box.innerHTML = '<div class="fallback">Inicia sesión para ver este vídeo</div>';
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
      '<div class="pagehead"><button class="back" aria-label="Volver" onclick="history.back()">' + icon("back") + '</button><h1>' + (editing ? "Editar truco" : "Nuevo truco") + "</h1></div>" +
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
        var item = { provider: "upload", path: null, title: file.name, thumb: null, poster: null, uploading: true };
        draftMedia.push(item); paintDraftMedia();
        var resetBtn = function () { upBtn.disabled = false; upBtn.innerHTML = icon("upload", "i-sm") + " Subir un vídeo propio"; };
        // Genera y sube una miniatura (fotograma) en paralelo, desde el archivo local.
        makePoster(file).then(function (pf) { return pf ? Cloud.uploadPhoto(pf) : null; })
          .then(function (pr) { if (pr) { item.poster = pr.path; paintDraftMedia(); } }).catch(function () {});
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
      var thumb = m.thumb ? '<img src="' + esc(m.thumb) + '" loading="lazy" decoding="async" alt="">' : icon(m.provider === "upload" ? "film" : m.provider === "link" ? "link" : "play", "i-sm");
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
      tags: tags, media: draftMedia.filter(function (m) { return !m.uploading && (m.path || m.embed || m.url); }), photos: draftPhotos.filter(function (p) { return p.path; }).map(function (p) { return { path: p.path }; }), meta: meta, updatedAt: Date.now()
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
      body = '<div class="empty">' + emptyArt() + '<h3>Sin rutinas todavía</h3>' +
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
      '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="history.back()">' + icon("back") + "</button><h1>" + (id ? "Editar rutina" : "Nueva rutina") + "</h1></div>" +
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
      '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/rutinas\'">' + icon("back") + '</button><h1>Rutina</h1>' +
      '<span style="flex:1"></span><button class="iconbtn" id="rEdit">' + icon("edit") + "</button></div>" +
      '<h1 class="title">' + esc(r.name) + "</h1>" +
      (r.notes ? '<div class="notes" style="margin:6px 0 4px">' + esc(r.notes) + "</div>" : "") +
      (empty ? '<div class="empty" style="padding:36px 10px"><div class="big">' + icon("cards") + "</div><p>Aún no has añadido trucos.</p></div>"
        : '<div class="sec-label">Orden del set</div><div class="ritems">' + items + "</div>") +
      '<button class="btn ghost" id="rAdd">Añadir truco</button>' +
      (empty ? "" : '<button class="btn" id="rPerform">' + icon("play", "i-sm") + " Actuar</button>") +
      (logged() && !empty ? '<button class="btn ghost" id="rShare">' + icon("share", "i-sm") + " Compartir por enlace</button>" : "") +
      '<button class="btn danger" id="rDel">Eliminar rutina</button></div>';

    document.getElementById("rEdit").addEventListener("click", function () { location.hash = "#/rutina-edit/" + id; });
    document.getElementById("rAdd").addEventListener("click", function () { location.hash = "#/rutina-add/" + id; });
    var perf = document.getElementById("rPerform"); if (perf) perf.addEventListener("click", function () { location.hash = "#/actuar/" + id; });
    var rsh = document.getElementById("rShare"); if (rsh) rsh.addEventListener("click", function () { shareRoutine(r, rsh); });
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
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/rutina/' + id + '\'">' + icon("back") + '</button><h1>Añadir a la rutina</h1></div>' + body + "</div>";
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
      body = '<div class="empty">' + emptyArt() + '<h3>Sin bolos todavía</h3>' +
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
      '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="history.back()">' + icon("back") + "</button><h1>" + (id ? "Editar bolo" : "Nuevo bolo") + "</h1></div>" +
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
      '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/bolos\'">' + icon("back") + '</button><h1>Bolo</h1>' +
      '<span style="flex:1"></span><button class="iconbtn" id="gEdit">' + icon("edit") + "</button></div>" +
      '<h1 class="title">' + esc(g.client || "Bolo") + "</h1>" +
      '<div class="detail-badges"><span class="tagchip">' + fmtDate(g.date) + "</span>" +
      (g.venue ? '<span class="tagchip">' + esc(g.venue) + "</span>" : "") +
      (g.fee !== "" && g.fee != null ? '<span class="pill df">' + esc(g.fee) + " €</span>" : "") + "</div>" +
      (g.notes ? '<div class="notes">' + esc(g.notes) + "</div>" : "") +
      (repeated.length ? '<div class="backstage-bar danger"><span class="dot"></span> Ojo: ' + repeated.length + " truco(s) ya se los hiciste a este cliente.</div>" : "") +
      '<div class="sec-label">Qué actué</div>' + perfHtml +
      '<button class="btn danger" id="gDel">Eliminar bolo</button></div>';
    document.getElementById("gEdit").addEventListener("click", function () { location.hash = "#/bolo-edit/" + id; });
    view.querySelectorAll(".rc[data-open]").forEach(function (c) { c.addEventListener("click", function () { location.hash = "#/truco/" + c.getAttribute("data-open"); }); });
    document.getElementById("gDel").addEventListener("click", function () {
      if (confirm("¿Eliminar este bolo?")) { var wr = g.remote; state.gigs = state.gigs.filter(function (x) { return x.id !== id; }); save(); syncDeleteGig(id, wr); toast("Bolo eliminado"); location.hash = "#/bolos"; }
    });
  }

  /* ============================ PRÁCTICA ============================= */
  function renderPractice() {
    clearTabbar();
    var due = dueTricks();
    var body = due.length
      ? '<div class="ritems">' + due.map(function (t) {
          var pr = t.practice || {};
          var sub = pr.last ? "Racha " + (pr.reps || 0) + " · última: " + fmtDateTs(pr.last) : "Nunca practicado";
          return '<div class="pracrow"><div class="rc" data-open="' + t.id + '"><div class="n">' + esc(t.title) + '</div><div class="d">' + esc(t.category || "") + " · " + sub + "</div></div>" +
            '<div class="pracact"><button class="btn small" data-done="' + t.id + '">' + icon("check", "i-sm") + ' Hecho</button><button class="btn small ghost" data-snooze="' + t.id + '">Posponer</button></div></div>';
        }).join("") + "</div>"
      : '<div class="empty">' + emptyArt() + '<h3>¡Todo al día!</h3><p>No hay trucos para practicar hoy. Marca trucos como “Aprendiendo” para entrenarlos aquí con repetición espaciada.</p></div>';
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/\'">' + icon("back") + '</button><h1>Práctica</h1></div>' +
      '<p class="subtitle">' + (due.length ? due.length + " truco(s) para hoy" : "Repetición espaciada") + "</p>" + body + "</div>";
    view.querySelectorAll(".rc[data-open]").forEach(function (c) { c.addEventListener("click", function () { location.hash = "#/truco/" + c.getAttribute("data-open"); }); });
    view.querySelectorAll("[data-done]").forEach(function (b) { b.addEventListener("click", function () { var t = getTrick(b.getAttribute("data-done")); if (t) { markPracticed(t); toast("¡Bien! Próximo repaso programado"); renderPractice(); } }); });
    view.querySelectorAll("[data-snooze]").forEach(function (b) { b.addEventListener("click", function () { var t = getTrick(b.getAttribute("data-snooze")); if (t) { postponePractice(t); renderPractice(); } }); });
  }

  /* =========================== ESTADÍSTICAS ========================== */
  function renderStats() {
    clearTabbar();
    var T = state.tricks, year = String(new Date().getFullYear());
    var st = { poraprender: 0, aprendiendo: 0, dominado: 0 };
    T.forEach(function (t) { if (st[t.status] != null) st[t.status]++; });
    var tot = T.length || 1;
    var cats = {};
    T.forEach(function (t) { var c = t.category || "Otros"; cats[c] = (cats[c] || 0) + 1; });
    var topCats = Object.keys(cats).map(function (k) { return { k: k, n: cats[k] }; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 6);
    var gigs = state.gigs;
    var gigsYear = gigs.filter(function (g) { return (g.date || "").indexOf(year) === 0; });
    var money = function (arr) { return arr.reduce(function (s, g) { return s + (parseFloat(g.fee) || 0); }, 0); };
    var vids = T.reduce(function (s, t) { return s + (t.media || []).length; }, 0);

    function tile(n, l) { return '<div class="stat"><div class="num">' + n + '</div><div class="lbl">' + l + "</div></div>"; }
    function bar(label, val, max, cls) { var pct = max ? Math.round(val / max * 100) : 0; return '<div class="statbar"><div class="bl"><span>' + label + "</span><span>" + val + '</span></div><div class="track"><i class="' + (cls || "") + '" style="width:' + pct + '%"></i></div></div>'; }

    view.innerHTML =
      '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/ajustes\'">' + icon("back") + '</button><h1>Estadísticas</h1></div>' +
      '<div class="sec-label">Repertorio</div>' +
      '<div class="stats-grid">' +
      tile(T.length, "trucos") + tile(st.dominado, "dominados") + tile(Math.round(st.dominado / tot * 100) + "%", "de dominio") +
      tile(state.routines.length, state.routines.length === 1 ? "rutina" : "rutinas") + tile(vids, "vídeos") + tile(dueTricks().length, "a practicar hoy") +
      "</div>" +
      '<div class="sec-label">Aprendizaje</div><div class="panel">' +
      bar("Por aprender", st.poraprender, T.length, "b-slate") +
      bar("Aprendiendo", st.aprendiendo, T.length, "b-warn") +
      bar("Dominado", st.dominado, T.length, "b-ok") + "</div>" +
      (topCats.length ? '<div class="sec-label">Por categoría</div><div class="panel">' + topCats.map(function (c) { return bar(c.k, c.n, T.length); }).join("") + "</div>" : "") +
      '<div class="sec-label">Bolos</div><div class="stats-grid">' +
      tile(gigs.length, "bolos") + tile(gigsYear.length, "este año") +
      tile(Math.round(money(gigs)) + " €", "ingresos") + tile(Math.round(money(gigsYear)) + " €", "este año") +
      "</div></div>";
  }

  /* ============================ COMPARTIR ============================ */
  // Construye una foto fija (snapshot) del truco lista para un enlace público.
  function mediaForShare(m) {
    var base = { title: m.title || "", provider: m.provider, chapters: m.chapters || [], transcript: m.transcript || "" };
    if (m.embed) { base.embed = m.embed; if (m.url) base.url = m.url; return Promise.resolve(base); }
    if (m.provider === "upload" && m.path && cloudReady()) {
      return Cloud.signedUrlLong(m.path, "videos").then(function (u) { if (u) base.shareUrl = u; return base; });
    }
    if (m.url) base.url = m.url;
    return Promise.resolve(base);
  }
  function photosForShare(photos) {
    return Promise.all((photos || []).map(function (p) {
      if (!p.path || !cloudReady()) return Promise.resolve(null);
      return Cloud.signedUrlLong(p.path, "photos").then(function (u) { return u ? { shareUrl: u } : null; });
    })).then(function (arr) { return arr.filter(Boolean); });
  }
  function buildTrickPayload(t) {
    return Promise.all([Promise.all((t.media || []).map(mediaForShare)), photosForShare(t.photos)]).then(function (res) {
      return { title: t.title, category: t.category || "", difficulty: t.difficulty || "", meta: t.meta || {}, notes: t.notes || "", tags: t.tags || [], media: res[0], photos: res[1] };
    });
  }
  function shareTrick(t, btn) {
    if (!cloudReady()) { toast("Inicia sesión para compartir"); return; }
    if (!confirm("Se creará un enlace público. Cualquiera con el enlace podrá ver este truco (notas y vídeos incluidos), sin necesidad de cuenta. ¿Continuar?")) return;
    btnBusy(btn, true);
    buildTrickPayload(t).then(function (payload) { return Cloud.createShare("trick", t.title, payload); })
      .then(function (token) { finishShare(token, btn); })
      .catch(function () { btnBusy(btn, false); toast("No se pudo crear el enlace"); });
  }
  function shareRoutine(r, btn) {
    if (!cloudReady()) { toast("Inicia sesión para compartir"); return; }
    if (!confirm("Se creará un enlace público con el orden del set y sus trucos (notas y vídeos incluidos), sin necesidad de cuenta. ¿Continuar?")) return;
    btnBusy(btn, true);
    var tricks = (r.trickIds || []).map(getTrick).filter(Boolean);
    Promise.all(tricks.map(buildTrickPayload))
      .then(function (items) { return Cloud.createShare("routine", r.name, { name: r.name, notes: r.notes || "", tricks: items }); })
      .then(function (token) { finishShare(token, btn); })
      .catch(function () { btnBusy(btn, false); toast("No se pudo crear el enlace"); });
  }
  function btnBusy(btn, on) { if (!btn) return; if (on) { btn._t = btn.innerHTML; btn.disabled = true; btn.textContent = "Creando enlace…"; } else { btn.disabled = false; if (btn._t) btn.innerHTML = btn._t; } }
  function shareUrlFor(token) { return location.origin + location.pathname + "#/s/" + token; }
  function copyText(text) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () { return false; }); } catch (e) {}
    return Promise.resolve(false);
  }
  function finishShare(token, btn) {
    btnBusy(btn, false);
    var url = shareUrlFor(token);
    copyText(url).then(function (ok) { if (ok) toast("Enlace copiado"); renderShareDialog(url); });
  }
  function renderShareDialog(url) {
    var ov = el('<div class="modal-ov"><div class="modal">' +
      '<h3>Enlace para compartir</h3>' +
      '<p class="hint">Cualquiera con este enlace puede verlo, sin necesidad de cuenta. No lo compartas si contiene métodos que quieras mantener en secreto.</p>' +
      '<div class="linkbox"><input readonly id="shLink" value="' + esc(url) + '"></div>' +
      '<div class="modal-act"><button class="btn" id="shCopy">' + icon("copy", "i-sm") + " Copiar enlace</button>" +
      (navigator.share ? '<button class="btn ghost" id="shNative">' + icon("share", "i-sm") + " Compartir…</button>" : "") +
      '<button class="btn ghost" id="shClose">Cerrar</button></div>' +
      "</div></div>");
    document.body.appendChild(ov);
    var close = function () { ov.remove(); };
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    document.getElementById("shClose").addEventListener("click", close);
    var inp = document.getElementById("shLink");
    document.getElementById("shCopy").addEventListener("click", function () { try { inp.select(); } catch (e) {} copyText(url).then(function (ok) { toast(ok ? "Copiado" : "Selecciónalo y copia"); }); });
    var nat = document.getElementById("shNative"); if (nat) nat.addEventListener("click", function () { navigator.share({ title: "App del Mago", url: url }).catch(function () {}); });
    setTimeout(function () { try { inp.focus(); inp.select(); } catch (e) {} }, 30);
  }

  /* ------------------- vista pública (solo lectura) ----------------- */
  function sharedMedia(media) {
    return (media || []).map(function (m) {
      var player;
      if (m.embed) player = '<div class="player"><iframe src="' + esc(m.embed) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>';
      else if (m.shareUrl) player = '<div class="player"><video controls playsinline preload="metadata" src="' + esc(m.shareUrl) + '" style="position:absolute;inset:0;width:100%;height:100%"></video></div>';
      else if (m.url) player = '<a class="linkcard" href="' + esc(m.url) + '" target="_blank" rel="noopener"><span class="ic">' + icon("link") + '</span><span class="n">' + esc(m.title || m.url) + "</span></a>";
      else return "";
      var extras = "";
      if (m.chapters && m.chapters.length) extras += '<div class="chapters">' + m.chapters.map(function (c) { return '<div class="chap"><span class="tm">' + esc(c.time) + "</span><span>" + esc(c.title) + "</span></div>"; }).join("") + "</div>";
      if (m.transcript) extras += '<details class="transcript"><summary>Transcripción</summary><div class="tr">' + esc(m.transcript) + "</div></details>";
      return player + extras;
    }).join("");
  }
  function sharedSpecs(meta) {
    var rows = META_ORDER.filter(function (k) { return meta && meta[k]; }).map(function (k) { return '<div class="specrow"><span class="k">' + META_LABELS[k] + '</span><span class="v">' + esc(meta[k]) + "</span></div>"; }).join("");
    return rows ? '<div class="sec-label">Ficha</div><div class="specs">' + rows + "</div>" : "";
  }
  function sharedPhotos(photos) {
    var got = (photos || []).filter(function (p) { return p.shareUrl; });
    return got.length ? '<div class="sec-label">Fotos</div><div class="photogrid">' + got.map(function (p) { return '<div class="photocell view"><span class="ph-img" style="background-image:url(' + esc(p.shareUrl) + ')"></span></div>'; }).join("") + "</div>" : "";
  }
  function sharedNotesTags(p) {
    return (p.notes ? '<div class="sec-label">Notas</div><div class="notes">' + esc(p.notes) + "</div>" : "") +
      ((p.tags && p.tags.length) ? '<div class="sec-label">Etiquetas</div><div class="tagchips">' + p.tags.map(function (x) { return '<span class="tagchip">#' + esc(x) + "</span>"; }).join("") + "</div>" : "");
  }
  function sharedHeader(title) { return '<div class="shared-badge">' + icon("share", "i-sm") + " Compartido contigo</div><h1 class=\"title\">" + esc(title) + "</h1>"; }
  function sharedFooter() { return '<div class="shared-cta"><p>Crea y organiza tu propia biblioteca con <b>App del Mago</b>.</p><button class="btn" onclick="location.hash=\'#/\';location.reload()">Abrir la app</button></div>'; }
  function sharedError(msg) { return '<div class="screen shared"><div class="empty" style="padding:64px 14px"><div class="big">' + icon("share") + "</div><p>" + esc(msg) + '</p><button class="btn" style="margin-top:18px" onclick="location.hash=\'#/\';location.reload()">Abrir App del Mago</button></div></div>'; }
  function renderSharedTrick(s) {
    var p = s.payload || {}; var media = sharedMedia(p.media);
    view.innerHTML = '<div class="screen detail shared">' + sharedHeader(p.title || s.title || "Truco") +
      '<div class="detail-badges">' + (p.difficulty ? '<span class="pill df">' + (DIFF[p.difficulty] || "") + "</span>" : "") + (p.category ? '<span class="tagchip">' + esc(p.category) + "</span>" : "") + "</div>" +
      '<div class="detail-grid"><div class="dcol">' + (media ? '<div class="sec-label">Vídeos</div>' + media : "") + sharedPhotos(p.photos) + "</div>" +
      '<div class="dcol">' + sharedSpecs(p.meta) + sharedNotesTags(p) + "</div></div>" + sharedFooter() + "</div>";
  }
  function renderSharedRoutine(s) {
    var p = s.payload || {};
    var tricks = (p.tricks || []).map(function (tp, i) {
      var media = sharedMedia(tp.media);
      var body = '<div class="detail-badges">' + (tp.difficulty ? '<span class="pill df">' + (DIFF[tp.difficulty] || "") + "</span>" : "") + (tp.category ? '<span class="tagchip">' + esc(tp.category) + "</span>" : "") + "</div>" +
        (media ? '<div class="sec-label">Vídeos</div>' + media : "") + sharedPhotos(tp.photos) + sharedSpecs(tp.meta) + sharedNotesTags(tp);
      return '<div class="shared-trick"><div class="st-num">' + (i + 1) + '</div><div class="st-body"><h2 class="title" style="font-size:22px;margin:0 0 6px">' + esc(tp.title || "Truco") + "</h2>" + body + "</div></div>";
    }).join("");
    view.innerHTML = '<div class="screen shared">' + sharedHeader(p.name || s.title || "Rutina") +
      (p.notes ? '<div class="notes" style="margin-bottom:12px">' + esc(p.notes) + "</div>" : "") +
      '<div class="sec-label">Orden del set</div>' + (tricks || '<p class="hint">Sin trucos.</p>') + sharedFooter() + "</div>";
  }
  // Gestión: lista de enlaces creados, con copiar y revocar.
  function renderShares() {
    clearTabbar();
    if (!logged()) { location.hash = "#/ajustes"; return; }
    var head = '<div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/ajustes\'">' + icon("back") + '</button><h1>Enlaces compartidos</h1></div>';
    view.innerHTML = '<div class="screen">' + head + skelRows(4) + '</div>';
    Cloud.listShares().then(function (rows) {
      var body;
      if (!rows.length) {
        body = '<div class="empty" style="padding:52px 12px"><div class="big">' + icon("share") + '</div><p>No has compartido nada todavía.</p><p class="hint">Usa “Compartir por enlace” en un truco o una rutina.</p></div>';
      } else {
        body = '<p class="subtitle">Cualquiera con el enlace puede ver el contenido. Revócalo para que deje de funcionar.</p><div class="sharelist">' +
          rows.map(function (s) {
            var when = "";
            try { when = new Date(s.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }); } catch (e) {}
            return '<div class="shareitem"><div class="si">' + icon(s.kind === "routine" ? "list" : "cards") + "</div>" +
              '<div class="stx"><div class="n">' + esc(s.title || (s.kind === "routine" ? "Rutina" : "Truco")) + '</div><div class="d">' + (s.kind === "routine" ? "Rutina" : "Truco") + (when ? " · " + when : "") + "</div></div>" +
              '<div class="sact"><button class="iconbtn" data-copy="' + esc(s.id) + '">' + icon("copy", "i-sm") + '</button><button class="iconbtn dgr" data-revoke="' + esc(s.id) + '">' + icon("x", "i-sm") + "</button></div></div>";
          }).join("") + "</div>";
      }
      view.innerHTML = '<div class="screen">' + head + body + "</div>";
      view.querySelectorAll("[data-copy]").forEach(function (btn) {
        btn.addEventListener("click", function () { var url = shareUrlFor(btn.getAttribute("data-copy")); copyText(url).then(function (ok) { toast(ok ? "Enlace copiado" : url); }); });
      });
      view.querySelectorAll("[data-revoke]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (!confirm("¿Revocar este enlace? Dejará de funcionar para quien lo tenga.")) return;
          btn.disabled = true;
          Cloud.deleteShare(btn.getAttribute("data-revoke")).then(function () { toast("Enlace revocado"); renderShares(); })
            .catch(function () { btn.disabled = false; toast("No se pudo revocar"); });
        });
      });
    }).catch(function () {
      view.innerHTML = '<div class="screen">' + head + '<div class="empty" style="padding:52px 12px"><p>No se pudieron cargar los enlaces.</p></div></div>';
    });
  }

  function renderShared(token) {
    clearTabbar(); var f = document.getElementById("fabEl"); if (f) f.remove();
    view.innerHTML = '<div class="screen shared"><div class="splash" style="padding:72px 0"><div class="spin"></div></div></div>';
    if (!token) { view.innerHTML = sharedError("Enlace no válido."); return; }
    if (!cloudReady()) { view.innerHTML = sharedError("Este enlace necesita conexión a internet."); return; }
    Cloud.getShare(token).then(function (s) {
      if (!s) { view.innerHTML = sharedError("Este enlace no existe o ha sido eliminado."); return; }
      if (s.kind === "routine") renderSharedRoutine(s); else renderSharedTrick(s);
    }).catch(function () { view.innerHTML = sharedError("No se pudo cargar el enlace."); });
  }

  /* ===================== COMUNIDAD + MERCADO ======================== */
  var myProfile = null, needsOnboarding = false, feedCh = null, notifCh = null;
  var socialEnabled = (function () { try { return localStorage.getItem("magic_social") !== "0"; } catch (e) { return true; } })();
  var SPECIALTIES = ["Cartomagia", "Mentalismo", "Close-up", "Escena", "Infantil", "Monedas", "Ilusionismo", "Comedia"];

  function loadProfile() {
    if (!cloudReady() || !logged()) { myProfile = null; return Promise.resolve(); }
    return Cloud.getMyProfile().then(function (p) {
      myProfile = p;
      socialEnabled = p ? !!p.social_enabled : true;
      myStreak = (p && p.streak) || 0;
      try { localStorage.setItem("magic_social", socialEnabled ? "1" : "0"); } catch (e) {}
      needsOnboarding = !p || !p.onboarded;
      if (p && p.onboarded && socialEnabled && Cloud.pingStreak) return Cloud.pingStreak().then(function (s) { if (s) myStreak = s; });
    }).catch(function () { myProfile = null; });
  }
  function avatarHtml(url, name, cls) {
    var lab = name ? ' role="img" aria-label="' + esc(name) + '"' : ' aria-hidden="true"';
    if (url) return '<span class="avatar ' + (cls || "") + '"' + lab + ' style="background-image:url(' + esc(url) + ')"></span>';
    var ini = (name || "?").trim().charAt(0).toUpperCase();
    return '<span class="avatar ' + (cls || "") + ' ini"' + lab + ">" + esc(ini) + "</span>";
  }
  function money(cents, cur) {
    if (!cents) return "Gratis";
    return (cents / 100).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + ((cur || "eur") === "eur" ? "€" : (cur || "").toUpperCase());
  }
  function timeAgo(iso) {
    var s = Math.max(1, Math.floor((Date.now() - (Date.parse(iso) || Date.now())) / 1000));
    if (s < 60) return "ahora"; var m = Math.floor(s / 60); if (m < 60) return "hace " + m + " min";
    var h = Math.floor(m / 60); if (h < 24) return "hace " + h + " h"; var d = Math.floor(h / 24);
    if (d < 7) return "hace " + d + " d"; return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  }

  /* --------------------------- Onboarding --------------------------- */
  var onb = { step: 0, handle: "", name: "", spec: [], city: "", avatar: null, social: true };
  function renderOnboarding() {
    clearTabbar();
    if (myProfile) { onb.handle = onb.handle || myProfile.handle || ""; onb.name = onb.name || myProfile.display_name || (session && session.email ? session.email.split("@")[0] : ""); }
    var step = onb.step;
    var body;
    if (step === 0) {
      body = '<div class="onb-hero">' + mark("", true) + '<h1 class="wm">Bienvenido al círculo</h1>' +
        '<p class="tagline">Solo por invitación</p>' +
        '<p>Tu biblioteca privada de trucos, rutinas y bolos. Y, si quieres, una comunidad y un mercado <b>solo para magos</b>.</p></div>' +
        '<div class="field"><label>Tu código de invitación</label><input id="onbInvite" autocapitalize="characters" autocomplete="off" placeholder="MAGO-XXXXX" value="' + esc(getPendingInvite()) + '"></div>' +
        '<button class="btn" id="onbNext">Validar y empezar</button>';
    } else if (step === 1) {
      body = '<h1 class="title">Tu perfil de mago</h1><p class="subtitle">Así te verán otros magos (si activas la comunidad).</p>' +
        '<div class="avatar-pick"><span id="avaPrev">' + avatarHtml(onb.avatar && onb.avatar.url, onb.name, "big") + '</span>' +
        (logged() ? '<button class="btn ghost small" id="avaBtn">Elegir foto</button><input type="file" id="avaFile" accept="image/*" style="display:none">' : "") + "</div>" +
        '<div class="field"><label>Nombre artístico</label><input id="onbName" placeholder="Ej. Mago Merlín" value="' + esc(onb.name) + '"></div>' +
        '<div class="field"><label>Usuario (@)</label><input id="onbHandle" placeholder="magomerlin" value="' + esc(onb.handle) + '"><div class="hint" id="handleHint"></div></div>' +
        '<div class="field"><label>Especialidad</label><div class="tchips" id="onbSpec">' +
        SPECIALTIES.map(function (s) { return '<button type="button" class="tchip ' + (onb.spec.indexOf(s) >= 0 ? "on" : "") + '" data-s="' + esc(s) + '">' + esc(s) + "</button>"; }).join("") + "</div></div>" +
        '<div class="field"><label>Ciudad (opcional)</label><input id="onbCity" placeholder="Madrid" value="' + esc(onb.city) + '"></div>' +
        '<button class="btn" id="onbNext">Continuar</button>';
    } else if (step === 2) {
      body = '<h1 class="title">La comunidad</h1><p class="subtitle">Una red y un mercado exclusivos para magos.</p>' +
        '<div class="onb-feat"><span class="i2">' + icon("people") + '</span><div><b>Comparte y descubre</b><p>Publica ideas, sigue a otros magos y aprende de la comunidad.</p></div></div>' +
        '<div class="onb-feat"><span class="i2">' + icon("bag") + '</span><div><b>Mercado de magos</b><p>Vende métodos digitales o material físico: barajas, gimmicks, libros… Tú pones el precio.</p></div></div>' +
        '<div class="onb-feat"><span class="i2">' + icon("lock") + '</span><div><b>Tú decides</b><p>Puedes tener la comunidad desactivada y usar la app como biblioteca 100% privada. Se cambia cuando quieras en Ajustes.</p></div></div>' +
        '<div class="toggle-row" id="socToggle"><div><b>Activar la comunidad</b><p class="hint">Recomendado. Podrás desactivarla en cualquier momento.</p></div><span class="switch ' + (onb.social ? "on" : "") + '" id="socSw"></span></div>' +
        '<button class="btn" id="onbFinish">' + (onb.social ? "Continuar" : "Entrar a App del Mago") + "</button>";
    } else {
      body = '<h1 class="title">Sigue a algunos magos</h1><p class="subtitle">Así tu feed empieza con vida. Puedes cambiarlo cuando quieras.</p>' +
        '<div id="onbSugg">' + skelRows(3) + '</div>' +
        '<button class="btn" id="onbEnter">Entrar a App del Mago</button>';
    }
    view.innerHTML = '<div class="screen onb">' + (step > 0 ? '<div class="onb-steps"><i class="on"></i><i class="' + (step >= 2 ? "on" : "") + '"></i><i class="' + (step >= 3 ? "on" : "") + '"></i></div>' : "") + body + "</div>";
    if (step === 3) {
      Cloud.suggestMagicians().then(function (mg) { var s = document.getElementById("onbSugg"); if (!s) return; s.innerHTML = mg.length ? '<div class="mago-list">' + mg.map(magicianRow).join("") + "</div>" : '<p class="hint">Todavía no hay más magos por aquí. ¡Serás de los primeros!</p>'; bindMagicianRows(s); }).catch(function () {});
      document.getElementById("onbEnter").addEventListener("click", function () { location.hash = "#/"; route(); });
    }

    var nx = document.getElementById("onbNext");
    if (nx) nx.addEventListener("click", function () {
      if (step === 0) {
        var code = (document.getElementById("onbInvite").value || "").trim().toUpperCase();
        nx.disabled = true; nx.textContent = "Validando…";
        Cloud.redeemInvite(code).then(function (ok) {
          if (!ok) { nx.disabled = false; nx.textContent = "Validar y empezar"; toast("Esa invitación no es válida o ya se ha usado"); return; }
          setPendingInvite(null); onb.step++; renderOnboarding();
        }).catch(function () { nx.disabled = false; nx.textContent = "Validar y empezar"; toast("No se pudo validar la invitación"); });
        return;
      }
      if (step === 1) {
        onb.name = (document.getElementById("onbName").value || "").trim();
        onb.handle = (document.getElementById("onbHandle").value || "").trim().replace(/[^a-zA-Z0-9_.]/g, "").slice(0, 24);
        onb.city = (document.getElementById("onbCity").value || "").trim();
        if (!onb.name) { toast("Escribe tu nombre artístico"); return; }
        if (onb.handle.length < 3) { toast("El usuario necesita al menos 3 caracteres"); return; }
      }
      onb.step++; renderOnboarding();
    });
    if (step === 1) {
      view.querySelectorAll("#onbSpec .tchip").forEach(function (b) {
        b.addEventListener("click", function () { var s = b.getAttribute("data-s"); var i = onb.spec.indexOf(s); if (i >= 0) onb.spec.splice(i, 1); else onb.spec.push(s); b.classList.toggle("on"); });
      });
      var avaBtn = document.getElementById("avaBtn");
      if (avaBtn) { var fi = document.getElementById("avaFile"); avaBtn.addEventListener("click", function () { fi.click(); });
        fi.addEventListener("change", function () { var f = fi.files[0]; if (!f) return; avaBtn.textContent = "Subiendo…"; Cloud.uploadSocial(f).then(function (r) { onb.avatar = r; document.getElementById("avaPrev").innerHTML = avatarHtml(r.url, onb.name, "big"); avaBtn.textContent = "Cambiar foto"; }).catch(function () { avaBtn.textContent = "Elegir foto"; toast("No se pudo subir"); }); }); }
      var hi = document.getElementById("onbHandle"), hint = document.getElementById("handleHint");
      hi.addEventListener("blur", function () {
        var h = hi.value.trim(); if (h.length < 3) return;
        Cloud.handleOwner(h).then(function (owner) { if (owner && (!myProfile || owner !== myProfile.user_id)) { hint.textContent = "Ese usuario ya existe"; hint.style.color = "var(--danger)"; } else { hint.textContent = "Disponible"; hint.style.color = "var(--ok)"; } });
      });
    }
    if (step === 2) {
      var sw = document.getElementById("socSw"), row = document.getElementById("socToggle");
      row.addEventListener("click", function () { onb.social = !onb.social; sw.classList.toggle("on", onb.social); });
      document.getElementById("onbFinish").addEventListener("click", function () {
        var btn = document.getElementById("onbFinish"); btn.disabled = true; btn.textContent = "Un momento…";
        Cloud.upsertProfile({ handle: onb.handle, display_name: onb.name, specialty: onb.spec, city: onb.city, avatar_path: onb.avatar ? onb.avatar.path : null, social_enabled: onb.social, onboarded: true })
          .then(function (p) { myProfile = p; socialEnabled = !!p.social_enabled; try { localStorage.setItem("magic_social", socialEnabled ? "1" : "0"); } catch (e) {} needsOnboarding = false; if (Cloud.pingStreak) Cloud.pingStreak().then(function (s) { myStreak = s || 0; });
            if (onb.social) { onb.step = 3; renderOnboarding(); } else { toast("¡Listo!"); location.hash = "#/"; route(); } })
          .catch(function (e) { btn.disabled = false; btn.textContent = "Continuar"; toast(/duplicate|unique/i.test(e && e.message || "") ? "Ese usuario ya existe" : "No se pudo guardar el perfil"); });
      });
    }
  }

  /* ----------------------------- Feed ------------------------------- */
  // Enlaza #hashtags y @menciones dentro del texto (ya escapado).
  function linkify(text) {
    return esc(text || "").replace(/#([A-Za-z0-9_áéíóúÁÉÍÓÚñÑ]+)/g, '<a class="tag" data-tag="$1">#$1</a>')
      .replace(/(^|\s)@([A-Za-z0-9_.]{3,})/g, '$1<a class="mention" data-h="$2">@$2</a>');
  }
  function trickCardHtml(tc) {
    return '<div class="trick-card"><span class="tc-ic">' + mark() + '</span><div><div class="n">' + esc(tc.title || "Truco") + '</div><div class="d">' + esc(tc.category || "") + (tc.difficulty ? " · " + (DIFF[tc.difficulty] || "") : "") + "</div></div></div>";
  }
  function listingInlineHtml(l) {
    return '<div class="listing-inline">' + (l.cover ? '<div class="lc-cover" style="background-image:url(' + esc(Cloud.publicUrl(l.cover) || l.cover) + ')"></div>' : '<div class="lc-cover ph">' + mark() + "</div>") +
      '<div class="lc-info"><div class="n">' + esc(l.title || "Truco") + '</div><div class="price">' + money(l.price, l.currency) + "</div></div><span class=\"go\">" + icon("chev") + "</span></div>";
  }
  function mediaHtml(media) {
    var out = "";
    (media || []).forEach(function (m) {
      if (m.kind === "video" && m.embed) out += '<div class="player"><iframe src="' + esc(m.embed) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>';
      else if (m.kind === "video" && m.url) out += '<div class="player native"><video src="' + esc(m.url) + '" controls playsinline preload="' + (m.poster ? "none" : "metadata") + '"' + (m.poster ? ' poster="' + esc(m.poster) + '"' : "") + "></video></div>";
    });
    var imgs = (media || []).filter(function (m) { return m.kind !== "video" && m.url; });
    if (imgs.length) out += '<div class="pc-imgs' + (imgs.length > 1 ? " multi" : "") + '">' + imgs.map(function (m) { return '<div class="post-img" style="background-image:url(' + esc(m.url) + ')"></div>'; }).join("") + "</div>";
    return out;
  }
  // Sube un vídeo propio al bucket público y captura su miniatura.
  function uploadOwnVideo(file, onDone) {
    if (!/^video\//.test(file.type || "") && !/\.(mp4|mov|webm|m4v|3gp)$/i.test(file.name || "")) { toast("Elige un archivo de vídeo"); return; }
    toast("Subiendo vídeo…");
    makePoster(file).then(function (poster) {
      return Promise.all([Cloud.uploadSocial(file), poster ? Cloud.uploadSocial(poster) : Promise.resolve(null)]);
    }).then(function (res) {
      onDone({ kind: "video", url: res[0].url, path: res[0].path, poster: res[1] ? res[1].url : null });
    }).catch(function () { toast("No se pudo subir el vídeo"); });
  }
  function postInnerHtml(p) {
    var media = mediaHtml(p.media);
    var card = (p.listing_id && p.listing) ? listingInlineHtml(p.listing) : (p.trick_card ? trickCardHtml(p.trick_card) : "");
    return (p.body ? '<div class="pc-body">' + linkify(p.body) + "</div>" : "") + (media ? '<div class="pc-media">' + media + "</div>" : "") + card;
  }
  function postCardHtml(p) {
    var isRepost = !!p.repost_of && p.orig;
    var head = '<header class="pc-head" data-mago="' + esc(p.author) + '">' + avatarHtml(Cloud.publicUrl(p.avatar), p.name || p.handle) +
      '<div class="pc-who"><div class="n">' + esc(p.name || p.handle || "Mago") + "</div><div class=\"h\">" + (p.handle ? "@" + esc(p.handle) : "") + " · " + timeAgo(p.created_at) + (p.edited_at ? " · editado" : "") + "</div></div>" +
      '<button class="pc-more" data-more="' + esc(p.id) + '" data-author="' + esc(p.author) + '" data-handle="' + esc(p.handle || "") + '" aria-label="Más opciones">' + icon("dots", "i-sm") + "</button></header>";
    var inner;
    if (isRepost) {
      var o = p.orig;
      inner = '<div class="repost-tag">' + icon("repost", "i-sm") + " reposteó</div>" + (p.body ? '<div class="pc-body">' + linkify(p.body) + "</div>" : "") +
        '<div class="repost-box" data-post="' + esc(o.id) + '"><div class="rb-head">' + avatarHtml(Cloud.publicUrl(o.avatar), o.name || o.handle, "sm") + "<span>" + esc(o.name || o.handle || "Mago") + "</span></div>" +
        (o.body ? '<div class="pc-body">' + linkify(o.body) + "</div>" : "") + (o.listing_id && o.listing ? listingInlineHtml(o.listing) : (o.trick_card ? trickCardHtml(o.trick_card) : "")) + "</div>";
    } else {
      inner = postInnerHtml(p);
    }
    return '<article class="postcard" data-post="' + esc(p.id) + '">' + head + inner +
      '<footer class="pc-acts"><button class="pc-like ' + (p.liked ? "on" : "") + '" data-like="' + esc(p.id) + '" aria-label="Me gusta">' + icon(p.liked ? "heartfill" : "heart", "i-sm") + '<span>' + (p.likes || 0) + "</span></button>" +
      '<button class="pc-cmt" data-post="' + esc(p.id) + '" aria-label="Comentar">' + icon("chat", "i-sm") + "<span>" + (p.comments || 0) + "</span></button>" +
      '<button class="pc-rep" data-rep="' + esc(p.id) + '" aria-label="Repostear">' + icon("repost", "i-sm") + "</button>" +
      '<span style="flex:1"></span>' +
      '<button class="pc-save ' + (p.saved ? "on" : "") + '" data-save="' + esc(p.id) + '" aria-label="Guardar">' + icon(p.saved ? "bookmarkfill" : "bookmark", "i-sm") + "</button></footer></article>";
  }
  function bindPostCards(scope) {
    var s = scope || view;
    s.querySelectorAll(".pc-head[data-mago]").forEach(function (h) { h.addEventListener("click", function (e) { if (e.target.closest(".pc-more")) return; e.stopPropagation(); location.hash = "#/mago/" + h.getAttribute("data-mago"); }); });
    s.querySelectorAll(".pc-cmt[data-post], .postcard .pc-body, .postcard .pc-media, .postcard .trick-card, .postcard .listing-inline, .repost-box").forEach(function (el0) {
      el0.addEventListener("click", function (e) { if (e.target.closest("a")) return; var box = el0.closest(".repost-box"); var art = el0.closest(".postcard"); location.hash = "#/post/" + ((box && box.getAttribute("data-post")) || (art && art.getAttribute("data-post"))); });
    });
    s.querySelectorAll("a.tag[data-tag]").forEach(function (a) { a.addEventListener("click", function (e) { e.stopPropagation(); location.hash = "#/tag/" + a.getAttribute("data-tag"); }); });
    s.querySelectorAll("a.mention[data-h]").forEach(function (a) { a.addEventListener("click", function (e) { e.stopPropagation(); openHandle(a.getAttribute("data-h")); }); });
    s.querySelectorAll("[data-like]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation(); var id = b.getAttribute("data-like"); var on = b.classList.contains("on");
        var span = b.querySelector("span"); var n = parseInt(span.textContent, 10) || 0;
        var paint = function (liked, count) { b.classList.toggle("on", liked); b.innerHTML = icon(liked ? "heartfill" : "heart", "i-sm") + "<span>" + count + "</span>"; };
        paint(!on, on ? Math.max(0, n - 1) : n + 1);
        if (!on) burstHearts(b);
        (on ? Cloud.unlikePost(id) : Cloud.likePost(id)).catch(function () { paint(on, n); toast("No se pudo, inténtalo de nuevo"); });
      });
    });
    s.querySelectorAll("[data-save]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation(); var id = b.getAttribute("data-save"); var on = b.classList.contains("on");
        b.classList.toggle("on"); b.innerHTML = icon(on ? "bookmark" : "bookmarkfill", "i-sm");
        (on ? Cloud.unbookmark(id) : Cloud.bookmark(id)).then(function () { toast(on ? "Quitado de guardados" : "Guardado"); }).catch(function () { b.classList.toggle("on", on); b.innerHTML = icon(on ? "bookmarkfill" : "bookmark", "i-sm"); toast("No se pudo, inténtalo de nuevo"); });
      });
    });
    s.querySelectorAll("[data-rep]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.stopPropagation(); var id = b.getAttribute("data-rep"); if (!confirm("¿Repostear a tus seguidores?")) return; Cloud.repost(id).then(function () { toast("Reposteado"); }).catch(function () { toast("No se pudo repostear"); }); });
    });
    s.querySelectorAll("[data-more]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.stopPropagation(); postMenu(b.getAttribute("data-more"), b.getAttribute("data-author"), b.getAttribute("data-handle"), b.closest(".postcard")); });
    });
  }
  function openHandle(h) { Cloud.handleOwner(h).then(function (id) { if (id) location.hash = "#/mago/" + id; else toast("No se encontró @" + h); }); }
  // Paginación: botón "Cargar más" que trae publicaciones anteriores y las añade.
  function appendMore(bodyEl, feedEl, rows, fetcher, seen) {
    if (!rows || rows.length < 40 || !feedEl) return;
    seen = seen || {}; rows.forEach(function (r) { if (r && r.id) seen[r.id] = 1; });
    var btn = el('<button class="btn ghost loadmore">Cargar más</button>');
    bodyEl.appendChild(btn);
    btn.addEventListener("click", function () {
      var last = rows[rows.length - 1]; btn.disabled = true; btn.textContent = "Cargando…";
      fetcher(last.created_at).then(function (more) {
        btn.remove();
        more = (more || []).filter(function (r) { return r && r.id && !seen[r.id]; }); // evita duplicados en límites de página
        if (!more.length) return;
        more.forEach(function (r) { seen[r.id] = 1; });
        var frag = document.createElement("div"); frag.innerHTML = more.map(postCardHtml).join("");
        bindPostCards(frag);
        while (frag.firstChild) feedEl.appendChild(frag.firstChild);
        appendMore(bodyEl, feedEl, more, fetcher, seen);
      }).catch(function () { btn.disabled = false; btn.textContent = "Cargar más"; });
    });
  }
  // Cierre animado de overlays: fundido + descenso antes de retirar del DOM.
  function dismissOv(ov, after) {
    if (!ov || ov.classList.contains("closing")) return;
    ov.classList.add("closing");
    setTimeout(function () { ov.remove(); if (after) after(); }, 170);
  }
  function actionSheet(opts) {
    var ov = el('<div class="modal-ov sheet"></div>');
    var box = el('<div class="sheet-box"></div>');
    opts.forEach(function (o) { var btn = el('<button class="sheet-btn ' + (o.danger ? "danger" : "") + '"></button>'); btn.textContent = o.label; btn.addEventListener("click", function () { dismissOv(ov, o.fn); }); box.appendChild(btn); });
    var cancel = el('<button class="sheet-btn cancel">Cancelar</button>'); cancel.addEventListener("click", function () { dismissOv(ov); }); box.appendChild(cancel);
    ov.appendChild(box); ov.addEventListener("click", function (e) { if (e.target === ov) dismissOv(ov); }); document.body.appendChild(ov);
  }
  // Autocompletado de @menciones y #hashtags en cualquier campo de texto.
  function attachAutocomplete(inp) {
    if (!inp || !cloudReady()) return;
    var panel = null, timer = null;
    var close = function () { if (panel) { panel.remove(); panel = null; } };
    var tokenAt = function () { var pos = inp.selectionStart; var upto = (inp.value || "").slice(0, pos); var m = upto.match(/(^|\s)([@#][\wáéíóúñ.]*)$/i); return m ? { trigger: m[2][0], q: m[2].slice(1), start: pos - (m[2].length), end: pos } : null; };
    var pick = function (text) { var tk = tokenAt(); if (!tk) { close(); return; } var ins = tk.trigger + text + " "; var v = inp.value; inp.value = v.slice(0, tk.start) + ins + v.slice(tk.end); var np = tk.start + ins.length; inp.setSelectionRange(np, np); inp.focus(); close(); };
    var show = function (items, render) {
      close(); if (!items.length) return;
      panel = el('<div class="ac-panel"></div>');
      items.forEach(function (it) { var row = el('<button type="button" class="ac-row"></button>'); row.innerHTML = render(it); row.addEventListener("mousedown", function (e) { e.preventDefault(); pick(it.value); }); panel.appendChild(row); });
      var r = inp.getBoundingClientRect();
      panel.style.left = Math.round(r.left) + "px"; panel.style.top = Math.round(r.bottom + 4) + "px"; panel.style.width = Math.round(r.width) + "px";
      document.body.appendChild(panel);
    };
    inp.addEventListener("input", function () {
      var tk = tokenAt(); if (!tk || tk.q.length < 1) { close(); return; }
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        if (tk.trigger === "@") {
          Cloud.searchMagicians(tk.q).then(function (list) { show((list || []).slice(0, 6).map(function (u) { return { value: u.handle, name: u.name, handle: u.handle, avatar: u.avatar }; }), function (it) { return avatarHtml(Cloud.publicUrl(it.avatar), it.name || it.handle, "sm") + '<span>@' + esc(it.handle || "") + "</span>"; }); }).catch(close);
        } else {
          Cloud.trendingTags().then(function (tags) { var q = tk.q.toLowerCase(); var f = (tags || []).filter(function (t) { return (t.tag || "").toLowerCase().indexOf(q) === 0; }); show((f.length ? f : tags || []).slice(0, 6).map(function (t) { return { value: t.tag }; }), function (it) { return '<span>#' + esc(it.value || "") + "</span>"; }); }).catch(close);
        }
      }, 180);
    });
    inp.addEventListener("blur", function () { setTimeout(close, 160); });
    inp.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }
  function editTextModal(title, current, onSave) {
    var ov = el('<div class="modal-ov"><div class="modal"><h3></h3><textarea id="etText" rows="4" class="sc-cap"></textarea><div class="modal-act"><button class="btn" id="etSave">Guardar</button><button class="btn ghost" id="etCancel">Cancelar</button></div></div></div>');
    ov.querySelector("h3").textContent = title;
    document.body.appendChild(ov);
    var ta = ov.querySelector("#etText"); ta.value = current || ""; setTimeout(function () { ta.focus(); }, 30);
    var close = function () { dismissOv(ov); };
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    ov.querySelector("#etCancel").addEventListener("click", close);
    ov.querySelector("#etSave").addEventListener("click", function () { var v = (ta.value || "").trim(); if (!v) { toast("Escribe algo"); return; } var btn = ov.querySelector("#etSave"); btn.disabled = true; btn.textContent = "Guardando…"; onSave(v, close, btn); });
  }
  function reportReasons(type, id) {
    actionSheet(["Spam", "Contenido inapropiado", "Copia o plagio", "Acoso", "Otro"].map(function (r) {
      return { label: r, fn: function () { Cloud.report(type, id, r).then(function () { toast("Gracias, lo revisaremos"); }).catch(function () {}); } };
    }));
  }
  function postMenu(id, author, handle, cardEl) {
    var mine = author === (myProfile && myProfile.user_id);
    var opts = mine
      ? [{ label: "Editar publicación", fn: function () { Cloud.getPost(id).then(function (pp) { editTextModal("Editar publicación", pp && pp.body, function (v, close) { Cloud.updatePost(id, v).then(function () { close(); toast("Editado"); route(); }).catch(function () { toast("No se pudo"); }); }); }); } },
         { label: "Eliminar publicación", danger: true, fn: function () { if (!confirm("¿Eliminar esta publicación?")) return; Cloud.deletePost(id).then(function () { toast("Eliminada"); if (cardEl) cardEl.remove(); }).catch(function () { toast("No se pudo"); }); } }]
      : [{ label: "Reportar publicación", fn: function () { reportReasons("post", id); } },
         { label: "Bloquear a @" + (handle || "este mago"), danger: true, fn: function () { if (!confirm("¿Bloquear? Dejarás de ver su contenido y él el tuyo.")) return; Cloud.block(author).then(function () { toast("Bloqueado"); var h = location.hash || ""; if (h === "#/comunidad" || h === "#/siguiendo") route(); else if (cardEl) cardEl.remove(); }).catch(function () {}); } }];
    actionSheet(opts);
  }
  var unreadNotif = 0;
  function refreshNotifBadge() {
    if (!cloudReady() || !logged()) return;
    Cloud.getNotifications().then(function (d) { unreadNotif = d.unread || 0; var b = document.getElementById("notifBadge"); if (b) { b.style.display = unreadNotif ? "flex" : "none"; b.textContent = unreadNotif > 9 ? "9+" : unreadNotif; } }).catch(function () {});
  }
  function communityHeader(mode) {
    return '<div class="appbar"><h1 class="pagetitle" style="display:block">Comunidad</h1>' +
      (myStreak >= 2 ? '<span class="streak" title="Racha de ' + myStreak + ' días">' + icon("flame", "i-sm") + myStreak + "</span>" : "") +
      '<span class="spacer"></span>' +
      '<button class="iconbtn" id="searchBtn" aria-label="Buscar">' + icon("search") + "</button>" +
      '<button class="iconbtn" id="msgBtn" aria-label="Mensajes">' + icon("chat") + '<span class="badge" id="msgBadge" style="display:none"></span></button>' +
      '<button class="iconbtn" id="notifBtn" aria-label="Notificaciones">' + icon("bell") + '<span class="badge" id="notifBadge" style="display:none"></span></button>' +
      '<button class="iconbtn" id="meBtn" aria-label="Mi perfil">' + icon("user") + "</button></div>" +
      '<div class="seg big" id="comSeg"><button data-m="discover" class="' + (mode === "discover" ? "on" : "") + '">Descubrir</button><button data-m="clips" class="' + (mode === "clips" ? "on" : "") + '">Clips</button><button data-m="following" class="' + (mode === "following" ? "on" : "") + '">Siguiendo</button><button data-m="market" class="' + (mode === "market" ? "on" : "") + '">Mercado</button></div>';
  }
  function bindCommunityHeader() {
    document.getElementById("searchBtn").addEventListener("click", function () { location.hash = "#/descubrir"; });
    document.getElementById("msgBtn").addEventListener("click", function () { location.hash = "#/mensajes"; });
    document.getElementById("notifBtn").addEventListener("click", function () { location.hash = "#/avisos"; });
    document.getElementById("meBtn").addEventListener("click", function () { if (myProfile) location.hash = "#/mago/" + myProfile.user_id; });
    view.querySelectorAll("#comSeg button").forEach(function (b) { b.addEventListener("click", function () { var m = b.getAttribute("data-m"); location.hash = m === "market" ? "#/mercado" : m === "clips" ? "#/clips" : (m === "following" ? "#/siguiendo" : "#/comunidad"); }); });
    refreshNotifBadge(); refreshMsgBadge();
  }
  /* ---------------------------- Historias --------------------------- */
  function storiesBarHtml(groups) {
    var add = '<div class="story-add" id="storyAdd"><span class="sa-ring">' + icon("plus") + '</span><span class="st-n">Añadir</span></div>';
    var rings = (groups || []).map(function (g, i) {
      return '<div class="story-item ' + (g.seen ? "seen" : "") + '" data-si="' + i + '"><span class="st-ring">' + avatarHtml(Cloud.publicUrl(g.avatar), g.name || g.handle, "") + "</span><span class=\"st-n\">" + (g.is_me ? "Tú" : esc((g.name || g.handle || "Mago").split(" ")[0])) + "</span></div>";
    }).join("");
    return '<div class="stories-bar">' + add + rings + "</div>";
  }
  function bindStories(scope, groups) {
    var a = scope.querySelector("#storyAdd"); if (a) a.addEventListener("click", renderStoryCreate);
    scope.querySelectorAll(".story-item[data-si]").forEach(function (it) { it.addEventListener("click", function () { openStories(groups, parseInt(it.getAttribute("data-si"), 10)); }); });
  }
  var storyTimer = null;
  function teardownStories() { if (storyTimer) { clearTimeout(storyTimer); storyTimer = null; } var sv = document.getElementById("storyViewer"); if (sv) sv.remove(); }
  function openStories(groups, idx) {
    var gi = idx, si = 0, timer = null;
    var ov = el('<div class="story-viewer" id="storyViewer"></div>'); document.body.appendChild(ov);
    var close = function () { if (timer) clearTimeout(timer); storyTimer = null; ov.remove(); };
    function render() {
      var g = groups[gi]; if (!g) { close(); return; }
      var st = g.stories || [];
      if (si >= st.length) { gi++; si = 0; if (gi >= groups.length) { close(); return; } return render(); }
      if (si < 0) { gi--; if (gi < 0) { close(); return; } si = (groups[gi].stories || []).length - 1; return render(); }
      var s = st[si], m = s.media || {};
      var mediaHtml = (m.kind === "video" && m.embed) ? '<div class="sv-media"><iframe src="' + esc(m.embed) + '" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>'
        : (m.kind === "video" && m.url) ? '<div class="sv-media"><video src="' + esc(m.url) + '" autoplay playsinline loop controls></video></div>'
        : '<div class="sv-media"><div class="sv-img" style="background-image:url(' + esc(m.url || "") + ')"></div></div>';
      ov.innerHTML = '<div class="sv-top"><div class="sv-bars">' + st.map(function (_, k) { return '<i class="' + (k < si ? "done" : k === si ? "cur" : "") + '"></i>'; }).join("") + "</div>" +
        '<div class="sv-head">' + avatarHtml(Cloud.publicUrl(g.avatar), g.name || g.handle, "sm") + "<span>" + esc(g.name || g.handle || "Mago") + '</span><span class="sv-t">' + timeAgo(s.created_at) + '</span><button class="sv-x">✕</button></div></div>' +
        mediaHtml + (s.caption ? '<div class="sv-cap">' + esc(s.caption) + "</div>" : "") +
        (g.is_me ? '<button class="sv-viewers" id="svViewers">' + icon("people", "i-sm") + " Quién la vio</button>" : "") +
        '<div class="sv-nav"><div class="sv-prev"></div><div class="sv-next"></div></div>';
      ov.querySelector(".sv-x").addEventListener("click", close);
      ov.querySelector(".sv-prev").addEventListener("click", function () { si--; render(); });
      ov.querySelector(".sv-next").addEventListener("click", function () { si++; render(); });
      var vw = ov.querySelector("#svViewers");
      if (vw) vw.addEventListener("click", function (e) {
        e.stopPropagation(); if (timer) clearTimeout(timer);
        Cloud.getStoryViewers(s.id).then(function (list) {
          var m = el('<div class="modal-ov"><div class="modal"><h3>Vistas · ' + list.length + '</h3><div class="mago-list" id="svwl"></div><button class="btn ghost" id="svwClose">Cerrar</button></div></div>');
          document.body.appendChild(m);
          document.getElementById("svwl").innerHTML = list.length ? list.map(function (u) { return '<div class="mago-row"><span class="avatar sm ' + (u.avatar ? "" : "ini") + '"' + (u.avatar ? ' style="background-image:url(' + esc(Cloud.publicUrl(u.avatar)) + ')"' : "") + ">" + (u.avatar ? "" : esc((u.name || u.handle || "?").charAt(0))) + '</span><div class="mr-b"><div class="n">' + esc(u.name || u.handle || "Mago") + "</div></div></div>"; }).join("") : '<p class="hint">Nadie todavía.</p>';
          m.addEventListener("click", function (ev) { if (ev.target === m) m.remove(); });
          document.getElementById("svwClose").addEventListener("click", function () { m.remove(); });
        }).catch(function () { toast("No se pudo cargar"); });
      });
      Cloud.viewStory(s.id).catch(function () {});
      if (timer) clearTimeout(timer);
      if (m.kind !== "video") { timer = setTimeout(function () { si++; render(); }, 5000); storyTimer = timer; }
    }
    render();
  }
  function renderStoryCreate() {
    var media = null;
    var ov = el('<div class="modal-ov"><div class="modal"><h3>Nueva historia</h3><div id="scPrev" class="sc-prev"></div>' +
      '<div class="pc-attach"><button class="btn ghost" id="scPhoto">' + icon("plus", "i-sm") + ' Foto</button><button class="btn ghost" id="scVid">' + icon("play", "i-sm") + ' Vídeo</button></div>' +
      '<input type="file" id="scFile" accept="image/*" style="display:none">' +
      '<input type="file" id="scVidFile" accept="video/*" style="display:none">' +
      '<input id="scCap" placeholder="Añade un texto (opcional)" class="sc-cap">' +
      '<div class="modal-act"><button class="btn" id="scPost">Publicar historia</button><button class="btn ghost" id="scCancel">Cancelar</button></div></div></div>');
    document.body.appendChild(ov);
    var close = function () { ov.remove(); };
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    document.getElementById("scCancel").addEventListener("click", close);
    var prev = function () { document.getElementById("scPrev").innerHTML = media ? (media.kind === "video" ? '<div class="sc-vid">' + icon("play") + " Vídeo añadido</div>" : '<div class="sv-img sc-img" style="background-image:url(' + esc(media.url) + ')"></div>') : ""; };
    document.getElementById("scPhoto").addEventListener("click", function () { document.getElementById("scFile").click(); });
    document.getElementById("scFile").addEventListener("change", function () { var fl = this.files[0]; if (!fl) return; toast("Subiendo…"); Cloud.uploadSocial(fl).then(function (r) { media = { kind: "image", url: r.url, path: r.path }; prev(); }).catch(function () { toast("No se pudo subir"); }); });
    document.getElementById("scVidFile").addEventListener("change", function () { var fl = this.files && this.files[0]; this.value = ""; if (!fl) return; uploadOwnVideo(fl, function (m) { media = m; prev(); }); });
    document.getElementById("scVid").addEventListener("click", function () {
      actionSheet([
        { label: "Subir un vídeo", fn: function () { document.getElementById("scVidFile").click(); } },
        { label: "Enlace de YouTube o Vimeo", fn: function () { var url = prompt("Enlace de YouTube o Vimeo:"); if (!url) return; var v = parseVideo(url); if (!v.embed) { toast("Solo YouTube o Vimeo"); return; } media = { kind: "video", embed: v.embed, url: v.url, thumb: v.thumb }; prev(); } }
      ]);
    });
    document.getElementById("scPost").addEventListener("click", function () { if (!media) { toast("Añade una foto o vídeo"); return; } var btn = document.getElementById("scPost"); btn.disabled = true; btn.textContent = "Publicando…"; Cloud.createStory(media, (document.getElementById("scCap").value || "").trim()).then(function () { toast("Historia publicada"); close(); var h = location.hash || ""; if (h === "#/comunidad" || h === "#/siguiendo") route(); }).catch(function () { btn.disabled = false; btn.textContent = "Publicar historia"; toast("No se pudo publicar"); }); });
  }

  /* ---------- Estados de carga (esqueletos) y vacíos ilustrados ---------- */
  function engraving(seed, cls) {
    var h = 2166136261, s = String(seed || "x"), i;
    for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    function rnd() { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; }
    var paths = "", rings = 3 + Math.floor(rnd() * 2), r0;
    for (r0 = 0; r0 < rings; r0++) {
      var R = 15 + r0 * (11 + rnd() * 6), k = 5 + Math.floor(rnd() * 8), amp = 2 + rnd() * 5, ph = rnd() * 6.283, d = "", a;
      for (a = 0; a <= 132; a++) {
        var t = a / 132 * 6.283, rr = R + amp * Math.sin(k * t + ph);
        d += (a ? "L" : "M") + (60 + rr * Math.cos(t)).toFixed(1) + " " + (60 + rr * Math.sin(t)).toFixed(1);
      }
      paths += '<path d="' + d + 'Z" opacity="' + (0.55 - r0 * 0.09).toFixed(2) + '"/>';
    }
    return '<svg class="engr ' + (cls || "") + '" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="0.55" aria-hidden="true">' + paths + "</svg>";
  }
  /* ============ MATERIA VIVA: humo y polvo de oro (WebGL) ============ */
  // Un único lienzo a baja resolución detrás del contenido, solo en tema
  // oscuro y sin reduced-motion. fbm con warp de dominio + motas que titilan.
  function initAmbient() {
    try {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      var cv = document.createElement("canvas"); cv.id = "fx"; cv.setAttribute("aria-hidden", "true");
      document.body.insertBefore(cv, document.body.firstChild);
      var gl = cv.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
      if (!gl) { cv.remove(); return; }
      var VS = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
      var FS = "precision mediump float;uniform vec2 R;uniform float T;" +
        "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}" +
        "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+1.),f.x),f.y);}" +
        "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}" +
        "void main(){vec2 u=gl_FragCoord.xy/R;vec2 p=u*vec2(R.x/R.y,1.)*2.4;float t=T*.03;" +
        "float s=fbm(p+vec2(t*.5,-t*.2)+fbm(p*1.6-t*.25)*.85);s=smoothstep(.42,1.05,s);" +
        "vec3 gold=vec3(.84,.65,.37);vec3 c=gold*s*.14*(1.1-u.y*.55);" +
        "vec2 g=gl_FragCoord.xy/2.6;vec2 id=floor(g);float sp=h(id);" +
        "float tw=step(.9975,sp)*pow(.5+.5*sin(T*(1.2+sp*2.5)+sp*44.),8.);" +
        "c+=gold*tw*.6*smoothstep(.15,.5,s);gl_FragColor=vec4(c,1.);}";
      function sh(t, src) { var o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw 0; return o; }
      var pr = gl.createProgram();
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw 0;
      gl.useProgram(pr);
      var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(pr, "a"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      var uR = gl.getUniformLocation(pr, "R"), uT = gl.getUniformLocation(pr, "T");
      function size() {
        var k = Math.min(window.devicePixelRatio || 1, 2) * 0.34;
        cv.width = Math.max(2, Math.round(innerWidth * k)); cv.height = Math.max(2, Math.round(innerHeight * k));
        gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(uR, cv.width, cv.height);
      }
      size(); addEventListener("resize", size);
      var last = 0;
      function dark() {
        var m = document.documentElement.getAttribute("data-theme");
        return m === "dark" || (m !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
      }
      function frame(ts) {
        requestAnimationFrame(frame);
        if (document.hidden || !dark()) return;
        if (ts - last < 40) return; // ~25 fps: suficiente para humo
        last = ts;
        gl.uniform1f(uT, ts / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      requestAnimationFrame(frame);
    } catch (e) { var c0 = document.getElementById("fx"); if (c0) c0.remove(); }
  }

  /* ====== FOIL 3D: las tarjetas se inclinan y destellan bajo el dedo ====== */
  function initFoil() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var cur = null, raf = 0, px = 0, py = 0;
    function apply() {
      raf = 0; if (!cur) return;
      var r = cur.getBoundingClientRect(); if (!r.width) return;
      var x = Math.min(1, Math.max(0, (px - r.left) / r.width)), y = Math.min(1, Math.max(0, (py - r.top) / r.height));
      cur.style.transform = "perspective(720px) rotateX(" + ((0.5 - y) * 6).toFixed(2) + "deg) rotateY(" + ((x - 0.5) * 8).toFixed(2) + "deg) translateY(-2px)";
      cur.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      cur.style.setProperty("--my", (y * 100).toFixed(1) + "%");
    }
    function reset(el0) { el0.classList.remove("foil"); el0.style.transform = ""; el0.style.removeProperty("--mx"); el0.style.removeProperty("--my"); }
    function move(e) {
      var t = e.target && e.target.closest ? e.target.closest(".card, .listcard") : null;
      if (t !== cur) { if (cur) reset(cur); cur = t; if (cur) cur.classList.add("foil"); }
      if (!cur) return;
      px = e.clientX; py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    }
    function drop() { if (cur) { reset(cur); cur = null; } }
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerdown", move, { passive: true });
    document.addEventListener("pointerup", function () { if (!matchMedia("(hover: hover)").matches) drop(); }, { passive: true });
    document.addEventListener("pointercancel", drop, { passive: true });
    document.addEventListener("scroll", drop, { passive: true, capture: true });
  }
  function emptyArt() { return '<div class="empty-art"><span class="ea-glow"></span>' + mark("", true) + "</div>"; }
  function skLine(w, h) { return '<div class="skeleton sk-line" style="width:' + w + (h ? ";height:" + h : "") + '"></div>'; }
  function skelFeed(n) {
    var one = '<div class="postcard skel-card"><div class="sk-head"><div class="skeleton sk-av"></div><div class="sk-hl">' + skLine("46%") + skLine("28%") + "</div></div>" + skLine("92%") + skLine("74%") + '<div class="skeleton sk-media"></div></div>';
    var o = ""; for (var i = 0; i < (n || 3); i++) o += one; return '<div class="feed">' + o + "</div>";
  }
  function skelCards(n) {
    var one = '<div class="skel-card grid"><div class="skeleton sk-thumb"></div><div class="sk-hl" style="padding:2px">' + skLine("80%") + skLine("45%") + "</div></div>";
    var o = ""; for (var i = 0; i < (n || 6); i++) o += one; return '<div class="cards">' + o + "</div>";
  }
  function skelRows(n) {
    var one = '<div class="skel-card row"><div class="skeleton sk-av"></div><div class="sk-hl" style="flex:1">' + skLine("38%") + skLine("62%") + "</div></div>";
    var o = ""; for (var i = 0; i < (n || 5); i++) o += one; return '<div class="skel-rows">' + o + "</div>";
  }
  function skelProfile() {
    return '<div class="skel-prof"><div class="skeleton sk-cover"></div><div class="skeleton sk-av big" style="margin:-46px auto 0"></div>' + skLine("46%", "22px") + skLine("30%") + '<div class="skeleton sk-line" style="width:70%;height:42px;margin:16px auto;border-radius:999px"></div></div>';
  }
  function skelDetail() {
    return '<div class="skel-detail"><div class="skeleton sk-hero"></div>' + skLine("68%", "26px") + skLine("40%") + '<div class="skeleton sk-media"></div>' + skLine("92%") + skLine("86%") + skLine("58%") + "</div>";
  }
  function renderCommunity(mode) {
    mountTabbar("com"); var f = document.getElementById("fabEl"); if (f) f.remove();
    composeChallenge = null;
    mountFab(mode === "market" ? "#/vender" : "#/publicar");
    view.innerHTML = '<div class="screen wide">' + communityHeader(mode) + '<div id="comBody">' + (mode === "market" ? skelCards(6) : skelFeed(3)) + "</div></div>";
    bindCommunityHeader();
    var bodyEl = document.getElementById("comBody");
    if (mode === "market") {
      Cloud.getMarket().then(function (rows) {
        if (!rows.length) { bodyEl.innerHTML = '<div class="empty" style="padding:46px 12px">' + emptyArt() + '<h3>Mercado vacío</h3><p>Sé el primero en vender algo: un método digital o material físico.</p><button class="btn" onclick="location.hash=\'#/vender\'">Vender</button></div>'; return; }
        bodyEl.innerHTML = '<div class="chips" id="mkFilter">' +
          [["all", "Todo"], ["digital", "Digital"], ["physical", "Físico"]].map(function (f) { return '<button class="chip' + (marketFilter === f[0] ? " active" : "") + '" data-f="' + f[0] + '">' + f[1] + "</button>"; }).join("") +
          '</div><div class="market" id="mkGrid"></div>';
        function draw() {
          var vis = rows.filter(function (l) { return marketFilter === "all" || (marketFilter === "physical") === isPhysical(l); });
          var grid = document.getElementById("mkGrid");
          grid.innerHTML = vis.length ? vis.map(listingCard).join("") : '<div class="empty" style="grid-column:1/-1;padding:30px 12px"><p>Nada por aquí todavía.</p></div>';
          grid.querySelectorAll(".listcard[data-l]").forEach(function (c) { c.addEventListener("click", function () { var cv = c.querySelector(".lc-cover"); if (cv) cv.style.viewTransitionName = "hero"; location.hash = "#/mercado/" + c.getAttribute("data-l"); }); });
        }
        draw();
        bodyEl.querySelectorAll("#mkFilter .chip").forEach(function (ch) { ch.addEventListener("click", function () { marketFilter = ch.getAttribute("data-f"); bodyEl.querySelectorAll("#mkFilter .chip").forEach(function (x) { x.classList.toggle("active", x === ch); }); draw(); }); });
      }).catch(function () { bodyEl.innerHTML = '<div class="empty" style="padding:40px"><p>No se pudo cargar el mercado.</p></div>'; });
    } else if (mode === "discover") {
      Promise.all([Cloud.getFeed(null, "trending"), Cloud.trendingTags().catch(function () { return []; }), Cloud.getActiveChallenge().catch(function () { return null; }), Cloud.getLeaderboard().catch(function () { return []; }), Cloud.getWeekRecap().catch(function () { return null; }), Cloud.getStories().catch(function () { return []; })]).then(function (res) {
        var rows = res[0], tt = res[1] || [], chal = res[2], lead = (res[3] || []).slice(0, 6), rec = res[4], stories = res[5] || [];
        var bar = storiesBarHtml(stories);
        var recap = (rec && (rec.likes + rec.followers + rec.posts) > 0) ? '<div class="recap"><div class="rc-t">Tu semana</div><div class="rc-stats"><span><b>' + rec.likes + '</b> me gusta</span><span><b>' + rec.followers + '</b> seguidores</span>' + (rec.streak >= 2 ? '<span class="rc-fire">' + icon("flame", "i-sm") + "<b>" + rec.streak + "</b> días</span>" : "") + "</div></div>" : "";
        var banner = chal ? '<div class="chal-banner" id="chalBanner"><span class="cb-ic">' + icon("flame") + '</span><div class="cb-b"><div class="cb-t">' + esc(chal.title) + '</div><div class="cb-p">' + esc(chal.prompt || "") + '</div><div class="cb-m">' + chal.participants + " participando · toca para ver</div></div>" + icon("chev") + "</div>" : "";
        var top = lead.length ? '<div class="sec-label sec-row">Top magos de la semana <a class="seeall" id="seeTop">Ver ranking</a></div><div class="top-strip">' + lead.map(function (m) { return '<div class="top-m" data-mago="' + esc(m.user_id) + '">' + avatarHtml(Cloud.publicUrl(m.avatar), m.name || m.handle, "big") + '<div class="tm-n">' + esc(m.name || m.handle || "Mago") + "</div></div>"; }).join("") + "</div>" : "";
        var strip = tt.length ? '<div class="chips trending">' + tt.map(function (t) { return '<div class="chip" data-tag="' + esc(t.tag) + '">#' + esc(t.tag) + "</div>"; }).join("") + "</div>" : "";
        bodyEl.innerHTML = bar + recap + banner + top + strip + (rows.length ? '<div class="sec-label">Populares</div><div class="feed">' + rows.map(postCardHtml).join("") + "</div>" : '<div class="empty" style="padding:40px 12px">' + emptyArt() + '<h3>Aún no hay publicaciones</h3><p>Sé el primero: comparte algo con la comunidad.</p><button class="btn" onclick="location.hash=\'#/publicar\'">Crear publicación</button></div>');
        bindPostCards(bodyEl); bindStories(bodyEl, stories);
        var cbn = document.getElementById("chalBanner"); if (cbn) cbn.addEventListener("click", function () { location.hash = "#/reto"; });
        var st = document.getElementById("seeTop"); if (st) st.addEventListener("click", function () { location.hash = "#/top"; });
        bodyEl.querySelectorAll(".top-m[data-mago]").forEach(function (m) { m.addEventListener("click", function () { location.hash = "#/mago/" + m.getAttribute("data-mago"); }); });
        bodyEl.querySelectorAll(".chip[data-tag]").forEach(function (c) { c.addEventListener("click", function () { location.hash = "#/tag/" + c.getAttribute("data-tag"); }); });
      }).catch(function () { bodyEl.innerHTML = '<div class="empty" style="padding:40px"><p>No se pudo cargar.</p></div>'; });
    } else {
      Promise.all([Cloud.getFeed(null, "following"), Cloud.getStories().catch(function () { return []; })]).then(function (res) {
        var rows = res[0], stories = res[1] || [];
        var bar = storiesBarHtml(stories);
        if (!rows.length) {
          bodyEl.innerHTML = bar + '<div class="empty" style="padding:40px 12px">' + emptyArt() + '<h3>Llena tu feed</h3><p>Sigue a magos para ver aquí sus publicaciones.</p></div><div class="sec-label">Sugerencias para seguir</div><div id="sugg">' + skelRows(4) + "</div>";
          bindStories(bodyEl, stories);
          Cloud.suggestMagicians().then(function (mg) { var s = document.getElementById("sugg"); if (!s) return; s.innerHTML = mg.length ? '<div class="mago-list">' + mg.map(magicianRow).join("") + "</div>" : '<p class="hint">Aún no hay más magos. ¡Invita a otros!</p>'; bindMagicianRows(s); }).catch(function () {});
          return;
        }
        bodyEl.innerHTML = bar + '<div class="feed">' + rows.map(postCardHtml).join("") + "</div>";
        bindPostCards(bodyEl); bindStories(bodyEl, stories);
        appendMore(bodyEl, bodyEl.querySelector(".feed"), rows, function (before) { return Cloud.getFeed(null, "following", null, null, before); });
      }).catch(function () { bodyEl.innerHTML = '<div class="empty" style="padding:40px"><p>No se pudo cargar el feed.</p></div>'; });
    }
  }

  /* ---------------------------- Clips ------------------------------- */
  // Feed vertical a pantalla completa (estilo TikTok/Reels) de vídeos PROPIOS
  // de los magos: grabados en el momento o subidos. Contenido independiente
  // de las publicaciones, con su propia tabla en la nube.
  var clipsState = { rows: [], muted: true, active: -1, io: null, loading: false, done: false, viewed: {} };
  function teardownClips() {
    if (clipsState && clipsState.io) { try { clipsState.io.disconnect(); } catch (e) {} clipsState.io = null; }
    var v = document.querySelector(".clips .clip video"); if (v) { try { v.pause(); } catch (e) {} }
  }
  function clipHtml(p, i) {
    var effect = p.effect ? '<span class="cm-effect">' + icon("wand", "i-sm") + esc(p.effect) + "</span>" : "";
    return '<section class="clip" data-clip="' + esc(p.id) + '" data-idx="' + i + '">' +
      '<div class="clip-video"><div class="clip-poster" style="background-image:url(' + esc(Cloud.publicUrl(p.poster) || "") + ')"></div></div>' +
      '<div class="clip-prog"><i></i></div>' +
      '<div class="clip-tap" data-tap></div>' +
      '<div class="clip-rail">' +
        '<div class="clip-avw"><button class="clip-av" data-mago="' + esc(p.author) + '" aria-label="Ver perfil">' + avatarHtml(Cloud.publicUrl(p.avatar), p.name || p.handle, "") + "</button>" +
        (!p.is_me && !p.following ? '<button class="clip-follow" data-cfollow="' + esc(p.author) + '" aria-label="Seguir">+</button>' : "") + "</div>" +
        '<button class="clip-act clip-like ' + (p.liked ? "on" : "") + '" data-like="' + esc(p.id) + '" aria-label="Me gusta">' + icon(p.liked ? "heartfill" : "heart") + "<span>" + (p.likes || 0) + "</span></button>" +
        '<button class="clip-act" data-cmt="' + esc(p.id) + '" aria-label="Comentarios">' + icon("chat") + '<span class="cc-count">' + (p.comments || 0) + "</span></button>" +
        '<button class="clip-act" data-share="' + esc(p.id) + '" aria-label="Compartir">' + icon("share") + "</button>" +
        (p.is_me ? '<button class="clip-act" data-cmore="' + esc(p.id) + '" aria-label="Más">' + icon("dots") + "</button>" : "") +
        '<button class="clip-act clip-mute" data-mute aria-label="Sonido">' + icon("mute") + "</button></div>" +
      '<div class="clip-meta"><div class="cm-user" data-mago="' + esc(p.author) + '"><b>' + esc(p.name || p.handle || "Mago") + "</b>" + (p.handle ? ' <span>@' + esc(p.handle) + "</span>" : "") + "</div>" +
        (p.caption ? '<div class="cm-body">' + linkify(p.caption) + "</div>" : "") + effect + "</div></section>";
  }
  function clipDeactivate(list, idx) {
    var node = list.querySelector('.clip[data-idx="' + idx + '"]'); if (!node) return;
    var p = clipsState.rows[idx];
    node.querySelector(".clip-video").innerHTML = '<div class="clip-poster" style="background-image:url(' + esc(Cloud.publicUrl(p && p.poster) || "") + ')"></div>';
    var pr = node.querySelector(".clip-prog i"); if (pr) pr.style.width = "0%";
  }
  function clipActivate(list, idx) {
    if (clipsState.active === idx) return;
    if (clipsState.active >= 0) clipDeactivate(list, clipsState.active);
    clipsState.active = idx;
    var node = list.querySelector('.clip[data-idx="' + idx + '"]'); if (!node) return;
    var p = clipsState.rows[idx]; if (!p) return;
    var vd = node.querySelector(".clip-video");
    vd.innerHTML = '<div class="clip-poster" style="background-image:url(' + esc(Cloud.publicUrl(p.poster) || "") + ')"></div>';
    var v = document.createElement("video");
    v.src = Cloud.publicUrl(p.video) || ""; v.loop = true; v.muted = clipsState.muted; v.playsInline = true;
    v.setAttribute("playsinline", ""); v.setAttribute("webkit-playsinline", ""); v.preload = "auto";
    var prog = node.querySelector(".clip-prog i");
    v.addEventListener("timeupdate", function () { if (prog && v.duration) prog.style.width = (100 * v.currentTime / v.duration) + "%"; });
    v.addEventListener("error", function () { var pl = node.querySelector(".clip-video"); if (pl && !pl.querySelector(".clip-noplay")) pl.insertAdjacentHTML("beforeend", '<div class="clip-noplay">' + icon("play") + "<span>Este vídeo no se puede reproducir en tu dispositivo</span></div>"); });
    vd.appendChild(v);
    var play = v.play(); if (play && play.catch) play.catch(function () {});
    if (!clipsState.viewed[p.id]) { clipsState.viewed[p.id] = 1; Cloud.bumpClipView(p.id); }
    if (idx >= clipsState.rows.length - 2) clipsLoadMore(list);
  }
  function clipSetSound(list, muted) {
    clipsState.muted = muted;
    var node = list.querySelector('.clip[data-idx="' + clipsState.active + '"]');
    var v = node && node.querySelector("video"); if (v) { v.muted = muted; if (!muted) { var pp = v.play(); if (pp && pp.catch) pp.catch(function () {}); } }
    list.querySelectorAll(".clip-mute").forEach(function (b) { b.innerHTML = icon(muted ? "mute" : "sound"); });
  }
  function clipsLoadMore(list) {
    if (clipsState.loading || clipsState.done) return;
    var rows = clipsState.rows; if (!rows.length) return;
    clipsState.loading = true;
    Cloud.getClips(rows[rows.length - 1].created_at).then(function (more) {
      clipsState.loading = false;
      more = more || [];
      if (!more.length) { clipsState.done = true; return; }
      var base = rows.length; clipsState.rows = rows.concat(more);
      var frag = document.createElement("div"); frag.innerHTML = more.map(function (p, k) { return clipHtml(p, base + k); }).join("");
      while (frag.firstChild) { var c = frag.firstChild; list.appendChild(c); if (c.nodeType === 1) { bindClip(list, c); clipsState.io && clipsState.io.observe(c); } }
    }).catch(function () { clipsState.loading = false; });
  }
  function bindClip(list, node) {
    node.querySelectorAll("[data-mago]").forEach(function (a) { a.addEventListener("click", function (e) { e.stopPropagation(); location.hash = "#/mago/" + a.getAttribute("data-mago"); }); });
    node.querySelectorAll("a.tag[data-tag]").forEach(function (a) { a.addEventListener("click", function (e) { e.stopPropagation(); location.hash = "#/tag/" + a.getAttribute("data-tag"); }); });
    node.querySelectorAll("a.mention[data-h]").forEach(function (a) { a.addEventListener("click", function (e) { e.stopPropagation(); openHandle(a.getAttribute("data-h")); }); });
    var likeB = node.querySelector("[data-like]");
    if (likeB) likeB.addEventListener("click", function (e) {
      e.stopPropagation(); var id = likeB.getAttribute("data-like"); var on = likeB.classList.contains("on");
      var sp = likeB.querySelector("span"); var n = parseInt(sp.textContent, 10) || 0;
      likeB.classList.toggle("on"); likeB.innerHTML = icon(on ? "heart" : "heartfill") + "<span>" + (on ? Math.max(0, n - 1) : n + 1) + "</span>";
      if (!on) burstHearts(likeB);
      (on ? Cloud.unlikeClip(id) : Cloud.likeClip(id)).catch(function () { likeB.classList.toggle("on", on); likeB.innerHTML = icon(on ? "heartfill" : "heart") + "<span>" + n + "</span>"; toast("No se pudo, inténtalo de nuevo"); });
    });
    var cmtB = node.querySelector("[data-cmt]"); if (cmtB) cmtB.addEventListener("click", function (e) { e.stopPropagation(); openClipComments(cmtB.getAttribute("data-cmt"), cmtB.querySelector(".cc-count")); });
    var shB = node.querySelector("[data-share]"); if (shB) shB.addEventListener("click", function (e) { e.stopPropagation(); shareClip(shB.getAttribute("data-share")); });
    var moreB = node.querySelector("[data-cmore]"); if (moreB) moreB.addEventListener("click", function (e) { e.stopPropagation(); var id = moreB.getAttribute("data-cmore"); actionSheet([{ label: "Eliminar clip", danger: true, fn: function () { if (!confirm("¿Eliminar este clip?")) return; Cloud.deleteClip(id).then(function () { toast("Clip eliminado"); renderClips(); }).catch(function () { toast("No se pudo"); }); } }]); });
    var muteB = node.querySelector("[data-mute]"); if (muteB) muteB.addEventListener("click", function (e) { e.stopPropagation(); clipSetSound(list, !clipsState.muted); });
    var followB = node.querySelector("[data-cfollow]");
    if (followB) followB.addEventListener("click", function (e) { e.stopPropagation(); var id = followB.getAttribute("data-cfollow"); followB.remove(); toast("Siguiendo"); Cloud.follow(id).catch(function () {}); });
    // Un toque alterna el sonido; doble toque da me gusta (gesto estilo TikTok).
    var tap = node.querySelector("[data-tap]"), tapTimer = null;
    if (tap) tap.addEventListener("click", function (e) {
      if (tapTimer) {
        clearTimeout(tapTimer); tapTimer = null;
        var lb = node.querySelector("[data-like]");
        if (lb && !lb.classList.contains("on")) lb.click(); else burstHearts(lb || tap);
      } else {
        tapTimer = setTimeout(function () { tapTimer = null; clipSetSound(list, !clipsState.muted); }, 260);
      }
    });
  }
  function shareClip(id) {
    var url = location.origin + location.pathname + "#/clips/" + id;
    if (navigator.share) { navigator.share({ title: "Clip en App del Mago", url: url }).catch(function () {}); return; }
    if (navigator.clipboard) { navigator.clipboard.writeText(url).then(function () { toast("Enlace copiado"); }).catch(function () { toast(url); }); }
    else toast(url);
  }
  function openClipComments(id, countEl) {
    var ov = el('<div class="modal-ov sheet clip-cmts"><div class="cc-box"><div class="cc-h">Comentarios</div><div class="cc-list" id="ccList">' + skelRows(4) + '</div><div class="cc-add"><input id="ccIn" placeholder="Añade un comentario…"><button class="btn small" id="ccSend">' + icon("send", "i-sm") + "</button></div></div></div>");
    document.body.appendChild(ov);
    ov.addEventListener("click", function (e) { if (e.target === ov) dismissOv(ov); });
    var load = function () {
      Cloud.getClipComments(id).then(function (rows) {
        var l = document.getElementById("ccList"); if (!l) return;
        l.innerHTML = rows.length ? rows.map(function (c) {
          return '<div class="cc-row"><span class="cc-a" data-mago="' + esc(c.author) + '">' + avatarHtml(Cloud.publicUrl(c.avatar), c.name || c.handle, "sm") + "</span>" +
            '<div class="cc-bb"><div class="cc-who" data-mago="' + esc(c.author) + '">' + esc(c.name || c.handle || "Mago") + " <span>" + timeAgo(c.created_at) + "</span></div><div class=\"cc-b\">" + linkify(c.body) + "</div></div>" +
            (c.mine ? '<button class="cc-del" data-delc="' + esc(c.id) + '" aria-label="Eliminar">' + icon("x", "i-sm") + "</button>" : "") + "</div>";
        }).join("") : '<p class="hint" style="text-align:center;padding:18px">Sé el primero en comentar.</p>';
        l.querySelectorAll("[data-mago]").forEach(function (a) { a.addEventListener("click", function () { ov.remove(); location.hash = "#/mago/" + a.getAttribute("data-mago"); }); });
        l.querySelectorAll("[data-delc]").forEach(function (x) { x.addEventListener("click", function () { Cloud.deleteClipComment(x.getAttribute("data-delc")).then(function () { load(); if (countEl) countEl.textContent = Math.max(0, (parseInt(countEl.textContent, 10) || 1) - 1); }).catch(function () {}); }); });
      }).catch(function () {});
    };
    load();
    var inp = document.getElementById("ccIn");
    var send = function () { var t = (inp.value || "").trim(); if (!t) return; inp.value = ""; Cloud.addClipComment(id, t).then(function () { load(); if (countEl) countEl.textContent = (parseInt(countEl.textContent, 10) || 0) + 1; }).catch(function () { toast("No se pudo comentar"); }); };
    document.getElementById("ccSend").addEventListener("click", send);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
    attachAutocomplete(inp);
  }
  function renderClips(startId) {
    clearTabbar(); var fab = document.getElementById("fabEl"); if (fab) fab.remove();
    if (clipsState.io) { clipsState.io.disconnect(); clipsState.io = null; }
    clipsState = { rows: [], muted: true, active: -1, io: null, loading: false, done: false, viewed: {} };
    view.innerHTML = '<div class="clips-screen"><button class="clips-x" id="clipsX" aria-label="Cerrar">' + icon("x") + '</button><div class="clips-title">Clips</div>' +
      '<button class="clips-create" id="clipsNew" aria-label="Crear clip">' + icon("plus") + "</button>" +
      '<div class="clips" id="clipsList"><div class="clips-load"><div class="spin"></div></div></div></div>';
    document.getElementById("clipsX").addEventListener("click", function () { location.hash = "#/comunidad"; });
    document.getElementById("clipsNew").addEventListener("click", function () { location.hash = "#/clip-nuevo"; });
    var pinned = startId ? Cloud.getClip(startId).catch(function () { return null; }) : Promise.resolve(null);
    Promise.all([pinned, Cloud.getClips()]).then(function (res) {
      var first = res[0], rest = res[1] || [];
      var rows = first ? [first].concat(rest.filter(function (r) { return r.id !== first.id; })) : rest;
      var list = document.getElementById("clipsList"); if (!list) return;
      if (!rows.length) { list.innerHTML = '<div class="clips-empty">' + emptyArt() + '<h3>Aún no hay clips</h3><p>Graba o sube tu primer clip de magia y empieza a inspirar a la comunidad.</p><button class="btn" onclick="location.hash=\'#/clip-nuevo\'">' + icon("plus", "i-sm") + " Crear un clip</button></div>"; return; }
      clipsState.rows = rows;
      list.innerHTML = rows.map(clipHtml).join("");
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting && en.intersectionRatio >= 0.6) { var idx = parseInt(en.target.getAttribute("data-idx"), 10); clipActivate(list, idx); } });
      }, { root: list, threshold: [0.6] });
      clipsState.io = io;
      list.querySelectorAll(".clip").forEach(function (c) { bindClip(list, c); io.observe(c); });
      clipActivate(list, 0);
    }).catch(function () { var list = document.getElementById("clipsList"); if (list) list.innerHTML = '<div class="clips-empty"><p>No se pudieron cargar los clips.</p></div>'; });
  }
  // Cámara propia embebida (estilo TikTok) para grabar clips en la app.
  function clipCamSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder && window.MediaRecorder.isTypeSupported);
  }
  function clipCamMime() {
    var t = ["video/mp4;codecs=h264,aac", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
    for (var i = 0; i < t.length; i++) { try { if (window.MediaRecorder.isTypeSupported(t[i])) return t[i]; } catch (e) {} }
    return "";
  }
  function openClipCamera(onCapture, onFail) {
    var MAX = 60, facing = "user", stream = null, rec = null, chunks = [], recording = false, startT = 0, rafId = 0;
    var ov = el('<div class="cam-screen" id="camScreen">' +
      '<video id="camPrev" autoplay playsinline muted></video>' +
      '<div class="cam-top"><button class="cam-icon" id="camX" aria-label="Cerrar">' + icon("x") + '</button>' +
      '<span class="cam-time" id="camTime">0:00</span>' +
      '<button class="cam-icon" id="camFlip" aria-label="Girar cámara">' + icon("refresh") + "</button></div>" +
      '<div class="cam-bottom"><div class="cam-hint" id="camHint">Toca para grabar · máx. 60s</div>' +
      '<button class="cam-shutter" id="camShutter" aria-label="Grabar">' +
      '<svg class="cam-ring" viewBox="0 0 76 76"><circle class="cam-track" cx="38" cy="38" r="34"/><circle class="cam-prog" cx="38" cy="38" r="34"/></svg>' +
      '<span class="cam-dot"></span></button></div></div>');
    document.body.appendChild(ov);
    var prev = ov.querySelector("#camPrev");
    var progEl = ov.querySelector(".cam-prog");
    var C = 2 * Math.PI * 34; progEl.style.strokeDasharray = C; progEl.style.strokeDashoffset = C;
    var timeEl = ov.querySelector("#camTime");
    var cleanup = function () { if (rafId) cancelAnimationFrame(rafId); if (rec && recording) { try { rec.stop(); } catch (e) {} } if (stream) stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} }); };
    var close = function () { cleanup(); ov.remove(); };
    var fmt = function (s) { var m = Math.floor(s / 60), r = Math.floor(s % 60); return m + ":" + (r < 10 ? "0" : "") + r; };
    function startStream() {
      return navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1920 } }, audio: true })
        .then(function (s) { stream = s; prev.srcObject = s; prev.muted = true; var pp = prev.play(); if (pp && pp.catch) pp.catch(function () {}); });
    }
    function tick() {
      var el0 = (Date.now() - startT) / 1000;
      timeEl.textContent = fmt(el0);
      progEl.style.strokeDashoffset = C * (1 - Math.min(1, el0 / MAX));
      if (el0 >= MAX) { stopRec(); return; }
      rafId = requestAnimationFrame(tick);
    }
    function startRec() {
      if (!stream) return;
      chunks = []; var mime = clipCamMime();
      try { rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream); }
      catch (e) { toast("No se pudo grabar en este dispositivo"); return; }
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = function () {
        var type = (rec && rec.mimeType) || "video/webm";
        var ext = /mp4/.test(type) ? "mp4" : "webm";
        var blob = new Blob(chunks, { type: type });
        var file = new File([blob], "clip." + ext, { type: type });
        cleanup(); ov.remove(); onCapture(file);
      };
      rec.start(); recording = true; startT = Date.now();
      ov.classList.add("recording"); ov.querySelector("#camHint").textContent = "Grabando… toca para parar";
      tick();
    }
    function stopRec() { if (rec && recording) { recording = false; if (rafId) cancelAnimationFrame(rafId); try { rec.stop(); } catch (e) {} } }
    ov.querySelector("#camShutter").addEventListener("click", function () { if (recording) stopRec(); else startRec(); });
    ov.querySelector("#camX").addEventListener("click", close);
    ov.querySelector("#camFlip").addEventListener("click", function () {
      if (recording) return;
      facing = facing === "user" ? "environment" : "user";
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      startStream().catch(function () {});
    });
    startStream().catch(function () { ov.remove(); toast("No se pudo abrir la cámara"); if (onFail) onFail(); });
  }

  // Crear un clip: grabar en el momento (cámara del móvil) o subir un vídeo.
  var clipDraft = null;
  function renderClipCreate() {
    clearTabbar(); var fab = document.getElementById("fabEl"); if (fab) fab.remove();
    clipDraft = null;
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/clips\'">' + icon("back") + '</button><h1>Nuevo clip</h1></div><div id="clcBody"></div></div>';
    clipCreateChooser();
  }
  function clipCreateChooser() {
    var b = document.getElementById("clcBody"); if (!b) return;
    b.innerHTML = '<p class="subtitle">Comparte un efecto, una rutina o un tras cámara. Vertical y breve funciona mejor.</p>' +
      '<div class="clc-choose">' +
        '<button class="clc-opt" id="clcRec">' + icon("play") + "<b>Grabar ahora</b><span>Usa la cámara</span></button>" +
        '<button class="clc-opt" id="clcUp">' + icon("upload") + "<b>Subir vídeo</b><span>Desde tu galería</span></button>" +
      "</div>" +
      '<input type="file" id="clcRecFile" accept="video/*" capture="environment" style="display:none">' +
      '<input type="file" id="clcUpFile" accept="video/*" style="display:none">';
    document.getElementById("clcRec").addEventListener("click", function () {
      if (clipCamSupported()) openClipCamera(function (file) { clipDraft = { file: file }; clipCreateReview(); }, function () { document.getElementById("clcRecFile").click(); });
      else document.getElementById("clcRecFile").click();
    });
    document.getElementById("clcUp").addEventListener("click", function () { document.getElementById("clcUpFile").click(); });
    var onPick = function () { var fl = this.files && this.files[0]; if (!fl) return; if (!/^video\//.test(fl.type || "") && !/\.(mp4|mov|webm|m4v|3gp)$/i.test(fl.name || "")) { toast("Elige un archivo de vídeo"); return; } clipDraft = { file: fl }; clipCreateReview(); };
    document.getElementById("clcRecFile").addEventListener("change", onPick);
    document.getElementById("clcUpFile").addEventListener("change", onPick);
  }
  function clipCreateReview() {
    var b = document.getElementById("clcBody"); if (!b || !clipDraft) return;
    var url; try { url = URL.createObjectURL(clipDraft.file); } catch (e) { toast("No se pudo abrir el vídeo"); clipCreateChooser(); return; }
    clipDraft.effect = null;
    var isWebm = /webm/i.test((clipDraft.file && clipDraft.file.type) || "") || /\.webm$/i.test((clipDraft.file && clipDraft.file.name) || "");
    b.innerHTML = '<div class="clc-prev"><video src="' + esc(url) + '" controls playsinline muted loop></video></div>' +
      (isWebm ? '<div class="backstage-bar danger"><span class="dot"></span> Formato WebM: puede que no se vea en iPhone. Si puedes, graba con la cámara de la app para máxima compatibilidad.</div>' : "") +
      '<div class="field"><label>Descripción</label><textarea id="clcCap" rows="2" placeholder="Cuenta algo… usa #hashtags y @menciones"></textarea></div>' +
      '<div class="field"><label>¿De qué es tu clip?</label><div class="tchips" id="clcEff">' + SPECIALTIES.map(function (s) { return '<button type="button" class="tchip" data-s="' + esc(s) + '">' + esc(s) + "</button>"; }).join("") + "</div></div>" +
      '<div class="clc-acts"><button class="btn" id="clcPub">Publicar clip</button><button class="btn ghost" id="clcBack">Elegir otro vídeo</button></div>';
    attachAutocomplete(document.getElementById("clcCap"));
    b.querySelectorAll("#clcEff .tchip").forEach(function (t) { t.addEventListener("click", function () { var on = t.classList.contains("on"); b.querySelectorAll("#clcEff .tchip").forEach(function (x) { x.classList.remove("on"); }); if (!on) { t.classList.add("on"); clipDraft.effect = t.getAttribute("data-s"); } else clipDraft.effect = null; }); });
    document.getElementById("clcBack").addEventListener("click", function () { try { URL.revokeObjectURL(url); } catch (e) {} clipCreateChooser(); });
    document.getElementById("clcPub").addEventListener("click", function () {
      var btn = document.getElementById("clcPub"); btn.disabled = true; btn.textContent = "Publicando…";
      var cap = (document.getElementById("clcCap").value || "").trim();
      makePoster(clipDraft.file).then(function (poster) {
        return Promise.all([Cloud.uploadClipVideo(clipDraft.file), poster ? Cloud.uploadClipVideo(poster) : Promise.resolve(null)]);
      }).then(function (res) {
        return Cloud.createClip({ video_path: res[0].path, poster_path: res[1] ? res[1].path : null, caption: cap || null, effect: clipDraft.effect || null });
      }).then(function () { try { URL.revokeObjectURL(url); } catch (e) {} toast("¡Clip publicado!"); location.hash = "#/clips"; })
        .catch(function () { btn.disabled = false; btn.textContent = "Publicar clip"; toast("No se pudo publicar el clip"); });
    });
  }

  /* ------------------- Avisos / Descubrir / Tag --------------------- */
  function notifText(n) {
    var who = "<b>" + esc(n.name || n.handle || "Alguien") + "</b> ";
    if (n.type === "like") return who + "le dio me gusta a tu publicación";
    if (n.type === "comment") return who + "comentó tu publicación";
    if (n.type === "reply") return who + "respondió a tu comentario";
    if (n.type === "follow") return who + "empezó a seguirte";
    if (n.type === "repost") return who + "reposteó tu publicación";
    if (n.type === "mention") return who + "te mencionó";
    if (n.type === "sale") return who + "consiguió tu truco 🎉";
    return who + "interactuó contigo";
  }
  function renderNotifications() {
    clearTabbar();
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/comunidad\'">' + icon("back") + '</button><h1>Avisos</h1></div><div id="nBody">' + skelRows(6) + '</div></div>';
    Cloud.getNotifications().then(function (d) {
      var items = d.items || [];
      var b = document.getElementById("nBody");
      b.innerHTML = items.length ? '<div class="notif-list">' + items.map(function (n) {
        var go = n.type === "follow" ? "mago:" + esc(n.actor) : n.type === "sale" ? "list:" + esc(n.listing_id || "") : "post:" + esc(n.post_id || "");
        var ic = n.type === "like" ? "heartfill" : (n.type === "comment" || n.type === "reply" || n.type === "mention") ? "chat" : n.type === "repost" ? "repost" : n.type === "sale" ? "bag" : "people";
        return '<div class="notif ' + (n.read ? "" : "unread") + '" data-go="' + go + '">' + avatarHtml(Cloud.publicUrl(n.avatar), n.name || n.handle, "sm") +
          '<div class="n-b"><div>' + notifText(n) + "</div>" + (n.snippet ? '<div class="n-s">' + esc(n.snippet) + "</div>" : "") + '<div class="n-t">' + timeAgo(n.created_at) + "</div></div>" +
          '<span class="n-ic">' + icon(ic, "i-sm") + "</span></div>";
      }).join("") + "</div>" : '<div class="empty" style="padding:52px 12px">' + emptyArt() + "<h3>Sin avisos</h3><p>Aquí verás quién interactúa contigo.</p></div>";
      b.querySelectorAll(".notif[data-go]").forEach(function (el0) { el0.addEventListener("click", function () { var g = el0.getAttribute("data-go"); if (g.indexOf("mago:") === 0) location.hash = "#/mago/" + g.slice(5); else if (g.indexOf("list:") === 0) { if (g.slice(5)) location.hash = "#/mercado/" + g.slice(5); } else if (g.slice(5)) location.hash = "#/post/" + g.slice(5); }); });
      Cloud.markNotificationsRead().then(function () { unreadNotif = 0; }).catch(function () {});
    }).catch(function () { document.getElementById("nBody").innerHTML = '<div class="empty" style="padding:40px"><p>No se pudieron cargar los avisos.</p></div>'; });
  }
  function magicianRow(m) {
    return '<div class="mago-row" data-mago="' + esc(m.user_id) + '">' + avatarHtml(Cloud.publicUrl(m.avatar), m.name || m.handle) +
      '<div class="mr-b"><div class="n">' + esc(m.name || "Mago") + '</div><div class="d">' + (m.handle ? "@" + esc(m.handle) : "") + ((m.specialty && m.specialty.length) ? " · " + esc(m.specialty[0]) : "") + "</div></div>" +
      (m.is_me ? "" : '<button class="btn small ' + (m.is_following ? "ghost" : "") + '" data-follow="' + esc(m.user_id) + '">' + (m.is_following ? "Siguiendo" : "Seguir") + "</button>") + "</div>";
  }
  function bindMagicianRows(scope) {
    scope.querySelectorAll(".mago-row[data-mago]").forEach(function (r) { r.addEventListener("click", function (e) { if (e.target.closest("[data-follow]")) return; location.hash = "#/mago/" + r.getAttribute("data-mago"); }); });
    scope.querySelectorAll("[data-follow]").forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); var id = b.getAttribute("data-follow"); var on = b.textContent === "Siguiendo"; b.textContent = on ? "Seguir" : "Siguiendo"; b.classList.toggle("ghost", !on); (on ? Cloud.unfollow(id) : Cloud.follow(id)).catch(function () { b.textContent = on ? "Siguiendo" : "Seguir"; b.classList.toggle("ghost", on); toast("No se pudo, inténtalo de nuevo"); }); }); });
  }
  var discoverSpec = null;
  function renderDiscover() {
    clearTabbar();
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/comunidad\'">' + icon("back") + '</button><h1>Descubrir magos</h1></div>' +
      '<div class="search"><span class="mag">' + icon("search", "i-sm") + '</span><input id="dscQ" placeholder="Buscar por nombre o @usuario…"></div>' +
      '<div class="chips" id="dscSpec"><div class="chip ' + (!discoverSpec ? "active" : "") + '" data-s="">Todas</div>' + SPECIALTIES.map(function (s) { return '<div class="chip ' + (discoverSpec === s ? "active" : "") + '" data-s="' + esc(s) + '">' + esc(s) + "</div>"; }).join("") + "</div>" +
      '<div id="dscBody">' + skelRows(6) + '</div></div>';
    var bodyEl = document.getElementById("dscBody"), q = document.getElementById("dscQ");
    var run = function () {
      var query = (q.value || "").trim();
      bodyEl.innerHTML = skelRows(6);
      var p = (query || discoverSpec) ? Cloud.searchMagicians(query, discoverSpec) : Cloud.suggestMagicians();
      p.then(function (rows) {
        if (!rows.length) { bodyEl.innerHTML = '<p class="hint" style="padding:20px 0">Sin resultados.</p>'; return; }
        bodyEl.innerHTML = (!query && !discoverSpec ? '<div class="sec-label">Sugerencias para ti</div>' : "") + '<div class="mago-list">' + rows.map(magicianRow).join("") + "</div>";
        bindMagicianRows(bodyEl);
      }).catch(function () { bodyEl.innerHTML = '<p class="hint">No se pudo buscar.</p>'; });
    };
    var to; q.addEventListener("input", function () { clearTimeout(to); to = setTimeout(run, 300); });
    view.querySelectorAll("#dscSpec .chip").forEach(function (c) { c.addEventListener("click", function () { discoverSpec = c.getAttribute("data-s") || null; view.querySelectorAll("#dscSpec .chip").forEach(function (x) { x.classList.remove("active"); }); c.classList.add("active"); run(); }); });
    run();
  }
  function renderReto() {
    clearTabbar();
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/comunidad\'">' + icon("back") + '</button><h1>Reto</h1></div><div id="rtBody">' + skelFeed(2) + '</div></div>';
    Cloud.getActiveChallenge().then(function (chal) {
      var b = document.getElementById("rtBody");
      if (!chal) { b.innerHTML = '<div class="empty" style="padding:46px 12px"><div class="big">' + icon("flame") + "</div><h3>Sin reto activo</h3><p>Vuelve pronto, habrá uno nuevo.</p></div>"; return; }
      Cloud.getFeed(null, "discover", null, chal.id).then(function (rows) {
        b.innerHTML = '<div class="reto-head"><span class="cb-ic big">' + icon("flame") + '</span><h2 class="title" style="margin:8px 0 2px">' + esc(chal.title) + "</h2><p>" + esc(chal.prompt || "") + '</p><div class="cb-m">' + chal.participants + " magos participando" + (chal.hashtag ? " · #" + esc(chal.hashtag) : "") + '</div><button class="btn" id="rtJoin">' + (chal.joined ? "Añadir otra participación" : "Participar") + "</button></div>" +
          '<div class="sec-label">Participaciones</div>' + (rows.length ? '<div class="feed">' + rows.map(postCardHtml).join("") + "</div>" : '<p class="hint">Nadie ha participado todavía. ¡Sé el primero!</p>');
        bindPostCards(b);
        document.getElementById("rtJoin").addEventListener("click", function () { composeChallenge = chal; location.hash = "#/publicar"; });
      }).catch(function () { b.innerHTML = '<div class="empty" style="padding:40px"><p>No se pudo cargar.</p></div>'; });
    }).catch(function () { document.getElementById("rtBody").innerHTML = '<div class="empty" style="padding:40px"><p>No se pudo cargar.</p></div>'; });
  }
  function renderLeaderboard() {
    clearTabbar();
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/comunidad\'">' + icon("back") + '</button><h1>Top magos</h1></div><div id="lbBody">' + skelRows(6) + '</div></div>';
    Cloud.getLeaderboard().then(function (rows) {
      var b = document.getElementById("lbBody");
      b.innerHTML = rows.length ? '<p class="subtitle">Ranking de la semana por actividad e interacción.</p><div class="lb-list">' + rows.map(function (m, i) {
        return '<div class="lb-row" data-mago="' + esc(m.user_id) + '"><span class="lb-rank r' + (i < 3 ? i + 1 : "") + '">' + (i + 1) + "</span>" + avatarHtml(Cloud.publicUrl(m.avatar), m.name || m.handle) +
          '<div class="mr-b"><div class="n">' + esc(m.name || m.handle || "Mago") + '</div><div class="d">' + (m.followers || 0) + " seguidores · " + (m.score || 0) + " pts</div></div>" +
          (m.is_me ? "" : '<button class="btn small ' + (m.is_following ? "ghost" : "") + '" data-follow="' + esc(m.user_id) + '">' + (m.is_following ? "Siguiendo" : "Seguir") + "</button>") + "</div>";
      }).join("") + "</div>" : '<div class="empty" style="padding:46px"><div class="big">' + icon("trophy") + "</div><p>Aún no hay ranking. ¡Empieza a publicar!</p></div>";
      b.querySelectorAll(".lb-row[data-mago]").forEach(function (r) { r.addEventListener("click", function (e) { if (e.target.closest("[data-follow]")) return; location.hash = "#/mago/" + r.getAttribute("data-mago"); }); });
      bindMagicianRows(b);
    }).catch(function () { document.getElementById("lbBody").innerHTML = '<div class="empty" style="padding:40px"><p>No se pudo cargar.</p></div>'; });
  }
  function renderTagFeed(tag) {
    clearTabbar();
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/comunidad\'">' + icon("back") + '</button><h1>#' + esc(tag) + '</h1></div><div id="tBody">' + skelFeed(2) + '</div></div>';
    Cloud.getFeed(null, "discover", tag).then(function (rows) {
      var b = document.getElementById("tBody");
      b.innerHTML = rows.length ? '<div class="feed">' + rows.map(postCardHtml).join("") + "</div>" : '<div class="empty" style="padding:46px 12px"><div class="big">' + icon("search") + "</div><p>Nada con #" + esc(tag) + " todavía.</p></div>";
      bindPostCards(b);
      appendMore(b, b.querySelector(".feed"), rows, function (before) { return Cloud.getFeed(null, "discover", tag, null, before); });
    }).catch(function () { document.getElementById("tBody").innerHTML = '<div class="empty" style="padding:40px"><p>No se pudo cargar.</p></div>'; });
  }
  function renderMagicianList(uid, which) {
    clearTabbar();
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="history.back()">' + icon("back") + '</button><h1>' + (which === "followers" ? "Seguidores" : "Siguiendo") + '</h1></div><div id="mlBody">' + skelRows(8) + '</div></div>';
    Cloud.getFollowList(uid, which).then(function (rows) {
      var b = document.getElementById("mlBody");
      b.innerHTML = rows.length ? '<div class="mago-list">' + rows.map(magicianRow).join("") + "</div>" : '<p class="hint" style="padding:24px 2px">' + (which === "followers" ? "Nadie todavía." : "No sigue a nadie todavía.") + "</p>";
      bindMagicianRows(b);
    }).catch(function () { document.getElementById("mlBody").innerHTML = '<div class="empty" style="padding:40px"><p>No se pudo cargar.</p></div>'; });
  }
  function renderSaved() {
    clearTabbar();
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/comunidad\'">' + icon("back") + '</button><h1>Guardados</h1></div><div id="svBody">' + skelFeed(2) + '</div></div>';
    Cloud.getFeed(null, "saved").then(function (rows) {
      var b = document.getElementById("svBody");
      b.innerHTML = rows.length ? '<div class="feed">' + rows.map(postCardHtml).join("") + "</div>" : '<div class="empty" style="padding:52px 12px">' + emptyArt() + "<h3>Sin guardados</h3><p>Guarda publicaciones para verlas luego.</p></div>";
      bindPostCards(b);
      appendMore(b, b.querySelector(".feed"), rows, function (before) { return Cloud.getFeed(null, "saved", null, null, before); });
    }).catch(function () { document.getElementById("svBody").innerHTML = '<div class="empty" style="padding:40px"><p>No se pudo cargar.</p></div>'; });
  }

  /* --------------------------- Mensajes ----------------------------- */
  function refreshMsgBadge() {
    if (!cloudReady() || !logged() || !Cloud.getConversations) return;
    Cloud.getConversations().then(function (rows) { var n = rows.reduce(function (s, c) { return s + (c.unread || 0); }, 0); var b = document.getElementById("msgBadge"); if (b) { b.style.display = n ? "flex" : "none"; b.textContent = n > 9 ? "9+" : n; } }).catch(function () {});
  }
  function renderMessages() {
    clearTabbar();
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/comunidad\'">' + icon("back") + '</button><h1>Mensajes</h1></div><div id="msBody">' + skelRows(6) + '</div></div>';
    Cloud.getConversations().then(function (rows) {
      var b = document.getElementById("msBody");
      b.innerHTML = rows.length ? '<div class="conv-list">' + rows.map(function (c) {
        return '<div class="conv" data-cid="' + esc(c.id) + '">' + avatarHtml(Cloud.publicUrl(c.avatar), c.name || c.handle) +
          '<div class="cv-b"><div class="n">' + esc(c.name || c.handle || "Mago") + '</div><div class="d">' + esc(c.last || "") + "</div></div>" +
          (c.unread ? '<span class="cv-unread">' + c.unread + "</span>" : '<span class="cv-t">' + timeAgo(c.last_at) + "</span>") + "</div>";
      }).join("") + "</div>" : '<div class="empty" style="padding:52px 12px">' + emptyArt() + "<h3>Sin mensajes</h3><p>Escribe a cualquier mago desde su perfil.</p></div>";
      b.querySelectorAll(".conv[data-cid]").forEach(function (c) { c.addEventListener("click", function () { location.hash = "#/chat/" + c.getAttribute("data-cid"); }); });
    }).catch(function () { document.getElementById("msBody").innerHTML = '<div class="empty" style="padding:40px"><p>No se pudo cargar.</p></div>'; });
  }
  var chatCh = null;
  function renderChat(cid) {
    clearTabbar();
    view.innerHTML = '<div class="screen chat"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/mensajes\'">' + icon("back") + '</button><h1>Chat</h1></div><div class="chat-scroll" id="chatMsgs"><div class="splash" style="padding:30px 0"><div class="spin"></div></div></div><div class="chat-in"><input id="chIn" placeholder="Escribe un mensaje…"><button class="btn small" id="chSend">' + icon("send", "i-sm") + "</button></div></div>";
    var paint = function (msgs) { var el0 = document.getElementById("chatMsgs"); if (!el0) return; el0.innerHTML = msgs.length ? msgs.map(function (m) { return '<div class="bubble ' + (m.mine ? "me" : "") + '">' + esc(m.body) + "</div>"; }).join("") : '<p class="hint" style="text-align:center;padding:20px">Empieza la conversación.</p>'; el0.scrollTop = el0.scrollHeight; };
    Cloud.getMessages(cid).then(function (msgs) { paint(msgs); Cloud.markMessagesRead(cid).catch(function () {}); }).catch(function () {});
    if (chatCh) { Cloud.unsubscribeRealtime(chatCh); chatCh = null; }
    chatCh = Cloud.subscribeMessages(cid, function () { Cloud.getMessages(cid).then(paint); Cloud.markMessagesRead(cid).catch(function () {}); });
    var send = function () { var inp = document.getElementById("chIn"); var t = (inp.value || "").trim(); if (!t) return; inp.value = ""; Cloud.sendMessage(cid, t).then(function () { Cloud.getMessages(cid).then(paint); }).catch(function () { toast("No se pudo enviar"); }); };
    document.getElementById("chSend").addEventListener("click", send);
    document.getElementById("chIn").addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
  }

  /* --------------------- Racha / logros / dopamina ------------------ */
  var myStreak = 0;
  function achievementsFor(p, isMe) {
    var a = [];
    if ((p.posts || 0) >= 1) a.push({ i: "wand", t: "Primer paso" });
    if ((p.posts || 0) >= 10) a.push({ i: "chat", t: "Activo" });
    if ((p.followers || 0) >= 10) a.push({ i: "people", t: "Popular" });
    if ((p.followers || 0) >= 100) a.push({ i: "trophy", t: "Estrella" });
    if (isMe && myStreak >= 3) a.push({ i: "flame", t: "Racha " + myStreak });
    return a;
  }
  function burstSparks(el0) {
    try {
      var r = el0.getBoundingClientRect();
      for (var i = 0; i < 8; i++) {
        var sp = document.createElement("span"); sp.className = "spark-burst"; sp.textContent = "\u2726";
        sp.style.left = (r.left + r.width / 2) + "px"; sp.style.top = (r.top + r.height / 2) + "px";
        sp.style.setProperty("--dx", (Math.random() * 110 - 55) + "px");
        sp.style.setProperty("--rot", (Math.random() * 140 - 70) + "deg");
        sp.style.fontSize = (10 + Math.random() * 8) + "px";
        sp.style.animationDelay = (i * 24) + "ms";
        document.body.appendChild(sp);
        (function (n) { setTimeout(function () { n.remove(); }, 1000); })(sp);
      }
    } catch (e) {}
  }
  function burstHearts(el0) {
    try {
      var r = el0.getBoundingClientRect();
      for (var i = 0; i < 6; i++) {
        var h = document.createElement("span"); h.className = "heart-burst"; h.textContent = "❤";
        h.style.left = (r.left + r.width / 2) + "px"; h.style.top = (r.top) + "px";
        h.style.setProperty("--dx", (Math.random() * 60 - 30) + "px");
        h.style.animationDelay = (i * 30) + "ms";
        document.body.appendChild(h);
        (function (n) { setTimeout(function () { n.remove(); }, 900); })(h);
      }
    } catch (e) {}
  }

  /* --------------------------- Compose ------------------------------ */
  var composeTrick = null, composeChallenge = null;
  function renderCompose() {
    clearTabbar(); composeTrick = null;
    var chal = composeChallenge; composeChallenge = null;
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/comunidad\'">' + icon("back") + '</button><h1>Nueva publicación</h1></div>' +
      (chal ? '<div class="chal-chip">' + icon("flame", "i-sm") + " Participando en: <b>" + esc(chal.title) + "</b></div>" : "") +
      '<div class="field"><textarea id="cpBody" rows="4" placeholder="Comparte una idea, un logro, una pregunta… usa #hashtags y @menciones">' + (chal && chal.hashtag ? "#" + esc(chal.hashtag) + " " : "") + "</textarea></div>" +
      '<div class="pc-attach"><button class="btn ghost" id="cpPhoto">' + icon("plus", "i-sm") + ' Fotos</button><button class="btn ghost" id="cpVid">' + icon("play", "i-sm") + ' Vídeo</button><button class="btn ghost" id="cpTrick">' + icon("cards", "i-sm") + ' Truco</button></div>' +
      '<input type="file" id="cpFile" accept="image/*" multiple style="display:none">' +
      '<input type="file" id="cpVidFile" accept="video/*" style="display:none">' +
      '<div id="cpPrev"></div>' +
      '<button class="btn" id="cpPost">Publicar</button></div>';
    var media = [];
    var prev = function () {
      document.getElementById("cpPrev").innerHTML = (media.length ? '<div class="pc-media">' + mediaHtml(media) + "</div>" : "") +
        (composeTrick ? trickCardHtml({ title: composeTrick.title, category: composeTrick.category, difficulty: composeTrick.difficulty }) : "");
    };
    attachAutocomplete(document.getElementById("cpBody"));
    document.getElementById("cpPhoto").addEventListener("click", function () { document.getElementById("cpFile").click(); });
    document.getElementById("cpFile").addEventListener("change", function () {
      var files = Array.prototype.slice.call(this.files || []); this.value = "";
      files.forEach(function (fl) { toast("Subiendo foto…"); Cloud.uploadSocial(fl).then(function (r) { media.push({ kind: "image", url: r.url, path: r.path }); prev(); }).catch(function () { toast("No se pudo subir"); }); });
    });
    document.getElementById("cpVidFile").addEventListener("change", function () {
      var fl = this.files && this.files[0]; this.value = ""; if (!fl) return;
      uploadOwnVideo(fl, function (m) { media.push(m); prev(); });
    });
    document.getElementById("cpVid").addEventListener("click", function () {
      actionSheet([
        { label: "Subir un vídeo", fn: function () { document.getElementById("cpVidFile").click(); } },
        { label: "Enlace de YouTube o Vimeo", fn: function () { var url = prompt("Pega el enlace del vídeo (YouTube o Vimeo):"); if (!url) return; var v = parseVideo(url); if (!v.embed) { toast("Solo YouTube o Vimeo"); return; } media.push({ kind: "video", embed: v.embed, url: v.url, thumb: v.thumb, provider: v.provider }); prev(); } }
      ]);
    });
    document.getElementById("cpTrick").addEventListener("click", function () { pickTrick(function (t) { composeTrick = t; prev(); }); });
    document.getElementById("cpPost").addEventListener("click", function () {
      var body = (document.getElementById("cpBody").value || "").trim();
      if (!body && !media.length && !composeTrick) { toast("Escribe algo o adjunta"); return; }
      var btn = document.getElementById("cpPost"); btn.disabled = true; btn.textContent = "Publicando…";
      var row = { kind: "post", body: body, media: media, trick_card: composeTrick ? { title: composeTrick.title, category: composeTrick.category, difficulty: composeTrick.difficulty } : null, challenge_id: chal ? chal.id : null };
      Cloud.createPost(row).then(function () { burstSparks(btn); toast(chal ? "¡Participación publicada!" : "Publicado"); composeChallenge = null; location.hash = chal ? "#/reto" : "#/comunidad"; }).catch(function () { btn.disabled = false; btn.textContent = "Publicar"; toast("No se pudo publicar"); });
    });
  }
  function pickTrick(cb) {
    if (!state.tricks.length) { toast("No tienes trucos guardados"); return; }
    var ov = el('<div class="modal-ov"><div class="modal"><h3>Elige un truco</h3><div class="rlist" id="ptList">' +
      state.tricks.map(function (t) { return '<div class="rrow" data-id="' + esc(t.id) + '"><div class="ri">' + icon("cards") + '</div><div class="rt"><div class="n">' + esc(t.title) + '</div><div class="d">' + esc(t.category || "") + "</div></div></div>"; }).join("") +
      '</div><button class="btn ghost" id="ptCancel">Cancelar</button></div></div>');
    document.body.appendChild(ov);
    var close = function () { ov.remove(); };
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    document.getElementById("ptCancel").addEventListener("click", close);
    ov.querySelectorAll(".rrow[data-id]").forEach(function (r) { r.addEventListener("click", function () { var t = getTrick(r.getAttribute("data-id")); close(); if (t) cb(t); }); });
  }

  /* ------------------------- Post detail ---------------------------- */
  function renderPostDetail(id) {
    clearTabbar();
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="history.back()">' + icon("back") + '</button><h1>Publicación</h1></div><div id="pdBody">' + skelDetail() + '</div></div>';
    Promise.all([Cloud.getPost(id), Cloud.getComments(id)]).then(function (res) {
      var p = res[0], comments = res[1] || [];
      var b = document.getElementById("pdBody"); if (!p) { b.innerHTML = '<div class="empty" style="padding:40px"><p>No disponible.</p></div>'; return; }
      var byParent = {}; comments.forEach(function (c) { if (c.parent_id) { (byParent[c.parent_id] = byParent[c.parent_id] || []).push(c); } });
      var tops = comments.filter(function (c) { return !c.parent_id; });
      var commentHtml = function (c, reply) {
        return '<div class="cmt' + (reply ? " reply" : "") + '">' + avatarHtml(Cloud.publicUrl(c.avatar), c.name || c.handle, "sm") +
          '<div class="cmt-body"><div class="c-who" data-mago="' + esc(c.author) + '">' + esc(c.name || c.handle || "Mago") + " <span>" + timeAgo(c.created_at) + (c.edited_at ? " · editado" : "") + "</span></div>" +
          '<div class="c-b">' + linkify(c.body) + "</div>" +
          '<div class="c-acts"><button class="c-like ' + (c.liked ? "on" : "") + '" data-clike="' + esc(c.id) + '" aria-label="Me gusta">' + icon(c.liked ? "heartfill" : "heart", "i-sm") + "<span>" + (c.likes || 0) + "</span></button>" +
          (reply ? "" : '<button class="c-reply" data-reply="' + esc(c.id) + '" data-h="' + esc(c.handle || "") + '">Responder</button>') +
          (c.mine ? '<button class="c-edit" data-editc="' + esc(c.id) + '">Editar</button>' : "") + "</div></div>" +
          (c.mine ? '<button class="c-del" data-delc="' + esc(c.id) + '">' + icon("x", "i-sm") + "</button>" : "") + "</div>";
      };
      var commentsHtml = tops.length ? tops.map(function (c) { return commentHtml(c, false) + ((byParent[c.id] || []).length ? '<div class="cmt-replies">' + byParent[c.id].map(function (r) { return commentHtml(r, true); }).join("") + "</div>" : ""); }).join("") : '<p class="hint">Sé el primero en comentar.</p>';
      b.innerHTML = postCardHtml(p) +
        '<div class="sec-label">Comentarios</div><div class="comments">' + commentsHtml + "</div>" +
        '<div class="cmt-add" id="cmtBar"><input id="cmtIn" placeholder="Escribe un comentario…"><button class="btn small" id="cmtSend">' + icon("send", "i-sm") + "</button></div>";
      bindPostCards(b);
      var replyTo = null;
      var input = document.getElementById("cmtIn"), bar = document.getElementById("cmtBar");
      var send = function () { var t = (input.value || "").trim(); if (!t) return; input.value = ""; var parent = replyTo; replyTo = null; var chip = document.getElementById("replyChip"); if (chip) chip.remove(); Cloud.addComment(id, t, parent).then(function () { renderPostDetail(id); }).catch(function () { toast("No se pudo comentar"); }); };
      document.getElementById("cmtSend").addEventListener("click", send);
      attachAutocomplete(input);
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
      b.querySelectorAll(".c-who[data-mago]").forEach(function (w) { w.addEventListener("click", function () { location.hash = "#/mago/" + w.getAttribute("data-mago"); }); });
      b.querySelectorAll("[data-delc]").forEach(function (x) { x.addEventListener("click", function () { if (!confirm("¿Eliminar comentario?")) return; Cloud.deleteComment(x.getAttribute("data-delc")).then(function () { renderPostDetail(id); }).catch(function () { toast("No se pudo"); }); }); });
      b.querySelectorAll("[data-editc]").forEach(function (x) { x.addEventListener("click", function () { var cid = x.getAttribute("data-editc"); var cur = ""; comments.forEach(function (c) { if (c.id === cid) cur = c.body; }); editTextModal("Editar comentario", cur, function (v, close) { Cloud.updateComment(cid, v).then(function () { close(); toast("Editado"); renderPostDetail(id); }).catch(function () { toast("No se pudo"); }); }); }); });
      b.querySelectorAll("[data-clike]").forEach(function (bt) { bt.addEventListener("click", function () { var cid = bt.getAttribute("data-clike"); var on = bt.classList.contains("on"); var sp = bt.querySelector("span"); var n = parseInt(sp.textContent, 10) || 0; bt.classList.toggle("on"); sp.textContent = on ? Math.max(0, n - 1) : n + 1; bt.innerHTML = icon(on ? "heart" : "heartfill", "i-sm") + "<span>" + sp.textContent + "</span>"; (on ? Cloud.unlikeComment(cid) : Cloud.likeComment(cid)).catch(function () {}); }); });
      b.querySelectorAll("[data-reply]").forEach(function (bt) { bt.addEventListener("click", function () { replyTo = bt.getAttribute("data-reply"); var h = bt.getAttribute("data-h"); var old = document.getElementById("replyChip"); if (old) old.remove(); var chip = el('<div class="reply-chip" id="replyChip">Respondiendo a @' + esc(h || "comentario") + ' <button>✕</button></div>'); bar.parentNode.insertBefore(chip, bar); chip.querySelector("button").addEventListener("click", function () { replyTo = null; chip.remove(); }); input.focus(); }); });
    }).catch(function () { document.getElementById("pdBody").innerHTML = '<div class="empty" style="padding:40px"><p>No se pudo cargar.</p></div>'; });
  }

  /* ---------------------------- Perfil ------------------------------ */
  function renderProfile(uid) {
    clearTabbar();
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="history.back()">' + icon("back") + '</button><h1>Perfil</h1></div><div id="prBody">' + skelProfile() + '</div></div>';
    Promise.all([Cloud.getProfileInfo(uid), Cloud.getFeed(uid), Cloud.getMarket(uid).catch(function () { return []; })]).then(function (res) {
      var p = res[0], posts = res[1] || [], listings = res[2] || [];
      var b = document.getElementById("prBody"); if (!p) { b.innerHTML = '<div class="empty" style="padding:40px"><p>Perfil no disponible.</p></div>'; return; }
      var spec = (p.specialty || []).map(function (s) { return '<span class="tagchip">' + esc(s) + "</span>"; }).join("");
      var links = p.links || {};
      var linkHtml = "";
      if (links.web) linkHtml += '<a class="p-link" href="' + esc(links.web) + '" target="_blank" rel="noopener">' + icon("globe", "i-sm") + "Web</a>";
      if (links.instagram) linkHtml += '<a class="p-link" href="https://instagram.com/' + esc(links.instagram.replace(/^@/, "")) + '" target="_blank" rel="noopener">Instagram</a>';
      if (links.youtube) linkHtml += '<a class="p-link" href="' + esc(links.youtube) + '" target="_blank" rel="noopener">YouTube</a>';
      b.innerHTML = (p.cover ? '<div class="p-cover" style="background-image:url(' + esc(Cloud.publicUrl(p.cover) || p.cover) + ')"></div>' : '<div class="p-cover empty"></div>') +
        '<div class="profile-head">' + avatarHtml(Cloud.publicUrl(p.avatar), p.name || p.handle, "xl") +
        '<h2 class="title" style="margin:10px 0 0">' + esc(p.name || "Mago") + "</h2>" +
        '<div class="p-handle">' + (p.handle ? "@" + esc(p.handle) : "") + (p.city ? " · " + esc(p.city) : "") + "</div>" +
        (p.bio ? '<p class="p-bio">' + esc(p.bio) + "</p>" : "") +
        (spec ? '<div class="tagchips" style="justify-content:center">' + spec + "</div>" : "") +
        (linkHtml ? '<div class="p-links">' + linkHtml + "</div>" : "") +
        '<div class="p-stats"><div><b>' + (p.posts || 0) + '</b><span>publicaciones</span></div><div data-go="#/seguidores/' + esc(uid) + '"><b>' + (p.followers || 0) + '</b><span>seguidores</span></div><div data-go="#/seguidos/' + esc(uid) + '"><b>' + (p.following || 0) + '</b><span>siguiendo</span></div></div>' +
        (function () { var ach = achievementsFor(p, p.is_me); return ach.length ? '<div class="ach-row">' + ach.map(function (a) { return '<span class="ach">' + icon(a.i, "i-sm") + esc(a.t) + "</span>"; }).join("") + "</div>" : ""; })() +
        (p.is_me ? '<div class="p-actions"><button class="btn ghost" id="prEdit">Editar perfil</button><button class="btn ghost" id="prSaved">' + icon("bookmark", "i-sm") + " Guardados</button></div>" : '<div class="p-actions"><button class="btn ' + (p.is_following ? "ghost" : "") + '" id="prFollow">' + (p.is_following ? "Siguiendo" : "Seguir") + '</button><button class="btn ghost" id="prMsg">' + icon("chat", "i-sm") + ' Mensaje</button><button class="iconbtn" id="prMore">' + icon("dots") + "</button></div>") + "</div>" +
        (listings.length ? '<div class="sec-label">En venta</div><div class="market">' + listings.map(listingCard).join("") + "</div>" : "") +
        '<div class="sec-label">Publicaciones</div>' + (posts.length ? '<div class="feed">' + posts.map(postCardHtml).join("") + "</div>" : '<p class="hint">Todavía no ha publicado nada.</p>');
      bindPostCards(b);
      b.querySelectorAll(".listcard[data-l]").forEach(function (c) { c.addEventListener("click", function () { var cv = c.querySelector(".lc-cover"); if (cv) cv.style.viewTransitionName = "hero"; location.hash = "#/mercado/" + c.getAttribute("data-l"); }); });
      appendMore(b, b.querySelector(".feed"), posts, function (before) { return Cloud.getFeed(uid, "discover", null, null, before); });
      b.querySelectorAll(".p-stats [data-go]").forEach(function (d) { d.addEventListener("click", function () { location.hash = d.getAttribute("data-go"); }); });
      var fb = document.getElementById("prFollow");
      if (fb) fb.addEventListener("click", function () { var on = p.is_following; p.is_following = !on; fb.textContent = p.is_following ? "Siguiendo" : "Seguir"; fb.classList.toggle("ghost", p.is_following); (on ? Cloud.unfollow(uid) : Cloud.follow(uid)).catch(function () { p.is_following = on; fb.textContent = on ? "Siguiendo" : "Seguir"; fb.classList.toggle("ghost", on); toast("No se pudo, inténtalo de nuevo"); }); });
      var eb = document.getElementById("prEdit"); if (eb) eb.addEventListener("click", function () { onb.step = 1; onb.handle = p.handle || ""; onb.name = p.name || ""; onb.spec = (p.specialty || []).slice(); onb.city = p.city || ""; onb.social = socialEnabled; renderEditProfile(); });
      var sv = document.getElementById("prSaved"); if (sv) sv.addEventListener("click", function () { location.hash = "#/guardados"; });
      var pm = document.getElementById("prMsg"); if (pm) pm.addEventListener("click", function () { pm.disabled = true; Cloud.openConversation(uid).then(function (cid) { location.hash = "#/chat/" + cid; }).catch(function () { pm.disabled = false; toast("No se pudo abrir el chat"); }); });
      var pmo = document.getElementById("prMore"); if (pmo) pmo.addEventListener("click", function () { actionSheet([{ label: "Reportar", fn: function () { Cloud.report("user", uid, null).then(function () { toast("Gracias, lo revisaremos"); }).catch(function () {}); } }, { label: "Bloquear a @" + (p.handle || "este mago"), danger: true, fn: function () { if (!confirm("¿Bloquear? Dejaréis de ver vuestro contenido.")) return; Cloud.block(uid).then(function () { toast("Bloqueado"); location.hash = "#/comunidad"; }).catch(function () {}); } }]); });
    }).catch(function () { document.getElementById("prBody").innerHTML = '<div class="empty" style="padding:40px"><p>No se pudo cargar el perfil.</p></div>'; });
  }
  function renderEditProfile() {
    clearTabbar();
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="history.back()">' + icon("back") + '</button><h1>Editar perfil</h1></div>' +
      '<div class="field"><label>Nombre artístico</label><input id="epName" value="' + esc(onb.name) + '"></div>' +
      '<div class="field"><label>Usuario (@)</label><input id="epHandle" value="' + esc(onb.handle) + '"></div>' +
      '<div class="field"><label>Bio</label><textarea id="epBio" rows="3" placeholder="Cuéntate en una línea…">' + esc(myProfile && myProfile.bio || "") + "</textarea></div>" +
      '<div class="field"><label>Especialidad</label><div class="tchips" id="epSpec">' + SPECIALTIES.map(function (s) { return '<button type="button" class="tchip ' + (onb.spec.indexOf(s) >= 0 ? "on" : "") + '" data-s="' + esc(s) + '">' + esc(s) + "</button>"; }).join("") + "</div></div>" +
      '<div class="field"><label>Ciudad</label><input id="epCity" value="' + esc(onb.city) + '"></div>' +
      '<div class="field"><label>Portada</label><button class="btn ghost" id="epCoverBtn" type="button">' + icon("plus", "i-sm") + ' Cambiar portada</button><input type="file" id="epCoverFile" accept="image/*" style="display:none"><div id="epCoverPrev"></div></div>' +
      '<div class="sec-label">Enlaces</div>' +
      '<div class="field"><label>Web</label><input id="epWeb" placeholder="https://…" value="' + esc((myProfile && myProfile.links && myProfile.links.web) || "") + '"></div>' +
      '<div class="field"><label>Instagram</label><input id="epIg" placeholder="@usuario" value="' + esc((myProfile && myProfile.links && myProfile.links.instagram) || "") + '"></div>' +
      '<div class="field"><label>YouTube</label><input id="epYt" placeholder="https://youtube.com/@…" value="' + esc((myProfile && myProfile.links && myProfile.links.youtube) || "") + '"></div>' +
      '<button class="btn" id="epSave">Guardar</button></div>';
    var epCover = (myProfile && myProfile.cover_path) || null;
    if (epCover) document.getElementById("epCoverPrev").innerHTML = '<div class="p-cover" style="background-image:url(' + esc(Cloud.publicUrl(epCover)) + ')"></div>';
    view.querySelectorAll("#epSpec .tchip").forEach(function (b) { b.addEventListener("click", function () { var s = b.getAttribute("data-s"); var i = onb.spec.indexOf(s); if (i >= 0) onb.spec.splice(i, 1); else onb.spec.push(s); b.classList.toggle("on"); }); });
    document.getElementById("epCoverBtn").addEventListener("click", function () { document.getElementById("epCoverFile").click(); });
    document.getElementById("epCoverFile").addEventListener("change", function () { var fl = this.files[0]; if (!fl) return; toast("Subiendo portada…"); Cloud.uploadSocial(fl).then(function (r) { epCover = r.path; document.getElementById("epCoverPrev").innerHTML = '<div class="p-cover" style="background-image:url(' + esc(r.url) + ')"></div>'; }).catch(function () { toast("No se pudo subir"); }); });
    document.getElementById("epSave").addEventListener("click", function () {
      var name = (document.getElementById("epName").value || "").trim(), handle = (document.getElementById("epHandle").value || "").trim().replace(/[^a-zA-Z0-9_.]/g, "").slice(0, 24);
      if (!name || handle.length < 3) { toast("Nombre y usuario (mín. 3)"); return; }
      var links = { web: (document.getElementById("epWeb").value || "").trim(), instagram: (document.getElementById("epIg").value || "").trim(), youtube: (document.getElementById("epYt").value || "").trim() };
      var btn = document.getElementById("epSave"); btn.disabled = true; btn.textContent = "Guardando…";
      Cloud.upsertProfile({ handle: handle, display_name: name, bio: (document.getElementById("epBio").value || "").trim(), specialty: onb.spec, city: (document.getElementById("epCity").value || "").trim(), cover_path: epCover, links: links })
        .then(function (p) { myProfile = p; toast("Perfil actualizado"); location.hash = "#/mago/" + p.user_id; route(); })
        .catch(function (e) { btn.disabled = false; btn.textContent = "Guardar"; toast(/duplicate|unique/i.test(e && e.message || "") ? "Ese usuario ya existe" : "No se pudo guardar"); });
    });
  }

  /* --------------------------- Mercado ------------------------------ */
  // El mercado admite dos tipos de artículo: "digital" (el método se entrega
  // al instante en la biblioteca del comprador) y "physical" (un objeto real
  // —baraja, gimmick, libro, prop— con stock limitado y gastos de envío).
  var DISCIPLINES = [["cartomagia", "Cartomagia"], ["monedas", "Numismagia"], ["mentalismo", "Mentalismo"], ["closeup", "Close-up"], ["escenario", "Escenario"], ["infantil", "Magia infantil"], ["ilusiones", "Grandes ilusiones"], ["otros", "Otros"]];
  function discLabel(k) { for (var i = 0; i < DISCIPLINES.length; i++) if (DISCIPLINES[i][0] === k) return DISCIPLINES[i][1]; return ""; }
  function isPhysical(l) { return l.item_type === "physical"; }
  function soldOut(l) { return isPhysical(l) && l.stock === 0; }
  function listingCard(l) {
    var phys = isPhysical(l), out = soldOut(l);
    var cover = l.cover
      ? '<div class="lc-cover" style="background-image:url(' + esc(Cloud.publicUrl(l.cover) || l.cover) + ')">'
      : '<div class="lc-cover ph">' + engraving(l.id) + mark();
    var tag = phys ? '<span class="lc-tag' + (out ? " out" : "") + '">' + (out ? "Agotado" : "Físico") + "</span>" : "";
    var by = esc(l.name || l.handle || "Mago") + (l.discipline ? " · " + discLabel(l.discipline) : "");
    return '<div class="listcard' + (out ? " sold" : "") + '" data-l="' + esc(l.id) + '">' + cover + tag + "</div>" +
      '<div class="lc-b"><div class="n">' + esc(l.title) + '</div><div class="by">' + by + '</div><div class="price">' + money(l.price, l.currency) +
      (phys && l.ship_cost ? ' <span class="ship">+' + money(l.ship_cost, l.currency) + " envío</span>" : "") +
      (l.owned ? ' <span class="owned">Tuyo</span>' : "") + "</div></div></div>";
  }
  function starsHtml(n, cls) { var o = ""; for (var i = 1; i <= 5; i++) o += '<span class="star ' + (i <= Math.round(n) ? "on" : "") + '" ' + (cls ? 'data-r="' + i + '"' : "") + ">★</span>"; return '<span class="stars ' + (cls || "") + '">' + o + "</span>"; }
  function renderListing(id) {
    clearTabbar();
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="history.back()">' + icon("back") + '</button><h1>Truco</h1></div><div id="liBody">' + skelDetail() + '</div></div>';
    Promise.all([Cloud.getListing(id), Cloud.getReviews(id)]).then(function (res) {
      var l = res[0], reviews = res[1] || [];
      var b = document.getElementById("liBody"); if (!l) { b.innerHTML = '<div class="empty" style="padding:40px"><p>No disponible.</p></div>'; return; }
      var isSeller = l.seller === (myProfile && myProfile.user_id);
      var paused = l.status && l.status !== "active";
      var phys = isPhysical(l), out = soldOut(l);
      var ph1 = view.querySelector(".pagehead h1"); if (ph1 && phys) ph1.textContent = "Artículo";
      var ratingLine = l.reviews ? '<div class="li-rating">' + starsHtml(l.rating || 0) + '<span>' + (l.rating || 0) + " · " + l.reviews + (l.reviews === 1 ? " reseña" : " reseñas") + "</span></div>" : "";
      var metaBits = [];
      if (l.discipline) metaBits.push(discLabel(l.discipline));
      if (phys) {
        metaBits.push("Artículo físico" + (l.condition ? " · " + (l.condition === "usado" ? "usado" : "nuevo") : ""));
        if (l.ships_from) metaBits.push("Envía desde " + l.ships_from);
        metaBits.push(l.ship_cost ? "Envío " + money(l.ship_cost, l.currency) : "Envío incluido");
        if (out) metaBits.push("AGOTADO"); else if (l.stock != null) metaBits.push(l.stock === 1 ? "Última unidad" : "Quedan " + l.stock);
      } else {
        metaBits.push("Digital · entrega instantánea");
      }
      var metaLine = '<div class="li-meta">' + metaBits.map(function (t) { return '<span' + (t === "AGOTADO" ? ' class="out"' : "") + ">" + esc(t === "AGOTADO" ? "Agotado" : t) + "</span>"; }).join("") + "</div>";
      b.innerHTML = (l.cover ? '<div class="li-cover" style="view-transition-name:hero;background-image:url(' + esc(Cloud.publicUrl(l.cover) || l.cover) + ')"></div>' : '<div class="li-cover ph" style="view-transition-name:hero">' + engraving(l.id) + mark("", true) + "</div>") +
        '<div class="li-top"><h1 class="title" style="margin-top:14px">' + esc(l.title) + (isSeller && paused ? ' <span class="badge-paused">Pausado</span>' : "") + '</h1><button class="iconbtn ' + (l.wished ? "on" : "") + '" id="liWish" aria-label="Añadir a deseos">' + icon(l.wished ? "bookmarkfill" : "bookmark") + "</button></div>" +
        ratingLine +
        '<div class="li-seller" data-mago="' + esc(l.seller) + '">' + avatarHtml(Cloud.publicUrl(l.avatar), l.name || l.handle, "sm") + "<span>" + esc(l.name || l.handle || "Mago") + "</span></div>" +
        metaLine +
        (l.description ? '<div class="notes">' + esc(l.description) + "</div>" : "") +
        (isSeller
          ? '<div class="li-buy"><div class="price big">' + money(l.price, l.currency) + '</div><span class="li-sales">' + (l.sales || 0) + (l.sales === 1 ? " venta" : " ventas") + '</span></div>' +
            '<div class="li-owner"><button class="btn ghost" id="liEdit">' + icon("edit", "i-sm") + ' Editar</button>' +
            '<button class="btn ghost" id="liPause">' + (paused ? icon("play", "i-sm") + " Reactivar" : icon("pause", "i-sm") + " Pausar") + "</button>" +
            '<button class="btn ghost danger" id="liDel">' + icon("trash", "i-sm") + " Eliminar</button></div>" +
            '<p class="hint" style="text-align:center">' + (paused ? "Pausado: no aparece en el mercado." : (phys && out ? "Agotado: edita el artículo para reponer stock." : "En venta en el mercado.")) + " El cobro con tarjeta llegará muy pronto.</p>"
          : '<div class="li-buy"><div class="price big">' + money(l.price, l.currency) + "</div>" +
            (l.owned ? (phys ? '<button class="btn" disabled>Comprado</button>' : '<button class="btn" id="liOpen">Ya es tuyo · ver en biblioteca</button>')
              : out ? '<button class="btn" disabled>Agotado</button>'
              : (l.price || phys ? '<button class="btn" id="liBuy">Comprar</button>' : '<button class="btn" id="liFree">Obtener gratis</button>')) + "</div>" +
            (!l.owned && !out && (l.price || phys) ? '<p class="hint" style="text-align:center">' + (phys ? "Lo envía el propio mago. " : "") + 'El pago con tarjeta estará disponible muy pronto.</p>' : "")) +
        (l.owned && l.seller !== (myProfile && myProfile.user_id) ? '<div class="sec-label">Tu valoración</div><div class="rate-box" id="rateBox">' + starsHtml(0, "pick") + '<textarea id="revBody" rows="2" placeholder="¿Qué te ha parecido? (opcional)"></textarea><button class="btn small" id="revSend">Enviar valoración</button></div>' : "") +
        '<div class="sec-label">Reseñas</div>' + (reviews.length ? '<div class="reviews">' + reviews.map(function (r) { return '<div class="rev">' + avatarHtml(Cloud.publicUrl(r.avatar), r.name || r.handle, "sm") + '<div><div class="c-who">' + esc(r.name || r.handle || "Mago") + " " + starsHtml(r.rating) + "</div>" + (r.body ? '<div class="c-b">' + esc(r.body) + "</div>" : "") + "</div></div>"; }).join("") + "</div>" : '<p class="hint">Aún no hay reseñas.</p>');
      var sel = b.querySelector(".li-seller[data-mago]"); if (sel) sel.addEventListener("click", function () { location.hash = "#/mago/" + l.seller; });
      var wb = document.getElementById("liWish"); if (wb) wb.addEventListener("click", function () { var on = wb.classList.contains("on"); wb.classList.toggle("on"); wb.innerHTML = icon(on ? "bookmark" : "bookmarkfill"); (on ? Cloud.unwish(id) : Cloud.wish(id)).then(function () { toast(on ? "Quitado de deseos" : "Añadido a deseos"); }).catch(function () { wb.classList.toggle("on", on); wb.innerHTML = icon(on ? "bookmarkfill" : "bookmark"); toast("No se pudo, inténtalo de nuevo"); }); });
      var op = document.getElementById("liOpen"); if (op) op.addEventListener("click", function () { location.hash = "#/"; });
      var buy = document.getElementById("liBuy"); if (buy) buy.addEventListener("click", function () { toast("Pago con tarjeta muy pronto (Stripe)"); });
      var fr = document.getElementById("liFree"); if (fr) fr.addEventListener("click", function () {
        fr.disabled = true; fr.textContent = "Añadiendo…";
        Cloud.claimFree(id).then(function (payload) { if (payload) { addDeliveredTrick(payload); burstSparks(fr); toast("¡Añadido a tu biblioteca!"); location.hash = "#/"; } else { toast("Contenido no disponible"); fr.disabled = false; fr.textContent = "Obtener gratis"; } })
          .catch(function () { fr.disabled = false; fr.textContent = "Obtener gratis"; toast("No se pudo obtener"); });
      });
      var eb = document.getElementById("liEdit"); if (eb) eb.addEventListener("click", function () { location.hash = "#/vender/" + id; });
      var pb = document.getElementById("liPause"); if (pb) pb.addEventListener("click", function () { pb.disabled = true; var next = paused ? "active" : "paused"; Cloud.updateListing(id, { status: next }).then(function () { toast(paused ? "Reactivado" : "Pausado"); renderListing(id); }).catch(function () { pb.disabled = false; toast("No se pudo"); }); });
      var db = document.getElementById("liDel"); if (db) db.addEventListener("click", function () { if (!confirm("¿Eliminar este truco del mercado? No se podrá deshacer.")) return; db.disabled = true; Cloud.deleteListing(id).then(function () { toast("Eliminado del mercado"); location.hash = "#/mercado"; }).catch(function () { db.disabled = false; toast("No se pudo eliminar"); }); });
      var picked = 0, rb = document.getElementById("rateBox");
      if (rb) {
        rb.querySelectorAll(".stars.pick .star").forEach(function (st) { st.addEventListener("click", function () { picked = parseInt(st.getAttribute("data-r"), 10); rb.querySelectorAll(".stars.pick .star").forEach(function (x, i) { x.classList.toggle("on", i < picked); }); }); });
        document.getElementById("revSend").addEventListener("click", function () {
          if (!picked) { toast("Elige de 1 a 5 estrellas"); return; }
          var btn = document.getElementById("revSend"); btn.disabled = true; btn.textContent = "Enviando…";
          Cloud.addReview(id, picked, (document.getElementById("revBody").value || "").trim()).then(function () { burstSparks(btn); toast("¡Gracias por tu reseña!"); renderListing(id); }).catch(function () { btn.disabled = false; btn.textContent = "Enviar valoración"; toast("No se pudo enviar"); });
        });
      }
    }).catch(function () { document.getElementById("liBody").innerHTML = '<div class="empty" style="padding:40px"><p>No se pudo cargar.</p></div>'; });
  }
  var sellTrick = null, sellCover = null, marketFilter = "all";
  function renderSellForm(editId) {
    clearTabbar(); sellTrick = null; sellCover = null;
    if (editId) {
      view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/mercado/' + esc(editId) + '\'">' + icon("back") + '</button><h1>Editar artículo</h1></div><div id="slLoad">' + skelDetail() + '</div></div>';
      Promise.all([Cloud.getListing(editId), Cloud.getListingContent(editId).catch(function () { return null; })]).then(function (res) {
        var l = res[0], content = res[1];
        if (!l || l.seller !== (myProfile && myProfile.user_id)) { view.innerHTML = '<div class="screen"><div class="empty" style="padding:40px"><p>No disponible.</p></div></div>'; return; }
        buildSellForm(editId, l, content);
      }).catch(function () { view.innerHTML = '<div class="screen"><div class="empty" style="padding:40px"><p>No se pudo cargar.</p></div></div>'; });
    } else {
      buildSellForm(null, null, null);
    }
  }
  function buildSellForm(editId, existing, content) {
    var ex = existing || {};
    var prefTitle = ex.title || "", prefDesc = ex.description || "", prefCents = ex.price || 0;
    sellCover = ex.cover || null;
    if (content) sellTrick = { title: content.title, category: content.category, difficulty: content.difficulty, meta: content.meta || {}, notes: content.notes || "", tags: content.tags || [], media: content.media || [] };
    var sellType = ex.item_type === "physical" ? "physical" : "digital";
    var sellDisc = ex.discipline || "";
    var sellCond = ex.condition || "nuevo";
    var prefStock = ex.stock != null ? ex.stock : "";
    var prefShip = ex.ship_cost || 0;
    var host = editId ? document.getElementById("slLoad") : view;
    var typeHints = { digital: "El método se entrega al instante: notas, ficha y vídeos con enlace pasan a la biblioteca del comprador.", physical: "Un objeto real que envías tú: baraja, gimmick, libro, prop… Tú controlas el stock y el envío." };
    var html = (editId ? "" : '<div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/mercado\'">' + icon("back") + '</button><h1>Vender</h1></div>') +
      '<p class="subtitle">Métodos digitales o material físico: el mercado es para cualquier tipo de mago.</p>' +
      '<div class="field"><label>¿Qué vendes?</label><div class="seg" id="slType"><button data-v="digital" class="' + (sellType === "digital" ? "on" : "") + '" type="button">Digital</button><button data-v="physical" class="' + (sellType === "physical" ? "on" : "") + '" type="button">Físico</button></div>' +
      '<p class="hint" id="slTypeHint">' + typeHints[sellType] + "</p></div>" +
      '<div id="slDigital"' + (sellType === "physical" ? ' style="display:none"' : "") + '><button class="btn ghost" id="slPick">' + icon("cards", "i-sm") + (editId ? ' Cambiar truco de mi biblioteca' : ' Elegir truco de mi biblioteca') + '</button><div id="slPrev">' +
      (sellTrick ? '<div class="trick-card"><span class="tc-ic">' + mark() + '</span><div><div class="n">' + esc(sellTrick.title || "") + '</div><div class="d">' + esc(sellTrick.category || "") + "</div></div></div>" : "") + "</div></div>" +
      '<div class="field"><label>Título</label><input id="slTitle" placeholder="' + (sellType === "physical" ? "Nombre del artículo" : "Nombre del efecto") + '" value="' + esc(prefTitle) + '"></div>' +
      '<div class="field"><label>Descripción (escaparate)</label><textarea id="slDesc" rows="3" placeholder="Qué recibe el comprador, ángulos, nivel…">' + esc(prefDesc) + '</textarea></div>' +
      '<div class="field"><label>Disciplina</label><div class="chips" id="slDisc">' + DISCIPLINES.map(function (d) { return '<button class="chip' + (sellDisc === d[0] ? " active" : "") + '" data-d="' + d[0] + '" type="button">' + d[1] + "</button>"; }).join("") + "</div></div>" +
      '<div id="slPhys"' + (sellType === "physical" ? "" : ' style="display:none"') + '>' +
      '<div class="field"><label>Unidades en stock</label><input id="slStock" type="number" inputmode="numeric" min="0" placeholder="1" value="' + prefStock + '"></div>' +
      '<div class="field"><label>Estado</label><div class="seg" id="slCond"><button data-v="nuevo" class="' + (sellCond === "usado" ? "" : "on") + '" type="button">Nuevo</button><button data-v="usado" class="' + (sellCond === "usado" ? "on" : "") + '" type="button">Usado</button></div></div>' +
      '<div class="field"><label>Envío</label><div class="seg" id="slShipSeg"><button data-v="0" class="' + (prefShip ? "" : "on") + '" type="button">Incluido en el precio</button><button data-v="paid" class="' + (prefShip ? "on" : "") + '" type="button">Con coste</button></div>' +
      '<input id="slShip" inputmode="decimal" placeholder="4,50 €" style="' + (prefShip ? "" : "display:none;") + 'margin-top:8px" value="' + (prefShip ? (prefShip / 100).toFixed(2).replace(".", ",") : "") + '"></div>' +
      '<div class="field"><label>Envías desde</label><input id="slFrom" placeholder="España" value="' + esc(ex.ships_from || "") + '"></div></div>' +
      '<div class="field"><label>Precio</label><div class="seg" id="slPrice"><button data-v="0" class="' + (prefCents ? "" : "on") + (sellType === "physical" ? '" style="display:none' : "") + '" type="button">Gratis</button><button data-v="paid" class="' + (prefCents || sellType === "physical" ? "on" : "") + '" type="button">De pago</button></div>' +
      '<input id="slAmount" inputmode="decimal" placeholder="9,99 €" style="' + (prefCents || sellType === "physical" ? "" : "display:none;") + 'margin-top:8px" value="' + (prefCents ? (prefCents / 100).toFixed(2).replace(".", ",") : "") + '"></div>' +
      '<button class="btn ghost" id="slCoverBtn">' + icon("plus", "i-sm") + ' Portada (opcional)</button><input type="file" id="slCoverFile" accept="image/*" style="display:none"><div id="slCoverPrev">' +
      (sellCover ? '<div class="li-cover" style="background-image:url(' + esc(Cloud.publicUrl(sellCover) || sellCover) + ')"></div>' : "") + "</div>" +
      '<button class="btn" id="slPublish">' + (editId ? "Guardar cambios" : "Publicar en el mercado") + "</button>";
    if (editId) host.innerHTML = html; else view.innerHTML = '<div class="screen">' + html + "</div>";
    document.getElementById("slPick").addEventListener("click", function () { pickTrick(function (t) { sellTrick = t; document.getElementById("slTitle").value = document.getElementById("slTitle").value || t.title; document.getElementById("slPrev").innerHTML = '<div class="trick-card"><span class="tc-ic">' + mark() + '</span><div><div class="n">' + esc(t.title) + '</div><div class="d">' + esc(t.category || "") + "</div></div></div>"; }); });
    var paid = !!prefCents || sellType === "physical";
    var shipPaid = !!prefShip;
    view.querySelectorAll("#slType button").forEach(function (b) {
      b.addEventListener("click", function () {
        setSeg("#slType", b); sellType = b.getAttribute("data-v");
        var phys = sellType === "physical";
        document.getElementById("slDigital").style.display = phys ? "none" : "";
        document.getElementById("slPhys").style.display = phys ? "" : "none";
        document.getElementById("slTypeHint").textContent = typeHints[sellType];
        document.getElementById("slTitle").placeholder = phys ? "Nombre del artículo" : "Nombre del efecto";
        var freeBtn = view.querySelector('#slPrice [data-v="0"]');
        freeBtn.style.display = phys ? "none" : "";
        if (phys && !paid) { paid = true; setSeg("#slPrice", view.querySelector('#slPrice [data-v="paid"]')); document.getElementById("slAmount").style.display = ""; }
      });
    });
    view.querySelectorAll("#slDisc .chip").forEach(function (ch) {
      ch.addEventListener("click", function () {
        var d = ch.getAttribute("data-d");
        sellDisc = sellDisc === d ? "" : d;
        view.querySelectorAll("#slDisc .chip").forEach(function (x) { x.classList.toggle("active", x.getAttribute("data-d") === sellDisc); });
      });
    });
    view.querySelectorAll("#slCond button").forEach(function (b) { b.addEventListener("click", function () { setSeg("#slCond", b); sellCond = b.getAttribute("data-v"); }); });
    view.querySelectorAll("#slShipSeg button").forEach(function (b) { b.addEventListener("click", function () { setSeg("#slShipSeg", b); shipPaid = b.getAttribute("data-v") === "paid"; document.getElementById("slShip").style.display = shipPaid ? "" : "none"; }); });
    view.querySelectorAll("#slPrice button").forEach(function (b) { b.addEventListener("click", function () { setSeg("#slPrice", b); paid = b.getAttribute("data-v") === "paid"; document.getElementById("slAmount").style.display = paid ? "" : "none"; }); });
    document.getElementById("slCoverBtn").addEventListener("click", function () { document.getElementById("slCoverFile").click(); });
    document.getElementById("slCoverFile").addEventListener("change", function () { var fl = this.files[0]; if (!fl) return; toast("Subiendo portada…"); Cloud.uploadSocial(fl).then(function (r) { sellCover = r.path; document.getElementById("slCoverPrev").innerHTML = '<div class="li-cover" style="background-image:url(' + esc(r.url) + ')"></div>'; }).catch(function () { toast("No se pudo subir"); }); });
    document.getElementById("slPublish").addEventListener("click", function () {
      var phys = sellType === "physical";
      var title = (document.getElementById("slTitle").value || "").trim();
      if (!phys && !sellTrick) { toast("Elige un truco primero"); return; }
      if (!title) { toast("Ponle un título"); return; }
      var cents = 0;
      if (paid || phys) { var a = parseFloat((document.getElementById("slAmount").value || "").replace(",", ".")); if (!a || a <= 0) { toast(phys ? "Los artículos físicos necesitan un precio" : "Pon un precio válido"); return; } cents = Math.round(a * 100); }
      var stock = null, shipCents = 0, from = null;
      if (phys) {
        stock = parseInt(document.getElementById("slStock").value, 10);
        if (isNaN(stock) || stock < 1) { toast("Indica cuántas unidades tienes"); return; }
        if (shipPaid) { var s = parseFloat((document.getElementById("slShip").value || "").replace(",", ".")); if (!s || s <= 0) { toast("Pon un coste de envío válido"); return; } shipCents = Math.round(s * 100); }
        from = (document.getElementById("slFrom").value || "").trim() || null;
      }
      var btn = document.getElementById("slPublish"); btn.disabled = true; btn.textContent = "Guardando…";
      var desc = (document.getElementById("slDesc").value || "").trim();
      var listing = { title: title, description: desc, price_cents: cents, currency: "eur", cover_path: sellCover,
        item_type: sellType, discipline: sellDisc || null,
        stock: stock, ship_cost_cents: shipCents, ships_from: from, condition: phys ? sellCond : null };
      if (editId) {
        Cloud.updateListing(editId, listing)
          .then(function () { return !phys && content ? Cloud.updateListingContent(editId, buildSellPayload(sellTrick)) : null; })
          .then(function () { toast("Cambios guardados"); location.hash = "#/mercado/" + editId; })
          .catch(function () { btn.disabled = false; btn.textContent = "Guardar cambios"; toast("No se pudo guardar"); });
      } else {
        Cloud.createListing(listing, phys ? null : buildSellPayload(sellTrick)).then(function (l) {
          return Cloud.createPost({ kind: "listing", body: listing.description, listing_id: l.id, media: [] });
        }).then(function () { burstSparks(btn); toast("¡Publicado en el mercado!"); location.hash = "#/mercado"; })
          .catch(function () { btn.disabled = false; btn.textContent = "Publicar en el mercado"; toast("No se pudo publicar"); });
      }
    });
  }
  function buildSellPayload(t) {
    return { title: t.title, category: t.category || "", difficulty: t.difficulty || "", meta: t.meta || {}, notes: t.notes || "", tags: t.tags || [],
      media: (t.media || []).filter(function (m) { return m.embed; }).map(function (m) { return { provider: m.provider, embed: m.embed, url: m.url, title: m.title, thumb: m.thumb, chapters: m.chapters || [], transcript: m.transcript || "" }; }) };
  }
  function addDeliveredTrick(payload) {
    var t = { id: uid(), title: payload.title || "Truco", category: payload.category || "", difficulty: payload.difficulty || "medio", status: "poraprender",
      notes: payload.notes || "", tags: payload.tags || [], meta: payload.meta || {}, favorite: false,
      media: (payload.media || []).filter(function (m) { return m.embed; }).map(function (m) { return { provider: m.provider || "youtube", embed: m.embed, url: m.url, title: m.title, thumb: m.thumb, chapters: m.chapters, transcript: m.transcript }; }),
      photos: [], createdAt: Date.now(), updatedAt: Date.now() };
    state.tricks.unshift(t); save(); syncTrick(t); return t;
  }
  function startFeedRealtime() {
    if (!cloudReady() || !logged() || !socialEnabled || !Cloud.subscribeFeed) return;
    stopFeedRealtime();
    feedCh = Cloud.subscribeFeed(function () { var h = location.hash || ""; if (h === "#/comunidad" || h === "#/mercado") { if (feedTimer) return; feedTimer = setTimeout(function () { feedTimer = null; route(); }, 600); } });
    if (myProfile && myProfile.user_id && Cloud.subscribeNotifications) {
      notifCh = Cloud.subscribeNotifications(myProfile.user_id, function (kind) { if (kind === "message") refreshMsgBadge(); else refreshNotifBadge(); });
    }
  }
  var feedTimer = null;
  function stopFeedRealtime() { if (feedCh) { Cloud.unsubscribeRealtime(feedCh); feedCh = null; } if (notifCh) { Cloud.unsubscribeRealtime(notifCh); notifCh = null; } }

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
      '<div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/incluidos\'">' + icon("back") + '</button><h1>Lector Mental</h1></div>' +
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
  var lectorSwipe = null, lectorIv = null;
  function armSwipeToLoad() {
    if (lectorSwipe) { document.removeEventListener("touchstart", lectorSwipe.ts); document.removeEventListener("touchend", lectorSwipe.te); document.removeEventListener("mousedown", lectorSwipe.ts); document.removeEventListener("mouseup", lectorSwipe.te); }
    var startY = null, top = false;
    function ts(e) { var y = e.touches ? e.touches[0].clientY : e.clientY; top = y < 60; startY = y; }
    function te(e) { if ((location.hash || "") !== "#/lector") return; if (!top || startY == null) return; var y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY; if (y - startY > 55) openQS(); startY = null; top = false; }
    lectorSwipe = { ts: ts, te: te };
    document.addEventListener("touchstart", ts, { passive: true }); document.addEventListener("touchend", te);
    document.addEventListener("mousedown", ts); document.addEventListener("mouseup", te);
  }
  function teardownLector() {
    if (lectorSwipe) { document.removeEventListener("touchstart", lectorSwipe.ts); document.removeEventListener("touchend", lectorSwipe.te); document.removeEventListener("mousedown", lectorSwipe.ts); document.removeEventListener("mouseup", lectorSwipe.te); lectorSwipe = null; }
    if (lectorIv) { clearInterval(lectorIv); lectorIv = null; }
    var q = document.getElementById("qs"); if (q) q.remove();
  }
  function buildQuickSet() {
    var old = document.getElementById("qs"); if (old) old.remove();
    var rows = SUITS.map(function (s) {
      var red = s.sym === "♥" || s.sym === "♦";
      var btns = VALUES.map(function (v) { return '<button class="cellbtn ' + (red ? "red" : "") + '" data-suit="' + s.sym + '" data-val="' + v + '">' + v + "</button>"; }).join("");
      return '<div class="suitrow"><div class="slabel"' + (red ? ' style="color:var(--danger)"' : "") + ">" + s.sym + '</div><div class="suits">' + btns + "</div></div>";
    }).join("");
    var qs = el('<div class="qs" id="qs"><div class="sec-label">Carga secreta · desliza arriba para cerrar</div>' + rows +
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
      '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/incluidos\'">' + icon("back") + '</button><h1>Lector Mental</h1></div>' +
      '<div class="scanwrap" style="min-height:52vh"><div class="orb ' + (loaded.type ? "armed" : "") + '"></div>' +
      '<div class="prompt">Leyendo tu mente…</div><div class="progress"><i id="bar"></i></div><div class="scanstatus" id="st"></div></div></div>';
    var bar = document.getElementById("bar"), st = document.getElementById("st");
    var msgs = ["Sincronizando pulso…", "Detectando la imagen mental…", "Enfocando el símbolo…", "Revelando…"], p = 0;
    if (lectorIv) clearInterval(lectorIv);
    lectorIv = setInterval(function () {
      if ((location.hash || "") !== "#/lector") { clearInterval(lectorIv); lectorIv = null; return; }
      p += 3 + rnd(4); if (p > 100) p = 100; if (bar) bar.style.width = p + "%";
      if (st) st.textContent = msgs[Math.min(msgs.length - 1, Math.floor(p / 26))];
      if (p >= 100) { clearInterval(lectorIv); lectorIv = null; setTimeout(function () { if ((location.hash || "") === "#/lector") showResult(result); }, 300); }
    }, 120);
  }
  function showResult(result) {
    var body;
    if (result.kind === "card") {
      var c = result.card, red = c.suit === "♥" || c.suit === "♦";
      body = '<div class="cardface ' + (red ? "red" : "") + '"><div class="corner tl">' + c.val + "<br>" + c.suit + '</div><div class="center">' + c.suit + '</div><div class="corner br">' + c.val + "<br>" + c.suit + "</div></div>" +
        '<div class="lbl" style="text-align:center;margin-top:18px;color:var(--ink-soft)">Tu carta era el <b>' + c.val + " de " + suitName(c.suit) + "</b>.</div>";
    } else { body = '<div class="textreveal">' + esc(result.text) + "</div>"; }
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/incluidos\'">' + icon("back") + '</button><h1>Lector Mental</h1></div><div class="panel">' + body +
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
      '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/incluidos\'">' + icon("back") + '</button><h1>Método</h1></div>' +
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
      (logged() ? '<div class="setrow" id="sharesRow"><span class="si">' + icon("share") + '</span><div class="st"><div class="t">Enlaces compartidos</div><div class="d">Revisa y revoca lo que has compartido</div></div><span class="go">' + icon("chev") + "</span></div>" : "") +
      (logged() && myProfile ? '<div class="setrow" id="invRow"><span class="si">' + icon("people") + '</span><div class="st"><div class="t">Invitaciones</div><div class="d">Invita a otros magos al círculo privado</div></div><span class="go">' + icon("chev") + "</span></div>" : "") +
      '<div class="sec-label">Progreso</div>' +
      '<div class="setrow" id="statsRow"><span class="si">' + icon("chart") + '</span><div class="st"><div class="t">Estadísticas</div><div class="d">Tu repertorio, aprendizaje y bolos en números</div></div><span class="go">' + icon("chev") + "</span></div>" +
      (cloudReady()
        ? '<div class="sec-label">Notificaciones</div>' +
          '<div class="setrow"><span class="si">' + icon("bell") + '</span><div class="st"><div class="t">Recordatorios de práctica</div><div class="d" id="pushDesc">' +
          (logged() ? "Un aviso diario cuando tengas trucos para repasar" : "Inicia sesión para activarlos") + "</div></div></div>" +
          (logged() ? '<button class="btn ghost" id="pushToggle">Comprobando…</button>' +
            '<div class="setrow" id="hourRow" style="display:none"><span class="si">' + icon("clock") + '</span><div class="st"><div class="t">Hora del aviso</div><div class="d">Cada día a esta hora, si tienes repasos</div></div><select id="hourSel" class="hoursel"></select></div>' : "")
        : "") +
      (cloudReady() && logged() ? '<div class="sec-label">Comunidad</div>' +
        '<div class="toggle-row" id="comToggle"><div><b>Red y mercado de magos</b><p class="hint">' + (socialEnabled ? "Activada · feed, perfiles y mercado" : "Desactivada · app 100% privada") + '</p></div><span class="switch ' + (socialEnabled ? "on" : "") + '" id="comSw"></span></div>' : "") +
      '<div class="setrow" id="incRow"><span class="si">' + icon("wand") + '</span><div class="st"><div class="t">Trucos incluidos</div><div class="d">Efectos listos para actuar</div></div><span class="go">' + icon("chev") + "</span></div>" +
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
      '<p class="subtitle" style="text-align:center;margin-top:24px">App del Mago · tus datos se guardan solo en este dispositivo.</p>' +
      "</div>";

    var acct = document.getElementById("acctRow");
    if (acct) acct.addEventListener("click", function () { location.hash = "#/cuenta"; });
    var sr = document.getElementById("statsRow"); if (sr) sr.addEventListener("click", function () { location.hash = "#/stats"; });
    var shr = document.getElementById("sharesRow"); if (shr) shr.addEventListener("click", function () { location.hash = "#/enlaces"; });
    var invR = document.getElementById("invRow"); if (invR) invR.addEventListener("click", function () { location.hash = "#/invitaciones"; });
    if (document.getElementById("pushToggle")) refreshPushToggle();
    var incR = document.getElementById("incRow"); if (incR) incR.addEventListener("click", function () { location.hash = "#/incluidos"; });
    var comT = document.getElementById("comToggle"); if (comT) comT.addEventListener("click", function () {
      var next = !socialEnabled; socialEnabled = next; try { localStorage.setItem("magic_social", next ? "1" : "0"); } catch (e) {}
      Cloud.upsertProfile({ social_enabled: next }).then(function (p) { myProfile = p; }).catch(function () {});
      if (next) startFeedRealtime(); else stopFeedRealtime();
      toast(next ? "Comunidad activada" : "Comunidad desactivada");
      renderSettings();
    });
    view.querySelectorAll("#themeSeg button").forEach(function (b) {
      b.addEventListener("click", function (ev) {
        var v = b.getAttribute("data-v");
        if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
          var root = document.documentElement;
          root.style.setProperty("--vtx", ev.clientX + "px"); root.style.setProperty("--vty", ev.clientY + "px");
          root.classList.add("vt-theme");
          try {
            var vt = document.startViewTransition(function () { setTheme(v); renderSettings(); });
            vt.finished.finally(function () { root.classList.remove("vt-theme"); });
          } catch (e) { root.classList.remove("vt-theme"); setTheme(v); renderSettings(); }
        } else { setTheme(v); renderSettings(); }
      });
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
      if (confirm("¿Seguro? Se borrarán TODOS tus trucos de este dispositivo.")) { state = { version: 1, tricks: [], categories: DEFAULT_CATS.slice(), routines: [], gigs: [] }; save(); toast("Biblioteca borrada"); location.hash = "#/"; }
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
        state = { version: 1, tricks: data.tricks, categories: (data.categories && data.categories.length) ? data.categories : DEFAULT_CATS.slice(), routines: Array.isArray(data.routines) ? data.routines : [], gigs: Array.isArray(data.gigs) ? data.gigs : [] };
        save(); toast("Biblioteca importada"); location.hash = "#/";
      } catch (err) { toast("Archivo no válido"); }
    };
    r.readAsText(file);
  }

  /* ============================== CUENTA ============================= */
  var authMode = "login";     // 'login' | 'signup'
  var pendingEmail = null;    // email a confirmar tras registro
  function getPendingInvite() { try { return localStorage.getItem("magic_invite") || ""; } catch (e) { return ""; } }
  function setPendingInvite(v) { try { if (v) localStorage.setItem("magic_invite", v); else localStorage.removeItem("magic_invite"); } catch (e) {} }

  function renderAccount() {
    clearTabbar();
    if (!cloudReady()) {
      view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/ajustes\'">' + icon("back") + '</button><h1>Cuenta</h1></div>' +
        '<div class="panel"><p>La sincronización en la nube no está disponible ahora mismo (sin conexión). Tu biblioteca sigue guardándose en este dispositivo.</p></div></div>';
      return;
    }
    if (logged()) return renderAccountLogged();
    if (pendingEmail) return renderConfirm();
    return renderAuthForm();
  }

  function renderAccountLogged() {
    view.innerHTML =
      '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/ajustes\'">' + icon("back") + '</button><h1>Cuenta</h1></div>' +
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
      '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/ajustes\'">' + icon("back") + '</button><h1>' + (isSignup ? "Crear cuenta" : "Iniciar sesión") + "</h1></div>" +
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
      '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/cuenta\'">' + icon("back") + '</button><h1>Confirma tu email</h1></div>' +
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

  // Gestión de invitaciones: generar códigos y ver su estado.
  function renderInvites() {
    clearTabbar();
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" aria-label="Volver" onclick="location.hash=\'#/ajustes\'">' + icon("back") + '</button><h1>Invitaciones</h1></div>' +
      '<p class="subtitle">App del Mago es un círculo cerrado. Cada mago tiene un número limitado de invitaciones: elige bien a quién dejas entrar.</p>' +
      '<button class="btn" id="invNew">' + icon("plus", "i-sm") + ' Crear invitación</button>' +
      '<div id="invBody">' + skelRows(3) + "</div></div>";
    var load = function () {
      Cloud.myInvites().then(function (rows) {
        var b = document.getElementById("invBody"); if (!b) return;
        var left = Math.max(0, 8 - rows.length);
        b.innerHTML = '<p class="hint" style="margin:4px 0 12px">Te quedan <b>' + left + '</b> de 8 invitaciones.</p>' +
          (rows.length ? '<div class="inv-list">' + rows.map(function (i) {
            return '<div class="inv-row ' + (i.redeemed ? "used" : "") + '"><div class="inv-code">' + esc(i.code) + "</div>" +
              '<div class="inv-st">' + (i.redeemed ? icon("check", "i-sm") + " Aceptada" + (i.invitee_name ? " · " + esc(i.invitee_name) : "") : "Pendiente") + "</div>" +
              (i.redeemed ? "" : '<button class="btn small ghost" data-copy="' + esc(i.code) + '">Compartir</button>') + "</div>";
          }).join("") + "</div>" : '<p class="hint">Aún no has creado ninguna invitación.</p>');
        b.querySelectorAll("[data-copy]").forEach(function (btn) { btn.addEventListener("click", function () { shareInvite(btn.getAttribute("data-copy")); }); });
      }).catch(function () { var b = document.getElementById("invBody"); if (b) b.innerHTML = '<p class="hint">No se pudieron cargar las invitaciones.</p>'; });
    };
    load();
    document.getElementById("invNew").addEventListener("click", function () {
      var btn = document.getElementById("invNew"); btn.disabled = true; btn.textContent = "Generando…";
      Cloud.createInvite().then(function (code) { btn.disabled = false; btn.innerHTML = icon("plus", "i-sm") + " Crear invitación"; toast("Invitación creada: " + code); load(); })
        .catch(function (e) { btn.disabled = false; btn.innerHTML = icon("plus", "i-sm") + " Crear invitación"; toast(/quota/i.test(e && e.message || "") ? "Has agotado tus invitaciones" : "No se pudo crear"); });
    });
  }
  function shareInvite(code) {
    var url = location.origin + location.pathname;
    var text = "Te invito a App del Mago, el círculo privado de magos. Usa mi código de invitación: " + code + "\n" + url;
    if (navigator.share) { navigator.share({ title: "App del Mago", text: text }).catch(function () {}); return; }
    if (navigator.clipboard) { navigator.clipboard.writeText(text).then(function () { toast("Invitación copiada"); }).catch(function () { toast(code); }); }
    else toast(code);
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
    return '<div class="screen lock" id="lockScreen"><div class="lk">' + mark("", true) + "</div>" +
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
      '<div class="gate-hero"><div class="logo">' + mark("", true) + "</div>" +
      '<h1 class="wm">App del <span>Mago</span></h1>' +
      '<p class="tagline">El círculo privado de los magos</p>' +
      '<p><span class="gate-badge">' + icon("lock", "i-sm") + " Solo por invitación</span></p></div>" +
      '<div class="gate-card">' +
      '<div class="gate-tabs"><button class="' + (!isSignup ? "on" : "") + '" id="tabLogin">Entrar</button>' +
      '<button class="' + (isSignup ? "on" : "") + '" id="tabSignup">Tengo invitación</button></div>' +
      (isSignup ? '<div class="field"><label>Código de invitación</label><input id="aInvite" autocapitalize="characters" autocomplete="off" placeholder="MAGO-XXXXX" value="' + esc(getPendingInvite()) + '"></div>' : "") +
      '<div class="field"><label>Email</label><input id="aEmail" type="email" inputmode="email" autocomplete="email" placeholder="tu@email.com"></div>' +
      '<div class="field"><label>Contraseña</label><input id="aPass" type="password" autocomplete="' + (isSignup ? "new-password" : "current-password") + '" placeholder="mínimo 6 caracteres"></div>' +
      '<button class="btn" id="aGo">' + (isSignup ? "Solicitar mi acceso" : "Entrar") + "</button>" +
      "</div>" +
      '<p class="gate-foot">' + (isSignup ? "App del Mago es un espacio cerrado. Necesitas el código de un mago que ya sea miembro." : "¿Sin cuenta? Necesitas una invitación de un miembro.") + "</p>" +
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
      var code = (document.getElementById("aInvite").value || "").trim().toUpperCase();
      if (!code) { toast("Escribe tu código de invitación"); return done("Solicitar mi acceso"); }
      Cloud.checkInvite(code).then(function (valid) {
        if (!valid) { toast("Esa invitación no es válida o ya se ha usado"); return done("Solicitar mi acceso"); }
        setPendingInvite(code);
        return Cloud.signUp(email, pass).then(function (r) {
          if (r.error) { toast(traduce(r.error.message)); return done("Solicitar mi acceso"); }
          if (r.data && r.data.session) { session = r.data.session.user; toast("¡Cuenta creada!"); return loadProfile().then(function () { startRealtime(); startFeedRealtime(); syncOnLogin(true); location.hash = "#/"; route(); }); }
          pendingEmail = email; renderGate();
        });
      }).catch(function () { toast("Error de conexión"); done("Solicitar mi acceso"); });
    } else {
      Cloud.signIn(email, pass).then(function (r) {
        if (r.error) { toast(traduce(r.error.message)); return done("Entrar"); }
        session = r.data.user; toast("¡Hola de nuevo!"); loadProfile().then(function () { startRealtime(); startFeedRealtime(); syncOnLogin(true); location.hash = "#/"; route(); });
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
      var h0 = location.hash || "";
      var qs = document.getElementById("qs");
      if (qs && h0 !== "#/lector") qs.classList.remove("open");
      // Limpieza al salir de pantallas con estado vivo (fugas de listeners/observers/vídeo)
      if (h0.indexOf("#/lector") !== 0) teardownLector();
      if (h0 !== "#/clips" && h0.indexOf("#/clips/") !== 0) teardownClips();
      teardownStories();
      // Enlace compartido: contenido público de solo lectura; salta candado y login
      if (h0.indexOf("#/s/") === 0) return renderShared(h0.slice(4));
      if (chatCh && h0.indexOf("#/chat/") !== 0) { Cloud.unsubscribeRealtime(chatCh); chatCh = null; }
      // Bloqueo con PIN: protege todo hasta desbloquear
      if (hasPin() && !unlocked) return renderLock();
      // Puerta de entrada: si hay nube y no hay sesión, obligamos a iniciar sesión
      if (cloudReady() && !logged()) return renderGate();
      // Onboarding la primera vez (perfil sin completar)
      if (logged() && cloudReady() && needsOnboarding && (location.hash || "").indexOf("#/s/") !== 0) return renderOnboarding();
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
      if (h === "#/practica") return renderPractice();
      if (h === "#/stats") return renderStats();
      if (h === "#/enlaces") return renderShares();
      if (h === "#/invitaciones") return logged() ? renderInvites() : renderLibrary();
      if (h === "#/comunidad") return socialEnabled ? renderCommunity("discover") : renderLibrary();
      if (h === "#/siguiendo") return socialEnabled ? renderCommunity("following") : renderLibrary();
      if (h === "#/mercado") return socialEnabled ? renderCommunity("market") : renderLibrary();
      if (h === "#/avisos") return socialEnabled ? renderNotifications() : renderLibrary();
      if (h === "#/descubrir") return socialEnabled ? renderDiscover() : renderLibrary();
      if (h === "#/reto") return socialEnabled ? renderReto() : renderLibrary();
      if (h === "#/top") return socialEnabled ? renderLeaderboard() : renderLibrary();
      if (h === "#/guardados") return socialEnabled ? renderSaved() : renderLibrary();
      if (h === "#/mensajes") return socialEnabled ? renderMessages() : renderLibrary();
      if (h.indexOf("#/chat/") === 0) return socialEnabled ? renderChat(h.slice(7)) : renderLibrary();
      if (h === "#/publicar") return socialEnabled ? renderCompose() : renderLibrary();
      if (h === "#/clips") return socialEnabled ? renderClips() : renderLibrary();
      if (h === "#/clip-nuevo") return socialEnabled ? renderClipCreate() : renderLibrary();
      if (h.indexOf("#/clips/") === 0) return socialEnabled ? renderClips(h.slice(8)) : renderLibrary();
      if (h === "#/vender") return socialEnabled ? renderSellForm() : renderLibrary();
      if (h.indexOf("#/vender/") === 0) return socialEnabled ? renderSellForm(h.slice(9)) : renderLibrary();
      if (h.indexOf("#/tag/") === 0) return socialEnabled ? renderTagFeed(decodeURIComponent(h.slice(6))) : renderLibrary();
      if (h.indexOf("#/seguidores/") === 0) return socialEnabled ? renderMagicianList(h.slice(13), "followers") : renderLibrary();
      if (h.indexOf("#/seguidos/") === 0) return socialEnabled ? renderMagicianList(h.slice(11), "following") : renderLibrary();
      if (h.indexOf("#/post/") === 0) return socialEnabled ? renderPostDetail(h.slice(7)) : renderLibrary();
      if (h.indexOf("#/mago/") === 0) return socialEnabled ? renderProfile(h.slice(7)) : renderLibrary();
      if (h.indexOf("#/mercado/") === 0) return socialEnabled ? renderListing(h.slice(10)) : renderLibrary();
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
      view.innerHTML = '<div class="screen splash"><div class="logo">' + mark("", true) + '</div><div class="wm">App del Mago</div><div class="spin"></div></div>';
      Cloud.currentUser().then(function (u) {
        session = u || null;
        loadProfile().then(function () {
          route();
          if (session) { syncOnLogin(true); startRealtime(); startFeedRealtime(); }
        });
        Cloud.onChange(function (u2) {
          var was = logged(); session = u2 || null;
          if (logged()) {
            startRealtime();
            if (!myProfile) { loadProfile().then(function () { startFeedRealtime(); if (!was) syncOnLogin(true); route(); }); }
            else if (!was) { startFeedRealtime(); syncOnLogin(true); route(); }
          } else if (was) { stopRealtime(); stopFeedRealtime(); myProfile = null; needsOnboarding = false; route(); }
        });
      }).catch(function () { session = null; route(); });
    } else {
      route(); // sin nube (modo local/preview)
    }
  }

  applyTheme();
  // Accesibilidad: asocia labels con sus campos, pone nombre accesible a los
  // inputs por su placeholder y título a los iframes. Se ejecuta sobre cada
  // render (incluido el contenido cargado de forma asíncrona).
  var a11yN = 0;
  function a11yPass() {
    try {
      document.querySelectorAll(".field > label:not([for]) + input, .field > label:not([for]) + textarea, .field > label:not([for]) + select").forEach(function (c) {
        var l = c.previousElementSibling; if (!l || l.tagName !== "LABEL") return;
        if (!c.id) c.id = "f_a11y_" + (++a11yN);
        l.setAttribute("for", c.id);
      });
      document.querySelectorAll("input[placeholder]:not([aria-label]):not([id^=f_a11y]), textarea[placeholder]:not([aria-label])").forEach(function (c) {
        if (!c.labels || !c.labels.length) c.setAttribute("aria-label", c.getAttribute("placeholder"));
      });
      document.querySelectorAll("iframe:not([title])").forEach(function (f) { f.setAttribute("title", "Vídeo"); });
    } catch (e) {}
  }
  var a11yScheduled = false;
  function scheduleA11y() { if (a11yScheduled) return; a11yScheduled = true; setTimeout(function () { a11yScheduled = false; a11yPass(); }, 60); }
  try { new MutationObserver(scheduleA11y).observe(view, { childList: true, subtree: true }); } catch (e) {}
  // Transiciones suaves entre pantallas (View Transitions, mejora progresiva)
  window.addEventListener("hashchange", function () {
    if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      try { document.startViewTransition(function () { route(); }); return; } catch (e) {}
    }
    route();
  });
  // Ponerse al día al volver a la app o recuperar conexión (por si el realtime
  // perdió algún cambio mientras estaba en segundo plano).
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && logged() && cloudReady()) { syncOnLogin(true); startRealtime(); }
  });
  window.addEventListener("online", function () { if (logged() && cloudReady()) { syncOnLogin(true); startRealtime(); } });
  if (hasPin() && !unlocked) renderLock();
  else boot();
  initAmbient();
  initFoil();
})();
