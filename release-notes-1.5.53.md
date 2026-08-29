# v1.5.53 — 插件打包名改为 free-tokens + 状态栏改为 FT

## 需求
用户提出两个改动：

> 「还有，现在插件的名字就是打包出来的，把插件名字改成 free-tokens。另外，状态栏显示的"BYOK"改成"FT"。 」

即：
1. **插件打包名**：把扩展的 `name` 字段由 `byok-copilot` 改为 `free-tokens`，使 VSIX 打包产物文件名由 `byok-copilot-X.Y.Z.vsix` 变为 `free-tokens-X.Y.Z.vsix`，与仓库名 `gongjurenzhangwei/free-tokens` 保持一致。
2. **状态栏文案**：状态栏显示的 `BYOK` 标识改为 `FT`。

## 改动
### 打包名（`package.json` + `package-lock.json`）
- `"name"`: `byok-copilot` → `free-tokens`
- `"version"`: `1.5.52` → `1.5.53`
- 打包产物文件名变为 `free-tokens-1.5.53.vsix`

> 说明：扩展 ID 为 `publisher.name`，因此会变为 `byok-copilot.free-tokens`，已安装旧版需卸载后重新安装本版本。内部运行标识（`vendor`、命令前缀 `byokCopilot.*`、存储 key）保持不变，避免破坏模型配置与已存数据。

### 状态栏（`src/extension.ts`）
- 默认：`$(key) BYOK` → `$(key) FT`
- tokens 用量：`$(key) BYOK <量> tok` → `$(key) FT <量> tok`
- 官方配额：`$(key) BYOK <进度> <剩余>` → `$(key) FT <进度> <剩余>`

## 验证
- `npx tsc --noEmit` 通过
- `npm run compile` 通过（`free-tokens@1.5.53`，dist/extension.js 126.9kb）
- `npm test` 通过（13/13）
- `npm run package:vsix` 产出 `free-tokens-1.5.53.vsix`