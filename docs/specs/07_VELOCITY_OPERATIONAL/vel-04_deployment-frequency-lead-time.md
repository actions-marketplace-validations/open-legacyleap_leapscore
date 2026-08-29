# VEL-04 — Deployment Frequency & Lead Time — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | B · **estimated** (tag/release-event proxy per `docs/plans/04` §5) |
| v1 flag | PART |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into VEL category % |
| Verify effort | ⚡ proxy human |
| Thresholds & 0–3 criteria | see encyclopedia §VEL-04 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** gh-api (releases, deployments, tags), git
- **Tools:** `GET /repos/{o}/{r}/releases`, `/deployments` event timestamps; merge-to-tag lead time via PR merge dates (`GET /pulls?state=closed`) joined to subsequent release tags
- **Rate-cost:** api-budgeted
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos; zero release events → score-0-territory measured facts (frequency ~0) with caveat.

## 2. Detection recipe

1. Pull release/deployment events over trailing 12mo; compute deploys/month (tag-based proxy).
2. Lead time: median (PR merged_at → next release tag date).
3. Release-train shape detection: cadence regularity.

Preconditions: public repo or App token.

## 3. Fact schema

```json
{"vel04": {
  "deploys_per_month_est": 3.2,
  "lead_time_median_days": 6.5,
  "source": "tags+deployments",
  "cadence": "irregular"}}
```

## 4. Statusing rules

```yaml
measured_when:  never in v1                      # tag ≠ deploy truth (04 §5 caveat mandatory)
estimated_when: >=5 events in window             # clamp [1,2]; confidence low always
unknown_when:   API unavailable / rate-limited
na_when:        never
clamp:          [1,2]
confidence:     low by rule ("tag-based proxy, not deploy logs")
```

## 5. Score mapping (predicates)

Y/R values (DORA bands): see encyclopedia §VEL-04. Estimated ⇒ score ∈ {1,2}:

- `2`: monthly-or-faster cadence ∧ lead time below Red band
- `1`: quarterly-or-slower ∨ lead time in Red band
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `api-budgeted`
- Rate-limited mid-window → fewer months covered → unknown if <5 events

## 8. Evidence string

```
basis: "release-proxy {n} events/12mo (~{d}/mo); lead-time median {l}d [tag-based]"
```

## 9. Scope/overlaps echo

Frequency/lead-time; failure outcomes are VEL-03, manual-step burden VEL-08.
