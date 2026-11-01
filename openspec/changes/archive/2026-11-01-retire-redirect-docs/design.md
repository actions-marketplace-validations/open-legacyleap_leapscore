## Context

See `proposal.md` — Why. The constraints that shape the approach:

- The redirect layer is **gate-mandated**, not accidental: `tooling/checks/documentation-structure.ts:237` requires exactly 102 aliases; `:245–276` requires 17 plan stubs and rejects any other file under `docs/plans/`.
- The canonical catalog **points back at the layer**: 102 indicator files carry a banner line linking their alias and a line stating their own path (58,898 bytes total).
- `docs/specs` has **no machine consumer**: no detector manifest or schema references it (`rg docs/specs packages/detectors` → 0 hits), no site, Action, or workflow path reads it. The only consumer is the check that requires it.
- `docs/plans` has **one near-consumer**: `bin-wiring.ts:81–82` lists `docs/plans/14` and `docs/plans/15` as D4 invocation sites, and both commands have live sites in `apps/scanner/README.md:6–10` and `apps/surface/README.md:9–11`.
- Four citations in current documents point at paths that no longer resolve, and nothing walks them because they are code spans rather than links.
- One file carries unique content: the 65-row arbitration record at `docs/specs/README.md:46–112`.

## Goals / Non-Goals

**Goals:**

- Remove the redirect layer and the invariants that mandated it, while keeping the invariant that matters (102 IDs, one canonical file each, all indexed).
- Leave the canonical catalog carrying no reference to a path that does not exist.
- Make the class of rot that produced the four stale citations detectable.

**Non-Goals:**

- Changing any indicator's tier, status, gates, thresholds, or criteria (the 54 divergent rulings stay unresolved — see Appendix A).
- Touching `PRODUCT.md`, `sample-report/`, or the category indexes beyond link repair.
- Generating the derived rubric views (`00_EXECUTIVE_RUBRIC.md`, `templates/`) — that is `generate-derived-rubric-views`.

## Decisions

### D1 — Delete the trees rather than redirect, generate, or keep

Alternatives: one 102-row redirect table; generate the stubs from the catalog; status quo.

Chosen: delete. A single table is still a page that exists only to point elsewhere, and it would have to be maintained against the catalog; generated stubs preserve a path set whose only purpose is link resolution for an audience that does not exist (no external consumer found, no in-repo consumer beyond the gate); status quo keeps a gate that proves redirects exist rather than content does. The cost is a one-way door on inbound URLs and a 102-file banner edit — both accepted, both recoverable from git.

### D2 — The gate keeps content invariants, loses path-identity invariants

Chosen: `documentation-structure.ts` keeps §1 (102 canonical files, skeleton/reduced form, identity fields), §2 (category index coverage, ID order, no full entry in an index), and §5 (local Markdown link walk). §3 (alias grammar, count, target resolution) and §4 (plan stub roster, retirement markers, line cap) are deleted with their constants and tables.

Alternative: retire the check entirely. Rejected — §1 and §2 are the anti-drift property the catalog depends on, and they have caught real divergence (index/canonical ID mismatch, skeleton regressions).

### D3 — Redirect detection becomes grammar-based, not emptiness-based

To keep D1 from being undone by a future alias tree, the check rejects a Markdown file that declares both an `^ID: <ID>$` line and a `^Canonical target:` line, or whose heading marks it as a retired path stub. Both are the exact grammars the removed trees used.

Alternative: a body-emptiness heuristic (strip headings, blockquotes, and links; fail if nothing remains). Rejected as fuzzy and prone to false positives on legitimately short substantive files — `docs/sample-report/README.md` is 21 lines and is real content.

### D4 — The citation resolver covers `openspec/specs/**` only

A backticked repository path in a current specification must resolve; a `:NN` suffix must not exceed the file's line count. Archived changes are exempt.

Alternatives: repo-wide scan (rejected — `openspec/changes/archive/**` and in-flight proposals legitimately cite the tree as it was, and the archive is the sanctioned record); links-only (rejected — that is exactly why the bug survived: these are code spans).

Scope limits to avoid false positives: only backticked spans, only paths beginning with a known repository root (`docs/`, `apps/`, `packages/`, `openspec/`, `action/`, `tooling/`), no globs, no URLs, and fenced code blocks are skipped.

### D5 — Strip banner lines 3 and 5 from the catalog; keep the link line

Line 3 explains that the file is canonical and links the alias; line 5 states the file's own path. Once aliases are gone, line 3's remaining claim ("this file combines semantics and contract; edit this file") is stated once in `docs/rubric/README.md`, and line 5 is self-referential by construction. Line 4 (category / shared config / catalog links) is navigation and stays.

