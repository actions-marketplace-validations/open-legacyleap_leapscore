/** report-identity 6.1 / 6.2 — the CLI identity line above the verdict, in both
 * emitters, using the shared contract formatting. */
import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { identityStatusLabel, identityValueLabel, type ReportIdentity } from '@leapscore/contracts';
import { identitySummaryLine, renderHtml, renderMarkdown, type RenderInput } from '../render';
import { main } from '../../../bin/scan';

const identity: ReportIdentity = {
  subject: { repo: 'django/django', commit: 'abc1234567890', scanned_at: '2026-08-12T00:00:00.000Z' },
  shape: { status: 'measured', archetype: 'service', confidence: 'high' },
  size: {
    status: 'measured',
    files: 1247,
    directories: 210,
    lines: { status: 'estimated', value: 420000, method: 'stride-sample', scope: 'source-v1', covered: { files_read: 40, files_in_scope: 1247 } },
  },
  stack: {
    status: 'measured',
    languages: [
      { name: 'Python', share: 0.72, files: 898 },
      { name: 'JavaScript', share: 0.18, files: 224 },
    ],
    primary_language: 'Python',
    ecosystems: ['js', 'py'],
    frameworks: ['Django', 'React'],
    legacy_stacks: [{ id: 'vb6', detected: false, files: 0 }],
  },
};

const base: RenderInput = {
  score: 58,
  tier: 'Moderate',
  repo: 'django/django',
  repoSha: 'abc1234567890',
  runId: 'django__django__abc1234__2026-08-12T000000-000Z',
  scannedAt: '2026-08-12T00:00:00.000Z',
  status: 'complete',
  coverage: { measured: 49, estimated: 19, unknown: 8 },
  gates: [],
  topBlockers: [],
  categories: [],
};

describe('6.1 the CLI identity line is composed from the contract helpers', () => {
  it('prints the same value string the contract formatting produces', () => {
    const line = identitySummaryLine(identity);
    expect(line).toContain(identityValueLabel(identity.size.lines!));
    expect(line).toContain('~420k');
    expect(line).not.toContain('420000');
    // Status vocabulary is the emitted one, never re-derived.
    expect(identityStatusLabel(identity.size.lines!)).toBe('estimated');
    expect(line).toContain('commit abc1234');
    expect(line).toContain('source-v1');
    expect(line).toContain('Python');
  });

  it('states an unknown magnitude as not measured with its reason', () => {
    const unknown: ReportIdentity = {
      ...identity,
      size: {
        ...identity.size,
        lines: { status: 'unknown', reason: 'empty scope: no file matches the source-v1 inclusion rule', scope: 'source-v1' },
      },
    };
    const line = identitySummaryLine(unknown);
    expect(line).toContain(identityValueLabel(unknown.size.lines!));
    expect(line).toMatch(/not measured — empty scope/);
  });

  it('places the line above the verdict in both emitters', () => {
    const html = renderHtml({ ...base, identity });
    const md = renderMarkdown({ ...base, identity });
    expect(html.indexOf(identitySummaryLine(identity))).toBeGreaterThanOrEqual(0);
    expect(html.indexOf(identitySummaryLine(identity))).toBeLessThan(html.indexOf('<h1>'));
    expect(md.indexOf(identitySummaryLine(identity))).toBeGreaterThanOrEqual(0);
    expect(md.indexOf(identitySummaryLine(identity))).toBeLessThan(md.indexOf('# LeapScore'));
  });

  it('renders no line at all when the block is absent', () => {
    const html = renderHtml(base);
    const md = renderMarkdown(base);
    expect(html).not.toContain('source-v1');
    expect(md).not.toContain('source-v1');
    expect(html).not.toMatch(/class="identity"/);
  });
});

describe('6.2 both CLI artifacts carry the identity line from the sealed report', () => {
  it('report.md and report.html print the sealed block after a real local scan', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'leapscore-identity-cli-'));
    const out = mkdtempSync(join(tmpdir(), 'leapscore-identity-cli-out-'));
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'fx', version: '1.0.0', dependencies: { lodash: '4.17.20' } }));
    writeFileSync(join(dir, 'package-lock.json'), JSON.stringify({ name: 'fx', lockfileVersion: 3, packages: {} }));
    writeFileSync(join(dir, 'src/index.ts'), 'export const one = 1;\n'.repeat(30));
    writeFileSync(join(dir, 'src/util.ts'), 'export const two = 2;\n'.repeat(20));
    try {
      const code = await main(['scan', dir, '--out', out, '--strict'], {
        env: {},
        stdout: () => {},
        stderr: () => {},
      });
      expect(code).toBe(0);

      const envelope = JSON.parse(readFileSync(join(out, 'report.json'), 'utf8')) as {
        report: { identity?: ReportIdentity };
      };
      expect(envelope.report.identity).toBeDefined();
      const sealed = envelope.report.identity!;
      const expected = identitySummaryLine(sealed);

      const md = readFileSync(join(out, 'report.md'), 'utf8');
      const html = readFileSync(join(out, 'report.html'), 'utf8');
      expect(md).toContain(expected);
      expect(html).toContain(expected);
      expect(md).toContain(identityValueLabel(sealed.size.lines!));
      expect(md.indexOf(expected)).toBeLessThan(md.indexOf('# LeapScore'));
      expect(html.indexOf(expected)).toBeLessThan(html.indexOf('<h1>'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(out, { recursive: true, force: true });
    }
  }, 120_000);
});
