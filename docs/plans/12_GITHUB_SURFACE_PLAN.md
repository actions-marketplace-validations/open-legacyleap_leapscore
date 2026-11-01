# 12 — GitHub Surface Plan (historical proposal)

> **Status:** Historical GitHub App, check-run, project, and report-delivery proposal. The target-repository writes, scheduled scans, canonical report store, and permalink design below were not adopted as written. Current workflow and issue behavior is specified in [workflow-scan](../../openspec/specs/workflow-scan/spec.md) and [issue-surfacing](../../openspec/specs/issue-surfacing/spec.md); the scanner remains stateless and issue surfacing is a separate app. The badge proposal was developed further in [score-badge](../../openspec/specs/score-badge/spec.md). Decision references: H1–H11; original dependencies: `08`, `06`, `02`, `09`, and W6 in `11`.

---

## 1. Mode (H1)

- Compute is **LeapScore's own infra** ("possibly within GitHub" = our runners, not theirs).
- The report surfaces **inside the target repo's GitHub**, plus optionally on the LeapScore website.
- Consequence: this is a *write-into-someone-else's-repo* product → everything hangs off an installable GitHub App and explicit consent.

## 2. Access & triggers (H2)

| Item | Decision |
|---|---|
| Access | Installable GitHub App, reusing the `08` model (per-repo install token, short TTL, single-repo scope) |
| Triggers | Install-time scan · manual re-scan · scheduled re-scan (**Pro only**, `09`) |
| Never | Per-push scanning — that is their CI's job; would burn budget every commit |
| Scan target | HEAD of default branch at trigger time (manual may pin a sha later) |

## 3. Surface trio & division of labor (H3, H4, H11)

| Surface | Role | Carries |
|---|---|---|
| **Check run** | Trailer | Headline score/band, coverage strip, gate board, category table, top blockers, links |
| **Repo Project "LeapScore"** | Remediation tracker | One issue per non-Green indicator, deduped across runs (§5) |
| **Website** | Depth (optional, public repos only) | Sealed report render: full evidence/remediation per row |

Design rule: the check summary must be **self-sufficient for decisions** ("what's my score, what hurts, what do I fix first"); the site/tickets are **self-sufficient for audit** (evidence per row).

Depth source by repo visibility (H11):

| Repo | Trailer | Depth |
|---|---|---|
| Public | check run | website sealed report + tickets |
| Private | check run | tickets only (`08`-safe; website link suppressed by construction) |

For private repos the check summary renders the **full category table + gate board unconditionally** (no "see website" ellipsis).

## 4. Check run spec (H8)

Anatomy of `output.summary` (~65k char markdown budget):

```
LeapScore 62/100 — Moderate        ← title line
Coverage: 49 measured · 19 estimated · 8 unknown
[gate board: G1–G8 pass/fire]      ← cockpit strip
category table (10 rows, % + band)
top blockers (5 worst rows, one line each)
→ Full report: <site link, public only> · N issues tracked in LeapScore project
```

- **Conclusion:** `failure` iff any gate fires, else `success`. The check *is* the verdict — gates are kill-switches (`00_EXECUTIVE_RUBRIC.md` Part 0); a green ✙ beside a fired gate would be the dishonesty LeapScore exists to refuse. Scans never run *in* their CI, so nothing blocks unless the repo opts into LeapScore as a required check.
- **Annotations:** one per Red row (location-less allowed), ≤50 per API batch; overflow lives in the summary table.
- Honest instrument-panel corollary: install flow states plainly "fired gates mark the check red."

## 4a. Score badge (README surface)

The deliverable `00_MASTER_INDEX.md` line 25 names. A sealed run already produces
`report.json` + `report.html` + `report.md`; the badge is the one artifact that
leaves the report. Historical change record: `openspec/changes/archive/2026-10-31-score-badge`; current specification:
`openspec/specs/score-badge`, emitter
`apps/scanner/src/scan/badge.ts`, contract surface
`packages/contracts/src/index.ts` (`badgeViewModel`, `BAND_PALETTE`,
`badgeCoverage`).

### Four facts, one source each

| Fact | Source | Rendered as |
|---|---|---|
| score | `report.headline.score` (absent when suppressed) | integer, floored |
| band | `report.headline.tier` (Low ≥80 · Moderate 53–79 · High 27–52 · Critical <27) | the word, never colour alone |
| coverage | `report.coverage` via `badgeCoverage` | integer percentage |
| scan month | `report.snapshot.scanned_at` truncated to `YYYY-MM` in UTC | `2026-10` |

