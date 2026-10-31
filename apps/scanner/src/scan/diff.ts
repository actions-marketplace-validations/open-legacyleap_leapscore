/**
 * apps/scanner/src/scan/diff.ts — the `run-diff` capability: compare a sealed
 * run against a baseline envelope and emit an attributable delta document.
 *
 * Pure by construction (no fs, no network): the caller reads and parses the
 * baseline, the differ is a function of two sealed envelopes. It never
 * re-seals, never mutates an input, and never writes a fingerprint — the delta
 * is derived (design D5).
 *
 * Rules this module implements, in one place:
 * - comparability verdict before any delta (subject, fingerprint era, rubric
 *   version, requested indicator set, per-row producer versions); engine
 *   identity alone never blocks (D1);
 * - row-wise comparison over rows graded in both, transitions instead of score
 *   deltas for rows graded in one (spec: row-wise comparison and transitions);
 * - one kind per difference with `model-change` taking precedence over
 *   `scored-change` (D4);
 * - headline decomposition by kind with a disclosed residual (D8);
 * - ratchet semantics: gate the code-attributable part, refuse on
 *   `incomparable` rather than passing (D6/D7).
 */
import {
  DELTA_DOCUMENT,
  DELTA_SCHEMA_VERSION,
  resolveRequestedIndicators,
  type ComparabilityBlockingCause,
  type ComparabilityInputReport,
  type ComparabilityVerdict,
  type DeltaDocument,
  type DeltaHeadlineDecomposition,
  type DeltaKind,
  type DeltaProducerExclusion,
  type DeltaRowDifference,
  type DeltaRunReference,
  type DeltaTransition,
  type DeltaTransitionEntry,
  type EnvelopeMeta,
  type Report as ContractReport,
  type ReportEnvelope,
  type RequestedIndicatorsResolution,
  type RowStatus,
} from '@leapscore/contracts';

// ---------------------------------------------------------------------------
// Row views
// ---------------------------------------------------------------------------

export type DiffEvidencePointer = { file?: string; line?: number; detail?: string };

export type DiffRow = {
  id: string;
  name?: string;
  category_id?: string;
  status: RowStatus;
  score?: number;
  reason?: string;
  unknown_measure_path?: string;
  evidence?: { tool?: string; tool_version?: string; pointers?: DiffEvidencePointer[] };
};

/** A row absent from a run's table is `not_implemented` for that run — the one
 *  honest reading of "this slice does not build it". */
const ABSENT_ROW: RowStatus = 'not_implemented';

function rowsOf(report: ContractReport | undefined): DiffRow[] {
  if (!report) return [];
  const table = (report as unknown as { full_table?: unknown }).full_table;
  if (Array.isArray(table) && table.length) return table as DiffRow[];
  // Fallback for reports whose rows live only in the category scorecard.
  const cats = (report as unknown as { categories?: Array<{ indicator_rows?: unknown }> }).categories ?? [];
  return cats.flatMap((c) => (Array.isArray(c.indicator_rows) ? (c.indicator_rows as DiffRow[]) : []));
}

function weightsOf(report: ContractReport | undefined): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const c of (report as unknown as { categories?: Array<{ id?: string; weight?: number }> }).categories ?? []) {
    if (c?.id) weights[String(c.id)] = Number(c.weight ?? 0);
  }
  return weights;
}

function isGraded(status: RowStatus): boolean {
  return status === 'measured' || status === 'estimated';
}

function countsInDenominator(status: RowStatus, policy: string): boolean {
  if (status === 'not_implemented' || status === 'not_applicable') return false;
  if (policy === 'legacy') return isGraded(status);
  // Frozen denominator: unknowns stay in as disclosed unscored rows.
  return true;
}

/**
 * Recompute a headline from a set of rows under a score policy — the frozen
 * denominator (unknowns in, unscored) or the legacy renormalized reference.
 * This is the same arithmetic the scorer seals with, expressed over rows so a
 * counterfactual row set can be priced; the differ never re-derives sealed
 * numbers for the runs themselves, only for the attribution steps.
 */
