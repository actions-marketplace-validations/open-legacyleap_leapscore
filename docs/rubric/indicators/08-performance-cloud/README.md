# 08 — Performance & Cloud/Infrastructure Fit

> **Category charter.** Standard indicators: PERF-01–PERF-08 · Deep-dive indicators: PERF-09–PERF-10
>
> Indicator definitions, implementation recipes, fact schemas, status predicates, gates, and evidence now live together in the linked unified files. This charter is the category index: it states the category thesis and membership. Weights are canonical in [`model/config.md`](../../model/config.md) §1 and are not restated here.

**Thesis:** The runtime is a verdict on the architecture. A system that leaks memory, can't observe itself, and refuses to scale isn't "mildly inefficient" — it's telling you its design era on every request.
**Category summary:** Scores how the system runs under load and how well it fits modern infrastructure expectations — observability, deployment model, resource behavior, scalability, infrastructure-as-code, SLO/perf disciplines, runtime footprint, cost efficiency, and resilience.

## Indicators

| ID | Indicator | Tier | Default status | v1 | Gates | Rollup | Verify effort | Canonical file |
|---|---|---|---|---|---|---|---|---|
| PERF-01 | Observability Gaps | B | measured | YES | none | standard · folds into PERF category % | 🔶 ~2–4 h | [unified](./PERF-01-observability-gaps.md) |
| PERF-02 | Legacy Deployment Model | B | estimated | YES | none | standard · folds into PERF category % | 🔶 ~2–4 h | [unified](./PERF-02-legacy-deployment-model.md) |
| PERF-03 | Resource Waste / Leakage | B | unknown | NO | none | standard · folds into PERF category % | 🔷 ~1–2 days | [unified](./PERF-03-resource-waste-leakage.md) |
| PERF-04 | Monolithic Scaling Bottleneck | B | estimated | NO | none | standard · folds into PERF category % | 🔷 ~1–2 days | [unified](./PERF-04-monolithic-scaling-bottleneck.md) |
| PERF-05 | No Auto-Scaling / Capacity Planning | B | estimated | PART | none | standard · folds into PERF category % | 🔶 ~2–4 h | [unified](./PERF-05-no-auto-scaling-capacity-planning.md) |
| PERF-06 | Missing IaC / Config Drift | A | estimated | YES | none | standard · folds into PERF category % | 🔶 ~2–4 h | [unified](./PERF-06-missing-iac-config-drift.md) |
| PERF-07 | No SLOs / Performance Budgets | C | unknown | PART (candidate) | none | standard · folds into PERF category % | 🔶 ~2–4 h | [unified](./PERF-07-no-slos-performance-budgets.md) |
| PERF-08 | Runtime Waste & Startup Latency | B | measured | NO | none | standard · folds into PERF category % | 🔶 ~2–4 h | [unified](./PERF-08-runtime-waste-startup-latency.md) |
| PERF-09 | Cost Efficiency / FinOps | B | unknown | NO | none | deep-dive · `folds_into: PERF` | 🔷 ~1–2 days | [unified](./PERF-09-cost-efficiency-finops.md) |
| PERF-10 | Disaster Recovery & Resiliency | D | unknown | NO | none (complements DATA-06's G7 on the backup half; DR-drill half stays human) | deep-dive · `folds_into: PERF` | 🔷 ~1–2 days | [unified](./PERF-10-disaster-recovery-resiliency.md) |

## Shared configuration

Weights, formulas, bands, applicability vocabulary, and gate definitions are canonical in [`model/config.md`](../../model/config.md). The generated score sheets are derived views in [`sheets/`](../../sheets/).
