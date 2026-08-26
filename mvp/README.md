# MVP — LeapScore Lean Slice

> **Parent:** `PLANS/00_MASTER_INDEX.md` + `CODEDEBT_AUDIT_RUBRIC/` (102 indicators, 10 categories)
> **Status:** Derived view — does not mutate canonical rubric. Canonical stays `01_…`–`10_…` + `11_WEIGHTS_THRESHOLDS_CONFIG.md`. This doc is the implementation spec for the first buildable cut.
> **Grill source:** 11-branch grilling session (Option A virality, ultra-lean 1-week, 5 categories, 19 indicators)

---

## 0. Decision (D9)

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| D9 | MVP = 19 Tier-A `measured` indicators across 5 categories (SEC 4 + ECOS 5 + ARCH 3 + VEL 4 + TEST 3); dual headline (MVP-normalized + honest-partial + coverage bar); two-phase scan (Phase 1 GH API <10s + Phase 2 clone 4-min budget); gates G1/G2/G3/G8 proven else `needs-verification`, G2 reachable-only | Minimal eng, max screenshot variance, zero `unknown` apologies on measured set; preserves full 102-indicator product per D1/D3/F1; `unknown` list is the waitlist upsell | **AGREED** (grill MVP) |

Append D9 to `PLANS/00_MASTER_INDEX.md` Decisions Log. No edits to `CODEDEBT_AUDIT_RUBRIC/*` or `SPECS/` beyond the 19 specs.

---

## 1. Goal — one job

**Virality:** paste any public GitHub URL → get a brutal-but-believable score in <2 min that you screenshot and share → waitlist for deep scan.

Non-goals for MVP: M&A memo credibility, org-batch scoring, sandbox test execution (D5), live-env or org data (C/D rows).

---

## 2. Slice — 19 indicators, 5 categories

All Tier A `measured` (`PLANS/03_ENGINEERABILITY_MATRIX.md`). No `estimated`, no B/C/D.

| Category | MVP weight | Indicators | Why it earns its slot |
|----------|------------|------------|----------------------|
| **SEC — Security** | 30% (renorm) / 20% canonical | SEC-01 Unpatched vulns (`trivy`/`osv-scanner`) · SEC-02 Hardcoded secrets (`gitleaks`) · SEC-06 Insecure transitives (`npm audit --all` / `pip-audit`) · SEC-07 Patch cadence (Dependabot/Renovate + PR backlog via GH API) | #1 screenshot driver; universally understood |
| **ECOS — Dependency Health** | 25% / 10% | ECOS-01 Runtime EOL (`endoflife.date`) · ECOS-02 Major drift (`npm outdated` / `pip list --outdated`) · ECOS-03 Abandoned libs (last-release date) · ECOS-05 License risk (`license-checker`/`syft`) · ECOS-07 Lockfile reproducibility (lockfile + immutable install) | Highest variance repo-to-repo; cheap manifest reads |
| **ARCH — Code Quality** | 20% / 15% | ARCH-01 God class / complexity (`lizard`) · ARCH-08 Duplication (`jscpd`) · ARCH-05 Churn hotspots (`git log` + GH issues) | "They read my code" wow; only heavy tools in MVP |
| **VEL — Velocity** | 15% / 10% | VEL-06 Bus factor (`git shortlog -sne`) · VEL-09 PR hygiene (GH PR API) · VEL-08 Manual releases (CI deploy-job audit) · VEL-10 Branching (git topology) | Pure GH API, zero clone cost, viral bus-factor |
| **TEST — Quality Eng** | 10% / 10% | TEST-03 Pyramid inversion (file-path counts) · TEST-05 Skipped tests (`rg skip|xit|xtest`) · TEST-08 Quality gates in CI (workflow YAML audit) | Cheap `glob`/`rg`/YAML parse; plugs "no tests" shame |

**Cut and why:** ECOS-06/08/10 (bloat/lock-in/typosquat), SEC-09/10, ARCH-02/03/04/06/07/09/10, VEL-01/02/03/04/07, rest of TEST/DATA/API/PERF/DOCS/FE — need heavier tooling, low variance, or `unknown`-heavy. Re-add in v1 full (59 indicators, `PLANS/04_V1_SCOPE.md:40-67`).

**Total: 19.** Every row maps 1:1 to an encyclopedia entry by ID; thresholds/scoring criteria referenced, never restated (F1).

---

## 3. Scoring — dual headline

Canonical formula (`11` §2): `Category% = (Σ applicable scores ÷ applicable×3) × 100`. System = Σ(category% × weight).

MVP shows **both**:

* **MVP-normalized:** Σ(category% × MVP-weight) where MVP-weights = canonical weights renormalized over 5 (SEC 30 + ECOS 25 + ARCH 20 + VEL 15 + TEST 10 = 100). Clean 0–100 for tweets.
* **Honest-partial:** Σ(category% × canonical-weight) over 5 + footnote `"19/102 measured"` + coverage bar (`PLANS/02_TRUST_SCORING_MODEL.md`).

Derivation: both computed display-side; `11` canonical weights untouched (no drift). Display: `68/100 MVP · 58/100 on 5 categories · 19/102 measured`.

Tiers unchanged (`11` §3): ≥80 Healthy · 53–79 Moderate · 27–52 High Risk · <27 Critical.

---

## 4. Gates — 4 proven, 4 needs-verification

Per `00_EXECUTIVE_RUBRIC.md` Part 0 + `PLANS/04:88-96`:

