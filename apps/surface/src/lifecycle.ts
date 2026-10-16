/** apps/surface/src/lifecycle.ts — lifecycle diff planner (plan 15 §6) */
import { renderTitle } from './identity';
import { bandOf, splitHumanZone, parsePreviousStatus, renderBody } from './body';
import type { PreviousStatus } from './body';
import { labelsFor } from './labels';
import type { EnvelopeRow } from './rows';
import type { DiscoveredIssue } from './discover';

export type PlanContext = {
  target: string;
  slug: string;
  gateRowIds: Set<string>;
  repoSha: string;
  engineRef: string;
  runUrl?: string;
};

export type OpenAction = {
  kind: 'open';
  row: EnvelopeRow;
  title: string;
  body: string;
  labels: string[];
};

export type ExistingAction = {
  kind: 'comment' | 'reopen' | 'close' | 'note' | 'refresh';
  number: number;
  row: EnvelopeRow | null;
  previous: PreviousStatus | null;
  transition: string | null;
  comment: string | null;
  body: string;
  labels: string[];
  state: 'open' | 'closed';
};

export type PlannedAction = OpenAction | ExistingAction;

function provenanceLine(ctx: PlanContext): string {
  return `at ${ctx.repoSha} (engine ${ctx.engineRef}).\nRun: ${ctx.runUrl ?? 'n/a (local)'}`;
}

function refreshFor(ctx: PlanContext, row: EnvelopeRow, human: string): { body: string; labels: string[] } {
  return {
    body: renderBody({ target: ctx.target, row, repoSha: ctx.repoSha, engineRef: ctx.engineRef, runUrl: ctx.runUrl }, human),
    labels: labelsFor({ row, slug: ctx.slug, inGate: ctx.gateRowIds.has(row.id) }),
  };
}

/**
 * Diff current ticketable rows against the discovery map.
 * `allRows` (full_table) resolves stale map entries: now-Green → close,
 * now-unmeasurable (unknown/N-A/gone) → note-only comment, state untouched.
 */
export function planLifecycle(
  ctx: PlanContext,
  rows: EnvelopeRow[],
  discovery: Map<string, DiscoveredIssue>,
  allRows: EnvelopeRow[],
): PlannedAction[] {
  const actions: PlannedAction[] = [];
  const byId = new Map(allRows.map((r) => [r.id, r]));
  const seen = new Set<string>();

  for (const row of rows) {
    seen.add(row.id);
    const existing = discovery.get(row.id);
    const band = bandOf(row.score ?? 0);
    if (!existing) {
      actions.push({
        kind: 'open',
        row,
        title: renderTitle(ctx.target, row.id, row.name),
        body: renderBody({ target: ctx.target, row, repoSha: ctx.repoSha, engineRef: ctx.engineRef, runUrl: ctx.runUrl }),
        labels: labelsFor({ row, slug: ctx.slug, inGate: ctx.gateRowIds.has(row.id) }),
      });
      continue;
    }
    const { generated, human } = splitHumanZone(existing.body);
    const previous = parsePreviousStatus(generated);
    const { body, labels } = refreshFor(ctx, row, human);
    const score = row.score ?? 0;
    if (previous && previous.band === band && previous.score === score) {
      if (existing.state === 'closed') {
        actions.push({
          kind: 'reopen',
          number: existing.number,
          row,
          previous,
          transition: null,
          comment: `LeapScore update — still ${band} (score ${score}/3) ${provenanceLine(ctx)}`,
          body,
          labels,
          state: existing.state,
        });
      } else {
        actions.push({ kind: 'refresh', number: existing.number, row, previous, transition: null, comment: null, body, labels, state: existing.state });
      }
      continue;
    }
    const transition = previous ? `${previous.band}→${band} (score ${previous.score}→${score})` : `${band} (score ${score}/3)`;
    const reason = row.reason ? `\nBasis: ${row.reason.slice(0, 200)}` : '';
    actions.push({
      kind: existing.state === 'closed' ? 'reopen' : 'comment',
      number: existing.number,
      row,
      previous,
      transition,
      comment: `LeapScore update — ${transition} ${provenanceLine(ctx)}${reason}`,
      body,
      labels,
      state: existing.state,
    });
  }

  for (const [indicator, issue] of discovery) {
    if (seen.has(indicator)) continue;
    const { generated, human } = splitHumanZone(issue.body);
    const previous = parsePreviousStatus(generated);
    const now = byId.get(indicator);
    const score = now?.score;
    const isGreen = now && !now.not_applicable && (now.status === 'measured' || now.status === 'estimated') && score === 3;
    if (isGreen && now) {
      const { body, labels } = refreshFor(ctx, now, human);
      const transition = previous ? `${previous.band}→Green (score ${previous.score}→3)` : `Green (score 3/3)`;
      actions.push({
        kind: 'close',
        number: issue.number,
        row: now,
        previous,
        transition,
        comment: `LeapScore update — ${transition} ${provenanceLine(ctx)}`,
        body,
        labels,
        state: issue.state,
      });
    } else {
      actions.push({
        kind: 'note',
        number: issue.number,
        row: null,
        previous,
        transition: null,
        comment: `LeapScore note — ${indicator} is no longer measurable from this scan (${now ? now.status : 'row absent'}) — leaving ticket state as-is. ${provenanceLine(ctx)}`,
        body: issue.body,
        labels: [],
        state: issue.state,
      });
    }
  }
  return actions;
}
