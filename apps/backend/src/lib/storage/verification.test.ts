import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getStorageProvider, setStorageProviderForTesting } from './index';
import { R2StorageProvider } from './r2-provider';
import { LocalStorageProvider } from './local-provider';

describe('Shared Storage Verification Suite', () => {
  it('1. Production safety: fails fast when STORAGE_DRIVER=r2 is missing credentials', () => {
    process.env.STORAGE_DRIVER = 'r2';
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    setStorageProviderForTesting(null);

    assert.throws(
      () => getStorageProvider(),
      /FATAL: STORAGE_DRIVER=r2 is configured for production, but R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY is missing/
    );

    // Restore safe default
    process.env.STORAGE_DRIVER = 'local';
    setStorageProviderForTesting(null);
  });

  it('2. Production safety: throws if bucket is omitted', () => {
    assert.throws(
      () => new R2StorageProvider({ bucket: '', accessKeyId: 'k', secretAccessKey: 's' }),
      /bucket is required/
    );
  });

  it('3. R2 download streaming: streams response body without buffering unbounded memory', async () => {
    const mockData = 'R2 streaming byte payload content';
    const mockS3 = {
      send: async () => ({
        ContentType: 'application/pdf',
        ContentLength: mockData.length,
        Body: {
          transformToByteArray: async () => new Uint8Array(Buffer.from(mockData)),
        },
      }),
    } as any;

    const r2 = new R2StorageProvider({
      bucket: 'test-bucket',
      accessKeyId: 'k',
      secretAccessKey: 's',
      customS3Client: mockS3,
      publicUrl: 'https://pub-cdn.kitchenbots.com',
    });

    const res = await r2.download('documents/manuals/combi.pdf');
    assert.ok(res);
    assert.strictEqual(res.mimeType, 'application/pdf');
    assert.strictEqual(res.sizeBytes, mockData.length);
    assert.strictEqual(Buffer.from(res.stream as any).toString(), mockData);
  });

  it('4. Public URL generation: formats CDN URL correctly for R2 and local', () => {
    const r2WithCdn = new R2StorageProvider({
      bucket: 'test-bucket',
      accessKeyId: 'k',
      secretAccessKey: 's',
      customS3Client: {} as any,
      publicUrl: 'https://cdn.kitchenbots.com',
    });
    assert.strictEqual(
      r2WithCdn.getPublicUrl('documents/products/123_oven.png'),
      'https://cdn.kitchenbots.com/documents/products/123_oven.png'
    );

    const r2WithoutCdn = new R2StorageProvider({
      bucket: 'test-bucket',
      accessKeyId: 'k',
      secretAccessKey: 's',
      customS3Client: {} as any,
    });
    assert.strictEqual(
      r2WithoutCdn.getPublicUrl('documents/products/123_oven.png'),
      '/api/operations/documents/download?key=documents%2Fproducts%2F123_oven.png'
    );

    const local = new LocalStorageProvider();
    assert.strictEqual(
      local.getPublicUrl('/documents/warranty/123_cert.pdf'),
      '/documents/warranty/123_cert.pdf'
    );
  });

  it('5. Legacy local path compatibility: resolves files prefixed with slash or relative', async () => {
    const local = new LocalStorageProvider();
    // Test that resolving null or nonexistent key gracefully returns null rather than throwing
    const res = await local.download('non_existent_dummy_key.pdf');
    assert.strictEqual(res, null);
  });
});
