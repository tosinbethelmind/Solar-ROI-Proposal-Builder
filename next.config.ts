import type { NextConfig } from "next";
// @ts-expect-error next-pwa missing types
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  importScripts: ['/sw.js'],
});

const nextConfig: NextConfig = {
  turbopack: {},
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // outputFileTracingRoot: process.cwd(),
  // cacheComponents: true,
  async redirects() {
    return [
      {
        source: '/sign-in',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/sign-up',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/auth',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/auth/signin',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/auth/signup',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/workspace/partners',
        destination: '/admin/partners',
        permanent: true,
      },
      {
        source: '/plans',
        destination: '/pricing',
        permanent: true,
      },
      {
        source: '/why-solarquotepro',
        destination: '/#why-solarquotepro',
        permanent: true,
      },
      {
        source: '/safety-standard',
        destination: '/#storm-safety',
        permanent: true,
      },
      {
        source: '/energy-insights',
        destination: '/#blog-section',
        permanent: true,
      },
    ];
  },
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

