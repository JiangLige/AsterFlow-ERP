/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  allowedDevOrigins: ['127.0.0.1'],
  turbopack: {
    root: require('path').join(__dirname, '..'),
  },
};

module.exports = nextConfig;
