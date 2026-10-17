/** apps/scanner/src/scan/secrets.ts — built-in documented secret rule set (SEC-02, G1).
 *
 * detector-honesty 4.1: the offline release ships no `gitleaks`/`trufflehog`, so
 * SEC-02 runs a built-in, documented rule pack over the tree always and over git
 * history where history is available. Absence of the external scanners is
 * disclosed (`wider_scanners_run: []`), and history that was not scanned is
 * stated explicitly (`history_scanned_full: false`) — never presented as clean.
 */
import { walkSortedTree } from './tree';
import { gitLogPatch } from './git';
import type { ScanContext } from './detector';

export type SecretRule = { id: string; description: string; re: RegExp };

/** The documented rule set (id + human description + pattern). */
export const SECRET_RULES: SecretRule[] = [
  { id: 'aws-access-token', description: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: 'github-pat', description: 'GitHub personal access token', re: /\bghp_[0-9A-Za-z]{36}\b|\bgithub_pat_[0-9A-Za-z_]{60,}\b/ },
  { id: 'google-api-key', description: 'Google API key', re: /\bAIza[0-9A-Za-z\-_]{35}\b/ },
  { id: 'slack-token', description: 'Slack token', re: /\bxox[baprs]-[0-9A-Za-z-]{10,72}\b/ },
  { id: 'stripe-secret-key', description: 'Stripe live secret key', re: /\bsk_live_[0-9A-Za-z]{24,}\b/ },
  { id: 'private-key', description: 'PEM private key block', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
  { id: 'jwt', description: 'JSON Web Token', re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { id: 'basic-auth-url', description: 'Credentials embedded in a URL', re: /\b[a-z][a-z0-9+.-]*:\/\/[^/\s:@'"]+:[^/\s:@'"]+@[A-Za-z0-9.-]+/i },
  { id: 'generic-secret-assignment', description: 'Assigned secret/password/token literal', re: /(?:\bpassword|\bpasswd|\bsecret|\bapi[_-]?key|\baccess[_-]?token|\bauth[_-]?token)\b\s*[:=]\s*['"][^'"\s]{8,}['"]/i },
];

/** Values that look like a secret but are placeholders/env refs — never a finding. */
const PLACEHOLDER = /\$\{|\$\(|process\.env|os\.environ|getenv|xxxx|changeme|example|placeholder|your[_-]?|dummy|redacted|<[^>]+>|\.\.\.|test[_-]?secret/i;

export type SecretFinding = { rule: string; file: string; line: number; verified: false };
export type SecretScan = {
  tree_findings: SecretFinding[];
  history_only_findings: Array<{ rule: string; file: string; commit: string }>;
  verified_live: number;
  history_scanned_full: boolean;
  history_scanned: boolean;
  rules_applied: string[];
  wider_scanners_run: string[];
  wider_scanners_declared: string[];
  files_scanned: number;
  truncated: boolean;
};

const MAX_FILES = 600;
const MAX_BYTES_PER_FILE = 256 * 1024;

function lineMatches(line: string): string[] {
  const ids: string[] = [];
  for (const rule of SECRET_RULES) {
    if (PLACEHOLDER.test(line)) {
      // placeholders still allowed to trip high-signal structured tokens (keys, PEM, JWT)
      if (!['aws-access-token', 'github-pat', 'google-api-key', 'slack-token', 'stripe-secret-key', 'private-key', 'jwt'].includes(rule.id)) continue;
    }
    if (rule.re.test(line)) ids.push(rule.id);
  }
  return ids;
}

async function readText(ctx: ScanContext, path: string): Promise<string | null> {
  try {
    const buf = await ctx.readFile(path);
    if (!buf) return null;
    return buf.subarray(0, MAX_BYTES_PER_FILE).toString('utf8');
  } catch {
    return null;
  }
}

/** Scan the tree (+ bounded git history where available) with the built-in rule set. */
export async function scanSecrets(ctx: ScanContext, signal?: AbortSignal): Promise<SecretScan> {
  const rulesApplied = SECRET_RULES.map((r) => r.id);
  let paths: string[] = [];
  try {
    const walk = await walkSortedTree(ctx.clonePath);
    paths = walk.paths.filter((p) => !p.endsWith('/'));
  } catch {
    paths = [];
  }
  // Skip obviously-binary / lockfile paths so the rule pack stays bounded & noise-free.
  const candidates = paths
    .filter((p) => !/\.(png|jpe?g|gif|webp|svg|ico|pdf|zip|gz|tgz|jar|war|woff2?|ttf|eot|mp[34]|mov|so|dylib|dll|exe|bin|class|o|a)$/i.test(p))
    .filter((p) => !/(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Cargo\.lock|Gemfile\.lock|poetry\.lock|composer\.lock|go\.sum)$/.test(p))
    .sort();

  const treeFindings: SecretFinding[] = [];
  const widerDeclared = new Set<string>();
  let filesScanned = 0;
  let truncated = false;
  for (const path of candidates) {
    if (signal?.aborted) { truncated = true; break; }
    if (filesScanned >= MAX_FILES) { truncated = true; break; }
    const text = await readText(ctx, path);
    if (text == null) continue;
    filesScanned++;
    if (/\bgitleaks\b/.test(text)) widerDeclared.add('gitleaks');
    if (/\btrufflehog\b/.test(text)) widerDeclared.add('trufflehog');
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const rule of lineMatches(lines[i])) treeFindings.push({ rule, file: path, line: i + 1, verified: false });
    }
  }
  treeFindings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule));

  // History scan: bounded `git log -p` over added lines when the target is a git repo.
  const patch = await gitLogPatch(ctx.clonePath, { maxCommits: 200, signal });
  const historyScanned = patch != null;
  const historyScannedFull = patch != null && !patch.truncated;
  const historyOnly: Array<{ rule: string; file: string; commit: string }> = [];
  if (patch) {
    const treeKey = new Set(treeFindings.map((f) => `${f.file}:${f.rule}`));
    let commit = 'unknown';
    let file = '';
    for (const raw of patch.patch.split('\n')) {
      if (raw.startsWith('\u0001')) { commit = raw.slice(1); continue; }
      if (raw.startsWith('+++ ')) { file = raw.slice(4).replace(/^b\//, '').split('\t')[0]; continue; }
      if (!raw.startsWith('+') || raw.startsWith('+++')) continue;
      const content = raw.slice(1);
      for (const rule of lineMatches(content)) {
        if (treeKey.has(`${file}:${rule}`)) continue;
        if (historyOnly.length >= 200) break;
        historyOnly.push({ rule, file, commit });
      }
    }
    historyOnly.sort((a, b) => a.rule.localeCompare(b.rule) || a.file.localeCompare(b.file) || a.commit.localeCompare(b.commit));
  }

  return {
    tree_findings: treeFindings.slice(0, 500),
    history_only_findings: historyOnly,
    verified_live: 0,
    history_scanned_full: historyScannedFull,
    history_scanned: historyScanned,
    rules_applied: rulesApplied,
    wider_scanners_run: [],
    wider_scanners_declared: [...widerDeclared].sort(),
    files_scanned: filesScanned,
    truncated,
  };
}
