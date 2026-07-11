import { chromium } from 'playwright';
import { STUB } from './stub.mjs';
const LONG = 'El Increíble Truco De La Carta Ambiciosa Que Atraviesa Tres Barajas 🃏✨ Mientras El Público No Puede Creer Lo Que Ven Sus Ojos';
const T = JSON.stringify({ tricks: [{ id: crypto.randomUUID(), title: LONG, category: 'Grandes Ilusiones De Escenario Con Fuego', difficulty: 'dificil', status: 'aprendiendo', favorite: true, tags: [], meta: {}, notes: '', media: [], photos: [], createdAt: 1, updatedAt: 9 }], categories: ['Grandes Ilusiones De Escenario Con Fuego'], routines: [], gigs: [] });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })).newPage();
await p.addInitScript(t => { localStorage.setItem('magic_theme', 'dark'); localStorage.setItem('magic_social', '1'); localStorage.setItem('magic_lib_v1', t); }, T);
await p.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));
for (const route of ['#/', '#/mercado', '#/comunidad']) {
  await p.goto('http://127.0.0.1:8099/' + route); await p.waitForTimeout(1300);
  const bad = await p.evaluate(() => {
    const app = document.querySelector('.app');
    const out = { sw: app.scrollWidth, cw: app.clientWidth, off: [] };
    const W = app.clientWidth;
    document.querySelectorAll('.app *').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.right > W + 2 && r.width > 4 && !el.closest('.chips') && !el.closest('.mesa')) {
        out.off.push((el.className && String(el.className).slice(0, 40)) + ' → right ' + Math.round(r.right) + ' w' + Math.round(r.width));
      }
    });
    return { ...out, off: out.off.slice(0, 8) };
  });
  console.log(route, JSON.stringify(bad, null, 1));
}
await b.close();
