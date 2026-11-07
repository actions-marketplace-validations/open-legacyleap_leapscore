## Why

The GitHub Marketplace listing is keyed by the `action.yml` `name` field, and GitHub slugifies that name into the listing URL. The first published listing (`v1.0.1`) derives from `LeapScore local scan` and lives at `/marketplace/actions/leapscore-local-scan`, while the npm package, the CLI command, and the release identity are all `leapscore-scan`. The listing is hours old with no inbound links, one star, and one published version, so this is the cheapest moment to align the three identities; after that, changing the name means carrying accumulated link and version equity across a new listing URL that nothing redirects.

## What Changes

- Root `action.yml` `name` changes from `LeapScore local scan` to `LeapScore scan`, so the Marketplace slug becomes `leapscore-scan` and matches the package and command.
- `action.yml` `description` is reworded so the local-only scope survives in the description once the name stops carrying it, and stays under Marketplace's 125-character limit.
- Release `1.0.2` carries the metadata change: version bump, rebuilt scanner and Action bundles, no scanner, scoring, rubric, report-envelope, CLI, or Action-input behavior change.
- The Marketplace listing is republished from `v1.0.2`, and `v1.0.1`'s Marketplace flag is retired, so exactly one listing exists and no Marketplace-visible version sits below `1.0.2`.
- The resulting listing URL and the retirement of the old slug are recorded as release evidence.
- The durable rule is written down: Marketplace identity follows release identity, and a rename requires a new tag because published metadata is frozen at its tag.

**Non-goals:** the Action stays checkout-first and local-only. No `--repo` input is added, no remote-scan lane is introduced, and no input, output, or runtime declaration changes. The rename is not a capability announcement.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `artifact-packaging`: adds a requirement that the Action's Marketplace name and slug track the release identity, that a listing published under a superseded name is retired when the replacement is live, and that a rename is disclosed as a metadata-only release whose fingerprint moves with the engine stamp.

## Impact

- **Metadata:** `action.yml` (`name`, `description`).
- **Release identity:** `apps/scanner/package.json` (`1.0.2`), `package-lock.json`, rebuilt `apps/scanner/dist/leapscore-scan.mjs` and `action/dist/**`.
- **Docs:** `docs/releases/1.0.2.md` (new), `docs/releases/1.0.1.md` (old listing marked superseded), `openspec/changes/release-and-publish/notes.md` (evidence entry).
- **Manual ops:** publishing the `v1.0.2` listing and unchecking `v1.0.1` happen in the GitHub release UI; the release workflow creates the release without a Marketplace flag, so neither step is automatable from CI.
- **Consumers:** every `score_fingerprint` changes, because the engine version is a fingerprinted input. Baseline deltas keep working: engine identity is a recorded, non-blocking comparability input, so rows still compare across `1.0.1` and `1.0.2`.
- **Risk:** whether GitHub permits a second listing for a repository that already has one, and whether the superseded slug `404`s or redirects, are both unverified. The rollout sequence keeps the existing listing live until the replacement is confirmed.
