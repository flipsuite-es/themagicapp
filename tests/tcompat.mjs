// Linter de compatibilidad: reglas estáticas que protegen la base de
// navegadores (iOS Safari 15.4+ / Chrome 100+). Sin navegador: puro análisis.
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(ROOT, 'styles.css'), 'utf8');
// Solo NUESTRO código exige ES5; supabase.js/tus.js son vendored (ES2017,
// Safari 11+: muy por debajo de la base iOS 15.4 — aceptable).
const js = ['app.js', 'cloud.js'].map(f => [f, readFileSync(join(ROOT, f), 'utf8')]);
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const swSrc = readFileSync(join(ROOT, 'sw.js'), 'utf8');
const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));

let pass = 0, fail = 0;
const ok = (n, c, extra) => { if (c) pass++; else { fail++; console.log('FAIL:', n, extra || ''); } };

// 1) Safari <18 solo entiende backdrop-filter con prefijo: paridad exacta
const wk = (css.match(/-webkit-backdrop-filter:/g) || []).length;
const std = (css.match(/(?<!-webkit-)backdrop-filter:/g) || []).length;
ok('backdrop-filter con gemelo -webkit-', wk === std, `webkit=${wk} std=${std}`);

// 2) dvh siempre con fallback vh en la misma regla
for (const line of css.split('\n')) {
  if (line.includes('dvh') && !line.trim().startsWith('/*')) ok('dvh con fallback vh: ' + line.trim().slice(0, 40), line.includes('vh') && line.indexOf('100vh') !== -1 || /min-height:[^;]*100vh/.test(line));
}

// 3) Variables troncales con fallback estático pre-color-mix
ok('--hairline fallback rgba', /--hairline:\s*rgba\(/.test(css));
ok('--foil fallback estático', /--foil:\s*linear-gradient\(105deg,\s*#/.test(css));

// 4) JS apto para el parser base: sin ES6+ en los bundles clásicos
for (const [f, src] of js) {
  const noComments = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  ok(`${f} sin arrow functions`, !/=>/.test(noComments));
  ok(`${f} sin let/const`, !/(^|[\s;({])(let|const)\s/.test(noComments));
  ok(`${f} sin template literals`, !/`/.test(noComments));
  ok(`${f} sin async/await`, !/(^|[\s;({])(async\s|await\s)/.test(noComments));
  ok(`${f} sin class declaration`, !/(^|[\s;({])class\s+[A-Z]/.test(noComments));
}

// 5) APIs con detección previa
const app = js[0][1];
ok('startViewTransition guardado', (app.match(/document\.startViewTransition\(function/g) || []).length === (app.match(/document\.startViewTransition &&|typeof DOE\.requestPermission|if \(document\.startViewTransition/g) || []).filter(x => x.includes('startViewTransition')).length);
ok('navigator.vibrate guardado', /if \(navigator\.vibrate\)/.test(app));
ok('randomUUID con fallback', /crypto\.randomUUID/.test(app) && /xxxxxxxx-xxxx-4xxx/.test(app));

// 6) El addAll del SW es atómico: TODOS los assets deben existir en disco
const assets = [...swSrc.matchAll(/"\.\/([^"]+)"/g)].map(m => m[1]).filter(a => a && !a.includes('#'));
for (const a of assets) ok('asset del SW existe: ' + a, existsSync(join(ROOT, a)));

// 7) PWA: manifest e index completos
ok('manifest id/scope/display', !!manifest.id && !!manifest.scope && manifest.display === 'standalone');
ok('manifest icono maskable', manifest.icons.some(i => i.purpose === 'maskable'));
ok('index viewport-fit=cover', html.includes('viewport-fit=cover'));
ok('index theme-color dual', (html.match(/name="theme-color"/g) || []).length >= 2);
ok('index apple-touch-icon', html.includes('apple-touch-icon'));

console.log('PASS', pass, 'FAIL', fail);
process.exit(fail ? 1 : 0);
