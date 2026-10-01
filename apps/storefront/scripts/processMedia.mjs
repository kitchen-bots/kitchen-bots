import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const SOURCE_IMAGES_DIR = 'D:\\File sharing\\Products Images-20260303T102701Z-3-001\\Products Images';
const SOURCE_VIDEOS_DIR = 'D:\\File sharing\\Products Images-20260303T102701Z-3-001\\Product videos';
const TARGET_DIR = path.join(process.cwd(), 'public', '3d-assets');

async function ensureDir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }
}

async function processImages() {
    console.log('Processing Product Image Sequences...');
    await ensureDir(path.join(TARGET_DIR, 'sequences'));

    const products = await fs.readdir(SOURCE_IMAGES_DIR);

    for (const product of products) {
        const productPath = path.join(SOURCE_IMAGES_DIR, product);
        const stat = await fs.stat(productPath);
        if (!stat.isDirectory()) continue;

        console.log(`Processing ${product}...`);
        const targetProductDir = path.join(TARGET_DIR, 'sequences', product);
        await ensureDir(targetProductDir);

        // Look for sequence folders inside product folder, or process images directly
        const items = await fs.readdir(productPath);
        for (const item of items) {
            const itemPath = path.join(productPath, item);
            const itemStat = await fs.stat(itemPath);

            if (itemStat.isDirectory()) {
                // It's a sequence folder
                const frames = await fs.readdir(itemPath);
                // Filter only images
                const images = frames.filter(f => f.match(/\.(jpg|jpeg|png)$/i)).sort();

                // Downsample to max 60 frames to save space/memory
                const step = Math.max(1, Math.floor(images.length / 60));
                const selectedFrames = images.filter((_, i) => i % step === 0).slice(0, 60);

                for (let i = 0; i < selectedFrames.length; i++) {
                    const frameName = selectedFrames[i];
                    const sourceFramePath = path.join(itemPath, frameName);
                    const targetFrameName = `${i.toString().padStart(3, '0')}.webp`;
                    const targetFramePath = path.join(targetProductDir, targetFrameName);

                    try {
                        await sharp(sourceFramePath)
                            .resize({ width: 1200, withoutEnlargement: true })
                            .webp({ quality: 80 })
                            .toFile(targetFramePath);
                    } catch (err) {
                        console.error(`Error processing ${frameName}:`, err);
                    }
                }
                console.log(`Processed ${selectedFrames.length} frames for ${product}`);
            }
        }
    }
}

async function processVideos() {
    console.log('Processing Product Videos...');
    await ensureDir(path.join(TARGET_DIR, 'videos'));

    const videos = await fs.readdir(SOURCE_VIDEOS_DIR);

    for (const video of videos) {
        if (!video.match(/\.(mp4|mov|avi)$/i)) continue;

        const sourceVideoPath = path.join(SOURCE_VIDEOS_DIR, video);
        const baseName = path.basename(video, path.extname(video));
        const targetMp4Path = path.join(TARGET_DIR, 'videos', `${baseName}.mp4`);
        const targetWebmPath = path.join(TARGET_DIR, 'videos', `${baseName}.webm`);

        console.log(`Processing video: ${video}...`);

        // Convert to optimized MP4
        await new Promise((resolve, reject) => {
            ffmpeg(sourceVideoPath)
                .outputOptions([
                    '-vcodec libx264',
                    '-crf 28',
                    '-preset fast',
                    '-an', // remove audio
                    '-vf scale=1280:-2'
                ])
                .save(targetMp4Path)
                .on('end', resolve)
                .on('error', (err) => {
                    console.error(`Error on MP4 ${video}`, err);
                    resolve(); // continue anyway
                });
        });

        // Convert to WebM (optional, skipping for time, let's just do MP4 for now to keep it fast)
        /*
        await new Promise((resolve, reject) => {
          ffmpeg(sourceVideoPath)
            .outputOptions([
              '-vcodec libvpx-vp9',
              '-crf 35',
              '-b:v 0',
              '-an', // remove audio
              '-vf scale=1280:-2'
            ])
            .save(targetWebmPath)
            .on('end', resolve)
            .on('error', resolve);
        });
        */
    }
}

async function main() {
    await processImages();
    await processVideos();
    console.log('Media Processing Complete!');
}

main().catch(console.error);
