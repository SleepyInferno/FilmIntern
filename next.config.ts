import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pdf-parse', 'better-sqlite3', '@napi-rs/canvas'],
  outputFileTracingIncludes: {
    '/*': ['node_modules/better-sqlite3/**/*', 'node_modules/@napi-rs/**/*'],
  },
};

export default nextConfig;
