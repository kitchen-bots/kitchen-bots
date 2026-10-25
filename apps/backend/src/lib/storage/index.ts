import { IStorageProvider } from './types';
import { LocalStorageProvider } from './local-provider';
import { R2StorageProvider } from './r2-provider';

let cachedProvider: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const driver = (process.env.STORAGE_DRIVER || 'local').toLowerCase().trim();

  if (driver === 'r2') {
    const bucket = process.env.R2_BUCKET_NAME || 'kitchen-bots-media';
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
    const accountId = process.env.R2_ACCOUNT_ID || '';
    const endpoint = process.env.R2_ENDPOINT;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'FATAL: STORAGE_DRIVER=r2 is configured for production, but R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY is missing. ' +
        'Refusing to silently fall back to local ephemeral storage in production.'
      );
    }

    cachedProvider = new R2StorageProvider({
      bucket,
      accessKeyId,
      secretAccessKey,
      accountId,
      endpoint,
      publicUrl,
    });
    return cachedProvider;
  }

  if (driver === 'local') {
    cachedProvider = new LocalStorageProvider();
    return cachedProvider;
  }

  throw new Error(`Unsupported STORAGE_DRIVER: "${driver}". Allowed options are "local" or "r2".`);
}

// Reset cache for testing
export function setStorageProviderForTesting(provider: IStorageProvider | null): void {
  cachedProvider = provider;
}
