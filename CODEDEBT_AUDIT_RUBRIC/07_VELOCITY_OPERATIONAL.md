# 07 — Developer Velocity & Operational Drag

> **Weight:** 10% base · 9% FE-active · **Standard:** VEL-01…10 · **Deep-dive:** VEL-11, 12
>
> **One-line thesis:** Velocity is where modernization debt pays out every single day — in build time, deploy failures, and the gap between "how we work" and "how we say we work." Slow pipelines aren't a pain point; they're a diagnostic.

**Category summary:** Scores the delivery and operational machinery around the code — CI/CD speed and reliability, deploy frequency and failure rate, local dev reproducibility, onboarding friction, knowledge concentration, review discipline, branch strategy, and how much of the release path is automated vs. heroic. DORA-aligned where measurable.

---

## Standard indicators

### VEL-01 — CI/CD Build Duration
**Engine tier:** B · **Default status:** estimated · **Scope/overlaps:** pipeline *duration/feedback* only; the suite's own length is TEST-04.
- **Definition:** The time from push to mergeable feedback — build, lint, tests, quality gates — in CI is measured in many minutes to hours, occasionally times out, and has been drifting upward for quarters.
- **Why it signals obsolescence:** CI feedback latency is *the* throttle on delivery: the longer it is, the less often it runs, the more it's skipped, and the more merge queues and context-switching cost. DORA research is unambiguous — throughput tracks feedback speed. A growing build time is also a proxy for test bloat and unowned pipelines.
- **Where it manifests:** CI analytics (pipeline duration trend), "Merge queue is full" symptoms, engineers running subsets locally ("I won't trigger the full build"), build timeouts, weekend batch CI runs.
- **Detection method:** Pipeline analytics — GitHub Actions/GitLab/Jenkins duration stats per stage, P95 push-to-feedback, trend over 6–12 months; breakdown by stage (install/build/test/quality); check what's serial vs. parallel.
- **Objective metric:** `P95 feedback-loop time`; `median full-pipeline duration`; `Δ over 4 quarters`; `# of timeouts/month`; `% of pipeline serial time`.
- **Yellow flag (warning):** 15–30 min feedback loop; growing; partial parallelization. *(Rationale: warning — above modern norms, still survivable, tax is compound.)*
- **Red flag (critical):** > 30 min loop or regular timeouts, or tests so slow they're split/dropped (connects TEST-04), or the trend is steeply up. *(Rationale: the loop has broken — CI is no longer a feedback tool, it's a queuing tax.)*
- **Example symptom:** "The full build takes 41 minutes: 12 of serial test time, 6 for install of 1,400 packages no one pruned, a coffee-break job that 'should've been cached.' The team merges 3 PRs a day because queuing eats everyone."
- **Blast radius:** Merge throughput, deploy frequency, context-switching cost, CI spend, engineer patience (leads to skipping).
- **Remediation playbook:** Quick win: turn on caching, parallelize shards, drop the slow E2E from the merge path (TEST-04), float the slowest 10 tests once. Structural fix: a CI budget (SLO on feedback time), dependency pruning (ECOS-06), test-suite redesign (TEST-03), and monitoring of pipeline trend.
- **Gold standard / target state:** P95 feedback < 10 min; trend flat/declining; no timeouts; every engineer runs the pipeline before merge by habit.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = < 10 min; 2 = 15–30 min; 1 = > 30 min or split/hope; 0 = loop so slow it's routinely skipped.
- **Verify effort:** ⚡ ≤ 30 min — CI analytics read.

