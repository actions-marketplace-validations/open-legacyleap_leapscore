# FE-02 — Bundle Size & Load Performance

> **Category:** [Frontend & Client Health](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | FE-02 |
| Name | Bundle Size & Load Performance |
| Category | FE — Frontend & Client Health |
| Engine tier | A |
| Default status | measured |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into FE category % |
| Verify effort | 🔶 ~2–4 h — Lighthouse + bundle analytics. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The client ships fat bundles — megabytes of JS/CSS, no code splitting, render-blocking churn, heavy images — so load/LCP/interaction metrics are slow, mobile suffers, and the "page load" is a growing tax on conversion.
- **Why it signals obsolescence:** Client performance is a user-decision metric (half the abandonments on load-time). Legacy clients universally carry unforked bundles (everything loaded on every route), absence of code-splitting, no measurement, and an app that "works fine on the office MacBook." It's also the cheapest modernization win available.
- **Where it manifests:** Bundle analysis (webpack-bundle-analyzer/rollup), Lighthouse scores (< 50 perf), no code-splitting (one giant chunk), no caching strategy, no CDN, images unoptimized, page loads every asset on first paint, no Core Web Vitals tracking.
- **Objective metric:** `initial JS/CSS bytes (KB)`; `LCP/CLS/INP (field P75)`; `code-split coverage % (per-route chunks)`; `Lighthouse perf score`; `image weight %`.
- **Yellow flag (warning):** Bundle 500 KB–1.5 MB initial, LCP 3–4s on mobile, splitting partial. *(Rationale: warning — exceeds budgets, users already paying.)*
- **Red flag (critical):** > 1.5 MB initial, LCP > 4s, no code splitting, no measurement at all — "the app is slow" shows up in churn/refunds. *(Rationale: the client is its own growth blocker; users feel it every session.)*
- **Example symptom:** "The dashboard loads 2.1 MB of JS on every route — including three charting libs. Mobile LCP is 7s. Lighthouse: 34. Sales: 'users bounce from the dashboard.' Nobody has ever opened the bundle analyzer."
- **Blast radius:** Conversion/revenue, mobile reach, user retention, infra (bandwidth), SEO/rankings, support ("slow app" tickets).

## 3. Scoring semantics

- **Scoring criteria (0–3):**** (annex) 3 = budgets + fast; 2 = over budget, splitting partial; 1 = > 1 MB, no split; 0 = massively overweight, uncounted, users suffering.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: code-split the routes, defer non-critical vendors, compress/optimize images, set a bundle budget in CI (regression gate), measure with Lighthouse in CI. Structural fix: a performance budget (bytes + core vitals) enforced, RUM for field data, on-demand vs. bundled loading for heavy features, service-worker caching.
- **Gold standard / target state:** Initial JS < 300 KB, LCP < 2.5s on mobile field-data, code-split by route, budget-enforced in CI, vitals tracked on a dashboard.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- Bundle bytes, Lighthouse/CWV field data — build/render plane. Building the client executes repo-controlled scripts → forbidden by D5.

## 6. Detection recipe

- **Detection method:** Performance measurement — Lighthouse/PageSpeed (lab), Core Web Vitals field data (CrUX/RUM), bundle analyzer output (total + per-route), network waterfall inspection (blocking, duplication), mobile-device throttled test vs. target.

None in v1. Static hints recorded as emission context only: performance-budget configs (`budgets.json`, `size-limit` dep), bundle-analyzer configs, lazy-loading markers (`React.lazy`/dynamic imports density).

## 7. Fact schema

```json
{"fe02": {"status": "unknown",
           "reason": "bundle/load truth needs a built, rendered client",
           "static_hints": {"size_limit_configured": true}}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never                            # budget-config presence proves intent, not bytes
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

### Score mapping predicates

None in v1.

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

n/a v1.

## 10. Evidence and output

### Evidence string

```
emission: "unknown — needs Lighthouse/CWV on a built client (deep scan); budget config present={bool}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Load performance; framework currency is FE-01's row.
