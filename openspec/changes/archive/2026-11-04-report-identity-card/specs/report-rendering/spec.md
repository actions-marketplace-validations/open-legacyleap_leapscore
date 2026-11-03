## ADDED Requirements

### Requirement: Report sections are ordered subject, verdict, evidence

Every rendered sealed report SHALL order its content in four bands, top to bottom: **subject** (the identity card), **verdict** (headline, coverage, blockers, next-band path), **evidence** (gates, category scorecard, full table, deep-dive scope), and **provenance** (schema, rubric, engine identity, run id, duration, budget, scan time, plus raw-artifact affordances).

No provenance value SHALL be rendered above the verdict band. Provenance SHALL remain reachable without leaving the report.

#### Scenario: Subject precedes verdict

- **WHEN** a sealed report renders
- **THEN** the identity card is the first content band and the headline score appears below it

#### Scenario: Instrument metadata is not chrome

- **WHEN** a sealed report renders
- **THEN** no schema, rubric, engine, duration, budget, or run-identifier value appears above the headline, and the repo title appears once

#### Scenario: Provenance stays available

- **WHEN** a reader needs the producing instrument's identity
- **THEN** the provenance band is reachable below the evidence band, or in the raw JSON, without a second request

## MODIFIED Requirements

### Requirement: Live report chrome is minimal and shows commit link

The live report page (`/live` and alias `/report/live`) SHALL render the sealed report without a `schema · rubric · share: /live?repo=...` subtitle and without `see method` or `view sample` header links. The revealed sealed state SHALL render the target repo commit SHA inside the identity card as `commit <short7>` linked to `https://github.com/{owner}/{repo}/commit/{fullSha}` when `report.snapshot.scanned_commit` is present and not `unknown`; when `unknown`, the card SHALL render `commit unknown` as plain text. All live states (scanning, sealed-not-revealed, revealed, refused) SHALL omit the joined `schema · rubric · share` line from the header area.

The run-provenance grid (schema, rubric, engine identity, run id, duration against budget, scan time) SHALL NOT appear above the headline in any state. It SHALL be reachable as a collapsed provenance detail below the evidence band, or through the raw-artifact affordance for a persisted run.

#### Scenario: Revealed live shows commit link

- **WHEN** a live scan for `django/django` seals with `snapshot.scanned_commit = abc1234567890`
- **THEN** the identity card shows `commit abc1234` as a link to `https://github.com/django/django/commit/abc1234567890`, and no `schema` or `share: /live?repo=` text is present in the header

#### Scenario: Unknown commit renders plain

- **WHEN** `snapshot.scanned_commit` is `unknown` or missing
- **THEN** the identity card shows `commit unknown` as plain text with no link

#### Scenario: Header has no method/sample links

- **WHEN** any live state renders
- **THEN** the header right rail contains no links with text `see method` or `view sample`

#### Scenario: No schema/share line in any live state

- **WHEN** viewing scanning, sealed-not-revealed, revealed, or refused live states
- **THEN** no element renders the joined subtitle pattern `schema <n> · rubric <v> · ... · share: /live?repo=`, while a labelled schema row inside the collapsed provenance detail is permitted

#### Scenario: Provenance grid is not above the headline

- **WHEN** a persisted run report renders with full run metadata available
- **THEN** the schema/rubric/engine/run/duration/scan-time grid does not appear above the headline, and the first thing above the headline is the identity card
