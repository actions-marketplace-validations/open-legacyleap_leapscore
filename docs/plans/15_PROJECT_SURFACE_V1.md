# 15 — Project Surface v1 (workflow issues-only tracker)

> Execution-plus-surface slice: extend the `14` workflow so a sealed report also syncs GitHub issues into the **runner repo**. Issues-only — no Projects board, no check runs, no website links in v1 (board linkage deferred to v2: PAT-board-first or direct-to-App TBD).
> Builds on: `14` (dispatch-only scan, thin CLI, exit-code map, artifact envelope), `12` §5–§6 (tracker lifecycle, body grammar — re-scoped here to runner-hosted issues-only), `05` (orchestrator), `08` (token model).
> Status: **AGREED (grill S) + explore revision (issues-only v1)** — planning only; implementation as `bin/surface.ts` (or `scan --surface`) + workflow surface job, REST-only.
> Engine truth today: `packages/engine/orchestrator.ts:48` (`EXPANDED_IDS`, 31 live), `seal.ts` (`sealScan` composer, envelope `{ report, meta, trace }`, `report_schema: "1"`, trace-truncate >200), `bin/scan.ts` (arg parse, `--sha` non-empty → `exit 2`, refused → `1`/`2` map), `.github/workflows/leapscore-scan.yml` (dispatch-only, `contents: read`, artifact `if: always()`).
> Explore findings (see grill notes): (a) no repo-owned Projects v2 exists — `createProjectV2` takes a user/org `ownerId` with optional `repositoryId` link; classic repo projects sunset Aug 2024; (b) `GITHUB_TOKEN` cannot access Projects v2 at all (App or PAT required). Hence issues-only v1 on `GITHUB_TOKEN`; board returns with v2 auth.

---

## 1. Mode (S1, S4, S11 — explore-revised)

- Compute stays where `14` puts it: the runner workflow (A) scans the target (T) via `runUnifiedScan("https://github.com/"+repo)` + `sealScan`. No LeapScore infra, no GitHub App, no PAT in v1.
- Surfacing writes **always into the runner repo A** (S4). T is a read-only scan subject. Self-scan (A==T) and target-scan (A≠T) share one code path; only labels/titles differ (§3).
- Issues-only (explore revision of S11): no Projects board, no check run, no website links, no PR comments in v1. The `leapscore-report.json` artifact remains the machine record; labeled issues are the remediation tracker.

## 2. Inputs (S10)

| Input | Required | Default | Meaning |
|---|---|---|---|
| `target_repo` | no | `github.repository` | Scan subject as `owner/repo` (14 rule: no `https://`, no `.git`). Also keys the target label + title prefix + token `target=` (§3, §7) |
| `sha` | no | empty (= HEAD) | Empty = default-branch HEAD at trigger time. Non-empty → scan refuses `exit 2` before any surfacing (14 §2 rule inherited) |
| `surface` | no | `true` | `true` = scan then sync issues; `false` = execution-only (14 behavior). Inputs-only config — no `.github/leapscore.yml` parsing in v1 |

## 3. Project container — deferred to v2 (explore revision, supersedes S2/S3)

- **No board in v1.** Per-target separation in the runner repo is carried by the `leapscore:target-<slug>` label (§8) + target prefix in titles (§7) + `target=` in the identity token (§7).
- Slug sanitization (shared by label + title + token normalization): lowercase, `owner/repo` → `owner-repo`, non-`[a-z0-9-]` → `-`, collapse repeats, trim dashes, cap 64 chars. Slug collisions (`a/b-c` vs `a-b/c`) are tolerated: the label is a **prefilter**, the token `target=` is authoritative (§7).
- v2 reintroduces the board (PAT-owned first or direct-to-App, TBD) and reuses the v1 identity grammar unchanged — `target=` was reserved for exactly this.

## 4. Auth & permissions (S1, S13 — explore-revised)

