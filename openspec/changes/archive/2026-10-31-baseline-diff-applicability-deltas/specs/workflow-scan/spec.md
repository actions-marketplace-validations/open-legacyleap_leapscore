## ADDED Requirements

### Requirement: Baseline pass-through and ratchet gate for workflow scans

The workflow CLI and the Action SHALL accept a baseline envelope and a ratchet gate. When both are supplied the run SHALL evaluate the ratchet per the `run-diff` capability after seal, SHALL fail the step on a code-attributable regression, and SHALL refuse to report a pass when the comparability verdict is `incomparable`. The baseline SHALL be accepted as a file path so a workflow can restore it from a previously uploaded run artifact. Report artifacts SHALL be uploaded in every outcome, including a tripped ratchet and a refusal.

#### Scenario: Workflow gates against a restored artifact

- **WHEN** a workflow restores a previous run's report as the baseline and sets the ratchet gate
- **THEN** the run seals, compares, and passes or fails according to the code-attributable movement

#### Scenario: Coverage-only movement does not fail the step

- **WHEN** the headline moves only because indicators became graded or ungraded
- **THEN** the step does not fail on the ratchet

#### Scenario: Regression fails the step with artifacts kept

- **WHEN** a graded row regresses beyond tolerance with unchanged producers
- **THEN** the step fails and the report artifacts are still uploaded

#### Scenario: Incomparable refuses in the job summary

- **WHEN** the verdict is `incomparable`
- **THEN** the step refuses rather than passing, and the job summary names the blocking cause

#### Scenario: No baseline behaves exactly as before

- **WHEN** a workflow supplies neither a baseline nor the ratchet gate
- **THEN** the run behaves identically to the pre-change workflow, with no delta document and no additional gate
