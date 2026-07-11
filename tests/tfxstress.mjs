import { chromium } from 'playwright';
import { STUB } from './stub.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { localStorage.setItem('magic_theme', 'dark'); localStorage.setItem('magic_social', '1'); });
await p.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.log('FAIL:', n); } };

await p.goto('http://127.0.0.1:8099/#/ajustes'); await p.waitForTimeout(1100);
// alternar efectos 6 veces: nunca más de un canvas
for (let i = 0; i < 6; i++) {
  await p.click(`#fxSeg [data-v="${i % 2 ? 'full' : 'lite'}"]`);
  await p.waitForTimeout(120);
}
await p.click('#fxSeg [data-v="full"]'); await p.waitForTimeout(300);
ok('un solo canvas tras 7 toggles', await p.evaluate(() => document.querySelectorAll('#fx').length) === 1);

// sonido: activar y disparar 30 sonidos seguidos sin errores
await p.click('#sndToggle'); await p.waitForTimeout(150);
await p.evaluate(() => new Promise(res => {
  let i = 0;
  const iv = setInterval(() => {
    const btn = document.querySelector('.setrow');
    btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    location.hash = i % 2 ? '#/ajustes' : '#/cuenta';
    if (++i >= 30) { clearInterval(iv); res(); }
  }, 30);
}));
await p.waitForTimeout(800);
ok('30 sonidos sin excepción', errs.length === 0);
console.log('PASS', pass, 'FAIL', fail, '| errores:', errs.join(' | ') || 'NONE');
await b.close();
process.exit(fail || errs.length ? 1 : 0);
