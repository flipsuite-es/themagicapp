import UIKit
import WebKit

/// Actuación a pantalla completa: barra de estado oculta, WKWebView ocupando
/// toda la pantalla física, sin ajustes automáticos de safe area.
final class PlayerViewController: UIViewController {
    private var web: WKWebView!

    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { .all }

    override func viewDidLoad() {
        super.viewDidLoad()
        let cfg = WKWebViewConfiguration()
        cfg.allowsInlineMediaPlayback = true
        web = WKWebView(frame: view.bounds, configuration: cfg)
        web.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        web.scrollView.contentInsetAdjustmentBehavior = .never // clave: sin desplazamiento por safe area
        web.scrollView.isScrollEnabled = false
        web.scrollView.bounces = false
        web.isOpaque = false
        web.backgroundColor = .black
        view.backgroundColor = .black
        view.addSubview(web)
        if let url = Bundle.main.url(forResource: "the-magic-app.standalone", withExtension: "html") {
            var comps = URLComponents(url: url, resolvingAgainstBaseURL: false)!
            comps.fragment = "/desbloqueo-actuar"
            web.loadFileURL(comps.url ?? url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
    }
}
