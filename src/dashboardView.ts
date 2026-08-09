import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

function nonce(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export function dashboardView(webview: vscode.Webview, version: string, extensionUri: vscode.Uri, freeTokensUrl?: string): string {
  const token = nonce();
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview.js'));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview.css'));
  const wechatQrUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'wx-qrcode.svg'));

  // The free-token recommendations page (docs/free-tokens.html, copied to
  // dist/free-tokens.html at build time) is inlined into the webview and
  // rendered inside an <iframe srcDoc>. Inlining is the most reliable way to
  // show it: it does not depend on external hosts (raw.githubusercontent.com
  // serves text/plain + nosniff), does not depend on iframe loading of
  // vscode-webview:// URIs, and works fully offline. Owners can still override
  // it with a custom URL (e.g. self-hosted CDN) via byokCopilot.freeTokensUrl.
  let bundledFreeTokensHtml = '';
  try {
    bundledFreeTokensHtml = fs.readFileSync(path.join(extensionUri.fsPath, 'dist', 'free-tokens.html'), 'utf8');
  } catch {
    bundledFreeTokensHtml = '';
  }
  // JSON-encode and escape "<" so the markup can never close the script tag
  // early (guards against </script> injection inside the JSON payload).
  const bundledFreeTokensJson = bundledFreeTokensHtml
    ? JSON.stringify(bundledFreeTokensHtml).replace(/</g, '\\u003c')
    : '';
  const hasCustomUrl = !!(freeTokensUrl && freeTokensUrl.trim());
  // Kept as a last-resort fallback URL when the bundled file cannot be read.
  const bundledFreeTokensUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'free-tokens.html'));

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${token}'; font-src ${webview.cspSource}; img-src ${webview.cspSource} data: https:; frame-src ${webview.cspSource} https:;">
  <meta name="byok-version" content="${version}">
  <meta name="byok-wechat-qr" content="${wechatQrUri}">
  <meta name="byok-freetokens-url" content="${hasCustomUrl ? freeTokensUrl : bundledFreeTokensUri.toString()}">
  ${bundledFreeTokensJson ? `<script type="application/json" id="byok-freetokens-html" nonce="${token}">${bundledFreeTokensJson}</script>` : ''}
  <link rel="stylesheet" href="${styleUri}">
  <title>免费 Token</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${token}" src="${scriptUri}"></script>
</body>
</html>`;
}