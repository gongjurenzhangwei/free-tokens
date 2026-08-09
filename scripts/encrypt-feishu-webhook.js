#!/usr/bin/env node
/**
 * Generates the XOR+Base64 ciphertext for the Feishu (Lark) webhook URL.
 *
 * Usage:
 *   node scripts/encrypt-feishu-webhook.js "https://open.feishu.cn/open-apis/bot/v2/hook/xxxx"
 *
 * It prints a fresh random key and the matching ciphertext. Paste both into
 * src/dashboard.ts (FEISHU_WEBHOOK_KEY / FEISHU_WEBHOOK_ENC).
 *
 * NOTE: This is obfuscation, not real security. Anyone with the key + source
 * can decrypt it. If you need stronger protection, store the webhook in VS
 * Code SecretStorage instead of shipping it in the bundle.
 */
const key = require('crypto').randomBytes(16).toString('hex');

function encrypt(plain, hexKey) {
  const buf = Buffer.from(plain, 'utf8');
  const k = Buffer.from(hexKey, 'hex');
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) out[i] = buf[i] ^ k[i % k.length];
  return out.toString('base64');
}

function decrypt(cipher, hexKey) {
  const buf = Buffer.from(cipher, 'base64');
  const k = Buffer.from(hexKey, 'hex');
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) out[i] = buf[i] ^ k[i % k.length];
  return out.toString('utf8');
}

const plain = process.argv[2];
if (!plain) {
  console.error('Usage: node scripts/encrypt-feishu-webhook.js "https://open.feishu.cn/open-apis/bot/v2/hook/xxxx"');
  process.exit(1);
}
const cipher = encrypt(plain, key);
console.log('KEY :', key);
console.log('ENC :', cipher);
console.log('VERIFY:', decrypt(cipher, key) === plain ? 'ok' : 'FAILED');
