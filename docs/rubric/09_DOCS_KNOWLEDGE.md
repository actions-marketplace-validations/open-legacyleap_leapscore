# 09 — Documentation & Knowledge Continuity

> **Canonical rubric category.** Base weight: 5% · FE-active weight: 4.5% · Standard indicators: DOCS-01–08 · Deep-dive indicators: DOCS-09–10.
>
> **One-line thesis:** Documentation is the difference between a codebase that *is* and a codebase that *can be learned*. In an obsolete system, every question is answered by one person, one memory, or one archaeology session.
>
> This file owns the category's indicator definitions and scoring semantics. Shared weights, formulas, thresholds, and gates are defined in [`11_WEIGHTS_THRESHOLDS_CONFIG.md`](./11_WEIGHTS_THRESHOLDS_CONFIG.md); implementation recipes are in [`docs/specs/`](../specs/README.md).

**Category summary:** Scores the written knowledge around the codebase — decisions (ADRs), operations (runbooks), onboarding, API surface, changelogs/release communication, and the balance between code comments and self-documenting code. Weighted lowest (5%) because it's amplifyable rather than causal — but it's the category that makes every other debt *discoverable*.

---

## Standard indicators (DOCS-01–08)

### DOCS-01 — Missing Architectural Decision Records (ADRs)
**Engine tier:** A · **Default status:** measured · **Scope/overlaps:** decision-record inventory; oral-only decisions are DOCS-05.
- **Definition:** There's no record of *why* the system is the way it is — no ADRs, no design docs, no decision history. Ask "why did we choose X?" and the answer is a memory, a Slack thread, or a shrug.
- **Why it signals obsolescence:** Undocumented decisions are how obsolete architecture persists: nobody can change a decision they can't see, so every "why is this like this?" defaults to "always has been" and stays frozen. ADRs turn frozen architecture into revisitable choices, and their absence makes the codebase a museum no one can curate.
- **Where it manifests:** No `docs/adr/`, no design doc history, decisions argued in Slack/meetings with no record, "why is this here" questions with no citation, PRs that make major architecture choices with no written rationale.
- **Detection method:** Documentation inventory — is there an ADR/decision doc location and process? Sample 10 consequential architecture decisions (from git history/reviews) and check each has a written rationale + alternatives ("nd": what would a new engineer find?); check code comments "why" density vs. "what".
- **Objective metric:** `# of consequential decisions with a written ADR`; `decision trail completeness (%)`; `ADR process exists (template/tooling)?`; `time-to-answer "why X" for a new hire`.
- **Yellow flag (warning):** Some design docs exist, ADR convention unofficial or partial, several big decisions undocumented. *(Rationale: warning — recoverable, the trail is mostly findable.)*
- **Red flag (critical):** No decision records anywhere; consequential choices (datastore, architecture, integration) only live in heads/historical memory. *(Rationale: the codebase is a black box of extinct reasoning — you cannot evolve what you cannot explain.)*
- **Example symptom:** "The team wants to modernize the reporting stack. The question 'why did we choose this ETL design?' gets: 'I think it was the 2018 architecture meeting? Wasn't me.' No document says. The modernization brief is written into fog."
- **Blast radius:** Modernization feasibility, decision reversibility, onboarding, recurring re-litigations ("why is this here?" fights), institutional memory.
- **Remediation playbook:** Quick win: write ADRs for the top 10 load-bearing decisions (interview the oldest engineers, mine git/past docs), establish a template + PR requirement for consequential choices. Structural fix: ADR convention in the repo (ADR-NNN, status, decision, context, alternatives considered), decisions now documented at review time, an "explain every load-bearing choice" refactoring task.
- **Gold standard / target state:** Every consequential decision has an ADR with alternatives; new decisions document as standard practice; teams can revisit a decision on evidence, not memory.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = ADR-covered; 2 = partial docs; 1 = sparse/undocumented core; 0 = no decision trail exists.
- **Verify effort:** 🔶 ~2–4 h — decision inventory + doc audit.