### VEL-02 — Local Dev Setup Time & Friction
**Engine tier:** A · **Default status:** estimated · **Scope/overlaps:** first-run *setup*; the ongoing inner loop (watch/rebuild) is VEL-11/DX tooling, docs proof is DOCS-04.
- **Definition:** Getting a working local environment takes 1+ days, requires undocumented manual steps, depends on shared remote infrastructure (staging DBs, third-party credentials), or works only for the people who built it.
- **Why it signals obsolescence:** Onboarding friction is a leading indicator of environment debt: it measures how far the codebase is from "clone → `make dev` → code." Every extra day is a day of not shipping plus a chunk of your senior engineers' time being "the database whisperers." It's also the first thing candidates/new hires report.
- **Where it manifests:** Multi-page setup wiki with un-documented "gotchas," `docker-compose` that half-works, devs pointing at shared remote DBs, setup requires obtaining 6 service credentials "from Alex," "it works on my machine" as a known phrase, no `make dev`/Taskfile/script of record.
- **Detection method:** Onboarding tracking (time-to-first-green-build for new hires, "Golden Path" walkthrough), dev-experience survey, try-it test (have someone time a clean-machine setup), config audit (containers, seed scripts, env templates).
- **Objective metric:** `median time to first green local environment`; `# of manual setup steps`; `shared-remote-DB dependency (y/n + count)`; `documentation currency of setup guide`; `time-to-first-code-commit for new hire`.
- **Yellow flag (warning):** 1–2 days depending on custom local steps. *(Rationale: warning — above modern norm; the tax is real but survivable.)*
- **Red flag (critical):** > 3 days, or requires shared remote staging DBs / a single human's credentials / a "provision me" ticket. *(Rationale: the environment can't be reproduced — it's tribal infrastructure, not a codebase.)*
- **Example symptom:** "New hire day 1-3: 'get Docker running, then Andy's `.env` file, then VPN, then ask Maria for the staging DB creds because local DB 'doesn't work', then figure out the seed script that's 4 versions old.' Andy and Maria are both on call."
- **Blast radius:** Onboarding ramp, hiring cost, senior-engineer tax, local-test fidelity (drives flaky local), developer happiness/retention.
- **Remediation playbook:** Quick win: containerize the stack with a one-command up, ship `.env.example`, write a working setup doc, document the "Golden Path." Structural fix: hermetic local env (containers, local deps with `testcontainers`), zero shared-remote requirement, setup scripted and CI-tested (a fresh container proves the guide works), "works on my machine" made unfalsifiable.
- **Gold standard / target state:** `git clone && make dev` brings up a working local system in < 30 min with no external dependencies; the instruction is CI-verified.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = one-command dev up; 2 = 1–2 days, custom steps; 1 = > 3 days / shared deps; 0 = tribal environment owned by individuals.
- **Verify effort:** 🔶 ~2–4 h — timed clean-machine setup.

