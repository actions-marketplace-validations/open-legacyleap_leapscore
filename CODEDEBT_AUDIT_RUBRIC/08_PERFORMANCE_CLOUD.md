# 08 — Performance & Cloud/Infrastructure Fit

> **Weight:** 10% · **Standard:** PERF-01…08 · **Deep-dive:** PERF-09, 10
>
> **One-line thesis:** The runtime is a verdict on the architecture. A system that leaks memory, can't observe itself, and refuses to scale isn't "mildly inefficient" — it's telling you its design era on every request.

**Category summary:** Scores how the system runs under load and how well it fits modern infrastructure expectations — observability, deployment model, resource behavior, scalability, infrastructure-as-code, SLO/perf disciplines, runtime footprint, cost efficiency, and resilience.

---

## Standard indicators

### PERF-01 — Observability Gaps
- **Definition:** The system cannot answer basic questions about its own runtime — no structured metrics (RED/USE), no distributed tracing (or tracing only in the new corner), no meaningful logging conventions, and debugging is done by SSH-ing and tailing raw output.
- **Why it signals obsolescence:** Observability is the feedback loop of operations — "what is the system doing right now?" A system without it is run by flashlight. Modern practice (OpenTelemetry, metrics, logs, traces + SLOs) is a baseline; its absence forces archaeology on every incident and every performance question, and it silently blocks most modernization (you can't improve what you can't measure).
- **Where it manifests:** No metrics endpoint/agent, `print`/`console.log` as the observability layer, no correlation between request and logs, no distributed tracing across services, debugging prod by `ssh` + `tail -f`, "why is it slow" answered by screenshots.
- **Detection method:** Instrumentation audit — is the app emitting metrics/logs/traces via a standard (OpenTelemetry/SLf4j/Prometheus)? Are logs structured (JSON), correlated (request IDs)? Is tracing present across service boundaries? Time a "why is this slow" question end-to-end and count how long it takes to answer with current tooling.
- **Objective metric:** `metrics/logs/traces coverage % (service × [m,l,t])`; `log correlation coverage %`; `time-to-answer a latency question`; `OpenTelemetry adoption %`.
- **Yellow flag (warning):** Logs exist but unstructured/poorly correlated; metrics partial; tracing missing across microservices. *(Rationale: warning — you can see something, not everything.)*
- **Red flag (critical):** No structured metrics at all; debugging prod requires SSH + raw log tailing; latency/errors invisible to any dashboard. *(Rationale: you are operating blind — every incident is archaeology and every perf fix is a guess.)*
- **Example symptom:** "The paging service is 'slow today.' No dashboard shows it. An engineer SSH's in, `tail`s a log file written with `console.log`, greps a timestamp, and 'maybe' finds the answer 40 minutes later. Rinse, repeat, weekly."
- **Blast radius:** Incident MTTR, performance diagnosis, capacity planning, SLOs (impossible without metrics), modernization decision data, security visibility.
- **Remediation playbook:** Quick win: add structured logging + request IDs everywhere (framework middleware), stand up a metrics endpoint with RED/U; USE basics, emit the top 6 metrics. Structural fix: OpenTelemetry adoption (auto-instrumentation), tracing across services, an SLO + error-budget loop, observability as a deployment requirement (no deploy without instrumentation).
- **Gold standard / target state:** Every service emits metrics/logs/traces standardly, requests are correlated end-to-end, dashboards answer latency/errors/capacity in seconds, and "why is it slow" never requires SSH.
- **Scoring guidance:** 3 = OTel-standard full coverage; 2 = partial; 1 = logs-only, no metrics/tracing; 0 = blind operational flashlight.
- **Verify effort:** 🔶 ~2–4 h — instrumentation audit + timed diagnosis.