### DOCS-02 — Stale / Drifted Documentation
**Engine tier:** B · **Default status:** estimated · **Scope/overlaps:** doc staleness vs. code; runbook currency is DOCS-03, docs-CI fix is DOCS-09.
- **Definition:** Documentation exists but is outdated — it contradicts code, describes removed features, references old commands, and the team has learned not to trust it ("the wiki is lies").
- **Why it signals obsolescence:** Stale docs are worse than none: they actively mislead, waste time, and train people to skip docs entirely — which then *creates* the tribal-knowledge problem (DOCS-05). Drift is the natural state of unowned docs, and its prevalence is a sign the team stopped investing in knowledge as code changed.
- **Where it manifests:** README describing commands that don't work, docs referencing `v1` endpoints, arch diagrams from a dead era, code comments contradicting behavior, docs/wiki with "update TBD" for months, misleading runbooks/troubleshooting.
- **Detection method:** Doc-vs-code diff — sample docs (README, setup, API docs) and verify commands/URLs/fields against reality; check "last updated" dates vs. code change dates for the subjects (correlation); grep docs for removed symbols (imports/endpoints flagged in analyzers). Ask a new hire: did you trust the docs?
- **Objective metric:** `% of doc commands that actually run`; `median doc staleness (last-update vs. code-change)`; `% of docs misdescribing current code (sampled)`; `team trust rating of docs`.
- **Yellow flag (warning):** Some docs outdated, diluted maintenance, trust mostly intact. *(Rationale: warning — the rot is present but not yet terminal.)*
- **Red flag (critical):** Docs widely contradict code — no one trusts them, setup/runbooks are known-wrong, README is "historical artifact." *(Rationale: documented knowledge is dead weight; all knowledge must move to heads (making DOCS-05 inevitable).)*
- **Example symptom:** "README says `cd app && npm start`. The command 404'd. The deploy doc references a console that doesn't exist. Someone updates the README — badly — and now two docs exist, both slightly wrong."
- **Blast radius:** Onboarding time, debugging detours, runbook trust, tribal knowledge growth, modern planning (docs as a source of truth).
- **Remediation playbook:** Quick win: a doc-rot sweep (delete/rewrite the worst 10), add "last verified" dates, a github-issues link on every doc page so inaccuracies are reportable with one click. Structural fix: docs-as-code with CI verification (commands in docs execute in a test fixture — DOCS-09), ownership per doc, "docs touched in the same PR as code" rule.
- **Gold standard / target state:** Docs match code; commands in docs are CI-verified; a doc is as trustworthy as code, and updated with it.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = docs verified current; 2 = partial staleness; 1 = widely stale, partly trustworthy; 0 = docs are lies, trust is dead.
- **Verify effort:** ⚡ ≤ 30 min to sample-verify.

