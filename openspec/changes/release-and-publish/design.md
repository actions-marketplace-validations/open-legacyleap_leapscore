## Context

See `proposal.md — Why`. The state that shapes the approach:

- **The artifact is finished.** `npm pack --dry-run` in `apps/scanner` already produces the launcher, the built bundle, the README, and the manifest (about 520 KB unpacked). The bundle inlines the rubric and both snapshots and spawns only `git`; the root `prepare` script builds it on install.
- **The package is not publishable.** `apps/scanner/package.json` declares `"name": "@leapscore/scanner"` with `"private": true`, no `publishConfig`, no `repository`/`homepage`, and no license file inside the package directory (the Apache-2.0 `LICENSE` is at the repo root, so the tarball ships without it). The `release-packaging` archive checked task 3.1 as done, but the field survived; `docs/roadmap/distribution-packaging.md` records the same defect.
- **The Action runs but is not addressable.** `action/action.yml` declares `using: node20` and `main: dist/index.js`; the wrapper and scanner bundle are committed under `action/dist/`. The dogfood workflow uses `uses: ./action`, which no external repository can write, and the metadata is not at the repository root, so the Action cannot be Marketplace-listed.
- **There is no release machinery.** No tags exist, no publish workflow exists, and the repository is still private under `open-legacyleap` — the git-install path is an access-holder path today.
- **Existing gates are the release gates.** `check:bin-wiring`, `check:dist`, bundle parity, and the workspace suites already encode the packaging invariants; the release adds ordering and credentials, not new verification logic.

## Goals / Non-Goals

**Goals:**

- `npx leapscore-scan .` works from an empty directory with only Node and `git`.
- `uses: open-legacyleap/leapscore@v1` works from any public repository with no build step.
- One tag produces one artifact, published byte-identically to npm, the Action, and the GitHub release assets.
- Publication is reproducible from the tag, uses short-lived credentials, and is reversible without republishing.

**Non-Goals (design-level):**

- No container-registry publish, no multi-archive image work; the `Dockerfile` keeps building from the workspace bundle.
- No remote `repo:` input on the Action — the coverage-consistency question (25 local vs 31 remote detectors) is deliberately deferred.
- No site, Pages, scan queue, or relay work.
- No change to CLI flags, exit codes, scoring, rubric, or the envelope. The only sealed-identity change is the version value.
- No npm scope/org purchase: the chosen name is unscoped, so only an npm account with publish rights is required.

## Decisions

**D1 — Publish unscoped `leapscore-scan`, and rename the workspace package to match.** The package name equals the command name, which is what makes `npx leapscore-scan` work without `-p`. This supersedes the roadmap's D1 assumption of `@leapscore/scanner`; that assumption was explicitly provisional. Consequences: `apps/scanner/package.json` name changes, root scripts using `--workspace @leapscore/scanner` change, `.github/workflows/bundle-parity.yml` changes, and the lockfile regenerates. Rejected: the scoped forms (need scope ownership, longer command, no zero-flag `npx`); a wrapper package named `leapscore-scan` that depends on a scoped package (a second package and an install-time dependency graph for no benefit).

**D2 — First public version is `1.0.0`, and the tag is the release identity.** The package already publishes a stable external contract (flags, exit codes, `report_schema: "1"`, envelope shape), so `0.x` would misstate maturity. The version is the existing build stamp: `apps/scanner/package.json` `version` flows through `__LEAPSCORE_ENGINE_VERSION__`, and the release job fails when the tag and manifest disagree. The sealed `engine_version` therefore changes from `0.1.0` to `1.0.0` and every fingerprint changes with it; the fingerprint era does not change, and the release notes say so. Rejected: `0.2.0` (signals pre-contract), versioning from `git describe` (unavailable on shallow checkouts and consumer-adjacent).

**D3 — Move `action.yml` to the repository root; do not duplicate it.** GitHub resolves `uses: owner/repo@ref` against root metadata and Marketplace listing requires it, while `runs.main` may point into a subdirectory (`action/dist/index.js`). One metadata file means one input/output contract. The dogfood workflow switches from `uses: ./action` to `uses: ./` atomically in the same change. Rejected: a root copy (two contracts that drift); a composite root action delegating to `./action` (adds a second execution layer and still needs a pinned `uses` inside the repository).

**D4 — Action runtime moves to `node24`; the CLI keeps `engines: node >= 20`.** The Action runtime is provided by the runner, so bumping it does not raise the consumer's Node requirement; Node 20 reached end-of-life in April 2026, and `node24` avoids a deprecation warning on every consumer run. GitHub-hosted runners support it; a task verifies the runner advertises it before the first tag. The CLI target stays `node20` so a locked-down host with an older-but-working Node can still run the artifact.

