# LeapScore — Open-Source Release Brief

> **Archive date:** 2026-10-15 · **Author:** @Rajat · Transcribed and edited from the committed `docs/opensource-brief.docx` source.
>
> **Lifecycle:** Historical release strategy, not a current product or implementation specification. The source DOCX is intentionally absent from the working tree and remains available in Git history. Current release-material requirements are in [OpenSpec](../../openspec/specs/open-source-release-materials/spec.md); scan and CLI behavior is specified in [scan-local](../../openspec/specs/scan-local/spec.md), [workflow-scan](../../openspec/specs/workflow-scan/spec.md), and related current specifications. The status notes below distinguish preserved intent from requirements that changed or shipped.

## Purpose

The brief proposed releasing LeapScore as an open-source, lightweight legacy-codebase assessment that leads readers to the `$0 Assessment`. It described the strategy behind that release and changes proposed for the then-current base version. Sections 2–3 gave the rationale; sections 4–9 described the proposed build and launch.

## Why open source

The original strategy identified four reasons to release the tool openly:

- **Sensitive code stays with its owner.** Regulated enterprises are reluctant to upload legacy systems to a vendor. A tool that runs locally or in their own CI lets their security teams inspect its behavior.
- **An open method can earn trust.** The score and its methodology can be inspected and challenged rather than treated as a vendor opinion. The brief cited Lighthouse and OpenSSF Scorecard as precedents.
- **The assessment remains distinct.** The brief proposed keeping MCM closed as the basis of the `$0 Assessment`, Explayn, and modernization work.
- **Partners can distribute it.** Delivery partners could use LeapScore in pre-sales and introduce it to customers the company might not reach directly.

These points record the original go-to-market rationale; they do not define current scanner capabilities or commercial terms.

## Positioning and funnel

The brief's proposed product boundary was:

> LeapScore sees the structure. The assessment understands what the code does.

It described LeapScore as a quick, lightweight local assessment of legacy risk from structural signals: it identifies risk, but is not a modernization plan, functional analysis, or substitute for the assessment.

The proposed funnel was:

1. **LeapScore:** free, self-serve, local; produces a score and report.
2. **$0 Assessment:** sales-led and MCM-backed; explains what the score means for the estate and what modernization could involve.
3. **Explayn or modernization:** paid follow-on work.

The brief asked that build decisions make the first step easy and the assessment an obvious next step. The positioning sentence remains the exact copy required by the current release-material specification.

## Proposed build requirements and later status

The priorities and rationale below are preserved from the brief. “Must” and “Should” describe the October 2026 proposal, not a current backlog.

| # | Original requirement | Priority | Current status / authority |
|---|---|---|---|
| 1 | One command, no config: `leapscore scan <path>` | Must | Local scanning and report output ship in the CLI. The published command and prerequisites are defined by the current [workflow-scan specification](../../openspec/specs/workflow-scan/spec.md); this is no longer a no-setup promise. |
| 2 | Fully offline by default | Must | **Superseded as phrased.** `--strict` is the explicit no-network mode. Local scans without it may use allowlisted network GETs; see [scan-local](../../openspec/specs/scan-local/spec.md). |
| 3 | Deterministic: same code, same version, same score | Must | Implemented as a versioned `score_fingerprint` with defined semantic inputs and exclusions; see [deterministic-scoring](../../openspec/specs/deterministic-scoring/spec.md). |
| 4 | Every deduction traces to a finding: file or dependency, rule, weight | Must | Evidence, provenance, and report rendering are part of the current sealed report contract; see [report-envelope](../../openspec/specs/report-envelope/spec.md) and [report-rendering](../../openspec/specs/report-rendering/spec.md). |
| 5 | Publish the scoring methodology, signals, weights, and formula | Must | The rubric and methodology are published. Canonical scoring semantics are in [`docs/rubric/`](../rubric/); current behavior is described by OpenSpec. |
| 6 | State score bands and thresholds: Low, Moderate, High, Critical | Must | The public band vocabulary is defined by the shared contracts and canonical rubric configuration. |
| 7 | Versioned JSON, HTML, and Markdown output | Must | The CLI writes `report.json`, `report.html`, and `report.md`; current envelope and CLI requirements are in [report-envelope](../../openspec/specs/report-envelope/spec.md) and [workflow-scan](../../openspec/specs/workflow-scan/spec.md). |
| 8 | GitHub Action and a generic pipeline step, with exit code and threshold flag | Must | The GitHub Action and CLI exist. Current workflow, supported flags, artifact, and exit semantics are defined in [workflow-scan](../../openspec/specs/workflow-scan/spec.md). |
| 9 | Structural signals only, including dependency, runtime, test-presence, size, and history signals | Should | Target code is not executed. Implemented detector coverage is partial; current signals and limitations are described in the [rubric](../rubric/README.md), [implementation specs](../specs/README.md), and [stack coverage](../../openspec/specs/stack-coverage/spec.md). |
| 10 | Prioritize customer stacks: Java, .NET (including VB.NET and VB6), and Delphi | Should | Stack coverage is an active product concern; see the current [stack-coverage specification](../../openspec/specs/stack-coverage/spec.md). This brief's priority is preserved as historical rationale, not as a complete coverage statement. |

