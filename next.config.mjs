/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const nextConfig = {
  reactStrictMode: true,
};

export default withPWA({
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
