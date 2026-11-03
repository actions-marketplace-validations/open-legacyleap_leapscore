/** apps/scanner/src/scan/render.ts — self-contained HTML + Markdown emitters (spec: report-rendering) */
import {
  assessmentUrlForBand,
  assessmentCtaForBand,
  bandPathBlock,
  gateCapStatement,
  identityValueLabel,
  METHODOLOGY_URL,
  POSITIONING_LINE,
  type NextBandPath,
  type ReportIdentity,
} from '@leapscore/contracts';

export type RenderInput = {
  score: number;
  tier: string;
  tierLegacy?: string;
  /** When true, the headline number is suppressed (insufficient signal) — emitters
   * print the verdict instead of a score. Reference scores stay in report.json. */
  suppressed?: boolean;
  /** Deterministic score fingerprint shared across all three artifact files. */
  fingerprint?: string;
  repo: string;
  repoSha: string;
  runId: string;
  scannedAt: string;
  status: string;
  coverage: { measured: number; estimated: number; unknown: number };
  gates: Array<{ id: string; name: string; status: string; note: string }>;
  topBlockers: Array<{ row: string; name: string; points_lost: number; weight_pp: string; summary: string; evidence_file?: string; rule?: string }>;
  /** Sealed next-band path (band-path): renders as one block after the top
   * risks and before the per-deduction detail; absent → no block at all. */
  nextBandPath?: NextBandPath;
  /** Target identity (report-identity): rendered as one subject line above the
   * verdict in both emitters; absent → no line at all. Every value string comes
   * from the contract helpers, so markdown and HTML cannot disagree. */
  identity?: ReportIdentity;
  /** Kill-switch cap disclosure (Gates G1–G8): when a proven gate lowered the
   * band, the report states which gates fired and what the score alone earned. */
  gateCapped?: boolean;
  uncappedTier?: string;
  cappedByGates?: string[];
  categories: Array<{ id: string; name: string; category_score: number | null; weight: number; applicable: number }>;
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** The one identity line both emitters print above the verdict. It is composed
 * from the sealed block through the contract helpers (`identityValueLabel`), so
 * the CLI's line and the site card state the same value with the same marker. */
export function identitySummaryLine(identity: ReportIdentity): string {
  const bits: string[] = [];
  if (identity.subject.repo) bits.push(identity.subject.repo);
  const commit = identity.subject.commit && identity.subject.commit !== 'unknown'
    ? identity.subject.commit.slice(0, 7)
    : 'unknown';
  bits.push(`commit ${commit}`);
  if (typeof identity.size.files === 'number') bits.push(`${identity.size.files} files`);
  if (typeof identity.size.directories === 'number') bits.push(`${identity.size.directories} dirs`);
  const lines = identity.size.lines;
  if (lines) {
    bits.push(`${identityValueLabel(lines)} lines${lines.scope ? ` (${lines.scope})` : ''}`);
  }
  const primary = identity.stack.primary_language;
  if (primary) bits.push(`primary ${primary}`);
  if (identity.stack.ecosystems.length) bits.push(identity.stack.ecosystems.join(' + '));
  if (identity.stack.frameworks.length) bits.push(identity.stack.frameworks.join(' + '));
  const legacy = (identity.stack.legacy_stacks ?? []).filter((s) => s.detected).map((s) => s.id);
  if (legacy.length) bits.push(legacy.join(' + '));
  const archetype = identity.shape.archetype;
  if (archetype && archetype !== 'unknown') bits.push(`archetype ${archetype}`);
  return bits.join(' · ');
}

// METHODOLOGY_URL comes from the contract so the CLI's link and the site's
// `/methodology` route cannot drift apart (release-funnel).

/** Path block, HTML: destination statement, per-class steps with cumulative
 * arrival, shortfall disclosure, unreached count, and the stated assumption. */
function renderPathHtml(path: NextBandPath, tier: string, score: number): string {
  const block = bandPathBlock(path, { tier, score });
  const classes = block.classes.map((c) => {
    const steps = c.steps.map((s) => `<li><strong>${esc(s.row)} ${esc(s.name)}</strong> ${esc(s.pp)} · ${esc(s.verify)}${s.quick_win ? ` — Quick win: ${esc(s.quick_win)}` : ''}</li>`).join('\n');
    return `<h3>${esc(c.tag)} ${esc(c.verify)} — ${esc(c.total)}, cumulative ${esc(c.cumulative)}: ${esc(c.arrival)}</h3>
<ul>${steps}</ul>`;
  }).join('\n');
  return `<h2>${esc(block.heading)}</h2>
<p>${esc(block.statement)}</p>
${classes ? `${classes}\n` : ''}${block.shortfall ? `<p>${esc(block.shortfall)}</p>\n` : ''}${block.unreached ? `<p>${esc(block.unreached)}</p>\n` : ''}<p>${esc(block.assumption)}</p>`;
}

/** Path block, Markdown — same model, same wording, line-oriented markup. */
function renderPathMarkdown(path: NextBandPath, tier: string, score: number): string[] {
  const block = bandPathBlock(path, { tier, score });
  const lines: string[] = [`## ${block.heading}`, ``, block.statement];
  for (const c of block.classes) {
    lines.push(``);
    lines.push(`**${c.tag} ${c.verify}** — ${c.total}, cumulative ${c.cumulative}: ${c.arrival}`);
    for (const s of c.steps) lines.push(`- **${s.row} ${s.name}** ${s.pp} · ${s.verify}${s.quick_win ? ` — Quick win: ${s.quick_win}` : ''}`);
  }
  if (block.shortfall) {
    lines.push(``);
    lines.push(block.shortfall);
  }
  if (block.unreached) {
    lines.push(``);
    lines.push(block.unreached);
  }
  lines.push(``);
  lines.push(`_${block.assumption}_`);
  return lines;
}

/** Self-contained HTML: inline CSS only, no external assets, no CDN, no scripts. */
export function renderHtml(r: RenderInput): string {
  const url = assessmentUrlForBand(r.tier);
  const cta = assessmentCtaForBand(r.tier);
  const commitShort = r.repoSha && r.repoSha !== 'unknown' ? r.repoSha.slice(0, 7) : 'unknown';
  const headline = r.suppressed
    ? `<h1><span class="score">insufficient signal</span> <span class="band">no headline</span></h1>`
    : `<h1><span class="score">${r.score}</span> <span class="band">${esc(r.tier)}</span></h1>`;
  const risks = r.topBlockers.slice(0, 5).map((b) => {
    const evidence = b.evidence_file ? ` — evidence: ${esc(b.evidence_file)}` : '';
    const rule = b.rule ? ` (rule: ${esc(b.rule)})` : '';
    return `<li><strong>${esc(b.row)} ${esc(b.name)}</strong> — ${esc(b.summary)} <em>${esc(b.weight_pp)} lost</em>${evidence}${rule}</li>`;
  }).join('\n');
  const gates = r.gates.map((g) => `<li><strong>${esc(g.id)}</strong> ${esc(g.name)} — ${esc(g.status)}: ${esc(g.note)}</li>`).join('\n');
  const capNotice =
    r.gateCapped && r.uncappedTier
      ? `<p class="gatecap"><strong>Verdict capped at ${esc(r.tier)}.</strong> ${esc(gateCapStatement(r.cappedByGates ?? [], r.uncappedTier))}</p>\n`
      : '';
  const identityLine = r.identity ? `<p class="identity">${esc(identitySummaryLine(r.identity))}</p>\n` : '';
  const cats = r.categories.map((c) => `<li>${esc(c.id)} — ${esc(c.name)}: ${c.category_score == null ? 'n/a' : `${Math.round(c.category_score)}`} (weight ${c.weight}%)</li>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LeapScore ${r.suppressed ? 'insufficient signal' : `${r.score}/${esc(r.tier)}`} — ${esc(r.repo)}</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;color:#111;line-height:1.5}
.score{font-size:2.5rem;font-weight:700}.band{display:inline-block;padding:.2rem .6rem;border-radius:999px;background:#111;color:#fff;font-weight:600}
.meta{color:#555;font-size:.9rem}.cta{border:1px solid #111;padding:1rem;border-radius:.5rem;margin:1.5rem 0}
.identity{color:#333;font-size:.95rem;font-family:ui-monospace,monospace;margin:0 0 .5rem}
h2{margin-top:2rem}ul{padding-left:1.2rem}
</style>
</head>
<body>
${identityLine}${headline}
<p class="meta">${esc(r.repo)} · commit ${esc(commitShort)} · ${esc(r.scannedAt)} · ${esc(r.runId)} · ${esc(r.status)} · coverage ${r.coverage.measured}m/${r.coverage.estimated}e/${r.coverage.unknown}u${r.fingerprint ? ` · fingerprint ${esc(r.fingerprint.slice(0, 12))}` : ''}</p>
${capNotice}<h2>Top risks</h2>
<ul>${risks || '<li>No deductions — clean scan.</li>'}</ul>
${r.nextBandPath ? `${renderPathHtml(r.nextBandPath, r.tier, r.score)}\n` : ''}<h2>Detail</h2>
<h3>Gates</h3>
<ul>${gates}</ul>
<h3>Categories</h3>
<ul>${cats}</ul>
<p class="meta">Methodology: <a href="${METHODOLOGY_URL}">${METHODOLOGY_URL}</a></p>
<div class="cta"><strong>Next step:</strong> ${esc(cta)}<br><a href="${esc(url)}">Continue to the assessment</a></div>
<p class="positioning">${esc(POSITIONING_LINE)}</p>
</body>
</html>`;
}

/** Markdown: readable in two minutes, pasteable into a PR or ticket. */
export function renderMarkdown(r: RenderInput): string {
  const url = assessmentUrlForBand(r.tier);
  const cta = assessmentCtaForBand(r.tier);
  const commitShort = r.repoSha && r.repoSha !== 'unknown' ? r.repoSha.slice(0, 7) : 'unknown';
  const lines: string[] = [];
  if (r.identity) {
    lines.push(identitySummaryLine(r.identity));
    lines.push(``);
  }
  lines.push(r.suppressed ? `# LeapScore: insufficient signal — ${r.repo}` : `# LeapScore: ${r.score}/${r.tier} — ${r.repo}`);
  lines.push(``);
  lines.push(`commit ${commitShort} · ${r.scannedAt} · \`${r.runId}\` · ${r.status} · coverage ${r.coverage.measured}m/${r.coverage.estimated}e/${r.coverage.unknown}u${r.fingerprint ? ` · fingerprint \`${r.fingerprint.slice(0, 12)}\`` : ''}`);
  lines.push(``);
  if (r.gateCapped && r.uncappedTier) {
    lines.push(`> **Verdict capped at ${r.tier}.** ${gateCapStatement(r.cappedByGates ?? [], r.uncappedTier)}`);
    lines.push(``);
  }
  lines.push(`## Top 5 risks`);
  if (!r.topBlockers.length) {
    lines.push(`- No deductions — clean scan.`);
  } else {
    for (const b of r.topBlockers.slice(0, 5)) {
      const ev = b.evidence_file ? ` — evidence: ${b.evidence_file}` : '';
      const rule = b.rule ? ` (rule: ${b.rule})` : '';
      lines.push(`- **${b.row} ${b.name}** (${b.weight_pp} lost): ${b.summary}${ev}${rule}`);
    }
  }
  if (r.nextBandPath) {
    lines.push(``);
    lines.push(...renderPathMarkdown(r.nextBandPath, r.tier, r.score));
  }
  lines.push(``);
  lines.push(`## Detail`);
  lines.push(``);
  lines.push(`### Gates`);
  for (const g of r.gates) lines.push(`- **${g.id}** ${g.name} — ${g.status}: ${g.note}`);
  lines.push(``);
  lines.push(`### Categories`);
  for (const c of r.categories) lines.push(`- ${c.id} ${c.name}: ${c.category_score == null ? 'n/a' : Math.round(c.category_score)} (weight ${c.weight}%)`);
  lines.push(``);
  lines.push(`Methodology: ${METHODOLOGY_URL}`);
  lines.push(``);
  lines.push(`> Next step: ${cta}`);
  lines.push(`>`);
  lines.push(`> ${url}`);
  lines.push(``);
  lines.push(POSITIONING_LINE);
  lines.push(``);
  return lines.join('\n');
}
