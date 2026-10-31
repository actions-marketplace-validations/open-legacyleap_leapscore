# score-badge

## Why

A sealed LeapScore run produces three artifacts (`report.json`, `report.html`, `report.md`) and no carryable one. The score cannot leave the report: no README can display it, no permalink is cited from outside, and nothing a maintainer publishes today says "this repository was measured, this recently, this thoroughly." `docs/plans/00_MASTER_INDEX.md:25` already lists a badge as `12`'s deliverable; it was never specified, so the surface has been assumed for months without a design.

The opportunity is narrower than "add a badge." Every score badge in this category claims a **state** — a level, a grade — and a state claim in a static README rots silently the day it is pasted. A dated, coverage-qualified badge claims a **practice**: this repository was measured, at this confidence, in this period. That is durable in a way a bare band is not, and it is the only badge form an honest scanner can defend a year later.

## What Changes

- **New: a four-fact badge artifact.** A ~20px SVG carrying band, score, coverage, and scan month — `leapscore | 62 Moderate | 61% · 2026-10` — generated from a sealed envelope, never from a fixture.
- **New: coverage denominates over gradeable rows, not the rubric.** The badge's coverage number is the coverage-floor quantity `(measured + estimated) / (measured + estimated + unknown)`, so a printed score and a printed coverage can never contradict each other. This resolves three divergent denominators currently live in code (`mvp.ts:728`, `phase1.ts:218`, `site/lib/scoring.ts:181`).
- **New: two disclosure states.** `unscored` (headline suppressed with `insufficient-signal`) and `incomplete` (truncated or unreadable scan) render as badge states rather than as absent badges or as bare numbers.
- **New: embed snippets as a delivered artifact.** The badge is a citation only if the host page links it; the copy-paste snippet, not the SVG, carries the permalink and the full accessible sentence.
- **Not changed: scoring, sealing, band thresholds, weights, the fingerprint, or the delta.** The badge is a derived view over an already-sealed envelope. It adds no scored input and alters no existing artifact.
- **Not changed: the delta.** A delta badge was considered and rejected; `run-diff`'s attribution model cannot survive compression into a pill, and at 31/102 implemented indicators a delta badge would report coverage movement as improvement. The value segment is designed to admit a delta occupant later without changing the badge's grammar.

## Capabilities

### New Capabilities

- `score-badge`: the badge artifact — its four facts and their sources, the coverage denominator, the disclosure states, the no-mint guards, the value-segment grammar, and the embed snippet as a first-class deliverable.

### Modified Capabilities

<!-- None. The badge's link is a provenance citation to a sealed report, not the
     assessment next-step link, so release-funnel's tracked-link grammar is not
     extended. No existing requirement changes meaning. -->

## Impact

- **Surfaces:** a new badge emitter beside the CLI's existing report writers (`apps/scanner/src/scan/render.ts`, `apps/scanner/bin/scan.ts`), a new `--badge <path>` output, the GitHub Action's outputs (`action/action.yml`, `action/src/main.ts`).
- **Contracts:** a badge view-model derived from `Report` + `EnvelopeMeta` in `packages/contracts`; no change to `Report`, `ReportEnvelope`, `CONTRACT_VERSION`, or `score_fingerprint`.
- **Corrected:** `phase1.ts`'s `measured/102` coverage denominator must stop being the badge's source (a 6-row GH-API scan renders a distinct variant, not a coverage-different one).
- **Docs:** `docs/plans/12_GITHUB_SURFACE_PLAN.md` gains the badge section `00` line 25 already promises.
- **Distribution:** the first surface that leaves the report; the npm/`npx` funnel and the fast-path (phase-1) badge variant are follow-ups, not part of this change.
