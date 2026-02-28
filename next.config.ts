import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "conductscience.com",
      },
      {
        protocol: "https",
        hostname: "*.conductscience.com",
      },
    ],
  },
};

export default nextConfig;
