const fs = require('fs');
const path = require('path');

const productsDir = path.join(__dirname, 'public/images/products');
const outputFilePath = path.join(__dirname, 'src/data/products.ts');

const folders = fs.readdirSync(productsDir).filter(f => fs.statSync(path.join(productsDir, f)).isDirectory());

const productTemplates = folders.map((folder, index) => {
    const folderPath = path.join(productsDir, folder);
    const files = fs.readdirSync(folderPath);
    const images = files.filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.webp') || f.endsWith('.jpeg')).map(f => `/images/products/${folder}/${f}`);
    const videos = files.filter(f => f.endsWith('.mp4')).map(f => `/images/products/${folder}/${f}`);
    
    // Attempt to extract name from folder name e.g. "1_Visualise Files - Flip Base" -> "Flip Base"
    let name = folder.replace(/^\d+_Visualise (Files|Renders)\s*-\s*/, '').trim();
    if (name === folder) {
        // Fallback for weird names
        name = folder.replace(/^\d+_[^-]+-\s*/, '').trim();
    }
    
    return `{
    id: 'prod-${index + 1}',
    name: '${name}',
    category: 'Accessories', // TODO: Update manually
    price: 4500, // Placeholder
    featured: ${index < 4},
    image: '${images[0] || ''}',
    images: ${JSON.stringify(images)},
    video: '${videos[0] || ''}',
    shortDescription: 'Industrial grade equipment',
    specs: [],
}`;
});

let out = `import { Product } from '../types/product';

export const PRODUCTS: Product[] = [
${productTemplates.join(',\n')}
];
`;

fs.writeFileSync(outputFilePath, out);
console.log('Successfully generated products.ts');
