# 10 — Roadmap & Open Decisions (historical plan)

> **Status:** Historical phase plan and planning-era open questions. The P0–P3 sequence, phase contents, and statuses below are not the current roadmap or a delivery commitment. Current scan/report requirements are in [OpenSpec](../../openspec/specs/); see the [decision index](00_MASTER_INDEX.md) for current implementation pointers. The original plan intentionally assigned phase order only, not delivery dates.

---

## Phase map

```
                 ┌──────────────────────────────────────────────────────────────┐
                 │           P0  Truth core (single-repo report)                 │
                 └──────────────────────────────────────────────────────────────┘
                    build: engine sprint 1 + sprint 2, report, sandbox v1,
                    statusing map, emission rules, 5-repo acceptance harness
                 ┌──────────────────────────────────────────────────────────────┐
                 │           P1  Product shells (both doors)                     │
                 └──────────────────────────────────────────────────────────────┘
                    freemium UI (report render + URL entry), API (#7 of 06),
                    M&A App install + per-repo tokens, portfolio pack v0
                 ┌──────────────────────────────────────────────────────────────┐
                 │           P2  Deep Scan (the revenue engine)                  │
                 └──────────────────────────────────────────────────────────────┘
                    test-execution sandbox, CI-history pulls, env-probe kit,
                    Deep-Scan pricing go-live, SI partnership for env probes
                 ┌──────────────────────────────────────────────────────────────┐
                 │           P3  Platform expansion                               │
                 └──────────────────────────────────────────────────────────────┘
                    more ecosystems (Go→Java→Ruby/PHP), more SCM doors,
                    portfolio drift alerts, self-hosted single-tenant mode
```

### Phase contents (each a vertical slice, mirroring `04`)

**P0 — Truth core**
- Engine sprints 1+2 (`04` §4), statusing map (`05` §6), budget controller (`05` §4).
- Report schema (`06`), remediation emission, unknown-row "what it takes" text, gates G1–G3/G5 provenance.
- Sandbox hardening scoped to static-only (`08` §2).
- **Exit**: 5-repo acceptance quiz (`03` last) passes; a public repo renders a complete report in < 5 min; no code executed.

**P1 — Product shells**
- Freemium web UI + `POST /scans` API + sealed report + `measured`-only view switch.
- GitHub App (scopes of `08` §3), per-scan install tokens, delete-after-delivery default.
- Portfolio pack v0 (scores a repo set, system roll-up per rubric Part B/C).
- **Exit**: a visitor can self-serve a public report; an M&A analyst can scan a private org and receive the portfolio pack.

**P2 — Deep Scan**
- Test-execution sandbox (the only phase where *our* infra runs *target* code — the new attack surface is exactly `08` §2-extension; gate hardware on P0 sandbox lessons).
- CI/checks-history pulls (TEST-01/02/04, VEL-01/03/04); optional SBOM export; env-probe kit for C-tier rows.
- Deep-Scan + M&A pricing go-live (`09`).
- **Exit**: Deep-Scan converts a meaningful share of `unknown`→`measured`; price bears its compute.

**P3 — Platform expansion**
- Ecosystems Go→Java→Ruby/PHP (D8); SCM doors (GitLab/Bitbucket/Azure DevOps) on the same engine.
- Drift/re-scan alerts, baseline history, team dashboards.
- Self-hosted single-tenant container mode (M&A firms refusing cloud — `08` §7 open item).
- **Exit**: metrics prove the freeload funnel and the M&A revenue engine independently.

---

## Key dependencies (what gates what)

| Deferred until | Because |
|---|---|
| `unknown`-row emission text | P0 engine (needs the encyclopedia wiring; can be prototyped in parallel — the *content* exists, only the emission needs the schema) |
| Test-suite execution | P2 (needs P0 sandbox lessons; it's the new attack surface) |
| Go/Java ecosystem adapters | P3 (needs P0/P1 engine stability; D8 priority) |
| Self-hosted mode | P3 or an early P1 override for a named M&A anchor client (deal-gated) |
| Portfolio/team dashboards | P1 for M&A pack; P3 for freemium teams |

---

## Open decisions (from `00` §Open, with owners)

| ID | Question | Status | Suggested owner |
|---|---|---|---|
| OQ1 | Headline number format: 0–100 vs tiered band vs radar | Open — `02` §7 assumed 0–100+tier; wants a product-review call | Product |
| OQ2 | `estimated` in gated B2B reports: present-labeled vs `measured`-only | Open — `06` §6 implements both views already; the *policy* (which is default) is split | M&A lead |
| OQ3 | Report delivery forms (web-only now?, +HTML/PDF export gate) | Open — `01` NFR + `09` Deep; shipping web+API in P1, exports P2 | Product |
| OQ4 | Free-scan budget ceiling (min–5min bound in `04`/`05`) | Open — sets the freemium funnel math | Product/CloudOps |
| OQ5 | Frontend annex (FE-01…07) packaging (annex vs scored module) | Open — rubric says annex-only; P3 re-eval when client-heavy repos dominate | Product |
| OQ6 | Deep-Scan unit: per-repo vs row-package add-ons | Open — `09` §6 recommends per-repo + row add-ons | Commercial |

**Send-backs to the grill beforehand:** OQ1 (number vs band) changes the whole report header; OQ2 changes M&A packaging wording; OQ4 changes the budget controller's config. These are exactly the decisions a design interview should close during P0.

---

## Not invented here (out of scope by design)

- Writing bespoke analyzers (D7). Building our own hash-index/dependency graph when `Scorecard`/`OSV`/`Socket` already emit them.
- Owning the *remediation execution* (that's the client's eng team + the SI partners; `09` §6 proposes SI channel).
- Scoring live systems (that's the Deep-Scan env-probe, which hands off, not owns, the runtime).

---

## Definition of "all docs done"

Plan-set complete when:
1. `00–10` read as one coherent argument (a stranger can approve the P0 build from `00`+`03`+`04`+`05`+`08` without a meeting).
2. OQ1–OQ6 each have a named owner and an "answered by" trigger.
3. The 5-repo acceptance harness (`03` last) is *specified* (expected measured/estimated/unknown splits and false-positive risks) as a test-suite-ready artifact — ready for P0 TDD without more design.
