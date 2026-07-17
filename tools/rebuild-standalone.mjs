// Regenera the-magic-app.standalone.html a partir de los fuentes del repo.
// Usa el standalone existente como plantilla: sustituye el bloque de estilos
// y los scripts embebidos (por posición: van en orden fijo) por el contenido
// fresco de los ficheros. Uso: node tools/rebuild-standalone.mjs
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const R = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(R, 'the-magic-app.standalone.html');
let html = readFileSync(OUT, 'utf8');

// El segundo <style> es styles.css (el primero son las @font-face).
{
  const marks = [...html.matchAll(/<style>/g)];
  if (marks.length < 2) throw new Error('no encuentro el bloque <style> de styles.css');
  const start = marks[1].index + '<style>'.length;
  const end = html.indexOf('</style>', start);
  html = html.slice(0, start) + '\n' + readFileSync(join(R, 'styles.css'), 'utf8') + '\n' + html.slice(end);
}

// Los <script> embebidos van en orden fijo: [0] snippet de tema,
// [1..4] supabase.js, tus.js, cloud.js, app.js. Se sustituyen por posición,
// de atrás hacia delante para no invalidar los índices.
{
  const names = ['supabase.js', 'tus.js', 'cloud.js', 'app.js'];
  const blocks = [...html.matchAll(/<script>/g)].map((m) => m.index);
  if (blocks.length !== names.length + 1) throw new Error('esperaba ' + (names.length + 1) + ' scripts embebidos, hay ' + blocks.length);
  for (let i = names.length - 1; i >= 0; i--) {
    const src = readFileSync(join(R, names[i]), 'utf8');
    const contentStart = blocks[i + 1] + '<script>'.length;
    const e = html.indexOf('</' + 'script>', contentStart);
    html = html.slice(0, contentStart) + '\n' + src + '\n' + html.slice(e);
  }
}

// Sincroniza los meta del <head> con index.html (theme-color y PWA de iOS):
// un standalone con metas viejas pinta la franja de estado de beige.
{
  const idx = readFileSync(join(R, 'index.html'), 'utf8');
  const vp = (idx.match(/<meta name="viewport"[^>]*>/) || [''])[0];
  const th = idx.match(/<meta name="theme-color"[^>]*>/g) || [];
  const apple = idx.match(/<meta name="apple-mobile-web-app[^>]*>/g) || [];
  html = html.replace(/<meta name="viewport"[^>]*>/, vp);
  html = html.replace(/<meta name="theme-color"[^>]*>\s*/g, '');
  html = html.replace(vp, vp + '\n' + th.join('\n') + '\n' + apple.filter((m) => !html.includes(m)).join('\n'));
}
writeFileSync(OUT, html);
console.log('standalone regenerado:', html.length, 'bytes');
