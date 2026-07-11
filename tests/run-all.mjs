/* Runner de la batería E2E de App del Mago.
   Arranca su propio servidor estático (sin dependencias) y ejecuta todas
   las suites en orden. Requiere Node >= 18 y Playwright con Chromium
   (en CI: `npx playwright install chromium`).
   Uso: node tests/run-all.mjs                                          */
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import { dirname, join, extname, normalize } from 'path';

const ROOT = normalize(join(dirname(fileURLToPath(import.meta.url)), '..'));
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const file = normalize(join(ROOT, p));
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch (e) { res.writeHead(404); res.end('not found'); }
});
await new Promise(r => server.listen(8099, '127.0.0.1', r));
console.log('· servidor estático en http://127.0.0.1:8099');

const SUITES = ['tcrawl.mjs', 'tmarket.mjs', 'tflows.mjs', 'tsenses.mjs', 'tfxstress.mjs', 'tedge.mjs', 'tstand.mjs'];
let failed = 0;
for (const suite of SUITES) {
  process.stdout.write(`\n▶ ${suite}\n`);
  const code = await new Promise(res => {
    const shots = join(dirname(fileURLToPath(import.meta.url)), '.shots');
    try { mkdirSync(shots, { recursive: true }); } catch (e) {}
    const child = spawn(process.execPath, [join(dirname(fileURLToPath(import.meta.url)), suite)], { stdio: 'inherit', cwd: shots });
    child.on('close', res);
  });
  if (code !== 0) { failed++; console.log(`✗ ${suite} (exit ${code})`); }
}
server.close();
console.log(failed ? `\n${failed} suite(s) en rojo` : '\nTODA LA BATERÍA EN VERDE');
process.exit(failed ? 1 : 0);
