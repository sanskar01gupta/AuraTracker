import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Export as static site for GitHub Pages
  output: 'export',
  // Allow dev origins (your local network IP) during development
  allowedDevOrigins: ['192.168.1.6'],
};

export default nextConfig;
