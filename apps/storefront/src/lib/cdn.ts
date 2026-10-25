/**
 * Cloudflare R2 / CDN Asset URL Resolver
 * Automatically prefixes relative media paths with VITE_CDN_URL when defined.
 * The public R2 domain is the production-safe default so a missing build-time
 * variable cannot silently turn image requests into SPA fallback responses.
 */
const DEFAULT_CDN_URL = 'https://pub-a4b0711cb441484fbb54bc792d2312b5.r2.dev';
const CDN_URL = (import.meta.env.VITE_CDN_URL || DEFAULT_CDN_URL).replace(/\/$/, '');

export function isMediaFilePath(path: string): boolean {
  const clean = path.replace(/[?#].*$/, '').trim();
  if (!clean) return false;
  const hasExtension = /\.(jpe?g|png|webp|svg|gif|mp4|webm|avif|glb|gltf|ico)$/i.test(clean);
  const isKnownMediaDir = /^\/?(images|videos|3d-assets|assets)\//i.test(clean);
  return hasExtension || isKnownMediaDir;
}

export function getMediaUrl(path: string | undefined | null): string {
  if (!path) return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  if (!isMediaFilePath(trimmed)) {
    return '';
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${CDN_URL}${cleanPath}`;
}

export default getMediaUrl;
