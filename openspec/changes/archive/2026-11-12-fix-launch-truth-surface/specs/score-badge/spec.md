## MODIFIED Requirements

### Requirement: Embed snippet is a first-class deliverable

An SVG badge does not link to anything when embedded via an image tag; the host page supplies the link. The system SHALL therefore emit, alongside the SVG, a copy-paste embed snippet that carries the full accessible sentence in the image's alternative text. The snippet SHALL wrap the badge in a link to the sealed report permalink only when the emitting deployment can resolve that permalink. When it cannot, the snippet SHALL emit the badge without a link, or link to the methodology page, and SHALL NOT imply that a hosted report exists.

The permalink SHALL be built by a shared helper and, when emitted, SHALL resolve to the run's sealed report rather than the site's marketing surface. The badge SHALL NOT carry the assessment next-step link — that link is single-sourced by `release-funnel` for the next-step surface and appears exactly once per report artifact.

The snippet SHALL be provided in Markdown and HTML. An app-supplied badge (served and kept current by a LeapScore endpoint) SHALL NOT be required for a badge to exist or to be correct.

#### Scenario: Snippet links to the permalink

- **WHEN** an embed snippet is emitted by a deployment that hosts sealed reports, for run `acme__api__a3f9c1__20261031T091200Z`
- **THEN** the snippet's image is wrapped in a link to that run's sealed report permalink

#### Scenario: Snippet does not promise an unresolvable permalink

- **WHEN** an embed snippet is emitted by a deployment that does not host sealed reports
- **THEN** the snippet does not wrap the image in a per-run report link and does not state or imply that the report is hosted

#### Scenario: Alt text is not a label

- **WHEN** an embed snippet is emitted
- **THEN** the image's alternative text is the full sentence, not the word `badge` and not the score alone

#### Scenario: No assessment campaign on the badge link

- **WHEN** a badge embed snippet is inspected
- **THEN** it carries no `utm_campaign` or `band` query parameters, because it is a citation and not a next-step link

#### Scenario: Badge works without the service

- **WHEN** the badge SVG is committed to a repository and the LeapScore host is unreachable
- **THEN** the badge still renders, because it is a self-contained static file
