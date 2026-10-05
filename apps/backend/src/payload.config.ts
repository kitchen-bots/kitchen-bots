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

const DEFAULT_REMOTE_DB = 'postgresql://postgres.thavrhaxomanrpsmfklx:kitchen-bots-password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';
const rawDbUri =
  process.env.DATABASE_URI && !process.env.DATABASE_URI.includes('127.0.0.1') && !process.env.DATABASE_URI.includes('localhost')
    ? process.env.DATABASE_URI
    : (process.env.VERCEL || process.env.NODE_ENV === 'production'
      ? DEFAULT_REMOTE_DB
      : (process.env.DATABASE_URI || DEFAULT_REMOTE_DB));

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
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://kitchen-bots.vercel.app'),
  secret: process.env.PAYLOAD_SECRET || 'kitchen-bots-super-secret-payload-key-2026',
  cors: [
    'https://kitchenbots.in',
    'https://kitchen-bots.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    process.env.NEXT_PUBLIC_SERVER_URL || '',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
  ].filter(Boolean),
  csrf: [
    'https://kitchenbots.in',
    'https://kitchen-bots.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
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
      max: process.env.VERCEL ? 4 : 5,
      min: 0,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    },
    push: false,
    disableCreateDatabase: true,
  }),
  plugins: [
    ...(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
      ? [
          s3Storage({
            collections: {
              media: true,
            },
            bucket: process.env.R2_BUCKET_NAME || 'kitchen-bots-media',
            config: {
              credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
              },
              region: 'auto',
              endpoint:
                process.env.R2_ENDPOINT ||
                (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined),
            },
          }),
        ]
      : []),
  ],
});
