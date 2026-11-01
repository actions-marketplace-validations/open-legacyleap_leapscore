# FE-01 — UI Framework / Stack EOL & Deprecation

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for FE-01. Edit this file; the legacy path [fe-01_ui-framework-stack-eol-deprecation.md](../../../specs/10_FRONTEND_CLIENT/fe-01_ui-framework-stack-eol-deprecation.md) is a compatibility alias.
> **Category:** [Frontend & Client Health](../../10_FRONTEND_CLIENT.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/10_FRONTEND_CLIENT/FE-01_ui-framework-stack-eol-deprecation.md`

## 1. Identity

| field | value |
|---|---|
| ID | FE-01 |
| Name | UI Framework / Stack EOL & Deprecation |
| Category | FE — Frontend & Client Health |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into FE category % (category conditional on client detection) |
| Verify effort | ⚡ ≤ 30 min — version + EOL check. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The client is built on a framework or toolchain that is EOL, in maintenance mode, or legacy-generational (AngularJS, jQuery-era SPA, Flash/Flex, React 15, Vue 2 pre-EOL) — with no documented migration path and shrinking community/tooling support.
- **Why it signals obsolescence:** The frontend is the user's daily experience; a dead framework means security patches stop (XSS classes stay open), hiring collapses, the ecosystem's gear (component libs, tooling, AI assistance) stops fitting, and every new feature is built in an abandoned era. (This is ECOS-01/08, aimed at the client.)
- **Where it manifests:** `package.json` framework version, EOL trackers (endoflife for Angular/Vue/React), framework support pages, bundle of legacy polyfills, "don't upgrade" tickets, no component lib compatible with the stack, job postings for the stack drying up.
- **Objective metric:** `framework support status (active/maintenance/EOL)`; `major-version gap`; `tooling compatibility (build/router/SSR)?`; `time-to-hire for the stack`.
- **Yellow flag (warning):** Framework in maintenance mode / one generation back, with an upgrade path underway. *(Rationale: warning — the window to leave is still open, cost is rising.)*
- **Red flag (critical):** Framework EOL (or vendor-end-of-life) with no migration in progress, or security patches unavailable. *(Rationale: unfixable client vulnerabilities + a frozen evolution path — the client is now a terminal.)*
- **Example symptom:** "The admin UI is AngularJS 1.8 — Google retired it. A reflected-XSS class needs a patch that only exists in the modern framework. The team 'migrations'd twice, both stalls. Every new screen is built on a skeleton nobody will extend."
- **Blast radius:** Client security, user experience growth, hiring, feature velocity, ecosystem fit (design systems, monitoring, a11y tooling).

## 3. Scoring semantics

- **Scoring criteria (0–3):**** (annex) 3 = supported/current; 2 = maintenance mode with plan; 1 = EOL in isolated surface; 0 = EOL with no path.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: a written migration brief (target framework, timeline, budget), framework-but-the-patterns upgrade where feasible, freeze risky features. Structural fix: incremental migration (module-shell pattern, route-by-route strangler), contract with the backend (API-01) kept stable during migration, the client on a support-meeting framework within two quarters.
- **Gold standard / target state:** Framework is current-to-recent, security-supported, ecosystems integrable; migration is an ordinary roadmap item if ever needed.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src + ecosystem (`endoflife.date`, framework status tables)
- **Tools:** FE-framework detection in package manifests (`react`, `vue`, `angular`, `svelte`, `next`, `nuxt`, plus legacy markers: `angular@1`/`angularjs`, `backbone`, `ember`, jQuery-class UI deps); build-toolchain compatibility table
- **Rate-cost:** api-budgeted
- **Ecosystems:** JS/TS-gated; mobile via separate detectors when present
- **Applicability:** **category gate:** `na_when: no user-facing client detected` (C1/OQ5 — entire FE category skipped). Per-row: never additionally N/A within an active FE category.

## 6. Detection recipe

- **Detection method:** Framework lifecycle audit — version matrix vs. EOL calendar (endoflife.date), tooling compatibility check (does the current build toolchain support the framework?), community signals (release cadence, Stack Overflow trend), staffing check (how long to hire for this stack).

1. Detect UI framework(s) + versions from manifests/lockfiles.
2. Lifecycle lookup per framework major (endoflife.date slug or static status table).
3. Toolchain-compat probe: does the pinned build toolchain support the pinned framework version?
4. Community-signal greps are context only (not scored).

Preconditions: client detected.

## 7. Fact schema

```json
{"fe01": {
  "frameworks": [{"name": "react", "version": "16.8", "support_status": "maintenance", "eol_date": null}],
  "toolchain_compat": {"bundler": "webpack4", "supports_framework": false}}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  frameworks.len > 0 and lookup succeeded
estimated_when: lookup partial / niche framework unmapped   # clamp [1,2], confidence low
unknown_when:   client detected but no framework identifiable (custom stack)
na_when:        category gate fired
clamp:          [1,2]
confidence:     medium
```

### Score mapping predicates

Criteria/Y-values: see §3.

- `3`: all frameworks current ∧ toolchain compatible
- `2`: maintenance-mode framework with migration evidence
- `1`: EOL framework confined to non-core views ∨ toolchain mismatch without EOL
- `0`: EOL/retired framework carrying core UI

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `api-budgeted`
- Slug-table miss → that framework unknown; row estimated on remainder

## 10. Evidence and output

### Evidence string

```
evidence: "fe-lifecycle: react 16.8 {status}; toolchain compat={bool}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

UI framework lifecycle; runtime/language EOL is ECOS-01's row.
