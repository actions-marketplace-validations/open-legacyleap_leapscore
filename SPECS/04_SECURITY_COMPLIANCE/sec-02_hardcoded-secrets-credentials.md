# SEC-02 — Hardcoded Secrets & Credentials — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** |
| v1 flag | YES |
| Gates fed | **G1** — credential exposure |
| Rollup / deep-dive | standard · folds into SEC category % |
| Verify effort | ⚡ human · engine: scanner run tree+history |
| Thresholds & 0–3 criteria | see encyclopedia §SEC-02 |

## 1. Inputs

- **Planes:** git (full clone incl. history)
- **Tools:** `gitleaks >= 8` (`detect --report-format json`, `--log-opts=--all` for history), trufflehog verification pass optional (`--only-verified`)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos.

## 2. Detection recipe

1. Tree scan: `gitleaks detect --source {clone} --report-format json --report-path …`
2. History scan: same with `--log-opts="--all"` (history budget: `--max-depth` per clone budget; truncation recorded).
3. Verification: for AWS/GCP/Stripe-class rules, mark `verified` when trufflehog confirms live; else `unverified`.
4. Classify location: current-tree vs history-only vs both; join files to core-path set.

Preconditions: full-history clone within budget; else scope-limited path below.

## 3. Fact schema

```json
{"sec02": {
  "tree_findings": [{"rule": "aws-access-token", "file": "config/prod.py", "verified": false}],
  "history_only_findings": 6,
  "verified_live": 0,
  "history_scanned_full": true}}
```

## 4. Statusing rules

```yaml
measured_when:  gitleaks completed on tree (+history if available)
estimated_when: never                            # scanner output is fact; absence-after-scan is not-proven evidence
unknown_when:   scanner failed to run at all
na_when:        never
clamp:          [1,2]                             # n/a — measured-only row
confidence:     medium; low if history truncated
scope_limited:  history budget hit -> measured + scope-limited note (tree result stands)
```

## 5. Score mapping (predicates)

Criteria: see encyclopedia §SEC-02.

- `3`: zero findings anywhere, clean-run evidence
- `2`: history-only findings, all plausibly rotated (age > rotation window) — Yellow band per entry
- `1`: unverified findings in isolated paths, or aged history-only secrets in core paths
- `0`: any finding in current tree ∧ (in core/config-deploy path ∨ verified-live)

## 6. Gate hooks (G1)

- `proven`: verified-live secret ∨ current-tree finding on deploy/auth/core path
- `not-proven`: clean tree + full history scanned
- `needs-verification`: findings present but history truncated or verification unavailable

## 7. Failure & budget semantics

- Budget class: `fast` (bounded by repo size)
- Oversized history → shallow-since budget → `scope-limited`; scanner crash → retry once → unknown

## 8. Evidence string

```
evidence: "gitleaks: tree={t} findings ({v} verified-live); history-only={h} (full={bool}); worst {rule}@{file}"
```

## 9. Scope/overlaps echo

Secrets/credentials in source, config, and history; supply-chain malware risk is ECOS-10.
