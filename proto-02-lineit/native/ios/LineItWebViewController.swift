import UIKit
import WebKit

/// UPTNStation에서 Line It 게임 화면을 띄울 때 사용
/// Xcode: native/ios/LineItWeb 폴더를 번들에 포함한 뒤 이 VC를 연결
final class LineItWebViewController: UIViewController {

    private var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.96, green: 0.95, blue: 1.0, alpha: 1) // --app-bg

        let config = WKWebViewConfiguration()
        config.preferences.javaScriptEnabled = true
        config.websiteDataStore = .default()

        webView = WKWebView(frame: .zero, configuration: config)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.scrollView.bounces = false
        webView.isOpaque = false
        webView.backgroundColor = .clear
        view.addSubview(webView)

        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])

        loadLocalGame()
    }

    private func loadLocalGame() {
        guard let folder = Bundle.main.url(forResource: "LineItWeb", withExtension: nil) else {
            showBundleError("LineItWeb 폴더가 번들에 없습니다. native/ios/LineItWeb 를 Xcode에 추가하세요.")
            return
        }

        guard let indexURL = Bundle.main.url(
            forResource: "index",
            withExtension: "html",
            subdirectory: "LineItWeb"
        ) else {
            showBundleError("LineItWeb/index.html 을 찾을 수 없습니다.")
            return
        }

        webView.loadFileURL(indexURL, allowingReadAccessTo: folder)
    }

    private func showBundleError(_ message: String) {
        let label = UILabel()
        label.text = message
        label.numberOfLines = 0
        label.textAlignment = .center
        label.textColor = .secondaryLabel
        label.font = .systemFont(ofSize: 15)
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            label.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 24),
            label.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -24),
        ])
    }
}
