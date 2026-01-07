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

// 配置
const projectRoot = path.resolve(__dirname, '..');
const CONFIG = {
  sourceDir: path.join(projectRoot, '外网-react/public/images'),
  maxWidth: 1920,
  jpegQuality: 82,  // 稍微降低质量以获得更好的压缩
  webpQuality: 78
};

// 需要压缩的超大图片 (>700KB)
const LARGE_IMAGES = [
  'health.jpg',
  'before.jpg',
  'root-canal-hero.jpg',
  'wheelchair.jpg',
  'during.jpg',
  'relax.jpg',
  'dining2.jpg'
];

async function compressImage(filename) {
  const inputPath = path.join(CONFIG.sourceDir, filename);
  const ext = path.extname(filename);
  const basename = path.basename(filename, ext);

  if (!fs.existsSync(inputPath)) {
    console.log(`⚠️  Skipping ${filename} (not found)`);
    return { original: 0, compressed: 0 };
  }

  console.log(`\n🔄 Processing: ${filename}`);

  const originalSize = fs.statSync(inputPath).size;
  console.log(`   Original: ${(originalSize / 1024).toFixed(0)} KB`);

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // 缩放选项
    const shouldResize = metadata.width > CONFIG.maxWidth;
    const resizeOptions = shouldResize ? { width: CONFIG.maxWidth } : {};

    // 1. 压缩 JPEG
    const jpegOutputPath = path.join(CONFIG.sourceDir, `${basename}.jpg`);
    const tempPath = jpegOutputPath + '.tmp';

    await image
      .clone()
      .resize(resizeOptions)
      .jpeg({ quality: CONFIG.jpegQuality, progressive: true, mozjpeg: true })
      .toFile(tempPath);

    const jpegSize = fs.statSync(tempPath).size;
    const jpegSavings = Math.round((1 - jpegSize / originalSize) * 100);

    // 只有压缩后更小才替换
    if (jpegSize < originalSize) {
      fs.unlinkSync(inputPath);
      fs.renameSync(tempPath, jpegOutputPath);
      console.log(`   ✅ JPEG: ${(jpegSize / 1024).toFixed(0)} KB (-${jpegSavings}%)`);
    } else {
      fs.unlinkSync(tempPath);
      console.log(`   ⚠️  JPEG larger, kept original`);
    }

    // 2. 生成/更新 WebP
    const webpOutputPath = path.join(CONFIG.sourceDir, `${basename}.webp`);
    await sharp(jpegOutputPath)
      .webp({ quality: CONFIG.webpQuality })
      .toFile(webpOutputPath);

    const webpSize = fs.statSync(webpOutputPath).size;
    const webpSavings = Math.round((1 - webpSize / originalSize) * 100);
    console.log(`   ✅ WebP: ${(webpSize / 1024).toFixed(0)} KB (-${webpSavings}%)`);

    return { original: originalSize, compressed: Math.min(jpegSize, originalSize) };

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { original: originalSize, compressed: originalSize };
  }
}

async function main() {
  console.log('🎨 Compressing Large Images (>700KB)');
  console.log('=====================================\n');

  let totalOriginal = 0;
  let totalCompressed = 0;

  for (const filename of LARGE_IMAGES) {
    const result = await compressImage(filename);
    totalOriginal += result.original;
    totalCompressed += result.compressed;
  }

  const totalSavings = totalOriginal > 0
    ? Math.round((1 - totalCompressed / totalOriginal) * 100)
    : 0;

  console.log('\n\n📊 Summary');
  console.log('==========');
  console.log(`   Before: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   After:  ${(totalCompressed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Saved:  ${totalSavings}%`);
  console.log('\n✅ Done!');
}

main().catch(console.error);
