/** packages/engine/surface/identity.ts — machine token grammar + cosmetic titles (plan 15 §7) */

export const TOKEN_VERSION = 'v1';

/** Build the sole identity source: `<!-- leapscore:v1 target=owner/repo indicator=SEC-01 -->`. */
export function buildToken(target: string, indicator: string): string {
  return `<!-- leapscore:${TOKEN_VERSION} target=${target} indicator=${indicator} -->`;
}

const TOKEN_RE = /<!--\s*leapscore:(v\d+)\s+target=([^\s]+)\s+indicator=([^\s]+)\s*-->/;

export type ParsedToken = { version: string; target: string; indicator: string };

/** Parse the first machine token in a body; null when absent or malformed. Titles never count. */
export function parseToken(body: string | null | undefined): ParsedToken | null {
  if (!body) return null;
  const m = TOKEN_RE.exec(body);
  if (!m) return null;
  return { version: m[1], target: m[2], indicator: m[3] };
}

/** Cosmetic title — renames must still resolve via the token, never the title. */
export function renderTitle(target: string, id: string, name: string): string {
  return `[LeapScore] ${target} ${id}: ${name}`;
}
