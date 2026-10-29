import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["@modelcontextprotocol/sdk"],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "/api/helios/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
