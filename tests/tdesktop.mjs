// Compatibilidad de anchos grandes: la barra lateral de escritorio, grids y
// cabeceras no deben romper a 768/1024/1440. Además: sin scroll horizontal.
import { chromium } from 'playwright';
import { STUB } from './stub.mjs';
const mk = (t, c) => ({ id: crypto.randomUUID(), title: t, category: c, difficulty: 'medio', status: 'dominado', favorite: false, tags: [], meta: {}, notes: '', media: [], photos: [], createdAt: 1, updatedAt: 5 });
const T = JSON.stringify({ tricks: [mk('Alfa', 'Cartomagia'), mk('Beta', 'Mentalismo'), mk('Gamma', 'Monedas'), mk('Delta', 'Escenario')], categories: ['Cartomagia'], routines: [], gigs: [] });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) pass++; else { fail++; console.log('FAIL:', n, x || ''); } };
for (const [w, h] of [[768, 1024], [1024, 768], [1440, 900]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(t => { localStorage.setItem('magic_theme', 'dark'); localStorage.setItem('magic_social', '1'); localStorage.setItem('magic_lib_v1', t); }, T);
  await p.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));
  for (const route of ['#/', '#/comunidad', '#/mercado', '#/ajustes']) {
    await p.goto('http://127.0.0.1:8099/' + route); await p.waitForTimeout(900);
    const m = await p.evaluate(() => {
      const app = document.querySelector('.app');
      const tb = document.querySelector('.tabbar');
      return { hs: app.scrollWidth > app.clientWidth + 1, tabbar: !!tb && tb.getBoundingClientRect().width > 0, cards: document.querySelectorAll('.card, .listcard, .postcard, .setrow').length };
    });
    ok(`${w}px ${route} sin scroll-H`, !m.hs);
    ok(`${w}px ${route} tabbar visible`, m.tabbar);
  }
  if (w === 1440) { await p.goto('http://127.0.0.1:8099/#/'); await p.waitForTimeout(800); await p.screenshot({ path: '.shots/desktop-1440.png' }); }
  ok(`${w}px sin errores`, errs.length === 0, errs[0]);
  await p.close();
}
await b.close();
console.log('PASS', pass, 'FAIL', fail);
process.exit(fail ? 1 : 0);
