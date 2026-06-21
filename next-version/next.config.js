/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Allow WebGL and Three.js
  webpack: (config, { isServer }) => {
    return config;
  },
};

module.exports = nextConfig;
