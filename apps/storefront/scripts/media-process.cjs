const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const VIDEOS_DIR = 'D:\\File sharing\\Products Images-20260303T102701Z-3-001\\Product videos';
const IMAGES_DIR = 'D:\\File sharing\\Products Images-20260303T102701Z-3-001\\Products Images';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const DEST_SEQUENCES = path.join(PUBLIC_DIR, '3d-assets', 'sequences');
const DEST_IMAGES = path.join(PUBLIC_DIR, 'images', 'products');

// Create dest dirs if not exist
if (!fs.existsSync(DEST_SEQUENCES)) fs.mkdirSync(DEST_SEQUENCES, { recursive: true });
if (!fs.existsSync(DEST_IMAGES)) fs.mkdirSync(DEST_IMAGES, { recursive: true });

async function processVideos() {
    const files = fs.readdirSync(VIDEOS_DIR).filter(f => f.endsWith('.mp4'));
    const metadata = {};

    for (const file of files) {
        const basename = path.basename(file, '.mp4');
        const outDir = path.join(DEST_SEQUENCES, basename);
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        console.log(`Processing ${file}...`);

        await new Promise((resolve, reject) => {
            ffmpeg(path.join(VIDEOS_DIR, file))
                .outputOptions([
                    '-vf', 'scale=800:-1,fps=15', // Lower framerate to keep size manageable and frame counts low
                    '-qscale', '50',
                    '-vcodec', 'libwebp',
                    '-start_number', '0'
                ])
                .output(path.join(outDir, '%03d.webp'))
                .on('end', () => {
                    const frames = fs.readdirSync(outDir).filter(f => f.endsWith('.webp')).length;
                    metadata[basename] = { folder: basename, frames };
                    console.log(`Finished ${file}: ${frames} frames generated.`);
                    resolve();
                })
                .on('error', (err) => {
                    console.error(`Error processing ${file}:`, err);
                    reject(err);
                })
                .run();
        });
    }

    fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'video-metadata.json'), JSON.stringify(metadata, null, 2));
}

// Helper to find the first image recursively
function getFirstImage(dir) {
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        if (file.isDirectory()) {
            const img = getFirstImage(path.join(dir, file.name));
            if (img) return img;
        } else if (file.name.endsWith('.jpg') || file.name.endsWith('.png')) {
            return path.join(dir, file.name);
        }
    }
    return null;
}

function processImages() {
    // Attempting mapping based on logic
    const mappings = {
        'kb-rocket-stove-150': path.join(IMAGES_DIR, '6_Visualise Files - Rocket Stove_150MM'),
        'kb-suitcase-bbq-big': path.join(IMAGES_DIR, '11_Visualise Files - Suitcase BBQ Big'),
        'kb-suitcase-bbq-small': path.join(IMAGES_DIR, '12_Visualise Files - Suitcase BBQ Small'),
        'kb-santa-maria-med': path.join(IMAGES_DIR, '9_Visualise Files -Santa Maria Grill Medium'),
        'kb-auto-bbq-ss': path.join(IMAGES_DIR, '8_Visualise Renders  - Automatic BBQ'),
        'kb-flip-bbq-std': path.join(IMAGES_DIR, '2_Visualise Files - Flip Base Height Adjustable')
    };

    const imageMetadata = {};

    for (const [id, dir] of Object.entries(mappings)) {
        const firstImg = getFirstImage(dir);
        if (firstImg) {
            const ext = path.extname(firstImg);
            const destName = `${id}${ext}`;
            fs.copyFileSync(firstImg, path.join(DEST_IMAGES, destName));
            imageMetadata[id] = `/images/products/${destName}`;
            console.log(`Copied image for ${id}: ${destName}`);
        } else {
            console.log(`No image found for ${id} in ${dir}`);
        }
    }

    fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'image-metadata.json'), JSON.stringify(imageMetadata, null, 2));
}

async function main() {
    console.log("Starting image extraction...");
    processImages();
    console.log("Starting WebP sequence generation...");
    await processVideos();
    console.log("Media processing complete!");
}

main();
