# Distribution packaging — roadmap

> The release brief's packaging test: *"Packaging: whatever needs the fewest steps
> on a locked-down machine — ideally a single binary or a container image, plus
> the package manager the base version already uses."* This document records the
> status, the exact gap, and the ordered backlog for satisfying it. The packaging
> build-out is implemented; publication is tracked by the `release-and-publish`
> change (`openspec/changes/release-and-publish/`). Measured on the current tree
> (2026-11-06), not asserted.

## Scope

**Three delivery surfaces, one artifact:**

1. **npm / `npx`** — "the package manager the base version already uses": the
   declared runtime is Node ≥ 20, so npm is the package manager already in the
   install path. `npx` is the zero-install form of it.
2. **Container image** — for hosts without the declared runtime.
3. **Single-file bundle** — "single binary" in the brief's sense: one executable
   file, no install tree, no toolchain.

**Acceptance test** — a locked-down host with only the declared runtime and
`git` runs one command, with no build step and no network beyond the artifact
fetch. A host without the runtime pulls the image and runs the same command.

**Out of scope** — Marketplace listing, telemetry, the hosted scan service, and
any hosted report permalink (the scanner is stateless; the sealed envelope is
the artifact).

## Baseline

`DONE` = shipped and verified on the current tree · `PARTIAL` = works, but not
for the audience the brief names · `BLOCKED` = the surface cannot be used at all
· `n/a` = not a surface of this product.

| surface | today | status | evidence |
|---|---|---|---|
| single-file bundle | `node leapscore-scan.mjs scan . --out out` | DONE | 510 KB readable ESM, `#!/usr/bin/env node` shebang + exec bit, zero runtime deps, `rubric.json`/`eol.json`/`advisories.json` inlined, `git` the only binary spawned; seals `engine_version` `1.0.0` |
| workspace shim | `leapscore-scan scan . --out out` after `npm install` | DONE | root `prepare` builds the bundle; `node_modules/.bin/leapscore-scan` → committed launcher `apps/scanner/bin/leapscore-scan.mjs`, which execs it; `check:bin-wiring` enforces it |
| container definition | `docker run --rm … leapscore-scan scan /work/repo …` | PARTIAL | root `Dockerfile`: distroless node-20 + `git`, copies the bundle, no build inside; container-vs-direct parity verified (10.11 · Critical, fv3); the artifact now seals `engine_version` `1.0.0`. No registry push; `latest` is a local convenience tag |
| git-install (`npx -p "github:…#<ref>"`) | `npx -p "github:open-legacyleap/leapscore#<sha>" leapscore-scan …` | PARTIAL | resolves and runs, but the repository transfer to `open-legacyleap` and its public visibility are ops tasks (`release-and-publish` 1.1/5.3); the form installs the monorepo and runs `prepare`, so it is the exact-commit pinning path, not the funnel |
| npm registry | `npx leapscore-scan scan . --out out` | READY | package metadata is publishable: `private` removed, `publishConfig` (`access: public`, `provenance: true`), `repository`/`homepage`/`bugs` point at `open-legacyleap/leapscore`, `LICENSE` ships inside the package; publication itself is `release-and-publish` 5.5 |
| GitHub Action | `uses: open-legacyleap/leapscore@v1` | PARTIAL | root `action.yml` with `runs.main: action/dist/index.js` and `using: node24`; the dogfood workflow uses `uses: ./`; Marketplace listing and the external consumer test are `release-and-publish` 5.7/5.8 |

**The bundle is already the hard part, and it is done.** `npm pack` in
`apps/scanner` produces five files — `LICENSE`, `README.md`,
`bin/leapscore-scan.mjs`, `dist/leapscore-scan.mjs`, `package.json` — at
134.1 kB packed / 553.2 kB unpacked. Publication is the only missing step on
that surface.

## The npm gap, resolved

