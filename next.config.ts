import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@electric-sql/pglite", "@electric-sql/pglite-socket", "bcryptjs"],
  experimental: {},
};

export default nextConfig;
