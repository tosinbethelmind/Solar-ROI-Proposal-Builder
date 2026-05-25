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
};

export default withPWA(nextConfig);
