const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'images');
const PRODUCTS_DIR = path.join(PUBLIC_DIR, 'products');

async function optimizeImage(filePath, targetSizeKB, outputName) {
  const stats = fs.statSync(filePath);
  const sizeKB = stats.size / 1024;
  
  if (sizeKB > targetSizeKB) {
    console.log(`Optimizing ${path.basename(filePath)} (${sizeKB.toFixed(1)}KB) -> target < ${targetSizeKB}KB`);
    const output = path.join(path.dirname(filePath), outputName || path.basename(filePath).replace(/\.(png|jpg|jpeg)/, '.webp'));
    
    let quality = 80;
    let width = 1200; // Cap width for LCP optimization
    
    // For hero images, keep higher quality but convert to webp
    if (targetSizeKB === 300) { quality = 75; width = 1920; }
    else if (targetSizeKB === 150) { quality = 70; width = 1000; }

    await sharp(filePath)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 6 })
      .toFile(output);
    
    const newStats = fs.statSync(output);
    console.log(`  Done: ${path.basename(output)} (${(newStats.size / 1024).toFixed(1)}KB)`);
    return output;
  }
}

async function run() {
  console.log('--- Starting Image Optimization ---');
  
  // Hero Images
  const heroImages = ['lifestyle-hero.png', 'lifestyle-story.png'];
  for (const img of heroImages) {
    const p = path.join(PUBLIC_DIR, img);
    if (fs.existsSync(p)) await optimizeImage(p, 300);
  }

  // Product Images
  const files = fs.readdirSync(PRODUCTS_DIR);
  for (const file of files) {
    if (file.match(/\.(png|jpg|jpeg)$/)) {
      await optimizeImage(path.join(PRODUCTS_DIR, file), 150);
    }
  }

  console.log('--- Optimization Complete ---');
}

run().catch(console.error);
