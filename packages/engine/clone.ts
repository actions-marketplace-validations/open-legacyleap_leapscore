/** engine/clone.ts — shallow clone helper with readFile proxy and byteCap */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile as fsReadFile } from 'node:fs/promises';
import { join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const execFileAsync = promisify(execFile);

export type CloneHandle = {
  clonePath: string;
  commitSha: string;
  cleanup: () => void;
  readFile: (path: string) => Promise<Buffer | null>;
};

export async function shallowClone(repoUrl: string, opts: { signal?: AbortSignal; byteCap?: number } = {}): Promise<CloneHandle> {
  const tmp = mkdtempSync(join(tmpdir(), 'leapscore-clone-'));
  const byteCap = opts.byteCap ?? 4 * 1024 * 1024;
  let bytesRead = 0;

  // --filter=blob:none keeps the clone lazy; no checkout needed for readFile proxy, but we do a shallow fetch
  try {
    await execFileAsync('git', ['clone', '--filter=blob:none', '--depth', '1', repoUrl, tmp], { signal: opts.signal });
  } catch (e) {
    // If git not available or clone fails, still return handle with empty path (detectors will emit unknown)
    // For tests, we mock execFile
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      // no git binary in test env — return empty handle
    } else {
      rmSync(tmp, { recursive: true, force: true });
      throw e;
    }
  }

  let commitSha = 'unknown';
  try {
    const { stdout } = await execFileAsync('git', ['-C', tmp, 'rev-parse', 'HEAD'], { signal: opts.signal });
    commitSha = stdout.trim();
  } catch { /* ignore */ }

  const readFile = async (p: string): Promise<Buffer | null> => {
    if (opts.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    // Prevent path traversal
    const full = join(tmp, p.replace(/^\//, ''));
    if (!full.startsWith(tmp)) return null;
    try {
      const buf = await fsReadFile(full);
      bytesRead += buf.length;
      if (bytesRead > byteCap) throw new DOMException('byteCap exceeded', 'QuotaExceededError');
      return buf;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw e;
    }
  };

  return {
    clonePath: tmp,
    commitSha,
    cleanup: () => rmSync(tmp, { recursive: true, force: true }),
    readFile,
  };
}