### DOCS-03 — Missing Runbooks & Operational Docs
**Engine tier:** B · **Default status:** unknown · **Scope/overlaps:** operational procedures; MTTR outcomes are VEL-12, docs pipeline is DOCS-09.
- **Definition:** There are no runbooks — no documented incident response, no restore/rollback procedures, no "what to do when X breaks" — so every operational event is improvised live, at 3am, by the bravest person.
- **Why it signals obsolescence:** Runbooks are what turn an incident from a fire into a procedure. Their absence is the operational twin of no tests: you only find out you don't have one while you're on fire. It compounds VEL-12 (MTTR), converts every outage into heroics, and burns out everyone on-call.
- **Where it manifests:** No `docs/runbooks/` or ops wiki, on-call without procedures ("just figure it out"), restored-from-memory steps, "the person who knows" must be woken up, no post-incident doc updates.
- **Detection method:** Runbook inventory — list the top 10 outage/incident classes (from incident history) and check each has: detection (dashboard/alert), diagnosis (where to look), mitigation (restore steps), escalation (who/when). Test: hand a junior on-call the runbook for the top incident and observe whether they can execute it.
- **Objective metric:** `runbook coverage % of incident classes`; `runbook currency (last update vs. infra change)`; `time-to-mitigate with vs. without runbook (postmortem comparison)`; `on-call confidence survey`.
- **Yellow flag (warning):** Runbooks for some incident types, others improvised; runbook vs. infra drift. *(Rationale: warning — the fires you planned for are fine, the others are gamble-rated.)*
- **Red flag (critical):** No runbooks at all (or runbooks so wrong they're harmful); incidents are recovered by heroics every time. *(Rationale: the recurrence of incidents is structural — you will repeat every lesson, forever.)*
- **Example symptom:** "3am queue-backlog incident: the on-call finds no runbook, greps 40 files, pings the 'guy who knows' (asleep), and recovers by experiment. The postmortem writes 'learned lesson' — into a report nobody reads, unturned into a runbook."
- **Blast radius:** MTTR, on-call burnout, incident recurrence, escalation chaos ("who owns this?"), compliance (evidence of response).
- **Remediation playbook:** Quick win: write runbooks for the top 5 incident classes today (postmortem-driven), make them linkable from alert dashboards, add "runme at the first sign" steps. Structural fix: runbook-as-product (owned, tested, games rehearsed), alert→runbook binding, postmortem = runbook update, drill the top runbook quarterly.
- **Gold standard / target state:** Every incident class has a current, tested runbook; on-call executes procedures not improv; incident time is dominated by execution, not discovery.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = complete + drilled; 2 = partial coverage; 1 = sparse / drifting; 0 = no runbooks, heroics-only.
- **Verify effort:** 🔶 ~2–4 h — incident-class inventory + runbook check.

### DOCS-04 — No Onboarding Guide / Developer Setup Docs
**Engine tier:** B · **Default status:** estimated · **Scope/overlaps:** setup/golden-path guide; time-to-first-PR is VEL-05, fresh-clone harness is ARCH-09.
- **Definition:** There's no effective developer-onboarding documentation — no golden path for setting up, running, and contributing; new engineers learn by being told, in person, repeatedly.
- **Why it signals obsolescence:** A codebase with no written setup path is one where knowledge is not transferable at scale (teams can't grow, turnover is expensive). It's also the *first* documentation every candidate/mentor checks — its absence colors the entire repository's reputation. (Connects directly to VEL-02/VEL-05.)
- **Where it manifests:** No CONTRIBUTING/onboarding guide, setup only in a personal doc, "ask on day 1" lists, README that skips setup ("just ask"), no local-env golden path, no "first PR" guide.
- **Detection method:** Onboarding-doc audit — does CONTRIBUTING/GETTING_STARTED exist, is it current (commands run — tie to DOCS-02 verify), does it cover setup→run→test→contribute→deploy to local? Time a new engineer against it (already measured in VEL-05); survey "what did setup cost you?".
- **Objective metric:** `existence + currency of an onboarding/golden-path doc`; `time-to-first-green-local per the doc`; `% of onboarding steps covered in writing vs. told`; `new-hire survey on doc usefulness`.
- **Yellow flag (warning):** Setup doc exists but incomplete/stale; much onboarding is still oral. *(Rationale: warning — there's a skeleton, the muscle is word-of-mouth.)*
- **Red flag (critical):** No onboarding guide at all (or it's known-wrong — DOCS-02), every hire learns the setup from a human. *(Rationale: team growth and knowledge transfer are structurally capped at one-person-at-a-time.)*
- **Example symptom:** "Day 1, the new engineer gets a Zoom link: 'I'll walk you through setup.' Three days later, they have a working DB and no written note of how. The next hire repeats the exact same three days — and the 'setup expertise' is now in two heads."
- **Blast radius:** Onboarding cost, team scaling, VEL-05 (first-PR time), knowledge concentration (DOCS-05), candidate/mentor perception.
- **Remediation playbook:** Quick win: write the golden path (clone → setup → run → test → first PR) and verify every command executes, add CONTRIBUTING.md. Structural fix: golden path CI-verified (fresh container proves it — DOCS-09), onboarding checklist wired into the ticket system, "setup docs break" = blame-the-repo not the human.
- **Gold standard / target state:** A new hire takes < 2 hours to a working local env entirely from docs; the setup guide is CI-tested and always current.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = golden path verified; 2 = drafted, partially stale; 1 = skeletal/oral-reliant; 0 = no guide, setup is word-of-mouth.
- **Verify effort:** ⚡ ≤ 30 min — doc existence + dry-run.

### DOCS-05 — Tribal Knowledge & Oral Tradition
**Engine tier:** D · **Default status:** unknown · **Scope/overlaps:** knowledge held in heads; written decisions are DOCS-01, exit/ownership is DOCS-10.
- **Definition:** A significant fraction of "how this system actually works" exists only in people's heads — operational quirks, historical constraints, failure lore, "why" explanations — with no written representation, and the most senior people are walking liabilities (and/or mobbed with questions).
- **Why it signals obsolescence:** When knowledge exists only in heads, the codebase's REAL behavior is not inspectable — it's interpersonal. This is the human form of undocumented architecture (DOCS-01) and it's near-universal in legacy systems: every "ask Dave" IS a missing document. It also blocks delegation, review, and modernization scoping (you can't cross-reference what's not recorded).
- **Where it manifests:** "Let me ask X" for routing decisions, the "runbook of knowledge" person, meeting notes as the only record, wiki search returns nothing, a new feature requires a listening tour, critical "maybe it does X" (uncertain) behaviors.
- **Detection method:** The "departure drill" — pick a critical module, ask "if the primary expert left Friday, what changes Tuesday?"; count how many "how-does-this-work" questions get answers *from documents* vs. *from people*; run a Q&A session with juniors and log the share of answers with no written source.
- **Objective metric:** `% of functional questions answerable from written sources`; `# of "ask-the-person" dependencies`; `# of undocumented behaviors in a critical module`; `knowledge-exit simulation time-to-recover`.
- **Yellow flag (warning):** A few critical modules are oral-only; several "ask Dave" dependencies. *(Rationale: warning — the tax is real but bounded.)*
- **Red flag (critical):** The system as a whole is maintained by oral tradition — most decisions/behaviors have no written record and the primary carriers are 1–2 people. *(Rationale: the codebase functions as a social memory — losing the carriers loses the system.)*
- **Example symptom:** "'Why does the night batch process at 2:07 specifically?' — 'Dave knows.' 'Dave' knows 40 such unrecorded facts. The modernization kickoff is a 6-week interview tour because nothing is written anywhere."
- **Blast radius:** Bus factor (VEL-06), onboarding, modernization scoping, review, delegation, incident diagnosis ("person knowledge" needed), retention risk.
- **Remediation playbook:** Quick win: run the departure drill on the top module — write the unrecorded facts as docs/ADRs/runbooks, pair-document with the oral experts. Structural fix: "write it down or it doesn't exist" culture (every knowledge answer → doc link), knowledge-review on critical modules, retiring the phrase "ask X" in favor of "read the doc," interview-capture sessions for missionaries.
- **Gold standard / target state:** 90%+ of functional questions answerable from written sources; no module depends on a person's memory; the departure drill yields a weekend, not a collapse.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = written-answerable; 2 = a few oral modules; 1 = core mostly oral; 0 = entire system runs as social memory.
- **Verify effort:** 🔶 ~2–4 h — Q&A audit + departure drill.

### DOCS-06 — Comment Debt & Self-Documenting Code Imbalance
**Engine tier:** A · **Default status:** estimated · **Scope/overlaps:** comments and naming; code shape is ARCH-01, API surface docs are DOCS-07.
- **Definition:** Code comments are misleading, obsolete, or restate the obvious ("increment i"), while intent, invariants, and "why not X" are undocumented — OR the code is so cryptic that comments exist as apology. Either way, the code's *intent* is not readable from the code itself.
- **Why it signals obsolescence:** Comment debt is the texture of maintenance neglect: comments that lie are worse than none (they train readers to skip them), and code that can't explain itself passes its meaning down as folklore. Modern practice is self-documenting code (clear names, small functions, explicit intent) + honest "why" comments only where needed. (This is the micro-level of the whole knowledge problem.)
- **Where it manifests:** Comments saying `// TODO: fix this` 5 years old, comments that contradict the next line, copy-pasted comments, naming like `x2`, `doStuff`, magic numbers with no explanation, dead comment blocks, no "why" comments near non-obvious invariants.
- **Detection method:** Sample-based review — read 200–500 lines of each critical module: are names self-explanatory? Do comments explain "why" or just paraphrase "what"? Grep for TODO/FIXME/XXX/HACK and check age (git blames their introduction), misleading-comment ratio (does comment match behavior?), and naming quality (identifier length/verb-noun check).
- **Objective metric:** `TODO/FIXME age distribution (median age)`; `misleading-comment ratio (sampled)`; `self-documenting score (naming + small functions)`; `% of comments that are "why" vs. "what"`.
- **Yellow flag (warning):** TODO-rot present, some cryptic naming, some redundant/paraphrase comments. *(Rationale: warning — texture is degrading, readability is paying.)*
- **Red flag (critical):** Code is cryptic and comments are required to decode it — or comments actively contradict the code, and the standard is "trust the comment? trust the code? flip a coin." *(Rationale: the code cannot be read as truth — it must be decoded, which is why fixes are always risky.)*
- **Example symptom:** "`// Do not change this function` — nobody knows why, the comment's 8 years old, and the function is called `fix()` with args `a` and `b`. The reader has a choice of three falsehoods and one mystery."
- **Blast radius:** Fix risk (misreading), onboarding, review quality, refactor safety, tribal knowledge (DOCS-05) — comments are the first sudo-documentation people trust.
- **Remediation playbook:** Quick win: kill the top 20 misleading/obsolete comments (fix or delete), resolve/add justification for the oldest TODOs, rename the worst identifiers. Structural fix: self-documenting-code standards in review (naming, small functions), "why" comments for invariants, comment lint (TODO age alarm), and a "readability" gate on the module most touched on-call.
- **Gold standard / target state:** Code reads like prose (names carry intent), comments exist only for true "why", TODO-rot is gone, and a reader can trust line 1 to mean line 1.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = self-documenting, honest comments; 2 = TODOs + paraphrase rot; 1 = cryptic + misleading mix; 0 = comments are the only decoder and/or they lie.
- **Verify effort:** 🔶 ~2–4 h — sample review + grep/TODO-age.

### DOCS-07 — Missing API Documentation
**Engine tier:** A · **Default status:** estimated · **Scope/overlaps:** consumer-facing API docs; the contract itself is API-01, generation is DOCS-09.
- **Definition:** The API has no consumer-facing documentation — no OpenAPI/spec (from API-01), no reference docs, no examples, no guides — so consumers (internal or external) learn by reading code or probing endpoints.
- **Why it signals obsolescence:** Undocumented APIs are un-sellable, un-boardable, and un-debuggable. For any multi-team or external surface, docs are the interface; their absence forces every consumer to reverse-engineer, producing integration bugs and support load. (Related to but distinct from API-01's *contract*: docs of a contract is what consumers actually read.)
- **Where it manifests:** No developer portal/docs page, no usage examples, no auth/endpoint reference, "check the code, the naming's obvious," docs that only exist in a colleague's head, support tickets answering "how do I use X endpoint."
- **Detection method:** Docs inventory — a developer-facing doc/test for each endpoint exists (examples, params, responses)? Can a stranger integrate without asking a human? Check tooling (Swagger UI/ReDoc/portal generation tied to the contract), support-ticket analysis for "how do I use /" volume.
- **Objective metric:** `% of endpoints with consumer-facing reference + examples`; `time for a stranger to integrate a given endpoint`; `"how-to-use" support volume`; `portal/spec-published existence`.
- **Yellow flag (warning):** Some endpoints documented, others skeletal; docs partial/mixed-quality. *(Rationale: warning — documentation exists, coverage is patchy.)*
- **Red flag (critical):** No consumer-facing API documentation at all, or it's so stale it misleads (DOCS-02 applies), consumers reverse-engineer everything. *(Rationale: what isn't documented isn't accessible — the API is effectively a private contract wearing public clothes.)*
- **Example symptom:** "The partner wants to integrate. They ask for docs. The answer is a link to a code file. Three integrations later, support's inbox is 30% 'how do I use this' tickets — the docs deficit is now a support headcount."
- **Blast radius:** Integration velocity, external ecosystem, support load, sales/partner friction, debugging, onboarding.
- **Remediation playbook:** Quick win: publish the OpenAPI/spec with a generated reference (Swagger UI/Redoc), add examples for the top 10 endpoints, write an auth quickstart. Structural fix: docs generated from contract in CI (spec is source, docs are output — DOCS-09), consumer guides for the top use cases, updated with each contract change, "docs in same PR" rule.
- **Gold standard / target state:** Every endpoint has a current, generated reference with examples; a stranger self-serves; docs update with the contract in the same change.
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = current generated docs; 2 = partial; 1 = sparse/misleading; 0 = no docs; consumers reverse-engineer.
- **Verify effort:** 🔶 ~2–4 h — docs inventory + stranger-integration test.

### DOCS-08 — No Release Communication / Changelog
**Engine tier:** B · **Default status:** measured · **Scope/overlaps:** release/changelog communication; versioning contract is API-02, consumer blindness is API-08.
- **Definition:** There's no changelog, no release notes, no migration guides, no announcement channel for API/behavior changes — consumers and users discover breaking changes by finding them the hard way.
- **Why it signals obsolescence:** Release communication is the social layer of an API: even perfect versioning (API-02) is useless if nobody learns about it. In a legacy system, this absence is typical of "release day = nobody's informed" — and it's the mechanism by which every breaking change becomes a support incident. (Companion to API-08's consumer blindness.)
- **Where it manifests:** No CHANGELOG.md, no release notes, repos without semantic-release, breaking changes announced "via the grapevine," migration guides written after the damage, rebrands/deprecations silent.
- **Detection method:** Release-communication audit — changelog exists + auto-generated? Release notes published to consumers/users (email/blog/portal)? Breaking changes get migration guides (docs link in the breaking commit)? Interview consumers: "how did you hear about the last breaking change?" — if the answer is "we broke," it's absent.
- **Objective metric:** `changelog exists + current? (per repo)`; `% of breaking changes with a published migration note`; `" heard about it from the incident" rate`; `release notes tooling present?`.
- **Yellow flag (warning):** Changelog exists but irregular/manual, migration notes sometimes written, announcements ad hoc. *(Rationale: warning — the channel exists, the discipline is thin.)*
- **Red flag (critical):** No changelog or release notes at all, breaking changes ship unannounced, consumers/users learn from failures. *(Rationale: the product's change contract with its ecosystem is void — every change is a surprise tax.)*
- **Example symptom:** "The mobile app update silently broke a field the frontend depended on. The changelog 'didn't exist this quarter.' User reviews: 'what happened to my reports?' — the breaking change was discovered by customers, collectively, on release day."
- **Blast radius:** Consumer trust, incident volume, ecosystem velocity, support load, versioning value (API-02) — you can't get the benefit without the communication.
- **Remediation playbook:** Quick win: adopt a CHANGELOG process (Keep-a-Changelog, auto-generated from commits/PRs), publish release notes for the top consumers, write migration guides for open breaking changes (backfill). Structural fix: semantic-release automation (version + changelog + notes automated), a release-communication channel (port status page + email), "breaking = migration guide in same MR" rule.
- **Gold standard / target state:** Every release has automated notes; every breaking change has a migration guide published with the change; consumers hear first, break never (silently).
- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = automated notes + guides; 2 = changelog manual/irregular; 1 = notes absent, changes announced late; 0 = no communication, change-by-surprise.
- **Verify effort:** 🔶 ~2–4 h — release-history + consumer-survey audit.

---

## Deep-dive indicators (DOCS-09–10)

### DOCS-09 — Docs-as-Code & Automation
**Engine tier:** A · **Default status:** estimated · **Scope/overlaps:** docs-as-code automation; staleness it prevents is DOCS-02, API spec source is API-01.
- **Definition:** Documentation is not treated as code — no docs CI, no generated-from-contract docs, no docs freshness checks, no "docs in CI" — so every doc rots (DOCS-02) and the only guarantee is entropy wins.
- **Why it signals obsolescence:** Docs-as-code is the engineering answer to doc rot: generate what can be generated (API specs → reference), verify what can be verified (commands in docs run in CI), fail on fresh rot (staleness checks). Its absence means the knowledge layer depends on human discipline forever — and that's how it died in the first place.
- **Where it manifests:** Docs stored without CI/test, `~/docs` or personal folders, OpenAPI spec unused for generation, no linting of docs, no doc-freshness verification, "regenerate docs" not part of release, docs repo excluded from quality gates.
- **Detection method:** Docs-pipeline audit — is there a docs CI (build, lint, links)? Are API docs generated from contract in CI (spec → reference)? Are runbook commands verified/tests? Is doc freshness checked (staleness gates, last-verified markers)? Can a doc change break the build (intentional)?
- **Objective metric:** `docs CI presence (build/lint/link/generate)`; `% of doc content generated from source of truth (spec/schema/code)`; `% of doc commands CI-verified`; `staleness gate present?`
- **Yellow flag (warning):** Some generated docs (spec → reference), no docs CI pipeline, freshness unguarded. *(Rationale: warning — the artifacts exist, the machine does not.)*
- **Red flag (critical):** All docs hand-maintained, nothing generated/verified/tested, no docs CI — docs will rot and the team knows it. *(Rationale: the knowledge layer has no immune system — DOCS-02 is guaranteed, not accidental.)*
- **Example symptom:** "The OpenAPI file exists but its only consumer is a person regenerating docs 'whenever someone remembers.' The docs CI 'struggle' was abandoned in 2021. The freshness check is a Word doc with 'please update' comments."
- **Blast radius:** Doc rot recurrence, DOCS-02/07 (API reference drifts), onboarding trust, maintenance cost of the knowledge layer.
- **Remediation playbook:** Quick win: wire docs generation into CI (spec → reference), add links/lint checks for markdown, CI-verify the top setup commands (fresh container). Structural fix: full docs-as-code — generate what's generatable, verify what's actionable, staleness gates (docs touch-required on code change), docs failures block merge like code failures.
- **Gold standard / target state:** Docs build like code, generate from truth, verify their own commands, and fail CI on rot — the knowledge layer is as maintained as the code.
- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = docs CI + generation; 2 = partial generation, no pipeline; 1 = hand-maintained, verified sporadically; 0 = unreinforced hand-maintenance.
- **Verify effort:** 🔷 ~1–2 days — docs-pipeline audit + fresh-container run.

### DOCS-10 — Knowledge Exit & Documentation Ownership
**Engine tier:** D · **Default status:** unknown · **Scope/overlaps:** ownership and offboarding capture; oral knowledge is DOCS-05, unowned rot is DOCS-02.
- **Definition:** Documentation has no owner and no process for the "knowledge exit" (when people leave, what they knew leaves with them) — no docs champion, no offboarding knowledge capture, no doc ownership map, and institutional memory leaves in the same car as the departing engineer.
- **Why it signals obsolescence:** Knowledge continuity is how a system survives turnover; its absence is why "that person left and now we're stuck" is the most common legacy story. Documentation without ownership rots (root of DOCS-02); knowledge without an offboarding ritual is lost at clock-out pace. This is the *management* of the whole category.
- **Where it manifests:** No docs owner/maintainer role, no offboarding checklist capturing knowledge, "X left and took the runbook in his head," unowned wiki sprawl, no documentation-review cadence, docs written by whoever had PTO guilt.
- **Detection method:** Ownership audit — who maintains each doc/module's knowledge? Offboarding process: does the checklist include knowledge capture (walkthroughs, runbooks, ADRs, ticket handover)? Post-departure incidents attributable to knowledge loss? Doc-new-content rate vs. doc-decay rate (is the library growing or rotting?).
- **Objective metric:** `docs with a named owner (%)`; `offboarding knowledge-capture coverage %`; `post-departure knowledge-loss incidents`; `net doc growth rate (new vs. stale)`; `docs champion role exists?`
- **Yellow flag (warning):** Some docs owned, offboarding capture partial, a couple of knowledge-loss incidents. *(Rationale: warning — the drain is real and mostly unmanaged.)*
- **Red flag (critical):** No ownership, no offboarding capture, and knowledge leaves visibly (recent incidents post-departure). *(Rationale: the system's memory is intentionally unbounded-liability — every exit is a reset.)*
- **Example symptom:** "The 'docs' are a wiki nobody owns. When the batch-process expert left, so did the runbook's meaning. Four months later the batch 'breaks' and the team discovers the expert's offboarding session was a 30-min chat with a blank board. The whole org felt it."
- **Blast radius:** Turnover resilience, VEL-06 bus factor, onboarding ramp, tribal-knowledge growth, modernization continuity (the survey keeps restarting).
- **Remediation playbook:** Quick win: name an owner/champion for the docs, run an offboarding knowledge-capture ritual for the top knowledge holders (scripted walkthroughs into docs/ADRs), capture the last 3 departures' gaps retroactively. Structural fix: ownership map (every doc/module has a maintainer), offboarding checklist enforced by HR tools, doc health reviews (growth vs. decay) quarterly, documentation as a funded line item not a PTO activity.
- **Gold standard / target state:** Every knowledge area has an owner; offboarding reliably captures knowledge; departures are 1-day disruptions; the doc library grows while decaying nothing.
- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = owned + capture ritual; 2 = partial ownership/capture; 1 = sparse ownership, capture ad hoc; 0 = unowned, knowledge exits with each departure.
- **Verify effort:** 🔷 ~1–2 days — ownership map + offboarding-process audit.
