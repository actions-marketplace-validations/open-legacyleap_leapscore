import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, filePointer, basisPointer, measuredFact, unknownFact, readText } from './common';
import { walkSortedTree } from '../tree';
import { resolveRuntime, snapshotVersions, SNAPSHOT_REFRESH_HINT } from '../snapshots';

const WHAT_IT_TAKES =
  'declare a runtime version pin (.nvmrc / .python-version / .tool-versions / package.json engines / pyproject requires-python / Dockerfile FROM / CI matrix) so the EOL snapshot can resolve it';

const YELLOW_MARGIN_DAYS = 90;
const CORE_PIN = /dockerfile|workflow|ci|\.github/i;

export type RuntimePin = { product: string; version: string; pin_source: string };

function parseVersionLine(raw: string): string | null {
  const m = /([0-9]+(?:\.[0-9]+){0,2}(?:[-+][0-9A-Za-z.-]+)?)/.exec(raw);
  return m ? m[1] : null;
}

/** Best-effort runtime-pin extraction over the enumerated tree (spec ecos-01 §2). */
async function extractPins(ctx: ScanContext, signal: AbortSignal): Promise<RuntimePin[]> {
  const pins: RuntimePin[] = [];
  const add = (product: string, version: string | null, pin_source: string) => {
    if (version) pins.push({ product, version, pin_source });
  };

  const vmLines: Array<[string, string]> = [
    ['.nvmrc', 'node'], ['.node-version', 'node'],
    ['.python-version', 'python'], ['.ruby-version', 'ruby'], ['.java-version', 'java'],
  ];
  for (const [file, product] of vmLines) {
    const text = await readText(ctx, file);
    if (text) add(product, parseVersionLine(text.trim().split('\n')[0] ?? ''), file);
  }
  const toolVersions = await readText(ctx, '.tool-versions');
  if (toolVersions) {
    for (const line of toolVersions.split('\n')) {
      const m = /^([a-z0-9]+)\s+(.+)$/i.exec(line.trim());
      if (!m) continue;
      add(m[1].toLowerCase(), parseVersionLine(m[2]), '.tool-versions');
    }
  }
  const runtimeTxt = await readText(ctx, 'runtime.txt');
  if (runtimeTxt) add('python', parseVersionLine(runtimeTxt.trim()), 'runtime.txt');

  const pkgRaw = await readText(ctx, 'package.json');
  if (pkgRaw) {
    try {
      const j = JSON.parse(pkgRaw) as { engines?: Record<string, string> };
      const node = j.engines?.node;
      if (node) add('node', parseVersionLine(node), 'package.json#engines');
    } catch { /* ignore */ }
  }
  const pyproject = await readText(ctx, 'pyproject.toml');
  if (pyproject) {
    const m = /requires-python\s*=\s*["']([^"']+)["']/.exec(pyproject);
    if (m) add('python', parseVersionLine(m[1]), 'pyproject.toml');
  }
  const goMod = await readText(ctx, 'go.mod');
  if (goMod) {
    const m = /^go\s+([0-9]+\.[0-9]+(?:\.[0-9]+)?)/m.exec(goMod);
    if (m) add('go', m[1], 'go.mod');
  }
  const gemfile = await readText(ctx, 'Gemfile');
  if (gemfile) {
    const m = /^\s*ruby\s+["']([0-9][^"']*)["']/m.exec(gemfile);
    if (m) add('ruby', parseVersionLine(m[1]), 'Gemfile');
  }
  const pom = await readText(ctx, 'pom.xml');
  if (pom) {
    const m = /<java\.version>\s*([^<\s]+)\s*<\/java\.version>/.exec(pom) ?? /<maven\.compiler\.(?:source|target)>\s*([^<\s]+)\s*<\//.exec(pom);
    if (m) add('java', parseVersionLine(m[1]), 'pom.xml');
  }

  // Container base images (core deploy path).
  try {
    const walk = await walkSortedTree(ctx.clonePath);
    const dockerfiles = walk.paths.filter((p) => !p.endsWith('/') && /(^|\/)Dockerfile(\.[\w.-]+)?$/.test(p)).sort().slice(0, 5);
    for (const df of dockerfiles) {
      const text = await readText(ctx, df);
      if (!text) continue;
      for (const line of text.split('\n')) {
        const m = /^\s*FROM\s+([^\s:]+)(?::([^\s]+))?/i.exec(line);
        if (!m) continue;
        const image = m[1].toLowerCase();
        const tag = m[2];
        const product = image.includes('node') ? 'node' : image.includes('python') ? 'python' : image.includes('ruby') ? 'ruby' : image.includes('openjdk') || image.includes('jdk') || image.includes('java') ? 'java' : image.includes('golang') || image.includes('go') ? 'go' : null;
        if (product) add(product, tag ? parseVersionLine(tag) : null, `${df}:FROM`);
      }
    }
  } catch { /* tree unavailable */ }
  void signal;
  return pins;
}