The brief also recorded an open question: who signs off the scoring weights before release. Current rubric ownership and change rules are documented in the [rubric guide](../rubric/README.md) and root [`AGENTS.md`](../../AGENTS.md).

## Report and next step

The report was intended to travel from the architect who ran LeapScore to the person approving a budget. The brief called for:

- A two-minute read: score and band first, then five plain-language risks, then detail.
- A result-specific next step: High/Critical points to a `$0 Assessment`; Moderate explains that the assessment clarifies which concentrated risks matter; Low recommends keeping the scan in CI and uses a softer assessment link.
- The same next-step line at the end of a CLI run, printed once.
- A tracked campaign link, with no associated telemetry unless the user clicks it.
- Benchmarking after the first release, opt-in and limited to aggregate scores.

Result-specific next steps and click-only assessment links are specified by the current report/release contracts. The proposed benchmarking feature is not a current capability in this archive's source set.

## Privacy, trust, and telemetry

The brief's trust principle was that repository content should not leave the owner's control without an explicit choice. Its specific proposals were:

- No automatic usage telemetry or update checks that call home without a flag.
- Any outbound data should be opt-in and documented, including exactly what is sent.
- Never send code, file paths, repository names, or identifiers; aggregate numbers only when opted in.
- State the privacy guarantee prominently and test default behavior for unwanted network calls.

The current CLI distinguishes local and remote scans. `--strict` prevents network access; remote `--repo` scans intentionally contact GitHub, and non-strict local scans may use allowlisted GETs. Current privacy and network behavior is specified in [scan-local](../../openspec/specs/scan-local/spec.md) and the relevant scanner specifications. A tracked assessment URL is inert until clicked; no automatic click telemetry is sent.

## Licence, packaging, and distribution

The original proposals were:

- **Licence:** Apache 2.0, including its patent grant; avoid copyleft licensing that could block regulated-enterprise use.
- **Packaging:** minimize setup on locked-down machines, ideally with a single binary or container and the base version's package manager.
- **Distribution:** publish a public GitHub repository under the Legacyleap organization, a GitHub Action, and a website page linking to the `$0 Assessment`.
- **README order:** one-line purpose, privacy guarantee, command, sample screenshot, methodology, next step.
- **Contributions:** accept issues and pull requests and state the narrow project scope in `CONTRIBUTING.md`.

The current README and contribution requirements are specified in [open-source-release-materials](../../openspec/specs/open-source-release-materials/spec.md). The original packaging preference is a hypothesis, not a shipped-artifact requirement.

The brief recorded two open questions: who owns the repository, and how quickly issues should receive a response.

## Out of scope in the original strategy

The brief proposed keeping LeapScore narrow so the assessment would remain distinct and the maintenance burden bounded. It excluded:

- MCM-backed cross-repository comprehension, business-rule extraction, and functional analysis.
- Modernization recommendations or target-architecture advice.
- Hosted SaaS.
- Uploading or storing customer code.
- Default-on telemetry.

These are the original scope boundaries. Current product requirements and exclusions belong in OpenSpec and the current contribution guidance.

## Original release checklist and success measures

The following checklist is preserved as a historical release gate; its unchecked boxes are not current task status:

- [ ] Publish methodology and sign off weights.
- [ ] Prove deterministic scores across repeated runs.
- [ ] Test that a default run makes no network calls.
- [ ] Link every deduction to a specific finding.
- [ ] Render HTML and Markdown reports cleanly.
- [ ] Include a result-specific next step in report and CLI.
- [ ] Provide Apache 2.0 license, README, and `CONTRIBUTING.md`.
- [ ] Publish the GitHub Action.
- [ ] Review output from at least two real legacy codebases (one .NET, one Java) with someone outside the team.

The proposed success measures were:

| Measure | Intended signal |
|---|---|
| Assessments booked from LeapScore | The outcome the release was intended to drive |
| Report-to-assessment click-through | Whether the next-step link works |
| Teams running it in CI | Repeat use and integration |
| Stars and downloads | Observe, but do not optimize for them |

These measures describe the brief's strategy, not current analytics or reported results.
