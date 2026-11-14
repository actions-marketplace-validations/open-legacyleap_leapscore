## ADDED Requirements

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
