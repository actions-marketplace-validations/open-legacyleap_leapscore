# SEC-07 — Patch Cadence & Update Workflow — Implementation Spec

> **Authority:** This file defines the SEC-07 implementation contract. The [SEC rubric category](../../rubric/04_SECURITY_COMPLIANCE.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into SEC category % |
| Verify effort | ⚡ human · engine: bot/PR mining |
| Thresholds & 0–3 criteria | see encyclopedia §SEC-07 |

## 1. Inputs

- **Planes:** static-src + gh-api (PRs)
- **Tools:** bot-config presence (`dependabot.yml`, `renovate.json`); lockfile last-touched date from git; `GET /repos/{o}/{r}/pulls?state=open` filtered to dependency bots → age distribution
- **Rate-cost:** api-budgeted
- **Ecosystems:** agnostic
- **Applicability:** never N/A for repos with manifests; no-manifest trees → clause-b N/A.

## 2. Detection recipe

1. Bot presence + config scope (ecosystems covered, grouping).
2. Lockfile freshness: days since last lockfile-touching commit.
3. Open dep-bot PR ages: median/p95, count ignored/closed-unmerged.
4. Release-gate hint: do security patches ride the normal release path (CI on PR) or require manual trains (VEL-08 signal reuse).

Preconditions: manifest present.

## 3. Fact schema

```json
{"sec07": {
  "bot": {"present": true, "tool": "dependabot", "ecosystems": ["npm", "pip"]},
  "lockfile_age_days": 12,
  "open_bot_prs": {"total": 14, "median_age_days": 9, "p95_age_days": 61, "oldest_ignored": 210}}}
```

## 4. Statusing rules

```yaml
measured_when:  manifest parsed                            # presence/absence of workflow is decidable either way
estimated_when: GH API unavailable -> bot+lockfile facts only   # clamp [1,2], confidence low
unknown_when:   no manifests
na_when:        clause-b fired (no manifests at all)
clamp:          [1,2]
confidence:     medium with full PR data
scope_limited:  PR page truncation -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Y/R values (>90d stale etc.): see encyclopedia §SEC-07.

- `3`: bot present ∧ `lockfile_age_days < Y_DAYS` ∧ p95 PR age low
- `2`: automation present but backlog growing / lockfile in Yellow band
- `1`: manual-only patching (no bot) but fresh lockfile
- `0`: no patching workflow ∧ `lockfile_age_days > R_DAYS`

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `api-budgeted`
- Rate-limited → static facts only (bot config + lockfile age), confidence low

## 8. Evidence string

```
evidence: "patch-cadence: {tool} on {ecos}; lockfile {d}d old; open bot PRs {n} (p95 {p}d)"
```

## 9. Scope/overlaps echo

Update workflow and freshness; the vulnerability content of what's stale is SEC-01.
