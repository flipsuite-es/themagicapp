import { chromium } from 'playwright';
import { STUB } from './stub.mjs';
const t1 = crypto.randomUUID(), t2 = crypto.randomUUID(), r1 = crypto.randomUUID(), g1 = crypto.randomUUID();
const T = JSON.stringify({
  tricks: [
    { id: t1, title: 'Carta Ambiciosa', category: 'Cartomagia', difficulty: 'medio', status: 'dominado', favorite: true, tags: [], meta: { duracion: '5 min', angulos: '360º' }, notes: 'Cuidado con el doble.', media: [], photos: [], createdAt: 1, updatedAt: 9 },
    { id: t2, title: 'Moneda Viajera', category: 'Monedas', difficulty: 'facil', status: 'dominado', favorite: false, tags: [], meta: {}, notes: 'Charla del banco.', media: [], photos: [], createdAt: 2, updatedAt: 8 }
  ],
  categories: ['Cartomagia', 'Monedas'],
  routines: [{ id: r1, name: 'Set de Bar', notes: 'Abrir fuerte.', trickIds: [t1, t2], createdAt: 1, updatedAt: 2 }],
  gigs: [{ id: g1, title: 'Boda Martínez', date: '2026-08-20', venue: 'Finca El Roble', client: 'Ana', fee: 450, status: 'confirmado', notes: '', trickIds: [t1], createdAt: 1, updatedAt: 2 }]
});
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block' })).newPage();
await p.addInitScript(t => { localStorage.setItem('magic_theme', 'dark'); localStorage.setItem('magic_social', '1'); localStorage.setItem('magic_lib_v1', t); }, T);
await p.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));
await p.goto('http://127.0.0.1:8099/#/'); await p.waitForTimeout(1000);
const shots = [['#/rutina/' + r1, 'ux2-rutina'], ['#/actuar/' + r1, 'ux2-actuar'], ['#/bolos', 'ux2-bolos'], ['#/publicar', 'ux2-publicar'], ['#/mago/u1', 'ux2-perfil']];
for (const [h, name] of shots) {
  await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(900);
  await p.screenshot({ path: `.shots/${name}.png` });
}
await b.close(); console.log('ok');
