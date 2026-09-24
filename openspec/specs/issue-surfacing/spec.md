## Purpose

Turns a sealed LeapScore report into a living remediation tracker: one deduplicated issue per degraded indicator in the runner repo, kept in sync across re-scans with an honest lifecycle, all through the REST issues API on the default token.

## Requirements

### Requirement: Ticket scope from sealed rows
The system SHALL mint or update tickets only for applicable rows with status `measured` or `estimated` and score 0–2 (non-Green). Rows with status `unknown`, rows marked not-applicable, and Green rows SHALL never mint tickets.

#### Scenario: Rough repo bursts once then quiets
- **WHEN** a first scan seals with 20 applicable non-Green rows
- **THEN** 20 issues are opened, and a second identical scan opens 0

#### Scenario: Unknown rows stay in the artifact
- **WHEN** a scan seals with 8 `unknown` rows
- **THEN** no issues reference those rows and the artifact remains their only record

### Requirement: Identity token grammar
Every managed issue body SHALL carry exactly one hidden machine token `<!-- leapscore:v1 target=<owner/repo> indicator=<ID> -->` where `target` is the normalized scan subject and `ID` is the indicator (e.g. `SEC-01`). Issue titles SHALL be cosmetic: `[LeapScore] <owner/repo> <ID>: <short name>`, and renamed titles SHALL still resolve via the token.

#### Scenario: Renamed ticket still dedupes
- **WHEN** a maintainer renames `[LeapScore] django/django SEC-01: ...` to `Fix ancient secrets ASAP`
- **THEN** the next scan updates that same issue instead of opening a duplicate

#### Scenario: Cross-target tokens never collide
- **WHEN** two targets share indicator `SEC-01` in one runner repo
- **THEN** two distinct issues exist, one per `target=` value

### Requirement: Label-scoped discovery without Search
Discovery SHALL list issues via REST by labels `leapscore` + `leapscore:target-<slug>` with `state=all` and pagination, then parse bodies for the identity token; the token `target=` is authoritative over the label prefilter. The GitHub Search API SHALL NOT be used for matching. Issues without a parseable token SHALL be ignored for dedup.

#### Scenario: Slug collision resolves by token
- **WHEN** targets `a/b-c` and `a-b/c` share one slug and both have `SEC-01` issues
- **THEN** each scan updates only the issue whose token `target=` matches its own target

#### Scenario: Human lookalikes never hijack
- **WHEN** a human files an issue carrying the `leapscore` label but no machine token
- **THEN** sync ignores it and never comments on, closes, or rewrites it

#### Scenario: Duplicate tokens warn
- **WHEN** two issues carry the same `target=` + `indicator=` token
- **THEN** the first match wins and the job summary carries a warning line

### Requirement: Lifecycle transitions
Re-scans SHALL apply: first sighting of a non-Green row opens an issue; band change (Red↔Yellow↔Green) posts a transition comment and reopens or closes accordingly; within-band score wobble posts a comment only; Green auto-closes with a closing comment; a newly non-Green row reopens immediately with no debounce; a deleted managed issue is recreated on next sighting. Every open/comment/close SHALL carry the band transition or score delta, the scanned sha, the engine ref, and the artifact/run link.

#### Scenario: Band change reopens with context
- **WHEN** `SEC-01` moves Yellow→Red between scans
- **THEN** its issue receives a transition comment naming the move, both shas, and the run link, and a closed issue is reopened

#### Scenario: Green auto-closes
- **WHEN** a previously Red row scores Green
- **THEN** its issue is closed with a comment carrying the score delta and sha

#### Scenario: Within-band wobble stays quiet
- **WHEN** a Red row moves score 0→1 staying Red
- **THEN** a comment is posted and no reopen/close transition occurs

### Requirement: Ticket body as derived view
Each managed issue body SHALL carry status, an evidence/basis snippet, the rubric remediation text, and sha + links (artifact run, sealed row id). Canonical numbers stay in the sealed report; the ticket SHALL NOT invent scoring semantics. Content below `<!-- leapscore:human -->` SHALL survive regeneration byte-for-byte; everything above it is regenerated from the sealed report each scan.

#### Scenario: Human notes survive
- **WHEN** a maintainer appends rollout notes below the human marker and the next scan regenerates the ticket
- **THEN** the notes are unchanged and the generated section reflects the new scan

### Requirement: Fixed label taxonomy
Managed issues SHALL carry the namespace label `leapscore`, exactly one severity label (`leapscore:red` or `leapscore:yellow`), exactly one category label (`leapscore:<category>` across the ten categories), `leapscore:gate` when the row participates in a fired gate, and `leapscore:target-<slug>`. Missing labels SHALL be auto-created. Per-run or per-sha labels SHALL never be created.

#### Scenario: Severity follows the band
- **WHEN** a row moves Red→Yellow
- **THEN** `leapscore:red` is replaced by `leapscore:yellow` and all other labels are preserved

### Requirement: Throttled writes with burst disclosure
Issue writes SHALL be sequential or low-concurrency (at most 3 parallel) with backoff on `429`/abuse-limit responses; a failed write retries once, then degrades to warn-only without failing the job. Every run SHALL print a summary line with counts opened/commented/closed/skipped plus burst notes (first-scan count, duplicate-token warnings, skip reasons).

#### Scenario: Abuse limit degrades loudly
- **WHEN** issue creation hits a secondary rate limit mid-burst
- **THEN** the run backs off, retries once, records the shortfall in the summary, and still exits per the scan verdict

### Requirement: Private-target guardrail
A private scan subject surfaced from a public runner repo (non-self) SHALL NOT create, comment on, or close issues; the run degrades to execution-only with a loud `surface-skipped: private-target/public-runner` disclosure. Private targets surface normally into private runners and self-scans.

#### Scenario: Cross-boundary leak refused
- **WHEN** a public runner scans a private target with a read-capable PAT
- **THEN** the artifact is produced, zero issue writes occur, and the summary states the skip reason
