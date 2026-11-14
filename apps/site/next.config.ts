import type { NextConfig } from "next";

import { SITE_BASE_PATH } from "./lib/base-path";

// Static export (design D1): the artifact is a directory of HTML and assets
// with no Node process behind it. `trailingSlash` makes Next emit
// `…/index.html` plus matching trailing-slash links, which is the shape a
// static host serves natively. `basePath`/`assetPrefix` come from the single
// deployment value in `lib/base-path.ts` (design D2).
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: SITE_BASE_PATH,
  assetPrefix: SITE_BASE_PATH || undefined,
  transpilePackages: ["@leapscore/contracts"],
  typescript: {
    // pre-existing type issues in rubric/debug-parser etc. block build;
    // keep strict in editor/CI via `tsc --noEmit` but don't block next build.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
