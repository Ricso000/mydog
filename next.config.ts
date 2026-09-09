import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "eikkgaocpkhwdgndiupm.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // demo/seed dog photos (see scripts/seed-demo-content.mjs)
        protocol: "https",
        hostname: "placedog.net",
      },
      {
        // demo/seed partner logos + cover images (see scripts/seed-demo-content.mjs)
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
};

export default nextConfig;
