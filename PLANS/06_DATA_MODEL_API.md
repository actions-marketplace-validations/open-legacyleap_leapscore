# 06 — Data Model & API (report contract)

> The field-level shape every report must satisfy. Downstream consumers: web report (freemium), internal M&A packet, exports, API.
> Depends on: `02` (status semantics), `04` (v1 contents), `05` (fact store).

---

## 1. Versioning philosophy

- The report has a **schema version** (`report_schema: "1"`) and an **engine/rubric pin** (see `05` §7). Consumers must read both.
- Facts and report are separately versioned; fact-store replay must reproduce a report byte-for-byte (`05` §7).

---

## 2. Top-level report object

```yaml
report:
  id: "ls_rpt_<nanoid42>"            # sealable id
  status: "complete" | "degraded" | "snapshot_refused"
  snapshot:
    repo: "github.com/org/repo"
    commit_sha: "<sha>"
    scanned_at: "2026-08-19T…Z"
    engine_version: "leapscore-engine/0.1.0"
    rubric_version: "CODEDEBT_AUDIT_RUBRIC/<sha>"
    elapsed_sec: 214
    budget:             # from 05 §4
      dissolved: false
      degraded_rows: [ "ARCH-02" ]
  headline:
    score: 41            # 0–100, measured+estimated only
    tier: "High Risk / Obsolete"
    ci_band: "±4"        # uncertainty from estimated rows (OQ1 refinement)
  coverage:              # computed per category + total
    measured:  47
    estimated: 15
    unknown:   10
    measured_pct: "65%"
  gates: [ … ]           # see §4
  categories: [ … ]      # see §3
  top_blockers: [ … ]    # see §5
  deep_dive_scope: [ … ] # see §5 (M&A shopping list)
  appendix: { unknown_rows: [ … ] }
  provenance: { scan_id, fact_store_ref, tool_manifest: [ … ] }
```

### Headline rules (from `02` §3)
- `score` computed over `measured`+`estimated` only with rubric weights (`00_EXECUTIVE_RUBRIC.md` Part 3).
- Unknown rows excluded from numerator and denominator; `coverage` tells you the completeness.
- Tier is rubric Part 2 verdict, gated by Part 0 on `proven` gates only.

---

## 3. Category object

```yaml
category:
  id: "SEC"
  name: "Security, Compliance & Vulnerability"
  weight: "20%"
  category_score: "31%"        # rubric: (Σ row pts / 24) × 100
  weighted_contribution: "6.2pp"
  status_counts: { measured: 5, estimated: 1, unknown: 2 }
  indicator_rows: [ row, … ]
```

---

## 4. Indicator row object (the atomic unit)

```yaml
row:
  id: "SEC-02"
  name: "Hardcoded secrets & credentials"
  weight_contrib: "2.5%"
  status: "measured"            # measured | estimated | unknown
  score: 0                      # 0–3; blank for unknown
  score_confidence: null        # set for estimated (low|medium)
  verdict_text: "0 — Critical"  # rubric exact language
  nf: 0                         # normalized factor when clamping computed
  reason: "…"                   # prose reason written by scorer from facts (never generic)
  evidence:                     # measured → required
    tool: "gitleaks@8.18.0"
    args: "--path=/tmp/scan-.."
    pointers: [
      { file: "src/config/app.yml", line: 17, detail: "AKIA… prefix, in tree" },
      { commit: "sha", branch: "main" }
    ]
    facts: { verified: 1, revoked: 0, in_history: 3 }
  basis: null                   # estimated → required instead: pattern/model + matched sample
  remediation:                  # rubric-derived, never invented
    quick_win: "Rotate every leaked credential immediately…"
    structural: "Adopt secret manager + injection (Vault, Secrets Manager)…"
    gold_standard: "Zero secrets in the tree or history…"
    effort: "⚡ ≤30 min"
  unknown_measure_path: null    # unknown → required: "what it takes to make this measured"
  scope_limited: false          # set when budget dissolved (05 §4)
```

### Row contract (from `02` §4)
- `measured` ⇒ `evidence` non-empty. `estimated` ⇒ `basis` + `confidence` non-empty and `score ∈ {1,2}`. `unknown` ⇒ `unknown_measure_path` non-empty, `score` absent.
- Why **reason is non-negotiable**: Scorecard / Snyk give you a number; the product promise (§2) is a sentence *for each row* that explains the number. Reason is generated from the rubric's *scoring guidance* cells + facts (e.g., "3 critical CVEs open > 14 days on an internet-exposed path" → "0 — Critical").

---

## 5. Gates, blockers, deep-dive scope

```yaml
gates:
  - id: "G1"   name: "Credential exposure"
    status: "proven"             # proven | not-proven | needs-verification
    source_rows: [ "SEC-02" ]
    evidence: { tool: "gitleaks", finding_id: "…", path: "…", active: true }
  - id: "G2"   name: "Crit CVE > 14d"
    status: "needs-verification" # exposed-path unknown from URL
    source_rows: [ "SEC-01" ]
    requirement: "Verify reachability: is the vulnerable path internet-exposed?"

top_blockers:                    # ranked by points lost × criticality
  - { row: "SEC-01", points_lost: 3, weight_pp: "2.5pp", summary: "…" }
  - # …

deep_dive_scope:                 # auto-generated from unknown + needs-verification rows
  - { row: "SEC-03", what_it_takes: "Deploy or point at staging; run ZAP/DAST + TLS/header scan" }
  - { row: "PERF-01", what_it_takes: "…" }
```

### 90-day plan (optional but recommended)
Derived from the top blockers joining the rubric *Remediation playbook* quick-win rows, ordered by gate-first-then-weight. Same source rule as rows — no LLM-only prose (keep to rubric where it exists).

---

## 6. The two views (front doors)

| View | Transform |
|---|---|
| **Freemium/standard** | As above; `estimated` visible and labeled; reason text for every row |
| **M&A `measured`-only** | Recompute headline with `estimated → unknown` (OQ2): score drops, coverage drops, and `deep_dive_scope` grows accordingly. Verdict may re-tier. This is *derived from the same rows* — a view, not a second scan |

Both views must be cheaply re-renderable from the sealed report (no re-scan). `06` §6 assumes the base report is stored; the M&A view is a query.

---

## 7. API surface (draft, non-binding — sets shape, not endpoints)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/v1/scans` | Enqueue a scan (repo URL, options: view, sensors) → `scan_id` |
| `GET` | `/v1/scans/{id}/status` | Poll: queued → running (progress %) → sealed |
| `GET` | `/v1/scans/{id}/report?view=standard\|ma_measured_only` | Sealed report, either view |
| `GET` | `/v1/scans/{id}/report.json` / `.html` / `.pdf` | Export forms (OQ3) |
| `GET` | `/v1/indicators` | Catalog listing (id, name, status model, scoring guidance) — enables checkable trust |

Auth: freemium = token + quota bucket; M&A = App-install scoped token (`08`). Rate-limit errors return explicit `429` + backoff with retry semantics (the report is idempotent).

---

## 8. Change-tracking (how reports stay "the same")

- A reported score must be re-derivable: fact-store + rubber-pinned rubric → same `score`. Any catalog tweak bumps `rubric_version` and invalidates old reports (kept for audit, flagged `superseded`).
- M&A deal-workflows may freeze a report snapshot (`snapshot_refused` if the repo moved under them — the report records `commit_sha`; a *new* commit does not silently change a frozen report).