# LeapScore — Product Bible

> One exhaustive product view of this repo. Implementation lives in `packages/engine` + `apps/site`;
> this document describes what the product **is, does, shows, and promises** — not how it is coded.
> Status: implementation live (unified scan, persisted reports, rubric browser). Stale "planning only" notes elsewhere are outdated.

---

## 0. TL;DR

- **LeapScore** turns any public GitHub repo URL into a **legacy / maintainability score (0–100)** with a tier, evidence, and fix plan.
- **Product in one sentence:** paste a repo link → automatic checkup in seconds-to-minutes → shareable report (score + top risks + remedies) backed by a public 102-indicator rubric.
- **Rubric:** 102 indicators across 10 categories (76 standard + 18 deep-dive + 8 conditional frontend). Every row scores 0–3 or N/A; 8 kill-switch gates can cap the verdict.
- **Scan:** one unified run under a single time budget (fast path ~10–15s, full scan up to ~4 min), streaming progress + detector trace, terminal state is either a **report** or a **refused** explanation — never a silent zero.
- **Report:** headline score + tier, gates cockpit, 9 scoring categories, per-indicator evidence, top blockers, remedies, deep-dive scope, coverage honesty (measured / estimated / unknown), persisted permalink with JSON + rerun.
- **Site:** marketing home + full pitch + method transparency + live scanner + scan history + per-run report + rubric browser + pinned sample. Sample repo (django/django) is pinned at **58 / Moderate**.
- **Honesty model:** unknowns are excluded from the score and shown as "what it takes to measure" — the upsell, not a gap. Estimates are capped and labeled. Sample views are always labeled illustrative.
- **Coverage today:** 31 checks run live (of 102); the rest appear as honest stubs. The old 19-row MVP slice is a subset of what ships.

---

## 1. Vision, users, jobs-to-be-done

### 1.1 Vision
Every codebase gets a fair, evidence-backed maintainability read — the same language for owners, buyers, and engineers — so legacy risk is visible before it becomes an incident, a failed deal, or a rewrite.

### 1.2 Who it serves
| Persona | Job-to-be-done | Success moment |
|---|---|---|
| Eng lead / repo owner | "How bad is my codebase, what do I fix first, how do I prove it?" | Shares a permalink showing score + top 3 fixes |
| Acquirer / diligence reviewer | "What am I inheriting, and what will it cost?" | Compares two reports side by side |
| Curious developer | "How does my dependency / side project rate?" | Runs a scan from the home URL box |
| Contributor / skeptic | "Show me the rubric and the math" | Expands a rubric row, checks flags + scoring criteria |
| Future deep-scan buyer | "What would a deeper (paid) scan unlock?" | Reads the unknown list as a shopping list |

### 1.3 Product principles (shipped behavior)
1. **Every repo scores day one** — language-gated or permission-gated rows become honest `unknown`, never a penalty.
2. **No silent guesses** — measured = evidence, estimated = capped + labeled, unknown = excluded + explained.
3. **One catalog serves humans + engine** — the public rubric is the same truth the scanner uses.
4. **Kill-switches beat averages** — 8 gates can cap the verdict regardless of a decent average.
5. **Unknowns are the feature** — the "what it takes to measure" list is the Deep Scan pitch.
6. **Audit-grade tone** — sample views labeled illustrative; live capability never overclaimed; present tense only for shipped artifacts.

### 1.4 What it is not
- Not a meanness contest or developer-ranking tool.
- Not a cost-of-maintenance quote — remediation is ordered separately by expected lift.
- Not a test-execution / sandbox / dynamic-analysis product today (static + public API signals only; sandbox is a paid future).

---

## 2. The rubric product (the 102-indicator catalog)

### 2.1 Shape
- **102 entries = 76 standard + 18 deep-dive + 8 conditional frontend (7 standard + 1 deep).**
- 10 categories, variable row counts by design (standard rows `01…N`, deep rows continue `N+1…`).
- Run modes: **Screen** (1 day, quick rows) · **Standard** (2–3 days, all standard + gates) · **Deep-dive** (1–2 weeks, deep rows fold into the category — never a bolt-on bonus).

