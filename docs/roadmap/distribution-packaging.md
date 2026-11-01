# Distribution packaging — roadmap

> The release brief's packaging test: *"Packaging: whatever needs the fewest steps
> on a locked-down machine — ideally a single binary or a container image, plus
> the package manager the base version already uses."* This document records the
> status, the exact gap, and the ordered backlog for satisfying it. Planning
> only: nothing here changes engine, rubric, contract, or site behaviour, and
> each backlog item is promoted to its own OpenSpec change. Measured on the
> current tree (2026-11-01), not asserted.

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
| single-file bundle | `node leapscore-scan.mjs scan . --out out` | DONE | 510 KB readable ESM, `#!/usr/bin/env node` shebang + exec bit, zero runtime deps, `rubric.json`/`eol.json`/`advisories.json` inlined, `git` the only binary spawned |
| workspace shim | `leapscore-scan scan . --out out` after `npm install` | DONE | root `prepare` builds the bundle; `node_modules/.bin/leapscore-scan` → committed launcher `apps/scanner/bin/leapscore-scan.mjs`, which execs it; `check:bin-wiring` enforces it |
| container definition | `docker run --rm … leapscore-scan scan /work/repo …` | PARTIAL | root `Dockerfile`: distroless node-20 + `git`, copies the bundle, no build inside; container-vs-direct parity verified (10.11 · Critical, fv3, engine 0.1.0). No registry push; `latest` is a local convenience tag |
| git-install (`npx -p "github:…#<ref>"`) | `npx -p "github:open-legacyleap/leapscore#<sha>" leapscore-scan …` | PARTIAL | resolves and runs, but the repository is private (`api.github.com/repos/…` → 404), so it is an access-holder path; it installs the monorepo and runs `prepare` |
| npm registry | `npx @leapscore/scanner scan . --out out` | BLOCKED | `registry.npmjs.org/@leapscore%2Fscanner` → 404; `apps/scanner/package.json` still carries `"private": true` |
| GitHub Action | `uses: leapscore/action@v1` | PARTIAL | committed `action/dist` + `LEAPSCORE_CLI` override; dogfood `uses: ./action` green-on-push (`release-packaging` 4.5) still pending; no Marketplace publish |

**The bundle is already the hard part, and it is done.** `npm pack --dry-run` in
`apps/scanner` produces four files — `README.md`, `bin/leapscore-scan.mjs`,
`dist/leapscore-scan.mjs`, `package.json` — at 125.4 kB packed / 520.1 kB unpacked.
Publishing is the only missing step on that surface.

## The npm gap, precisely

1. `apps/scanner/package.json` declares `"private": true` (`:5`). `npm publish`
   refuses a private package outright.
2. No `publishConfig`. A scoped name (`@leapscore/…`) defaults to restricted
   access, so even after (1) a bare `npm publish` would not be publicly
   installable.
3. `files` lists `bin/leapscore-scan.mjs`, `dist/leapscore-scan.mjs`, and `README.md`.
   The Apache-2.0 `LICENSE` exists at the repo root but not in the package
   directory, so the tarball ships without it.
4. No release workflow. `release-packaging` explicitly deferred the mechanism's
   trigger: *"Publishing to the npm registry / Marketplace / a container
   registry: the mechanism lands here; the names are tagged on the release-shape
   decision."* That decision is still open.
5. The `@leapscore` scope must exist and be owned by the project before any of
   the above can be exercised.

**Bookkeeping defect:** `release-packaging` task 3.1 is checked `[x]` claiming
`private: true` was dropped, but `git show edf2836:apps/scanner/package.json`
shows the field retained in the commit that closed the task. The package is
*publishable-shaped* (zero runtime deps, `engines`, `files`, `bin` → bundle); it
is not publishable.

## Decisions

**D1 — npm/`npx` is the primary public surface.** The acceptance command is
`npx @leapscore/scanner scan <path> --out <dir>`. It is the surface the brief
names ("the package manager the base version already uses"), it needs no
registry-side infrastructure beyond the publish itself, and it reuses the
already-verified bundle unchanged.

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

**D5 — Public access is declared, not implied.** Scoped packages publish
restricted by default, so `publishConfig.access: "public"` is part of the
package contract, not a release-workflow flag. `LICENSE` ships inside the
package directory (npm only auto-includes it from there). Provenance comes from
OIDC trusted publishing on the tag workflow; no long-lived `NPM_TOKEN` stored in
the repo.

**D6 — Container distribution is registry-gated exactly like npm.** Same release
inputs, same bytes, digest-pinned pull, and `latest` is never pushed. The
Dockerfile's own comment already says *"pin by digest for any real registry
push"*; the roadmap adopts that as the rule rather than leaving it advisory.