export function headlineFromRows(
  rows: Array<Pick<DiffRow, 'category_id' | 'status' | 'score'>>,
  policy: string,
  weights: Record<string, number>,
): number {
  const byCat = new Map<string, Array<Pick<DiffRow, 'status' | 'score'>>>();
  for (const r of rows) {
    const cat = String(r.category_id ?? '');
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat)!.push(r);
  }
  const legacy = policy === 'legacy';
  const applicable = [...byCat.entries()].filter(([, rs]) => rs.some((r) => isGraded(r.status)));
  const totalApplicable = applicable.reduce((sum, [cat]) => sum + (weights[cat] ?? 0), 0);
  let total = 0;
  for (const [cat, rs] of byCat.entries()) {
    const base = weights[cat] ?? 0;
    let effective = base;
    if (legacy) {
      // Renormalized reference: only categories with a graded row carry weight,
      // rescaled to 100 (the scorer's renormalizeWeights).
      const inApplicable = applicable.some(([c]) => c === cat);
      effective = !inApplicable || totalApplicable === 0 ? 0 : (base / totalApplicable) * 100;
    }
    const counted = rs.filter((r) => countsInDenominator(r.status, policy));
    if (!counted.length) continue;
    const scored = counted.reduce((sum, r) => sum + (isGraded(r.status) ? Number(r.score ?? 0) : 0), 0);
    total += (scored * effective) / (3 * counted.length);
  }
  return round2(total);
}

// ---------------------------------------------------------------------------
// Run references and comparability inputs
// ---------------------------------------------------------------------------

function metaOf(env: ReportEnvelope | undefined): Partial<EnvelopeMeta> {
  return ((env as unknown as { meta?: Partial<EnvelopeMeta> })?.meta ?? {}) as Partial<EnvelopeMeta>;
}

function headlineOf(env: ReportEnvelope | undefined): { score?: number; tier?: string; suppressed: boolean; policy?: string } {
  const headline = (env as unknown as { report?: { headline?: { score?: number; tier?: string; suppressed?: boolean; score_policy?: string } } })?.report?.headline;
  return {
    score: typeof headline?.score === 'number' ? headline.score : undefined,
    tier: headline?.tier,
    suppressed: headline?.suppressed === true,
    policy: headline?.score_policy,
  };
}

/** One side of the comparison: identity enough to re-read or re-baseline the run. */
export function runReference(env: ReportEnvelope): DeltaRunReference {
  const meta = metaOf(env);
  const headline = headlineOf(env);
  return {
    runId: String(meta.runId ?? ''),
    score: headline.suppressed || headline.score === undefined ? null : headline.score,
    tier: String(headline.tier ?? meta.tier ?? ''),
    suppressed: headline.suppressed,
    ...(meta.score_fingerprint ? { score_fingerprint: meta.score_fingerprint } : {}),
    ...(typeof meta.fingerprint_version === 'number' ? { fingerprint_version: meta.fingerprint_version } : {}),
    ...(meta.ranAt ? { ranAt: meta.ranAt } : {}),
    ...(meta.repoSha ? { repoSha: meta.repoSha } : {}),
    ...(meta.rubric_version ? { rubric_version: meta.rubric_version } : {}),
    ...(meta.engine_version ? { engine_version: meta.engine_version } : {}),
    ...(meta.engineSha7 ? { engineSha7: meta.engineSha7 } : {}),
  };
}

function subjectOf(env: ReportEnvelope): string | undefined {
  const meta = metaOf(env);
  const slug = meta.repoSlug ?? (meta.repo ? String(meta.repo).toLowerCase().replace('/', '__') : undefined);
  return slug && String(slug).trim() ? String(slug) : undefined;
}

