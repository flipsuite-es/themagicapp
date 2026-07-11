import { chromium } from 'playwright';
import { STUB } from './stub.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

// Onboarding: perfil aún sin estrenar
const p0 = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block' })).newPage();
await p0.addInitScript(() => { localStorage.setItem('magic_theme', 'dark'); localStorage.setItem('magic_social', '1'); });
await p0.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB.replace("onboarded:true", "onboarded:false") }));
await p0.goto('http://127.0.0.1:8099/#/comunidad'); await p0.waitForTimeout(1400);
await p0.screenshot({ path: '.shots/ux5-onboarding.png' });
await p0.close();

const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block' })).newPage();
await p.addInitScript(() => { localStorage.setItem('magic_theme', 'dark'); localStorage.setItem('magic_social', '1'); });
await p.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));
await p.goto('http://127.0.0.1:8099/#/'); await p.waitForTimeout(1000);
for (const [h, n] of [['#/avisos', 'ux5-avisos'], ['#/mensajes', 'ux5-mensajes'], ['#/clips', 'ux5-clips'], ['#/reto', 'ux5-reto'], ['#/top', 'ux5-top'], ['#/mago/u1', 'ux5-perfil']]) {
  await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(1000);
  await p.screenshot({ path: `.shots/${n}.png` });
}
await b.close(); console.log('ok');
