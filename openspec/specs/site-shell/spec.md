## Purpose

Global site chrome — header navigation and interactive affordance that is consistent across all pages.

## Requirements

### Requirement: Header without engine pill

The header SHALL render the brand mark plus exactly 3 nav links (`Samples`, `Method`, `Rubric`) without an "engine: coming" pill, and SHALL NOT link to a live-scan surface or a run-history surface.

#### Scenario: Header renders clean
- **WHEN** any page renders `SiteHeader`
- **THEN** the nav shows exactly the samples, method, and rubric links and no element containing "engine: coming" is in the DOM

#### Scenario: Header offers no live or history entry
- **WHEN** any page renders `SiteHeader`
- **THEN** no nav link resolves to a live-scan path or a run-history path

### Requirement: Interactive affordances show pointer cursor

Every `<button>`, `[role=button]`, and interactive summary/accordion trigger SHALL show `cursor: pointer` on hover.

#### Scenario: Collapsible triggers show hand

- **WHEN** hovering an accordion or collapsible trigger on the rubric or sample surfaces
- **THEN** computed style `cursor` is `pointer`

#### Scenario: Sample gallery actions show hand

- **WHEN** hovering a control on a sample gallery row or a sample detail page
- **THEN** cursor is `pointer`

### Requirement: Public source is reachable from the site

The site SHALL link the public repository at `https://github.com/open-legacyleap/leapscore` from the footer of every page, and from any surface that asserts an open-source licence or an auditability claim. The link SHALL be a static anchor in the exported artifact: no client-side fetch, no GitHub API call, and no repository-derived data rendered at build time.

#### Scenario: Footer renders the source link

- **WHEN** any page that renders `Footer` is exported
- **THEN** the document contains an anchor whose `href` is exactly `https://github.com/open-legacyleap/leapscore`, labelled so a reader can tell it opens the source

#### Scenario: An open-source claim is checkable in place

- **WHEN** a surface states the licence or invites the reader to audit the method
- **THEN** that surface links the same repository URL, or links a page that does

#### Scenario: The link is static

- **WHEN** the exported artifact is inspected
- **THEN** no request to `api.github.com` or any other repository host appears in the served graph, and no rendered value depends on network state
