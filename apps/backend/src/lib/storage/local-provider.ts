import fs from 'fs';
import path from 'path';
import { IStorageProvider, StorageUploadParams, StorageUploadResult, StorageDownloadResult } from './types';

export class LocalStorageProvider implements IStorageProvider {
  readonly providerName = 'local' as const;
  private baseDir: string;

  constructor(customBaseDir?: string) {
    this.baseDir = customBaseDir || path.resolve(process.cwd(), 'storage');
  }

  private resolveKeyToDisk(key: string): string {
    const cleanKey = key.replace(/^\/+/, '');
    return path.join(this.baseDir, cleanKey);
  }

  async upload(params: StorageUploadParams): Promise<StorageUploadResult> {
    const cleanCategory = params.category.replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedName = params.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeKey = `documents/${cleanCategory}/${Date.now()}_${sanitizedName}`;

    const diskPath = this.resolveKeyToDisk(safeKey);
    const dir = path.dirname(diskPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(diskPath, Buffer.from(params.data));

    return {
      provider: 'local',
      key: `/${safeKey}`,
      sizeBytes: params.data.byteLength,
      mimeType: params.mimeType,
      publicUrl: `/storage/${safeKey}`,
    };
  }

  async download(key: string, filenameFallback?: string, mimeTypeFallback?: string): Promise<StorageDownloadResult | null> {
    const cleanKey = key.replace(/^\/+/, '');
    const diskPath = this.resolveKeyToDisk(cleanKey);

    // Also check alternative local base paths (for backward compatibility)
    const candidates = [
      diskPath,
      path.resolve(process.cwd(), 'apps/backend/storage', cleanKey),
      path.resolve(process.cwd(), 'storage', cleanKey),
      path.resolve(process.cwd(), cleanKey),
    ];

    let foundPath: string | null = null;
    for (const p of candidates) {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        foundPath = p;
        break;
      }
    }

    if (!foundPath) {
      return null;
    }

    const fileBuffer = fs.readFileSync(foundPath);
    const filename = filenameFallback || path.basename(foundPath);
    const mimeType = mimeTypeFallback || 'application/octet-stream';

    return {
      stream: fileBuffer,
      filename,
      mimeType,
      sizeBytes: fileBuffer.length,
    };
  }

  async delete(key: string): Promise<boolean> {
    const cleanKey = key.replace(/^\/+/, '');
    const diskPath = this.resolveKeyToDisk(cleanKey);
    if (fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath);
      return true;
    }
    return false;
  }

  getPublicUrl(key: string): string {
    const cleanKey = key.replace(/^\/+/, '');
    return `/${cleanKey}`;
  }
}
