// Revelación musical — Paso 1: neutralidad del espectador, exclusión del SW,
// endurecimiento del enlace y aislamiento de la página r.html.
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { STUB } from './stub.mjs';

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + name); } };

const ROOT = new URL('../', import.meta.url).pathname;
const sw = readFileSync(ROOT + 'sw.js', 'utf8');
const rhtml = readFileSync(ROOT + 'r.html', 'utf8');
const app = readFileSync(ROOT + 'app.js', 'utf8');
const cloud = readFileSync(ROOT + 'cloud.js', 'utf8');

// --- Estáticos: el service worker deja r.html fuera ---
ok('sw: r.html NO está en el precache (ASSETS)', !/["']\.\/r\.html["']/.test(sw));
ok('sw: bypass de red para /m/<código>, /r, /r.html y /r/<código>', /\(r\(\\\.html\)\?\|m\)/.test(sw));
// Vercel: reescribe /r/:code a r.html y le pone Cache-Control no-store
const vercel = JSON.parse(readFileSync(ROOT + 'vercel.json', 'utf8'));
const noStore = (vercel.headers || []).some(h => /^\/r/.test(h.source) &&
  (h.headers || []).some(x => x.key === 'Cache-Control' && /no-store/.test(x.value)));
ok('vercel: Cache-Control no-store para la página del espectador', noStore);
ok('vercel: reescribe la carpeta /m/:code a /r', (vercel.rewrites || []).some(r => /\/m\/:code/.test(r.source) && r.destination === '/r'));

// --- Estáticos: r.html es neutra, ligera y aislada ---
ok('r.html: título neutro', /<title>\s*Preparando/i.test(rhtml));
ok('r.html: sin <script src> ni libs externas (ligera y aislada)', !/<script[^>]+src=/i.test(rhtml) && !/\.src\s*=/.test(rhtml));
ok('r.html: no usa localStorage', !/localStorage\s*[.\[]/.test(rhtml));
ok('r.html: no registra service worker', !/serviceWorker/.test(rhtml));
ok('r.html: Cache-Control no-store', /no-store/.test(rhtml));
ok('r.html: al llegar la señal sale a YouTube con una navegación normal (sin ningún toque)', /function go\(/.test(rhtml) && /location\.replace\(ytUrl/.test(rhtml) && /m\.youtube\.com\/watch/.test(rhtml));
ok('r.html: usa las RPC del espectador en vivo (estado + sondeo + acuse)', /mr_spec_state/.test(rhtml) && /mr_spec_poll/.test(rhtml) && /mr_spec_ack/.test(rhtml));
ok('r.html: sin caducidad ni consumo único (repetible por baseline)', /p_since/.test(rhtml) && !/expired/.test(rhtml));
ok('r.html: lee el código del hash (/r#código), de la ruta y de ?c=', /location\.hash/.test(rhtml) && /pathname\.match/.test(rhtml) && /param\("c"\)/.test(rhtml));
ok('r.html: no menciona la marca ni el nombre del truco', !/App del Mago/.test(rhtml) && !/[Rr]evelaci/.test(rhtml));

// --- Estáticos: entrada cruda al servidor + código permanente ---
ok('cloud: mrSendReveal envía p_input (entrada cruda al servidor)', /p_input:\s*rawInput/.test(cloud));
ok('cloud: expone mrMyHandle (código permanente)', /mrMyHandle/.test(cloud));
ok("app: el enlace del espectador usa la carpeta /m/<código>", /base \+ "m\/" \+ mrState\.code/.test(app));
ok("app: conserva /r?c= como respaldo", /base \+ "r\?c=" \+ mrState\.code/.test(app));
ok('r.html: lee el código de la carpeta /m/ y de /r/', /\(\?:m\|r\)/.test(rhtml));
ok('r.html: mantiene la pantalla encendida (Wake Lock)', /wakeLock/.test(rhtml));
ok('r.html: sale a YouTube en la marca de tiempo (&t=) y sin rastro (location.replace)', /&t=/.test(rhtml) && /location\.replace/.test(rhtml));
ok('r.html: es YouTube de verdad, sin reproductor propio ni incrustado', !/youtube\.com\/embed\//.test(rhtml) && !/new YT\.Player/.test(rhtml) && !/<iframe/i.test(rhtml));
ok('r.html: no depende de ningún toque del espectador para revelar', !/armHandoff/.test(rhtml) && !/addEventListener\("(pointerdown|touchstart|click)"/.test(rhtml.replace(/visibilitychange/g, '')));
ok('app: mantiene la pantalla del mago encendida (Wake Lock)', /mrKeepAwake/.test(app) && /requestWake/.test(app));

// --- Fiabilidad del envío: presencia obligatoria, acuse y reintento ---
// r.html sondea rápido (400 ms): entrega casi instantánea + latido de presencia.
ok('r.html: sondeo rápido de 400 ms (entrega y presencia)', /setInterval\(poll,\s*400\)/.test(rhtml));
// El botón de enviar se bloquea sin espectador y muestra la espera.
ok('app: el botón de enviar se bloquea sin espectador', /mrState\.canSend/.test(app) && /Esperando al espectador/.test(app));
ok('app: sincroniza el botón según la presencia del espectador', /function mrSyncSendBtn/.test(app));
// Si el servidor responde no_spectator, NO se declara éxito.
ok('app: gestiona la respuesta no_spectator del servidor', /"no_spectator"|'no_spectator'/.test(app) && /No hay ning/.test(app));
// Solo se considera enviado si el servidor confirma ok:true.
ok('app: solo declara enviado con res.ok del servidor', /res\.ok/.test(app));
// Reintento automático ante fallo de red transitorio (no ante entrada inválida).
ok('app: reintenta el envío ante fallo de red', /function mrSendWithRetry/.test(app) && /attempt\s*<\s*3/.test(app));
// Confirmación de recibo: el mago ve el acuse del móvil del espectador (delivered_rev).
ok('app: confirma el recibo con el acuse del espectador', /awaitRev/.test(app) && /delivered_rev/.test(app));
// El monitor del mago sondea rápido (1 s) para detectar presencia y entrega.
ok('app: el monitor del mago sondea cada 1 s', /}, 1000\);/.test(app));

// --- Teclado oculto: navegador + Google recreados, teclado NATIVO, captura a ciegas ---
const styles = readFileSync(ROOT + 'styles.css', 'utf8');
// Se recrea la interfaz completa del navegador con el dominio falso "google.com".
ok('app: recrea el navegador + Google (dominio falso google.com)', /function mrOpenSearch/.test(app) && /function mrRenderSearchScreen/.test(app) && /google\.com<\/span>/.test(app) && /mrg-addr/.test(app));
// Teclado NATIVO del dispositivo: un campo real que se enfoca (abre el teclado del sistema).
ok('app: teclado nativo — campo real que se enfoca', /id="mrgInput"/.test(app) && /\binp\.focus\(\)/.test(app) && /addEventListener\("beforeinput"/.test(app));
// Correcciones DESACTIVADAS mientras se teclea a ciegas (no filtra el secreto).
ok('app: correcciones off durante el texto oculto', /autocorrect="off"/.test(app) && /spellcheck="false"/.test(app));
// A ciegas: ANTES de "qq" se escribe la frase inocente (forzada), no lo tecleado.
ok('app: a ciegas — antes de qq se escribe la frase inocente (forzada)', /s\.innocent\.slice\(0, ?s\.raw\.length\)/.test(app) && /e\.preventDefault\(\)/.test(app));
// Delimitador "qq": corta la captura (artista = lo pulsado antes de qq) y para lo forzado.
ok('app: "qq" corta la captura y para la escritura forzada', /s\.raw\.indexOf\("qq"\)/.test(app) && /s\.raw\.slice\(0, ?i\)/.test(app) && /phase = "real"/.test(app));
// Tras "qq": escritura REAL (teclado nativo normal) y correcciones ACTIVADAS.
ok('app: tras "qq" escritura real y correcciones activadas', /function mrEnableCorrections/.test(app) && /autocorrect", ?"on"/.test(app) && /s\.phase === "real"/.test(app));
// Al pulsar Buscar sale a Google de verdad con la frase inocente.
ok('app: Buscar sale a Google real con la frase inocente', /google\.com\/search\?q="\s*\+\s*encodeURIComponent\(s\.innocent\)/.test(app));
// El artista captado queda disponible para los pasos 2-3 (IA/YouTube) y para verificar.
ok('app: guarda el artista captado (enganche para IA/YouTube)', /mrState\.lastArtist/.test(app) && /function mrOnArtistCaptured/.test(app));
// Estilos propios recreando Safari + Google (pantalla a color fijo, ajena al tema).
ok('styles: recreación de Safari + Google (barra de dirección y buscador)', /\.mrg-addr/.test(styles) && /\.mrg-input/.test(styles) && /\.mrg-gobtn/.test(styles));
// Logo REAL de Google incrustado (imagen), no texto de colores aproximado.
ok('styles: logo real de Google incrustado en .mrg-logo', /\.mrg-logo \{[^}]*url\(data:image\/png;base64,/.test(styles));

// --- En navegador: r.html es una pantalla neutra, sin chrome de la app ---
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto('http://127.0.0.1:8099/r.html?c=NOPE');
await p.waitForTimeout(1200);
const spec = await p.evaluate(() => ({
  title: document.title,
  hasView: !!document.getElementById('view'),
  hasTabbar: !!document.getElementById('tabbarEl'),
  hasAppbar: !!document.querySelector('.appbar'),
  bg: getComputedStyle(document.body).backgroundColor,
  msg: (document.getElementById('m') || {}).textContent || '',
  lsLen: (function () { try { return localStorage.length; } catch (e) { return -1; } })()
}));
ok('r.html: título de pestaña neutro en runtime', /Preparando/i.test(spec.title));
ok('r.html: sin #view de la app', !spec.hasView);
ok('r.html: sin barra de pestañas', !spec.hasTabbar);
ok('r.html: sin barra superior', !spec.hasAppbar);
ok('r.html: fondo neutro oscuro', spec.bg === 'rgb(11, 11, 13)');
ok('r.html: no escribe en localStorage', spec.lsLen === 0);
ok('r.html: sin errores de JS en la página', errs.length === 0);
// Sin backend alcanzable, degrada a mensaje neutro (nunca menciona Supabase/sesión/magia)
ok('r.html: error neutro sin tecnicismos', !/supabase|sesi|token|magia|error/i.test(spec.msg));
await ctx.close();

// --- En navegador: el enlace antiguo #/r/<código> rebota a /r/<código> ---
const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
const p2 = await ctx2.newPage();
await p2.addInitScript(() => { localStorage.setItem('magic_theme', 'light'); localStorage.setItem('magic_social', '1'); localStorage.setItem('magic_onboard', '1'); });
await p2.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));
await p2.goto('http://127.0.0.1:8099/#/r/1'); await p2.waitForTimeout(1200);
ok('app: #/r/1 rebota a la carpeta /m/1', /\/m\/1$/.test(p2.url().split('?')[0].split('#')[0]));
await ctx2.close();

await b.close();
console.log('PASS ' + pass + ' FAIL ' + fail);
process.exit(fail ? 1 : 0);
