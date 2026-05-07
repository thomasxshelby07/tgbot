import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://tgbot-production-71a9.up.railway.app/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'https://tgbot-production-71a9.up.railway.app/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
