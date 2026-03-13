import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ["pdf-parse"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ezbwcrxhlcilkrgjfobx.supabase.co",
      },
    ],
  },
};

export default nextConfig;
