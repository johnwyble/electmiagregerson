const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const DIST = path.join(__dirname, 'dist');
const IMG_SRC = path.join(SRC, 'images');
const IMG_DIST = path.join(DIST, 'images');

const SIZE_RULES = [
  { pattern: /hero/i, maxWidth: 1920, quality: 80 },
  { pattern: /about/i, maxWidth: 900, quality: 82 },
  { pattern: /endors/i, maxWidth: 250, quality: 80 },
  { pattern: /logo/i, maxWidth: 400, quality: 85 },
  { pattern: /favicon/i, maxWidth: 64, quality: 90 },
];
const DEFAULT_RULE = { maxWidth: 1200, quality: 80 };

function getRule(filename) {
  for (const rule of SIZE_RULES) {
    if (rule.pattern.test(filename)) return rule;
  }
  return DEFAULT_RULE;
}

async function build() {
  console.log('Building campaign site...\n');

  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
  fs.mkdirSync(DIST, { recursive: true });
  fs.mkdirSync(IMG_DIST, { recursive: true });

  const staticFiles = ['index.html', 'site-config.json', '_redirects'];
  for (const file of staticFiles) {
    const src = path.join(SRC, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DIST, file));
      console.log(`  Copied ${file}`);
    }
  }

  if (!fs.existsSync(IMG_SRC)) {
    console.log('\n  No images/ folder found. Skipping image optimization.');
    console.log('\nBuild complete.');
    return;
  }

  const files = fs.readdirSync(IMG_SRC).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
  });

  if (files.length === 0) {
    console.log('\n  No images found. Skipping optimization.');
    console.log('\nBuild complete.');
    return;
  }

  console.log(`\n  Optimizing ${files.length} image(s)...\n`);

  let totalOriginal = 0;
  let totalOptimized = 0;

  for (const file of files) {
    const inputPath = path.join(IMG_SRC, file);
    const ext = path.extname(file).toLowerCase();
    const baseName = path.basename(file, ext);
    const outputPath = path.join(IMG_DIST, `${baseName}.webp`);
    const fallbackPath = path.join(IMG_DIST, file);
    const rule = getRule(file);
    const originalSize = fs.statSync(inputPath).size;
    totalOriginal += originalSize;

    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      const needsResize = metadata.width > rule.maxWidth;

      let pipeline = sharp(inputPath);
      if (needsResize) pipeline = pipeline.resize(rule.maxWidth, null, { withoutEnlargement: true });
      await pipeline.webp({ quality: rule.quality }).toFile(outputPath);

      pipeline = sharp(inputPath);
      if (needsResize) pipeline = pipeline.resize(rule.maxWidth, null, { withoutEnlargement: true });
      if (ext === '.png') {
        await pipeline.png({ quality: rule.quality, compressionLevel: 9 }).toFile(fallbackPath);
      } else {
        await pipeline.jpeg({ quality: rule.quality, mozjpeg: true }).toFile(fallbackPath);
      }

      const webpSize = fs.statSync(outputPath).size;
      const fallbackSize = fs.statSync(fallbackPath).size;
      totalOptimized += Math.min(webpSize, fallbackSize);
      const savings = Math.round((1 - webpSize / originalSize) * 100);
      const dims = needsResize ? ` → ${rule.maxWidth}px wide` : '';
      console.log(`    ${file}${dims} — ${formatBytes(originalSize)} → ${formatBytes(webpSize)} (${savings}% smaller)`);
    } catch (err) {
      console.log(`    ${file} — copying original (optimization failed: ${err.message})`);
      fs.copyFileSync(inputPath, fallbackPath);
      totalOptimized += originalSize;
    }
  }

  const totalSavings = Math.round((1 - totalOptimized / totalOriginal) * 100);
  console.log(`\n  Total: ${formatBytes(totalOriginal)} → ${formatBytes(totalOptimized)} (${totalSavings}% smaller)`);
  console.log('\nBuild complete. Output in /dist/');
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});