import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { LocalStorageProvider } from './local-provider';
import { R2StorageProvider } from './r2-provider';
import { getStorageProvider, setStorageProviderForTesting } from './index';

describe('Storage Provider Abstraction Layer', () => {
  const testDir = path.resolve(process.cwd(), 'storage/test_storage_unit');

  before(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  after(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    setStorageProviderForTesting(null);
  });

  it('1. LocalStorageProvider: uploads, downloads, and deletes file on disk', async () => {
    const local = new LocalStorageProvider(testDir);
    const content = Buffer.from('%PDF-1.4 unit test sample bytes');

    // Upload
    const uploadRes = await local.upload({
      category: 'warranty',
      filename: 'sample_test.pdf',
      data: content,
      mimeType: 'application/pdf',
    });

    assert.strictEqual(uploadRes.provider, 'local');
    assert.ok(uploadRes.key.includes('documents/warranty'));
    assert.strictEqual(uploadRes.sizeBytes, content.length);

    // Download
    const downloadRes = await local.download(uploadRes.key);
    assert.ok(downloadRes, 'Download result should exist');
    assert.strictEqual(downloadRes.sizeBytes, content.length);
    assert.strictEqual(downloadRes.mimeType, 'application/octet-stream');

    // Delete
    const deleted = await local.delete(uploadRes.key);
    assert.strictEqual(deleted, true);

    const afterDelete = await local.download(uploadRes.key);
    assert.strictEqual(afterDelete, null);
  });

  it('2. Provider Factory: selects local driver by default without contacting external cloud', () => {
    delete process.env.STORAGE_DRIVER;
    setStorageProviderForTesting(null);

    const provider = getStorageProvider();
    assert.strictEqual(provider.providerName, 'local');
  });

  it('3. Provider Factory: throws fatal error if STORAGE_DRIVER=r2 is set without credentials (no silent fallback)', () => {
    process.env.STORAGE_DRIVER = 'r2';
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    setStorageProviderForTesting(null);

    assert.throws(
      () => getStorageProvider(),
      /FATAL: STORAGE_DRIVER=r2 is configured for production, but R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY is missing/
    );

    // Reset
    process.env.STORAGE_DRIVER = 'local';
    setStorageProviderForTesting(null);
  });

  it('4. R2StorageProvider (Mocked): performs upload, download, and delete with mocked S3Client', async () => {
    let putCommandReceived: any = null;
    let getCommandReceived: any = null;
    let deleteCommandReceived: any = null;

    const mockS3Client = {
      send: async (command: any) => {
        const cmdName = command.constructor.name;
        if (cmdName === 'PutObjectCommand' || command.input?.Bucket) {
          if (command.input?.Body) {
            putCommandReceived = command.input;
            return { ETag: '"mock-etag-12345"' };
          }
          if (command.input?.Key && !command.input?.Body) {
            if (cmdName === 'DeleteObjectCommand' || command.isDelete) {
              deleteCommandReceived = command.input;
              return {};
            }
            getCommandReceived = command.input;
            return {
              ContentType: 'application/pdf',
              ContentLength: 42,
              Body: {
                transformToByteArray: async () => new Uint8Array(Buffer.from('mocked r2 stream bytes')),
              },
            };
          }
        }
        return {};
      },
    } as any;

    const r2 = new R2StorageProvider({
      bucket: 'mock-kitchen-bots-bucket',
      accessKeyId: 'mock-key',
      secretAccessKey: 'mock-secret',
      customS3Client: mockS3Client,
      publicUrl: 'https://cdn.kitchenbots.com',
    });

    assert.strictEqual(r2.providerName, 'r2');

    // Upload
    const uploadRes = await r2.upload({
      category: 'manuals',
      filename: 'combi_oven_manual.pdf',
      data: Buffer.from('mock pdf data bytes'),
      mimeType: 'application/pdf',
    });

    assert.strictEqual(uploadRes.provider, 'r2');
    assert.strictEqual(putCommandReceived.Bucket, 'mock-kitchen-bots-bucket');
    assert.ok(putCommandReceived.Key.startsWith('documents/manuals/'));
    assert.strictEqual(uploadRes.publicUrl, `https://cdn.kitchenbots.com/${uploadRes.key}`);

    // Download
    const dlRes = await r2.download(uploadRes.key);
    assert.ok(dlRes);
    assert.strictEqual(dlRes.mimeType, 'application/pdf');
    assert.strictEqual(getCommandReceived.Key, uploadRes.key);

    // Delete
    command_fix: {
      mockS3Client.send = async (cmd: any) => {
        deleteCommandReceived = cmd.input;
        return {};
      };
      const delOk = await r2.delete(uploadRes.key);
      assert.strictEqual(delOk, true);
      assert.strictEqual(deleteCommandReceived.Key, uploadRes.key);
    }
  });
});
