## MODIFIED Requirements

### Requirement: README is a visitor-first release entry point

The repository root README SHALL present, in this order, (1) what LeapScore does in one line and the verbatim positioning line, (2) the privacy guarantee, (3) one currently runnable scan command, (4) a sample report screenshot, (5) a methodology link, and (6) the next step. The primary command SHALL be the registry install (`npx leapscore-scan <path> --out <dir>`) whose only prerequisite is the declared runtime; the README SHALL NOT present cloning or building this repository as a prerequisite for the primary path. From-source and git-install forms MAY appear as clearly secondary alternatives. The README SHALL state the current command and prerequisites truthfully.

#### Scenario: First-screen order is preserved

- **WHEN** a visitor reads the root README from its start
- **THEN** the six brief sections appear in the specified order before secondary reference material

#### Scenario: Positioning is verbatim

- **WHEN** the README states the product positioning
- **THEN** it includes exactly: “LeapScore sees the structure. The assessment understands what the code does.”

#### Scenario: The primary command needs no checkout

- **WHEN** a visitor copies the primary scan command into a directory that is not a LeapScore checkout
- **THEN** the command installs the published package on demand and scans the target

#### Scenario: The primary command is runnable and honest

- **WHEN** the README presents its primary scan command
- **THEN** it uses a command supported by the current CLI and states the runtime prerequisite and the `--out` requirement

## ADDED Requirements

### Requirement: Action installation is documented against the published metadata

The release materials SHALL document installing the Action with a `uses:` line that matches the published root metadata, SHALL require `actions/checkout` before the scan, SHALL explain that full history (`fetch-depth: 0`) is recommended so history-derived indicators can be measured, SHALL show a band-threshold gate example, and SHALL state how to pin a major, minor, or exact version. The documented inputs SHALL match the metadata exactly; the materials SHALL NOT advertise an input the Action does not accept.

#### Scenario: `uses:` line matches published metadata

- **WHEN** a consumer copies the documented `uses:` line
- **THEN** it resolves to the released Action at the repository root with no path suffix

#### Scenario: Checkout and history guidance is present

- **WHEN** a consumer reads the Action section
- **THEN** the example checks out the repository first and explains that a shallow checkout leaves history-derived indicators unknown

#### Scenario: Version pinning is explained

- **WHEN** a consumer wants stability
- **THEN** the materials state the difference between pinning the moving major tag, a minor tag, and an immutable `vX.Y.Z` tag

#### Scenario: No undocumented inputs

- **WHEN** the documented Action inputs are compared with the root metadata
- **THEN** every documented input exists and no metadata input is described with different semantics