Alternative: keep line 3 minus the alias link. Rejected — 102 copies of an instruction that belongs in one place is the same duplication this change exists to remove.

### D6 — The arbitration record moves into this design, annotated

Verbatim in Appendix A. The 11 rows whose ruling equals the shipped §1 identity were checked against each file's §8 and are already encoded there structurally (`measured_when: never auto-measured`, a concrete `estimated_when` predicate, `clamp: [1,2]`) — verified, zero edits needed. The 54 divergent rows are carried forward as the backlog of a follow-up reconciliation change.

Alternatives: absorb the 54 as unresolved notes in each file (rejected — it writes a contradiction with a deleted document into the canonical product, 54 times); reconcile all 54 here (rejected — each row is a scoring decision that moves tier/status, hence v1 flag, effort class, and `rubric.json`; it needs domain review and its own reviewable diff).

### D7 — Delete the archived release brief

`docs/archive/2026-10-15-opensource-brief.md` is dated strategy whose 10-row status table duplicates what OpenSpec already states, and it links into the tree being deleted (`:52` → `../specs/README.md`). Git history retains it.

Alternative: keep with the link repaired, or cut to its live contribution. Rejected — the positioning sentence it protects is already quoted verbatim in the release-material specification, which is where a live requirement belongs.

### D8 — `bin-wiring` drops the two stub sites

`INVOCATION_SITES` keeps only live documentation. Both commands still satisfy the D4 rule through the app READMEs, verified before removal.

### D9 — Sequence against `release-packaging`

`release-packaging` is mid-flight (18/19 tasks) and its `proposal.md:43` is one of the four repaired citations. Preferred: land `release-packaging` first. If it is still open at apply time, repair that citation here — it is a one-line edit to a proposal, not a conflict in intent.

## Risks / Trade-offs

- **External inbound URLs to per-indicator spec paths will 404.** → Accepted: no external consumer was found, the paths were internal-only, and git history preserves them. Recorded as **BREAKING** in the proposal.
- **A 102-file mechanical edit could change content by accident.** → Each edit deletes exactly two lines; the apply step verifies `git diff --stat` shows 102 files with 204 deletions and 0 insertions, then runs `npm run compile:rubric --check` to prove the compiled registry is unchanged.
- **Narrowing the gate could let the layer return.** → D3's grammar guard plus the existing link walk; a reintroduced alias fails on grammar, not on count.
- **The citation resolver may flag legitimate prose.** → Root-prefix allowlist, backtick-only matching, fenced blocks skipped, archive exempt; any residual false positive is a documentation fix, not a check exemption.
- **Deleting `docs/plans` removes a `bin-wiring` site.** → D8; both commands retain a live site, verified before removal.
- **The 54-row backlog is deferred and could be forgotten.** → It lives in this change's design (archived permanently) and becomes the task list of the follow-up change.

## Migration Plan

Single commit, no runtime migration. Order matters:

1. Repair the four citations and add the citation resolver; the resolver fails on the pre-deletion tree only if the four are not yet repaired.
2. Delete `docs/specs/**`, `docs/plans/**`, `docs/archive/2026-10-15-opensource-brief.md`.
3. Strip banner lines 3 and 5 across the catalog.
4. Rewrite `docs/README.md`, `docs/rubric/README.md`; update `AGENTS.md`, `CONTRIBUTING.md`, `tooling/README.md`.
5. Narrow the three checks; run `check:documentation-structure`, `check:schemas`, `check:bin-wiring`, `check:rubric-consistency`, `npm test`.

Rollback: `git revert` of the single commit restores all 122 files; no generated artifact or runtime state depends on the removal.

## Open Questions

- Whether the 54-row reconciliation lands as one change or as per-category tranches. Deferrable: it changes neither this change's scope nor its specs.

---

## Appendix A — Legacy arbitration record (preserved verbatim)

Preserved from `docs/specs/README.md` (removed by this change). Columns as recorded: what the category encyclopedia said, what the retired `docs/plans/03_ENGINEERABILITY_MATRIX.md` said, what the per-indicator spec ruled, and why. **Not a source of truth** — the indicator file remains the only editable contract.

