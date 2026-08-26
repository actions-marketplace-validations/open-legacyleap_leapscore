# 12 — GitHub Surface Plan (report delivery via GitHub App)

> How a LeapScore report surfaces **in the target repo's GitHub UI** when compute runs on LeapScore's own infrastructure. Resolves the GitHub leg of OQ3 (`00`). Website/API/PDF legs remain open there.
> Decisions: **H1–H11** (this grill; pending logging in `00_MASTER_INDEX.md`). Builds on: `08` (GitHub App + token model), `06` (sealed report schema), `02` (status taxonomy), `09` (tiers), W6 (`11`, reserved `/r/[owner]/[repo]` route).
> Status: **AGREED (grill H)** — planning only; no implementation until the catalog is agreed (`00` line 5).

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
