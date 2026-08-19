# 04 — V1 Scope (the vertical slice)

> Defines exactly what ships first and why; everything else in the matrix is deliberately deferred.
> Depends on: `03_ENGINEERABILITY_MATRIX.md` for the tier map. Feeds: `05` (engine), `06` (schema), `09` (monetization), `10` (roadmap).

---

## 1. The slice in one sentence

**v1 = static-analysis + GitHub-API scoring of any *public* repo URL; every repo scores on day 1; unmeasurable rows report `unknown` honestly; no code from scanned repos is ever executed.**

That is: all Tier A, nothing from B (except static proxies), nothing from C/D as numbers, hard gate-caps, full report UI.

---

## 2. Scope by Tier

| Tier | In v1? | How |
|------|--------|-----|
| **A — automatable** | ✅ Ship | 59 indicators. Two internal sprints (see §4) |
| **B — deeper perms / test-exec** | ⚠️ Partial | Ship *only* where a static proxy exists (listed in §5); actual test-execution is v2 |
| **C — live environment** | ❌ | `unknown` + emission text ("what it takes to measure") |
| **D — humans/org** | ❌ | `unknown` + emission text |

## 3. Ecosystem coverage (D8)

| Priority | Ecosystem | Why gate this high |
|----------|-----------|--------------------|
| 1 | JS/TS (npm/yarn/pnpm) | Largest public-repo share; best OSS tooling (dependency-cruiser, knip, c8, eslint) |
| 2 | Python (pip/poetry/uv) | Second-largest; radon, vulture, mypy, pytest, alembic all mature |
| 3 | Go | go.mod-based; slim tool surface, cheap to add |
| 4 | Java (Maven/Gradle) | SonarQube-class tooling heavier; worth gate 3/4 |
| 5+ | Ruby / PHP / C# / Rust | Manifest-sniff fallback: language-agnostic indicators still score; language-gated rows = `unknown` |

**Manifest sniffing (D6/D8):** a `detect-ecosystem` step reads lockfiles/manifests (`package-lock.json`, `pyproject.toml`, `go.mod`, `pom.xml`, …), selects the adapter set. Any repo with *no* recognized manifest still gets the full language-agnostic scan (git metadata, CI, docs, changelog, dependabot, secrets, OpenAPI, Terraform, Docker).

---

## 4. V1 sprint breakdown (internal)

**Sprint 1 — the "one tool call + one rubric mapping" core (~20 indicators).** These are the freight forklift of the product:

- Secrets (`gitleaks`/`trufflehog`) — SEC-02
- Vulns + supply chain (`trivy`, `osv-scanner`, `npm audit`, Socket.dev) — SEC-01, SEC-06, ECOS-03/10
- Package drift + bloat + license + lockfile (`npm outdated`, `depcheck`/`knip`, `syft`/licensee, lockfile audit) — ECOS-02/05/06/07
- Runtime EOL + framework lock-in (endoflife.date) — ECOS-01, ECOS-08
- OpenSSF Scorecard (whole-repo, zero-config) — ECOS-10 cross-check
- CI-config audits — TEST-08, SEC-07, SEC-10, VEL-08
- Changelog / releases API — DOCS-08
- Git author stats — VEL-06
- Docs presence — DOCS-01/03/04/07/09
- Migration inventory — DATA-01

**Sprint 2 — the heavier static analyzers (~39 A indicators).** Clone + language-scale tools:

- Complexity / duplication / dead code / coupling (`lizard`, `jscpd`, `knip`-full, `dependency-cruiser`, `import-linter`) — ARCH-01/02/03/04/08
- Git mining + GH issue correlation — ARCH-05
- Typing debt (`mypy`/`pyright`, TS `strict`) — ARCH-09
- Test-shape & skips — TEST-03/05; TEST-10 archaeology
- Schema archaeology — DATA-08/09
- API-surface reads — API-01/02/06/07; OpenAPI lint
- Fuzz-harness presence — SEC-09
- Frontend static — FE-01/05
- IaC / Dockerfile presence — PERF-02/06
- Terraform/cloud-config drift hints — PERF-06

