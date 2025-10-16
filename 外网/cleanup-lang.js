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

// 添加缺失的键
const missingKeys = {
  'form-detail': {
    en: 'Schedule your appointment with our specialists today and experience the highest standard of personalized dental care. We are committed to support your journey towards your well-being.',
    zh: '立即预约我们的专家，体验最高标准的个性化牙科护理。我们致力于支持您迈向健康之旅。'
  },
  'form-no-account': {
    en: "Don't have an account?",
    zh: '还没有账户？'
  },
  'story-subtitle': {
    en: 'WE LOVE HEARING FROM PATIENTS',
    zh: '我们倾听每一位患者'
  },
  'tip-insurance-title': {
    en: 'Insurance & Documentation',
    zh: '保险与文件'
  },
  'tip-insurance-text': {
    en: 'Bring your insurance card, photo ID, and current medication list for a smooth check-in process.',
    zh: '请携带您的保险卡、带照片的身份证件和当前用药清单，以便顺利办理入院手续。'
  },
  'tip-comfort-title': {
    en: 'Comfort & Preparation',
    zh: '舒适与准备'
  },
  'tip-comfort-text': {
    en: 'Eat a light meal beforehand, arrive 15 minutes early, and let us know about any dental anxiety.',
    zh: '提前进食清淡餐食，提早15分钟到达，并告知我们您的任何牙科焦虑。'
  },
  'tip-aftercare-title': {
    en: 'Post-Treatment Care',
    zh: '治疗后护理'
  },
  'tip-aftercare-text': {
    en: 'Plan for soft foods after procedures and arrange transportation if sedation is involved.',
    zh: '治疗后请准备软食，如涉及镇静，请安排交通工具。'
  }
};

// 将缺失的键添加到使用的键集合中
Object.keys(missingKeys).forEach(key => usedKeys.add(key));

// 读取原始languages.js
const langContent = fs.readFileSync('languages.js', 'utf8');

// 提取en和zh对象
const enMatch = langContent.match(/en:\s*\{([\s\S]*?)\n\s*\},\s*\n\s*zh:/);
const zhMatch = langContent.match(/zh:\s*\{([\s\S]*?)\n\s*\}\s*\};/);

if (!enMatch || !zhMatch) {
  console.error('无法解析languages.js文件');
  process.exit(1);
}

const enContent = enMatch[1];
const zhContent = zhMatch[1];

// 提取所有键值对
function extractKeyValues(content) {
  const keyValues = {};
  const regex = /'([^']+)':\s*'([^']*(?:\\'[^']*)*)'/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    keyValues[match[1]] = match[2];
  }
  return keyValues;
}

const enKeyValues = extractKeyValues(enContent);
const zhKeyValues = extractKeyValues(zhContent);

// 添加缺失的键
Object.keys(missingKeys).forEach(key => {
  enKeyValues[key] = missingKeys[key].en;
  zhKeyValues[key] = missingKeys[key].zh;
});

// 过滤出使用的键
const filteredEnKeys = {};
const filteredZhKeys = {};

[...usedKeys].sort().forEach(key => {
  if (enKeyValues[key]) {
    filteredEnKeys[key] = enKeyValues[key];
  }
  if (zhKeyValues[key]) {
    filteredZhKeys[key] = zhKeyValues[key];
  }
});

// 生成新的languages.js内容
let newContent = `// languages.js - 双语数据文件 (精简版)\nconst languages = {\n    en: {\n`;

Object.keys(filteredEnKeys).forEach(key => {
  newContent += `        '${key}': '${filteredEnKeys[key]}',\n`;
});

newContent += `    },\n\n    zh: {\n`;

Object.keys(filteredZhKeys).forEach(key => {
  newContent += `        '${key}': '${filteredZhKeys[key]}',\n`;
});

newContent += `    }\n};\n\n`;

// 添加脚本部分
const scriptMatch = langContent.match(/(\/\/ 默认语言[\s\S]*$)/);
if (scriptMatch) {
  newContent += scriptMatch[1];
}

// 写入新文件
fs.writeFileSync('languages-new.js', newContent, 'utf8');

console.log('✅ 新的精简版languages.js已生成为languages-new.js');
console.log('保留的键数量:', Object.keys(filteredEnKeys).length);
console.log('请检查新文件，确认无误后替换原文件');
