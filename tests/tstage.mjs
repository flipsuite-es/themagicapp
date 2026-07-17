/* Fidelidad visual de la actuación: full-bleed desde y=0, sin franja beige,
   sin cero inicial (por defecto), sin scroll, estable al reabrir. */
import { chromium } from 'playwright';
import { STUB } from './stub.mjs';
const WP = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="80"><rect width="40" height="80" fill="#1b74b8"/></svg>').toString('base64');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: 'block' });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.clock.install({ time: new Date('2026-07-17T02:48:00') });
await p.addInitScript((wp) => {
  localStorage.setItem('magic_theme', 'light'); // el tema claro es el caso beige
  localStorage.setItem('magic_social', '1');
  localStorage.setItem('magic_pl_cfg', JSON.stringify({ wallpaper: wp, carrier: 'DIGI ES', h24: true, pinLen: 6, method: 'manual' }));
}, WP);
await p.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));
await p.goto('http://127.0.0.1:8099/#/desbloqueo-actuar'); await p.waitForTimeout(1200);
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.log('FAIL:', n); } };

async function checks(tag) {
  const m = await p.evaluate(() => {
    const st = document.getElementById('plStage');
    const rs = st ? st.getBoundingClientRect() : null;
    const lock = st ? st.querySelector('.ios-lock').getBoundingClientRect() : null;
    const bot = st ? st.querySelector('.ios-bottom').getBoundingClientRect() : null;
    const ck = st ? st.querySelector('.ios-clock') : null;
    const mask = ck ? (getComputedStyle(ck).webkitMaskImage || getComputedStyle(ck).maskImage) : '';
    const glyphs = mask ? (decodeURIComponent(mask).match(/<g /g) || []).length : 0;
    const theme = document.querySelector('meta[name="theme-color"]').getAttribute('content');
    return { rs, lock, bot, glyphs, theme,
      performing: document.body.classList.contains('performing'),
      bodyBg: getComputedStyle(document.body).backgroundColor,
      scrollH: document.scrollingElement.scrollHeight, innerH: window.innerHeight };
  });
  ok(tag + ': stage en 0,0', m.rs && Math.abs(m.rs.top) < 0.5 && Math.abs(m.rs.left) < 0.5);
  ok(tag + ': stage 100% viewport', m.rs && Math.round(m.rs.width) === 393 && Math.round(m.rs.height) === 852);
  ok(tag + ': wallpaper full-bleed desde y=0', m.lock && Math.abs(m.lock.top) < 0.5 && Math.round(m.lock.height) === 852);
  ok(tag + ': cromo negro (clase performing)', m.performing);
  ok(tag + ': theme-color negro en actuación', m.theme === '#000000');
  ok(tag + ': body negro, no beige', m.bodyBg === 'rgb(0, 0, 0)');
  ok(tag + ': sin scroll', m.scrollH <= m.innerH + 1);
  ok(tag + ': reloj 2:48 SIN cero inicial (4 glifos)', m.glyphs === 4);
  ok(tag + ': botones dentro del viewport (safe area inferior)', m.bot && m.bot.bottom <= 852);
  // franja superior: el píxel (5,5) del render debe ser oscuro (wallpaper), no beige
  const shot = (await p.screenshot({ clip: { x: 0, y: 0, width: 30, height: 12 } })).toString('base64');
  const px = await p.evaluate(async (b64) => {
    const im = new Image(); await new Promise(r => { im.onload = r; im.src = 'data:image/png;base64,' + b64; });
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
    const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0);
    const d = cx.getImageData(10, 10, 1, 1).data; return [d[0], d[1], d[2]];
  }, shot);
  ok(tag + ': píxel superior sin franja beige (r<200)', px[0] < 200);
}
await checks('A instalación');
// PRUEBA C: reapertura — mismo viewport, sin saltos ni fondo de carga distinto
await p.reload(); await p.waitForTimeout(1200);
await checks('C reapertura');
// al salir de la actuación se restaura el cromo normal
await p.evaluate(() => { location.hash = '#/desbloqueo'; }); await p.waitForTimeout(700);
const rest = await p.evaluate(() => ({ performing: document.body.classList.contains('performing'), theme: document.querySelector('meta[name="theme-color"]').getAttribute('content') }));
ok('salida: cromo restaurado', !rest.performing && rest.theme !== '#000000');
// contrato del wrapper nativo: el standalone lleva las metas correctas
import { readFileSync } from 'fs';
const st = readFileSync(new URL('../the-magic-app.standalone.html', import.meta.url), 'utf8');
ok('standalone: apple-mobile-web-app-status-bar-style black-translucent', st.includes('black-translucent'));
ok('standalone: viewport-fit=cover', st.includes('viewport-fit=cover'));
ok('standalone: theme-color sincronizado (no beige antiguo)', !st.includes('content="#f5f1e8"'));
ok('sin errores JS', errs.length === 0);
console.log('PASS', pass, 'FAIL', fail);
process.exit(fail ? 1 : 0);
