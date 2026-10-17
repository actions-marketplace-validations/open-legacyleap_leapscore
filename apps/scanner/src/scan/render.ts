/** apps/scanner/src/scan/render.ts — self-contained HTML + Markdown emitters (spec: report-rendering) */
import { assessmentUrlForBand, assessmentCtaForBand, POSITIONING_LINE } from '@leapscore/contracts';

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
  categories: Array<{ id: string; name: string; category_score: number | null; weight: number; applicable: number }>;
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const METHODOLOGY_URL = 'https://leapscore.dev/methodology';

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
h2{margin-top:2rem}ul{padding-left:1.2rem}
</style>
</head>
<body>
${headline}
<p class="meta">${esc(r.repo)} · commit ${esc(commitShort)} · ${esc(r.scannedAt)} · ${esc(r.runId)} · ${esc(r.status)} · coverage ${r.coverage.measured}m/${r.coverage.estimated}e/${r.coverage.unknown}u${r.fingerprint ? ` · fingerprint ${esc(r.fingerprint.slice(0, 12))}` : ''}</p>
<h2>Top risks</h2>
<ul>${risks || '<li>No deductions — clean scan.</li>'}</ul>
<h2>Detail</h2>
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
  lines.push(r.suppressed ? `# LeapScore: insufficient signal — ${r.repo}` : `# LeapScore: ${r.score}/${r.tier} — ${r.repo}`);
  lines.push(``);
  lines.push(`commit ${commitShort} · ${r.scannedAt} · \`${r.runId}\` · ${r.status} · coverage ${r.coverage.measured}m/${r.coverage.estimated}e/${r.coverage.unknown}u${r.fingerprint ? ` · fingerprint \`${r.fingerprint.slice(0, 12)}\`` : ''}`);
  lines.push(``);
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