**D5 — Trusted publishing, with the name established once outside CI.** The steady state is npm OIDC trusted publishing from a protected `release` environment with `id-token: write`, `--provenance`, and no stored registry token. A trusted publisher can only be configured on a package that already exists, so `1.0.0-rc.1` is packed and published once by a maintainer with a local credential under the `next` tag — establishing the name without storing a token in the repository or CI. From `1.0.0` onward every publication goes through OIDC. Rejected: a standing `NPM_TOKEN` secret (a long-lived write credential in a public repo); GitHub Packages (authenticated reads defeat the "anyone" requirement).

**D6 — Verify, build, publish the tested tarball, then smoke.** One tag-triggered workflow with three jobs:

```
tag vX.Y.Z
   |
   +--> verify   : all check:* + bundle parity + tests + build + npm pack
   |               uploads leapscore-scan-X.Y.Z.tgz as a workflow artifact
   |
   +--> publish  : environment: release (OIDC)
   |               downloads the exact tarball, npm publish <tgz>
   |               creates the GitHub release, attaches tgz + SHA256SUMS
   |               moves the major tag v1 (force, after publish succeeds)
   |
   +--> smoke    : no checkout; npm install <package>@X.Y.Z in a temp dir
                   --help, fixture scan offline, assert engine_version
```

Publishing the downloaded `.tgz` rather than a rebuilt directory is the mechanism that guarantees "the tested bytes are the published bytes". The major tag moves only after the registry accepts the version and the smoke passes conceptually before the tag move; if the smoke fails, the release is marked failed and the major tag is not advanced. Rejected: one job that builds and publishes in place (a rebuild between test and publish reintroduces drift); publishing from a branch (loses the immutable tag guarantee).

**D7 — Ship the license inside the package with an equality gate.** npm only includes license files that live in the package directory. Add `apps/scanner/LICENSE` as a committed byte-copy of the root license and extend an existing cheap check (or a new one) to assert byte equality, so the tarball ships Apache-2.0 without a generated-file surprise. Also add `repository`, `homepage`, and `bugs` fields pointing at the public home, and `publishConfig: { access: "public", provenance: true }`. Rejected: a `prepack` copy (mutates the tree during packing and can silently drift); `files` entries reaching outside the package (npm does not support it).

**D8 — Attach the tarball and checksums to the GitHub release.** Registry-less hosts install the release asset directly; this is the roadmap's P3.1 and costs one `gh release upload`. The asset is the same file the registry received, and `SHA256SUMS` covers both.

**D9 — `engineSha7` stays `unknown` unless the caller overrides it.** A moving action ref (`v1`) is not a commit hash, and writing it into `engineSha7` would be a false identity. Consumers who need commit-level identity pass `engine_ref`; otherwise `engine_version` identifies the release. Stamping the release commit hash into the bundle at build time is a stronger option but changes fingerprint semantics, so it is an open question for a later change.

**D10 — Do the build work private, flip to public once, then cut `1.0.0`.** The repository transfer to `open-legacyleap/leapscore` happens while the repository is still private; visibility is only required for four late-stage items, and forcing them early would produce a worse first release:

| item | requires public? | why |
|---|---|---|
| protected `release` environment | plan-gated | environments/protection rules are free only on public repos; private needs Pro/Team/Enterprise |
| npm provenance | effectively yes | the attestation is meant to be publicly verifiable against the source commit |
| Marketplace listing | yes | Marketplace listings are public only |
| external `uses:` consumer test | yes | a public throwaway repo cannot resolve a private action without org-level sharing |
| npm package page | yes | `repository` would link to a 404 for non-members |

Consequences: the private phase carries the package metadata, license gate, Action move, dogfood, release workflow, dry runs, and a name-reservation prerelease; the public flip carries provenance, the `1.0.0` publish, the environment gate (if deferred), Marketplace, and the external consumer test. GitHub redirects the old path after a transfer, so the existing `npx -p "github:open-legacyleap/leapscore#<sha>"` form keeps resolving. The npm account needs no organization for an unscoped name.

**D11 — Reserve the name with a prerelease, never with `1.0.0`.** Publish `1.0.0-rc.1` under the `next` dist-tag while private, so the unclaimed name is secured and the publish path is exercised once, without ever presenting `latest` backed by a private repository (no provenance, broken repository link). `1.0.0` is published only after the flip, with provenance and a working repository link.

