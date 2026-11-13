# Open-Source Release Materials Specification

## Purpose

Defines the public-facing documentation, contribution boundaries, sample visual, and license metadata needed to present LeapScore as a trustworthy, locally run open-source tool without changing scanner behavior.

## Requirements

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

### Requirement: README privacy claims match scan behavior

The README SHALL state the brief's privacy guarantee, explain that a local path scan reads the target locally and makes no network requests, and distinguish the explicit networked `--repo` remote scan. It SHALL state that the tracked assessment URL is text until clicked and that no telemetry is sent automatically. It SHALL NOT claim that local scans send code, paths, or repository names.

#### Scenario: Local and remote behavior are distinguished
- **WHEN** a visitor reads the README privacy section
- **THEN** they can distinguish the no-network local path from the explicitly requested remote scan and identify what network activity the remote mode requires

#### Scenario: Assessment link is click-only
- **WHEN** the README describes the tracked assessment link
- **THEN** it states that the scan does not contact the assessment host and that a user click is the only associated telemetry

### Requirement: Sample report visual is genuine and disclosed

The README SHALL show a committed screenshot of a LeapScore report with descriptive alternative text. The screenshot SHALL be traceable to a reproducible, local report-rendering procedure, SHALL be clearly labeled illustrative, and SHALL NOT expose a user's repository name, source code, absolute path, or other machine-specific identifier.

#### Scenario: Screenshot renders from the repository
- **WHEN** a visitor views the README on the repository host
- **THEN** the sample screenshot resolves from a committed repository asset and has descriptive alternative text

#### Scenario: Screenshot provenance is reproducible
- **WHEN** a maintainer follows the documented refresh procedure
- **THEN** they can regenerate the screenshot from a local LeapScore report without network access or manual fabrication of scored findings

#### Scenario: Screenshot does not disclose scan subject identity
- **WHEN** the screenshot is committed
- **THEN** it contains no actual user's repository identifier, source, or machine-specific absolute path, and it is identified as an illustrative sample

### Requirement: README directs visitors to methodology and next step

The methodology section SHALL link to the public method page and the repository's canonical rubric. The next-step section SHALL explain that LeapScore assesses structural risk rather than functional behavior or modernization plans, and SHALL direct readers to the result-specific `$0 Assessment` using the tracked campaign URL grammar already defined by the report contract.

#### Scenario: Methodology is available in web and repository contexts
- **WHEN** a visitor reads the methodology section
- **THEN** they can open both the public methodology page and the canonical in-repository rubric

#### Scenario: Next step preserves the product boundary
- **WHEN** a visitor reads the next-step section
- **THEN** it distinguishes LeapScore from the MCM-backed assessment and provides the tracked assessment link without suggesting an automatic request

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

### Requirement: Maintainer architecture detail is in AGENTS.md

Architecture, monorepo layout, implementation-status, scoring, development, and CI-boundary detail currently presented as root README reference material SHALL be retained in `AGENTS.md` as maintainer context when the README is shortened. The move SHALL preserve the accuracy and navigability of existing agent guidance.

#### Scenario: README reference detail remains available to maintainers
- **WHEN** the visitor-facing README is restructured
- **THEN** its relevant architecture, development, and repository-boundary guidance is available in `AGENTS.md` and the README does not duplicate the full internal capability review

### Requirement: Contributions enforce the published narrow scope

`CONTRIBUTING.md` SHALL invite issue reports and pull requests, explain how to submit reproducible evidence and run relevant checks, and state the narrow scope in section 8 of the open-source brief. It SHALL explicitly exclude MCM-backed cross-repository comprehension, business-rule extraction, functional analysis, modernization recommendations or target architectures, hosted SaaS, customer-code upload or storage, and default-on telemetry.

#### Scenario: Issues and pull requests are accepted
- **WHEN** a prospective contributor reads `CONTRIBUTING.md`
- **THEN** they find guidance for opening issues and submitting pull requests, including evidence and validation expectations

#### Scenario: Out-of-scope proposals are explicit
- **WHEN** a proposed contribution is evaluated against the documented project scope
- **THEN** the contribution guide identifies each section-8 exclusion and explains that those capabilities belong outside LeapScore

#### Scenario: Contribution guidance respects repository conventions
- **WHEN** a pull request changes rubric, generated artifacts, scanning, or package outputs
- **THEN** the contribution guide points contributors to the canonical source and applicable repository checks rather than encouraging edits to derived artifacts

### Requirement: Apache-2.0 license is discoverable and consistent

The repository SHALL include the complete standard Apache License 2.0 text in a root `LICENSE` file. Applicable package manifests SHALL identify the license as `Apache-2.0`, and the license metadata SHALL agree with the included license text.

#### Scenario: License text is present
- **WHEN** a user or repository license detector inspects the root of the repository
- **THEN** it finds the standard Apache License 2.0 text, including its patent grant

#### Scenario: Package metadata agrees
- **WHEN** package manifests are inspected
- **THEN** applicable manifests declare `Apache-2.0` and none declare a conflicting license

### Requirement: README states coverage and non-benchmark status

The repository README SHALL state, on its first screen, that the rubric contains 102 indicators, that up to 31 have a detector today with 25 on a local scan, and that the rest are disclosed as not implemented. It SHALL state that the score is not a peer benchmark. The coverage statement SHALL pair any detector count with the release version and date.

#### Scenario: Coverage is above the fold

- **WHEN** a visitor reads the README from its start
- **THEN** the coverage statement appears before secondary reference material, alongside the privacy and primary-command sections

#### Scenario: No full-coverage claim

- **WHEN** the README describes the rubric
- **THEN** it does not claim that all 102 indicators are scored or measured

#### Scenario: Not a benchmark

- **WHEN** the README describes the score
- **THEN** it states that the score is not a peer benchmark

### Requirement: Security disclosure path is published

The repository SHALL publish a `SECURITY.md` that names supported versions, a private reporting channel, expected response handling, and the scope of the report. It SHALL NOT direct a reporter to open a public issue for a vulnerability.

#### Scenario: Security file exists

- **WHEN** a visitor looks for the security policy at the repository root
- **THEN** `SECURITY.md` exists and states the private reporting channel

#### Scenario: No public-issue request

- **WHEN** the security policy describes how to report a vulnerability
- **THEN** it does not ask the reporter to open a public issue

#### Scenario: Scope is stated

- **WHEN** the security policy describes what is in scope
- **THEN** it names the scanner, the GitHub Action, and the public site, and identifies third-party dependencies as out of scope
