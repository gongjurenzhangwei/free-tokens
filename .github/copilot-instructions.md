# BYOK COPILOT Development

- Keep provider credentials in VS Code SecretStorage only.
- Keep provider protocol adapters separate from the dashboard webview.
- Run `npm run package` after TypeScript changes.
- Increment the patch version in `package.json` and `package-lock.json` for every bug fix.
- Run `npm run package:vsix` after every completed version update and keep the generated versioned VSIX artifact.
- Preserve compatibility with VS Code 1.104 or newer.