import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["better-sqlite3"],

  // Expose safe public env vars to frontend
  env: {
    NEXT_PUBLIC_HAS_OPENAI: process.env.OPENAI_API_KEY ? 'true' : 'false',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
