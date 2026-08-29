# VEL-05 — Onboarding Lead Time to First Production PR — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | D · **unknown** |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into VEL category % |
| Verify effort | 🔷 human (HR/git-join per hire) |
| Thresholds & 0–3 criteria | see encyclopedia §VEL-05 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- Hire dates + authorship joins — HR/org plane. No URL signal.

## 2. Detection recipe

None in v1. Proxies (CONTRIBUTING quality, VEL-02 posture) belong to other rows; this row does not double-score them.

## 3. Fact schema (v1)

```json
{"vel05": {"status": "unknown", "reason": "requires per-hire join of start date to first merged prod PR"}}
```

## 4. Statusing rules

```yaml
measured_when:  never
estimated_when: never
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

## 5. Score mapping

None in v1.

## 6. Gate hooks

none.

## 7. Failure & budget semantics

n/a v1.

## 8. Evidence string

```
emission: "unknown — needs git+HR join per hire (org data); setup posture proxies live in VEL-02"
```

## 9. Scope/overlaps echo

Onboarding time-to-contribution; the docs/tooling that influence it are DOCS-04/VEL-02 rows.
