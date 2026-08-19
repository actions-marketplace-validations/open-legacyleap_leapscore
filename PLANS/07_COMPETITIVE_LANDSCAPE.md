# 07 — Competitive Landscape

> What already exists, what it covers, and the gap LeapScore fills. Source-grounding note: verify each tool's current pricing/status before quoting in sales materials; this doc records the landscape as of writing.

---

## 1. The landscape by capability

| Category | Tools | Coverage | Gaps (that LeapScore fills) |
|---|---|---|---|
| **Repo score + per-check reasons** | OpenSSF **Scorecard** (free/OSS), OpenAnalyzer-style community scorers | Scorecard: 0–10 across ~19 **security & supply-chain** checks (SAST, CI, code-review, signing, pinned deps, fuzzing, license, contributors) with per-check reasons and a public API | Security-only. No architecture/velocity/data/docs dimensions, no weightings, no tiered verdict, no remediation narratives, no `unknown` honesty model |
| **Stack/SaaS quality + SAST** | **SonarQube/SonarCloud**, **CodeClimate**, **DeepSource** (freemium; SW self-host OSS) | Complexity, duplication, bugs/smells, coverage, vulnerabilities; maintainability grades A–F | Single-axis maintainability; no legacy verdict, no scoring taxonomy, no reports-to-remediation workflow |
| **Dependency / license / package** | **Snyk**, **Dependabot** (free GH-native), **Renovate** (OSS), **Trivy**/Grype, **OSV-Scanner**, **Socket.dev** (freemium) | Vulns, SBOM, licenses, malware/provenance, patch cadence signals | All are *sensors*; none roll up into a maintainability verdict across categories |
| **Secret scanning** | **Gitleaks**, **TruffleHog** (OSS), GitHub secret scanning | Tree + history secret detection | Sensors again |
| **Git/business analytics** | **CodeScene** (freemium/paid), **Pluralsight Flow**, **LinearB** (freemium), **Sleuth/Faros** (paid/OSS), GitPrime | Hot spots, churn, DORA metrics, review analytics | Focused on *delivery*; no engineering-health rubric, ownership of a legacy verdict weak |
| **Full maintainability index** | **Sigrid (SIG, Software Improvement Group)** — paid | ISO-25010 maintainability rating, volume/duplication/unit size, quality-levels per ISO; an actual applied rubric across 9 languages | Closest *philosophical* cousin. Focused on maintainability of *acting* code; does not carry this catalog's Security/Data/API/Velocity layers as a weighted verdict; no freemium/URL-to-report UX |
| **Application intelligence / modernization** | **CAST AIP / CAST Imaging** — enterprise | Health index, technical debt, architecture/business-impact analysis, modernization pathways | Heavy enterprise sales cycle, on-prem hosts, proprietary weighting; not a freemium URL score |
| **CI/CD / DORA** | **GitHub native**, **GitLab**, **Renovate dashboards** | Feed indicators only | — |

---

## 2. The two closest incumbents (naming the fight)

1. **Scorecard** — the free, credible *"give me a URL, get a 0–10 with reasons"* benchmark. If a buyer says "isn't this Scorecard?" the answer is: *Scorecard tells you supply-chain risk in ten checks; LeapScore scores the whole rubric — dependency, architecture, testing, security, data, API, velocity, perf, docs — and every lost point carries a remediation path.* We are not re-scanning what Scorecard scans; we *orchestrate* it (and its friends) and add the rubric layer.
2. **Sigrid/CAST** — the enterprise "maintainability index" incumbents. They are heavy, on-prem/enterprise, and sell *engagements*. LeapScore's URL-to-report in minutes + freemium entry is a wedge they structurally can't chase; their strength (deep, ground-truth maintainability) is exactly what LeapScore's `deep_dive_scope` product upsells toward.

---

## 3. The gap (what the market does not offer)

| What | Evidence of the gap |
|---|---|
| **URL → weighted legacy verdict (0–100) with per-point reasons + remediation** in minutes, free | Nothing in the table does this in one shot |
| **Honest `measured`/`estimated`/`unknown` model** (no hallucinated confidence) | Nothing publishes a coverage/confidence layer at all — the "measured-only vs estimated" honesty is distinctive |
| **Multi-category rubric** (security AND architecture AND data AND velocity…) as one weighted number | Scorecard = security; SIG/CAST = maintainability; no one spans the whole catalog this rubric defines |
| **M&A-grade gates (G1–G6) with a machine-generated deep-dive scope** | Incumbent diligence is spreadsheet + consultancy time; automating the `unknown`-list *is* the differentiator for M&A |
| **Freemium + private-repo same-engine** | Incumbents sell the deep thing to enterprises; no one tool dominates both the demo-able URL score and the private diligence engine |

## 4. Strategic positioning sentence

> **"Scorecard scores your supply chain. Sonar scores your code smells. LeapScore scores your entire legacy pickle — and tells you, in plain numbers and reasons, what it would take to leave it."**

---

## 5. Complements (things we integrate, not rebuild — D7)

Scorecard, Snyk/Socket/Trivy/OSV, Gitleaks/TruffleHog, SonarQube-cli, CodeClimate (optional), `endoflife.date`, GitPrime-style mining, Dependabot/Renovate data. The "build" is: orchestrating these, mapping their output into the 97-row rubric, and adding the report/UX + M&A view on top (see `05`).

---

## 6. Watch-list (may shift the plan)

- **CodeScene** shipping more "health score"-style packs.
- **GitHub** native "governance" surfaces evolving to bundle vulnerability/scorecard-style health in a repo page.
- **Sigrid** adding a freemium SaaS URL flow (they have a demo site for OSS repos).
- Consolidation in the DORA/velocity SaaS into the SCM platforms (LinearB/Sleuth buying pressure).

None of these threaten the core gap (§3) as of writing, but they inform the roadmap speed in `10`.