# 16 — Project Surface v2 (historical board-linkage proposal)

> **Status:** Unresolved proposal for attaching the issues-only design in `15` to GitHub Projects v2. Neither Path B (PAT-owned board) nor Path C (App-owned board) is a current commitment; current issue-surfacing requirements are in [OpenSpec](../../openspec/specs/issue-surfacing/spec.md). This plan's ownership, permissions, migration, and execution sections preserve the options and rationale for historical reference. Original dependencies: `15`, `12`, `08`, and `14`.
> Explored truths carried in: no repo-owned Projects v2 (`createProjectV2` needs a user/org `ownerId`, optional `repositoryId` link); `GITHUB_TOKEN` cannot touch Projects v2 (App installation token or PAT required); V2 titles are not unique (find-by-name = list + client-side filter).

---

## 1. Decision gate (V1 — the one call this doc exists to force)

| Path | Board owner | Auth | What ships |
|---|---|---|---|
| **B: PAT-board** | User- or org-owned V2 board per target (same slug as `15` §3), linked to runner repo via `repositoryId` | Fine-grained PAT secret (Projects write + Issues write on runner + Contents read on targets); issues stay on `GITHUB_TOKEN` (§4) | Board find-or-create + `addProjectV2ItemById` linkage; everything else (`15` lifecycle/body/labels/throttle) untouched |
| **C: App-board** | Org-owned V2 board per target | GitHub App installation token (Projects + Issues + Contents per `12` §8 bill) | B's linkage plus the `12` machinery on its real timeline: install-time scan, manual re-scan, (Pro) scheduled re-scan |

- B-first argument: days not weeks; no App review/packaging; fine-grained PATs express least-privilege today; personal and small-team runners never need more.
- Direct-C argument: no PAT lifecycle (rotation, holder-change, org-approval gates on fine-grained PATs); ownership sits with the org from day one; no B→C migration burst (§6) ever happens.
- Gate criteria (proposed): if the first three production runners are org-owned → go direct-C; if personal/small-team → B-first with the §2 ownership rule mandatory, not advisory. Owner + date get logged here when called.

## 2. Ownership rule (V2 — mandatory under B, moot under C)

- Boards under B are owned by the PAT holder's user node (or one org for org-scoped PATs). Therefore: mint B PATs on a **service account** (never a named engineer), prefer **org-scoped** where the runner lives in an org.
- Rotation (same holder, new secret) is a non-event: boards persist, secret swaps, one re-run proves it.
- Holder-change (Alice → Bob) is a **re-boarding event**: new boards under Bob, every issue re-added (second first-scan burst), Alice-boards manually deleted. Runbook gets written before the first B board, not after the first departure.
- Org-approval friction is a known unknown: org owners can require approval for fine-grained PATs touching org resources — "paste a PAT and go" may queue behind a human. Spike before promising timelines (§9).

## 3. Auth matrix (V3)

| Op | B | C |
|---|---|---|
| Scan + artifact (unchanged) | `GITHUB_TOKEN` / target PAT per `14` §3 | same |
| Issue open/comment/reopen/close + labels | `GITHUB_TOKEN` (`issues: write`) — bot-authored, as in v1 | installation token |
| Board find-or-create + item add/list | PAT (Projects write); needs Contents on the runner repo when passing `repositoryId` | installation token (Projects + Contents per `12` §8) |
| Private-T guardrail | `15` §4 table stands; board ops never cross a visibility boundary the issues themselves can't cross | same |

## 4. Authorship + mode switch (V4, V5)

