# VEL-04 — Deployment Frequency & Lead Time

> **Category:** [Developer Velocity & Operational Drag](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | VEL-04 |
| Name | Deployment Frequency & Lead Time |
| Category | VEL — Developer Velocity & Operational Drag |
| Engine tier | B |
| Default status | estimated |
| v1 flag | PART |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into VEL category % |
| Verify effort | 🔶 ~2–4 h — deploy/lead-time analytics. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The system deploys rarely (weekly→monthly→quarterly) with long lead times between code merge and production, and releases are "big bang" events rather than a steady stream.
- **Why it signals obsolescence:** Rare, batched releases are a *symptom* of every other debt (slow CI, no tests, risky deploys) and a *multiplier* of it: the bigger the release, the harder to debug, the more likely the rollback, the less the business can iterate. DORA's elite band deploys on demand; legacy bands ship by calendar.
- **Where it manifests:** Release calendar with named "deploy days," monthly release trains, release freeze windows, "merge window" rules, multi-service coordinated releases, deploy frequency hidden (no data at all).
- **Objective metric:** `deploy frequency (deploys/month/service)`; `merge-to-prod P50 lead time`; `% of changes shipped via coordinated release trains`; `release freeze days/month`.
- **Yellow flag (warning):** Weekly deploy cadence (or biweekly), lead time 1–5 days, some coordination required. *(Rationale: warning — survivable but clearly below modern norms.)*
- **Red flag (critical):** Monthly-or-less cadence, lead time > a week, or every release is a coordinated multi-service event with a named human "release manager". *(Rationale: the codebase's risk is now scheduled like a moon landing.)*
- **Example symptom:** "Deployments happen the last Thursday of the month, on a dedicated 'release train.' Lead time is 11 days. One service needs a fix that "can't wait for the train" — so it queues until emergency, at which point it's done the scary way, at 2am."
- **Blast radius:** Business iteration speed, bug-fix latency, release risk, feature mortality (multi-week waits kill momentum), incident pressure.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = on-demand deploys, < 1 day lead; 2 = weekly, a few days; 1 = biweekly–monthly trains; 0 = coordinated calendar-driven releases as the norm.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: remove freeze/merge windows, do Friday non-events, add a deploy button per service. Structural fix: the classic modernization goal — trunk-based dev + feature flags + small CI/CD steps to get deployment-frequency up and lead time down; each elimination of coordination is a DORA win.
- **Gold standard / target state:** Deploy on demand (multiple/week/service), lead time < 1 day, releases are boring non-events, no release manager role needed.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** gh-api (releases, deployments, tags), git
- **Tools:** `GET /repos/{o}/{r}/releases`, `/deployments` event timestamps; merge-to-tag lead time via PR merge dates (`GET /pulls?state=closed`) joined to subsequent release tags
- **Rate-cost:** api-budgeted
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos; zero release events → score-0-territory measured facts (frequency ~0) with caveat.

## 6. Detection recipe

- **Detection method:** Release analytics — count production deploys per service per month (CI/CD + deployment tools), measure merge-to-prod lead time (median), inspect release process (release branch? freeze? feature-toggle zero?), interview "when did you last release on a Tuesday on purpose?"

1. Pull release/deployment events over trailing 12mo; compute deploys/month (tag-based proxy).
2. Lead time: median (PR merged_at → next release tag date).
3. Release-train shape detection: cadence regularity.

Preconditions: public repo or App token.

## 7. Fact schema

```json
{"vel04": {
  "deploys_per_month_est": 3.2,
  "lead_time_median_days": 6.5,
  "source": "tags+deployments",
  "cadence": "irregular"}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never in v1                      # tag ≠ deploy truth (04 §5 caveat mandatory)
estimated_when: >=5 events in window             # clamp [1,2]; confidence low always
unknown_when:   API unavailable / rate-limited
na_when:        never
clamp:          [1,2]
confidence:     low by rule ("tag-based proxy, not deploy logs")
```

### Score mapping predicates

Y/R values (DORA bands): see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: monthly-or-faster cadence ∧ lead time below Red band
- `1`: quarterly-or-slower ∨ lead time in Red band
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `api-budgeted`
- Rate-limited mid-window → fewer months covered → unknown if <5 events

## 10. Evidence and output

### Evidence string

```
basis: "release-proxy {n} events/12mo (~{d}/mo); lead-time median {l}d [tag-based]"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Frequency/lead-time; failure outcomes are VEL-03, manual-step burden VEL-08.