| Target | Token | Surfacing allowed |
|---|---|---|
| Public T | `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` passthrough, zero extra secrets | Always (runner hosts all writes; every v1 op is REST issues/labels) |
| Private T, runner A private or A==T self | PAT/App token with `contents:read` on T (e.g. `LEAPSCORE_TOKEN`); fail loudly if missing (14 §3) | Yes |
| Private T, runner A public and A≠T | Same PAT for read | **No** — execution-only artifact + loud `surface-skipped: private-target/public-runner` disclosure (S13 guardrail). Private evidence is never copied cross-boundary into a public runner |

- Workflow `permissions`: `contents: read` (14) + `issues: write` (labels + open/comment/reopen/close). Deliberately absent: `projects: write` (no board in v1), `contents:write`, `checks:write`, discussions. No GraphQL in v1 — REST only, all on the same token.

## 5. Ticket scope (S5)

- **All applicable non-Green rows mint/update tickets**: `measured` + `estimated` with score 0–2 (Red/Yellow bands). Steady-state volume is O(newly-degraded rows) thanks to dedup (§7).
- **Never mint**: `unknown` rows (no evidence to act on — they stay in the artifact as the deep-dive list), `not_applicable` rows (excluded from denominator by `scorer/applicability.ts`), Green rows (they auto-close, §6).
- First-scan burst (~dozens on a rough repo, × targets) cannot be silenced — GitHub offers no notify-free issue creation. Disclose counts in the job summary; throttle writes (§9).

## 6. Lifecycle (S7)

Adopted from `12` §5 minus board adds (run identity in the timeline, not the object count):

| Event | Action |
|---|---|
| First sighting of non-Green row | Open issue (with target label + token) |
| Band change (Red↔Yellow↔Green) | Transition comment (+ reopen/close as appropriate) |
| Score wobble within band (0→1 in Red) | Comment only, no transition noise |
| Green | Auto-close with closing comment (sha + score delta) |
| Non-Green again | **Reopen immediately — no debounce** (incl. maintainer-manual close: state is derived, not owned) |
| Maintainer deleted our ticket | Treat next scan as first sighting and recreate (veto = delete again; disclosed in summary) |

- Every open/comment/close carries: band transition or score delta, scanned sha (`meta.repoSha`), engine ref (`meta.engineSha7`), artifact/run link.
- No auto-close/delete on workflow disable or target drop — issues **persist** as history (S15). Manual cleanup only.

## 7. Identity & discovery (explore revision, supersedes S6)

- Sole identity source: extended hidden machine token in the issue body:
  `<!-- leapscore:v1 target=owner/repo indicator=SEC-01 -->`
  (`target=` is the normalized `owner/repo` slug source form, e.g. `django/django`.) Grammar stays versioned (`v1`) for future migration; the `target=` reservation is what lets a v2 board attach without re-identifying anything.
- Title carries the target for human scanning but stays cosmetic for matching:
  `[LeapScore] <owner/repo> SEC-01: <short name>` (e.g. `[LeapScore] django/django SEC-01: secrets in history`). Renamed titles still resolve — the token decides.
- Discovery per target (REST-only; Search API forbidden — index lag duplicates tickets during batch bursts, `12` §6 rule inherited):
  1. REST list issues in A with labels `leapscore` + `leapscore:target-<slug>`, `state=all`, paginate.
  2. Parse each body for the token → map `indicator → issue_number` for rows whose token `target=` matches the current target (label is prefilter only; collisions resolve here).
  3. Issues lacking a parseable token are ignored for dedup (human-filed lookalikes never hijack the map).
- Duplicate tokens for one target (manual copy): first-match wins + warning line in the job summary.
- Human append zone: content below `<!-- leapscore:human -->` survives regeneration; everything above is regenerated from the sealed report each scan.

## 8. Ticket body & labels (S8, S9 — S9 promoted)