### 2.2 The 10 categories (thesis in product words)
| Category | Thesis | Rows |
|---|---|---|
| Dependency & Ecosystem Health | Dependencies are the circulatory system; when the ecosystem outruns the code, every fix and hire gets harder, then impossible. | 8 + 2 deep |
| Architecture & Code Quality | The shape of the code disagreeing with what it now needs to do; every feature becomes a fight. | 10 + 2 deep |
| Testing & Quality Engineering | The test suite is the immune system; without it every change is a gamble. | 8 + 2 deep |
| Security, Compliance & Vulnerability | The only debt that can end the company. | 8 + 2 deep |
| Data & Schema Evolution | Data can't be thrown away; museum schema + fortress DB is where modernization gets expensive. | 8 + 2 deep |
| API & Integration Surface | Undocumented / unversioned contracts put every consumer at the mercy of the codebase's mood. | 8 + 2 deep |
| Developer Velocity & Operational Drag | Slow pipelines aren't a pain point, they're a diagnostic — debt paid daily. | 10 + 2 deep |
| Performance & Cloud / Infra Fit | Runtime is a verdict on architecture; leaks + no observability + no scaling = design era showing. | 8 + 2 deep |
| Documentation & Knowledge Continuity | The difference between a codebase that *is* and one that *can be learned*. | 8 + 2 deep |
| Frontend & Client Health (conditional) | The product's face; same backend decay plus satellite bundles, dead frameworks, missing accessibility. Only scored when a real client exists. | 7 + 1 deep |

### 2.3 Every indicator row carries (product contract)
- **Definition + why it matters** in plain words.
- **Detection method + objective metric** (what counts as proof).
- **Yellow flag / Red flag** lines, each with rationale.
- **Example symptom, blast radius, remediation** (quick win / structural / gold standard).
- **Explicit 4-level scoring criteria (0–3)** bound by the global core-path lens: core = files reachable from public entry points touching money / auth / personal data / compliance.
- **Verify-effort tag:** quick check ≤30 min · half-day 2–4h · deep 1–2 days.
- **Engine tier + default status + scope/overlaps** (which neighbor owns the signal, so nothing double-counts).

### 2.4 Scoring bands and tiers
| Score | Meaning |
|---|---|
| 3 Healthy | Modern standards, no flags |
| 2 Minor debt | Warning signs outside core flows |
| 1 Severe debt | Warnings in core, or isolated red flag |
| 0 Critical | Red flag in core, or across paths |
| N/A | Not applicable — excluded from numerator *and* denominator, reason recorded |

- Category % = applicable scores ÷ (applicable count × 3) × 100. Unknowns and N/A never dilute the math.
- System score = weighted sum of category percentages.
- **Tiers:** 80+ Healthy (keep refactoring) · 53–79 Moderate (refactoring sprints, security + end-of-life first) · 27–52 High Risk / Obsolete (modernization initiative, shield the core before any rewrite) · below 27 Critical / Legacy Failure (immediate action, blocks continuity).

### 2.5 The 8 gates (kill-switches, plain words)
Any tripped gate caps the verdict at **High Risk / Obsolete** minimum (score shown for information only; below-27 still reads Critical):
1. Live secrets in code, history, or config.
2. Critical vulnerability open 14+ days on an internet-exposed path.
3. Core stuck on a dead platform with no way out.
4. Hackable core — injection / remote-execution / broken login reachable.
5. Most critical flow has zero tests.
6. Can't ship — frequent failed deploys plus manual rescue.
7. Could lose the data — no backups, or restore never drilled.
8. Legal time-bomb — copyleft license inside a closed-source shipment.

### 2.6 Weights (fair by construction)
- **Base (no client UI):** Security 20% · Architecture 15% · Dependencies / Testing / Data / API / Velocity / Performance 10% each · Docs 5%.
- **Client-active:** Frontend takes 10%, everything else scales ×0.9 (Security 18%, Architecture 13.5%, the six 10s become 9s, Docs 4.5%).
- **Renormalization (live behavior):** if a whole category doesn't apply (e.g. no database, no deploy pipeline, docs-only repo), its weight is redistributed proportionally. Two headlines are kept: the renormalized primary and the canonical footnote.
- Calibration is scheduled (spot-checks, refit after real audits, quarterly review) with a public log — numbers are never silently tweaked.

