import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // @cursor/sdk is Node-only (native deps, webpack bundle). Do not let Turbopack bundle it.
  serverExternalPackages: ["@cursor/sdk", "sqlite3"],
  redirects: async () => [
    {
      source: "/",
      destination: "/es",
      permanent: false,
    },
  ],
};

export default withNextIntl(nextConfig);
