import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  allowedDevOrigins: [
    "rubdown-default-thee.ngrok-free.dev",
    "192.168.0.106",
    "192.168.0.106:3000",
  ],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
};

export default nextConfig;
