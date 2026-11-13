## Purpose

Lets a sealed LeapScore run leave the report as a small, carryable, dated artifact — a badge that states the band, the score, how much of the scan was gradeable, and when it was measured — so a score can be cited outside the report without becoming an undated claim that rots in a README.

## Requirements

### Requirement: Badge is a derived view of a sealed envelope

The system SHALL derive every badge from an already-sealed report envelope. A badge SHALL NOT introduce, recompute, or reinterpret any graded quantity, SHALL NOT alter the sealed headline, band, category scores, gates, coverage counts, or any sealed row, and SHALL NOT change any threshold, weight, or rubric artifact. Generating a badge for an envelope SHALL NOT change that envelope's `score_fingerprint`.

The badge SHALL be derived from `report.headline`, `report.coverage`, `report.snapshot.scanned_at`, `report.status`, and `meta`. It SHALL NOT read a second threshold table; band thresholds SHALL resolve from the contract's band vocabulary.

#### Scenario: Sealed values are untouched

- **WHEN** the same envelope is rendered with and without a badge
- **THEN** the sealed score, band, coverage counts, gates, and `score_fingerprint` are identical

#### Scenario: Badge cannot disagree with the report

- **WHEN** an envelope seals at 62 Moderate and a badge is generated from it
- **THEN** the badge's score segment reads 62 and its band segment resolves to Moderate through the same contract thresholds the report used

#### Scenario: Badge is not a scored input

- **WHEN** a badge file is written into a scan output directory and that directory is rescanned
- **THEN** the badge file contributes no fact, message, or scored input to the new run

### Requirement: Four facts, each with one source

The badge SHALL carry exactly four facts, in this order: **score**, **band**, **coverage**, and **scan month**.

- **score** SHALL be `report.headline.score`, or absent when the headline is suppressed.
- **band** SHALL be `report.headline.tier` — the public band vocabulary (Low ≥80 / Moderate 53–79 / High 27–52 / Critical <27). The band SHALL be rendered as a word; the badge SHALL NOT encode band in color alone.
- **coverage** SHALL be the coverage described by the coverage-denominator requirement below, formatted as an integer percentage.
- **scan month** SHALL be `report.snapshot.scanned_at` truncated to `YYYY-MM` in UTC.

The badge SHALL NOT carry any other scored quantity. In particular it SHALL NOT carry a delta, a next-band distance, a gate count, a top-blocker, or a fingerprint excerpt.

#### Scenario: All four facts render

- **WHEN** an envelope sealed at score 62, band Moderate, coverage 61%, scanned 2026-10-31T09:12:00Z
- **THEN** the badge renders band `Moderate`, score `62`, coverage `61%`, and month `2026-10`

#### Scenario: Month is UTC and month-precision

- **WHEN** an envelope's `scanned_at` is `2026-11-01T02:00:00Z`
- **THEN** the badge renders `2026-11`, not the local-time month and not the day

#### Scenario: No fifth fact

- **WHEN** a badge is rendered for any sealed envelope
- **THEN** no number other than the score and the coverage percentage appears in the badge value

### Requirement: Coverage denominates over gradeable rows

The badge's coverage percentage SHALL be the coverage-floor quantity — gradeable rows over attempted rows:

`coverage = (measured + estimated) / (measured + estimated + unknown)`

The badge SHALL take this value from the same computation the headline-suppression rule uses (`COVERAGE_FLOOR`), not from a second denominator. The system SHALL NOT use the full-rubric denominator (`measured / 102`) as a badge coverage value, because it exposes unimplemented detectors as a deficiency of the scanned repository.

`not_applicable` and `not_implemented` rows SHALL be excluded from both numerator and denominator. Estimations the indicator's own spec defines SHALL count as gradeable, per `measurement-honesty`.

#### Scenario: Coverage and suppression cannot contradict

- **WHEN** a scan measures 45 rows, estimates 20, and records 35 unknown
- **THEN** the badge coverage reads 65%, and a headline is printed, because the same 65% clears the coverage floor

#### Scenario: Unimplemented detectors are not the subject's deficiency

