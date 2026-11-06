# Releases

One annotated `vX.Y.Z` tag is the release identity. The npm package version, the
`engine_version` stamped into the bundle, and the ref consumers resolve through the Action
all derive from that tag in one workflow run.

## Tag scheme

- **`vX.Y.Z` is immutable.** It is created once, points at the released commit forever, and
  is never re-pointed. The workflow verifies that the tag matches
  `apps/scanner/package.json` before it publishes anything.
- **`v1` is the only moving tag.** The release workflow moves it to the newest compatible
  release *after* the registry accepts the version and the post-publish smoke passes. A
  breaking release creates the next major tag (`v2`) and leaves `v1` where it is.
- Prereleases are published once, manually, under the `next` dist-tag (see below). They are
  never produced by the stable release workflow and never move a major tag.

## One-time prerequisites

These are external to the repository and are checked by the release change, not by CI:

- the repository lives at `open-legacyleap/leapscore`;
- a protected `release` environment exists, restricted to `v*.*.*` tags with required
  reviewers;
- npm has a trusted publisher configured for this repository's release workflow and the
  `release` environment — no registry token is stored in the repository;
- the package name is established once (`1.0.0-rc.1` under `next`), because npm only allows
  a trusted publisher to be configured on a package that already exists.

Until the protected environment exists, the publish job is still tag-only: it cannot run
on a branch, and it holds no credential other than the runner's OIDC identity.

## Cut a release

```bash
# 1. Bump the release identity and rebuild both release bundles from it. The scanner
#    bundle inside the npm tarball and the committed Action bundle must stay byte-identical.
npm version --no-git-tag-version --workspace leapscore-scan 1.0.1
npm run build:cli
npm run build --workspace leapscore-action

# 2. The gates and the tag/manifest agreement, locally, before pushing anything.
npm run release:guard -- v1.0.1
npm run release:gates

# 3. Commit, tag the commit, push the tag. The tag push is the release trigger.
git add -A
git commit -m "release: 1.0.1"
git tag -a v1.0.1 -m "LeapScore 1.0.1"
git push origin main
git push origin v1.0.1
```

The workflow then runs `verify` (every `check:*`, bundle parity, all workspace suites, one
`npm pack`), `publish` (the exact tarball, with provenance, plus the GitHub release and
`SHA256SUMS`), `smoke` (installs the published version in a clean directory with no
checkout, scans a fixture offline, asserts `engine_version` and the exit codes), and
`finalize` (moves `v<major>` only after publish and smoke both succeed).

## Dry run

Run the **Release** workflow from the Actions UI with `workflow_dispatch`. It runs the same
gates and packs the same tarball, and never publishes. Leave `version` empty to use
`apps/scanner/package.json`, or set it to exercise a specific version.

## Smoke an already-published version

Dispatch the **Release** workflow with `smoke_version` set (for example `1.0.0-rc.1`). The
verify job still runs the gates; the smoke job installs that version from the registry and
runs the offline fixture scan.

## Reserve the name (one-time)

The package version is the stamp inside the bundle, so the prerelease is built from a
temporary version and the committed identity is restored before anything is committed.

```bash
# Build an rc.1-stamped bundle and tarball: package version and engine_version agree.
npm version --no-git-tag-version --workspace leapscore-scan 1.0.0-rc.1
npm run build:cli
npm pack --workspace leapscore-scan --pack-destination dist-release

# Publish under `next`; never `latest` while the repository is still private.
npm publish dist-release/leapscore-scan-1.0.0-rc.1.tgz --tag next --access public
npm view leapscore-scan dist-tags   # next: 1.0.0-rc.1, no latest

# Restore the release identity and rebuild the committed bundle.
npm version --no-git-tag-version --workspace leapscore-scan 1.0.0
npm run build:cli
npm run check:dist
git status --short   # the temporary version must leave no diff behind
```

The maintainer credential used here is never stored in the repository or in CI. Revoke it
after `1.0.0` is published through OIDC.

## Rollback

Withdraw a defective release without rewriting it. A published version is never
re-published or mutated; the fix ships as a new patch.

```bash
# 1. Deprecate the defective version, naming its replacement.
npm deprecate "leapscore-scan@1.0.1" "Deprecated: use 1.0.2 — 1.0.1 seals an incorrect band for shallow checkouts."

# 2. Move the major tag back to the last good release (force-update the ref).
LAST_GOOD_SHA="$(git rev-list -n 1 v1.0.0)"
gh api -X PATCH "repos/open-legacyleap/leapscore/git/refs/tags/v1" \
  -f sha="$LAST_GOOD_SHA" -F force=true

# 3. Announce the rollback in the release notes and publish the fix as 1.0.2.
```

Unpublish only inside the registry's permitted window and only when nothing depends on the
version.

## Release evidence

Record for each release: package version, tarball SHA256, provenance URL, `vX.Y.Z` and
`v<major>` tag SHAs, smoke output, and the Marketplace URL. The draft for `1.0.0` lives in
[`1.0.0.md`](./1.0.0.md).