---

## 3. The scan product (what happens after "paste URL")

### 3.1 The journey
1. **Budget announced** — "this scan gets ~X seconds across N checks."
2. **Link cleaned** to owner/repo ("ingested").
3. **Fast public-signal checks** that need no download (release/collaboration hygiene, security metadata, test presence).
4. **Full read (full scans only)** — shallow code copy under a size cap, auto-cleaned; detects ecosystems, classifies the repo kind, fairly skips what doesn't apply, then runs the code-reading checks in parallel with per-check timing + outcome lines.
5. **Seal** — complete (all requested checks measured) or degraded (some unknown, with reasons). Degraded still reports.

### 3.2 Time behavior (plain terms)
- **Fast path:** a handful of checks, no download, roughly 10–15 seconds — a quick health ping.
- **Full scan:** 31 checks including heavier reads, up to ~4 minutes. Most repos finish well under the cap; giant monorepos degrade gracefully ("ran out of time" is reported as a limit, never as bad code).
- One clock covers everything; heavy reads share a fair fixed-size sample so timing is comparable across repos.

### 3.3 Live signals while waiting
- **Progress:** percent + elapsed / remaining + completed-check count + human milestone ("fast checks 4/6", "code checks 12/25", "gates evaluated").
- **Trace:** timestamped log (budget → ingest → fast checks → copy → ecosystems → repo kind → per-check results → scoring → seal). Every failure gets a line — nothing fails silently.
- Keep-alive heartbeat so proxies don't cut the stream.

### 3.4 Terminal states: report vs refused
- **Report:** always includes facts + snapshot (repo, scan time, engine + rubric versions, scanned commit, repo kind, capability inventory). Even degraded scans report.
- **Refused:** no score, with a reason card — rate-limited (with retry hint), not found / private / invalid link, or crash detail. The UI offers a known-good example to try.

### 3.5 Fairness engine (why a library isn't punished for having no servers)
- **Repo kinds (8):** library, service, background worker/CLI, infrastructure, docs-only, agent-skills, mixed, unknown — each with confidence + evidence, per-folder for monorepos.
- **Capability inventory:** has server / has data / has deploy pipeline / has client UI / has tests — each with positive evidence or exhaustive "searched everything, found nothing" proof.
- **Hiding rule:** required-for-kind → never hidden; irrelevant-for-kind → always hidden; otherwise hidden only with proof its capability is absent. Hidden rows leave the math; hidden gates become not-applicable too.
- **Honesty states:** measured (evidence) · estimated (capped heuristic, reserved) · unknown (out of time / crashed / rate-limited, with "what it takes" path) · not-applicable (proven absent) · not-implemented (the 71 future checks — counted in coverage, never in score).

---

## 4. The report product (the audit document)

### 4.1 Headline block
Score 0–100 + tier + confidence band (estimates widen the band), repo name, scanned commit, duration vs budget, engine version, repo kind + confidence, capability inventory, coverage counts (measured / estimated / unknown / not-applicable / not-implemented of 102), overall status complete vs degraded.

### 4.2 Gates cockpit
8 kill-switches each with proven / not-proven / needs-verification (+ not-applicable when unevaluable), a one-line note, and source rows. Proven gates surface to the top.

### 4.3 Category table (9 score live today)
Per category: score %, weighted contribution, applicable count, score total, status mix — with base + renormalized weights visible.

### 4.4 Indicator rows
Per row: score + reason sentence citing the flag, evidence pointers + method, verify-effort tag, remediation (quick win / structural / gold standard). Full table includes the 71 future rows as "what it takes" stubs.

### 4.5 Top blockers + remedies
Lowest measured scores + proven gates ranked by recoverable points, tie-broken deterministically. Each links to its remediation.

### 4.6 Deep-dive scope + trace
"What deeper work would measure" list (the paid-scan menu) + the full sealed timeline for audit replay.

### 4.7 Persistence, sharing, history
- Every finished scan saves one immutable JSON envelope (report + meta + trace).
- **Permalink** per run — shareable, bookmarkable, with repo / score / tier / time / duration / engine + commit in the header.
- **History list** newest-first with score, tier, time, duration/budget, engine + commit, status, and per-row View (detail) · JSON (raw envelope) · Rerun (fresh scan, old links keep working for comparison).
- Empty history explains where to start; bad links show "report not found."