| gap (2026-11-01) | resolution |
|---|---|
| `"private": true` refused `npm publish` | removed; `check:package-publish` guards the publish fields |
| no `publishConfig` | `access: "public"` + `provenance: true` in the manifest |
| `LICENSE` only at the repo root | `apps/scanner/LICENSE` is a committed byte-copy, guarded by `check:package-publish` |
| no release workflow | tag-driven `release.yml` (verify → publish → smoke → move major tag) |
| scope ownership assumed | the published name is unscoped `leapscore-scan`, so no scope is needed |

**Bookkeeping defect:** `release-packaging` task 3.1 is checked `[x]` claiming
`private: true` was dropped, but `git show edf2836:apps/scanner/package.json`
shows the field retained in the commit that closed the task. The field is now
actually gone; this change carries the correction.

## Decisions

**D1 — npm/`npx` is the primary public surface.** The acceptance command is
`npx leapscore-scan scan <path> --out <dir>`. It is the surface the brief
names ("the package manager the base version already uses"), it needs no
registry-side infrastructure beyond the publish itself, and it reuses the
already-verified bundle unchanged. The package is unscoped and its name equals
the command name, so `npx` resolves without a `-p` flag; this supersedes the
earlier provisional `@leapscore/scanner` assumption.

**D2 — The tarball is the bundle.** No install-time build, no `postinstall`, no
dependency tree. The published package must run on a clean host with only the
declared runtime and `git`; any install step that needs a compiler, a
toolchain, or a second network fetch is a packaging defect, not a convenience.

**D3 — One artifact, four surfaces; no static-binary variant yet.** The
`artifact-packaging` requirement *"One build artifact per release"* makes every
surface deliver byte-identical bundle content. A Node SEA or Bun-compiled binary
would be a per-platform second artifact and a spec change, not an implementation
choice — and it would break the invariant that makes the container and the
Action's parity claims meaningful. The `.mjs` is the "single binary" until a
host without Node is a demonstrated blocker (P2.3), not a hypothetical one.

**D4 — The package version is the release identity.** `apps/scanner/scripts/build.mjs`
stamps `__LEAPSCORE_ENGINE_VERSION__` from `apps/scanner/package.json` version
(`:10`, `:28`), and that value is hashed into `score_fingerprint` (era v3). A
release that changes scanner sources without bumping the version seals
indistinguishable fingerprints across two different builds — a determinism
defect. Publish is therefore tag-driven, and the tag must equal the package
version.

**D5 — Public access is declared, not implied.** `publishConfig.access:
"public"` and `publishConfig.provenance: true` are part of the package contract,
not release-workflow flags, so a bare `npm publish` is publicly installable and
provenance-backed. `LICENSE` ships inside the package directory (npm only
auto-includes it from there). Provenance comes from OIDC trusted publishing on
the tag workflow; no long-lived `NPM_TOKEN` is stored in the repo.

**D6 — Container distribution is registry-gated exactly like npm.** Same release
inputs, same bytes, digest-pinned pull, and `latest` is never pushed. The
Dockerfile's own comment already says *"pin by digest for any real registry
push"*; the roadmap adopts that as the rule rather than leaving it advisory.

**D7 — The git-install topology stays, as a secondary pinning path.** `npx -p
"github:…#<sha>"` remains the exact-commit form: it needs no registry and pins
the source. It is not the public funnel — it requires repo access and installs
the whole monorepo — so the docs present the registry install first and the
git form as the pinning alternative, never as "no setup".

**D8 — Fix the 3.1 bookkeeping in the same change as the publish.** A task
marked done that is not done is how the gap survived this long; correcting it is
part of P0, not a docs cleanup.

## Backlog

Target change: `release-and-publish` (capabilities: `release-publication`,
`artifact-packaging`, `cli-packaging`, `open-source-release-materials`). Items
below marked **landed** are implemented in that change; items marked
**pending** need publication or a registry operation.

### P0 — unblock the npm surface

