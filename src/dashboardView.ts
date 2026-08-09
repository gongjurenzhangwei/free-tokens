import * as vscode from 'vscode';

function nonce(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export function dashboardView(webview: vscode.Webview, version: string, extensionUri: vscode.Uri, freeTokensUrl?: string): string {
  const token = nonce();
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview.js'));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview.css'));
  const wechatQrUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'wx-qrcode.svg'));
  // The free-token recommendations page is bundled into the extension: docs/free-tokens.html
  // is copied to dist/free-tokens.html at build time and served from the webview itself.
  // This avoids depending on external hosts — raw.githubusercontent.com returns text/plain +
  // nosniff, which iframes render as raw source text instead of HTML (an empty-looking page).
  // Owners can still override it with a custom URL (e.g. self-hosted CDN) via the
  // byokCopilot.freeTokensUrl setting.
  const bundledFreeTokensUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'free-tokens.html'));
  const freeTokensSrc = (freeTokensUrl && freeTokensUrl.trim()) ? freeTokensUrl : bundledFreeTokensUri.toString();

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${token}'; font-src ${webview.cspSource}; img-src ${webview.cspSource} data:; frame-src ${webview.cspSource} https:;">
  <meta name="byok-version" content="${version}">
  <meta name="byok-wechat-qr" content="${wechatQrUri}">
  <meta name="byok-freetokens-url" content="${freeTokensSrc}">
  <link rel="stylesheet" href="${styleUri}">
  <title>免费 Token</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${token}" src="${scriptUri}"></script>
</body>
</html>`;
}