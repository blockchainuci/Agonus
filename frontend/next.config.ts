import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['wagmi', '@wagmi/core', '@wagmi/connectors', 'viem', '@tanstack/react-query'],
};

export default nextConfig;