| # | Item | Status | Verify |
|---|---|---|---|
| 1.1 | Make the package publishable: drop `private: true`, add `publishConfig.access: "public"` with `description`, `repository`, `keywords`, and ship `LICENSE` beside the bundle; correct `release-packaging` 3.1 | **landed** | `check:package-publish` guards the fields and license equality; the packed tarball lists `LICENSE`, the bundle, the launcher, the README, and `package.json` only (134.1 kB) |
| 1.2 | Add a tag-driven release workflow (`v*`): build the bundle, run `check:dist`, assert the tag equals the package version, publish with provenance | **landed** | `.github/workflows/release.yml` runs verify → publish → smoke → move major tag; `release-version-guard.ts` fails a tag/manifest mismatch before any upload |
| 1.3 | Registry acceptance test in CI: clean container with no checkout, `npx -y leapscore-scan@<v> scan <fixture> --out out --strict`, network blocked after fetch | **pending** | Three report files written, `fingerprint_version: 3`, stamped identity, exit `0`; the workflow's `smoke` job implements it |
| 1.4 | Promote the `npx` form to the root README's first-run command; keep checkout-and-install as the contributor path; add the published form to the scanner README's entry-point section | **landed** | `README.md` and `apps/scanner/README.md` lead with `npx leapscore-scan`; the git-install form is explicitly secondary |
| 1.5 | Close `release-packaging` (including 4.5's dogfood push) before the first tag | **landed** | `release-packaging` is archived; `release-and-publish` carries the remaining publication tasks |

### P1 — container distribution

| # | Item | Verify |
|---|---|---|
| 2.1 | Push the image on the same tag to a registry (`ghcr.io/leapscore/scanner`), digest-pinned, with `org.opencontainers.image.version` from the package version | `docker run --rm <image>@sha256:… --help` prints usage; a fixture scan seals the same score, band, and fingerprint as the published npm bundle |
| 2.2 | Document the image with its digest and the 0/1/2/3 exit-code contract; state that it carries the same bytes as the package | Docs name the digest and the parity claim; no "latest" instruction |

### P2 — locked-down and air-gapped install

| # | Item | Status | Verify |
|---|---|---|---|
| 3.1 | Attach the packed tarball plus a checksums file to the GitHub release so a registry-less host can `npm i ./leapscore-scan-<v>.tgz` | **landed** | the release workflow attaches the published tarball and `SHA256SUMS`; offline install on a clean host prints `--help` and seals a scan |
| 3.2 | Publish provenance and document verification (`npm audit signatures`, `gh attestation verify`) | **pending** | Verification succeeds against the published tarball; the command is in the docs |
| 3.3 | Re-evaluate a runtime-free binary (Node SEA / Bun compile) **only** if a Node-less host is demonstrated | open | Opens as a spec change against `artifact-packaging`'s one-artifact rule first; rejected outright if the host can carry Node 20 |

### Promotion checklist (per item)

1. `openspec new change "<target change>"`, copy the evidence above, and declare
   the capabilities named for that item.
2. Verify on a clean host (no checkout, no cache) and record the exact command
   and its output in the change notes.
3. Update this document's baseline table if the item moves a status.

## Open questions

- **Repository ownership and npm account are ops prerequisites, not code.** The
  repository must be transferred to `open-legacyleap/leapscore` and the
  publishing npm account must have 2FA and publish rights; both are checked as
  ops tasks in `release-and-publish` (1.1, 1.3). The package name is unscoped,
  so no npm scope or organization is needed.
- **Registry choice.** Public npm is the only option that satisfies "anyone"
  without credentials; GitHub Packages requires auth even for reads in most
  configurations, so it is rejected unless the audience is access-holders only.
- **Multi-architecture images.** The brief says "a locked-down machine", not
  "an x86 locked-down machine". Whether P1 must publish amd64 + arm64 is
  deferred to implementation; the Dockerfile itself is architecture-neutral.
- **Whether the scanner README keeps the git-install form after publish.** D7
  says yes, as the exact-commit pinning path; the docs present it as secondary
  rather than dropping it.
