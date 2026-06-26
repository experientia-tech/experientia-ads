import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // pdfkit reads font/data files from disk at runtime — it must not be bundled
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
