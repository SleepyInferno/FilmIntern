import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pdf-parse', 'better-sqlite3'],
  outputFileTracingIncludes: {
    '/*': ['node_modules/better-sqlite3/**/*', 'node_modules/@napi-rs/**/*', 'node_modules/pdfjs-dist/**/*'],
  },
};

export default nextConfig;
