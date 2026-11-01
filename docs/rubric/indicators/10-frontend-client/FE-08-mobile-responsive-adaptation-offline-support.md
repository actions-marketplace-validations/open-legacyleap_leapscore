# FE-08 — Mobile / Responsive Adaptation & Offline Support

> **Category:** [Frontend & Client Health](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | FE-08 |
| Name | Mobile / Responsive Adaptation & Offline Support |
| Category | FE — Frontend & Client Health |
| Engine tier | C |
| Default status | unknown |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | deep-dive · `folds_into: FE` |
| Verify effort | 🔷 ~1–2 days — offline experiments + mobile audit. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The client doesn't adapt to the contexts real users are in — no meaningful offline/progressive capability for a product that needs it, heavy always-online dependence, no mobile-specific performance, no low-bandwidth consideration, and state-loss on navigation — while user data (from FE-04/analytics) shows a mobile-first world.
- **Why it signals obsolescence:** "Responsive + offline-aware + mobile-perf" is the modern client baseline; a client that expects a desktop, wired, Chrome-18 machine is building for an audience that has moved. Offline/PWA support matters where connectivity is real (mobile users, tunnels, travel) — and its absence occasionally turns perfectly-normal usage into data loss.
- **Where it manifests:** No service worker/PWA, forms lose unsaved data on refresh, hard dependency on network for static shell, no mobile perf budget (heavy assets on phones), no manifest/installability, desktop-first flows that collapse on mobile UX, connectivity-agnostic code.
- **Objective metric:** `PWA/offline capability present?`; `unsaved-data-loss incidents`; `mobile LCP (throttled) vs. budget`; `% of users impacted by no-offline/mobile gaps`; `installability/manifest present?`.
- **Yellow flag (warning):** Some offline/progressive features exist, mobile perf over budget, occasional data-loss on network blips. *(Rationale: warning — the app functions, context-fit is leaky.)*
- **Red flag (critical):** No offline capability for a product users depend on in real connectivity, data loss on common navigation/refresh, mobile experience broken/unweighted. *(Rationale: the client loses what real users do — a crisis of context, not of polish.)*
- **Example symptom:** "The field sales team fills quotes in tunnels and parking garages. A refresh — even an accidental one — wipes the draft. 'The app eats my work' is a repeated theme in feedback. No service worker, 9 MB mobile JS. Connectivity is the enemy."
- **Blast radius:** Field/mobile productivity, data loss, user trust, engagement, app-store rating territory, growth.

## 3. Scoring semantics

- **Scoring criteria (0–3):**** (deep-dive — folds into the category when run) 3 = offline-capable, mobile-fit; 2 = partial progression; 1 = no offline, mobile over budget; 0 = connectivity-dependent data loss in user-facing flows.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: add a service worker + shell caching (static shell offline), persist draft state, cut mobile payload for the core path, cache-first for static assets. Structural fix: PWA/progressive economics by design (offline-first where core), mobile perf budget (Lighthouse gate), reconnect/resume semantics (idempotent submit ties into API-09), context-tiered asset serving.
- **Gold standard / target state:** Core flows work offline (or degrade meaningfully well), draft data survives navigation, mobile perf within budget, progressive capability measured and tracked.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- Connectivity-loss behavior, form-state persistence, throttled performance — render/runtime plane.

## 6. Detection recipe

- **Detection method:** Context audit — check PWA/service-worker/offline scaffolding existence, form-state persistence across refresh, static-asset CDN/cache behavior, mobile throttled performance (Lighthouse mobile), connectivity-loss experiment (reload while offline), usage analytics (share of mobile/travel context), state-loss bug count tied to navigation.

None in v1. Static hints as emission context: service-worker/PWA manifest presence, offline-page routes, mobile viewport configs. These prove scaffolding intent only.

## 7. Fact schema

```json
{"fe08": {"status": "unknown",
           "reason": "offline/mobile behavior provable only at runtime",
           "static_hints": {"sw_present": false, "pwa_manifest": false}}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never
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
emission: "unknown — needs connectivity-loss experiments + throttled device runs (deep scan); SW={bool} PWA={bool}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Offline/mobile depth; responsive support markers are FE-04's row.
