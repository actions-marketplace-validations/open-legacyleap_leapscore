/**
 * Canonical report store (scanner-service: Report store ownership).
 * The scanner is the only writer of envelopes. Writes are atomic
 * (tmp file + rename) so a mid-scan disconnect can never leave a
 * truncated envelope; exactly one envelope is written per runId.
 */
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  assertContractVersion,
  isValidRunId,
  type ReportEnvelope,
} from "@leapscore/contracts";

export function getStoreDir(): string {
  return process.env.SCANNER_STORE_DIR ?? path.join(process.cwd(), "scanner-reports");
}

export async function writeEnvelope(envelope: ReportEnvelope, dir = getStoreDir()): Promise<string> {
  if (!isValidRunId(envelope.meta.runId)) throw new Error(`invalid runId: ${envelope.meta.runId}`);
  assertContractVersion(envelope);
  await mkdir(dir, { recursive: true });
  const finalPath = path.join(dir, `${envelope.meta.runId}.json`);
  const resolved = path.resolve(finalPath);
  const resolvedDir = path.resolve(dir);
  if (!resolved.startsWith(resolvedDir + path.sep)) throw new Error("path traversal rejected");
  const tmpPath = path.join(dir, `.${envelope.meta.runId}.${randomUUID()}.tmp`);
  await writeFile(tmpPath, JSON.stringify(envelope, null, 2), "utf8");
  await rename(tmpPath, finalPath);
  return finalPath;
}

export async function readEnvelope(runId: string, dir = getStoreDir()): Promise<ReportEnvelope | null> {
  if (!isValidRunId(runId)) return null;
  const filePath = path.join(dir, `${runId}.json`);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(dir) + path.sep)) return null;
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as ReportEnvelope;
    if (!parsed.meta || !parsed.report) return null;
    try {
      assertContractVersion(parsed);
    } catch {
      return null;
    }
    if (!Array.isArray(parsed.trace)) parsed.trace = [];
    return parsed;
  } catch {
    return null;
  }
}