- **WHEN** a scan of a 102-indicator rubric has 31 implemented indicators, of which 28 are measured, 1 estimated, and 2 unknown
- **THEN** the badge coverage reads 94%, not 28%, because the 71 unimplemented rows are excluded from the denominator

#### Scenario: Nothing attempted reports zero

- **WHEN** a scan records zero measured, zero estimated, and zero unknown rows
- **THEN** the badge coverage reads 0% and the badge carries the not-scanned state

### Requirement: Disclosure states replace the number rather than the badge

The badge SHALL render one of five states. A state that means "no trustworthy number exists" SHALL replace the score-and-band segment; it SHALL NOT suppress the badge, and it SHALL NOT print a number the report declined to state.

| State | Condition | Value segment |
|---|---|---|
| **scored** | a headline score exists and the scan is complete | `{score} {Band} · {cov}% · {YYYY-MM}` |
| **suppressed** | `report.headline.suppressed` is true (verdict `insufficient-signal`) | `unscored · {cov}% · {YYYY-MM}` |
| **incomplete** | the scan verdict is incomplete (truncated tree, unreadable path, out-of-root symlink) | `{score} {Band} · {cov}% · {YYYY-MM} · incomplete` |
| **not-scanned** | nothing was attempted (coverage denominator is zero) | `not scanned · {YYYY-MM}` |
| **absent** | the envelope is an authored fixture (`report.sample === true`) | no badge is produced |

#### Scenario: Suppressed headline renders unscored

- **WHEN** an envelope seals with verdict `insufficient-signal` at 41% coverage in 2026-10
- **THEN** the badge renders `unscored · 41% · 2026-10` and carries no score and no band

#### Scenario: Incomplete scan discloses itself

- **WHEN** an envelope carries a score but its scan verdict is incomplete
- **THEN** the badge renders the score, band, coverage, and month, plus the `incomplete` marker, so the number is never presented as authoritative

#### Scenario: Suppressed and incomplete together

- **WHEN** an envelope is both suppressed and incomplete
- **THEN** the badge renders `unscored · {cov}% · {YYYY-MM} · incomplete`

#### Scenario: Fixture never mints a badge

- **WHEN** badge generation is asked for a report whose `sample` marker is true
- **THEN** no badge file is written and the caller receives an explicit refusal naming `sample`

#### Scenario: A delta document is not a badge source

- **WHEN** badge generation is asked for a run-diff delta document rather than a sealed envelope
- **THEN** it refuses, naming the difference, exactly as the baseline loader refuses a delta passed as a baseline

### Requirement: Value-segment grammar admits a future occupant without a new badge

The badge SHALL consist of a fixed label segment and a variable value segment. The label segment SHALL be constant for the product. The value segment SHALL be an occupant slot, so a later event-shaped occupant (for example a code-attributed band transition) can replace the score-and-band occupant without changing the badge's label, dimensions convention, or embed grammar.

This change SHALL ship only the **scored**, **suppressed**, **incomplete**, and **not-scanned** occupants. No delta or transition occupant SHALL be emitted by this change.

#### Scenario: Label is stable across states

- **WHEN** a repository's badge moves from `62 Moderate · 61% · 2026-10` to `unscored · 41% · 2026-11`
- **THEN** the label segment is unchanged, so a reader recognises the same badge

#### Scenario: No delta occupant is emitted

- **WHEN** a badge is generated with a baseline delta available
- **THEN** the badge renders the scored occupant and the delta appears nowhere in the badge

### Requirement: Claim and qualifier are visually distinct

The badge SHALL present the score-and-band as the primary claim and the coverage-and-month as its qualifier. The primary claim SHALL carry the band's tier color on its own background segment; the qualifier SHALL be visually subordinate (dimmer foreground, no tier tint) so the badge reads as one claim with a disclosure rather than as four equal facts.

The badge SHALL carry a full accessible sentence — the band, score, coverage, month, and any disclosure marker — in its accessible name, so a reader who cannot see the pill still learns all four facts and every disclosure.

#### Scenario: Tier color is on the claim only

- **WHEN** a badge renders the scored state for a Moderate band
- **THEN** the score-and-band segment carries the Moderate tier color and the coverage-and-month segment does not

