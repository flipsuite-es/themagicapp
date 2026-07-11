// Flujos de datos críticos de punta a punta: crear truco, PIN completo,
// exportar → borrar → importar (integridad de copia), rutina, bolo y práctica.
import { chromium } from 'playwright';
import { STUB } from './stub.mjs';
import { writeFileSync } from 'fs';
const mk = (t, c) => ({ id: crypto.randomUUID(), title: t, category: c, difficulty: 'medio', status: 'dominado', favorite: false, tags: [], meta: {}, notes: '', media: [], photos: [], createdAt: 1, updatedAt: 5 });
const seeds = [mk('Semilla Uno', 'Cartomagia'), mk('Semilla Dos', 'Mentalismo')];
seeds[1].status = 'aprendiendo'; // dueTricks solo repasa lo que está en aprendizaje
const T = JSON.stringify({ tricks: seeds, categories: ['Cartomagia', 'Mentalismo'], routines: [], gigs: [] });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', acceptDownloads: true });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
p.on('dialog', d => d.accept());
await p.addInitScript(t => {
  localStorage.setItem('magic_theme', 'dark'); localStorage.setItem('magic_social', '1');
  if (!localStorage.getItem('magic_lib_v1')) localStorage.setItem('magic_lib_v1', t);
}, T);
await p.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.log('FAIL:', n); } };
const tapPin = async (digits) => { for (const d of digits) await p.click(`.keypad [data-k="${d}"]`); };

// 1) Crear truco desde el formulario real
await p.goto('http://127.0.0.1:8099/#/nuevo'); await p.waitForTimeout(1100);
await p.fill('#fTitle', 'Truco E2E');
await p.fill('#fCat', 'Cartomagia');
await p.click('#saveBtn'); await p.waitForTimeout(600);
ok('crear truco navega al detalle', (await p.evaluate(() => location.hash)).startsWith('#/truco/'));
const libCount = await p.evaluate(() => JSON.parse(localStorage.getItem('magic_lib_v1')).tricks.length);
ok('truco persistido (3 en total)', libCount === 3);

// 2) Rutina
await p.goto('http://127.0.0.1:8099/#/rutina-nueva'); await p.waitForTimeout(800);
await p.fill('#rName', 'Rutina de Bar E2E');
await p.click('#rSave'); await p.waitForTimeout(600);
ok('rutina creada', await p.evaluate(() => JSON.parse(localStorage.getItem('magic_lib_v1')).routines.length === 1));

// 3) Bolo
await p.goto('http://127.0.0.1:8099/#/bolo-nuevo'); await p.waitForTimeout(800);
const gName = await p.locator('#gName, #gClient').first();
await gName.fill('Sala Prueba');
await p.fill('#gDate', '2026-09-01');
await p.click('#gSave'); await p.waitForTimeout(600);
ok('bolo creado', await p.evaluate(() => JSON.parse(localStorage.getItem('magic_lib_v1')).gigs.length === 1));

// 4) Práctica: marcar hecho
await p.goto('http://127.0.0.1:8099/#/practica'); await p.waitForTimeout(800);
const doneBtn = p.locator('[data-done]').first();
if (await doneBtn.count()) {
  const did = await doneBtn.getAttribute('data-done');
  await doneBtn.click();
  let reps = 0;
  for (let i = 0; i < 10 && !reps; i++) {
    await p.waitForTimeout(200);
    reps = await p.evaluate(id0 => {
      const t = JSON.parse(localStorage.getItem('magic_lib_v1')).tricks.find(x => x.id === id0);
      return (t && t.practice && t.practice.reps) || 0;
    }, did);
  }
  ok('práctica registrada', reps >= 1);
} else ok('práctica registrada', false);

// 5) Exportar → borrar todo → importar (integridad)
await p.goto('http://127.0.0.1:8099/#/ajustes'); await p.waitForTimeout(900);
const [download] = await Promise.all([p.waitForEvent('download'), p.click('#exportBtn')]);
const path = await download.path();
ok('exportación descargada', !!path);
await p.click('#wipeBtn'); await p.waitForTimeout(700); // confirm auto-aceptado
ok('borrado total', await p.evaluate(() => JSON.parse(localStorage.getItem('magic_lib_v1')).tricks.length === 0));
await p.goto('http://127.0.0.1:8099/#/ajustes'); await p.waitForTimeout(700);
await p.setInputFiles('#importFile', path); await p.waitForTimeout(800);
const restored = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('magic_lib_v1')); return { t: s.tricks.length, r: s.routines.length, g: s.gigs.length }; });
ok('importación íntegra (3 trucos, 1 rutina, 1 bolo)', restored.t === 3 && restored.r === 1 && restored.g === 1);

// 6) PIN completo: crear, recargar (bloqueo), PIN malo, PIN bueno
await p.goto('http://127.0.0.1:8099/#/pin'); await p.waitForTimeout(800);
await tapPin('1234'); await p.waitForTimeout(400);
await tapPin('1234'); await p.waitForTimeout(700);
ok('PIN activado', await p.evaluate(() => !!localStorage.getItem('magic_pin')));
await p.reload(); await p.waitForTimeout(1300);
ok('bloqueado al recargar', await p.locator('#lockScreen').count() === 1);
await tapPin('9999'); await p.waitForTimeout(600);
ok('PIN malo rechazado', await p.locator('#lockScreen').count() === 1);
await tapPin('1234'); await p.waitForTimeout(1500);
ok('PIN bueno desbloquea', await p.locator('#lockScreen').count() === 0 && (await p.evaluate(() => document.getElementById('view').innerText)).length > 40);

console.log('PASS', pass, 'FAIL', fail);
console.log('errores:', errs.length ? errs.join(' | ') : 'NONE');
await b.close();
process.exit(fail || errs.length ? 1 : 0);
