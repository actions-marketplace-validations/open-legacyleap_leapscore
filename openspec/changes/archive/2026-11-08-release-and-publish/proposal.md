## Why

Every distribution surface is built but none is reachable: `npm view leapscore-scan` and `npm view @leapscore/scanner` both return `E404`, `apps/scanner/package.json` still declares `private: true`, the repo has no tags, and the Action's metadata lives in `action/action.yml` so it is consumable only as `uses: ./action` from inside this checkout. The archived `release-packaging` change deliberately stopped at "made publishable" and deferred the release-shape decision. With the project moving to `open-legacyleap/leapscore`, that decision now blocks the two promises the release makes: `npx` one-command local scanning, and a versioned Action any repository can reference.

## What Changes

- **Claim and publish the package.** Publish the scanner as unscoped `leapscore-scan` at `1.0.0` (all candidate names are unclaimed on npm today), rename the workspace package from `@leapscore/scanner`, drop `private: true`, and keep the zero-runtime-dependency, single-bundle shape. **BREAKING** for workspace scripts and any reader of the old package name.
- **Tag-driven release workflow.** A tag push runs the release gates (all `check:*`, bundle parity, committed-dist freshness), builds the artifact once, publishes to npm with provenance through OIDC trusted publishing, creates the GitHub release, moves the major `v1` tag, and runs a post-publish install-and-scan smoke. No long-lived npm token.
- **Action becomes installable at a ref.** Move `action.yml` to the repository root (with `runs.main: action/dist/index.js`), delete the subdirectory metadata, switch the dogfood workflow to `uses: ./`, and add the Marketplace metadata so consumers can write `uses: open-legacyleap/leapscore@v1`. **BREAKING** for the in-repo `uses: ./action` path.
- **Consumer docs tell the truth.** The root README's primary command becomes the registry install (`npx leapscore-scan .`) instead of "clone this repository", and gains an Action section with `fetch-depth: 0` and band-gate guidance plus version-pinning rules.
- **Release identity.** The published version is the engine identity stamped into the bundle, so the first public release changes the sealed `engine_version` (`0.1.0` → `1.0.0`) and therefore every `score_fingerprint`. **BREAKING** for comparability with pre-release fingerprints; the fingerprint era itself does not change.
- **Repository identity.** Every install, `uses:`, and Marketplace string targets `open-legacyleap/leapscore`; the actual repository transfer and npm ownership grant are checked as ops tasks, not performed by this change.

Non-goals: container-registry publication (the `Dockerfile` stays a build-from-source surface), a remote `repo:` input on the Action, site/Pages work, scan queues or relays, and any change to scanner behavior, scoring, the rubric, or the report envelope.

## Capabilities

### New Capabilities

- `release-publication`: the public-release contract — what a version means, how the package and Action are published, which gates must pass before publication, how provenance and the moving major tag work, and how a bad release is rolled back.

### Modified Capabilities

- `artifact-packaging`: adds the Action-at-a-ref surface (root metadata, Marketplace listing) and makes the published tarball a verified release surface rather than a theoretical topology.
- `cli-packaging`: registry install becomes the first-class published topology; `npx leapscore-scan` is the documented command, with the git-install form demoted to a secondary path.
- `open-source-release-materials`: the README's primary runnable command and its prerequisites change from a repository checkout to a registry install, and the Action install path joins the release materials.

## Impact

- **Package**: `apps/scanner/package.json` (name, version, `private`, publish `files`, `publishConfig`), root `package.json` workspace scripts, `tooling/checks/bin-wiring.ts` expectations.
- **Action**: `action/action.yml` → root `action.yml`, `action/README.md`, `.github/workflows/leapscore-scan.yml` dogfood path, `tooling/checks/dist-freshness.ts` if the metadata move changes what it verifies.
- **Release**: new `.github/workflows/release.yml` (or an equivalent tag-triggered workflow), tag convention `vX.Y.Z` plus a moving `v1`.
- **Docs**: root `README.md`, `apps/scanner/README.md`, `action/README.md`, `AGENTS.md` distribution notes.
- **Identity**: `apps/scanner/src/scan/identity.ts` reads the build stamp unchanged; only the stamped value changes with the version bump.
- **Dependencies**: none added at runtime; npm provenance relies on the runner's OIDC (`id-token: write`) and the repository's `npm` environment.
