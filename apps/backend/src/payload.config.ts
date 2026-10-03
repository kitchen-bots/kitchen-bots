import path from 'path';
import { fileURLToPath } from 'url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';

import { Users } from './collections/Users';
import { Categories } from './collections/Categories';
import { Products } from './collections/Products';
import { Orders } from './collections/Orders';
import { Quotes } from './collections/Quotes';
import { Enquiries } from './collections/Enquiries';
import { Services } from './collections/Services';
import { Documents } from './collections/Documents';
import { Media } from './collections/Media';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const rawDbUri = process.env.DATABASE_URI || 'postgresql://postgres:postgres@127.0.0.1:5432/kitchen_bots';
const isRemoteDb = rawDbUri.includes('supabase.com') || rawDbUri.includes('pooler') || rawDbUri.includes('sslmode=');
// Strip sslmode from URI string so pg doesn't conflict with our ssl config object
const connectionString = isRemoteDb ? rawDbUri.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/\?$/, '') : rawDbUri;

export default buildConfig({
  admin: {
    user: Users.slug,
    theme: 'dark',
    meta: {
      titleSuffix: '- Kitchen Bots Admin',
    },
    autoLogin: {
      email: 'admin@kitchenbots.com',
      password: 'admin123456',
      prefillOnly: true,
    },
    components: {
      graphics: {
        Logo: '@/components/Logo#Logo',
        Icon: '@/components/Icon#Icon',
      },
      beforeDashboard: ['@/components/AdminDashboard#AdminDashboard'],
      actions: ['@/components/StorefrontLink#StorefrontLink'],
      beforeNavLinks: ['@/components/NavHeader#NavHeader'],
      afterNavLinks: ['@/components/NavFooter#NavFooter'],
    },
  },
  collections: [
    Products,
    Categories,
    Orders,
    Quotes,
    Enquiries,
    Services,
    Documents,
    Media,
    Users,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'kitchen-bots-super-secret-payload-key-2026',
  cors: [
    'https://kitchenbots.in',
    'https://kitchen-bots.vercel.app',
    process.env.NEXT_PUBLIC_SERVER_URL || '',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
  ].filter(Boolean),
  csrf: [
    'https://kitchenbots.in',
    'https://kitchen-bots.vercel.app',
    process.env.NEXT_PUBLIC_SERVER_URL || '',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
  ].filter(Boolean),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString,
      ssl: isRemoteDb ? { rejectUnauthorized: false } : undefined,
      max: 10,
      min: 2,
      idleTimeoutMillis: 120000,
      connectionTimeoutMillis: 5000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    },
    disableCreateDatabase: true,
  }),
  plugins: [
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.R2_BUCKET_NAME || 'kitchen-bots-media',
      config: {
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined),
      },
    }),
  ],
});
