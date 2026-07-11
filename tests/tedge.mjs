// Contenido extremo: títulos kilométricos, emoji, RTL, categorías raras.
// Nada debe desbordar horizontalmente ni romper la vista, y con CPU x4
// los renders clave deben seguir siendo razonables.
import { chromium } from 'playwright';
import { STUB } from './stub.mjs';
const LONG = 'El Increíble Truco De La Carta Ambiciosa Que Atraviesa Tres Barajas 🃏✨ Mientras El Público No Puede Creer Lo Que Ven Sus Ojos';
const tricks = [
  { id: crypto.randomUUID(), title: LONG, category: 'Grandes Ilusiones De Escenario Con Fuego', difficulty: 'dificil', status: 'aprendiendo', favorite: true, tags: ['🔥', 'עברית', 'longtag'.repeat(8)], meta: {}, notes: ('Nota larguísima. '.repeat(200)), media: [], photos: [], createdAt: 1, updatedAt: 9 },
  { id: crypto.randomUUID(), title: 'עברית مع العربية 中文', category: 'Cartomagia', difficulty: 'medio', status: 'dominado', favorite: false, tags: [], meta: {}, notes: '', media: [], photos: [], createdAt: 2, updatedAt: 8 },
  { id: crypto.randomUUID(), title: '🎩'.repeat(40), category: 'X', difficulty: 'facil', status: 'poraprender', favorite: false, tags: [], meta: {}, notes: '', media: [], photos: [], createdAt: 3, updatedAt: 7 }
];
const T = JSON.stringify({ tricks, categories: ['Grandes Ilusiones De Escenario Con Fuego', 'Cartomagia', 'X'], routines: [], gigs: [] });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(t => { localStorage.setItem('magic_theme', 'dark'); localStorage.setItem('magic_social', '1'); localStorage.setItem('magic_lib_v1', t); }, T);
await p.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));

// CPU x4 (móvil modesto)
const cdp = await ctx.newCDPSession(p);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.log('FAIL:', n); } };
const noHScroll = async (name) => {
  const r = await p.evaluate(() => {
    const app = document.querySelector('.app') || document.body;
    return { sw: app.scrollWidth, cw: app.clientWidth, bw: document.body.scrollWidth, bc: document.body.clientWidth };
  });
  ok(`sin desborde H en ${name}`, r.sw <= r.cw + 1 && r.bw <= r.bc + 1);
};

let t0 = Date.now();
await p.goto('http://127.0.0.1:8099/#/'); await p.waitForSelector('.card', { timeout: 15000 });
console.log('  biblioteca con CPU x4:', Date.now() - t0, 'ms');
await p.waitForTimeout(900);
await noHScroll('biblioteca');
ok('título largo recortado en tarjeta', await p.evaluate(() => { const h = document.querySelector('.card .body h3'); return h && h.scrollWidth <= h.clientWidth + 2 || getComputedStyle(h).webkitLineClamp !== 'none' || h.clientHeight < 90; }));

t0 = Date.now();
await p.evaluate(() => { location.hash = '#/truco/' + JSON.parse(localStorage.getItem('magic_lib_v1')).tricks[0].id; });
await p.waitForTimeout(1200);
console.log('  detalle con CPU x4: ~', Date.now() - t0, 'ms (incluye espera fija)');
await noHScroll('detalle');

await p.evaluate(() => { location.hash = '#/mercado'; }); await p.waitForTimeout(1000);
await noHScroll('mercado');
await p.evaluate(() => { location.hash = '#/comunidad'; }); await p.waitForTimeout(1100);
await noHScroll('comunidad');
await p.screenshot({ path: 'edge-mesa.png' });

console.log('PASS', pass, 'FAIL', fail);
console.log('errores:', errs.length ? errs.join(' | ') : 'NONE');
await b.close();
process.exit(fail || errs.length ? 1 : 0);
