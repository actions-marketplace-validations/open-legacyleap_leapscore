## Purpose

Defines the public-facing documentation, contribution boundaries, sample visual, and license metadata needed to present LeapScore as a trustworthy, locally run open-source tool without changing scanner behavior.

## ADDED Requirements

### Requirement: README is a visitor-first release entry point

The repository root README SHALL present, in this order, (1) what LeapScore does in one line and the verbatim positioning line, (2) the privacy guarantee, (3) one currently runnable scan command, (4) a sample report screenshot, (5) a methodology link, and (6) the next step. The README SHALL state the current command and prerequisites truthfully; it SHALL NOT imply that the command needs no setup when the supported distribution path requires installation or a build.

#### Scenario: First-screen order is preserved
- **WHEN** a visitor reads the root README from its start
- **THEN** the six brief sections appear in the specified order before secondary reference material

#### Scenario: Positioning is verbatim
- **WHEN** the README states the product positioning
- **THEN** it includes exactly: “LeapScore sees the structure. The assessment understands what the code does.”

#### Scenario: The primary command is runnable and honest
- **WHEN** the README presents its primary scan command
- **THEN** it uses a command supported by the current CLI and states any prerequisite needed to run it

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
