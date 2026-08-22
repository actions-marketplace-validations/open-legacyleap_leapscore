# AGENTS.md

Planning-only repository for **LeapScore** — a scoring engine that turns a GitHub URL into a legacy/maintainability score. There is **no code, build, or test tooling**. Bring your own markdown editor.

## Two doc trees, different rules

- `CODEDEBT_AUDIT_RUBRIC/` — the rubric: 102 indicators across 10 categories + config. **This is the product.**
- `PLANS/` — product/engine specs. Read order matters: `00` indexes everything and logs decisions; 01→10 have a hard dependency chain (`00_MASTER_INDEX.md` line 25). Navigation start: `PLANS/00_MASTER_INDEX.md` + `CODEDEBT_AUDIT_RUBRIC/README.md`.

## The cardinal rule: canonical vs. derived views

The catalog is single-sourced (decision D1/D3):
- **Canonical** (edit here): encyclopedia files `01_…`–`10_…` (per-indicator truth) and `11_WEIGHTS_THRESHOLDS_CONFIG.md` (weights, scoring formula, tier thresholds, gates).
- **Derived** (never hand-edit a number; match to canonical instead): `00_EXECUTIVE_RUBRIC.md`, `templates/*` score sheets, the category-weight tables in each encyclopedia `01`-`10` header, and `PLANS/03_ENGINEERABILITY_MATRIX.md`.

Consequences: changing an indicator's thresholds/status → edit the encyclopedia row *and* the matching row in `00_EXECUTIVE_RUBRIC.md` Part 2 (and sheets if a weight changed). Changing weights/FE-active logic → edit only `11` §1 and propagate. The "consistency check" a **lint to keep every derived view in sync** is described in the README but does **not exist as a script** — grep `git ls-files` will confirm; sync it by hand.

## Conventions for editing the rubric

- **Indicator IDs:** `CATEGORY-NN` where category ∈ {ECOS, ARCH, TEST, SEC, DATA, API, VEL, PERF, DOCS, FE}. Standard rows are contiguous `01…N`, deep-dive rows continue `N+1…` (decision C3). No padding to a fixed count — variable row counts per category are deliberate.
- **Every encyclopedia entry** must carry the full field set seen in any existing entry: definition, why it matters, detection method, objective metric, Yellow/Red flags (`Yellow flag`/`Red flag` lines, with rationale), example symptom, blast radius, remediation, gold standard, **explicit 4-level `Scoring criteria (0–3, per global core-path taxonomy)`**, and `Verify effort:` tag.
- **Tags:** engine tier `A/B/C/D`, `Default status: measured/estimated/unknown`, `Scope/overlaps:` — every new/organized entry gets all three so the derived matrix stays derivable. `Scope/overlaps` is how sibling indicators avoid double-counting; define it explicitly against the closest neighbors.
- **Verify effort symbols:** ⚡ ≤30 min · 🔶 ~2–4 h · 🔷 ~1–2 days.
- **Gates:** G1–G8 are the absolute kill-switches (Red Flag → verdict capped at "High Risk / Obsolete"). Read `00_EXECUTIVE_RUBRIC.md` Part 0 before touching anything score-model related.

## Weights & scoring model (quick recap)

- Category % = (Σ applicable row scores ÷ applicable count × 3) × 100; N/A rows excluded from both numerator and denominator. Deep-dive rows **fold into** the category when run — never a bolted-on bonus.
- System score = Σ(category % × weight). Two weight sets: base, and FE-active (FE 10%, other nine ×0.9). Update both sets in `11` §1 together when categories change.
- Tier thresholds: ≥80 Healthy · 53–79 Moderate · 27–52 High Risk · <27 Critical.

## Decisions & governance

- `PLANS/00_MASTER_INDEX.md` holds the Decisions Log (D1–D8 for the product, A1–E1 for the rubric redesign) and Open Questions. New decisions get appended there with `# · Decision · Rationale · Status`; agreed ones become the format `**AGREED**`.
- Threshold/weight adjustments are logged in `11` §5 (calibration log) with date, ID, field, old/new, evidence. Don't silently tweak a number.
- Product status: **planning only — no implementation until the catalog is agreed** (`PLANS/00` line 5). Don't start writing the engine code; if asked, the blueprint is `PLANS/05_DETECTION_ENGINE_BLUEPRINT.md`.

## Style

Docs written as terse, evidence-forward spec (tables, bullet keys). Keep the same voice: no fluff, explicit flag/rationale pairs, decision IDs referenced by name. Matters more here than usual because the delay between edit rounds is long.