#### Scenario: Accessible name carries the sentence

- **WHEN** a badge renders `62 Moderate · 61% · 2026-10`
- **THEN** its accessible name reads as a sentence naming score 62, band Moderate, 61% gradeable, and October 2026

#### Scenario: Color is not the only band signal

- **WHEN** a badge is rendered and desaturated, or read by a reader who cannot distinguish the tier colors
- **THEN** the band is still legible because the band word is rendered as text

### Requirement: Embed snippet is a first-class deliverable

An SVG badge does not link to anything when embedded via an image tag; the host page supplies the link. The system SHALL therefore emit, alongside the SVG, a copy-paste embed snippet that carries the full accessible sentence in the image's alternative text. The snippet SHALL wrap the badge in a link to the sealed report permalink only when the emitting deployment can resolve that permalink. When it cannot, the snippet SHALL emit the badge without a link, or link to the methodology page, and SHALL NOT imply that a hosted report exists.

The permalink SHALL be built by a shared helper and, when emitted, SHALL resolve to the run's sealed report rather than the site's marketing surface. The badge SHALL NOT carry the assessment next-step link — that link is single-sourced by `release-funnel` for the next-step surface and appears exactly once per report artifact.

The snippet SHALL be provided in Markdown and HTML. An app-supplied badge (served and kept current by a LeapScore endpoint) SHALL NOT be required for a badge to exist or to be correct.

#### Scenario: Snippet links to the permalink

- **WHEN** an embed snippet is emitted by a deployment that hosts sealed reports, for run `acme__api__a3f9c1__20261031T091200Z`
- **THEN** the snippet's image is wrapped in a link to that run's sealed report permalink

#### Scenario: Snippet does not promise an unresolvable permalink

- **WHEN** an embed snippet is emitted by a deployment that does not host sealed reports
- **THEN** the snippet does not wrap the image in a per-run report link and does not state or imply that the report is hosted

#### Scenario: Alt text is not a label

- **WHEN** an embed snippet is emitted
- **THEN** the image's alternative text is the full sentence, not the word `badge` and not the score alone

#### Scenario: No assessment campaign on the badge link

- **WHEN** a badge embed snippet is inspected
- **THEN** it carries no `utm_campaign` or `band` query parameters, because it is a citation and not a next-step link

#### Scenario: Badge works without the service

- **WHEN** the badge SVG is committed to a repository and the LeapScore host is unreachable
- **THEN** the badge still renders, because it is a self-contained static file

### Requirement: Deterministic, byte-identical output

Badge generation SHALL be deterministic: the same sealed envelope SHALL produce a byte-identical SVG. The badge SHALL NOT embed a wall-clock timestamp, generation host, user identity, or run duration. Its only time-derived content SHALL be the scan month, read from `meta`/`snapshot`.

The badge SHALL be a self-contained SVG with no external font, image, script, or stylesheet reference, so it renders identically inside a README, an email, and an offline viewer.

#### Scenario: Same envelope yields identical bytes

- **WHEN** the same envelope is rendered twice, on different machines and at different times
- **THEN** both SVGs are byte-identical

#### Scenario: No external references

- **WHEN** a badge SVG is inspected
- **THEN** it references no external font, image, script, or stylesheet

#### Scenario: Regeneration is the freshness mechanism

- **WHEN** a repository is rescanned in a later month
- **THEN** regenerating the badge changes the month, so a stale badge is visibly stale rather than silently wrong

### Requirement: Badge never overstates the scan

The badge's month SHALL record when the scan ran, not when the badge was generated. A badge regenerated from an old envelope SHALL keep the old month, so regenerating a badge can never make an out-of-date scan look current.

#### Scenario: Regenerating an old envelope keeps the old month

- **WHEN** an envelope sealed in 2026-03 is used to regenerate a badge in 2027-01
- **THEN** the badge renders `2026-03`

#### Scenario: Freshness requires a new scan

- **WHEN** a maintainer wants a current month on the badge
- **THEN** the only path is a new scan that produces a new envelope, not a re-render of an old one
