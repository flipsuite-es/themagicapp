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

  /* ------------------------------ estado ------------------------------ */
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { version: 1, tricks: [], categories: DEFAULT_CATS.slice() };
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { toast("No se pudo guardar"); } }
  var state = load();
  function getTrick(id) { return state.tricks.filter(function (t) { return t.id === id; })[0]; }

  /* ----------------------- sesión / sincronización -------------------- */
  var session = null;                 // usuario actual (o null si offline/local)
  function logged() { return !!session; }
  function cloudReady() { return window.Cloud && Cloud.available(); }

  function toRow(t) {
    return { id: t.id, title: t.title, category: t.category, difficulty: t.difficulty, status: t.status, notes: t.notes || "", tags: t.tags || [], media: t.media || [], favorite: !!t.favorite };
  }
  function rowToLocal(r) {
    return { id: r.id, title: r.title, category: r.category, difficulty: r.difficulty, status: r.status, notes: r.notes || "", tags: r.tags || [], media: r.media || [], favorite: !!r.favorite, createdAt: Date.parse(r.created_at) || Date.now(), updatedAt: Date.parse(r.updated_at) || Date.now(), remote: true };
  }
  // Escritura a la nube (best-effort; si falla, queda local y se resube al sincronizar)
  function syncTrick(t) { if (logged() && cloudReady()) Cloud.upsertTrick(toRow(t)).then(function () { t.remote = true; }).catch(function () {}); }
  function syncDelete(id, wasRemote) { if (logged() && cloudReady() && wasRemote) Cloud.deleteTrick(id).catch(function () {}); }

  function syncOnLogin() {
    if (!logged() || !cloudReady()) return Promise.resolve();
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
    return chain.then(function () { return Cloud.listTricks(); }).then(function (rows) {
      var byId = {};
      state.tricks.forEach(function (t) { if (!t.remote) byId[t.id] = t; }); // conserva pendientes
      rows.forEach(function (r) { byId[r.id] = rowToLocal(r); });
      state.tricks = Object.keys(byId).map(function (k) { return byId[k]; });
      save();
      if (isMain()) route();
      toast("Biblioteca sincronizada");
    }).catch(function () { toast("No se pudo sincronizar"); });
  }
  function isMain() { var h = location.hash || "#/"; return h === "#/" || h === "" || h === "#/ajustes" || h === "#/cuenta"; }

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
      { h: "#/", ic: "📚", t: "Biblioteca", k: "lib" },
      { h: "#/incluidos", ic: "✨", t: "Incluidos", k: "inc" },
      { h: "#/ajustes", ic: "⚙️", t: "Ajustes", k: "set" }
    ];
    return '<nav class="tabbar">' + tabs.map(function (x) {
      return '<a href="' + x.h + '" class="' + (active === x.k ? "on" : "") + '"><span class="ti">' + x.ic + "</span>" + x.t + "</a>";
    }).join("") + "</nav>";
  }
  function mountTabbar(active) {
    var old = document.getElementById("tabbarEl"); if (old) old.remove();
    var n = el(tabbar(active)); n.id = "tabbarEl"; document.body.appendChild(n);
  }
  function clearTabbar() { var old = document.getElementById("tabbarEl"); if (old) old.remove(); var f = document.getElementById("fabEl"); if (f) f.remove(); }
  function mountFab() {
    var old = document.getElementById("fabEl"); if (old) old.remove();
    var f = el('<button class="fab" id="fabEl" title="Nuevo truco">+</button>');
    f.addEventListener("click", function () { location.hash = "#/nuevo"; });
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
        var hay = (t.title + " " + (t.notes || "") + " " + (t.tags || []).join(" ") + " " + (t.category || "")).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });

    var body;
    if (state.tricks.length === 0) {
      body = '<div class="empty"><div class="big">🎩</div><h3>Tu biblioteca está vacía</h3>' +
        "<p>Guarda aquí cada truco que aprendas: notas, vídeos y tu progreso.<br>Empieza creando el primero.</p>" +
        '<button class="btn" onclick="location.hash=\'#/nuevo\'">Crear mi primer truco</button></div>';
    } else if (filtered.length === 0) {
      body = '<div class="empty"><div class="big">🔍</div><h3>Sin resultados</h3><p>Prueba a cambiar los filtros o la búsqueda.</p></div>';
    } else {
      body = '<div class="count">' + filtered.length + (filtered.length === 1 ? " truco" : " trucos") + "</div>" +
        '<div class="cards">' + filtered.map(trickCard).join("") + "</div>";
    }

    view.innerHTML =
      '<div class="screen">' +
      '<div class="appbar"><span class="logo">🎩</span><span class="wm">The Magic <span>App</span></span>' +
      '<span class="spacer"></span>' +
      '<button class="iconbtn" id="favToggle" title="Favoritos">' + (filter.fav ? "★" : "☆") + "</button></div>" +
      '<div class="search"><span class="mag">🔍</span><input id="q" placeholder="Buscar en mi biblioteca…" value="' + esc(filter.q) + '"></div>' +
      '<div class="chips">' + catChips + "</div>" +
      '<div class="chips">' + statusChips + "</div>" +
      body +
      "</div>";

    var q = document.getElementById("q");
    q.addEventListener("input", function () { filter.q = q.value; refreshCards(); });
    document.getElementById("favToggle").addEventListener("click", function () { filter.fav = !filter.fav; renderLibrary(); });
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
      if (q) { var hay = (t.title + " " + (t.notes || "") + " " + (t.tags || []).join(" ")).toLowerCase(); if (hay.indexOf(q) < 0) return false; }
      return true;
    });
    var holder = view.querySelector(".cards"); var countEl = view.querySelector(".count");
    if (!holder) { renderLibrary(); return; }
    if (filtered.length === 0) {
      holder.className = "";
      holder.innerHTML = '<div class="empty"><div class="big">🔍</div><h3>Sin resultados</h3><p>Prueba a cambiar los filtros o la búsqueda.</p></div>';
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
      ? '<img src="' + esc(thumb) + '" loading="lazy" alt="">' + '<span class="play">▶</span>'
      : '<span class="ph">' + (vid ? "▶" : "🃏") + "</span>";
    return (
      '<div class="card" data-id="' + t.id + '">' +
      '<div class="thumb">' + thumbHtml + (t.favorite ? '<span class="fav">★</span>' : "") + "</div>" +
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
      if (m.provider === "upload" && m.path) return '<div class="player" id="upl' + i + '" data-path="' + esc(m.path) + '"></div>';
      if (m.embed) return '<div class="player"><iframe src="' + esc(m.embed) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>';
      return '<a class="linkcard" href="' + esc(m.url) + '" target="_blank" rel="noopener"><span class="ic">🔗</span><span class="n">' + esc(m.title || m.url) + '</span><span class="go">↗</span></a>';
    }).join("");

    var tags = (t.tags || []).length ? '<div class="sec-label">Etiquetas</div><div class="tagchips">' + t.tags.map(function (x) { return '<span class="tagchip">#' + esc(x) + "</span>"; }).join("") + "</div>" : "";

    view.innerHTML =
      '<div class="screen">' +
      '<div class="pagehead"><button class="back" onclick="location.hash=\'#/\'">‹</button><h1>Truco</h1>' +
      '<span style="flex:1"></span>' +
      '<button class="iconbtn" id="favBtn">' + (t.favorite ? "★" : "☆") + "</button>" +
      '<button class="iconbtn" id="editBtn">✎</button></div>' +
      '<h1 class="title">' + esc(t.title) + "</h1>" +
      '<div class="detail-badges">' +
      '<span class="pill df">' + (DIFF[t.difficulty] || "—") + "</span>" +
      '<span class="pill st-' + (t.status || "poraprender") + '">' + (STATUS[t.status] || "") + "</span>" +
      '<span class="tagchip">' + esc(t.category || "Sin categoría") + "</span></div>" +
      (media ? '<div class="sec-label">Vídeos</div>' + media : "") +
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
  }

  /* ========================= CREAR / EDITAR ========================== */
  var draftMedia = [];
  function renderForm(id) {
    clearTabbar();
    var editing = !!id;
    var t = editing ? getTrick(id) : null;
    if (editing && !t) { location.hash = "#/"; return; }
    draftMedia = t ? (t.media || []).slice() : [];

    var catOptions = state.categories.map(function (c) { return '<option value="' + esc(c) + '">'; }).join("");

    view.innerHTML =
      '<div class="screen">' +
      '<div class="pagehead"><button class="back" onclick="history.back()">‹</button><h1>' + (editing ? "Editar truco" : "Nuevo truco") + "</h1></div>" +
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
      (logged() ? '<button class="btn ghost" id="upVid" type="button" style="margin-top:10px">⬆︎ Subir un vídeo propio</button><input type="file" id="fFile" accept="video/*" style="display:none">' :
        '<div class="hint" style="margin-top:8px">Inicia sesión (Ajustes → Cuenta) para <b>subir tus propios vídeos</b>.</div>') +
      '<div class="vidlist" id="vidList"></div>' +
      '<div class="hint">Se incrusta el reproductor y se intenta sacar la miniatura y el título automáticamente.</div></div>' +
      '<div class="field"><label>Notas / explicación</label><textarea id="fNotes" placeholder="El secreto, el manejo, la charla, tus recordatorios…">' + esc(t ? t.notes : "") + "</textarea></div>" +
      '<div class="field"><label>Etiquetas (separadas por comas)</label><input id="fTags" placeholder="control, empalme, doble volteo" value="' + esc(t && t.tags ? t.tags.join(", ") : "") + '"></div>' +
      '<button class="btn" id="saveBtn">' + (editing ? "Guardar cambios" : "Crear truco") + "</button>" +
      '<button class="btn ghost" onclick="history.back()">Cancelar</button>' +
      "</div>";

    paintDraftMedia();

    view.querySelectorAll("#fDiff button").forEach(function (b) { b.addEventListener("click", function () { setSeg("#fDiff", b); }); });
    view.querySelectorAll("#fStatus button").forEach(function (b) { b.addEventListener("click", function () { setSeg("#fStatus", b); }); });

    document.getElementById("addVid").addEventListener("click", addVideoFromInput);
    document.getElementById("fVid").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addVideoFromInput(); } });

    var upBtn = document.getElementById("upVid");
    if (upBtn) {
      var fileInp = document.getElementById("fFile");
      upBtn.addEventListener("click", function () { fileInp.click(); });
      fileInp.addEventListener("change", function () {
        var file = fileInp.files[0]; if (!file) return;
        if (file.size > 200 * 1024 * 1024) { toast("Vídeo demasiado grande (máx 200 MB)"); return; }
        upBtn.disabled = true; upBtn.textContent = "Subiendo… 0%";
        var item = { provider: "upload", path: null, title: file.name, thumb: null, uploading: true };
        draftMedia.push(item); paintDraftMedia();
        Cloud.uploadVideo(file).then(function (res) {
          item.path = res.path; item.uploading = false; upBtn.disabled = false; upBtn.textContent = "⬆︎ Subir un vídeo propio";
          paintDraftMedia(); toast("Vídeo subido");
        }).catch(function () {
          draftMedia = draftMedia.filter(function (m) { return m !== item; });
          upBtn.disabled = false; upBtn.textContent = "⬆︎ Subir un vídeo propio"; paintDraftMedia(); toast("No se pudo subir");
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
    // Enriquecer con metadatos (best-effort)
    fetchMeta(url).then(function (meta) {
      if (!meta) return;
      if (meta.title) item.title = meta.title;
      if (!item.thumb && meta.thumb) item.thumb = meta.thumb;
      paintDraftMedia();
    });
  }
  function paintDraftMedia() {
    var list = document.getElementById("vidList");
    if (!list) return;
    list.innerHTML = draftMedia.map(function (m, i) {
      var thumb = m.thumb ? '<img src="' + esc(m.thumb) + '" alt="">' : (m.provider === "upload" ? "📹" : m.provider === "link" ? "🔗" : "▶");
      var sub = m.uploading ? "subiendo…" : (m.provider === "upload" ? "vídeo propio" : m.provider);
      return '<div class="vidrow"><div class="vt">' + thumb + "</div>" +
        '<div class="vi"><div class="n">' + esc(m.title || m.url || "vídeo") + '</div><div class="p">' + esc(sub) + "</div></div>" +
        '<button class="x" data-i="' + i + '" type="button">×</button></div>';
    }).join("");
    list.querySelectorAll(".x").forEach(function (b) {
      b.addEventListener("click", function () { draftMedia.splice(parseInt(b.getAttribute("data-i"), 10), 1); paintDraftMedia(); });
    });
  }
  function saveForm(id) {
    var title = document.getElementById("fTitle").value.trim();
    if (!title) { toast("Ponle un título"); return; }
    var cat = document.getElementById("fCat").value.trim() || "Otros";
    if (state.categories.indexOf(cat) < 0) state.categories.push(cat);
    var tags = document.getElementById("fTags").value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    var data = {
      title: title, category: cat,
      difficulty: segValue("#fDiff") || "medio",
      status: segValue("#fStatus") || "poraprender",
      notes: document.getElementById("fNotes").value.trim(),
      tags: tags, media: draftMedia.slice(), updatedAt: Date.now()
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

  /* ========================= TRUCOS INCLUIDOS ======================== */
  function renderIncluded() {
    mountTabbar("inc"); var f = document.getElementById("fabEl"); if (f) f.remove();
    view.innerHTML =
      '<div class="screen">' +
      '<h1 class="title">Trucos incluidos</h1>' +
      '<p class="subtitle">Efectos listos para actuar, con su método explicado.</p>' +
      '<div class="hero"><h2>🧠 Lector Mental</h2><p>La app “lee la mente” del espectador en su propio teléfono y revela su carta o palabra.</p></div>' +
      '<button class="btn" onclick="location.hash=\'#/lector\'">▶ Actuar</button>' +
      '<button class="btn ghost" onclick="location.hash=\'#/lector-metodo\'">📖 Aprender el método</button>' +
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
      '<div class="pagehead"><button class="back" onclick="location.hash=\'#/incluidos\'">‹</button><h1>Lector Mental</h1></div>' +
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
      '<div class="screen"><div class="pagehead"><button class="back" onclick="location.hash=\'#/incluidos\'">‹</button><h1>Lector Mental</h1></div>' +
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
    view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" onclick="location.hash=\'#/incluidos\'">‹</button><h1>Lector Mental</h1></div><div class="panel">' + body +
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
      '<div class="screen"><div class="pagehead"><button class="back" onclick="location.hash=\'#/incluidos\'">‹</button><h1>Método</h1></div>' +
      '<div class="backstage-bar"><span class="dot"></span> Solo para tus ojos — no lo enseñes al público</div>' +
      '<div class="panel tut"><h2 style="font-family:var(--serif)">🧠 Lector Mental</h2>' +
      sec("👁 Qué ve el público", "pub", "<p>El espectador piensa una carta (o una palabra, un nombre…). Pone el dedo en la esfera de SU teléfono, la app “lee su mente” y revela justo lo que pensaba.</p>") +
      sec("🔒 El secreto", "sec", "<p>La app no adivina: <b>tú le dices en secreto qué revelar</b>. Funciona con cualquier forzaje o peek que conozcas.</p><p><b>Cargar:</b> en la pantalla de la esfera, <b>desliza hacia abajo desde el borde superior</b>. Toca la carta o escribe la palabra. La esfera se pone <b>dorada</b> = cargada. Desliza arriba para cerrar.</p>") +
      sec("🎬 Paso a paso", "", "<ol><li>Averigua la carta con tu método.</li><li>Con el móvil en tu mano, di que “calibras el sensor” y carga a la vez, sin apenas mirar.</li><li>Comprueba que la esfera está dorada.</li><li>Entrega el móvil; que ponga el dedo y pulse.</li><li>Se revela su carta exacta.</li></ol>") +
      sec("🗣 Guion", "", '<div class="script">"Este sensor mide micro-señales de tu piel. Piensa en tu carta, pon el dedo aquí… relájate…"</div>') +
      sec("⚠ Evita", "", "<ul><li>Ensaya la carga hasta hacerla sin mirar.</li><li>No entregues el móvil hasta ver la esfera dorada.</li><li>No repitas el efecto para el mismo público.</li></ul>") +
      '<button class="btn" onclick="location.hash=\'#/lector\'">▶ Practicar</button></div></div>';
  }

  /* ============================= AJUSTES ============================= */
  function renderSettings() {
    mountTabbar("set"); var f = document.getElementById("fabEl"); if (f) f.remove();
    var theme = localStorage.getItem("magic_theme") || "auto";
    view.innerHTML =
      '<div class="screen"><h1 class="title">Ajustes</h1><p class="subtitle">' + state.tricks.length + " trucos guardados · " + state.categories.length + " categorías</p>" +
      '<div class="sec-label">Cuenta</div>' +
      '<div class="setrow" id="acctRow"><span class="si">' + (logged() ? "👤" : "☁️") + '</span><div class="st"><div class="t">' +
      (logged() ? esc(session.email) : "Iniciar sesión / crear cuenta") + '</div><div class="d">' +
      (logged() ? "Sincronizado en la nube" : (cloudReady() ? "Sincroniza y sube vídeos entre dispositivos" : "Sin conexión")) + '</div></div><span class="go" style="color:var(--ink-faint);font-size:20px">›</span></div>' +
      '<div class="sec-label">Apariencia</div>' +
      '<div class="setrow"><span class="si">🎨</span><div class="st"><div class="t">Tema</div><div class="d">Claro, oscuro o según el sistema</div></div></div>' +
      '<div class="seg" id="themeSeg" style="margin-bottom:16px">' +
      [["auto", "Sistema"], ["light", "Claro"], ["dark", "Oscuro"]].map(function (x) { return '<button data-v="' + x[0] + '" class="' + (theme === x[0] ? "on" : "") + '">' + x[1] + "</button>"; }).join("") + "</div>" +
      '<div class="sec-label">Tus datos</div>' +
      '<div class="setrow"><span class="si">💾</span><div class="st"><div class="t">Copia de seguridad</div><div class="d">Exporta tu biblioteca a un archivo, o restáurala.</div></div></div>' +
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
      view.innerHTML = '<div class="screen"><div class="pagehead"><button class="back" onclick="location.hash=\'#/ajustes\'">‹</button><h1>Cuenta</h1></div>' +
        '<div class="panel"><p>La sincronización en la nube no está disponible ahora mismo (sin conexión). Tu biblioteca sigue guardándose en este dispositivo.</p></div></div>';
      return;
    }
    if (logged()) return renderAccountLogged();
    if (pendingEmail) return renderConfirm();
    return renderAuthForm();
  }

  function renderAccountLogged() {
    view.innerHTML =
      '<div class="screen"><div class="pagehead"><button class="back" onclick="location.hash=\'#/ajustes\'">‹</button><h1>Cuenta</h1></div>' +
      '<div class="setrow"><span class="si">👤</span><div class="st"><div class="t">' + esc(session.email) + '</div><div class="d">Sesión iniciada · tu biblioteca se sincroniza</div></div></div>' +
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
      '<div class="screen"><div class="pagehead"><button class="back" onclick="location.hash=\'#/ajustes\'">‹</button><h1>' + (isSignup ? "Crear cuenta" : "Iniciar sesión") + "</h1></div>" +
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
      '<div class="screen"><div class="pagehead"><button class="back" onclick="location.hash=\'#/cuenta\'">‹</button><h1>Confirma tu email</h1></div>' +
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
      var h = location.hash || "#/";
      if (h === "#/" || h === "") return renderLibrary();
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

  // Arranque: tema + primera pantalla (local, instantáneo) y luego sesión/sync
  applyTheme();
  window.addEventListener("hashchange", route);
  route();
  if (cloudReady()) {
    Cloud.currentUser().then(function (u) {
      session = u || null;
      if (session) syncOnLogin();
      else if (isMain()) route();
    });
    Cloud.onChange(function (u) { session = u || null; if (isMain()) route(); });
  }
})();
