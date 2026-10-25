import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { getMediaUrl } from '../lib/cdn';

export interface ImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  decoding?: 'async' | 'sync' | 'auto';
}

export function ContentImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  fetchPriority,
  decoding = 'async',
}: ImageProps) {
  const [failed, setFailed] = useState(false);

  // If missing or not a string, show placeholder immediately without emitting broken img tag
  if (!src || typeof src !== 'string' || !src.trim()) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-[#F1F5F9] text-[#94A3B8] ${className}`}
        role="img"
        aria-label={alt || 'Image unavailable'}
      >
        <ImageOff size={24} className="opacity-40" />
      </div>
    );
  }

  // If local logo or already full URL, use as is; otherwise route through getMediaUrl
  const cleanSrc = src.trim();
  const resolvedSrc =
    cleanSrc.startsWith('/images/kitchenbots-') ||
    cleanSrc.startsWith('/images/kitchen-bots-') ||
    cleanSrc.startsWith('/images/logo-')
      ? cleanSrc
      : getMediaUrl(cleanSrc);

  if (failed || !resolvedSrc) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-[#F1F5F9] text-[#94A3B8] ${className}`}
        role="img"
        aria-label={alt || 'Image unavailable'}
      >
        <ImageOff size={24} className="opacity-40" />
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding={decoding}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

export default function ProductImage(props: ImageProps) {
  return <ContentImage key={props.src} {...props} />;
}
