## Why

The release brief's packaging test is "fewest steps on a locked-down machine" — and the shipped artifact fails it before step one. `leapscore-scan`'s `bin` target is `apps/scanner/bin/scan.ts`, a TypeScript file whose shebang needs `tsx`, which exists only as a root devDependency; a clean `npm install` produces a shim that cannot run, and `npx -p <repo>#<ref>` installs the tree and still dies. The Action is worse: `action.yml` declares `main: dist/index.js` while `action/dist/` is gitignored and untracked (`git ls-files action/` confirms), so `uses: ./action` cannot execute on a fresh checkout; `action/src/main.ts:182` resolves the scanner bin relative to the Action's own directory (in-repo only), and `main.ts:77` shells `npx -y tsx@4` at runtime — network, registry, and a repo layout that won't exist once published to the Marketplace. Meanwhile the determinism contract's "same scanner release" premise is fiction in the sealed data: `engine_version: 'unified/1.0'` is a hardcoded literal (`local.ts:378`, `orchestrator.ts:422`) hashed into the fingerprint, so different engine builds seal identical fingerprints — a hole only an installable, versioned artifact exposes, and one the brief's Must #3 cannot survive publicly. The proven pattern already exists in-repo: `action/scripts/build.mjs` bundles the Action to a self-contained esbuild artifact. This change promotes that pattern to the CLI and makes every distribution surface a delivery of one build.

## What Changes

- **Bundle primitive** — an esbuild pipeline (the `action/scripts/build.mjs` pattern) produces one readable, zero-runtime-dependency artifact (`leapscore-scan.mjs`, `platform: node`, `target: node20`, ESM): the four `rubric.json` `with { type: 'json' }` imports and the vendored snapshots (32 KB) inline into the bundle; the dynamic `import('./scoring/scorer/applicability')` sites (`local.ts:264`, `orchestrator.ts:271`) and the `node:fs/promises` dynamic import are verified through the bundler; `git` remains the only external binary the artifact spawns.
- **Published package** — `apps/scanner` becomes an installable package: `private: true` dropped, `bin` maps `leapscore-scan` to the compiled bundle (not the `.ts`), `engines: node >=20`, zero runtime dependencies. The package version is the release identity. **BREAKING** for anyone who installed the tsx form (nobody, pre-release). The package is *made* publishable here; publishing to the registry stays with the release-shape decision (see non-goals).
- **Engine identity from release** — the `engine_version` literal is replaced by the package version, build-time stamped; `--engine-ref` remains the explicit override. Fingerprint semantic era bumps (`FINGERPRINT_VERSION` v2 → v3): pre/post-change fingerprints are not comparable. **BREAKING** for fingerprint comparability, by the deterministic-scoring era rule's own design.
- **Self-contained Action** — the Action's runtime gains a zero-network path (`LEAPSCORE_CLI` environment override) and drops `npx -y tsx@4` and the repo-root bin resolution, so the published wrapper runs the built artifact instead of a toolchain fetch; the dist-composition details (what ships inside `dist/`, how it is kept fresh) are the `artifact-packaging` capability's contract. **BREAKING** for the in-repo `uses: ./action` dogfood path (rewired to the built dist). Marketplace *publishing* stays with the release-shape decision.
- **Container surface** — a `Dockerfile` wrapping the same bundle for air-gapped/locked-down CI; no registry publish in this change.
- **Generic CI docs** — a README section documenting the non-GitHub pipeline step (bundle + the existing exit contract `0/1/2/3` is pipeline-agnostic).
- **`sample` flag honesty fix folded in** — the `detector-honesty` proposal recorded a hardcoded `sample: true` on every real seal (`seal.ts:215`) while the `report-envelope` spec mandates "true only for authored demo data"; on the current tree the local-path seal leaves the field unset (absent-or-false, contract-conformant). Verifying the full seal matrix (unified/phase1/server paths) and nailing it with a test is a conformance task here, no requirement change.

Non-goals (explicitly out of scope):

