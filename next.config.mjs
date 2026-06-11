/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const nextConfig = {
  // your existing next config
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
})(nextConfig);