function producerOf(row: DiffRow): { tool: string; version: string } {
  return { tool: String(row.evidence?.tool ?? ''), version: String(row.evidence?.tool_version ?? '') };
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

type RunView = {
  envelope: ReportEnvelope;
  rows: Map<string, DiffRow>;
  order: string[];
  weights: Record<string, number>;
  requested: RequestedIndicatorsResolution;
  ref: DeltaRunReference;
};

function viewOf(env: ReportEnvelope): RunView {
  const rows = rowsOf(env.report);
  const map = new Map<string, DiffRow>();
  for (const r of rows) if (r?.id) map.set(String(r.id), r);
  return {
    envelope: env,
    rows: map,
    order: [...map.keys()],
    weights: weightsOf(env.report),
    requested: resolveRequestedIndicators({
      meta: env.meta as unknown as { requested_indicators?: unknown },
      report: env.report as unknown as { full_table?: unknown },
    }),
    ref: runReference(env),
  };
}

function listLabel(ids: string[]): string {
  return `${ids.length} requested`;
}

function input(name: ComparabilityInputReport['name'], matched: boolean, detail: string): ComparabilityInputReport {
  return { name, matched, detail };
}

/** Rows graded in both runs whose producing tool identity or version differs —
 *  the material for `comparable-with-row-exclusions` (run-diff D4). */
function producerExclusions(base: RunView, cur: RunView): { rows: string[]; producers: DeltaProducerExclusion[] } {
  const rows: string[] = [];
  const producers = new Map<string, DeltaProducerExclusion>();
  for (const id of cur.order) {
    const b = base.rows.get(id);
    const c = cur.rows.get(id);
    if (!b || !c) continue;
    if (!isGraded(b.status) || !isGraded(c.status)) continue;
    const pb = producerOf(b);
    const pc = producerOf(c);
    if (!pb.version || !pc.version) continue;
    if (pb.tool === pc.tool && pb.version === pc.version) continue;
    rows.push(id);
    const key = `${pb.tool}@${pb.version}->${pc.tool}@${pc.version}`;
    if (!producers.has(key)) {
      producers.set(key, { tool: pc.tool || pb.tool, baseline_version: pb.version, current_version: pc.version });
    }
  }
  rows.sort();
  return { rows, producers: [...producers.values()] };
}

type ComparabilityOutcome = {
  status: ComparabilityVerdict;
  cause?: ComparabilityBlockingCause;
  inputs: ComparabilityInputReport[];
  exclusions: { rows: string[]; producers: DeltaProducerExclusion[] };
  requestedDiffer: boolean;
};

function comparability(base: RunView, cur: RunView): ComparabilityOutcome {
  const inputs: ComparabilityInputReport[] = [];
  const exclusions = producerExclusions(base, cur);
  const empty = { rows: [], producers: [] as DeltaProducerExclusion[] };
  const bMeta = metaOf(base.envelope);
  const cMeta = metaOf(cur.envelope);

  const refuse = (
    cause: ComparabilityBlockingCause,
    detail: string,
    name: ComparabilityInputReport['name'],
  ): ComparabilityOutcome => ({
    status: 'incomparable',
    cause,
    inputs: [...inputs, input(name, false, detail)],
    exclusions: empty,
    requestedDiffer: false,
  });

  // Subject identity.
  const bSubject = subjectOf(base.envelope);
  const cSubject = subjectOf(cur.envelope);
  if (!bSubject || !cSubject) {
    return refuse('missing-comparability-inputs', 'a run carries no subject slug', 'subject');
  }
  if (bSubject !== cSubject) {
    return refuse('subject-mismatch', `${bSubject} vs ${cSubject}`, 'subject');
  }
  inputs.push(input('subject', true, bSubject));

  // Fingerprint scheme era.
  const bEra = bMeta.fingerprint_version;
  const cEra = cMeta.fingerprint_version;
  if (typeof bEra !== 'number' || typeof cEra !== 'number') {
    return refuse('missing-comparability-inputs', 'a run carries no fingerprint scheme version', 'fingerprint-era');
  }
  if (bEra !== cEra) {
    return refuse('fingerprint-era-mismatch', `fingerprint_version ${bEra} vs ${cEra}`, 'fingerprint-era');
  }
  inputs.push(input('fingerprint-era', true, `fingerprint_version ${bEra}`));

  // Rubric version.
  const bRubric = bMeta.rubric_version;
  const cRubric = cMeta.rubric_version;
  if (!bRubric || !cRubric) {
    return refuse('missing-comparability-inputs', 'a run carries no rubric version', 'rubric-version');
  }
  if (bRubric !== cRubric) {
    return refuse('rubric-version-mismatch', `${bRubric} vs ${cRubric}`, 'rubric-version');
  }
  inputs.push(input('rubric-version', true, String(bRubric)));

  // Requested indicator set (recorded, or reconstructed per D3).
  if (!base.requested.ok || !cur.requested.ok) {
    const detail = !base.requested.ok ? base.requested.detail : (cur.requested as { detail: string }).detail;
    return refuse('missing-comparability-inputs', detail, 'requested-indicators');
  }
  const bSet = base.requested.indicators;
  const cSet = cur.requested.indicators;
  const requestedDiffer = bSet.length !== cSet.length || bSet.some((id, i) => id !== cSet[i]);
  inputs.push(
    input(
      'requested-indicators',
      !requestedDiffer,
      `${listLabel(bSet)} (${base.requested.source}) vs ${listLabel(cSet)} (${cur.requested.source})`,
    ),
  );

  // A run with no stated score has nothing to compare against — refused rather
  // than read as zero, matching the rule that a suppressed headline never passes.
  if (base.ref.suppressed || cur.ref.suppressed) {
    return refuse(
      'missing-comparability-inputs',
      `${base.ref.suppressed ? 'baseline' : 'current'} headline is suppressed (insufficient signal) — no stated score to compare`,
      'subject',
    );
  }

  // Engine identity: named, never blocking (D1) — a row's meaning is fixed by
  // the rubric and the producer, not by the release that orchestrated them.
  const engineMatched =
    (bMeta.engineSha7 ?? '') === (cMeta.engineSha7 ?? '') && (bMeta.engine_version ?? '') === (cMeta.engine_version ?? '');
  inputs.push(
    input(
      'engine-identity',
      engineMatched,
      `${bMeta.engineSha7 ?? 'unknown'}/${bMeta.engine_version ?? 'unknown'} vs ${cMeta.engineSha7 ?? 'unknown'}/${cMeta.engine_version ?? 'unknown'}`,
    ),
  );

  // Headline policy: recorded and classified, never blocking (rows still compare).
  const bPolicy = bMeta.score_policy ?? headlineOf(base.envelope).policy ?? 'frozen';
  const cPolicy = cMeta.score_policy ?? headlineOf(cur.envelope).policy ?? 'frozen';
  inputs.push(input('score-policy', bPolicy === cPolicy, `${bPolicy} vs ${cPolicy}`));

  inputs.push(
    input(
      'producer-versions',
      exclusions.rows.length === 0,
      exclusions.rows.length
        ? `${exclusions.rows.length} row(s) withheld: ${exclusions.producers
            .map((p) => `${p.tool} ${p.baseline_version}→${p.current_version}`)
            .join(', ')}`
        : 'producing tool versions match for every row graded in both runs',
    ),
  );

  const status: ComparabilityVerdict =
    exclusions.rows.length > 0
      ? 'comparable-with-row-exclusions'
      : requestedDiffer
        ? 'comparable-with-coverage-change'
        : 'comparable';
  return { status, inputs, exclusions, requestedDiffer };
}

// ---------------------------------------------------------------------------
// Row differences and transitions
// ---------------------------------------------------------------------------

/** Transition for a row whose graded-set membership or applicability moved.
 *  Returns undefined when the row is graded-window-compatible on both sides. */
function transitionFor(baseStatus: RowStatus, curStatus: RowStatus): DeltaTransition | undefined {
  if (baseStatus === curStatus) return undefined;
  if (baseStatus === 'not_implemented') return 'became-implemented';
  if (curStatus === 'not_implemented') return 'became-ungraded';
  if (curStatus === 'not_applicable') return 'became-not-applicable';
  if (baseStatus === 'not_applicable') return 'became-applicable';
  if (isGraded(baseStatus) && !isGraded(curStatus)) return 'became-ungraded';
  if (!isGraded(baseStatus) && isGraded(curStatus)) return 'became-graded';
  // measured ↔ estimated: the row stayed graded but its measurement basis moved.
  return undefined;
}

const TRANSITION_KIND: Record<DeltaTransition, DeltaKind> = {
  'became-graded': 'coverage-change',
  'became-ungraded': 'coverage-change',
  'became-applicable': 'applicability-change',
  'became-not-applicable': 'applicability-change',
  'became-implemented': 'implementation-change',
};

function transitionReason(row: DiffRow | undefined): string | undefined {
  const reason = row?.reason ?? row?.unknown_measure_path;
  return reason ? String(reason) : undefined;
}

function transitionEvidence(row: DiffRow | undefined): string[] {
  const pointers = row?.evidence?.pointers ?? [];
  return pointers
    .map((p) => [p.file, p.line != null ? `:${p.line}` : '', p.detail ? ` — ${p.detail}` : ''].join(''))
    .filter((s) => s.trim().length > 0);
}

type RowCase = {
  id: string;
  kind: DeltaKind | 'none';
  baseRow: DiffRow;
  curRow: DiffRow;
  excluded: boolean;
};

function rowCases(base: RunView, cur: RunView, exclusions: Set<string>): RowCase[] {
  const ids = [...new Set([...cur.order, ...base.order])].sort();
  const cases: RowCase[] = [];
  for (const id of ids) {
    const baseRow = base.rows.get(id) ?? ({ id, status: ABSENT_ROW } as DiffRow);
    const curRow = cur.rows.get(id) ?? ({ id, status: ABSENT_ROW } as DiffRow);
    const transition = transitionFor(baseRow.status, curRow.status);
    const excluded = exclusions.has(id);
    const gradedBoth = isGraded(baseRow.status) && isGraded(curRow.status);
    const scoreMoved = gradedBoth && Number(baseRow.score ?? 0) !== Number(curRow.score ?? 0);
    const statusMoved = baseRow.status !== curRow.status;

    let kind: DeltaKind | 'none' = 'none';
    if (excluded) kind = 'model-change';
    else if (transition) kind = TRANSITION_KIND[transition];
    else if (statusMoved) kind = 'coverage-change';
    else if (scoreMoved) kind = 'scored-change';

    if (kind === 'none') continue;
    cases.push({ id, kind, baseRow, curRow, excluded });
  }
  return cases;
}

function rowDifference(c: RowCase): DeltaRowDifference {
  const transition = transitionFor(c.baseRow.status, c.curRow.status);
  const gradedBoth = isGraded(c.baseRow.status) && isGraded(c.curRow.status);
  const pb = producerOf(c.baseRow);
  const pc = producerOf(c.curRow);
  const producerChanged = c.excluded && (pb.tool !== pc.tool || pb.version !== pc.version);
  return {
    row: c.id,
    ...(c.curRow.name ? { name: c.curRow.name } : {}),
    ...(c.curRow.category_id ? { category: c.curRow.category_id } : {}),
    kind: c.kind as DeltaKind,
    from: { status: c.baseRow.status, ...(c.baseRow.score != null ? { score: c.baseRow.score } : {}) },
    to: { status: c.curRow.status, ...(c.curRow.score != null ? { score: c.curRow.score } : {}) },
    ...(gradedBoth ? { score_delta: round2(Number(c.curRow.score ?? 0) - Number(c.baseRow.score ?? 0)) } : {}),
    ...(transition ? { transition } : {}),
    ...(transition && transitionReason(c.curRow) ? { transition_reason: transitionReason(c.curRow) } : {}),
    ...(transition && transitionEvidence(c.curRow).length ? { transition_evidence: transitionEvidence(c.curRow) } : {}),
    ...(producerChanged ? { producer: { tool: pc.tool || pb.tool, from: pb.version, to: pc.version } } : {}),
  };
}

// ---------------------------------------------------------------------------
// Headline decomposition
// ---------------------------------------------------------------------------

export function round2(n: number): number {
  const r = Math.round(n * 100) / 100;
  return r === 0 ? 0 : r;
}

function effectiveRowsFor(
  base: RunView,
  cur: RunView,
  cases: RowCase[],
  revert: (c: RowCase) => boolean,
): Array<Pick<DiffRow, 'category_id' | 'status' | 'score'>> {
  const reverted = new Set(cases.filter(revert).map((c) => c.id));
  return [...new Set([...cur.order, ...base.order])]
    .sort()
    .map((id) => {
      const baseRow = base.rows.get(id);
      const curRow = cur.rows.get(id);
      const source = reverted.has(id) ? baseRow : curRow;
      const fallback = source ?? baseRow ?? curRow;
      return {
        category_id: String(fallback?.category_id ?? ''),
        status: (fallback?.status ?? ABSENT_ROW) as RowStatus,
        ...(fallback?.score != null ? { score: fallback.score } : {}),
      };
    });
}

function decompose(
  base: RunView,
  cur: RunView,
  cases: RowCase[],
  policy: string,
  notes: string[],
): DeltaHeadlineDecomposition {
  const weights = { ...base.weights, ...cur.weights };
  const baseSealed = base.ref.score ?? 0;
  const curSealed = cur.ref.score ?? 0;

  const Hcur = headlineFromRows(effectiveRowsFor(base, cur, cases, () => false), policy, weights);
  const HmodelFixed = headlineFromRows(
    effectiveRowsFor(base, cur, cases, (c) => c.kind === 'model-change'),
    policy,
    weights,
  );
  const HcoverageFixed = headlineFromRows(
    effectiveRowsFor(base, cur, cases, (c) => c.kind !== 'scored-change' && c.kind !== 'none'),
    policy,
    weights,
  );
  const Hbase = headlineFromRows(
    [...new Set([...base.order, ...cur.order])].sort().map((id) => {
      const r = base.rows.get(id);
      return {
        category_id: String(r?.category_id ?? ''),
        status: (r?.status ?? ABSENT_ROW) as RowStatus,
        ...(r?.score != null ? { score: r.score } : {}),
      };
    }),
    policy,
    weights,
  );

  const model = round2(Hcur - HmodelFixed);
  const coverage = round2(HmodelFixed - HcoverageFixed);
  const code = round2(HcoverageFixed - Hbase);
  const movement = round2(curSealed - baseSealed);
  const unattributable = round2(movement - (code + coverage + model));
  const noCodeChangeMeasured = code === 0 && movement !== 0;
  return {
    baseline: round2(baseSealed),
    current: round2(curSealed),
    movement,
    code_attributable: code,
    coverage_attributable: coverage,
    model_attributable: model,
    unattributable,
    policy,
    no_code_change_measured: noCodeChangeMeasured,
    statement: decomposeStatement({ movement, code, coverage, model, unattributable, noCodeChangeMeasured }),
    attribution_notes: notes,
  };
}

function decomposeStatement(parts: {
  movement: number;
  code: number;
  coverage: number;
  model: number;
  unattributable: number;
  noCodeChangeMeasured: boolean;
}): string {
  const { movement, code, coverage, model, unattributable } = parts;
  const residual = unattributable === 0 ? '' : ` ${Math.abs(unattributable)}pp could not be attributed and is disclosed as unattributable.`;
  if (movement === 0) {
    return `The headline did not move (${code >= 0 ? '+' : ''}${code}pp code, ${coverage >= 0 ? '+' : ''}${coverage}pp coverage, ${model >= 0 ? '+' : ''}${model}pp model).${residual}`;
  }
  if (parts.noCodeChangeMeasured) {
    return `The headline moved ${movement > 0 ? '+' : ''}${movement}pp with a code-attributable part of 0pp: no code change was measured — the movement is coverage (${coverage > 0 ? '+' : ''}${coverage}pp), model (${model > 0 ? '+' : ''}${model}pp), or applicability.${residual}`;
  }
  const direction = code > 0 ? 'rise' : 'fall';
  return `The headline ${direction} of ${movement > 0 ? '+' : ''}${movement}pp attributes ${code > 0 ? '+' : ''}${code}pp to code, ${coverage > 0 ? '+' : ''}${coverage}pp to coverage, and ${model > 0 ? '+' : ''}${model}pp to model changes.${residual}`;
}

// ---------------------------------------------------------------------------
// The delta document
// ---------------------------------------------------------------------------

/**
 * Compare two sealed envelopes. The returned document is derived: it carries no
 * fingerprint, mutates neither input, and emits no numbers at all when the
 * verdict is `incomparable`.
 */
export function computeDelta(baseline: ReportEnvelope, current: ReportEnvelope): DeltaDocument {
  const base = viewOf(baseline);
  const cur = viewOf(current);
  const baseRef = base.ref;
  const curRef = cur.ref;

  if (base.order.length === 0 || cur.order.length === 0) {
    return {
      document: DELTA_DOCUMENT,
      delta_schema: DELTA_SCHEMA_VERSION,
      baseline: baseRef,
      current: curRef,
      verdict: {
        status: 'incomparable',
        cause: 'missing-comparability-inputs',
        inputs: [
          input(
            'subject',
            false,
            `${base.order.length === 0 ? 'baseline' : 'current'} carries no full table to compare rows over`,
          ),
        ],
      },
      rows: [],
      transitions: [],
    };
  }

  const comparabilityOutcome = comparability(base, cur);
  if (comparabilityOutcome.status === 'incomparable') {
    return {
      document: DELTA_DOCUMENT,
      delta_schema: DELTA_SCHEMA_VERSION,
      baseline: baseRef,
      current: curRef,
      verdict: {
        status: 'incomparable',
        cause: comparabilityOutcome.cause,
        inputs: comparabilityOutcome.inputs,
      },
      rows: [],
      transitions: [],
    };
  }

  const excluded = new Set(comparabilityOutcome.exclusions.rows);
  const cases = rowCases(base, cur, excluded);
  const rows = cases.map(rowDifference);
  const transitions: DeltaTransitionEntry[] = cases
    .filter((c) => rowDifference(c).transition)
    .map((c) => {
      const diff = rowDifference(c);
      return {
        row: c.id,
        transition: diff.transition as DeltaTransition,
        kind: diff.kind,
        ...(diff.transition_reason ? { reason: diff.transition_reason } : {}),
        ...(diff.transition_evidence ? { evidence: diff.transition_evidence } : {}),
      };
    });

  const curPolicy = metaOf(current).score_policy ?? headlineOf(current).policy ?? 'frozen';
  const basePolicy = metaOf(baseline).score_policy ?? headlineOf(baseline).policy ?? 'frozen';
  const notes: string[] = [];
  if (comparabilityOutcome.exclusions.rows.length) {
    notes.push(
      `${comparabilityOutcome.exclusions.rows.length} row(s) withheld from code attribution — producing tool version differs: ${comparabilityOutcome.exclusions.producers
        .map((p) => `${p.tool} ${p.baseline_version}→${p.current_version}`)
        .join(', ')}`,
    );
  }
  const transitionRows = cases.filter((c) => c.kind === 'coverage-change' || c.kind === 'applicability-change' || c.kind === 'implementation-change');
  if (transitionRows.length) {
    notes.push(
      `${transitionRows.length} row(s) entered or left the graded set (coverage, applicability, or implementation) and contribute no code movement`,
    );
  }
  if (basePolicy !== curPolicy) {
    notes.push(
      `the baseline sealed under score_policy ${basePolicy} and this run under ${curPolicy} — the decomposition uses ${curPolicy} for both sides, so any remainder appears as unattributable`,
    );
  }

  return {
    document: DELTA_DOCUMENT,
    delta_schema: DELTA_SCHEMA_VERSION,
    baseline: baseRef,
    current: curRef,
    verdict: {
      status: comparabilityOutcome.status,
      ...(comparabilityOutcome.exclusions.rows.length
        ? { row_exclusions: comparabilityOutcome.exclusions }
        : {}),
      inputs: comparabilityOutcome.inputs,
    },
    headline: decompose(base, cur, cases, curPolicy, notes),
    rows,
    transitions,
  };
}

// ---------------------------------------------------------------------------
// Summary line and ratchet
// ---------------------------------------------------------------------------

function signed(n: number): string {
  return `${n > 0 ? '+' : ''}${n}`;
}

/** One-line summary printed after the sealed-run line (scan-local). Reads the
 *  verdict, the decomposition, and the exclusion count; never a second number
 *  the sealed line already carries. When a ratchet gate was requested its
 *  outcome joins the same line, so a passing gate is visible without becoming a
 *  second line. */
export function formatDeltaLine(delta: DeltaDocument, opts: { ratchetState?: string } = {}): string {
  const ratchet = opts.ratchetState ? ` ${opts.ratchetState}` : '';
  if (delta.verdict.status === 'incomparable') {
    return `delta:incomparable cause:${delta.verdict.cause} — comparison refused, no score delta produced${ratchet}`;
  }
  const h = delta.headline!;
  const clause = h.no_code_change_measured ? ' no-code-change' : '';
  return `delta:${delta.verdict.status} movement:${signed(h.movement)}pp code:${signed(h.code_attributable)}pp coverage:${signed(h.coverage_attributable)}pp model:${signed(h.model_attributable)}pp unattributable:${signed(h.unattributable)}pp rows:${delta.rows.length} transitions:${delta.transitions.length}${clause}${ratchet}`;
}

export type RatchetOutcome = {
  /** True when the code-attributable part regressed beyond tolerance. */
  tripped: boolean;
  /** True when the gate could not evaluate and must not report a pass. */
  refused: boolean;
  state: string;
  message: string;
};

/**
 * Ratchet semantics (run-diff D6/D7): gate the code-attributable part, refuse
 * on an `incomparable` verdict naming the cause, and never trip on coverage-,
 * model-, or applicability-attributable movement.
 */
export function ratchetOutcome(delta: DeltaDocument, tolerance: number): RatchetOutcome {
  if (delta.verdict.status === 'incomparable') {
    const cause = String(delta.verdict.cause);
    return {
      tripped: false,
      refused: true,
      state: `ratchet:refused(${cause})`,
      message: `ratchet refused: comparison is incomparable (${cause}) — a gate that cannot evaluate does not pass`,
    };
  }
  const code = delta.headline?.code_attributable ?? 0;
  const tripped = code < -tolerance;
  return {
    tripped,
    refused: false,
    state: `ratchet:${tripped ? 'trip' : 'pass'}(code ${signed(code)}pp vs -${tolerance}pp)`,
    message: tripped
      ? `ratchet trip: code-attributable regression ${signed(code)}pp is beyond the ${tolerance}pp tolerance`
      : `ratchet pass: code-attributable movement ${signed(code)}pp is within the ${tolerance}pp tolerance`,
  };
}
