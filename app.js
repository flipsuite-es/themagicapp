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
      '<div class="grid">' +
      trickCard("simbolo", "🜂", "Símbolo Imposible", "Adivino el símbolo que ha pensado. Sin tocar el teléfono.", "Autofuncional") +
      trickCard("lector", "🧠", "Lector Mental", "Su carta (o palabra) aparece en su pantalla como por arte de magia.", "Universal") +
      trickCard("reloj", "🕛", "Reloj Mental", "Piensa una hora en secreto. La app la encuentra sola.", "Autofuncional") +
      "</div>" +
      '<div class="foot"><span id="secretDoor">✦ Concentra tu energía ✦</span></div>' +
      "</div>";

    // Puerta secreta al manual del mago: mantener pulsado el título 1.2s
    armSecretDoor();
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
          location.hash = "#/manual";
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
     MANUAL DEL MAGO (oculto: mantener pulsado el título en la home)
     ===================================================================== */
  function renderManual() {
    view.innerHTML =
      '<div class="screen manual">' +
      topbar("· Manual del mago ·") +
      '<div class="panel">' +
      '<h2>🎩 Manual secreto</h2>' +
      '<p class="hint">Esta pantalla es solo para ti. Se abre manteniendo pulsado el título en la portada.</p>' +

      '<h3>1 · Símbolo Imposible</h3>' +
      '<ul>' +
      '<li><b>Es 100% automático.</b> No tienes que hacer nada en secreto.</li>' +
      '<li>Cualquier número de dos cifras, tras "número − suma de sus dígitos", da siempre un múltiplo de 9 (9, 18, 27… 81).</li>' +
      '<li>Todos esos números comparten el mismo símbolo en la tabla, y el símbolo <b>cambia cada vez</b>, así que nadie puede descubrirlo repitiendo.</li>' +
      '<li>Presenta: "piensa un número, haz la resta, mira el símbolo" → la app lo revela.</li>' +
      '</ul>' +

      '<h3>2 · Lector Mental <span class="tag">el más potente</span></h3>' +
      '<p>Convierte cualquier carta forzada o vislumbrada (peek) en una "lectura de mente" tecnológica en el móvil del espectador.</p>' +
      '<div class="secret-note"><b>Cargar en secreto:</b> en la pantalla del orbe, <b>desliza hacia abajo desde el borde superior</b> de la pantalla. Se abre un panel translúcido. Toca la carta (o escribe la palabra/número). Se cierra solo y el orbe se vuelve <b>dorado</b> = cargado. Para cerrarlo a mano, desliza hacia arriba.</div>' +
      '<ol>' +
      '<li>Averigua la carta por tu método favorito: forzaje clásico, carta a la vista (peek), un papelito que el espectador escribe y tú vislumbras, etc.</li>' +
      '<li>Mientras "calibras el sensor" (teléfono en tu mano), desliza y carga la carta. Un segundo, sin mirar apenas.</li>' +
      '<li>Entrega el teléfono. El espectador pone el dedo en el orbe y pulsa. La app "lee su mente" y muestra su carta exacta.</li>' +
      '<li>Si no cargas nada, la app elige una carta al azar (para no quedar en blanco): úsalo solo como salida de emergencia.</li>' +
      '</ol>' +
      '<p class="hint">Idea avanzada: con el modo palabra puedes revelar CUALQUIER cosa (un nombre, una fecha, una palabra de un libro). Es un "cerebro" universal.</p>' +

      '<h3>3 · Reloj Mental</h3>' +
      '<ul>' +
      '<li><b>Automático.</b> El espectador piensa una hora (1–12), cuenta en silencio +1 por cada número que se ilumina, empezando por SU hora, y pulsa BASTA al llegar a 20.</li>' +
      '<li>La app ilumina 7 números al azar y luego cuenta hacia atrás (12, 11, 10…). Por matemática, el número iluminado justo cuando él llega a 20 es siempre su hora.</li>' +
      '<li>Insiste en que cuente <b>un número por cada destello</b> y que no se salte ninguno. Si se mueve mal, "Repetir".</li>' +
      '</ul>' +

      '<h3>Consejos de presentación</h3>' +
      '<ul>' +
      '<li>El teléfono es del espectador siempre que puedas: refuerza que "no hay trampa".</li>' +
      '<li>Da la app por una URL (o guárdala en pantalla de inicio). Funciona sin conexión.</li>' +
      '<li>Nunca repitas el mismo truco dos veces para el mismo público.</li>' +
      '</ul>' +
      '<button class="btn" onclick="location.hash=\'#/\'">Volver</button>' +
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
    if (h === "#/manual") return renderManual();
    renderHome();
  }

  window.addEventListener("hashchange", route);
  route();
})();
