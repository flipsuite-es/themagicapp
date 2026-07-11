import { chromium } from 'playwright';
import { STUB } from './stub.mjs';
const CATS = ['Cartomagia', 'Mentalismo', 'Monedas', 'Escenario'];
const tricks = Array.from({ length: 60 }, (_, i) => ({ id: crypto.randomUUID(), title: 'Truco ' + (i + 1), category: CATS[i % 4], difficulty: 'medio', status: 'dominado', favorite: false, tags: [], meta: {}, notes: '', media: [], photos: [], createdAt: i, updatedAt: 1000 - i }));
const T = JSON.stringify({ tricks, categories: CATS, routines: [], gigs: [] });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block' })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(t => { localStorage.setItem('magic_theme', 'dark'); localStorage.setItem('magic_social', '1'); localStorage.setItem('magic_lib_v1', t); }, T);
await p.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.log('FAIL:', n); } };

const t0 = Date.now();
await p.goto('http://127.0.0.1:8099/#/'); await p.waitForSelector('.mcard'); await p.waitForTimeout(1600);
ok('60 cartas en DOM', await p.locator('.mcard').count() === 60);
const visible0 = await p.evaluate(() => [...document.querySelectorAll('.mcard')].filter(m => m.style.display !== 'none').length);
console.log('  visibles tras culling:', visible0, '| tiempo carga:', Date.now() - t0, 'ms');
ok('culling activo (<20 visibles)', visible0 > 4 && visible0 < 20);
await p.screenshot({ path: 'm4-sixty.png' });

// paneo profundo: el culling se actualiza
const mw = await p.locator('#mesaWrap').boundingBox();
for (let r = 0; r < 5; r++) {
  await p.mouse.move(mw.x + 195, mw.y + 420);
  await p.mouse.down();
  for (let i = 1; i <= 8; i++) await p.mouse.move(mw.x + 195, mw.y + 420 - i * 40, { steps: 2 });
  await p.mouse.up();
  await p.waitForTimeout(150);
}
await p.waitForTimeout(600);
const midState = await p.evaluate(() => {
  const vis = [...document.querySelectorAll('.mcard')].filter(m => m.style.display !== 'none');
  return { count: vis.length, first: vis[0] && vis[0].getAttribute('aria-label') };
});
console.log('  tras panear:', JSON.stringify(midState));
ok('culling desliza la ventana', midState.count > 4 && midState.count < 22 && midState.first !== 'Truco 1');

// la carta agarrada queda POR ENCIMA: z=90 en transform y última en DOM
await p.reload(); await p.waitForSelector('.mcard'); await p.waitForTimeout(1500);
const w2 = await p.locator('#mesaWrap').boundingBox();
let bb = null, id = null; const n = await p.locator('.mcard').count();
for (let i = 0; i < n; i++) {
  const c = await p.locator('.mcard').nth(i).boundingBox();
  if (c && c.y > w2.y + 20 && c.y + c.height < w2.y + w2.height - 130) { bb = c; id = await p.locator('.mcard').nth(i).getAttribute('data-id'); break; }
}
await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
await p.mouse.down(); await p.waitForTimeout(450);
const during = await p.evaluate(id0 => {
  const el = document.querySelector('.mcard[data-id="' + id0 + '"]');
  const inEl = el.firstChild, m = getComputedStyle(inEl).transform;
  // matrix3d: el z de la traslación es el componente 15 (índice 14)
  const z = m.startsWith('matrix3d') ? parseFloat(m.slice(9, -1).split(',')[14]) : 0;
  return { drag: inEl.classList.contains('drag'), z: z, outer: el.style.transform };
}, id);
ok('capa interior elevada (z>40)', during.drag && during.z > 40);
ok('z de escena estable (2px)', /,\s*2px\)/.test(during.outer));
await p.mouse.move(bb.x + bb.width / 2 + 40, bb.y + bb.height / 2 - 40, { steps: 5 });
await p.mouse.up(); await p.waitForTimeout(400);
const after = await p.evaluate(id0 => { const el = document.querySelector('.mcard[data-id="' + id0 + '"]'); return { last: el.parentNode.lastChild === el, drag: el.firstChild.classList.contains('drag') }; }, id);
ok('última del DOM al posarse', after.last);
ok('clase drag retirada', !after.drag);

console.log('PASS', pass, 'FAIL', fail);
console.log('errores:', errs.length ? errs.join(' | ') : 'NONE');
await b.close();
process.exit(fail || errs.length ? 1 : 0);
