## MODIFIED Requirements

### Requirement: Assessment booking path works

The destination SHALL provide a working booking path, either a form or a booking link, for the $0 Assessment. It SHALL preserve the campaign attribution from the report link and SHALL NOT store code, absolute paths, or repository names in that attribution. Attribution SHALL be resolved from the visitor's URL in the browser, so it survives static hosting; a statically served assessment page SHALL NOT present the build-time default in place of the attribution the visitor arrived with.

#### Scenario: Booking path completes

- **WHEN** a visitor submits the assessment form or follows the booking link
- **THEN** the request reaches the assessment team with a confirmation state

#### Scenario: Attribution is preserved

- **WHEN** a visitor arrives from a report CTA
- **THEN** the campaign and band or verdict attribution are available to the assessment team

#### Scenario: Attribution survives a static serve

- **WHEN** a report CTA carrying campaign and band parameters is opened on the statically hosted site
- **THEN** the rendered attribution reflects those parameters rather than the build-time default

#### Scenario: Default attribution when none is supplied

- **WHEN** a visitor opens the assessment page with no parameters
- **THEN** the page renders the contract's default campaign and no band or verdict

#### Scenario: No code or path in attribution

- **WHEN** the assessment link carries attribution
- **THEN** it contains no code, absolute path, or repository name
