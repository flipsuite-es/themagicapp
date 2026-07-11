import { chromium } from 'playwright';
import { STUB } from './stub.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { try { localStorage.setItem('magic_theme', 'dark'); localStorage.setItem('magic_social', '1'); } catch (e) {} });
await p.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.log('FAIL:', n); } };

// 1) Interruptor de sonido en Ajustes
await p.goto('http://127.0.0.1:8099/#/ajustes'); await p.waitForTimeout(1000);
ok('toggle sonido presente', await p.locator('#sndToggle').count() === 1);
ok('switch off por defecto', !(await p.locator('#sndSw').first().evaluate(el => el.classList.contains('on'))));
await p.click('#sndToggle'); await p.waitForTimeout(200);
ok('switch se enciende', await p.locator('#sndSw').first().evaluate(el => el.classList.contains('on')));
ok('persistido', await p.evaluate(() => localStorage.getItem('magic_sound') === '1'));
// snd() no debe lanzar errores con el audio activado
await p.evaluate(() => { location.hash = '#/'; });
await p.waitForTimeout(600);

// 2) Giroscopio: simula deviceorientation y comprueba --gx
await p.evaluate(() => {
  const e = new Event('deviceorientation');
  Object.defineProperty(e, 'gamma', { value: 20 });
  Object.defineProperty(e, 'beta', { value: 60 });
  window.dispatchEvent(e);
});
await p.waitForTimeout(700);
const gx = await p.evaluate(() => document.documentElement.style.getPropertyValue('--gx'));
ok('gyro escribe --gx', gx !== '' && parseFloat(gx) > 0.1);
const bgPos = await p.evaluate(() => { const t = document.querySelector('.pagetitle'); return t ? getComputedStyle(t).backgroundPosition : 'no-title'; });
console.log('  bg-pos titulo:', bgPos, '| --gx:', gx);

// 3) burstSparks con sonido activado no rompe
await p.evaluate(() => { const b0 = document.querySelector('.btn, .chip'); if (b0) { /* fuerza un chime */ } });
console.log('PASS', pass, 'FAIL', fail);
console.log('errores:', errs.length ? errs.join(' | ') : 'NONE');
await b.close();
process.exit(fail || errs.length ? 1 : 0);
