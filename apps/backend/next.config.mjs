import { withPayload } from '@payloadcms/next/withPayload';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['pg', '@payloadcms/db-postgres'],
  compress: true,
  poweredByHeader: false,
};

export default withPayload(nextConfig);
