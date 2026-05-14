import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["better-sqlite3"],

  // Expose safe public env vars to frontend
  env: {
    NEXT_PUBLIC_HAS_OPENAI: process.env.OPENAI_API_KEY ? 'true' : 'false',
  },

  experimental: {
    // @ts-ignore
    turbopack: {
      root: ".",
    },
  },

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
