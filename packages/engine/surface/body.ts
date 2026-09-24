/** packages/engine/surface/body.ts — ticket body render + human-zone split (plan 15 §7–§8) */
import { buildToken } from './identity';
import type { EnvelopeRow } from './rows';

export const HUMAN_MARKER = '<!-- leapscore:human -->';

export type Band = 'Red' | 'Yellow' | 'Green';

/** Score 0–1 → Red, 2 → Yellow, 3 → Green (per-row band on the 0–3 rubric scale). */
export function bandOf(score: number): Band {
  if (score <= 1) return 'Red';
  if (score === 2) return 'Yellow';
  return 'Green';
}

/** Split a body at the human marker; the human zone survives regeneration byte-for-byte. */
export function splitHumanZone(body: string): { generated: string; human: string } {
  const i = body.indexOf(HUMAN_MARKER);
  if (i < 0) return { generated: body, human: '' };
  return {
    generated: body.slice(0, i).replace(/\s+$/, ''),
    human: body.slice(i + HUMAN_MARKER.length).replace(/^\r?\n/, ''),
  };
}

const STATUS_RE = /^Status:\s*(Red|Yellow|Green)\s*\(score\s*(\d)\/3/m;

export type PreviousStatus = { band: Band; score: number };

/** Re-parse the machine-readable status line from a previously generated body. */
export function parsePreviousStatus(generated: string): PreviousStatus | null {
  const m = STATUS_RE.exec(generated);
  if (!m) return null;
  const score = Number(m[2]);
  if (!Number.isInteger(score) || score < 0 || score > 3) return null;
  return { band: m[1] as Band, score };
}

function evidenceSnippet(row: EnvelopeRow, cap = 500): string {
  const parts: string[] = [];
  if (row.reason) parts.push(row.reason.slice(0, 300));
  const ev = row.evidence;
  if (ev?.tool) parts.push(`tool: ${ev.tool}`);
  const pointers = ev?.pointers;
  if (Array.isArray(pointers) && pointers.length) {
    const flat = pointers
      .slice(0, 6)
      .map((p) => Object.entries(p).map(([k, v]) => `${k}=${v}`).join(' '))
      .join('; ');
    if (flat) parts.push(`pointers: ${flat}`);
  }
  const joined = parts.join(' — ');
  return joined.length > cap ? joined.slice(0, cap - 1) + '…' : joined;
}

export type BodyContext = {
  target: string;
  row: EnvelopeRow;
  repoSha: string;
  engineRef: string;
  runUrl?: string;
};

/** Regenerate the machine section: token + status + evidence + remediation + links. */
export function renderGeneratedBody(ctx: BodyContext): string {
  const { target, row, repoSha, engineRef, runUrl } = ctx;
  const score = row.score ?? 0;
  const lines = [
    buildToken(target, row.id),
    '',
    `Status: ${bandOf(score)} (score ${score}/3, ${row.status})`,
    '',
    '## Evidence',
    '',
    evidenceSnippet(row) || '(no evidence pointers recorded)',
    '',
    '## Remediation',
    '',
    row.remediation?.quick_win ? `Quick win: ${row.remediation.quick_win}` : '',
    row.remediation?.structural ? `Structural: ${row.remediation.structural}` : '',
    row.effort || row.remediation?.effort ? `Effort: ${row.effort || row.remediation?.effort}` : '',
    '',
    '## Provenance',
    '',
    `Scan: ${repoSha} · engine ${engineRef}`,
    `Run: ${runUrl ?? 'n/a (local)'}`,
    `Row: ${row.id} (canonical numbers live in the sealed report — this ticket is a derived view)`,
  ];
  return lines.filter((l, i) => l !== '' || lines[i - 1] !== '').join('\n');
}

/** Full body = regenerated section + marker + preserved human zone. */
export function renderBody(ctx: BodyContext, existingHuman = ''): string {
  const generated = renderGeneratedBody(ctx);
  return `${generated}\n${HUMAN_MARKER}\n${existingHuman ? existingHuman : ''}`.replace(/\n$/, '\n');
}