- **Single-executable packaging** (Node SEA / `pkg`): deferred to v1.1; once the bundle is the invariant, the exe is a wrapper, not a rewrite. The readable-bundle-on-system-Node posture also serves the privacy-audit thesis (a security team can grep one `.mjs` for `fetch`).
- **Publishing to the npm registry / Marketplace / a container registry**: the mechanism lands here; the *names* are tagged on the release-shape decision (which org owns the public repo). Nothing in this change requires the answer.
- **Licence and repo hygiene** (Apache-2.0 `LICENSE`, root `README`, `CONTRIBUTING`): licence changes are their own change; the generic-CI docs section lands where the README will live.
- **Offline-by-default flip** (`offline-default`), snapshot breadth, the two-codebase validation runs: separate changes per the readiness note's ordering.
- No change to CLI flags, exit codes, scan behavior, scoring, or the scanner service.

## Capabilities

### New Capabilities

- `artifact-packaging`: the build-and-install contract — one bundle per release as the invariant artifact, what a clean install of each topology must produce and be able to *run* without network, the release-version identity rule feeding the fingerprint (with its era rule), and the committed-dist freshness gate for the Action.

### Modified Capabilities

- `cli-packaging`: the fresh-install guarantee strengthens from "shim resolves to an existing file" to "shim executes" (the tsx-shebang shim satisfied the old wording and fails on a clean machine); the compiled-target topology rule replaces "both mappings resolve to `apps/scanner/bin/scan.ts`".
- `workflow-scan`: **no requirement change** — the thin CLI contract, exit-code map, and strict-flag behavior are untouched; the Action's *runtime invocation* of the CLI (tsx-on-source → built artifact) is implementation, covered by `artifact-packaging`'s Action-surface requirements.
- `deterministic-scoring`: **no requirement change** — the score-fingerprint requirement already names "the engine version" as a fingerprinted input; this change makes that input release-derived (build-stamped package version, `--engine-ref` override) instead of a source literal, and the semantic-era rule fires with the v3 bump. Conformance plus an era bump, no new requirements.
- `report-envelope`: **no requirement change** — its "Report self-description marker" already mandates `sample` false-or-absent on real runs; verifying/nailing the seal matrix against it is a conformance task here, closing the honesty proposal's deferred item.

## Impact

- **Build**: new `apps/scanner/scripts/build.mjs` (esbuild, action pattern); esbuild moves from vendored-in-`action/` to a shared devDependency; `tooling/checks/` gains a dist-freshness check; root scripts gain `build:cli` / `check:dist`.
- **Packages**: `apps/scanner/package.json` (name, version, `private`, `bin`, `engines`, zero runtime deps confirmed); root `package.json` `bin` block reconciled with the compiled-target rule.
- **Action**: `action/src/main.ts` (drop `npx -y tsx@4` at `:77`, drop `repoRootFor`/`apps/scanner/bin/scan.ts` resolution at `:182`, invoke the bundled scanner), `action/scripts/build.mjs` (compose both bundles), `.gitignore` (un-ignore `action/dist/index.js`), `action.yml` unchanged (`node20` + `dist/index.js` becomes true), `.github/workflows/leapscore-scan.yml` dogfood path.
- **Identity**: `apps/scanner/src/scan/local.ts:378`, `orchestrator.ts:209/422`, `server.ts:208` (literal replaced by stamped constant); `scoring/fingerprint.ts` (`FINGERPRINT_VERSION` 2 → 3); `sample` flag seal-matrix verification; repeat-run fingerprint-equality tests updated for era v3.
- **Runtime dependencies**: none added — engine has zero npm runtime deps; the bundle inlines JSON assets and snapshots; `git` is the only spawned binary (documented requirement in the artifact spec).
- **Docs**: `apps/scanner/README.md` (install topologies), generic-CI step section; release-readiness items 6/8/10, now specified in `openspec/specs/report-envelope/spec.md`, `openspec/specs/cli-packaging/spec.md`, and `openspec/specs/stack-coverage/spec.md`, retire on merge.
- **Unlocks**: the two-codebase validation checklist item (runners can actually install it), Marketplace publish, and the `offline-default` flip's Action-input rename landing on a self-contained Action instead of the broken one.
