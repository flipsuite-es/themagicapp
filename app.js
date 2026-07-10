/* ==========================================================================
   The Magic App — Lector Mental
   Un único efecto, cuidado al máximo: el motor de revelación universal.
   El mago sabe en secreto la carta/palabra (forzaje, peek, papelito…), la
   carga con un gesto invisible, y la app "lee la mente" del espectador en
   SU teléfono. Sin dependencias, offline, todo en el cliente.
   ========================================================================== */
(function () {
  "use strict";

  var view = document.getElementById("view");

  /* ---------------------------------------------------------------------
     Utilidades
     --------------------------------------------------------------------- */
  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }
  function rnd(n) { return Math.floor(Math.random() * n); }
  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) { t = el('<div class="toast" id="toast"></div>'); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1800);
  }
  function topbar(title, backHash) {
    return (
      '<div class="topbar">' +
      '<button class="back" onclick="location.hash=\'' + (backHash || "#/") + '\'">‹</button>' +
      '<div class="title">' + title + "</div></div>"
    );
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  var SUITS = [
    { sym: "♠", name: "Picas", red: false },
    { sym: "♥", name: "Corazones", red: true },
    { sym: "♦", name: "Diamantes", red: true },
    { sym: "♣", name: "Tréboles", red: false }
  ];
  function suitName(sym) {
    var m = { "♠": "Picas", "♥": "Corazones", "♦": "Diamantes", "♣": "Tréboles" };
    return m[sym] || sym;
  }

  // Estado de carga secreta (efímero, no persiste entre recargas)
  var loaded = { type: null, card: null, text: null };

  /* =====================================================================
     HOME
     ===================================================================== */
  function renderHome() {
    view.innerHTML =
      '<div class="screen">' +
      '<div class="brand">' +
      '<div class="mark">🔮</div>' +
      '<h1 id="brandTitle">The Magic App</h1>' +
      '<p>Lectura de mente — en su propio teléfono</p>' +
      "</div>" +
      '<div id="installSlot"></div>' +
      '<div class="grid">' +
      '<div class="trick" onclick="location.hash=\'#/lector\'">' +
      '<div class="ico">🧠</div>' +
      '<div class="meta"><h3>Lector Mental</h3>' +
      "<p>Su carta o palabra aparece en su pantalla como por arte de magia.</p>" +
      '<span class="tag">Empezar</span></div>' +
      '<div class="chev">›</div>' +
      "</div>" +
      "</div>" +
      '<div class="foot"><span id="secretDoor">✦ Concentra tu energía ✦</span></div>' +
      "</div>";
    armSecretDoor();
    maybeShowInstall();
  }

  /* ---------------------------------------------------------------------
     Aviso "instalar como app" (solo si aún no está instalada como PWA)
     --------------------------------------------------------------------- */
  var deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
  });
  function isStandalone() {
    return (
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true
    );
  }
  function isIOS() { return /iphone|ipad|ipod/i.test(window.navigator.userAgent); }
  function maybeShowInstall() {
    var slot = document.getElementById("installSlot");
    if (!slot || isStandalone()) return;
    try { if (localStorage.getItem("magic_install_hidden") === "1") return; } catch (e) {}
    var banner = el('<div class="install"></div>');
    if (deferredPrompt) {
      banner.innerHTML =
        '<div class="ic">📲</div>' +
        '<div class="tx"><b>Instálala como app</b><br>Icono en tu inicio, pantalla completa y sin conexión.</div>' +
        '<button id="instGo">Instalar</button><button class="close" id="instX">×</button>';
      banner.querySelector("#instGo").addEventListener("click", function () {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(function () { deferredPrompt = null; banner.remove(); });
      });
    } else if (isIOS()) {
      banner.innerHTML =
        '<div class="ic">📲</div>' +
        '<div class="tx"><b>Tenla como app en tu iPhone</b><br>Pulsa <b>Compartir</b> ' +
        '<span style="font-size:15px">⬆︎</span> y luego <b>“Añadir a pantalla de inicio”</b>.</div>' +
        '<button class="close" id="instX">×</button>';
    } else { return; }
    banner.querySelector("#instX").addEventListener("click", function () {
      try { localStorage.setItem("magic_install_hidden", "1"); } catch (e) {}
      banner.remove();
    });
    slot.appendChild(banner);
  }

  // Puerta secreta al Modo Mago: mantener pulsado el título 1.2s
  function armSecretDoor() {
    ["brandTitle", "secretDoor"].forEach(function (id) {
      var node = document.getElementById(id);
      if (!node) return;
      var timer = null;
      var start = function () { timer = setTimeout(function () { location.hash = "#/mago"; }, 1200); };
      var cancel = function () { clearTimeout(timer); };
      node.addEventListener("touchstart", start, { passive: true });
      node.addEventListener("touchend", cancel);
      node.addEventListener("touchmove", cancel);
      node.addEventListener("mousedown", start);
      node.addEventListener("mouseup", cancel);
      node.addEventListener("mouseleave", cancel);
    });
  }

  /* =====================================================================
     LECTOR MENTAL — motor de revelación universal
       GESTO SECRETO: desliza hacia abajo desde el borde superior para abrir
       el panel de carga. Toca la carta o escribe la palabra. Se cierra solo
       y el orbe se vuelve dorado = cargado. Entrega el móvil; el espectador
       pulsa el orbe. Si no cargas nada, hace una lectura al azar (emergencia).
     ===================================================================== */
  function renderLector() {
    view.innerHTML =
      '<div class="screen">' + topbar("Lector Mental") +
      '<div class="panel">' +
      '<div class="scanwrap" id="scan">' +
      '<div class="orb" id="orb"></div>' +
      '<div class="prompt" id="prompt">Coloca tu dedo en la esfera y piensa con fuerza en tu carta.</div>' +
      '<div class="sub">Cuando estés listo, pulsa la esfera.</div>' +
      "</div></div></div>";
    buildQuickSet();
    var orb = document.getElementById("orb");
    if (orb) orb.addEventListener("click", function () { runLectorScan(); });
    armSwipeToLoad();
    if (loaded.type) markArmed();
  }

  function markArmed() {
    var orb = document.getElementById("orb");
    if (orb) orb.classList.add("armed");
    var pr = document.getElementById("prompt");
    if (pr) pr.textContent = "La conexión está lista. Coloca tu dedo y concéntrate.";
  }

  // Gesto secreto: swipe hacia abajo desde el borde superior => abrir carga
  function armSwipeToLoad() {
    var startY = null, startedTop = false;
    function ts(e) {
      var y = (e.touches ? e.touches[0].clientY : e.clientY);
      startedTop = y < 60; startY = y;
    }
    function te(e) {
      if (!startedTop || startY == null) return;
      var y = (e.changedTouches ? e.changedTouches[0].clientY : e.clientY);
      if (y - startY > 55) openQuickSet();
      startY = null; startedTop = false;
    }
    document.addEventListener("touchstart", ts, { passive: true });
    document.addEventListener("touchend", te);
    document.addEventListener("mousedown", ts);
    document.addEventListener("mouseup", te);
  }

  function buildQuickSet() {
    var old = document.getElementById("qs");
    if (old) old.remove();
    var rows = SUITS.map(function (s) {
      var btns = VALUES.map(function (v) {
        var cls = s.red ? "cellbtn red" : "cellbtn";
        return '<button class="' + cls + '" data-suit="' + s.sym + '" data-val="' + v + '">' + v + "</button>";
      }).join("");
      var slabelCls = s.red ? 'style="color:var(--red)"' : "";
      return '<div class="suitrow"><div class="slabel" ' + slabelCls + ">" + s.sym +
        '</div><div class="suits">' + btns + "</div></div>";
    }).join("");
    var qs = el(
      '<div class="qs" id="qs">' +
      '<h4>· carga secreta · desliza arriba para cerrar ·</h4>' + rows +
      '<div class="txtwrap"><input id="qsText" type="text" placeholder="…o escribe una palabra / número" autocomplete="off" autocapitalize="off" autocorrect="off"></div>' +
      '<div class="loaded" id="qsLoaded"></div>' +
      '<div class="qsrow"><button class="btn ghost" id="qsClear">Vaciar</button>' +
      '<button class="btn violet" id="qsUseText">Usar palabra</button></div>' +
      "</div>"
    );
    document.body.appendChild(qs);
    qs.querySelectorAll(".cellbtn").forEach(function (b) {
      b.addEventListener("click", function () {
        loaded = { type: "card", card: { suit: b.getAttribute("data-suit"), val: b.getAttribute("data-val") }, text: null };
        document.getElementById("qsLoaded").textContent = "Cargado: " + loaded.card.val + loaded.card.suit;
        setTimeout(closeQuickSet, 380);
      });
    });
    qs.querySelector("#qsUseText").addEventListener("click", function () {
      var t = qs.querySelector("#qsText").value.trim();
      if (!t) { toast("Escribe algo primero"); return; }
      loaded = { type: "text", card: null, text: t };
      document.getElementById("qsLoaded").textContent = "Cargado: " + t;
      setTimeout(closeQuickSet, 250);
    });
    qs.querySelector("#qsClear").addEventListener("click", function () {
      loaded = { type: null, card: null, text: null };
      qs.querySelector("#qsText").value = "";
      document.getElementById("qsLoaded").textContent = "(vacío — hará una lectura al azar)";
      var orb = document.getElementById("orb");
      if (orb) orb.classList.remove("armed");
    });
    var sY = null;
    qs.addEventListener("touchstart", function (e) { sY = e.touches[0].clientY; }, { passive: true });
    qs.addEventListener("touchend", function (e) {
      if (sY == null) return;
      if (sY - e.changedTouches[0].clientY > 50) closeQuickSet();
      sY = null;
    });
  }
  function openQuickSet() { var qs = document.getElementById("qs"); if (qs) qs.classList.add("open"); }
  function closeQuickSet() {
    var qs = document.getElementById("qs");
    if (qs) qs.classList.remove("open");
    if (loaded.type) markArmed();
  }

  function runLectorScan() {
    var result;
    if (loaded.type === "card") result = { kind: "card", card: loaded.card };
    else if (loaded.type === "text") result = { kind: "text", text: loaded.text };
    else result = { kind: "card", card: { suit: SUITS[rnd(4)].sym, val: VALUES[rnd(13)] } };

    view.innerHTML =
      '<div class="screen">' + topbar("Lector Mental") +
      '<div class="panel"><div class="scanwrap" style="min-height:52vh">' +
      '<div class="orb ' + (loaded.type ? "armed" : "") + '"></div>' +
      '<div class="prompt">Leyendo tu mente…</div>' +
      '<div class="progress"><i id="bar"></i></div>' +
      '<div class="scanstatus" id="st"></div>' +
      "</div></div></div>";

    var bar = document.getElementById("bar");
    var st = document.getElementById("st");
    var msgs = ["Sincronizando pulso…", "Detectando la imagen mental…", "Enfocando el símbolo…", "Revelando…"];
    var p = 0;
    var iv = setInterval(function () {
      p += 3 + rnd(4);
      if (p > 100) p = 100;
      bar.style.width = p + "%";
      st.textContent = msgs[Math.min(msgs.length - 1, Math.floor(p / 26))];
      if (p >= 100) { clearInterval(iv); setTimeout(function () { showLectorResult(result); }, 300); }
    }, 120);
  }

  function showLectorResult(result) {
    var body;
    if (result.kind === "card") {
      var c = result.card, isRed = c.suit === "♥" || c.suit === "♦";
      body =
        '<div class="cardface ' + (isRed ? "red" : "") + '">' +
        '<div class="corner tl">' + c.val + "<br>" + c.suit + "</div>" +
        '<div class="center">' + c.suit + "</div>" +
        '<div class="corner br">' + c.val + "<br>" + c.suit + "</div></div>" +
        '<div class="lbl" style="text-align:center;margin-top:18px;color:var(--ink-soft)">Tu carta era el <b>' +
        c.val + " de " + suitName(c.suit) + "</b>.</div>";
    } else {
      body = '<div class="textreveal">' + escapeHtml(result.text) + "</div>";
    }
    view.innerHTML =
      '<div class="screen">' + topbar("Lector Mental") +
      '<div class="panel">' + body +
      '<button class="btn" onclick="location.hash=\'#/\'">Terminar</button>' +
      "</div></div>";
    loaded = { type: null, card: null, text: null };
  }

  /* =====================================================================
     MODO MAGO (oculto) — tutorial del Lector Mental
     Se entra manteniendo pulsado el título en la portada.
     ===================================================================== */
  function section(title, eye, body) {
    var badge = "";
    if (eye === "pub") badge = '<span class="eye pub">Lo ve el público</span><br>';
    if (eye === "sec") badge = '<span class="eye sec">Solo el mago</span><br>';
    return "<section><h3>" + title + "</h3>" + badge + body + "</section>";
  }
  function renderMago() {
    view.innerHTML =
      '<div class="screen">' + topbar("Modo Mago") +
      '<div class="backstage-bar"><span class="dot"></span> BACKSTAGE · solo para tus ojos — no lo enseñes al público</div>' +
      '<div class="panel tut">' +
      "<h2>🧠 Lector Mental</h2>" +
      '<div class="diff">Dificultad: media · el truco más potente</div>' +
      section("👁 Qué ve el público", "pub",
        "<p>El espectador piensa una carta (o una palabra, un nombre, una fecha…). Pone el dedo en una esfera de energía de SU teléfono, la app \"lee su mente\" y revela en pantalla exactamente lo que pensaba.</p>") +
      section("🔒 El secreto", "sec",
        "<p>La app no adivina nada: <b>tú le dices en secreto qué debe revelar</b>. Es un motor de revelación. Lo potente es que funciona con CUALQUIER técnica que ya conozcas para saber la carta.</p>" +
        "<p><b>Cómo cargar en secreto:</b> en la pantalla de la esfera, <b>desliza hacia abajo desde el borde superior</b>. Se abre un panel translúcido: toca la carta o escribe la palabra. Se cierra solo y la esfera se vuelve <b>dorada</b> (= cargada). Para cerrar a mano, desliza hacia arriba.</p>") +
      section("🎓 Cómo saber la carta (elige tu método)", "sec",
        "<ul>" +
        "<li><b>Forzaje:</b> obliga (sin que lo note) a que elija la carta que tú quieres, con una baraja física.</li>" +
        "<li><b>Peek:</b> vislumbra qué carta mira.</li>" +
        "<li><b>Papelito:</b> que escriba algo; tú lo vislumbras y lo cargas en modo palabra.</li>" +
        "<li><b>Equívoco:</b> técnicas de \"magician's choice\" para dirigir la elección.</li>" +
        "</ul>") +
      section("🎬 Paso a paso", "",
        "<ol>" +
        "<li>Averigua la carta/palabra con tu método.</li>" +
        "<li>Con el móvil en tu mano, di que \"calibras el sensor\". En ese momento desliza desde arriba y carga la carta. Un segundo, sin apenas mirar.</li>" +
        "<li>Comprueba de reojo que la esfera está dorada.</li>" +
        "<li>Entrega el móvil. Que ponga el dedo en la esfera, se concentre y pulse.</li>" +
        "<li>La app revela su carta exacta. Reacciona tú también con asombro.</li>" +
        "</ol>") +
      section("🗣 Guion sugerido", "",
        '<div class="script">"Este aparato mide micro-señales de tu piel. Piensa con fuerza en tu carta y no la digas. Pon el dedo aquí… relájate… deja que la lea."</div>') +
      section("⚠ Errores a evitar", "",
        "<ul>" +
        "<li>Ensaya el gesto de carga hasta hacerlo sin mirar: es el único momento delicado.</li>" +
        "<li>No mires la pantalla mientras cargas; mira al espectador y habla.</li>" +
        "<li>No entregues el móvil hasta ver la esfera dorada.</li>" +
        "<li>Nunca repitas el mismo efecto para el mismo público ni reveles el método.</li>" +
        "</ul>") +
      '<button class="btn" onclick="location.hash=\'#/lector\'">▶ Practicar</button>' +
      '<button class="btn ghost" onclick="location.hash=\'#/\'">Salir del Modo Mago</button>' +
      "</div></div>";
  }

  /* =====================================================================
     ROUTER
     ===================================================================== */
  function route() {
    try {
      var qs = document.getElementById("qs");
      if (qs && location.hash !== "#/lector") qs.classList.remove("open");
      var h = location.hash || "#/";
      if (h === "#/" || h === "") return renderHome();
      if (h === "#/lector") return renderLector();
      if (h === "#/mago") return renderMago();
      renderHome();
    } catch (err) {
      if (view) {
        view.innerHTML =
          '<div class="screen"><div class="panel"><h2>Vaya…</h2><p>Algo se atascó. Vuelve al inicio.</p>' +
          '<button class="btn" onclick="location.hash=\'#/\';location.reload()">Reiniciar</button></div></div>';
      }
    }
  }

  window.addEventListener("hashchange", route);
  route();
})();
