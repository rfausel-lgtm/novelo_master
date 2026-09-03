import type { NextConfig } from "next";

/**
 * O Novelo Master é exportado como site estático (ADR-0002):
 * não há banco nem servidor em runtime; todo o corpus é compilado no build
 * a partir de /data (YAML) por scripts/build-data.ts.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
