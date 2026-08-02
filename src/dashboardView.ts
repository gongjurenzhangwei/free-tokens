import * as vscode from 'vscode';

function nonce(): string { return crypto.randomUUID().replace(/-/g, ''); }

export function dashboardView(webview: vscode.Webview, version: string): string {
  const token = nonce();
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${token}'; script-src 'nonce-${token}';">
  <style nonce="${token}">
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-foreground);
      --surface: var(--vscode-sideBar-background);
      --surface-2: var(--vscode-editorWidget-background);
      --input-bg: var(--vscode-input-background);
      --input-fg: var(--vscode-input-foreground, var(--vscode-foreground));
      --notice-bg: var(--vscode-notifications-background);
      --muted: var(--vscode-descriptionForeground);
      --line: color-mix(in srgb, var(--vscode-panel-border) 78%, transparent);
      --cyan: #00f0ff;
      --cyan-soft: #27c2d6;
      --magenta: #ff2ec4;
      --green: #39ff14;
      --amber: #ffb627;
      --danger: var(--vscode-errorForeground);
      --focus: var(--vscode-focusBorder);
      --button: var(--vscode-button-background);
      --button-fg: var(--vscode-button-foreground);
      --radius: 4px;
      --mono: 'JetBrains Mono', 'Cascadia Code', 'Fira Code', 'Consolas', 'Menlo', monospace;
    }

    html[data-theme="dark"] {
      --bg: #070b12;
      --fg: #e6f7ff;
      --surface: #0c131e;
      --surface-2: #111b29;
      --input-bg: #08101a;
      --input-fg: #e6f7ff;
      --notice-bg: #101a27;
      --muted: #8093a7;
      --line: rgba(93, 138, 166, 0.28);
      --focus: #00d9e8;
    }

    html[data-theme="light"] {
      --bg: #f3f7fb;
      --fg: #142333;
      --surface: #ffffff;
      --surface-2: #eaf1f7;
      --input-bg: #ffffff;
      --input-fg: #142333;
      --notice-bg: #ffffff;
      --muted: #5d7082;
      --line: rgba(39, 84, 110, 0.25);
      --cyan: #007e94;
      --cyan-soft: #198aa0;
      --magenta: #c21872;
      --green: #17823b;
      --amber: #a85b00;
      --danger: #c62828;
      --focus: #007e94;
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      background: var(--bg);
      color: var(--fg);
      font: 13px/1.55 var(--mono);
      letter-spacing: 0.02em;
    }

    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(color-mix(in srgb, var(--cyan) 5%, transparent) 1px, transparent 1px),
        linear-gradient(90deg, color-mix(in srgb, var(--cyan) 4%, transparent) 1px, transparent 1px);
      background-size: 28px 28px;
      pointer-events: none;
      z-index: 0;
      mask-image: radial-gradient(ellipse at center, #000 30%, transparent 90%);
    }

    body::after {
      content: '';
      position: fixed;
      inset: 0;
      background: repeating-linear-gradient(
        180deg,
        transparent 0,
        transparent 3px,
        color-mix(in srgb, var(--cyan) 2%, transparent) 3px,
        color-mix(in srgb, var(--cyan) 2%, transparent) 4px
      );
      pointer-events: none;
      z-index: 1;
      mix-blend-mode: overlay;
      opacity: 0.5;
    }

    .shell {
      position: relative;
      z-index: 2;
      min-height: 100vh;
    }

    .topbar {
      height: 68px;
      border-bottom: 1px solid color-mix(in srgb, var(--cyan) 35%, var(--line));
      background:
        linear-gradient(180deg, color-mix(in srgb, var(--cyan) 6%, transparent), transparent 60%),
        color-mix(in srgb, var(--bg) 92%, transparent);
      position: sticky;
      top: 0;
      z-index: 10;
      backdrop-filter: blur(14px);
      box-shadow: 0 1px 0 color-mix(in srgb, var(--cyan) 50%, transparent), 0 4px 22px rgba(0, 0, 0, 0.35);
    }

    .topbar-inner {
      width: 100%;
      max-width: 1280px;
      height: 100%;
      margin: 0 auto;
      padding: 0 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand { display: flex; align-items: center; gap: 14px; }
    .brand-copy { display: flex; flex-direction: column; gap: 2px; }

    .brand h1 {
      font: 700 15px/1.1 var(--mono);
      margin: 0;
      color: var(--cyan);
      letter-spacing: 0.18em;
      text-shadow: 0 0 8px color-mix(in srgb, var(--cyan) 70%, transparent), 0 0 18px color-mix(in srgb, var(--cyan) 35%, transparent);
    }

    .brand-meta {
      font: 500 10px/1 var(--mono);
      color: var(--muted);
      letter-spacing: 0.22em;
    }

    .brand-meta::before { content: '> '; color: var(--green); }
    .brand-meta::after { content: ' _'; color: var(--green); animation: blink 1.05s steps(2, end) infinite; }

    @keyframes blink { 50% { opacity: 0; } }

    .signal {
      width: 40px;
      height: 40px;
      border: 1px solid var(--cyan);
      border-radius: var(--radius);
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, color-mix(in srgb, var(--cyan) 22%, transparent), color-mix(in srgb, var(--magenta) 18%, transparent));
      font: 800 13px/1 var(--mono);
      color: var(--cyan);
      box-shadow:
        inset 0 0 14px color-mix(in srgb, var(--cyan) 25%, transparent),
        0 0 12px color-mix(in srgb, var(--cyan) 40%, transparent),
        0 0 28px color-mix(in srgb, var(--magenta) 18%, transparent);
      letter-spacing: 0.04em;
    }

    .live { display: flex; align-items: center; gap: 8px; font-size: 10px; color: var(--muted); letter-spacing: 0.18em; }
    .live-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 8px var(--green), 0 0 16px color-mix(in srgb, var(--green) 50%, transparent);
      animation: pulse 1.4s ease-in-out infinite;
    }
    @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }

    .toolbar { display: flex; align-items: center; gap: 14px; }
    .language-select { width: 92px; color: var(--cyan); border-color: color-mix(in srgb, var(--cyan) 45%, var(--line)); }

    .layout { max-width: 1280px; margin: 0 auto; padding: 26px 28px 64px; position: relative; z-index: 3; }

    .overview {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      border: 1px solid color-mix(in srgb, var(--cyan) 30%, var(--line));
      border-radius: var(--radius);
      background: color-mix(in srgb, var(--surface) 88%, transparent);
      overflow: hidden;
      box-shadow:
        inset 0 1px 0 color-mix(in srgb, var(--cyan) 18%, transparent),
        0 0 24px color-mix(in srgb, var(--cyan) 8%, transparent);
      position: relative;
    }

    .overview::before {
      content: 'METRICS::30D';
      position: absolute;
      top: -10px; left: 12px;
      font: 700 9px/1 var(--mono);
      letter-spacing: 0.3em;
      color: var(--cyan);
      background: var(--bg);
      padding: 0 6px;
    }

    .metric {
      min-height: 96px;
      padding: 18px 20px 16px;
      border-right: 1px solid var(--line);
      position: relative;
    }

    .metric:last-child { border-right: 0; }

    .metric::before {
      content: '';
      position: absolute;
      left: 18px; top: 0;
      width: 24px; height: 2px;
      background: linear-gradient(90deg, var(--cyan), transparent);
      box-shadow: 0 0 6px var(--cyan);
    }

    .metric-label {
      display: block;
      color: var(--muted);
      font-size: 10px;
      letter-spacing: 0.22em;
      margin-bottom: 10px;
      text-transform: uppercase;
    }

    .metric-value {
      font: 700 26px/1.1 var(--mono);
      font-variant-numeric: tabular-nums;
      color: var(--cyan);
      text-shadow: 0 0 10px color-mix(in srgb, var(--cyan) 35%, transparent);
    }

    .metric-unit {
      margin-left: 6px;
      color: var(--muted);
      font: 500 10px/1 var(--mono);
      letter-spacing: 0.15em;
    }

    .section-head {
      margin: 32px 0 12px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 18px;
      position: relative;
    }

    .section-head::after {
      content: '';
      position: absolute;
      bottom: -6px; left: 0; right: 0;
      height: 1px;
      background: linear-gradient(90deg, color-mix(in srgb, var(--cyan) 50%, transparent), transparent 80%);
    }

    .section-title { display: flex; flex-direction: column; gap: 4px; }

    .section-title h2 {
      font: 700 13px/1.2 var(--mono);
      margin: 0;
      letter-spacing: 0.2em;
      color: var(--fg);
      text-transform: uppercase;
    }

    .section-title h2::before { content: '// '; color: var(--magenta); }

    .section-title p {
      margin: 0;
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.05em;
    }

    .settings { display: flex; align-items: flex-end; gap: 10px; }

    .compact { display: grid; gap: 6px; }
    .compact label, .field label {
      font-size: 10px;
      letter-spacing: 0.18em;
      color: var(--muted);
      text-transform: uppercase;
    }

    .muted, .hint, .meta, .brand-meta { color: var(--muted); }

    button, input, select { font: inherit; color: var(--input-fg); }
    button { white-space: nowrap; cursor: pointer; }

    .button {
      height: 34px;
      padding: 0 14px;
      border: 1px solid color-mix(in srgb, var(--cyan) 55%, var(--line));
      border-radius: var(--radius);
      background: linear-gradient(180deg, color-mix(in srgb, var(--cyan) 14%, transparent), color-mix(in srgb, var(--cyan) 4%, transparent));
      color: var(--cyan);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font: 600 11px/1 var(--mono);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      transition: filter 150ms, box-shadow 150ms, transform 80ms;
      box-shadow:
        inset 0 1px 0 color-mix(in srgb, var(--cyan) 30%, transparent),
        0 0 14px color-mix(in srgb, var(--cyan) 18%, transparent);
    }

    .button:hover {
      filter: brightness(1.15);
      box-shadow:
        inset 0 1px 0 color-mix(in srgb, var(--cyan) 45%, transparent),
        0 0 22px color-mix(in srgb, var(--cyan) 35%, transparent);
    }

    .button:active { transform: translateY(1px); }

    .button:focus-visible, input:focus-visible, select:focus-visible {
      outline: 1px solid var(--focus);
      outline-offset: 2px;
    }

    .button.secondary {
      background: color-mix(in srgb, var(--surface) 80%, transparent);
      color: var(--fg);
      border-color: var(--line);
      box-shadow: none;
    }

    .button.secondary:hover {
      border-color: color-mix(in srgb, var(--cyan) 50%, var(--line));
      box-shadow: 0 0 12px color-mix(in srgb, var(--cyan) 18%, transparent);
    }

    .button.danger { color: var(--danger); border-color: color-mix(in srgb, var(--danger) 55%, var(--line)); }

    .button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      box-shadow: none;
    }

    .button svg, .icon-button svg {
      width: 14px; height: 14px; fill: none;
      stroke: currentColor; stroke-width: 1.8;
      stroke-linecap: round; stroke-linejoin: round;
    }

    .icon-button { width: 34px; padding: 0; }

    .control, input, select {
      height: 34px;
      border: 1px solid var(--vscode-input-border, var(--line));
      border-radius: var(--radius);
      background: var(--input-bg);
      padding: 0 10px;
      font: 500 12px/1 var(--mono);
      letter-spacing: 0.04em;
    }

    .control:focus, input:focus, select:focus {
      border-color: color-mix(in srgb, var(--cyan) 60%, var(--line));
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--cyan) 35%, transparent);
      outline: none;
    }

    input::placeholder { color: var(--muted); }

    .toggle-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: color-mix(in srgb, var(--surface-2) 60%, transparent);
      font: 500 11px/1 var(--mono);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
      cursor: pointer;
      user-select: none;
      transition: border-color 150ms, color 150ms;
    }
    .toggle-row:hover {
      border-color: color-mix(in srgb, var(--cyan) 50%, var(--line));
      color: var(--fg);
    }
    .toggle-row input {
      width: 14px;
      height: 14px;
      margin: 0;
      accent-color: var(--cyan);
    }
    .toggle-row.on { color: var(--cyan); border-color: color-mix(in srgb, var(--cyan) 50%, var(--line)); }

    .settings-grid {
      display: flex;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 8px;
    }

    .settings-info {
      margin: 8px 0 0;
      padding: 10px 12px;
      border-left: 2px solid var(--magenta);
      background: color-mix(in srgb, var(--magenta) 5%, transparent);
      font: 500 11px/1.6 var(--mono);
      color: var(--muted);
      letter-spacing: 0.04em;
    }
    .settings-info b { color: var(--magenta); font-weight: 600; }

    .plans {
      border: 1px solid color-mix(in srgb, var(--cyan) 22%, var(--line));
      border-radius: var(--radius);
      background: color-mix(in srgb, var(--surface) 88%, transparent);
      overflow: hidden;
      box-shadow: 0 0 22px color-mix(in srgb, var(--cyan) 5%, transparent);
    }

    .plan-head, .plan {
      display: grid;
      grid-template-columns: minmax(220px, 1.35fr) minmax(132px, .72fr) minmax(240px, 1.25fr) 48px 114px;
      gap: 14px;
      align-items: center;
    }

    .plan > div { min-width: 0; }

    .plan-head {
      min-height: 38px;
      padding: 0 18px;
      border-bottom: 1px solid var(--line);
      color: var(--muted);
      font-size: 9px;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      background: color-mix(in srgb, var(--surface-2) 60%, transparent);
    }

    .plan {
      min-height: 90px;
      padding: 14px 18px;
      border-bottom: 1px solid var(--line);
      transition: background 150ms, box-shadow 150ms;
      position: relative;
    }

    .plan:last-child { border-bottom: 0; }

    .plan::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 2px;
      background: var(--cyan);
      opacity: 0;
      transition: opacity 150ms;
    }

    .plan:hover {
      background: color-mix(in srgb, var(--cyan) 5%, var(--surface));
    }
    .plan:hover::before { opacity: 1; }

    .plan-name {
      font-weight: 600;
      margin-bottom: 4px;
      font-size: 13px;
      letter-spacing: 0.04em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .plan-provider {
      font-size: 10px;
      color: var(--muted);
      letter-spacing: 0.16em;
      text-transform: uppercase;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .protocol {
      display: inline-flex;
      width: max-content;
      align-items: center;
      gap: 6px;
      padding: 3px 8px;
      border: 1px solid color-mix(in srgb, var(--magenta) 55%, var(--line));
      border-radius: 999px;
      background: color-mix(in srgb, var(--magenta) 8%, transparent);
      color: color-mix(in srgb, var(--magenta) 90%, var(--fg));
      font: 600 10px/1.5 var(--mono);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .protocol::before {
      content: '';
      width: 5px; height: 5px;
      border-radius: 50%;
      background: var(--magenta);
      box-shadow: 0 0 6px var(--magenta);
    }

    .usage-value {
      font: 700 14px/1.2 var(--mono);
      font-variant-numeric: tabular-nums;
      color: var(--cyan);
      text-shadow: 0 0 8px color-mix(in srgb, var(--cyan) 30%, transparent);
    }

    .model-names, .quota {
      margin-top: 6px;
      color: var(--muted);
      font-size: 10px;
      letter-spacing: 0.05em;
    }

    .model-names {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .quota {
      white-space: normal;
      font-family: var(--mono);
    }

    .quota-bar {
      display: inline-flex;
      gap: 2px;
      margin-top: 6px;
      font-family: var(--mono);
      align-items: center;
      padding: 3px 4px;
      border: 1px solid color-mix(in srgb, var(--cyan) 28%, var(--line));
      background: color-mix(in srgb, var(--surface-2) 72%, transparent);
      box-shadow: inset 0 0 10px color-mix(in srgb, var(--cyan) 8%, transparent);
    }

    .quota-bar .quota-cell {
      display: inline-block;
      width: 7px;
      height: 14px;
      transform: skewX(-10deg);
      border: 1px solid color-mix(in srgb, currentColor 65%, transparent);
      animation: cellGlow 2.4s ease-in-out infinite;
      animation-delay: calc(var(--cell) * 55ms);
    }

    @keyframes cellGlow { 0%, 100% { filter: brightness(.85); } 50% { filter: brightness(1.35); } }

    .quota-bar .quota-percent {
      width: auto;
      height: auto;
      background: transparent !important;
      border: 0 !important;
      transform: none !important;
      color: var(--muted);
      font: 600 10px var(--mono);
      padding: 0 6px;
      letter-spacing: 0.05em;
    }

    .actions { display: flex; justify-content: flex-end; gap: 6px; }
    .empty { padding: 44px 20px; text-align: center; color: var(--muted); font-family: var(--mono); letter-spacing: 0.1em; }

    .switch { position: relative; display: inline-block; width: 36px; height: 20px; }
    .switch input { opacity: 0; width: 0; height: 0; }

    .slider {
      position: absolute; inset: 0;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--input-bg);
      cursor: pointer;
      transition: 150ms;
    }

    .slider::before {
      content: '';
      position: absolute;
      width: 12px; height: 12px;
      left: 3px; top: 3px;
      border-radius: 50%;
      background: var(--muted);
      transition: 150ms;
    }

    .switch input:checked + .slider {
      border-color: color-mix(in srgb, var(--green) 65%, var(--line));
      background: color-mix(in srgb, var(--green) 18%, var(--surface));
      box-shadow: 0 0 10px color-mix(in srgb, var(--green) 40%, transparent);
    }

    .switch input:checked + .slider::before {
      transform: translateX(16px);
      background: var(--green);
      box-shadow: 0 0 8px var(--green);
    }

    dialog {
      width: min(760px, calc(100vw - 28px));
      max-height: calc(100vh - 28px);
      padding: 0;
      border: 1px solid color-mix(in srgb, var(--cyan) 50%, var(--line));
      border-radius: var(--radius);
      background: var(--surface-2);
      color: var(--fg);
      box-shadow:
        0 24px 80px rgba(0, 0, 0, 0.5),
        0 0 40px color-mix(in srgb, var(--cyan) 20%, transparent);
    }

    dialog::backdrop {
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
    }

    .dialog-head {
      height: 60px;
      padding: 0 20px;
      border-bottom: 1px solid color-mix(in srgb, var(--cyan) 30%, var(--line));
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(180deg, color-mix(in srgb, var(--cyan) 8%, transparent), transparent);
    }

    .dialog-head h2 {
      font: 700 13px/1.2 var(--mono);
      margin: 0;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--cyan);
      text-shadow: 0 0 8px color-mix(in srgb, var(--cyan) 40%, transparent);
    }

    .dialog-head h2::before { content: '> '; color: var(--green); }

    .form {
      padding: 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px 14px;
    }

    .field { display: flex; flex-direction: column; gap: 6px; }
    .wide { grid-column: 1 / -1; }
    .protocol-note {
      min-height: 38px;
      padding: 9px 12px;
      border-left: 2px solid var(--cyan);
      background: color-mix(in srgb, var(--cyan) 5%, transparent);
      font: 500 11px/1.5 var(--mono);
      color: var(--muted);
    }

    .key-note {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    .fetch-row {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 14px;
      padding-top: 4px;
    }

    .model-list {
      max-height: 260px;
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--vscode-input-background);
    }

    .model-tools {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto auto;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
    }

    .model-tools .button { min-height: 32px; padding: 5px 10px; font-size: 10px; }

    .model-count {
      color: var(--muted);
      font: 500 11px var(--mono);
      white-space: nowrap;
      letter-spacing: 0.1em;
    }

    .model-option {
      min-height: 48px;
      padding: 8px 10px;
      display: grid;
      grid-template-columns: 18px 1fr;
      gap: 8px;
      align-items: start;
      border-bottom: 1px solid var(--line);
      cursor: pointer;
    }

    .model-option:last-child { border: 0; }
    .model-option:hover { background: color-mix(in srgb, var(--cyan) 5%, transparent); }
    .model-option input { width: 14px; height: 14px; padding: 0; margin: 3px 0 0; accent-color: var(--cyan); }
    .model-copy { display: flex; flex-direction: column; min-width: 0; gap: 4px; }

    .model-title {
      font: 500 12px var(--mono);
      overflow-wrap: anywhere;
    }

    .capabilities { display: flex; flex-wrap: wrap; gap: 4px; }

    .capability {
      padding: 1px 5px;
      border: 1px solid var(--line);
      border-radius: 3px;
      color: var(--muted);
      font: 500 9px/1.5 var(--mono);
      letter-spacing: 0.06em;
    }

    .empty-models { padding: 22px; text-align: center; color: var(--muted); font-family: var(--mono); }

    .dialog-actions {
      grid-column: 1 / -1;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 4px;
    }

    .toast-root { position: fixed; right: 18px; bottom: 18px; z-index: 50; }

    .toast {
      max-width: 420px;
      padding: 11px 14px;
      border: 1px solid color-mix(in srgb, var(--green) 50%, var(--line));
      border-left: 3px solid var(--green);
      border-radius: var(--radius);
      background: var(--notice-bg);
      box-shadow:
        0 12px 36px rgba(0, 0, 0, 0.4),
        0 0 16px color-mix(in srgb, var(--green) 25%, transparent);
      font-family: var(--mono);
      letter-spacing: 0.04em;
    }

    .toast.error {
      border-color: color-mix(in srgb, var(--danger) 50%, var(--line));
      border-left-color: var(--danger);
      box-shadow:
        0 12px 36px rgba(0, 0, 0, 0.4),
        0 0 16px color-mix(in srgb, var(--danger) 25%, transparent);
    }

    body.loading { cursor: progress; }

    @media (max-width: 960px) {
      .overview { grid-template-columns: 1fr 1fr; }
      .metric:nth-child(2) { border-right: 0; }
      .metric:nth-child(-n+2) { border-bottom: 1px solid var(--line); }
      .plan-head { display: none; }
      .plan { grid-template-columns: 1fr auto; gap: 10px 14px; }
      .plan > div:nth-child(2), .plan > div:nth-child(3) { grid-column: 1; }
      .plan > div:nth-child(4) { grid-column: 2; grid-row: 1; }
      .actions { grid-column: 2; grid-row: 2/4; align-self: end; flex-wrap: wrap; width: 74px; }
      .section-head { align-items: flex-start; flex-direction: column; }
      .settings { width: 100%; flex-wrap: wrap; }
    }

    @media (max-width: 520px) {
      .topbar-inner { padding: 0 12px; }
      .live { display: none; }
      .layout { padding: 16px 12px 44px; }
      .overview { grid-template-columns: 1fr 1fr; }
      .metric { padding: 14px 12px; min-height: 80px; }
      .metric::before { left: 12px; }
      .metric-value { font-size: 20px; }
      .form { grid-template-columns: 1fr; padding: 14px; }
      .field { grid-column: 1; }
      .key-note { display: block; }
      .fetch-row { align-items: flex-start; flex-direction: column; }
      .toolbar { gap: 7px; }
      .brand-meta { display: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      * { scroll-behavior: auto !important; transition: none !important; animation: none !important; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand">
          <div class="signal">BY</div>
          <div class="brand-copy">
            <h1>BYOK COPILOT</h1>
            <div class="brand-meta">PROVIDER_CONTROL / v${version}</div>
          </div>
        </div>
        <div class="toolbar">
          <div class="live"><span class="live-dot"></span>EXT_ONLINE</div>
          <select id="language" class="control language-select" aria-label="界面语言">
            <option value="zh-CN">中文</option>
            <option value="en">EN</option>
          </select>
          <button id="themeToggle" class="button secondary icon-button" title="切换白天/暗黑模式" aria-label="切换白天/暗黑模式">☀</button>
          <button id="add" class="button">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            <span id="addLabel">New_Plan</span>
          </button>
        </div>
      </div>
    </header>
    <main class="layout">
      <section class="overview" id="metrics" aria-label="最近 30 天统计"></section>
      <div class="section-head">
        <div class="section-title">
          <h2 id="connectionTitle">连接管理</h2>
          <p class="muted" id="connectionSubtitle">供应商 / 协议 / 模型 / 官方配额</p>
        </div>
        <div class="settings settings-grid">
          <div class="compact">
            <label for="statusMode" id="statusModeLabel">状态栏</label>
            <select id="statusMode" class="control">
              <option value="off"></option>
              <option value="tokens"></option>
              <option value="quota"></option>
            </select>
          </div>
          <div class="compact" id="statusPlanField">
            <label for="statusPlan" id="statusPlanLabel">来源</label>
            <select id="statusPlan" class="control"></select>
          </div>
          <label class="toggle-row" id="filterAvailableRow" title="开启后，聊天模型选择器仅显示已启用、已选模型且已配置 API Key 的 Plan。">
            <input type="checkbox" id="filterAvailable">
            <span id="filterAvailableLabel">[ 仅显示可用 ]</span>
          </label>
          <button class="button secondary" id="manageModels" title="打开 VS Code 官方模型管理器，可用眼睛图标隐藏 GitHub Copilot 默认模型">管理模型</button>
        </div>
      </div>
      <div class="settings-info" id="filterHint" hidden>
        <b>[FILTER_ACTIVE]</b> 聊天模型选择器仅显示：Plan 已启用、至少选择一个模型、SecretStorage 中存在 API Key。
        Dashboard 仍保留所有 Plan，方便修复配置。
      </div>
      <section class="plans">
        <div class="plan-head">
          <span id="planHeader">Plan / 供应商</span>
          <span id="protocolHeader">协议</span>
          <span id="usageHeader">用量 / 配额</span>
          <span id="stateHeader">状态</span>
          <span></span>
        </div>
        <div id="plans"></div>
      </section>
    </main>
  </div>
  <dialog id="editor">
    <div class="dialog-head">
      <h2 id="title">接入 Plan</h2>
      <button type="button" class="button secondary icon-button" id="close" aria-label="关闭">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m18 6-12 12M6 6l12 12"/></svg>
      </button>
    </div>
    <form class="form" id="form">
      <input type="hidden" id="id">
      <div class="field">
        <label for="preset">PROVIDER_PRESET</label>
        <select id="preset">
          <option value="custom">[ Custom ] 自定义 / Coding Plan</option>
          <option value="agnes">Agnes AI</option>
          <option value="minimax">MiniMax Token Plan</option>
          <option value="opencode">OpenCode Zen</option>
          <option value="nvidia">NVIDIA NIM</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="deepseek">DeepSeek</option>
          <option value="qwen">阿里云百炼 / Qwen</option>
          <option value="moonshot">Moonshot / Kimi</option>
          <option value="zhipu">智谱 BigModel</option>
          <option value="siliconflow">SiliconFlow</option>
          <option value="openrouter">OpenRouter</option>
          <option value="groq">Groq</option>
          <option value="mistral">Mistral</option>
          <option value="together">Together AI</option>
          <option value="xai">xAI</option>
        </select>
      </div>
      <div class="field">
        <label for="name" id="planNameLabel">PLAN 名称</label>
        <input id="name" required placeholder="例如：MiniMax Coding">
      </div>
      <div class="field wide">
        <label for="baseUrl">BASE_URL</label>
        <input id="baseUrl" type="url" required placeholder="https://api.example.com/v1">
      </div>
      <div class="field wide">
        <label for="protocol">API_PROTOCOL</label>
        <select id="protocol">
          <option value="responses">OpenAI Responses API</option>
          <option value="openai">OpenAI Chat Completions</option>
          <option value="anthropic">Anthropic Messages</option>
        </select>
        <div class="protocol-note" id="protocolNote"></div>
      </div>
      <div class="field wide">
        <div class="key-note">
          <label for="apiKey">API_KEY / SUB_KEY</label>
          <span class="hint" id="keyHint">仅保存在 VS Code SecretStorage</span>
        </div>
        <input id="apiKey" type="password" autocomplete="off" placeholder="编辑留空 = 保留原密钥">
      </div>
      <div class="field wide fetch-row">
        <button type="button" class="button secondary" id="fetchModels">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v6h-6"/></svg>
          <span id="fetchModelsLabel">测试并获取</span>
        </button>
        <div id="connectionStatus" class="hint" aria-live="polite">填写连接信息后测试。</div>
      </div>
      <div class="field wide">
        <div id="modelPreview" class="model-list" hidden></div>
      </div>
      <div class="dialog-actions">
        <button type="button" class="button secondary" id="cancel">取消</button>
        <button type="submit" class="button" id="save" disabled>保存 Plan</button>
      </div>
    </form>
  </dialog>
  <div class="toast-root" id="toast" aria-live="polite"></div>
  <script nonce="${token}">
    const vscode = acquireVsCodeApi();
    const presets = {
      custom: { provider: 'Custom', url: '', protocol: 'openai' },
      agnes: { provider: 'Agnes AI', url: 'https://apihub.agnes-ai.com/v1', protocol: 'openai' },
      minimax: { provider: 'MiniMax', url: 'https://api.minimaxi.com/v1', protocol: 'openai' },
      opencode: { provider: 'OpenCode Zen', url: 'https://opencode.ai/zen/v1', protocol: 'openai' },
      nvidia: { provider: 'NVIDIA NIM', url: 'https://integrate.api.nvidia.com/v1', protocol: 'openai' },
      openai: { provider: 'OpenAI', url: 'https://api.openai.com', protocol: 'responses' },
      anthropic: { provider: 'Anthropic', url: 'https://api.anthropic.com', protocol: 'anthropic' },
      deepseek: { provider: 'DeepSeek', url: 'https://api.deepseek.com', protocol: 'openai' },
      qwen: { provider: 'Qwen', url: 'https://dashscope.aliyuncs.com/compatible-mode', protocol: 'openai' },
      moonshot: { provider: 'Moonshot', url: 'https://api.moonshot.cn', protocol: 'openai' },
      zhipu: { provider: 'Zhipu', url: 'https://open.bigmodel.cn/api/paas', protocol: 'openai' },
      siliconflow: { provider: 'SiliconFlow', url: 'https://api.siliconflow.cn', protocol: 'openai' },
      openrouter: { provider: 'OpenRouter', url: 'https://openrouter.ai/api', protocol: 'openai' },
      groq: { provider: 'Groq', url: 'https://api.groq.com/openai', protocol: 'openai' },
      mistral: { provider: 'Mistral', url: 'https://api.mistral.ai', protocol: 'openai' },
      together: { provider: 'Together AI', url: 'https://api.together.xyz', protocol: 'openai' },
      xai: { provider: 'xAI', url: 'https://api.x.ai', protocol: 'openai' }
    };
    const protocolNames = { responses: 'Responses API', openai: 'Chat Completions', anthropic: 'Anthropic Messages' };
    const translations = {
      'zh-CN': {
        language: '界面语言', themeLight: '切换到白天模式', themeDark: '切换到暗黑模式', newPlan: '新建 Plan',
        metricsLabel: '最近 30 天统计',
        connectionTitle: '连接管理', connectionSubtitle: '供应商 / 协议 / 模型 / 官方配额', statusBar: '状态栏', source: '来源',
        statusOff: '[ OFF ] 不显示用量', statusTokens: '[ TOK ] 本地 Token', statusQuota: '[ QTA ] 官方配额',
        onlyAvailable: '[ 仅显示可用 ]', filterTitle: '开启后，聊天模型选择器仅显示已启用、已选模型且已配置 API Key 的 Plan。',
        manageModels: '管理模型', manageModelsTitle: '打开 VS Code 官方模型管理器，可用眼睛图标隐藏 GitHub Copilot 默认模型',
        filterHint: '<b>[过滤已启用]</b> 聊天模型选择器仅显示：Plan 已启用、至少选择一个模型、SecretStorage 中存在 API Key。Dashboard 仍保留所有 Plan，方便修复配置。',
        planProvider: 'Plan / 供应商', protocol: '协议', usageQuota: '用量 / 配额', state: '状态', close: '关闭',
        connectPlan: '接入 Plan', editPlan: '编辑 Plan', planName: 'PLAN 名称', customPreset: '[ Custom ] 自定义 / Coding Plan',
        planNamePlaceholder: '例如：MiniMax Coding', keyHint: '仅保存在 VS Code SecretStorage', keyPlaceholder: '编辑留空 = 保留原密钥',
        testFetch: '测试并获取', fillThenTest: '填写连接信息后测试。', cancel: '取消', savePlan: '保存 Plan', searchModels: '搜索模型',
        selectAll: '全选', clearAll: '清空', noMatch: '// 无匹配模型', configChanged: '配置已变化，请重新测试连接。',
        selectedModels: count => '当前已选择 ' + count + ' 个模型。', invalidConnection: '请填写有效的 Base URL 和 API Key。',
        testing: protocol => '正在使用 ' + protocol + ' 测试连接...', connected: (protocol, count) => '连接成功 · ' + protocol + ' · ' + count + ' 个模型',
        enabledPlans: '启用的 Plan', apiCalls: 'API 调用', inputTokens: '输入 Token', outputTokens: '输出 Token', units: '个', count: '次',
        quotaNotFetched: '尚未获取配额', quotaUnit: '额度单位', unlimited: '不限量', noData: '无数据', available: '可用', disabled: '已停用', noModels: '无模型', noKey: '无密钥',
        models: '个模型', noModelsText: '无模型', localTokens: '本地 Token', localStats: '30 天本地 Token 统计',
        enablePlan: '启用 Plan', refreshQuota: '刷新官方配额', edit: '编辑', delete: '删除', noPlans: '// 尚未接入 Plan，请点击 [新建 Plan]',
        protocolResponses: '使用 /v1/responses。适合 OpenAI 新一代响应接口。', protocolOpenai: '使用 /v1/chat/completions。适合大多数 OpenAI 兼容供应商。', protocolAnthropic: '使用 /v1/messages，并发送 x-api-key 与 anthropic-version 请求头。'
      },
      en: {
        language: 'Interface language', themeLight: 'Switch to light mode', themeDark: 'Switch to dark mode', newPlan: 'New Plan',
        metricsLabel: 'Statistics for the last 30 days',
        connectionTitle: 'Connection Manager', connectionSubtitle: 'Provider / Protocol / Models / Official quota', statusBar: 'Status bar', source: 'Source',
        statusOff: '[ OFF ] Hide usage', statusTokens: '[ TOK ] Local tokens', statusQuota: '[ QTA ] Official quota',
        onlyAvailable: '[ Only Available ]', filterTitle: 'Only expose enabled plans with selected models and an API key in the chat model picker.',
        manageModels: 'Manage Models', manageModelsTitle: 'Open the official VS Code model manager. Use the eye icon to hide GitHub Copilot models.',
        filterHint: '<b>[FILTER ACTIVE]</b> The chat model picker only shows plans that are enabled, contain at least one selected model, and have an API key in SecretStorage. All plans remain visible here for configuration.',
        planProvider: 'Plan / Provider', protocol: 'Protocol', usageQuota: 'Usage / Quota', state: 'State', close: 'Close',
        connectPlan: 'Connect Plan', editPlan: 'Edit Plan', planName: 'Plan name', customPreset: '[ Custom ] Custom / Coding Plan',
        planNamePlaceholder: 'Example: MiniMax Coding', keyHint: 'Stored only in VS Code SecretStorage', keyPlaceholder: 'Leave blank while editing to keep the current key',
        testFetch: 'Test & Fetch', fillThenTest: 'Enter connection details, then test.', cancel: 'Cancel', savePlan: 'Save Plan', searchModels: 'Search models',
        selectAll: 'Select All', clearAll: 'Clear All', noMatch: '// NO MATCH', configChanged: 'Configuration changed. Test the connection again.',
        selectedModels: count => count + ' model(s) currently selected.', invalidConnection: 'Enter a valid Base URL and API key.',
        testing: protocol => 'Testing connection with ' + protocol + '...', connected: (protocol, count) => 'Connected · ' + protocol + ' · ' + count + ' model(s)',
        enabledPlans: 'Enabled plans', apiCalls: 'API calls', inputTokens: 'Input tokens', outputTokens: 'Output tokens', units: 'units', count: 'calls',
        quotaNotFetched: 'Quota not fetched', quotaUnit: 'quota units', unlimited: 'UNLIMITED', noData: 'NO DATA', available: 'AVAILABLE', disabled: 'DISABLED', noModels: 'NO MODELS', noKey: 'NO KEY',
        models: 'models', noModelsText: 'no models', localTokens: 'local tokens', localStats: '30D local token stats',
        enablePlan: 'Enable plan', refreshQuota: 'Refresh official quota', edit: 'Edit', delete: 'Delete', noPlans: '// NO PLANS CONNECTED — Select [New Plan] to begin',
        protocolResponses: 'Uses /v1/responses for the current OpenAI Responses API.', protocolOpenai: 'Uses /v1/chat/completions for most OpenAI-compatible providers.', protocolAnthropic: 'Uses /v1/messages with the x-api-key and anthropic-version headers.'
      }
    };
    const icons = {
      quota: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
      edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>',
      trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6M10 11v5M14 11v5"/></svg>'
    };
    let state = { plans: [], planAvailability: {}, usage: [], quotas: [], settings: { statusBarUsage: 'off', dashboardTheme: 'system', language: 'zh-CN' } };
    let testRequest = 0, tested, editingEnabled = true;
    let selectedModelIds = new Set();
    const $ = id => document.getElementById(id);
    const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const language = () => state.settings.language === 'en' ? 'en' : 'zh-CN';
    const t = (key, ...args) => { const value = translations[language()][key]; return typeof value === 'function' ? value(...args) : value; };
    const formatNumber = value => new Intl.NumberFormat(language(), { notation: Number(value) >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(Number(value) || 0);
    const formatTime = value => new Date(value).toLocaleString(language(), { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const PALETTE = ['#00f0ff', '#39ff14', '#ffb627', '#ff2ec4', '#ff5577', '#7d5fff'];
    function applyTheme(theme) {
      const resolved = theme === 'system' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : theme;
      document.documentElement.dataset.theme = resolved;
      $('themeToggle').textContent = resolved === 'dark' ? '☀' : '☾';
      $('themeToggle').title = resolved === 'dark' ? t('themeLight') : t('themeDark');
      $('themeToggle').ariaLabel = $('themeToggle').title;
    }
    function applyLanguage() {
      document.documentElement.lang = language();
      $('language').value = language();
      $('language').ariaLabel = t('language');
      $('metrics').ariaLabel = t('metricsLabel');
      $('addLabel').textContent = t('newPlan');
      $('connectionTitle').textContent = t('connectionTitle');
      $('connectionSubtitle').textContent = t('connectionSubtitle');
      $('statusModeLabel').textContent = t('statusBar');
      $('statusPlanLabel').textContent = t('source');
      $('statusMode').options[0].textContent = t('statusOff');
      $('statusMode').options[1].textContent = t('statusTokens');
      $('statusMode').options[2].textContent = t('statusQuota');
      $('filterAvailableLabel').textContent = t('onlyAvailable');
      $('filterAvailableRow').title = t('filterTitle');
      $('manageModels').textContent = t('manageModels');
      $('manageModels').title = t('manageModelsTitle');
      $('filterHint').innerHTML = t('filterHint');
      $('planHeader').textContent = t('planProvider');
      $('protocolHeader').textContent = t('protocol');
      $('usageHeader').textContent = t('usageQuota');
      $('stateHeader').textContent = t('state');
      $('close').ariaLabel = t('close');
      $('preset').options[0].textContent = t('customPreset');
      $('planNameLabel').textContent = t('planName');
      $('name').placeholder = t('planNamePlaceholder');
      $('keyHint').textContent = t('keyHint');
      $('apiKey').placeholder = t('keyPlaceholder');
      $('fetchModelsLabel').textContent = t('testFetch');
      $('cancel').textContent = t('cancel');
      $('save').textContent = t('savePlan');
      $('modelSearch').ariaLabel = t('searchModels');
      $('selectAllModels').textContent = t('selectAll');
      $('clearAllModels').textContent = t('clearAll');
    }
    function pixelBar(percent, width) {
      width = width || 14;
      if (percent === undefined || percent === null || isNaN(percent)) return '';
      const filled = Math.max(0, Math.min(width, Math.round(percent / 100 * width)));
      const empty = width - filled;
      let html = '<span class="quota-bar" aria-label="' + Math.round(percent) + '%">';
      for (let i = 0; i < filled; i++) {
        const color = percent >= 90 ? '#ff5577' : percent >= 70 ? '#ffb627' : PALETTE[Math.min(PALETTE.length - 1, Math.floor(i / Math.max(1, width - 1) * PALETTE.length))];
        html += '<span class="quota-cell" style="--cell:' + i + ';color:' + color + ';background:' + color + ';box-shadow:0 0 6px ' + color + '"></span>';
      }
      for (let i = 0; i < empty; i++) html += '<span class="quota-cell" style="--cell:' + (filled + i) + ';color:var(--muted);background:color-mix(in srgb,var(--muted) 12%,transparent)"></span>';
      html += '<span class="quota-percent">' + Math.round(percent) + '%</span></span>';
      return html;
    }
    function quotaText(snapshot) {
      if (!snapshot) return '<span style="color:var(--muted)">' + esc(t('quotaNotFetched')) + '</span>';
      return snapshot.windows.map(window => {
        const percent = window.percentUsed ?? (window.limit ? (window.used || 0) / window.limit * 100 : undefined);
        const counts = window.used !== undefined && window.limit !== undefined ? formatNumber(window.used) + ' / ' + formatNumber(window.limit) + ' ' + esc(window.unit || t('quotaUnit')) : '';
        const value = window.unlimited ? '∞ ' + t('unlimited') : (counts || t('noData'));
        const bar = percent !== undefined ? pixelBar(percent) : '';
        return '<div style="margin:2px 0">' + esc(window.label) + ' · ' + esc(value) + (window.resetAt ? ' · ⟳ ' + esc(formatTime(window.resetAt)) : '') + '</div>' + bar;
      }).join('');
    }
    function isMiniMax(plan) { return /minimax/i.test(plan.provider + ' ' + plan.baseUrl); }
    function saveStatus() {
      vscode.postMessage({
        type: 'saveSettings',
        settings: {
          ...state.settings,
          statusBarUsage: $('statusMode').value,
          statusBarPlanId: $('statusPlan').value || undefined,
          filterAvailable: $('filterAvailable').checked,
          dashboardTheme: state.settings.dashboardTheme || 'system',
          language: language(),
        }
      });
    }
    function render() {
      applyLanguage();
      const totals = state.usage.reduce((sum, item) => ({
        requests: sum.requests + item.requests,
        input: sum.input + item.inputTokens,
        output: sum.output + item.outputTokens
      }), { requests: 0, input: 0, output: 0 });
      const metrics = [
        [t('enabledPlans'), state.plans.filter(plan => plan.enabled).length, t('units')],
        [t('apiCalls'), formatNumber(totals.requests), t('count')],
        [t('inputTokens'), formatNumber(totals.input), 'tok'],
        [t('outputTokens'), formatNumber(totals.output), 'tok']
      ];
      $('metrics').innerHTML = metrics.map(item => '<div class="metric"><span class="metric-label">' + item[0] + '</span><span class="metric-value">' + item[1] + '</span><span class="metric-unit">' + item[2] + '</span></div>').join('');
      const quotaPlans = state.plans.filter(isMiniMax);
      $('statusMode').value = state.settings.statusBarUsage || 'off';
      $('statusPlanField').hidden = $('statusMode').value !== 'quota';
      $('statusPlan').innerHTML = quotaPlans.map(plan => '<option value="' + esc(plan.id) + '">' + esc(plan.name) + '</option>').join('');
      $('statusPlan').value = state.settings.statusBarPlanId || quotaPlans[0]?.id || '';
      const filterAvailable = state.settings.filterAvailable === true;
      $('filterAvailable').checked = filterAvailable;
      $('filterAvailableRow').classList.toggle('on', filterAvailable);
      $('filterHint').hidden = !filterAvailable;
      applyTheme(state.settings.dashboardTheme || 'system');
      $('plans').innerHTML = state.plans.length ? state.plans.map(plan => {
        const usage = state.usage.find(item => item.planId === plan.id) || {};
        const quota = state.quotas.find(item => item.planId === plan.id);
        const miniMax = isMiniMax(plan);
        const available = plan.enabled && plan.models.length > 0 && state.planAvailability[plan.id] === true;
        const availabilityBadge = available
          ? '<span class="capability" style="color:var(--green);border-color:color-mix(in srgb,var(--green) 50%,var(--line))">' + t('available') + '</span>'
          : '<span class="capability" style="color:var(--amber);border-color:color-mix(in srgb,var(--amber) 50%,var(--line))">' + (!plan.enabled ? t('disabled') : !plan.models.length ? t('noModels') : t('noKey')) + '</span>';
        return '<article class="plan"><div><div class="plan-name">' + esc(plan.name) + '</div><div class="plan-provider">' + esc(plan.provider) + ' · ' + plan.models.length + ' ' + t('models') + '</div><div class="model-names">' + esc(plan.models.slice(0, 3).map(model => model.name).join(' / ') || t('noModelsText')) + '</div><div class="capabilities" style="margin-top:6px">' + availabilityBadge + '</div></div><div><span class="protocol">' + esc(protocolNames[plan.protocol] || plan.protocol) + '</span></div><div><div class="usage-value">' + formatNumber(usage.totalTokens) + ' ' + t('localTokens') + '</div><div class="quota">' + (miniMax ? quotaText(quota) : '⟵ ' + t('localStats')) + '</div></div><div><label class="switch" title="' + t('enablePlan') + '"><input data-toggle="' + esc(plan.id) + '" type="checkbox" ' + (plan.enabled ? 'checked' : '') + '><span class="slider"></span></label></div><div class="actions">' + (miniMax ? '<button class="button secondary icon-button" data-quota="' + esc(plan.id) + '" title="' + t('refreshQuota') + '">' + icons.quota + '</button>' : '') + '<button class="button secondary icon-button" data-edit="' + esc(plan.id) + '" title="' + t('edit') + '">' + icons.edit + '</button><button class="button secondary icon-button" data-delete="' + esc(plan.id) + '" title="' + t('delete') + '">' + icons.trash + '</button></div></article>';
      }).join('') : '<div class="empty">' + t('noPlans') + '</div>';
    }
    function planInput() {
      const preset = presets[$('preset').value];
      return {
        id: $('id').value || undefined,
        name: $('name').value,
        provider: preset.provider === 'Custom' ? $('name').value : preset.provider,
        baseUrl: $('baseUrl').value,
        protocol: $('protocol').value,
        apiKey: $('apiKey').value || undefined,
        enabled: editingEnabled
      };
    }
    function capabilityLabels(model) {
      const labels = [];
      if (model.contextLength) labels.push('CTX ' + formatNumber(model.contextLength));
      if (model.supportsVision !== undefined) labels.push(model.supportsVision ? 'VISION' : 'TEXT_ONLY');
      if (model.supportsTools !== undefined) labels.push(model.supportsTools ? 'TOOLS' : 'NO_TOOLS');
      if (model.supportsWebSearch) labels.push('WEB_SEARCH');
      for (const feature of model.features || []) if (!/vision|image|tool|function.?call|web.?search|internet|联网/i.test(feature)) labels.push(feature);
      return [...new Set(labels)];
    }
    function modelVersion(model) {
      const text = String(model.id || model.name).toLowerCase();
      const date = text.match(/(?:^|[^0-9])(20\\d{2})[-_.]?([01]\\d)[-_.]?([0-3]\\d)(?:[^0-9]|$)/);
      if (date) return { family: text.replace(date[0], ' ').replace(/[-_.\\s]+/g, ' ').trim(), value: Number(date[1] + date[2] + date[3]) };
      const version = text.match(/(?:^|[-_.\\s])v?(\\d+)(?:\\.(\\d+))?(?:\\.(\\d+))?(?=$|[-_.\\s])/);
      if (!version) return;
      return { family: text.replace(version[0], ' ').replace(/[-_.\\s]+/g, ' ').trim(), value: Number(version[1]) * 1000000 + Number(version[2]) * 1000 + Number(version[3] || 0) };
    }
    function sortModels(models) {
      const sorted = [...models];
      const groups = new Map();
      models.forEach((model, index) => {
        const version = modelVersion(model);
        if (!version) return;
        const entries = groups.get(version.family) || [];
        entries.push({ model, index, value: version.value });
        groups.set(version.family, entries);
      });
      for (const entries of groups.values()) {
        if (entries.length < 2) continue;
        const ordered = [...entries].sort((left, right) => right.value - left.value || left.index - right.index);
        entries.forEach((entry, index) => { sorted[entry.index] = ordered[index].model; });
      }
      return sorted;
    }
    function visibleModels(models) {
      const query = $('modelSearch').value.trim().toLowerCase();
      return sortModels(models).filter(model => !query || [model.id, model.name, ...capabilityLabels(model)].join(' ').toLowerCase().includes(query));
    }
    function renderModelChoices(models) {
      const visible = visibleModels(models);
      $('modelTools').hidden = !models.length;
      $('modelPreview').hidden = !models.length;
      $('modelCount').textContent = visible.length + ' / ' + models.length + ' ' + t('models');
      $('selectAllModels').disabled = !visible.length;
      $('clearAllModels').disabled = !visible.length;
      $('modelPreview').innerHTML = visible.length ? visible.map(model => '<label class="model-option"><input type="checkbox" data-model-id="' + esc(model.id) + '" ' + (selectedModelIds.has(model.id) ? 'checked' : '') + '><span class="model-copy"><span class="model-title">' + esc(model.name) + '</span><span class="capabilities">' + capabilityLabels(model).map(label => '<span class="capability">' + esc(label) + '</span>').join('') + '</span></span></label>').join('') : '<div class="empty-models">' + t('noMatch') + '</div>';
    }
    function updateProtocolNote() { $('protocolNote').textContent = t($('protocol').value === 'responses' ? 'protocolResponses' : $('protocol').value === 'anthropic' ? 'protocolAnthropic' : 'protocolOpenai'); }
    function invalidateModels() {
      testRequest++;
      tested = undefined;
      selectedModelIds.clear();
      $('fetchModels').disabled = false;
      $('save').disabled = true;
      $('modelTools').hidden = true;
      $('modelSearch').value = '';
      $('modelPreview').hidden = true;
      $('modelPreview').textContent = '';
      $('connectionStatus').textContent = t('configChanged');
    }
    function openEditor(plan) {
      testRequest++;
      $('form').reset();
      $('modelSearch').value = '';
      editingEnabled = plan?.enabled ?? true;
      $('id').value = plan?.id || '';
      $('name').value = plan?.name || '';
      $('baseUrl').value = plan?.baseUrl || '';
      $('protocol').value = plan?.protocol || 'openai';
      if (plan) {
        const match = Object.entries(presets).find(([, preset]) => preset.provider === plan.provider);
        $('preset').value = match?.[0] || 'custom';
        tested = { protocol: plan.protocol, models: plan.models };
        selectedModelIds = new Set(plan.models.map(model => model.id));
        renderModelChoices(plan.models);
      } else {
        $('preset').value = 'custom';
        $('modelTools').hidden = true;
        $('modelPreview').hidden = true;
        $('modelPreview').textContent = '';
        tested = undefined;
        selectedModelIds.clear();
      }
      $('apiKey').required = !plan;
      $('title').textContent = plan ? t('editPlan') : t('connectPlan');
      $('connectionStatus').textContent = plan ? t('selectedModels', plan.models.length) : t('fillThenTest');
      $('save').disabled = !plan;
      updateProtocolNote();
      $('editor').showModal();
    }
    $('modelPreview').insertAdjacentHTML('beforebegin', '<div id="modelTools" class="model-tools" hidden><label class="sr-only" for="modelSearch">搜索模型</label><input id="modelSearch" type="search" autocomplete="off" placeholder="search.id / name / capability"><span id="modelCount" class="model-count" aria-live="polite"></span><button type="button" class="button secondary" id="selectAllModels">Select_All</button><button type="button" class="button secondary" id="clearAllModels">Clear_All</button></div>');
    new MutationObserver(() => document.querySelectorAll('[data-refresh]').forEach(button => button.remove())).observe($('plans'), { childList: true, subtree: true });
    $('add').onclick = () => openEditor();
    $('close').onclick = $('cancel').onclick = () => $('editor').close();
    $('statusMode').onchange = () => { $('statusPlanField').hidden = $('statusMode').value !== 'quota'; saveStatus(); };
    $('statusPlan').onchange = saveStatus;
    $('language').onchange = () => {
      state.settings.language = $('language').value;
      render();
      if ($('editor').open) {
        $('title').textContent = $('id').value ? t('editPlan') : t('connectPlan');
        updateProtocolNote();
      }
      saveStatus();
    };
    $('filterAvailable').onchange = () => { saveStatus(); render(); };
    $('manageModels').onclick = () => vscode.postMessage({ type: 'manageLanguageModels' });
    $('themeToggle').onclick = () => {
      const current = document.documentElement.dataset.theme;
      state.settings.dashboardTheme = current === 'dark' ? 'light' : 'dark';
      applyTheme(state.settings.dashboardTheme);
      saveStatus();
    };
    $('preset').onchange = event => {
      const preset = presets[event.target.value];
      $('baseUrl').value = preset.url;
      $('protocol').value = preset.protocol;
      if (!$('name').value) $('name').value = preset.provider;
      updateProtocolNote();
      invalidateModels();
    };
    $('protocol').onchange = () => { updateProtocolNote(); invalidateModels(); };
    $('baseUrl').oninput = $('apiKey').oninput = invalidateModels;
    $('fetchModels').onclick = () => {
      if (!$('baseUrl').reportValidity() || (!$('apiKey').value && !$('id').value)) {
        $('connectionStatus').textContent = t('invalidConnection');
        return;
      }
      const requestId = ++testRequest;
      $('fetchModels').disabled = true;
      $('connectionStatus').textContent = t('testing', protocolNames[$('protocol').value]);
      vscode.postMessage({ type: 'testPlan', requestId, plan: planInput() });
    };
    $('modelSearch').oninput = () => {
      if (!tested) return;
      if ($('modelSearch').value.trim()) selectedModelIds = new Set(visibleModels(tested.models).map(model => model.id));
      renderModelChoices(tested.models);
      $('save').disabled = !selectedModelIds.size;
    };
    $('selectAllModels').onclick = () => {
      if (!tested) return;
      for (const model of visibleModels(tested.models)) selectedModelIds.add(model.id);
      renderModelChoices(tested.models);
      $('save').disabled = !selectedModelIds.size;
    };
    $('clearAllModels').onclick = () => {
      if (!tested) return;
      for (const model of visibleModels(tested.models)) selectedModelIds.delete(model.id);
      renderModelChoices(tested.models);
      $('save').disabled = !selectedModelIds.size;
    };
    $('modelPreview').onchange = event => {
      if (!event.target.dataset.modelId) return;
      if (event.target.checked) selectedModelIds.add(event.target.dataset.modelId);
      else selectedModelIds.delete(event.target.dataset.modelId);
      $('save').disabled = !selectedModelIds.size;
    };
    $('form').onsubmit = event => {
      event.preventDefault();
      if (!tested) return;
      const selected = tested.models.filter(model => selectedModelIds.has(model.id));
      if (!selected.length) return;
      document.body.classList.add('loading');
      vscode.postMessage({ type: 'savePlan', plan: planInput(), models: selected });
      $('editor').close();
    };
    $('plans').onclick = event => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.dataset.edit) openEditor(state.plans.find(plan => plan.id === button.dataset.edit));
      if (button.dataset.quota) { document.body.classList.add('loading'); vscode.postMessage({ type: 'refreshQuota', id: button.dataset.quota }); }
      if (button.dataset.delete) vscode.postMessage({ type: 'delete', id: button.dataset.delete });
    };
    $('plans').onchange = event => { if (event.target.dataset.toggle) vscode.postMessage({ type: 'toggle', id: event.target.dataset.toggle, enabled: event.target.checked }); };
    window.addEventListener('message', event => {
      if (event.data.type === 'state') { state = event.data; render(); document.body.classList.remove('loading'); }
      if (event.data.type === 'testResult' && event.data.requestId === testRequest) {
        $('fetchModels').disabled = false;
        if (event.data.ok) {
          tested = event.data.connection;
          selectedModelIds = new Set(tested.models.map(model => model.id));
          $('modelSearch').value = '';
          $('connectionStatus').textContent = t('connected', protocolNames[tested.protocol], tested.models.length);
          renderModelChoices(tested.models);
          $('save').disabled = !tested.models.length;
        } else {
          tested = undefined;
          selectedModelIds.clear();
          $('modelTools').hidden = true;
          $('modelPreview').hidden = true;
          $('connectionStatus').textContent = event.data.error;
          $('save').disabled = true;
        }
      }
      if (event.data.type === 'notice') {
        document.body.classList.remove('loading');
        $('toast').innerHTML = '<div class="toast ' + event.data.level + '">' + esc(event.data.message) + '</div>';
        setTimeout(() => $('toast').innerHTML = '', 5000);
      }
    });
    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
}