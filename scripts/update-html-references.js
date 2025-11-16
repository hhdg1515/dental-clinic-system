#!/usr/bin/env node

/**
 * 批量更新 HTML 文件中的 JS 引用为 .min.js
 */

const fs = require('fs');
const path = require('path');

// 需要更新的 HTML 文件列表
const htmlFiles = [
  '内网/appointments.html',
  '内网/dashboard.html',
  '内网/patients.html',
  '外网-react/public/内网/appointments.html',
  '外网-react/public/内网/dashboard.html',
  '外网-react/public/内网/patients.html'
];

// 需要更新为 .min.js 的 JS 文件列表
const jsFiles = [
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

console.log('🔄 开始更新 HTML 文件中的 JS 引用...\n');

let totalUpdates = 0;

htmlFiles.forEach(htmlFile => {
  const filePath = path.join(__dirname, '..', htmlFile);

  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  跳过: ${htmlFile} (文件不存在)`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updates = 0;

    // 对每个 JS 文件进行替换
    jsFiles.forEach(jsFile => {
      // 匹配模式：src="js/filename.js" 或 src="filename.js"
      const patterns = [
        new RegExp(`src="js/${jsFile}\\.js"`, 'g'),
        new RegExp(`src="${jsFile}\\.js"`, 'g')
      ];

      patterns.forEach((pattern, index) => {
        const replacement = index === 0
          ? `src="js/${jsFile}.min.js"`
          : `src="${jsFile}.min.js"`;

        const beforeLength = content.length;
        content = content.replace(pattern, replacement);

        if (content.length !== beforeLength) {
          updates++;
        }
      });
    });

    if (updates > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ ${htmlFile}: 更新了 ${updates} 个引用`);
      totalUpdates += updates;
    } else {
      console.log(`  ℹ️  ${htmlFile}: 无需更新`);
    }
  } catch (error) {
    console.error(`  ❌ ${htmlFile}: 更新失败 - ${error.message}`);
  }
});

console.log(`\n✅ 更新完成！共更新了 ${totalUpdates} 个 JS 引用\n`);
