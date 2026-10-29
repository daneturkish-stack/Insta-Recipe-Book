import UIKit
import UniformTypeIdentifiers
import os.log

private let shareLog = OSLog(subsystem: "com.danevanzyl.simmer.share", category: "ShareExtension")

// Finds the first https/http URL substring in arbitrary text, mirroring the
// regex the main app already uses (client/App.tsx's extractUrlFromText).
private func firstURL(in text: String) -> String? {
  guard let regex = try? NSRegularExpression(pattern: "https?://[^\\s]+") else { return nil }
  let range = NSRange(text.startIndex..., in: text)
  guard let match = regex.firstMatch(in: text, range: range), let swiftRange = Range(match.range, in: text) else {
    return nil
  }
  return String(text[swiftRange])
}

class ShareViewController: UIViewController {
  private let statusLabel = UILabel()
  private let detailLabel = UILabel()
  private let spinner = UIActivityIndicatorView(style: .medium)
  private let closeButton = UIButton(type: .system)

  override func viewDidLoad() {
    super.viewDidLoad()
    os_log("viewDidLoad", log: shareLog, type: .default)
    view.backgroundColor = .systemBackground
    buildUI()
    setStatus("Finding your recipe…", detail: nil, showSpinner: true, showClose: false)
    loadSharedURL()
  }

  private func buildUI() {
    statusLabel.font = .preferredFont(forTextStyle: .headline)
    statusLabel.textAlignment = .center
    statusLabel.numberOfLines = 0

    detailLabel.font = .monospacedSystemFont(ofSize: 11, weight: .regular)
    detailLabel.textColor = .secondaryLabel
    detailLabel.textAlignment = .left
    detailLabel.numberOfLines = 0

    closeButton.setTitle("Close", for: .normal)
    closeButton.addTarget(self, action: #selector(closeTapped), for: .touchUpInside)

    let stack = UIStackView(arrangedSubviews: [spinner, statusLabel, detailLabel, closeButton])
    stack.axis = .vertical
    stack.spacing = 14
    stack.alignment = .center
    stack.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(stack)

    NSLayoutConstraint.activate([
      stack.centerYAnchor.constraint(equalTo: view.centerYAnchor),
      stack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
      stack.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24),
    ])
  }

  @objc private func closeTapped() {
    finish()
  }

  private func setStatus(_ status: String, detail: String?, showSpinner: Bool, showClose: Bool) {
    statusLabel.text = status
    detailLabel.text = detail
    detailLabel.isHidden = (detail == nil)
    showSpinner ? spinner.startAnimating() : spinner.stopAnimating()
    spinner.isHidden = !showSpinner
    closeButton.isHidden = !showClose
  }

  private func loadSharedURL() {
    let items = (extensionContext?.inputItems as? [NSExtensionItem]) ?? []
    os_log("inputItems count=%d", log: shareLog, type: .default, items.count)

    for item in items {
      if let text = item.attributedContentText?.string {
        os_log("attributedContentText=%{public}@", log: shareLog, type: .default, text)
        if let url = firstURL(in: text) {
          handleFoundURL(url)
          return
        }
      }
      if let text = item.attributedTitle?.string {
        os_log("attributedTitle=%{public}@", log: shareLog, type: .default, text)
        if let url = firstURL(in: text) {
          handleFoundURL(url)
          return
        }
      }
    }

    let providers = items.compactMap { $0.attachments }.flatMap { $0 }
    os_log("attachment providers count=%d", log: shareLog, type: .default, providers.count)

    if providers.isEmpty {
      handleFoundURL(nil, diagnostics: "No attachments and no usable attributed text were provided.")
      return
    }

    loadFirstMatch(from: providers, index: 0, diagnostics: [])
  }

  // Walks every attachment in order, trying each of its registered type
  // identifiers that look URL/text-like, since different sharing sources
  // (and iOS versions) disagree on which UTI they use for a shared link.
  private func loadFirstMatch(from providers: [NSItemProvider], index: Int, diagnostics: [String]) {
    guard index < providers.count else {
      handleFoundURL(nil, diagnostics: diagnostics.joined(separator: "\n"))
      return
    }

    let provider = providers[index]
    let types = provider.registeredTypeIdentifiers
    os_log("attachment[%d] types=%{public}@", log: shareLog, type: .default, index, types.joined(separator: ","))

    let candidateTypes = types.filter {
      $0 == UTType.url.identifier
        || $0 == UTType.plainText.identifier
        || $0 == UTType.text.identifier
        || $0 == "public.url"
        || $0 == "public.plain-text"
    }
    let typeToLoad = candidateTypes.first ?? types.first
    let diagnosticLine = "[\(index)] \(types.joined(separator: ", "))"

    guard let typeToLoad else {
      loadFirstMatch(from: providers, index: index + 1, diagnostics: diagnostics + [diagnosticLine])
      return
    }

    provider.loadItem(forTypeIdentifier: typeToLoad, options: nil) { [weak self] value, error in
      if let error {
        os_log("loadItem error for type %{public}@: %{public}@", log: shareLog, type: .error, typeToLoad, String(describing: error))
      }
      guard let self else { return }
      let found: String?
      switch value {
      case let url as URL:
        found = url.absoluteString
      case let text as String:
        found = firstURL(in: text) ?? (text.hasPrefix("http") ? text : nil)
      case let data as Data:
        found = String(data: data, encoding: .utf8).flatMap(firstURL(in:))
      default:
        found = nil
      }
      os_log("loaded type=%{public}@ -> found=%{public}@", log: shareLog, type: .default, typeToLoad, found ?? "nil")

      DispatchQueue.main.async {
        if let found {
          self.handleFoundURL(found)
        } else {
          self.loadFirstMatch(from: providers, index: index + 1, diagnostics: diagnostics + [diagnosticLine])
        }
      }
    }
  }

  // extensionContext.open() with a custom URL scheme proved unreliable when
  // triggered from inside Instagram's share sheet (consistently returned
  // success=false, even from a direct user tap). Copying to the clipboard is
  // a plain, reliable API with no such restriction - Simmer's Add Recipe
  // screen offers to paste it as soon as the user switches back.
  private func handleFoundURL(_ urlString: String?, diagnostics: String = "") {
    os_log("handleFoundURL urlString=%{public}@ diagnostics=%{public}@", log: shareLog, type: .default, urlString ?? "nil", diagnostics)

    guard let urlString else {
      setStatus("Couldn't find a link to save", detail: diagnostics.isEmpty ? "(no attachment info captured)" : diagnostics, showSpinner: false, showClose: true)
      return
    }

    UIPasteboard.general.string = urlString
    setStatus("Copied!", detail: "Open Simmer to finish saving this recipe.", showSpinner: false, showClose: true)
  }

  private func finish() {
    extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
  }
}
