import { chromium } from 'playwright';
import { STUB } from './stub.mjs';
const ids = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
const names = ['Alfa', 'Beta', 'Gamma', 'Delta'];
const T = JSON.stringify({ tricks: ids.map((id, i) => ({ id, title: names[i], category: 'Cartomagia', difficulty: 'medio', status: 'dominado', favorite: false, tags: [], meta: {}, notes: '', media: [], photos: [], createdAt: i, updatedAt: 100 - i })), categories: ['Cartomagia'], routines: [], gigs: [] });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(t => { localStorage.setItem('magic_theme', 'dark'); localStorage.setItem('magic_social', '1'); localStorage.setItem('magic_lib_v1', t); if (!localStorage.getItem('magic_mesa_org')) localStorage.setItem('magic_mesa_org', JSON.stringify({ hinted: true })); }, T);
await p.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.log('FAIL:', n); } };
const dragTo = async (fromBB, tx, ty) => {
  await p.mouse.move(fromBB.x + fromBB.width / 2, fromBB.y + fromBB.height / 2);
  await p.mouse.down(); await p.waitForTimeout(430);
  await p.mouse.move(tx, ty, { steps: 8 });
  await p.mouse.up(); await p.waitForTimeout(350);
};
const visibleBB = async (name) => {
  const w = await p.locator('#mesaWrap').boundingBox();
  const bb = await p.locator(`.mcard[aria-label="${name}"]`).boundingBox();
  return { w, bb };
};

await p.goto('http://127.0.0.1:8099/#/'); await p.waitForSelector('.mcard'); await p.waitForTimeout(1400);

// Apila: Alfa sobre Beta, y luego Gamma sobre ambas
let v = await visibleBB('Beta');
const target = { x: v.bb.x + v.bb.width / 2, y: v.bb.y + v.bb.height / 2 };
v = await visibleBB('Alfa');
await dragTo(v.bb, target.x, target.y - 8);
v = await visibleBB('Gamma');
await dragTo(v.bb, target.x + 10, target.y + 6);

const orderNow = await p.evaluate(() => [...document.querySelectorAll('.mcard')].map(m => m.getAttribute('aria-label')));
console.log('  orden DOM tras apilar:', JSON.stringify(orderNow));
ok('Gamma la última (encima)', orderNow[orderNow.length - 1] === 'Gamma');
await p.waitForTimeout(400);
const topNow = await p.evaluate(([x, y]) => { const el = document.elementFromPoint(x, y); const mc = el && el.closest('.mcard'); return { top: mc && mc.getAttribute('aria-label'), raw: el && (el.className.baseVal !== undefined ? 'svg.' + el.className.baseVal : el.className) }; }, [target.x + 5, target.y]);
console.log('  elementFromPoint vivo:', JSON.stringify(topNow));
ok('elementFromPoint = Gamma', topNow.top === 'Gamma');

// RECARGA: el montón debe reconstruirse idéntico
await p.reload(); await p.waitForSelector('.mcard'); await p.waitForTimeout(1500);
const orderAfter = await p.evaluate(() => [...document.querySelectorAll('.mcard')].map(m => m.getAttribute('aria-label')));
console.log('  orden DOM tras recargar:', JSON.stringify(orderAfter));
ok('apilado persistido: Gamma sigue encima', orderAfter[orderAfter.length - 1] === 'Gamma');
ok('Alfa sigue sobre Beta', orderAfter.indexOf('Alfa') > orderAfter.indexOf('Beta'));
await p.waitForTimeout(900);
const topAfter = await p.evaluate(([x, y]) => { const el = document.elementFromPoint(x, y); const mc = el && el.closest('.mcard'); return { top: mc && mc.getAttribute('aria-label'), raw: el && (el.className.baseVal !== undefined ? 'svg' : String(el.className).slice(0, 24)) }; }, [target.x + 5, target.y]);
console.log('  elementFromPoint tras recarga:', JSON.stringify(topAfter));
ok('tacto: la de encima recibe el toque', topAfter.top === 'Gamma');
await p.screenshot({ path: 'stack-after-reload.png', clip: { x: 0, y: 560, width: 390, height: 284 } });

console.log('PASS', pass, 'FAIL', fail);
console.log('errores:', errs.length ? errs.join(' | ') : 'NONE');
await b.close();
process.exit(fail || errs.length ? 1 : 0);
