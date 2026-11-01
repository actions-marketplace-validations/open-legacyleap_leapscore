# ARCH-09 — Agentic Operability (AI/LLM Codebase-Readiness)

> **Category:** [Architecture & Code Quality](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | ARCH-09 |
| Name | Agentic Operability (AI/LLM Codebase-Readiness) |
| Category | ARCH — Architecture & Code Quality |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ARCH category % |
| Verify effort | 🔶 ~2–4 h — inventory + fresh-clone timed run. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** How well an AI/LLM coding agent (Copilot-class, CLI agents, automated refactoring) can find context, run a targeted test, and make a change safely from a fresh clone. Modernization is increasingly executed by agents; a codebase that resists them resists the accelerant.
- **Why it signals obsolescence:** Agentic operability is the 2020s modernization axis: navigable, seam-rich, tested, documented code is cheap to change *by machine*; legacy discs are not. It is also the practical test of whether the modernization *itself* can be AI-assisted. A repo without navigation aids, testable seams, and a single-command harness forces every change — human or machine — into archaeology.
- **Where it manifests:** No repo-map / LLM context / navigation index that matches disk, tests not co-located with the code they cover, core logic not constructible in a unit test without live infra, no single command that builds+tests from a fresh clone, docs that contradict code (borrowed signal from DOCS-02).
- **Objective metric:** `navigation aids present (count, matches disk?)`; `test-to-code proximity %`; `core seam index`; `fresh-clone single-command success (y/n, time)`; `docs-vs-code contradiction count (sampled)`.
- **Yellow flag (warning):** Partial navigation aids, < 60% test-to-code proximity in core, seams exist but inner loop slow — an agent can act but slowly and with drift risk. *(Rationale: operable with friction — fix the cheap aids before agents multiply the cost.)*
- **Red flag (critical):** No navigation aids, core logic not constructible in a test without live infrastructure, no single-command harness — an agent cannot complete a scoped task reliably from a fresh clone. *(Rationale: the fastest modernization lever is foreclosed; every change stays archaeology.)*
- **Example symptom:** "The team wants Copilot-class agents to help migrate the billing module. The agent can't find the entry point (no repo map), can't run one test (none co-located, core needs the live Oracle), and the only 'build' is a 9-step wiki. The pilot is quietly postponed forever."
- **Blast radius:** AI tooling ROI, modernization leverage, agent-driven refactor feasibility, onboarding (human and machine alike), review automation.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = navigation aids + co-located tests + seam-rich core + single-command success; 2 = aids partial, proximity ~60%, harness slow; 1 = aids absent, core seams missing, harness manual; 0 = no navigation, no seams, no harness — machine and human alike cannot operate.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: ship a repo-map/context file, co-locate tests for the top core modules, define a task runner of record with a fresh-clone CI proof. Structural fix: seam extraction on core (ports), docs-as-code freshness (DOCS-09), a recurring "agent completes task X from fresh clone" acceptance test as a quality gate.
- **Gold standard / target state:** From a fresh clone, an agent (or new hire) can locate the module, run its tests, and land a scoped change within one session; navigation aids match disk; core is testable without live infra.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src + gh-api (check-runs) — composition row; owns no new heavy tooling
- **Tools:** reuses facts: `arch02` (seams), `test06` (test-to-code proximity), `docs02` (contradiction sample), plus new cheap probes: repo-map/nav-file inventory (`README` module index vs disk, `.cursor/rules`, `CLAUDE.md`, `llms.txt`), task-runner of record (Makefile/package-scripts justfile), fresh-clone proof via **CI** (green check-run on push ≠ local execution)
- **Rate-cost:** api-budgeted (one check-runs list call)
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos.

## 6. Detection recipe

- **Detection method:** Navigation-aid inventory (repo-map files, code-navigation config, top-level index vs. disk layout); test-to-code proximity heuristic (% of source files with a co-located or directly-referenced test); core-module seam index (already computed for ARCH-02/06 — reuse); fresh-clone harness check (does a documented command complete a green build+test?); sampled docs-vs-code contradictions. Compose the four signals into one score.

1. Nav-aid inventory: candidate files exist AND reference real paths (`matches_disk`: sampled path resolution).
2. Test proximity: % of core source files with co-located or import-referenced test (shared fact from TEST-06).
3. Seam index: reuse `arch06.core_seam_index`.
4. Harness proof: latest pushes have green build+test check-runs (workflow names matched to test jobs) — proxy for "single command works", no local execution.
5. Docs contradiction sample: reuse DOCS-02 sampled verify count.

Preconditions: none new.

## 7. Fact schema

```json
{"arch09": {
  "nav_aids": {"present": true, "files": ["CLAUDE.md"], "matches_disk": 0.9},
  "test_proximity_core": 0.42,
  "core_seam_index": 0.55,
  "ci_green_proof": {"found": true, "workflow": "ci.yml", "last_green_days": 2},
  "docs_contradictions_sampled": 3}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # compound judgment
estimated_when: >=3 of 4 signals computed      # clamp [1,2]; confidence medium iff all 4
unknown_when:   <3 signals computable (emit which)
na_when:        never
clamp:          [1,2]
confidence:     medium iff nav+proximity+seam+ci_proof all present
scope_limited:  ci proof unavailable (no Actions) -> estimated low + scope-limited note
```

### Score mapping predicates

Criteria/Y-values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: aids partial ∨ `proximity >= Y_PROX` ∧ seams exist ∧ slow harness signal
- `1`: aids absent ∨ `proximity < Y_PROX` in core ∨ no CI proof
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast` (all inputs already computed or one API call)
- Missing sibling-facts (TEST-06 not run) → recompute the shared extractor inline rather than read cross-spec facts (convention 6)

## 10. Evidence and output

### Evidence string

```
basis: "agentic-compose: nav={p}% disk-match; proximity={q}; seam={s}; ci_green={bool}({d}d)"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Compound operability score; inherits seams of ARCH-02/06, proximity of TEST-06, freshness of DOCS-02 — measured once here.
