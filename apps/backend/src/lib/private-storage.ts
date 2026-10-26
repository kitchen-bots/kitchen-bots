import path from 'path';
import fs from 'fs/promises';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

export interface StorageDriver {
  saveFile(params: { storedFilename: string; buffer: Buffer; mimeType: string }): Promise<void>;
  getFile(storedFilename: string): Promise<Buffer | null>;
}

class LocalDiskStorageDriver implements StorageDriver {
  private storageDir: string;

  constructor() {
    this.storageDir = path.join(process.cwd(), 'storage', 'attachments');
  }

  async saveFile({ storedFilename, buffer }: { storedFilename: string; buffer: Buffer }): Promise<void> {
    await fs.mkdir(this.storageDir, { recursive: true });
    const targetPath = path.join(this.storageDir, storedFilename);
    await fs.writeFile(targetPath, buffer);
  }

  async getFile(storedFilename: string): Promise<Buffer | null> {
    const targetPath = path.join(this.storageDir, storedFilename);
    try {
      return await fs.readFile(targetPath);
    } catch {
      return null;
    }
  }
}

class R2StorageDriver implements StorageDriver {
  private s3: S3Client;
  private bucket: string;

  constructor() {
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const accountId = process.env.R2_ACCOUNT_ID;
    const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
    this.bucket = process.env.R2_BUCKET_NAME || 'kitchen-bots-media';

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('R2 credentials not provided');
    }

    this.s3 = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async saveFile({ storedFilename, buffer, mimeType }: { storedFilename: string; buffer: Buffer; mimeType: string }): Promise<void> {
    const key = `attachments/${storedFilename}`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );
  }

  async getFile(storedFilename: string): Promise<Buffer | null> {
    const key = `attachments/${storedFilename}`;
    try {
      const response = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      if (!response.Body) return null;
      const byteArray = await response.Body.transformToByteArray();
      return Buffer.from(byteArray);
    } catch {
      return null;
    }
  }
}

class PrivateStorageManager {
  private driver: StorageDriver;
  private isCloudStorage: boolean;

  constructor() {
    // If Cloudflare R2 / S3 credentials exist in environment, use R2 / S3 driver.
    // Otherwise fallback safely to Local Disk storage (isolated local development and testing).
    if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
      this.driver = new R2StorageDriver();
      this.isCloudStorage = true;
    } else {
      this.driver = new LocalDiskStorageDriver();
      this.isCloudStorage = false;
    }
  }

  public isUsingCloud(): boolean {
    return this.isCloudStorage;
  }

  public async save(params: { storedFilename: string; buffer: Buffer; mimeType: string }): Promise<void> {
    return this.driver.saveFile(params);
  }

  public async get(storedFilename: string): Promise<Buffer | null> {
    // Attempt primary driver first
    const primary = await this.driver.getFile(storedFilename);
    if (primary) return primary;

    // If on cloud but file missing, check local disk fallback (e.g. development transition)
    if (this.isCloudStorage) {
      const localFallback = new LocalDiskStorageDriver();
      return await localFallback.getFile(storedFilename);
    }

    return null;
  }
}

export const privateStorage = new PrivateStorageManager();
