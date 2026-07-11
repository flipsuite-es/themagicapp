import { chromium } from 'playwright';
import { STUB } from './stub.mjs';
const mk = (t, c, st) => ({ id: crypto.randomUUID(), title: t, category: c, difficulty: 'medio', status: st || 'dominado', favorite: false, tags: ['ambiciosa', 'mesa'], meta: { angulos: 'Rodeado 360º', duracion: '5 min' }, notes: 'Preparación: baraja en orden. El público no debe ver el doble.', media: [], photos: [], createdAt: 1, updatedAt: 5 });
const seeds = [mk('Carta Ambiciosa', 'Cartomagia'), mk('Lector', 'Mentalismo', 'aprendiendo')];
const T = JSON.stringify({ tricks: seeds, categories: ['Cartomagia', 'Mentalismo'], routines: [], gigs: [] });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

// 1) GATE (sin sesión): cloud real sin red → puerta de entrada
const p0 = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block' })).newPage();
await p0.addInitScript(() => { localStorage.setItem('magic_theme', 'dark'); });
await p0.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: 'window.Cloud={available:function(){return true},currentUser:function(){return Promise.resolve(null)},onChange:function(){}};' }));
await p0.goto('http://127.0.0.1:8099/#/'); await p0.waitForTimeout(1200);
await p0.screenshot({ path: 'ux-gate.png' });
await p0.close();

const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block' })).newPage();
await p.addInitScript(t => { localStorage.setItem('magic_theme', 'dark'); localStorage.setItem('magic_social', '1'); localStorage.setItem('magic_lib_v1', t); }, T);
await p.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));
await p.goto('http://127.0.0.1:8099/#/'); await p.waitForTimeout(1100);
await p.screenshot({ path: 'ux-biblio.png' });
await p.evaluate(([id]) => { location.hash = '#/truco/' + id; }, [seeds[0].id]); await p.waitForTimeout(900);
await p.screenshot({ path: 'ux-detalle.png', fullPage: false });
await p.evaluate(() => { location.hash = '#/nuevo'; }); await p.waitForTimeout(800);
await p.screenshot({ path: 'ux-form.png' });
await p.evaluate(() => { location.hash = '#/practica'; }); await p.waitForTimeout(800);
await p.screenshot({ path: 'ux-practica.png' });
await p.evaluate(() => { location.hash = '#/stats'; }); await p.waitForTimeout(900);
await p.screenshot({ path: 'ux-stats.png' });
await p.evaluate(() => { location.hash = '#/rutinas'; }); await p.waitForTimeout(800);
await p.screenshot({ path: 'ux-rutinas.png' });
await b.close(); console.log('shots ok');