### VEL-03 — Deployment Failure Rate (CFR)
**Engine tier:** B · **Default status:** unknown · **Scope/overlaps:** release *outcomes*; release *automation* is VEL-08, rollback runtime is VEL-12/MTTR.
- **Definition:** A meaningful share of deployments either fail, are rolled back, or require emergency/incident-level intervention after the fact (DORA's Change Failure Rate), and the trend is not improving.
- **Why it signals obsolescence:** CFR is the honest verdict on the whole "system is shippable" question. High CFR means every release is a bet — teams respond by shipping less (deploy frequency drops), which compounds: fewer deploys, bigger deploys, more failure. It's also a *gate* (G6) when it hits 30%+ with manual intervention.
- **Where it manifests:** Rollback logs, incident tickets tagged "deployment", "it broke after the release" post-release issues, datadog deploy-markers with red cliffs, GitHub release history with hotfixes.
- **Detection method:** DORA metrics tracking — calculate CFR from deploy vs. rollback/hotfix data (commit rollout tracking, release annotations, incident tags), dashboards (Datadog, Sleuth, Faros/LinearB), manual release-history mining; distinguish failed-deploy vs. emergency-fix.
- **Objective metric:** `CFR % (failed/rolled-back deploys ÷ total deploys)`; `rollback count (last 12 mo)`; `% of deploys needing incident response`.
- **Yellow flag (warning):** CFR 15–30%, or rollbacks concentrated in specific release types. *(Rationale: warning — DORA's "medium" band; clearly improvable but not catastrophic.)*
- **Red flag (critical):** CFR > 30%, or deployments *requiring* manual intervention as standard, or rollback ceremony itself is an incident (triggers **G6**). *(Rationale: releases are the top risk surface — DORA's low band with extra hazard.)*
- **Example symptom:** "Out of 40 deploys this quarter, 11 needed an immediate fix or rollback. One release required SSH-ing into prod at 2am to 'restore a config file.' The team now avoids deploying on Fridays — which makes Monday's deploys bigger."
- **Blast radius:** Availability, on-call load, deploy frequency (which compounds further failure), team confidence, customer-visible bugs.
- **Remediation playbook:** Quick win: implement fast rollback (repo-state rollback, feature flags, DB-migration backup), add canary/smoke checks to catch the common failure classes, post-release verification automation. Structural fix: smaller safer deploys (deploy frequency up = risk down), progressive delivery (canary, blue-green), automated rollback + observability slices, DORA tracked and reviewed monthly.
- **Gold standard / target state:** CFR < 15% and falling, rollback is automated and boring, deploys are small and frequent, no manual prod intervention.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = CFR < 15%, automated rollback; 2 = 15–30%; 1 = > 30% with some automation; 0 = > 30% + manual-only (G6).
- **Verify effort:** 🔶 ~2–4 h — release/incident data mining.

### VEL-04 — Deployment Frequency & Lead Time
**Engine tier:** B · **Default status:** estimated · **Scope/overlaps:** release *rhythm*; what blocks rhythm (CI slow, tests weak) is scored in its own row.
- **Definition:** The system deploys rarely (weekly→monthly→quarterly) with long lead times between code merge and production, and releases are "big bang" events rather than a steady stream.
- **Why it signals obsolescence:** Rare, batched releases are a *symptom* of every other debt (slow CI, no tests, risky deploys) and a *multiplier* of it: the bigger the release, the harder to debug, the more likely the rollback, the less the business can iterate. DORA's elite band deploys on demand; legacy bands ship by calendar.
- **Where it manifests:** Release calendar with named "deploy days," monthly release trains, release freeze windows, "merge window" rules, multi-service coordinated releases, deploy frequency hidden (no data at all).
- **Detection method:** Release analytics — count production deploys per service per month (CI/CD + deployment tools), measure merge-to-prod lead time (median), inspect release process (release branch? freeze? feature-toggle zero?), interview "when did you last release on a Tuesday on purpose?"
- **Objective metric:** `deploy frequency (deploys/month/service)`; `merge-to-prod P50 lead time`; `% of changes shipped via coordinated release trains`; `release freeze days/month`.
- **Yellow flag (warning):** Weekly deploy cadence (or biweekly), lead time 1–5 days, some coordination required. *(Rationale: warning — survivable but clearly below modern norms.)*
- **Red flag (critical):** Monthly-or-less cadence, lead time > a week, or every release is a coordinated multi-service event with a named human "release manager". *(Rationale: the codebase's risk is now scheduled like a moon landing.)*
- **Example symptom:** "Deployments happen the last Thursday of the month, on a dedicated 'release train.' Lead time is 11 days. One service needs a fix that "can't wait for the train" — so it queues until emergency, at which point it's done the scary way, at 2am."
- **Blast radius:** Business iteration speed, bug-fix latency, release risk, feature mortality (multi-week waits kill momentum), incident pressure.
- **Remediation playbook:** Quick win: remove freeze/merge windows, do Friday non-events, add a deploy button per service. Structural fix: the classic modernization goal — trunk-based dev + feature flags + small CI/CD steps to get deployment-frequency up and lead time down; each elimination of coordination is a DORA win.
- **Gold standard / target state:** Deploy on demand (multiple/week/service), lead time < 1 day, releases are boring non-events, no release manager role needed.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = on-demand deploys, < 1 day lead; 2 = weekly, a few days; 1 = biweekly–monthly trains; 0 = coordinated calendar-driven releases as the norm.
- **Verify effort:** 🔶 ~2–4 h — deploy/lead-time analytics.

### VEL-05 — Onboarding Lead Time to First Production PR
**Engine tier:** D · **Default status:** unknown · **Scope/overlaps:** the *outcome* number; the causes (setup, docs, tribal knowledge) live in VEL-02, DOCS-04, DOCS-05.
- **Definition:** A new engineer takes weeks (not days) to reach "shipped my first change to production," and the lag is a feature of the codebase, not of the hire.
- **Why it signals obsolescence:** Time-to-first-PR is the sum of every knowledge and environment debt in one number: unclear architecture, missing docs, painful setup (VEL-02), scary deploys, knowledge silos. It's also a recruiter's and retention metric — candidates who take a month to feel productive leave.
- **Where it manifests:** Onboarding documentation sparse or stale, no starter tickets, architecture "must shadow for 3 weeks before touching anything," complex setup blocks, tribal knowledge required to understand safe places to change, first PR weeks out.
- **Detection method:** Onboarding tracking — time from start to first merged prod-change PR per hire (git + HR data), onboarding survey (self-reported productiveness date), review of onboarding docs/tickets, "first-change" blocker log (what did they wait on?).
- **Objective metric:** `median days to first production PR`; `% of hires shipping within 2 weeks`; `onboarding doc freshness`; `# of blockers reported (envs, permissions, knowledge)`.
- **Yellow flag (warning):** 2–4 weeks to ship first PR; onboarding partially documented. *(Rationale: warning — above the modern two-week line, still tolerable.)*
- **Red flag (critical):** > 4 weeks for most hires, or onboarding is oral/tribal with no written path. *(Rationale: the codebase's knowledge is not transferable — that's a structural timer on the team.)*
- **Example symptom:** "The last three engineers all took 5–6 weeks to ship anything: 3 days on setup, then two weeks of 'shadow the architecture' sessions, then a scary deploy scared them into review loops. Two of the three left within a year — 'I never felt productive.'"
- **Blast radius:** Hiring ROI, retention, time-to-contribution, knowledge transfer, team scale (onboarding debt caps team growth).
- **Remediation playbook:** Quick win: write a "first PR in a day" path (a safe starter ticket + doc patch + tiny config change), assign onboarding buddy + SLA, grant prod deploy gradually but early. Structural fix: fix the underlying debts (setup VEL-02, docs DOCS, deploy VEL-03), curriculum-style onboarding (architecture walkthroughs, ADRs), starter-ticket backlog maintained.
- **Gold standard / target state:** New engineers ship to prod within their first week, via documented path, with a clear map of the safe-to-change surfaces.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = < 1 week; 2 = 2–4 weeks; 1 = > 4 weeks, documented-ish; 0 = onboarding entirely tribal.
- **Verify effort:** 🔶 ~2–4 h — HR/git data + onboarding review.

### VEL-06 — Bus Factor / Knowledge Concentration
**Engine tier:** A · **Default status:** measured · **Scope/overlaps:** authorship concentration of *modules*; churn∩defect concentration is ARCH-05.
- **Definition:** Critical modules are known by one or two people; whole subsystems are "only Paul understands"; there's no redundancy, no docs (see DOCS), and Paul's vacation/exit is a risk event. At the extreme, one author owns most of the codebase.
- **Why it signals obsolescence:** Knowledge concentration is the human face of the same problem as undocumented APIs: the system is maintained by memory, not by structure. It converts a normal life event (someone leaves) into an outage or a stall — and it's alarmingly common in "the codebase only one person can touch" legacy systems.
- **Where it manifests:** Git author analysis (one author dominates critical files/whole repos), "ask Paul" as the architecture diagram, modules with zero review history, no ADRs/runbooks (DOCS-01/03), the person who "knows the billing hack."
- **Detection method:** Git author distribution — `git shortlog -sne -- <critical module>` to find ownership concentration, per-file/blob authorship, review-history coverage (did a file ever get a second pair of eyes?); interview "name the diagram you'd draw if Paul left."
- **Objective metric:** `% of modules with single-author ownership > 60%`; `ownership entropy per module`; `# of critical files with zero external review`; `bus-factor per critical service (engineers able to explain/deploy)`.
- **Yellow flag (warning):** Single author responsible for > 50% of a critical module; a couple of know-it-all dependencies. *(Rationale: warning — reviewable, but the clock is ticking on retention.)*
- **Red flag (critical):** A single author owns > 80% of an entire codebase (or every critical service is Paul), zero documentation, zero shared context. *(Rationale: Paul leaving *is* a system failure — the codebase is functionally a memory he carries.)*
- **Example symptom:** "Git blame on the pricing service: 91% of lines are Paul. 'What does that service do?' — everyone points at Paul. Paul's PTO is scheduled; a change is needed; the whole team quietly hopes it waits."
- **Blast radius:** Outage risk on departure, review quality, knowledge transfer cost, feature blocking, retention of the "irreplaceable" (who also can't take vacation).
- **Remediation playbook:** Quick win: pair-and-document the top exclusive modules (forced bus-factor increase), get a second reviewer on every critical file from here on. Structural fix: architecture that doesn't need a walking encyclopedia (simplify, DOCS), quarterly rotation of module owners, an "unlearnable-list" audit (which files can no one explain without the author).
- **Gold standard / target state:** No module with single-author > 50%; anyone can explain/deploy any critical service within a day; a leaving engineer is a 1-day disruption, not an event.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = distributed ownership; 2 = concentration in a couple modules; 1 = single author on critical modules; 0 = one author owns the codebase (and it's now or never).
- **Verify effort:** ⚡ ≤ 30 min — git author stats.

### VEL-07 — Environment Reproducibility / Works-on-My-Machine
**Engine tier:** A · **Default status:** estimated · **Scope/overlaps:** whole-stack env parity; schema-only drift is DATA-10, config source-of-truth is ARCH-10.
- **Definition:** Local, staging, and prod environments drift so much that "works on my machine" is a standing phenomenon — configs differ, versions differ, data differs, and bugs only reproduce in one environment.
- **Why it signals obsolescence:** Environment reproducibility is the ground truth behind every "it works here" argument. Its failure means the team's work product (a fix) doesn't reliably transfer to prod — the whole loop of develop→test→deploy is leaky. Pairs with DATA-10 (schema drift) but covers the whole stack.
- **Where it manifests:** The "works on my machine" retort, environment-specific bugs, config files differing per env by hand, no containerized parity, feature flags on in one env only, "we can't reproduce" tickets, version skew local vs. prod.
- **Detection method:** Parity audit — compare dev/CI/staging/prod versions (runtime, deps, OS, configs); check for canonical config pipeline (IaC + env-config injection) vs. hand-edited files; try "reproduce the prod bug in a container" TIMED; survey "last time a support bug was reproduced locally".
- **Objective metric:** `env-version divergence count`; `% of configs managed by a canonical pipeline`; `time to reproduce a prod-only bug`; `works-on-my-machine incident frequency`.
- **Yellow flag (warning):** Some config/version divergence between envs, occasional prod-only bugs. *(Rationale: warning — the leak is real but not structural yet.)*
- **Red flag (critical):** Reproducing prod locally is routinely impossible, or configs are maintained per-env by hand with no source of truth. *(Rationale: you cannot develop against your product — every fix is blind until it's not.)*
- **Example symptom:** "A bug 'only happens on prod' — three reproductions take a week. Root cause: an env-specific config value edited by hand in 2019 nobody knew about. The team's standing joke is 'works on my machine, ships in yours.'"
- **Blast radius:** Debugging time, prod-only bugs, fix-transfer failure, deploy risk (VEL-03), dev confidence.
- **Remediation playbook:** Quick win: containerize dev for parity, make config canonical (one source of truth, injected per env), stand up a staging clone of prod config. Structural fix: full parity — same containers/versions everywhere, IaC for all envs, config as code, "prod reproduction" as a standard step (spin replica to confirm).
- **Gold standard / target state:** Any environment can be rebuilt to match prod; prod-only bugs are a thing of the past; config drift is zero-diff against the source of truth.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = full parity; 2 = minor divergence; 1 = meaningful divergence, repro hard; 0 = local ≠ prod, routine blind shipping.
- **Verify effort:** 🔶 ~2–4 h — parity audit + repro test.

### VEL-08 — Manual Release Steps & Operability
**Engine tier:** A · **Default status:** measured · **Scope/overlaps:** whether the release path is automated; its reliability is VEL-03, recovery from a failed release is VEL-12.
- **Definition:** Releasing requires human, tool-less steps — SSH-ing to prod, editing files there, running commands by hand, sharing credentials, a "release manager" clicking through, or no deploy automation at all.
- **Why it signals obsolescence:** Manual releases are the coarse end of the CI/CD spectrum — they cap frequency, inherit human error, require privileged access by hand, and make auditing who-did-what impossible. In the era of a button per service, a script run by one person with prod SSH is a definition of operational debt. It's also the second half of gate G6.
- **Where it manifests:** Deploy runbooks ("SSH to x, pull, run migration, restart"), no CI on release path, someone's terminal of recorded commands, vendor-wrap deploy steps, prod edited directly (hotfixes in vim), shared prod credentials, no audit of deployments.
- **Detection method:** Release-path audit — trace the last 5 releases end-to-end: was anything done by hand? cin which env did commands run? Is there a CI/CD artifact → environment promotion path? Check for prod direct edits, shell-history deploys, deployment audit logs.
- **Objective metric:** `% of releases fully automated`; `# of manual steps in the release path`; `prod-direct-edit incidents`; `deploy audit trail present?`; `shared prod creds?`.
- **Yellow flag (warning):** Some manual release steps (a couple of hand SQL/migrations, config push), automated enough to be "mostly CI." *(Rationale: warning — a bit of heroic residue, still runnable by a trained person.)*
- **Red flag (critical):** Deploys *only* happen via manual scripts on prod hosts, or prod is routinely edited by hand (triggers **G6**). *(Rationale: the release path is one human's terminal — fragile, un-auditable, unscalable.)*
- **Example symptom:** "The release is: `ssh prod-api`, `git pull`, `php artisan migrate`, `touch restart`, watch the logs, pray. Last month Bob ran the migration twice because the terminal scrolled. The audit question 'who deployed?' has no answer."
- **Blast radius:** Deploy frequency ceiling, human-error incidents, audit compliance, access security, scaling (only a few people can release), release risk.
- **Remediation playbook:** Quick win: capture the manual steps as a CI/CD job (artifact → deploy), remove direct prod SSH, add an audit log of every deployment. Structural fix: full automated promotion (CI build artifact → envs), IaC-managed infra (PERF-06), deploy from immutable artifacts (never from a checkout on a server), prod access by deploy pipeline only.
- **Gold standard / target state:** Zero manual steps; deploys are CI pipeline promotions with audit; prod editability removed; an audience of "the pipeline did it" for every release.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = fully automated + audited; 2 = some manual residue; 1 = mostly manual pipeline; 0 = script-on-prod is the release path (G6).
- **Verify effort:** 🔶 ~2–4 h — last-releases walkthrough + access audit.

### VEL-09 — PR & Code-Review Hygiene
**Engine tier:** A · **Default status:** measured · **Scope/overlaps:** review *process* (coverage, size, latency, bypass); review outcomes for a *module* are VEL-06, quality gates that run AT review time are TEST-08.
- **Definition:** Code review is rubber-stamped or absent — low PR coverage, thousands-of-line PRs, admin merges and direct pushes, reviews with no changed-code reading — so quality and knowledge transfer depend on unfiltered commits.
- **Why it signals obsolescence:** Review is the last human gate before code becomes shared truth. Its decay tracks maintenance abandonment: when nobody reads diffs, decisions stop being questioned, knowledge stops transferring, and both defect rate and bus factor rise quietly. Legacy repos typically show both extremes at once — none of the discipline, all of the ceremony.
- **Where it manifests:** PRs merged without review or with an admin bypass, direct pushes to main, median PR sizes in the thousands of lines or multi-week lifetimes, "LGTM" reviews with zero comments, reviews concentrated in one person (feeds VEL-06), no review on the core/path-critical services.
- **Detection method:** GitHub/PR API mining — review coverage % of PRs, median and p95 PR size (additions+deletions), median time-to-first-approval, comment density (non-author comments per 100 LOC), bypass/admin-merge rate, direct-push count to protected branches; sample the top 20 PRs for "was the diff actually read."
- **Objective metric:** `PR review coverage %`; `median/p95 PR size`; `median review latency (merge wait)`; `admin/bypass merge rate %`; `direct pushes to main (count)`; `review comment density`.
- **Yellow flag (warning):** Review coverage < 80% or rubber-stamp for some modules; median PR 500–1,000 LOC; review latency days. *(Rationale: mostly functioning, but the gate is leaking on size and speed.)*
- **Red flag (critical):** Reviews effectively absent — admin merges / direct pushes as normal practice, or core-path changes ship unreviewed, or median PRs > 1,000 LOC so reviews are theater by construction. *(Rationale: there is no longer a shared reading of the code — defects and knowledge holes land unchallenged.)*
- **Example symptom:** "The dashboard PR was 1,400 lines with 31 files and merged after one emoji comment — the reviewer had clicked 'approve' in 40 seconds. Three days later a regression ships because the 'review' missed a changed edge case. This is the normal path, not the exception."
- **Blast radius:** Defect rate, knowledge transfer, bus factor (VEL-06), decision quality, audit trail of "who looked," review burnout of the one real reviewer.
- **Remediation playbook:** Quick win: enforce branch protection with required reviews on core paths, ban direct pushes, add a PR-size lint (split > 400-LOC PRs), publish review-coverage metrics. Structural fix: review as a first-class metric (coverage, size, latency tracked), pairing/small-PR culture, a second reviewer on security-adjacent paths, "no unreviewed merge" as an org rule.
- **Gold standard / target state:** 100% coverage on core paths, median PR < 400 LOC, reviews substantive (comments, not emoji), zero bypasses, review latency < 1 day.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = full coverage, small PRs, substantive reviews; 2 = some rubber-stamp, PRs 500–1,000, latency days; 1 = core paths sometimes unreviewed or consistently oversized PRs; 0 = admin merges / direct pushes as the norm, no real review exists.
- **Verify effort:** 🔶 ~2–4 h — PR API mining + sample read.

### VEL-10 — Branching & Monorepo Strategy Legacy
**Engine tier:** A · **Default status:** measured · **Scope/overlaps:** branch/merge *mechanism*; release *cadence* is VEL-04, feature toggles-as-branches is ARCH-10.
- **Definition:** The branching model is a legacy ceremony — GitFlow-style long-lived branches, release branches that live for weeks, merge windows, trunk divergence — or a monorepo/multi-repo split that no longer matches how the team ships, so integration is a sprint in itself.
- **Why it signals obsolescence:** Branch strategy is the plumbing of trunk-based delivery: the modern norm is short-lived branches, trunk as the source of truth, and continuous integration. Long-lived branches and forced merge windows are the *brakes* every other modernization win has to fight — they multiply merge cost, hide integration failures until merge time, and convert "ship" into a scheduled drama.
- **Where it manifests:** `develop` vs `main` with a promotion ceremony, release branches older than 2 weeks, weeks-old "feature" branches, mandatory merge freezes, no enforcement of trunk stability (broken builds on main), a monorepo where every deploy drags everything, or a multi-repo where one logical change spans six PRs.
- **Detection method:** Git topology audit — branch age distribution (release + feature branch lifetimes), distance-from-trunk (commit divergence), merge-window/CI-config evidence (is main always green?), direct-push protection, monorepo/multi-repo change-span (how many repos does one logical change touch), PR-to-merge time outliers.
- **Objective metric:** `median/p95 branch lifetime`; `release branch age at merge`; `distance-of-integration (commits per merge)`; `main-always-green? (broken-main incidents)`; `logical changes spanning > 1 repo (count)`; `merge-freeze days/quarter`.
- **Yellow flag (warning):** GitFlow-style ceremony with mostly-short branches; occasional month-long branches; a couple of forced merge windows; multi-repo changes needing coordination. *(Rationale: friction is real but the train mostly runs.)*
- **Red flag (critical):** Release branches weeks old with accumulating divergence, trunk routinely broken, mandatory merge windows/freezes as policy, or a monorepo/multi-repo shape that makes every change a coordination event. *(Rationale: integration is a permanent tax — every DORA-style improvement is blocked at the plumbing.)*
- **Example symptom:** "There's a `release/2.14` branch that's 6 weeks old; `develop` has drifted 400 commits ahead. Merging it back is a 3-day ceremony nobody schedules. 'Main is always red on Monday' is a known phrase. A one-line fix needs a cross-repo PR dance."
- **Blast radius:** Merge cost, integration bugs, deploy cadence (VEL-04), context switching, cross-repo coordination load, developer frustration.
- **Remediation playbook:** Quick win: trunk-based basics — short-lived branches < 3 days, protect main + require green CI, delete the oldest release branch with a manual backport policy. Structural fix: move to trunk-based development with feature flags (ties ARCH-10), shrink multi-repo coordination via a platform or monorepo_tools strategy, enforce main-always-green with a CI gate.
- **Gold standard / target state:** Branches live < 3 days, main is always mergeable and green, merges are small and continuous, no merge windows, one logical change fits in one repo/PR.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = short-lived branches, trunk green, no windows; 2 = GitFlow ceremony, mostly short, occasional windows; 1 = release branches drifting, trunk often red; 0 = coordinated multi-week merge ceremony as the norm — plumbing blocks all modernization velocity.
- **Verify effort:** ⚡ ≤ 30 min — branch-age + CI-green + merge data.

---

## Deep-dive indicators

### VEL-11 — Developer Experience Tooling
**Engine tier:** B · **Default status:** estimated · **Scope/overlaps:** local tooling affordances; first-run *setup* is VEL-02, fresh-clone single-command proof is ARCH-09.
- **Definition:** The local coding experience is primitive — no scaffolding/generators, no hot reload, no IDE integration, no codegen, no task runners of record, so modern DX affordances (AI tooling, named tasks, watch mode) either don't work or never existed.
- **Why it signals obsolescence:** DX tooling is the difference between a codebase that feels "built in the era it was made" and one that feels current. It's also an objective check for modernization-readiness: AI-assisted tooling (copilots, agents, refactoring machines) performs dramatically worse on pre-modern setup (long builds, no types, no task definitions). It's the canary for "can we tool this codebase going forward."
- **Where it manifests:** No `Makefile`/Taskfile/`just`/npm scripts of record, no codegen/scaffolding (hand-copying boilerplate), no watch/hot reload, long cold starts per action, no language-server-friendly project structure, manual "create a new endpoint" rituals.
- **Detection method:** DX audit — inventory developer tooling (task runner, scaffolding, watch mode, codegen), measure cold-start time for the common inner-loop (edit→rebuild→test), check IDE/AI-tool friction (does the language tooling index cleanly? any `exclude` hacks?), survey "name one script that makes you faster vs. one that makes you slower".
- **Objective metric:** `inner-loop time (edit→feedback)`; `# of scaffolding/codegen tools`; `task-runner of record present + documented`; `AI/IDE integration friction score`; `% of repetitive setup automated`.
- **Yellow flag (warning):** Inner loop 5–15 min, some tooling but no scaffolding, DX tax noticeable. *(Rationale: warning — above modern norms, survivable.)*
- **Red flag (critical):** Inner loop > 15 min (cold builds, manual steps), no task runner of record, no generator for boilerplate, and modern tooling/AI integration effectively impossible/agonizing. *(Rationale: the inner loop is the most frequent cost in software; this one is running at loss-leader rates.)*
- **Example symptom:** "Every change: save, wait 4 min for the bundler, click through a manual rebuild, hunt the console. 'Create an endpoint' is copy-paste a 300-line file. A copilot suggests something; the repo's actually slow to index. The devs live in the waiting room."
- **Blast radius:** Hourly cost per engineer, AI-tooling ROI, onboarding, prototyping velocity, modernization feasibility (this is what makes refactors feasible at scale).
- **Remediation playbook:** Quick win: define a task runner of record (Makefile/Taskfile), add scaffolding commands for the top 3 boilerplates, enable watch mode. Structural fix: invest in DX as product work — fast inner loop, generated code, language-server health, CI parity for local checks.
- **Gold standard / target state:** Inner loop < 1 min, scaffolding for common work, task runner documented and CI-consistent, AI/IDE tooling first-class.
- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = fast inner loop, tooled; 2 = 5–15 min inner loop; 1 = > 15 min with some scripts; 0 = ritualistic manual inner loop.
- **Verify effort:** 🔷 ~1–2 days — timed inner-loop + tooling inventory.

### VEL-12 — Incident Recovery / MTTR
**Engine tier:** B · **Default status:** unknown · **Scope/overlaps:** recovery *time*; the diagnosis chain that feeds it is PERF-01/API-07/DOCS-03, rebuild-from-scratch readiness is PERF-10.
- **Definition:** Recovery from incidents is slow and manual — mean time to restore is hours-plus, runbooks are absent or wrong, rollback is manual, diagnosis relies on a few experts, and the same failure mode repeats because no systemic fix follows.
- **Why it signals obsolescence:** MTTR is the operational output of the whole diagnosis chain (observability PERF-01, error semantics API-07, runbooks DOCS-03, deploy safety VEL-03). A system that fails and takes half a day to bring back is, from the business's point of view, half a day dead — and it's the standard legacy profile.
- **Where it manifests:** On-call "heroics," no runbooks (or stale), diagnosis by `ssh` + `grep`, manual rollback scripts, repeated incidents of the same class, no blameless postmortens, no incident metrics tracked at all.
- **Detection method:** Incident analytics — PagerDuty/incident-tool MTTR and MTTD, incident-class repetition (same cause ≥ 2×/quarter), rollback time measurement, runbook coverage/currency audit, postmortem quality (actions taken?) and backlog closure rate.
- **Objective metric:** `MTTR (P50/P90)`; `incident-class repetition rate`; `runbook coverage % of incident types`; `rollback time P90`; `% of postmortem actions actually shipped`.
- **Yellow flag (warning):** MTTR 1–2 h, runbooks partial, rollback mostly manual, some repetition. *(Rationale: warning — under professional norms is achievable, currently over.)*
- **Red flag (critical):** MTTR > 4–6 h, no runbooks, rollback is a manual nightmare, or the same incident recurs quarterly. *(Rationale: hours of absolute downtime + a fix that never happens = business-critical failure.)*
- **Example symptom:** "Tuesday 3am: queue backlog gone. On-call pings three people, greps 40 log files, finds a dead worker 2 hours in, restarts manually via SSH (the runbook was written for a different topology), back at 6:30am. Same incident happened in March."
- **Blast radius:** Availability, revenue, on-call burnout, compliance (availability SLAs), trust — and it's the compounding output of everything in this category.
- **Remediation playbook:** Quick win: write the top 5 runbooks (drill them), enable fast rollback (VEL-03), add the observability slices that made diagnosis slow (PERF-01). Structural fix: incident-on-call excellence — accurate runbooks, ephemeral-infra-friendly rollback, self-healing where possible, every incident gets a blameless postmortem whose actions you actually fund, MTTR tracked as an SLO.
- **Gold standard / target state:** MTTR < 30 min majority, runbook-based recovery, rollback automated, no incident class repeats, postmortem actions all shipped.
- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = MTTR < 30 min, drill-proven; 2 = 1–2 h, runbooks partial; 1 = > 4 h, manual; 0 = half-day incidents, recurring, no runbooks.
- **Verify effort:** 🔷 ~1–2 days — incident data mining + runbook audit.