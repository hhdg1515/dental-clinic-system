const fs = require('fs');

// 读取所有HTML文件中使用的键
const usedKeys = new Set();
const htmlFiles = ['landingpage.html', 'service.html', 'faq.html', 'services-detail-1.html', 'services-detail-2.html'];

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/data-lang="([^"]+)"/g) || [];
  matches.forEach(match => {
    const key = match.match(/data-lang="([^"]+)"/)[1];
    usedKeys.add(key);
  });
});

// 读取languages.js中定义的键
const langContent = fs.readFileSync('languages.js', 'utf8');
const definedKeys = new Set();
const keyMatches = langContent.match(/'([^']+)':\s/g) || [];
keyMatches.forEach(match => {
  const key = match.match(/'([^']+)':/)[1];
  definedKeys.add(key);
});

// 找出未使用的键
const unusedKeys = [...definedKeys].filter(key => !usedKeys.has(key));
const missingKeys = [...usedKeys].filter(key => !definedKeys.has(key));

console.log('=== 未使用的键（在languages.js中定义但HTML中未使用）===');
console.log('总数:', unusedKeys.length);
unusedKeys.sort().forEach(key => console.log('  - ' + key));

console.log('\n=== 缺失的键（在HTML中使用但languages.js中未定义）===');
console.log('总数:', missingKeys.length);
missingKeys.sort().forEach(key => console.log('  - ' + key));

console.log('\n统计：');
console.log('已使用的键:', usedKeys.size);
console.log('已定义的键:', definedKeys.size);
console.log('未使用的键:', unusedKeys.length);
console.log('缺失的键:', missingKeys.length);
