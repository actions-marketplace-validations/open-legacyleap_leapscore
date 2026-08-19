# 01 — Dependency & Ecosystem Health

> **Weight:** 10% · **Standard:** ECOS-01…08 · **Deep-dive:** ECOS-09, 10
>
> **One-line thesis:** A codebase's dependencies are its circulatory system. When the ecosystem around the code moves faster than the code, every fix, audit, and hire gets harder — and eventually impossible.

**Category summary:** Scores how far the codebase has drifted from its own ecosystem — language/runtime support status, dependency freshness, library maintenance health, license posture, and supply-chain reproducibility. This is usually the *first* category to degrade, because it decays passively: no one writes code that breaks, dependencies just age.

---

## Standard indicators

### ECOS-01 — Runtime/Language EOL
- **Definition:** The language runtime or interpreter the system runs on (e.g., Python 3.6, Node 14, Ruby 2.7, .NET Framework, PHP 7.x) is at or past its official end-of-life date.
- **Why it signals obsolescence:** An EOL runtime receives no security patches. Any vulnerability found after EOL is permanent, and the security team has no fix to apply. It also blocks hiring (engineers won't fight an old toolchain), blocks library upgrades (new libraries drop EOL runtimes), and violates almost every compliance framework's "supported software" control.
- **Where it manifests:** CI container images (`FROM python:3.6`), `.nvmrc`/`.ruby-version`/`.tool-versions` files, `Dockerfile` base images, runtime configs in `package.json engines`, `pyproject.toml requires-python`, deployment manifests, EOL tickers (`endoflife.date`, `python.org/dev/peps/pep-0537`).
- **Detection method:** Version matrix audit — read runtime pins and cross-check against `endoflife.date`; `pip list` / `npm ls` / `gem list` vs. current releases; container image scanners report the base OS/runtime; `docker run --rm <image> <runtime> --version`. Cross-check the system's own support window against the vendor's.
- **Objective metric:** `days_until_eol` for each production runtime; `is_past_eol` boolean per runtime.
- **Yellow flag (warning):** Active version within 6 months of EOL, or on EOL but with a funded, resourced upgrade path already started. *(Rationale: 6 months is barely enough to plan+execute a runtime upgrade through QA; it's a warning, not a fire.)*
- **Red flag (critical):** Past official EOL with extended/vendor-only support (or none), and no upgrade in progress. *(Rationale: unpatched vulnerabilities are permanent; this is a gate — see G3.)*
- **Example symptom:** "The image we ship runs Python 3.6. A CVE lands in urllib3's parse. Our 3.6 wheels can't take the patched version. Security blocks the release; the team spends three weeks backporting instead of building the roadmap."
- **Blast radius:** Security posture, compliance audits, hiring/retention, ability to install any current dependency, CI infrastructure compatibility, third-party SaaS deprecations.
- **Remediation playbook:** Quick win: document the gap, create the upgrade ticket with a date. Structural fix: parallel runtime upgrade plan — run new runtime in CI behind a feature gate, migrate one service at a time, dual-run in prod. For truly stuck runtimes, isolate behind a facade and treat like a rewrite candidate.
- **Gold standard / target state:** Every production runtime within its vendor-supported window; CI builds a canary job on the current runtime; a deprecation calendar exists and is reviewed quarterly.
- **Scoring guidance:** 3 = all runtimes current; 2 = EOL approaching / one runtime in extended support but upgrade planned; 1 = EOL runtime in an isolated path; 0 = EOL runtime in core logic (triggers G3).
- **Verify effort:** ⚡ ≤ 30 min — read pins, compare to EOL calendar.

### ECOS-02 — Major Package Drift
- **Definition:** A large fraction of direct dependencies sit one or more *major* versions behind current, or the core framework (Spring, Laravel, Rails, Angular, React, Django) is pinned to an old major.
- **Why it signals obsolescence:** Major versions carry breaking changes that require migration work. Drift compounds: the further behind you are, the more migration steps you must chain, and each one gets harder because intermediate versions are forgotten. Drift also forecloses options — security fixes often land only in new majors.
- **Where it manifests:** `package.json`, `requirements.txt`/`pyproject.toml`, `Gemfile`, `go.mod`, `Cargo.toml`, `pom.xml`/`build.gradle`, lockfiles; tool reports from `npm outdated`, `pip list --outdated`, `dependabot`/`renovate` PR history.
- **Detection method:** Dependency tree tools — `npm outdated`, `pip list --outdated`, `bundle outdated`, `go list -u -m all`, `cargo outdated`; or a Dependabot/Renovate dashboard showing how many dependency PRs have been open/ignored. Count direct deps where `major version < latest major` and `latest major - current major >= 1`. Classify by whether the drift is in core (framework, ORM, auth) or peripheral (logging, util).
- **Objective metric:** `% of direct deps ≥ 1 major behind`; `% ≥ 2 majors behind`; `core framework major gap`.
- **Yellow flag (warning):** > 30% of direct deps are 1–2 majors behind. *(Rationale: a third of the surface is drift — still manageable, but the migration debt is real.)*
- **Red flag (critical):** > 50% of direct deps ≥ 2 majors behind, or the core framework is more than one major behind current with no upgrade project. *(Rationale: at this depth, individual upgrades stop being safe and the whole dependency graph becomes a migration project.)*
- **Example symptom:** "Renovate opens 40 PRs. Twenty are majors. We merge the patches, close the majors 'for later,' and the pile grows quarterly. Then a CVE needs a fix that only exists in v5, and we're two majors away with no path tested."
- **Blast radius:** Security patches, performance wins, hiring, framework skill availability, ability to onboard AI tooling, compliance reviews, interop with new libraries.
- **Remediation playbook:** Quick win: enable Dependabot/Renovate with major-update grouping and a monthly budget. Structural fix: "upgrade train" — pick one major hop per quarter, keep intermediate commits shippable, use the dependency graph from tools to sequence hops (don't skip majors). Establish a "never more than 1 major behind" policy for core deps.
- **Gold standard / target state:** Core framework within 1 major of current; < 30% of direct deps behind by a major; automatic update PRs flowing weekly; majors scheduled explicitly on the roadmap.
- **Scoring guidance:** 3 = minor drift only; 2 = 30–50% one major behind; 1 = core framework behind by 2 majors or > 50% drifting; 0 = core framework stuck ≥ 2 majors with no plan.
- **Verify effort:** ⚡ ≤ 30 min — one outdated-scan command + PR dashboard glance.

### ECOS-03 — Abandoned / Unmaintained Libraries
- **Definition:** Direct or deep transitive dependencies that are archived, revoked, or effectively unmaintained (no commits, no releases, no maintainer response) — yet still load-bearing.
- **Why it signals obsolescence:** An unmaintained library is a permanent, unfixable risk: bugs and CVEs accumulate with no upstream to fix them. It also signals the codebase froze at a point in time — the ecosystem moved on, and this system didn't.
- **Where it manifests:** `package.json` deps with dead GitHub repos; deprecated npm packages (`npm deprecate` flags); PyPI packages with no releases in years; archived GitHub repos (`archived: true`); Socket.dev/OpenSSF reports; libraries whose GitHub page shows "this repository has been archived by the owner."
- **Detection method:** Supply-chain scanners — `socket.dev` project scan, `ossf/scorecard` (`scorecard --repo <repo>`), `osv-scanner`, `npm audit`, `pip-audit`; manual: check last release date vs. 24 months on each load-bearing dep. Distinguish *mature-stable* (maintained slowly, fine) from *abandoned* (no activity, no response to issues).
- **Objective metric:** Count of load-bearing deps with `last_release > 24 months ago` or `archived == true`; fraction of the *core dependency surface* that is unmaintained.
- **Yellow flag (warning):** Unmaintained for 12–24 months, or single-maintainer bus-factor-1 libraries, in peripheral modules. *(Rationale: still a warning window — fork or replace before it compounds.)*
- **Red flag (critical):** Unmaintained > 24 months, or repo archived, or package revoked/unpublished, in *core* logic or on the auth/data path. *(Rationale: this is now permanent unpatched risk in the most sensitive code.)*
- **Example symptom:** "Our PDF generator's GitHub repo was archived two years ago. Last month a crafted PDF crashed the render worker. There's no fix to pull, and we now own the parser. Nobody had even noticed the repo was archived."
- **Blast radius:** Security (unpatchable CVEs), stability (bugs never fixed), legal (unclear maintenance), team morale (maintaining a stranger's library).
- **Remediation playbook:** Quick win: audit the dependency surface for abandoned libs and create a removal/swap ticket with a date. Structural fix: replace load-bearing abandoned libs with maintained alternatives or fork-and-own with a maintenance budget; pin to the exact version and wrap it behind your own interface so it's swappable.
- **Gold standard / target state:** Every load-bearing dependency either actively maintained or deliberately forked-and-owned; a quarterly "library health" review is on the calendar; no archived repos in the dependency surface.
- **Scoring guidance:** 3 = all maintained; 2 = abandoned libs in peripheral code with replacement planned; 1 = abandoned lib in a non-critical service or recent; 0 = abandoned lib in core/auth/data path.
- **Verify effort:** ⚡ ≤ 30 min — scanner output + last-release dates.

### ECOS-04 — Deprecated API Usage
- **Definition:** The codebase calls APIs the upstream ecosystem has formally deprecated, removed, or replaced — compiler deprecation warnings, deprecated framework methods, removed stdlib functions, or documented "do not use" surfaces.
- **Why it signals obsolescence:** Deprecation warnings are the ecosystem telling you exactly where your code will break next. Ignoring them means every dependency upgrade becomes a surprise; the code accumulates friction and loses compatibility, and it's a leading indicator that the code has been "touched less than the world moved."
- **Where it manifests:** Compiler/linter output (`DeprecationWarning`, `@deprecated`, `#[deprecated]`, ESLint `no-deprecated-api`), language build logs, framework upgrade guides (e.g., Django removal timelines, Rails `deprecated_columns`, Angular deprecation list), IDE warnings, docs.
- **Detection method:** Static analysis — compile with warnings-as-errors or `-Werror` in a canary build; AST/deprecation linters (`flake8-deprecated`, `eslint-plugin-deprecation`, `@deprecated` grep); framework's own deprecation checks (e.g., `django.checks`); grep for known-removed APIs from upgrade guides. Count warnings; classify by module.
- **Objective metric:** `count of deprecation warnings`; `% of deprecated calls in core domain files`.
- **Yellow flag (warning):** Deprecated APIs used in non-critical modules, with warnings suppressed or ignored. *(Rationale: warning-level risk — it will bite on the next upgrade but is not an emergency.)*
- **Red flag (critical):** Core business logic depends on deprecated or already-removed APIs, or calls APIs removed in the *next* LTS version of the framework. *(Rationale: the next upgrade is blocked, and removed APIs often have security implications.)*
- **Example symptom:** "Every build spews 200 DeprecationWarnings from the ORM layer. When we finally bump the framework for a security fix, three core queries no longer exist. The bump becomes a two-week archaeology project."
- **Blast radius:** Dependency/framework upgrade feasibility, security patches availability, code reader confusion, IDE refactoring reliability.
- **Remediation playbook:** Quick win: turn deprecation warnings into a CI-visible report (not silent); fix the 20 highest-value warnings. Structural fix: treat deprecation debt like feature debt — a quarterly "modernize the deprecated surface" slice; keep the target version's removal list as a tracked checklist.
- **Gold standard / target state:** Zero deprecation warnings in the core module build; a CI gate that fails (or reports) on new deprecation warnings; removal timelines tracked.
- **Scoring guidance:** 3 = no warnings; 2 = warnings in peripheral code; 1 = warnings in core, or in modules that will break next LTS; 0 = removed APIs already in use in core logic.
- **Verify effort:** ⚡ ≤ 30 min — clean build log + grep.

### ECOS-05 — License Compliance Risk
- **Definition:** Dependency licenses are unknown, ambiguous, or incompatible with how the codebase is distributed — with special danger from copyleft licenses (GPL/AGPL) in proprietary closed-source software.
- **Why it signals obsolescence:** Licensing problems are a *quiet* form of debt that surfaces only at acquisition, audit, or legal review — the worst possible time. An obsolete codebase often has an undisciplined dependency history, which is exactly how unknown-license and copyleft packages sneak in.
- **Where it manifests:** `package.json`/lockfiles with no `license` field, libraries with custom/unclear licenses (WTFPL, CC-BY-NC, "BSD without notice"), GPL/AGPL-licensed packages in a closed-source product, vendored code with licenses stripped, missing `NOTICE`/`THIRD_PARTY_LICENSES` files.
- **Detection method:** SBOM generation (`syft`, `bom`, `cyclonedx-cli`) + license scanning (`fossa`, `snyk`, `license-checker`, `pip-licenses`), `github/licensee`, `npx license-checker-rseidelsohn`. Generate an SBOM, classify each license, flag unknown/missing/copyleft.
- **Objective metric:** `% of packages with unknown/missing license`; count of copyleft (GPL/AGPL) packages; whether an SBOM/attribution file exists and is regenerated in CI.
- **Yellow flag (warning):** Unknown or ambiguous licenses present in transitive dependencies; no SBOM generated. *(Rationale: mostly discoverable and fixable, but the discovery tooling is missing — that's the warning.)*
- **Red flag (critical):** Copyleft licenses (GPL/AGPL) detected in a proprietary, closed-source distribution, or vendored copyleft code without notice. *(Rationale: this can force source release or trigger legal exposure — an exit-blocking defect.)*
- **Example symptom:** "Acquisition due diligence asks for an SBOM. We don't have one. Three weeks of scraping later, we find a GPL-3.0 image-processing library compiled into our closed-source binary since 2019. Legal goes cold."
- **Blast radius:** Legal/commercial deals, ability to distribute, enterprise sales (procurement asks for license reports), compliance audits.
- **Remediation playbook:** Quick win: generate an SBOM (`syft . > sbom.json`), wire it into CI, publish attribution files. Structural fix: add a license gate to CI (fail on GPL in closed-source), replace copyleft deps, retire unknown-license packages, review vendored code for stripped notices.
- **Gold standard / target state:** SBOM generated and attested on every release; license policy enforced in CI; zero unknown licenses; copyleft list reviewed quarterly and signed off.
- **Scoring guidance:** 3 = SBOM + compliant; 2 = no SBOM but licenses look clean; 1 = unknown licenses or a copyleft dep in peripheral code; 0 = copyleft/unknown in distributed closed-source product.
- **Verify effort:** 🔶 ~2–4 h — SBOM generation + classification, or 🔷 if the graph is deep.

### ECOS-06 — Dependency Bloat
- **Definition:** The dependency graph is inflated — hundreds/thousands of transitive packages, dozens of unused direct dependencies, multiple packages doing the same job, or full libraries pulled in for one function.
- **Why it signals obsolescence:** Dependency count is a proxy for attack surface, build time, and cognitive load. Modern practice trends toward smaller, composable, tree-shaken dependency surfaces. A bloated graph is also a smell that the codebase accreted rather than was designed — a hallmark of legacy.
- **Where it manifests:** Lockfiles with huge transitive counts (`npm ls --all`), `package.json` unused deps, `go mod why`, duplicates (`npm dedupe` output, `pipdeptree` showing the same lib 3 versions), bundle analysis (webpack/rollup reports), monorepo node_modules sprawl.
- **Detection method:** Tree inspection — `npm ls --prod`, `pipdeptree`, `bundle list`, `go mod graph | wc -l`, `cargo tree`; dead-dep detectors (`depcheck`, `knip` for unused); duplicate detection (`npm dedupe --dry-run`, `pipdeptree -d` showing dupes); bundle analyzers (`webpack-bundle-analyzer`). Count: total transitive deps, unused direct deps, duplicated packages.
- **Objective metric:** `total transitive dependency count`; `% of direct deps unused`; `duplicate package count/versions`.
- **Yellow flag (warning):** 100–300 transitive deps, or > 20% unused direct deps, in a mostly-clean graph. *(Rationale: still shippable, but the attack surface and maintenance drag are above modern norms.)*
- **Red flag (critical):** > 300 transitive deps, or orphaned deps that can't be removed (feature flagged forever), or duplicated versions of security-critical libs. *(Rationale: at this size the graph is un-auditable and upgrades break something every time.)*
- **Example symptom:** "The lockfile has 1,400 packages. Six different `lodash`-class utilities are vendored in. Every `npm audit` run prints a wall of 300 advisories, and no one can tell which path is actually vulnerable."
- **Blast radius:** Security auditability, CI install time, disk/artifact size, upgrade blast radius, supply-chain surface.
- **Remediation playbook:** Quick win: run `knip`/`depcheck`, remove unused direct deps, enable `npm dedupe`/lockfile optimization in CI. Structural fix: set a budget (e.g., "no net-new transitive deps without review"), replace kitchen-sink libs with narrow ones, dedupe semver ranges, and periodically prune.
- **Gold standard / target state:** Transitive count within a declared budget; zero unused direct deps; single version of every critical lib; dependency review is part of code review.
- **Scoring guidance:** 3 = lean, within budget; 2 = 100–300 transitive with some unused; 1 = > 300 or heavy duplication; 0 = un-auditable graph with orphaned security-critical duplicates.
- **Verify effort:** ⚡ ≤ 30 min — three commands, no setup.

### ECOS-07 — Build Reproducibility & Lockfile Integrity
- **Definition:** The build is not reproducible or not pinned: no lockfile, floating/mutable version ranges, builds that differ between machines/times, or a lockfile that is ignored or unmaintained.
- **Why it signals obsolescence:** Reproducibility is the foundation of trust — for security (you don't know what you shipped), for debugging (prod ≠ local), and for reliability (the build that worked Friday may fail Monday). Its absence is a hallmark of an era before supply-chain discipline, and it blocks almost every modernization step (safe upgrades, CI caching, SBOMs, canary rollouts).
- **Where it manifests:** No `package-lock.json`/`yarn.lock`/`poetry.lock`/`Gemfile.lock`/`go.sum`/`Cargo.lock` committed; `requirements.txt` without pins; version ranges (`>=1.0,<2`) in manifests; CI that does fresh installs into mutable registries; Docker builds without `--immutable`/`--frozen-lockfile`; builds that pull latest (`@latest`, `latest` tags).
- **Detection method:** File audit — check for committed lockfiles in git (`git ls-files | grep lock`), `npm ci`/`pip install -r` vs. `npm install`, CI logs for "added X packages" churn; reproducibility test: build twice in clean containers and diff output hashes; `npm shrinkwrap` diff; registry-pin checks (`--registry`, integrity hashes in lockfile v2/v3).
- **Objective metric:** `lockfile committed & current?`; `CI uses immutable install?`; `build artifact hash identical across two clean builds?`; `% of pinned vs. floating version specs`.
- **Yellow flag (warning):** Lockfile present but stale/partial, or immutable-install not enforced in CI. *(Rationale: a stale lockfile is worse than none — false confidence with drift.)*
- **Red flag (critical):** No lockfile at all, floating ranges in prod-critical deps, or CI installs mutably from a live registry with no integrity pins. *(Rationale: you cannot know what you shipped — a supply-chain and reliability blind spot.)*
- **Example symptom:** "CI has no lockfile; `npm install` pulls whatever the registry has. A transitive dep's maintainer publishes a breaking patch. Tuesday's build works, Wednesday's fails. Someone adds an empty `package-lock.json` 'to fix it' and commits it without running npm."
- **Blast radius:** Reproducible debugging, security forensics, cache efficiency, artifact provenance, canary/bisect operations, compliance.
- **Remediation playbook:** Quick win: commit the lockfile, switch CI to `npm ci`/`pip install --require-hashes`/`--frozen-lockfile`, add a "lockfile up-to-date" CI check. Structural fix: adopt content-hash pinning, build from clean containers, produce provenance attestations (SLSA level 1→2), verify registry integrity.
- **Gold standard / target state:** Lockfile committed and current; CI immutable install; two clean builds produce byte-identical artifacts; SLSA provenance generated per release.
- **Scoring guidance:** 3 = lockfile + immutable CI + reproducible; 2 = lockfile but stale or not enforced; 1 = lockfile absent in some services; 0 = no lockfile, floating ranges, mutable installs in core path.
- **Verify effort:** ⚡ ≤ 30 min — git ls-files + CI config check; double build is 🔶.

### ECOS-08 — Framework Lock-in & Monoculture Risk
- **Definition:** The system is deeply locked to a framework/ecosystem whose maintenance status is declining, whose roadmap is hostile or migrating away, or where the org's options are foreclosed (e.g., a bespoke fork, a dead vendor, or a proprietary dependency you can't exit).
- **Why it signals obsolescence:** Lock-in itself isn't debt — *dying* lock-in is. When the framework you bet on stops evolving (or its community migrates), the codebase becomes progressively harder to staff, secure, and extend. This indicator separates "old but fine" from "obsolete."
- **Where it manifests:** Framework status pages (AngularJS EOL, jQuery, Spring Framework lifecycle, Laravel, Django support policy), vendor announcements (SaaS/PAAS framework retirements), community exodus signals (Stack Overflow trends, job postings, contributor decline), custom forks of OSS that must be maintained in-house, license changes that foreclose use.
- **Detection method:** Lifecycle audits — framework official support matrix; `endoflife.date`; contributor/release cadence (GitHub `commits since`); internal "how stuck are we" test: `how hard is a 1-line change to the framework?`; check org skill availability (jobs, interviews); vendor dependency review (single-vendor lock for core).
- **Objective metric:** `framework support status (active/maintenance/EOL)`; `years since last non-security release`; `# of core business flows coupled to framework-specific abstractions`; `single-vendor share of critical path`.
- **Yellow flag (warning):** Framework in maintenance mode, or community clearly migrating, while the org still has a migration path. *(Rationale: this is the time to plan the exit, while the path is cheap.)*
- **Red flag (critical):** Framework is EOL, vendor-retired, or license-change-foreclosed, with core logic coupled to it and no viable migration path. *(Rationale: the platform is sinking under the codebase; this is a rewrite driver.)*
- **Example symptom:** "We built the product on AngularJS 1.x. Google EOL'd it in 2021. The security scanner now flags it; the two engineers who knew it left. Every candidate interview starts with 'why are you still on this?'"
- **Blast radius:** Staffing, security, feature velocity, ecosystem tooling (CI templates, IDE plugins, libraries all assume the new world).
- **Remediation playbook:** Quick win: quantify the coupling (which modules touch framework-specific APIs directly) and freeze scope on framework-dependent features. Structural fix: extract the framework behind a facade at the boundaries (ports & adapters), migrate incrementally module-by-module on the critical path, keep the system runnable through the whole migration.
- **Gold standard / target state:** Framework either current-and-supported, or the core logic is framework-independent behind an interface with an active migration plan.
- **Scoring guidance:** 3 = framework current/supported; 2 = maintenance mode, exit plan exists; 1 = EOL-ish framework in isolated module; 0 = EOL/retired framework in core logic with no path (overlaps G3).
- **Verify effort:** ⚡ ≤ 30 min — lifecycle page + a quick coupling grep.

---

## Deep-dive indicators

### ECOS-09 — Version Skew Across Services
- **Definition:** In a multi-service system, the same dependency/framework exists at many different major versions across services (e.g., service A on Python 3.9, service B on 3.12; shared libraries at 3 different majors), with no coordinated upgrade strategy.
- **Why it signals obsolescence:** Skew means the "system" has no coherent platform — every service is a snowflake with its own dependency museum. It multiplies upgrade effort (one fix, N upgrades), blocks shared tooling, and signals that the org has no platform discipline. It's the system-level echo of ECOS-02.
- **Where it manifests:** Cross-repo version manifests, dependency dashboards, `renovate`/`dependabot` aggregated reports, internal platform teams' inventory, container registry image tags showing runtime variety.
- **Detection method:** Aggregate manifests across repos (script it: grep `FROM | python-version | framework version` across repos), use a central platform inventory, run a single dependency scan across the org's repos and diff versions by service; count distinct majors per load-bearing dependency.
- **Objective metric:** `# of distinct major versions per core dependency`; `% of services on the platform's "reference" version`; `std-dev of runtime versions`.
- **Yellow flag (warning):** 2–3 majors of a core dependency in flight, with a shared upgrade backlog. *(Rationale: tolerable drift, but it already costs you in shared fixes.)*
- **Red flag (critical):** Core dependency at 3+ distinct majors, or runtimes so varied that shared tooling/CI can't support them. *(Rationale: you're maintaining N platforms, not one — every security fix is multiplied.)*
- **Example symptom:** "A critical CVE in a shared HTTP client affects services on v2, v3, and v4. Three separate fix PRs, three rollout windows, and one service on v2 that needs an incompatible change to even accept the patch. Same fix, three times the risk."
- **Blast radius:** Security fix latency, shared-library breakage, onboarding, CI/tooling matrix explosion, platform standardization efforts.
- **Remediation playbook:** Quick win: inventory the skew, pick a "platform baseline" version, and make new work use it. Structural fix: establish a platform/boilerplate team with a version cadence; migrate oldest-first on the critical path; add cross-service tests for the shared contract; sunset divergent majors with deadlines.
- **Gold standard / target state:** One supported major of every core dependency per system; upgrade cadence managed centrally; a new service starts on the platform baseline.
- **Scoring guidance:** (deep-dive — no rubric row) 3 = uniform; 2 = two majors in flight with a plan; 1 = three majors with no coordination; 0 = divergent snowflakes with no platform baseline.
- **Verify effort:** 🔷 ~1–2 days — repo aggregation + scripting.

### ECOS-10 — Supply-Chain: Typosquatting, Malware, & Registry Risk
- **Definition:** Deep exposure to malicious packages (typosquatting, dependency-confusion, hijacked/malware packages), or the org has no defense in depth (no signature verification, no registry pinning, no provenance checks, no OpenSSF hygiene) across the dependency graph.
- **Why it signals obsolescence:** This is the *newest* axis of debt. An obsolete codebase predates supply-chain tooling entirely, so it usually has none. If you can't attest where your code comes from, you're running a modern system with 2016-era supply-chain hygiene.
- **Where it manifests:** Lockfiles with suspiciously-named packages, private-registry name collisions, packages with `mvnrepository`-style confusion, GitHub Actions pinned to tags not SHAs, no `OpenSSF Scorecard` run, no `Socket.dev`/`OSV` scan in CI, unverified registry endpoints, ad-hoc `curl | bash` installs.
- **Detection method:** Deep SCA — `socket.dev` (malware/typosquatting/provenance), `openssf/scorecard`, `osv-scanner`, `npm audit --parseable` cross-referenced, `pip-audit`, `trivy --scanners vuln,secret`; manual: check suspicious package names (one-char diffs), release provenance, maintainer accounts; audit GitHub Actions for tag-pinned third-party actions.
- **Objective metric:** `OpenSSF Scorecard score` (0–10); `# of packages with no provenance/verified publisher`; `# of third-party CI actions pinned to mutable refs`; presence of `socket.dev`-class scan in CI.
- **Yellow flag (warning):** Scorecard 5–7, no malware found, but no provenance verification and actions pinned to tags. *(Rationale: no active infection but no defense either.)*
- **Red flag (critical):** Known malware/hijacked package in the lockfile, or scorecard < 5 with zero supply-chain scanning anywhere. *(Rationale: active or credible infection risk with no visibility — treat as incident-level.)*
- **Example symptom:** "A dev typos `request` as `requestss`. Three weeks later the CI boxes start connecting to a foreign endpoint. The 'package' was published by a squatting account and 4,000 builds pulled it. Nothing in our pipeline would have caught it."
- **Blast radius:** Secrets/exfiltration, CI infrastructure compromise, legal, public trust, downstream customers.
- **Remediation playbook:** Quick win: run socket.dev/scorecard immediately, pin all CI actions to SHAs, enable `--lockfile` integrity and verified-publisher checks, scan for squat-named packages. Structural fix: registry pinning, SBOM + provenance attestation (SLSA), private registry mirror with scanning, incident runbook for a compromised package, least-privilege CI tokens.
- **Gold standard / target state:** Scorecard ≥ 8, all actions SHA-pinned, provenance verified per release, malware scan wired into CI as a gate, squatted-name watchlist.
- **Scoring guidance:** (deep-dive — no rubric row) 3 = scorecard ≥ 8 + provenance; 2 = scanning present, pins loose; 1 = no scanning, tag-pinned actions; 0 = malware/hijack suspected or confirmed.
- **Verify effort:** 🔷 ~1–2 days — scanner runs + action/CI audit.
