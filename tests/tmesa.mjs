import { chromium } from 'playwright';
import { STUB } from './stub.mjs';
const TRICKS = JSON.stringify({ tricks: [
  { id: '8b11bb81-7b29-4265-9a7e-da7b21a66659', title: 'Control Fantasma', category: 'Cartomagia', difficulty: 'medio', status: 'dominado', favorite: true, tags: [], meta: {}, notes: '', media: [], photos: [], createdAt: 1, updatedAt: 9 },
  { id: 'b4c9daef-1182-428c-971b-0b3cf61d5612', title: 'Lector Mental', category: 'Mentalismo', difficulty: 'dificil', status: 'aprendiendo', favorite: false, tags: [], meta: {}, notes: '', media: [], photos: [], createdAt: 2, updatedAt: 8 },
  { id: '54300041-a6d8-4ad4-9d6b-f822d65fa8e7', title: 'Moneda a Través', category: 'Numismagia', difficulty: 'medio', status: 'poraprender', favorite: false, tags: [], meta: {}, notes: '', media: [], photos: [], createdAt: 3, updatedAt: 7 },
  { id: '6ab78574-31da-4892-bb64-7f59af94a9c6', title: 'Cuerda Rota', category: 'Escenario', difficulty: 'facil', status: 'dominado', favorite: false, tags: [], meta: {}, notes: '', media: [], photos: [], createdAt: 4, updatedAt: 6 },
  { id: 'f2283f61-e8cb-4134-a01b-9c5bd81e3249', title: 'As Ambicioso', category: 'Cartomagia', difficulty: 'medio', status: 'dominado', favorite: false, tags: [], meta: {}, notes: '', media: [], photos: [], createdAt: 5, updatedAt: 5 },
  { id: '1e869859-fa18-4119-b33e-6e8347ef692b', title: 'Predicción Imposible', category: 'Mentalismo', difficulty: 'dificil', status: 'aprendiendo', favorite: true, tags: [], meta: {}, notes: '', media: [], photos: [], createdAt: 6, updatedAt: 4 }
], categories: ['Cartomagia', 'Mentalismo', 'Numismagia', 'Escenario'], routines: [], gigs: [] });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block' })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(t => { try { localStorage.setItem('magic_theme', 'dark'); localStorage.setItem('magic_social', '1'); localStorage.setItem('magic_lib_v1', t); } catch (e) {} }, TRICKS);
await p.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.log('FAIL:', n); } };

await p.goto('http://127.0.0.1:8099/#/'); await p.waitForTimeout(1300);
ok('mesa por defecto', await p.locator('#mesaWrap').count() === 1);
ok('6 cartas en la mesa', await p.locator('.mcard').count() === 6);
ok('switch de vista', await p.locator('.viewsw button').count() === 2);
await p.screenshot({ path: 'mesa-3d.png' });

// Arrastre: la cámara avanza
const before = await p.evaluate(() => document.getElementById('mesaCam').style.transform);
const mw = await p.locator('#mesaWrap').boundingBox();
await p.mouse.move(mw.x + 195, mw.y + 400);
await p.mouse.down();
for (let i = 1; i <= 8; i++) await p.mouse.move(mw.x + 195, mw.y + 400 - i * 30, { steps: 2 });
await p.mouse.up();
await p.waitForTimeout(400);
const after = await p.evaluate(() => document.getElementById('mesaCam').style.transform);
ok('la cámara se mueve al arrastrar', before !== after && /translate3d\(.*-?\d/.test(after));
await p.screenshot({ path: 'mesa-panned.png' });

// Tap (sin arrastre) navega al detalle — recarga real para resetear el paneo
await p.reload(); await p.waitForTimeout(1100);
const wrapBB = await p.locator('#mesaWrap').boundingBox();
const cardBB = await (async () => {
  const n = await p.locator('.mcard').count();
  for (let i = 0; i < n; i++) {
    const bb = await p.locator('.mcard').nth(i).boundingBox();
    if (bb && bb.y > wrapBB.y + 10 && bb.y + bb.height < wrapBB.y + wrapBB.height - 10 && bb.x > wrapBB.x) return bb;
  }
  return await p.locator('.mcard').first().boundingBox();
})();
await p.mouse.click(cardBB.x + cardBB.width / 2, cardBB.y + cardBB.height / 2);
await p.waitForTimeout(700);
const tapHash = await p.evaluate(() => location.hash);
console.log('  [dbg] hash tras tap:', tapHash, '| mcards:', await p.locator('.mcard').count(), '| bb:', JSON.stringify(cardBB));
ok('tap navega a detalle', tapHash.indexOf('#/truco/') === 0);
await p.goBack(); await p.waitForTimeout(700);

// Cambio a cuadrícula y persistencia
await p.click('#vwGrid'); await p.waitForTimeout(600);
ok('cuadrícula activa', await p.locator('.cards .card').count() === 6);
ok('persistido grid', await p.evaluate(() => localStorage.getItem('magic_view') === 'grid'));
await p.click('#vwMesa'); await p.waitForTimeout(600);
ok('vuelta a mesa', await p.locator('#mesaWrap').count() === 1);

// Búsqueda filtra la mesa
await p.fill('#q', 'lector'); await p.waitForTimeout(500);
ok('filtro en mesa', await p.locator('.mcard').count() === 1);
await p.fill('#q', ''); await p.waitForTimeout(500);

// Modo ligero: sin humo, sin mesa
await p.goto('http://127.0.0.1:8099/#/ajustes'); await p.waitForTimeout(900);
await p.click('#fxSeg [data-v="lite"]'); await p.waitForTimeout(400);
ok('canvas fx eliminado', await p.evaluate(() => !document.getElementById('fx')));
await p.goto('http://127.0.0.1:8099/#/'); await p.waitForTimeout(900);
ok('en ligero: cuadrícula', await p.locator('.cards .card').count() === 6 && await p.locator('#mesaWrap').count() === 0);
ok('en ligero: sin switch', await p.locator('.viewsw').count() === 0);
await p.screenshot({ path: 'mesa-lite.png' });

console.log('PASS', pass, 'FAIL', fail);
console.log('errores:', errs.length ? errs.join(' | ') : 'NONE');
await b.close();
process.exit(fail || errs.length ? 1 : 0);
