## Purpose

Ensures the $0 Assessment next step is a real, trustworthy destination rather than a dead link, and that a visitor can understand what happens to their data before booking.

## ADDED Requirements

### Requirement: Assessment destination resolves

Every report next-step link SHALL target a destination that resolves to a served page or a configured booking URL. The destination SHALL be defined once in the shared contract. Until the booking vendor is selected, the shared contract SHALL keep a single placeholder base URL at the site's `/assessment` route; the booking vendor link SHALL be configuration inside that page, not a second contract constant. A missing or unreachable destination SHALL fail a release check rather than ship.

#### Scenario: Report CTA resolves

- **WHEN** a visitor clicks the assessment link in any report surface
- **THEN** the destination returns a served page or booking URL rather than a not-found response

#### Scenario: Destination is single-sourced

- **WHEN** the assessment destination is changed
- **THEN** the shared contract is the only place that defines it, and every report surface follows

#### Scenario: Release check fails on a dead destination

- **WHEN** the configured assessment destination does not resolve during a release check
- **THEN** the check fails and the release does not ship the dead link

#### Scenario: Placeholder base URL is stable

- **WHEN** the booking vendor has not yet been selected
- **THEN** the contract points at the placeholder `/assessment` base URL, the page renders the data-handling copy, and a working fallback booking path is available

### Requirement: Assessment page states data handling

The assessment destination SHALL state what the $0 Assessment is, that the scanner runs locally and does not require a code upload, what data is requested (a report or a screen share), how that data is stored, and that MCM or any deeper engagement requires separate consent.

#### Scenario: Local scan and no upload are stated

- **WHEN** a visitor reads the assessment page
- **THEN** it states that the scan runs locally and that no code upload is required

#### Scenario: Report sharing and storage are stated

- **WHEN** a visitor reads the assessment page
- **THEN** it states what part of a report is requested, how it is stored, and that the visitor chooses whether to share it

#### Scenario: Separate consent for MCM

- **WHEN** the assessment page mentions MCM or a deeper engagement
- **THEN** it states that this requires a separate consent and process

### Requirement: Assessment booking path works

The destination SHALL provide a working booking path, either a form or a booking link, for the $0 Assessment. It SHALL preserve the campaign attribution from the report link and SHALL NOT store code, absolute paths, or repository names in that attribution.

#### Scenario: Booking path completes

- **WHEN** a visitor submits the assessment form or follows the booking link
- **THEN** the request reaches the assessment team with a confirmation state

#### Scenario: Attribution is preserved

- **WHEN** a visitor arrives from a report CTA
- **THEN** the campaign and band or verdict attribution are available to the assessment team

#### Scenario: No code or path in attribution

- **WHEN** the assessment link carries attribution
- **THEN** it contains no code, absolute path, or repository name
