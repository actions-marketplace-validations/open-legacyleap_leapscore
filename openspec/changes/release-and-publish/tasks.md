## 1. Private home and prerequisites

- [x] 1.1 Transfer the repository to `open-legacyleap/leapscore` **while keeping it private**, and verify the old path still clones through GitHub's redirect and the new path resolves for a member
- [x] 1.2 Verify Actions is enabled, the default branch is `main`, and the dogfood workflow runs without a PAT; record that standard-runner minutes are metered until the repository is public
- [x] 1.3 Confirm the publishing npm account has 2FA and publish rights, and that `npm view leapscore-scan` still returns `E404`; record the account name
- [x] 1.4 If the org plan supports environments on private repositories (Pro/Team/Enterprise), create the protected `release` environment now, restricted to `v*.*.*` tags with required reviewers, and verify a contributor without approval cannot start its jobs; otherwise record the deferral to 5.3 and keep every publish credential out of CI until then
- [x] 1.5 Confirm the tag scheme is free: `git ls-remote --tags` shows no `vX.Y.Z` and no `v1`, and record that `vX.Y.Z` tags are immutable while `v1` is the only moving tag

## 2. Package publication shape (private phase)

- [x] 2.1 Rename the workspace package to `leapscore-scan`, set `version` to `1.0.0`, and drop `private: true`; update the root `build:cli` script, `.github/workflows/bundle-parity.yml`, and the lockfile, then verify `npm install` links `node_modules/.bin/leapscore-scan` and `leapscore-scan --help` runs
- [x] 2.2 Add `publishConfig` (`access: public`, `provenance: true`), `repository`, `homepage`, and `bugs` pointing at `open-legacyleap/leapscore`, then verify `npm pack --dry-run --json` shows the new fields
- [x] 2.3 Commit `apps/scanner/LICENSE` as a byte-copy of the root Apache-2.0 text and extend a repo check to fail on divergence; verify the check fails after a deliberate edit and the packed tarball lists `LICENSE`
- [x] 2.4 Verify the packed tarball contains exactly the launcher, the bundle, `README.md`, `LICENSE`, and `package.json` (no `src/`, no sibling workspace packages), and that its bundle is byte-identical to `apps/scanner/dist/leapscore-scan.mjs`
- [x] 2.5 Install the packed tarball in an empty directory with network denied and run a fixture scan with `--out`; verify all three report files seal and the sealed `engine_version` is `1.0.0`
- [x] 2.6 Verify the sealed `engine_version` in a source-path scan also reports `1.0.0` and draft the release-note disclosure of the fingerprint change from `0.1.0`

## 3. Action addressability (private phase)

- [x] 3.1 Move `action/action.yml` to the repository root with `runs.main: action/dist/index.js`, delete the subdirectory metadata, and verify the repository contains exactly one Action metadata file whose inputs/outputs match the published contract
- [x] 3.2 Update `.github/workflows/leapscore-scan.yml` from `uses: ./action` to `uses: ./` in the same change, then verify the dogfood scan job is green on a push
- [x] 3.3 Bump the Action runtime to `node24` and verify a hosted-runner run reaches the scan step without a runtime warning; record the self-hosted-runner caveat in the Action README
- [x] 3.4 Extend `tooling/checks/bin-wiring.ts` or `tooling/checks/dist-freshness.ts` to assert the root metadata's `runs.main` exists and is the committed wrapper, and verify the check fails when the path is broken
- [ ] 3.5 Verify the internal consumer path from a second **private** repository in the same org with workflow access granted: `actions/checkout` then `uses: open-legacyleap/leapscore@<sha>` seals a report, and record the run URL and sealed score
- [x] 3.6 Verify a shallow checkout (default `fetch-depth`) leaves history-derived indicators `unknown` and that `fetch-depth: 0` measures them, so the documented guidance is evidence-backed

## 4. Release workflow and dry runs (private phase)

