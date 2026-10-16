/**
 * apps/surface/src/sync.ts — envelope-in / tracker-synced-out (plan 15 §11).
 * Guardrail → discovery → plan → sequential throttled execute → summary.
 * Surfacing never throws for write failures: shortfalls are recorded (warn-only).
 */
import { selectSurfaceRows } from './rows';
import type { EnvelopeRow } from './rows';
import { buildDiscoveryMap } from './discover';
import { planLifecycle } from './lifecycle';
import type { PlannedAction } from './lifecycle';
import { checkSurfaceAllowed } from './guardrail';
import { formatSummaryLine, formatStepSummary, zeroCounts } from './summary';
import type { SurfaceCounts } from './summary';
import { throttledWrite } from './rest';
import type { SurfaceRestClient } from './rest';

export type SurfaceRunner = { owner: string; repo: string; private: boolean };
export type SurfaceTarget = { normalized: string; slug: string; private: boolean };

export type SurfaceEnvelope = {
  full_table: unknown;
  gates: unknown;
};

export type SurfaceMeta = {
  repoSha: string;
  engineSha7: string;
};

export type SurfaceResult = {
  counts: SurfaceCounts;
  warnings: string[];
  skippedReason?: string;
  firstScan: boolean;
  summaryLine: string;
  stepSummary: string;
};

/** Union of source_rows across fired gates (status 'fired'; tolerates legacy fired flag). */
export function gateRowIds(gates: unknown): Set<string> {
  const ids = new Set<string>();
  if (!Array.isArray(gates)) return ids;
  for (const g of gates as Array<{ status?: string; fired?: boolean; source_rows?: unknown }>) {
    if (g.status !== 'fired' && g.fired !== true) continue;
    if (Array.isArray(g.source_rows)) for (const id of g.source_rows) if (typeof id === 'string') ids.add(id);
  }
  return ids;
}

export type RunSurfaceInput = {
  report: SurfaceEnvelope;
  meta: SurfaceMeta;
  runner: SurfaceRunner;
  target: SurfaceTarget;
  client: SurfaceRestClient;
  runUrl?: string;
  sleep?: (ms: number) => Promise<void>;
};

export async function runSurface(input: RunSurfaceInput): Promise<SurfaceResult> {
  const { report, meta, runner, target, client, runUrl, sleep } = input;
  const counts = zeroCounts();
  const warnings: string[] = [];
  const fail = (msg: string) => {
    counts.skipped += 1;
    warnings.push(msg);
  };

  const guard = checkSurfaceAllowed({
    isSelf: `${runner.owner}/${runner.repo}`.toLowerCase() === target.normalized.toLowerCase(),
    runnerPrivate: runner.private,
    targetPrivate: target.private,
  });
  if (!guard.allowed) {
    return finish(counts, warnings, guard.reason, false);
  }

  const { map, warnings: dupWarnings } = await buildDiscoveryMap(client, runner.owner, runner.repo, target.slug, target.normalized);
  warnings.push(...dupWarnings);
  const firstScan = map.size === 0;

  const rows = selectSurfaceRows(report.full_table);
  const allRows = (Array.isArray(report.full_table) ? report.full_table : []) as EnvelopeRow[];
  const ctx = {
    target: target.normalized,
    slug: target.slug,
    gateRowIds: gateRowIds(report.gates),
    repoSha: meta.repoSha,
    engineRef: meta.engineSha7,
    runUrl,
  };
  const actions = planLifecycle(ctx, rows, map, allRows);

  const labelUnion = new Set<string>();
  for (const a of actions) {
    if (a.kind === 'open') for (const l of a.labels) labelUnion.add(l);
    else for (const l of a.labels) labelUnion.add(l);
  }
  for (const label of labelUnion) {
    const r = await throttledWrite(() => client.ensureLabel(runner.owner, runner.repo, label), { sleep });
    if (!r.ok) warnings.push(`label ensure failed for ${label}: ${r.error}`);
  }

  for (const action of actions) {
    await executeAction(client, runner, action, counts, fail, sleep);
  }
  return finish(counts, warnings, undefined, firstScan);
}

function finish(counts: SurfaceCounts, warnings: string[], skippedReason: string | undefined, firstScan: boolean): SurfaceResult {
  const summaryLine = formatSummaryLine(counts);
  const stepSummary = formatStepSummary({ counts, firstScan, warnings, skippedReason });
  return { counts, warnings, skippedReason, firstScan, summaryLine, stepSummary };
}

async function executeAction(
  client: SurfaceRestClient,
  runner: SurfaceRunner,
  action: PlannedAction,
  counts: SurfaceCounts,
  fail: (msg: string) => void,
  sleep?: (ms: number) => Promise<void>,
): Promise<void> {
  if (action.kind === 'open') {
    const r = await throttledWrite(
      () => client.createIssue(runner.owner, runner.repo, { title: action.title, body: action.body, labels: action.labels }),
      { sleep },
    );
    if (r.ok) counts.opened += 1;
    else fail(`open ${action.row.id} failed: ${r.error}`);
    return;
  }
  const id = action.row?.id ?? 'unknown-row';
  const syncBody = async (): Promise<boolean> => {
    if (!action.body && action.labels.length === 0) return true;
    const r = await throttledWrite(
      () => client.updateIssue(runner.owner, runner.repo, action.number, { body: action.body || undefined, labels: action.labels.length ? action.labels : undefined }),
      { sleep },
    );
    if (!r.ok) fail(`sync #${action.number} (${id}) failed: ${r.error}`);
    return r.ok;
  };
  const postComment = async (): Promise<boolean> => {
    if (!action.comment) return true;
    const r = await throttledWrite(() => client.createComment(runner.owner, runner.repo, action.number, action.comment!), { sleep });
    if (!r.ok) fail(`comment #${action.number} (${id}) failed: ${r.error}`);
    return r.ok;
  };
  if (action.kind === 'refresh') {
    await syncBody();
    return;
  }
  if (action.kind === 'note') {
    if (await postComment()) counts.commented += 1;
    return;
  }
  if (!(await syncBody())) return;
  if (!(await postComment())) return;
  if (action.kind === 'comment') {
    counts.commented += 1;
    return;
  }
  const state = action.kind === 'reopen' ? 'open' : 'closed';
  const r = await throttledWrite(() => client.updateIssue(runner.owner, runner.repo, action.number, { state }), { sleep });
  if (r.ok) {
    if (action.kind === 'reopen') counts.commented += 1;
    else counts.closed += 1;
  } else {
    fail(`${action.kind} #${action.number} (${id}) failed: ${r.error}`);
  }
}