### PERF-02 — Legacy Deployment Model
- **Definition:** The system runs on bare metal/VMs or a hand-managed fleet where servers are purchased, configured by hand (or by fragile scripts), statefully modified over time, and replaced/infra changes are a project rather than a deployment concern.
- **Why it signals obsolescence:** The deployment model is infrastructure's era stamp. Containerization + orchestration + immutable infra is the modern baseline because it's reproducible, scalable, and auditable; the pre-container model is slow, snowflake-prone, and is where "upgrades" become multi-week efforts. Not every VM is legacy — but VMs configured by throwing commands at them are.
- **Where it manifests:** `ssh`-configured servers, golden images that drift after setup, no containers anywhere, capacity added by buying/allocating a VM, deploys that are "git pull on the host," snowflake servers named after the intern who set them up, no immutable/rebuilt concept.
- **Detection method:** Infra inventory — deployment targets and provisioning method (Terraform/cloud-init/Ansible vs. hand-run commands), containerization %, image-build pipeline for the app, drift between nominally-identical hosts, "how would you add a 2nd instance?" test (this answer reveals the model).
- **Objective metric:** `% of workloads containerized`; `% infra provisioned by IaC`; `host drift count`; `time-to-add-an-instance`; `deploy path (immutable artifact vs. mutate-in-place)`.
- **Yellow flag (warning):** Partial containerization/IaC; some VMs still configured by scripts; a couple of snowflakes. *(Rationale: warning — the migration is underway but incomplete.)*
- **Red flag (critical):** Bare-metal/VM with manual stateful modifications as the standard; scale = "buy a bigger server." *(Rationale: every env change is a project and every size change is a downtime.)*
- **Example symptom:** "Prod is three VMs 'configured by a script that lives on the ops guy's laptop.' Adding a 4th took two weeks and still drifted. Scaling for the holiday spike meant ordering hardware. 'Containerize' elicits 'we tried once, didn't finish.'"
- **Blast radius:** Scale speed, provisioning cost, drift bugs, deploy risk, disaster recovery (rebuild from what?), modernization sequencing.
- **Remediation playbook:** Quick win: containerize the app (it's usually the smallest step), move VM provisioning to IaC (Terraform/cloud-init), codify the laptop script. Structural fix: immutable, containerized, orchestrated deployment (K8s/ECS) with IaC for everything, auto-scaling-ready, snowflakes eliminated by rebuild-from-code.
- **Gold standard / target state:** Everything containerized + IaC-managed, instances are cattle (rebuildable in minutes), scale is a config change, drift impossible by construction.
- **Scoring guidance:** 3 = containers + IaC; 2 = partial; 1 = VMs + IaC-light; 0 = hand-configured snowflakes.
- **Verify effort:** 🔶 ~2–4 h — infra inventory + "add an instance" test.

### PERF-03 — Resource Waste / Leakage
- **Definition:** The system leaks or wastes resources as routine — memory leaks that force scheduled restarts, unbounded caches, connection/thread sprawl, oversized instances, or processes that degrade until reboot.
- **Why it signals obsolescence:** Leaks are the runtime's passive decay: the system gets worse the longer it runs, and the fix ("restart it weekly") is a maintenance ritual, not an engineering answer. Bounded caches and clean resource handling are baseline expectations; their absence points to code that predates memory hygiene and to infrastructure tuned by folklore.
- **Where it manifests:** Scheduled restarts to "clear memory," unbounded in-memory caches/`HashMap` growth, connection-pool leaks, goroutine/thread sprawl, restarts-of-record in the on-call runbook, "memory looks weird" tickets, oversized instances rented so a leak fits.
- **Detection method:** Profiling — py-spy/`pprof`/JVM heap + GC logs/`dotnet` diagnostics over time (grab snapshots pre/post "fixing restartus"), memory-graph growth analysis (heap grows linearly until OOM?), cache-size inspection, connection pool metrics, restart logs correlated with memory; cloud cost analysis for instance oversizing.
- **Objective metric:** `mean time-to-OOM (if restart-driven)`; `heap growth slope per hour`; `% of restarts attributed to memory`; `unbounded-cache count`; `instance utilization % (waste)`.
- **Yellow flag (warning):** Scheduled off-peak restarts to manage memory, some unbounded caches, moderate waste. *(Rationale: warning — the manifest ritual is in place; the leak is real but managed.)*
- **Red flag (critical):** Process crashes under *standard* load due to memory leaks, or leaks that no one knows are leaks (restart-on-cron as tradition). *(Rationale: availability is being bought with restarts — the runtime is decaying in plain sight.)*
- **Example symptom:** "The rule is 'restart the order worker at 2am Tuesday.' The team can't remember why; the log shows OOM kills weekly. A `pprof` snapshot shows a cache keyed by customer session that never expires — 40 GB of yesterday's sessions."
- **Blast radius:** Availability (OOM crashes), cost (oversized instances), on-call rituals, latency degradation with uptime, data integrity (crashed mid-write).
- **Remediation playbook:** Quick win: profile to find the leak(s), bound the caches (TTL + size limit), fix the top 3 resource leaks, enable heap diagnostics. Structural fix: memory discipline as a code review concern, load tests that run > 24h to expose slow leaks, resource limits + monitoring (RSS trend), right-size instances to reality.
- **Gold standard / target state:** No restart ritual; heap flat over weeks; caches bounded and sized deliberately; utilization reviewed; no OOM under 3–5× load.
- **Scoring guidance:** 3 = no leak, high utilization; 2 = restart ritual in place; 1 = leaks under spikes; 0 = regular crashes at standard load.
- **Verify effort:** 🔷 ~1–2 days — profiling + memory monitoring.

### PERF-04 — Monolithic Scaling Bottleneck
- **Definition:** The system can only scale vertically — the DB or the app can't split, shard, or go horizontal, so traffic growth means bigger instances and eventually a wall, with lock/content/state preventing distribution.
- **Why it signals obsolescence:** A single point that must get bigger is an architectural ceiling: it caps growth at the size of one machine and makes spikes a purchasing problem. Modern scale is *distribution* (horizontal + sharding + decompositions); the inability to distribute is the design signature of a pre-scale era — and of a system that has spent its "scale budget" (DATA-05 is the DB half).
- **Where it manifests:** "We scaled to 64 vCPU, 256 GB," vertical-only guidance, state in-memory that can't be shared, a DB lock/statelessness wall, sharding "impossible because of joins," a single writer bottleneck, load tests that hit a wall at N instances.
- **Detection method:** Scale experiment — load test with increasing instance count (k6/Locust/artillery) and measure per-add throughput; check for horizontal levers (stateless app? read replicas? sharding? caching?). DB analysis (DATA-05), in-memory session/state audit (what would need to change to run 2 instances?), auto-scale feasibility.
- **Objective metric:** `throughput gain per additional instance (horizontal efficiency %)`; `max horizontal scale factor`; `DB dependents (single-writer env: read replicas/sharding possible?)`; `instance count ceiling`.
- **Yellow flag (warning):** Horizontal scaling partially works (e.g., Iapplication scales, DB replica path limited, spikes absorbed vertically). *(Rationale: warning — a wall exists ahead, not yet hit.)*
- **Red flag (critical):** Only way to grow is a bigger instance; adding instances adds nothing (stateful app or DB bottleneck); or the largest available instance is approaching. *(Rationale: a hard ceiling on growth — the next spike is a purchase or a collapse.)*
- **Example symptom:** "Black Friday prep: load test says the app tops out at 2 instances — a shared session cache and one DB writer flatten everything after that. The 'solution' is to rent a 128 vCPU box for the week. The budget line is real."
- **Blast radius:** Growth ceiling, spike discounts/capacity purchases, cost, availability under load, feature velocity (every scale fix is architectural).
- **Remediation playbook:** Quick win: statelessness fixes (move session/key state to a distributed store), add read replicas + a cache tier to lift the DB ceiling, shard the hottest table. Structural fix: the scalability roadmap — decompose the hot path (bounded contexts, API/events per DATA-02), sharding strategy, and a horizontal-efficiency load-test gate (new instance must add value).
- **Gold standard / target state:** Adding instances scales throughput linearly past the previous wall; vertical spending is an exception not a norm; load tests prove horizontal efficiency.
- **Scoring guidance:** 3 = horizontally efficient; 2 = partially horizontal, vertical safety valve; 1 = wall visible, vertical-only for spikes; 0 = instance-size ceiling, growth ≈ new hardware.
- **Verify effort:** 🔷 ~1–2 days — load-test scale experiment.

### PERF-05 — No Auto-Scaling / Capacity Planning
- **Definition:** Capacity is static and manual — no autoscaling (still "provision for the peak"), no capacity planning discipline, load surprises hit prod, and scaling is done by humans reacting to pages.
- **Why it signals obsolescence:** Static capacity is a choice between wasting money (peaks provisioned always) or failing (demand exceeds fixtures). Autoscaling + telemetry-driven planning is the modern baseline; its absence means the system "hopes" about demand — and hope is where outages come from. Pairs with PERF-03/04; this is the *policy* while those are the *mechanics*.
- **Where it manifests:** No HPA/ASG, instance counts hand-set, "scale up" is a runbook action, capacity reviews happen after incidents, no load forecasting, spikes trigger "we need more servers" tickets, employee sales events' traffic is a surprise.
- **Detection method:** Capacity-telemetry audit — autoscaling configs (HPA/ASG policy present?), utilization history (was there headroom waste?), past incident spikes vs. allocation, forecasting/load-testing cadence, "what triggered the last 3 scale-ups?" (human or system?).
- **Objective metric:** `autoscaling coverage % of workloads`; `utilization % (waste)` and `max-utilization incidents`; `time to add capacity (human vs. system)`; `load-test cadence`.
- **Yellow flag (warning):** Some HPA/ASG; manual ceiling for critical services; capacity reviews ad hoc. *(Rationale: warning — the machinery is partial, humans still in the loop.)*
- **Red flag (critical):** No autoscaling at all, capacity is a manual sizing decision, or a peak load event caught the system flat-footed in the last 12 months. *(Rationale: you are one spike from an outage and one off-peak from waste.)*
- **Example symptom:** "The marketing drop is a surprise. 10pm: 'check the dashboard.' 11pm: 'we need 3 more instances.' 1am: someone writes a ticket for capacity. Had the team set an HPA, the drop would've been a non-event."
- **Blast radius:** Availability under spikes, cost (always-peak provision), on-call heroics, growth surprises, feature campaigns.
- **Remediation playbook:** Quick win: set HPA/ASG on the top 5 workloads with sane thresholds, add utilization + headroom dashboards, run the scheduled-campaign checklist. Structural fix: autoscaling everywhere + telemetry-driven capacity reviewing (monthly), load-testing against forecast demand, SLO-based scaling decisions.
- **Gold standard / target state:** Autoscaling covers critical workloads; capacity changes are system-driven by policy; spikes are non-events; waste is continuously right-sized.
- **Scoring guidance:** 3 = autoscaled everything; 2 = partial, manual for critical; 1 = manual scaling with dashboards; 0 = no scaling machinery, hand-on-dial.
- **Verify effort:** 🔶 ~2–4 h — config audit + utilization history.

### PERF-06 — Missing IaC / Config Drift
- **Definition:** Infrastructure is not defined in code — servers/networks/load-balancers/queues are created and modified through consoles or scripts, with no reproducible declaration, so environments drift and rebuilding anything is a project.
- **Why it signals obsolescence:** IaC is the difference between infrastructure being a *reproducible artifact* and being *an accumulation of manual acts*. Without it, nothing infra can be reproduced, upgraded, or audited cheaply (the 12-factor-adjacent "treat servers as cattle" baseline). Config drift is the operational symptom: nominal-identical envs that differ in invisible ways.
- **Where it manifests:** Terraform/CloudFormation/Pulumi absent or < 50% coverage, infra built by clicking (console), "how is our VPC configured?" answered with screenshots, config changes made directly on resources with no precedent, snowflake envs, no drift detection.
- **Detection method:** IaC coverage audit — inventory resource types vs. what's declared in code (state file + code search), config-change audit trail (were changes made by CI/Terraform or by console?), drift-check runs against the declared state, rebuild-and-compare test (build env from code, diff).
- **Objective metric:** `IaC coverage % of resources`; `# of console-done infra changes (last 90 days)`; `drift count between declared & actual`; `time to rebuild an environment from code`.
- **Yellow flag (warning):** Partial IaC (core resources coded), some console drift, rebuild needs a helping hand. *(Rationale: warning — the foundation exists, discipline is leaking.)*
- **Red flag (critical):** No IaC for most resources, environments only explainable by the person who clicked them, or a rebuild is effectively impossible. *(Rationale: infra is memory — regeneration capacity is zero, and DR is theatrics unless this is fixed.)*
- **Example symptom:** "The staging RDS was created in the console 'three years ago, by Jeremy.' Terraform covers 4 resources. The DR drill tries to rebuild the environment — and dies because nobody can reconstruct the security groups. The drill is 'rescheduled.'"
- **Blast radius:** DR readiness, environment rebuilds, audit, drift bugs, scale (IaC is the lever), security (configured-by-accident infra).
- **Remediation playbook:** Quick win: adopt Terraform/Pulumi for the top resource types (VPC/DB/compute), add drift detection (initial run finds the gap), codify the "documented console changes" retroactively. Structural fix: full IaC coverage with state remote + plan-diffs in CI, admin access least-privilege, rebuild-from-code as a tested path, drift = CI failure.
- **Gold standard / target state:** Everything in code, changes flow through CI-plan-review, drift is zero or alerted, and rebuilding an env is an afternoon exercise.
- **Scoring guidance:** 3 = full IaC + drift gate; 2 = partial coverage; 1 = scattered IaC, console dominant; 0 = no IaC, irreproducible infra.
- **Verify effort:** 🔶 ~2–4 h — resource vs. code audit + drift run.

### PERF-07 — No SLOs / Performance Budgets
- **Definition:** The system has no service-level objectives, no latency/availability budgets, no performance regression gates, and no load-testing baseline — "fast enough" means "nobody complained loudly today."
- **Why it signals obsolescence:** SLOs are how performance stops being a mood. Their absence means performance debt is invisible until users revolt, and every "is it OK now?" is a vibes check. Modern practice (latency budgets, error budgets, load-test baselines, perf regression gates in CI) turns performance into a verifiable property. A system without budgets can't even *see* that it's obsolete.
- **Where it manifests:** No latency targets, no error-budget tracking, p95 unknown, "it got slower" with no baseline, no load test in CI, perf regressions discovered by user complaints, "SPOF acceptable" undocumented.
- **Detection method:** SLO inventory — documented latency/availability SLOs per service? Are they *measured* (dashboards alert on budget burn)? Is there a perf regression gate in CI (load test on every PR? synthetic checks)? Baseline latency chart available? Error budgets defined and traded?
- **Objective metric:** `services with documented+measured SLOs %`; `error-budget burn alerting?`; `perf gate in CI (load/synthetic)?`; `latency baseline exists + tracked`; `perf-regression incidents found by users (last 12 mo)`.
- **Yellow flag (warning):** Informal latency targets for some services, no error budgets or CI gate, no perf baseline. *(Rationale: warning — performance is a feeling, not a number yet.)*
- **Red flag (critical):** No SLOs or budgets anywhere, no perf gate or baseline, and perf regressions reach users undetected. *(Rationale: performance decay is structurally invisible — the system quietly gets worse and nobody can say no.)*
- **Example symptom:** "CTO: 'the app feels slow lately.' Nobody can quote a number — p95 was never captured. A feature shipped that added 400ms on the hot path; no baseline-run caught it. 'Feels slow' is the only fault-reporting mechanism."
- **Blast radius:** User experience decay, growth (perf is a growth lever), cost (perf bugs manifest as infra spend), incident severity, trust.
- **Remediation playbook:** Quick win: define SLOs for the top 3 services (latency p95 + availability), measure them with the metrics you added (PERF-01), add a synthetic check for the money path. Structural fix: error budgets + burn alerts, a CI perf gate (load-test baseline run on PRs), latency regression reports in the deploy loop, SLO review as a ritual.
- **Gold standard / target state:** Every service has an SLO, measured and burned-alerted; CI catches perf regressions; latency baselines are historical and trusted.
- **Scoring guidance:** 3 = SLOs everywhere + gates; 2 = some services measured; 1 = informal targets; 0 = no numbers at all, drift by feeling.
- **Verify effort:** 🔶 ~2–4 h — SLO inventory + baseline availability.

### PERF-08 — Runtime Waste & Startup Latency
- **Definition:** The runtime itself is heavy — minutes-long cold starts, huge memory footprints at idle, no lazy initialization, heavy boot-time work in every process, or a runtime chosen for era reasons that makes every action expensive.
- **Why it signals obsolescence:** Startup latency/footprint is a direct cost of era-technical choices: it kills autoscaling value (cold adds take too long), wastes money at idle, and makes interactive tooling sluggish. It's a *micro*symptom that compounds into *macro*costs, and it's typical of "framework-everything" legacy builds.
- **Where it manifests:** Cold start > 60s–minutes, idle footprint > 1+ GB per worker, everything initialized at boot (JIT-heavy, DI everything, loading 400 classes), no lazy loading, containers that take too long to be useful, "the app takes forever to restart" on deploy.
- **Detection method:** Startup profiling — time from process start to first request served (with and without warm cache), memory snapshot at idle (RSS), profiler breakdown of startup time (what initialized? greedy scans? JIT?), container/image size and init work, comparison vs. a lean baseline.
- **Objective metric:** `cold-start time P50/P95`; `idle RSS per process`; `startup-time breakdown (top items)`; `image/size and fixed init work`; `time-to-scale (adding an instance from cold)`.
- **Yellow flag (warning):** Cold start 30–60s, idle footprint notable, lazy init partial. *(Rationale: warning — model cost, tolerable at low scale.)*
- **Red flag (critical):** Minutes-long cold starts (kills autoscaling), or huge idle footprints (bankrupt-on-scale players), or restart is so slow deploys are painful. *(Rationale: the runtime tax is bigger than the code it carries.)*
- **Example symptom:** "Every new instance takes 3 minutes to become useful; scaling for a burst is pointless — by 3 minutes the burst is over. Idle JRockit-era app sits at 2.1 GB doing nothing. Autoscaling was 'tried' and abandoned."
- **Blast radius:** Autoscaling viability, idle cost, deploy pain, image size, dev inner loop (VEL-09), marginal perf of every cold action.
- **Remediation playbook:** Quick win: lazy-init the greedy startup work, trim the boot-time DI/registrations, enable JVM/cache warmup layers. Structural fix: runtime modernization (container-native runtimes, startup budget with a gate, deferred-cost architecture), image size budgets, "cold start < 10s" as an autoscaling prerequisite.
- **Gold standard / target state:** Cold start < 10–15s, idle footprint proportional to need, autoscaling actually scales because instances become useful fast, zero "startup work" that could be lazy.
- **Scoring guidance:** 3 = lean startup; 2 = moderate (30–60s); 1 = minutes + heavy idle; 0 = minute-scale cold starts blocking scaling.
- **Verify effort:** 🔶 ~2–4 h — startup profiling.

---

## Deep-dive indicators

### PERF-09 — Cost Efficiency / FinOps
- **Definition:** The cloud/infra bill is bloated — oversized instances, idle resources, orphaned/stale resources, no cost attribution per team/service, no rightsizing reviews, and cost is late-inspected ("it's money, whatever") rather than engineered.
- **Why it signals obsolescence:** Waste is a *structural* signal: a codebase designed for an era before cost visibility (unused clusters, always-on dev envs, 24/7 oversized fleets) leaks money in ways money-discipline would fix. FinOps isn't cosmetic — it's a proxy for engineering discipline, and cost overruns are why modernization budgets get starved (the waste would fund the fix).
- **Where it manifests:** Instances sized 4× what's needed, dev envs running 24/7, orphaned volumes/clusters, no per-team cost tags, no rightsizing review, automatic scaling absent so over-provisioned always, "the bill went up and we shrugged."
- **Detection method:** Cost analytics (Cloud Cost Management, AWS Cost Explorer resource-level, KubeCost), utilization vs. spend (P95% CPU vs. size), idle-resource sweeps (untagged, stopped-rarely, last-used), FinOps practices audit (tags/attribution, budgets, reviews).
- **Objective metric:** `utilization-adjusted waste $`; `idle/orphaned resource $`; `cost attribution coverage %`; `rightsizing review cadence`; `$ per user/request trend`.
- **Yellow flag (warning):** Some waste (over-sized instances, always-on dev), attribution partial, rare reviews. *(Rationale: warning — money discipline is not yet engineered.)*
- **Red flag (critical):** No cost visibility or attribution at all, massive always-on idle waste, or the bill has grown faster than usage for multiple quarters with no one able to explain it. *(Rationale: unmanaged cost is a company-budget risk and the tax that starves modernization funding — the leak becomes the excuse for never fixing anything.)*
- **Example symptom:** "The AWS bill doubled in two years. Nobody has cost explorer logins. An audit finds three production-sized clusters running QA jobs nightly, and a 'dev' instance that's been 3% utilized for 14 months. The ruffled budget is what modernization 'doesn't fit in.'"
- **Blast radius:** Budget, modernization funding, unit economics, audit/governance, growth margin.
- **Remediation playbook:** Quick win: tag/attribution, kill the obvious idle/orphaned resources, right-size the top 10 oversized instances, set a budget alert. Structural fix: FinOps cadence (monthly rightsizing + utilization review), autoscaling-for-cost (scale-to-zero for dev), cost dashboards per team/service, and a cost/request SLO.
- **Gold standard / target state:** Spend is attributed, tracked vs. usage, auto-right-sized, budgets alert, and waste < 10% of bill with an explanation for the rest.
- **Scoring guidance:** (deep-dive — no rubric row) 3 = attributed + right-sized; 2 = partial attribution, some waste; 1 = minimal visibility, waste growing; 0 = invisible bill, massive waste.
- **Verify effort:** 🔷 ~1–2 days — cost analytics + resource audit.

### PERF-10 — Disaster Recovery & Resiliency
- **Definition:** There's no demonstrable disaster-recovery capability — no DR drills, no documented RTO/RPO, single-region/AZ with no plan, no cross-region data strategy, and recovery logic (if any) has never been exercised. "Resilience" is a hope.
- **Why it signals obsolescence:** DR is the final verdict on infrastructure posture — it's the difference between "we have servers" and "we have a business that survives a datacenter event." Modern platform practice treats region/AZ distribution + tested failover as a baseline for anything production-critical. A system that can't answer "what happens if this region dies" has inherited a pre-cloud mental model.
- **Where it manifests:** Single region/AZ for everything, no RTO/RPO numbers, DR "runbook" that's a google doc from 2016, no failover tests ever run, backups (DATA-06) not tied to a restore plan, "we'd figure it out" as the DR plan.
- **Detection method:** DR audit — documented RTO/RPO? cross-region/AZ redundancy for the critical path? Failover drills (last successful full-region drill date/time)? Multi-region data strategy (async replication? snapshots?)? Test: literally ask the team to run the DR plan and time it (a drill).
- **Objective metric:** `last successful DR drill (days)`; `RTO/RPO defined + met?`; `cross-region coverage % of critical services`; `time to recover a region (drilled) vs. target`.
- **Yellow flag (warning):** Single/limited redundancy, no drills in > 6 months, RTO/RPO undocumented-but-roughly-implied. *(Rationale: warning — you're one event from discovering the plan is fiction.)*
- **Red flag (critical):** No DR plan/doc, no drills ever, single-region single-point-of-failure for the whole system, and no cross-region data path. *(Rationale: a regional event is a company-ending event — no resilience exists to be modernized here.)*
- **Example symptom:** "The board asks what happens if the us-east-1 region is down. Answer: 'we don't have a plan — we hope the cloud does.' Every system is single-region; the mobile app can't run without it. The resilience budget request is denied because 'it works today.'"
- **Blast radius:** Company continuity, availability SLOs, customer trust, insurance/regulatory (DR required), brand (a "cloud outage kills us" story).
- **Remediation playbook:** Quick win: write the DR plan (real: recover critical path), define RTO/RPO per tier, take documented cross-region snapshots for the critical DB, run a tabletop then a real drill. Structural fix: ring-fence the critical path into multi-AZ → multi-region with tested failover, async replication strategy, automated failover runbooks, drills scheduled quarterly as a non-negotiable ritual.
- **Gold standard / target state:** Critical path survives a region event within RTO (drilled and proven), RTO/RPO documented, drills are boring quarterly calendar items, recovery is automated not theatrical.
- **Scoring guidance:** (deep-dive — no rubric row) 3 = multi-region, drilled, RTO met; 2 = multi-AZ, drills rough; 1 = single-region with plan in head; 0 = no DR, region event = shutdown.
- **Verify effort:** 🔷 ~1–2 days — DR audit + (ideally) a drill.