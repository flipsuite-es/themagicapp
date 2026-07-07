/* ==========================================================================
   The Magic App
   Colección de trucos de mentalismo/magia para hacer en el móvil del
   espectador. Sin dependencias, funciona offline. Todo el "secreto" vive
   en el cliente: no se envía nada a ningún servidor.

   Estructura:
     - Router por hash (#/, #/simbolo, #/lector, #/reloj, #/manual)
     - Cada truco es una función render() que pinta en #view
     - Estado efímero en memoria (no persiste entre recargas, a propósito)
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
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = rnd(i + 1);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) {
      t = el('<div class="toast" id="toast"></div>');
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1800);
  }

  function topbar(title) {
    return (
      '<div class="topbar">' +
      '<button class="back" onclick="location.hash=\'#/\'">‹</button>' +
      '<div class="title">' + title + "</div>" +
      "</div>"
    );
  }

  /* =====================================================================
     HOME
     ===================================================================== */
  function renderHome() {
    view.innerHTML =
      '<div class="screen">' +
      '<div class="brand">' +
      '<div class="mark">🔮</div>' +
      '<h1 id="brandTitle">The Magic App</h1>' +
      '<p>Mentalismo imposible — en su propio teléfono</p>' +
      "</div>" +
      '<div id="installSlot"></div>' +
      '<div class="grid">' +
      trickCard("simbolo", "🜂", "Símbolo Imposible", "Adivino el símbolo que ha pensado. Sin tocar el teléfono.", "Autofuncional") +
      trickCard("lector", "🧠", "Lector Mental", "Su carta (o palabra) aparece en su pantalla como por arte de magia.", "Universal") +
      trickCard("reloj", "🕛", "Reloj Mental", "Piensa una hora en secreto. La app la encuentra sola.", "Autofuncional") +
      "</div>" +
      '<div class="foot"><span id="secretDoor">✦ Concentra tu energía ✦</span></div>' +
      "</div>";

    // Puerta secreta al Modo Mago: mantener pulsado el título 1.2s
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
  function isIOS() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  }

  function maybeShowInstall() {
    var slot = document.getElementById("installSlot");
    if (!slot) return;
    if (isStandalone()) return; // ya está instalada: no molestar
    try { if (localStorage.getItem("magic_install_hidden") === "1") return; } catch (e) {}

    var banner = el('<div class="install"></div>');
    if (deferredPrompt) {
      // Android / Chrome: instalación con un botón
      banner.innerHTML =
        '<div class="ic">📲</div>' +
        '<div class="tx"><b>Instálala como app</b><br>Icono en tu inicio, pantalla completa y sin conexión.</div>' +
        '<button id="instGo">Instalar</button>' +
        '<button class="close" id="instX">×</button>';
      banner.querySelector("#instGo").addEventListener("click", function () {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(function () { deferredPrompt = null; banner.remove(); });
      });
    } else if (isIOS()) {
      // iPhone / Safari: instrucciones (Apple no permite instalar por botón)
      banner.innerHTML =
        '<div class="ic">📲</div>' +
        '<div class="tx"><b>Tenla como app en tu iPhone</b><br>Pulsa <b>Compartir</b> ' +
        '<span style="font-size:15px">⬆︎</span> y luego <b>“Añadir a pantalla de inicio”</b>.</div>' +
        '<button class="close" id="instX">×</button>';
    } else {
      return; // en escritorio no mostramos nada
    }
    banner.querySelector("#instX").addEventListener("click", function () {
      try { localStorage.setItem("magic_install_hidden", "1"); } catch (e) {}
      banner.remove();
    });
    slot.appendChild(banner);
  }

  function trickCard(route, ico, title, desc, tag) {
    return (
      '<div class="trick" onclick="location.hash=\'#/' + route + "'\">" +
      '<div class="ico">' + ico + "</div>" +
      '<div class="meta"><h3>' + title + "</h3><p>" + desc + "</p>" +
      '<span class="tag">' + tag + "</span></div>" +
      "</div>"
    );
  }

  function armSecretDoor() {
    var els = ["brandTitle", "secretDoor"];
    els.forEach(function (id) {
      var node = document.getElementById(id);
      if (!node) return;
      var timer = null;
      var start = function (e) {
        timer = setTimeout(function () {
          location.hash = "#/mago";
        }, 1200);
      };
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
     TRUCO 1 — SÍMBOLO IMPOSIBLE
     Principio: para todo número de dos cifras N=10a+b,
     N-(a+b)=9a => siempre múltiplo de 9 (9,18,...,81).
     Todos los múltiplos de 9 comparten el mismo símbolo "objetivo".
     El objetivo (y los señuelos) cambian cada partida => indetectable.
     No requiere ninguna intervención secreta del mago.
     ===================================================================== */
  var SYMBOLS = ["★", "☾", "✿", "❄", "♆", "☀", "⚑", "☘", "✚", "♫", "✤", "☂", "◆", "✈", "☯"];

  function renderSimbolo() {
    var target = SYMBOLS[rnd(SYMBOLS.length)];
    // Construir tabla 0..99. Múltiplos de 9 => target. Resto => aleatorio,
    // permitiendo algunos "señuelos" iguales al target para despistar.
    var others = SYMBOLS.filter(function (s) { return s !== target; });
    var cells = [];
    for (var n = 0; n <= 99; n++) {
      var sym;
      if (n !== 0 && n % 9 === 0) {
        sym = target; // los que puede obtener el espectador
      } else {
        // ~10% de señuelos iguales al objetivo para que no cante
        sym = Math.random() < 0.1 ? target : others[rnd(others.length)];
      }
      cells.push({ n: n, s: sym });
    }

    var gridHtml = cells.map(function (c) {
      return '<div class="symcell"><span class="n">' + c.n + '</span><span class="s">' + c.s + "</span></div>";
    }).join("");

    view.innerHTML =
      '<div class="screen">' +
      topbar("Símbolo Imposible") +
      '<div class="panel">' +
      '<h2>Símbolo Imposible</h2>' +
      '<p class="lead">Piensa un número de <b>dos cifras</b> (del 10 al 99).</p>' +
      '<p>Suma sus dos dígitos y <b>resta</b> ese resultado a tu número original.<br>' +
      '<span class="hint">Ejemplo: 48 → 4+8=12 → 48−12 = 36.</span></p>' +
      '<p>Busca tu resultado final en la tabla y <b>concéntrate</b> en el símbolo que tiene al lado.</p>' +
      '<button class="btn" id="scanBtn">🔮 Que la app lo lea</button>' +
      "</div>" +
      '<div class="panel"><div class="symgrid">' + gridHtml + "</div></div>" +
      "</div>";

    document.getElementById("scanBtn").addEventListener("click", function () {
      revealSymbol(target);
    });
  }

  function revealSymbol(target) {
    view.innerHTML =
      '<div class="screen">' +
      topbar("Símbolo Imposible") +
      '<div class="panel">' +
      '<div class="scanwrap" style="min-height:auto;padding:20px 0">' +
      '<div class="orb"></div>' +
      '<div class="prompt">Sintonizando con tu mente…</div>' +
      '<div class="progress"><i id="bar"></i></div>' +
      '<div class="scanstatus" id="st"></div>' +
      "</div></div></div>";

    var bar = document.getElementById("bar");
    var st = document.getElementById("st");
    var msgs = ["Detectando ondas alfa…", "Aislando el símbolo…", "Casi lo tengo…"];
    var p = 0;
    var iv = setInterval(function () {
      p += 4 + rnd(4);
      if (p > 100) p = 100;
      bar.style.width = p + "%";
      st.textContent = msgs[Math.min(msgs.length - 1, Math.floor(p / 34))];
      if (p >= 100) {
        clearInterval(iv);
        setTimeout(function () { showSymbolResult(target); }, 350);
      }
    }, 130);
  }

  function showSymbolResult(target) {
    view.innerHTML =
      '<div class="screen">' +
      topbar("Símbolo Imposible") +
      '<div class="panel">' +
      '<div class="bigreveal">' +
      '<div class="sym">' + target + "</div>" +
      '<div class="lbl">Este es el símbolo en el que estabas pensando.</div>' +
      "</div>" +
      '<button class="btn ghost" onclick="location.hash=\'#/simbolo\'">Repetir</button>' +
      '<button class="btn" onclick="location.hash=\'#/\'">Otro truco</button>' +
      "</div></div>";
  }

  /* =====================================================================
     TRUCO 2 — LECTOR MENTAL (motor de revelación universal)
     El mago fuerza / vislumbra una carta o palabra por CUALQUIER método
     externo (forzaje físico, peek, papelito, etc.) y la carga en secreto:

       GESTO SECRETO: desliza hacia abajo desde el borde superior de la
       pantalla para abrir el panel de carga translúcido. Toca la carta
       (o escribe la palabra) y se oculta solo. El orbe se pone dorado
       = "cargado". Entrega el teléfono; el espectador pulsa el orbe.

     Si no se carga nada, la app hace una "lectura" genérica (fallback)
     eligiendo una carta al azar, para que nunca quede en blanco.
     ===================================================================== */
  var VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  var SUITS = [
    { sym: "♠", name: "Picas", red: false },
    { sym: "♥", name: "Corazones", red: true },
    { sym: "♦", name: "Diamantes", red: true },
    { sym: "♣", name: "Tréboles", red: false }
  ];

  var loaded = { type: null, card: null, text: null }; // estado de carga secreta

  function renderLector() {
    view.innerHTML =
      '<div class="screen">' +
      topbar("Lector Mental") +
      '<div class="panel">' +
      '<div class="scanwrap" id="scan">' +
      '<div class="orb" id="orb"></div>' +
      '<div class="prompt" id="prompt">Coloca tu dedo en la esfera y piensa con fuerza en tu carta.</div>' +
      '<div class="sub">Cuando estés listo, pulsa la esfera.</div>' +
      "</div>" +
      "</div></div>";

    buildQuickSet();
    armScanScreen();
    if (loaded.type) markArmed();
  }

  function markArmed() {
    var orb = document.getElementById("orb");
    if (orb) orb.classList.add("armed");
    var pr = document.getElementById("prompt");
    if (pr) pr.textContent = "La conexión está lista. Coloca tu dedo y concéntrate.";
  }

  function armScanScreen() {
    var orb = document.getElementById("orb");
    if (orb) {
      orb.addEventListener("click", function () { runLectorScan(); });
    }
    armSwipeToLoad();
  }

  // Gesto secreto: swipe hacia abajo desde el borde superior => abrir carga
  function armSwipeToLoad() {
    var startY = null, startedTop = false;
    var scan = document.getElementById("scan");
    function ts(e) {
      var y = (e.touches ? e.touches[0].clientY : e.clientY);
      startedTop = y < 60;
      startY = y;
    }
    function te(e) {
      if (!startedTop || startY == null) return;
      var y = (e.changedTouches ? e.changedTouches[0].clientY : e.clientY);
      if (y - startY > 55) openQuickSet();
      startY = null; startedTop = false;
    }
    document.addEventListener("touchstart", ts, { passive: true });
    document.addEventListener("touchend", te);
    // Alternativa con ratón para pruebas en escritorio
    document.addEventListener("mousedown", ts);
    document.addEventListener("mouseup", te);
    // Y un acceso de emergencia: doble toque en el borde superior también abre
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
      return (
        '<div class="suitrow"><div class="slabel" ' + slabelCls + ">" + s.sym +
        '</div><div class="suits">' + btns + "</div></div>"
      );
    }).join("");

    var qs = el(
      '<div class="qs" id="qs">' +
      '<h4>· carga secreta · desliza arriba para cerrar ·</h4>' +
      rows +
      '<div class="txtwrap"><input id="qsText" type="text" placeholder="…o escribe una palabra / número" autocomplete="off" autocapitalize="off" autocorrect="off"></div>' +
      '<div class="loaded" id="qsLoaded"></div>' +
      '<div class="qsrow">' +
      '<button class="btn ghost" id="qsClear">Vaciar</button>' +
      '<button class="btn violet" id="qsUseText">Usar palabra</button>' +
      "</div>" +
      "</div>"
    );
    document.body.appendChild(qs);

    // Selección de carta
    qs.querySelectorAll(".cellbtn").forEach(function (b) {
      b.addEventListener("click", function () {
        var suit = b.getAttribute("data-suit");
        var val = b.getAttribute("data-val");
        loaded = { type: "card", card: { suit: suit, val: val }, text: null };
        document.getElementById("qsLoaded").textContent = "Cargado: " + val + suit;
        setTimeout(closeQuickSet, 380);
      });
    });
    // Usar texto
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

    // Cerrar deslizando hacia arriba dentro del overlay
    var sY = null;
    qs.addEventListener("touchstart", function (e) { sY = e.touches[0].clientY; }, { passive: true });
    qs.addEventListener("touchend", function (e) {
      if (sY == null) return;
      var y = e.changedTouches[0].clientY;
      if (sY - y > 50) closeQuickSet();
      sY = null;
    });
  }

  function openQuickSet() {
    var qs = document.getElementById("qs");
    if (qs) qs.classList.add("open");
  }
  function closeQuickSet() {
    var qs = document.getElementById("qs");
    if (qs) qs.classList.remove("open");
    if (loaded.type) markArmed();
  }

  function runLectorScan() {
    // Determinar qué revelar
    var result;
    if (loaded.type === "card") {
      result = { kind: "card", card: loaded.card };
    } else if (loaded.type === "text") {
      result = { kind: "text", text: loaded.text };
    } else {
      // Fallback: lectura "genuina" al azar para no quedar en blanco
      result = { kind: "card", card: { suit: SUITS[rnd(4)].sym, val: VALUES[rnd(13)] } };
    }

    view.innerHTML =
      '<div class="screen">' +
      topbar("Lector Mental") +
      '<div class="panel">' +
      '<div class="scanwrap" style="min-height:52vh">' +
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
      if (p >= 100) {
        clearInterval(iv);
        setTimeout(function () { showLectorResult(result); }, 300);
      }
    }, 120);
  }

  function showLectorResult(result) {
    var body;
    if (result.kind === "card") {
      var c = result.card;
      var isRed = c.suit === "♥" || c.suit === "♦";
      body =
        '<div class="cardface ' + (isRed ? "red" : "") + '">' +
        '<div class="corner tl">' + c.val + "<br>" + c.suit + "</div>" +
        '<div class="center">' + c.suit + "</div>" +
        '<div class="corner br">' + c.val + "<br>" + c.suit + "</div>" +
        "</div>" +
        '<div class="lbl" style="text-align:center;margin-top:18px;color:var(--ink-soft)">Tu carta era el <b>' +
        c.val + " de " + suitName(c.suit) + "</b>.</div>";
    } else {
      body = '<div class="textreveal">' + escapeHtml(result.text) + "</div>";
    }

    view.innerHTML =
      '<div class="screen">' +
      topbar("Lector Mental") +
      '<div class="panel">' + body +
      '<button class="btn" onclick="location.hash=\'#/\'">Terminar</button>' +
      "</div></div>";

    // Reset de la carga tras revelar (para no repetir la misma sin querer)
    loaded = { type: null, card: null, text: null };
  }

  function suitName(sym) {
    var m = { "♠": "Picas", "♥": "Corazones", "♦": "Diamantes", "♣": "Tréboles" };
    return m[sym] || sym;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* =====================================================================
     TRUCO 3 — RELOJ MENTAL (autofuncional, principio "contar hasta 20")
     El espectador piensa una hora X (1..12). La app "toca" números.
     El espectador cuenta EN SILENCIO empezando en X, sumando 1 por toque,
     y pulsa BASTA al llegar a 20. El número tocado en ese instante es X.

     Matemática: para que el toque nº t caiga sobre el número X cuando el
     espectador llega a 20, se necesita que en el toque t se toque (20 - t),
     porque el espectador se detiene en el toque t = 20 - X.
       toques 1..7 = aleatorios (señuelo)
       toque t (8..19) = número (20 - t):  8→12, 9→11, ... 19→1
     ===================================================================== */
  function renderReloj() {
    view.innerHTML =
      '<div class="screen">' +
      topbar("Reloj Mental") +
      '<div class="panel">' +
      '<h2>Reloj Mental</h2>' +
      '<p class="lead">Piensa en una <b>hora</b> del reloj (del 1 al 12) y guárdala en secreto.</p>' +
      '<p>Voy a ir iluminando números. En cuanto empiece, <b>cuenta en silencio</b> empezando por tu hora ' +
      '(+1 en cada número que se ilumine). Cuando llegues a <b>20</b>, pulsa <b>¡BASTA!</b></p>' +
      '<button class="btn" id="startClock">Empezar</button>' +
      "</div>" +
      '<div class="panel" id="clockPanel" style="display:none">' +
      clockHtml() +
      '<button class="btn violet" id="bastaBtn" disabled>¡BASTA! (llegué a 20)</button>' +
      '<div class="scanstatus" id="clockSt" style="text-align:center"></div>' +
      "</div></div>";

    document.getElementById("startClock").addEventListener("click", startClock);
  }

  function clockHtml() {
    var nums = "";
    for (var i = 1; i <= 12; i++) {
      var ang = (i / 12) * Math.PI * 2 - Math.PI / 2;
      var r = 120;
      var x = 150 + r * Math.cos(ang);
      var y = 150 + r * Math.sin(ang);
      nums += '<div class="num" id="num' + i + '" style="left:' + x + "px;top:" + y + 'px">' + i + "</div>";
    }
    return '<div class="clock">' + nums + "</div>";
  }

  var clockState = null;
  function startClock() {
    document.getElementById("startClock").disabled = true;
    document.getElementById("clockPanel").style.display = "block";
    var basta = document.getElementById("bastaBtn");
    var st = document.getElementById("clockSt");

    // Secuencia: 7 señuelos aleatorios + descendente 12..1 (toques 8..19)
    var seq = [];
    var pool = [1,2,3,4,5,6,7,8,9,10,11,12];
    for (var k = 0; k < 7; k++) seq.push(pool[rnd(12)]);
    for (var t = 8; t <= 19; t++) seq.push(20 - t); // 12,11,...,1

    clockState = { seq: seq, idx: -1, lit: null, done: false, timer: null };
    basta.disabled = false;
    st.textContent = "Cuenta en silencio… pulsa BASTA al llegar a 20";

    basta.addEventListener("click", onBasta);

    tickClock();
  }

  function tickClock() {
    if (!clockState || clockState.done) return;
    if (clockState.lit) {
      var prev = document.getElementById("num" + clockState.lit);
      if (prev) prev.classList.remove("lit");
    }
    clockState.idx++;
    if (clockState.idx >= clockState.seq.length) {
      // Se acabó la secuencia sin pulsar (fue demasiado lento): reiniciar aviso
      document.getElementById("clockSt").textContent = "¿Te has pasado? Pulsa Repetir e inténtalo de nuevo.";
      addRepeat();
      return;
    }
    var n = clockState.seq[clockState.idx];
    clockState.lit = n;
    var node = document.getElementById("num" + n);
    if (node) node.classList.add("lit");
    clockState.timer = setTimeout(tickClock, 1150);
  }

  function onBasta() {
    if (!clockState || clockState.done) return;
    clockState.done = true;
    clearTimeout(clockState.timer);
    var basta = document.getElementById("bastaBtn");
    basta.disabled = true;

    var n = clockState.lit;
    // Marcar como final
    for (var i = 1; i <= 12; i++) {
      var node = document.getElementById("num" + i);
      if (node) { node.classList.remove("lit"); if (i === n) node.classList.add("final"); }
    }
    var st = document.getElementById("clockSt");
    st.innerHTML = "🔮 <b>Tu hora secreta era… las " + n + "</b>. ¿Verdad?";
    addRepeat();
  }

  function addRepeat() {
    if (document.getElementById("repeatClock")) return;
    var panel = document.getElementById("clockPanel");
    var b1 = el('<button class="btn ghost" id="repeatClock">Repetir</button>');
    b1.addEventListener("click", function () { renderReloj(); });
    var b2 = el('<button class="btn" onclick="location.hash=\'#/\'">Otro truco</button>');
    panel.appendChild(b1);
    panel.appendChild(b2);
  }

  /* =====================================================================
     MODO MAGO (backstage) — OCULTO al público.
     Se entra manteniendo pulsado el título en la portada. Aquí el mago
     APRENDE cada truco: efecto, qué ve el público, el método secreto,
     paso a paso, guion y consejos. Nunca enlaza desde la actuación, y en
     modo app (PWA) no hay barra de direcciones para colarse aquí.
     ===================================================================== */
  function renderMago() {
    view.innerHTML =
      '<div class="screen">' +
      topbar("Modo Mago") +
      '<div class="backstage-bar"><span class="dot"></span> BACKSTAGE · solo para tus ojos — no lo enseñes al público</div>' +
      '<div class="panel">' +
      '<h2 style="color:var(--gold)">🎩 Aprende tus trucos</h2>' +
      '<p class="hint">Estudia aquí en privado. Cada truco explica qué ve el público, el secreto y cómo presentarlo. Cuando actúes, vuelve a la portada y usa solo las pantallas de actuación.</p>' +
      '</div>' +
      '<div class="tutlist">' +
      tutRow("simbolo", "🜂", "Símbolo Imposible", "Autofuncional · para principiantes") +
      tutRow("lector", "🧠", "Lector Mental", "El más potente · requiere práctica") +
      tutRow("reloj", "🕛", "Reloj Mental", "Autofuncional · interactivo") +
      '</div>' +
      '<div class="panel" style="margin-top:16px">' +
      '<h3 style="color:var(--violet-soft);margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.8px">Reglas de oro</h3>' +
      '<ul style="color:var(--ink-soft);line-height:1.6;font-size:14px;padding-left:20px;margin:0">' +
      '<li>Deja el móvil en manos del espectador siempre que puedas: es lo que hace que parezca imposible.</li>' +
      '<li>Nunca repitas el mismo truco para el mismo público.</li>' +
      '<li>Nunca reveles el método. "Un mago jamás cuenta sus secretos".</li>' +
      '<li>Ensaya hasta que el manejo secreto te salga sin mirar y sin pensar.</li>' +
      '</ul></div>' +
      '<button class="btn" onclick="location.hash=\'#/\'">Salir del Modo Mago</button>' +
      "</div>";
  }

  function tutRow(id, ico, title, sub) {
    return (
      '<div class="tutrow" onclick="location.hash=\'#/mago/' + id + "'\">" +
      '<div class="ic">' + ico + "</div>" +
      "<div><h3>" + title + "</h3><p>" + sub + "</p></div>" +
      '<div class="arrow">›</div></div>'
    );
  }

  var TUTS = {
    simbolo: {
      ico: "🜂",
      title: "Símbolo Imposible",
      diff: "Dificultad: muy fácil · 100% automático",
      html:
        section("👁 Qué ve el público", "pub",
          "<p>El espectador piensa un número de dos cifras totalmente libre, hace una pequeña resta y se fija en el símbolo que hay junto a su resultado en una tabla. Sin decir nada, tú (o la app) adivináis el símbolo exacto en el que está pensando.</p>") +
        section("🔒 El secreto", "sec",
          "<p>Es matemática disfrazada. Para cualquier número de dos cifras <code>N</code>, al restarle la suma de sus dígitos el resultado es <b>siempre un múltiplo de 9</b>: solo puede salir 9, 18, 27, 36, 45, 54, 63, 72 u 81.</p>" +
          "<p>La razón: un número es <code>10a + b</code>, y <code>(10a + b) − (a + b) = 9a</code>. Siempre 9 × las decenas.</p>" +
          "<p>En la tabla, <b>todos esos múltiplos de 9 llevan el mismo símbolo</b>. Elija el número que elija, acaba en ese símbolo. Y ese símbolo <b>cambia cada vez</b> que abres el truco, con algunos señuelos repartidos, para que nadie lo descubra.</p>") +
        section("🎬 Paso a paso", "",
          "<ol>" +
          "<li>Entrega el móvil abierto en el truco (o léelo tú).</li>" +
          "<li>Pídele que piense un número del 10 al 99.</li>" +
          "<li>Que sume sus dígitos y lo reste al número. Da un ejemplo: <code>48 → 4+8 = 12 → 48−12 = 36</code>.</li>" +
          "<li>Que busque su resultado en la tabla y <b>se concentre solo en el símbolo</b>.</li>" +
          "<li>Pulsa \"Que la app lo lea\" y aparece su símbolo.</li>" +
          "</ol>") +
        section("🗣 Guion sugerido", "",
          '<div class="script">"Haz unas cuentas para crear un número al azar dentro de tu cabeza… Yo no puedo saberlo. Ahora olvida el número y concéntrate solo en la <i>forma</i>, en el símbolo. Visualízalo con fuerza…"</div>' +
          "<p class='hint'>Cuanto menos hables de la resta y más de \"visualizar el símbolo\", más mágico parece.</p>") +
        section("⚠ Errores a evitar", "",
          "<ul>" +
          "<li>No lo repitas: si sale el mismo símbolo dos veces podrían sospechar (aunque cambia, no arriesgues).</li>" +
          "<li>Asegúrate de que hace bien la resta; si dudan, pon tú el ejemplo.</li>" +
          "<li>Úsalo de apertura: es infalible y te da credibilidad para el Lector Mental.</li>" +
          "</ul>")
    },
    lector: {
      ico: "🧠",
      title: "Lector Mental",
      diff: "Dificultad: media · el truco más potente",
      html:
        section("👁 Qué ve el público", "pub",
          "<p>El espectador piensa una carta (o una palabra, un nombre, una fecha…). Pone el dedo en una esfera de energía de SU teléfono, la app \"lee su mente\" y revela en pantalla exactamente lo que pensaba.</p>") +
        section("🔒 El secreto", "sec",
          "<p>La app no adivina nada: <b>tú le dices en secreto qué debe revelar</b>. Es un motor de revelación. Lo potente es que funciona con CUALQUIER técnica que ya conozcas para saber la carta.</p>" +
          "<p><b>Cómo cargar en secreto:</b> en la pantalla de la esfera, <b>desliza hacia abajo desde el borde superior</b>. Se abre un panel translúcido: toca la carta o escribe la palabra. Se cierra solo y la esfera se vuelve <b>dorada</b> (= cargada). Para cerrar a mano, desliza hacia arriba.</p>") +
        section("🎓 Cómo saber la carta (elige tu método)", "sec",
          "<ul>" +
          "<li><b>Forzaje:</b> obliga (sin que lo note) a que elija la carta que tú quieres, con una baraja física. Es el método clásico.</li>" +
          "<li><b>Peek:</b> vislumbra qué carta mira.</li>" +
          "<li><b>Papelito:</b> que escriba algo en un papel; tú lo vislumbras y lo cargas en modo palabra.</li>" +
          "<li><b>Equívoco:</b> técnicas de \"magician's choice\" para dirigir la elección.</li>" +
          "</ul>" +
          "<p class='hint'>La app es el final impactante; el secreto de \"saber\" la info lo pones tú con una técnica de magia clásica.</p>") +
        section("🎬 Paso a paso", "",
          "<ol>" +
          "<li>Averigua la carta/palabra con tu método.</li>" +
          "<li>Con el móvil en tu mano, di que \"calibras el sensor\". En ese momento desliza desde arriba y carga la carta. Un segundo, sin apenas mirar.</li>" +
          "<li>Comprueba de reojo que la esfera está dorada.</li>" +
          "<li>Entrega el móvil. Que ponga el dedo en la esfera, se concentre y pulse.</li>" +
          "<li>La app revela su carta exacta. Reacciona tú también con asombro.</li>" +
          "</ol>" +
          "<p class='hint'>Salida de emergencia: si no cargas nada, la app elige una carta al azar (no queda en blanco), pero entonces no será \"su\" carta. Úsalo solo si algo falla.</p>") +
        section("🗣 Guion sugerido", "",
          '<div class="script">"Este aparato mide micro-señales de tu piel. Piensa con fuerza en tu carta y no la digas. Pon el dedo aquí… relájate… deja que la lea."</div>') +
        section("⚠ Errores a evitar", "",
          "<ul>" +
          "<li>Ensaya el gesto de carga hasta hacerlo sin mirar: es el único momento delicado.</li>" +
          "<li>No mires la pantalla mientras cargas; mira al espectador y habla.</li>" +
          "<li>No entregues el móvil hasta ver la esfera dorada.</li>" +
          "</ul>")
    },
    reloj: {
      ico: "🕛",
      title: "Reloj Mental",
      diff: "Dificultad: fácil · autofuncional",
      html:
        section("👁 Qué ve el público", "pub",
          "<p>El espectador piensa una hora del reloj (1–12) en absoluto secreto. La app va iluminando números aparentemente al azar; él cuenta mentalmente y, al llegar a 20, dice basta. El número que la app está señalando en ese instante es justo su hora secreta.</p>") +
        section("🔒 El secreto", "sec",
          "<p>Es autofuncional, no tienes que hacer nada. La app ilumina 7 números al azar y a partir del octavo empieza a contar hacia atrás: 12, 11, 10, 9…</p>" +
          "<p>Por matemática, si el espectador empieza a contar en su hora y suma 1 por cada destello, cuando llega a 20 el número iluminado es siempre el suyo. Funciona con las 12 horas, garantizado.</p>") +
        section("🎬 Paso a paso", "",
          "<ol>" +
          "<li>Que piense una hora del 1 al 12 y la guarde en secreto.</li>" +
          "<li>Explica: \"cuando empiecen los destellos, cuenta en silencio empezando por tu hora, +1 en cada número\".</li>" +
          "<li>\"Cuando tu cuenta llegue a 20, pulsa BASTA\".</li>" +
          "<li>Pulsa Empezar y deja que cuente. Al pulsar BASTA, la app revela su hora.</li>" +
          "</ol>") +
        section("🗣 Guion sugerido", "",
          '<div class="script">"No me digas tu hora. Confía en el conteo, deja que los números te guíen… y para cuando llegues a veinte."</div>') +
        section("⚠ Errores a evitar", "",
          "<ul>" +
          "<li>Insiste en <b>un número por cada destello</b>, sin saltarse ninguno: es lo único que puede desajustarlo.</li>" +
          "<li>Si cuenta mal o va desincronizado, pulsa Repetir y vuelve a empezar con calma.</li>" +
          "</ul>")
    }
  };

  function section(title, eye, body) {
    var badge = "";
    if (eye === "pub") badge = '<span class="eye pub">Lo ve el público</span><br>';
    if (eye === "sec") badge = '<span class="eye sec">Solo el mago</span><br>';
    return "<section><h3>" + title + "</h3>" + badge + body + "</section>";
  }

  function renderTut(id) {
    var t = TUTS[id];
    if (!t) { location.hash = "#/mago"; return; }
    view.innerHTML =
      '<div class="screen">' +
      '<div class="topbar">' +
      '<button class="back" onclick="location.hash=\'#/mago\'">‹</button>' +
      '<div class="title">Modo Mago</div></div>' +
      '<div class="backstage-bar"><span class="dot"></span> BACKSTAGE · no muestres esta pantalla</div>' +
      '<div class="panel tut">' +
      "<h2>" + t.ico + " " + t.title + "</h2>" +
      '<div class="diff">' + t.diff + "</div>" +
      t.html +
      '<button class="btn" onclick="location.hash=\'#/' + id + '\'">▶ Practicar este truco</button>' +
      '<button class="btn ghost" onclick="location.hash=\'#/mago\'">Volver a los trucos</button>' +
      "</div></div>";
  }

  /* =====================================================================
     ROUTER
     ===================================================================== */
  function route() {
    // Cerrar overlays huérfanos
    var qs = document.getElementById("qs");
    if (qs && !location.hash.startsWith("#/lector")) qs.classList.remove("open");

    var h = location.hash || "#/";
    if (h === "#/" || h === "") return renderHome();
    if (h === "#/simbolo") return renderSimbolo();
    if (h === "#/lector") return renderLector();
    if (h === "#/reloj") return renderReloj();
    if (h === "#/mago") return renderMago();
    if (h.indexOf("#/mago/") === 0) return renderTut(h.slice("#/mago/".length));
    renderHome();
  }

  window.addEventListener("hashchange", route);
  route();
})();
