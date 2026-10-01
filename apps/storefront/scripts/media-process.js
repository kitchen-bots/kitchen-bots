/**
 * KitchenBots Media Pipeline
 * 
 * Processes raw product media from external source directory:
 *   - Samples 40 even-spaced frames from each JPG sequence, converts to WebP (quality 80, max 800px)
 *   - Copies best product thumbnail PNG → WebP  
 *   - Copies product videos to public/videos/
 * 
 * Run: node scripts/media-process.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_IMAGES_DIR = 'D:\\File sharing\\Products Images-20260303T102701Z-3-001\\Products Images';
const SOURCE_VIDEOS_DIR = 'D:\\File sharing\\Products Images-20260303T102701Z-3-001\\Product videos';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const DEST_SEQUENCES = path.join(PUBLIC_DIR, '3d-assets', 'sequences');
const DEST_IMAGES = path.join(PUBLIC_DIR, 'images', 'products');
const DEST_VIDEOS = path.join(PUBLIC_DIR, 'videos');

const TARGET_FRAMES = 40;
const MAX_WIDTH = 800;
const WEBP_QUALITY = 80;

// Ensure all output directories exist
[DEST_SEQUENCES, DEST_IMAGES, DEST_VIDEOS].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Product mapping: each product ID maps to:
//   - sequenceDir: folder containing the numbered JPG frames
//   - imageDir: folder containing the render PNGs for the thumbnail
//   - videoFile: corresponding MP4 file name in the videos dir
const PRODUCTS = [
    {
        id: 'kb-flip-bbq-std',
        sequenceDir: path.join(SOURCE_IMAGES_DIR, '1_Visualise Files - Flip Base', 'Flip BBQ with Standard Base V1_02142026_001417'),
        imageDir: path.join(SOURCE_IMAGES_DIR, '1_Visualise Files - Flip Base'),
        videoFile: 'Flip BBQ with Standard Base V1.mp4',
    },
    {
        id: 'kb-flip-bbq-adj',
        sequenceDir: path.join(SOURCE_IMAGES_DIR, '2_Visualise Files - Flip Base Height Adjustable'),
        imageDir: path.join(SOURCE_IMAGES_DIR, '2_Visualise Files - Flip Base Height Adjustable'),
        videoFile: 'Flip Height Adjustable Open Model Pint 4.mp4',
    },
    {
        id: 'kb-collapsible-bbq-big',
        sequenceDir: path.join(SOURCE_IMAGES_DIR, '3_Visualise Files - Collapsible_BBQ'),
        imageDir: path.join(SOURCE_IMAGES_DIR, '3_Visualise Files - Collapsible_BBQ'),
        videoFile: '1_Collapasible Big SS Model 2.mp4',
    },
    {
        id: 'kb-collapsible-flip',
        sequenceDir: path.join(SOURCE_IMAGES_DIR, '4_Visualise Files  - Collapsible_Flip'),
        imageDir: path.join(SOURCE_IMAGES_DIR, '4_Visualise Files  - Collapsible_Flip'),
        videoFile: 'Collapsible BBQ and Flip 6.mp4',
    },
    {
        id: 'kb-collapsible-bbq-small',
        sequenceDir: path.join(SOURCE_IMAGES_DIR, '5_Visualise Files  - Collapsible_BBQ Small'),
        imageDir: path.join(SOURCE_IMAGES_DIR, '5_Visualise Files  - Collapsible_BBQ Small'),
        videoFile: '1_Collapasible Big SS Model 2.mp4',
    },
    {
        id: 'kb-rocket-stove-150',
        sequenceDir: path.join(SOURCE_IMAGES_DIR, '6_Visualise Files - Rocket Stove_150MM'),
        imageDir: path.join(SOURCE_IMAGES_DIR, '6_Visualise Files - Rocket Stove_150MM'),
        videoFile: '1_Rocket Stove 150MM Painted Model 5.mp4',
    },
    {
        id: 'kb-rocket-stove-coll',
        sequenceDir: path.join(SOURCE_IMAGES_DIR, '7_Visualise Files - Rocket Stove_Collapsible'),
        imageDir: path.join(SOURCE_IMAGES_DIR, '7_Visualise Files - Rocket Stove_Collapsible'),
        videoFile: 'Rocket Stove Collapsible Small 7.mp4',
    },
    {
        id: 'kb-auto-bbq-ss',
        sequenceDir: path.join(SOURCE_IMAGES_DIR, '8_Visualise Renders  - Automatic BBQ'),
        imageDir: path.join(SOURCE_IMAGES_DIR, '8_Visualise Renders  - Automatic BBQ'),
        videoFile: 'Automatic BBQ SS Model.mp4',
    },
    {
        id: 'kb-santa-maria-med',
        sequenceDir: path.join(SOURCE_IMAGES_DIR, '9_Visualise Files -Santa Maria Grill Medium'),
        imageDir: path.join(SOURCE_IMAGES_DIR, '9_Visualise Files -Santa Maria Grill Medium'),
        videoFile: 'SantaMaria BBQ Meduim- Paint Model 4.1.mp4',
    },
    {
        id: 'kb-santa-maria-small',
        sequenceDir: path.join(SOURCE_IMAGES_DIR, '10_Visualise Files -Santa Maria Grill Small'),
        imageDir: path.join(SOURCE_IMAGES_DIR, '10_Visualise Files -Santa Maria Grill Small'),
        videoFile: 'SantaMaria BBQ Meduim- Paint Model 4.mp4',
    },
    {
        id: 'kb-suitcase-bbq-big',
        sequenceDir: path.join(SOURCE_IMAGES_DIR, '11_Visualise Files - Suitcase BBQ Big'),
        imageDir: path.join(SOURCE_IMAGES_DIR, '11_Visualise Files - Suitcase BBQ Big'),
        videoFile: '1_Suitcase BBQ Big Painted 3.mp4',
    },
    {
        id: 'kb-suitcase-bbq-small',
        sequenceDir: path.join(SOURCE_IMAGES_DIR, '12_Visualise Files - Suitcase BBQ Small'),
        imageDir: path.join(SOURCE_IMAGES_DIR, '12_Visualise Files - Suitcase BBQ Small'),
        videoFile: 'Suitcase BBQ Small - Paint Model 5.mp4',
    },
];

/**
 * Recursively find all .jpg/.jpeg/.png files in a directory (sorted)
 */
function collectImageFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    const results = [];

    function walk(d) {
        const entries = fs.readdirSync(d, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(d, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            } else if (/\.(jpg|jpeg|png)$/i.test(entry.name)) {
                results.push(full);
            }
        }
    }
    walk(dir);
    results.sort();
    return results;
}

/**
 * Evenly sample `count` frames from an array of file paths
 */
function sampleFrames(files, count) {
    if (files.length <= count) return files;
    const sampled = [];
    const step = (files.length - 1) / (count - 1);
    for (let i = 0; i < count; i++) {
        const index = Math.round(i * step);
        sampled.push(files[Math.min(index, files.length - 1)]);
    }
    return sampled;
}

/**
 * Process 360 sequence for a product: sample 40 frames, convert to WebP
 */
async function processSequence(product) {
    const outDir = path.join(DEST_SEQUENCES, product.id);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const allFiles = collectImageFiles(product.sequenceDir);
    if (allFiles.length === 0) {
        console.warn(`  ⚠ No sequence images found for ${product.id} in ${product.sequenceDir}`);
        return 0;
    }

    const sampled = sampleFrames(allFiles, TARGET_FRAMES);
    console.log(`  Found ${allFiles.length} frames → sampling ${sampled.length}`);

    for (let i = 0; i < sampled.length; i++) {
        const src = sampled[i];
        const dest = path.join(outDir, String(i).padStart(3, '0') + '.webp');

        // Skip if already generated (incremental)
        if (fs.existsSync(dest)) continue;

        try {
            await sharp(src)
                .resize({ width: MAX_WIDTH, withoutEnlargement: true })
                .webp({ quality: WEBP_QUALITY })
                .toFile(dest);
        } catch (err) {
            console.error(`  Error converting frame ${src}:`, err.message);
        }
    }

    console.log(`  ✓ Sequence done: ${sampled.length} WebP frames → ${outDir}`);
    return sampled.length;
}

/**
 * Process product thumbnail: find first/best PNG, convert to WebP
 */
async function processThumbnail(product) {
    const allImages = collectImageFiles(product.imageDir).filter(f => /\.(png)$/i.test(f));
    // Prefer non-sequence images (render PNGs rather than raw sequence frames)
    // Take the first PNG that's directly in the imageDir (not in a sub-sequence folder)
    let best = allImages.find(f => path.dirname(f) === product.imageDir);
    if (!best) best = allImages[0]; // fallback to any

    if (!best) {
        console.warn(`  ⚠ No PNG found for thumbnail of ${product.id}`);
        return null;
    }

    const dest = path.join(DEST_IMAGES, `${product.id}.webp`);
    if (fs.existsSync(dest)) {
        console.log(`  ✓ Thumbnail already exists: ${dest}`);
        return `/images/products/${product.id}.webp`;
    }

    try {
        await sharp(best)
            .resize({ width: 1600, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(dest);
        console.log(`  ✓ Thumbnail: ${path.basename(best)} → ${product.id}.webp`);
        return `/images/products/${product.id}.webp`;
    } catch (err) {
        console.error(`  Error processing thumbnail for ${product.id}:`, err.message);
        return null;
    }
}

/**
 * Copy product video to public/videos/ if it exists
 */
function copyVideo(videoFile) {
    const src = path.join(SOURCE_VIDEOS_DIR, videoFile);
    const dest = path.join(DEST_VIDEOS, videoFile);
    if (!fs.existsSync(src)) {
        console.warn(`  ⚠ Video not found: ${src}`);
        return null;
    }
    if (fs.existsSync(dest)) {
        console.log(`  ✓ Video already copied: ${videoFile}`);
        return `/videos/${videoFile}`;
    }
    fs.copyFileSync(src, dest);
    console.log(`  ✓ Video copied: ${videoFile}`);
    return `/videos/${videoFile}`;
}

async function main() {
    console.log('🔥 KitchenBots Media Pipeline Starting...\n');
    const metadata = {};

    for (const product of PRODUCTS) {
        console.log(`\n📦 Processing: ${product.id}`);

        const frameCount = await processSequence(product);
        const thumbnailPath = await processThumbnail(product);
        const videoPath = copyVideo(product.videoFile);

        metadata[product.id] = {
            id: product.id,
            frames: frameCount,
            image: thumbnailPath || `/images/products/${product.id}.webp`,
            video: videoPath,
        };
    }

    // Write metadata JSON for the app to consume
    const metaPath = path.join(__dirname, '..', 'src', 'data', 'media-metadata.json');
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
    console.log(`\n✅ Media metadata written to ${metaPath}`);
    console.log('\n🎉 Media pipeline complete!');
}

main().catch(console.error);