No fifth fact: no delta, no next-band distance, no gate count, no top blocker,
no fingerprint excerpt. The score is floored rather than rounded so the printed
number can never read as a band the report did not seal (52.6 High stays `52`,
never `53`). Band colour comes from the one palette owner (`BAND_PALETTE`,
mirroring `apps/site/app/globals.css`); an SVG cannot read a CSS custom
property, so the mapping lives in contracts.

### Coverage is the coverage-floor quantity

`coverage = (measured + estimated) / (measured + estimated + unknown)` — the
same ratio the headline-suppression rule compares against `COVERAGE_FLOOR`
(0.5). One quantity means a printed score and a printed coverage can never
contradict each other ("a score at 45% coverage" is impossible by construction).
`not_applicable` and `not_implemented` rows are excluded from both numerator and
denominator: LeapScore's unimplemented detectors are not the scanned
repository's deficiency. The full-rubric denominator (`measured / 102`) is
forbidden as a badge value for that reason. Consequence accepted deliberately:
when a score is visible, coverage is necessarily ≥ 50%, so the useful reading is
at the low end of 50–100%.

### Five states; disclosure renders rather than suppresses

| State | Condition | Value segment |
|---|---|---|
| **scored** | headline exists and the scan is complete | `62 Moderate · 61% · 2026-10` |
| **suppressed** | `headline.suppressed` (`insufficient-signal`) | `unscored · 41% · 2026-10` |
| **incomplete** | sealed status is not `complete` (truncated tree, unreadable path, out-of-root symlink) | `62 Moderate · 61% · 2026-10 · incomplete` |
| **not-scanned** | nothing attempted (coverage denominator is zero) | `not scanned · 2026-10` |
| **absent** | authored fixture (`report.sample === true`) | no badge is produced |

`suppressed` replaces the score-and-band segment because there is no band to
state; `incomplete` is a trailing marker because an incomplete scan still has a
sealed score and a band, and the reader needs all four facts plus the caveat. A
suppressed-and-incomplete run renders `unscored · {cov}% · {YYYY-MM} ·
incomplete`. `absent` is a refusal with a reason naming `sample`, not a silent
missing file; a run-diff delta is refused the same way, naming `delta`.

### No delta occupant (D1)

