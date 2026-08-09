import * as vscode from 'vscode';

function nonce(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export function dashboardView(webview: vscode.Webview, version: string, extensionUri: vscode.Uri, freeTokensUrl?: string): string {
  const token = nonce();
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview.js'));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview.css'));
  const wechatQrUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'wx-qrcode.svg'));
  // Default URL points to the repo's docs/free-tokens.html on GitHub raw. Owners can
  // change this by passing a different URL (e.g. self-hosted CDN) when calling
  // dashboardView(), or by editing the constant below.
  const defaultFreeTokensUrl = 'https://raw.githubusercontent.com/gongjurenzhangwei/byok-copilot/main/docs/free-tokens.html';
  const freeTokensSrc = freeTokensUrl || defaultFreeTokensUrl;

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${token}'; font-src ${webview.cspSource}; img-src ${webview.cspSource} data:; frame-src https:;">
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