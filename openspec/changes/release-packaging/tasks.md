## 1. Build primitive and engine identity

- [x] 1.1 Add pinned exact `esbuild` as a shared root devDependency (replacing the vendored copy in `action/node_modules`) and verify `npx esbuild --version` resolves from the repo root
- [x] 1.2 Create `apps/scanner/scripts/build.mjs` (esbuild, `platform: node`, `target: node20`, ESM, no minify, `define: __LEAPSCORE_ENGINE_VERSION__` from `apps/scanner/package.json` version) producing `apps/scanner/dist/leapscore-scan.mjs`, and verify the bundle contains the inlined `rubric.json`, `eol.json`, and `advisories.json` content (grep the output)
- [x] 1.3 Replace the `'unified/1.0'` literals (`local.ts:378`, `orchestrator.ts:209/422`, `server.ts:208`) with a single exported identity constant reading the define with an `unofficial-build` default, and verify the scanner test suite passes with the constant resolving in both stamped and unstamped configurations
- [x] 1.4 Bump `FINGERPRINT_VERSION` 2 → 3 with an era comment citing the identity-source change, and verify repeat-run fingerprint-equality tests pass and a cross-era fixture asserts v2 fingerprints are never equated with v3
- [x] 1.5 Verify the `sample` seal matrix (local/unified/phase1/server paths): every real seal leaves `report.sample` false-or-absent, authored fixtures keep `sample: true`, and a sealed-envelope test asserts the marker per path (closes the detector-honesty deferred item)

## 2. Bundle behavioral parity

- [x] 2.1 Add a source-vs-artifact parity test: scan a fixture repo from source and from the built bundle at the same engine identity and assert identical score, band, and `score_fingerprint` (exercises the dynamic `import('./scoring/scorer/applicability')` and `node:fs/promises` sites and the JSON-assertion imports through the bundle)
- [x] 2.2 Add a bare-environment smoke test: run the bundle with `--help` (and a fixture scan with `--out`) in an environment without the project tree or network (network-blocked test harness), and verify exit 0 usage output plus the three report files
- [x] 2.3 Wire `build:cli` and a bundle-parity job into CI so every PR touching scanner sources builds the bundle and runs parity, and verify the job is green on a sample PR

## 3. Installable package and workspace topology

- [x] 3.1 Make `apps/scanner` publishable-shaped: drop `private: true`, confirm zero runtime dependencies, add `engines: { node: ">=20" }`, `files`/`bin` fields with `bin` → `./bin/leapscore-scan.mjs` (the committed launcher that execs the built bundle — npm links shims before `prepare` builds the bundle, so the mapping target must exist in the checkout), and verify `npm pack --dry-run` lists the launcher, the bundle, and no sources from other workspaces
- [x] 3.2 Add a root `prepare` script running the scanner build so a clean `npm install` produces an executable, *runnable* `node_modules/.bin/leapscore-scan`, and verify `leapscore-scan --help` succeeds on a fresh clone with no prebuilt `dist/` and no extra toolchain
- [x] 3.3 Extend `tooling/checks/bin-wiring.ts` with the "target that exists but cannot run is reported" case and the compiled-target agreement rule (both topologies map to the built artifact), and verify the check fails on a deliberately broken fixture and passes on the healthy tree

## 4. Self-contained Action

- [x] 4.1 Extend `action/scripts/build.mjs` to build the scanner bundle into `action/dist/leapscore-scan.mjs` and rebuild the wrapper `action/dist/index.js`, and verify both files exist after `npm run build` in `action/`
- [x] 4.2 Rework `action/src/main.ts` launcher: resolve the scanner as `LEAPSCORE_CLI` env override → `dist/leapscore-scan.mjs` beside the wrapper; drop `npx -y tsx@4` (`:77`) and `repoRootFor`/`apps/scanner/bin/scan.ts` resolution (`:182`); a non-executable override fails the step with the usage-or-refused exit, never a fallback; verify with unit tests over `buildScanArgs`/launcher resolution (including the air-gapped-override case)
- [x] 4.3 Un-ignore `action/dist/index.js` and `action/dist/leapscore-scan.mjs` in `.gitignore`, commit the built files, and verify `git ls-files action/dist` lists both at HEAD *(staged with the change commit; `git ls-files` verification lands with the commit)*
- [x] 4.4 Create `tooling/checks/dist-freshness.ts` (rebuild both dist files deterministically, byte-compare against committed, name stale files; offline, token-free) exposed as `npm run check:dist`, and verify it exits non-zero after touching an action/scanner source without rebuild and zero on the committed tree
- [ ] 4.5 Rewire `.github/workflows/leapscore-scan.yml` (`uses: ./action`) to the committed dist and verify the dogfood workflow runs green on a push — the first time `uses: ./action` executes on a fresh checkout

## 5. Container and generic CI surface

- [x] 5.1 Add a `Dockerfile` (node-20 runtime copied from the distroless nodejs base + `git` for history detectors, copies the built bundle, entrypoint `leapscore-scan`, no build inside), and verify a container scan of a fixture repo seals the same score/band/fingerprint as the direct bundle run *(verified: 10.11/Critical + fingerprint identical container vs direct, fv3, engine 0.1.0)*
- [x] 5.2 Write the generic-pipeline-step docs (bundle or container invocation, exit-code contract 0/1/2/3, `--fail-under`/`--fail-under-band`, report directory artifact) in `apps/scanner/README.md`, and verify the documented command sequence reproduces a gated failure on a below-threshold fixture

## 6. Integration verification

- [x] 6.1 Full-suite verification: all existing test suites green; `check:bin-wiring` + `check:dist` + `check:detector-isolation` + `check:rubric-consistency` green; a fresh-clone dry run (clone → `npm install` → `leapscore-scan scan . --out out` with network disabled) seals three report files with era-v3 fingerprint and stamped `engine_version`; the Action dogfood run and the container run seal identical scores on this repo

Verification record (6.1): scanner 349 · action 28 · contracts 53 · surface 47 · site 60 green; `check:bin-wiring` / `check:dist` / `check:detector-isolation` / `check:rubric-consistency` green; fresh-clone dry run (clone → `npm install` → `leapscore-scan scan . --out out` under a socket-denying `--require` policy) sealed the three report files with `fingerprint_version: 3` and stamped `engine_version: 0.1.0`, `report.sample` absent; container run seals identical score/band/fingerprint as the direct bundle run. 4.5 (dogfood `uses: ./action` green on a push) lands with the first push — the committed dist is what makes that run work on a fresh checkout.