import type { ScanContext, RawFact } from '../detector';
import { ghErrorKind, filePointer, basisPointer, measuredFact, unknownFact } from './common';
import { scanTestFiles } from '../testfiles';
import { isGitRepo, gitBlameLineAgeDays } from '../git';
import { readWorkflows } from '../sourcefiles';

const WHAT_IT_TAKES =
  'enumerate test files and grep skip/disable markers (it.skip, xit, @Ignore, pytest.mark.skip, t.Skip, …) with git blame for skip age — needs an enumerable tree';

const MAX_AGED_LOOKUPS = 20;

/**
 * TEST-05 — skipped/disabled tests, measured from marker greps + git blame age
 * (detector-honesty 2.2; spec test-05 §2/§4). Markers are facts → `measured`;
 * when blame is unavailable the age subscore is dropped and confidence is low.
 */
export async function detectTest05(ctx: ScanContext, signal: AbortSignal): Promise<RawFact> {
  const started = Date.now();
  const nowMs = ctx.scanMs ?? Date.now();
  try {
    if (signal.aborted) return unknownFact('TEST-05', 'test-scan', started, WHAT_IT_TAKES);
    const scan = await scanTestFiles(ctx, signal);
    if (scan.total === 0) {
      return unknownFact('TEST-05', 'test-scan', started, 'zero test files — nothing can be skipped (na_when)');
    }

    const withSkips = scan.files.filter((f) => f.skips.length > 0);
    const git = await isGitRepo(ctx.clonePath, { signal });
    const agedSkips: Array<{ file: string; age_days: number }> = [];
    let blameAvailable = git;
    if (git) {
      let lookups = 0;
      for (const f of withSkips) {
        for (const line of f.skips) {
          if (lookups >= MAX_AGED_LOOKUPS) break;
          lookups++;
          const age = await gitBlameLineAgeDays(ctx.clonePath, f.path, line, nowMs, { signal });
          if (age == null) { blameAvailable = false; continue; }
          agedSkips.push({ file: f.path, age_days: age });
        }
        if (lookups >= MAX_AGED_LOOKUPS) break;
      }
    }
    agedSkips.sort((a, b) => b.age_days - a.age_days || a.file.localeCompare(b.file));

    const { text: wfText } = await readWorkflows(ctx, signal);
    const ciExclusions = [...new Set((wfText.match(/--ignore[= ]\S+|--exclude[-=]\S+/g) ?? []).map((s) => s.trim()))].sort().slice(0, 20);

    const total = scan.testsTotal;
    const skipped = scan.skipTotal;
    const facts = {
      test05: {
        total_tests_est: total,
        skipped_total: skipped,
        skip_ratio: total ? Math.round((skipped / total) * 1000) / 1000 : 0,
        aged_skips: agedSkips.slice(0, 20),
        ci_exclusions: ciExclusions,
      },
    };
    const pointers = [
      ...withSkips.slice(0, 8).map((f) => filePointer(f.path, `${f.skips.length} skip marker(s) at line(s) ${f.skips.slice(0, 5).join(', ')}`)),
      ...(git ? [basisPointer('git', `git blame -L for ${agedSkips.length} skip marker(s)${blameAvailable ? '' : ' (blame partially unavailable)'}`)] : [basisPointer('scan', 'no git history — skip age dropped')]),
    ];
    return measuredFact({
      detectorId: 'TEST-05',
      producer: 'test-scan',
      started,
      facts: facts as unknown as Record<string, unknown>,
      pointers,
      measurement: { status: 'measured', confidence: blameAvailable ? 'medium' : 'low' },
      truncated: scan.truncated,
    });
  } catch (e) {
    return { detectorId: 'TEST-05', schemaVersion: '1.0.0', facts: {}, evidencePointers: [], provenance: { tool: 'test-scan', version: '1.0', flags: ['test-scan'], durationMs: Date.now() - started }, truncated: true, error: ghErrorKind(e) };
  }
}
