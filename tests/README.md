# Batería E2E de App del Mago

Suites de Playwright que cubren la app con un stub de la nube (sin tocar
Supabase real): mercado físico/digital, la Mesa 3D (reparto, arrastre,
apilado persistente, cajones, culling), sonido/giroscopio, modo de efectos
ligeros, el standalone y un crawler de 30 rutas × 2 temas.

## Requisitos
- Node ≥ 18
- Playwright con Chromium: `npm i -D playwright && npx playwright install chromium`
  (o `PLAYWRIGHT_BROWSERS_PATH` apuntando a un Chromium ya instalado; las
  suites usan `executablePath: '/opt/pw-browsers/chromium'` — ajusta esa
  ruta o expórtala si tu entorno difiere).

## Uso
```bash
node tests/run-all.mjs      # levanta su propio servidor en :8099 y corre todo
node tests/tmesa.mjs        # una suite suelta (necesita el servidor en :8099)
```

Notas de diseño: los contextos bloquean el service worker
(`serviceWorkers: 'block'`) para que la caché no puentee los stubs, y los
fixtures usan UUIDs reales porque la sincronización re-genera IDs no-UUID.
