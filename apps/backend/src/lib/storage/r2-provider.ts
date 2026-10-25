import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { IStorageProvider, StorageUploadParams, StorageUploadResult, StorageDownloadResult } from './types';

export interface R2Config {
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  accountId?: string;
  publicUrl?: string;
  customS3Client?: S3Client;
}

export class R2StorageProvider implements IStorageProvider {
  readonly providerName = 'r2' as const;
  private s3: S3Client;
  private bucket: string;
  private publicUrlBase?: string;

  constructor(config: R2Config) {
    if (!config.bucket) {
      throw new Error('R2StorageProvider configuration error: bucket is required');
    }
    this.bucket = config.bucket;
    this.publicUrlBase = config.publicUrl?.replace(/\/+$/, '');

    if (config.customS3Client) {
      this.s3 = config.customS3Client;
    } else {
      if (!config.accessKeyId || !config.secretAccessKey) {
        throw new Error('R2StorageProvider configuration error: accessKeyId and secretAccessKey are required');
      }

      const endpoint = config.endpoint || (config.accountId ? `https://${config.accountId}.r2.cloudflarestorage.com` : undefined);
      if (!endpoint) {
        throw new Error('R2StorageProvider configuration error: either endpoint or accountId must be provided');
      }

      this.s3 = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });
    }
  }

  async upload(params: StorageUploadParams): Promise<StorageUploadResult> {
    const cleanCategory = params.category.replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedName = params.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `documents/${cleanCategory}/${Date.now()}_${sanitizedName}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: Buffer.from(params.data),
        ContentType: params.mimeType,
      })
    );

    return {
      provider: 'r2',
      key: objectKey,
      sizeBytes: params.data.byteLength,
      mimeType: params.mimeType,
      publicUrl: this.getPublicUrl(objectKey),
    };
  }

  async download(key: string, filenameFallback?: string, mimeTypeFallback?: string): Promise<StorageDownloadResult | null> {
    const cleanKey = key.replace(/^\/+/, '');

    try {
      const response = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: cleanKey,
        })
      );

      if (!response.Body) {
        return null;
      }

      // Transform Body to web ReadableStream if possible or buffer
      let stream: any;
      if (typeof (response.Body as any).transformToByteArray === 'function') {
        const bytes = await (response.Body as any).transformToByteArray();
        stream = Buffer.from(bytes);
      } else {
        stream = response.Body;
      }

      const filename = filenameFallback || cleanKey.split('/').pop() || 'download';
      const mimeType = response.ContentType || mimeTypeFallback || 'application/octet-stream';

      return {
        stream,
        filename,
        mimeType,
        sizeBytes: response.ContentLength,
      };
    } catch (err: any) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  async delete(key: string): Promise<boolean> {
    const cleanKey = key.replace(/^\/+/, '');
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: cleanKey,
        })
      );
      return true;
    } catch (err: any) {
      console.warn(`Failed to delete object from R2: ${cleanKey}`, err);
      return false;
    }
  }

  getPublicUrl(key: string): string {
    const cleanKey = key.replace(/^\/+/, '');
    if (this.publicUrlBase) {
      return `${this.publicUrlBase}/${cleanKey}`;
    }
    return `/api/operations/documents/download?key=${encodeURIComponent(cleanKey)}`;
  }
}
