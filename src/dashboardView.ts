import * as vscode from 'vscode';

function nonce(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export function dashboardView(webview: vscode.Webview, version: string, extensionUri: vscode.Uri): string {
  const token = nonce();
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview.js'));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview.css'));

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${token}'; font-src ${webview.cspSource};">
  <meta name="byok-version" content="${version}">
  <link rel="stylesheet" href="${styleUri}">
  <title>BYOK COPILOT</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${token}" src="${scriptUri}"></script>
</body>
</html>`;
}