**Estimated-only bucket (v1)**: the ~15 rows that are A-tier but only pattern-statically provable (ARCH-06/07/10, ECOS-04, SEC-04, API-04/05, DATA-07, VEL-02/07, PERF-01/07, DOCS-02/06, FE-04/06). These always carry `confidence` and the 1–2 clamp (`02` §2).

---

## 5. B-tier static proxies that ship in v1

These are *signal-only*; they do not claim B-grade certainty:

| Indicator | Static proxy shipped | Caveat (always in copy) |
|-----------|---------------------|-------------------------|
| TEST-01 coverage | coverage artifact in Actions logs / `coverage/` dirs | "coverage seen in CI artifacts; lineage unverified" |
| TEST-04 run time | Actions `job.duration` when available / workflow shape | "not a full CI history" |
| TEST-06 core untested | test files adjacent to core module heuristics | low confidence, business-criticality map missing |
| VEL-01 build latency | Actions run durations (public repos) | elapsed-time signal only |
| VEL-04 deploy freq | GH releases/deployments API event timestamps | tag-based proxy, not true deploy logs |
| PERF-05 autoscaling | HPA/ASG blocks in IaC | presence/absence proof only |

Everything else in B (TEST-02/07/09, VEL-03/10, ECOS-09) is **v2 deep scan** (opt-in paid), per `10_ROADMAP.md`.

---

## 6. The gating rule (from `02` §5)

- A gate fires as `proven` only when evidence-backed. In v1 the only *provable-from-URL* gates are:
  - **G1** credential exposure (SEC-02 — gitleaks/trufflehog on tree + history)
  - **G2** critical CVE > 14d exposed (SEC-01 — dependabot/trivy data, with "exposed path" assumed unknown → report as `needs-verification` unless explicitly a reachable path exists)
  - **G3** runtime EOL, no path out (ECOS-01/08 — endoflife.date + lockfile; "no path" inferred = `estimated`)
  - **G5** untested core (TEST-06 — via the static proxy, `estimated`)
- G4 (OWASP reachable) and G6 (CFR > 30% + manual deploys) are **C-tier** → `needs-verification` in v1; they are the top-two items on every report's deep-dive-shop list.
- **Verdict cap** from `00_EXECUTIVE_RUBRIC.md` Part 0 applies only to `proven` gates.

A `needs-verification` gate is never scored; it is surfaced as a top blocker with the "what it takes to measure" emission (this is the M&A upsell, `09`).

---

## 7. What a v1 report must contain (contract, not mock)

1. Headline score + tier verdict (`02` §3).
2. Coverage bar by category (`measured`/`estimated`/`unknown`).
3. Per-indicator rows with status, score (0–3 or blank), evidence/basis, remediation (from rubric).
4. Gate table (G1–G6) with `proven`/`not-proven`/`needs-verification`.
5. Top-3 blockers + recommended 90-day plan (drawn from rubric remediation playbooks).
6. Unknown-list appendix with "what it takes to measure" per row.
7. Scan metadata: engine version, rubric version, tool versions, elapsed time, repo commit sha scanned.

Schema shape: `06_DATA_MODEL_API.md`.

---

## 8. Exit criteria for v1 (definition of done)

- [ ] ~~Engine~~ completed above: the slice matrix is truthful — every `measured` row has evidence, every `estimated` row a label.
- [ ] 5-repo cross-check quiz (`03` §last) passes with the expected measured/estimated/unknown split and no `measured` false-positives.
- [ ] A public-repo demo reports in < 5 min and renders all 7 report sections.
- [ ] M&A dry-run: same repo, `measured`-only tally derivable; `unknown` list produces a human-planning-worthy deep-dive checklist.
- [ ] No repo's code executed anywhere in the pipeline (security review passes).

---

## 9. Explicitly out of v1 (doesn't get unbudgeted creep)

- Test-suite execution, mutation testing, flake detection (v2 deep scan).
- Live-environment/D-tier indicators (stayed `unknown`).
- LLM-generated remediation that is not rubric-derived.
- Batch org-scoring (v1 is single-URL; a `/batch` endpoint for orgs comes with the M&A App in `10`).
- Frontend annex as a scored module until a repo with a client is decided in OQ5.