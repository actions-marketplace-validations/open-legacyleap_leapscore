## MODIFIED Requirements

### Requirement: Tranche-A scored rows emit human evidence and predicates — all indicators at once

The system SHALL, for every tranche-A measured indicator (DOCS-01/03/04/08/09, PERF-02/06, DATA-01, ECOS-06/08, SEC-09/10) and every Phase-1 GH-API measured indicator (VEL-06/08/09/10, SEC-07, TEST-08) — i.e. all live-scorable indicators in the current MVP/Tranche-A set, with no indicator deferred — produce an `IndicatorRow` with `score` from the indicator's spec §5 predicate (not a hardcoded `2`), `reason` as a human sentence that explicitly includes the encyclopedia flag rationale for the scored band (ID-free, score-band named, rationale-citing), and `evidence` whose `tool` matches the detector provenance and whose `facts` are flat primitives per the spec §8 evidence string template. No tranche-A indicator SHALL remain on the generic `reason: "${id} measured via ${tool}"` stub after this change.

#### Scenario: DOCS-03 no-runbooks scores 0 with narrative and rationale
- **WHEN** `docs03` detector returns `{count: 0, runbook_dir: null, restore_doc_present: false}`
- **THEN** the scorer maps to `score 0` per `docs-03:§5` (zero operational docs on a service with deploy footprint) and `reason` like `No runbooks — searched docs/runbooks, runbooks, docs/operations etc.; zero files found — per DOCS-03 Red flag: incidents recovered by heroics, every lesson repeated` and `evidence.facts` flat `{count: 0, runbook_dir: null, restore_doc_present: false, newest_days: 9999}` with `evidence.pointers: [{detail: "no runbooks"}]`.

#### Scenario: DOCS-08 no-changelog scores from predicate
- **WHEN** `docs08` detector returns `{changelog_present: false, with_notes_pct: 0, releases_sampled: 0}`
- **THEN** the scorer maps per `docs-08:§5` (no changelog ∧ empty release notes → 0) and `reason` narrates `No CHANGELOG.md at any of 6 candidate paths; 0% of sampled releases carry notes — release communication absent` with flat facts.

#### Scenario: DOCS-04 no-onboarding scores 0
- **WHEN** `docs04` detector returns `{docs_present: [], stages_missing: ["setup","run","test"], last_verified_days: 9999}`
- **THEN** the scorer maps to `0` per `docs-04:§5` and `reason` lists missing docs and stages, with flat facts.

#### Scenario: Tranche-A runbooks with partial coverage scores 2
- **WHEN** `docs03` returns `{count: 3, topics_covered: ["deploy","oncall"], restore_doc_present: false}`
- **THEN** the scorer maps to `2` per `docs-03:§5` (partial coverage, core classes present but restore missing) and `reason` reflects partial coverage.

