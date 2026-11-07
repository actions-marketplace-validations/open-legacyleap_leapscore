## Context

See `proposal.md` — Why. The relevant current state:

- The three identity surfaces disagree: package/command `leapscore-scan`, Action `name: "LeapScore local scan"` (slug `leapscore-local-scan`), consumer ref `open-legacyleap/leapscore@v1`.
- The Action is a checkout-first wrapper around the local lane only. It has no `--repo` input and no GH-API lane; the CLI does. The Action exists to keep `contents: read` and no token.
- `engine_version` is the release version stamped into both bundles, and it is a fingerprinted input (`fingerprint.ts`, `FINGERPRINT_VERSION = 3`).
- Baseline comparison refuses on subject, fingerprint scheme era, rubric version, missing inputs, or a suppressed headline. Engine identity is recorded and non-blocking (`diff.ts`).
- The release workflow creates the GitHub release with `gh release create`; no Marketplace flag is settable from CI.
- The listing published from `v1.0.1` is live at `/marketplace/actions/leapscore-local-scan` with one version and one star. Nothing in the repository links it.

## Goals / Non-Goals

**Goals:**

- One name for the scan artifact across package, command, Action metadata, and Marketplace slug.
- A rollout that never leaves the Marketplace with zero discoverable listings.
- Release notes that disclose the fingerprint consequence plainly enough that a consumer is not surprised by a changed `score_fingerprint`.

**Non-Goals:**

- Adding remote-scan capability to the Action. The rename does not pre-announce one.
- Removing packaging identity from the score fingerprint. The pattern is noted, not changed here.
- A Marketplace listing for any surface other than the root Action.

## Decisions

**D1 — Rename to `LeapScore scan` (slug `leapscore-scan`), not to the bare brand.**
The slug then equals the package and the command, which is the only naming fact a consumer can already observe. Alternatives: `LeapScore` (slug `leapscore`) is shorter and never needs to change, but it is broader than a repository-root action that only scans, and it would need a qualifier in the listing copy anyway; keeping `LeapScore local scan` preserves the most precise name but leaves the product with three names for one artifact.

**D2 — The description carries the scope the name drops.**
The Action is local-only, so the listing must still say so. Chosen description: `Checkout-first local scan: grades the checked-out working tree, with no clone and no token.` (91 characters, under Marketplace's 125-character limit). Alternative: leave the current sentence, which repeats "LeapScore scan" immediately beneath a heading that already says it.

**D3 — Rename now, as `1.0.2`, rather than batching with a future functional release.**
Batching is strictly cheaper in changelog terms, but it leaves the slug decision open while the listing accumulates links, stars, and versions, and the rename gets no easier. The listing is hours old with one star and no inbound links from this repository, so the link-equity cost is at its floor. The price is one metadata-only patch release; the alternative — renaming later — pays the same release cost plus a URL break with more attached to it.

**D4 — Publish the replacement listing before retiring the superseded one.**
Ordering is publish `1.0.2` listing → confirm the new URL resolves → uncheck `v1.0.1`. This keeps a listing live throughout. If GitHub refuses a second listing for a repository that already has one, the refusal happens while the old listing still works, and the fallback is: uncheck `v1.0.1`, then set the flag on `v1.0.2`. That fallback is the only path with a brief zero-listing window, and it is recoverable because the new name is unclaimed and the `v1.0.2` metadata is already correct.

**D5 — Retire `v1.0.1`'s flag instead of leaving two visible versions.**
A second listing that also advertises an older version splits the version picker and keeps a superseded name discoverable. Retiring the flag is presentation-only: `@v1.0.1` and `@v1` keep resolving, and the destination is the same committed artifact.

**D6 — Accept the fingerprint churn; keep packaging identity in the hash.**
Every consumer's `score_fingerprint` changes because the engine stamp moves. Baseline deltas still work, since engine identity is a named, non-blocking comparability input, so nothing fails closed. The alternative — a separate "scoring engine" version distinct from the packaging version — is a fingerprint-semantics change that would itself alter every fingerprint and deserves its own change, not a side effect of a rename.

## Risks / Trade-offs

- **A second listing may be refused per repository** → the D4 ordering makes the refusal observable before anything is lost; the documented fallback completes the rename.
- **The superseded slug may `404` rather than redirect** → nothing in this repository links it today, so the only loss is any external link made in the listing's first hours. The evidence record names the old slug so a future pointer can be explained rather than puzzled over.
- **Two listings briefly coexist** → accepted; the window is the operator's working session, and the retirement step is part of the same evidence entry, so it cannot be silently skipped.
- **A fingerprint change with no behavior change reads as noise** → the release notes state both facts in adjacent sentences, and this is the second such release, so noting the pattern keeps it from looking accidental.

## Migration Plan

1. Metadata: `name` and `description` in `action.yml`.
2. Identity: bump `apps/scanner/package.json` to `1.0.2`, rebuild both bundles, refresh the lockfile.
3. Gate: `npm run release:guard -- v1.0.2`, then `npm run release:gates`.
4. Release: commit, annotated tag, push; the workflow publishes npm, creates the GitHub release, smokes, and moves `v1`.
5. Marketplace: set the flag on `v1.0.2`, confirm `leapscore-scan` resolves, uncheck `v1.0.1`, record both URLs and the retirement in the release evidence.
6. Rollback: if the listing cannot be published, leave `v1.0.1`'s flag on and keep the `1.0.2` tag published — the tag is harmless (metadata-only, fingerprint era unchanged) and the listing decision can be retried without another release. Do not un-point `v1.0.2` or re-point `v1` by hand.

## Open Questions

- Does GitHub create a second listing for a repository that already has one, or refuse it? The D4 fallback covers both answers, so the first attempt resolves it in practice.
- Does the superseded slug `404` or redirect after its last flagged version is cleared? Either is acceptable; the answer changes only what the evidence entry says about the old URL.
