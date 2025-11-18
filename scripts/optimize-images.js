const fs = require('fs');
const path = require('path');

// 动态加载 sharp from 外网-react/node_modules
let sharp;
try {
  sharp = require('../外网-react/node_modules/sharp');
} catch (e) {
  console.error('❌ Sharp not found. Please run: cd 外网-react && npm install sharp');
  process.exit(1);
}

// 配置 - 使用绝对路径
const projectRoot = path.resolve(__dirname, '..');
const CONFIG = {
  sourceDir: path.join(projectRoot, '外网-react/public/images'),
  outputDir: path.join(projectRoot, '外网-react/public/images'),
  maxWidth: 1920,
  jpegQuality: 85,
  webpQuality: 80,  // WebP 可以用更低的质量
  backupDir: path.join(projectRoot, '外网-react/public/images-backup')
};

// 需要优化的图片 - 包括所有在 Landing 和 FAQ 使用的图片
const IMAGES_TO_OPTIMIZE = [
  // FAQ 页面大图片
  'Appointment.jpg',
  'health.jpg',
  'before.jpg',
  'preventive.png',
  'wheelchair.jpg',
  'during.jpg',
  'relax.jpg',
  'dining2.jpg',
  'after.jpg',
  'bus.jpg',
  'dining.jpg',
  'drug.jpg',
  'forest20.jpg',
  'forest35.jpg',
  'service1.jpg',
  'service2.jpg',
  // Landing 页面图片 (Hero services)
  'family.jpg',
  'cosmetic.jpg',
  'ro.jpg',        // Root canal service
  'blue.jpg',
  'local.jpg',
  'todo.jpg',
  'arcadia2.jpg',
  'arcadia.jpg',
  'rowland.jpg',
  'irvine2.jpg',
  'pasadena2.jpg',
  'eastvale.jpg',
  'eastvale2.jpg',
  // FAQ 页面 amenities
  'parking.jpg',
  // Landing 页面背景
  'forest.jpg',
  // ServicesDetail1 页面
  'or.jpg',
  // ServicesDetail2 页面
  'pe.jpg',
  'res.jpg',
  'oral.jpg'
];

async function optimizeImage(filename) {
  const inputPath = path.join(CONFIG.sourceDir, filename);
  const ext = path.extname(filename);
  const basename = path.basename(filename, ext);

  console.log(`\n🔄 Processing: ${filename}`);

  // 获取原始文件大小
  const originalSize = fs.statSync(inputPath).size;
  console.log(`   Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    console.log(`   Original dimensions: ${metadata.width}x${metadata.height}`);

    // 如果宽度超过 maxWidth,进行缩放
    const shouldResize = metadata.width > CONFIG.maxWidth;
    const resizeOptions = shouldResize ? { width: CONFIG.maxWidth } : {};

    // 生成优化后的 JPEG
    const jpegOutputPath = path.join(CONFIG.outputDir, `${basename}.jpg`);
    await image
      .clone()
      .resize(resizeOptions)
      .jpeg({ quality: CONFIG.jpegQuality, progressive: true })
      .toFile(jpegOutputPath + '.tmp');

    const jpegSize = fs.statSync(jpegOutputPath + '.tmp').size;
    console.log(`   ✅ JPEG optimized: ${(jpegSize / 1024 / 1024).toFixed(2)} MB (${Math.round((1 - jpegSize / originalSize) * 100)}% smaller)`);

    // 生成 WebP 版本
    const webpOutputPath = path.join(CONFIG.outputDir, `${basename}.webp`);
    await image
      .clone()
      .resize(resizeOptions)
      .webp({ quality: CONFIG.webpQuality })
      .toFile(webpOutputPath);

    const webpSize = fs.statSync(webpOutputPath).size;
    console.log(`   ✅ WebP generated: ${(webpSize / 1024 / 1024).toFixed(2)} MB (${Math.round((1 - webpSize / originalSize) * 100)}% smaller)`);

    // 只有当优化后的文件更小时才替换原文件
    if (jpegSize < originalSize) {
      fs.renameSync(jpegOutputPath + '.tmp', jpegOutputPath);
      console.log(`   ✅ Replaced original JPEG`);
    } else {
      fs.unlinkSync(jpegOutputPath + '.tmp');
      console.log(`   ⚠️  Optimized JPEG is larger, keeping original`);
    }

  } catch (error) {
    console.error(`   ❌ Error processing ${filename}:`, error.message);
  }
}

async function backupImages() {
  console.log('\n📦 Creating backup...');

  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
  }

  for (const filename of IMAGES_TO_OPTIMIZE) {
    const sourcePath = path.join(CONFIG.sourceDir, filename);
    const backupPath = path.join(CONFIG.backupDir, filename);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, backupPath);
    }
  }

  console.log('✅ Backup created at:', CONFIG.backupDir);
}

async function main() {
  console.log('🎨 Image Optimization Script');
  console.log('================================\n');

  // 1. 创建备份
  await backupImages();

  // 2. 优化每张图片
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  for (const filename of IMAGES_TO_OPTIMIZE) {
    const filePath = path.join(CONFIG.sourceDir, filename);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${filename} (not found)`);
      continue;
    }

    const originalSize = fs.statSync(filePath).size;
    totalOriginalSize += originalSize;

    await optimizeImage(filename);

    const optimizedSize = fs.statSync(filePath).size;
    totalOptimizedSize += optimizedSize;
  }

  console.log('\n\n✅ Image optimization completed!');
  console.log(`\n📊 Summary:`);
  console.log(`   Original total: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Optimized total: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Saved: ${(((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100).toFixed(1)}%`);
  console.log(`\n📁 Backup location: ${CONFIG.backupDir}`);
  console.log(`💡 To restore: cp ${CONFIG.backupDir}/* ${CONFIG.sourceDir}/`);
}

main().catch(console.error);