**D12 — Audit history and logs before the flip.** Making the repository public publishes the full commit history and the logs of every past Actions run. The pre-flip gate is: secret scan over history, scan old workflow logs for values that came from secrets, check docs/fixtures for internal references, and acknowledge that commit author emails become public. Anything found is rewritten or rotated before the flip, not after.

## Risks / Trade-offs

- [Name squat before the first publish] → claim `leapscore-scan` as soon as the release gates first pass; if taken, the fallback is a scoped name, which requires a spec change because it breaks the zero-flag `npx` requirement. Treat the claim as time-sensitive.
- [First publish cannot use OIDC] → explicit bootstrap step with a granular token scoped to the package, revoked immediately after `1.0.0`, then the trusted publisher is configured and verified by the `1.0.1` path.
- [Removing `action/action.yml` breaks the dogfood workflow if the move is split across commits] → one atomic change updates the root metadata and `uses: ./` together; `check:dist` plus a metadata-entry-exists assertion run in the same PR.
- [`node24` unsupported on an old self-hosted runner] → GitHub-hosted runners support it; the release task verifies on `ubuntu-latest`, and consumers on frozen self-hosted runners can use the previous action tag until their runner updates.
- [`1.0.0` invalidates fingerprints from `0.1.0`] → expected and disclosed in the release notes; no public baselines exist, and the site fixture is authored rather than engine-stamped.
- [Tarball license drift] → the byte-equality gate fails the release rather than shipping a mismatched license.
- [Major tag moved before smoke finishes] → ordering rule: the tag moves only after the registry publish succeeds, and a failed smoke marks the release failed and triggers the documented rollback (deprecate + move `v1` back).
- [Public tarball exposes the readable bundle] → intended: the bundle is auditable, and the artifact-packaging spec already makes readability a property, not a leak.
- [Private phase consumes metered Actions minutes] → the full gate set runs on PRs as usual, but standard runners are free only once the repository is public; keep dry runs scoped and schedule the flip as the release approaches.
- [Free org plan has no environments on private repositories] → the `release` environment is created after the flip when the plan requires it; until then the one-time publish credential stays out of CI, so there is nothing to gate.
- [A private-to-public flip exposes history and past run logs] → D12's audit is a release gate, and findings are rewritten or rotated before the flip, never after.

## Migration Plan

**Phase A — private build-out**

1. **Identity and package metadata** — rename the workspace package, set `1.0.0`, drop `private`, add `publishConfig`/`repository`/`homepage`/`bugs`, commit the package `LICENSE` and its equality gate, update workspace scripts and the lockfile.
2. **Action addressability** — move `action.yml` to the root, delete the subdirectory copy, switch the dogfood workflow to `uses: ./`, bump the runtime, verify the Action executes from a git-sha ref inside the repository.
3. **Release workflow and dry run** — add the tag-triggered workflow with verify/publish/smoke jobs, run the gates and `workflow_dispatch` dry-run path, verify the tarball and smoke against the prerelease.
4. **Name reservation** — tag and publish `1.0.0-rc.1` under the `next` dist-tag; confirm `latest` stays unset and the name is secured.

**Phase B — public release**

5. **Pre-flip audit** — secret scan over history, review past workflow logs, check docs/fixtures for internal references, and rotate anything sensitive before changing visibility.
6. **Flip and gate** — make the repository public, create the protected `release` environment if it was deferred, configure the trusted publisher for the release workflow and environment, revoke the bootstrap credential, and verify the OIDC path.
7. **Publish 1.0.0** — run the workflow, verify provenance and the repository link, create the immutable `v1.0.0` tag and move `v1`, attach the tarball and checksums, and run the external consumer test.
8. **Docs and reconciliation** — README primary command, Action section, Marketplace listing, package READMEs, and roadmap statuses.

**Rollback** — deprecate the version with a replacement pointer, move `v1` back to the last good release, and publish the fix as a new patch. Unpublish only inside the registry window and only if nothing depends on the version.

## Open Questions

- Whether to stamp the release commit's `sha7` into the bundle as `engineSha7` (truthful commit identity without an override). It would change fingerprint semantics, so it belongs to a follow-up change against `artifact-packaging` / `deterministic-scoring`.
- Marketplace category and search terms (branding icon/colour already exist; the listing copy is a release-day edit, not a design constraint).
- Whether the git-install form stays documented long-term once the registry path is live. The `cli-packaging` delta keeps it working and demoted; removing it is a later docs decision.
