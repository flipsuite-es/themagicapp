import { chromium } from 'playwright';
import { STUB } from './stub.mjs';

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push('PAGEERR: ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
await p.addInitScript(() => { try { localStorage.setItem('magic_theme', 'dark'); localStorage.setItem('magic_social', '1'); } catch (e) {} });
await p.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; } else { fail++; console.log('FAIL:', name); } };

await p.goto('http://127.0.0.1:8099/#/mercado'); await p.waitForTimeout(900);
ok('3 tarjetas', await p.locator('.listcard').count() === 3);
ok('chips de filtro', await p.locator('#mkFilter .chip').count() === 3);
ok('badge Físico en l2', (await p.locator('.listcard[data-l="l2"] .lc-tag').textContent()) === 'Físico');
ok('badge Agotado en l3', (await p.locator('.listcard[data-l="l3"] .lc-tag').textContent()) === 'Agotado');
ok('envío en tarjeta l2', (await p.locator('.listcard[data-l="l2"] .ship').textContent()).includes('envío'));
ok('sin badge en digital', await p.locator('.listcard[data-l="l1"] .lc-tag').count() === 0);
await p.click('#mkFilter .chip[data-f="physical"]'); await p.waitForTimeout(200);
ok('filtro físico → 2', await p.locator('#mkGrid .listcard').count() === 2);
await p.click('#mkFilter .chip[data-f="digital"]'); await p.waitForTimeout(200);
ok('filtro digital → 1', await p.locator('#mkGrid .listcard').count() === 1);

await p.goto('http://127.0.0.1:8099/#/mercado/l2'); await p.waitForTimeout(700);
let meta = await p.locator('.li-meta').textContent();
ok('meta envía desde', meta.includes('Envía desde España'));
ok('meta stock', meta.includes('Quedan 3'));
ok('botón Comprar', (await p.locator('.li-buy .btn').textContent()) === 'Comprar');

await p.goto('http://127.0.0.1:8099/#/mercado/l3'); await p.waitForTimeout(700);
const buyBtn = p.locator('.li-buy .btn');
ok('botón Agotado deshabilitado', (await buyBtn.textContent()) === 'Agotado' && await buyBtn.isDisabled());

await p.goto('http://127.0.0.1:8099/#/vender'); await p.waitForTimeout(700);
await p.click('#slType [data-v="physical"]'); await p.waitForTimeout(150);
ok('bloque físico visible', await p.locator('#slPhys').isVisible());
await p.fill('#slTitle', 'Cubiletes de cobre');
await p.fill('#slStock', '2');
await p.click('#slShipSeg [data-v="paid"]');
await p.fill('#slShip', '6,00');
await p.fill('#slFrom', 'Argentina');
await p.click('#slCond [data-v="usado"]');
await p.click('#slDisc .chip[data-d="closeup"]');
await p.fill('#slAmount', '120');
await p.click('#slPublish'); await p.waitForTimeout(500);
const created = await p.evaluate(() => window.__created);
ok('createListing físico completo', created && created.listing.item_type === 'physical' && created.listing.stock === 2 && created.listing.ship_cost_cents === 600 && created.listing.ships_from === 'Argentina' && created.listing.condition === 'usado' && created.listing.discipline === 'closeup' && created.listing.price_cents === 12000 && created.content === null);

console.log('PASS', pass, 'FAIL', fail);
console.log(errs.length ? errs.join('\n') : 'no-errors');
await b.close();
process.exit(fail || errs.length ? 1 : 0);
