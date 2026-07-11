// Compatibilidad offline: tras una visita, la app debe arrancar sin red
// gracias al service worker (aquí NO se bloquea el SW: es el protagonista).
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.log('FAIL:', n); } };
await p.goto('http://127.0.0.1:8099/'); await p.waitForTimeout(2500); // deja instalar el SW
const swReady = await p.evaluate(() => navigator.serviceWorker.getRegistration().then(r => !!(r && r.active)));
ok('service worker activo', swReady);
await ctx.setOffline(true);
await p.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
await p.waitForTimeout(1500);
const body = await p.evaluate(() => document.body.innerText.slice(0, 80));
ok('shell servido sin red', body.length > 10);
console.log('  offline body:', JSON.stringify(body.slice(0, 50)));
await ctx.setOffline(false);
console.log('PASS', pass, 'FAIL', fail);
await b.close();
process.exit(fail ? 1 : 0);
