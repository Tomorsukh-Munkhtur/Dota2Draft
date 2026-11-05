import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Баатар, item-ийн зургууд Valve-ийн CDN-ээс шууд ирдэг тул дахин боловсруулах шаардлагагүй.
    unoptimized: true,
  },
  experimental: {
    // Админаас баннерын зураг байршуулахад (Vercel-ийн хүсэлтийн дээд хэмжээ 4.5MB).
    serverActions: { bodySizeLimit: "4mb" },
  },
  // data/*.json-ийг ажиллах үед fs-ээр уншдаг тул Vercel-ийн serverless функцэд хамт оруулна.
  outputFileTracingIncludes: {
    "/*": ["./data/**/*.json"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
