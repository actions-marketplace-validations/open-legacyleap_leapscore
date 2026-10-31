# score-badge — design

## Context

See `proposal.md` — Why. Design-relevant current state:

- **Three coverage denominators are live.** `apps/scanner/src/scan/scoring/scorer/mvp.ts:728` uses `measured / (measured+estimated+unknown)`; `apps/scanner/src/scan/scoring/scorer/phase1.ts:218` uses `measured / 102`; `apps/site/lib/scoring.ts:181` uses `measured / (m+e+u)`. The suppression rule at `mvp.ts:735` uses a fourth framing: `(measured+estimated) / (m+e+u) >= COVERAGE_FLOOR (0.5)`. A badge forces one of these to become canonical for display.
- **No badge exists anywhere.** `docs/plans/00_MASTER_INDEX.md:25` names it as `12`'s deliverable; `12_GITHUB_SURFACE_PLAN.md` never specifies it. No badge flag, emitter, token, or test exists in the repo.
- **Report writers are the natural host.** `apps/scanner/src/scan/render.ts` already turns a sealed report into HTML and Markdown; `apps/scanner/bin/scan.ts` owns `--out` and writes the trio. Metadata (`meta.runId`, `meta.scanned_at`, `meta.engineSha7`) is already assembled at seal time.
- **Tier colors are already a fixed language** (W5/W16): `#22c55e` / `#e0a00a` / `#ef4444` / `#9f1d2c` in `apps/site/app/globals.css:19-22`. The badge must speak it, and an SVG cannot read CSS variables — the mapping needs one owner.
- **Fixture and demo data coexist with real scans.** `report.sample` is the marker that distinguishes them (`report-envelope`). Any badge path that can be reached from a fixture can publish a fabricated claim.

Width budget: at the 11px shields/Verdana convention, a full four-fact value segment (`62 Moderate · 61% · 2026-10`) measures ~156px, and a `leapscore` label adds ~64px, for a ~220px artifact — wider than shields' `npm v1.2.3` (~120px) but well inside a README column (~880px). Width is a legibility concern, not a feasibility one.

## Goals / Non-Goals

**Goals:**

- One badge artifact that states four facts and cannot contradict the report it came from.
- A canonical displayed coverage number, ending the three-denominator ambiguity at the display layer.
- Disclosure states that render rather than suppress, so "no trustworthy number" is a badge a maintainer can still own.
- A value segment that can later host an event-shaped occupant without a second badge grammar.
- Deterministic output: same envelope in, same bytes out.

**Non-Goals:**

- Any delta, transition, or attribution content in the badge. See D1.
- A hosted badge endpoint (`leapscore.dev/badge/...`). See D7.
- The `npx` distribution path and the phase-1 fast-path variant. Both are follow-ups; D2 constrains what a phase-1 badge may claim, but this change does not emit one.
- Fixing `phase1.ts`'s `measured/102` for any surface other than the badge.
- Share cards or OpenGraph images. Same slot, different artifact, not this change.

## Decisions

### D1 — Four facts, not a delta occupant

**Decision:** the badge carries score, band, coverage, and scan month. No delta.

**Rationale:** `run-diff`'s `DeltaHeadlineDecomposition` splits movement into code-, coverage-, model-attributable, and unattributable parts, and refuses to compare at all on an `incomparable` verdict. Compressing that into a pill requires either dropping attribution — which prints coverage growth as improvement, the exact "trick of a higher number" `09_MONETIZATION_TIERS.md §1.2` forbids — or carrying a verdict, which a 20px pill cannot. Separately, at 31/102 implemented indicators every rubric expansion reclassifies movement as `coverage-change`, so a delta badge shipped now would report "no code change measured" for most repos through most of its life.

**Alternatives considered:** code-only band transition (`High > Moderate`, derived from `band(baseline)` vs `band(baseline + code_attributable)`) — the most honest pill-sized delta, and the intended future occupant. Attributed magnitude (`+27 code`) — legible, but jargon on a README. From/to with attribution (`41 > 68 +27 code`) — a banner, not a pill.

**Consequence:** the value segment is specified as an occupant slot (spec, "Value-segment grammar"), so D1 is reversible without a grammar break.

