/**
 * KitchenBots Media Pipeline (ESM)
 *
 * Processes raw product media from external source directory:
 *   - Samples 40 even-spaced frames from each JPG sequence → WebP (quality 80, max 800px)
 *   - Copies best PNG thumbnail per product → WebP
 *   - Copies product videos → public/videos/
 *
 * Run: node scripts/media-process.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_IMAGES_DIR = 'D:\\File sharing\\Products Images-20260303T102701Z-3-001\\Products Images';
const SOURCE_VIDEOS_DIR = 'D:\\File sharing\\Products Images-20260303T102701Z-3-001\\Product videos';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const DEST_SEQUENCES = path.join(PUBLIC_DIR, '3d-assets', 'sequences');
const DEST_IMAGES = path.join(PUBLIC_DIR, 'images', 'products');
const DEST_VIDEOS = path.join(PUBLIC_DIR, 'videos');

const TARGET_FRAMES = 40;
const MAX_WIDTH = 800;
const WEBP_QUALITY = 80;

[DEST_SEQUENCES, DEST_IMAGES, DEST_VIDEOS].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

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

function collectImageFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    const results = [];
    function walk(d) {
        const entries = fs.readdirSync(d, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(d, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (/\.(jpg|jpeg|png)$/i.test(entry.name)) results.push(full);
        }
    }
    walk(dir);
    results.sort();
    return results;
}

function sampleFrames(files, count) {
    if (files.length === 0) return [];
    if (files.length <= count) return files;
    const sampled = [];
    const step = (files.length - 1) / (count - 1);
    for (let i = 0; i < count; i++) {
        const index = Math.round(i * step);
        sampled.push(files[Math.min(index, files.length - 1)]);
    }
    return sampled;
}

async function processSequence(product) {
    const outDir = path.join(DEST_SEQUENCES, product.id);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const allFiles = collectImageFiles(product.sequenceDir);
    if (allFiles.length === 0) {
        console.warn(`  ⚠ No sequence images found for ${product.id}`);
        return 0;
    }

    const sampled = sampleFrames(allFiles, TARGET_FRAMES);
    console.log(`  Found ${allFiles.length} frames → sampling ${sampled.length}`);

    let converted = 0;
    for (let i = 0; i < sampled.length; i++) {
        const dest = path.join(outDir, String(i).padStart(3, '0') + '.webp');
        if (fs.existsSync(dest)) { converted++; continue; }
        try {
            await sharp(sampled[i])
                .resize({ width: MAX_WIDTH, withoutEnlargement: true })
                .webp({ quality: WEBP_QUALITY })
                .toFile(dest);
            converted++;
        } catch (err) {
            console.error(`  Frame error [${i}]:`, err.message);
        }
    }

    console.log(`  ✓ Sequence: ${converted}/${sampled.length} WebP frames`);
    return sampled.length;
}

async function processThumbnail(product) {
    const dest = path.join(DEST_IMAGES, `${product.id}.webp`);
    if (fs.existsSync(dest)) {
        console.log(`  ✓ Thumbnail already exists`);
        return `/images/products/${product.id}.webp`;
    }

    // Find PNGs directly in the imageDir (not in sub-sequence dirs)
    const directPngs = fs.existsSync(product.imageDir)
        ? fs.readdirSync(product.imageDir, { withFileTypes: true })
            .filter(e => e.isFile() && /\.(png)$/i.test(e.name))
            .map(e => path.join(product.imageDir, e.name))
        : [];

    // Fallback: any PNG anywhere in the folder
    const allPngs = directPngs.length > 0 ? directPngs : collectImageFiles(product.imageDir).filter(f => /\.png$/i.test(f));

    if (allPngs.length === 0) {
        console.warn(`  ⚠ No PNG for thumbnail of ${product.id}`);
        return null;
    }

    try {
        await sharp(allPngs[0])
            .resize({ width: 1600, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(dest);
        console.log(`  ✓ Thumbnail → ${product.id}.webp`);
        return `/images/products/${product.id}.webp`;
    } catch (err) {
        console.error(`  Thumbnail error:`, err.message);
        return null;
    }
}

function copyVideo(videoFile) {
    const src = path.join(SOURCE_VIDEOS_DIR, videoFile);
    const dest = path.join(DEST_VIDEOS, videoFile);
    if (!fs.existsSync(src)) { console.warn(`  ⚠ Video not found: ${videoFile}`); return null; }
    if (fs.existsSync(dest)) { console.log(`  ✓ Video already exists`); return `/videos/${videoFile}`; }
    fs.copyFileSync(src, dest);
    console.log(`  ✓ Video copied: ${videoFile}`);
    return `/videos/${videoFile}`;
}

async function main() {
    console.log('🔥 KitchenBots Media Pipeline\n');
    const metadata = {};

    for (const product of PRODUCTS) {
        console.log(`\n📦 ${product.id}`);
        const frames = await processSequence(product);
        const image = await processThumbnail(product);
        const video = copyVideo(product.videoFile);
        metadata[product.id] = { id: product.id, frames, image: image || `/images/products/${product.id}.webp`, video };
    }

    const outPath = path.join(__dirname, '..', 'src', 'data', 'media-metadata.json');
    fs.writeFileSync(outPath, JSON.stringify(metadata, null, 2));
    console.log(`\n✅ Metadata written → ${outPath}`);
    console.log('🎉 Done!');
}

main().catch(console.error);