| ID | Encyclopedia said | Matrix 03 said | Spec rules as | Rationale |
|----|------------------|----------------|---------------|-----------|
| API-01 | A·estimated | A·measured | **A·estimated** | spec-vs-route matching across static inventories is heuristic alignment |
| API-02 | A·estimated | A·measured | **A·estimated** | version-marker presence is fact; discipline/breakage judgment inferred from history |
| API-03 | B·estimated | C·unknown | **B·estimated** | in-repo edge enumeration from configs; system topology beyond repo unknown |
| API-04 | B·estimated | A·estimated | **A·estimated** | await-chain shape + queue presence greppable (tier fix) |
| API-05 | B·unknown | A·estimated | **A·estimated** | host/key greps + abstraction-layer presence; vendor-risk judgment inferred |
| API-06 | A·estimated | A·measured | **A·measured** | protocol inventory over enumerated clients/servers = fact |
| API-07 | A·estimated | A·measured | **A·estimated** | error-schema/middleware presence factual; per-endpoint status semantics needs runtime sampling |
| API-08 | B·estimated | D·unknown | **D·unknown** | consumer telemetry/registry = org data |
| API-09 | B·unknown | A·estimated | **A·estimated** | idempotency-key middleware presence static (tier fix); enforcement proof needs replay test |
| API-10 | A·measured | D·unknown | **A·estimated** | compat-gate/registry presence in CI = facts; process maturity = inference |
| ARCH-11 | A·estimated | A·measured | **A·estimated** | type-coverage facts are static, but red-flag criterion needs incident share (unavailable) -> inference |
| DATA-02 | B·estimated | C·unknown | **B·estimated** | connection configs enumerable in-repo; cross-service sharing inferred; org topology unknown |
| DATA-03 | A·measured | C·unknown | **B·estimated** | live catalog unreachable; declared constraints in migrations/schema files = proxy inference |
| DATA-04 | B·unknown | C·unknown | **B·estimated** | storage inventory from compose/IaC/connection strings; vendor lifecycle lookup; weak |
| DATA-05 | B·unknown | C·unknown | **C·unknown** | (field-level rationale in spec §0) |
| DATA-06 | B·unknown | C·unknown | **B·estimated** | backup-job presence in CI/IaC observable; restore-drill evidence never is -> G7 stays needs-verification |
| DATA-07 | A·estimated | C·estimated | **A·estimated** | ORM-pattern greps static (tier fix); N+1 confirmation is inference |
| DATA-08 | B·estimated | A·estimated | **A·estimated** | migration/schema-file archaeology static |
| DATA-09 | B·unknown | A·measured | **A·measured** | history/outbox/audit-column presence over enumerated models = fact (presence-only) |
| DATA-10 | A·measured | C·unknown | **C·unknown** | cross-env schema diff impossible from one repo |
| DOCS-02 | B·estimated | A·estimated | **A·estimated** | doc-vs-code mtimes + removed-symbol grep computable from clone (tier fix) |
| DOCS-03 | B·unknown | A·measured | **A·measured** | docs/runbooks presence over enumerated tree = fact (presence-only) |
| DOCS-04 | B·estimated | A·measured | **A·measured** | CONTRIBUTING/setup-doc structure = fact (command dry-run excluded, no execution) |
| DOCS-07 | A·estimated | A·measured | **A·measured** | spec/generated-reference/docs-CI presence = facts (presence-only) |
| DOCS-08 | B·measured | A·measured | **A·measured** | CHANGELOG + GH releases API = facts |
| DOCS-09 | A·estimated | A·measured | **A·measured** | docs-CI step presence = fact |
| ECOS-01 | A·estimated | A·measured | **A·measured** | pin read (.nvmrc/Dockerfile/engines) -> endoflife.date lookup is a fact |
| ECOS-02 | A·estimated | A·measured | **A·measured** | registry/lockfile compare yields computed percentages; framework-gap classification mechanical |
| ECOS-03 | B·estimated | A·measured | **A·measured** | last-release metadata per dep from the vendored registry-derived table = fact; archived-repo check (GH/Scorecard) out of offline scope |
| ECOS-04 | B·estimated | A·estimated | **A·estimated** | static deprecation lints runnable, but signal uneven across ecosystems (Py warnings need execution) |
| ECOS-05 | B·measured | A·measured | **A·measured** | license classification from the vendored metadata table (direct-dep surface) = static facts; transitive/SBOM path pending |
| ECOS-06 | A·estimated | A·measured | **A·measured** | lockfile transitive counts + duplicate version sets = parsed facts (unused-direct analyser not shipped; null sub-signal) |
| ECOS-08 | A·estimated | A·measured | **A·measured** | framework support status via endoflife.date = fact; coupling-share secondary, still static |
| ECOS-09 | A·estimated | B·unknown | **B·estimated** | skew needs multi-service manifests; measurable only within a monorepo, else unknown |
| ECOS-10 | B·measured | A·measured | **A·measured** | Scorecard/osv/actions-pinning audit all remote-static |
| FE-01 | A·estimated | A·measured | **A·measured** | framework version -> endoflife.date = fact |
| FE-02 | A·measured | C·unknown | **C·unknown** | bundle measurement needs building/rendering = executing repo scripts (forbidden) |
| FE-03 | B·measured | C·unknown | **C·unknown** | axe/Lighthouse need render; lint-config presence too weak to score |
| FE-04 | B·measured | A·estimated | **A·estimated** | browserslist presence+currency = fact; support-judgment inferred |
| FE-05 | B·estimated | A·measured | **A·estimated** | LOC/store distributions static; seam/testability judgment inferred |
| FE-06 | C·unknown | A·estimated | **A·estimated** | token-adoption + hardcoded-color greps static (tier fix) |
| FE-07 | A·unknown | A·unknown | **A·estimated** | hardcoded-string density + i18n-lib presence static; thresholds uncalibrated |
| PERF-01 | B·measured | C·estimated | **A·estimated** | instrumentation deps/config presence static (tier fix); coverage/correlation quality inferred |
| PERF-02 | B·estimated | A·measured | **A·measured** | manifest presence (Dockerfile/k8s/tf) + VM-script smell = static facts |
| PERF-03 | B·unknown | C·unknown | **C·unknown** | (field-level rationale in spec §0) |
| PERF-04 | B·estimated | C·unknown | **C·unknown** | load experiment required |
| PERF-05 | B·estimated | C·unknown | **B·estimated** | HPA/ASG blocks in committed IaC = presence proof only; no-IaC repos stay unknown |
| PERF-06 | A·estimated | A·measured | **A·estimated** | IaC presence/coverage heuristic factual; true drift needs cloud creds -> inference |
| PERF-07 | C·unknown | C·estimated | **B·estimated** | SLO/dashboard-as-code/load-gate files greppable (tier fix); measured-SLO proof needs runtime |
| PERF-08 | B·measured | C·unknown | **C·unknown** | startup profiling = runtime |
| PERF-09 | B·unknown | D·unknown | **D·unknown** | (field-level rationale in spec §0) |
| SEC-03 | B·estimated | C·unknown | **C·unknown** | headers/TLS/DAST need a deployed target; nothing provable from URL |
| SEC-04 | B·unknown | C·estimated | **B·estimated** | grep-class static proxies (default-creds, client-side role checks) exist; weak -> estimated low |
| SEC-05 | B·unknown | C·unknown | **C·unknown** | log content/retention adequacy not judgeable statically |
| SEC-06 | B·measured | A·measured | **A·measured** | deep SCA over parsed lockfiles = static fact chain |
| SEC-09 | B·unknown | A·measured | **A·measured** | fuzz-harness/sanitizer-config presence over enumerated tree = fact (presence-only) |
| TEST-01 | A·measured | B·estimated | **B·estimated** | running coverage = test execution, forbidden (D5); CI-artifact/log proxy only |
| TEST-02 | B·measured | B·unknown | **B·unknown** | rerunning suites forbidden; Actions-history flake mining deferred to v2 deep scan |
| TEST-03 | A·estimated | A·measured | **A·estimated** | pyramid-tier assignment per file is a classification heuristic, not a fact |
| TEST-04 | B·measured | B·estimated | **B·estimated** | Actions job durations = elapsed-time signal only, not instrumented timing |
| TEST-07 | B·estimated | B·unknown | **B·unknown** | isolation provable only by executing suite (random/parallel); static greps too weak to score |
| TEST-09 | B·estimated | B·unknown | **B·unknown** | mutation testing executes repo code -> v2 deep scan only |
| TEST-10 | B·estimated | A·estimated | **A·estimated** | git archaeology fully automatable from clone (tier fix); commit-classification heuristic -> estimated |
| VEL-11 | B·estimated | B·measured | **B·estimated** | tooling inventory factual; cold-start timing needs execution |
| VEL-12 | B·unknown | D·unknown | **D·unknown** | incident tooling data = org plane |

### Verification performed at removal

65 rows checked against each indicator's §1 `Engine tier` + `Default status`.

- **11 rows agree with the shipped identity** — `API-01`, `API-02`, `API-03`, `API-07`, `ARCH-11`, `DATA-02`, `DATA-07`, `PERF-05`, `PERF-06`, `TEST-03`, `VEL-11`. Each was checked against its file's §8 and the ruling is already encoded structurally (`measured_when: never auto-measured`, a concrete `estimated_when` predicate, `clamp: [1,2]`), so the rationale adds no information the file does not already carry. No edits made.
- **54 rows diverge** — 16 tier-only (moves effort class and v1 flag), 17 status-only (moves the measured/estimated/unknown claim), 21 both. Carried forward as the backlog of a follow-up reconciliation change. `docs/specs/README.md:44` already recorded this as "a separate, future change"; this change preserves the evidence rather than deciding it.
