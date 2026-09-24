## Context

See proposal.md (Why) and `docs/plans/15_PROJECT_SURFACE_V1.md` for the full plan. Current state shaping this design: the scan path is settled — `runUnifiedScan` → `sealScan` → envelope `{ report, meta, trace }` file, thin `bin/scan.ts` CLI, dispatch-only workflow with `contents: read`. The surface step is a pure consumer of that envelope: it reads `report.full_table` + `meta`, diffs against live tracker state, and writes issues. No scorer, orchestrator, or seal changes are needed. Constraints: everything must run on `GITHUB_TOKEN` (REST issues API only, no GraphQL); `packages/engine/gh.ts` is the only fetch-capable engine file and is fenced by the detector-isolation check; surfacing must never rewrite the scan verdict.

## Goals / Non-Goals

**Goals:**
- Envelope-in / tracker-synced-out as a standalone step reusable from both the CLI and (later) other triggers, with zero engine scoring changes.
- One token, one API family (REST issues/labels), one throttle policy across discovery and writes.
- Failure isolation: surfacing degrades to summary lines, never to exit codes.

**Non-Goals:**
- No check runs, Projects boards, website links, file config, or scheduling (v2 per plan 16).
- No changes to detection, scoring, applicability, or the envelope schema — the surface step treats `full_table` rows as opaque inputs beyond status/score/evidence fields.

## Decisions

- **Surface entry: `scan --surface` flag over a separate binary.** Reuses the existing arg parser, token resolution, and envelope conventions in `bin/scan.ts`; the surface phase runs after the seal write in the same process when the flag is set, and the workflow invokes it as a second step against the already-uploaded envelope path. Alternative (standalone `bin/surface.ts`) considered: cleaner separation but duplicates arg/token/out plumbing and doubles the npx install surface in the workflow. The flag keeps one CLI contract; internals stay split (scan phase vs surface phase functions).
- **New isolated REST module for issue writes (not `gh.ts`).** `gh.ts` is scan-reads with rate-limit retry tuned for 4s detector calls, and the isolation check pins it as the only fetch-capable file. Writes need different backoff (abuse-limit aware, sequential/≤3) and must not inherit detector timeouts. New module (e.g. beside the CLI) owns: label-scoped issue listing with pagination, issue CRUD + comments, label ensure-exists, all funneled through the single throttle. `gh.ts` untouched.
- **Discovery = label listing + body parse, single pass.** One paginated `GET /repos/{A}/issues?labels=leapscore,<target>&state=all` sweep builds the `indicator → number` map by parsing tokens (target equality authoritative). No per-issue fetch beyond the listing bodies (listing responses include bodies), no Search API. Alternative (fetch-then-filter without the target label) doubles read volume on multi-target runners; rejected.
- **Slug function shared by label, title, and token normalization**, implemented once and unit-tested (lowercase, `owner/repo`→`owner-repo`, illegal→`-`, collapse, trim, 64-cap). Collision tolerance is by construction (token decides), not by cleverer slugging.
- **Single authorship: everything on the workflow token.** No split identities — the bot authors opens/comments/closes uniformly across runs regardless of future secret changes.
- **Guardrail check before any write.** Resolve runner visibility (workflow context) and target visibility (cheap `GET /repos/{T}` with the scan token) up front; on private-T × public-A non-self, emit `surface-skipped` and exit the phase without touching the issues API. Decided before discovery so a skipped run costs one read, not a full listing.
- **Summary contract as machine-ish text.** One stdout line (`surface: N opened / M commented / K closed / J skipped`, plus `surface-skipped: <reason>` when applicable) plus the same counts appended to `$GITHUB_STEP_SUMMARY` with burst notes and duplicate-token warnings. The artifact file itself is not rewritten by surfacing (scan envelope stays canonical); board node IDs have nowhere to live until v2.

## Risks / Trade-offs

- [First-scan burst hits abuse limits] → Sequential/≤3 writes with backoff + single retry, then warn-only shortfall in the summary; burst size disclosed, never silenced.
- [Slug prefilter over-matches across colliding targets] → Token equality is the only match predicate; extra candidates cost reads, never correctness.
- [Maintainer edits the generated section by hand] → Next run regenerates above the human marker; accepted and disclosed in the body contract rather than merged.
- [Flaky detectors flap bands and churn reopen/close] → No debounce per spec (S7); calibration log candidate if observed — reopen storms are visible in summaries before they become a rule change.
- [Label auto-create races concurrent runs] → Ensure-if-missing tolerates 422-exists; concurrent dispatches against one runner are already serialized by dedup on re-read (second run sees first run's issues).
- [PAT-scoped private reads vs `GITHUB_TOKEN` writes] → Scan may use a PAT for private targets while surfacing writes with `GITHUB_TOKEN`; both tokens' visibility views are checked in the guardrail phase, not assumed.

## Migration Plan

No migration: the workflow change is additive (`surface` defaults `true` but the step is a no-op without a sealed envelope; setting `false` restores exact prior behavior). Rollback is the input flag, not a revert. Existing repos gain labeled issues on first surfaced run — expected burst, disclosed in the summary.

## Open Questions

- Label color/severity mapping (cosmetic; pinned at implementation with the existing engine ref).
- Whether the surface phase should append its counts into the envelope trace for website visibility later — envelope currently stays scan-canonical; defer to v2.
