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
ok('sw: bypass de red para /r y /r.html (cleanUrls de Vercel)', /r\(\\\.html\)\?\$/.test(sw));
// Vercel sirve r.html en /r (cleanUrls) y le pone Cache-Control no-store
const vercel = JSON.parse(readFileSync(ROOT + 'vercel.json', 'utf8'));
const noStore = (vercel.headers || []).some(h => (h.source === '/r' || h.source === '/r.html') &&
  (h.headers || []).some(x => x.key === 'Cache-Control' && /no-store/.test(x.value)));
ok('vercel: Cache-Control no-store para la página del espectador', noStore);

// --- Estáticos: r.html es neutra, ligera y aislada ---
ok('r.html: título neutro', /<title>\s*Preparando/i.test(rhtml));
ok('r.html: sin <script src> (sin app.js ni libs externas)', !/<script[^>]+src=/i.test(rhtml));
ok('r.html: no usa localStorage', !/localStorage\s*[.\[]/.test(rhtml));
ok('r.html: no registra service worker', !/serviceWorker/.test(rhtml));
ok('r.html: Cache-Control no-store', /no-store/.test(rhtml));
ok('r.html: redirige con location.replace', /location\.replace/.test(rhtml));
ok('r.html: llama a las RPC del espectador', /mr_spectator_join/.test(rhtml) && /mr_spectator_poll/.test(rhtml));
ok('r.html: no menciona la marca ni el nombre del truco', !/App del Mago/.test(rhtml) && !/[Rr]evelaci/.test(rhtml));

// --- Estáticos: el cliente manda entrada CRUDA; el servidor decide la URL ---
ok('cloud: mrSendReveal envía p_input (entrada cruda al servidor)', /p_input:\s*rawInput/.test(cloud));
ok('app: la ruta #/r/ rebota a r.html', /r\.html\?t=/.test(app));

// --- En navegador: r.html es una pantalla neutra, sin chrome de la app ---
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto('http://127.0.0.1:8099/r.html?t=TOKEN_INEXISTENTE');
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

// --- En navegador: #/r/<token> de la app rebota a r.html ---
const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
const p2 = await ctx2.newPage();
await p2.addInitScript(() => { localStorage.setItem('magic_theme', 'light'); localStorage.setItem('magic_social', '1'); localStorage.setItem('magic_onboard', '1'); });
await p2.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));
await p2.goto('http://127.0.0.1:8099/#/r/ABC123'); await p2.waitForTimeout(1200);
ok('app: #/r/ABC123 acaba en r.html?t=ABC123', /r\.html\?t=ABC123/.test(p2.url()));
await ctx2.close();

await b.close();
console.log('PASS ' + pass + ' FAIL ' + fail);
process.exit(fail ? 1 : 0);