- Body (`12` §5 verbatim): status, evidence/basis snippet, rubric remediation text, sha + links (artifact run, sealed row id). Canonical numbers stay in the sealed report — **the ticket is a derived view** (same rule as `00_EXECUTIVE_RUBRIC.md` vs encyclopedia).
- Labels — `12` fixed taxonomy intact **plus the now identity-bearing per-target label** (S9):
  `leapscore` (namespace) · `leapscore:red` / `leapscore:yellow` (severity) · `leapscore:<category>` ×10 (`ecos`, `arch`, `test`, `sec`, `data`, `api`, `vel`, `perf`, `docs`, `fe`) · `leapscore:gate` (row in a fired gate) · `leapscore:target-<owner-dash-repo>` (dedup scope prefilter).
  Auto-create missing labels. No per-run / per-sha labels, ever — filtering recipes like `label:leapscore:red,label:leapscore:target-django-django` keep working.

## 9. Throttle & burst disclosure (S14 — explore-revised)

- Discovery is one paginated REST label-listing + per-issue body parse (no GraphQL walk). Writes are sequential or low-concurrency (≤3) with backoff on `429`/abuse-limit responses; failed writes retry once, then degrade to warn-only (§10).
- Job summary always prints: `surface: N opened / M commented / K closed / J skipped + burst note` (first-scan count + duplicate-token warnings + `surface-skipped` reasons).
- Stdout stays human (14 line `score/tier/gates/coverage` + ` surface:N/M/K`); file stays machine.

## 10. Exit codes & failure semantics (S12)

- 14 map untouched for scan: sealed (`complete` or `degraded`, any score, gates fired or not) → **exit 0**; no report → `1` crash, `2` refused/unsupported-input (incl. non-empty `--sha`).
- Surfacing is **warn-only**: issue/label write failures never rewrite a sealed scan verdict. They land in stdout + `$GITHUB_STEP_SUMMARY` + trace; the artifact still uploads via `if: always()`.
- `surface: false` or `surface-skipped` (S13) → scan-only semantics; job notes the skip loudly, exit follows the scan map.

## 11. Execution (engine tasks to make v1 real — explore-revised)

1. `apps/surface/bin/surface.ts` (or `scan --surface --repo-a <owner/repo>`): read envelope `{ report, meta, trace }`, derive non-Green applicable rows from `report.full_table`, run label-scoped discovery (§7) → open/comment/reopen/close + label sync → summary counts. REST-only (`issues: write`); reuses `sealScan` types; no scorer changes, no GraphQL.
2. Workflow: extend `leapscore-scan.yml` with `surface` input + a surface step (`setup-node` reuse, `GH_TOKEN` passthrough, `if: always()` only when envelope exists and scan exit ∈ {0}).
3. E2E: self-scan (dedup on re-run: second run = 0 opened) + two-target run from one runner (label-scoped, no cross-talk: `target-a` rows never touch `target-b` tickets) + private-T×public-A skip assertion + burst-summary assertion.
4. Deferred to v2: board linkage (PAT-first vs direct-App TBD — grammar already compatible), check-run trailer, website links, `.github/leapscore.yml` file config + Pro keys, schedule/push triggers, `teardown` automation, Search-API matching.

## 12. Non-goals

Project boards, check runs, PR comments, badges, website deep links (even for public targets), file-based config, scheduled re-scans, multi-target matrix fan-out, SHA pinning (still `exit 2`), Docker/reusable-workflow packaging. Boards return in v2; everything else defers to `12` or a later surface revision.

## 13. Open items

- ~~Log S1–S15 into `docs/plans/00_MASTER_INDEX.md`~~ **DONE** (S-log + documents-table row 15); S2/S3/S6 annotated superseded by this explore revision.
- v2 decision: PAT-board-first vs direct-to-App (ownership rule, rotation vs holder-change runbook, re-burst + orphan-board migration price). Grammar (`target=`, label slug) already compatible with either.
- Calibration candidates for `11_WEIGHTS_THRESHOLDS_CONFIG.md` §5-style log: reopen debounce (S7 chose none — revisit if flaky detectors flap), burst wording, per-target slug length/collision conventions.
- Pin at implementation: label color/severity mapping, `setup-node`/`upload-artifact` versions alongside the existing `LEAPSCORE_ENGINE_REF`.
