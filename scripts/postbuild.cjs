#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');

// 读取 HTML 文件
let html = fs.readFileSync(indexPath, 'utf-8');

// 移除所有包含 tauri 的 modulepreload 链接，以及移除后的空行
const originalHtml = html;
html = html.replace(/<link rel="modulepreload"[^>]*tauri[^>]*>\s*\n?/g, '');

// 如果有修改，写回文件
if (html !== originalHtml) {
  fs.writeFileSync(indexPath, html, 'utf-8');
  console.log('✓ Removed Tauri modulepreload links from dist/index.html');
} else {
  console.log('No Tauri modulepreload links found (already clean)');
}