/**
 * ECOS-01 — runtime/language EOL, resolved from the vendored offline snapshot
 * (detector-honesty 2.x/3.x; spec ecos-01). No socket: `endoflife.date` data is
 * vendored; a pin the snapshot cannot resolve is disclosed, never scored as
 * "in support" (spec §7).
 */
export async function detectEcos01(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const started = Date.now();
  const nowMs = ctx.scanMs ?? Date.now();
  try {
    if (signal.aborted) return unknownFact('ECOS-01', 'eol-snapshot', started, WHAT_IT_TAKES);
    const pins = await extractPins(ctx, signal);
    if (pins.length === 0) {
      return unknownFact('ECOS-01', 'eol-snapshot', started, `${WHAT_IT_TAKES}; no runtime pin was found in the tree`);
    }

    const byProduct = new Map<string, RuntimePin>();
    let conflict = false;
    for (const pin of [...pins].sort((a, b) => a.pin_source.localeCompare(b.pin_source))) {
      const existing = byProduct.get(pin.product);
      if (!existing) { byProduct.set(pin.product, pin); continue; }
      if (existing.version !== pin.version) {
        conflict = true;
        if (parseFloat(pin.version) < parseFloat(existing.version)) byProduct.set(pin.product, pin); // most conservative (lowest) wins
      }
    }

    const runtimes: Array<Record<string, unknown>> = [];
    const unmapped: string[] = [];
    const pointers = [];
    for (const pin of [...byProduct.values()].sort((a, b) => a.product.localeCompare(b.product))) {
      const res = resolveRuntime(pin.product, pin.version, nowMs);
      if (!res) { unmapped.push(`${pin.product}@${pin.version}`); continue; }
      runtimes.push({
        product: res.product,
        version: pin.version,
        cycle: res.cycle,
        pin_source: pin.pin_source,
        eol_date: res.eol_date,
        days_until_eol: res.days_until_eol,
        is_past_eol: res.is_past_eol,
      });
      pointers.push(filePointer(pin.pin_source.split(':')[0], `${res.product} ${pin.version} → cycle ${res.cycle}, EOL ${res.eol_date ?? 'unknown'} (${res.days_until_eol}d)`));
    }
    pointers.push(basisPointer('eol-snapshot', `vendored eol dataset ${snapshotVersions()['eol-snapshot']}`));

    const lookupOk = runtimes.length > 0 && unmapped.length === 0;
    const facts = { ecos01: { runtimes, conflict, unmapped_pins: unmapped, lookup_ok: lookupOk } };

    if (runtimes.length === 0) {
      return unknownFact('ECOS-01', 'eol-snapshot', started,
        `no pinned runtime resolved from the snapshot (unmapped: ${unmapped.join(', ')}) — ${SNAPSHOT_REFRESH_HINT}`,
        { pointers, facts: facts as unknown as Record<string, unknown> });
    }
    const measurement = lookupOk ? { status: 'measured' as const, confidence: conflict ? 'low' as const : 'medium' as const } : { status: 'estimated' as const, confidence: 'low' as const, scopeLimited: true };
    return measuredFact({
      detectorId: 'ECOS-01',
      producer: 'eol-snapshot',
      started,
      facts: facts as unknown as Record<string, unknown>,
      pointers,
      measurement,
      truncated: !lookupOk,
    });
  } catch (e) {
    return { detectorId: 'ECOS-01', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'eol-snapshot', version: '1.0', flags: ['eol-snapshot'], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