| Gate | Indicator | MVP verdict | Rule |
|------|-----------|-------------|------|
| G1 | SEC-02 secrets | `proven` / `not-proven` | `gitleaks`/`trufflehog` on tree + history |
| G2 | SEC-01 critical CVE >14d | `proven` only if **reachable** import path (via `dependency-cruiser`/`import-linter`) else `needs-verification` | Strict — prevents HN false-positive caps |
| G3 | ECOS-01 runtime EOL | `proven` / `not-proven` | `endoflife.date` + lockfile pin |
| G8 | ECOS-05 copyleft in core | `proven` / `not-proven` | `license-checker` + core-path taxonomy |
| G4/G5/G6/G7 | — | `needs-verification` | Always; emit "what it takes to measure" text per `PLANS/03:192`; never caps verdict |

Verdict cap (`11` §3) applies only to `proven` gates.

---

## 5. Engine — two-phase, hard budgets

Per `PLANS/05_DETECTION_ENGINE_BLUEPRINT.md` + D5/D7:

* **Phase 1 — GH API only (<10 sec, no clone, fail-open):** VEL-06/09, VEL-08/10, SEC-07, TEST-08, plus repo metadata. Returns hero dial immediately.
* **Phase 2 — Clone async (4-min timeout, best-effort):** ECOS-01/02/03/05/07 + SEC-01/06/02 + ARCH-01/08/05 + TEST-03/05. Tools pinned per `SPECS/README.md` §2: `gitleaks`, `trivy`, `osv-scanner`, `lizard`, `jscpd`, `syft`/`license-checker`, `endoflife.date` API.
* **Manifest sniff (D6/D8):** detect `package-lock.json`/`pyproject.toml`/`go.mod`/`pom.xml`; select adapter set. No manifest → ECOS/ARCH language-gated rows emit `unknown` honestly; scan still scores on GH API + file-presence (D6).
* **Failure semantics:** heavy-tool timeout → `unknown` + emission text, never blocks report. No code execution (D5).

Ecosystem gate for MVP: JS/TS + Python first (D8); Go/Java fallback to manifest-sniff + language-agnostic scans.

---

## 6. Report — W10 teaser anatomy

Per `PLANS/04:101-112` + `PLANS/11_WEBSITE_SPEC.md` W10:

Default view (gorgeous, no scroll):
1. Header dial — dual score + tier badge
2. Coverage strip — 19 measured / 0 estimated / 83 unknown (or 19 measured view)
3. Gate cockpit — 4 gate lights (G1/G2/G3/G8) + 4 `needs-verification` upsell rows
4. Category table — 5 rows, 1 worst indicator per category expanded with evidence + remediation (verbatim from encyclopedia `Remediation:` field, no LLM invention per `PLANS/04:129`)
5. Top-3 blockers + 90-day plan (drawn from rubric remediation playbooks)

Toggles:
* `Inspect all 19 measured` → full per-indicator rows (status/score/evidence/remediation)
* `Unlock 83` → unknown appendix with "what it takes to measure" → waitlist CTA (M&A deep-scan pitch per `PLANS/09`)

Scan metadata: engine version, rubric version, tool versions, elapsed time, commit SHA (`PLANS/04:111`).

---

## 7. Calibration — ship on asserted, tune live

Per `11` §4: pre-v1 spot-check deferred (Option A). Ship on encyclopedia-asserted Yellow/Red thresholds. First 20 real-repo scans are the calibration set; any threshold tweak logged in `11` §5 (date/ID/field/old/new/evidence SHA). ARCH-01/`jscpd` thresholds are the highest false-positive risk — bump before defending on social.

---

## 8. Governance — derived view, not canonical edit

* Do not edit `CODEDEBT_AUDIT_RUBRIC/01_…`–`10_…` or `11_WEIGHTS_THRESHOLDS_CONFIG.md`.
* Do not edit `00_EXECUTIVE_RUBRIC.md` or `templates/*` numbers.
* Log slice as D9 in `PLANS/00_MASTER_INDEX.md` and as `PLANS/04_V1_SCOPE.md` §10 (this doc is the source for that subsection).
* `SPECS/<NN_CATEGORY>/<ID>_*.md` for the 19 IDs is canonical for implementation (F1); remaining 83 specs stay as `unknown` emission text. Drift corrections logged in `SPECS/README.md` §4.

---

## 9. Build order (mvp/ backlog)

1. **Spec freeze** — this doc + D9 entry.
2. **Scaffold** — `mvp/engine/` (orchestrator, manifest sniff, GH API client, tool adapters), `mvp/report/` (schema from `PLANS/06_DATA_MODEL_API.md`), `mvp/site/` or reuse `site/` provider seam.
3. **Phase 1** — VEL + SEC-07 + TEST-08 (GH API only, <10 sec, no clone).
4. **Phase 2 — manifest path** — ECOS + SEC-01/06 + TEST-03/05 + SEC-02 (shallow clone, `trivy`/`osv`/`gitleaks`).
5. **Phase 2 — heavy static** — ARCH-01/08/05 (`lizard`/`jscpd`/`git` mining).
6. **Report** — dual score + W10 teaser + gate cockpit.
7. **Dogfood** — 5-repo quiz (`PLANS/03:194-203`) + `django/django` 58/100 Moderate check; log threshold tweaks.

---

## 10. Open questions carried from master

* OQ4 cost-per-scan budget (affects freemium tier in `PLANS/09`).
* W-OPEN-1 waitlist mechanics, W-OPEN-2 Django seeded rows.
* Exact `MVP-weight` rounding (30/25/20/15/10 proposed; alternative: preserve canonical ratios 20/10/15/10/10 renormalized = 30.7/15.4/23.1/15.4/15.4).

---

*Single source of truth remains `CODEDEBT_AUDIT_RUBRIC/`; this MVP is a reversible cut, not a fork.*
