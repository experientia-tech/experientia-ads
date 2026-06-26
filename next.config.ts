import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // pdfkit reads font/data files from disk at runtime — it must not be bundled
  serverExternalPackages: ["pdfkit"],
  // Next's file tracing misses pdfkit's .afm font data, which breaks PDF export on
  // Lambda. Force-include the data dir so OpenNext bundles it into the function.
  outputFileTracingIncludes: {
    "/api/campaigns/[id]/export-pdf": ["./node_modules/pdfkit/js/data/**/*"],
  },
};

export default nextConfig;
