import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress assets using gzip/brotli
  compress: true,

  // Remove x-powered-by: Next.js header for security and performance
  poweredByHeader: false,

  // Optimize package imports for large barrel libraries to drastically cut bundle sizes and compile times
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@clerk/nextjs",
      "@tanstack/react-query",
      "motion",
    ],
  },

  // Image optimization formats
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