### D2 — Displayed coverage is the coverage-floor quantity

**Decision:** `coverage = (measured + estimated) / (measured + estimated + unknown)`, taken from the same computation that gates suppression.

**Rationale:** the badge's coverage is read as "how much of this should I trust," which is the same question the suppression floor answers. Using one quantity means a printed `61%` and a printed `62` can never come from different definitions. `measurement-honesty` already states that spec-defined estimations count toward the floor, so counting them here is consistent rather than a new rule.

Rejected denominators: `measured/102` exports LeapScore's implementation completeness as the scanned repository's deficiency — a repo whose code is fully measured would still badge at 30% because 71 detectors do not exist yet. `measured/(m+e+u)` disagrees with the floor, producing the visible contradiction "you gave me a score at 45% coverage."

**Consequence to accept deliberately:** when a score is visible, coverage is necessarily ≥50%, so the displayed range is 50–100. The number is most informative at its low end, which is where it matters.

### D3 — Five states, and disclosure renders rather than suppresses

**Decision:** scored / suppressed / incomplete / not-scanned / absent (fixture only).

**Rationale:** the states that carry the product's honesty claim are the ones where no number exists. Emitting nothing for a suppressed headline would hide the run; emitting the reference score would print a number the report declined to state. `unscored` and `incomplete` are the only forms that stay truthful while remaining shippable.

`incomplete` is rendered as a trailing marker rather than replacing the value segment, because an incomplete scan still has a sealed score and a band — the reader needs all four facts plus the caveat. `suppressed` replaces the score-and-band segment because there is no band to show.

**Implementation note:** `report.status` and `headline.suppressed` are already on the contract; `meta` carries run identity. No contract change is required to reach any state.

### D4 — Two visual tiers: claim segment and qualifier segment

**Decision:** the score-and-band is a tinted segment carrying the tier color; coverage-and-month is a second, untinted segment with a dimmer foreground.

**Rationale:** four equal-weight facts read as machine output, not as a claim. Tinting only the claim segment restores the one-glance parse (`62 Moderate`) while keeping the disclosure present. This is the same device the report already uses to distinguish `measured` from `estimated`: weight and color encode epistemic status.

