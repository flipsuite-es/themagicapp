# 🔮 The Magic App

Una colección de trucos de **mentalismo y magia** pensados para hacerse **en el móvil del espectador**, delante de quien sea y donde sea. Es una web app sin instalación, **sin dependencias y que funciona sin conexión**: se abre en cualquier navegador de teléfono.

> Este proyecto vive **aislado** en el repositorio `themagicapp`. No toca ni depende de ningún otro proyecto.

---

## Cómo usarla

1. Abre `index.html` en cualquier navegador (móvil u ordenador), o despliega la carpeta como sitio estático (Vercel, Netlify, GitHub Pages…).
2. En el móvil, puedes "Añadir a pantalla de inicio" para que se abra como una app a pantalla completa.
3. Una vez cargada, funciona **offline**: perfecto para actuar en cualquier sitio.

Sin build, sin `npm install`. Son archivos estáticos: `index.html`, `styles.css`, `app.js`.

---

> **Estado actual:** la app tiene un único efecto, el **Lector Mental**. Los demás trucos se irán añadiendo bajo demanda. La arquitectura (`app.js`) está lista para incorporar más.

## El truco: 🧠 Lector Mental — *el motor universal*
Su carta (o una palabra, un nombre, una fecha…) aparece revelada en su propia pantalla como si la app le leyera la mente. Es potentísimo porque **funciona con cualquier método de forzaje o peek** que ya conozcas.

**Método (carga secreta):** en la pantalla del orbe, **desliza hacia abajo desde el borde superior**. Se abre un panel translúcido: toca la carta o escribe la palabra. Se cierra solo y el orbe se pone **dorado** (= cargado). Entrega el teléfono; el espectador pulsa el orbe y la app "revela" lo que cargaste.

- Averigua la carta con tu técnica habitual (forzaje, peek, papelito escrito y vislumbrado…).
- Carga mientras "calibras el sensor". Un segundo.
- Si no cargas nada, la app elige una carta al azar (salida de emergencia, no queda en blanco).

---

## Público vs. Mago (importante)

La app está pensada para actuar: hay que separar lo que ve el espectador de lo que solo ve el mago.

- **Escenario (lo que ve el público):** la portada y las pantallas de actuación de cada truco. Puedes dejar el móvil en manos del espectador sin miedo.
- **Modo Mago (oculto):** tutoriales para **aprender cada truco** (efecto, qué ve el público, el secreto, paso a paso, guion y errores a evitar). Cada sección está etiquetada como *"Lo ve el público"* o *"Solo el mago"*.

Para entrar al **Modo Mago**: en la portada, **mantén pulsado el título "The Magic App"** ~1 segundo. En modo app instalada (PWA) no hay barra de direcciones, así que el público no puede colarse escribiendo una URL.

## Instalar como app (PWA)

Es una PWA instalable, con service worker (funciona **100% offline** tras instalarla) e iconos nativos:

- **iPhone (Safari):** Compartir → "Añadir a pantalla de inicio". Se abre a pantalla completa, respetando el notch, sin barra del navegador.
- **Android (Chrome):** aparece "Instalar app" (o menú ⋮ → "Instalar aplicación").

> Para que la instalación sea perfecta necesita estar servida por HTTPS (p. ej. Vercel). Ver `vercel.json` y las instrucciones de despliegue.

---

## Privacidad

Todo ocurre en el dispositivo. **No se envía nada a ningún servidor** y no se guarda ningún dato entre sesiones (la carga secreta se borra al recargar y tras cada revelación).

---

## Estructura

```
themagicapp/
├── index.html      # shell de la app
├── styles.css      # tema visual
├── app.js          # router + los tres trucos (sin dependencias)
├── manifest.json   # PWA / añadir a inicio
├── icon.svg        # icono
└── vercel.json     # despliegue estático opcional
```

## Roadmap (ideas para más trucos)

- Carta forzada digital + predicción sellada.
- Test de libro (book test) con lista de palabras.
- Modo "código invisible" avanzado (cargar sin mirar la pantalla, por zonas táctiles).
- Predicción con reloj/fecha/hora real del dispositivo.
