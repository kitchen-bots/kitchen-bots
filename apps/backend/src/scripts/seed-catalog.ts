import { getPayload } from 'payload';
import config from '../payload.config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  const payload = await getPayload({ config });
  const catalogPath = path.resolve(__dirname, '../data/catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  console.log('🌱 Starting Kitchen Bots catalog seed...');

  // 1. Seed Categories
  const categoryMap = new Map<string, string>(); // slug -> id
  for (const cat of catalog.categories) {
    const slug = cat.id;
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
    });

    let catId: string;
    if (existing.docs.length > 0) {
      catId = existing.docs[0].id as string;
      console.log(`✓ Category "${cat.name}" already exists (${catId})`);
    } else {
      const created = await payload.create({
        collection: 'categories',
        data: {
          title: cat.name,
          slug,
          description: cat.intro || cat.headline,
        },
      });
      catId = created.id as string;
      console.log(`+ Created Category "${cat.name}" (${catId})`);
    }
    categoryMap.set(slug, catId);
    categoryMap.set(cat.name.toLowerCase(), catId);
  }

  // 2. Seed Products
  for (const prod of catalog.products) {
    const slug = prod.slug || prod.id;
    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: slug } },
      limit: 1,
    });

    const catSlug = prod.categoryId || prod.category?.toLowerCase()?.replace(/\s+/g, '-');
    const categoryId = categoryMap.get(catSlug) || Array.from(categoryMap.values())[0];

    const pricePaise = prod.pricePaise || (prod.price ? prod.price * 100 : 0);

    const productData = {
      name: prod.name,
      slug,
      sku: prod.sku || `KB-${slug.toUpperCase()}`,
      category: categoryId,
      pricePaise,
      salesMode: (prod.salesMode || 'both') as 'direct' | 'quote' | 'both',
      status: 'Active' as const,
      featured: Boolean(prod.featured),
      shortDescription: prod.shortDescription || prod.tag || '',
      description: prod.description || '',
      primaryImage: prod.image || (prod.images && prod.images[0]) || '',
      imageUrls: (prod.images || []).map((url: string) => ({ url })),
      features: (prod.features || []).map((feature: string) => ({ feature })),
      specifications: prod.specifications || {},
      sequenceId: prod.sequenceId || undefined,
      sequenceFrameCount: prod.sequenceFrameCount || undefined,
      has3D: Boolean(prod.has3D),
      hasVideo: Boolean(prod.hasVideo),
      videoPath: prod.videoPath || undefined,
    };

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'products',
        id: existing.docs[0].id,
        data: productData,
      });
      console.log(`↻ Updated Product "${prod.name}" (${existing.docs[0].id})`);
    } else {
      const created = await payload.create({
        collection: 'products',
        data: productData,
      });
      console.log(`+ Created Product "${prod.name}" (${created.id})`);
    }
  }

  console.log('✅ Catalog seed completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error during catalog seed:', err);
  process.exit(1);
});
