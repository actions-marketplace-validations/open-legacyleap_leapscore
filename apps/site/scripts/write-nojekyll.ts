/**
 * Post-build artifact step: GitHub Pages runs Jekyll by default, which drops
 * paths that begin with an underscore (including `_next/`). A `.nojekyll` file
 * at the artifact root turns it off. This is part of the build, not a manual
 * deploy step (static-hosting: deployment is reproducible from CI).
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(import.meta.dirname, "..", "out");

writeFileSync(join(OUT, ".nojekyll"), "");
console.log("postbuild: wrote out/.nojekyll");