- **Authorship (V4, recommended: split).** Issues stay bot-authored on `GITHUB_TOKEN`; the PAT/App token touches only board objects. Rationale: board mutations (`addProjectV2ItemById`) are notification-quiet — no issue comments, no subscriptions — while PAT-authored issues auto-subscribe a human to every future reopen/close ping on a ~20-ticket burst. Split keeps the timeline readable (one author for content, silent linker for boards) and the blast radius auditable.
- **Mode switch (V5, recommended: explicit tri-state).** v1's boolean `surface` stays; new `board:` input, default `auto`: `auto` = PAT/App token present → board linkage, else issues-only + loud `board-skipped: no-token` line; `on` without a usable token → proceed issues-only + loud `board-degraded` warning (warn-only per `15` §10, never rewrites the scan verdict); `off` = v1 behavior exactly. Secret-presence must never be the *only* signal — `on` vs `auto` distinguishes "broken B" from "intended A".

## 5. Identity & reconciliation (V6 — grammar unchanged)

- Token grammar, titles, labels, discovery: `15` §7–§8 stand verbatim. The `target=` reservation pays off here — board attach re-identifies nothing.
- Board-relative truth needs one new rule: **the label listing is the roster, the board is the view.** Reconciliation per run: token-mapped issue missing from board → re-add (covers manual removals without duplicating — cf. `15` Thread 3, which no longer applies since identity never lived in membership); board item whose issue is gone/closed-Green → leave to lifecycle (§6 of `15`), never delete items directly.
- Record board node IDs (numbers are stable per board; titles are not) in the job summary and, when cheap, in the artifact envelope's `meta`. Find-or-create matches on `(owner, title)` listing, first-match-wins + warning — same honesty as duplicate tokens.

## 6. Migration price B→C (V7 — only if B ships first)

- `copyProjectV2` duplicates config, not ownership: cutover = create org board → re-add every issue (full re-burst, throttled, disclosed) → freeze window where **two boards hold the same `target=` tokens** → retire old board (rename `[retired]`, delete after one clean verification run via `deleteProjectV2`).
- Freeze rule for the ambiguity window: old board read-only first (note in its description + summary line), so S6-style first-match-wins never arbitrates live boards. Discovery during migration scopes to board node ID, not name.
- Accept-or-reject: re-burst + orphan cleanup + dual-board week is the price of B-first. If that price exceeds the App build cost, the gate (§1) should have picked direct-C.

## 7. Execution (engine tasks, either path)

1. `bin/surface.ts` gains a board step behind `board:` input: find-or-create (list + filter by title under owner) → optional `repositoryId` link → reconcile adds → board node IDs to summary. Issues path untouched. REST for issues; GraphQL only for board ops (new isolated client module — `gh.ts` stays scan-reads; detector-isolation check must cover the new file).
2. Workflow: `board:` input (`auto` default) + PAT/App secret wiring + `board-skipped`/`board-degraded` summary lines.
3. E2E: B-board create/link on self-scan; re-run dedup (0 opened, 0 re-added); revoked-PAT run (issues synced, board stale, loud line, exit still 0); two-target no-cross-talk extended to boards; (if B-shipped) migration dry-run asserting roster preservation across boards.
4. Still deferred past v2: check-run trailer, website links, file config + Pro keys, schedule/push triggers, Search-API matching.

## 8. Non-goals

`12`'s install-time/scheduled triggers under B (manual dispatch only, `14` rule); org-level projects; per-run boards; per-sha anything; title-uniqueness enforcement (worked around, not fixed); deleting retired boards automatically (manual, after verification).

## 9. Open items

- Call V1 (B-first vs direct-C) with owner + date; log V-series into `docs/plans/00_MASTER_INDEX.md` and add this doc to the `00` documents table (next free number — written as `16_` because `15_` is taken).
- Spikes before implementation: org-approval friction for fine-grained PATs; `repositoryId`-link Contents requirement against least-privilege PAT shape; `addProjectV2ItemById` notification behavior confirmation (V4's "notification-quiet" premise).
- Ratify V2 ownership rule + holder-change runbook before the first B board; V4 authorship and V5 tri-state are recommendations awaiting one dissent each.
- Calibration candidates: board slug length vs V2 title limits; retired-board retention window.
