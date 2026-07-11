// Auditoría UX programática: objetivos táctiles pequeños y contraste bajo.
import { chromium } from 'playwright';
import { STUB } from './stub.mjs';
const mk = (t, c, st) => ({ id: crypto.randomUUID(), title: t, category: c, difficulty: 'medio', status: st || 'dominado', favorite: false, tags: ['ambiciosa'], meta: {}, notes: 'Notas.', media: [], photos: [], createdAt: 1, updatedAt: 5 });
const seeds = [mk('Alfa', 'Cartomagia'), mk('Beta', 'Mentalismo', 'aprendiendo')];
const T = JSON.stringify({ tricks: seeds, categories: ['Cartomagia', 'Mentalismo'], routines: [], gigs: [] });
const ROUTES = ['#/', '#/truco/' + seeds[0].id, '#/nuevo', '#/rutinas', '#/bolos', '#/practica', '#/ajustes', '#/comunidad', '#/mercado', '#/mercado/l2', '#/vender', '#/publicar', '#/stats'];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })).newPage();
await p.addInitScript(t => { localStorage.setItem('magic_theme', 'dark'); localStorage.setItem('magic_social', '1'); localStorage.setItem('magic_lib_v1', t); }, T);
await p.route('**/cloud.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));
await p.goto('http://127.0.0.1:8099/#/'); await p.waitForTimeout(1100);
const findings = {};
for (const r of ROUTES) {
  await p.evaluate(h => { location.hash = h; }, r); await p.waitForTimeout(650);
  const f = await p.evaluate(() => {
    const out = { small: [], contrast: [] };
    const lum = (c) => { const m = c.match(/\d+(\.\d+)?/g); if (!m) return null; const [r, g, b] = m.map(Number);
      const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const bgOf = (el) => { let n = el; while (n && n !== document.documentElement) { const bg = getComputedStyle(n).backgroundColor; if (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) return bg; n = n.parentElement; } return getComputedStyle(document.body).backgroundColor || 'rgb(20,17,23)'; };
    // objetivos táctiles
    document.querySelectorAll('button, a, [role="button"], .chip, .iconbtn, .switch').forEach(el => {
      const r0 = el.getBoundingClientRect();
      if (!r0.width || !r0.height || r0.bottom < 0 || r0.top > innerHeight) return;
      if ((r0.width < 38 || r0.height < 38) && !el.closest('.keypad')) {
        // ¿el padre clicable compensa? mide el propio elemento interactivo
        out.small.push(`${(el.id || el.className && String(el.className).split(' ')[0] || el.tagName)} ${Math.round(r0.width)}x${Math.round(r0.height)} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 18)}"`);
      }
    });
    // contraste de textos pequeños
    document.querySelectorAll('p, span, div, label, a, button').forEach(el => {
      if (el.children.length || !el.textContent || !el.textContent.trim()) return;
      const cs = getComputedStyle(el);
      const size = parseFloat(cs.fontSize); if (size > 16) return;
      const r0 = el.getBoundingClientRect(); if (!r0.width || r0.bottom < 0 || r0.top > innerHeight) return;
      const lf = lum(cs.color), lb = lum(bgOf(el)); if (lf == null || lb == null) return;
      const ratio = (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05);
      const bold = parseInt(cs.fontWeight, 10) >= 600;
      const min = (size >= 14 && bold) ? 3 : 4.5;
      if (ratio < min - 0.2) out.contrast.push(`${String(el.className).split(' ')[0] || el.tagName} ${ratio.toFixed(1)}:1 (${Math.round(size)}px) "${el.textContent.trim().slice(0, 22)}"`);
    });
    return out;
  });
  if (f.small.length || f.contrast.length) findings[r] = { small: [...new Set(f.small)].slice(0, 6), contrast: [...new Set(f.contrast)].slice(0, 6) };
}
console.log(JSON.stringify(findings, null, 1));
await b.close();
