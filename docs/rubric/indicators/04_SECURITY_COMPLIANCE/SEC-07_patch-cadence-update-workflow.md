# SEC-07 — Patch Cadence & Update Workflow

> **Category:** [Security, Compliance & Vulnerability](../../04_SECURITY_COMPLIANCE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | SEC-07 |
| Name | Patch Cadence & Update Workflow |
| Category | SEC — Security, Compliance & Vulnerability |
| Engine tier | A |
| Default status | measured |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into SEC category % |
| Verify effort | ⚡ ≤ 30 min — bot dashboard + lockfile dates. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The org has no working patch pipeline — security updates arrive via occasional heroics rather than a continuous, automated, gated flow. Lockfiles sit stale, Dependabot/Renovate is off, patches wait for "the next release."
- **Why it signals obsolescence:** Patch cadence is the *process* that turns SEC-01's findings into fixes. Absent a cadence, every CVE is a project; present, it's a routine Tuesday. Its absence marks a maintenance model abandoned by modern practice (auto-update + CI-as-gate).
- **Where it manifests:** No Dependabot/Renovate, or the bot's PRs accumulate > 500 open, old lockfile dates, manual `docker build` on servers, "we batch patches once a year," security patches deferred for feature freezes, no staging for patch validation.
- **Objective metric:** `median days to patch a High CVE`; `Dependabot/Renovate PR backlog`; `% of patches applied within SLA`; `lockfile freshness (days)`; `existence of automation`.
- **Yellow flag (warning):** Manual patch process, patches within 30–90 days, automation absent but SLA roughly met. *(Rationale: warning — it works, barely, and only because people carry it.)*
- **Red flag (critical):** No automation, patches routinely > 90 days or deferred for releases, or "we can't patch because the build breaks" (unpatched = systemic). *(Rationale: the pipeline is broken, so exposure accumulates structurally.)*
- **Example symptom:** "Dependabot has 640 open PRs from three years. Patching is 'a release-day thing.' Last critical CVE took 5 weeks: no staging, no tests for patch branches, and the 'patch' broke the auth flow."
- **Blast radius:** Exposure window, SEC-01 compounding, audit outcomes, security-team trust in engineering.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = automated + SLA met; 2 = manual but within 30–90 days; 1 = batch/heroic patching; 0 = no pipeline, systemic exposure.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: enable Dependabot/Renovate with auto-merge on green for patch/minor updates, act on the security-only PRs first. Structural fix: a scheduled patch lane (weekly security window, CI gates), environment-per-ticket to stage patches, measured SLA with an executive dashboard.
- **Gold standard / target state:** Patches automated, applied within SLA (Crit ≤ 7d, High ≤ 30d), CI validates every patch, zero manual patch heroics.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src + gh-api (PRs)
- **Tools:** bot-config presence (`dependabot.yml`, `renovate.json`); lockfile last-touched date from git; `GET /repos/{o}/{r}/pulls?state=open` filtered to dependency bots → age distribution
- **Rate-cost:** api-budgeted
- **Ecosystems:** agnostic
- **Applicability:** never N/A for repos with manifests; no-manifest trees → clause-b N/A.

## 6. Detection recipe

- **Detection method:** Automation audit — bot presence + PR age distribution, lockfile last-updated date, release-process gate (do patches require a full release train?), patch ticket SLAs, how long between a CVE report and a fix deploy (look at history).

1. Bot presence + config scope (ecosystems covered, grouping).
2. Lockfile freshness: days since last lockfile-touching commit.
3. Open dep-bot PR ages: median/p95, count ignored/closed-unmerged.
4. Release-gate hint: do security patches ride the normal release path (CI on PR) or require manual trains (VEL-08 signal reuse).

Preconditions: manifest present.

## 7. Fact schema

```json
{"sec07": {
  "bot": {"present": true, "tool": "dependabot", "ecosystems": ["npm", "pip"]},
  "lockfile_age_days": 12,
  "open_bot_prs": {"total": 14, "median_age_days": 9, "p95_age_days": 61, "oldest_ignored": 210}}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  manifest parsed                            # presence/absence of workflow is decidable either way
estimated_when: GH API unavailable -> bot+lockfile facts only   # clamp [1,2], confidence low
unknown_when:   no manifests
na_when:        clause-b fired (no manifests at all)
clamp:          [1,2]
confidence:     medium with full PR data
scope_limited:  PR page truncation -> estimated + scope-limited
```

### Score mapping predicates

Y/R values (>90d stale etc.): see §3.

- `3`: bot present ∧ `lockfile_age_days < Y_DAYS` ∧ p95 PR age low
- `2`: automation present but backlog growing / lockfile in Yellow band
- `1`: manual-only patching (no bot) but fresh lockfile
- `0`: no patching workflow ∧ `lockfile_age_days > R_DAYS`

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `api-budgeted`
- Rate-limited → static facts only (bot config + lockfile age), confidence low

## 10. Evidence and output

### Evidence string

```
evidence: "patch-cadence: {tool} on {ecos}; lockfile {d}d old; open bot PRs {n} (p95 {p}d)"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Update workflow and freshness; the vulnerability content of what's stale is SEC-01.
