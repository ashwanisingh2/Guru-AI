/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    externalDir: true,
  }
};

export default nextConfig;
