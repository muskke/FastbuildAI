/**
 * 此脚本用于生成 CommonJS 包的 package.json 文件
 * 确保 CommonJS 项目可以正确引用 ESM 包
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 确保 lib/cjs 目录存在
const cjsDir = path.join(rootDir, 'lib', 'cjs');
if (!fs.existsSync(cjsDir)) {
  fs.mkdirSync(cjsDir, { recursive: true });
}

// 创建 CommonJS 包的 package.json
const cjsPackageJson = {
  type: 'commonjs'
};

// 写入 package.json 文件
fs.writeFileSync(
  path.join(cjsDir, 'package.json'),
  JSON.stringify(cjsPackageJson, null, 2)
);

console.log('✅ CommonJS package.json 已生成');

// 创建 ESM 包的 package.json
const esmDir = path.join(rootDir, 'lib');
const esmPackageJson = {
  type: 'module'
};

// 写入 package.json 文件
fs.writeFileSync(
  path.join(esmDir, 'package.json'),
  JSON.stringify(esmPackageJson, null, 2)
);

console.log('✅ ESM package.json 已生成');
