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

  async rewrites() {
    return [
      {
        source: '/:path(agents|swarms|workflows|pipeline|automations|marketplace|integrations|terminal|workspace|deployments|logs|analytics|api-keys|billing|team|settings|blog)/:key([a-zA-Z0-9]{16})',
        destination: '/:path',
      },
    ];
  },
};

export default nextConfig;
