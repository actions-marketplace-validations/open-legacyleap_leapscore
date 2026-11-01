## Why

LeapScore's repository front door does not yet match the open-source release brief: its root README leads with internal implementation detail, and the repository has no Apache-2.0 license or contributor guidance. A visitor-first README, an honest sample report visual, and a narrow contribution policy make the local-first product and its boundaries legible to developers and enterprise legal teams.

## What Changes

- Restructure the root README in the brief's order: one-line description and positioning line; privacy guarantee; one runnable command; sample report screenshot; methodology; next step. Keep developer-facing architecture and capability detail, currently in the README, in `AGENTS.md` as maintainer context.
- Add a committed sample report screenshot, generated from a real LeapScore report and clearly labeled as illustrative; document a reproducible way to refresh it so it cannot silently drift from the report format.
- Add `CONTRIBUTING.md` inviting issues and pull requests while stating the narrow product scope from the brief's section 8, plus practical contribution and verification guidance.
- Add the standard Apache License 2.0 text as `LICENSE` and declare `Apache-2.0` in applicable package metadata.
- Keep README claims aligned with current behavior: local path scans run locally; `--repo` is an explicit networked remote scan; no code, paths, or repository names are sent by local scanning; the tracked assessment URL is click-only.

## Capabilities

### New Capabilities

- `open-source-release-materials`: public repository documentation, sample-report asset, contributor scope, and Apache-2.0 licensing metadata required for the open-source release.

### Modified Capabilities

None. This change documents and packages the existing scanner behavior; it does not change scan, network, scoring, or report-runtime behavior.

## Impact

- Documentation: root `README.md`, `AGENTS.md`, and new `CONTRIBUTING.md`.
- Release artifacts: new `LICENSE` and a sample screenshot under `docs/` (with a documented refresh path).
- Package metadata: root and scanner package manifests, as applicable.
- No changes to scanner behavior, report contracts, site routes, rubric semantics, or network policy.
