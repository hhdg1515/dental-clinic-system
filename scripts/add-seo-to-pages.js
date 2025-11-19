#!/usr/bin/env node

/**
 * 为所有页面添加 SEO 组件
 */

const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', '外网-react', 'src', 'pages');

// Service 页面 SEO 配置
const serviceSEO = `import { SEO } from '../components/SEO';`;

const servicePages = [
  {
    file: 'Service.tsx',
    seoComponent: `      <SEO
        title="Our Services - Comprehensive Dental Care | First Ave Dental"
        description="提供全方位牙科服务：家庭牙科、美容牙科、根管治疗、口腔正畸、牙周病治疗、儿童牙科等。专业团队，先进设备，5个便利地点。"
        keywords="牙科服务, 牙科治疗, 美容牙科, 根管治疗, 口腔正畸, 牙周病, 儿童牙科"
        ogTitle="牙科服务项目 - First Ave Dental & Orthodontics"
        ogDescription="专业牙科服务：家庭、美容、正畸、根管治疗等"
      />`,
    importLine: 4
  },
  {
    file: 'ServicesDetail1.tsx',
    seoComponent: `      <SEO
        title="General & Family Dentistry | First Ave Dental"
        description="家庭牙科服务：定期检查、洗牙、补牙、拔牙等基础牙科护理。提供温和、专业的家庭式牙科服务，适合全家人。"
        keywords="家庭牙科, 综合牙科, 定期检查, 洗牙, 补牙, 预防性护理"
        ogTitle="家庭与综合牙科 - First Ave Dental"
        ogDescription="温和专业的家庭牙科服务，适合全家人的口腔健康"
      />`,
    importLine: 4
  },
  {
    file: 'ServicesDetail2.tsx',
    seoComponent: `      <SEO
        title="Cosmetic Dentistry & Orthodontics | First Ave Dental"
        description="美容牙科与正畸服务：牙齿美白、贴面、隐形矫正、传统矫正等。专业美容牙医，打造完美笑容。"
        keywords="美容牙科, 牙齿美白, 牙齿贴面, 隐形矫正, 牙齿矫正, 正畸"
        ogTitle="美容牙科与正畸服务 - First Ave Dental"
        ogDescription="专业美容牙科和正畸服务，打造完美笑容"
      />`,
    importLine: 4
  }
];

console.log('🔄 开始为页面添加 SEO 组件...\n');

servicePages.forEach(({ file, seoComponent, importLine }) => {
  const filePath = path.join(pagesDir, file);

  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  跳过: ${file} (文件不存在)`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // 检查是否已经有 SEO 导入
    if (content.includes("import { SEO }")) {
      console.log(`  ℹ️  ${file}: SEO 已存在，跳过`);
      return;
    }

    // 添加 SEO 导入
    const lines = content.split('\n');
    lines.splice(importLine, 0, serviceSEO);
    content = lines.join('\n');

    // 查找 return 语句并添加 SEO 组件
    const returnMatch = content.match(/(\s+)return \(\s*\n(\s+)<div className="flex min-h-screen flex-col">/);
    if (returnMatch) {
      const indent = returnMatch[1];
      const divIndent = returnMatch[2];

      content = content.replace(
        /(\s+)return \(\s*\n(\s+)<div className="flex min-h-screen flex-col">/,
        `${indent}return (\n${indent}  <>\n${seoComponent}\n${divIndent}<div className="flex min-h-screen flex-col">`
      );

      // 查找最后的 </div> 并替换为 </div></>
      const lastDivMatch = content.match(/<Footer \/>\s*\n\s*<\/div>\s*\n\s*\);\s*\n};/);
      if (lastDivMatch) {
        content = content.replace(
          /<Footer \/>\s*\n\s*<\/div>\s*\n\s*\);\s*\n};/,
          '<Footer />\n      </div>\n    </>\n  );\n};'
        );
      }

      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ ${file}: SEO 组件已添加`);
    } else {
      console.log(`  ⚠️  ${file}: 未找到匹配的 return 语句`);
    }
  } catch (error) {
    console.error(`  ❌ ${file}: 添加失败 - ${error.message}`);
  }
});

console.log('\n✅ SEO 组件添加完成！\n');