---

## 5. Site map (every surface, product view)

### 5.1 Home (`/`) — pitch + prove
Hero (headline, sub-head, explainer) · paste-a-repo box · sample showcase (dial + score/tier + top-3 blocker chips) · 3 value props (evidence per point, one number from 102 inputs, fixes ordered by lift) · owner strip ("for the engineer who owns the repo") · rubric / method / product links · waitlist capture. Always renders the seeded sample; pill reads "live scanning: coming · sample audit below"; sample labeled illustrative ("representative read", "authored evidence").

### 5.2 Whole pitch (`/product`) — what a report is, why to trust it
Score / evidence / fix-plan cards · 10-category table (name, one-liner, weight) · who-it's-for (owner: score/prove/ship; developer: benchmark dependency, learn maintenance cost) · trust model (measured = tool/file truth; estimated = capped + tagged; unknown = what deeper scan would measure; gates = hard kill-switches) · what-it-is-not · where-we-are (sample today → live engine behind waitlist → deep scans convert unknown) · URL box + waitlist + "free reports stay free" note.

### 5.3 Method (`/method`) — the arithmetic, transparently
102 indicators / 0–3 taxonomy / category math (unknown + N/A excluded — all-unknown doesn't score zero) / weighted sum / weights table + client-active note / tier grid / what-the-number-is-not / present-state honesty stamp ("site runs on sample today; live engine in development behind waitlist; every view stamped illustrative").

### 5.4 Live scanner (`/live`, alias `/report/live`) — paste URL → sealed report
Scanning state: sticky header (elapsed / budget / remaining + %), progress bar, "N of 31 complete", timeline milestones + expandable detector trace with timings. Sealed state: "sealed 100%", repo + detected kind + confidence, full timeline, "reveal report" button to the permalink (auto-pushes if the tab is hidden), degraded variant when some checks are unknown. Error states: preparing/waiting, inline error, refused card with rate-limit retry hint + known-good suggestion. Same-repo double-submits share one in-flight scan; disconnects never double-save; trace truncates with a sentinel.

### 5.5 Stable sample entry (`/report/sample`) — no UI, just redirects
Jumps to the pinned django run, else any django run, else the history list. Destination is labeled as a persisted sample report.

### 5.6 History (`/reports`) + run detail (`/reports/[runId]`)
History: "N runs · newest first · kept locally · new runs via live scan" + table (repo, score, tier color, relative time, duration/budget, engine version, commit, status, View/JSON/Rerun) + empty state pointing at home/live. Detail: full report (§4) + trace tab; browser title "repo · score"; invalid/expired links → not found. Sample math pinned so the django sample recomputes to exactly 58.00 Moderate.

### 5.7 Rubric browser (`/rubric`, `/rubric/[category]`) — read-only catalog
Landing: category sidebar + "select a category" prompt ("browse the 102 indicators used to audit maintainability"). Category page: name, thesis quote, summary, base / client-active / count stats, per-indicator accordion (ID + name; tier / status / effort; definition; why it matters; detection; yellow vs red flags side by side; remediation; 0–3 criteria; scope/overlaps footer). Unknown category → not found. Effort symbols: quick ≤30 min · half-day 2–4h · deep 1–2 days.

### 5.8 Product capabilities exposed as APIs
- **Live scan stream:** submit owner/repo (+ optional repo-kind override) → streamed budget/progress/trace/report envelope; same-repo coalescing; heartbeat; deterministic run ID; persists unless the client disconnects; failures as refused reasons, never silent zeros.
- **Report fetch:** raw persisted envelope JSON for sharing/integrations; strict ID grammar (400) + missing-file (404).

### 5.9 Design language
Dark instrument panel; tier colors as the only status language; Inter + mono evidence type; report anatomy dial → coverage → gates → category table (one expanded + inspect-all) → URL call-to-action. Audit-grade copy throughout.

---

## 6. Coverage: what runs today vs the full vision

- **Old MVP slice (19 rows, 5 categories):** the fastest screenshot-variance set with a dual headline (slice-normalized + honest-partial + 19/102 bar). Gates mostly needs-verification.
- **What ships now (31 rows, 8 categories):** MVP 19 + 12 cheap high-value rows (runbooks/onboarding/changelog/docs hygiene, deploy-model/IaC signals, migration backlog, bloat/lock-in, security-CI signals). File/manifest/registry signals only — no new heavy tooling, same time budget. Bar reads 31/102; no new proven gates.
- **Explicitly next (10 estimated heuristics):** out of scope today.
- **Full vision (102):** the remaining 71 appear as "what it takes" stubs — visible in coverage, absent from math.

---

## 7. Decisions that shaped the product (one line each)

**Product (D1–D9):** one engine two doors (public freemium + private deal-flow) · every row measured/estimated/unknown · headline over measured+estimated only · estimates capped/banded · v1 static + public-API only, no sandbox · every repo scores day one · orchestrate proven OSS checkers, don't build analyzers · JS/TS+Python first, Go/Java next · MVP = 19 highest-variance rows, dual headline, two-phase scan.

**Rubric redesign (A–F):** one catalog for humans + engine · uniform 0–3 core-path criteria · computed core path · N/A + applicable denominator · deep rows fold in · uniform means, importance via gates not weights · parameterized weights/thresholds + calibration · frontend 10% when client exists · five 2026-era rows added (agent-readiness, config debt, PR hygiene, branching, i18n) · variable row counts · two extra gates (data-rescue, copyleft) · matrix absorbed into per-row fields · scope/overlaps per row · encyclopedia canonical with enforced consistency · pre-release spot-checks + calibration log · per-indicator implementation specs canonical (dozens of drift fixes logged, specs win until reconciled).

**Website (W1–W14):** marketing-first with product-shaped seams · persona = eng lead, one CTA paste-URL · famous-repo Moderate sample + honesty UI · modern web stack + report-provider seam · dark instrument panel, tier-colors only · home + sample + method (+ later product/live/history/rubric) · working hero URL box + mandatory disclaimer · keep name, dial mark, domain · site colocated in monorepo · report anatomy fixed · audit-grade tone, never overclaim · demo pinned ~58 with honesty mix + one near-miss gate · six-block home + product route, deals off-site · present tense only for shipped artifacts.

**Build-era (live specs):** unified single-budget scan · persisted runs + permalinks · full trace · remedies/top-levers · repo-kind/applicability fairness · Tranche-A expansion · hide-empty logic. Specs are current truth; older plan docs are parent rationale.

---

## 8. Roadmap + open questions

**P0 Truth core:** engine + report right, multi-repo quiz, minutes-long scans, no code execution.
**P1 Product shells:** freemium UI + scan history API + repo-connector + portfolio pack.
**P2 Deep Scan (paid):** test sandbox, history signals, environment probes, pricing.
**P3 Platform:** more languages, more hosts, drift alerts, self-hosted.

**Open by design:** headline format (number vs band vs radar) · whether estimates belong in deal-facing reports · PDF/packet exports · free-tier time ceiling · rounding copy. Resolved: frontend annex (conditional 10%).

**Non-negotiables:** no silent guesses · every repo gets a score · rubric is sole truth · free tier never executes code · deal-flow unknown list stays the feature.

---

## 9. Glossary (product words)

- **Indicator:** one checkable maintainability question (0–3 or N/A).
- **Deep-dive row:** a check needing days of instrumentation; folds into its category when run.
- **Gate:** a kill-switch finding that caps the verdict.
- **Core path:** code reachable from public entries touching money/auth/personal-data/compliance — where flags hurt most.
- **Measured / estimated / unknown / N/A / not-implemented:** the five honesty states (§3.5).
- **Archetype:** the kind of repo (library, service, CLI, infra, docs, agent-skills, mixed, unknown).
- **Plane / capability inventory:** whether the repo has server / data / deploy / client / tests.
- **Renormalization:** rescaling weights when categories don't apply, so nobody is punished for what they don't have.
- **Run / runId / permalink:** one finished scan and its immutable shareable link.
- **Trace:** the timestamped scan log, persisted with the report.
- **Coverage bar (31/102):** how many of the full catalog ran live — honesty, not a grade.
