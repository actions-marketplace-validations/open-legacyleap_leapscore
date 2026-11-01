# FE-04 — Browser / Platform Support Drift

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for FE-04. Edit this file; the legacy path [fe-04_browser-platform-support-drift.md](../../../specs/10_FRONTEND_CLIENT/fe-04_browser-platform-support-drift.md) is a compatibility alias.
> **Category:** [Frontend & Client Health](../../10_FRONTEND_CLIENT.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/10_FRONTEND_CLIENT/FE-04_browser-platform-support-drift.md`

## 1. Identity

| field | value |
|---|---|
| ID | FE-04 |
| Name | Browser / Platform Support Drift |
| Category | FE — Frontend & Client Health |
| Engine tier | B |
| Default status | measured |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into FE category % |
| Verify effort | 🔶 ~2–4 h — browserlist + device test session. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The client targets a stale or wrong platform matrix — still promising IE11/old browsers, or alternatively, no declared support matrix at all, breaking on current browsers, no responsive layouts, no desktop/mobile parity, and platform support is a rumor.
- **Why it signals obsolescence:** The platform matrix is the client's forward-compatibility contract. Supporting dead browsers forces stagnation (no modern CSS/JS); supporting nothing means users break in the real world. Modern practice: a known, current matrix (browserlist) + responsive across breakpoints + feature detection. Its absence marks a client frozen at the era it was built.
- **Where it manifests:** Hardcoded IE11/legacy promises in docs, polyfill sprawl for long-dead browsers, no browserlist file, fixed-width layouts (desktop-only), no responsive breakpoints, "works on Chrome only" acceptance, no device testing, transdyn failures on exports.
- **Objective metric:** `browserlist currency`; `responsive coverage % of flows`; `polyfill-for-obsolete count`; `real-user browser matrix vs. tested matrix overlap`; `mobile breakage incidents`.
- **Yellow flag (warning):** Stale matrix or partial responsive; polyfill cruft; mobile tested sporadically. *(Rationale: warning — friction, real-user breakage ticking up.)*
- **Red flag (critical):** Desktop-only/fixed-width (or a matrix that excludes where users are), or no matrix at all with recurring "breaks in my browser" reports. *(Rationale: the client isn't built for the present — it's built for its own archive. Users are being told to upgrade to the app's remembered world.)*
- **Example symptom:** "The ordering portal is a 1280px desktop layout. On a phone it's a 300px scrollable ghost town. Browser analytics say 61% of the audience is mobile. 'We're resolving it one ticket at a time' — for three years."
- **Blast radius:** Reach, mobile revenue, user trust, QA coverage, support load, brand.

## 3. Scoring semantics

- **Scoring criteria (0–3):**** (annex) 3 = current + responsive; 2 = stale or partial responsive; 1 = broken on current/mobile for some flows; 0 = desktop-only museum or no matrix with real breakage.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: declare the matrix + enforce browserlist, add a responsive bootstrap for the top user journey, test mobile on the core path. Structural fix: responsive-first design standards, device/browser QA in the pipeline, analytics-informed matrix reviews twice a year, cut the obsolete matrix (drop IE11 promises, shed polyfills).
- **Gold standard / target state:** Declared + enforced current matrix, responsive across breakpoints, browser/device tested in QA, matrix reviewed against real usage.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** browserslist config presence + parse (`.browserslistrc`, `package.json#browserslist`); target-currency check vs current browser-release table; polyfill-for-obsolete greps (`@babel/polyfill`, core-js@2, IE-specific shims); responsive-implementation markers (breakpoint configs, viewport meta)
- **Rate-cost:** none
- **Ecosystems:** JS/TS-gated (category gate applies)
- **Applicability:** FE category gate.

## 6. Detection recipe

- **Detection method:** Support-matrix audit — browserlist/browsers config present + current? Responsive implementation (breakpoints, mobile test)? Device/browser test coverage in QA? Browser usage analytics (what do real users use) vs. what's tested? Try the app on a current mobile browser + a recent-only build.

1. Parse declared browser targets; compute age of oldest targeted platform.
2. Obsolete-polyfill inventory; dead-target detection (IE11-class).
3. Real-user analytics join is telemetry plane → emission text.

Preconditions: client detected.

## 7. Fact schema

```json
{"fe04": {
  "browserslist_present": true,
  "oldest_target": "ie 11", "target_age_years": 9,
  "obsolete_polyfills": ["core-js@2"],
  "responsive_markers": true}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # support-judgment over targets is inferential
estimated_when: >=1 probe class computed       # clamp [1,2]; confidence medium with browserslist parsed
unknown_when:   client detected but no support surface found at all
na_when:        category gate fired
clamp:          [1,2]
confidence:     medium
```

### Score mapping predicates

Criteria/Y-values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: targets slightly behind current norm, obsolete polyfills absent
- `1`: dead-platform targets ∨ obsolete polyfill stack ∨ no responsive implementation
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`

## 10. Evidence and output

### Evidence string

```
basis: "support-drift: oldest target {t} ({a}y); polyfills={list}; responsive={bool}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Platform-support posture; framework EOL is FE-01, offline/mobile depth is FE-08.