- [x] 4.1 Add `.github/workflows/release.yml` triggered on `v[0-9]+.[0-9]+.[0-9]+` tags with `verify`, `publish`, and `smoke` jobs; publish runs in the `release` environment when it exists (else a tag-only guard) with `id-token: write` and `contents: write`, and every other job keeps `contents: read`
- [x] 4.2 Implement the version guard: fail before publishing when the tag and `apps/scanner/package.json` version differ, and verify with a deliberately mismatched tag
- [x] 4.3 Make the `verify` job run every `check:*` command, bundle parity, and the workspace test suites on the tagged commit, and fail the release on any failure; verify by breaking one check on a throwaway tag
- [x] 4.4 Build once in `verify`, run `npm pack`, and upload `leapscore-scan-<version>.tgz` as a workflow artifact; add a `workflow_dispatch` dry-run path that runs the gates and skips publish, and verify it produces the tarball with no registry write
- [x] 4.5 Implement the `publish` job to download that exact tarball and publish it with provenance; verify the registry dry run accepts the tarball and that the job obtains an OIDC token only from the release environment (full provenance verification lands in 5.5)
- [ ] 4.6 Attach the same tarball plus `SHA256SUMS` to the GitHub release and verify the checksum matches both the attached and tarball artifacts
- [ ] 4.7 Move the major tag only after a successful publish and add a smoke `needs` relationship so a failed smoke leaves `v1` unmoved; verify with a deliberately failing smoke on a prerelease
- [x] 4.8 Implement the `smoke` job with no checkout: install `leapscore-scan@<version>` in a temp directory, run `--help`, scan a checked-in fixture with network denied, and assert the sealed `engine_version`; verify the job passes against the prerelease from 5.1

## 5. Name reservation, public flip, and the `1.0.0` release

- [x] 5.1 Reserve the name before the flip: build and pack the tarball, publish `1.0.0-rc.1` with a maintainer credential under the `next` dist-tag (no CI secret), and verify `npm view leapscore-scan dist-tags` shows `next` at `1.0.0-rc.1`; `latest` also names the prerelease (the registry cannot delete it) and 5.5's publish moves it
- [x] 5.2 Pre-flip audit: run a secret scan over the full history, review past workflow logs for values that came from secrets, check docs/fixtures for internal or private references, and acknowledge that commit author emails become public; record findings and fix or rotate anything before changing visibility
- [x] 5.3 Make the repository public and verify anonymous clone, `https://api.github.com/repos/open-legacyleap/leapscore` returning 200, and that the dogfood workflow still runs; create the protected `release` environment now if it was deferred in 1.4
- [ ] 5.4 Configure the npm trusted publisher for the release workflow and the `release` environment, confirm no registry write secret exists anywhere in the repository, and verify the OIDC path with a `1.0.1` dry run
- [ ] 5.5 Publish `1.0.0` through the workflow, verify `npm view leapscore-scan@1.0.0` and its provenance record point at the tagged commit, and confirm the npm page's repository link resolves
- [ ] 5.6 Create the immutable `v1.0.0` tag and move `v1`, then verify `uses: open-legacyleap/leapscore@v1` resolves to the `1.0.0` commit
- [ ] 5.7 Publish the Marketplace listing from the GitHub release UI and verify the listing shows the root metadata's inputs and branding
- [ ] 5.8 Verify the external consumer path from a throwaway **public** repository: `actions/checkout` then `uses: open-legacyleap/leapscore@v1` seals a report; record the run URL and sealed score
- [ ] 5.9 Record release evidence in the change notes: package version, tarball SHA256, provenance URL, action tag SHAs, smoke output, and the Marketplace URL

## 6. Documentation and reconciliation

- [ ] 6.1 Rewrite the root README's primary command as `npx leapscore-scan . --out leapscore-report` with Node ≥ 20 as the only prerequisite, demote the from-source and git-install forms, and verify the primary command from an empty directory after the `1.0.0` publish
- [x] 6.2 Add the Action section with the exact `uses:` line, `actions/checkout`, `fetch-depth: 0` rationale, a band-gate example, and pinning guidance; verify every documented input exists in the root metadata
- [x] 6.3 Update `apps/scanner/README.md` and `action/README.md` so the registry topology is primary and the git-install form is explicitly secondary, and verify the documented command runs
- [x] 6.4 Update `docs/roadmap/distribution-packaging.md` statuses and replace its scoped-name assumption with the `leapscore-scan` decision; verify no remaining claim says the package is private or the registry returns 404
- [x] 6.5 Update `AGENTS.md` with the release command surface and the new package/Action names, and verify every documented command resolves after a clean install

## 7. Integration verification and rollback

- [ ] 7.1 Run the full check family on the `v1.0.0` commit (`npm run check:rubric-consistency`, `check:schemas`, `check:documentation-structure`, `check:diagrams`, `check:detector-isolation`, `check:site-boundary`, `check:surface-boundary`, `check:bin-wiring`, `check:dist`) and record the result
- [ ] 7.2 Re-run the two consumer paths at the released tags: `npx leapscore-scan` from an empty directory and `uses: open-legacyleap/leapscore@v1` from a public test repo; record sealed scores and fingerprints
- [ ] 7.3 Rehearse rollback on a throwaway prerelease: deprecate it with a replacement message, move `v1` back to the last good release, and verify the documented recovery commands work
- [ ] 7.4 Audit the release posture: confirm no long-lived registry token, minimal workflow permissions, the `release` environment gate, and that the published tarball is assembled from the tag