Rejected: tinting the whole pill (the qualifier inherits band urgency, collapsing the hierarchy); dropping the band word and relying on color (fails desaturation and colour-blind readers, and contradicts the spec's "band rendered as a word").

### D5 — Label text

**Decision:** `leapscore`, with the width reduced elsewhere if needed.

**Rationale:** harness-score's precedent (`harness`, not `harness-score`) shows the label can be shortened, but `leap` alone is not yet an established token and the badge is a first-impression artifact. Measure first; shorten only if the rendered width proves awkward in a real README row.

### D6 — Month comes from the envelope, never from generation time

**Decision:** the badge month is `scanned_at` truncated to `YYYY-MM` in UTC. Regenerating an old envelope reproduces the old month.

**Rationale:** a badge's only durable claim is about practice ("we measured recently"), and that claim is worth nothing if re-rendering can refresh it without re-measuring. This is also what keeps generation deterministic.

**Rejected:** generating with the current date (turns a stale scan into a fresh-looking badge — a lie), and omitting the date (a bare band rots silently, and the date is what makes a state claim into a practice claim).

### D7 — Static SVG written by the producer, no hosted endpoint

**Decision:** the badge is a self-contained SVG written beside the report trio; freshness comes from re-running the scan in CI.

**Rationale:** a hosted badge makes LeapScore a request-time dependency for someone else's README rendering and lets a badge flip red while its owner sleeps. A CI-written file is honest about its own age, needs no service availability, and matches the mechanism maintainers already understand from coverage badges. It also keeps the badge outside any auth or rate-limit surface.

**Rejected:** `leapscore.dev/badge/<owner>/<repo>.svg` — better freshness and a discovery channel, but requires scheduled rescans (a Pro capability that does not exist yet), creates a silent-red failure mode, and makes the badge unable to work offline.

### D8 — One owner for the band→color mapping

**Decision:** the band-to-hex mapping and the badge view-model live in `packages/contracts`; the SVG renderer consumes them and hardcodes nothing.

**Rationale:** the tier palette currently exists only as CSS custom properties in the site, which an SVG cannot read. Duplicating four hex values into a renderer is how palettes drift. Contracts already owns `TIER_THRESHOLDS` and the band vocabulary, so the palette belongs beside them.

### D9 — The embed snippet is emitted, not documented

**Decision:** badge generation emits the SVG and a Markdown + HTML snippet wrapping it in the sealed-report permalink with a full-sentence `alt`.

**Rationale:** an SVG referenced by `<img>` cannot link to anything, and when loaded that way its internal `<title>` is not surfaced as a tooltip — so the reader's only path to the report is the host page's link and the only accessible description is the `alt`. Getting that wrong makes the badge a decorative claim with no receipt.

The permalink is a citation, so it deliberately does not carry `release-funnel`'s assessment campaign parameters; those remain single-sourced for the next-step surface.

### D10 — Refuse fixtures and deltas at the entry point

**Decision:** badge generation refuses `report.sample === true` and refuses a run-diff delta document, both with an explicit reason.

**Rationale:** the baseline loader already refuses a delta passed as a baseline (`scan.ts:180`). A badge built from a fixture would publish a fabricated claim under a real-looking permalink, and a badge built from a delta has no sealed score to state. Both are cheap to detect from fields already on the document.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Four facts read as noise at 20px | Two-tier layout (D4); a rendered-width check against a real README row during implementation before the label or date format is locked. |
| Coverage falls when a tranche ships, with no code change | The month sits beside the number, so a coverage drop is always dated; the badge never claims improvement, so the movement is disclosure rather than a false signal. Documented in the change so it is not read as a regression. |
| A maintainer commits the badge once and it ages forever | That is the intended reading — `2026-10` in 2028 is a correct statement that the scan is old. The README guidance should say "regenerate in CI," and the Action should emit the badge so this is the default path. |
| A suppressed headline becomes a badge nobody wants | Accepted: `unscored` is a disclosure, not a trophy. It exists so the failure mode is honest rather than absent. |
| Badge bytes churn on every scan, creating commit noise | The SVG contains only the four facts, all of which change only when the measurement changes; a rescan in the same month with an unchanged score produces identical bytes. |
| Band colour mapping drifts from the site palette | Single owner in `packages/contracts` (D8), consumed by both the renderer and asserted against the CSS tokens. |
| `phase1.ts`'s `measured/102` leaks into the badge | The spec forbids the full-rubric denominator as a badge coverage value; the phase-1 variant, when built, reports attempted-row counts explicitly rather than a percentage that implies rubric coverage. |

## Migration Plan

1. Add the badge view-model and band palette to `packages/contracts` beside the existing band vocabulary. No contract-version bump: nothing in `Report` or `ReportEnvelope` changes.
2. Add the SVG renderer and snippet emitter beside `apps/scanner/src/scan/render.ts`; wire `--badge <path>` into `scan.ts` and write the file next to the report trio on every sealed run.
3. Expose the badge path as an Action output (`action/action.yml`) so a workflow can publish it without shell glue.
4. Add the badge section to `docs/plans/12_GITHUB_SURFACE_PLAN.md` (the deliverable `00:25` already promises) and a README-embed note carrying the "regenerate in CI" guidance.

**Rollback:** the badge is an additive output file. Removing the emitter leaves every existing artifact byte-identical, because the badge is never read back into a scan and never contributes to `score_fingerprint`.

**No data migration.** No sealed envelope changes shape; existing envelopes are badge-able without rewriting.

## Open Questions

- **Incomplete-state pill width.** Rendering `62 Moderate · 61% · 2026-10 · incomplete` assumes ~10 extra characters fit without wrapping the claim segment. If measurement during implementation says no, the marker becomes a state that replaces the band word, and the spec's "Badge never overstates the scan" requirement already covers the behaviour either way.
- **Whether the Action publishes the badge to a dedicated branch or commits it in place.** Deployment detail; both satisfy the spec, and it belongs with the workflow work rather than this change.
- **Whether a phase-1 badge variant is worth a separate occupant.** Deferred: it is a follow-up surface, and the spec's denominator rule already constrains what it may claim.
