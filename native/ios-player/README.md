# Player nativo iOS (modo native-fullscreen)

Wrapper mínimo WKWebView para la actuación con **réplica completa**: oculta la
barra de estado real y deja que el renderer web dibuje la barra simulada del
preset (modo `native-fullscreen`).

Qué hace:
- WKWebView a pantalla completa, `contentInsetAdjustmentBehavior = .never`
  (iOS no desplaza el contenido por la safe area: el fondo empieza en y=0).
- `prefersStatusBarHidden = true` y `prefersHomeIndicatorAutoHidden = true`.
- Carga `the-magic-app.standalone.html` desde el bundle (offline total) y
  navega a `#/desbloqueo-actuar`.
- No recoge ni almacena códigos: el teclado del truco es ficticio y vive
  solo en memoria dentro de la web.

Cómo probarlo (requiere macOS + Xcode; no se puede compilar iOS en CI Linux):
1. Xcode → New App (UIKit, Swift) llamado MagicPlayer.
2. Copia `Sources/*.swift` sobre los generados.
3. Arrastra `the-magic-app.standalone.html` al target (Copy bundle resources).
4. En Info.plist: `UIViewControllerBasedStatusBarAppearance = YES`.
5. Ejecuta en un iPhone: el fondo debe empezar en el píxel 0 sin barra real.

El preset se importa dentro de la web (Exportar/Importar JSON del
configurador), así el player usa exactamente la misma réplica calibrada.
