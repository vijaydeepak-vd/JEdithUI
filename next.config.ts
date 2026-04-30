import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Expand workspace root so Turbopack can resolve symlinked packages
  // from sibling project (CareerSTAK) node_modules
  turbopack: {
    root: '/Users/v0d00ts/Development/Projects',
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

export default nextConfig;
