# VEL-03 — Deployment Failure Rate (CFR) — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | B · **unknown** |
| v1 flag | NO (v2) |
| Gates fed | **G6** jointly with VEL-08 (`G6*`) — CFR half unprovable from URL in v1, so G6 proven-state requires both halves; see hooks |
| Rollup / deep-dive | standard · folds into VEL category % |
| Verify effort | 🔶 human/v2 (deploy + incident data) |
| Thresholds & 0–3 criteria | see encyclopedia §VEL-03 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- Deploy outcomes vs rollbacks/hotfixes — needs deploy analytics (org plane). GH deployments API gives events but not *outcomes*.

## 2. Detection recipe (v2 sketch)

1. Join deployment records with rollback/hotfix/incident markers.
2. CFR = failed deploys / total over window.

**v1 behavior:** `unknown`. Tag-based proxies explicitly rejected: a tag is not an outcome. Hotfix-commit density on release windows is recorded as emission context only.

## 3. Fact schema (v1)

```json
{"vel03": {"status": "unknown",
            "reason": "failure rate requires deploy-outcome join",
            "context_hints": {"hotfix_commits_last_90d": 7}}}
```

## 4. Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never                            # outcome-free proxies would be exactly a scored guess
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

## 5. Score mapping

None in v1.

## 6. Gate hooks (G6*)

G6 fires `proven` only when BOTH: this row's Red condition evidenced via v2/deep-scan AND VEL-08 manual-deploy evidence. In v1, G6 can at most be `needs-verification` (VEL-08's half may be measured-Red; the orchestrator marks G6 needs-verification citing this row).

## 7. Failure & budget semantics

n/a v1.

## 8. Evidence string

```
emission: "unknown — needs deploy-vs-rollback join (deep scan); hotfix density {k}/90d as context"
```

## 9. Scope/overlaps echo

Deploy failure rate; release-path automation is VEL-08, deploy frequency VEL-04.
