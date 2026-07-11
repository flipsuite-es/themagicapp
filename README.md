# ♠ App del Mago

**El círculo privado de los magos.** Una PWA sin dependencias para el mago de trabajo: su biblioteca de trucos, sus rutinas y bolos, su práctica con repetición espaciada — y, si quiere, una comunidad y un mercado solo por invitación.

> Repositorio aislado. Sin build, sin `npm install` para la app: archivos estáticos que funcionan offline.

---

## Qué hace

**Privado (funciona 100% offline, datos en el dispositivo):**
- **Biblioteca** — trucos con categoría, dificultad, estado de aprendizaje, notas, etiquetas, fotos paso a paso y vídeos (enlace o subida propia con TUS reanudable).
- **Rutinas** — sets ordenados con **modo Actuar**: pantalla de escenario con notas grandes, wake-lock y paso de truco tocando media pantalla.
- **Bolos** — agenda con cliente, caché, setlist; resumen de ingresos del año.
- **Práctica** — repetición espaciada sobre los trucos "aprendiendo", con recordatorios push opcionales.
- **Trucos incluidos** — el Lector Mental (revela cartas/palabras en el móvil del espectador; carga secreta deslizando desde el borde superior).
- **PIN** de bloqueo, copia de seguridad exportar/importar, compartir trucos/rutinas por enlace revocable.

**Social (opcional, Supabase, solo por invitación):**
- Feed con fotos/vídeo/trucos, historias 24h, clips verticales, retos semanales automáticos, ranking, mensajes directos.
- **Mercado**: métodos digitales (entrega instantánea en la biblioteca del comprador) y **material físico** (stock, envío, estado) con disciplinas para todo tipo de mago. Reseñas y lista de deseos. *Pagos con tarjeta: pendiente de activar Stripe.*
- Invitaciones con cupo (8/mago), racha diaria, recap semanal.

## Arquitectura

```
index.html      shell + registro del SW
styles.css      sistema de diseño "Atelier"
app.js          TODA la app (ES5, sin dependencias)
cloud.js        capa Supabase (auth, datos, storage, realtime, telemetría)
supabase.js     vendored: supabase-js v2 (UMD)
tus.js          vendored: tus-js-client (subidas reanudables)
sw.js           service worker: SWR + offline; sube CACHE en cada deploy
tests/          batería E2E (Playwright) + linter de compatibilidad
```

- **Datos locales**: `localStorage` (`magic_lib_v1`); la nube sincroniza con last-write-wins y re-key de IDs no-UUID.
- **Backend**: Supabase (proyecto `themagicapp`) — RLS en todo, RPCs para feed/mercado/invitaciones, crons (rotación de retos, recap, recordatorios, purgas).
- **Estética "Atelier"**: lujo silencioso — filigrana dorada (`--hairline`), oro foil en títulos (Fraunces cursiva), guilloché generativo por ítem (`engraving(seed)`), humo WebGL y foil 3D opcionales (Ajustes → Efectos), sonido de mesa sintetizado opt-in.
- **Compatibilidad**: base iOS Safari 15.4+/Chrome 100+; `app.js`/`cloud.js` en ES5 estricto; mejoras progresivas (view transitions, content-visibility) con detección previa. Reglas vigiladas por `tests/tcompat.mjs`.

## Desarrollo

```bash
python3 -m http.server 8099        # o cualquier estático; abre http://localhost:8099
```

Al desplegar: **sube la versión de `CACHE` en `sw.js`** (p. ej. `magic-v73`) o los clientes instalados no refrescarán.

## Tests

```bash
npm i -D playwright && npx playwright install chromium   # una vez
node tests/run-all.mjs                                   # levanta su propio servidor
```

13 suites (~180 checks): linter de compatibilidad, crawler de 60 vistas, mercado físico/digital, flujos de datos (PIN, copia de seguridad, CRUD), sonido/giroscopio, modo ligero, contenido extremo con CPU x4, escritorio, **offline real** y el standalone. Detalles en `tests/README.md`.

## Operación

- **Retos semanales**: rotan solos (lunes 9:00) desde `challenge_pool`; rellena el pool cuando `used_at is null` baje de ~8.
- **Errores de clientes**: llegan solos a `public.client_errors` (retención 30 días). Lectura: `select message, source, count(*) from client_errors group by 1,2 order by 3 desc;`
- **Backups de usuario**: cada mago exporta/importa su JSON desde Ajustes.

## Estado y pendientes

- ✅ Todo lo anterior en producción (rama `claude/magic-tricks-tech-7loog4`).
- ⏳ **Stripe** (cobro en el mercado): conector pendiente de autorizar; el descuento de stock por venta se hará en servidor al integrarlo.
- ⏳ Vídeo multiplataforma (Cloudflare Stream) si los vídeos nativos crecen.
- 🧪 Falta validar en dispositivo real: giroscopio/foil/sonido en iPhone y el flujo completo de registro con invitación (el entorno de CI no alcanza `supabase.co` ni ejecuta WebKit).
