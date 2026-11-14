## MODIFIED Requirements

### Requirement: Methodology link resolves in-repo

The site SHALL serve the methodology path the CLI writes into reports (`/methodology`) as a static document that forwards to the method page (`/method`), so the report link is a real route of the site rather than a dead path. The forward SHALL NOT depend on an HTTP redirect, because the hosting target serves none, and SHALL resolve correctly whether the site is served under a base path or at an origin root. The CLI `METHODOLOGY_URL` value SHALL remain unchanged. The method page SHALL tell the current state — local CLI scan and CI scan available, sample surfaces illustrative — and SHALL NOT describe a website scan.

#### Scenario: Redirect serves the report link

- **WHEN** a client requests `/methodology`
- **THEN** the site serves a document that lands the visitor on `/method` without depending on a host-level redirect

#### Scenario: Path stays in lockstep with the emitters

- **WHEN** the emitter writes the methodology URL
- **THEN** `/methodology` is a served route in-repo (a forwarding document or a page), checked by test

#### Scenario: Forward survives a base-path change

- **WHEN** the site is served under a base path, and again when served at an origin root
- **THEN** the methodology forward reaches the method page in both cases without an edit

#### Scenario: Method page tells the current state

- **WHEN** `/method` renders its "where we are now" section
- **THEN** it names the local CLI and CI scan as available, does not describe or link a website scan, and does not claim the engine is in development

### Requirement: Funnel-landing chrome tells the current truth

Site chrome that funnel visitors land on SHALL NOT claim the engine is unshipped or that a website scan exists: the footer disclaimer SHALL reflect that sample reports are illustrative and that the local CLI and CI scans are the available scan paths, and rubric links in the homepage and footer SHALL target the site's `/rubric` route, not a repo-relative path. The homepage/product launch narrative (waitlist, "coming") is out of scope for this capability.

#### Scenario: Footer disclaimer accurate

- **WHEN** any page renders the footer
- **THEN** no sentence claims the live engine has not shipped and no sentence offers a website scan

#### Scenario: Rubric links resolve

- **WHEN** the rubric link renders on the homepage or in the footer
- **THEN** its target is `/rubric`, and no `../rubric/README.md` relative link remains in the site
