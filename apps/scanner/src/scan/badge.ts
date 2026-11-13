/** apps/scanner/src/scan/badge.ts — self-contained SVG badge + embed snippet
 * (spec: score-badge). Sits beside the report emitters in render.ts: same
 * principle, one more artifact, no external assets.
 *
 * The badge is a derived view of an already-sealed envelope. It reads the
 * view-model in `@leapscore/contracts` and owns markup only — no threshold, no
 * band palette, no scored quantity is computed here. */
import { bandColorFor, type BadgeViewModel } from '@leapscore/contracts';

/** Flat-pill geometry, at the 11px shields convention. */
export const BADGE_HEIGHT = 20;
export const BADGE_RADIUS = 3;
export const BADGE_BASELINE = 14;
export const BADGE_FONT_FAMILY = 'Verdana,Geneva,DejaVu Sans,sans-serif';
export const BADGE_FONT_SIZE = 11;
const PAD_X = 5;

/** Neutral chrome. The claim segment carries the band tint when a band is
 * stated; `unscored` and `not scanned` deliberately carry none. */
const LABEL_FILL = '#3d444d';
const LABEL_INK = '#ffffff';
const QUALIFIER_FILL = '#eef1f4';
const QUALIFIER_INK = '#4d525a';
const BANDLESS_CLAIM_FILL = '#4d525a';

/**
 * Per-character advance widths for the badge's font, in px. A table (rather
 * than a canvas measurement) is what makes the output byte-identical on every
 * machine: geometry is a pure function of the view-model text.
 */
const CHAR_WIDTHS: Record<string, number> = {
  ' ': 4, '!': 5, '"': 7, '#': 9, $: 7, '%': 11, '&': 9, "'": 4, '(': 5, ')': 5,
  '*': 7, '+': 9, ',': 4, '-': 5, '.': 4, '/': 5, ':': 5, ';': 5, '<': 9, '=': 9,
  '>': 9, '?': 7, '@': 11, '[': 5, '\\': 5, ']': 5, '^': 9, _: 7, '`': 5, '{': 7,
  '|': 5, '}': 7, '~': 9, '·': 5, '—': 11,
};

function charWidth(ch: string): number {
  if (ch >= '0' && ch <= '9') return 7;
  if (ch >= 'A' && ch <= 'Z') return /[MW]/.test(ch) ? 11 : /[IJ]/.test(ch) ? 5 : 9;
  if (ch >= 'a' && ch <= 'z') return /[mw]/.test(ch) ? 12 : /[il]/.test(ch) ? 4 : 7;
  return CHAR_WIDTHS[ch] ?? 7;
}

