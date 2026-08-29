## MODIFIED Requirements

### Requirement: Live report chrome is minimal and shows commit link

The live report page (`/live` and alias `/report/live`) SHALL render the sealed report without a `schema · rubric · share: /live?repo=...` subtitle and without `see method` or `view sample` header links. Instead, the revealed sealed state SHALL render the target repo commit SHA as a subtitle under the repo title (`django/django`) as `commit <short7>` linked to `https://github.com/{owner}/{repo}/commit/{fullSha}` when `report.snapshot.scanned_commit` is present and not `unknown`; when `unknown`, it SHALL render `commit unknown` as plain text. All live states (scanning, sealed-not-revealed, revealed, refused) SHALL omit the `schema · rubric · share` line.

#### Scenario: Revealed live shows commit link
- **WHEN** a live scan for `django/django` seals with `snapshot.scanned_commit = abc1234567890`
- **THEN** the header subtitle under the repo title shows `commit abc1234` as a link to `https://github.com/django/django/commit/abc1234567890` and no `schema` or `share: /live?repo=` text is present

#### Scenario: Unknown commit renders plain
- **WHEN** `snapshot.scanned_commit` is `unknown` or missing
- **THEN** the subtitle shows `commit unknown` with no link

#### Scenario: Header has no method/sample links
- **WHEN** any live state renders
- **THEN** the header right rail contains no links with text `see method` or `view sample`

#### Scenario: No schema/share line in any live state
- **WHEN** viewing scanning, sealed-not-revealed, revealed, or refused live states
- **THEN** no element contains the pattern `schema 1 ·` or `share: /live?repo=`
