## Context

Motivation is in `proposal.md — Why`. Current state that shapes the approach:

- **Runtime shape is bundle-friendly.** The engine has zero npm runtime dependencies; `git` is the only spawned binary (`execFile` in `scan/git.ts`). All JSON assets are static import-assertions — the four `rubric.json` sites in `scoring/` plus `snapshots.ts:9-10` (`eol.json` + `advisories.json`, ~32 KB) — so a bundler inlines them; there is no runtime `readFile` of data paths and no `import.meta.url`-relative resolution anywhere in `src/` or `bin/`. The only dynamic imports are internal (`./scoring/scorer/applicability` at `local.ts:264`/`orchestrator.ts:271`, `node:fs/promises` at `tree.ts:44`).
- **The Action pattern exists.** `action/scripts/build.mjs` bundles `main.ts` → `dist/index.js` with a vendored esbuild (`platform: node`, `target: node20`, `format: cjs`). `action/src/main.ts` today resolves the scanner bin at `repoRootFor()/apps/scanner/bin/scan.ts` (`:182`) and executes `npx -y tsx@4` (`:77`).
- **Engine identity sites.** `'unified/1.0'` literals at `local.ts:378`, `orchestrator.ts:209/422`, `server.ts:208`; `seal.ts:289` falls back to it; `fingerprint.ts` hashes `engine_version` + `engine_sha7`; `FINGERPRINT_VERSION = 2`.
- **Constraints.** `report-envelope`'s runId grammar already prescribes "build-stamped release version or explicit `--engine-ref` override, never `git rev-parse` in the caller's checkout" — this change implements that prescription. `cli-packaging`'s two-topology rule (workspace shim + `npx -p <repo>#<ref>`) must keep holding, upgraded to compiled targets. The offline posture must not regress: the build and the checks run offline; the artifact opens no sockets in a default run (verified by the existing dead-seam state).

## Goals / Non-Goals

**Goals:**

- One build command produces the release bundle; every surface consumes that file.
- `npm install` (workspace) and a package install both yield a `leapscore-scan` that **runs** on stock Node ≥20 with no other toolchain.
- Sealed `engine_version` distinguishes releases; era v3 marks the break.
- `action/dist/index.js` is committed, fresh-gated, and executes standalone (in-repo dogfood today, published wrapper later without rework).
- The `offline-default` change can later rename the Action input on a wrapper that actually runs.

**Non-Goals (design-level, beyond the proposal's list):**

- No bundler-based size optimization, minification, or code splitting — the bundle stays readable (privacy-audit thesis); gzip/pretty output is fine, minify is not.
- No change to the scanner service (`server.ts`) behavior beyond sharing the stamped identity constant — the site's hosted path stays source-run.
- No release-automation (tag → build → publish) — this change makes the artifact releasable; wiring the release workflow is release-shape-gated.
- No `--format`, flags, exit-code, or scoring changes.

## Decisions

**D1 — esbuild, ESM, `target: node20`, no minify.** Same tool the Action already uses (vendored there; promoted to a shared devDependency — a supply-chain addition, pinned). ESM keeps `import ... with { type: 'json' }` working natively; CJS (the Action-dist shape) would force a JSON transform and buy only Node-16 reach. Rejected: `tsup`/`rollup` (a wrapper buys nothing here — the action script is nine lines), `deno compile` (opaque blob, runtime trust — see proposal non-goals on SEA; same reasoning). The Action's own `dist/index.js` stays CJS (GitHub's `node20` runner + `@actions/*` convention); CJS *requires* an ES module, so the composition in D2 keeps both formats valid.

**D2 — The Action ships the bundle beside its wrapper, not inside it.** `action/scripts/build.mjs` gains a second entry: build the scanner bundle, copy it to `action/dist/leapscore-scan.mjs`; `main.ts`'s launcher becomes `exec(node, [dist/leapscore-scan.mjs, ...args])` with `LEAPSCORE_CLI` overriding the bundle path. Rejected: inlining the scanner bundle *into* `dist/index.js` as an embedded string (one file, but every scanner rebuild rewrites a wrapper file whose diff reviewers read, and the override story gets contorted); rejected: keeping `npx tsx` behind a flag (fails the no-registry runner scenario outright). The sealed identity then carries the *bundle's* stamp, which is what the spec requires.

