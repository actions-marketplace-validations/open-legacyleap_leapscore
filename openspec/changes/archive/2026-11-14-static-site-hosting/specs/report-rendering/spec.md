## REMOVED Requirements

### Requirement: Live report chrome is minimal and shows commit link

**Reason**: The requirement is scoped to the live report page (`/live` and `/report/live`), which this change removes. Its substance — a minimal chrome, no `schema · rubric · share` subtitle, a commit link in the identity card, and no provenance grid above the headline — still applies to the only report surface the site serves, the sample report detail.

**Migration**: Replaced by "Report detail chrome is minimal and shows commit link", which carries the same rules to the sample detail path. The CLI HTML and Markdown emitters are unaffected.

## ADDED Requirements

### Requirement: Report detail chrome is minimal and shows commit link

A rendered report detail page SHALL render the sealed report without a `schema · rubric · share: <url>` subtitle and without `see method` or `view sample` header links. The report SHALL render the target repository commit as `commit <short7>` inside the identity card, linked to `https://github.com/{owner}/{repo}/commit/{fullSha}` when the sealed snapshot carries a real commit, and as plain `commit unknown` text when it does not. The run-provenance grid (schema, rubric, engine identity, run id, duration against budget, scan time) SHALL NOT appear above the headline in any report state; the first element above the headline SHALL be the identity card.

#### Scenario: Commit link renders

- **WHEN** a report detail renders with a sealed `scanned_commit` of `abc1234567890` for `django/django`
- **THEN** the identity card shows `commit abc1234` as a link to `https://github.com/django/django/commit/abc1234567890`, and no `schema` or `share:` text is present in the header

#### Scenario: Unknown commit renders plain

- **WHEN** the sealed `scanned_commit` is `unknown` or absent
- **THEN** the identity card shows `commit unknown` as plain text with no link

#### Scenario: Header has no method or sample links

- **WHEN** any report detail renders
- **THEN** the header right rail contains no links with text `see method` or `view sample`

#### Scenario: No schema or share line in any state

- **WHEN** a report detail renders in any state
- **THEN** no element renders the joined subtitle pattern `schema <n> · rubric <v> · ... · share: <url>`, while a labelled schema row inside the collapsed provenance detail is permitted

#### Scenario: Provenance grid is not above the headline

- **WHEN** a report detail renders with full run metadata available
- **THEN** the schema, rubric, engine, run, duration, and scan-time grid does not appear above the headline, and the first thing above the headline is the identity card
