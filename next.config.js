/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa');

const nextConfig = {
  reactStrictMode: true,
  // Keep output tracing scoped to this application when the machine has
  // additional lockfiles outside the repository (common in CI and Vercel).
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/auth/signup',
        permanent: true,
      },
    ];
  },
};

module.exports = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
  sw: 'service-worker.js',
  swSrc: './src/service-worker.js',
  fallbacks: {
    document: '/offline.html',
    image: '/spendwise.png',
    font: '/spendwise.png',
  },
})(nextConfig);
