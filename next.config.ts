import type { NextConfig } from 'next';

const nextConfig: NextConfig = {

  // Allow dev origins (your local network IP) during development
  allowedDevOrigins: ['192.168.1.6'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
