const fs = require('fs');
const path = require('path');

// 动态加载 sharp from 外网-react/node_modules
let sharp;
try {
  sharp = require('../外网-react/node_modules/sharp');
} catch (e) {
  console.error('❌ Sharp not found. Please run: cd 外网-react && npm install');
  process.exit(1);
}

// 配置
const projectRoot = path.resolve(__dirname, '..');
const CONFIG = {
  sourceDir: path.join(projectRoot, '外网-react/public/images'),
  webpQuality: 80,
  maxWidth: 1920
};

async function generateWebP(jpgPath) {
  const dir = path.dirname(jpgPath);
  const basename = path.basename(jpgPath, path.extname(jpgPath));
  const webpPath = path.join(dir, `${basename}.webp`);

  // 跳过已有 WebP 的文件
  if (fs.existsSync(webpPath)) {
    return { status: 'skipped', file: path.basename(jpgPath) };
  }

  try {
    const originalSize = fs.statSync(jpgPath).size;

    await sharp(jpgPath)
      .resize({ width: CONFIG.maxWidth, withoutEnlargement: true })
      .webp({ quality: CONFIG.webpQuality })
      .toFile(webpPath);

    const webpSize = fs.statSync(webpPath).size;
    const savings = Math.round((1 - webpSize / originalSize) * 100);

    return {
      status: 'created',
      file: path.basename(jpgPath),
      originalKB: Math.round(originalSize / 1024),
      webpKB: Math.round(webpSize / 1024),
      savings
    };
  } catch (error) {
    return { status: 'error', file: path.basename(jpgPath), error: error.message };
  }
}

async function main() {
  console.log('🖼️  Generating Missing WebP Images');
  console.log('===================================\n');

  // 获取所有 JPG 文件
  const files = fs.readdirSync(CONFIG.sourceDir);
  const jpgFiles = files.filter(f => f.toLowerCase().endsWith('.jpg'));

  console.log(`Found ${jpgFiles.length} JPG files\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;
  let totalSaved = 0;

  for (const file of jpgFiles) {
    const jpgPath = path.join(CONFIG.sourceDir, file);
    const result = await generateWebP(jpgPath);

    if (result.status === 'created') {
      console.log(`✅ ${result.file} → WebP (${result.originalKB}KB → ${result.webpKB}KB, -${result.savings}%)`);
      created++;
      totalSaved += (result.originalKB - result.webpKB);
    } else if (result.status === 'skipped') {
      skipped++;
    } else {
      console.log(`❌ ${result.file}: ${result.error}`);
      errors++;
    }
  }

  console.log('\n📊 Summary');
  console.log('==========');
  console.log(`   Created: ${created} WebP files`);
  console.log(`   Skipped: ${skipped} (already exist)`);
  console.log(`   Errors:  ${errors}`);
  if (totalSaved > 0) {
    console.log(`   Saved:   ${Math.round(totalSaved / 1024)} MB total`);
  }
  console.log('\n✅ Done!');
}

main().catch(console.error);
