import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,

  // Compress all HTTP responses (HTML, JSON, JS, CSS)
  compress: true,

  // Allow next/image to optimise S3 and Google avatar images
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'polaroid-glossy-dev.s3.us-east-1.amazonaws.com',
        pathname: '/orders/**',
      },
      {
        protocol: 'https',
        hostname: 'polaroid-glossy-prod.s3.ap-southeast-1.amazonaws.com',
        pathname: '/orders/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
        pathname: '/orders/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google OAuth avatars
      },
    ],
  },

  // Long-lived cache headers for static assets
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/images/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' }],
      },
    ];
  },
};

export default nextConfig;