**D7 — The git-install topology stays, as a pinning path.** `npx -p
"github:…#<sha>"` remains the exact-commit form CI uses before a registry
release exists. It is not the public funnel: it requires repo access and
installs the whole monorepo. Docs may present it only as the pinning form until
a registry release exists, and never as "no setup".

**D8 — Fix the 3.1 bookkeeping in the same change as the publish.** A task
marked done that is not done is how the gap survived this long; correcting it is
part of P0, not a docs cleanup.

## Backlog

Target change: `npm-release` (capabilities: `artifact-packaging`,
`cli-packaging`), unless `release-packaging` is still open after 4.5, in which
case the package fields land there and only the publish workflow is new.

### P0 — unblock the npm surface

| # | Item | Verify |
|---|---|---|
| 1.1 | Make the package publishable: drop `private: true`, add `publishConfig.access: "public"` with `description`, `repository`, `keywords`, and ship `LICENSE` beside the bundle; correct `release-packaging` 3.1 | `npm publish --dry-run` lists `LICENSE`, the bundle, and `package.json` only — no workspace sources; `npm pkg get private` prints nothing; `npm pack` size stays in the ~125 kB range |
| 1.2 | Add a tag-driven release workflow (`v*`): build the bundle, run `check:dist`, assert the tag equals the package version, publish with provenance | A `v0.1.0` tag publishes a version whose sealed `engine_version` is `0.1.0`; a tag/source version mismatch fails before any upload |
| 1.3 | Registry acceptance test in CI: clean container with no checkout, `npx -y @leapscore/scanner@<v> scan <fixture> --out out --strict`, network blocked after fetch | Three report files written, `fingerprint_version: 3`, stamped identity, exit `0`; the exact command is the one in the README |
| 1.4 | Promote the `npx` form to the root README's first-run command; keep checkout-and-install as the contributor path; add the published form to the scanner README's entry-point section | No document claims registry availability before 1.2 lands; `check:documentation-structure` and link checks green |
| 1.5 | Close `release-packaging` (including 4.5's dogfood push) before the first tag | The change is archived or explicitly carried forward with a named remaining task |

### P1 — container distribution

| # | Item | Verify |
|---|---|---|
| 2.1 | Push the image on the same tag to a registry (`ghcr.io/leapscore/scanner`), digest-pinned, with `org.opencontainers.image.version` from the package version | `docker run --rm <image>@sha256:… --help` prints usage; a fixture scan seals the same score, band, and fingerprint as the published npm bundle |
| 2.2 | Document the image with its digest and the 0/1/2/3 exit-code contract; state that it carries the same bytes as the package | Docs name the digest and the parity claim; no "latest" instruction |

### P2 — locked-down and air-gapped install

| # | Item | Verify |
|---|---|---|
| 3.1 | Attach the packed tarball plus a checksums file to the GitHub release so a registry-less host can `npm i ./leapscore-scanner-<v>.tgz` | Offline install on a clean host prints `--help` and seals a scan; the checksum matches the published tarball |
| 3.2 | Publish provenance and document verification (`npm audit signatures`, `gh attestation verify`) | Verification succeeds against the published tarball; the command is in the docs |
| 3.3 | Re-evaluate a runtime-free binary (Node SEA / Bun compile) **only** if a Node-less host is demonstrated | Opens as a spec change against `artifact-packaging`'s one-artifact rule first; rejected outright if the host can carry Node 20 |

### Promotion checklist (per item)

1. `openspec new change "<target change>"`, copy the evidence above, and declare
   the capabilities named for that item.
2. Verify on a clean host (no checkout, no cache) and record the exact command
   and its output in the change notes.
3. Update this document's baseline table if the item moves a status.

## Open questions

- **Scope and repository ownership are the real gate.** `@leapscore` must exist
  as an npm scope and the repository must be public for "anyone, everyone" to
  hold. Both are the release-shape decision `release-packaging` deferred; P0.2
  cannot land before it, and no amount of package metadata substitutes.
- **Package name: scoped vs unscoped.** `@leapscore/scanner` is safer against
  squatting but makes the command longer; `leapscore-scan` reads better but is
  a claimable name. D1 assumes the scoped form; the choice is deferred.
- **Registry choice.** Public npm is the only option that satisfies "anyone"
  without credentials; GitHub Packages requires auth even for reads in most
  configurations, so it is rejected unless the audience is access-holders only.
- **Multi-architecture images.** The brief says "a locked-down machine", not
  "an x86 locked-down machine". Whether P1 must publish amd64 + arm64 is
  deferred to implementation; the Dockerfile itself is architecture-neutral.
- **Whether the scanner README keeps the git-install form after publish.** D7
  says yes, as the pinning path; the docs edit in P0.4 should say so explicitly
  rather than dropping it.
