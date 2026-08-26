# SEC-06 — Insecure Transitive Chains — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** (tier arbitrated; encyc said B) |
| v1 flag | YES |
| Gates fed | none (confirmed malware cross-references ECOS-10 evidence) |
| Rollup / deep-dive | standard · folds into SEC category % |
| Verify effort | 🔶 human · engine: deep SCA pass |
| Thresholds & 0–3 criteria | see encyclopedia §SEC-06 |

## 1. Inputs

- **Planes:** static-src + advisories
- **Tools:** `osv-scanner --experimental-local-db` over lockfiles; `npm audit --package-lock-only` full-chain mode; `pip-audit`; reachability proxy: import-closure membership of vulnerable transitive deps
- **Rate-cost:** api-budgeted (advisory sync only)
- **Ecosystems:** npm · pip · go · Maven · bundler
- **Applicability:** ECOS-02 clause-b.

## 2. Detection recipe

1. Parse lockfile graph; enumerate transitive chains.
2. Match against advisory DBs (vuln + malware/withdrawn classes).
3. For each vulnerable transitive: `chain_depth`, `direct_parent`, `reachable_from_core_imports`.
4. Distinguish vuln-class findings from SEC-01's row by chain depth ≥ 2 (depth ≤1 belongs to SEC-01; orchestrator partitions findings).

Preconditions: parsed lockfile.

## 3. Fact schema

```json
{"sec06": {
  "transitive_total": 1316,
  "vulnerable_transitive": [{"pkg": "minimist", "version": "1.2.0", "depth": 4,
                              "via": ["mkdirp"], "reachable_from_core": true}],
  "malware_class_hits": []}}
```

## 4. Statusing rules

```yaml
measured_when:  >=1 scanner completed on parsed graph
estimated_when: graph partially resolvable                # clamp [1,2], confidence low
unknown_when:   no lockfile
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium (exhaustive lockfile surface)
scope_limited:  private transitive segment -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Criteria: see encyclopedia §SEC-06.

- `3`: no vulnerable transitives reachable in prod scope
- `2`: vulnerable transitives exist, none reachable, shallow chains only
- `1`: deep unmaintained chain into a peripheral prod path
- `0`: `any(malware_class_hits)` ∨ vulnerable transitive reachable from core imports

## 6. Gate hooks

none direct; `malware_class_hits` mirrored into ECOS-10's fact record by orchestrator rule.

## 7. Failure & budget semantics

- Budget class: `fast`
- Advisory DB stale → confidence low note with DB date

## 8. Evidence string

```
evidence: "osv-deep: {k} vulnerable transitives of {n} ({r} core-reachable); worst {pkg} depth={d} via {via}"
```

## 9. Scope/overlaps echo

Transitive chain quality/reachability; direct-dep vulns are SEC-01, abandonment is ECOS-03.
