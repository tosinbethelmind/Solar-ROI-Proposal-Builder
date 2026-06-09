import type { NextConfig } from "next";
// @ts-expect-error next-pwa missing types
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  importScripts: ['/sw-custom.js'],
});

const nextConfig: NextConfig = {
  turbopack: {},
  outputFileTracingRoot: process.cwd(),
  cacheComponents: true,
  async rewrites() {
    return [
      {
        source: '/api/apexreach/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default withPWA(nextConfig);

