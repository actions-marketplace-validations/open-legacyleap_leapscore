# 01 — Dependency & Ecosystem Health

> **Canonical category index.** Base weight: 10% · FE-active weight: 9% · Standard indicators: ECOS-01–ECOS-08 · Deep-dive indicators: ECOS-09–ECOS-10
>
> Indicator definitions, implementation recipes, fact schemas, status predicates, gates, and evidence now live together in the linked unified files. This page is navigation only.

**Thesis:** Dependencies are a codebase's circulatory system. When the surrounding ecosystem moves faster than the code, every fix, audit, and hire gets harder—and eventually impossible.
**Category summary:** Measures runtime support, dependency freshness and maintenance, license posture, and supply-chain reproducibility. These signals can degrade without code changes as runtimes and dependencies age.

## Indicators

| ID | Indicator | Tier | Default status | v1 | Gates | Rollup | Verify effort | Canonical file |
|---|---|---|---|---|---|---|---|---|
| ECOS-01 | Runtime/Language EOL | A | estimated | YES | **G3** — Runtime EOL, no path out | standard · folds into ECOS category % | ⚡ ≤30 min | [unified](./indicators/01_DEPENDENCY_ECOSYSTEM/ECOS-01_runtime-language-eol.md) |
| ECOS-02 | Major Package Drift | A | estimated | YES | none | standard · folds into ECOS category % | ⚡ ≤30 min | [unified](./indicators/01_DEPENDENCY_ECOSYSTEM/ECOS-02_major-package-drift.md) |
| ECOS-03 | Abandoned / Unmaintained Libraries | B | estimated | YES | none | standard · folds into ECOS category % | ⚡ ≤30 min | [unified](./indicators/01_DEPENDENCY_ECOSYSTEM/ECOS-03_abandoned-unmaintained-libraries.md) |
| ECOS-04 | Deprecated API Usage | B | estimated | YES | none | standard · folds into ECOS category % | ⚡ ≤30 min | [unified](./indicators/01_DEPENDENCY_ECOSYSTEM/ECOS-04_deprecated-api-usage.md) |
| ECOS-05 | License Compliance Risk | B | measured | YES | **G8** — copyleft in closed-source distribution | standard · folds into ECOS category % | 🔶 ~2–4 h | [unified](./indicators/01_DEPENDENCY_ECOSYSTEM/ECOS-05_license-compliance-risk.md) |
| ECOS-06 | Dependency Bloat | A | estimated | YES | none | standard · folds into ECOS category % | ⚡ ≤30 min | [unified](./indicators/01_DEPENDENCY_ECOSYSTEM/ECOS-06_dependency-bloat.md) |
| ECOS-07 | Build Reproducibility & Lockfile Integrity | A | measured | YES | none | standard · folds into ECOS category % | ⚡ ≤30 min | [unified](./indicators/01_DEPENDENCY_ECOSYSTEM/ECOS-07_build-reproducibility-lockfile-integrity.md) |
| ECOS-08 | Framework Lock-in & Monoculture Risk | A | estimated | YES | co-drives **G3** with ECOS-01 when framework is EOL in core | standard · folds into ECOS category % | ⚡ ≤30 min | [unified](./indicators/01_DEPENDENCY_ECOSYSTEM/ECOS-08_framework-lock-in-monoculture-risk.md) |
| ECOS-09 | Version Skew Across Services | A | estimated | **PART** — only for in-repo multi-service layouts (monorepo); org-wide skew is v2 | none | deep-dive · `folds_into: ECOS` | 🔷 ~1–2 days | [unified](./indicators/01_DEPENDENCY_ECOSYSTEM/ECOS-09_version-skew-across-services.md) |
| ECOS-10 | Supply-Chain: Typosquatting, Malware, & Registry Risk | B | measured | YES | none (incident-level findings escalate via SEC-06 overlap, not here) | deep-dive · `folds_into: ECOS` | 🔷 ~1–2 days | [unified](./indicators/01_DEPENDENCY_ECOSYSTEM/ECOS-10_supply-chain-typosquatting-malware-registry-risk.md) |

## Shared configuration

Weights, formulas, bands, applicability vocabulary, and gate definitions are canonical in [`11_WEIGHTS_THRESHOLDS_CONFIG.md`](./11_WEIGHTS_THRESHOLDS_CONFIG.md). The executive rubric and score-sheet templates are derived views.
