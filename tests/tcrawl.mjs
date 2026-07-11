import { chromium } from 'playwright';
import { STUB } from './stub.mjs';
const mk = (t, c) => ({ id: crypto.randomUUID(), title: t, category: c, difficulty: 'medio', status: 'dominado', favorite: false, tags: [], meta: {}, notes: 'Notas', media: [], photos: [], createdAt: 1, updatedAt: 5 });
const tr = [mk('Alfa', 'Cartomagia'), mk('Beta', 'Mentalismo')];
const T = JSON.stringify({ tricks: tr, categories: ['Cartomagia', 'Mentalismo'], routines: [{ id: crypto.randomUUID(), title: 'Rutina Bar', items: [tr[0].id], notes: '', createdAt: 1, updatedAt: 2 }], gigs: [{ id: crypto.randomUUID(), title: 'Bolo Prueba', date: '2026-08-01', venue: 'Sala X', fee: 200, status: 'confirmado', notes: '', setlist: [], createdAt: 1, updatedAt: 2 }] });
const ROUTES = ['#/', '#/rutinas', '#/bolos', '#/comunidad', '#/clips', '#/siguiendo', '#/mercado', '#/mercado/l1', '#/mercado/l2', '#/mercado/l3', '#/vender', '#/publicar', '#/avisos', '#/mensajes', '#/guardados', '#/descubrir', '#/reto', '#/top', '#/ajustes', '#/cuenta', '#/estadisticas', '#/practica', '#/incluidos', '#/lector', '#/nuevo', '#/truco/' + tr[0].id, '#/mago/u1', '#/mago/u2', '#/pin', '#/noexiste'];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
let totalErrs = [];
for (const theme of ['dark', 'light']) {
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })).newPage();
  p.on('pageerror', e => totalErrs.push(`[${theme}] ${p.url().split('#')[1] || ''} → ${e.message}`));
  p.on('console', m => { if (m.type() === 'error' && !/net::|Failed to load resource|favicon/.test(m.text())) totalErrs.push(`[${theme}] console ${p.url().split('#')[1] || ''} → ${m.text().slice(0, 120)}`); });
  await p.addInitScript(([t, th]) => { localStorage.setItem('magic_theme', th); localStorage.setItem('magic_social', '1'); localStorage.setItem('magic_lib_v1', t); localStorage.setItem('magic_mesa_org', JSON.stringify({ hinted: true })); }, [T, theme]);
  await p.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));
  await p.goto('http://127.0.0.1:8099/#/'); await p.waitForTimeout(1200);
  for (const r of ROUTES) {
    await p.evaluate(h => { location.hash = h; }, r);
    await p.waitForTimeout(450);
    const empty = await p.evaluate(() => document.getElementById('view').innerHTML.trim().length < 40);
    if (empty) totalErrs.push(`[${theme}] ${r} → vista casi vacía`);
  }
  await p.close();
}
console.log(totalErrs.length ? totalErrs.join('\n') : 'CRAWL LIMPIO: 60 visitas sin errores');
await b.close();
process.exit(totalErrs.length ? 1 : 0);