A delta badge was considered and rejected. `run-diff` splits movement into
code-, coverage-, model-attributable, and unattributable parts and refuses to
compare on an `incomparable` verdict; compressing that into a pill either drops
attribution (printing coverage growth as improvement — the "trick of a higher
number" `09` §1.2 forbids) or carries a verdict a 20px pill cannot. At 31/102
implemented indicators every rubric expansion also reclassifies movement as
`coverage-change`, so a delta badge would report "no code change measured" for
most repos through most of its life.

The value segment is nevertheless specified as an occupant slot — a fixed
`leapscore` label plus a variable value segment — so the intended future
occupant (a code-attributable band transition) can replace the score-and-band
occupant without a second badge grammar, dimensions convention, or embed form.
This change ships only the four rendered occupants above.

### Determinism, freshness, and the embed

The badge is a self-contained SVG: no `href`, script, stylesheet, external font,
or `url(` reference, and no wall-clock content. The same envelope yields
byte-identical bytes on any machine; the month is the *scan* month, so
regenerating an old envelope keeps the old month and a stale badge is visibly
stale rather than silently current. Freshness comes from re-running the scan in
CI (the Action emits the badge), never from re-rendering.

An SVG loaded through `<img>` cannot link anywhere and does not surface its
`<title>`, so generation also emits a copy-paste snippet: a Markdown
`[![alt](svg)](permalink)` line and an HTML `<a><img …></a>` block. The link is
a provenance citation to the sealed report (`/reports/<runId>`) — deliberately
no `utm_campaign` or `band` parameters; the assessment next-step link stays
single-sourced by `release-funnel`. The `alt` is the full sentence (band, score,
coverage, month, and any disclosure marker), not the word "badge".

## 5. Remediation tracker spec (H4–H7)

### Object model

- Repo-level Project named `LeapScore`, created lazily on first scan, idempotent lookup by name.
- Real issues in the target repo added as project items (draft issues have no labels → rejected).
- **Ticket identity = `repo × indicator`** (e.g., `django/django × SEC-01`). Run identity lives in the timeline, not the object count: each re-scan appends transition comments (band change, score delta, sha, check-run link).

### Scope

- **All non-Green rows mint/update tickets** (grill override of worst-first cap; ongoing volume is O(newly-degraded rows) thanks to dedup).
- First-scan burst (~dozens on a rough repo) cannot be silenced — GitHub offers no notify-free issue creation. Disclose at install ("first scan may open up to N issues"); throttle API calls against abuse limits.
- Maintainer deletion of our tickets = veto, not bug: next scan treats it as first sighting and recreates.

### Lifecycle

| Event | Action |
|---|---|
| First sighting of non-Green row | Open issue + add to project |
| Band change (Red↔Yellow↔Green) | Transition comment (+ reopen/close as appropriate) |
| Score wobble within band (0→1 in Red) | Comment only, no transition noise |
| Green | Auto-close |
| Non-Green again | **Reopen immediately — no debounce** (grill override; calibration-log candidate for a future `reopen_debounce` knob) |

### Labels (fixed taxonomy, auto-created if missing)

| Label | Meaning |
|---|---|
| `leapscore` | namespace marker, every artifact |
| `leapscore:red` / `leapscore:yellow` | severity band |
| `leapscore:<category>` ×10 (`ecos`, `arch`, `test`, `sec`, `data`, `api`, `vel`, `perf`, `docs`, `fe`) | category filter |
| `leapscore:gate` | row participates in a fired gate |

No per-run labels, ever — filtering recipes like `label:leapscore:red,label:leapscore:sec`.

### Ticket body

Status, evidence/basis snippet, rubric remediation text, sha + links (check run, sealed report row). Canonical numbers stay in the sealed report — **the ticket is a derived view** (same rule as `00_EXECUTIVE_RUBRIC.md` vs encyclopedia).

## 6. Identity & idempotency (H10)

- Sole identity source: hidden machine token in the issue body:
  `<!-- leapscore:v1 indicator=SEC-01 -->`
  (grammar versioned for future migration: `… indicator=SEC-01 project=LeapScore schema=6`)
- Title (`[LeapScore] SEC-01: <short name>`) is cosmetic; renamed tickets still resolve.
- Discovery: REST **list issues by label** `leapscore` — direct query, stable pagination. GitHub Search API is forbidden here (index lag duplicates tickets during batch bursts).
- Duplicate tokens (manual copy): first-match wins + warning line in the check summary.
- Human append zone: content below `<!-- leapscore:human -->` survives regeneration; everything above is regenerated from the sealed report each scan.

## 7. Configuration (H9)

Layered: hardcoded safe defaults → `.github/leapscore.yml` (versioned, PR-reviewable by their team, read via already-held `contents:read`) → later Pro org-level defaults. JSON Schema published; unknown keys fail loudly in the check summary.

```yaml
# .github/leapscore.yml
issues: true                  # mint/update tickets in the LeapScore project
schedule: weekly              # Pro only
teardown_on_uninstall: ask    # close+archive | keep | ask
```

Honesty rule: paid features set on free installs are **never silently ignored** — the check summary prints e.g. "`schedule: weekly` requires Pro — running on-demand scans only."

## 8. Permissions bill (App consent, complete)

`metadata:read` · `contents:read` · `checks:write` · `issues:write` (incl. labels) · `projects:write` (repo-level projects only)

Deliberately absent: `contents:write`, discussions, org-level projects — smaller blast radius than any alternative that hosts report bodies inside GitHub.

## 9. Rejected alternatives (with cause)

| Alternative | Cause of death |
|---|---|
| Projects as *report surface* / one project per run | Trackers aren't read-models; litters target orgs; label-per-run pollution |
| PAT scanning of public repos | No write access → nothing can surface in-repo (contradicts requirement) |
| `workflow_dispatch` plumbing in their repos | Customers maintain LeapScore CI files; rejected for triggers *and* artifact upload |
| Release assets / committed report files | Needs `contents:write`; pollutes releases/history |
| Per-run tickets / per-run labels | Volume O(runs×indicators); orphans can't express continuity; abuse throttles |
| Search-API ticket matching | Index lag duplicates tickets during batch creation |
| Always-`success` / always-`neutral` conclusions | Fired gates rendered green/skipped — dishonest instrument panel |
| Anonymous site links on private repos | Leaks M&A findings; breaks `08` delete-after-delivery |
| Silent ignore of paid-only config keys | Swallowed friction; violates the honesty register (W14 analog) |

## 10. Open items

- Log H1–H11 into `docs/plans/00_MASTER_INDEX.md`; amend OQ3 (GitHub leg resolved; web/PDF/API legs open).
- Uninstall webhook behavior when `teardown_on_uninstall: ask` — needs a default (propose: keep + close checks).
- Manual re-scan UX (sha picker?) deferred to App UI session.
- Calibration candidates for `11_WEIGHTS_THRESHOLDS_CONFIG.md` §5-style log: reopen debounce, first-scan burst wording, annotation density.
