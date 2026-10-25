import { Readable } from 'stream';

export interface StorageUploadParams {
  category: string; // e.g. 'warranty', 'products', 'versions', 'manuals'
  filename: string;
  data: Buffer | Uint8Array;
  mimeType: string;
}

export interface StorageUploadResult {
  provider: 'local' | 'r2';
  key: string;            // durable object key, e.g. 'documents/warranty/1729000_file.pdf'
  publicUrl?: string;     // optional direct/public URL for storefront CDN
  sizeBytes: number;
  mimeType: string;
}

export interface StorageDownloadResult {
  stream: ReadableStream | Readable | Buffer;
  mimeType: string;
  filename: string;
  sizeBytes?: number;
}

export interface IStorageProvider {
  readonly providerName: 'local' | 'r2';
  upload(params: StorageUploadParams): Promise<StorageUploadResult>;
  download(key: string, filenameFallback?: string, mimeTypeFallback?: string): Promise<StorageDownloadResult | null>;
  delete(key: string): Promise<boolean>;
  getPublicUrl(key: string): string;
}
