#!/usr/bin/env node

/**
 * 内网 JS 文件批量压缩脚本
 * 使用 Terser 压缩所有内网 JavaScript 文件
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

// 定义需要压缩的文件列表
const files = [
  'appointments',
  'dashboard',
  'patients',
  'firebase-data-service',
  'shared',
  'data-manager',
  'cache-manager',
  'dental-chart',
  'auth-check',
  'security-utils',
  'crypto-utils',
  'persistent-cache-manager',
  'intranet-auth-guard',
  'service-mapping'
];

// 内网 JS 文件路径
const jsDir = path.join(__dirname, '..', '外网-react', 'public', '内网', 'js');

console.log('🔄 开始压缩内网 JS 文件...\n');

let totalOriginal = 0;
let totalCompressed = 0;

async function compressFile(fileName) {
  const input = path.join(jsDir, `${fileName}.js`);
  const output = path.join(jsDir, `${fileName}.min.js`);

  if (!fs.existsSync(input)) {
    console.log(`  ⚠️  跳过: ${fileName}.js (文件不存在)`);
    return;
  }

  try {
    console.log(`  ⚙️  压缩: ${fileName}.js...`);

    // 使用 Terser 压缩
    const command = `terser "${input}" --compress drop_console=true,drop_debugger=true --mangle --output "${output}"`;
    await execAsync(command);

    // 获取文件大小
    const originalStats = fs.statSync(input);
    const compressedStats = fs.statSync(output);

    const originalSize = originalStats.size;
    const compressedSize = compressedStats.size;
    const savedPercent = Math.round((1 - compressedSize / originalSize) * 100);

    totalOriginal += originalSize;
    totalCompressed += compressedSize;

    console.log(`     ✅ ${fileName}.js: ${Math.round(originalSize/1024)}KB → ${Math.round(compressedSize/1024)}KB (-${savedPercent}%)`);
  } catch (error) {
    console.error(`     ❌ ${fileName}.js 压缩失败:`, error.message);
  }
}

async function compressAll() {
  // 检查 jsDir 是否存在
  if (!fs.existsSync(jsDir)) {
    console.error(`❌ 错误: 目录不存在: ${jsDir}`);
    process.exit(1);
  }

  // 压缩所有文件
  for (const file of files) {
    await compressFile(file);
  }

  // 显示总体效果
  console.log('\n✅ 压缩完成！\n');
  console.log('📊 总体效果:');
  console.log(`   原始大小: ${Math.round(totalOriginal/1024)} KB`);
  console.log(`   压缩后: ${Math.round(totalCompressed/1024)} KB`);
  console.log(`   节省: -${Math.round((1 - totalCompressed/totalOriginal) * 100)}%\n`);
}

// 执行压缩
compressAll().catch(error => {
  console.error('❌ 压缩过程出错:', error);
  process.exit(1);
});
