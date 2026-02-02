#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const appBundlePath = path.join(projectRoot, 'src-tauri', 'target', 'release', 'bundle', 'macos', '图片管理软件.app');
const distPath = path.join(projectRoot, 'dist');
const macOSPath = path.join(appBundlePath, 'Contents', 'MacOS');

console.log('Copying frontend assets to app bundle...');
console.log('Project root:', projectRoot);

// 检查路径是否存在
if (!fs.existsSync(distPath)) {
  console.error('Dist directory not found:', distPath);
  process.exit(1);
}

if (!fs.existsSync(macOSPath)) {
  console.error('MacOS path not found:', macOSPath);
  process.exit(1);
}

// 复制 dist 目录到 MacOS (可执行文件旁边)
const targetDistPath = path.join(macOSPath, 'dist');
if (fs.existsSync(targetDistPath)) {
  fs.rmSync(targetDistPath, { recursive: true, force: true });
}
fs.cpSync(distPath, targetDistPath, { recursive: true });
console.log('✓ Frontend assets copied to', targetDistPath);

// 验证关键文件存在
const indexPath = path.join(targetDistPath, 'index.html');
if (fs.existsSync(indexPath)) {
  console.log('✓ index.html verified in app bundle');
} else {
  console.error('✗ index.html NOT found!');
  process.exit(1);
}

console.log('✓ App bundle is ready to run!');
console.log('');
console.log('To run the app:');
console.log('  open "' + appBundlePath + '"');
