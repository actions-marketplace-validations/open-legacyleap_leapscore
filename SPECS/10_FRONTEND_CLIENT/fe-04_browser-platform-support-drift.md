# FE-04 — Browser / Platform Support Drift — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** (tier arbitrated; encyc said B·measured — config currency is static) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into FE category % |
| Verify effort | ⚡ human · engine: support-config audit |
| Thresholds & 0–3 criteria | see encyclopedia §FE-04 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** browserslist config presence + parse (`.browserslistrc`, `package.json#browserslist`); target-currency check vs current browser-release table; polyfill-for-obsolete greps (`@babel/polyfill`, core-js@2, IE-specific shims); responsive-implementation markers (breakpoint configs, viewport meta)
- **Rate-cost:** none
- **Ecosystems:** JS/TS-gated (category gate applies)
- **Applicability:** FE category gate.

## 2. Detection recipe

1. Parse declared browser targets; compute age of oldest targeted platform.
2. Obsolete-polyfill inventory; dead-target detection (IE11-class).
3. Real-user analytics join is telemetry plane → emission text.

Preconditions: client detected.

## 3. Fact schema

```json
{"fe04": {
  "browserslist_present": true,
  "oldest_target": "ie 11", "target_age_years": 9,
  "obsolete_polyfills": ["core-js@2"],
  "responsive_markers": true}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # support-judgment over targets is inferential
estimated_when: >=1 probe class computed       # clamp [1,2]; confidence medium with browserslist parsed
unknown_when:   client detected but no support surface found at all
na_when:        category gate fired
clamp:          [1,2]
confidence:     medium
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §FE-04. Estimated ⇒ score ∈ {1,2}:

- `2`: targets slightly behind current norm, obsolete polyfills absent
- `1`: dead-platform targets ∨ obsolete polyfill stack ∨ no responsive implementation
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`

## 8. Evidence string

```
basis: "support-drift: oldest target {t} ({a}y); polyfills={list}; responsive={bool}"
```

## 9. Scope/overlaps echo

Platform-support posture; framework EOL is FE-01, offline/mobile depth is FE-08.
