## Purpose

The site ships as a server-free static artifact that can be published from any static host, with every request-time concern resolved in the browser instead of a running server.

## Requirements

### Requirement: The site builds to a static artifact

The site SHALL build to a directory of HTML documents, assets, and client bundles alone. No route SHALL render on demand, read a request header, a cookie, a query string, or a filesystem at request time. The build SHALL fail, rather than emit a document that cannot work without a server, when a route depends on server-only behavior.

#### Scenario: Export produces a servable tree

- **WHEN** the site build completes
- **THEN** the output is a directory whose every route resolves to a document or asset file, and no route requires a Node process to answer a request

#### Scenario: Server-only route fails the build

- **WHEN** a route reads a request header, a cookie, or a filesystem at request time
- **THEN** the build fails naming that route, and no deployable artifact is produced

#### Scenario: The artifact brokers no scan

- **WHEN** the built artifact is inspected
- **THEN** it contains no scan endpoint, no scanner origin, and no client code that starts a scan

### Requirement: One base path governs every internal URL

Every internal link, asset reference, metadata URL, and generated document SHALL derive from a single build-time base path. No document SHALL contain an origin-absolute internal URL that escapes the base path. Changing that one value SHALL move every internal URL with it, and nothing else SHALL need to change.

#### Scenario: Navigation stays inside the base path

- **WHEN** the site is served under a non-root base path
- **THEN** every navigation link, font, stylesheet, and script resolves under that prefix, and no request is issued to the host root

#### Scenario: Metadata agrees with the serving origin

- **WHEN** the site is served under the configured base path
- **THEN** canonical and social metadata name the origin and prefix the site is actually served from

#### Scenario: Base path change is one value

- **WHEN** the base path value changes from a project prefix to a root origin
- **THEN** every internal URL follows, and no route, component, or document is edited

### Requirement: Relocated paths resolve without an HTTP redirect

The host SHALL be assumed to serve no redirects. Where a path must continue to resolve because a shipped artifact links to it, the site SHALL serve a redirect document for that path that resolves its target from the current location, so it works under any base path and any origin. A redirect document SHALL carry no report or page content of its own.

#### Scenario: Methodology path resolves

- **WHEN** a visitor follows the methodology link that a generated report contains
- **THEN** the served document forwards to the method page at the same base path

#### Scenario: Redirect works under a prefix and at the root

- **WHEN** the site is served under a base path, and again when served at the origin root
- **THEN** the redirect document forwards to the correct method page in both cases with no edit

#### Scenario: Redirect document duplicates no content

- **WHEN** a redirect document is fetched without executing scripts
- **THEN** it contains no report, no category table, and no page narrative

### Requirement: Query-string state is resolved in the browser

Where a page's content depends on URL parameters, that page SHALL resolve them in the browser after the document loads. A statically served document SHALL reflect the visitor's actual parameters, and a parameter set that differs from the build-time default SHALL NOT be silently replaced by it.

#### Scenario: Attribution survives a static serve

- **WHEN** a visitor opens the assessment page with campaign and band parameters
- **THEN** the rendered attribution reflects those parameters, not the build-time default

#### Scenario: Missing parameters fall back

- **WHEN** a visitor opens the assessment page with no parameters
- **THEN** the page renders the contract's default attribution

### Requirement: Unknown paths render the site's not-found document

A request for a path that is not part of the artifact SHALL render the site's own not-found document, which SHALL offer a link back to the home page.

#### Scenario: Unknown path is not a blank host error

- **WHEN** a visitor requests a path that was never exported
- **THEN** the host serves the site's not-found document rather than a bare host error page

### Requirement: Deployment is reproducible from continuous integration

One workflow SHALL build the artifact and publish it, with source as the only input. Build output SHALL NOT be committed to the repository, and no manual upload step SHALL be required. A pull request SHALL exercise the build without publishing.

#### Scenario: Merge publishes

- **WHEN** a change that affects the site lands on the default branch
- **THEN** the workflow builds the artifact and publishes the same commit's output

#### Scenario: Pull request builds but does not publish

- **WHEN** a pull request changes the site
- **THEN** the build runs and fails the pull request on error, and no deployment occurs

#### Scenario: No build output in version control

- **WHEN** the repository is inspected
- **THEN** no generated site directory is tracked