/** Deterministic text advance for the badge font. */
export function badgeTextWidth(text: string): number {
  let width = 0;
  for (const ch of text) width += charWidth(ch);
  return width;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Readable ink for a background: dark ink on the light bands (green/amber/red),
 * white on the deep critical red. Derived from the fill, never a second table. */
function inkOn(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return LABEL_INK;
  const n = parseInt(m[1], 16);
  const channel = (v: number): number => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    0.2126 * channel((n >> 16) & 0xff) + 0.7152 * channel((n >> 8) & 0xff) + 0.0722 * channel(n & 0xff);
  return luminance > 0.18 ? '#0b0d10' : '#ffffff';
}

/** Left-rounded segment path (label). */
function leftCapPath(width: number): string {
  const h = BADGE_HEIGHT;
  const r = BADGE_RADIUS;
  return `M${r},0H${width}V${h}H${r}A${r},${r} 0 0 1 0,${h - r}V${r}A${r},${r} 0 0 1 ${r},0Z`;
}

/** Right-rounded segment path (qualifier). */
function rightCapPath(x: number, width: number): string {
  const h = BADGE_HEIGHT;
  const r = BADGE_RADIUS;
  const end = x + width;
  return `M${x},0H${end - r}A${r},${r} 0 0 1 ${end},${r}V${h - r}A${r},${r} 0 0 1 ${end - r},${h}H${x}Z`;
}

/**
 * Render the badge SVG: a fixed label segment and a variable value segment,
 * split into a tinted claim and an untinted qualifier. `role="img"` plus the
 * full accessible sentence on `aria-label` (and a matching `<title>`) mean a
 * reader who cannot see the pill still gets all four facts.
 *
 * The output contains no `href`, script, stylesheet, external font, or `url(`
 * reference, and no wall-clock content: the same view-model always yields the
 * same bytes.
 */
export function renderBadgeSvg(viewModel: BadgeViewModel): string {
  const label = viewModel.label;
  const claim = viewModel.claim;
  const qualifier = viewModel.qualifier;

  const labelW = Math.round(badgeTextWidth(label) + PAD_X * 2);
  const claimW = Math.round(badgeTextWidth(claim) + PAD_X * 2);
  const qualifierW = Math.round(badgeTextWidth(qualifier) + PAD_X * 2);
  const totalW = labelW + claimW + qualifierW;

  const claimX = labelW;
  const qualifierX = labelW + claimW;

  const claimFill = viewModel.band ? bandColorFor(viewModel.band) : BANDLESS_CLAIM_FILL;
  const claimInk = viewModel.band ? inkOn(claimFill) : LABEL_INK;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${BADGE_HEIGHT}" viewBox="0 0 ${totalW} ${BADGE_HEIGHT}" role="img" aria-label="${esc(viewModel.accessibleName)}">
<title>${esc(viewModel.accessibleName)}</title>
<path d="${leftCapPath(labelW)}" fill="${LABEL_FILL}"/>
<path d="M${claimX},0H${claimX + claimW}V${BADGE_HEIGHT}H${claimX}Z" fill="${claimFill}"/>
<path d="${rightCapPath(qualifierX, qualifierW)}" fill="${QUALIFIER_FILL}"/>
<g font-family="${BADGE_FONT_FAMILY}" font-size="${BADGE_FONT_SIZE}" text-anchor="middle">
<text x="${labelW / 2}" y="${BADGE_BASELINE}" fill="${LABEL_INK}">${esc(label)}</text>
<text x="${claimX + claimW / 2}" y="${BADGE_BASELINE}" fill="${claimInk}">${esc(claim)}</text>
<text x="${qualifierX + qualifierW / 2}" y="${BADGE_BASELINE}" fill="${QUALIFIER_INK}">${esc(qualifier)}</text>
</g>
</svg>
`;
}

/** The two copy-paste forms of the embed. */
export interface BadgeSnippet {
  /** `[![alt](svg)](permalink)` — one line. */
  markdown: string;
  /** `<a href="permalink"><img src="svg" alt="alt"></a>`. */
  html: string;
}

function escapeAttr(s: string): string {
  return esc(s);
}

/**
 * Render the embed snippet. An SVG referenced by `<img>` cannot link anywhere
 * and does not surface its `<title>`, so the host page supplies the link and
 * the full sentence becomes the image's alternative text (D9).
 *
 * Linking to the sealed report is an explicit capability, not a default: only
 * an emitting deployment that actually hosts sealed reports may set
 * `linkReport`. The CLI's deployment is stateless and emits the unlinked form,
 * so a snippet can never promise a permalink that does not resolve. The link is
 * a citation to the sealed report — deliberately no assessment campaign
 * parameters.
 */
export function renderBadgeSnippet(
  viewModel: BadgeViewModel,
  opts: { svgPath: string; linkReport?: boolean },
): BadgeSnippet {
  const alt = viewModel.accessibleName;
  const mdAlt = alt.replace(/[[\]]/g, (ch) => `\\${ch}`);
  if (opts.linkReport !== true) {
    return {
      markdown: `![${mdAlt}](${opts.svgPath})`,
      html: `<img src="${escapeAttr(opts.svgPath)}" alt="${escapeAttr(alt)}">`,
    };
  }
  const markdown = `[![${mdAlt}](${opts.svgPath})](${viewModel.permalink})`;
  const html = `<a href="${escapeAttr(viewModel.permalink)}"><img src="${escapeAttr(opts.svgPath)}" alt="${escapeAttr(alt)}"></a>`;
  return { markdown, html };
}
