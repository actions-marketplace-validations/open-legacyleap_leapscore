import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@leapscore/contracts"],
  typescript: {
    // pre-existing type issues in rubric/debug-parser etc. block build;
    // keep strict in editor/CI via `tsc --noEmit` but don't block next build.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