**D3 — Version stamp via esbuild `define`, sourced from the package version.** `define: { __LEAPSCORE_ENGINE_VERSION__: '"vX.Y.Z"' }`; the value comes from `apps/scanner/package.json` `version` (release workflow bumps it; `git describe` is not available on shallow CI checkouts and is consumer-adjacent). The literals at `local.ts:378`/`orchestrator.ts:209/422`/`server.ts:208` collapse to one exported constant reading the define with an `unofficial-build` default when unstamped — satisfying the spec's "unstamped build is disclosed" scenario. `engine_sha7` keeps its existing meaning (`--engine-ref`/meta override, else `unknown`). Rejected: reading `package.json` at runtime (reintroduces a path dependency the bundle can't carry); rejected: stamping from the git ref at build (the fingerprint contract forbids checkout-derived identity).

**D4 — Fingerprint era v3 rides with the identity change.** `FINGERPRINT_VERSION = 3` in the same commit as the stamp, per `measurement-honesty`'s era rule ("identity derived from the release is a semantic change"). Repeat-run equality tests stay green; cross-era tests assert v2 reports are not equated. `--score-policy` is untouched (it governs the denominator, not identity).

**D5 — Committed dist + freshness check as a repo gate.** `.gitignore` un-ignores `action/dist/index.js` and `action/dist/leapscore-scan.mjs`; `tooling/checks/dist-freshness.ts` rebuilds both deterministically and byte-compares against committed files, wired into the existing checks family (offline, token-free, like `check:bin-wiring`). Determinism note: esbuild output is stable for identical inputs; the scanner bundle embeds no timestamps (wall-clock is runtime, not build-time). Rejected: build-on-CI-and-upload (the Action must run from the *user's* checkout of the tag, not a build artifact).

**D6 — Workspace bin points at the built bundle; the build runs at `prepare`.** `apps/scanner/package.json` `bin` → `./dist/leapscore-scan.mjs`; a root `prepare` script builds it so the post-`npm install` shim executes (the `cli-packaging` delta's "A target that cannot run is reported" scenario). The bundle is gitignored — it is a build output, unlike the Action's committed dist, which exists *because* Actions have no build step. Root `package.json` `bin` keeps the same relative target for the `npx -p` topology.

**D7 — Container = distroless node image + the bundle.** `node:20-distroless`-class base (no shell, small audit surface), entrypoint the bundle, the scanned repo mounted, `git` present for history detectors (node images carry it). Single-stage, no build inside the image — the bundle comes from the workspace build.

## Risks / Trade-offs

- [Bundler silently mis-handles a dynamic import or JSON assertion → runtime crash only on the artifact path] → the source-vs-artifact sealed-equality test (spec scenario) runs in CI on a fixture repo; it fails on any behavioral divergence, not just crashes.
- [esbuild supply chain (new pinned devDependency)] → pinned exact version + lockfile; it is build-time only, zero runtime deps unchanged; the Action already vendors esbuild today, so the trust surface is consolidated, not widened.
- [Era v3 invalidates any stored fingerprints (site persisted reports, dogfood baselines)] → era is recorded in-envelope; `run-diff` already treats cross-era as incomparable; nothing equates across eras. Pre-release, so external blast radius is nil.
- [Committed dist drifts from sources between merge and release] → freshness check on every PR touching scanner/action sources; byte-compare, so drift fails loudly.
- [`prepare` build surprises contributors without Node ≥20] → `engines` declared; failure is the spec's "packaging defect" posture — loud, at install time, not first run.
- [Two topologies (source-run in dev, bundle-run in CI) can mask bundle-only bugs] → the dogfood workflow uses the Action (bundle path) on every push to the default branch, so the release path is the one exercised daily.
- [Node ≥20 floor excludes an older pilot runner] → floor matches the Action's existing `node20`; lowering it later is a bundler-target tweak, no contract change.

## Migration Plan

1. Land build + stamp + era v3 + identity sites + `sample` verification; source path unchanged in behavior, tests updated for v3.
2. Switch `apps/scanner` bin + root bin to the built target; add `prepare`; extend the bin-wiring check's "runs" expectation.
3. Rewire Action (`LEAPSCORE_CLI`, dist composition, gitignore, freshness check); rewire the dogfood workflow to the built dist — the first point where `uses: ./action` actually works on a fresh checkout.
4. Container + generic-CI docs last (pure additions).

Rollback: each step is revertible independently; the only cross-cutting artifact is era v3 — reverting restores v2 and cross-era incomparability applies symmetrically (pre-release, acceptable).

## Open Questions

- npm package *name* (`@leapscore/scanner` vs org-scoped under Legacyleap) — depends on the release-shape decision; everything here is name-agnostic (the bin name `leapscore-scan` is fixed and independent).
- Whether the release workflow stamps `version` from a tag or tags from a version bump — release-automation's choice; D3 only requires the build input to be the package version at bundle time.
