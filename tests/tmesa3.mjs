import { chromium } from 'playwright';
import { STUB } from './stub.mjs';
const mk = (t, c, extra) => Object.assign({ id: crypto.randomUUID(), title: t, category: c, difficulty: 'medio', status: 'dominado', favorite: false, tags: [], meta: {}, notes: '', media: [], photos: [], createdAt: 1, updatedAt: 5 }, extra || {});
const tricks = [
  mk('Con Miniatura', 'Cartomagia', { media: [{ provider: 'youtube', embed: 'https://www.youtube.com/embed/x', url: 'u', thumb: 'https://i.ytimg.com/vi/x/hqdefault.jpg' }] }),
  mk('Sin Miniatura', 'Mentalismo'), mk('Tercero', 'Monedas'), mk('Cuarto', 'Escenario')
];
const T = JSON.stringify({ tricks, categories: ['Cartomagia'], routines: [], gigs: [] });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block' })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
p.on('dialog', d => d.type() === 'prompt' ? d.accept('Bolos') : d.accept());
await p.addInitScript(t => { localStorage.setItem('magic_theme', 'dark'); localStorage.setItem('magic_social', '1'); localStorage.setItem('magic_lib_v1', t); }, T);
await p.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));
await p.route('**/i.ytimg.com/**', r => r.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mPcv2//fwAJhAPHTa5JEQAAAABJRU5ErkJggg==', 'base64') }));

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.log('FAIL:', n); } };

await p.goto('http://127.0.0.1:8099/#/'); await p.waitForSelector('.mcard'); await p.waitForTimeout(1500);
// 1) miniatura real en la carta
ok('miniatura en carta', await p.locator('.mcard img.mc-img').count() === 1);
ok('grabado en las demás', await p.locator('.mcard .mc-med').count() === 3);
ok('hint visible primera vez', await p.locator('#mesaHint').count() === 1);
ok('raíl con botón +', await p.locator('#railAdd').count() === 1);


async function visibleCard() {
  const w = await p.locator('#mesaWrap').boundingBox();
  const n2 = await p.locator('.mcard').count();
  for (let i = 0; i < n2; i++) {
    const c = await p.locator('.mcard').nth(i).boundingBox();
    if (c && c.y > w.y + 20 && c.y + c.height < w.y + w.height - 130) return c;
  }
  return await p.locator('.mcard').first().boundingBox();
}
// 2) mover una carta (long-press + drag) y persistir
const wrapBB = await p.locator('#mesaWrap').boundingBox();
let bb = null, idx = -1; const n = await p.locator('.mcard').count();
for (let i = 0; i < n; i++) {
  const c = await p.locator('.mcard').nth(i).boundingBox();
  if (c && c.y > wrapBB.y + 20 && c.y + c.height < wrapBB.y + wrapBB.height - 120) { bb = c; idx = i; break; }
}
const movedId = await p.locator('.mcard').nth(idx).getAttribute('data-id');
await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
await p.mouse.down();
await p.waitForTimeout(450); // long-press
ok('modo arrastre activo', await p.locator('.mc-in.drag').count() === 1);
await p.mouse.move(bb.x + bb.width / 2 + 60, bb.y + bb.height / 2 - 50, { steps: 6 });
await p.mouse.up();
await p.waitForTimeout(300);
const org1 = await p.evaluate(() => JSON.parse(localStorage.getItem('magic_mesa_org') || '{}'));
ok('posición persistida', org1.pos && !!org1.pos[movedId]);

// 3) crear un cajón
await p.click('#railAdd'); await p.waitForTimeout(500);
ok('cajón creado', await p.locator('.rail-slot[data-drawer]').count() === 1);
ok('nombre Bolos', (await p.locator('.rail-slot .rs-name').first().textContent()) === 'Bolos');

// 4) guardar una carta en el cajón (long-press + drop sobre el raíl)
const railBB = await p.locator('.rail-slot[data-drawer]').first().boundingBox();
const bb2 = await visibleCard();
await p.mouse.move(bb2.x + bb2.width / 2, bb2.y + bb2.height / 2);
await p.mouse.down(); await p.waitForTimeout(450);
await p.mouse.move(railBB.x + railBB.width / 2, railBB.y + railBB.height / 2, { steps: 8 });
await p.waitForTimeout(150);
await p.mouse.up(); await p.waitForTimeout(500);
const org2 = await p.evaluate(() => JSON.parse(localStorage.getItem('magic_mesa_org') || '{}'));
ok('carta asignada al cajón', Object.keys(org2.items || {}).length === 1);
ok('mesa con 3 cartas', await p.locator('.mcard').count() === 3);
ok('contador del cajón = 1', (await p.locator('.rail-slot .rs-count').first().textContent()) === '1');

// 5) abrir el cajón
await p.click('.rail-slot[data-drawer]'); await p.waitForTimeout(600);
ok('dentro del cajón: 1 carta', await p.locator('.mcard').count() === 1);
ok('slot volver a mesa', await p.locator('.rail-slot.back').count() === 1);
ok('herramientas renombrar/eliminar', await p.locator('#railRen').count() === 1 && await p.locator('#railDel').count() === 1);
await p.screenshot({ path: 'm3-drawer.png' });

// 6) devolver la carta a la mesa arrastrándola al slot Mesa
const backBB = await p.locator('.rail-slot.back').boundingBox();
const bb3 = await visibleCard();
await p.mouse.move(bb3.x + bb3.width / 2, bb3.y + bb3.height / 2);
await p.mouse.down(); await p.waitForTimeout(450);
await p.mouse.move(backBB.x + backBB.width / 2, backBB.y + backBB.height / 2, { steps: 8 });
await p.waitForTimeout(150);
await p.mouse.up(); await p.waitForTimeout(500);
const org3 = await p.evaluate(() => JSON.parse(localStorage.getItem('magic_mesa_org') || '{}'));
ok('carta devuelta', Object.keys(org3.items || {}).length === 0);

// 7) salir del cajón y eliminar
await p.click('.rail-slot.back'); await p.waitForTimeout(500);
ok('de vuelta: 4 cartas', await p.locator('.mcard').count() === 4);
await p.click('.rail-slot[data-drawer]'); await p.waitForTimeout(400);
await p.click('#railDel'); await p.waitForTimeout(500);
ok('cajón eliminado', await p.locator('.rail-slot[data-drawer]').count() === 0);

await p.screenshot({ path: 'm3-final.png' });
console.log('PASS', pass, 'FAIL', fail);
console.log('errores:', errs.length ? errs.join(' | ') : 'NONE');
await b.close();
process.exit(fail || errs.length ? 1 : 0);
